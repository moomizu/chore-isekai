/* ================= Gathering minigames: one per area =================
   tap    Sunny Meadow   tap the sparkles (in game.js)
   basket Whisperwood    drag a basket to catch falling leaves and berries, dodge caterpillars
   fish   Mirror Lake    cast, strike on the bite, hold to keep the fish in the reel zone
   dig    Crystal Mine   dig-site puzzle: chip rock tiles to uncover buried treasures before the wall caves in
   All of them fill G.haul and finish through endGather(). Haul key "gems" means gacha crystals. */

const GATHER_TEST_UNLOCK = false;   // set true to open every gathering area for testing
const gatherOpen = L => GATHER_TEST_UNLOCK || Rank.atLeast(L.rank);
const haulIcon = k => k==="gems" ? "💎" : MATS[k] ? MATS[k].i : ITEMS[k] ? "👢" : "✦";
const haulName = k => k==="gems" ? "Crystals" : MATS[k] ? MATS[k].n : ITEMS[k] ? ITEMS[k].n : k;
function gHaul(k, n, x, y, cls){
  if(!G) return; G.haul[k]=(G.haul[k]||0)+n;
  const f=$("gfield"); if(f && x!=null) pop(f, x, y, `+${n} ${haulIcon(k)}`, cls||"");
  const h=$("haul"); if(h) h.textContent=Object.entries(G.haul).map(([k2,c])=>`${haulIcon(k2)}×${c}`).join("  ");
}
function gShell(L, secs, hint){
  arenaOpen(`
    <div class="ar-top"><div class="ar-name"><span>${L.n}</span><span id="gTime">${secs}.0s</span></div></div>
    <div class="field gfield-${L.game}" id="gfield" style="background:${L.bg}"><div class="banner in" id="bnr">${hint}</div></div>
    <div class="ar-bot"><div class="haul" id="haul">Nothing yet</div><button class="gbtn plain" data-act="g-leave">Finish early</button></div>`);
}
function gTimer(onFrame){
  (function tick(t){ if(!G) return; const left=G.end-now(); const el=$("gTime"); if(el) el.textContent=Math.max(0,left/1000).toFixed(1)+"s";
    if(left<=0){ endGather(); return; } try{ onFrame && onFrame(t||performance.now()); }catch(e){} loopId=requestAnimationFrame(tick); })();
}
const lucky = () => H().talent==="lucky";

/* ---------------- 🧺 Basket catch ---------------- */
function startBasket(L){
  const secs=25; G={L, haul:{}, end:now()+secs*1000, iv:0, items:[], bx:50, combo:0};
  gShell(L, secs, "Drag the basket! Dodge the caterpillars 🐛");
  const f=$("gfield"), bk=document.createElement("div"); bk.className="gbasket"; bk.textContent="🧺"; f.appendChild(bk);
  const cmb=document.createElement("div"); cmb.className="gcombo"; f.appendChild(cmb);
  const move = e => { const r=f.getBoundingClientRect(); G && (G.bx=Math.max(8,Math.min(92,(e.clientX-r.left)/r.width*100))); };
  f.addEventListener("pointerdown", e=>{ move(e); try{ f.setPointerCapture(e.pointerId); }catch(er){} });
  f.addEventListener("pointermove", move);
  G.key = e => { if(!G) return; if(e.key==="ArrowLeft") G.bx=Math.max(8,G.bx-8); if(e.key==="ArrowRight") G.bx=Math.min(92,G.bx+8); };
  document.addEventListener("keydown", G.key);
  const POOL = [["leaf",38],["berry",34],["mushroom",14],["bug",14]];
  G.iv=setInterval(()=>{
    if(!G) return;
    const rare = Math.random() < (lucky()?.08:.05);
    let k="leaf"; if(rare) k=L.rare; else { let r=Math.random()*100; for(const [id,w] of POOL){ if((r-=w)<0){ k=id; break; } } }
    const el=document.createElement("div"); el.className="gfall"+(k==="bug"?" bug":rare?" rare":"");
    el.textContent = k==="bug" ? "🐛" : MATS[k].i; f.appendChild(el);
    G.items.push({k, el, x:6+Math.random()*88, y:-6, v:(k==="leaf"?22:30)+Math.random()*14, sway:Math.random()*6.28, leaf:k==="leaf"});
  }, 430);
  let last=performance.now();
  gTimer(t=>{
    const dt=Math.min(.05,(t-last)/1000); last=t;
    bk.style.left=G.bx+"%";
    for(const it of [...G.items]){
      it.y += it.v*dt; if(it.leaf) it.sway += dt*3;
      const x = it.x + (it.leaf ? Math.sin(it.sway)*4 : 0);
      it.el.style.left=x+"%"; it.el.style.top=it.y+"%";
      if(it.y>=82 && it.y<=92 && Math.abs(x-G.bx)<9){
        it.el.remove(); G.items.splice(G.items.indexOf(it),1);
        if(it.k==="bug"){ G.combo=0; bk.classList.remove("hurt"); void bk.offsetWidth; bk.classList.add("hurt"); pop(f, G.bx+"%", "78%", "Eek! 🐛", "miss"); }
        else { G.combo++; const extra = G.combo%5===0 ? 1 : 0; gHaul(it.k, 1+extra, G.bx+"%", "76%", it.el.classList.contains("rare")||extra?"perfect":""); }
        cmb.textContent = G.combo>=3 ? `${G.combo} combo!` : "";
      } else if(it.y>104){ it.el.remove(); G.items.splice(G.items.indexOf(it),1); if(it.k!=="bug" && it.k!=="leaf") G.combo=0; }
    }
  });
}

