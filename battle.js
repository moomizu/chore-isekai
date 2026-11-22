/* ================= Rhythm battles: chiptune music, waves, packs, bosses, holds, skill cut-ins ================= */

const HUNTS = [
  {id:"training",n:"Training Grounds",lv:0,rank:"F",fee:0,bpm:104,tier:2,training:true,waves:[["dummy"],["dummy","dummy"]]},
  {id:"fields",n:"Slime Fields",lv:0,rank:"F",fee:5,bpm:112,tier:1,waves:[["slime"],["slime","slime"]],boss:{base:"slime",n:"King Slime",hp:3.2,atk:1.4}},
  {id:"grove",n:"Mushroom Grove",lv:0,rank:"E",fee:8,bpm:120,tier:2,waves:[["shroom"],["shroom","slime"]],boss:{base:"shroom",n:"Elder Shroom",hp:3,atk:1.4}},
  {id:"cave",n:"Bat Cave",lv:0,rank:"E",fee:12,bpm:130,tier:3,waves:[["bat","bat"],["bat","bat","bat"]],boss:{base:"bat",n:"Count Batula",hp:3,atk:1.5}},
  {id:"camp",n:"Goblin Camp",lv:0,rank:"D",fee:18,bpm:138,tier:4,waves:[["goblin"],["goblin","goblin"],["goblin","bat","goblin"]],boss:{base:"goblin",n:"Goblin Chief",hp:3,atk:1.5}},
  {id:"ruins",n:"Golem Ruins",lv:0,rank:"C",fee:28,bpm:146,tier:5,waves:[["golem"],["bat","golem","bat"]],boss:{base:"golem",n:"Ancient Golem",hp:2.6,atk:1.4}},
  {id:"peak",n:"Wyvern Peak",lv:0,rank:"B",fee:40,bpm:156,tier:6,waves:[["wyvern"],["golem","wyvern"]],boss:{base:"wyvern",n:"Storm Queen",hp:2.6,atk:1.5}}
];
const MON = id => MONSTERS.find(m=>m.id===id);
const MATCHUP = {
  dummy:{weak:[],resist:[]},
  slime:{weak:["Mage"],resist:["Warrior","Rogue"],el:"thunder"},
  shroom:{weak:["Mage","Warrior"],resist:["Cleric"],el:"fire"},
  bat:{weak:["Ranger","Cleric"],resist:["Warrior"]},
  goblin:{weak:["Warrior","Rogue"],resist:["Ranger"]},
  golem:{weak:["Mage","Cleric"],resist:["Rogue","Ranger"],el:"ice"},
  wyvern:{weak:["Ranger","Mage"],resist:["Warrior"],el:"ice"}
};
function weakChips(id){
  const m=MATCHUP[id]||{weak:[],resist:[]};
  const w=m.weak.map(c=>CLASS_ICON[c]+(c==="Mage"&&m.el?EL_ICON[m.el]:"")).join("");
  const r=m.resist.map(c=>CLASS_ICON[c]).join("");
  return (w?`<span class="wk">▲${w}</span>`:"")+(r?`<span class="rs">▼${r}</span>`:"");
}
function buildParty(){
  const hs=heroStats(), h=H();
  const hero={kind:"hero", n:state.name||"Hero", cls:hs.cls, el:hs.el, atk:hs.atk, hp:hs.maxHp, sprite:heroChibi(), portrait:heroPortrait(),
              ult:{...hs.skill, fx:(hs.cls==="Mage"&&hs.el)?hs.el:hs.skill.fx}, col:LOOK.outfit[fixLook(h.look).topCol]||"#2f63e6"};
  const mem=[hero];
  ensureParty();
  for(const id of state.party.team){ const c=ROSTER[id]; if(!c) continue; const s=charStats(id), sk=SKILLS[CLASS_OF[c.cls]];
    mem.push({kind:"char", id, n:c.n, cls:c.cls, el:c.el||null, atk:s.atk, hp:s.hp, sprite:charChibi(id), portrait:charPortrait(id), ult:{...sk, n:c.ult, fx:c.el||sk.fx}, col:c.look.outfit}); }
  mem.forEach((m,i)=>{ m.i=i; m.gauge=0; });
  return mem;
}
function matchMult(m, foe){
  const mu=MATCHUP[foe.id]||{weak:[],resist:[]}; let x=1, tag="";
  if(mu.weak.includes(m.cls)){ x=1.5; tag="WEAK!"; }
  else if(mu.resist.includes(m.cls)){ x=.6; tag="RESIST"; }
  if(m.cls==="Mage" && mu.el && m.el===mu.el){ x*=1.4; tag="SUPER EFFECTIVE!"; }
  return {x, tag};
}


/* ---------- monster levelling ----------
   Foes scale to your party instead of having fixed stats, so strong pulls can't one-shot everything.
   hits = rough number of party hits to kill one at a fair fight, dmg = share of party HP each hit takes.
   Hunts of your current top rank float a little above your Power. Once a newer area unlocks, the older
   ones freeze where they were, so they get easier and easier as you keep growing. */
const FOE_SHAPE = {dummy:{hits:8,dmg:.015}, slime:{hits:8,dmg:.035}, shroom:{hits:9,dmg:.04}, bat:{hits:5,dmg:.03},
                   goblin:{hits:9,dmg:.045}, golem:{hits:15,dmg:.06}, wyvern:{hits:12,dmg:.05}};
