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

  // Optimized query: Select only existing required fields
  const { data: card } = await supabaseAdmin
    .from('cards')
    .select('id, activation_code, card_name, mode, redirect_url, status, total_taps, media_type, user_id, users(id, name, email, avatar_url)')
    .eq('activation_code', code.toUpperCase())
    .single()

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

  // Unclaimed — show claim page
  const isUnpaidCard = card.redirect_url === 'UNPAID'
  if (card.status === 'unclaimed' || !card.user_id) {
    return <ClaimPage code={code.toUpperCase()} mediaType={card.media_type} paymentStatus={isUnpaidCard ? 'unpaid' : 'paid'} cardId={card.id} />
  }

  // Active — Direct Mode or Google Review Maps Mode (INSTANT REDIRECT)
  if ((card.mode === 'direct' || card.mode === 'review' || card.mode === 'google_review') && card.redirect_url) {
    redirect(card.redirect_url)
  }

  // Active — Profile Mode
  const user = (Array.isArray(card.users) ? card.users[0] : card.users) as { id: string; name: string; email: string; avatar_url: string } | null
  if (!user) return notFound()

  // Efficient single query for active links
  const { data: rawLinks } = await supabaseAdmin
    .from('links')
    .select('*')
    .or(`user_id.eq.${user.id},card_id.eq.${card.id}`)
    .eq('is_active', true)
    .order('order_index', { ascending: true })

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
