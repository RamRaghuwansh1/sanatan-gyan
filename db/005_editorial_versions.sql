-- Granular CMS editing + content file replacement/version history
ALTER TABLE content_files
  ADD COLUMN IF NOT EXISTS version_number INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS replaced_file_id UUID REFERENCES content_files(id) ON DELETE SET NULL;

-- Existing rows are current by default. Only one current file is allowed per scripture.
CREATE INDEX IF NOT EXISTS content_files_current_idx ON content_files(scripture_id,is_current,created_at DESC);
CREATE INDEX IF NOT EXISTS content_files_replacement_idx ON content_files(replaced_file_id);

-- Normalize legacy uploads: only the newest file per scripture remains current.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY scripture_id ORDER BY created_at DESC,id DESC) AS rn
  FROM content_files
)
UPDATE content_files cf SET is_current=(r.rn=1)
FROM ranked r WHERE r.id=cf.id;

-- Ensure publishing and reader flows count/select only the current verified file.
CREATE INDEX IF NOT EXISTS content_files_current_private_idx ON content_files(scripture_id,is_private,is_current,created_at DESC);
