import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'
import { generateActivationCode } from '@/lib/utils'

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

  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const search = searchParams.get('search') ?? ''
  const paymentStatus = searchParams.get('payment_status') ?? 'all'
  const cardStatus = searchParams.get('status') ?? 'all'
  const startDate = searchParams.get('start_date') ?? ''
  const endDate = searchParams.get('end_date') ?? ''

  let query = supabaseAdmin.from('cards').select('*, users(name, email)', { count: 'exact' })

  if (search) {
    query = query.or(`activation_code.ilike.%${search}%,card_name.ilike.%${search}%`)
  }

  if (paymentStatus === 'paid') {
    query = query.or('payment_status.eq.paid,redirect_url.neq.UNPAID')
  } else if (paymentStatus === 'unpaid') {
    query = query.or('payment_status.eq.unpaid,redirect_url.eq.UNPAID')
  }

  if (cardStatus !== 'all') {
    query = query.eq('status', cardStatus)
  }

  if (startDate) {
    query = query.gte('created_at', `${startDate}T00:00:00.000Z`)
  }

  if (endDate) {
    query = query.lte('created_at', `${endDate}T23:59:59.999Z`)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cards: data ?? [], total: count ?? 0, page, limit })
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!checkIsAdmin(token as Record<string, unknown> | null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const targetCount = Math.max(1, Math.min(Number(body.count || body.batch_count || 1), 100))
  const media_type = body.media_type || 'nfc_qr'
  const payment_status = body.payment_status === 'unpaid' ? 'unpaid' : 'paid'

  const newCards = Array.from({ length: targetCount }, () => ({
    activation_code: generateActivationCode(8),
    media_type,
    card_name: `NFC + QR Smart Media`,
    status: 'unclaimed',
    mode: 'profile',
    payment_status,
    redirect_url: payment_status === 'unpaid' ? 'UNPAID' : null,
    total_taps: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))

  let { data, error } = await supabaseAdmin
    .from('cards')
    .insert(newCards)
    .select()

  // Fallback: If DB schema cache does not have payment_status column yet
  if (error) {
    console.error('Insert cards error (retrying with minimal schema):', error.message)
    const fallbackCards = newCards.map(({ payment_status, ...rest }) => rest)
    const retry = await supabaseAdmin
      .from('cards')
      .insert(fallbackCards)
      .select()

    data = retry.data
    error = retry.error
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log audit
  try {
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: (token?.userId as string) ?? 'ADMIN',
      action: 'BATCH_GENERATE_CARDS',
      target_type: 'CARD',
      target_id: data?.[0]?.id ?? 'BATCH',
      details: { count: newCards.length, media_type, payment_status },
    })
  } catch (_) {}

  return NextResponse.json({ created: data?.length ?? 0, cards: data ?? [] })
}

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!checkIsAdmin(token as Record<string, unknown> | null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { cardIds } = body

  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    return NextResponse.json({ error: 'No cardIds provided' }, { status: 400 })
  }

  // Delete associated links and tap logs before deleting cards
  await supabaseAdmin.from('links').delete().in('card_id', cardIds)
  await supabaseAdmin.from('tap_logs').delete().in('card_id', cardIds)

  const { error } = await supabaseAdmin
    .from('cards')
    .delete()
    .in('id', cardIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log audit
  try {
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: (token?.userId as string) ?? 'ADMIN',
      action: 'DELETE_CARDS',
      target_type: 'CARD',
      target_id: cardIds.join(','),
      details: { count: cardIds.length },
    })
  } catch (_) {}

  return NextResponse.json({ deleted: cardIds.length })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!checkIsAdmin(token as Record<string, unknown> | null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { cardId, action, value } = body

  if (!cardId) {
    return NextResponse.json({ error: 'cardId required' }, { status: 400 })
  }

  if (action === 'unbind') {
    // 1. Get existing card owner ID before unbinding
    const { data: existingCard } = await supabaseAdmin
      .from('cards')
      .select('user_id')
      .eq('id', cardId)
      .single()

    const oldUserId = existingCard?.user_id

    // 2. Unbind card and reset to clean unclaimed state
    const { data, error } = await supabaseAdmin
      .from('cards')
      .update({
        user_id: null,
        status: 'unclaimed',
        card_name: 'NFC + QR Smart Media',
        mode: 'profile',
        redirect_url: null,
        total_taps: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 3. Purge all links and tap logs for this card safely
    await supabaseAdmin.from('links').delete().eq('card_id', cardId)
    if (oldUserId) {
      await supabaseAdmin.from('links').delete().eq('user_id', oldUserId)
    }
    await supabaseAdmin.from('tap_logs').delete().eq('card_id', cardId)

    // Log audit
    try {
      await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: (token?.userId as string) ?? 'ADMIN',
        action: 'UNBIND_CARD',
        target_type: 'CARD',
        target_id: cardId,
        details: { old_user_id: oldUserId, links_deleted: true, tap_logs_deleted: true },
      })
    } catch (_) {}

    return NextResponse.json({ success: true, card: data?.[0] })
  }

  if (action === 'status') {
    const newStatus = value || 'suspended'
    const { data, error } = await supabaseAdmin
      .from('cards')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    try {
      await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: (token?.userId as string) ?? 'ADMIN',
        action: 'UPDATE_CARD_STATUS',
        target_type: 'CARD',
        target_id: cardId,
        details: { status: newStatus },
      })
    } catch (_) {}

    return NextResponse.json({ success: true, card: data?.[0] })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
