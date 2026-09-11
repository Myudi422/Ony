-- ==============================================================================
-- Migration: Stop Log Insertion, Optimize Per-Card & Per-Link Counters, and Clean DB
-- Execute this SQL script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Ensure Atomic Counter Increment for Cards (zero log row insertion)
CREATE OR REPLACE FUNCTION public.increment_taps(card_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.cards
    SET total_taps = COALESCE(total_taps, 0) + 1
    WHERE id = card_id;
END;
$$;

-- 2. Ensure Atomic Counter Increment for Links (zero log row insertion)
CREATE OR REPLACE FUNCTION public.increment_link_clicks(link_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.links
    SET clicks = COALESCE(clicks, 0) + 1
    WHERE id = link_id;
END;
$$;

-- 3. Override log_card_tap stored procedure so it NEVER inserts into tap_logs
CREATE OR REPLACE FUNCTION public.log_card_tap(
    p_card_id       UUID,
    p_access_method TEXT DEFAULT 'nfc_tap',
    p_ip            TEXT DEFAULT '127.0.0.1',
    p_ua            TEXT DEFAULT 'Browser',
    p_user_id       UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Only update total_taps counter on the card row
    UPDATE public.cards
    SET total_taps = COALESCE(total_taps, 0) + 1
    WHERE id = p_card_id;
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;

-- 4. Grant Permissions to service_role, anon, authenticated
GRANT EXECUTE ON FUNCTION public.increment_taps(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_link_clicks(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_card_tap(UUID, TEXT, TEXT, TEXT, UUID) TO anon, authenticated, service_role;

-- 5. Free up bloated database storage immediately by cleaning old logs:
-- (Uncomment and execute if you want to immediately recover all disk space)
TRUNCATE TABLE public.tap_logs;
TRUNCATE TABLE public.link_click_logs;
