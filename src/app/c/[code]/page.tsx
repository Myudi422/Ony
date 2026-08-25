import { notFound, redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getLivePricing } from '@/lib/pricing'
import type { Metadata } from 'next'
import ClaimPage from './ClaimPage'
import ProfilePage from './ProfilePage'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ code: string }>
  searchParams: Promise<{ method?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const { data: card } = await supabaseAdmin
    .from('cards')
    .select('card_name, user_id')
    .eq('activation_code', code.trim().toUpperCase())
    .maybeSingle()

  let name = 'Profil Digital'
  if (card?.user_id) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', card.user_id)
      .maybeSingle()
    if (user?.name) name = user.name
  }

  return {
    title: `${name} — Ony`,
    description: `Profil digital ${name} via Ony NFC & QR`,
  }
}

export default async function CardPage({ params, searchParams }: Props) {
  const { code } = await params
  const { method } = await searchParams

  const cleanCode = code.trim().toUpperCase()

  // Safe query: Select cards without embedded join to prevent PostgREST relationship errors
  let { data: card } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('activation_code', cleanCode)
    .maybeSingle()

  if (!card) {
    const { data: fallbackCard } = await supabaseAdmin
      .from('cards')
      .select('*')
      .ilike('activation_code', cleanCode)
      .maybeSingle()
    card = fallbackCard
  }

  if (!card) return notFound()

  // Non-blocking telemetry (Fire-and-Forget)
  // Extracts headers without delaying the HTTP redirect response
  const headersList = await headers()
  const ua = headersList.get('user-agent') ?? 'Browser'
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const accessMethod = method === 'qr' ? 'qr_scan' : 'nfc_tap'

  // Fire-and-forget telemetry (runs in background, zero delay for user)
  void (async () => {
    try {
      const { error: rpcErr } = await supabaseAdmin.rpc('log_card_tap', {
        p_card_id: card.id,
        p_access_method: accessMethod,
        p_ip: ip,
        p_ua: ua,
        p_user_id: card.user_id || null,
      })

      if (rpcErr) {
        // Direct fallback logging
        await supabaseAdmin.from('tap_logs').insert({
          card_id: card.id,
          access_method: accessMethod,
          ip_address: ip,
          user_agent: ua,
          tapped_at: new Date().toISOString(),
          ...(card.user_id ? { user_id: card.user_id } : {}),
        })
        const currentTaps = typeof card.total_taps === 'number' ? card.total_taps : 0
        await supabaseAdmin.from('cards').update({ total_taps: currentTaps + 1 }).eq('id', card.id)
      }
    } catch (err) {
      console.error('Async tap logging background error:', err)
    }
  })()

  // Suspended / Lost
  if (card.status === 'suspended') {
    return (
      <div className="min-h-screen bg-deep-navy flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-2">Kartu Ditangguhkan</h1>
          <p className="text-slate-400">Kartu ini sementara tidak dapat diakses.</p>
        </div>
      </div>
    )
  }

  if (card.status === 'lost') {
    return (
      <div className="min-h-screen bg-deep-navy flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Kartu Dilaporkan Hilang</h1>
          <p className="text-slate-400">Kartu ini sudah dinonaktifkan oleh pemiliknya.</p>
        </div>
      </div>
    )
  }

  // Fail-safe auto check status from Cashi.id if card is marked UNPAID
  let isUnpaidCard = card.redirect_url === 'UNPAID'
  let targetRedirectUrl: string | null = null

  if (isUnpaidCard) {
    try {
      const livePricing = await getLivePricing()
      const cashiApiKey = livePricing.cashi_api_key || process.env.CASHI_API_KEY || '7576626ad46a47041a3dc4b6e133d6abb33a8dbb58ae8b706731c5fffa806dfa'

      const { data: latestTx } = await supabaseAdmin
        .from('transactions')
        .select('order_id, customer_details, created_at')
        .ilike('order_id', `%${card.activation_code}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestTx?.order_id) {
        const checkRes = await fetch(`https://cashi.id/api/check-status/${latestTx.order_id}`, {
          headers: { 'x-api-key': cashiApiKey },
          cache: 'no-store',
        })
        const checkData = await checkRes.json().catch(() => ({}))
        const statusStr = String(
          checkData?.status ||
          checkData?.data?.status ||
          checkData?.transaction_status ||
          checkData?.data?.transaction_status ||
          checkData?.payment_status ||
          checkData?.data?.payment_status ||
          ''
        ).toUpperCase()

        const isSettled = ['SETTLED', 'PAID', 'SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'SETTLE'].includes(statusStr)

        if (isSettled) {
          const metadata = latestTx.customer_details || {}
          const email = metadata?.email
          const purpose = metadata?.purpose || 'google_review'
          const targetUrl = metadata?.targetUrl || null

          let targetUserId = metadata?.userId || null
          if (!targetUserId && email) {
            const cleanEmail = String(email).trim().toLowerCase()
            const { data: existingUser } = await supabaseAdmin
              .from('users')
              .select('id')
              .eq('email', cleanEmail)
              .maybeSingle()

            if (existingUser) {
              targetUserId = existingUser.id
            } else {
              const defaultName = cleanEmail.split('@')[0]
              const { data: newUser } = await supabaseAdmin
                .from('users')
                .insert({
                  email: cleanEmail,
                  name: defaultName,
                  role: 'user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select('id')
                .single()
              if (newUser) targetUserId = newUser.id
            }
          }

          const isDirectMode = purpose === 'google_review' || purpose === 'custom_redirect'
          const cardMode = isDirectMode ? 'direct' : 'profile'
          const redirectUrl = isDirectMode ? (targetUrl || 'https://maps.google.com') : null
          const cardName = purpose === 'google_review' ? 'Google Review' : purpose === 'custom_redirect' ? 'Custom Redirect' : 'Business Card'

          await supabaseAdmin
            .from('cards')
            .update({
              payment_status: 'paid',
              status: 'active',
              mode: cardMode,
              redirect_url: redirectUrl,
              card_name: cardName,
              ...(targetUserId ? { user_id: targetUserId } : {}),
              updated_at: new Date().toISOString(),
            })
            .eq('id', card.id)

          await supabaseAdmin
            .from('transactions')
            .update({ transaction_status: 'paid', updated_at: new Date().toISOString() })
            .eq('order_id', latestTx.order_id)

          // Update local card object properties in memory
          card.payment_status = 'paid'
          card.status = 'active'
          card.mode = cardMode
          card.redirect_url = redirectUrl
          if (targetUserId) card.user_id = targetUserId

          isUnpaidCard = false

          if (isDirectMode && redirectUrl) {
            targetRedirectUrl = redirectUrl
          }
        }
      }
    } catch (_) {}
  }

  // Trigger redirect outside try/catch block if auto-check settled
  if (targetRedirectUrl) {
    redirect(targetRedirectUrl)
  }

  // Active Direct / Google Review / Custom Redirect — INSTANT REDIRECT if valid URL exists
  if (card.redirect_url && card.redirect_url !== 'UNPAID' && card.redirect_url.startsWith('http')) {
    redirect(card.redirect_url)
  }

  // Unclaimed or Unpaid — show claim page
  if (card.status === 'unclaimed' || isUnpaidCard || !card.user_id) {
    return <ClaimPage code={code.toUpperCase()} mediaType={card.media_type} paymentStatus={isUnpaidCard ? 'unpaid' : 'paid'} cardId={card.id} />
  }

  // Active — Profile Mode
  let user: { id: string; name: string; email: string; avatar_url: string } | null = null
  if (card.user_id) {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, name, email, avatar_url')
      .eq('id', card.user_id)
      .maybeSingle()
    user = userData
  }

  if (!user) {
    // Fallback if profile mode has no linked user record instead of 404
    return <ClaimPage code={code.toUpperCase()} mediaType={card.media_type} paymentStatus="paid" cardId={card.id} />
  }

  // Query links by card_id only (links table has no user_id column)
  const { data: rawLinks, error: linksError } = await supabaseAdmin
    .from('links')
    .select('*')
    .eq('card_id', card.id)
    .neq('is_active', false)
    .order('created_at', { ascending: true })

  if (linksError) {
    console.error('Links query error:', linksError.message)
  }

  const links = (rawLinks ?? []).map((l: any) => {
    const u = String(l.url ?? '').toLowerCase()
    const t = String(l.title ?? '').toLowerCase()
    let icon_type = l.icon_type || l.platform || 'website'
    if (icon_type === 'website' || icon_type === 'other') {
      if (u.includes('wa.me') || u.includes('whatsapp') || t.includes('whatsapp')) icon_type = 'whatsapp'
      else if (u.includes('instagram.com') || t.includes('instagram')) icon_type = 'instagram'
      else if (u.includes('linkedin.com') || t.includes('linkedin')) icon_type = 'linkedin'
      else if (u.includes('youtube.com') || u.includes('youtu.be')) icon_type = 'youtube'
      else if (u.includes('x.com') || u.includes('twitter.com')) icon_type = 'twitter'
      else if (u.includes('mailto:')) icon_type = 'email'
      else if (u.includes('tel:')) icon_type = 'phone'
      else if (u.includes('shopee') || u.includes('tokopedia')) icon_type = 'store'
    }
    return { ...l, icon_type }
  })

  return <ProfilePage card={card} user={user} links={links} />
}
