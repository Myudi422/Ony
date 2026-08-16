import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { linkId, cardId } = await req.json()
  if (!linkId || !cardId) return NextResponse.json({ ok: false })

  await Promise.all([
    supabaseAdmin.from('link_click_logs').insert({
      link_id: linkId, card_id: cardId,
      clicked_at: new Date().toISOString(),
    }),
    supabaseAdmin.rpc('increment_link_clicks', { link_id: linkId }).then(() => {}),
  ])

  return NextResponse.json({ ok: true })
}
