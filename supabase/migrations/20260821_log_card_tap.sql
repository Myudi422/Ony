-- Migration: High-Performance Atomic Tap Logging & Indexing for Ony NFC/QR
-- Execute this SQL script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Create performance indexes for instant card resolution (<2ms lookup)
CREATE INDEX IF NOT EXISTS idx_cards_activation_code ON cards (UPPER(activation_code));
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards (user_id);
CREATE INDEX IF NOT EXISTS idx_tap_logs_card_id ON tap_logs (card_id);

-- 2. Stored Procedure for Atomic Tap Logging & Counter Increment
CREATE OR REPLACE FUNCTION log_card_tap(
    p_card_id UUID,
    p_access_method TEXT DEFAULT 'nfc_tap',
    p_ip TEXT DEFAULT '127.0.0.1',
    p_ua TEXT DEFAULT 'Browser',
    p_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Atomic counter increment (prevents race condition & row locking issues)
    UPDATE cards 
    SET total_taps = COALESCE(total_taps, 0) + 1 
    WHERE id = p_card_id;

    -- Insert access telemetry log
    INSERT INTO tap_logs (card_id, access_method, ip_address, user_agent, tapped_at, user_id)
    VALUES (p_card_id, p_access_method, p_ip, p_ua, NOW(), p_user_id);

EXCEPTION WHEN OTHERS THEN
    -- Fallback: If insert with user_id fails (e.g. FK constraint), try inserting without user_id
    BEGIN
        INSERT INTO tap_logs (card_id, access_method, ip_address, user_agent, tapped_at)
        VALUES (p_card_id, p_access_method, p_ip, p_ua, NOW());
    EXCEPTION WHEN OTHERS THEN
        -- Ignore telemetry failure to ensure user redirect is never blocked
        NULL;
    END;
END;
$$;
