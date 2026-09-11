-- Migration: Add optional complaint_wa column for Smart Review Gatekeeper
-- Run this in Supabase SQL Editor:
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS complaint_wa TEXT;
