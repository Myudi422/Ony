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
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email) {
    return NextResponse.json({ error: 'Harus login terlebih dahulu untuk klaim & bayar kartu.' }, { status: 401 })
  }

  const userId = (token.userId || token.sub || token.id) as string

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

  // 3. Create Midtrans Snap Parameter
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
      first_name: (token.name as string) ?? 'Pelanggan Ony',
      email: token.email,
    },
    custom_field1: card.id,
    custom_field2: userId,
  }

  try {
    const snapTransaction = await snap.createTransaction(parameter)

    // Save pending transaction record safely (purging old pending attempts for clean logs)
    try {
      await supabaseAdmin
        .from('transactions')
        .delete()
        .eq('user_id', userId)
        .eq('transaction_status', 'pending')

      await supabaseAdmin.from('transactions').insert({
        order_id: orderId,
        user_id: userId,
        gross_amount: price,
        transaction_status: 'pending',
        payment_type: 'midtrans_snap',
        snap_token: snapTransaction.token,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch (_) {}

    return NextResponse.json({
      success: true,
      orderId,
      price,
      snapToken: snapTransaction?.token,
      redirectUrl: snapTransaction?.redirect_url,
    })
  } catch (err: unknown) {
    console.error('Midtrans payment creation error:', err)
    return NextResponse.json({ error: (err as Error).message || 'Gagal memproses transaksi Midtrans' }, { status: 500 })
  }
}
