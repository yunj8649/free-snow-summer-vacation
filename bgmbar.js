/* 여름 정모 레크레이션 - 우측 상단 플로팅 배경음 선택 바 (모든 화면 공통)
   BGM 탭에 저장한 유튜브 라벨을 어느 화면에서든 골라 재생. bgm.js 를 먼저 로드. */
(function(){
  const BKEY='fss_bgm', CUR='fss_bgm_cur', VKEY='fss_bgm_vol';
  function list(){ try{ return JSON.parse(localStorage.getItem(BKEY))||[]; }catch(e){ return []; } }
  let vol=parseFloat(localStorage.getItem(VKEY)); if(isNaN(vol)) vol=0.5;
  BGM.setVolume(vol);

  const bar=document.createElement('div'); bar.id='bgmbar';
  bar.innerHTML='<button id="bgmbar-toggle" title="배경음 선택">🎵</button><div id="bgmbar-menu" hidden></div>';
  const dock=document.createElement('div'); dock.id='bgmbar-dock'; dock.hidden=true;
  dock.innerHTML='<div id="bgmbar-holder"></div>';
  function mount(){ document.body.appendChild(bar); document.body.appendChild(dock); }
  if(document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  const menu=()=>bar.querySelector('#bgmbar-menu');
  function render(){
    const items=list().filter(x=>x.url && BGM.ytId(x.url));
    const cur=localStorage.getItem(CUR);
    const m=menu();
    m.innerHTML = '<button class="bgmbar-item stop">🔇 끄기</button>'
      + (items.length
        ? items.map(x=>`<button class="bgmbar-item${cur===x.url?' on':''}" data-url="${(x.url||'').replace(/"/g,'&quot;')}">▶ ${x.label||'배경음'}</button>`).join('')
        : '<div class="bgmbar-empty">저장된 곡이 없어요.<br>🎵 BGM 탭에서 추가하세요.</div>')
      + '<div class="bgmbar-skip"><button class="chp" data-dir="-1">⏮ 구간</button><button class="chp" data-dir="1">구간 ⏭</button></div>'
      + '<div class="bgmbar-skip"><button class="skip" data-dir="-1">⏪</button><input class="skipN" type="number" min="1" value="60" title="건너뛸 초">초<button class="skip" data-dir="1">⏩</button></div>'
      + `<div class="bgmbar-vol">🔊 <input type="range" class="vol" min="0" max="1" step="0.05" value="${vol}"></div>`;
    m.querySelectorAll('.bgmbar-item[data-url]').forEach(b=>b.onclick=()=>play(b.dataset.url));
    const skipN=()=>Math.max(1, +m.querySelector('.skipN').value||60);
    m.querySelectorAll('.skip').forEach(b=>b.onclick=()=>BGM.seek((+b.dataset.dir)*skipN()));
    m.querySelectorAll('.chp').forEach(b=>b.onclick=()=>chapterSkip(+b.dataset.dir));
    m.querySelector('.stop').onclick=()=>stop();
    m.querySelector('.vol').oninput=e=>{ vol=+e.target.value; localStorage.setItem(VKEY,vol); BGM.setVolume(vol); };
  }
  function play(url){ const id=BGM.ytId(url); if(!id) return; localStorage.setItem(CUR,url); dock.hidden=false; BGM.playYouTube(id,'bgmbar-holder'); render(); }
  function chapterSkip(dir){
    const url=localStorage.getItem(CUR); if(!url){ return; }
    const it=list().find(x=>x.url===url);
    const ch=((it&&it.chapters)||[]).slice().sort((a,b)=>a-b);
    if(!ch.length){ alert('이 곡에 저장된 구간이 없어요.\n🎵 BGM 탭에서 구간 시간을 입력하세요.'); return; }
    const t=BGM.getTime();
    let target;
    if(dir>0){ target=ch.find(c=>c>t+0.8); if(target==null) target=ch[ch.length-1]; }
    else { const before=ch.filter(c=>c<t-1.5); target=before.length?before[before.length-1]:0; }
    BGM.seekTo(target);
  }
  function stop(){ BGM.select('off'); localStorage.removeItem(CUR); dock.hidden=true; render(); }
  bar.querySelector('#bgmbar-toggle').onclick=()=>{ const m=menu(); m.hidden=!m.hidden; if(!m.hidden) render(); };

  window.bgmbarPlay=play; window.bgmbarStop=stop; window.bgmbarRefresh=render;

  // 새로고침 시 자동재생 안 함. 이전 선택 표시도 지움(재생 중인 것만 강조)
  localStorage.removeItem(CUR);
  render();
})();
