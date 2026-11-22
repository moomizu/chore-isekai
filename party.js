/* ================= Party, roster and gacha ================= */

const CLASS_OF = {Warrior:"sword", Mage:"staff", Rogue:"dagger", Cleric:"mace", Ranger:"bow"};
const CLASS_ICON = {Warrior:"⚔️", Mage:"🪄", Rogue:"🗡️", Cleric:"🔨", Ranger:"🏹", Novice:"👊"};
const CLASS_MOD = {Warrior:{atk:1, hp:1.3}, Mage:{atk:1.3, hp:.8}, Rogue:{atk:1.1, hp:.9}, Cleric:{atk:.85, hp:1.1}, Ranger:{atk:1.15, hp:.9}};
const RARITY_BASE = {3:{atk:12, hp:45}, 4:{atk:16, hp:60}, 5:{atk:21, hp:78}};
const CLASS_NOTE = {Warrior:"Tough frontliner. Extra HP.", Mage:"Big magic damage, less HP. Element matters!", Rogue:"Perfect hits deal double damage.", Cleric:"Ultimate heals the party.", Ranger:"Ultimate ignores defence."};

const ROSTER = {
  ryuu:   {n:"Ryuu",    r:5, cls:"Warrior", ult:"Dragonbreak Slash", look:{style:4,hair:"#2b2b33",eye:"#c8302c",skin:"#f2c6a0",outfit:"#c8302c",outfit2:"#333a4d",bottom:"pants"}, bio:"A wandering swordsman chasing the dragon that scarred his village."},
  mirelle:{n:"Mirelle", r:5, cls:"Mage", el:"fire", ult:"Inferno Bloom", look:{style:1,hair:"#d94a5a",eye:"#c27e0a",skin:"#fde2d2",outfit:"#c8302c",outfit2:"#f4f0e6",bottom:"skirt"}, bio:"The academy's top student. Sets things on fire when flustered."},
  aurelia:{n:"Aurelia", r:5, cls:"Cleric", ult:"Seraphic Halo", look:{style:3,hair:"#e8d27a",eye:"#3a7bd5",skin:"#fde2d2",outfit:"#eeeeee",outfit2:"#d4951a",bottom:"skirt"}, bio:"A temple priestess who hits surprisingly hard for a healer."},
  kai:    {n:"Kai",     r:4, cls:"Mage", el:"ice", ult:"Glacier Lance", look:{style:0,hair:"#5fb4e6",eye:"#3a7bd5",skin:"#f2c6a0",outfit:"#2f63e6",outfit2:"#dfe6f0",bottom:"pants"}, bio:"Cool, calm and always a little cold. Literally."},
  vex:    {n:"Vex",     r:4, cls:"Rogue", ult:"Phantom Rend", look:{style:4,hair:"#eeeeee",eye:"#6f5be0",skin:"#fde2d2",outfit:"#333a4d",outfit2:"#555c70",bottom:"pants"}, bio:"A thief turned guild member. Still 'borrows' snacks."},
  lyra:   {n:"Lyra",    r:4, cls:"Ranger", ult:"Starfall Volley", look:{style:2,hair:"#6fbf73",eye:"#2f9e6f",skin:"#f2c6a0",outfit:"#2f9e6f",outfit2:"#f4f0e6",bottom:"skirt"}, bio:"Forest scout who never misses. Talks to birds."},
  pip:    {n:"Pip",     r:3, cls:"Mage", el:"thunder", ult:"Zap Zap Bolt", look:{style:3,hair:"#e8d27a",eye:"#c27e0a",skin:"#fde2d2",outfit:"#7a3cc4",outfit2:"#f4f0e6",bottom:"skirt"}, bio:"An excitable apprentice whose spells crackle a bit too much."},
  bram:   {n:"Bram",    r:3, cls:"Warrior", ult:"Shield Bash", look:{style:0,hair:"#c9893a",eye:"#8a5a2c",skin:"#c98e66",outfit:"#8a5a2c",outfit2:"#4a3a2a",bottom:"pants"}, bio:"A blacksmith's son with arms like tree trunks."},
  tamsin: {n:"Tamsin",  r:3, cls:"Rogue", ult:"Quick Cuts", look:{style:5,hair:"#2b2b33",eye:"#c8302c",skin:"#fde2d2",outfit:"#333a4d",outfit2:"#f4f0e6",bottom:"skirt"}, bio:"Quiet, quick, and always knows the shortcut."},
  fenn:   {n:"Fenn",    r:3, cls:"Ranger", ult:"Arrow Rain", look:{style:0,hair:"#8a5a2c",eye:"#2f9e6f",skin:"#8a5a3c",outfit:"#4f7a3a",outfit2:"#c9b78a",bottom:"pants"}, bio:"A hunter from the hills. Brings his own trail mix."},
  clover: {n:"Clover",  r:3, cls:"Cleric", ult:"Bless You!", look:{style:1,hair:"#ff9db4",eye:"#2f9e6f",skin:"#fde2d2",outfit:"#eeeeee",outfit2:"#6fbf73",bottom:"skirt"}, bio:"A cheerful novice healer. Sneezes glitter."}
};

