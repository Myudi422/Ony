import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

const getUserId = (token: Record<string, unknown> | null) => {
  if (!token) return null
  return (token.userId || token.sub || token.id) as string | null
}

function detectIconType(url: string = '', title: string = '', rawIcon?: string): string {
  if (rawIcon && rawIcon !== 'other' && rawIcon !== 'website') return rawIcon

  const u = url.toLowerCase()
  const t = title.toLowerCase()

  if (u.includes('wa.me') || u.includes('whatsapp') || t.includes('whatsapp')) return 'whatsapp'
  if (u.includes('instagram.com') || u.includes('instagr.am') || t.includes('instagram')) return 'instagram'
  if (u.includes('linkedin.com') || t.includes('linkedin')) return 'linkedin'
  if (u.includes('youtube.com') || u.includes('youtu.be') || t.includes('youtube')) return 'youtube'
  if (u.includes('x.com') || u.includes('twitter.com') || t.includes('twitter')) return 'twitter'
  if (u.includes('mailto:') || t.includes('email')) return 'email'
  if (u.includes('tel:') || t.includes('telepon') || t.includes('phone')) return 'phone'
  if (u.includes('shopee') || u.includes('tokopedia') || u.includes('tiktok.com') || t.includes('toko')) return 'store'
  if (u.includes('vcard') || t.includes('vcard') || t.includes('kontak')) return 'vcard'
  return 'website'
}

const formatLinkItem = (item: Record<string, unknown> | null) => {
  if (!item) return null
  const url = (item.url as string) || ''
  const title = (item.title as string) || ''
  const rawIcon = (item.icon_type || item.platform) as string | undefined

  return {
    ...item,
    icon_type: detectIconType(url, title, rawIcon),
  }
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const userId = getUserId(token as Record<string, unknown> | null)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cardId = req.nextUrl.searchParams.get('card_id')

  let linksData: Record<string, unknown>[] | null = null

  if (cardId) {
    const r1 = await supabaseAdmin.from('links').select('*').eq('card_id', cardId).order('created_at', { ascending: true })
    if (r1.data && r1.data.length > 0) linksData = r1.data
  }

  if (!linksData) {
    const r2 = await supabaseAdmin.from('links').select('*').order('created_at', { ascending: true })
    linksData = r2.data ?? []
  }

  const formatted = linksData.map(formatLinkItem)
  return NextResponse.json(formatted)
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const userId = getUserId(token as Record<string, unknown> | null)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  let { title, url, card_id = null } = body

  if (!title || !url) {
    return NextResponse.json({ error: 'Judul dan URL wajib diisi' }, { status: 400 })
  }

  if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
    url = `https://${url}`
  }

  const icon_type = detectIconType(url, title, body.icon_type || body.platform)

  const linkPayload: Record<string, unknown> = {
    title: title.trim(),
    url: url.trim(),
    icon_type,
    is_active: true,
    created_at: new Date().toISOString(),
  }

  if (card_id) linkPayload.card_id = card_id

  let { data, error } = await supabaseAdmin
    .from('links')
    .insert(linkPayload)
    .select()

  if (error) {
    delete linkPayload.card_id
    const retry1 = await supabaseAdmin.from('links').insert(linkPayload).select()
    if (!retry1.error && retry1.data) {
      data = retry1.data
      error = null
    } else {
      delete linkPayload.user_id
      if (card_id) linkPayload.card_id = card_id
      const retry2 = await supabaseAdmin.from('links').insert(linkPayload).select()
      if (!retry2.error && retry2.data) {
        data = retry2.data
        error = null
      }
    }
  }

  if (error) {
    console.error('POST /api/links insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rawLink = Array.isArray(data) ? data[0] : data
  return NextResponse.json(formatLinkItem(rawLink as Record<string, unknown> | null))
}

export async function PUT() {
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const userId = getUserId(token as Record<string, unknown> | null)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id } = body

  if (!id) return NextResponse.json({ error: 'Link ID required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('links')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const userId = getUserId(token as Record<string, unknown> | null)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  let { id, is_active, title, url } = body

  if (!id) return NextResponse.json({ error: 'Link ID required' }, { status: 400 })

  const updateFields: Record<string, unknown> = {}
  if (typeof is_active === 'boolean') updateFields.is_active = is_active
  if (title) updateFields.title = title.trim()
  if (body.icon_type) updateFields.icon_type = body.icon_type
  if (url) {
    if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
      url = `https://${url}`
    }
    updateFields.url = url.trim()
  }

  const { data, error } = await supabaseAdmin
    .from('links')
    .update(updateFields)
    .eq('id', id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rawLink = Array.isArray(data) ? data[0] : data
  return NextResponse.json(formatLinkItem(rawLink as Record<string, unknown> | null))
}
