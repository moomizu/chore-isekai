/* ================= Guided tutorial (no skipping) ================= */

const Tut = (() => {
  const S = () => state.tut || (state.tut = {step:"intro"});
  const active = () => !!state.tut && !state.tut.done;
  const ch = () => S().char && ROSTER[S().char];
  const req = () => (H().req && H().req.tut) ? H().req : null;
  const ALL = ["home","party","adventure","shop","gacha"];

  const STEPS = [
    {id:"intro", tabs:["home"], text:"", scene:"intro", enter:()=>next()},
    {id:"create", tabs:["party"], text:"First, create your adventurer! Use the tabs to pick your name, look, talent and starting weapon, then tap 'Begin your adventure!'", hl:'[data-act=g-create]', check:()=>H().created,
      enter:()=>{ if(tab!=="party") go("party"); }},
    {id:"quiz", tabs:[], scene:"arrive", text:"Next, a quick aptitude test so quest ranks are fair for you.", check:()=>!!state.profile,
      enter:()=>setTimeout(()=>{ if(!state.profile && !$("modal").classList.contains("open")) openQuiz(); }, 400)},
    {id:"board", tabs:["home"], scene:"board", text:"This is the guild hall. Real-life tasks get posted as quests on the Quest Board. Its tabs let you take quests, turn in hunting & gathering contracts, and post your own. Open it!", hl:'.nav [data-tab=home], #side [data-act=openBoard]', check:()=>tab==="board",
      enter:()=>{ addTutQuest(); if(tab!=="home"&&tab!=="board") go("home"); }},
    {id:"accept", tabs:["home"], text:"Your first quest is pinned up: 'Register as an Adventurer'. Tap the notice to read it, then tap Accept quest. You'll need to sign the guild's guidelines first!",
      hl:'#side [data-act=openBoard], .notice[data-id=tut-register], [data-act=accept][data-id=tut-register]', enter:()=>addTutQuest(), check:()=>!!state.active["tut-register"]||!!S().claimed},
    {id:"setup", tabs:["home"], text:"Accepted! It's in your Quest Log now. To complete it, set up a quest checker: an AI checker (tap below for sign-up links), or a Guild Inspector, someone you trust who checks your photos by email (Settings: tap your portrait → ⚙️).",
      btn:"🤖 Choose an AI", onBtn:()=>adultGate(()=>aiPicker()), hl:'#plate', check:()=>AI.ready()||inspectorReady()||!!S().claimed},
    {id:"report", tabs:["home"], text:()=>AI.ready() ? "Done! Now report it: open the Quest Board, tap the quest in your Quest Log → Report completion, then snap a 👍 thumbs-up photo so Lilia can test her AI." : "Done! Now report it: open the Quest Board, tap the quest in your Quest Log → Report completion.",
      hl:'#side [data-act=openBoard], .row[data-id=tut-register], [data-act=report][data-id=tut-register], #camBtn, #tutHand:not([disabled])', check:()=>!!S().claimed && !$("splash").classList.contains("show")},
    {id:"settings", tabs:["home"], scene:"photo", text:"Quest cleared, nice! One more thing to know: your Guild Card and Settings live under your portrait (top left). Tap it, then tap ⚙️ Settings.",
      check:()=>!!S().sawSettings,
      tour:"This is Settings! Set up Lilia's AI checker or a Guild Inspector, choose your notifications and sound, and back up your save file. Come back any time from your portrait."},
    {id:"gacha", tabs:["gacha","home"], scene:"gacha", text:"Time to recruit a companion at the tavern! Open the Recruit tab and tap Recruit ×1. (Save the rest of your 💎 for a ×10 after the tutorial!)",
      pop:"This is Settings: sound, rhythm timing, your AI key, your Guild Inspector and the aptitude test all live here. Now for the fun part: open the Recruit tab and do a single recruit. Keep the other 200 💎 for a ×10 once the tutorial's done!", hl:'.nav [data-tab=gacha], [data-act=pull][data-v="1"]',
      check:()=>state.party.pulls>0 && !!S().char && !$("gachafx").classList.contains("show")},
    {id:"classes", tabs:["gacha"], text:"", modal:true, enter:()=>classesModal()},
    {id:"party", tabs:["party","gacha","home"], text:()=>`Add ${ch().n} to your party: open Party, tap an empty slot, then tap ${ch().n}.`, hl:()=>`.nav [data-tab=party], .pslot.empty, .rcard[data-v=${S().char}]`,
      check:()=>state.party.team.includes(S().char)},
    {id:"buySelf", tabs:["shop","home","party"], text:"Now gear up! Buy ONE weapon for yourself in the Shop (Training weapons are 30 G). Your weapon picks your class: ⚔️ Sword = Warrior, 🪄 Staff = Mage, 🗡️ Knife = Rogue, 🔨 Cudgel = Cleric, 🏹 Bow = Ranger. Then tap your portrait (top left), tap the Weapon slot and equip it.",
      hl:'.nav [data-tab=shop], [data-act=g-buy][data-v^=w_t], #plate', check:()=>{ const w=ITEMS[H().weapon]; return !!(w && (w.price||w.gacha)); }},
    {id:"buyChar", tabs:["shop","party","home"], text:()=>`Looking sharp! Now ${ch().n}: they're a ${ch().cls}, so they can only use ${CLASS_OF[ch().cls]}s. Buy a ${({sword:"Training Sword",staff:"Willow Staff",dagger:"Training Knife",mace:"Oak Cudgel",bow:"Hunting Bow"})[CLASS_OF[ch().cls]]} in the Shop, then go to Party, tap ${ch().n}, tap their Weapon slot and equip it.`,
      hl:()=>`.nav [data-tab=shop], [data-act=g-buy][data-v=${({sword:"w_tsword",staff:"w_tstaff",dagger:"w_tdagger",mace:"w_tmace",bow:"w_tbow"})[CLASS_OF[ch().cls]]}], .nav [data-tab=party], .rcard[data-v=${S().char}], [data-act=p-equip][data-k=weapon]`,
      check:()=>!!(state.party.owned[S().char]||{}).weapon},
    {id:"hunt", tabs:["adventure","home","party","shop"], scene:"hunt", text:"You've got two contracts today: defeat 2 Grumpy Slimes and bring 3 Herbs. Head to Adventure → Hunt → Slime Fields! Tap when the rings land on the beat.",
      hl:'.nav [data-tab=adventure], [data-act=g-sub][data-v=hunt], [data-act=g-hunt][data-v=fields]',
      enter:()=>setupContracts(), check:()=>((req()||{}).kills||{}).slime>=2},
    {id:"gather", tabs:["adventure","home","party","shop"], text:"Nice hunting! Now for the apothecary's herbs. Sunny Meadow is right next door, so go to Adventure → Gather → Sunny Meadow and tap the sparkles to collect 3 Herbs!",
      hl:'.nav [data-tab=adventure], [data-act=g-sub][data-v=gather], [data-act=g-gather][data-v=meadow]', check:()=>!!S().gathered || (req()&&req().done.includes("tut-g"))},
    {id:"turnin", tabs:ALL, text:"Great haul! Head back to the Guild Hall, open the Quest Board → Hunt & Gather, and turn in both contracts.",
      hl:'.nav [data-tab=home], #side [data-act=openBoard], [data-act=boardTab][data-v=supplies], [data-act=g-deliver]',
      check:()=>!!req() && ["tut-s","tut-g"].every(id=>req().done.includes(id))},
    {id:"library", tabs:ALL, text:"Last thing! The 📚 Library in the guild hall is your study room: a focus timer with music, your Journal (diary and quest log) and a calendar for due dates. Open it to take a look!",
      hl:'.nav [data-tab=home], #side [data-act=library]', check:()=>tab==="library",
      tour:"Welcome to the Library! ⏱️ The focus timer helps you study in rounds with breaks and calm music. 📖 Your Journal keeps your diary, study notes and every quest you clear. 📅 The calendar shows what you did each day and what's due."},
    {id:"finish", tabs:ALL, text:"", scene:"finish", enter:()=>finish()}
  ];
  const W_OF = {sword:"w_tsword", staff:"w_tstaff", dagger:"w_tdagger", mace:"w_tmace", bow:"w_tbow"};
  const ownsBought = pred => Object.keys(H().bag).some(k=>ITEMS[k]&&ITEMS[k].slot==="weapon"&&(ITEMS[k].price||ITEMS[k].gacha)&&pred(ITEMS[k],k));
  const HL = {
    create: () => !(draft&&(draft.name||"").trim()) ? ['#crName', '[data-act=g-ctab][data-v=name]'] : ['[data-act=g-create]'],
    board:  () => ['#side [data-act=openBoard]', '.nav [data-tab=home]'],
    accept: () => ['#rulesAgree:not([disabled])', '#rulesChkLbl', '[data-act=accept][data-id=tut-register]', '.notice[data-id=tut-register]', '#side [data-act=openBoard]', '.nav [data-tab=home]'],
    setup:  () => tab==="settings" ? ['#aiForm button[type=submit]'] : tab==="card" ? ['[data-act=settingsOpen]'] : ['[data-act=tutStepBtn]', '#coachBtn', '#tipBtn'],
    report: () => ['#tutHand:not([disabled])', '#camBtn', '[data-act=report][data-id=tut-register]', '.row[data-id=tut-register]', '#side [data-act=openBoard]', '.nav [data-tab=home]'],
    gacha:  () => ['#gfDone:not([hidden])', '#gfReveal:not([hidden])', '[data-act=pull][data-v="1"]', '.nav [data-tab=gacha]'],
    classes:() => ['[data-act=tutNext]'],
    party:  () => [ ...(partyPick!==null ? [`.rcard[data-v=${S().char}]`] : ['.pslot.empty']), '.nav [data-tab=party]'],
    buySelf:() => {
      const bought = S().selfW;
      return bought ? [`[data-act=p-gp-pick][data-v=${bought}]`, '[data-act=p-gp-open][data-k=weapon][data-id=hero]', '#plate'] : ['*[data-act=g-buy][data-v^=w_t]', '.nav [data-tab=shop]'];
    },
    buyChar:() => {
      const w = W_OF[CLASS_OF[ch().cls]], owns = have(w) > 0 && freeCount(w, S().char) > 0;
      return owns ? [`[data-act=p-gp-pick][data-v=${w}]`, `[data-act=p-gp-open][data-k=weapon][data-id=${S().char}]`, `.rcard[data-v=${S().char}]`, '.nav [data-tab=party]'] : [`[data-act=g-buy][data-v=${w}]`, '.nav [data-tab=shop]'];
    },
    settings:() => tab==="card" ? ['[data-act=settingsOpen]'] : ['#plate'],
    hunt:   () => ['[data-act=g-hunt][data-v=fields]', '[data-act=g-sub][data-v=hunt]', '.nav [data-tab=adventure]'],
    gather: () => ['[data-act=g-gather][data-v=meadow]', '[data-act=g-sub][data-v=gather]', '.nav [data-tab=adventure]'],
    library: () => ['#side [data-act=library]', '.nav [data-tab=home]'],
    turnin: () => ['[data-act=g-deliver]:not([disabled])', '[data-act=boardTab][data-v=supplies]', '#side [data-act=openBoard]', '.nav [data-tab=home]']
  };
  const cur = () => STEPS.find(s=>s.id===S().step) || STEPS[0];
  const val = v => typeof v==="function" ? v() : v;
  let entered = null;

  function next(){ const i=STEPS.indexOf(cur()); S().step = STEPS[Math.min(STEPS.length-1, i+1)].id; entered=null;
    const ns=cur(); if(!["quiz","classes","finish"].includes(ns.id)) S().pop = ns.id;
    save(); if(tab!=="home" && tab!=="settings") render(); setTimeout(update, 50); }
  function addTutQuest(){
    if(S().claimed || state.quests.some(q=>q.id==="tut-register")) return;
    state.quests.unshift({id:"tut-register", tut:true, title:"Register as an Adventurer", rank:"E", cat:"admin", size:"quick", repeat:"once", proof:"photo",
      flavour:"Every adventurer needs a way to prove their deeds. Set up a quest checker (an AI checker or a Guild Inspector), then report back!"});
    save(); render();
  }
  function setupContracts(){
    const h=H();
    if(!(h.req && h.req.tut)) h.req = {day:dayKey(), v:2, tut:true, done:[], kills:{}, list:[
      {id:"tut-s", type:"slay", mon:"slime", qty:2, gold:20},
      {id:"tut-g", type:"gather", mat:"herb", qty:3, gold:15}]};
    if(state.gold < 10){ state.gold = 10; toast("Lilia slipped you some gold for the entry fees!"); }
    save();
  }
  function classesModal(){
    const c=ch(); if(!c){ next(); return; }
    openModal(`<span class="ribbon">NEW RECRUIT</span>
      <div class="chartop r${c.r}">${pic(charPortrait(S().char),"big")}
        <div><b style="font-size:18px">${c.n}</b> <span class="rstars">${starStr(c.r)}</span><br><span class="clspill">${CLASS_ICON[c.cls]} ${c.cls}</span>
          <p class="note" style="margin:6px 0 0">${esc(c.bio)}</p></div></div>
      <p style="margin:0"><b style="color:var(--rose)">Lilia:</b> ${c.n} joined the guild! Recruits have a <b>set class</b>. ${c.n} is a ${c.cls}, so they can only use ${CLASS_OF[c.cls]}s.</p>
      <p style="margin:0">You're different: <b>you can be any class</b>. Your class follows whatever weapon you hold. Swords make you a Warrior, staffs a Mage, daggers a Rogue, maces a Cleric and bows a Ranger.</p>
      <p class="note" style="margin:0">Each recruit came with their own weapon. ★5 recruits get a stronger one.</p>
      <div class="btns"><button class="gbtn" data-act="tutNext">Got it!</button></div>`);
  }
  async function finish(){
    if(S().done) return;
    state.tut = {done:true}; Story.markPrologue(); save(); render();
    await splash(`<div class="sp-title" style="font-size:clamp(28px,9vw,44px)">TUTORIAL<br>COMPLETE!</div><div class="sp-sub">You're an official member of the guild! Your saved 💎 are ready for a ×10 at the tavern.</div><div class="tap">Tap to continue</div>`, 6000);
    say("You're all set! Post your own quests, clear them for real, and come back to me with proof. I'll be right here~");
  }
  function boardCard(){ return ""; }
  function aiPicker(){
    openModal(`<span class="ribbon">CHOOSE AN AI</span>
      <p class="note" style="margin:0">Make an account with one of these, create an API key, then paste it into Settings → Lilia's AI brain. Your key stays on your phone.</p>
      ${Object.entries(AI_PROVIDERS).map(([k,p])=>`<div class="aiopt"><b>${p.n}</b><small>${esc(p.note)}</small><a href="${p.keyUrl}" target="_blank" rel="noopener">Sign up / get a key ↗</a></div>`).join("")}
      <p class="note" style="margin:0">Not sure? OpenRouter is the easiest to start with: its "openrouter/free" option gives free photo checks each day.</p>
      <div class="btns"><button class="gbtn" data-act="settingsOpen" data-v="secAI">⚙️ I have a key, open Settings</button><button class="gbtn plain" data-act="close">Back</button></div>`);
  }
  function claim(){}

  /* Lilia pops up (on the left) with the next instruction; tap to dismiss */
  function overlaysBusy(){
    return $("modal").classList.contains("open") || $("splash").classList.contains("show") || $("arena").classList.contains("show")
        || $("gachafx").classList.contains("show") || !!document.querySelector(".camfx") || !!$("vn");
  }
  function maybePop(st){
    const lp=$("lpop"); if(!lp || S().pop!==st.id || overlaysBusy() || !lp.hidden) return;
    const text = val(st.pop) || val(st.text); if(!text){ S().pop=null; return; }
    $("lpArt").innerHTML = $("liliaArt").innerHTML;
    $("lpText").textContent = text;
    lp.hidden = false;
    lp.onclick = () => { lp.hidden = true; S().pop = null; save(); update(); };
  }
  function showCoach(st){
    const c=$("coach"), tip=$("tipBtn"); if(!c) return;
    const text = val(st.text);
    const onHall = tab==="home";
    if(tip) tip.hidden = !text || st.modal || onHall;
    if(!text || st.modal || !onHall){ c.hidden=true; $("app").classList.remove("tutting"); return; }
    c.hidden=false; $("app").classList.add("tutting");
    $("coachText").textContent = text;
    const b=$("coachBtn"); b.hidden=!st.btn; if(st.btn){ b.textContent=st.btn; b.onclick=st.onBtn; }
  }
  /* Highlight exactly one thing: the first visible match in priority order */
  function visible(e){
    if(!e || e.disabled || e.closest("[hidden]") || !e.getClientRects().length) return false;
    const modalOpen = $("modal").classList.contains("open");
    return modalOpen ? !!e.closest("#modal") : !e.closest("#modal");
  }
  function highlight(list){
    let pick = [];   // a selector starting with * lights up every visible match, not just the first
    for(const sel of (list||[])){
      const all = sel[0]==="*";
      try{ const v=[...document.querySelectorAll(all?sel.slice(1):sel)].filter(visible); pick = all ? v : v.slice(0,1); }catch(e){ pick = []; }
      if(pick.length) break;
    }
    document.querySelectorAll(".tut-hl").forEach(e=>{ if(!pick.includes(e)) e.classList.remove("tut-hl"); });
    pick.forEach(e=>e.classList.add("tut-hl"));
  }
  function update(){
    const c=$("coach");
    if(!active()){ if(c) c.hidden=true; if($("tipBtn")) $("tipBtn").hidden=true; $("app").classList.remove("tutting"); highlight(null); return; }
    const st=cur();
    if($("title") || (typeof wiping!=="undefined" && wiping)) return;   // still on the title screen, or mid data delete
    if($("vn")){ if(c) c.hidden=true; if($("tipBtn")) $("tipBtn").hidden=true; highlight(null); return; }   // a story scene is playing
    if(entered!==st.id){
      entered=st.id; const go2=()=>{ if(st.enter) st.enter(); };
      const seen = S().seen || (S().seen={});
      if(st.scene && !seen[st.scene] && !$("splash").classList.contains("show") && !$("gachafx").classList.contains("show") && !$("modal").classList.contains("open")){
        Story.scene(st.scene, ()=>{ seen[st.scene]=1; save(); go2(); update(); }); return;   // only counts as seen once it finishes
      }
      if(st.scene && !seen[st.scene]){ entered=null; if(c) c.hidden=true; highlight(null); return; }   // wait for popups/splashes to close first
      go2();
    }
    if(st.check && st.check()){
      // some steps show a short explanation on the page itself before moving on (and before the next story scene)
      if(st.tour && !(S().toured||{})[st.id]){ showTour(st); highlight(null); if(c) c.hidden=true; return; }
      next(); return; }
    if(st.id==="hunt"||st.id==="gather"){ if(state.gold<10 && !B && !G){ state.gold=10; save(); } }
    showCoach(st); maybePop(st);
    highlight($("lpop") && !$("lpop").hidden ? [] : (HL[st.id] ? HL[st.id]() : []));
  }
  function showTour(st){
    if($("tourPop")) return;
    const p=document.createElement("div"); p.id="tourPop"; p.className="tourpop";
    p.innerHTML=`<div class="tp-who">Lilia</div><p>${st.tour}</p><button class="gbtn sm" type="button">Got it ▶</button>`;
    p.querySelector("button").onclick = () => { (S().toured||(S().toured={}))[st.id]=1; save(); p.remove(); next(); update(); };
    $("app").appendChild(p);
  }
  setInterval(()=>{ if(state && state.tut) update(); }, 700);

  function tip(){
    const st=cur(), text=val(st.text); if(!text) return;
    openModal(`<span class="ribbon">LILIA'S TIP</span><p style="margin:0"><b style="color:var(--rose)">Lilia:</b> ${esc(text)}</p><div class="btns">${st.btn?`<button class="gbtn" data-act="tutStepBtn">${esc(st.btn)}</button>`:""}<button class="gbtn ${st.btn?"plain":""}" data-act="close">Got it</button></div>`);
  }
  function stepBtn(){ const st=cur(); closeModal(); if(st.onBtn) st.onBtn(); }
  const W_NEED = () => W_OF[CLASS_OF[ch().cls]];
  function canBuy(id){
    if(!active()) return true;
    const st=S().step, it=ITEMS[id];
    const order=STEPS.map(s=>s.id), at=order.indexOf(st);
    if(at >= order.indexOf("hunt")) return true;
    if(st==="buySelf"){
      if(!(it && it.slot==="weapon" && /^w_t/.test(id))){ toast("Lilia: Just a Training weapon for now!"); return false; }
      if(S().selfW){ toast("Lilia: One for yourself is plenty. Now equip it!"); return false; }
      return true;
    }
    if(st==="buyChar"){
      if(id!==W_NEED()){ toast(`Lilia: ${ch().n} needs a ${ITEMS[W_NEED()].n}. Save your gold for that!`); return false; }
      if(have(id)>0 && freeCount(id,S().char)>0){ toast("You already have one. Go equip it!"); return false; }
      return true;
    }
    toast("The shop opens up as the tutorial goes on!"); return false;
  }
  function allowSupplies(){
    if(!active()) return true;
    const order=STEPS.map(s=>s.id); return order.indexOf(S().step) >= order.indexOf("hunt");
  }
  return {
    holdHerbs: () => active() && !S().gathered,
    gathered: () => { if(!active() || S().step!=="gather") return;
      S().gathered = true; const need = 3 - have("herb");
      if(need>0){ addBag("herb", need); setTimeout(()=>toast(`Lilia slipped you ${need} extra herb${need>1?"s":""}~ 🌿`), 600); } },
    canBuy, allowSupplies, bought: id => { if(active() && S().step==="buySelf" && !S().selfW){ S().selfW=id; } },
    wantsEquip: () => active() && S().step==="buySelf",
    markSettings: () => { if(active() && S().step==="settings"){ S().sawSettings=true; save(); } },
    active, update, boardCard, claim, aiPicker, next, tip, stepBtn,
    allowTab: t => !active() || ["card","settings"].includes(t) || (cur().tabs||[]).includes(t),
    wantsFour: () => active() && S().step==="gacha" && !S().char,
    pulled: res => { if(active() && S().step==="gacha" && !S().char){ const x=res.find(r=>r.kind==="char"&&r.r===4); if(x){ S().char=x.id; save(); } } }
  };
})();
