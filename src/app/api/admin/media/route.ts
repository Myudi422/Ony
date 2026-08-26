import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'
import { generateActivationCode } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const checkIsAdmin = (token: Record<string, unknown> | null) => {
  if (!token) return false
  // SECURITY: Never hardcode fallback — if ADMIN_EMAIL is unset, deny access
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  if (adminEmail && typeof token.email === 'string' && token.email.toLowerCase().trim() === adminEmail) return true
  return token.role === 'admin' || token.role === 'superadmin'
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!checkIsAdmin(token as Record<string, unknown> | null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const searchParams = req.nextUrl.searchParams
  const statsOnly = searchParams.get('stats_only') === 'true'
  const skipStats = searchParams.get('skip_stats') === 'true'

  // Stats-only mode: return summary counts, skip paginated query
  if (statsOnly) {
    const [totalRes, unclaimedRes, activeRes, suspendedRes, unpaidRes] = await Promise.all([
      supabaseAdmin.from('cards').select('*', { count: 'estimated', head: true }),
      supabaseAdmin.from('cards').select('*', { count: 'estimated', head: true }).eq('status', 'unclaimed'),
      supabaseAdmin.from('cards').select('*', { count: 'estimated', head: true }).eq('status', 'active'),
      supabaseAdmin.from('cards').select('*', { count: 'estimated', head: true }).eq('status', 'suspended'),
      supabaseAdmin.from('cards').select('*', { count: 'estimated', head: true }).eq('redirect_url', 'UNPAID'),
    ])
    return NextResponse.json({
      stats: {
        total:     totalRes.count     ?? 0,
        unclaimed: unclaimedRes.count ?? 0,
        active:    activeRes.count    ?? 0,
        suspended: suspendedRes.count ?? 0,
        unpaid:    unpaidRes.count    ?? 0,
      }
    })
  }

  const page  = parseInt(searchParams.get('page')  ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const search        = searchParams.get('search')         ?? ''
  const paymentStatus = searchParams.get('payment_status') ?? 'all'
  const cardStatus    = searchParams.get('status')         ?? 'all'
  const startDate     = searchParams.get('start_date')     ?? ''
  const endDate       = searchParams.get('end_date')       ?? ''

  const allowedOrderBy = ['card_number', 'created_at', 'total_taps'] as const
  type OrderBy = typeof allowedOrderBy[number]
  const rawOrderBy = searchParams.get('order_by') ?? 'card_number'
  const orderBy: OrderBy = allowedOrderBy.includes(rawOrderBy as OrderBy) ? rawOrderBy as OrderBy : 'card_number'
  const orderAsc = searchParams.get('order_dir') === 'asc'

  let query = supabaseAdmin.from('cards').select('*, users(name, email)', { count: 'exact' })

  const cleanSearch = search.trim()
  if (cleanSearch) query = query.or(`activation_code.ilike.%${cleanSearch}%,card_name.ilike.%${cleanSearch}%`)
  if (paymentStatus === 'paid')   query = query.or('redirect_url.is.null,redirect_url.neq.UNPAID')
  else if (paymentStatus === 'unpaid') query = query.eq('redirect_url', 'UNPAID')
  if (cardStatus !== 'all') query = query.eq('status', cardStatus)
  if (startDate) query = query.gte('created_at', `${startDate}T00:00:00.000Z`)
  if (endDate)   query = query.lte('created_at', `${endDate}T23:59:59.999Z`)

  const from = (page - 1) * limit
  const to   = from + limit - 1

  // Page/sort change only: skip all stat COUNT queries
  if (skipStats) {
    const { data, count, error } = await query.range(from, to).order(orderBy, { ascending: orderAsc, nullsFirst: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ cards: data ?? [], total: count ?? 0, page, limit })
  }

  // Initial load / filter change: run stats in parallel
  // Stats use count:'estimated' — PostgreSQL planner stats, near-instant on large tables
  const [{ data, count, error }, unclaimedRes, activeRes, suspendedRes, unpaidRes] = await Promise.all([
    query.range(from, to).order(orderBy, { ascending: orderAsc, nullsFirst: false }),
    supabaseAdmin.from('cards').select('*', { count: 'estimated', head: true }).eq('status', 'unclaimed'),
    supabaseAdmin.from('cards').select('*', { count: 'estimated', head: true }).eq('status', 'active'),
    supabaseAdmin.from('cards').select('*', { count: 'estimated', head: true }).eq('status', 'suspended'),
    supabaseAdmin.from('cards').select('*', { count: 'estimated', head: true }).eq('redirect_url', 'UNPAID'),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    cards: data ?? [],
    total: count ?? 0,
    stats: {
      total:     count             ?? 0,
      unclaimed: unclaimedRes.count ?? 0,
      active:    activeRes.count    ?? 0,
      suspended: suspendedRes.count ?? 0,
      unpaid:    unpaidRes.count    ?? 0,
    },
    page, limit,
  })
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

  // Generate unique codes — check against DB to prevent collision on existing printed codes
  const generatedCodes = new Set<string>()
  while (generatedCodes.size < targetCount) {
    generatedCodes.add(generateActivationCode(8))
  }

  let candidateCodes = Array.from(generatedCodes)

  // Retry loop: check DB for conflicts, regenerate any duplicates
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabaseAdmin
      .from('cards')
      .select('activation_code')
      .in('activation_code', candidateCodes)

    const takenCodes = new Set((existing ?? []).map((r) => r.activation_code))
    if (takenCodes.size === 0) break

    candidateCodes = candidateCodes.map((code) => {
      if (!takenCodes.has(code)) return code
      let fresh: string
      do { fresh = generateActivationCode(8) } while (takenCodes.has(fresh) || candidateCodes.includes(fresh))
      return fresh
    })
  }

  const now = new Date().toISOString()
  const newCards = candidateCodes.map((activation_code) => ({
    activation_code,
    media_type,
    card_name: `NFC + QR Smart Media`,
    status: 'unclaimed',
    mode: 'profile',
    payment_status,
    redirect_url: payment_status === 'unpaid' ? 'UNPAID' : null,
    total_taps: 0,
    created_at: now,
    updated_at: now,
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
  const { cardId, cardIds, action, value } = body

  const idsToProcess = Array.isArray(cardIds) ? cardIds : (cardId ? [cardId] : [])
  if (idsToProcess.length === 0) {
    return NextResponse.json({ error: 'cardId or cardIds required' }, { status: 400 })
  }

  if (action === 'payment_status') {
    const isUnpaid = value === 'unpaid'
    if (isUnpaid) {
      const { data, error } = await supabaseAdmin
        .from('cards')
        .update({
          redirect_url: 'UNPAID',
          updated_at: new Date().toISOString(),
        })
        .in('id', idsToProcess)
        .select()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      try {
        await supabaseAdmin.from('admin_audit_logs').insert({
          admin_id: (token?.userId as string) ?? 'ADMIN',
          action: 'UPDATE_PAYMENT_STATUS',
          target_type: 'CARD',
          target_id: idsToProcess.join(','),
          details: { payment_status: 'unpaid' },
        })
      } catch (_) {}

      return NextResponse.json({ success: true, updated: data?.length ?? 0 })
    } else {
      // Set to paid: clear 'UNPAID' redirect_url placeholder
      const { data, error } = await supabaseAdmin
        .from('cards')
        .update({
          redirect_url: null,
          updated_at: new Date().toISOString(),
        })
        .in('id', idsToProcess)
        .eq('redirect_url', 'UNPAID')
        .select()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      try {
        await supabaseAdmin.from('admin_audit_logs').insert({
          admin_id: (token?.userId as string) ?? 'ADMIN',
          action: 'UPDATE_PAYMENT_STATUS',
          target_type: 'CARD',
          target_id: idsToProcess.join(','),
          details: { payment_status: 'paid' },
        })
      } catch (_) {}

      return NextResponse.json({ success: true, updated: data?.length ?? 0 })
    }
  }

  if (action === 'unbind') {
    const targetCardId = idsToProcess[0]
    // 1. Get existing card owner ID before unbinding
    const { data: existingCard } = await supabaseAdmin
      .from('cards')
      .select('user_id')
      .eq('id', targetCardId)
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
      .eq('id', targetCardId)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 3. Purge all links and tap logs for this card safely
    await supabaseAdmin.from('links').delete().eq('card_id', targetCardId)
    if (oldUserId) {
      await supabaseAdmin.from('links').delete().eq('user_id', oldUserId)
    }
    await supabaseAdmin.from('tap_logs').delete().eq('card_id', targetCardId)

    // Log audit
    try {
      await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: (token?.userId as string) ?? 'ADMIN',
        action: 'UNBIND_CARD',
        target_type: 'CARD',
        target_id: targetCardId,
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
      .in('id', idsToProcess)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    try {
      await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: (token?.userId as string) ?? 'ADMIN',
        action: 'UPDATE_CARD_STATUS',
        target_type: 'CARD',
        target_id: idsToProcess.join(','),
        details: { status: newStatus },
      })
    } catch (_) {}

    return NextResponse.json({ success: true, updated: data?.length ?? 0 })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