function partyStats(){
  const hs=heroStats(); ensureParty();
  const m=[{atk:hs.atk, hp:hs.maxHp}, ...state.party.team.filter(id=>ROSTER[id]).map(id=>charStats(id))];
  return {avgAtk: m.reduce((a,x)=>a+x.atk,0)/m.length, hp: m.reduce((a,x)=>a+x.hp,0), def: hs.def, n: m.length};
}
function partyPower(ps){ ps=ps||partyStats(); return Math.round(Math.sqrt(ps.avgAtk*ps.hp)*3); }
/** How hard a hunt is for you right now, relative to your Power (1 = even fight) */
function huntChallenge(hunt, pow){
  if(hunt.training) return .9;
  if(hunt.tutorial || (typeof Tut!=="undefined" && Tut.active())) return .8;
  if(hunt.exam) return 1.05;
  if(hunt.story || hunt.recap) return 1;
  const list=HUNTS.filter(x=>!x.training), i=list.indexOf(hunt); if(i<0) return 1;
  pow = pow || partyPower();
  const open=list.filter(x=>Rank.atLeast(x.rank)); if(!open.includes(hunt)) return 1.1;
  const top=open[open.length-1].rank, peers=open.filter(x=>x.rank===top);
  const hp = state.huntPow || (state.huntPow={});
  if(hunt.rank===top){   // newest area: floats with you, and remembers the toughest it ever got
    const c = 1.12 - .07*(peers.length-1-peers.indexOf(hunt));
    hp[hunt.id] = Math.max(hp[hunt.id]||0, Math.round(pow*c));
    return c;
  }
  if(!hp[hunt.id]) hp[hunt.id] = Math.round(pow*Math.max(.6, 1 - .12*(open.length-1-open.indexOf(hunt))));   // old save: guess
  return Math.min(1.12, Math.max(.45, hp[hunt.id]/pow));
}
function huntLabel(c){ return c>=1.05?["Tough","tough"] : c>=.9?["Even","even"] : c>=.7?["Easy","easy"] : ["Breeze","breeze"]; }
function scaleFoe(id, bs, c, ps){
  const m=MON(id), sh=FOE_SHAPE[id]||{hits:8,dmg:.04}, df=Math.min(.35, (m.def||0)/40);
  const hp=Math.max(20, Math.round(ps.avgAtk*(1.1-df)*sh.hits*c*(bs?bs.hp:1)));
  const atk=Math.max(3, Math.round(ps.hp*sh.dmg*c*(bs?bs.atk:1) + ps.def/4));
  return {hp, atk, def:Math.round(ps.avgAtk*df)};
}

/* ---------- chiptune engine ---------- */
const Music = (() => {
  let ctx=null, master=null, noiseBuf=null, timer=0, step=0, nextT=0, bpm=120, boss=false, playing=false;
  let on = true, offset = 0;
  try{ on = localStorage.getItem("guild-sound")!=="off"; offset = Math.round((+(localStorage.getItem("guild-offset")||0) || 0)/10)*10; }catch(e){}
  const mtof = m => 440*Math.pow(2,(m-69)/12);
  function init(){
    if(ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? .3 : 0; master.connect(ctx.destination);
    const len = ctx.sampleRate*.5; noiseBuf = ctx.createBuffer(1,len,ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
    return true;
  }
  function tone(m,t,dur,type,vol){
    const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type; o.frequency.value=mtof(m);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.005); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+.03);
  }
  function kick(t,v){
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(42,t+.12);
    g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.001,t+.16);
    o.connect(g); g.connect(master); o.start(t); o.stop(t+.18);
  }
  function noise(t,dur,freq,type,v){
    const s=ctx.createBufferSource(); s.buffer=noiseBuf; const f=ctx.createBiquadFilter(); f.type=type; f.frequency.value=freq;
    const g=ctx.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.001,t+dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+dur+.03);
  }
  const PROG = {
    normal:[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],   // Am F C G
    boss:[[57,60,64],[57,60,64],[53,57,60],[52,56,59]]       // Am Am F E
  };
  function playStep(s,t){
    const pos=s%16, bar=Math.floor(s/16), six=60/bpm/4;
    if(bar===0){ if(pos%4===0) noise(t,.05,7000,"highpass",.25); return; } // count-in
    const ch=(boss?PROG.boss:PROG.normal)[(bar-1)%4];
    if(pos===0||pos===8||(boss&&(pos===4||pos===12))||(!boss&&pos===10)) kick(t,.9);
    if(pos===4||pos===12) noise(t,.15,1900,"bandpass",.55);
    if(pos%2===0) noise(t,.035,8000,"highpass",.14); else if(boss) noise(t,.025,9000,"highpass",.06);
    if(pos%2===0) tone(ch[0]-24+(pos%4===2?12:0), t, six*1.7, "square", .085);
    tone(ch[pos%3]+12+(pos>=8?12:0), t, six*.9, "square", .035);
    if(boss && (pos===0||pos===6||pos===12)) tone(ch[(pos/6)|0]+24, t, six*2.5, "triangle", .07);
  }
  function sched(){ while(nextT < ctx.currentTime+.12){ playStep(step,nextT); nextT += 60/bpm/4; step++; } }
  return {
    get on(){ return on; },
    get offset(){ return offset; },
    setOffset(ms){ offset=Math.max(-300,Math.min(300,Math.round(ms/10)*10)); try{ localStorage.setItem("guild-offset", offset); }catch(e){} },
    clicks(bpm, n){
      if(!init()) return null;
      if(ctx.state==="suspended") ctx.resume();
      const beat=60/bpm, t0=ctx.currentTime+.4;
      master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(.3, ctx.currentTime);
      for(let i=0;i<n;i++){ tone(i%4===0?93:86, t0+i*beat, .06, "square", i%4===0?.13:.09); kick(t0+i*beat,.5); }
      return t0;
    },
    start(b){
      if(!init()) return null;
      if(ctx.state==="suspended") ctx.resume();
      bpm=b; boss=false; step=0; nextT=ctx.currentTime+.15; playing=true;
      master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(on?.3:0, ctx.currentTime);
      clearInterval(timer); timer=setInterval(sched,25); sched();
      return nextT - (60/bpm/4)*step + 0;  // time of step 0
    },
    t0(){ return null; },
    setBoss(v){ boss=v; },
    stop(){
      if(!ctx||!playing) return; playing=false; clearInterval(timer);
      const t=ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value,t); master.gain.linearRampToValueAtTime(0,t+.3);
    },
    clock(){ return ctx ? ctx.currentTime - (ctx.outputLatency||0) : performance.now()/1000; },
    toggle(){
      on=!on; try{ localStorage.setItem("guild-sound", on?"on":"off"); }catch(e){}
      if(ctx&&playing){ master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(on?.3:0, ctx.currentTime); }
      return on;
    },
    sfx(kind){
      if(!ctx||!playing||!on) return; const t=ctx.currentTime;
      if(kind==="perfect"){ tone(88,t,.08,"square",.06); tone(95,t+.04,.1,"square",.05); }
      else if(kind==="good") tone(84,t,.07,"square",.05);
      else if(kind==="miss") noise(t,.12,400,"lowpass",.35);
      else if(kind==="block"){ tone(91,t,.12,"triangle",.09); noise(t,.06,5000,"highpass",.2); }
      else if(kind==="hurt"){ noise(t,.2,700,"lowpass",.5); tone(40,t,.15,"sawtooth",.08); }
      else if(kind==="skill"){ [72,76,79,84,88].forEach((m,i)=>tone(m,t+i*.05,.25,"square",.06)); }
      else if(kind==="win"){ master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(.3,t); [72,76,79,84].forEach((m,i)=>tone(m,t+i*.12,.35,"square",.08)); tone(84,t+.5,.8,"triangle",.1); }
    }
  };
})();

