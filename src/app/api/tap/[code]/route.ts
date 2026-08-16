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

  // Insert tap log
  await supabaseAdmin.from('tap_logs').insert({
    card_id: card.id,
    access_method: method,
    ip_address: ip,
    user_agent: ua,
    tapped_at: new Date().toISOString(),
  })

  // Increment total_taps
  await supabaseAdmin.rpc('increment_taps', { card_id: card.id }).then(() => {})

  return NextResponse.json({ success: true })
}
