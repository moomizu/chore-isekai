/* ================= Aptitude profile: personality quiz -> personal quest ranks ================= */

const CATS = {
  physical:{n:"Physical", i:"💪", d:"Heavy lifting, exercise, yard work"},
  outside: {n:"Going out & errands", i:"🚪", d:"Leaving the house, shops, appointments, bins"},
  social:  {n:"Social", i:"💬", d:"Calls, messages, talking to people"},
  study:   {n:"Study & reading", i:"📚", d:"Reading, learning, focus work"},
  household:{n:"Household", i:"🧹", d:"Cleaning and tidying indoors"},
  selfcare:{n:"Self-care", i:"🛁", d:"Hygiene, meals, sleep, rest"},
  admin:   {n:"Admin & paperwork", i:"📋", d:"Bills, forms, emails, planning"},
  creative:{n:"Creative", i:"🎨", d:"Making, drawing, writing, crafting"}
};
const CAT_KEYS = Object.keys(CATS);
const SIZES = {quick:{n:"Quick", d:"under 10 min", v:1}, medium:{n:"Medium", d:"about 30 min", v:2}, big:{n:"Big", d:"an hour or more", v:3}};
const RANK_ORDER = ["E","D","C","B","A"];

/* Each answer nudges how hard a task type is for you (+ harder, - easier) */
const QUIZ = [
  {q:"A free Saturday! What sounds best?", a:[
    ["A hike or a game of sport", {physical:-2, outside:-1}],
    ["Gaming or a good book at home", {study:-1, outside:1, physical:1}],
    ["Catching up with friends", {social:-2, outside:-1}],
    ["Making something: art, crafts, cooking", {creative:-2}]]},
  {q:"Someone asks you to phone a shop to check something.", a:[
    ["Easy, I'll do it now", {social:-2}],
    ["I'd rather email or message", {social:1, admin:-1}],
    ["I'd put it off for days", {social:2}],
    ["Please don't make me", {social:3}]]},
  {q:"You're out of groceries.", a:[
    ["Quick trip, no worries", {outside:-2}],
    ["Fine if I plan it", {}],
    ["I'd order online to avoid going", {outside:2}],
    ["Going out wipes me out for the day", {outside:3}]]},
  {q:"There's a 20-page article you need to read.", a:[
    ["Done in one sitting", {study:-2}],
    ["Needs breaks, but fine", {}],
    ["My brain slides right off it", {study:2}],
    ["Reading is genuinely hard for me", {study:3}]]},
  {q:"It's moving-furniture day.", a:[
    ["Let's go, I love this", {physical:-2}],
    ["Fine, I'll help", {}],
    ["I'll be exhausted after", {physical:2}],
    ["My body isn't up for that", {physical:3}]]},
  {q:"A pile of dishes and a messy room.", a:[
    ["Cleaning is weirdly satisfying", {household:-2}],
    ["Annoying, but I'll do it", {}],
    ["Starting is the hard part", {household:2}],
    ["It feels overwhelming", {household:3}]]},
  {q:"Bills, forms and emails waiting for you.", a:[
    ["I knock them out straight away", {admin:-2}],
    ["Fine with a reminder", {}],
    ["They tend to pile up", {admin:2}],
    ["I avoid them as long as I can", {admin:3}]]},
  {q:"Showers, proper meals, a sleep routine.", a:[
    ["On autopilot", {selfcare:-2}],
    ["Mostly fine", {}],
    ["They slip when I'm busy", {selfcare:2}],
    ["Often a real struggle", {selfcare:3}]]},
  {q:"A blank page and a new creative project.", a:[
    ["Exciting!", {creative:-2}],
    ["Fun if I have an idea", {}],
    ["Hard to get started", {creative:2}],
    ["Not really my thing", {creative:3}]]},
  {q:"After a long day, you still have energy for…", a:[
    ["A workout or a walk", {physical:-1, outside:-1}],
    ["Seeing people", {social:-1}],
    ["A quiet hobby", {creative:-1, study:-1}],
    ["Nothing. I need to recharge", {social:1, physical:1}]]}
];
/* Ranked positions -> difficulty (always spread out, so nobody can make everything hard) */
const DIFF_BY_POS = [1, 1.5, 2, 2.5, 3, 3.5, 4.5, 5];

