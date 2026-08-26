/* 팀 대항 공용 게임 엔진 — 설정 → 팀 차례 → 플레이(타이머/정답·패스) → 턴 결과 → 다음 팀 → 최종 결과
   팀은 홈 점수판(localStorage 'fss2026b')에 설정한 팀을 그대로 사용.
   TeamGame.start(mountId, cfg)  — cfg:
     title, emoji, decks:{덱이름:[item,...]}, render(item)->html, text(item)->string,
     reveal(item)->html|null(있으면 "정답 공개" 버튼), footer, correctLabel, passLabel,
     pointsPerCorrect=1, passesPerTurn=3, timeOptions=[60,90,120] */
(function(){
  // 팀별 색 (사이트 밝은 테마와 어울리는 파스텔 + 진한 글자색)
  const TEAMC=[
    {pill:'#d6f5f1',text:'#0a7d72'}, // teal
    {pill:'#ffe0e8',text:'#c02b4e'}, // hot
    {pill:'#d9f0fb',text:'#1b6a92'}, // sky
    {pill:'#fff0cc',text:'#a9720a'}, // amber
    {pill:'#e6e0fb',text:'#5b45c0'}, // violet
    {pill:'#e2f6d8',text:'#3f7d1e'}, // green
  ];
  function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  function beep(){ try{ const ac=new (window.AudioContext||window.webkitAudioContext)();
    for(let k=0;k<3;k++){ const t=ac.currentTime+k*0.22,o=ac.createOscillator(),g=ac.createGain();
      o.connect(g); g.connect(ac.destination); o.type='square'; o.frequency.value=1046;
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.7,t+0.01); g.gain.exponentialRampToValueAtTime(.0001,t+0.18);
      o.start(t); o.stop(t+0.2);} }catch(e){} }
  // 홈 점수판에 저장된 팀 이름 배열 로드
  function loadTeams(){ try{ const s=JSON.parse(localStorage.getItem('fss2026b'));
    if(s&&Array.isArray(s.teams)&&s.teams.length) return s.teams.map((t,i)=>(t&&t.name&&t.name.trim())||`${i+1}팀`);
  }catch(e){} return null; }

  function start(mountId, cfg){
    const el=document.getElementById(mountId);
    const deckNames=Object.keys(cfg.decks);
    const render=cfg.render||(it=> esc(typeof it==='string'?it:it.q));
    const textOf=cfg.text||(it=> typeof it==='string'?it:(it.a||it.q));
    const reveal=cfg.reveal||null;
    const PPC=cfg.pointsPerCorrect||1, PASS=cfg.passesPerTurn==null?3:cfg.passesPerTurn;
    const timeOpts=cfg.timeOptions||[60,90,120];
    const st={ names:loadTeams()||['1팀','2팀'], timePer:timeOpts[0], sel:new Set(),
      scores:[], round:1, team:0, order:[], pos:0,
      queue:[], qi:0, turnScore:0, turnWords:[], passLeft:0, remain:0, tick:null, revealed:false };
    const nT=()=>st.names.length;
    const tname=i=>st.names[i]||`${i+1}팀`;
    const tc=i=>TEAMC[i%TEAMC.length];
    const pool=()=>{ let a=[]; st.sel.forEach(n=> a=a.concat(cfg.decks[n]||[])); return a; };
    function stopTick(){ if(st.tick){ clearInterval(st.tick); st.tick=null; } }

    // ---------- 설정 ----------
    function setup(){
      stopTick();
      st.names=loadTeams()||st.names;
      if(st.order.length!==nT()) st.order=Array.from({length:nT()},(_,i)=>i);
      const teamsSet=!!loadTeams();
      el.innerHTML=`<div class="tg-card">
        <div class="tg-title">${cfg.emoji||''} ${esc(cfg.title||'게임')}</div>
        <div class="tg-label">참가 팀 · 진행 순서</div>
        <div class="tg-teams">${st.order.map((ti,k)=>`<span class="tg-teamtag" style="background:${tc(ti).pill};color:${tc(ti).text}">${k+1}. ${esc(tname(ti))}</span>`).join('')}</div>
        <button class="tg-seg" id="shuffleBtn" style="margin-top:10px">🔀 순서 랜덤</button>
        <div class="tg-teamnote">${teamsSet?'홈 점수판 팀이에요. 순서를 섞은 뒤 시작하세요.':'홈에 팀이 없어 임시 2팀으로 진행해요. 진행 순서 화면에서 팀을 설정하면 반영돼요.'}</div>
        <div class="tg-label">한 팀당 시간</div>
        <div class="tg-row" id="timeRow">${timeOpts.map(t=>`<button class="tg-seg${t===st.timePer?' on':''}" data-s="${t}">${t}초</button>`).join('')}</div>
        <div class="tg-label">카드 덱</div>
        <div class="tg-row" id="deckRow">
          <button class="tg-chip${st.sel.size===deckNames.length?' on':''}" data-d="__all">🎲 전체 랜덤</button>
          ${deckNames.map(n=>`<button class="tg-chip${st.sel.has(n)?' on':''}" data-d="${esc(n)}">${esc(n)}</button>`).join('')}
        </div>
        <button class="tg-cta" id="startBtn">게임 시작</button>
        ${cfg.footer?`<div class="tg-foot">${cfg.footer}</div>`:''}
      </div>`;
      el.querySelector('#shuffleBtn').onclick=()=>{ st.order=shuffle(st.order); setup(); };
      el.querySelectorAll('#timeRow .tg-seg').forEach(b=>b.onclick=()=>{ st.timePer=+b.dataset.s; setup(); });
      el.querySelectorAll('#deckRow .tg-chip').forEach(b=>b.onclick=()=>{
        const d=b.dataset.d;
        if(d==='__all'){ if(st.sel.size===deckNames.length) st.sel.clear(); else st.sel=new Set(deckNames); }
        else { if(st.sel.has(d)) st.sel.delete(d); else st.sel.add(d); }
        setup();
      });
      el.querySelector('#startBtn').onclick=()=>{
        if(st.sel.size===0){ alert('카드 덱을 하나 이상 선택하세요.'); return; }
        st.names=loadTeams()||st.names; st.scores=Array(nT()).fill(0); st.round=1;
        if(st.order.length!==nT()) st.order=Array.from({length:nT()},(_,i)=>i);
        st.pos=0; st.team=st.order[0]; ready();
      };
    }

    // ---------- 팀 차례(준비) ----------
    function scoreChips(active){
      return `<div class="tg-scorechips">${st.scores.map((s,i)=>{ const c=tc(i);
        return `<span class="tg-scorechip${i===active?' active':''}" style="background:${c.pill};color:${c.text}">${esc(tname(i))} ${s}</span>`;
      }).join('')}</div>`;
    }
    function ready(){
      stopTick();
      el.innerHTML=`<div class="tg-card tg-ready">
        <span class="tg-badge">${st.round}바퀴</span>
        <div class="tg-emoji">${cfg.emoji||'🎮'}</div>
        <div class="tg-heading" style="color:${tc(st.team).text}">${esc(tname(st.team))} 차례!</div>
        <div class="tg-sub">설명할 사람은 폰을 들고, 나머지는 맞힐 준비!</div>
        <div class="tg-teamnote" style="text-align:center">🔀 순서: ${st.order.map((ti,k)=>`${k===st.pos?'▶ ':''}${esc(tname(ti))}`).join('  →  ')}</div>
        ${scoreChips(st.team)}
        <button class="tg-cta" id="go">시작!</button>
      </div>`;
      el.querySelector('#go').onclick=()=>playStart();
    }

    // ---------- 플레이 ----------
    function playStart(){
      st.queue=shuffle(pool()); st.qi=0; st.turnScore=0; st.turnWords=[]; st.passLeft=PASS; st.remain=st.timePer; st.revealed=false;
      draw();
      st.tick=setInterval(()=>{ st.remain--; if(st.remain<=0){ beep(); stopTick(); return turnResult(); } paintTimer(); }, 1000);
    }
    function cur(){ return st.queue[st.qi]; }
    function paintTimer(){
      const t=el.querySelector('#tgT'); if(t){ t.textContent=st.remain; t.classList.toggle('low',st.remain<=10); }
      const f=el.querySelector('#tgF'); if(f) f.style.width=Math.max(0,st.remain/st.timePer*100)+'%';
    }
    function draw(){
      const c=tc(st.team); const it=cur();
      const showReveal = reveal && !st.revealed;
      const answerHtml = reveal ? (st.revealed?`<small>${reveal(it)}</small>`:'') : '';
      el.innerHTML=`<div class="tg-card">
        <div class="tg-hdr">
          <span class="tg-hbadge" style="background:${c.pill};color:${c.text}">${esc(tname(st.team))}</span>
          <div class="tg-turn">이번 턴<b>${st.turnScore}</b></div>
          <div class="tg-timer" id="tgT">${st.remain}</div>
        </div>
        <div class="tg-bar"><div class="tg-barfill" id="tgF" style="width:${st.remain/st.timePer*100}%"></div></div>
        <div class="tg-wordcard"><div class="tg-word">${render(it)}${answerHtml}</div></div>
        ${showReveal?`<button class="tg-revbtn" id="rev">정답 공개</button>`:''}
        <div class="tg-actions">
          <button class="tg-correct" id="ok">${cfg.correctLabel||'○ 정답'}</button>
          <button class="tg-pass" id="pass" ${st.passLeft<=0?'disabled':''}>${cfg.passLabel||'✕ 패스'}</button>
        </div>
        <div class="tg-passfoot">${st.passLeft>0?`패스 ${st.passLeft}번 남음`:'패스 소진'}</div>
      </div>`;
      paintTimer();
      const rb=el.querySelector('#rev'); if(rb) rb.onclick=()=>{ st.revealed=true; draw(); };
      el.querySelector('#ok').onclick=()=>{ st.turnScore+=PPC; st.turnWords.push(textOf(it)); st.scores[st.team]+=PPC; nextCard(); };
      const pb=el.querySelector('#pass'); if(pb&&st.passLeft>0) pb.onclick=()=>{ st.passLeft--; nextCard(); };
    }
    function nextCard(){ st.qi++; st.revealed=false;
      if(st.qi>=st.queue.length){ beep(); stopTick(); return turnResult(); }  // 덱 소진 → 턴 종료
      draw(); }

    // ---------- 턴 결과 ----------
    function turnResult(){
      stopTick();
      const lastTeam = st.pos===nT()-1;
      const chips = st.turnWords.length
        ? `<div class="tg-wordchips">${st.turnWords.map(w=>`<span class="tg-wchip">✓ ${esc(w)}</span>`).join('')}</div>`
        : `<div class="tg-none">맞힌 단어가 없어요 😅</div>`;
      el.innerHTML=`<div class="tg-card tg-result">
        <div class="tg-rhead">⏰ 턴 종료!</div>
        <div class="tg-rpoints" style="color:${tc(st.team).text}">${esc(tname(st.team))} +${st.turnScore}점!</div>
        <div class="tg-label" style="text-align:left">맞힌 단어</div>
        ${chips}
        <div class="tg-label" style="text-align:left">팀 점수판</div>
        <div class="tg-scoreboard">${st.scores.map((s,i)=>`<div class="tg-scorerow"><span class="nm"><span style="color:${tc(i).text}">${esc(tname(i))}</span></span><span>${s}점</span></div>`).join('')}</div>
        <div class="tg-btnrow" id="brow"></div>
        <button class="tg-link" id="end">게임 종료</button>
      </div>`;
      const brow=el.querySelector('#brow');
      if(!lastTeam){
        brow.innerHTML=`<button class="tg-cta" style="margin:0" id="next">다음 팀: ${esc(tname(st.order[st.pos+1]))}</button>`;
        el.querySelector('#next').onclick=()=>{ st.pos++; st.team=st.order[st.pos]; ready(); };
      } else {
        brow.innerHTML=`<button class="tg-cta" style="margin:0" id="more">한 바퀴 더</button><button class="tg-secondary" id="fin">최종 결과 보기</button>`;
        el.querySelector('#more').onclick=()=>{ st.round++; st.pos=0; st.team=st.order[0]; ready(); };
        el.querySelector('#fin').onclick=()=>final();
      }
      el.querySelector('#end').onclick=()=>final();
    }

    // ---------- 최종 결과 ----------
    function final(){
      stopTick();
      const order=st.scores.map((s,i)=>({i,s})).sort((a,b)=>b.s-a.s);
      const medals=['🥇','🥈','🥉'];
      const top=order[0].s, soleWinner=top>0 && order.filter(o=>o.s===top).length===1;
      el.innerHTML=`<div class="tg-card tg-result">
        <div class="tg-emoji">🏆</div>
        <div class="tg-heading">${soleWinner?`${esc(tname(order[0].i))} 우승!`:'게임 종료'}</div>
        <div class="tg-scoreboard" style="margin-top:16px">
          ${order.map((o,r)=>`<div class="tg-scorerow"><span class="nm"><span class="tg-medal">${medals[r]||'　'}</span><span style="color:${tc(o.i).text}">${esc(tname(o.i))}</span></span><span>${o.s}점</span></div>`).join('')}
        </div>
        <button class="tg-cta" id="again">처음으로</button>
      </div>`;
      el.querySelector('#again').onclick=()=>setup();
    }

    setup();
  }
  window.TeamGame={ start };
})();