/* ---------- hunt list ---------- */
function renderHunt(){
  const lvl=heroLevel(), h=H(), pow=partyPower();
  const row = x => {
    const c=x.training?null:huntChallenge(x, pow), lab=c&&huntLabel(c);
    const locked=!Rank.atLeast(x.rank), poor=state.gold<x.fee;
    const ids=[...new Set(x.waves.flat())];
    const thumbs=ids.map(id=>`<div class="thumb sm">${monsterSVG(id)}</div>`).join("") + (x.boss?`<div class="thumb sm">${monsterSVG(x.boss.base,true)}</div>`:"");
    const waves=x.waves.length+(x.boss?1:0);
    return `<div class="row hunt"><span><b>${x.n}</b>${locked||!lab?"":` <span class="hdiff ${lab[1]}">${lab[0]} · ⚡${Math.round(pow*c)}</span>`}
        <small>${locked?`🔒 Unlocks at ${x.rank}-Rank`:`${waves} waves${x.boss?` · Boss: ${x.boss.n}`:""} · ♪ ${x.bpm} BPM${x.training?" · free, no rewards":""}`}${h.cleared[x.id]?` · Cleared ×${h.cleared[x.id]}`:""}</small>
        <span class="thumbs">${thumbs}</span>
        ${locked?"":`<span class="wklist">${ids.concat(x.boss?[]:[]).map(id=>`<span>${esc(MON(id).n.split(" ").pop())} ${weakChips(id)}</span>`).join("")}</span>`}</span>
      <button class="gbtn sm ${x.training?'blue':''}" data-act="g-hunt" data-v="${x.id}" ${locked||poor?"disabled":""}>${locked?"Locked":x.training?"Train":`${x.fee} G`}</button></div>`;
  };
  return `<section class="frame"><span class="ribbon">TRAINING GROUNDS</span>${row(HUNTS[0])}
    <p class="note" style="margin:6px 0 0;text-align:center">🎧 Sound on! Rings land on the beat. Coloured rings = your party's hits, red = block, long rings = hold.</p>
    <p class="note" style="margin:4px 0 0;text-align:center">▲ = weak to (bonus damage) · ▼ = resists. Mages with the matching element (🔥❄️⚡) are super effective!</p></section>
    <section class="frame"><span class="ribbon">MONSTER HUNTS</span>
    <p class="note" style="margin:0 0 4px;text-align:center">Your party Power: <b style="color:var(--gold)">⚡${pow}</b>. The newest areas grow with you. Older ones get easier as you get stronger.</p>${HUNTS.slice(1).map(row).join("")}
    <p class="note" style="margin:8px 0 0;text-align:center">Clear every wave to win the gold. Drops are yours to keep even if you lose.</p></section>`;
}

