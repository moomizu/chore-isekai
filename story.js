/* =====================================================================
   MAIN STORY: visual-novel scenes with choices, unlocked by level/rank,
   each chapter ends with a story boss fight.
   ---------------------------------------------------------------------
   HOW TO WRITE A SCENE (each line is one of these):
     {s:"lilia", t:"Text"}          someone talks. s = "lilia", "you", "narrator" or a recruit id ("kai", "vex"...)
     {s:"lilia", t:"...", n:"???"}  override the name tag (e.g. before a character is introduced)
     {choice:[ {t:"Option A", r:[...lines]}, {t:"Option B", r:[...lines]} ]}
                                    the player picks one; its "r" lines play next (optional)
     {bg:"guild"}                   change the background (see STORY_BGS below)
     {bgm:"calm"}                   change the music: calm, happy, mystic, tense, sad, tavern, or "none" for silence.
                                    A scene with no {bgm} plays "calm".
   A CHAPTER is a list of steps, played in order:
     {scene:[...lines]}             a visual-novel scene
     {fight:{n, base, waves, hp, atk, bpm}}   a story battle (no entry fee)
     {quest:{title, proof, cat, size, flavour, recap}}
                                    Lilia pins a real-life STORY QUEST (S-rank, extra rewards) on the board.
                                    The story continues once you clear it. "recap" is the line shown when re-reading.
   ===================================================================== */
