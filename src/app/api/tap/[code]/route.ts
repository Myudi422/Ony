import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const method = req.nextUrl.searchParams.get('method') ?? 'nfc_tap'
  const ua = req.headers.get('user-agent') ?? undefined
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? undefined

  const { data: card } = await supabaseAdmin
    .from('cards').select('id, status').eq('activation_code', code.toUpperCase()).single()

  if (!card || card.status === 'suspended' || card.status === 'lost') {
    return NextResponse.json({ error: 'Card unavailable' }, { status: 403 })
  }

  // Increment total_taps counter without logging individual rows (conserve free tier storage)
  await supabaseAdmin.rpc('increment_taps', { card_id: card.id }).then(async ({ error }) => {
    if (error) {
      const { data: c } = await supabaseAdmin.from('cards').select('total_taps').eq('id', card.id).maybeSingle()
      const current = typeof c?.total_taps === 'number' ? c.total_taps : 0
      await supabaseAdmin.from('cards').update({ total_taps: current + 1 }).eq('id', card.id)
    }
  })

  return NextResponse.json({ success: true })
}
