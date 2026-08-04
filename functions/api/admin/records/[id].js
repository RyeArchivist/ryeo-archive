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


const ALLOWED_TYPES = new Set(['現象', '個體', '物件', '傳染', '記錄', '未分類']);
const ALLOWED_RISKS = new Set(['평가 불가', '접근 제한', '기록 오염', '인명 위험']);
const ALLOWED_STATUSES = new Set(['관찰 중', '분석 중', '회수 대기', '회수 완료', '열람 금지', '회수 기록 없음']);

function normalizeType(value) {
  const parts = clean(value, 100)
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return '未分類';
  if (parts.some((part) => !ALLOWED_TYPES.has(part))) return null;
  if (parts.includes('未分類') && parts.length > 1) return null;
  return [...new Set(parts)].join(' / ');
}

function normalizeChoice(value, allowed, fallback) {
  const cleaned = clean(value, 100) || fallback;
  return allowed.has(cleaned) ? cleaned : null;
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
  const auth = requireAdmin(context);
  if (auth.error) return auth.error;
  const id = clean(context.params.id, 80);
  const row = await context.env.DB.prepare(`SELECT * FROM records WHERE CAST(id AS TEXT) = ? OR record_no = ? LIMIT 1`).bind(id, id).first();
  if (!row) return json({ error: '기록을 찾을 수 없습니다.' }, 404);
  return json({ record: row, admin: auth.email });
}

export async function onRequestPut(context) {
  const auth = requireAdmin(context);
  if (auth.error) return auth.error;
  try {
    const id = clean(context.params.id, 80);
    const body = await context.request.json();
    const recordNo = clean(body.record_no, 80);
    const title = clean(body.title, 200);
    if (!recordNo || !title) return json({ error: '기록번호와 제목은 필수입니다.' }, 400);
    const recordType = normalizeType(body.record_type);
    const riskLevel = normalizeChoice(body.risk_level, ALLOWED_RISKS, '평가 불가');
    const recordStatus = normalizeChoice(body.status, ALLOWED_STATUSES, '분석 중');
    if (!recordType || !riskLevel || !recordStatus) return json({ error: '허용되지 않은 분류 값입니다.' }, 400);
    const result = await context.env.DB.prepare(`
      UPDATE records SET
        record_no=?, title=?, region=?, record_type=?, risk_level=?, status=?, assigned_to=?, summary=?, content=?, is_published=?, updated_at=CURRENT_TIMESTAMP
      WHERE CAST(id AS TEXT) = ? OR record_no = ?
    `).bind(
      recordNo, title, clean(body.region,100)||'미상', recordType,
      riskLevel, recordStatus, clean(body.assigned_to,200),
      clean(body.summary,1000), clean(body.content,30000), body.is_published ? 1 : 0, id, id
    ).run();
    if (!result.meta?.changes) return json({ error: '기록을 찾을 수 없습니다.' }, 404);
    return json({ ok: true, admin: auth.email });
  } catch (error) {
    const message = String(error.message || '');
    if (message.includes('UNIQUE')) return json({ error: '이미 존재하는 기록번호입니다.' }, 409);
    return json({ error: '기록을 수정하지 못했습니다.', detail: message }, 500);
  }
}

export async function onRequestDelete(context) {
  const auth = requireAdmin(context);
  if (auth.error) return auth.error;
  const id = clean(context.params.id, 80);
  const result = await context.env.DB.prepare(`DELETE FROM records WHERE CAST(id AS TEXT) = ? OR record_no = ?`).bind(id, id).run();
  if (!result.meta?.changes) return json({ error: '기록을 찾을 수 없습니다.' }, 404);
  return json({ ok: true, admin: auth.email });
}
