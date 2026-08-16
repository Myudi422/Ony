import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30')
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const { data: cards } = await supabaseAdmin
    .from('cards').select('id').eq('user_id', token.userId as string)
  const cardIds = (cards ?? []).map((c: { id: string }) => c.id)

  if (!cardIds.length) {
    return NextResponse.json({ taps: [], clicks: [], devices: [], topLinks: [], totalTaps: 0, totalClicks: 0, nfcTaps: 0, qrScans: 0 })
  }

  const [{ data: taps }, { data: clicks }] = await Promise.all([
    supabaseAdmin.from('tap_logs').select('tapped_at, access_method').in('card_id', cardIds).gte('tapped_at', since),
    supabaseAdmin.from('link_click_logs').select('clicked_at, link_id').in('card_id', cardIds).gte('clicked_at', since),
  ])

  // Group taps by day
  const tapsByDay: Record<string, number> = {}
  for (const tap of (taps ?? [])) {
    const day = tap.tapped_at.slice(0, 10)
    tapsByDay[day] = (tapsByDay[day] ?? 0) + 1
  }
  const tapSeries = Object.entries(tapsByDay).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({
    taps: tapSeries,
    totalTaps: (taps ?? []).length,
    totalClicks: (clicks ?? []).length,
    nfcTaps: (taps ?? []).filter((t: { access_method: string }) => t.access_method === 'nfc_tap').length,
    qrScans: (taps ?? []).filter((t: { access_method: string }) => t.access_method === 'qr_scan').length,
  })
}
