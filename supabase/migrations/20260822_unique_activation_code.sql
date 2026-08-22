-- Migration: Unique activation_code + Sequential card_number
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
--
-- Safe for existing printed codes:
--   - activation_code: adds UNIQUE constraint, does NOT change existing values
--   - card_number: new auto-increment column, backfills existing rows in created_at order

-- ─────────────────────────────────────────────
-- 1. Add UNIQUE constraint on activation_code
--    (Idempotent: safe to run multiple times)
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cards_activation_code_unique'
      AND conrelid = 'cards'::regclass
  ) THEN
    ALTER TABLE cards
      ADD CONSTRAINT cards_activation_code_unique UNIQUE (activation_code);
  END IF;
END;
$$;

-- ─────────────────────────────────────────────
-- 2. Add card_number (auto-increment, urutan cetak)
--    Existing rows will be back-filled in created_at order.
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'card_number'
  ) THEN
    -- Add the column (nullable first so backfill can happen)
    ALTER TABLE cards ADD COLUMN card_number BIGINT;

    -- Back-fill: assign sequential numbers ordered by created_at
    WITH ordered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
      FROM cards
    )
    UPDATE cards
    SET card_number = ordered.rn
    FROM ordered
    WHERE cards.id = ordered.id;

    -- Now add sequence for future inserts
    CREATE SEQUENCE IF NOT EXISTS cards_card_number_seq;

    -- Set sequence to start after the highest existing number
    PERFORM setval(
      'cards_card_number_seq',
      COALESCE((SELECT MAX(card_number) FROM cards), 0) + 1,
      false
    );

    -- Set default to use the sequence
    ALTER TABLE cards
      ALTER COLUMN card_number SET DEFAULT nextval('cards_card_number_seq');

    -- Add UNIQUE constraint
    ALTER TABLE cards
      ADD CONSTRAINT cards_card_number_unique UNIQUE (card_number);

    -- Ownership so sequence drops with table
    ALTER SEQUENCE cards_card_number_seq OWNED BY cards.card_number;
  END IF;
END;
$$;
