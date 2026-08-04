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
