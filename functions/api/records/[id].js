const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function clean(value, max = 10000) {
  return String(value ?? '').trim().slice(0, max);
}

function getAdminEmail(context) {
  return clean(context.request.headers.get('Cf-Access-Authenticated-User-Email'), 320).toLowerCase();
}

function requireAdmin(context) {
  const email = getAdminEmail(context);
  if (!email) return { error: json({ error: '관리자 인증이 필요합니다.' }, 401) };
  const allowed = clean(context.env.ADMIN_EMAIL, 320).toLowerCase();
  if (allowed && email !== allowed) return { error: json({ error: '허용되지 않은 관리자 계정입니다.' }, 403) };
  return { email };
}


async function ensureAttachmentTable(env){
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS record_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      attachment_type TEXT NOT NULL,
      title TEXT NOT NULL,
      file_key TEXT,
      external_url TEXT,
      mime_type TEXT,
      public_level TEXT NOT NULL DEFAULT 'PUBLIC',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
    )
  `).run();
}

export async function onRequestGet(context) {
  try {
    const id = clean(context.params.id, 80);
    const row = await context.env.DB.prepare(`
      SELECT id, record_no, title, region, record_type, risk_level, status, assigned_to, summary, content, created_at, updated_at
      FROM records WHERE is_published = 1 AND (CAST(id AS TEXT) = ? OR record_no = ?) LIMIT 1
    `).bind(id, id).first();
    if (!row) return json({ error: '공개된 기록을 찾을 수 없습니다.' }, 404);

    let attachments = [];
    try { await ensureAttachmentTable(context.env); } catch (_) {}
    try {
      const result = await context.env.DB.prepare(`
        SELECT id, attachment_type, title, file_key, external_url, mime_type, sort_order
        FROM record_attachments
        WHERE record_id = ? AND public_level = 'PUBLIC'
        ORDER BY sort_order ASC, id ASC
      `).bind(row.id).all();

      attachments = (result.results || []).map((item) => ({
        id: item.id,
        type: item.attachment_type,
        title: item.title,
        mime_type: item.mime_type,
        url: item.file_key
          ? `/api/media?key=${encodeURIComponent(item.file_key)}`
          : item.external_url
      }));
    } catch (_) {
      // Existing databases that have not applied the v13 migration still open records normally.
      attachments = [];
    }

    return json({ record: row, attachments });
  } catch (error) {
    return json({ error: '기록을 불러오지 못했습니다.', detail: error.message }, 500);
  }
}