/* ---------- state ---------- */
function ensureParty(){
  if(state.crystals===undefined) state.crystals = 0;        // the tutorial's first quest gives the first 200
  if(!state.party || typeof state.party!=="object") state.party = {owned:{}, team:[], pity:0, pulls:0};
  state.party.owned = state.party.owned || {}; state.party.team = (state.party.team||[]).filter(id=>state.party.owned[id]);
  if(state.party.pity===undefined) state.party.pity = 0;
  if(state.party.starterDone===undefined) state.party.starterDone = (state.party.pulls||0) > 1;
  if(state.party.pityC===undefined){ state.party.pityC = state.party.pity4||0; state.party.pityI = state.party.pity4||0; }
}
/* Every recruit arrives with their own weapon: a beginner one, or a stronger one for 5-stars */
const BUILTIN_W = {
  3:{sword:"w_rsword", staff:"w_ostaff", dagger:"w_bdagger", mace:"w_wmace", bow:"w_sbow"},
  4:{sword:"w_rsword", staff:"w_ostaff", dagger:"w_bdagger", mace:"w_wmace", bow:"w_sbow"},
  5:{sword:"w_ksword", staff:"w_sstaff", dagger:"w_adagger", mace:"w_hmace", bow:"w_lbow"}
};
const builtinWeapon = id => { const c=ROSTER[id]; return BUILTIN_W[c.r][CLASS_OF[c.cls]]; };
function charGear(id){ const o=state.party.owned[id]||{}; return {w:ITEMS[o.weapon]||ITEMS[builtinWeapon(id)], a:ITEMS[o.acc]||null}; }
function charStats(id){
  const c=ROSTER[id], o=state.party.owned[id]||{dupes:0}, b=RARITY_BASE[c.r], m=CLASS_MOD[c.cls], lb=1+.1*(o.dupes||0), g=charGear(id);
  const atk=Math.round((b.atk*m.atk + (g.w?g.w.atk*.8:0) + (g.a&&g.a.atk||0))*lb);
  const hp=Math.round((b.hp*m.hp + (g.a&&g.a.hp||0))*lb);
  return {atk, hp, lb:o.dupes||0};
}
function charSprite(id){ const c=ROSTER[id]; return PX.chibi({...c.look, eye:c.look.eye, weapon:CLASS_OF[c.cls], orb:c.el?EL_COL[c.el]:"#7fd8ff"}); }
const starStr = n => "★".repeat(n);
/** How many copies of an item are not equipped by anyone except `except` */
function freeCount(id, except){
  let used=0; const h=H();
  if(except!=="hero" && (h.weapon===id || h.armour===id || h.acc===id)) used++;
  for(const [cid,o] of Object.entries(state.party.owned)) if(cid!==except && (o.weapon===id||o.acc===id)) used++;
  return have(id)-used;
}