/* ---------------- 🎣 Fishing ---------------- */
function startFishing(L){
  const secs=40; G={L, haul:{}, end:now()+secs*1000, iv:0, st:"idle"};
  gShell(L, secs, "Tap to cast your line!");
  const f=$("gfield");
  f.insertAdjacentHTML("beforeend", `<div class="fbob" id="fBob">🎣</div><div class="fmsg" id="fMsg">Tap to cast</div>
    <div class="freel" id="fReel" hidden><div class="fzone" id="fZone"></div><div class="ffish" id="fFish">🐟</div><div class="fprog"><i id="fProg"></i></div></div>`);
  const msg=t=>{ $("fMsg").textContent=t; };
  let holding=false, fish=null, last=performance.now();
  f.addEventListener("pointerdown", e=>{
    e.preventDefault(); if(!G) return;
    if(G.st==="idle"){ cast(); }
    else if(G.st==="bite"){ strike(); }
    else if(G.st==="wait"){ G.st="idle"; clearTimeout(G.tm); msg("Too early! The fish swam off. Tap to cast again"); $("fBob").className="fbob"; }
    else if(G.st==="reel"){ holding=true; }
  });
  const up=()=>{ holding=false; }; f.addEventListener("pointerup", up); f.addEventListener("pointercancel", up); f.addEventListener("pointerleave", up);
  function cast(){
    G.st="wait"; $("fBob").className="fbob cast"; msg("Wait for a bite…");
    G.tm=setTimeout(()=>{ if(!G||G.st!=="wait") return; G.st="bite"; $("fBob").className="fbob bite"; msg("❗ Tap now!");
      G.tm=setTimeout(()=>{ if(!G||G.st!=="bite") return; G.st="idle"; $("fBob").className="fbob"; msg("It got away… Tap to cast again"); }, 900);
    }, 1200+Math.random()*2600);
  }
  function strike(){
    clearTimeout(G.tm);
    const r=Math.random(), boot=r<.05, trout=!boot && r<.05+(lucky()?.25:.18);
    fish={k: boot?"acc_boot" : trout?L.rare : "fish", y:50, target:50, speed: trout?55:boot?18:34, zone:40, zv:0, prog:.3};
    $("fFish").textContent = boot ? "👢" : trout ? "🐠" : "🐟";
    G.st="reel"; $("fReel").hidden=false; $("fBob").className="fbob bite"; msg("Hold to raise the net, let go to drop it!");
  }
  gTimer(t=>{
    const dt=Math.min(.05,(t-last)/1000); last=t;
    if(G.st!=="reel"||!fish) return;
    if(Math.abs(fish.y-fish.target)<2 || Math.random()<dt*.9) fish.target=6+Math.random()*88;
    fish.y += Math.sign(fish.target-fish.y)*Math.min(Math.abs(fish.target-fish.y), fish.speed*dt);
    fish.zv += (holding?-160:130)*dt; fish.zv*=.9; fish.zone=Math.max(0,Math.min(70,fish.zone+fish.zv*dt));
    if(fish.zone<=0||fish.zone>=70) fish.zv=0;
    const inZone = fish.y>=fish.zone && fish.y<=fish.zone+30;
    fish.prog = Math.max(0, Math.min(1, fish.prog + (inZone?.38:-.22)*dt));
    $("fFish").style.top=fish.y+"%"; $("fZone").style.top=fish.zone+"%"; $("fZone").classList.toggle("on", inZone); $("fProg").style.height=(fish.prog*100)+"%";
    if(fish.prog>=1){ const k=fish.k; fish=null; G.st="idle"; $("fReel").hidden=true; $("fBob").className="fbob";
      gHaul(k, 1, "50%", "40%", k!=="fish"?"perfect":""); msg(k==="acc_boot" ? "👢 …An old boot? Someone must be missing this! Tap to cast" : `Caught a ${haulName(k)}! Tap to cast again`); }
    else if(fish.prog<=0){ fish=null; G.st="idle"; $("fReel").hidden=true; $("fBob").className="fbob"; msg("It slipped away! Tap to cast again"); }
  });
}

