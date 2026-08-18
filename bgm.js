/* 여름 정모 레크레이션 - 배경음(BGM) 플레이어
   오디오 파일 없이 Web Audio 로 즉석 생성 + 내 음악 파일(반복) 지원 */
const BGM = (function(){
  let ctx, master, timer, fileAudio, current='off', vol=0.5;
  function ensure(){
    if(!ctx){
      ctx = new (window.AudioContext||window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = vol*0.6; master.connect(ctx.destination);
    }
    if(ctx.state==='suspended') ctx.resume();
  }
  // 간단한 반복 멜로디 (Hz)
  const TRACKS = {
    fun:  { tempo:0.18, type:'triangle', notes:[523,659,784,659, 587,698,880,698, 523,659,784,1046, 784,659,587,523] },
    calm: { tempo:0.5,  type:'sine',     notes:[392,494,587,494, 349,440,523,440, 330,392,494,392, 294,349,440,349] },
  };
  function stopSynth(){ if(timer){ clearInterval(timer); timer=null; } }
  function stopFile(){ if(fileAudio){ fileAudio.pause(); } }
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
  return {
    select(name){
      current=name; stopSynth(); stopFile();
      if(name==='fun'||name==='calm') playSynth(name);
    },
    playFile(url){
      current='file'; stopSynth(); ensure();
      if(!fileAudio){ fileAudio=new Audio(); fileAudio.loop=true; }
      fileAudio.src=url; fileAudio.volume=vol; fileAudio.play().catch(()=>{});
    },
    setVolume(v){ vol=v; if(master) master.gain.value=v*0.6; if(fileAudio) fileAudio.volume=v; },
    current(){ return current; },
  };
})();
