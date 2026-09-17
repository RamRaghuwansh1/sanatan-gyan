-- Integration completion migration
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scripture_id UUID REFERENCES scriptures(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS payments_order_idx ON payments(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS verses_chapter_idx ON scripture_verses(chapter_id,verse_number);
CREATE INDEX IF NOT EXISTS chapters_scripture_idx ON scripture_chapters(scripture_id,chapter_number);
