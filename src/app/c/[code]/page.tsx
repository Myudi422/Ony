import { notFound, redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
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
    .select('card_name, users(name)')
    .eq('activation_code', code.toUpperCase())
    .single()

  const name = (card?.users as { name?: string } | null)?.name ?? 'Profil Digital'
  return {
    title: `${name} — Ony`,
    description: `Profil digital ${name} via Ony NFC & QR`,
  }
}

export default async function CardPage({ params, searchParams }: Props) {
  const { code } = await params
  const { method } = await searchParams

  const { data: card } = await supabaseAdmin
    .from('cards')
    .select('*, users(id, name, email, avatar_url)')
    .eq('activation_code', code.toUpperCase())
    .single()

  if (!card) return notFound()

  // Log tap (fire-and-forget via fetch to avoid blocking render)
  const headersList = await headers()
  const ua = headersList.get('user-agent') ?? ''
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] ?? ''

  // Non-blocking tap log with robust fallback
  try {
    const logPayload: Record<string, unknown> = {
      card_id: card.id,
      access_method: method === 'qr' ? 'qr_scan' : 'nfc_tap',
      ip_address: ip || '127.0.0.1',
      user_agent: ua || 'Browser',
      tapped_at: new Date().toISOString(),
    }
    if (card.user_id) logPayload.user_id = card.user_id

    let { error: insertError } = await supabaseAdmin.from('tap_logs').insert(logPayload)

    // Fallback 1: Retry without user_id
    if (insertError) {
      delete logPayload.user_id
      const retry1 = await supabaseAdmin.from('tap_logs').insert(logPayload)
      insertError = retry1.error
    }

    // Fallback 2: Retry with minimal payload
    if (insertError) {
      await supabaseAdmin.from('tap_logs').insert({
        card_id: card.id,
        access_method: method === 'qr' ? 'qr_scan' : 'nfc_tap',
        tapped_at: new Date().toISOString(),
      })
    }

    // Update total_taps on card record
    const currentTaps = typeof card.total_taps === 'number' ? card.total_taps : 0
    await supabaseAdmin.from('cards').update({ total_taps: currentTaps + 1 }).eq('id', card.id)
  } catch (err) {
    console.error('Tap logging error:', err)
  }

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

  // Unclaimed — show claim page
  const isUnpaidCard = card.payment_status === 'unpaid' || card.redirect_url === 'UNPAID'
  if (card.status === 'unclaimed' || !card.user_id) {
    return <ClaimPage code={code.toUpperCase()} mediaType={card.media_type} paymentStatus={isUnpaidCard ? 'unpaid' : 'paid'} cardId={card.id} />
  }

  // Active — Direct Mode
  if (card.mode === 'direct' && card.redirect_url) {
    redirect(card.redirect_url)
  }

  // Active — Profile Mode
  const user = card.users as { id: string; name: string; email: string; avatar_url: string } | null
  if (!user) return notFound()

  // Fetch links for this card with multi-tier fail-safe strategy
  let rawLinks: Record<string, unknown>[] = []

  // 1. Try querying by user_id
  if (user?.id) {
    const q1 = await supabaseAdmin.from('links').select('*').eq('user_id', user.id).eq('is_active', true)
    if (q1.data && q1.data.length > 0) rawLinks = q1.data
  }

  // 2. Try querying by card_id if still empty
  if (rawLinks.length === 0 && card?.id) {
    const q2 = await supabaseAdmin.from('links').select('*').eq('card_id', card.id).eq('is_active', true)
    if (q2.data && q2.data.length > 0) rawLinks = q2.data
  }

  // 3. Fallback: fetch active links
  if (rawLinks.length === 0) {
    const q3 = await supabaseAdmin.from('links').select('*').eq('is_active', true)
    if (q3.data && q3.data.length > 0) rawLinks = q3.data
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
