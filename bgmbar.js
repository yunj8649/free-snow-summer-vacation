/* 여름 정모 레크레이션 - 우측 상단 플로팅 배경음 선택 바 (모든 화면 공통)
   BGM 탭에 저장한 유튜브 라벨을 어느 화면에서든 골라 재생. bgm.js 를 먼저 로드. */
(function(){
  const BKEY='fss_bgm', CUR='fss_bgm_cur';
  function list(){ try{ return JSON.parse(localStorage.getItem(BKEY))||[]; }catch(e){ return []; } }

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
    m.innerHTML = (items.length
        ? items.map(x=>`<button class="bgmbar-item${cur===x.url?' on':''}" data-url="${(x.url||'').replace(/"/g,'&quot;')}">▶ ${x.label||'배경음'}</button>`).join('')
        : '<div class="bgmbar-empty">저장된 곡이 없어요.<br>🎵 BGM 탭에서 추가하세요.</div>')
      + '<button class="bgmbar-item stop">🔇 끄기</button>';
    m.querySelectorAll('.bgmbar-item[data-url]').forEach(b=>b.onclick=()=>play(b.dataset.url));
    m.querySelector('.stop').onclick=()=>stop();
  }
  function play(url){ const id=BGM.ytId(url); if(!id) return; localStorage.setItem(CUR,url); dock.hidden=false; BGM.playYouTube(id,'bgmbar-holder'); render(); }
  function stop(){ BGM.select('off'); localStorage.removeItem(CUR); dock.hidden=true; render(); }
  bar.querySelector('#bgmbar-toggle').onclick=()=>{ const m=menu(); m.hidden=!m.hidden; if(!m.hidden) render(); };

  window.bgmbarPlay=play; window.bgmbarStop=stop; window.bgmbarRefresh=render;

  // 페이지 이동 후 마지막 곡 자동 재개 시도 (브라우저가 막으면 🎵 한 번 눌러 재생)
  window.addEventListener('load',()=>{
    const cur=localStorage.getItem(CUR); if(!cur) return;
    const id=BGM.ytId(cur); if(!id) return;
    dock.hidden=false; try{ BGM.playYouTube(id,'bgmbar-holder'); }catch(e){}
  });
  render();
})();