/* ---------- battle ---------- */
function startHunt(id){
  const hunt = typeof id==="object" ? id : HUNTS.find(x=>x.id===id); if(!hunt) return;
  if(hunt.rank && !Rank.atLeast(hunt.rank)){ toast(`Reach ${hunt.rank}-Rank first!`); return; }
  if(state.gold<hunt.fee){ toast("Not enough gold. Clear some chore quests!"); return; }
  if(hunt.fee){ state.gold-=hunt.fee; save(); }
  render();
  const buff = huntBuff && have(huntBuff) ? ITEMS[huntBuff] : null;   // tonic / meal picked before the hunt
  if(buff){ addBag(huntBuff,-1); save(); } huntBuff = null;
  const hs=heroStats(), h=H(), party=buildParty();
  const t0=Music.start(hunt.bpm) ?? (performance.now()/1000+.15);
  const beat=60/hunt.bpm, maxHp=Math.round(party.reduce((a,m)=>a+m.hp,0)*((buff&&buff.hpx)||1));
  B={hunt, hs, party, buff, hp:maxHp, maxHp, beat, bar:beat*4, eighth:beat/2, app:Math.max(.6,beat*2), t0,
     win:{perfect:hs.win.perfect/1000, good:hs.win.good/1000},
     notes:[], events:[], foes:[], wave:-1, waves:waveList(hunt), target:0, loot:{}, over:false, queue:[], rr:0,
     hold:null, checkAt:Infinity, roundEnd:0, clearing:false};
  B.ps=partyStats(); B.chal=huntChallenge(hunt, partyPower(B.ps)); save();
  arenaOpen(`
    <div class="ar-top"><div class="ar-name"><span>${esc(hunt.n)}</span><span id="waveTxt" class="sub"></span>
      <button class="mute" data-act="g-mute" aria-label="Toggle sound">${Music.on?"🔊":"🔇"}</button></div></div>
    <div class="field" id="field" style="background:${(MON(hunt.boss?hunt.boss.base:hunt.waves[0][0])).bg}">
      <div class="banner" id="bnr">Get ready…</div>
      <div id="foes"></div>
      <div class="partyrow n${party.length}" id="heroEl">${party.map(m=>`<div class="pm" id="pm${m.i}" style="--mc:${m.col}"><div class="sprite">${pic(m.sprite)}</div></div>`).join("")}</div>
      <div id="rings"></div>
      <div class="cutin" id="cutin"></div>
      <div class="flashfx" id="flashfx"></div>
    </div>
    <div class="ar-bot">
      <div class="hrow"><span>HP</span><div class="hpbar me"><i id="hhpBar" style="width:100%"></i></div><span id="hhpTxt"></span></div>
      <div class="ults">${party.map(m=>`<button class="ultbtn" id="ult${m.i}" data-act="g-ult" data-v="${m.i}" style="--mc:${m.col}" disabled><span class="ug" id="ug${m.i}"></span>${pic(m.portrait)}<small>${esc(m.n)}</small></button>`).join("")}</div>
      <div class="ctrl">
        <button class="gbtn blue" id="potBtn" data-act="g-potion" data-v="p_potion">🧪</button>
        <button class="gbtn blue" id="hiBtn" data-act="g-potion" data-v="p_hipotion">✨</button>
        <button class="gbtn plain" data-act="g-run">Run</button>
      </div>
    </div>`);
  const f=$("field");
  f.addEventListener("pointerdown", onDown);
  f.addEventListener("pointerup", onUp);
  f.addEventListener("pointercancel", onUp);
  updateBars();
  nextWave(t0 + B.bar);
  cancelAnimationFrame(loopId); loopId=requestAnimationFrame(loop);
}
function waveList(h){ const w=h.waves.map(x=>x.map(id=>({id}))); if(h.boss) w.push([{id:h.boss.base, boss:h.boss}]); return w; }
function event(t, fn, tag){ B.events.push({t, fn, tag}); }

function nextWave(startAt){
  B.wave++;
  if(B.wave>=B.waves.length){ victory(); return; }
  const list=B.waves[B.wave], isBoss=!!list[0].boss;
  B.foes = list.map((x,i)=>{
    const m=MON(x.id), bs=x.boss, st=scaleFoe(x.id, bs, B.chal, B.ps);
    return {i, id:x.id, m, boss:bs, n:bs?bs.n:m.n, hp:st.hp, maxHp:st.hp, atk:st.atk, def:st.def, hits:m.hits+(bs?2:0), alive:true, el:null};
  });
  B.target=0; B.clearing=false;
  event(startAt, ()=>{
    Music.setBoss(isBoss);
    drawFoes();
    $("waveTxt").textContent = isBoss ? "BOSS" : `Wave ${B.wave+1}/${B.waves.length}`;
    banner(isBoss ? `⚠ ${B.foes[0].n} appears!` : `Wave ${B.wave+1}!`);
  });
  planRound(startAt + B.bar);
}
function drawFoes(){
  const box=$("foes"); box.innerHTML="";
  const n=B.foes.length, pos=n===1?[50]:n===2?[28,72]:[17,50,83];
  B.foes.forEach((f,i)=>{
    const el=document.createElement("div");
    el.className="foe"+(f.boss?" boss":"")+(n===1?" solo":n===2?" duo":" trio");
    el.style.left=pos[i]+"%"; el.dataset.i=i;
    el.innerHTML=`<div class="fname">${esc(f.n)}</div><div class="fweak">${weakChips(f.id)}</div><div class="fhp"><i style="width:100%"></i></div><div class="tmark">▼</div><div class="sprite enter">${monsterSVG(f.id, !!f.boss)}</div>`;
    box.appendChild(el); f.el=el;
  });
  markTarget();
}
function markTarget(){
  if(!B) return;
  if(!B.foes[B.target]||!B.foes[B.target].alive){ const a=B.foes.find(f=>f.alive); B.target=a?a.i:0; }
  B.foes.forEach(f=>{ if(f.el) f.el.classList.toggle("targeted", f.i===B.target && f.alive && B.foes.filter(x=>x.alive).length>1); });
}