/* ---------- party screen ---------- */
let partyPick = null;  // slot index being changed
function renderPartyTab(){
  ensureHero(); ensureParty();
  if(!H().created || draft) return renderCreator();
  const team=state.party.team, owned=Object.keys(state.party.owned);
  const hs=heroStats();
  const slot = (i) => {
    const id=team[i];
    if(!id) return `<button class="pslot empty" data-act="p-slot" data-v="${i}"><span class="pplus">+</span><small>Add member</small></button>`;
    const c=ROSTER[id], s=charStats(id);
    return `<button class="pslot r${c.r}" data-act="p-slot" data-v="${i}">${pic(charPortrait(id))}<b>${c.n}</b><small>${CLASS_ICON[c.cls]} ${c.cls}${c.el?" "+EL_ICON[c.el]:""}</small><small>ATK ${s.atk} · HP ${s.hp}</small></button>`;
  };
  const sorted = owned.sort((a,b)=>ROSTER[b].r-ROSTER[a].r || ROSTER[a].n.localeCompare(ROSTER[b].n));
  return `<section class="frame"><span class="ribbon">YOUR PARTY</span>
      <div class="pslots">
        <button class="pslot hero" data-act="card" data-v="equip">${pic(heroPortrait())}<b>${esc(state.name)}</b><small>${CLASS_ICON[hs.cls]||""} ${hs.cls}${hs.el?" "+EL_ICON[hs.el]:""}</small><small>ATK ${hs.atk} · HP ${hs.maxHp}</small></button>
        ${slot(0)}${slot(1)}
      </div>
      <p class="note" style="margin:8px 0 0;text-align:center">Party Power <b style="color:var(--gold)">⚡${partyPower()}</b></p>
      <p class="note" style="margin:4px 0 0;text-align:center">${partyPick!==null?"Tap a character below to put them in this slot.":"Tap a slot to change who's in it. Your hero always fights."}</p>
    </section>
    <section class="frame"><span class="ribbon">ROSTER</span>
      ${sorted.length?`<div class="roster">${sorted.map(id=>{ const c=ROSTER[id], o=state.party.owned[id], inTeam=team.includes(id);
        return `<button class="rcard r${c.r} ${inTeam?'inteam':''}" data-act="${partyPick!==null?'p-put':'p-view'}" data-v="${id}">
          ${pic(charPortrait(id))}<span class="rstars">${starStr(c.r)}</span><b>${c.n}</b><small>${CLASS_ICON[c.cls]}${c.el?EL_ICON[c.el]:""} ${o.dupes?`LB${o.dupes}`:""}</small>${inTeam?'<span class="intag">IN PARTY</span>':""}</button>`; }).join("")}</div>`
      : `<div class="none">No companions yet! Recruit some at the tavern (Recruit tab). You've got ${state.crystals} 💎 waiting.</div><button class="gbtn" data-tab="gacha" style="margin-top:8px">💎 Go recruit</button>`}
      ${partyPick!==null?`<button class="gbtn plain" data-act="p-cancel" style="margin-top:10px">Cancel</button>`:""}
    </section>`;
}
function openChar(id){
  const c=ROSTER[id], o=state.party.owned[id], s=charStats(id), g=charGear(id), inTeam=state.party.team.includes(id);
  const wOpts=Object.keys(H().bag).filter(k=>ITEMS[k]&&ITEMS[k].slot==="weapon"&&ITEMS[k].t===CLASS_OF[c.cls]&&(freeCount(k,id)>0||o.weapon===k));
  const aOpts=Object.keys(H().bag).filter(k=>ITEMS[k]&&ITEMS[k].slot==="acc"&&(freeCount(k,id)>0||o.acc===k));
  const bw=ITEMS[builtinWeapon(id)];
  const chip=(k,slot,on)=>`<button class="chip ${on?'on':''}" data-act="p-equip" data-k="${slot}" data-v="${k}" data-id="${id}">${PX.img(PX.icon(ITEMS[k].t, ITEMS[k].el?EL_COL[ITEMS[k].el]:ITEMS[k].col),"ico")} ${ITEMS[k].n}</button>`;
  openModal(`<span class="ribbon">${starStr(c.r)} ${c.n.toUpperCase()}</span>
    <div class="chartop r${c.r}">${pic(charPortrait(id),"big")}
      <div><span class="clspill">${CLASS_ICON[c.cls]} ${c.cls}${c.el?" · "+EL_ICON[c.el]+" "+c.el:""}</span>
        <p class="note" style="margin:6px 0">${esc(c.bio)}</p>
        <div class="derived"><span>ATK <b>${s.atk}</b></span><span>HP <b>${s.hp}</b></span><span>LB <b>${s.lb}/5</b></span></div></div></div>
    <p class="note" style="margin:0"><b style="color:var(--gold)">Ultimate: ${esc(c.ult)}</b> · ${SKILLS[CLASS_OF[c.cls]].d}. ${CLASS_NOTE[c.cls]}</p>
    <div class="lbpips">${[1,2,3,4,5].map(i=>`<i class="${i<=s.lb?'on':''}"></i>`).join("")}<span class="note">Pull duplicates to limit break (+10% stats each)</span></div>
    ${gearSlots(id)}
    <div class="btns">
      ${inTeam?`<button class="gbtn blue" data-act="p-remove" data-v="${id}">Remove from party</button>`:state.party.team.length<2?`<button class="gbtn" data-act="p-add" data-v="${id}">Add to party</button>`:""}
      <button class="gbtn plain" data-act="close">Close</button>
    </div>`);
}

/* ---------- equipment: tidy slots + a filtered picker ---------- */
const SLOT_N = {weapon:"Weapon", armour:"Armour", acc:"Accessory"};
const itemIcon = (it, cls="ico") => PX.img(PX.icon(it.t, it.el?EL_COL[it.el]:it.col), cls);
function itemLine(it){
  if(it.slot==="weapon") return `${CLASSES[it.t]} · ATK ${it.atk}${it.el?" "+EL_ICON[it.el]:""}`;
  if(it.slot==="armour") return `DEF ${it.def} · HP +${it.hp||0}${it.agi?` · AGI +${it.agi}`:""}`;
  return [it.atk?`ATK +${it.atk}`:"", it.hp?`HP +${it.hp}`:"", it.def?`DEF +${it.def}`:""].filter(Boolean).join(" · ");
}
function currentGear(who, slot){
  if(who==="hero"){ const h=H(); return slot==="weapon"?h.weapon:slot==="armour"?h.armour:h.acc; }
  return (state.party.owned[who]||{})[slot]||null;
}
function gearSlots(who){
  const slots = who==="hero" ? ["weapon","armour","acc"] : ["weapon","acc"];
  return `<div class="gslots n${slots.length}">${slots.map(sl=>{
    let it=ITEMS[currentGear(who,sl)], own=false;
    if(!it && who!=="hero" && sl==="weapon"){ it=ITEMS[builtinWeapon(who)]; own=true; }
    return `<button class="gslot" data-act="p-gp-open" data-k="${sl}" data-id="${who}">
      <span class="gs-l">${SLOT_N[sl]}</span>${it?itemIcon(it,"gsico"):'<span class="gs-empty">+</span>'}
      <b>${it?esc(nm(it)):"Empty"}</b><small>${it?itemLine(it)+(own?" · their own":""):"Tap to equip"}</small></button>`; }).join("")}</div>
    ${who==="hero"?`<p class="note" style="margin:6px 0 0;text-align:center">Your weapon sets your class. Tap a slot to change gear.</p>`:""}`;
}
let GP = {who:null, slot:null, filter:"all"};
function openGearPicker(who, slot, filter){
  GP = {who, slot, filter: filter||"all"};
  const isHero = who==="hero", lockType = !isHero && slot==="weapon" ? CLASS_OF[ROSTER[who].cls] : null;
  let ids = Object.keys(H().bag).filter(k=>ITEMS[k] && ITEMS[k].slot===slot && have(k)>0);
  if(lockType) ids = ids.filter(k=>ITEMS[k].t===lockType);
  if(isHero && slot==="weapon" && GP.filter!=="all") ids = ids.filter(k=>ITEMS[k].t===GP.filter);
  const score = it => (it.atk||0)*2 + (it.def||0)*2 + (it.hp||0)*.5;
  ids.sort((a,b)=>score(ITEMS[b])-score(ITEMS[a]));
  const cur = currentGear(who, slot);
  const usedBy = id => { const u=[], h=H(); if(h.weapon===id||h.armour===id||h.acc===id) u.push(state.name||"You");
    for(const [cid,o] of Object.entries(state.party.owned)) if(o.weapon===id||o.acc===id) u.push(ROSTER[cid].n); return u; };
  const row = (id, it, opts={}) => {
    const on = opts.builtin ? !cur : cur===id, free = opts.builtin ? 1 : freeCount(id, who);
    const status = on ? "Equipped" : free>0 ? (opts.builtin ? "Their own weapon" : `${free} spare`) : `In use: ${usedBy(id).join(", ")}`;
    const btn = on ? (slot==="acc" ? `<button class="gbtn sm plain" data-act="p-gp-pick" data-v="">Remove</button>` : `<span class="eqtag">✔ ON</span>`)
              : free>0 ? `<button class="gbtn sm" data-act="p-gp-pick" data-v="${opts.builtin?"":id}">Equip</button>` : `<span class="eqtag off">In use</span>`;
    return `<div class="gprow ${on?"on":""}">${itemIcon(it,"gpico")}<span><b>${esc(nm(it))}</b><small>${itemLine(it)}</small><small class="${on?"st-on":free>0?"":"st-off"}">${status}</small></span>${btn}</div>`;
  };
  const types = ["sword","staff","dagger","mace","bow"];
  const who_n = isHero ? (state.name||"You") : ROSTER[who].n;
  openModal(`<span class="ribbon">${SLOT_N[slot].toUpperCase()}</span>
    <p class="note" style="margin:0;text-align:center">Equipping for <b>${esc(who_n)}</b>${lockType?` · ${ROSTER[who].cls}s use ${lockType}s only`:isHero&&slot==="weapon"?" · your weapon sets your class":""}</p>
    ${isHero&&slot==="weapon"?`<div class="chips gpf"><button class="chip ${GP.filter==="all"?"on":""}" data-act="p-gp-filter" data-v="all">All</button>${types.map(t=>`<button class="chip ${GP.filter===t?"on":""}" data-act="p-gp-filter" data-v="${t}">${TYPE_ICON[t]}</button>`).join("")}</div>`:""}
    <div class="gplist">
      ${!isHero && slot==="weapon" ? row(null, ITEMS[builtinWeapon(who)], {builtin:true}) : ""}
      ${ids.map(id=>row(id, ITEMS[id])).join("") || (lockType?"":`<div class="none">Nothing here yet. Find gear in the Shop, Crafting or Recruit.</div>`)}
      ${lockType && !ids.length ? `<div class="none">No spare ${lockType}s yet. Buy one in the Shop or recruit one at the tavern.</div>`:""}
    </div>
    <div class="btns"><button class="gbtn plain" data-act="${isHero?"close":"p-view"}" data-v="${isHero?"":who}">Back</button></div>`);
}
function pickGear(v){
  const {who, slot} = GP;
  if(who==="hero"){
    const h=H();
    if(slot==="acc") h.acc = v || null; else if(v){ if(slot==="weapon") h.weapon=v; else h.armour=v; }
    save(); closeModal(); render(); if(v) toast(slot==="weapon" ? `Class: ${heroStats().cls}` : `Equipped ${ITEMS[v].n}`);
  } else {
    const o=state.party.owned[who]; if(!o) return;
    if(v && freeCount(v, who)<=0){ toast("That one's already equipped by someone else."); return; }
    o[slot] = v || null; save(); render(); openChar(who); if(v) toast(`${ROSTER[who].n} equipped ${ITEMS[v].n}`);
  }
}

/* ---------- gacha ---------- */
const PULL_COST = 20;
const RATES = {5:.03, 4:.15};
const PITY = 100, PITY4 = 10;
function poolFor(r){
  return {chars:Object.keys(ROSTER).filter(k=>ROSTER[k].r===r),
          items:Object.keys(ITEMS).filter(k=>ITEMS[k].gacha===r && k.indexOf("@")<0)};
}
const CHAR_RATE = .25;
const MAXED_GEMS = {3:5, 4:15, 5:50};   // dupes of a fully limit-broken (LB5) character turn into crystals
function rollOne(){
  const P=state.party; P.pity++; P.pityC++; P.pityI++; P.pulls=(P.pulls||0)+1;
  const x=Math.random();
  let r = P.pity>=PITY || x<RATES[5] ? 5 : x<RATES[5]+RATES[4] ? 4 : 3;
  let isChar = Math.random()<CHAR_RATE;
  // pity: a 4-star+ character AND a 4-star+ item at least every 10 pulls (singles count).
  // If both are due together, the item comes first and the character on the next pull.
  if(P.pityC>=PITY4 && !(P.pityI>PITY4)){ isChar=true; r=Math.max(r,4); }
  else if(P.pityI>=PITY4 || (P.pityI>=PITY4-1 && P.pityC>=PITY4-1)){ isChar=false; r=Math.max(r,4); }
  if(r===5) P.pity=0;
  if(r>=4){ if(isChar) P.pityC=0; else P.pityI=0; }
  return giveRoll(isChar, r);
}
function giveRoll(isChar, r){
  const P=state.party, pool=poolFor(r);
  const list = isChar ? pool.chars : pool.items;
  const id = list[Math.floor(Math.random()*list.length)];
  if(isChar){
    const o=P.owned[id];
    if(!o){ P.owned[id]={dupes:0}; return {kind:"char", id, r, isNew:true}; }
    if(o.dupes<5){ o.dupes++; return {kind:"char", id, r, dupe:o.dupes}; }
    state.crystals += MAXED_GEMS[r]; return {kind:"char", id, r, refund:MAXED_GEMS[r]};
  }
  addBag(id,1);
  return {kind:"item", id, r, isNew: have(id)===1};
}
function doPull(n){
  ensureParty();
  if(typeof Tut!=="undefined" && Tut.active()){
    if(!Tut.wantsFour()){ toast("Lilia: Save those crystals for after the tutorial! ✨"); return; }
    if(n!==1){ toast("Lilia: Just a single recruit for now!"); return; }
  }
  if(state.party.starter){ showPulls(state.party.starter.res, true); return; }
  const cost=n*PULL_COST;
  if(state.crystals<cost){ toast(`Not enough 💎. You need ${cost}. Clear quests to earn more!`); return; }
  state.crystals-=cost;
  if(n===10 && starterReady()){
    const P=state.party; P.starter={snap:JSON.stringify({party:{...P, starter:undefined}, bag:H().bag, crystals:state.crystals})};
    P.starter.res = starterRoll(); save(); render(); showPulls(P.starter.res, true); return;
  }
  const res=[]; for(let i=0;i<n;i++) res.push(rollOne());
  if(typeof Tut!=="undefined" && Tut.wantsFour() && !res.some(x=>x.kind==="char"&&x.r===4)){
    let i = res.findIndex(x=>x.kind==="item" && x.r<5);
    if(i<0) i = res.findIndex(x=>x.r===3);
    if(i<0) i = res.length-1;
    res[i] = swapForChar(res[i], 4); state.party.pityC = 0;
  }
  if(typeof Tut!=="undefined") Tut.pulled(res);
  save(); render();
  showPulls(res);
}
/* ---------- starter x10: first x10 after the tutorial guarantees a 5-star character, free rerolls ---------- */
const starterReady = () => state.tut && state.tut.done && !state.party.starterDone;
function starterRoll(){
  const res=[]; for(let i=0;i<10;i++) res.push(rollOne());
  if(!res.some(x=>x.kind==="char"&&x.r===5)){
    let i=res.findIndex(x=>x.kind==="item"&&x.r===3); if(i<0) i=res.findIndex(x=>x.r===3); if(i<0) i=res.length-1;
    res[i]=swapForChar(res[i],5); state.party.pity=0;
  }
  return res;
}
function starterReroll(){
  const P=state.party; if(!P.starter) return;
  const s=JSON.parse(P.starter.snap), keep=P.starter.snap;
  state.party=s.party; delete state.party.starter; H().bag=s.bag; state.crystals=s.crystals;
  state.party.starter={snap:keep}; state.party.starter.res=starterRoll(); save(); render();
  showPulls(state.party.starter.res, true);
}
function starterKeep(){
  const P=state.party; if(!P.starter) return; const res=P.starter.res;
  delete P.starter; P.starterDone=true; save(); render();
  const fx=$("gachafx"); fx.className="gachafx"; fx.innerHTML="";
  const f=res.find(x=>x.kind==="char"&&x.r===5); if(f) say(`${ROSTER[f.id].n} joined the guild! Great pick~ Go set up your party!`);
}
/* Replace a pull result with a character of the given rarity (undoing what the original result gave) */
function swapForChar(x, r){
  const P=state.party;
  if(x.kind==="item") addBag(x.id,-1);
  else if(x.refund) state.crystals-=x.refund; else if(x.isNew) delete P.owned[x.id]; else P.owned[x.id].dupes--;
  const pool=Object.keys(ROSTER).filter(k=>ROSTER[k].r===r), fresh=pool.filter(k=>!P.owned[k]);
  const id=(fresh.length?fresh:pool)[Math.floor(Math.random()*(fresh.length?fresh:pool).length)];
  const o=P.owned[id];
  if(!o){ P.owned[id]={dupes:0}; return {kind:"char", id, r, isNew:true}; }
  if(o.dupes<5){ o.dupes++; return {kind:"char", id, r, dupe:o.dupes}; }
  state.crystals += MAXED_GEMS[r]; return {kind:"char", id, r, refund:MAXED_GEMS[r]};
}
function renderGachaTab(){
  ensureHero(); ensureParty();
  if(!H().created) return needHero();
  const P=state.party, feat=["mirelle","ryuu","aurelia"];
  return `<section class="frame banner5"><span class="ribbon">TAVERN RECRUITMENT</span>
      <div class="bannerart">${feat.map((id,i)=>`<div class="bfig f${i}">${pic(charPortrait(id))}</div>`).join("")}
        <div class="btitle"><small>FEATURED ★5</small><b>Heroes of the Guild</b></div></div>
      <div class="gstats"><span>💎 <b>${state.crystals}</b></span><span>★4+ hero in <b>${Math.max(1,PITY4-P.pityC)}</b> · ★4+ gear in <b>${Math.max(1,PITY4-P.pityI)}</b> · ★5 in <b>${PITY-P.pity}</b></span></div>
      ${P.starter||starterReady()?`<div class="starterbnr"><b class="sb-t">⭐ STARTER BONUS ⭐</b><span>Your first ×10 <b>guarantees a ★5 character</b>! Don't like what you got? <b>Reroll it for free</b> as many times as you want. No extra 💎!</span></div>`:""}
      <div class="pullbtns">
        <button class="gbtn blue" data-act="pull" data-v="1">Recruit ×1<small>${PULL_COST} 💎</small></button>
        <button class="gbtn" data-act="pull" data-v="10">${P.starter?"Finish starter ×10<small>reroll or keep</small>":starterReady()?`Starter ×10<small>${PULL_COST*10} 💎 · ★5 guaranteed · free rerolls</small>`:`Recruit ×10<small>${PULL_COST*10} 💎</small>`}</button>
      </div>
      <p class="note" style="margin:8px 0 0;text-align:center">Rates: ★5 3% · ★4 15% · ★3 82%. 25% characters, 75% gear (all gacha-exclusive).<br>Every 10 pulls guarantees a ★4+ character AND a ★4+ piece of gear (single pulls count too), and a ★5 at least every 100. Duplicate characters limit-break (once maxed at LB5, dupes give 💎: ★3 = 5, ★4 = 15, ★5 = 50). Duplicate weapons can be forged.</p>
        </section>
    <section class="frame"><span class="ribbon">EARN CRYSTALS</span>
      <div class="earn"><span>🧹 Chore quests</span><b>E 5 · D 8 · C 12 · B 16 · A 20 💎</b></div>
      <div class="earn"><span>📜 Hunt &amp; Gather contracts</span><b>10 💎 each</b></div>
      <div class="earn"><span>⚔️ First clear of each hunt</span><b>30 💎</b></div>
      ${Ads.card()}
      <p class="note" style="margin:6px 0 0;text-align:center">Crystals only come from playing. No real money, ever.</p>
    </section>`;
}
function showPulls(res, starter){
  const fx=$("gachafx");
  const best=Math.max(...res.map(x=>x.r));
  fx.className="gachafx show"+(best===5?" gold":best===4?" purple":"");
  fx.innerHTML=`<div class="gf-rays"></div><div class="gf-grid n${res.length}">${res.map((x,i)=>{
      const it=x.kind==="item"?ITEMS[x.id]:null, c=x.kind==="char"?ROSTER[x.id]:null;
      const art = c ? pic(charPortrait(x.id)) : PX.img(PX.icon(it.t, it.el?EL_COL[it.el]:it.col));
      const tag = x.isNew?'<span class="gnew">NEW</span>':x.dupe?`<span class="gnew lb">LB${x.dupe}</span>`:x.refund?`<span class="gnew lb">+${x.refund}💎</span>`:"";
      return `<button class="gpull r${x.r}" style="--d:${i*.12}s" data-i="${i}"><span class="gback">✦</span><span class="gfront ${c?"is-char":"is-item"}">
        <span class="gart">${art}</span><span class="gst">${starStr(x.r)}</span>
        <span class="ginfo">${tag}<b>${c?c.n:it.n}</b><small>${c?`${CLASS_ICON[c.cls]} ${c.cls}`:`${TYPE_ICON[it.t]||"✦"} ${it.slot==="weapon"?CLASSES[it.t]+" weapon":it.slot==="armour"?"Armour":"Accessory"}`}</small></span></span></button>`;
    }).join("")}</div>
    ${starter?`<p class="gf-note">⭐ Starter recruitment: a ★5 is guaranteed. Rerolling is <b>free</b>, no crystals spent. Reroll as many times as you like, then keep the set you want!</p>`:""}
    <div class="gf-btns"><button class="gbtn blue" id="gfReveal">${res.length>1?"Reveal all":"Reveal"}</button>${starter
      ?`<span id="gfDone" hidden class="gf-pair"><button class="gbtn plain" id="gfReroll">🔄 Reroll <small class="freetag">FREE</small></button><button class="gbtn" id="gfKeep">✅ Keep these</button></span>`
      :`<button class="gbtn plain" id="gfDone" hidden>Continue</button>`}</div>`;
  const cards=[...fx.querySelectorAll(".gpull")];
  const flip=c=>{ if(c.classList.contains("open")) return; c.classList.add("open"); if(cards.every(x=>x.classList.contains("open"))){ $("gfReveal").hidden=true; $("gfDone").hidden=false; } };
  cards.forEach(c=>c.onclick=()=>flip(c));
  $("gfReveal").onclick=()=>cards.forEach((c,i)=>setTimeout(()=>flip(c), i*110));
  if(starter){ $("gfReroll").onclick=starterReroll; $("gfKeep").onclick=starterKeep; return; }
  $("gfDone").onclick=()=>{ fx.className="gachafx"; fx.innerHTML="";
    const new5=res.find(x=>x.kind==="char"&&x.r===5&&x.isNew);
    say(new5?`${ROSTER[new5.id].n} joined the guild?! That's amazing! Go say hi on the Party screen!`:pick(["Welcome your new recruits! Don't forget to set your party.","The tavern's buzzing tonight! Good haul~","More friends for the adventure! I'll update the guild roster."]));
  };
}

