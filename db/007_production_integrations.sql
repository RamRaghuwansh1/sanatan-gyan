-- Production webhook idempotency and Telegram update replay protection.
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS telegram_updates (
  update_id BIGINT PRIMARY KEY,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payment_webhook_events_received_idx ON payment_webhook_events(received_at DESC);
CREATE INDEX IF NOT EXISTS telegram_updates_received_idx ON telegram_updates(received_at DESC);
