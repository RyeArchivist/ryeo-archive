-- 생활환경기록보존원 / 慮 記錄網 게시판 데이터베이스

CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_no TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT '미상',
  record_type TEXT NOT NULL DEFAULT '未分類',
  risk_level TEXT NOT NULL DEFAULT '평가 불가',
  status TEXT NOT NULL DEFAULT '분석 중',
  assigned_to TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_records_published_created
ON records(is_published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_records_record_no
ON records(record_no);


-- 첨부자료 (v13 AUDIO MASTER)
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
