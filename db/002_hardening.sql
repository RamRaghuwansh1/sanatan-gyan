-- Sanatan Gyan V2 hardening migration
CREATE INDEX IF NOT EXISTS users_telegram_idx ON users(telegram_user_id);
CREATE INDEX IF NOT EXISTS scriptures_status_idx ON scriptures(status);
CREATE INDEX IF NOT EXISTS entitlements_user_status_idx ON entitlements(user_id,status);
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at=NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS scriptures_updated_at ON scriptures;
CREATE TRIGGER scriptures_updated_at BEFORE UPDATE ON scriptures FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE orders ADD COLUMN IF NOT EXISTS scripture_id UUID REFERENCES scriptures(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_scripture_idx ON orders(scripture_id);