/* ---------- BACKGROUNDS: placeholder gradients until real art exists at art/story/bg_<key>.png ---------- */
const STORY_BGS = {
  bakery:  {n:"Marigold's Bakery", g:"linear-gradient(180deg,#f6d9a8 0%,#e7b77a 50%,#9a6a3e 100%)", deco:"🥐🍞", dark:false},
  well:    {n:"The town well", g:"linear-gradient(180deg,#bfe3f5 0%,#9cc7a8 50%,#6b7a6a 100%)", deco:"🪣", dark:false},
  laundry: {n:"Your laundry room",  g:"linear-gradient(180deg,#dfe8f2 0%,#b9c8d8 55%,#8a9bb0 100%)", deco:"🧺🫧", dark:false},
  phone:   {n:"The other side of the screen", g:"radial-gradient(circle at 50% 30%,#fff6d8,#e9d6ff 40%,#8f7ad6 75%,#3b2f7a)", deco:"✨", dark:false},
  guild:   {n:"Adventurer's Guild", g:"linear-gradient(180deg,#5b3a24 0%,#3a2416 50%,#20140c 100%)", deco:"🛡️📜", dark:true},
  tavern:  {n:"The tavern", g:"linear-gradient(180deg,#7a3f1e 0%,#4a2412 55%,#22100a 100%)", deco:"🍺🕯️", dark:true},
  fields:  {n:"Slime Fields", g:"linear-gradient(180deg,#9fd4ff 0%,#cdeaff 45%,#7cc46a 46%,#4a8a3c 100%)", deco:"🌾", dark:false},
  town:    {n:"Town square", g:"linear-gradient(180deg,#f7c9a0 0%,#e8a87c 45%,#8a7a6a 46%,#5a4e44 100%)", deco:"🏘️", dark:false}
};
/* ---------- PROLOGUE: plays in pieces during the tutorial; re-reading it plays them all as a recap ---------- */
const PROLOGUE = {
  intro:[
    {bg:"laundry"},
    {bgm:"calm"}, {s:"narrator", t:"Laundry day. You're loading the washing machine when your phone slips out of your pocket… plop."},
    {s:"narrator", t:"You fish it out, dripping. The screen flickers on all by itself."},
    {bg:"phone"},
    {bgm:"mystic"}, {s:"tidea", n:"???", f:"happy", e:"exclaim", t:"…Hello? Oh, thank the stars. It finally connected."},
    {s:"tidea", f:"sad", e:"zzz", t:"Sorry, sorry. I haven't slept in about… three hundred years. I'm Tidea, goddess of the world on the other side of this screen."},
    {s:"tidea", f:"sad", e:"sweat", t:"My world is in trouble. Monsters and demons spread a miasma, and anyone who breathes it loses their motivation."},
    {s:"tidea", f:"happy", t:"Not for everything. People can still chase the things they love. But the moment they think about chores… they go all heavy and sluggish."},
    {s:"tidea", f:"sad", t:"Dishes pile up. Homes fall apart. People fall apart. And it's getting worse."},
    {s:"tidea", f:"happy", t:"But your world is overflowing with motivation! Every chore you finish there can flow through this link to mine."},
    {choice:[
      {t:"So… you want me to do my chores?", r:[{s:"tidea", f:"happy", t:"When you put it like that it sounds silly, doesn't it? But yes. Truly, deeply, yes."}]},
      {t:"Why me?", r:[{s:"tidea", f:"sad", e:"gloom", t:"Honestly? Your phone fell into the washing machine at exactly the right moment. Destiny is weird sometimes."}]}
    ]},
    {s:"tidea", f:"happy", t:"I can't bring you to my world. But I can make you a vessel there, an avatar that carries your motivation for you."},
    {s:"tidea", f:"happy", t:"Let's make one together, shall we?"}
  ],
  arrive:[
    {bg:"guild"},
    {bgm:"happy"}, {s:"narrator", t:"A flash of light. You're still standing in your laundry… but on your screen, your avatar opens its eyes in a busy guild hall."},
    {s:"you", f:"happy", e:"question", t:"(So this is me, over there.)"},
    {s:"lilia", f:"happy", e:"exclaim", t:"Oh! Welcome to the Adventurer's Guild! You're new, aren't you? I'm Lilia, the receptionist!"},
    {s:"lilia", f:"happy", t:"New members take a quick aptitude test first. Everyone does it, don't worry!"}
  ],
  board:[
    {bg:"guild"},
    {bgm:"calm"}, {s:"lilia", f:"sad", e:"sweat", t:"So, the quest board… Fair warning, it's mostly chore requests. Dishes, laundry, sweeping…"},
    {s:"lilia", f:"happy", t:"Hardly anyone takes them. Chores are skilled labour, you know! Most people don't even know how to do them properly anymore."},
    {s:"lilia", f:"angry", e:"anger", t:"And the adventurers would rather fight monsters and get stronger. They can barely keep up with their own chores, let alone anyone else's!"},
    {s:"lilia", f:"happy", t:"Let's start by registering you properly. Your first quest is on the board!"}
  ],
  photo:[
    {bg:"guild"},
    {bgm:"mystic"}, {s:"tidea", f:"happy", e:"sparkle", t:"I felt that! Your very first spark of motivation just crossed over!"},
    {s:"tidea", f:"happy", t:"Every quest you clear sends more through. And a photo carries far more than just your word, so bring proof when you can~"},
    {bgm:"happy"},
    {s:"lilia", f:"happy", e:"question", t:"Registration complete! Um… who were you talking to just now?"},
    {choice:[
      {t:"A goddess. On my phone.", r:[{s:"lilia", f:"happy", e:"sweat", t:"…Right! Of course! Very normal. Haha."}]},
      {t:"Nobody!", r:[{s:"lilia", f:"happy", e:"heart", t:"Okaaay. You're a strange one. I like it!"}]}
    ]}
  ],
  gacha:[
    {bg:"tavern"},
    {bgm:"tavern"}, {s:"lilia", f:"happy", t:"You'll want a party! The tavern's full of adventurers looking for a team."},
    {s:"lilia", f:"sad", e:"dots", t:"They're strong. They just won't touch a broom. Maybe you'll inspire them?"}
  ],
  hunt:[
    {bg:"guild"},
    {bgm:"tense"}, {s:"lilia", f:"sad", e:"exclaim", t:"Urgent report from the Slime Fields! The slimes there are thick with miasma, and they're drifting closer to town."},
    {s:"lilia", f:"sad", e:"sweat", t:"There's a big one leading them. A King Slime! Could you and your party drive them back?"},
    {s:"tidea", f:"sad", e:"sweat", t:"Be careful. Wherever monsters gather, the miasma grows stronger."},
    {bgm:"happy"},
    {s:"lilia", f:"happy", e:"exclaim", t:"Oh, and one more! The apothecary's run out of herbs. Her pickers have been too sluggish to go out for days."},
    {s:"lilia", f:"happy", e:"note", t:"Sunny Meadow is right next to the Slime Fields. Since you'll be in the area anyway, could you pick 3 Herbs on the way back?"}
  ],
  finish:[
    {bg:"town"},
    {bgm:"happy"}, {s:"lilia", f:"happy", e:"sparkle", t:"You did it! The fields are clear, and the town feels… lighter, somehow. Someone even swept their doorstep this morning!"},
    {s:"tidea", f:"happy", t:"You did wonderfully. Can you feel it? A little motivation is already flowing back into my world."},
    {bgm:"mystic"},
    {s:"tidea", f:"sad", e:"sweat", t:"But those slimes were only the beginning. There are far more powerful demons out there, and their miasma runs much deeper."},
    {s:"tidea", f:"happy", e:"zzz", t:"I'll be counting on you. Now, if you'll excuse me… I'm going to take a very, very long nap."}
  ]
};
const STORY = [
  { id:"prologue", n:"Prologue", sub:"A Call from the Washing Machine", tutorial:true,
    recapSteps:[
      {scene:[...PROLOGUE.intro,
        {s:"narrator", t:"Together, you and Tidea shaped your avatar…"}, {avatar:true},
        ...PROLOGUE.arrive, {s:"narrator", t:"You passed the aptitude test with flying colours."},
        ...PROLOGUE.board, {s:"narrator", t:"You took your first quest, and sent a thumbs-up across worlds."},
        ...PROLOGUE.photo, ...PROLOGUE.gacha,
        {s:"narrator", t:"At the tavern, you recruited your first companion and bought them a proper weapon."},
        ...PROLOGUE.hunt]},
      {fight:{n:"King Slime", base:"slime", bpm:112, waves:[["slime"],["slime","slime"]], hp:3.2, atk:1.4}},
      {scene:PROLOGUE.finish}
    ]},

  /* ---------------- CHAPTER 1 ---------------- */
  { id:"ch1", n:"Chapter 1", sub:"The Well Water Tastes Funny", days:1, reward:{crystals:50}, steps:[
    {scene:[
      {bg:"guild"}, {bgm:"calm"},
      {s:"lilia", f:"happy", t:"Good morning! Oh, perfect timing. A request just came in from the townsfolk."},
      {s:"lilia", f:"sad", e:"sweat", t:"Ever since you drove the slimes off, the well water's been tasting… funny. Nobody wants to drink it."},
      {s:"tidea", f:"sad", e:"zzz", t:"Mm… *yawn*… I can feel a little miasma near that well. Something's still lurking there."},
      {s:"lilia", f:"happy", t:"Could you take a look? You're the only one who takes these kinds of requests!"},
      {choice:[
        {t:"Of course!", r:[{s:"lilia", f:"happy", t:"Yay! I knew I could count on you!"}]},
        {t:"Do I have to?", r:[{s:"lilia", f:"happy", e:"note", t:"You don't HAVE to… but you'll do it anyway, won't you?"}]}
      ]},
      {bg:"town"}, {bgm:"sad"},
      {s:"narrator", t:"The town square. Laundry hangs forgotten on the lines. A broom leans against a doorway, wrapped in cobwebs."},
      {s:"narrator", t:"People sit on their doorsteps, sighing every time they glance back at their homes."},
      {bg:"well"},
      {s:"barnaby", f:"sad", e:"exclaim", t:"Ah, an adventurer! Something's been splashing about down there. Gave me quite a fright!"},
      {bgm:"tense"},
      {s:"narrator", t:"You peer over the edge. Two beady eyes peer back up at you."},
      {s:"you", f:"happy", e:"exclaim", t:"(A slime! Looks like one that got away from the fields…)"}
    ]},
    {fight:{n:"Straggler Slime", base:"slime", bpm:104, waves:[["slime"]], hp:2.4, atk:1.1}},
    {scene:[
      {bg:"well"}, {bgm:"mystic"},
      {s:"tidea", f:"happy", t:"Well done! Now, I'll purify the water for safe measures."},
      {s:"narrator", t:"A soft light ripples across the water. The last wisps of miasma fade away."},
      {bgm:"calm"},
      {s:"barnaby", f:"sad", e:"sweat", t:"The water looks crystal clear… is it really safe to drink now?"},
      {s:"narrator", t:"The townsfolk murmur nervously. Nobody steps forward."},
      {s:"lilia", f:"happy", t:"Leave it to the guild! I'll post a proper request."},
      {s:"lilia", f:"happy", t:"Adventurer, would you test the water for everyone? Just drink a glass and tell them how it tastes!"}
    ]},
    {quest:{title:"Drink a glass of water", proof:"honour", cat:"selfcare", size:"quick",
            flavour:"Lilia's request: test the well water so the townsfolk know it's safe.",
            recap:"You accepted Lilia's request and drank a glass of the well water. Perfectly fresh!"}},
    {scene:[
      {bg:"well"}, {bgm:"happy"},
      {s:"narrator", t:"Cool, clean, and just a little crisp. It's very refreshing."},
      {s:"barnaby", f:"happy", t:"Well? …Ha! If the adventurer says it's good, it's good!"},
      {s:"narrator", t:"One by one, the townsfolk line up with their buckets. Someone even rinses out a dusty old jug."},
      {s:"lilia", f:"happy", t:"You did it! Most adventurers would never take a request like that. You're really something, you know?"},
      {s:"tidea", f:"happy", t:"Little by little, the town is waking up. Thank you."}
    ]}
  ]},

  /* ---------------- CHAPTER 2 ---------------- */
  { id:"ch2", n:"Chapter 2", sub:"The Baker Who Couldn't Wash Up", days:5, reward:{crystals:60}, steps:[
    {scene:[
      {bg:"guild"}, {bgm:"happy"},
      {s:"lilia", f:"happy", t:"You've got a fan! The baker on Hearth Street asked for you by name!"},
      {s:"lilia", f:"happy", t:"Marigold's bakery makes the best bread in town. She never stopped baking, not even once the miasma came."},
      {choice:[
        {t:"Wait, the miasma doesn't affect her?", r:[]},
        {t:"Free bread?!", r:[{s:"lilia", f:"happy", t:"Probably! But listen, this is important."}]}
      ]},
      {s:"lilia", f:"happy", t:"The miasma only steals your motivation for chores. If you love something with your whole heart, it can't touch that."},
      {s:"lilia", f:"happy", t:"That's why the adventurers still fight, and why I still love working here! And Marigold loves baking more than anything."},
      {s:"lilia", f:"sad", e:"sweat", t:"Washing up, though…"},
      {bg:"bakery"}, {bgm:"calm"},
      {s:"marigold", f:"happy", e:"note", t:"Oh, you came! Welcome, welcome! Here, have a roll. Fresh from the oven!"},
      {s:"narrator", t:"Every surface is covered in trays, bowls and sticky spoons. The sink is a mountain of piled up dirty dishes."},
      {s:"marigold", f:"sad", e:"gloom", t:"I bake and bake and bake… and then I look at that sink and my arms turn to jelly."},
      {s:"marigold", f:"sad", e:"sweat", t:"I'm down to my very last clean bowl. Could you…? I'll pay you in bread!"}
    ]},
    {quest:{title:"Wash the dishes", proof:"photo", cat:"household", size:"medium",
            flavour:"Marigold's request: help clear the mountain of dishes so she can keep baking.",
            recap:"You rolled up your sleeves and washed every last dish in Marigold's kitchen."}},
    {scene:[
      {bg:"bakery"}, {bgm:"calm"},
      {s:"narrator", t:"The last bowl clinks onto the drying rack. Then…"},
      {bgm:"tense"},
      {s:"narrator", t:"Glug. Glug. GLUG."},
      {s:"marigold", f:"sad", e:"sweat", t:"That sink's been making noises for weeks. I thought it was just me being tired…"},
      {s:"narrator", t:"Something spotted and squishy pushes its way up through the drain, thick with miasma!"}
    ]},
    {fight:{n:"Sink Shroom", base:"shroom", bpm:110, waves:[["shroom"]], hp:2.8, atk:1.3}},
    {scene:[
      {bg:"bakery"}, {bgm:"happy"},
      {s:"marigold", f:"happy", e:"sparkle", t:"My kitchen hasn't sparkled like this in years! Come back any time. There'll always be a warm roll waiting for you."},
      {s:"tidea", f:"happy", t:"Did you notice? She was humming while she put the bowls away. A little of her motivation came back."},
      {bgm:"mystic"},
      {s:"tidea", f:"sad", e:"sweat", t:"…Though that mushroom crawled up from the pipes. The miasma is seeping in from somewhere beyond the town."},
      {s:"you", f:"happy", t:"(Somewhere beyond the town… I'll have to keep an eye out.)"}
    ]}
  ]},
  { id:"ch3", n:"Chapter 3", sub:"Being written ✍️", days:12, wip:true }
];
/* ---------- STORY CAST: pixel placeholders until art exists ----------
   Faces (f): happy (default), sad, angry. Drawn art: art/story/<id>.png (happy) + art/story/<id>_sad.png, <id>_angry.png
   Emotes (e): little manga icons beside the head: anger, gloom, sweat, exclaim, question, sparkle, note, dots, heart, zzz */
