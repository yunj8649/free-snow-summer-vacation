/* 여름 정모 레크레이션 - 공통 게임 로직 (data.js 를 먼저 로드해야 함) */
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

// 문제 -> 정답 공개 -> 다음 (OX & 초성). 출제 수 지정 + 랜덤 뽑기. onBack 주면 "← 주제" 버튼 표시
function makeQuiz(stageId, pool, renderAnswer, onBack){
  let items=shuffle(pool), i=0, shown=false;
  const el=document.getElementById(stageId);
  function reshuffle(n){ n=Math.max(1,Math.min(pool.length,n||pool.length)); items=shuffle(pool).slice(0,n); i=0; shown=false; draw(); }
  function draw(){
    const it=items[i];
    el.innerHTML=`
      <div class="ctrl">${onBack?'<button class="btn g sm backcat">← 주제</button>':''}출제 수 <input type="number" class="cnt" min="1" max="${pool.length}" value="${items.length}"> / ${pool.length}개
        <button class="btn g sm shuf">🔀 새로 뽑기</button></div>
      <div class="badge">${it.badge}</div>
      <div class="qtext">${it.q}</div>
      <div class="answer ${shown?it.cls||'':''}">${shown?renderAnswer(it):''}</div>
      <div class="note">${shown&&it.note?it.note:''}</div>
      <div class="counter">${i+1} / ${items.length}</div>
      <div class="nav2">
        <button class="btn g" id="prevB">◀ 이전</button>
        <button class="btn p" id="revB">${shown?'정답 숨기기':'정답 공개'}</button>
        <button class="btn g" id="nextB">다음 ▶</button>
      </div>`;
    el.querySelector('.shuf').onclick=()=>reshuffle(+el.querySelector('.cnt').value);
    el.querySelector('.cnt').onchange=()=>reshuffle(+el.querySelector('.cnt').value);
    if(onBack) el.querySelector('.backcat').onclick=onBack;
    el.querySelector('#prevB').onclick=()=>{ i=(i-1+items.length)%items.length; shown=false; draw(); };
    el.querySelector('#nextB').onclick=()=>{ i=(i+1)%items.length; shown=false; draw(); };
    el.querySelector('#revB').onclick=()=>{ shown=!shown; draw(); };
  }
  draw();
}

// 초성 맞추기: 주제 카드 선택 -> 해당 주제 퀴즈
function buildInitials(stageId){
  const el=document.getElementById(stageId);
  const cats=Object.keys(INITIALS);
  function showCats(){
    el.innerHTML='<div class="badge">초성 맞추기 · 주제 선택</div>'
      + '<div class="catcards">'
      + cats.map(c=>`<button class="catcard" data-c="${c}">${c}<span>${INITIALS[c].length}문제</span></button>`).join('')
      + '</div>';
    el.querySelectorAll('.catcard').forEach(b=>b.onclick=()=>{
      const cat=b.dataset.c;
      const pool=INITIALS[cat].map(([q,a])=>({badge:cat, q, note:'', answer:a}));
      makeQuiz(stageId, pool, it=>it.answer, showCats);
    });
  }
  showCats();
}

// 몸으로 말해요 (주제 랜덤 뽑기 -> 제시어, 패스권)
function buildCharades(stageId){
  const el=document.getElementById(stageId);
  const cats=Object.keys(CHARADES);
  function showCats(){
    el.innerHTML='<div class="badge">몸으로 말해요 · 주제 선택</div>'
      + '<div class="catcards">'
      + cats.map(c=>`<button class="catcard" data-c="${c}">${c}<span>${CHARADES[c].length}개</span></button>`).join('')
      + '<button class="catcard rand" data-c="__rand">🎲 랜덤 주제<span>무작위</span></button>'
      + '</div>';
    el.querySelectorAll('.catcard').forEach(b=>b.onclick=()=>{
      let c=b.dataset.c; if(c==='__rand') c=cats[Math.floor(Math.random()*cats.length)];
      startCat(c);
    });
  }
  function startCat(cat){
    const MAX=CHARADES[cat].length;
    let count=MAX, passMax=3, passLeft=3, order=[], i=0;
    function rebuild(){ order=shuffle(CHARADES[cat]).slice(0,count); i=0; passLeft=passMax; draw(); }
    function draw(){
      el.innerHTML=`
        <div class="ctrl"><button class="btn g sm backcat">← 주제</button>
          제시어 수 <input type="number" class="cnt" min="1" max="${MAX}" value="${count}"> / ${MAX}개
          &nbsp;·&nbsp; 패스권 <input type="number" class="pass" min="0" max="20" value="${passMax}">개</div>
        <div class="badge">${cat}</div>
        <div class="qtext">${order[i]}</div>
        <div class="counter">${i+1} / ${order.length} · 🎟️ 패스 ${passLeft}/${passMax}</div>
        <div class="nav2">
          <button class="btn g" id="p">◀ 이전</button>
          <button class="btn g" id="pass" ${passLeft<=0?'disabled':''}>⏭ 패스 (${passLeft})</button>
          <button class="btn p" id="n">다음 제시어 ▶</button>
        </div>
        <p class="hint">제시어를 몸으로만 표현하세요! 화면은 연기자만 보게 하세요 🙈</p>`;
      el.querySelector('.backcat').onclick=showCats;
      el.querySelector('.cnt').onchange=e=>{ count=Math.max(1,Math.min(MAX,+e.target.value||1)); rebuild(); };
      el.querySelector('.pass').onchange=e=>{ passMax=Math.max(0,Math.min(20,+e.target.value||0)); passLeft=passMax; draw(); };
      el.querySelector('#p').onclick=()=>{ i=(i-1+order.length)%order.length; draw(); };
      el.querySelector('#n').onclick=()=>{ i=(i+1)%order.length; draw(); };
      const pb=el.querySelector('#pass'); if(pb&&passLeft>0) pb.onclick=()=>{ passLeft--; i=(i+1)%order.length; draw(); };
    }
    rebuild();
  }
  showCats();
}
