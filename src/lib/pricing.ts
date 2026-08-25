import { supabaseAdmin } from '@/lib/supabase'

export const DEFAULT_PRICING = {
  card_base_price: 49000,
  card_promo_price: 39000,
  is_promo_active: false,
  cashi_api_key: process.env.CASHI_API_KEY || '7576626ad46a47041a3dc4b6e133d6abb33a8dbb58ae8b706731c5fffa806dfa',
  cashi_webhook_secret: process.env.CASHI_WEBHOOK_SECRET || 'sk_b3e73f271e3c0a68fc65168d14920e7b',
}

export type PricingConfig = typeof DEFAULT_PRICING

declare global {
  // eslint-disable-next-line no-var
  var __globalPricingCache: PricingConfig | undefined
}

export async function getLivePricing(): Promise<PricingConfig> {
  // 1. Try reading from cards table using '__SYSTEM_PRICING__' key (100% guaranteed DB table)
  try {
    const { data: configCard } = await supabaseAdmin
      .from('cards')
      .select('card_name')
      .eq('activation_code', '__SYSTEM_PRICING__')
      .maybeSingle()

    if (configCard?.card_name) {
      const parsed = JSON.parse(configCard.card_name)
      if (typeof parsed.card_base_price === 'number') {
        const pricing: PricingConfig = {
          card_base_price: typeof parsed.card_base_price === 'number' && parsed.card_base_price >= 1 ? parsed.card_base_price : DEFAULT_PRICING.card_base_price,
          card_promo_price: typeof parsed.card_promo_price === 'number' && parsed.card_promo_price >= 1 ? parsed.card_promo_price : DEFAULT_PRICING.card_promo_price,
          is_promo_active: Boolean(parsed.is_promo_active),
          cashi_api_key: String(parsed.cashi_api_key || DEFAULT_PRICING.cashi_api_key),
          cashi_webhook_secret: String(parsed.cashi_webhook_secret || DEFAULT_PRICING.cashi_webhook_secret),
        }
        globalThis.__globalPricingCache = pricing
        return pricing
      }
    }
  } catch (_) {}

  // 2. Try reading from system_settings as fallback
  try {
    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .in('key', ['card_base_price', 'card_promo_price', 'is_promo_active', 'cashi_api_key', 'cashi_webhook_secret'])

    if (data && data.length > 0) {
      const pricing: PricingConfig = { ...DEFAULT_PRICING }
      for (const item of data) {
        if (item.key === 'card_base_price') pricing.card_base_price = Number(item.value) || DEFAULT_PRICING.card_base_price
        if (item.key === 'card_promo_price') pricing.card_promo_price = Number(item.value) || DEFAULT_PRICING.card_promo_price
        if (item.key === 'is_promo_active') pricing.is_promo_active = item.value === 'true' || item.value === true
        if (item.key === 'cashi_api_key') pricing.cashi_api_key = String(item.value) || DEFAULT_PRICING.cashi_api_key
        if (item.key === 'cashi_webhook_secret') pricing.cashi_webhook_secret = String(item.value) || DEFAULT_PRICING.cashi_webhook_secret
      }
      globalThis.__globalPricingCache = pricing
      return pricing
    }
  } catch (_) {}

  // 3. Fallback to in-memory cache or default
  return globalThis.__globalPricingCache ?? DEFAULT_PRICING
}
