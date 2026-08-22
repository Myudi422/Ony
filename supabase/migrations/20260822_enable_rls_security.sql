-- ============================================================
-- Migration: Enable RLS + Security Hardening (FINAL - Schema Verified)
-- Run in: Supabase SQL Editor
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================
-- Schema confirmed via information_schema.columns:
--
-- cards:           id, user_id, card_name, activation_code, media_type,
--                  mode, redirect_url, status, total_taps, card_number
-- users:           id, email, name, avatar_url, role, status
-- links:           id, card_id, title, url, icon, sort_order, is_active, clicks
--                  *** NO user_id — ownership via card_id → cards.user_id ***
-- orders:          id, user_id, order_number, items, total_amount, status
-- transactions:    id, order_id, payment_type, gross_amount, transaction_status
--                  *** NO user_id — ownership via order_id → orders.user_id ***
-- tap_logs:        id, card_id, access_method, ip_address, user_agent, tapped_at
--                  *** NO user_id ***
-- link_click_logs: id, link_id, card_id, clicked_at
--                  *** NO user_id ***
-- admin_audit_logs: id, admin_id, action, target_type, target_id, details
-- ============================================================


-- ============================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.cards             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tap_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_click_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs  ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 2. RLS POLICIES — public.cards
-- ============================================================

DROP POLICY IF EXISTS "cards_public_read_active" ON public.cards;
DROP POLICY IF EXISTS "cards_owner_read_own"     ON public.cards;
DROP POLICY IF EXISTS "cards_owner_update_own"   ON public.cards;

-- Anon: read active/unclaimed cards for NFC redirect
CREATE POLICY "cards_public_read_active"
  ON public.cards FOR SELECT
  TO anon
  USING (status IN ('active', 'unclaimed'));

-- Authenticated: read own cards
CREATE POLICY "cards_owner_read_own"
  ON public.cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Authenticated: update own cards
CREATE POLICY "cards_owner_update_own"
  ON public.cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 3. RLS POLICIES — public.users
-- ============================================================

DROP POLICY IF EXISTS "users_owner_read_own"   ON public.users;
DROP POLICY IF EXISTS "users_owner_update_own" ON public.users;

CREATE POLICY "users_owner_read_own"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_owner_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ============================================================
-- 4. RLS POLICIES — public.links
-- ============================================================
-- Schema: id, card_id, title, url, icon, sort_order, is_active, clicks
-- NO user_id → ownership via card_id → cards.user_id

DROP POLICY IF EXISTS "links_public_read_active" ON public.links;
DROP POLICY IF EXISTS "links_owner_all"          ON public.links;

-- Public: read links for active cards (for profile page)
CREATE POLICY "links_public_read_active"
  ON public.links FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = card_id AND c.status = 'active'
    )
  );

-- Owners: CRUD own links via card ownership
CREATE POLICY "links_owner_all"
  ON public.links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = card_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = card_id AND c.user_id = auth.uid()
    )
  );


-- ============================================================
-- 5. RLS POLICIES — public.orders
-- ============================================================
-- Schema: id, user_id, order_number, items, total_amount, status ✓

DROP POLICY IF EXISTS "orders_owner_read_own" ON public.orders;

CREATE POLICY "orders_owner_read_own"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 6. RLS POLICIES — public.transactions
-- ============================================================
-- Schema: id, order_id, payment_type, gross_amount, transaction_status
-- NO user_id → ownership via order_id → orders.user_id

DROP POLICY IF EXISTS "transactions_owner_read_own" ON public.transactions;

CREATE POLICY "transactions_owner_read_own"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );


-- ============================================================
-- 7. RLS POLICIES — public.tap_logs
-- ============================================================
-- Schema: id, card_id, access_method, ip_address, user_agent, tapped_at
-- NO user_id → ownership via card_id → cards.user_id

DROP POLICY IF EXISTS "tap_logs_owner_read" ON public.tap_logs;

