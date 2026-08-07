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
function requireAdmin(context) {
  const email = clean(context.request.headers.get('Cf-Access-Authenticated-User-Email'), 320).toLowerCase();
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

export async function onRequestPost(context) {
  const auth = requireAdmin(context);
  if (auth.error) return auth.error;

  try {
    await ensureAttachmentTable(context.env);

    // 오래된 임시 레코드는 새 임시 레코드 생성 시 정리한다.
    // R2 바인딩이 있으면 연결 파일도 같이 지운다.
    try {
      const stale = await context.env.DB.prepare(`
        SELECT id FROM records
        WHERE record_no LIKE 'DRAFT-%'
          AND datetime(created_at) < datetime('now','-24 hours')
        LIMIT 50
      `).all();

      for (const row of (stale.results || [])) {
        const media = await context.env.DB.prepare(
          `SELECT file_key FROM record_attachments WHERE record_id=? AND file_key IS NOT NULL`
        ).bind(row.id).all();

        if (context.env.MEDIA) {
          await Promise.all((media.results || []).map(item => context.env.MEDIA.delete(item.file_key)));
        }
        await context.env.DB.prepare(`DELETE FROM record_attachments WHERE record_id=?`).bind(row.id).run();
        await context.env.DB.prepare(`DELETE FROM records WHERE id=?`).bind(row.id).run();
      }
    } catch (_) {}

    const draftNo = `DRAFT-${crypto.randomUUID()}`;
    const result = await context.env.DB.prepare(`
      INSERT INTO records
      (record_no, title, region, record_type, risk_level, status, assigned_to, summary, content, is_published, created_at, updated_at)
      VALUES (?, '임시 기록', '미상', '未分類', '평가 불가', '분석 중', '', '', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(draftNo).run();

    return json({
      ok: true,
      id: result.meta?.last_row_id,
      record_no: draftNo,
      admin: auth.email
    }, 201);
  } catch (error) {
    return json({ error: '첨부용 임시 기록을 만들지 못했습니다.', detail: error.message }, 500);
  }
}
