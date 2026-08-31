import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30')
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const { data: userCards } = await supabaseAdmin
    .from('cards')
    .select('id, total_taps')
    .eq('user_id', token.userId as string)

  const cardsList = userCards ?? []
  const cardIds = cardsList.map((c: { id: string }) => c.id)
  const totalTaps = cardsList.reduce((acc: number, c: { total_taps?: number }) => acc + (c.total_taps || 0), 0)

  let totalClicks = 0
  const dailySeries: Record<string, number> = {}

  if (cardIds.length > 0) {
    const { data: clicks } = await supabaseAdmin
      .from('link_click_logs')
      .select('clicked_at')
      .in('card_id', cardIds)
      .gte('clicked_at', since)

    totalClicks = (clicks ?? []).length

    for (const c of (clicks ?? [])) {
      if (c.clicked_at) {
        const day = c.clicked_at.slice(0, 10)
        dailySeries[day] = (dailySeries[day] ?? 0) + 1
      }
    }
  }

  const tapSeries = Object.entries(dailySeries)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({
    taps: tapSeries,
    totalTaps,
    totalClicks,
    totalCards: cardsList.length,
    nfcTaps: totalTaps,
    qrScans: 0,
  })
}
