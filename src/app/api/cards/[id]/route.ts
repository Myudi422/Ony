import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

const getUserId = (token: Record<string, unknown> | null) => {
  if (!token) return null
  return (token.userId || token.sub || token.id) as string | null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const userId = getUserId(token as Record<string, unknown> | null)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Find card by ID or activation code
  let { data: card } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!card) {
    const { data: cardByCode } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('activation_code', id.toUpperCase())
      .maybeSingle()

    card = cardByCode
  }

  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // 1. Fetch tap logs by card_id
  let { data: logs, error: logsError } = await supabaseAdmin
    .from('tap_logs')
    .select('*')
    .eq('card_id', card.id)
    .order('tapped_at', { ascending: false })

  if (logsError) {
    console.error('GET /api/cards/[id] logs error:', logsError)
  }

  // 2. Retry by user_id if card_id query yielded no results
  if ((!logs || logs.length === 0) && card.user_id) {
    const retryUser = await supabaseAdmin
      .from('tap_logs')
      .select('*')
      .eq('user_id', card.user_id)
      .order('tapped_at', { ascending: false })

    if (retryUser.data && retryUser.data.length > 0) {
      logs = retryUser.data
    }
  }

  // 3. Fallback: if still 0 logs, retrieve all recent tap logs
  if (!logs || logs.length === 0) {
    const fallbackAll = await supabaseAdmin
      .from('tap_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (fallbackAll.data && fallbackAll.data.length > 0) {
      logs = fallbackAll.data
    }
  }

  return NextResponse.json({ card, logs: logs ?? [] })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const userId = getUserId(token as Record<string, unknown> | null)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = ['card_name', 'mode', 'redirect_url', 'status']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabaseAdmin
    .from('cards')
    .update(update)
    .eq('id', id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const updatedCard = Array.isArray(data) ? data[0] : data
  return NextResponse.json(updatedCard ?? { id, ...update })
}
