
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const clean=(v,max=10000)=>String(v??'').trim().slice(0,max);
function requireAdmin(context){
  const email=clean(context.request.headers.get('Cf-Access-Authenticated-User-Email'),320).toLowerCase();
  if(!email)return {error:json({error:'관리자 인증이 필요합니다.'},401)};
  const allowed=clean(context.env.ADMIN_EMAIL,320).toLowerCase();
  if(allowed&&email!==allowed)return {error:json({error:'허용되지 않은 관리자 계정입니다.'},403)};
  return {email};
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

export async function onRequestDelete(context){
  const auth=requireAdmin(context);if(auth.error)return auth.error;
  try{await ensureAttachmentTable(context.env)}catch(error){return json({error:'첨부자료 저장소를 초기화하지 못했습니다.',detail:error.message},500)}
  const id=Number(context.params.id);if(!id)return json({error:'잘못된 첨부자료 번호입니다.'},400);
  try{
    const row=await context.env.DB.prepare('SELECT file_key FROM record_attachments WHERE id=?').bind(id).first();
    if(!row)return json({error:'첨부자료를 찾을 수 없습니다.'},404);
    if(row.file_key&&context.env.MEDIA)await context.env.MEDIA.delete(row.file_key);
    await context.env.DB.prepare('DELETE FROM record_attachments WHERE id=?').bind(id).run();
    return json({ok:true});
  }catch(error){return json({error:'첨부자료를 삭제하지 못했습니다.',detail:error.message},500)}
}