/* chart generation: slots are 8th notes */
const GAPS = {1:[2,2,4,4],2:[2,2,2,4],3:[1,2,2,2,3],4:[1,1,2,2,3],5:[1,1,2,2],6:[1,1,1,2,2]};
const HOLDP = {1:0,2:.12,3:.15,4:.15,5:.18,6:.2};
function chart(tier, start, slots){
  const out=[], E=B.eighth, gaps=GAPS[Math.min(6,tier)]; let s=0, holds=0;
  const maxHolds = tier>=5 ? 2 : 1;
  while(s<slots){
    if(holds<maxHolds && Math.random()<HOLDP[Math.min(6,tier)] && s+4<=slots){
      const len=2+Math.floor(Math.random()*3);
      out.push({t:start+s*E, end:start+(s+len)*E}); holds++; s+=len+2; continue;
    }
    out.push({t:start+s*E});
    s+=gaps[Math.floor(Math.random()*gaps.length)];
  }
  return out;
}
function planRound(start){
  B.notes = B.notes.filter(n=>!n.done);
  B.events = B.events.filter(e=>e.tag!=="round" || e.t>=B_clock());
  const tier = B.hunt.tier + (B.foes.some(f=>f.boss) ? 1 : 0);
  // player phase: 2 bars
  if(B.queue.length){
    const m=B.party[B.queue.shift()]; m.gauge=0; m.queued=false; updateBars();
    const sk=m.ult;
    event(start, ()=>cutIn(m), "round");
    if(sk.fast) for(let i=0;i<sk.notes;i++) B.notes.push({t:start+B.bar+i*B.eighth, kind:"skill", m:m.i});
    else B.notes.push({t:start+B.bar, end:start+B.bar+B.beat*2, kind:"skill", m:m.i});
  } else {
    event(start, ()=>banner("Your turn! Hit on the beat"), "round");
    for(const n of chart(tier, start, 16)){ B.notes.push({...n, kind:"atk", m:B.rr % B.party.length}); B.rr++; }
  }
  // enemy phase
  const eStart = start + 2*B.bar;
  const alive = B.foes.filter(f=>f.alive);
  const total = alive.reduce((a,f)=>a+f.hits,0);
  const bars = total>4 ? 2 : 1, slots=bars*8;
  const fast = tier>=4;
  let s=0;
  const queue=[];
  for(let r=0; r<6; r++) for(const f of alive) if(r<f.hits) queue.push(f);   // interleave attackers
  queue.forEach((f,k)=>{
    if(s>=slots) return;
    const heavy = f.boss && k===queue.length-1 && tier>=2 && s+3<=slots;
    if(heavy){ B.notes.push({t:eStart+s*B.eighth, end:eStart+(s+3)*B.eighth, kind:"def", foe:f.i, heavy:true}); s+=5; }
    else { B.notes.push({t:eStart+s*B.eighth, kind:"def", foe:f.i}); s += fast&&Math.random()<.5 ? 1 : 2; }
  });
  event(eStart, ()=>banner(alive.length>1?"Enemies attack! Tap to block":`${alive[0].n} attacks! Tap to block`), "round");
  B.checkAt = eStart;
  B.roundEnd = eStart + bars*B.bar;
}
const B_clock = () => Music.clock() - Music.offset/1000;

/* ---------- main loop ---------- */
function loop(){
  if(!B) return;
  const c=B_clock();
  if(B.events.length){
    const due=B.events.filter(e=>e.t<=c); B.events=B.events.filter(e=>e.t>c);
    for(const e of due){ if(!B) return; e.fn(); }
  }
  if(!B) return;
  for(const n of B.notes){
    if(n.done) continue;
    if(!n.el){ if(n.t - c > B.app) continue; makeNoteEl(n); if(n.done) continue; }
    if(n.holding){
      const p=Math.min(1,(c-n.t)/(n.end-n.t)); n.el.style.setProperty("--p", (p*360)+"deg");
      if(c>=n.end) finishHold(n, true);
      continue;
    }
    const rem=n.t-c;
    n.ring.style.transform=`scale(${1+2.2*Math.max(0,rem)/B.app})`;
    if(c > n.t + B.win.good) judge(n,"miss");
    if(!B) return;
  }
  if(!B) return;
  if(!B.over && !B.clearing && c>=B.checkAt){ B.checkAt=Infinity; planRound(B.roundEnd); }
  loopId=requestAnimationFrame(loop);
}
function centerOf(el){ if(!el) return {x:0,y:0}; const f=$("field").getBoundingClientRect(), r=(el.querySelector(".sprite")||el).getBoundingClientRect(); return {x:r.left-f.left+r.width/2, y:r.top-f.top+r.height/2}; }
function makeNoteEl(n){
  let p;
  if(n.kind==="def"){
    const f=B.foes[n.foe]; if(!f||!f.alive){ n.done=true; return; }
    n.victim = Math.floor(Math.random()*B.party.length);
    p=centerOf($("pm"+n.victim));
  } else {
    markTarget(); const f=B.foes[B.target]; if(!f||!f.el){ n.done=true; return; }
    p=centerOf(f.el); if(n.kind==="atk"){ p.x+=(Math.random()-.5)*50; p.y+=(Math.random()-.5)*30; }
  }
  n.x=p.x; n.y=p.y;
  const el=document.createElement("div");
  el.className="beat "+n.kind+(n.end?" hold":"")+(n.heavy?" heavy":"");
  el.style.left=n.x+"px"; el.style.top=n.y+"px";
  const mem = n.m!==undefined ? B.party[n.m] : null;
  if(mem && n.kind==="atk") el.style.setProperty("--mc", mem.col);
  el.innerHTML='<span class="tgt">'+(mem&&n.kind==="atk"?pic(mem.portrait,"tgimg"):"")+'</span><span class="ring"></span>'+(n.kind==="skill"?'<span class="star">★</span>':"");
  $("rings").appendChild(el); n.el=el; n.ring=el.querySelector(".ring");
}