function buildProfile(answers){
  const score = Object.fromEntries(CAT_KEYS.map(k=>[k,0]));
  answers.forEach((ai,qi)=>{ const fx=QUIZ[qi].a[ai][1]; for(const [k,v] of Object.entries(fx)) score[k]+=v; });
  const order = CAT_KEYS.slice().sort((a,b)=>score[a]-score[b] || CAT_KEYS.indexOf(a)-CAT_KEYS.indexOf(b));
  const base = {}; order.forEach((k,i)=>base[k]=DIFF_BY_POS[i]);
  return {base, done:{}, taken:dayKey()};
}
/** Current difficulty of a task type (1 easy … 5 hard), easing slowly with practice */
function catDiff(cat){
  const p=state.profile; if(!p) return 3;
  const done=(p.done||{})[cat]||0, ease=Math.min(1.5, Math.floor(done/10)*.25);
  return Math.max(1, ((p.base||{})[cat]||3) - ease);
}
function rankFor(cat, size){
  if(!state.profile || !CATS[cat] || !SIZES[size]) return null;
  const v = SIZES[size].v + (catDiff(cat)-1)*.7;
  return RANK_ORDER[Math.max(0, Math.min(4, Math.round(v)-1))];
}
/** Rank of a quest: personal if it has a type and size, otherwise its old fixed rank */
function qRank(q){ if(q && q.tut) return "E"; if(q && q.story) return "S"; return (q && q.cat && q.size && rankFor(q.cat, q.size)) || (q && q.rank) || "D"; }
function noteClear(q){ if(state.profile && q.cat){ const d=state.profile.done||(state.profile.done={}); const before=catDiff(q.cat); d[q.cat]=(d[q.cat]||0)+1; if(catDiff(q.cat)<before) setTimeout(()=>toast(`${CATS[q.cat].i} ${CATS[q.cat].n} quests are getting easier for you!`),4500); } }