/* ---------------- ⛏️ Dig site (puzzle, no timer) ----------------
   A wall of rock tiles (1-3 layers each) hides several treasures, some bigger than one tile.
   Pickaxe chips one tile; hammer smashes a + shape but cracks the wall more. Full crack meter = cave-in. */
const DIG_W = 7, DIG_H = 8;
const DIG_TREASURE = {
  ore:   {i:"🪨", haul:{ore:1}},
  ore2:  {i:"🪨", haul:{ore:2}, w:2, h:1},
  shard: {i:"🔷", haul:{crystal:1}},
  gems:  {i:"💎", haul:{gems:3}, w:2, h:1},
  giant: {i:"🌟", haul:{crystal:3, gems:5}, w:2, h:2, rare:true}
};
function startDig(L){
  const tiles=[]; for(let y=0;y<DIG_H;y++) for(let x=0;x<DIG_W;x++){ const r=Math.random(); tiles.push({x,y,layers: r<.3?1 : r<.75?2 : 3, t:null}); }
  const at=(x,y)=>tiles[y*DIG_W+x];
  // place treasures without overlapping
  const want=["ore","ore2", Math.random()<.5?"ore":"shard", "shard"];
  if(Math.random()<.75) want.push("gems");
  if(Math.random()<(lucky()?.25:.15)) want.push("giant");
  const list=[];
  for(const k of want){ const T=DIG_TREASURE[k], w=T.w||1, h=T.h||1;
    for(let tries=0; tries<40; tries++){
      const x=(Math.random()*(DIG_W-w+1))|0, y=(Math.random()*(DIG_H-h+1))|0, cells=[];
      for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++) cells.push(at(x+dx,y+dy));
      if(cells.some(c=>c.t)) continue;
      const tr={k, cells, got:false}; cells.forEach((c,i)=>{ c.t=tr; c.part=i; }); list.push(tr); break; } }
  tiles.forEach(c=>{ if(c.t && Math.random()<.45) c.hint=true; });
  G={L, haul:{}, end:Infinity, iv:0, tiles, list, crack:0, tool:"pick"};
  arenaOpen(`
    <div class="ar-top"><div class="ar-name"><span>${L.n}</span><span id="dFound">0/${list.length} found</span></div>
      <div class="dcrack"><span>Wall cracks</span><div class="dbar"><i id="dCrack"></i></div></div></div>
    <div class="field gfield-dig" id="gfield" style="background:${L.bg}"><div class="dgrid" id="dGrid" style="grid-template-columns:repeat(${DIG_W},1fr);grid-template-rows:repeat(${DIG_H},1fr)">
      ${tiles.map((c,i)=>`<button class="dtile" data-i="${i}" aria-label="Rock"></button>`).join("")}</div></div>
    <div class="ar-bot"><div class="dtools"><button class="dtool on" data-tool="pick">⛏️ Pickaxe<small>1 tile · small crack</small></button><button class="dtool" data-tool="hammer">🔨 Hammer<small>+ shape · big crack</small></button></div>
      <div class="haul" id="haul">Nothing yet</div><button class="gbtn plain" data-act="g-leave">Finish digging</button></div>`);
  const grid=$("dGrid");
  document.querySelectorAll(".dtool").forEach(b=>b.onclick=()=>{ G.tool=b.dataset.tool; document.querySelectorAll(".dtool").forEach(x=>x.classList.toggle("on", x===b)); });
  const draw=()=>{
    tiles.forEach((c,i)=>{ const el=grid.children[i];
      el.className="dtile l"+c.layers+(c.hint&&c.layers>0?" hint":"")+(c.layers===0&&c.t?" open "+(c.t.got?"got":""):"")+(c.layers===0&&!c.t?" empty":"");
      el.textContent = c.layers===0 && c.t ? DIG_TREASURE[c.t.k].i : ""; });
    $("dCrack").style.width=Math.min(100,G.crack)+"%"; $("dCrack").classList.toggle("danger", G.crack>=75);
    $("dFound").textContent=`${list.filter(t=>t.got).length}/${list.length} found`;
  };
  const check=()=>{
    for(const tr of list) if(!tr.got && tr.cells.every(c=>c.layers===0)){
      tr.got=true; const T=DIG_TREASURE[tr.k], c0=tr.cells[0];
      Object.entries(T.haul).forEach(([k,n],j)=>gHaul(k, n, ((c0.x+.5)/DIG_W*100)+"%", ((c0.y+.5)/DIG_H*100-j*6)+"%", T.rare||k==="gems"?"perfect":""));
    }
  };
  grid.addEventListener("click", e=>{
    const el=e.target.closest(".dtile"); if(!el||!G||G.over) return;
    const c=tiles[+el.dataset.i]; if(c.layers===0 && G.tool==="pick") return;
    if(G.tool==="pick"){ c.layers--; G.crack+=3; }
    else { const hit=[[0,0,2],[1,0,1],[-1,0,1],[0,1,1],[0,-1,1]];
      for(const [dx,dy,n] of hit){ const t=c.x+dx>=0&&c.x+dx<DIG_W&&c.y+dy>=0&&c.y+dy<DIG_H ? at(c.x+dx,c.y+dy) : null; if(t) t.layers=Math.max(0,t.layers-n); }
      G.crack+=8; }
    el.classList.remove("thunk"); void el.offsetWidth; el.classList.add("thunk");
    check(); draw();
    if(list.every(t=>t.got)){ G.over=true; gHaul("gems", 5); banner("You found everything! +5 💎"); setTimeout(()=>endGather(), 1400); }
    else if(G.crack>=100){ G.over=true; const f=$("gfield"); f.classList.add("cavein"); banner("The wall caved in!"); setTimeout(()=>endGather(), 1400); }
  });
  draw();
}

