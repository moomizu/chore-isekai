/* =====================================================================
   MONTHLY EVENTS: a sugoroku / Monopoly-style board that loops around.
   Win hunts and finish gathering runs during the month to earn event dice.
   Each die = one roll (1-6). Spaces give rewards; finishing laps unlocks
   limited prizes. Progress and dice reset when the month ends.
   ---------------------------------------------------------------------
   Add a new event by adding an entry to EVENTS. Events rotate by month.
   Lap rewards can be {crystals}, {gold}, {item:"item_id"} or {char:"roster_id"}.
   ===================================================================== */
// limited event gear (only obtainable from events)
Object.assign(ITEMS, {
  acc_ev_star:  {n:"Starfall Charm", slot:"acc", t:"accessory", atk:6, hp:20, col:"#ffd166", limited:true},
  w_ev_starrod: {n:"Shooting Star Rod", slot:"weapon", t:"staff", atk:34, el:"thunder", limited:true},
  acc_ev_leaf:  {n:"Harvest Wreath", slot:"acc", t:"accessory", hp:35, def:3, col:"#e8953a", limited:true},
  w_ev_scythe:  {n:"Harvest Sickle", slot:"weapon", t:"dagger", atk:31, limited:true}
});
const EVENTS = [
  { key:"starfall", n:"Starfall Festival", die:"Star Die", icon:"⭐", col:"#ffd166",
    blurb:"Stars are falling over the kingdom! Catch them on hunts and gathering trips.",
    laps:[{lap:1, r:{crystals:40}}, {lap:2, r:{item:"acc_ev_star"}}, {lap:3, r:{crystals:60}}, {lap:5, r:{item:"w_ev_starrod"}}, {lap:7, r:{crystals:120}}] },
  { key:"harvest", n:"Harvest Moon Fair", die:"Acorn Die", icon:"🌰", col:"#e8953a",
    blurb:"The autumn fair is on! Collect acorns from hunts and gathering trips.",
    laps:[{lap:1, r:{crystals:40}}, {lap:2, r:{item:"acc_ev_leaf"}}, {lap:3, r:{crystals:60}}, {lap:5, r:{item:"w_ev_scythe"}}, {lap:7, r:{crystals:120}}] }
];
// 24 spaces around the board. 0 is START.
const BOARD = ["start","gold","mat","crys","die","gold","chest","mat","back","crys","gold","die","rest","mat","gold","crys","fwd","chest","gold","mat","die","crys","back","chest"];
const SPACE = {
  start:{i:"🏁", n:"Start"}, gold:{i:"🪙", n:"+25 gold"}, crys:{i:"💎", n:"+5 crystals"}, mat:{i:"🌿", n:"Materials"},
  die:{i:"🎲", n:"+1 die"}, chest:{i:"🎁", n:"Treasure chest"}, back:{i:"↩️", n:"Back 2"}, fwd:{i:"💨", n:"Forward 3"}, rest:{i:"🍵", n:"Rest stop"}
};

