import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLivePricing } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { email, name, cardPurpose, googleMapsUrl, customRedirectUrl } = body

    // 1. Fetch Card
    let { data: card } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!card) {
      const { data: byCode } = await supabaseAdmin
        .from('cards')
        .select('*')
        .eq('activation_code', id.toUpperCase())
        .maybeSingle()
      card = byCode
    }

    if (!card) {
      return NextResponse.json({ error: 'Kartu tidak ditemukan' }, { status: 404 })
    }

    // 2. Fetch Live Dynamic Price & Cash.id Gateway Config
    const dynamicPricing = await getLivePricing()
    const price = dynamicPricing.is_promo_active
      ? dynamicPricing.card_promo_price
      : dynamicPricing.card_base_price

    const apiKey = dynamicPricing.cashi_api_key

    if (!apiKey) {
      return NextResponse.json({ error: 'Kredensial Cash.id (API Key) belum dikonfigurasi oleh admin.' }, { status: 500 })
    }

    const orderId = `CARD-CLAIM-${card.activation_code}-${Date.now()}`

    // 3. Request Order Creation from Cash.id API
    const cashiRes = await fetch('https://cashi.id/api/create-order', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: price,
        order_id: orderId,
        kode_channel: 'QRIS_CUSTOM',
      }),
    })

    const resData = await cashiRes.json()

    if (!cashiRes.ok || resData.success === false) {
      console.error('Cash.id API order creation failed:', resData)
      return NextResponse.json(
        { error: resData.message || resData.error || 'Gagal membuat tagihan pembayaran Cash.id' },
        { status: 400 }
      )
    }

    // 4. Record Pending Transaction in DB with claim metadata
    const metadata = {
      card_id: card.id,
      activation_code: card.activation_code,
      claimed_email: email ? String(email).trim().toLowerCase() : null,
      claimed_name: name ? String(name).trim() : null,
      purpose: cardPurpose || 'business_card',
      google_maps_url: googleMapsUrl || null,
      custom_redirect_url: customRedirectUrl || null,
    }

    try {
      // Purge previous pending transactions for this card code for clean logs
      await supabaseAdmin
        .from('transactions')
        .delete()
        .eq('order_id', orderId)

      await supabaseAdmin.from('transactions').insert({
        order_id: orderId,
        gross_amount: price,
        transaction_status: 'pending',
        payment_type: 'cashi_qris',
        snap_token: resData.checkout_url || resData.orderId || orderId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch (e) {
      console.warn('Error saving transaction record:', e)
    }

    return NextResponse.json({
      success: true,
      orderId,
      price,
      checkout_url: resData.checkout_url || `https://cashi.id/pay/${resData.orderId || orderId}`,
      qrUrl: resData.qrUrl || null,
      metadata,
    })
  } catch (err: any) {
    console.error('Cash.id payment error:', err)
    return NextResponse.json({ error: err?.message || 'Gagal memproses transaksi Cash.id' }, { status: 500 })
  }
}