/* ---------------- 👢 The Lost Boot (secret repeatable quest) ----------------
   While you have a spare Old Boot, there's a 20% chance each day that its owner turns up at the guild. */
const LostBoot = (() => {
  const OWNERS = [
    {n:"Old Fisherman Gil", lines:[
      {s:"npc", n:"Old Fisherman Gil", f:"sad", e:"sweat", t:"Ah, adventurer! I lost my lucky boot at Mirror Lake. Haven't caught a single fish since."},
      {s:"narrator", t:"You hand over the soggy boot. It squelches."},
      {s:"npc", n:"Old Fisherman Gil", f:"happy", e:"sparkle", t:"MY BOOT! Look at her, still dripping. The fish won't know what hit 'em!"}]},
    {n:"A very soggy knight", lines:[
      {s:"npc", n:"Sir Puddleton", f:"sad", e:"gloom", t:"Ahem. A knight of my standing… cannot be seen with only ONE boot."},
      {s:"narrator", t:"You hand over the boot. He slips it on with enormous dignity."},
      {s:"npc", n:"Sir Puddleton", f:"happy", e:"exclaim", t:"Splendid! My honour, and my left foot, are restored!"}]},
    {n:"Pip the delivery kid", lines:[
      {s:"npc", n:"Pip", f:"sad", e:"sweat", t:"Um, hi… I kicked my boot into the lake chasing a frog. Mum's gonna be SO mad."},
      {s:"narrator", t:"You hand over the boot. Pip hugs it."},
      {s:"npc", n:"Pip", f:"happy", e:"heart", t:"You're the best adventurer EVER! I'm telling everyone!"}]}
  ];
  const seed = s => { let h=0; for(const c of s) h=(h*31+c.charCodeAt(0))>>>0; return (h%1000)/1000; };
  const owner = () => OWNERS[Math.floor(seed(dayKey()+"who")*OWNERS.length)];
  function today(){
    if(state.tut && !state.tut.done) return false;
    if((state.bootDone||"")===dayKey()) return false;
    if(freeCount("acc_boot")<1) return false;
    return seed(dayKey()+"boot") < .2;
  }
  function boardCard(){
    if(!today()) return "";
    const o=owner();
    return `<section class="frame bootq"><span class="ribbon">👢 SECRET QUEST</span>
      <p style="margin:0 0 6px"><b>Someone lost a boot!</b> ${esc(o.n)} is asking around the guild. You happen to have an Old Boot…</p>
      <p class="note" style="margin:0 0 8px">Reward: 60 G · 10 💎 (gives away 1 Old Boot)</p>
      <button class="gbtn" data-act="boot-deliver">👢 Return the boot</button></section>`;
  }
  function deliver(){
    if(!today()) return;
    const o=owner();
    Story.play([{bg:"guild"}, {bgm:"happy"}, ...o.lines, {s:"lilia", f:"happy", e:"note", t:"Another happy customer! Here's your reward~"}], async ()=>{
      addBag("acc_boot",-1); state.gold+=60; state.crystals=(state.crystals||0)+10; state.bootDone=dayKey(); state.bootsReturned=(state.bootsReturned||0)+1; save(); render(); renderHUD();
      await splash(`<div class="sp-title" style="font-size:clamp(26px,8vw,40px)">BOOT<br>RETURNED!</div><div class="sp-sub">+60 G · +10 💎</div><div class="tap">Tap to continue</div>`, 4000);
    });
  }
  return {boardCard, deliver, today};
})();
