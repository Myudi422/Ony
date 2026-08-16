import { supabaseAdmin } from '@/lib/supabase'

export const DEFAULT_PRICING = {
  card_base_price: 49000,
  card_promo_price: 39000,
  is_promo_active: false,
}

declare global {
  // eslint-disable-next-line no-var
  var __globalPricingCache: { card_base_price: number; card_promo_price: number; is_promo_active: boolean } | undefined
}

export async function getLivePricing() {
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
        const pricing = {
          card_base_price: Number(parsed.card_base_price) || DEFAULT_PRICING.card_base_price,
          card_promo_price: Number(parsed.card_promo_price) || DEFAULT_PRICING.card_promo_price,
          is_promo_active: Boolean(parsed.is_promo_active),
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
      .in('key', ['card_base_price', 'card_promo_price', 'is_promo_active'])

    if (data && data.length > 0) {
      const pricing: Record<string, unknown> = { ...DEFAULT_PRICING }
      for (const item of data) {
        if (item.key === 'card_base_price') pricing.card_base_price = Number(item.value) || DEFAULT_PRICING.card_base_price
        if (item.key === 'card_promo_price') pricing.card_promo_price = Number(item.value) || DEFAULT_PRICING.card_promo_price
        if (item.key === 'is_promo_active') pricing.is_promo_active = item.value === 'true' || item.value === true
      }
      globalThis.__globalPricingCache = pricing as typeof DEFAULT_PRICING
      return pricing
    }
  } catch (_) {}

  // 3. Fallback to in-memory cache or default
  return globalThis.__globalPricingCache ?? DEFAULT_PRICING
}