/* ---------- input ---------- */
function onDown(e){
  if(!B||B.over) return;
  e.preventDefault();
  const fe=e.target.closest(".foe");
  if(fe){ const i=+fe.dataset.i; if(B.foes[i]&&B.foes[i].alive){ B.target=i; markTarget(); } }
  const c=B_clock(); let best=null;
  for(const n of B.notes){ if(n.done||n.holding||!n.el) continue; if(n.t-c>B.app) continue; if(!best||Math.abs(n.t-c)<Math.abs(best.t-c)) best=n; }
  if(!best) return;
  const d=Math.abs(best.t-c);
  const q = d<=B.win.perfect ? "perfect" : d<=B.win.good ? "good" : "miss";
  if(best.end && q!=="miss"){
    best.holding=true; best.q=q; B.hold=best; best.el.classList.add("holding");
    best.ring.style.transform="scale(1)";
    gaugeUp(q, best.kind==="def"?undefined:best.m); Music.sfx(q);
    pop($("field"), best.x+"px", (best.y-46)+"px", q==="perfect"?"PERFECT HOLD":"HOLD", q==="perfect"?"perfect":"");
    if(best.kind==="atk") hitFoe(best, q==="perfect"?1.5:1, q, null, false, B.party[best.m]);
  } else judge(best,q);
}
function onUp(){
  if(!B||!B.hold) return;
  const n=B.hold; B.hold=null; if(n.done) return;
  finishHold(n, B_clock() >= n.end - B.win.good);
}
function finishHold(n, ok){
  if(!B||n.done) return;
  n.done=true; n.holding=false; n.el.remove(); if(B.hold===n) B.hold=null;
  const f=$("field");
  if(n.kind==="atk"){
    if(ok){ hitFoe(n, n.q==="perfect"?1.5:1.1, "hold", null, false, B.party[n.m]); gaugeUp("perfect", n.m); }
    else pop(f, n.x+"px", (n.y-30)+"px", "BREAK", "miss");
  } else if(n.kind==="def"){
    const foe=B.foes[n.foe];
    if(ok){ pop(f, n.x+"px", (n.y-50)+"px", "BRACED!", "perfect"); Music.sfx("block"); gaugeUp("perfect"); }
    else if(foe) hurtHero(Math.round(enemyDmg(foe)*1.6*.6), n);
  } else if(n.kind==="skill"){
    unleash(n, ok ? (n.q==="perfect"?1.3:1.1) : .6);
  }
  updateBars(); checkEnd();
}
function gaugeUp(q, mi){
  if(q==="miss"||!B) return; const gm=(H().talent==="rhythm"?1.5:1)*((B.buff&&B.buff.charge)||1);
  if(mi===undefined){ for(const m of B.party) if(!m.queued) m.gauge=Math.min(100, m.gauge+(q==="perfect"?5:2)*gm); }   // blocks charge everyone a little
  else { const m=B.party[mi]; if(m&&!m.queued) m.gauge=Math.min(100, m.gauge+(q==="perfect"?16:8)*gm); }
}

function enemyDmg(foe){ return Math.max(1, Math.round(foe.atk*(0.9+Math.random()*.2) - B.hs.def/2)); }
function hurtHero(d, n){
  B.hp=Math.max(0,B.hp-d);
  pop($("field"), n.x+"px", (n.y-50)+"px", `-${d}`, "hurt");
  flash("pm"+(n.victim??0)); Music.sfx("hurt");
}
function judge(n,q){
  if(!B||n.done) return;
  n.done=true; if(n.el) n.el.remove();
  if(B.hold===n) B.hold=null;
  const f=$("field");
  if(n.kind!=="skill") gaugeUp(q, n.kind==="def"?undefined:n.m); Music.sfx(n.kind==="def"&&q!=="miss"?"block":q);
  if(n.kind==="def"){
    const foe=B.foes[n.foe]; if(!foe||!foe.alive){ updateBars(); return; }
    const raw=enemyDmg(foe)*(n.heavy?1.6:1);
    if(q==="perfect") pop(f, n.x+"px", (n.y-50)+"px", "BLOCK!", "perfect");
    else if(q==="good"){ const d=Math.round(raw*.5); B.hp=Math.max(0,B.hp-d); pop(f, n.x+"px", (n.y-50)+"px", `GUARD -${d}`, ""); flash("pm"+(n.victim??0)); }
    else hurtHero(Math.round(raw), n);
  } else if(n.kind==="skill"){
    unleash(n, q==="perfect"?1.3:q==="good"?1:.5);
  } else {
    if(q==="miss") pop(f, n.x+"px", (n.y-30)+"px", "MISS", "miss");
    else { const m=B.party[n.m]; hitFoe(n, q==="perfect"?(m.cls==="Rogue"?2:1.5):1, q, null, false, m); }
  }
  updateBars(); checkEnd();
}
function hitFoe(n, mult, q, foeRef, pierce, mem){
  if(!B) return 0;
  markTarget();
  const foe = foeRef && typeof foeRef==="object" ? foeRef : B.foes[B.target];
  if(!foe||!foe.alive||!foe.el||!B.foes.includes(foe)) return 0;
  mem = mem || B.party[0];
  const mm = matchMult(mem, foe);
  const def = pierce ? 0 : foe.def/2;
  const d=Math.max(1, Math.round(mem.atk*mult*mm.x*(0.9+Math.random()*.2) - def));
  foe.hp=Math.max(0,foe.hp-d);
  const p=centerOf(foe.el);
  const px=(n&&n.x!==undefined?n.x:p.x), py=(n&&n.y!==undefined?n.y:p.y);
  pop($("field"), px+"px", (py-30)+"px", (q==="perfect"?"PERFECT ":"")+d, q==="perfect"||q==="skill"?"perfect":"");
  if(mm.tag) pop($("field"), px+"px", (py-56)+"px", mm.tag, mm.tag==="RESIST"?"miss":"eff");
  const sp=foe.el.querySelector(".sprite"); sp.classList.remove("hit","enter"); void sp.offsetWidth; sp.classList.add("hit");
  foe.el.querySelector(".fhp i").style.width=(foe.hp/foe.maxHp*100)+"%";
  if(foe.hp<=0) killFoe(foe);
  return d;
}
function killFoe(foe){
  foe.alive=false; foe.el.classList.add("dead");
  if(!B.hunt.training && !B.hunt.recap){
    ensureRequests(); const k=H().req.kills||(H().req.kills={}); k[foe.id]=(k[foe.id]||0)+1;
    const lucky=H().talent==="lucky";
    for(const [mat,ch] of foe.m.drops){
      if(mat==="herb" && Tut.holdHerbs()) continue;   // tutorial: herbs come from the gathering lesson
      const c=Math.min(1,ch*(lucky?1.25:1));
      if(Math.random()<c){ const q=1+(foe.boss?1+Math.floor(Math.random()*2):0); B.loot[mat]=(B.loot[mat]||0)+q;
        const p=centerOf(foe.el); pop($("field"), p.x+"px", (p.y+20)+"px", `+${q} ${MATS[mat].i}`, "heal"); }
    }
  }
  for(const n of B.notes) if(!n.done && n.kind==="def" && n.foe===foe.i){ n.done=true; if(n.el) n.el.remove(); }
  markTarget();
  if(B.foes.every(f=>!f.alive)) waveCleared();
}
function waveCleared(){
  B.clearing=true; B.checkAt=Infinity;
  for(const n of B.notes) if(!n.done){ n.done=true; if(n.el) n.el.remove(); }
  if(B.hold) B.hold=null;
  B.events=B.events.filter(e=>e.tag!=="round");
  const c=B_clock();
  const nextBar = B.t0 + Math.ceil((c - B.t0 + .05)/B.bar)*B.bar;
  if(B.wave+1>=B.waves.length){ setTimeout(()=>victory(), 400); return; }
  banner("Wave cleared!");
  nextWave(nextBar);
}
function checkEnd(){ if(B && !B.over && B.hp<=0) defeat(); }

