-- Migration: portal_template_settings
-- Purpose: Store portal template settings (photos, nav config, etc.) in Supabase
--          instead of __PORTAL_SETTINGS__ blocks inside Notion pages.
--
-- Run this SQL in the Supabase dashboard → SQL Editor before deploying the code.

CREATE TABLE IF NOT EXISTS portal_template_settings (
  page_id     TEXT        PRIMARY KEY,
  settings    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: disable RLS (the API uses the service role key which bypasses it anyway)
ALTER TABLE portal_template_settings DISABLE ROW LEVEL SECURITY;

-- Optional index for faster lookups (table will stay small, but good practice)
CREATE INDEX IF NOT EXISTS idx_portal_template_settings_updated
  ON portal_template_settings (updated_at DESC);