CREATE POLICY "tap_logs_owner_read"
  ON public.tap_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = card_id AND c.user_id = auth.uid()
    )
  );


-- ============================================================
-- 8. RLS POLICIES — public.link_click_logs
-- ============================================================
-- Schema: id, link_id, card_id, clicked_at
-- NO user_id → ownership via card_id → cards.user_id

DROP POLICY IF EXISTS "link_click_logs_owner_read" ON public.link_click_logs;

CREATE POLICY "link_click_logs_owner_read"
  ON public.link_click_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = card_id AND c.user_id = auth.uid()
    )
  );


-- ============================================================
-- 9. RLS POLICIES — public.admin_audit_logs
-- ============================================================
-- No public access — service_role (admin API) only

DROP POLICY IF EXISTS "admin_audit_logs_deny_all" ON public.admin_audit_logs;

CREATE POLICY "admin_audit_logs_deny_all"
  ON public.admin_audit_logs FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);


-- ============================================================
-- 10. FIX log_card_tap FUNCTION
-- ============================================================
-- tap_logs has NO user_id column — remove it from INSERT.
-- Also add SET search_path = '' to fix "Function Search Path Mutable".

CREATE OR REPLACE FUNCTION public.log_card_tap(
    p_card_id      UUID,
    p_access_method TEXT DEFAULT 'nfc_tap',
    p_ip           TEXT DEFAULT '127.0.0.1',
    p_ua           TEXT DEFAULT 'Browser',
    p_user_id      UUID DEFAULT NULL   -- kept as param for API compat, ignored in INSERT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Atomic counter increment
    UPDATE public.cards
    SET total_taps = COALESCE(total_taps, 0) + 1
    WHERE id = p_card_id;

    -- Insert telemetry (tap_logs has no user_id column)
    INSERT INTO public.tap_logs (card_id, access_method, ip_address, user_agent, tapped_at)
    VALUES (p_card_id, p_access_method, p_ip, p_ua, NOW());

EXCEPTION WHEN OTHERS THEN
    -- Silently ignore telemetry failure so user redirect is never blocked
    NULL;
END;
$$;


-- ============================================================
-- 11. FIX increment_taps / increment_link_clicks (if exist)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE p.proname = 'increment_taps' AND n.nspname = 'public') THEN
    EXECUTE $f$
      CREATE OR REPLACE FUNCTION public.increment_taps(card_id UUID)
      RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
      AS $fn$
      BEGIN
        UPDATE public.cards SET total_taps = COALESCE(total_taps, 0) + 1 WHERE id = card_id;
      END;
      $fn$
    $f$;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE p.proname = 'increment_link_clicks' AND n.nspname = 'public') THEN
    EXECUTE $f$
      CREATE OR REPLACE FUNCTION public.increment_link_clicks(link_id UUID)
      RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
      AS $fn$
      BEGIN
        UPDATE public.links SET clicks = COALESCE(clicks, 0) + 1 WHERE id = link_id;
      END;
      $fn$
    $f$;
  END IF;
END;
$$;


-- ============================================================
-- 12. REVOKE PUBLIC EXECUTE ON SECURITY DEFINER FUNCTIONS
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.log_card_tap(UUID, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_card_tap(UUID, TEXT, TEXT, TEXT, UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION public.log_card_tap(UUID, TEXT, TEXT, TEXT, UUID) TO service_role;


-- ============================================================
-- 13. SAFE PUBLIC VIEW (hides sensitive columns from anon)
-- ============================================================

DROP VIEW IF EXISTS public.cards_public;

CREATE VIEW public.cards_public AS
  SELECT id, activation_code, card_name, status, mode, media_type, total_taps, card_number
  FROM public.cards
  WHERE status = 'active';

GRANT SELECT ON public.cards_public TO anon, authenticated;


-- ============================================================
-- Done. Verify: Supabase Dashboard → Authentication → Policies
-- ============================================================
