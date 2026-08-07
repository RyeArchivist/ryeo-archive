
const clean=(v,max=2000)=>String(v??'').trim().slice(0,max);
export async function onRequestGet(context){
  if(!context.env.MEDIA)return new Response('MEDIA binding missing',{status:500});
  const url=new URL(context.request.url),key=clean(url.searchParams.get('key'));
  if(!key)return new Response('Missing key',{status:400});

  const head=await context.env.MEDIA.head(key);
  if(!head)return new Response('Not found',{status:404});

  const range=context.request.headers.get('range');
  if(range){
    const m=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(!m)return new Response(null,{status:416,headers:{'content-range':`bytes */${head.size}`}});
    let start=m[1]?Number(m[1]):0,end=m[2]?Number(m[2]):head.size-1;
    if(!m[1]&&m[2]){const suffix=Number(m[2]);start=Math.max(head.size-suffix,0);end=head.size-1}
    start=Math.max(0,start);end=Math.min(head.size-1,end);
    if(start>end||start>=head.size)return new Response(null,{status:416,headers:{'content-range':`bytes */${head.size}`}});
    const length=end-start+1,obj=await context.env.MEDIA.get(key,{range:{offset:start,length}});
    const h=new Headers();obj.writeHttpMetadata(h);h.set('accept-ranges','bytes');h.set('content-range',`bytes ${start}-${end}/${head.size}`);h.set('content-length',String(length));h.set('cache-control','public, max-age=31536000, immutable');
    return new Response(obj.body,{status:206,headers:h});
  }

  const obj=await context.env.MEDIA.get(key),h=new Headers();obj.writeHttpMetadata(h);h.set('accept-ranges','bytes');h.set('etag',obj.httpEtag);h.set('cache-control','public, max-age=31536000, immutable');
  return new Response(obj.body,{headers:h});
}
