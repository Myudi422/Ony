-- ============================================================
-- Migration: Optimize Tap Logging for Free Tier Database (Zero Tap Logs)
-- Description: Disables row insertion in tap_logs to save DB space on Supabase free tier.
--              Only increments cards.total_taps counter.
-- Run in: Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_card_tap(
    p_card_id      UUID,
    p_access_method TEXT DEFAULT 'nfc_tap',
    p_ip           TEXT DEFAULT '127.0.0.1',
    p_ua           TEXT DEFAULT 'Browser',
    p_user_id      UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Atomic counter increment only (no tap_logs row insertion to conserve Supabase free tier storage)
    UPDATE public.cards
    SET total_taps = COALESCE(total_taps, 0) + 1
    WHERE id = p_card_id;
EXCEPTION WHEN OTHERS THEN
    -- Silently ignore to ensure user redirect is never blocked
    NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_card_tap(UUID, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_card_tap(UUID, TEXT, TEXT, TEXT, UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION public.log_card_tap(UUID, TEXT, TEXT, TEXT, UUID) TO service_role;
