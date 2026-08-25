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

      let metadata: any = null
      if (body.custom_field3) {
        try { metadata = JSON.parse(body.custom_field3) } catch (_) {}
      }

      if (!metadata) {
        try {
          const { data: tx } = await supabaseAdmin
            .from('transactions')
            .select('customer_details')
            .eq('order_id', order_id)
            .maybeSingle()
          if (tx?.customer_details) {
            metadata = tx.customer_details
          }
        } catch (_) {}
      }

      const email = metadata?.email
      const purpose = metadata?.purpose || 'google_review'
      const targetUrl = metadata?.targetUrl || null

      let targetUserId = userId || null
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

      const isDirectMode = purpose === 'google_review' || purpose === 'custom_redirect'
      const cardMode = isDirectMode ? 'direct' : 'profile'
      const redirectUrl = isDirectMode ? (targetUrl || 'https://maps.google.com') : null
      const cardName = purpose === 'google_review' ? 'Google Review' : purpose === 'custom_redirect' ? 'Custom Redirect' : 'Business Card'

      const updateData: Record<string, unknown> = {
        status: 'active',
        mode: cardMode,
        redirect_url: redirectUrl,
        card_name: cardName,
        updated_at: new Date().toISOString(),
      }
      if (targetUserId) {
        updateData.user_id = targetUserId
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