/* ---------- skills ---------- */
const EL_CUT = {fire:["#ff3d3d","#ffb13d"], ice:["#2f7fd8","#bfefff"], thunder:["#7a3cc4","#ffe066"]};
function cutIn(m){
  const sk=m.ult, el=$("cutin"), cols=(m.cls==="Mage"&&m.el&&EL_CUT[m.el])||sk.c;
  el.style.setProperty("--c1", cols[0]); el.style.setProperty("--c2", cols[1]);
  el.innerHTML=`<div class="ci-band"><div class="ci-lines"></div><div class="ci-hero">${pic(m.portrait)}</div>
    <div class="ci-text"><small>${esc(m.n)}'s ULTIMATE</small><b>${esc(sk.n)}</b></div></div>`;
  el.style.setProperty("--d", (B.beat*3)+"s");
  el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
  Music.sfx("skill");
  setTimeout(()=>{ if(el) el.classList.remove("show"); }, Math.max(900, B.beat*3*1000));
}
function unleash(n, power){
  const m=B.party[n.m]||B.party[0], sk=m.ult, f=$("field");
  if(!sk.fast) fx(sk.fx);
  else fx("shadow", n);
  const targets = sk.aoe ? B.foes.filter(x=>x.alive&&x.el) : [null];
  for(const t of targets) hitFoe(sk.aoe?null:n, sk.mult*power, "skill", t, !!sk.pierce, m);
  if(sk.heal&&B){ const amt=Math.round(B.maxHp*sk.heal*power); B.hp=Math.min(B.maxHp,B.hp+amt); const p=centerOf($("heroEl")); pop(f,p.x+"px",(p.y-60)+"px",`+${amt}`,"heal"); }
  updateBars();
}
function fx(kind, n){
  const f=$("field"), fl=$("flashfx");
  if(fl){ fl.className="flashfx "+kind; void fl.offsetWidth; fl.classList.add("go"); }
  if(kind==="slash"){ for(const r of [35,-35]){ const s=document.createElement("div"); s.className="slashfx"; s.style.setProperty("--r", r+"deg"); f.appendChild(s); setTimeout(()=>s.remove(),700); } }
  if(["fire","ice","thunder","holy","arrow","punch","shadow"].includes(kind)){
    const p = n ? {x:n.x,y:n.y} : centerOf($("foes").querySelector(".foe:not(.dead)")||$("foes"));
    const s=document.createElement("div"); s.className="burst "+kind; s.style.left=p.x+"px"; s.style.top=p.y+"px"; f.appendChild(s); setTimeout(()=>s.remove(),800);
  }
}

/* ---------- HUD / items ---------- */
function updateBars(){
  if(!B) return;
  $("hhpBar").style.width=(B.hp/B.maxHp*100)+"%";
  $("hhpTxt").textContent=`${B.hp}/${B.maxHp}`;
  for(const m of B.party){
    const btn=$("ult"+m.i); if(!btn) continue;
    $("ug"+m.i).style.setProperty("--g", (m.gauge*3.6)+"deg");
    btn.disabled = m.gauge<100 || m.queued; btn.classList.toggle("ready", m.gauge>=100 && !m.queued); btn.classList.toggle("queued", !!m.queued);
  }
  const tr=B.hunt.training;
  $("potBtn").textContent=`🧪 ${tr?"∞":have("p_potion")}`; $("potBtn").disabled=!tr&&!have("p_potion");
  $("hiBtn").textContent=`✨ ${tr?"∞":have("p_hipotion")}`; $("hiBtn").disabled=!tr&&!have("p_hipotion");
}
function queueUlt(i){ if(!B||B.over) return; const m=B.party[i]; if(!m||m.gauge<100||m.queued) return; m.queued=true; B.queue.push(i); updateBars(); toast(`${m.n}: ${m.ult.n} fires on your next turn!`); }
function drinkPotion(id){
  if(!B||B.over||B.hp>=B.maxHp) return;
  const tr=B.hunt.training; if(!tr&&have(id)<1) return;
  const amt=Math.round(B.maxHp*ITEMS[id].heal*(H().talent==="alch"?1.5:1));
  if(!tr){ addBag(id,-1); save(); }
  B.hp=Math.min(B.maxHp,B.hp+amt); updateBars();
  const p=centerOf($("heroEl")); pop($("field"), p.x+"px", (p.y-60)+"px", `+${amt}`, "heal");
}
function bankLoot(){ for(const [k,n] of Object.entries(B.loot)) addBag(k,n); }
const lootHTML = loot => Object.entries(loot).map(([k,n])=>`<div><span style="font-size:34px;line-height:1.2">${MATS[k].i}</span><b>×${n}</b><span>${esc(MATS[k].n).toUpperCase()}</span></div>`).join("");

