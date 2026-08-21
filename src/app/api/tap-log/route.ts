import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { card_id, access_method, ip_address, user_agent, user_id } = body

    if (!card_id) {
      return NextResponse.json({ error: 'Missing card_id' }, { status: 400 })
    }

    // Try executing stored procedure RPC first for optimal performance
    const { error: rpcError } = await supabaseAdmin.rpc('log_card_tap', {
      p_card_id: card_id,
      p_access_method: access_method || 'nfc_tap',
      p_ip: ip_address || '127.0.0.1',
      p_ua: user_agent || 'Browser',
      p_user_id: user_id || null,
    })

    // Fallback if RPC is not yet created in Supabase DB
    if (rpcError) {
      // 1. Insert tap log
      const logPayload: Record<string, unknown> = {
        card_id,
        access_method: access_method || 'nfc_tap',
        ip_address: ip_address || '127.0.0.1',
        user_agent: user_agent || 'Browser',
        tapped_at: new Date().toISOString(),
      }
      if (user_id) logPayload.user_id = user_id

      const { error: insertError } = await supabaseAdmin.from('tap_logs').insert(logPayload)
      if (insertError && user_id) {
        delete logPayload.user_id
        await supabaseAdmin.from('tap_logs').insert(logPayload)
      }

      // 2. Increment counter
      const { data: card } = await supabaseAdmin.from('cards').select('total_taps').eq('id', card_id).single()
      const currentTaps = typeof card?.total_taps === 'number' ? card.total_taps : 0
      await supabaseAdmin.from('cards').update({ total_taps: currentTaps + 1 }).eq('id', card_id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Asynchronous tap telemetry error:', err)
    return NextResponse.json({ error: 'Internal telemetry error' }, { status: 500 })
  }
}
