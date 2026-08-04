const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
  'pragma': 'no-cache',
  'expires': '0',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function clean(value, max = 10000) {
  return String(value ?? '').trim().slice(0, max);
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const query = clean(url.searchParams.get('q'), 500);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 500);

    let listStmt;
    if (query) {
      const q = `%${query}%`;
      listStmt = context.env.DB.prepare(`
        SELECT id, record_no, title, region, record_type, risk_level, status, assigned_to, summary, created_at, updated_at
        FROM records
        WHERE is_published = 1
          AND (record_no LIKE ? OR title LIKE ? OR region LIKE ? OR status LIKE ? OR record_type LIKE ?)
        ORDER BY
          CAST(substr(record_no, 4, 4) AS INTEGER) DESC,
          CAST(substr(record_no, 9) AS INTEGER) DESC,
          id DESC
        LIMIT ?
      `).bind(q, q, q, q, q, limit);
    } else {
      listStmt = context.env.DB.prepare(`
        SELECT id, record_no, title, region, record_type, risk_level, status, assigned_to, summary, created_at, updated_at
        FROM records
        WHERE is_published = 1
        ORDER BY
          CAST(substr(record_no, 4, 4) AS INTEGER) DESC,
          CAST(substr(record_no, 9) AS INTEGER) DESC,
          id DESC
        LIMIT ?
      `).bind(limit);
    }

    const statsStmt = context.env.DB.prepare(`
      SELECT
        COUNT(*) AS public_total,
        SUM(CASE WHEN status IN ('관찰 중', '분석 중', '회수 대기') THEN 1 ELSE 0 END) AS active_count,
        SUM(CASE WHEN status = '회수 기록 없음' THEN 1 ELSE 0 END) AS unresolved_count,
        SUM(CASE WHEN status = '격리 유지' THEN 1 ELSE 0 END) AS containment_count,
        SUM(CASE WHEN status = '회수 완료' THEN 1 ELSE 0 END) AS recovered_count,
        SUM(CASE WHEN status = '열람 금지' THEN 1 ELSE 0 END) AS restricted_count
      FROM records
      WHERE is_published = 1
    `);

    const [listResult, statsRow] = await Promise.all([
      listStmt.all(),
      statsStmt.first(),
    ]);

    return json({
      records: listResult.results || [],
      stats: {
        public_total: Number(statsRow?.public_total || 0),
        active: Number(statsRow?.active_count || 0),
        unresolved: Number(statsRow?.unresolved_count || 0),
        containment: Number(statsRow?.containment_count || 0),
        recovered: Number(statsRow?.recovered_count || 0),
        restricted: Number(statsRow?.restricted_count || 0),
        counted_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return json({ error: '기록 목록과 삼직 보고 통계를 불러오지 못했습니다.', detail: error.message }, 500);
  }
}
