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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!checkIsAdmin(token as Record<string, unknown> | null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: userId } = await params
  if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '5')
  const search = searchParams.get('search') ?? ''

  let query = supabaseAdmin
    .from('cards')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  if (search.trim()) {
    query = query.or(`activation_code.ilike.%${search.trim()}%,card_name.ilike.%${search.trim()}%`)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await query
    .range(from, to)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    cards: data ?? [],
    total: count ?? 0,
    page,
    limit,
  })
}
