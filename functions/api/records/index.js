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

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const query = clean(url.searchParams.get('q'), 500);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 500);
    let stmt;
    if (query) {
      const q = `%${query}%`;
      stmt = context.env.DB.prepare(`
        SELECT id, record_no, title, region, record_type, risk_level, status, assigned_to, summary, created_at, updated_at
        FROM records
        WHERE is_published = 1 AND (record_no LIKE ? OR title LIKE ? OR region LIKE ?)
        ORDER BY created_at DESC LIMIT ?
      `).bind(q, q, q, limit);
    } else {
      stmt = context.env.DB.prepare(`
        SELECT id, record_no, title, region, record_type, risk_level, status, assigned_to, summary, created_at, updated_at
        FROM records WHERE is_published = 1 ORDER BY created_at DESC LIMIT ?
      `).bind(limit);
    }
    const result = await stmt.all();
    return json({ records: result.results || [] });
  } catch (error) {
    return json({ error: '기록 목록을 불러오지 못했습니다.', detail: error.message }, 500);
  }
}
