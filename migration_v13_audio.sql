CREATE TABLE IF NOT EXISTS record_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  attachment_type TEXT NOT NULL DEFAULT 'AUDIO'
    CHECK (attachment_type IN ('AUDIO','IMAGE','VIDEO','DOCUMENT')),
  title TEXT NOT NULL,
  file_key TEXT,
  external_url TEXT,
  mime_type TEXT,
  public_level TEXT NOT NULL DEFAULT 'PUBLIC'
    CHECK (public_level IN ('PUBLIC','INTERNAL')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_record_attachments_record_id
ON record_attachments(record_id, sort_order, id);
