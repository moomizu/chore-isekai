/* ================= Standalone extras: Guild Inspector, offline bounties ================= */

/* ---------- offline bounty pool ---------- */
const BOUNTY_POOL = [
  ["Wipe down the kitchen bench","E","photo","Sparkly benches make the cook happy!"],
  ["Take out the recycling","E","photo","The recycling dragon hungers."],
  ["Water the plants","E","photo","The herbalist's guild thanks you."],
  ["Clear off one cluttered surface","D","photo","Reclaim that table from the chaos!"],
  ["Fold and put away a pile of clothes","D","photo","The wardrobe goblins fear you."],
  ["Clean the bathroom sink","D","photo","A shining basin is a happy basin."],
  ["Vacuum one room","D","photo","Suck up the dust sprites!"],
  ["Sweep the kitchen floor","D","photo","Crumbs: defeated."],
  ["Empty every bin in the house","D","photo","A full sweep of the realm's bins."],
  ["Change your bed sheets","C","photo","Fresh sheets restore +20 HP."],
  ["Clean out the fridge","C","photo","Banish the ancient leftovers."],
  ["Wipe down the bathroom mirror","E","honour","See your heroic reflection clearly."],
  ["Tidy your desk","D","photo","A clear desk for a clear mind."],
  ["Put away all the clean dishes","E","photo","Restock the armoury… of plates."],
  ["Scrub the stovetop","C","photo","Defeat the grease slime."],
  ["Tidy the shoes by the door","E","photo","Line up the boots of adventure!"],
  ["Clean the microwave","D","photo","No more mystery splatters."],
  ["Wipe the light switches and door handles","E","photo","Tiny quest, big clean."],
  ["Hang out or move a load of washing","D","photo","Into the sun with you, laundry!"],
  ["Declutter one drawer","D","photo","Every drawer hides a treasure… or junk."],
  ["Take a 10-minute walk outside","D","honour","Fresh air buffs all stats."],
  ["Drink two glasses of water","E","honour","Hydration potion: consumed."],
  ["Stretch for 5 minutes","E","honour","Flexible adventurers dodge better."],
  ["Prep tomorrow's lunch","D","photo","Plan ahead, hero!"],
  ["Reply to one message you've been putting off","E","honour","The messenger owl is relieved."],
  ["Make a cup of tea and sit for 5 minutes","E","honour","Even heroes need a rest stop."],
  ["Wash your water bottle","E","photo","No swamp water in your canteen!"],
  ["Clean your phone screen","E","honour","Smudge-free scrying glass."],
  ["Wipe down the dining table","E","photo","Ready for the next feast."],
  ["Sort the mail or paperwork pile","D","honour","Conquer the scroll mountain."],
  ["Study for 25 minutes","D","honour","The guild library awaits, scholar!","study"],
  ["Review your notes from today","E","honour","A quick look keeps the knowledge sharp.","study"],
  ["Read 10 pages of a book","E","honour","Every page is experience points for the brain.","study"],
  ["Practise a language for 15 minutes","E","honour","Learn the tongues of distant kingdoms!","study"],
  ["Make flashcards for one topic","D","honour","Craft your own spell cards.","study"],
  ["Watch one educational video and note one thing you learned","E","honour","Knowledge loot, collected.","study"],
  ["Do two focus rounds on something you've been avoiding","C","honour","Face the dreaded task, two rounds at a time.","study"]
];
function offlineBounties(){
  let s=0; for(const c of dayKey()+"bounty") s=(s*31+c.charCodeAt(0))>>>0;
  const rnd=()=>{ s=(s*1103515245+12345)>>>0; return (s>>>8)/16777216; };
  const titles=new Set(state.quests.map(q=>q.title.toLowerCase()));
  const pool=BOUNTY_POOL.filter(b=>!titles.has(b[0].toLowerCase()));
  const out=[];
  // higher adventurer ranks see bigger bounties more often
  const ri = typeof Rank!=="undefined" ? Rank.idx(Rank.cur()) : 0, wt = b => b[1]==="C" ? 1+ri*.8 : b[1]==="D" ? 1+ri*.4 : Math.max(.4, 1-ri*.1);
  while(out.length<3 && pool.length){ let t=rnd()*pool.reduce((a,b)=>a+wt(b),0), i=0; while(i<pool.length-1 && (t-=wt(pool[i]))>0) i++; out.push(pool.splice(i,1)[0]); }
  const catOf = t => /walk|outside|recycling|bins|mail/i.test(t) ? "outside" : /water|stretch|tea|lunch|sheets/i.test(t) ? "selfcare" : /message|reply/i.test(t) ? "social" : /paperwork|mail|sort the/i.test(t) ? "admin" : "household";
  return out.map(([title,rank,proof,flavour,cat])=>({id:uid(), bounty:true, title, rank, cat:cat||catOf(title), size:({E:"quick",D:"medium",C:"big"})[rank]||"quick", proof, flavour, done:false}));
}

