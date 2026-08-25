import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLivePricing } from '@/lib/pricing'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-gateway-signature')
    const rawBodyText = await req.text()

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-gateway-signature header' }, { status: 401 })
    }

    const pricing = await getLivePricing()
    const webhookSecret = pricing.cashi_webhook_secret

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret key not configured' }, { status: 500 })
    }

    // Verify HMAC SHA256 signature
    let body: any
    try {
      body = JSON.parse(rawBodyText)
    } catch (_) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const expectedSigRaw = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBodyText)
      .digest('hex')

    const expectedSigJson = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex')

    if (signature !== expectedSigRaw && signature !== expectedSigJson) {
      console.warn('Cash.id Webhook signature mismatch:', { received: signature, expectedRaw: expectedSigRaw, expectedJson: expectedSigJson })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const { event, data } = body
    const statusUpper = String(data?.status || '').toUpperCase()

    if (event === 'PAYMENT_SETTLED' || statusUpper === 'SETTLED' || statusUpper === 'SUCCESS' || statusUpper === 'PAID') {
      const orderId = data?.order_id || data?.orderId || body.order_id || body.orderId

      if (orderId && typeof orderId === 'string' && orderId.startsWith('CARD-CLAIM-')) {
        const parts = orderId.split('-')
        const code = parts[2] // CARD-CLAIM-CODE-TIMESTAMP

        if (code) {
          // Update transaction
          await supabaseAdmin
            .from('transactions')
            .update({
              transaction_status: 'settled',
              gross_amount: data.amount || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('order_id', orderId)

          // Update card to active & paid
          const { error: cardErr } = await supabaseAdmin
            .from('cards')
            .update({
              payment_status: 'paid',
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('activation_code', code.toUpperCase())

          if (cardErr) {
            console.error('Error activating card via Cash.id webhook:', cardErr)
          }
        }
      }

      return NextResponse.json({ success: true, message: 'Payment settled successfully' })
    }

    return NextResponse.json({ success: true, message: 'Event received and ignored' })
  } catch (err: any) {
    console.error('Cash.id Webhook error:', err)
    return NextResponse.json({ error: err?.message || 'Webhook internal error' }, { status: 500 })
  }
}