const Ev = (() => {
  const monthKey = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
  const cur = () => { const d=new Date(); return EVENTS[(d.getFullYear()*12+d.getMonth()) % EVENTS.length]; };
  const daysLeft = () => { const d=new Date(), end=new Date(d.getFullYear(), d.getMonth()+1, 1); return Math.ceil((end-d)/864e5); };
  function S(){
    const id = monthKey();
    if(!state.event || state.event.id!==id) state.event = {id, pos:0, laps:0, dice:0, got:[]};
    return state.event;
  }
  let rolling = false;
  /* called after a hunt win or gathering run */
  function onRun(kind){
    if(state.tut && !state.tut.done) return;
    const n = kind==="hunt" ? 2 : 1, e=cur(); S().dice += n; save();
    setTimeout(()=>toast(`${e.icon} +${n} ${e.die}${n>1?"s":""} for the ${e.n}!`), 900);
  }
  function cellPos(i){ // ring of 24 cells around a 7x7 grid
    if(i<=6) return [i,0]; if(i<=12) return [6,i-6]; if(i<=18) return [18-i,6]; return [0,24-i];
  }
  function render(){
    const e=cur(), s=S();
    const next = e.laps.find(l=>!s.got.includes(l.lap));
    const prize = r => r.crystals?`💎 ${r.crystals}`:r.gold?`🪙 ${r.gold}`:r.item?`${ITEMS[r.item].n}`:r.char?`${ROSTER[r.char].n}`:"";
    return `<section class="frame ev" style="--ev:${e.col}"><span class="ribbon">${esc(e.n.toUpperCase())}</span>
      <p class="note" style="margin:0 0 4px;text-align:center">${esc(e.blurb)}<br><b>${daysLeft()} day${daysLeft()===1?"":"s"} left</b> · win hunts (+2) and gather (+1) to earn ${e.icon} ${esc(e.die)}s</p>
      <div class="board" id="board">
        ${BOARD.map((t,i)=>{ const [x,y]=cellPos(i); return `<div class="cell c-${t} ${s.pos===i?"here":""}" style="grid-column:${x+1};grid-row:${y+1}" title="${SPACE[t].n}">${SPACE[t].i}${s.pos===i?`<span class="token">${PX.img(PX.chibi(heroPxLook(H().look, heroStats()?heroStats().wtype:"none")),"tok")}</span>`:""}</div>`; }).join("")}
        <div class="bcenter">
          <div class="dicecount">${e.icon} <b>${s.dice}</b><small>${esc(e.die)}s</small></div>
          <div class="die" id="dieFace">🎲</div>
          <button class="gbtn" data-act="ev-roll" ${s.dice<1?"disabled":""}>Roll!</button>
          <small class="lapnow">Lap <b>${s.laps}</b>${next?` · next prize at lap ${next.lap}`:" · all prizes won!"}</small>
        </div>
      </div>
      <div class="laps">${e.laps.map(l=>`<div class="lapr ${s.got.includes(l.lap)?"got":""}"><small>LAP ${l.lap}</small><b>${l.r.item?PX.img(PX.icon(ITEMS[l.r.item].t, ITEMS[l.r.item].col||e.col),"lapico"):l.r.char?"👤":l.r.crystals?"💎":"🪙"}</b><span>${esc(prize(l.r))}</span>${l.r.item||l.r.char?`<em>LIMITED</em>`:""}</div>`).join("")}</div>
      <p class="note" style="margin:6px 0 0;text-align:center">Dice and board progress reset when the month ends. Limited prizes are yours to keep.</p>
    </section>`;
  }
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  function setToken(i){
    document.querySelectorAll("#board .cell").forEach((c,j)=>{ c.classList.toggle("here", j===i); const t=c.querySelector(".token"); if(t && j!==i) t.remove(); });
    const c = document.querySelectorAll("#board .cell")[i];
    if(c && !c.querySelector(".token")) c.insertAdjacentHTML("beforeend", `<span class="token">${PX.img(PX.chibi(heroPxLook(H().look, heroStats().wtype)),"tok")}</span>`);
  }
  async function move(steps){
    const s=S(), dir = steps<0 ? -1 : 1;
    for(let k=0;k<Math.abs(steps);k++){
      s.pos = (s.pos + dir + BOARD.length) % BOARD.length;
      if(dir>0 && s.pos===0){ s.laps++; await lapPrize(); }
      setToken(s.pos); Music.sfx && Music.sfx("tick"); await wait(180);
    }
  }
  async function lapPrize(){
    const e=cur(), s=S();
    toast(`🏁 Lap ${s.laps} complete!`);
    for(const l of e.laps){
      if(l.lap<=s.laps && !s.got.includes(l.lap)){
        s.got.push(l.lap); const r=l.r;
        if(r.crystals) state.crystals=(state.crystals||0)+r.crystals;
        if(r.gold) state.gold+=r.gold;
        if(r.item) addBag(r.item,1);
        if(r.char){ const P=state.party; if(!P.owned[r.char]) P.owned[r.char]={dupes:0}; else if(P.owned[r.char].dupes<5) P.owned[r.char].dupes++; }
        save();
        await splash(`<div class="sp-title" style="font-size:clamp(26px,8vw,40px)">LAP ${l.lap}<br>PRIZE!</div>
          <div class="sp-sub">${r.item?`🎁 ${esc(ITEMS[r.item].n)} <small>(limited)</small>`:r.char?`👤 ${esc(ROSTER[r.char].n)} joined!`:r.crystals?`💎 +${r.crystals} crystals`:`🪙 +${r.gold} gold`}</div><div class="tap">Tap to continue</div>`, 4000);
      }
    }
  }
  async function land(){
    const s=S(), t=BOARD[s.pos], e=cur();
    if(t==="gold"){ state.gold+=25; toast("🪙 +25 gold"); }
    else if(t==="crys"){ state.crystals=(state.crystals||0)+5; toast("💎 +5 crystals"); }
    else if(t==="die"){ s.dice++; toast(`${e.icon} +1 ${e.die}`); }
    else if(t==="mat"){ const pool=["herb","wood","gel","mushroom","ore","wing"], m=pool[Math.floor(Math.random()*pool.length)]; addBag(m,2); toast(`${MATS[m].i} +2 ${MATS[m].n}`); }
    else if(t==="chest"){ const roll=Math.random();
      if(roll<.45){ state.gold+=60; toast("🎁 Chest: +60 gold!"); } else if(roll<.8){ state.crystals=(state.crystals||0)+12; toast("🎁 Chest: +12 crystals!"); }
      else { s.dice+=2; toast(`🎁 Chest: +2 ${e.die}s!`); } }
    else if(t==="rest"){ toast("🍵 A nice cup of tea. Nothing happens, and that's okay."); }
    else if(t==="back"){ toast("↩️ Oops, back 2!"); await wait(300); await move(-2); }
    else if(t==="fwd"){ toast("💨 Tailwind! Forward 3!"); await wait(300); await move(3); return land(); }
  }
  async function roll(){
    const s=S(); if(rolling || s.dice<1) return;
    rolling=true; s.dice--; save();
    const d=$("dieFace"), faces=["⚀","⚁","⚂","⚃","⚄","⚅"], n=1+Math.floor(Math.random()*6);
    if(d){ for(let k=0;k<8;k++){ d.textContent=faces[Math.floor(Math.random()*6)]; await wait(60); } d.textContent=faces[n-1]; d.classList.add("rolled"); }
    await wait(350); await move(n); await land();
    save(); rolling=false; render2();
  }
  function render2(){ if(typeof window.render==="function") window.render(); }
  function act(a){ if(a==="ev-roll"){ roll(); return true; } return false; }
  return {render, act, onRun, cur, S, daysLeft};
})();
