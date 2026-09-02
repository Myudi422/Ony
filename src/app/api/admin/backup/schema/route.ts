import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

const checkIsAdmin = (token: Record<string, unknown> | null) => {
  if (!token) return false
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  if (adminEmail && typeof token.email === 'string' && token.email.toLowerCase().trim() === adminEmail) return true
  return token.role === 'admin' || token.role === 'superadmin'
}

const SCHEMA_SQL = `-- ============================================================
-- Ony Platform — PostgreSQL Database Schema (DDL Only)
-- Import this to create a fresh empty database for Ony v2
-- Run this in Supabase SQL Editor AFTER creating a new project
-- ============================================================

-- ── Enable UUID extension ─────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  name         TEXT,
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'admin' | 'superadmin'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);

-- ── 2. cards ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_code TEXT UNIQUE NOT NULL,
  user_id         UUID REFERENCES users (id) ON DELETE SET NULL,
  card_name       TEXT NOT NULL DEFAULT 'NFC + QR Smart Media',
  media_type      TEXT NOT NULL DEFAULT 'nfc_qr', -- 'nfc_qr' | 'qr_only' | 'nfc_only'
  status          TEXT NOT NULL DEFAULT 'unclaimed', -- 'unclaimed' | 'active' | 'suspended'
  mode            TEXT NOT NULL DEFAULT 'profile',   -- 'profile' | 'redirect'
  redirect_url    TEXT,         -- NULL = paid; 'UNPAID' = belum bayar; URL = redirect mode
  payment_status  TEXT DEFAULT 'paid',
  total_taps      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_activation_code ON cards (activation_code);
CREATE INDEX IF NOT EXISTS idx_cards_user_id         ON cards (user_id);
CREATE INDEX IF NOT EXISTS idx_cards_status          ON cards (status);
CREATE INDEX IF NOT EXISTS idx_cards_created_at      ON cards (created_at DESC);

-- ── 3. links ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS links (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id   UUID REFERENCES cards (id) ON DELETE CASCADE,
  user_id   UUID REFERENCES users (id) ON DELETE CASCADE,
  type      TEXT,        -- 'url' | 'phone' | 'email' | 'instagram' | etc.
  url       TEXT,
  label     TEXT,
  icon_type TEXT,
  "order"   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_links_card_id ON links (card_id);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links (user_id);

-- ── 4. tap_logs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tap_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    UUID REFERENCES cards (id) ON DELETE CASCADE,
  ip         TEXT,
  user_agent TEXT,
  country    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tap_logs_card_id    ON tap_logs (card_id);
CREATE INDEX IF NOT EXISTS idx_tap_logs_created_at ON tap_logs (created_at DESC);

-- ── 5. orders ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users (id) ON DELETE SET NULL,
  card_id        UUID REFERENCES cards (id) ON DELETE SET NULL,
  amount         BIGINT NOT NULL DEFAULT 0,  -- in IDR (rupiah)
  status         TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'failed' | 'expired'
  payment_method TEXT,
  external_id    TEXT,   -- payment gateway order ID
  snap_token     TEXT,   -- Midtrans snap token
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- ── 6. admin_audit_logs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    TEXT NOT NULL,
  action      TEXT NOT NULL,     -- e.g. 'DELETE_CARDS' | 'DATABASE_BACKUP'
  target_type TEXT,              -- e.g. 'CARD' | 'USER' | 'SYSTEM'
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin_id   ON admin_audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON admin_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_logs (created_at DESC);

-- ── 7. admin_settings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Auto-update updated_at trigger ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_cards
    BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_orders
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Row Level Security (RLS) ──────────────────────────────────────────────────
-- Enable RLS on all tables (service role bypasses these)
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards             ENABLE ROW LEVEL SECURITY;
ALTER TABLE links             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tap_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings    ENABLE ROW LEVEL SECURITY;

-- Public read for active cards (for QR redirect)
CREATE POLICY IF NOT EXISTS "public_read_active_cards"
  ON cards FOR SELECT
  USING (status = 'active');

-- ── Done ──────────────────────────────────────────────────────────────────────
-- After running this script:
-- 1. Set environment variables in your new project (.env.local / Vercel)
-- 2. Configure ADMIN_EMAIL, NEXTAUTH_SECRET, NEXTAUTH_URL
-- 3. Configure Supabase URL + keys
-- 4. Deploy and test
`

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!checkIsAdmin(token as Record<string, unknown> | null)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `ony_schema_${ts}.sql`

  return new NextResponse(SCHEMA_SQL, {
    status: 200,
    headers: {
      'Content-Type': 'application/sql',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