/* ---------- Guild Inspector (friend approval by email, no server) ---------- */
const randTok = n => { const a=new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a,x=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[x%32]).join(""); };
function inspectorReady(){ const i=state.inspector||{}; return !!(i.email && i.myEmail); }

async function blobToFile(blob, name){ return new File([blob], name, {type:"image/jpeg"}); }
async function shareProof(blob, subject, text, to){
  const C = window.Capacitor;
  const b64 = () => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(String(r.result).split(",")[1]); r.onerror=rej; r.readAsDataURL(blob); });
  // 1) Android app with the email plugin: To, subject, message and photo all filled in
  if(C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.EmailComposer){
    await C.Plugins.EmailComposer.open({to:[to], subject, body:text, attachments:[{type:"base64", path:await b64(), name:"quest-proof.jpg"}]});
    return "email";
  }
  // 2) Android app without the plugin: native share sheet (recipient copied to clipboard)
  if(C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.Share && C.Plugins.Filesystem){
    try{ await navigator.clipboard.writeText(to); }catch(e){}
    const w = await C.Plugins.Filesystem.writeFile({path:`proof-${Date.now()}.jpg`, data:await b64(), directory:"CACHE"});
    await C.Plugins.Share.share({title:subject, text, files:[w.uri], dialogTitle:"Send to your Guild Inspector"});
    return "shared";
  }
  // 3) Phone browser: share sheet with the photo; friend's email copied so it can be pasted into To
  const file = new File([blob], "quest-proof.jpg", {type:"image/jpeg"});
  if(navigator.canShare && navigator.canShare({files:[file]})){
    let copied=false; try{ await navigator.clipboard.writeText(to); copied=true; }catch(e){}
    if(copied) toast("📋 Friend's email copied! Paste it into the To field.");
    await navigator.share({title:subject, text, files:[file]});
    return copied ? "shared-copied" : "shared";
  }
  // 4) Fallback: email draft with everything except the photo
  location.href = `mailto:${String(to).replace(/[^\w.+@-]/g,"")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text+"\n\n(Photo: please attach the proof photo to this email.)")}`;
  return "mailto";
}
/* Where inspector reply links point. On the website this is filled in automatically.
   For the Android app, put your GitHub Pages address here (e.g. "https://yourname.github.io/guild-quests/")
   so replies open a web page that hands the code to the app. Leave "" to use app-only links. */
