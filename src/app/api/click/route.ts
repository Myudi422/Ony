import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { linkId, cardId } = await req.json()
  if (!linkId || !cardId) return NextResponse.json({ ok: false })

  // Atomic counter increment without creating link_click_logs rows (conserves DB storage)
  const { error } = await supabaseAdmin.rpc('increment_link_clicks', { link_id: linkId })
  if (error) {
    // Fallback direct counter increment on links table
    const { data: link } = await supabaseAdmin.from('links').select('clicks').eq('id', linkId).maybeSingle()
    const currentClicks = typeof link?.clicks === 'number' ? link.clicks : 0
    await supabaseAdmin.from('links').update({ clicks: currentClicks + 1 }).eq('id', linkId)
  }

  return NextResponse.json({ ok: true })
}
