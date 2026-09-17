-- Sanatan Gyan V2 — PostgreSQL initial schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('USER','EDITOR','TELEGRAM_ADMIN','SUPER_ADMIN');
CREATE TYPE payment_status AS ENUM ('CREATED','AUTHORIZED','CAPTURED','FAILED','REFUNDED');
CREATE TYPE entitlement_status AS ENUM ('ACTIVE','REVOKED','EXPIRED');
CREATE TYPE publication_status AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  password_hash TEXT,
  role user_role NOT NULL DEFAULT 'USER',
  telegram_user_id TEXT UNIQUE,
  language TEXT NOT NULL DEFAULT 'hi',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE scripture_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_hi TEXT NOT NULL,
  name_en TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE scriptures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES scripture_categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title_hi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_hi TEXT,
  description_en TEXT,
  author_tradition TEXT,
  edition TEXT,
  language TEXT NOT NULL DEFAULT 'hi',
  rights_status TEXT,
  price_inr INT NOT NULL DEFAULT 9,
  status publication_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scripture_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scripture_id UUID NOT NULL REFERENCES scriptures(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title_hi TEXT,
  title_en TEXT,
  UNIQUE(scripture_id, chapter_number)
);

CREATE TABLE scripture_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES scripture_chapters(id) ON DELETE CASCADE,
  verse_number INT NOT NULL,
  text_hi TEXT,
  text_en TEXT,
  source_reference TEXT,
  UNIQUE(chapter_id, verse_number)
);

CREATE TABLE content_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scripture_id UUID REFERENCES scriptures(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  checksum_sha256 TEXT,
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  razorpay_order_id TEXT UNIQUE,
  amount_inr INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'CREATED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  amount_inr INT NOT NULL,
  status payment_status NOT NULL,
  raw_event_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scripture_id UUID NOT NULL REFERENCES scriptures(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  status entitlement_status NOT NULL DEFAULT 'ACTIVE',
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, scripture_id)
);

CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verse_id UUID NOT NULL REFERENCES scripture_verses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, verse_id)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE telegram_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO scripture_categories (slug, name_hi, name_en, sort_order) VALUES
('bhagavad-gita','श्रीमद्भगवद्गीता','Bhagavad Gita',1),
('ramayan','रामायण','Ramayan',2),
('mahabharat','महाभारत','Mahabharat',3),
('ved','वेद','Vedas',4),
('puran','पुराण','Puranas',5),
('upanishad','उपनिषद्','Upanishads',6)
ON CONFLICT (slug) DO NOTHING;

-- Admin Telegram IDs from the master specification are role assignments, not secrets.
INSERT INTO app_settings(key,value) VALUES
('admin_telegram_ids','["7727895919","7656030450"]'::jsonb)
ON CONFLICT (key) DO NOTHING;