/* ---------- actions ---------- */
function partyAct(b){
  const act=b.dataset.act, v=b.dataset.v, P=state.party;
  if(act==="p-slot"){ partyPick=+v; render(); return true; }
  if(act==="p-cancel"){ partyPick=null; render(); return true; }
  if(act==="p-put"){ const i=partyPick; const t=P.team.filter(x=>x!==v); if(i>=t.length) t.push(v); else t.splice(i,0,v); P.team=t.slice(0,2); partyPick=null; save(); render(); toast(`${ROSTER[v].n} joined your party!`); return true; }
  if(act==="p-view"){ openChar(v); return true; }
  if(act==="p-gp-open"){ openGearPicker(b.dataset.id, b.dataset.k); return true; }
  if(act==="p-gp-filter"){ openGearPicker(GP.who, GP.slot, v); return true; }
  if(act==="p-gp-pick"){ pickGear(v); return true; }
  if(act==="p-add"){ if(P.team.length<2&&!P.team.includes(v)){ P.team.push(v); save(); closeModal(); render(); toast(`${ROSTER[v].n} joined your party!`); } return true; }
  if(act==="p-remove"){ P.team=P.team.filter(x=>x!==v); save(); closeModal(); render(); return true; }
  if(act==="p-equip"){ const id=b.dataset.id, slot=b.dataset.k, o=P.owned[id]; if(!o) return true;
    if(!v || o[slot]===v) o[slot]=null; else if(freeCount(v,id)>0) o[slot]=v; else { toast("That one's already equipped by someone else."); return true; }
    save(); openChar(id); render(); return true; }
  if(act==="pull"){ doPull(+v); return true; }
  return false;
}
