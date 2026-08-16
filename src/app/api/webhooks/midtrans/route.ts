import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Verify Midtrans signature
  const { order_id, status_code, gross_amount, signature_key, transaction_status, custom_field1, custom_field2 } = body
  const serverKey = process.env.MIDTRANS_SERVER_KEY!
  const expectedSig = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex')

  if (signature_key !== expectedSig) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Map Midtrans status to our order status
  const statusMap: Record<string, string> = {
    settlement: 'paid',
    capture:    'paid',
    pending:    'pending',
    expire:     'cancelled',
    cancel:     'cancelled',
    deny:       'cancelled',
  }

  const orderStatus = statusMap[transaction_status] ?? 'pending'

  // Update transaction record
  await supabaseAdmin
    .from('transactions')
    .update({
      transaction_status,
      payment_type: body.payment_type ?? 'unknown',
      midtrans_transaction_id: body.transaction_id,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', order_id)

  // Handle Card Claim Payment (order_id starts with CARD-CLAIM-)
  if (order_id.startsWith('CARD-CLAIM-')) {
    if (orderStatus === 'paid') {
      const parts = order_id.split('-')
      const code = parts[2] // CARD-CLAIM-CODE-TIMESTAMP
      const cardId = custom_field1
      const userId = custom_field2

      const updateData: Record<string, unknown> = {
        payment_status: 'paid',
        redirect_url: null,
        status: 'active',
        updated_at: new Date().toISOString(),
      }
      if (userId) {
        updateData.user_id = userId
      }

      let query = supabaseAdmin.from('cards').update(updateData)

      if (cardId) {
        query = query.eq('id', cardId)
      } else if (code) {
        query = query.eq('activation_code', code.toUpperCase())
      }

      await query
    }

    return NextResponse.json({ ok: true, type: 'card_claim' })
  }

  // Standard Store Order Update
  if (orderStatus === 'paid') {
    await supabaseAdmin
      .from('orders')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', order_id)
  } else if (orderStatus === 'cancelled') {
    await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', order_id)
  }

  return NextResponse.json({ ok: true })
}