/* ---------- quiz UI ---------- */
let QZ = null;
function openQuiz(){
  QZ = {i:0, ans:[]};
  drawQuiz();
}
function drawQuiz(){
  if(QZ.i>=QUIZ.length) return finishQuiz();
  const Q=QUIZ[QZ.i];
  openModal(`<span class="ribbon">APTITUDE TEST</span>
    ${QZ.i===0?`<p class="note" style="margin:0;text-align:center"><b style="color:var(--rose)">Lilia:</b> Before you take quests, the guild needs to know what comes easy to you and what's tough. No wrong answers! It just makes quest ranks fair for <i>you</i>.</p>`:""}
    <div class="qzbar"><i style="width:${QZ.i/QUIZ.length*100}%"></i></div>
    <p class="sub" style="margin:0;text-align:center">Question ${QZ.i+1} of ${QUIZ.length}</p>
    <h3 class="t">${esc(Q.q)}</h3>
    <div class="btns">${Q.a.map((a,j)=>`<button class="gbtn plain qzopt" data-act="qz" data-v="${j}">${esc(a[0])}</button>`).join("")}</div>
    ${QZ.i>0?`<button class="gbtn plain sm" data-act="qzBack" style="align-self:center">← Back</button>`:""}`);
}
function finishQuiz(){
  const prev = state.profile;
  state.profile = buildProfile(QZ.ans);
  if(prev && prev.done) state.profile.done = prev.done;   // keep practice progress on a retake
  QZ = null; save(); render();
  const order = CAT_KEYS.slice().sort((a,b)=>catDiff(a)-catDiff(b));
  const chip = k => `<span class="catchip">${CATS[k].i} ${CATS[k].n}</span>`;
  openModal(`<span class="ribbon">YOUR APTITUDE</span>
    <p class="note" style="margin:0;text-align:center"><b style="color:var(--rose)">Lilia:</b> All filed! Quests in your tough areas will rank higher and pay more, because they take more courage.</p>
    <div class="opt"><span>COMES EASY</span><div class="chips">${order.slice(0,3).map(chip).join("")}</div></div>
    <div class="opt"><span>TOUGH STUFF (BIGGER REWARDS)</span><div class="chips">${order.slice(-3).reverse().map(chip).join("")}</div></div>
    <p class="note" style="margin:0">A quest's rank comes from its type and size. Types you clear often slowly get easier. You can retake this any time in Settings.</p>
    <div class="btns"><button class="gbtn" data-act="close">Let's go!</button></div>`);
}
function renderProfileSettings(){
  const p=state.profile;
  return `<section class="frame"><span class="ribbon">APTITUDE PROFILE</span>
    ${p?`<p class="note" style="margin:0 0 6px">How hard each type of task is for you. Harder types give higher-ranked quests.</p>
      ${CAT_KEYS.slice().sort((a,b)=>catDiff(a)-catDiff(b)).map(k=>{ const d=catDiff(k), done=(p.done||{})[k]||0;
        return `<div class="diffrow"><span>${CATS[k].i} ${CATS[k].n}</span><div class="dbar"><i style="width:${(d/5)*100}%"></i></div><small>${done?`${done} done`:""}</small></div>`; }).join("")}`
      :`<p class="note" style="margin:0">You haven't taken the aptitude test yet.</p>`}
    <button class="gbtn blue" data-act="quizStart" style="margin-top:10px">${p?"Retake the test":"Take the test"}</button></section>`;
}

/* ---------- AI sorting for posted quests ---------- */
async function aiSortQuest(title, existing=[]){
  const list = existing.slice(0,60).map((q,i)=>`${i+1}. ${q.title}`).join("\n");
  const out = await AI.json(`Classify this real-life task for a habit app.
Task: "${title}"
Categories: physical (exercise, heavy lifting, yard work), outside (leaving the house, errands, shops, taking bins out, appointments), social (calls, messages, talking to people), study (reading, learning, focus work), household (indoor cleaning and tidying), selfcare (hygiene, meals, sleep, rest, health), admin (bills, forms, emails, planning), creative (art, writing, crafts, music).
Pick the single category that makes the task hardest to do (e.g. taking bins out = outside). Size: quick (under 10 min), medium (about 30 min) or big (an hour or more).
Be realistic about the size: judge how long the task normally takes, not how long someone says it takes (a shower is quick, cleaning a whole house is big).
Also give a short, friendly reason (under 15 words) in the voice of Lilia, a cheerful guild receptionist. If proof is "honour", call it a "trust quest" and keep the reason tactful and vague (e.g. "This one's best as a trust quest~"), never describing anything private.
Proof: "honour" if a photo of it would be private or inappropriate (bathing, showering, toilet, getting dressed, skincare on the body, medical things, anything intimate), would need people in the shot (calls, chats, hanging out), or there's nothing visible to photograph (meditating, resting). Otherwise "photo".
${list ? `The player already has these quests:
${list}
Set "dupe" to the number of an existing quest that is the same task or basically the same thing done a different way (e.g. "take a shower" vs "have a bath", "do the dishes" vs "wash up"), otherwise 0. Different tasks in the same area (e.g. "vacuum the lounge" vs "mop the kitchen") are not dupes.
` : ""}If proof is "photo", set "shot" to what the proof photo must show, in under 20 words, written to the player (e.g. "Washing hanging on a line or drying rack, or a load in the dryer"). Pick something that only exists while or right after the task is done, never a scene that looks the same either way (clothes in a wardrobe, a closed cupboard). If proof is "honour", set "shot" to "".
Reply with JSON only: {"cat":"<category>","size":"<quick|medium|big>","proof":"<photo|honour>","dupe":<number>,"reason":"<short reason>","shot":"<what to photograph>"}`);
  if(!out || !CATS[out.cat] || !SIZES[out.size]) throw new Error("Lilia couldn't sort that one. Pick a type and size yourself.");
  if(out.proof!=="honour") out.proof="photo";
  out.shot = out.proof==="photo" && typeof out.shot==="string" ? out.shot.trim().slice(0,140) : "";
  const n = parseInt(out.dupe,10); out.dupeOf = n>=1 && n<=existing.length ? existing[n-1].id : null;
  return out;
}
