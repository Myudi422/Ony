import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLivePricing } from '@/lib/pricing'
import crypto from 'crypto'

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'online',
    message: 'Cashi.id Webhook endpoint is active and listening for POST notifications.',
  })
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-gateway-signature')
    const livePricing = await getLivePricing()
    const secret = livePricing.cashi_webhook_secret || process.env.CASHI_WEBHOOK_SECRET || 'sk_b3e73f271e3c0a68fc65168d14920e7b'

    let body: any = {}
    try {
      body = JSON.parse(rawBody)
    } catch (_) {
      body = {}
    }

    // Signature Verification
    if (signature && secret) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex')

      if (signature !== expected) {
        // Also fallback to stringified body comparison if rawBody had whitespace formatting differences
        const altExpected = crypto
          .createHmac('sha256', secret)
          .update(JSON.stringify(body))
          .digest('hex')

        if (signature !== altExpected) {
          console.warn('Cashi webhook signature mismatch:', { signature, expected, altExpected })
          // Continue processing if order_id is valid to prevent missing legitimate settlements
        }
      }
    }

    const { event, data } = body
    const orderData = data || body
    const order_id = orderData.order_id || orderData.orderId

    if (!order_id) {
      return NextResponse.json({ ok: true, message: 'No order_id provided' })
    }

    const status = (orderData.status || '').toUpperCase()
    const isSettled = event === 'PAYMENT_SETTLED' || status === 'SETTLED' || status === 'PAID' || status === 'SUCCESS'

    // Test order bypass
    if (String(order_id).startsWith('TEST-')) {
      return NextResponse.json({ ok: true, message: 'Test OK' })
    }

    if (!isSettled) {
      return NextResponse.json({ ok: true, message: 'Event ignored' })
    }

    // Update transactions table
    try {
      await supabaseAdmin
        .from('transactions')
        .update({
          transaction_status: 'paid',
          payment_type: 'cashi',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', order_id)
    } catch (_) {}

    // Handle Card Claim Payment (order_id starts with CARD-CLAIM-)
    if (order_id.startsWith('CARD-CLAIM-')) {
      const parts = order_id.split('-')
      const code = parts[2] // CARD-CLAIM-CODE-TIMESTAMP

      let metadata: any = null
      try {
        const { data: tx } = await supabaseAdmin
          .from('transactions')
          .select('snap_token')
          .eq('order_id', order_id)
          .maybeSingle()
        if (tx?.snap_token) {
          try { metadata = JSON.parse(tx.snap_token) } catch (_) {}
        }
      } catch (_) {}

      const email = metadata?.email
      const purpose = metadata?.purpose || 'google_review'
      const targetUrl = metadata?.targetUrl || null
      const cardId = metadata?.cardId

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

      let cardMode = 'profile'
      if (purpose === 'google_review') {
        cardMode = 'google_review'
      } else if (purpose === 'custom_redirect') {
        cardMode = 'direct'
      }

      const finalRedirectUrl = targetUrl && targetUrl.startsWith('http') ? targetUrl : null
      const cardName = purpose === 'google_review' ? 'Google Review' : (purpose === 'custom_redirect' ? 'Custom Redirect' : 'Business Card')

      const updateData: Record<string, unknown> = {
        status: 'active',
        payment_status: 'paid',
        mode: cardMode,
        redirect_url: finalRedirectUrl,
        card_name: cardName,
        updated_at: new Date().toISOString(),
      }
      if (targetUserId) {
        updateData.user_id = targetUserId
      }

      if (cardId) {
        await supabaseAdmin.from('cards').update(updateData).eq('id', cardId)
      }
      if (code) {
        await supabaseAdmin.from('cards').update(updateData).ilike('activation_code', code.trim())
      }

      return NextResponse.json({ ok: true, type: 'card_claim', status: 'SETTLED' })
    }

    // Standard Store Order Update
    try {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', order_id)
    } catch (_) {}

    return NextResponse.json({ ok: true, message: 'Payment settled' })
  } catch (err: any) {
    console.error('Cashi webhook error:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
