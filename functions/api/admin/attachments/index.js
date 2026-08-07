
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
function safeName(name='file.bin'){return name.normalize('NFKC').replace(/[^\w.\-가-힣]/g,'_').slice(0,120)}


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
  await env.DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_record_attachments_record_id
    ON record_attachments(record_id, sort_order, id)
  `).run();
}

export async function onRequestGet(context){
  const auth=requireAdmin(context);if(auth.error)return auth.error;
  try{await ensureAttachmentTable(context.env)}catch(error){return json({error:'첨부자료 저장소를 초기화하지 못했습니다.',detail:error.message},500)}
  const url=new URL(context.request.url),recordId=Number(url.searchParams.get('record_id'));
  if(!recordId)return json({error:'record_id가 필요합니다.'},400);
  try{
    const {results}=await context.env.DB.prepare(`SELECT id,record_id,attachment_type,title,file_key,external_url,mime_type,public_level,sort_order,created_at
      FROM record_attachments WHERE record_id=? ORDER BY sort_order,id`).bind(recordId).all();
    return json({attachments:results||[],admin:auth.email});
  }catch(error){return json({error:'첨부자료를 불러오지 못했습니다.',detail:error.message},500)}
}

export async function onRequestPost(context){
  const auth=requireAdmin(context);if(auth.error)return auth.error;
  try{await ensureAttachmentTable(context.env)}catch(error){return json({error:'첨부자료 저장소를 초기화하지 못했습니다.',detail:error.message},500)}
  if(!context.env.MEDIA)return json({error:'R2 MEDIA 바인딩이 없습니다. Cloudflare Pages 설정에서 R2 바인딩 이름을 MEDIA로 연결하세요.'},500);
  try{
    const form=await context.request.formData();
    const recordId=Number(form.get('record_id'));
    const file=form.get('file');
    const requestedType=clean(form.get('attachment_type'),20).toUpperCase();
    const attachmentType=requestedType==='IMAGE'?'IMAGE':'AUDIO';
    const defaultTitle=attachmentType==='IMAGE'?'이미지 기록':'음성 기록';
    const title=clean(form.get('title'),200)||defaultTitle;

    if(!recordId)return json({error:'사건을 먼저 저장한 뒤 첨부하세요.'},400);
    const record=await context.env.DB.prepare('SELECT id FROM records WHERE id=?').bind(recordId).first();
    if(!record)return json({error:'기록을 찾을 수 없습니다.'},404);
    if(!(file instanceof File))return json({error:'첨부 파일을 선택하세요.'},400);

    const audioAllowed=new Set(['audio/mpeg','audio/mp3','audio/ogg','audio/wav','audio/x-wav','audio/mp4','audio/aac']);
    const imageAllowed=new Set(['image/jpeg','image/png','image/webp','image/gif']);
    const allowed=attachmentType==='IMAGE'?imageAllowed:audioAllowed;
    if(!allowed.has(file.type))return json({error:`지원하지 않는 ${attachmentType==='IMAGE'?'이미지':'음성'} 형식입니다: ${file.type||'unknown'}`},400);

    const max=attachmentType==='IMAGE'?12*1024*1024:25*1024*1024;
    if(file.size>max)return json({error:`${attachmentType==='IMAGE'?'이미지 12MB':'음성 25MB'} 이하로 올려주세요.`},413);

    const folder=attachmentType==='IMAGE'?'image':'audio';
    const key=`records/${recordId}/${folder}/${crypto.randomUUID()}-${safeName(file.name)}`;
    await context.env.MEDIA.put(key,file.stream(),{
      httpMetadata:{contentType:file.type,cacheControl:'public, max-age=31536000, immutable'},
      customMetadata:{recordId:String(recordId),originalName:file.name,attachmentType}
    });

    const result=await context.env.DB.prepare(`INSERT INTO record_attachments
      (record_id,attachment_type,title,file_key,mime_type,public_level,sort_order)
      VALUES(?,?,?,?,?,'PUBLIC',0)`).bind(recordId,attachmentType,title,key,file.type).run();

    return json({ok:true,id:result.meta?.last_row_id,title,attachment_type:attachmentType},201);
  }catch(error){return json({error:'첨부자료를 저장하지 못했습니다.',detail:error.message},500)}
}
