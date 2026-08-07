
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
function safeName(name='audio.mp3'){return name.normalize('NFKC').replace(/[^\w.\-가-힣]/g,'_').slice(0,120)}

export async function onRequestGet(context){
  const auth=requireAdmin(context);if(auth.error)return auth.error;
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
  if(!context.env.MEDIA)return json({error:'R2 MEDIA 바인딩이 없습니다. Cloudflare Pages 설정에서 R2 바인딩 이름을 MEDIA로 연결하세요.'},500);
  try{
    const form=await context.request.formData();
    const recordId=Number(form.get('record_id'));
    const file=form.get('file');
    const title=clean(form.get('title'),200)||'음성 기록';
    if(!recordId)return json({error:'사건을 먼저 저장한 뒤 첨부하세요.'},400);
    const record=await context.env.DB.prepare('SELECT id FROM records WHERE id=?').bind(recordId).first();
    if(!record)return json({error:'기록을 찾을 수 없습니다.'},404);
    if(!(file instanceof File))return json({error:'음성 파일을 선택하세요.'},400);
    const allowed=new Set(['audio/mpeg','audio/mp3','audio/ogg','audio/wav','audio/x-wav','audio/mp4','audio/aac']);
    if(!allowed.has(file.type))return json({error:`지원하지 않는 음성 형식입니다: ${file.type||'unknown'}`},400);
    if(file.size>25*1024*1024)return json({error:'음성 파일은 25MB 이하로 올려주세요.'},413);

    const key=`records/${recordId}/audio/${crypto.randomUUID()}-${safeName(file.name)}`;
    await context.env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:file.type,cacheControl:'public, max-age=31536000, immutable'},customMetadata:{recordId:String(recordId),originalName:file.name}});
    const result=await context.env.DB.prepare(`INSERT INTO record_attachments
      (record_id,attachment_type,title,file_key,mime_type,public_level,sort_order)
      VALUES(?,'AUDIO',?,?,?,'PUBLIC',0)`).bind(recordId,title,key,file.type).run();
    return json({ok:true,id:result.meta?.last_row_id,title},201);
  }catch(error){return json({error:'음성 기록을 저장하지 못했습니다.',detail:error.message},500)}
}