const EXPRESSIONS = ["happy","sad","angry"];
const EMOTES = {
  anger:   '<svg viewBox="0 0 40 40"><g stroke="#e8343f" stroke-width="5" fill="none" stroke-linecap="round"><path d="M6 15 Q15 15 15 6"/><path d="M25 6 Q25 15 34 15"/><path d="M34 25 Q25 25 25 34"/><path d="M15 34 Q15 25 6 25"/></g></svg>',
  gloom:   '<svg viewBox="0 0 40 40"><g stroke="#6a6fd6" stroke-width="3.5" stroke-linecap="round"><path d="M9 4 V30"/><path d="M17 4 V36"/><path d="M25 4 V26"/><path d="M33 4 V33"/></g></svg>',
  sweat:   '<svg viewBox="0 0 40 40"><path d="M20 4 Q34 22 30 29 Q26 36 20 36 Q14 36 10 29 Q6 22 20 4Z" fill="#7fd8ff" stroke="#2a7ab8" stroke-width="2.5"/><path d="M15 26 Q15 31 19 32" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>',
  exclaim: '<svg viewBox="0 0 40 40"><path d="M16 4 H25 L23 26 H18Z" fill="#ffd166" stroke="#a0520f" stroke-width="2.5" stroke-linejoin="round"/><circle cx="20.5" cy="33" r="4" fill="#ffd166" stroke="#a0520f" stroke-width="2.5"/></svg>',
  question:'<svg viewBox="0 0 40 40"><path d="M11 14 Q11 4 20 4 Q30 4 30 13 Q30 19 22 22 V26" fill="none" stroke="#7fd8ff" stroke-width="5.5" stroke-linecap="round"/><circle cx="22" cy="34" r="3.5" fill="#7fd8ff"/></svg>',
  sparkle: '<svg viewBox="0 0 40 40"><path d="M20 2 Q22 18 38 20 Q22 22 20 38 Q18 22 2 20 Q18 18 20 2Z" fill="#ffe680" stroke="#c99a1a" stroke-width="1.5"/></svg>',
  note:    '<svg viewBox="0 0 40 40"><path d="M15 30 V8 L33 4 V25" fill="none" stroke="#ff8fb8" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="11" cy="31" rx="5.5" ry="4.5" fill="#ff8fb8"/><ellipse cx="29" cy="26" rx="5.5" ry="4.5" fill="#ff8fb8"/></svg>',
  dots:    '<svg viewBox="0 0 40 40"><rect x="2" y="9" width="36" height="22" rx="11" fill="#fff" stroke="#2a1a40" stroke-width="2"/><circle cx="12" cy="20" r="2.8" fill="#2a1a40"/><circle cx="20" cy="20" r="2.8" fill="#2a1a40"/><circle cx="28" cy="20" r="2.8" fill="#2a1a40"/></svg>',
  heart:   '<svg viewBox="0 0 40 40"><path d="M20 35 Q4 24 4 14 Q4 5 12 5 Q17 5 20 11 Q23 5 28 5 Q36 5 36 14 Q36 24 20 35Z" fill="#ff6f91" stroke="#b02a50" stroke-width="2"/></svg>',
  zzz:     '<svg viewBox="0 0 40 40"><g fill="#c9d0f2" stroke="#3b2f7a" stroke-width="1" font-family="sans-serif" font-weight="900"><text x="2" y="36" font-size="15">z</text><text x="13" y="25" font-size="12">z</text><text x="23" y="15" font-size="15">Z</text></g></svg>'
};
const STORY_CAST = {
  tidea:    {name:"TIDEA", glow:true, look:{style:1, hair:"#f3e6b0", eye:"#5fb4e6", skin:"#fde2d2", eyes:"sleepy", brows:"worried", mouth:"smile", extra:"blush",
             top:"robe", topCol:"#e8f0ff", bottom:"longskirt", botCol:"#e8f0ff", head:"none", outfit2:"#f2c14e", weapon:"none"}},
  barnaby:  {name:"Old Barnaby", look:{style:0, hair:"#d8d8d8", eye:"#5a4e44", skin:"#f2c6a0", eyes:"sleepy", brows:"thick", mouth:"smile", extra:"mustache",
             top:"vest", topCol:"#7a5a3a", bottom:"pants", botCol:"#4a4a5a", head:"none", weapon:"none"}},
  marigold: {name:"Marigold", look:{style:2, hair:"#e8953a", eye:"#2f9e6f", skin:"#fde2d2", eyes:"round", brows:"soft", mouth:"smile", extra:"freckles",
             top:"tunic", topCol:"#f4f0e6", outfit2:"#ffffff", bottom:"longskirt", botCol:"#c8302c", head:"ribbon", weapon:"none"}}
};
/* how each expression changes a pixel sprite */
const EXPR_PX = { happy:{}, sad:{mouth:"frown", brows:"worried"}, angry:{mouth:"frown", brows:"angry"} };

