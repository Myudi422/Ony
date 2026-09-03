import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

const checkIsAdmin = (token: Record<string, unknown> | null) => {
  if (!token) return false
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
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '10')
  const search = searchParams.get('search') ?? ''

  let query = supabaseAdmin.from('users').select('*, cards(count)', { count: 'exact' })

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const formattedUsers = (data ?? []).map((u: any) => ({
    ...u,
    card_count: u.cards?.[0]?.count ?? 0,
    cards: undefined,
  }))

  return NextResponse.json({ users: formattedUsers, total: count, page, limit })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!checkIsAdmin(token as Record<string, unknown> | null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const userId = body.user_id || body.userId
  const role = body.role || (body.action === 'role' ? body.value : undefined)
  const status = body.status || (body.action === 'status' ? body.value : undefined)

  if (!userId) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (role) updatePayload.role = role
  if (status) updatePayload.status = status

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updatePayload)
    .eq('id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log
  await supabaseAdmin.from('admin_audit_logs').insert({
    admin_id: (token?.userId as string) ?? userId,
    action: status ? `STATUS_${status.toUpperCase()}` : `ROLE_${role?.toUpperCase()}`,
    target_type: 'USER',
    target_id: userId,
    details: updatePayload,
  })

  return NextResponse.json(data)
}
