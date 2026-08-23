import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

const getUserId = (token: Record<string, unknown> | null) => {
  if (!token) return null
  return (token.userId || token.sub || token.id) as string | null
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const userId = getUserId(token as Record<string, unknown> | null)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, avatar_url')
    .eq('id', userId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const userId = getUserId(token as Record<string, unknown> | null)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (typeof body.name === 'string' && body.name.trim()) {
    update.name = body.name.trim()
  }
  // Allow empty string to clear avatar_url (revert to initials)
  if ('avatar_url' in body) {
    update.avatar_url = body.avatar_url?.trim() || null
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(update)
    .eq('id', userId)
    .select('id, name, email, avatar_url')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
