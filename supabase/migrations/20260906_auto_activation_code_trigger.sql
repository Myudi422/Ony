-- Migration: Auto-generate activation_code with card_number prefix on INSERT
-- Ensures every new card inserted gets:
--   1. Sequential card_number from cards_card_number_seq
--   2. Unique activation_code formatted as: {card_number}{5 random alphanumeric characters}
-- Safe and non-destructive:
--   - ONLY fires BEFORE INSERT on new records.
--   - Never alters existing active or unclaimed cards.
--   - Completely eliminates subrequest limits, race conditions, and update timeouts.

CREATE OR REPLACE FUNCTION public.fn_cards_auto_card_number_and_code()
RETURNS TRIGGER AS $$
DECLARE
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_suffix TEXT;
  v_code TEXT;
  j INT;
BEGIN
  -- 1. Ignore internal system records (e.g. __SYSTEM_PRICING__)
  IF NEW.activation_code IS NOT NULL AND NEW.activation_code LIKE '__SYSTEM_%' THEN
    RETURN NEW;
  END IF;

  -- 2. Ensure card_number is assigned from the sequence if not already provided
  IF NEW.card_number IS NULL THEN
    NEW.card_number := nextval('cards_card_number_seq');
  END IF;

  -- 3. If activation_code is null OR does not start with card_number, generate it!
  IF NEW.activation_code IS NULL OR NEW.activation_code NOT LIKE (NEW.card_number::text || '%') THEN
    LOOP
      v_suffix := '';
      FOR j IN 1..5 LOOP
        v_suffix := v_suffix || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
      END LOOP;
      v_code := NEW.card_number::text || v_suffix;

      -- Check uniqueness against cards table
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM cards WHERE activation_code = v_code
      );
    END LOOP;

    NEW.activation_code := v_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if already exists so migration is idempotent
DROP TRIGGER IF EXISTS trg_cards_auto_card_number_and_code ON cards;

CREATE TRIGGER trg_cards_auto_card_number_and_code
BEFORE INSERT ON cards
FOR EACH ROW
EXECUTE FUNCTION public.fn_cards_auto_card_number_and_code();
