import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'
import midtransClient from 'midtrans-client'

export const dynamic = 'force-dynamic'

const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true'

const snap = new midtransClient.Snap({
  isProduction: isProd,
  serverKey:    process.env.MIDTRANS_SERVER_KEY ?? '',
  clientKey:    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '',
})

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('user_id', token.userId as string)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { items, shipping_address } = body

  if (!items || !items.length) {
    return NextResponse.json({ error: 'Cart items required' }, { status: 400 })
  }

  const orderNumber = `ONY-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const totalAmount = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0)

  // Create order in DB
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: token.userId as string,
      order_number: orderNumber,
      total_amount: totalAmount,
      status: 'pending',
      shipping_address,
      items,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Order creation DB error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Generate Midtrans Snap token
  const parameter = {
    transaction_details: {
      order_id: order.order_number,
      gross_amount: totalAmount,
    },
    item_details: items.map((i: { id?: string; name: string; price: number; quantity: number }) => ({
      id: i.id || i.name.toLowerCase().replace(/\s+/g, '-'),
      price: i.price,
      quantity: i.quantity,
      name: i.name,
    })),
    customer_details: {
      first_name: token.name ?? 'Pelanggan',
      email: token.email,
    },
  }

  try {
    const snapTransaction = await snap.createTransaction(parameter)
    if (snapTransaction?.token) {
      await supabaseAdmin.from('orders').update({ snap_token: snapTransaction.token }).eq('id', order.id)
    }
    return NextResponse.json({ order, snapToken: snapTransaction?.token, redirectUrl: snapTransaction?.redirect_url })
  } catch (err: unknown) {
    console.error('Midtrans Snap error:', err)
    return NextResponse.json({ order, snapToken: null, message: (err as Error).message })
  }
}