async function victory(){
  if(!B||B.over) return;
  B.over=true; Music.sfx("win");
  const hunt=B.hunt, loot=B.loot, h=H();
  banner("VICTORY!");
  if(hunt.recap){ await new Promise(r=>setTimeout(r,1400)); arenaClose(); Story.recapDone(true); return; }
  if(hunt.exam){ await new Promise(r=>setTimeout(r,1400)); arenaClose(); Rank.examWon(hunt.exam); return; }
  const firstClear = !hunt.training && !h.cleared[hunt.id];
  if(!hunt.training){ bankLoot(); if(firstClear) state.crystals=(state.crystals||0)+30; h.cleared[hunt.id]=(h.cleared[hunt.id]||0)+1; save(); }
  await new Promise(r=>setTimeout(r,1400));
  arenaClose();
  if(hunt.training){
    await splash(`<div class="sp-title" style="font-size:clamp(28px,9vw,44px)">TRAINING<br>COMPLETE!</div><div class="sp-sub">The dummies have been thoroughly bonked.</div><div class="tap">Tap to continue</div>`, 4000);
    say("Nice rhythm! Now go clear some real quests so you can afford a real hunt~");
    return;
  }
  await splash(`<div class="sp-title">VICTORY!</div><div class="sp-sub">${esc(hunt.n)} cleared</div>
    <div class="loot" style="flex-wrap:wrap;justify-content:center">${firstClear?`<div>${PX.img(PX.icon("crystal"),"lootico")}<b>+30</b><span>FIRST CLEAR</span></div>`:""}${lootHTML(loot)}</div>
    <div class="tap">Tap to continue</div>`, 6000);
  if(hunt.story){ Story.bossWon(hunt.story); return; }
  Ev.onRun("hunt");
  say(pick([`You cleared ${hunt.n}! The guild will hear about this.`,`Back in one piece! Bring me more of those materials~`,`${hunt.boss?hunt.boss.n:"That boss"}? Taken down by my favourite adventurer!`]));
}
async function defeat(){
  if(!B||B.over) return;
  B.over=true; banner("Defeated…");
  const hunt=B.hunt, loot=B.loot;
  if(hunt.recap){ await new Promise(r=>setTimeout(r,1200)); arenaClose(); Story.recapDone(false); return; }
  if(!hunt.training){ bankLoot(); save(); }
  await new Promise(r=>setTimeout(r,1200));
  arenaClose();
  const got=Object.keys(loot).length && !hunt.training;
  await splash(`<div class="sp-title" style="filter:grayscale(.7) drop-shadow(0 3px 0 #000)">DEFEATED</div><div class="sp-sub">${esc(hunt.n)} was too much this time.</div>
    ${got?`<p class="note">You escaped with:</p><div class="loot" style="flex-wrap:wrap;justify-content:center">${lootHTML(loot)}</div>`:""}
    <p class="note" style="max-width:280px">Try a party that hits its weaknesses (▲), upgrade gear, or bring potions.</p><div class="tap">Tap to continue</div>`, 6000);
  say("You're back! I patched you up. Maybe level up a bit before the rematch?");
}
function fleeHunt(){
  if(!B||B.over) return;
  B.over=true; const tr=B.hunt.training, loot=B.loot;
  if(B.hunt.recap){ arenaClose(); Story.recapDone(false); return; }
  if(!tr){ bankLoot(); save(); }
  arenaClose();
  toast(tr?"Left the training grounds.":Object.keys(loot).length?"Fled! You kept the drops you'd collected.":"Fled! The entry fee is gone.");
}

/* ---------- calibration test ---------- */
let CAL=null;
function calStop(){ if(CAL){ clearTimeout(CAL.tm); cancelAnimationFrame(CAL.raf); CAL=null; } }
function calStart(){
  calStop();
  const bpm=100, n=16, beat=60/bpm;
  const t0=Music.clicks(bpm,n);
  const box=$("calBox"); if(!box) return;
  if(t0===null){ box.innerHTML=`<p class="note">Sound isn't available in this browser, so the test can't run.</p>`; return; }
  CAL={t0, beat, n, taps:[]};
  box.innerHTML=`<button class="calpad" id="calPad">TAP ON EACH CLICK</button><p class="note" id="calNote" style="text-align:center;margin:8px 0 0">Listen for the first few clicks, then tap along. 0 taps</p>`;
  const pad=$("calPad");
  pad.addEventListener("pointerdown", e=>{
    e.preventDefault(); if(!CAL) return;
    const c=Music.clock(), k=Math.round((c-CAL.t0)/CAL.beat);
    if(k>=2 && k<CAL.n){ const d=c-(CAL.t0+k*CAL.beat); if(Math.abs(d)<.25) CAL.taps.push(d*1000); }
    $("calNote").textContent=`Keep going… ${CAL.taps.length} taps`;
  });
  (function glow(){ if(!CAL) return; const c=Music.clock(), ph=((c-CAL.t0)/CAL.beat)%1; const p=$("calPad"); if(p) p.classList.toggle("pulse", c>=CAL.t0 && (ph<.15||ph>.95)); CAL.raf=requestAnimationFrame(glow); })();
  CAL.tm=setTimeout(()=>{
    if(!CAL) return;
    const t=CAL.taps.slice().sort((a,b)=>a-b); calStop();
    const box=$("calBox"); if(!box) return;
    if(t.length<6){ box.innerHTML=`<p class="note" style="text-align:center">Not enough taps to measure. Try again and tap along with every click.</p><button class="gbtn" data-act="calStart">🥁 Try again</button>`; return; }
    const med=Math.round(t[Math.floor(t.length/2)]/10)*10;
    Music.setOffset(med);
    render();
    const nb=$("calBox"); if(nb) nb.innerHTML=`<p class="note" style="text-align:center">You tapped about <b style="color:var(--gold)">${Math.abs(med)} ms ${med>=0?"late":"early"}</b>. Offset set to ${med>0?"+":""}${med} ms.</p><button class="gbtn plain" data-act="calStart">🥁 Run it again</button>`;
  }, (n*beat+.9)*1000);
}
