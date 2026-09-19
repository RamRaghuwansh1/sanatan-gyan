-- Production admin dashboard indexes and editorial checklist support
CREATE INDEX IF NOT EXISTS payments_status_created_idx ON payments(status,created_at DESC);
CREATE INDEX IF NOT EXISTS entitlements_scripture_status_idx ON entitlements(scripture_id,status,granted_at DESC);
CREATE INDEX IF NOT EXISTS telegram_settings_updated_idx ON telegram_settings(updated_at DESC);
