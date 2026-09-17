-- CMS -> reader -> purchase -> secure-file flow hardening
CREATE INDEX IF NOT EXISTS content_files_scripture_created_idx ON content_files(scripture_id,created_at DESC);
CREATE INDEX IF NOT EXISTS bookmarks_user_created_idx ON bookmarks(user_id,created_at DESC);
