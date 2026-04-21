-- Migration: Newsletter batch sending (envio em 2 dias)
-- Run this in Supabase SQL Editor once before deploying the feature.

ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS next_batch_at date;
