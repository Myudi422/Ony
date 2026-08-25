import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'
import midtransClient from 'midtrans-client'
import { getLivePricing } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true'

const snap = new midtransClient.Snap({
  isProduction: isProd,
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? '',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '',
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const customerEmail = (token?.email || body?.email || '').trim().toLowerCase()
  if (!customerEmail) {
    return NextResponse.json({ error: 'Email pembeli/pemilik kartu wajib diisi.' }, { status: 400 })
  }

  const userId = (token?.userId || token?.sub || token?.id) as string || null
  const purpose = body?.purpose || 'google_review'
  let targetUrl = body?.targetUrl || body?.googleMapsUrl || body?.customRedirectUrl || ''

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

  if (!card) return NextResponse.json({ error: 'Kartu tidak ditemukan' }, { status: 404 })

  // 2. Fetch Live Dynamic Price
  const dynamicPricing = await getLivePricing()
  const price = dynamicPricing.is_promo_active
    ? dynamicPricing.card_promo_price
    : dynamicPricing.card_base_price

  const orderId = `CARD-CLAIM-${card.activation_code}-${Date.now()}`
  const metadata = {
    email: customerEmail,
    purpose,
    targetUrl,
    userId,
    cardId: card.id,
    code: card.activation_code,
  }

  // 3. Try Cashi.id API Primary Integration
  const cashiApiKey = dynamicPricing.cashi_api_key || process.env.CASHI_API_KEY || '7576626ad46a47041a3dc4b6e133d6abb33a8dbb58ae8b706731c5fffa806dfa'

  try {
    // Save pending transaction record
    const { error: txErr } = await supabaseAdmin.from('transactions').insert({
      order_id: orderId,
      user_id: userId,
      gross_amount: price,
      transaction_status: 'pending',
      payment_type: 'cashi',
      customer_details: metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (txErr) {
      console.error('Pending transaction insert error:', txErr)
    }

    const returnUrl = `https://ony.my.id/c/${card.activation_code}`

    const cashiRes = await fetch('https://cashi.id/api/create-order', {
      method: 'POST',
      headers: {
        'x-api-key': cashiApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: price,
        order_id: orderId,
        redirect_url: returnUrl,
        return_url: returnUrl,
        callback_url: 'https://ony.my.id/api/webhooks/cashi',
      }),
    })

    const cashiData = await cashiRes.json()

    if (cashiRes.ok && (cashiData.checkout_url || cashiData.checkoutUrl || cashiData.success)) {
      const checkoutUrl = cashiData.checkout_url || cashiData.checkoutUrl || `https://cashi.id/pay/${cashiData.orderId || orderId}`
      return NextResponse.json({
        success: true,
        provider: 'cashi',
        orderId,
        price,
        checkoutUrl,
        qrUrl: cashiData.qrUrl ?? null,
      })
    }
  } catch (cashiErr) {
    console.warn('Cashi.id payment error, falling back to Midtrans:', cashiErr)
  }

  // 4. Midtrans Snap Fallback
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: price,
    },
    item_details: [
      {
        id: card.activation_code,
        price,
        quantity: 1,
        name: `Aktivasi Ony Smart NFC Card (${card.activation_code})`,
      },
    ],
    customer_details: {
      first_name: (token?.name as string) || customerEmail.split('@')[0],
      email: customerEmail,
    },
    custom_field1: card.id,
    custom_field2: userId || '',
    custom_field3: JSON.stringify(metadata).slice(0, 250),
  }

  try {
    const snapTransaction = await snap.createTransaction(parameter)
    return NextResponse.json({
      success: true,
      provider: 'midtrans',
      orderId,
      price,
      snapToken: snapTransaction?.token,
      redirectUrl: snapTransaction?.redirect_url,
      checkoutUrl: snapTransaction?.redirect_url,
    })
  } catch (err: unknown) {
    console.error('Midtrans payment creation error:', err)
    return NextResponse.json({ error: (err as Error).message || 'Gagal memproses transaksi pembayaran' }, { status: 500 })
  }
}
