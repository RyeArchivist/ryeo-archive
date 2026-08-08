
class RYAudioViewer{
  constructor(bg='/assets/ry-audio-viewer-bg.webp?v=13.8'){this.bg=bg;this.signal=67;this.target=67;this.timer=0;this.raf=0;this.build()}
  build(){
    const m=document.createElement('div');m.className='ry-audio-modal';m.hidden=true;
    m.innerHTML=`<div class="ry-audio-shell" role="dialog" aria-modal="true" aria-label="려 음성 기록 재생">
      <img class="ry-audio-bg" alt="" draggable="false"><div class="ry-wave-mask"></div><canvas class="ry-audio-wave"></canvas>
      <div class="ry-signal-mask"></div><div class="ry-signal-value">67%</div><div class="ry-signal-bars"><i></i></div>
      <div class="ry-rec-led"></div>
      <button class="ry-audio-toggle" type="button" aria-pressed="false" aria-label="재생 또는 일시정지"><span class="play-icon">▶</span><span class="pause-icon">Ⅱ</span></button>
      <button class="ry-audio-close" type="button" aria-label="닫기">×</button><div class="ry-audio-caption"></div><audio preload="metadata"></audio></div>`;
    document.body.appendChild(m);this.modal=m;this.shell=m.querySelector('.ry-audio-shell');this.canvas=m.querySelector('canvas');this.ctx=this.canvas.getContext('2d');this.audio=m.querySelector('audio');this.toggle=m.querySelector('.ry-audio-toggle');this.signalText=m.querySelector('.ry-signal-value');this.signalFill=m.querySelector('.ry-signal-bars>i');this.caption=m.querySelector('.ry-audio-caption');m.querySelector('.ry-audio-bg').src=this.bg;
    this.toggle.onclick=()=>this.togglePlayback();m.querySelector('.ry-audio-close').onclick=()=>this.close();m.onclick=e=>{if(e.target===m)this.close()};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.hidden)this.close()});window.addEventListener('resize',()=>this.resize());
    this.audio.onplay=()=>this.onPlay();this.audio.onpause=()=>this.onPause();this.audio.onended=()=>this.onPause()
  }
  open(url,title='음성 기록'){this.audio.src=url;this.audio.load();this.caption.textContent=title;this.signal=67;this.target=67;this.renderSignal();this.modal.hidden=false;document.documentElement.style.overflow='hidden';requestAnimationFrame(()=>{this.resize();this.idle()})}
  close(){this.audio.pause();this.audio.removeAttribute('src');this.audio.load();this.stop();this.modal.hidden=true;document.documentElement.style.overflow=''}
  async togglePlayback(){if(this.audio.paused){try{await this.graph();if(this.ac.state==='suspended')await this.ac.resume();await this.audio.play()}catch(e){console.error('RY audio playback failed',e)}}else this.audio.pause()}
  async graph(){if(this.ac)return;const AC=window.AudioContext||window.webkitAudioContext;this.ac=new AC();this.src=this.ac.createMediaElementSource(this.audio);this.an=this.ac.createAnalyser();this.an.fftSize=2048;this.an.smoothingTimeConstant=.82;this.arr=new Uint8Array(this.an.fftSize);this.src.connect(this.an);this.an.connect(this.ac.destination)}
  onPlay(){this.shell.classList.add('is-playing');this.toggle.setAttribute('aria-pressed','true');this.startSignal();this.draw()}
  onPause(){this.shell.classList.remove('is-playing');this.toggle.setAttribute('aria-pressed','false');clearInterval(this.timer);cancelAnimationFrame(this.raf);this.timer=0;this.raf=0;this.idle()}
  startSignal(){clearInterval(this.timer);this.timer=setInterval(()=>{if(Math.abs(this.signal-this.target)<=1)this.target=67+Math.floor(Math.random()*22);if(Math.random()>.25)this.signal+=this.target>this.signal?1:-1;this.signal=Math.max(67,Math.min(88,this.signal));this.renderSignal()},850)}
  renderSignal(){this.signalText.textContent=this.signal+'%';this.signalFill.style.width=this.signal+'%'}
  resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.max(1,Math.round(r.width*d));this.canvas.height=Math.max(1,Math.round(r.height*d));this.ctx.setTransform(d,0,0,d,0,0)}
  idle(){const r=this.canvas.getBoundingClientRect();this.ctx.clearRect(0,0,r.width,r.height);this.ctx.strokeStyle='rgba(232,210,160,.58)';this.ctx.lineWidth=1;this.ctx.beginPath();this.ctx.moveTo(0,r.height/2);this.ctx.lineTo(r.width,r.height/2);this.ctx.stroke()}
  draw(){if(this.audio.paused||!this.an)return;const r=this.canvas.getBoundingClientRect(),w=r.width,h=r.height;this.an.getByteTimeDomainData(this.arr);this.ctx.clearRect(0,0,w,h);this.ctx.strokeStyle='rgba(240,218,168,.94)';this.ctx.lineWidth=1.15;this.ctx.shadowColor='rgba(238,205,135,.5)';this.ctx.shadowBlur=8;this.ctx.beginPath();const s=w/(this.arr.length-1);for(let i=0;i<this.arr.length;i++){const y=h/2+((this.arr[i]-128)/128)*(h*.42),x=i*s;i?this.ctx.lineTo(x,y):this.ctx.moveTo(x,y)}this.ctx.stroke();this.ctx.shadowBlur=0;this.ctx.strokeStyle='rgba(217,185,120,.15)';this.ctx.lineWidth=.7;this.ctx.beginPath();this.ctx.moveTo(0,h/2);this.ctx.lineTo(w,h/2);this.ctx.stroke();this.raf=requestAnimationFrame(()=>this.draw())}
  stop(){clearInterval(this.timer);cancelAnimationFrame(this.raf);this.signal=67;this.target=67;this.renderSignal();this.idle()}
}
window.RY_AUDIO_VIEWER=new RYAudioViewer();
document.addEventListener('click',e=>{const b=e.target.closest('[data-ry-audio-url]');if(!b)return;e.preventDefault();window.RY_AUDIO_VIEWER.open(b.dataset.ryAudioUrl,b.dataset.ryAudioTitle||'음성 기록')});
