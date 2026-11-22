/* ================= Journal: diary notes + quest log + focus minutes, by day, with a calendar =================
   Quest clears come from state.log, notes from state.diary, focus minutes from state.focus.mins.
   Quests with a due date show on the calendar. */

const Journal = (() => {
  let view = "diary", month = null, picked = null, writing = false;
  const D = () => state.diary || (state.diary = []);
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const nowTime = () => { const d=new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
  const prettyDay = k => { const [y,m,d]=k.split("-").map(Number), dt=new Date(y,m-1,d);
    const today=dayKey(), yd=new Date(); yd.setDate(yd.getDate()-1);
    const yk=`${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,"0")}-${String(yd.getDate()).padStart(2,"0")}`;
    return k===today ? "Today" : k===yk ? "Yesterday" : dt.toLocaleDateString(undefined,{weekday:"short", day:"numeric", month:"short", year: y===new Date().getFullYear()?undefined:"numeric"}); };
  const METHOD = {ai:"✔ Verified by Lilia", inspector:"✔ Approved by your Inspector", honour:"🤝 Trust", tutorial:"✔ Tutorial"};

  function addNote(text, extra={}){
    text=(text||"").trim(); if(!text) return null;
    const n={id:uid(), date:dayKey(), t:nowTime(), text:text.slice(0,2000), ...extra}; D().unshift(n); save(); return n;
  }
  /** Everything that happened on each day, newest first */
  function days(onlyDay){
    const map={};
    const put=(k,e)=>{ if(onlyDay && k!==onlyDay) return; (map[k]||(map[k]=[])).push(e); };
    const byId={}; for(const n of D()) byId[n.id]=n;
    const linked=new Set((state.log||[]).map(l=>l.nid).filter(id=>id&&byId[id]));
    for(const n of D()) if(!linked.has(n.id)) put(n.date, {kind:n.kind==="study"?"study":"note", t:n.t||"", n});
    for(const l of state.log||[]) put(l.date, {kind:"quest", t:l.time||"", l, n:l.nid&&byId[l.nid]});
    const mins=(state.focus&&state.focus.mins)||{}; for(const [k,m] of Object.entries(mins)) if(m>0) put(k, {kind:"focus", t:"", m});
    return Object.keys(map).sort().reverse().map(k=>[k, map[k].sort((a,b)=>(b.t||"").localeCompare(a.t||""))]);
  }
  function entry(e){
    if(e.kind==="quest") return `<div class="jn-e jq ${e.n?"js":""}"><span class="jn-i">${e.n?"📚":e.l.v?"✔":"🤝"}</span><span><b>${esc(e.l.title)}</b>${e.n?`<p>${esc(e.n.text).replace(/\n/g,"<br>")}</p>`:""}<small>${METHOD[e.l.m||(e.l.v?"ai":"honour")]||""}${e.n?" · 📚 study note +10%":""}${e.t?" · "+e.t:""}</small></span><span class="jn-r">+${e.l.xp} EXP<br>+${e.l.gold} G</span></div>`;
    if(e.kind==="focus") return `<div class="jn-e jf"><span class="jn-i">⏱️</span><span><b>${e.m} min focused</b><small>Focus timer</small></span></div>`;
    const n=e.n, st=e.kind==="study";
    return `<div class="jn-e ${st?"js":"jnote"}"><span class="jn-i">${st?"📚":"📝"}</span><span>${st?`<b>${esc(n.quest||"Study")}</b>`:""}<p>${esc(n.text).replace(/\n/g,"<br>")}</p>
      <small>${n.t||""}</small></span><button class="jn-del" data-act="jn-del" data-v="${n.id}" aria-label="Delete note">✕</button></div>`;
  }
  function diaryView(){
    const list=days();
    return `${writing?`<div class="jn-write"><textarea id="jnText" maxlength="2000" placeholder="Dear diary… what's on your mind today?"></textarea>
        <div class="btns"><button class="gbtn" data-act="jn-save">💾 Save entry</button><button class="gbtn plain" data-act="jn-cancel">Cancel</button></div></div>`
      : `<button class="gbtn" data-act="jn-new" style="width:100%">✏️ Write a diary entry</button>`}
      ${list.length ? list.map(([k,es])=>`<div class="jn-day"><h4>${prettyDay(k)}</h4>${es.map(entry).join("")}</div>`).join("")
        : `<div class="none">Your journal is empty. Clear a quest or write an entry and it'll show up here~</div>`}`;
  }
  function calView(){
    const now=new Date(); if(!month) month={y:now.getFullYear(), m:now.getMonth()};
    const {y,m}=month, first=new Date(y,m,1), startDow=(first.getDay()+6)%7, n=new Date(y,m+1,0).getDate();
    const key=d=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`, today=dayKey();
    const cleared={}; for(const l of state.log||[]) cleared[l.date]=(cleared[l.date]||0)+1;
    const notes={}; for(const x of D()) notes[x.date]=1;
    const due={}; for(const q of state.quests||[]) if(q.repeat==="due" && q.due) (due[q.due]||(due[q.due]=[])).push(q);
    for(const q of state.quests||[]) if(hasDueDay(q)) for(let d=1; d<=n; d++) if(new Date(y,m,d).getDay()===+q.dueDay && key(d)>=today) (due[key(d)]||(due[key(d)]=[])).push(q);
    const mins=(state.focus&&state.focus.mins)||{};
    let cells=""; for(let i=0;i<startDow;i++) cells+=`<span></span>`;
    for(let d=1; d<=n; d++){ const k=key(d), late=due[k]&&k<today;
      cells+=`<button class="jc-d ${k===today?"today":""} ${k===picked?"pick":""} ${cleared[k]?"has":""}" data-act="jn-day" data-v="${k}"><b>${d}</b>
        <span class="jc-m">${cleared[k]?`<i class="q">${cleared[k]}</i>`:""}${due[k]?`<i class="due ${late?"late":""}">📌</i>`:""}${notes[k]?`<i>📝</i>`:""}${mins[k]?`<i>⏱️</i>`:""}</span></button>`; }
    const sel = picked || today, dq=due[sel]||[], es=(days(sel)[0]||[null,[]])[1];
    return `<div class="jc-head"><button class="gbtn plain sm" data-act="jn-mon" data-v="-1">◀</button><b>${MONTHS[m]} ${y}</b><button class="gbtn plain sm" data-act="jn-mon" data-v="1">▶</button></div>
      <div class="jc-grid"><span class="dow">M</span><span class="dow">T</span><span class="dow">W</span><span class="dow">T</span><span class="dow">F</span><span class="dow">S</span><span class="dow">S</span>${cells}</div>
      <p class="note jc-key">Number = quests cleared · 📌 due · 📝 notes · ⏱️ focus</p>
      <div class="jn-day"><h4>${prettyDay(sel)}</h4>
        ${dq.map(q=>`<div class="jn-e jd"><span class="jn-i">📌</span><span><b>${esc(q.title)}</b><small>${hasDueDay(q)?`Weekly · due every ${DAYN[+q.dueDay]}`:`Due${sel<today?" (overdue)":""}`}</small></span></div>`).join("")}
        ${es.map(entry).join("")}${!dq.length&&!es.length?`<div class="none">Nothing here yet.</div>`:""}</div>`;
  }
  function draw(){
    const body = view==="cal" ? calView() : diaryView();
    openModal(`<span class="ribbon">JOURNAL</span>
      <div class="jn-tabs"><button class="${view==="diary"?"on":""}" data-act="jn-view" data-v="diary">📖 Diary &amp; log</button><button class="${view==="cal"?"on":""}" data-act="jn-view" data-v="cal">📅 Calendar</button></div>
      <div class="jn-body">${body}</div>
      <div class="btns"><button class="gbtn plain" data-act="close">Close</button></div>`);
    if(writing && $("jnText")) $("jnText").focus();
  }
  function open(v){ if(v) view=v; writing=false; picked=null; month=null; draw(); }
  function act(a, b){
    const v=b.dataset.v;
    if(a==="journal"){ open(v); }
    else if(a==="jn-view"){ view=v; writing=false; draw(); }
    else if(a==="jn-new"){ writing=true; draw(); }
    else if(a==="jn-cancel"){ writing=false; draw(); }
    else if(a==="jn-save"){ const t=$("jnText")&&$("jnText").value; if(!(t||"").trim()){ toast("Write something first!"); return true; } addNote(t,{kind:"note"}); writing=false; toast("📝 Saved to your journal"); draw(); }
    else if(a==="jn-del"){ const n=D().find(x=>x.id===v); if(!n) return true;
      if(b.dataset.sure!=="1"){ b.dataset.sure="1"; b.textContent="Delete?"; b.classList.add("sure"); setTimeout(()=>{ if(b.isConnected){ b.dataset.sure=""; b.textContent="✕"; b.classList.remove("sure"); } }, 2500); return true; }
      state.diary=D().filter(x=>x.id!==v); save(); draw(); }
    else if(a==="jn-mon"){ month.m+=(+v); if(month.m<0){ month.m=11; month.y--; } if(month.m>11){ month.m=0; month.y++; } picked=null; draw(); }
    else if(a==="jn-day"){ picked=v; draw(); }
    else return false;
    return true;
  }
  return {open, act, addNote};
})();