const WEB_URL = "";
function replyLinkBase(){
  if(WEB_URL) return WEB_URL;
  if(location.protocol==="https:" && !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) return location.origin + location.pathname;
  return "";
}
function inspectionEmail(q, p){
  const ins = state.inspector, me = state.name || "Your adventurer";
  const yes = `GQ-${p.req}-${p.yes}`, no = `GQ-${p.req}-${p.no}`;
  const web = replyLinkBase();
  // A plain https link is tappable in every email app (mailto: links in plain text often aren't)
  const page = web ? `${web}?inspect=1&q=${encodeURIComponent(q.title)}&n=${encodeURIComponent(me)}&e=${encodeURIComponent(ins.myEmail||"")}&i=${encodeURIComponent(ins.name||"")}&y=${yes}&x=${no}` : "";
  const subject = `⚔️ Guild inspection: ${q.title}`;
  const text =
`Hi${ins.name?" "+ins.name:""}! ${me} says they've finished a quest and needs you to check it.

QUEST: ${q.title}
Proof photo attached 📸 (taken live with the app's camera).${shotFor(q)?`
The photo should show: ${shotFor(q)}.`:""}

Does it look done?
${page?`👉 Tap here to approve or decline:
${page}

Or just reply`:"Just reply"} to this email with ONE of these lines:

✅ APPROVED ${yes}
❌ NOT YET ${no}

Thanks, Guild Inspector! 🧐`;
  return {subject, text};
}
/* ---------- the Guild Inspector's page (opened from the link in the email, on the website) ---------- */
function inspectPage(){
  const u = new URLSearchParams(location.search); if(!u.get("inspect")) return false;
  const q=u.get("q")||"a quest", n=u.get("n")||"Your adventurer", e=(u.get("e")||"").replace(/[^\w.+@-]/g,""), i=u.get("i")||"";
  const yes=(u.get("y")||"").toUpperCase(), no=(u.get("x")||"").toUpperCase(), web=replyLinkBase();
  const mail = (ok, code) => `mailto:${e}?subject=${encodeURIComponent((ok?"✅ Approved: ":"❌ Not yet: ")+q)}&body=${encodeURIComponent(`${ok?"✅ APPROVED":"❌ NOT YET"} by your Guild Inspector${i?" "+i:""}.\n\n${web?`Tap to update your quest app:\n${web}?c=${code}\n\nOr paste`:"Paste"} this code into the quest's report screen: ${code}`)}`;
  window.inspectMode = true;
  const box=document.createElement("div"); box.className="inspage";
  box.innerHTML = `<div class="ip-card"><div class="ip-ic">🧐</div><h2>Guild Inspection</h2>
    <p><b>${esc(n)}</b> says they've finished:</p><div class="ip-q">${esc(q)}</div>
    <p class="ip-sub">Check the photo in the email. Does it look done?</p>
    ${/^GQ-[A-Z0-9]{4}-[A-Z0-9]{6}$/.test(yes)&&e ? `<a class="gbtn ip-yes" href="${mail(true,yes)}">✅ Approve</a><a class="gbtn plain ip-no" href="${mail(false,no)}">❌ Not yet</a>
      <p class="ip-sub">This opens a reply email to ${esc(n)}. Just press <b>Send</b>!</p>` : `<p class="ip-sub">This link looks incomplete. Please reply to the email instead.</p>`}
    <small>Chore Isekai · you don't need the app to be an inspector</small></div>`;
  document.body.appendChild(box);
  return true;
}
function pendingFor(id){ return (state.pending||{})[id]; }
async function sendToInspector(q, blob){
  state.pending = state.pending || {};
  const p = state.pending[q.id] || {req:randTok(4), yes:randTok(6), no:randTok(6), at:Date.now()};
  state.pending[q.id] = p; save();
  const {subject, text} = inspectionEmail(q, p);
  const how = await shareProof(blob, subject, text, state.inspector.email);
  return how;
}
/** Handles an approval code like GQ-ABCD-XYZ123 (typed, pasted, or from a guildquest:// link) */
function applyInspectorCode(raw, fromLink){
  const m = String(raw||"").toUpperCase().match(/GQ-([A-Z0-9]{4})-([A-Z0-9]{6})/);
  if(!m){ toast("That doesn't look like an inspector code."); return false; }
  const [, req, tok] = m;
  const entry = Object.entries(state.pending||{}).find(([,p])=>p.req===req);
  if(!entry){
    if(fromLink) return codeElsewhere(m[0]);
    toast("No quest is waiting on that code (maybe it was already used)."); return false; }
  const [qid, p] = entry, q = findQuest(qid);
  if(!q){ delete state.pending[qid]; save(); toast("That quest no longer exists."); return false; }
  if(tok===p.yes){ delete state.pending[qid]; save(); closeModal(); grant(q, true, "inspector"); say("Your Guild Inspector signed off! Official stamp applied~"); return true; }
  if(tok===p.no){ delete state.pending[qid]; save(); closeModal(); render(); toast("Your inspector said not yet. Have another go!"); say("The inspector wasn't convinced… Give it another try and send a new photo!"); return true; }
  toast("That code doesn't match. Check you copied it fully."); return false;
}
/* A reply link opened somewhere that isn't waiting on it: probably a different browser, or the Android app is where the quest lives */
function codeElsewhere(code){
  openModal(`<span class="ribbon">INSPECTOR REPLY</span>
    <p style="margin:0;font-size:14px;line-height:1.5"><b style="color:var(--rose)">Lilia:</b> I got your inspector's reply, but no quest here is waiting for it. Was it already used, or did you send the photo from the <b>Android app</b> or a <b>different browser</b>?</p>
    <div class="codebox"><input type="text" readonly value="${code}" id="ceCode"><button class="gbtn sm" id="ceCopy">📋 Copy</button></div>
    <p class="note" style="margin:0;text-align:center">Paste this code into the quest's report screen wherever you sent it from.</p>
    <a class="gbtn blue" href="guildquest://inspect?c=${code}" style="text-decoration:none;text-align:center">📱 Open in the Android app</a>
    <button class="gbtn plain" data-act="close">Close</button>`);
  $("ceCopy").onclick = async () => { try{ await navigator.clipboard.writeText(code); toast("Code copied!"); }catch(err){ $("ceCode").select(); } };
  return false;
}
// Web reply links: ...github.io/guild-quests/?c=GQ-XXXX-XXXXXX
function checkLinkCode(){
  const m = (location.search+location.hash).match(/[?&#]c=(GQ-[A-Z0-9]{4}-[A-Z0-9]{6})/i);
  if(!m) return;
  try{ history.replaceState(null, "", location.pathname); }catch(err){}
  setTimeout(()=>applyInspectorCode(decodeURIComponent(m[1]), true), 700);
}
// Deep links: guildquest://inspect?c=GQ-XXXX-XXXXXX (Android app only)
(function listenForLinks(){
  const C = window.Capacitor;
  if(C && C.Plugins && C.Plugins.App){
    C.Plugins.App.addListener("appUrlOpen", ev => { const m=String(ev.url||"").match(/[?&]c=([^&]+)/); if(m) setTimeout(()=>applyInspectorCode(decodeURIComponent(m[1]), true), 300); });
  }
})();

/* ---------- save backup: export / import ---------- */
function exportSave(){
  const data = JSON.stringify({app:"guild-quests", v:1, at:new Date().toISOString(), state}, null, 1);
  const name = `chore-isekai-save-${dayKey()}.json`;
  const C = window.Capacitor;
  if(C && C.isNativePlatform && C.isNativePlatform() && C.Plugins.Filesystem && C.Plugins.Share){
    C.Plugins.Filesystem.writeFile({path:name, data, directory:"CACHE", encoding:"utf8"})
      .then(w => C.Plugins.Share.share({title:"Chore Isekai save", text:"My Chore Isekai save file", url:w.uri, dialogTitle:"Save your backup"}))
      .then(()=>toast("📤 Save exported!")).catch(err=>{ if(!/cancel/i.test(String(err&&err.message))) toast("Couldn't export the save."); });
    return;
  }
  const url = URL.createObjectURL(new Blob([data], {type:"application/json"}));
  const a = document.createElement("a"); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 2000); toast("📤 Save downloaded!");
}
function importSave(){
  const inp = document.createElement("input"); inp.type="file"; inp.accept=".json,application/json";
  inp.onchange = () => {
    const f = inp.files && inp.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = () => {
      let obj; try{ obj = JSON.parse(r.result); }catch(err){ toast("That file isn't a Chore Isekai save."); return; }
      const s = obj && obj.app==="guild-quests" ? obj.state : null;
      if(!s || typeof s!=="object" || !Array.isArray(s.quests)){ toast("That file isn't a Chore Isekai save."); return; }
      const lv = levelInfo(s.xp||0).lvl;
      openModal(`<span class="ribbon">IMPORT SAVE</span>
        <p style="margin:0;font-size:14px;line-height:1.5">Load <b>${esc(s.name||"Adventurer")}</b> (LV ${lv}, ${s.completed||0} quests cleared)${obj.at?`, saved ${esc(String(obj.at).slice(0,10))}`:""}?</p>
        <div class="verdict no"><b>⚠️ This replaces everything on this device.</b> Your current progress will be overwritten. Export it first if you want to keep it.</div>
        <div class="btns"><button class="gbtn" id="impGo">📥 Load this save</button><button class="gbtn plain" data-act="close">Cancel</button></div>`);
      $("impGo").onclick = () => { if($("title")){ state = normalise(s); saveLocal(); location.reload(); return; } state = normalise(s); save(); closeModal(); go("home"); render(); toast("📥 Save loaded!"); say(`Welcome back, ${state.name||"adventurer"}! Your guild card is all in order~`); };
    };
    r.readAsText(f);
  };
  inp.click();
}