const Story = (() => {
  const S = () => state.story || (state.story = {read:{}, done:{}});
  const idx = id => STORY.findIndex(c=>c.id===id);
  function locked(c){
    const i = idx(c.id);
    if(c.wip) return "Coming soon";
    if(c.tutorial && !S().done[c.id]) return "Play through the tutorial";
    if(i>0 && !S().done[STORY[i-1].id]) return `Clear ${STORY[i-1].n} first`;
    const ad = (state.activeDays||[]).length;
    if(c.days && ad < c.days) return `Clear quests on ${c.days-ad} more day${c.days-ad===1?"":"s"}`;
    if(c.lv && heroLevel() < c.lv) return `Reach LV ${c.lv}`;
    return "";
  }
  function render(){
    if(state.tut && state.tut.done && !S().done.prologue){ S().done.prologue=true; S().read.prologue=true; }
    return `<section class="frame"><span class="ribbon">MAIN STORY</span>
      <p class="note" style="margin:0 0 8px;text-align:center">Goddess Tidea's world is losing its motivation to a strange miasma. New chapters unlock as you keep clearing quests day by day.</p>
      <div class="stlist">${visible().map(c=>{ const lk=locked(c), done=S().done[c.id], read=S().read[c.id];
        return `<button class="stch ${lk?"locked":""} ${done?"done":""}" data-act="st-open" data-v="${c.id}" ${lk&&!done?"disabled":""}>
          <span class="st-n">${esc(c.n)}${c.draft?` <small class="st-draft">DRAFT</small>`:""}</span><b>${esc(c.sub)}</b>
          <small>${done?"✔ Cleared · tap for a recap":lk?`🔒 ${esc(lk)}`:status(c)}</small></button>`; }).join("")}</div>
    </section>`;
  }
  let recapping=null;
  /* only the next uncleared chapter is shown (greyed out until it unlocks), with cleared chapters below it, newest first */
  const sync = () => { if(state.tut && state.tut.done && !S().done.prologue){ S().done.prologue=true; S().read.prologue=true; } };
  const next = () => { sync(); return STORY.find(c=>!S().done[c.id]) || null; };
  const ready = c => !locked(c) && !S().done[c.id];
  function visible(){ const nx=next(), cleared=STORY.filter(c=>S().done[c.id]).reverse(); return nx ? [nx, ...cleared] : cleared; }
  const P = id => (S().prog||(S().prog={}))[id]||0;
  function setP(id,v){ (S().prog||(S().prog={}))[id]=v; save(); }
  const qid = (c,i) => `story-${c.id}-${i}`;
  function open(id){
    const c = STORY[idx(id)]; if(!c || (locked(c) && !S().done[c.id])) return;
    if(S().done[c.id]) return recapRun(c, 0);
    run(c);
  }
  function run(c){
    const i = P(c.id), stp = (c.steps||[])[i];
    if(!stp) return finish(c);
    if(stp.scene) return play(stp.scene, () => { setP(c.id, i+1); run(c); });
    if(stp.fight){
      openModal(`<span class="ribbon">STORY BATTLE</span><h3 class="t">${esc(stp.fight.n)}</h3>
        <p class="note" style="margin:0;text-align:center">No entry fee for story battles.</p>
        <div class="btns"><button class="gbtn" data-act="st-fight" data-v="${c.id}">⚔️ Fight!</button><button class="gbtn plain" data-act="close">Later</button></div>`);
      return;
    }
    if(stp.quest){
      const id=qid(c,i);
      if(!state.quests.some(q=>q.id===id)){
        state.quests.push({id, story:c.id, title:stp.quest.title, proof:stp.quest.proof||"photo", cat:stp.quest.cat, size:stp.quest.size, repeat:"once", flavour:stp.quest.flavour});
        save(); render2(); toast("📜 Lilia pinned a story quest to the board!");
      }
      openModal(`<span class="ribbon">STORY QUEST</span><h3 class="t">${esc(stp.quest.title)}</h3>
        <p class="note" style="margin:0;text-align:center">${esc(stp.quest.flavour||"")}<br>It's pinned on the quest board with <b>S-rank</b> rewards. The story continues once you clear it!</p>
        <div class="btns"><button class="gbtn" data-act="st-toboard">📋 Go to the quest board</button><button class="gbtn plain" data-act="close">Later</button></div>`);
    }
  }
  /* a story quest was cleared (called from grant) */
  function questDone(chId){
    const c = STORY[idx(chId)]; if(!c) return;
    const i = P(c.id); if(c.steps && c.steps[i] && c.steps[i].quest){ setP(c.id, i+1); setTimeout(()=>run(c), 400); }
  }
  function status(c){
    const stp = (c.steps||[])[P(c.id)];
    if(!stp || !S().read[c.id] && P(c.id)===0) return "📖 New chapter!";
    if(stp.quest) return `📜 Story quest: ${stp.quest.title}`;
    if(stp.fight) return `⚔️ Story battle: ${stp.fight.n}`;
    return "📖 Continue the story";
  }
  /* re-reading a cleared chapter: scenes play again, fights can be replayed (no rewards), quests are summarised */
  function recapRun(c, i){
    const steps = c.recapSteps || c.steps || [], stp = steps[i];
    if(!stp) return render2();
    if(stp.scene) return play(stp.scene, () => recapRun(c, i+1));
    if(stp.quest) return play([{s:"narrator", t:stp.quest.recap||`You completed the story quest: ${stp.quest.title}.`}], () => recapRun(c, i+1));
    if(stp.fight){ recapping={c, i, b:stp.fight};
      openModal(`<span class="ribbon">STORY RECAP</span><h3 class="t">${esc(stp.fight.n)}</h3>
        <p class="note" style="margin:0;text-align:center">Relive the fight! It's a recap, so there are no rewards or drops.</p>
        <div class="btns"><button class="gbtn" data-act="st-recapgo">⚔️ Fight!</button>
        <button class="gbtn plain" data-act="st-recapskip">Skip ahead</button></div>`); }
  }
  function render2(){ if(typeof window.render==="function") window.render(); }
  const huntOf = (b, extra) => ({n:b.n, lv:0, fee:0, gold:0, bpm:b.bpm||110, tier:b.tier||1, waves:b.waves||[], boss:{base:b.base, n:b.n, hp:b.hp||2.6, atk:b.atk||1.3}, ...extra});
  function recapGo(){ const r=recapping; if(!r) return; closeModal(); startHunt(huntOf(r.b, {id:"recap-"+r.c.id+"-"+r.i, recap:true})); }
  function recapDone(won){
    const r=recapping; if(!r) return;
    if(!won){ openModal(`<span class="ribbon">STORY RECAP</span><p style="margin:0;text-align:center">The ${esc(r.b.n)} got you this time!</p>
      <div class="btns"><button class="gbtn" data-act="st-recapgo">🔁 Try again</button><button class="gbtn plain" data-act="st-recapskip">Skip ahead</button></div>`); return; }
    recapEnd();
  }
  function recapEnd(){ const r=recapping; recapping=null; closeModal(); if(r) recapRun(r.c, r.i+1); }
  function fight(id){
    const c = STORY[idx(id)]; const stp = c && (c.steps||[])[P(c.id)]; if(!stp||!stp.fight) return; closeModal();
    startHunt(huntOf(stp.fight, {id:"story-"+c.id+"-"+P(c.id), story:c.id}));
  }
  function bossWon(id){
    const c = STORY[idx(id)]; if(!c) return;
    const i=P(c.id); if(c.steps && c.steps[i] && c.steps[i].fight){ setP(c.id, i+1); setTimeout(()=>run(c), 500); }
  }
  async function finish(c){
    if(S().done[c.id]) return render2();
    S().done[c.id] = true; const r=c.reward||{};
    if(r.crystals) state.crystals=(state.crystals||0)+r.crystals;
    if(r.gold) state.gold+=r.gold;
    save(); render2();
    await splash(`<div class="sp-title" style="font-size:clamp(28px,9vw,44px)">CHAPTER<br>CLEAR!</div><div class="sp-sub">${esc(c.n)}: ${esc(c.sub)}</div>
      <div class="loot">${r.crystals?`<div>${PX.img(PX.icon("crystal"),"lootico")}<b>+${r.crystals}</b><span>CRYSTALS</span></div>`:""}${r.gold?`<div>${COIN}<b>+${r.gold}</b><span>GOLD</span></div>`:""}</div>
      <div class="tap">Tap to continue</div>`, 5000);
  }
  /* ---------- visual novel player ---------- */
  /* drawn art with an expression if it exists: art/story/<id>_<f>.png, then art/story/<id>.png */
  function drawn(id, f){
    for(const p of [f&&f!=="happy"?`story/${id}_${f}.png`:null, `story/${id}.png`]) if(p && Art.has(p)) return `<img src="${Art.url(p)}" alt="">`;
    return null;
  }
  const pxFace = (look, f) => PX.img(PX.chibi({...look, ...(EXPR_PX[f]||{})}), "");
  function who(s, n, f){
    if(s==="narrator") return {name:"", art:""};
    if(s==="lilia") return {name:n||"LILIA", art: drawn("lilia", f) || liliaFace(f)};
    const c = STORY_CAST[s];
    if(c) return {name:n||c.name, art: drawn(s, f) || pxFace(c.look, f), glow:c.glow};
    if(s==="you"){ if(!H().created) return {name:n||state.name||"You", art:""};
      const L = heroPxLook(H().look, heroStats().wtype), drawnHero = Art.hero("portrait", L);
      return {name:n||state.name||"You", art: drawnHero ? pic(drawnHero) : PX.img(PX.chibi({...L, ...(EXPR_PX[f]||{})}), "")}; }
    const r = ROSTER[s]; return {name:n||(r?r.n:s), art:r?(drawn(s,f)||pic(charPortrait(s))):""};
  }
  /* Lilia's built-in drawing gets simple expressions (brows, eyes, mouth) until expression art exists */
  function liliaFace(f){
    const box=$("liliaArt"); if(!box) return "";
    let h = box.innerHTML; if(box.classList.contains("drawn") || !f || f==="happy") return h;
    const brow = {sad:["M122 105 Q132 106 142 99","M158 99 Q168 106 178 105"], angry:["M122 99 Q132 102 143 108","M157 108 Q168 102 178 99"]}[f];
    const mouth = {sad:'<path d="M143 164 Q150 157 157 164" stroke="#b04a62" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
                   angry:'<path d="M143 163 Q150 158 157 163" stroke="#b04a62" stroke-width="2.6" fill="none" stroke-linecap="round"/>'}[f];
    h = h.replace(/<path d="M144 160 Q150 166 156 160"[^>]*\/?>(<\/path>)?/, mouth||"");
    if(brow) h = h.replace("</svg>", `<path d="${brow[0]}" stroke="#3a2c68" stroke-width="3" fill="none" stroke-linecap="round"/><path d="${brow[1]}" stroke="#3a2c68" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`);
    return h;
  }
  function setBg(key){
    const b=STORY_BGS[key], el=$("vnBg"), pl=$("vnPlace"); if(!b||!el) return;
    const art = Art.has(`story/bg_${key}.png`) ? `url(${Art.url(`story/bg_${key}.png`)}) center/cover no-repeat, ` : "";
    el.style.background = art + b.g;
    el.innerHTML = art ? "" : `<span class="vn-deco">${b.deco}</span>`;
    pl.textContent = "📍 " + b.n; pl.hidden=false; pl.classList.remove("show"); void pl.offsetWidth; pl.classList.add("show");
    $("vn").classList.toggle("lightbg", !b.dark);
  }
  function play(lines, done){
    const box = document.createElement("div"); box.className="vn"; box.id="vn";
    box.innerHTML = `<div class="vn-bg" id="vnBg"></div><span class="vn-place" id="vnPlace" hidden></span><button class="vn-skip" id="vnSkip">Skip ⏭</button><div class="vn-art" id="vnArt"></div>
      <div class="vn-box" id="vnBox"><span class="nametag" id="vnName"></span><p id="vnText"></p><div class="vn-ch" id="vnCh"></div><span class="tap" id="vnTap">▼</span></div>`;
    $("app").appendChild(box);
    const q = [...lines]; let waiting=false;
    let hasAvatar = lines.some(l=>l.avatar) ? false : !!H().created;   // you only appear once your avatar exists
    const firstMood = (lines.slice(0,3).find(l=>l.bgm!==undefined)||{}).bgm;
    BGM.story(firstMood!==undefined ? firstMood : "calm");   // story scenes have their own music, set by {bgm:"..."} lines
    const end = () => { box.remove(); BGM.story(null); done && done(); };
    function step(){
      if(waiting) return;
      const L = q.shift(); if(!L) return end();
      if(L.avatar){ hasAvatar=true; return step(); }
      if(L.bgm!==undefined){ BGM.story(L.bgm); return step(); }
      if(L.bg){ setBg(L.bg); return step(); }
      if(L.choice){
        waiting=true; $("vnTap").hidden=true;
        $("vnCh").innerHTML = L.choice.map((o,i)=>`<button class="gbtn ${i?"plain":""}" data-i="${i}">${esc(o.t)}</button>`).join("");
        $("vnCh").querySelectorAll("button").forEach(b=>b.onclick=ev=>{ ev.stopPropagation(); const o=L.choice[+b.dataset.i];
          $("vnCh").innerHTML=""; $("vnTap").hidden=false; waiting=false;
          q.unshift(...(hasAvatar ? [{s:"you", t:o.t}] : []), ...(o.r||[])); step(); });
        return;
      }
      const w = who(L.s, L.n, L.f);
      $("vnName").textContent = w.name; $("vnName").hidden = !w.name;
      $("vnText").textContent = L.t; $("vnText").className = L.s==="narrator" ? "narr" : "";
      if(w.art!==undefined && L.s!=="narrator"){ $("vnArt").innerHTML = w.art; $("vnArt").className = "vn-art "+(L.s==="you"?"right":"left")+(w.glow?" glow":"")+(/class="px/.test(w.art)?" pxs":""); }
      if(L.s==="narrator") $("vnArt").innerHTML="";
      const old=$("vnArt").querySelector(".vn-emote"); if(old) old.remove();
      if(L.e && EMOTES[L.e] && L.s!=="narrator") $("vnArt").insertAdjacentHTML("beforeend", `<span class="vn-emote show e-${L.e}">${EMOTES[L.e]}</span>`);
    }
    box.onclick = step; $("vnSkip").onclick = ev => { ev.stopPropagation(); end(); };
    step();
  }
  function act(a, v){
    if(a==="st-open"){ open(v); return true; }
    if(a==="st-fight"){ fight(v); return true; }
    if(a==="st-recapgo"){ recapGo(); return true; }
    if(a==="st-recapskip"){ recapEnd(); return true; }
    if(a==="st-toboard"){ closeModal(); boardTab="quests"; go("board"); return true; }
    return false;
  }
  /* play one part of the prologue (used by the tutorial) */
  function scene(part, done){ const lines = PROLOGUE[part]; if(!lines){ done&&done(); return; } play(lines, done); }
  function markPrologue(){ S().done.prologue=true; S().read.prologue=true; save(); }
  const _run = run; run = c => { S().read[c.id]=true; _run(c); };
  return {render, act, bossWon, play, scene, markPrologue, recapDone, next, ready, questDone};
})();
