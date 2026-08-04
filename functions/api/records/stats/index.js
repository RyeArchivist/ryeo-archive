const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
  'pragma': 'no-cache',
  'expires': '0',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export async function onRequestGet(context) {
  try {
    const row = await context.env.DB.prepare(`
      SELECT
        COUNT(*) AS public_total,
        SUM(CASE WHEN status IN ('관찰 중', '분석 중', '회수 대기') THEN 1 ELSE 0 END) AS active_count,
        SUM(CASE WHEN status = '회수 기록 없음' THEN 1 ELSE 0 END) AS unresolved_count,
        SUM(CASE WHEN status = '격리 유지' THEN 1 ELSE 0 END) AS containment_count,
        SUM(CASE WHEN status = '회수 완료' THEN 1 ELSE 0 END) AS recovered_count,
        SUM(CASE WHEN status = '열람 금지' THEN 1 ELSE 0 END) AS restricted_count
      FROM records
      WHERE is_published = 1
    `).first();

    return json({
      public_total: Number(row?.public_total || 0),
      active: Number(row?.active_count || 0),
      unresolved: Number(row?.unresolved_count || 0),
      containment: Number(row?.containment_count || 0),
      recovered: Number(row?.recovered_count || 0),
      restricted: Number(row?.restricted_count || 0),
      counted_at: new Date().toISOString(),
    });
  } catch (error) {
    return json({ error: '삼직 보고 통계를 불러오지 못했습니다.', detail: error.message }, 500);
  }
}
