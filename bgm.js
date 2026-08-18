/* 여름 정모 레크레이션 - 배경음(BGM) 재생 엔진 (유튜브 + 내 음악 파일) */
const BGM = (function(){
  let fileAudio, ytPlayer, current='off', vol=0.5;
  function stopFile(){ if(fileAudio) fileAudio.pause(); }
  function stopYT(){ if(ytPlayer && ytPlayer.stopVideo){ try{ ytPlayer.stopVideo(); }catch(e){} } }
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
    select(name){ current=name; stopFile(); stopYT(); },   // 'off'
    playFile(url){
      current='file'; stopYT();
      if(!fileAudio){ fileAudio=new Audio(); fileAudio.loop=true; }
      fileAudio.src=url; fileAudio.volume=vol; fileAudio.play().catch(()=>{});
    },
    playYouTube(id, holderId){
      current='yt'; stopFile();
      loadYTApi(()=>{
        if(ytPlayer && ytPlayer.loadVideoById){
          ytPlayer.loadVideoById(id); ytPlayer.setVolume(Math.round(vol*100)); ytPlayer.playVideo(); return;
        }
        ytPlayer=new YT.Player(holderId, {
          height:'68', width:'120', videoId:id,
          playerVars:{ autoplay:1, loop:1, playlist:id, rel:0 },
          events:{ onReady:e=>{ e.target.setVolume(Math.round(vol*100)); e.target.playVideo(); } }
        });
      });
    },
    setVolume(v){
      vol=v;
      if(fileAudio) fileAudio.volume=v;
      if(ytPlayer && ytPlayer.setVolume) try{ ytPlayer.setVolume(Math.round(v*100)); }catch(e){}
    },
    seek(delta){  // 현재 위치에서 delta초 이동
      if(ytPlayer && ytPlayer.getCurrentTime) try{ ytPlayer.seekTo(Math.max(0, ytPlayer.getCurrentTime()+delta), true); }catch(e){}
      else if(fileAudio && fileAudio.duration) fileAudio.currentTime=Math.max(0, fileAudio.currentTime+delta);
    },
    seekTo(sec){  // 지정한 초로 이동
      sec=Math.max(0, sec);
      if(ytPlayer && ytPlayer.seekTo) try{ ytPlayer.seekTo(sec, true); if(ytPlayer.playVideo) ytPlayer.playVideo(); }catch(e){}
      else if(fileAudio) fileAudio.currentTime=sec;
    },
    current(){ return current; },
  };
})();
