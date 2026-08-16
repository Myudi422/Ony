import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

const checkIsAdmin = (token: Record<string, unknown> | null) => {
  if (!token) return false
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'myudi422@gmail.com').toLowerCase().trim()
  if (typeof token.email === 'string' && token.email.toLowerCase().trim() === adminEmail) return true
  return token.role === 'admin' || token.role === 'superadmin'
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!checkIsAdmin(token as Record<string, unknown> | null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, users(name, email)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!checkIsAdmin(token as Record<string, unknown> | null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const orderId = body.order_id || body.orderId
  const orderStatus = body.order_status || body.status
  const trackingNumber = body.tracking_number !== undefined ? body.tracking_number : body.trackingNumber
  const courier = body.courier || body.shipping_courier

  if (!orderId) return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (orderStatus) updatePayload.status = orderStatus
  if (trackingNumber !== undefined) updatePayload.tracking_number = trackingNumber
  if (courier !== undefined) updatePayload.shipping_courier = courier

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log audit
  await supabaseAdmin.from('admin_audit_logs').insert({
    admin_id: (token?.userId as string) ?? 'ADMIN',
    action: `UPDATE_ORDER_${orderStatus ?? 'INFO'}`,
    target_type: 'ORDER',
    target_id: orderId,
    details: updatePayload,
  })

  return NextResponse.json(data)
}
