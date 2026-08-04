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
    const id = clean(context.params.id, 80);
    const row = await context.env.DB.prepare(`
      SELECT id, record_no, title, region, record_type, risk_level, status, assigned_to, summary, content, created_at, updated_at
      FROM records WHERE is_published = 1 AND (CAST(id AS TEXT) = ? OR record_no = ?) LIMIT 1
    `).bind(id, id).first();
    if (!row) return json({ error: '공개된 기록을 찾을 수 없습니다.' }, 404);
    return json({ record: row });
  } catch (error) {
    return json({ error: '기록을 불러오지 못했습니다.', detail: error.message }, 500);
  }
}
