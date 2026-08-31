import { supabaseAdmin } from './supabase'

// ─── Types ───────────────────────────────────────────────
export type UserRole   = 'user' | 'admin' | 'superadmin'
export type UserStatus = 'active' | 'suspended' | 'banned'
export type CardStatus = 'unclaimed' | 'active' | 'suspended' | 'lost'
export type CardMode   = 'profile' | 'direct'
export type MediaType  = 'nfc_card' | 'nfc_sticker' | 'qr_standee' | 'qr_keychain' | 'digital_qr'
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled'
export type AccessMethod = 'nfc_tap' | 'qr_scan' | 'direct_url'

export interface DbUser {
  id: string
  email: string
  name: string
  avatar_url: string
  role: UserRole
  status: UserStatus
  last_login_at: string
  created_at: string
}

export interface DbCard {
  id: string
  activation_code: string
  user_id: string | null
  card_name: string
  media_type: MediaType
  status: CardStatus
  mode: CardMode
  payment_status?: 'paid' | 'unpaid'
  redirect_url: string | null
  total_taps: number
  created_at: string
  updated_at: string
}

export interface DbLink {
  id: string
  user_id: string
  card_id: string | null
  title: string
  url: string
  icon_type: string
  order_index: number
  total_clicks: number
  is_active: boolean
  created_at: string
}

export interface DbOrder {
  id: string
  order_number: string
  user_id: string
  total_amount: number
  shipping_address: string
  shipping_courier: string | null
  tracking_number: string | null
  status: OrderStatus
  created_at: string
  updated_at: string
}

// ─── Card Queries ─────────────────────────────────────────
export async function getCardByCode(code: string) {
  const { data, error } = await supabaseAdmin
    .from('cards')
    .select('*, users(*)')
    .eq('activation_code', code.toUpperCase())
    .single()
  if (error) return null
  return data
}

export async function getUserCards(userId: string) {
  const { data } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function claimCard(code: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('cards')
    .update({ user_id: userId, status: 'active', updated_at: new Date().toISOString() })
    .eq('activation_code', code.toUpperCase())
    .is('user_id', null)
    .select()
    .single()
  return { data, error }
}

// ─── Link Queries ─────────────────────────────────────────
export async function getUserLinks(userId: string, cardId?: string) {
  let query = supabaseAdmin
    .from('links')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (cardId) {
    query = query.eq('card_id', cardId)
  } else {
    const { data: cards } = await supabaseAdmin.from('cards').select('id').eq('user_id', userId)
    const cardIds = (cards ?? []).map(c => c.id)
    if (cardIds.length === 0) return []
    query = query.in('card_id', cardIds)
  }

  const { data } = await query
  return data ?? []
}

// ─── User Queries ─────────────────────────────────────────
export async function upsertUser(profile: {
  id: string; email: string; name: string; avatar_url: string
}) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert({
      ...profile,
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select()
    .single()
  return { data, error }
}

export async function getUserById(id: string) {
  const { data } = await supabaseAdmin
    .from('users').select('*').eq('id', id).single()
  return data
}

// ─── Analytics Queries ───────────────────────────────────
export async function logTap(cardId: string, _method?: AccessMethod, _ip?: string, _ua?: string) {
  // Increment total_taps counter without inserting tap_logs rows (conserve free tier storage)
  await supabaseAdmin.rpc('increment_taps', { card_id: cardId }).then(async ({ error }) => {
    if (error) {
      const { data: card } = await supabaseAdmin.from('cards').select('total_taps').eq('id', cardId).maybeSingle()
      const current = typeof card?.total_taps === 'number' ? card.total_taps : 0
      await supabaseAdmin.from('cards').update({ total_taps: current + 1 }).eq('id', cardId)
    }
  })
}

export async function getUserAnalytics(userId: string, days = 30) {
  const cards = await getUserCards(userId)
  if (!cards.length) return { taps: [], clicks: [], total: 0, totalClicks: 0 }

  const totalTaps = cards.reduce((sum, c) => sum + (c.total_taps || 0), 0)

  const since = new Date(Date.now() - days * 86400000).toISOString()
  const cardIds = cards.map(c => c.id)

  const { data: clicks } = await supabaseAdmin
    .from('link_click_logs')
    .select('clicked_at, link_id')
    .in('card_id', cardIds)
    .gte('clicked_at', since)

  return {
    taps: [],
    clicks: clicks ?? [],
    total: totalTaps,
    totalClicks: (clicks ?? []).length,
  }
}
