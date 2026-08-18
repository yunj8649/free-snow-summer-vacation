/* 여름 정모 레크레이션 - 배경음(BGM) 플레이어
   생성음 2종 + 내 음악 파일(반복) + 유튜브 링크 재생 */
const BGM = (function(){
  let ctx, master, timer, fileAudio, ytPlayer, current='off', vol=0.5;
  function ensure(){
    if(!ctx){
      ctx = new (window.AudioContext||window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = vol*0.6; master.connect(ctx.destination);
    }
    if(ctx.state==='suspended') ctx.resume();
  }
  const TRACKS = {
    fun:  { tempo:0.18, type:'triangle', notes:[523,659,784,659, 587,698,880,698, 523,659,784,1046, 784,659,587,523] },
    calm: { tempo:0.5,  type:'sine',     notes:[392,494,587,494, 349,440,523,440, 330,392,494,392, 294,349,440,349] },
  };
  function stopSynth(){ if(timer){ clearInterval(timer); timer=null; } }
  function stopFile(){ if(fileAudio){ fileAudio.pause(); } }
  function stopYT(){ if(ytPlayer && ytPlayer.stopVideo){ try{ytPlayer.stopVideo();}catch(e){} } }
  function playSynth(name){
    ensure(); stopSynth();
    const t=TRACKS[name]; let i=0;
    const step=()=>{
      const f=t.notes[i%t.notes.length]; i++;
      const o=ctx.createOscillator(), g=ctx.createGain(), now=ctx.currentTime;
      o.type=t.type; o.frequency.value=f;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.5, now+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now+t.tempo*0.9);
      o.connect(g); g.connect(master); o.start(now); o.stop(now+t.tempo);
    };
    step(); timer=setInterval(step, t.tempo*1000);
  }
  function loadYTApi(cb){
    if(window.YT && window.YT.Player){ cb(); return; }
    if(!document.getElementById('yt-api')){
      const tag=document.createElement('script'); tag.id='yt-api'; tag.src='https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    const prev=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{ if(prev)prev(); cb(); };
  }
  return {
    ytId(url){
      if(!url) return null;
      const m=url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/);
      if(m) return m[1];
      return /^[\w-]{11}$/.test(url.trim()) ? url.trim() : null;
    },
    select(name){
      current=name; stopSynth(); stopFile(); stopYT();
      if(name==='fun'||name==='calm') playSynth(name);
    },
    playFile(url){
      current='file'; stopSynth(); stopYT(); ensure();
      if(!fileAudio){ fileAudio=new Audio(); fileAudio.loop=true; }
      fileAudio.src=url; fileAudio.volume=vol; fileAudio.play().catch(()=>{});
    },
    playYouTube(id, holderId){
      current='yt'; stopSynth(); stopFile();
      loadYTApi(()=>{
        if(ytPlayer && ytPlayer.loadVideoById){
          ytPlayer.loadVideoById(id); ytPlayer.setVolume(Math.round(vol*100)); ytPlayer.playVideo(); return;
        }
        ytPlayer=new YT.Player(holderId, {
          height:'180', width:'320', videoId:id,
          playerVars:{ autoplay:1, loop:1, playlist:id, rel:0 },
          events:{ onReady:e=>{ e.target.setVolume(Math.round(vol*100)); e.target.playVideo(); } }
        });
      });
    },
    setVolume(v){
      vol=v;
      if(master) master.gain.value=v*0.6;
      if(fileAudio) fileAudio.volume=v;
      if(ytPlayer && ytPlayer.setVolume) try{ ytPlayer.setVolume(Math.round(v*100)); }catch(e){}
    },
    current(){ return current; },
  };
})();
