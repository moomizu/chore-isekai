/* =====================================================================
   ADVENTURER RANKS: F → E → D → C → B → A → S
   Reaching a rank's level makes you ELIGIBLE. Then a rank-up exam appears
   at the top of the quest board. F→E is a boss fight; after that, exams are
   real-life challenges with NO time limit: progress counts from the moment you're eligible.
   Ranks unlock hunting/gathering areas and give a gold + crystal bonus.
   ===================================================================== */
const ADV_RANKS = ["F","E","D","C","B","A","S"];
const RANK_LV = {E:5, D:10, C:20, B:35, A:50, S:65};
const RANK_BONUS = .10;   // +10% gold and crystals per rank above F
const EXAMS = {
  E:{ boss:{n:"Proctor Shroom", base:"shroom", hp:3, atk:1.3}, waves:[["slime","slime"],["shroom"]], bpm:116,
      desc:"Defeat the guild's exam monster to prove you can hold your own." },
  D:{ quests:10, photo:4,  desc:"Clear 10 quests, at least 4 with photo proof." },
  C:{ days:10, photo:8,    desc:"Clear quests on 10 different days, with 8 photo-verified." },
  B:{ quests:40, photo:20, desc:"Clear 40 quests, with 20 photo-verified." },
  A:{ days:25, photo:30,   desc:"Clear quests on 25 different days, with 30 photo-verified." },
  S:{ days:50, photo:60,   desc:"Clear quests on 50 different days, with 60 photo-verified." }
};

const Rank = (() => {
  const cur = () => state.rank || "F";
  const idx = r => ADV_RANKS.indexOf(r);
  const nextRank = () => ADV_RANKS[idx(cur())+1] || null;
  const atLeast = r => idx(cur()) >= idx(r||"F");
  const eligible = () => { const n=nextRank(); return !!n && heroLevel() >= RANK_LV[n]; };
  const bonus = () => 1 + RANK_BONUS * idx(cur());
  const X = () => state.exam || null;   // {rank, start, quests, photo, days:[]}

  /* called from grant() for every real quest clear */
  function onClear(verified){
    const x=X(); if(!x || !x.start) return;
    const e=EXAMS[x.rank]; if(!e || e.boss) return;
    x.quests++; if(verified) x.photo++; const d=dayKey(); if(!x.days.includes(d)) x.days.push(d);
    save();
    if(done(x)) setTimeout(()=>{ toast(`📜 ${x.rank}-Rank exam requirements met! Collect your certificate from the board.`); }, 4500);
  }
  function done(x){ const e=EXAMS[x.rank]; if(!e || e.boss) return false;
    return (e.quests ? x.quests>=e.quests : true) && (e.days ? x.days.length>=e.days : true) && x.photo>=(e.photo||0); }

  /* exam notice pinned to the top of the quest board */
  function boardCard(){
    if(state.tut && !state.tut.done) return "";
    const n=nextRank(); if(!n) return "";
    if(!eligible()) return "";
    const e=EXAMS[n];
    if(!e.boss && !(X() && X().rank===n)){ state.exam={rank:n, start:Date.now(), quests:0, photo:0, days:[]}; save(); }   // starts automatically
    const x=X() && X().rank===n ? X() : null;
    const bar = (v,max,l) => `<div class="exbar"><span>${l}</span><div class="xpbar"><i style="width:${Math.min(100,v/max*100)}%"></i></div><b>${Math.min(v,max)}/${max}</b></div>`;
    let body;
    if(e.boss) body = `<p>${e.desc}</p><button class="gbtn" data-act="rk-fight">⚔️ Take the exam</button>`;
    else {
      body = `<p>${e.desc}</p>
        ${e.quests?bar(x.quests,e.quests,"Quests"):""}${e.days?bar(x.days.length,e.days,"Days"):""}${bar(x.photo,e.photo,"📸 Photo")}
        ${done(x) ? `<button class="gbtn" data-act="rk-claim">🎖️ Collect your ${n}-Rank certificate!</button>`
                  : `<p class="note" style="margin:4px 0 0;text-align:center">No rush! Any quest you clear counts towards it.</p>`}`;
    }
    return `<section class="frame exam"><span class="ribbon">RANK-UP EXAM: ${cur()} → ${n}</span>${body}</section>`;
  }
  function fight(){
    const n=nextRank(), e=EXAMS[n]; if(!e||!e.boss||!eligible()) return;
    startHunt({id:"exam-"+n, n:`${n}-Rank Exam`, lv:0, fee:0, gold:0, bpm:e.bpm||116, tier:2, waves:e.waves||[], boss:{...e.boss}, exam:n});
  }
  async function promote(n){
    if(!n || n!==nextRank()) return;
    state.rank = n; state.exam = null; save(); render();
    await splash(`<div class="sp-title">RANK UP!</div>
      <div class="lv" style="width:90px;height:90px"><div><small style="font-size:12px">RANK</small><b style="font-size:40px">${n}</b></div></div>
      <div class="sp-sub">You're now ${"EASF".includes(n)?"an":"a"} ${n}-Rank Adventurer!<br><small>New areas unlocked · +${Math.round(RANK_BONUS*idx(n)*100)}% gold and crystals from quests</small></div>
      <div class="tap">Tap to continue</div>`, 5000);
    say(`Congratulations on your promotion to ${n}-Rank! I'll update your guild card right away!`);
  }
  /* exam boss result (from battle.js) */
  function examWon(n){ promote(n); }
  function act(a){
    if(a==="rk-fight"){ fight(); return true; }
    if(a==="rk-start"){ const n=nextRank(); state.exam={rank:n, start:Date.now(), quests:0, photo:0, days:[]}; save(); render();
      say(`Your ${n}-Rank exam has begun! ${EXAMS[n].desc} You can do it~`); return true; }
    if(a==="rk-claim"){ const x=X(); if(x && done(x)) promote(x.rank); return true; }
    if(a==="rk-quit"){ state.exam=null; save(); render(); toast("Exam cancelled. Retake it whenever you're ready."); return true; }
    return false;
  }
  /* tell the player when they become eligible (called after level changes) */
  function checkEligible(beforeLv){
    const n=nextRank(); if(!n) return;
    if(heroLevel()>=RANK_LV[n] && beforeLv<RANK_LV[n]){
      if(!EXAMS[n].boss && !(X() && X().rank===n)){ state.exam={rank:n, start:Date.now(), quests:0, photo:0, days:[]}; save(); }
      setTimeout(()=>say(`Big news! You're now eligible for the ${n}-Rank exam. It's pinned at the top of the quest board, and there's no time limit~`), 600); }
  }
  return {cur, nextRank, atLeast, eligible, bonus, onClear, boardCard, act, examWon, checkEligible, idx};
})();
