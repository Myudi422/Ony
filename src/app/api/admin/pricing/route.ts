import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getToken } from 'next-auth/jwt'
import { DEFAULT_PRICING, getLivePricing } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

const checkIsAdmin = (token: Record<string, unknown> | null) => {
  if (!token) return false
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'myudi422@gmail.com').toLowerCase().trim()
  if (typeof token.email === 'string' && token.email.toLowerCase().trim() === adminEmail) return true
  return token.role === 'admin' || token.role === 'superadmin'
}

export async function GET() {
  const pricing = await getLivePricing()
  return NextResponse.json(pricing, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!checkIsAdmin(token as Record<string, unknown> | null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { card_base_price, card_promo_price, is_promo_active, cashi_api_key, cashi_webhook_secret } = body

  const currentPricing = await getLivePricing()

  const updatedPricing = {
    card_base_price: Number(card_base_price) || DEFAULT_PRICING.card_base_price,
    card_promo_price: Number(card_promo_price) || DEFAULT_PRICING.card_promo_price,
    is_promo_active: Boolean(is_promo_active),
    cashi_api_key: (cashi_api_key || currentPricing.cashi_api_key || DEFAULT_PRICING.cashi_api_key).trim(),
    cashi_webhook_secret: (cashi_webhook_secret || currentPricing.cashi_webhook_secret || DEFAULT_PRICING.cashi_webhook_secret).trim(),
  }

  // Update in-memory cache immediately
  globalThis.__globalPricingCache = updatedPricing

  const pricingJson = JSON.stringify(updatedPricing)

  // 1. Save to cards table with code '__SYSTEM_PRICING__' (100% guaranteed DB table)
  try {
    const { data: existing } = await supabaseAdmin
      .from('cards')
      .select('id')
      .eq('activation_code', '__SYSTEM_PRICING__')
      .maybeSingle()

    if (existing?.id) {
      await supabaseAdmin
        .from('cards')
        .update({
          card_name: pricingJson,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin
        .from('cards')
        .insert({
          activation_code: '__SYSTEM_PRICING__',
          card_name: pricingJson,
          media_type: 'nfc_card',
          status: 'suspended',
          mode: 'profile',
          total_taps: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
    }
  } catch (e) {
    console.error('Error saving system pricing to cards table:', e)
  }

  // 2. Save to system_settings table as backup
  try {
    const updates = [
      { key: 'card_base_price', value: String(updatedPricing.card_base_price), updated_at: new Date().toISOString() },
      { key: 'card_promo_price', value: String(updatedPricing.card_promo_price), updated_at: new Date().toISOString() },
      { key: 'is_promo_active', value: String(updatedPricing.is_promo_active), updated_at: new Date().toISOString() },
      { key: 'cashi_api_key', value: String(updatedPricing.cashi_api_key), updated_at: new Date().toISOString() },
      { key: 'cashi_webhook_secret', value: String(updatedPricing.cashi_webhook_secret), updated_at: new Date().toISOString() },
    ]
    await supabaseAdmin.from('system_settings').upsert(updates, { onConflict: 'key' })
  } catch (_) {}

  return NextResponse.json({ success: true, updated: updatedPricing })
}
