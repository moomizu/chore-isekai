/* ================= Notifications =================
   APK: real scheduled notifications (Capacitor Local Notifications), so they fire even with the app closed.
   Website: notifications while the tab is open in the background (needs sw.js uploaded next to index.html on Android).
   The master switch is Do Not Disturb: it silences everything but leaves each toggle as you set it. */

const Notify = (() => {
  const KINDS = {
    timer: {n:"Focus timer", d:"When a focus round or break ends"},
    soon:  {n:"Due tomorrow", d:"A heads-up the day before a quest's deadline, even if you haven't accepted it"},
    due:   {n:"Due today", d:"On the morning a quest is due, at your reminder time"},
    daily: {n:"Daily reminder", d:"A nudge from Lilia to check the quest board"}
  };
  const ID = {timer:1001, daily:1002, dueBase:2000};
  const N = () => { const n = state.notif || (state.notif = {master:true, timer:true, due:true, daily:false, time:"09:00"}); if(n.soon===undefined) n.soon=true; return n; };
  const native = () => { const C=window.Capacitor; return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.LocalNotifications; };
  const webOK = () => "Notification" in window;
  const allowed = k => N().master && N()[k];
  const webTimers = {};
  let swReg = null;

  if("serviceWorker" in navigator && location.protocol==="https:" && !native()){
    navigator.serviceWorker.register("sw.js").then(r=>{ swReg=r; }).catch(()=>{});
  }

  function permState(){
    if(native()) return "app";
    if(!webOK()) return "unsupported";
    return Notification.permission;   // default | granted | denied
  }
  async function ask(){
    try{
      if(native()){ const r = await native().requestPermissions(); return r && r.display==="granted"; }
      if(!webOK()) return false;
      if(Notification.permission==="granted") return true;
      if(Notification.permission==="denied") return false;
      return (await Notification.requestPermission())==="granted";
    }catch(e){ return false; }
  }
  function webShow(title, body, tag){
    if(!webOK() || Notification.permission!=="granted") return;
    const opts = {body, tag, icon:"art/icon.png", badge:"art/icon.png"};
    try{
      if(swReg && swReg.showNotification) swReg.showNotification(title, opts);
      else new Notification(title, opts);
    }catch(e){}
  }
  async function at(id, when, title, body){
    const ms = when - Date.now(); if(ms <= 0) return;
    if(native()){
      try{ await native().schedule({notifications:[{id, title, body, schedule:{at:new Date(when), allowWhileIdle:true}}]}); }catch(e){}
      return;
    }
    clearTimeout(webTimers[id]);
    if(ms < 2147000000) webTimers[id] = setTimeout(() => { delete webTimers[id]; if(document.hidden) webShow(title, body, "n"+id); }, ms);
  }
  async function cancel(ids){
    ids = [].concat(ids);
    for(const id of ids){ clearTimeout(webTimers[id]); delete webTimers[id]; }
    if(native()){ try{ await native().cancel({notifications:ids.map(id=>({id}))}); }catch(e){} }
  }
  const hm = () => { const [h,m] = (N().time||"09:00").split(":").map(Number); return {h:h||0, m:m||0}; };
  function dueIds(){ return Object.keys(webTimers).map(Number).filter(i=>i>=ID.dueBase); }

  /** Reschedule the daily reminder and due-date alerts from scratch */
  async function sync(){
    if(!state) return;
    // clear old
    let old = dueIds();
    if(native()){ try{ const p = await native().getPending(); old = old.concat((p.notifications||[]).map(n=>n.id).filter(i=>i>=ID.dueBase)); }catch(e){} }
    await cancel([ID.daily, ...new Set(old)]);
    const {h,m} = hm();
    // daily reminder
    if(allowed("daily")){
      const title="📜 The quest board is waiting!", body=`${pick(DAILY_LINES)}`;
      if(native()){ try{ await native().schedule({notifications:[{id:ID.daily, title, body, schedule:{on:{hour:h, minute:m}, allowWhileIdle:true}}]}); }catch(e){} }
      else { const t=new Date(); t.setHours(h,m,0,0); if(t<=new Date()) t.setDate(t.getDate()+1);
        clearTimeout(webTimers[ID.daily]); webTimers[ID.daily]=setTimeout(()=>{ if(document.hidden) webShow(title, body, "daily"); sync(); }, t-Date.now()); }
    }
    // deadlines: dated quests and weekly quests with a due day, accepted or not, until they're done
    if(allowed("due") || allowed("soon")){
      const list = (state.quests||[]).map(q=>[q, deadlineOf(q)]).filter(([q,d])=>d && d>=dayKey()).slice(0,30);
      list.forEach(([q,dl],i)=>{
        const [y,mo,d] = dl.split("-").map(Number), on = new Date(y, mo-1, d, h, m).getTime(), before = on - 86400000;
        if(allowed("due") && on > Date.now()) at(ID.dueBase+i*2, on, `📌 Due today: ${q.title}`, "Lilia's holding this quest for you. Finish it before the day ends!");
        if(allowed("soon") && before > Date.now()) at(ID.dueBase+i*2+1, before, `📅 Due tomorrow: ${q.title}`, state.active[q.id] ? "It's in your quest log. Tomorrow's the deadline!" : "It's still up on the quest board. Tomorrow's the deadline!");
      });
    }
  }
  /** Focus timer: call with the end time of the current round, or null to cancel */
  function timer(endsAt, title, body){
    cancel(ID.timer);
    if(endsAt && allowed("timer")) at(ID.timer, endsAt, title, body);
  }
  const DAILY_LINES = [
    "Lilia saved some fresh requests just for you~",
    "Even one small quest today counts. Come say hi!",
    "The guild hall's quiet without you. Got time for a quick quest?",
    "New bounties are on the board!"
  ];

  /* ---------- settings UI ---------- */
  function settingsHTML(){
    const n=N(), ps=permState(), off=!n.master;
    const warn = ps==="denied" ? `<p class="note nt-warn">🚫 Notifications are blocked for this site. Allow them in your browser's site settings, then come back.</p>`
      : ps==="unsupported" ? `<p class="note nt-warn">This browser can't show notifications. On iPhone, add the site to your Home Screen first.</p>`
      : !native() ? `<p class="note" style="margin:6px 0 0">On the website, notifications only arrive while the game is open in a tab. The Android app can send them even when it's closed.</p>` : "";
    return `<section class="frame" id="secNotif"><span class="ribbon">NOTIFICATIONS</span>
      <div class="setrow"><span><b>All notifications</b><small>${off?"🌙 Do not disturb: everything is paused":"Turn off to pause everything. Your choices below are kept."}</small></span>
        <button class="toggle ${n.master?'on':''}" data-act="nt-tog" data-v="master" aria-pressed="${n.master}"><i></i></button></div>
      <div class="nt-subs ${off?"off":""}">
        ${Object.entries(KINDS).map(([k,x])=>`<div class="setrow"><span><b>${x.n}</b><small>${x.d}</small></span>
          <button class="toggle ${n[k]?'on':''}" data-act="nt-tog" data-v="${k}" aria-pressed="${n[k]}" ${off?"disabled":""}><i></i></button></div>`).join("")}
        <div class="setrow"><span><b>Reminder time</b><small>Used for the daily reminder and deadlines</small></span>
          <input type="time" id="ntTime" class="nt-time" value="${esc(n.time)}" ${off?"disabled":""}></div>
      </div>${warn}
      ${n.master && (n.timer||n.due||n.daily) && ps!=="unsupported" ? `<button class="gbtn plain sm" data-act="nt-test" style="margin-top:8px;width:100%">🔔 Send a test notification</button>`:""}
    </section>`;
  }
  async function act(a, b){
    const n=N(), v=b.dataset.v;
    if(a==="nt-tog"){
      const turningOn = !n[v];
      if(turningOn && !(await ask()) && permState()!=="granted" && permState()!=="app"){ toast("Notifications aren't allowed yet. Check your browser or phone settings."); }
      n[v]=turningOn; save(); sync(); if(Focus.running) Focus.renotify(); render(); return true;
    }
    if(a==="nt-test"){
      if(!(await ask())){ toast("Notifications aren't allowed. Check your browser or phone settings."); return true; }
      if(native()) await at(ID.timer+5, Date.now()+3000, "🔔 Lilia here!", "Notifications are working~");
      else { toast("Switch to another tab or app: it'll arrive in 3 seconds!"); setTimeout(()=>webShow("🔔 Lilia here!", "Notifications are working~", "test"), 3000); }
      return true;
    }
    return false;
  }
  document.addEventListener("change", e => { if(e.target && e.target.id==="ntTime"){ N().time = e.target.value || "09:00"; save(); sync(); toast("⏰ Reminder time saved"); } });
  /** Ask for permission the first time a feature that uses it is actually used */
  async function ensure(kind){
    if(!allowed(kind)) return;
    if(native()){ await ask(); return; }
    if(webOK() && Notification.permission==="default" && !N().asked){ N().asked=true; save(); await ask(); sync(); }
  }
  return {sync, timer, act, settingsHTML, ensure};
})();
