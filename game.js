/* ================= Adventure mode: hero, hunts, gathering, shop, crafting ================= */
/* Loaded before the main script. Uses the main script's globals (state, save, render, say, toast, splash, $, esc...) only inside functions. */

const MATS = {
  herb:{n:"Herb",i:"🌿",v:3}, moonflower:{n:"Moonflower",i:"🌸",v:10}, wood:{n:"Wood",i:"🪵",v:3},
  mushroom:{n:"Mushroom Cap",i:"🍄",v:4}, gel:{n:"Slime Gel",i:"🟢",v:4}, wing:{n:"Bat Wing",i:"🦇",v:6},
  ore:{n:"Iron Ore",i:"🪨",v:6}, fang:{n:"Goblin Fang",i:"🦷",v:8}, crystal:{n:"Crystal Shard",i:"🔷",v:12},
  core:{n:"Golem Core",i:"🔮",v:18}, scale:{n:"Wyvern Scale",i:"🐉",v:22},
  leaf:{n:"Forest Leaf",i:"🍃",v:2}, berry:{n:"Wild Berry",i:"🫐",v:3}, starberry:{n:"Starberry",i:"🍓",v:12},
  fish:{n:"Lake Fish",i:"🐟",v:5}, trout:{n:"Rainbow Trout",i:"🐠",v:11}
};
const TYPE_ICON = {sword:"⚔️",staff:"🪄",dagger:"🗡️",mace:"🔨",bow:"🏹",armour:"🛡️",potion:"🧪",accessory:"💍",meal:"🍽️"};
const CLASSES = {sword:"Warrior",staff:"Mage",dagger:"Rogue",mace:"Cleric",bow:"Ranger"};
const SKILLS = {
  none:{n:"Haymaker",d:"One huge punch",notes:1,mult:3,fx:"punch",c:["#c8302c","#ffb3b3"]},
  sword:{n:"Cross Slash",d:"Giant X-slash that hits every enemy",notes:1,mult:3,aoe:true,fx:"slash",c:["#ff6a3d","#ffd23f"]},
  staff:{n:"Fireball",d:"Exploding fireball that hits every enemy",notes:1,mult:3.2,aoe:true,fx:"fire",c:["#ff3d3d","#ffb13d"]},
  dagger:{n:"Shadow Flurry",d:"Five lightning-fast stabs",notes:5,mult:1.3,fast:true,fx:"shadow",c:["#3a1a6a","#b48cff"]},
  mace:{n:"Holy Light",d:"Smites every enemy and heals 35% HP",notes:1,mult:2,heal:.35,aoe:true,fx:"holy",c:["#ffe9a0","#fff8e0"]},
  bow:{n:"Piercing Arrow",d:"Huge shot that ignores defence",notes:1,mult:4.5,pierce:true,fx:"arrow",c:["#2f9e6f","#9cf5c0"]}
};
const ITEMS = {
  // starter weapons
  w_rsword:{n:"Rusty Sword",slot:"weapon",t:"sword",atk:6},
  w_ostaff:{n:"Oak Staff",slot:"weapon",t:"staff",atk:6},
  w_bdagger:{n:"Bronze Dagger",slot:"weapon",t:"dagger",atk:5},
  w_wmace:{n:"Wooden Mace",slot:"weapon",t:"mace",atk:6},
  w_sbow:{n:"Short Bow",slot:"weapon",t:"bow",atk:6},
  // beginner shop weapons (level 1)
  w_tsword:{n:"Training Sword",slot:"weapon",t:"sword",atk:10,price:30,lv:1},
  w_tstaff:{n:"Willow Staff",slot:"weapon",t:"staff",atk:10,price:30,lv:1},
  w_tdagger:{n:"Training Knife",slot:"weapon",t:"dagger",atk:9,price:30,lv:1},
  w_tmace:{n:"Oak Cudgel",slot:"weapon",t:"mace",atk:10,price:30,lv:1},
  w_tbow:{n:"Hunting Bow",slot:"weapon",t:"bow",atk:10,price:30,lv:1},
  // shop weapons
  w_isword:{n:"Iron Sword",slot:"weapon",t:"sword",atk:14,price:60,lv:3},
  w_astaff:{n:"Apprentice Staff",slot:"weapon",t:"staff",atk:14,price:60,lv:3,el:"ice"},
  w_sdagger:{n:"Steel Dagger",slot:"weapon",t:"dagger",atk:12,price:60,lv:3},
  w_imace:{n:"Iron Mace",slot:"weapon",t:"mace",atk:14,price:60,lv:3},
  w_hbow:{n:"Hunter's Bow",slot:"weapon",t:"bow",atk:14,price:60,lv:3},
  w_ksword:{n:"Knight's Blade",slot:"weapon",t:"sword",atk:26,price:160,lv:8},
  w_sstaff:{n:"Sage's Staff",slot:"weapon",t:"staff",atk:26,price:160,lv:8,el:"thunder"},
  w_adagger:{n:"Assassin's Edge",slot:"weapon",t:"dagger",atk:23,price:160,lv:8},
  w_hmace:{n:"Holy Hammer",slot:"weapon",t:"mace",atk:26,price:160,lv:8},
  w_lbow:{n:"Longbow",slot:"weapon",t:"bow",atk:26,price:160,lv:8},
  // crafted weapons
  w_fdagger:{n:"Fang Dagger",slot:"weapon",t:"dagger",atk:22,recipe:{fang:3,ore:2}},
  w_gmace:{n:"Golem Maul",slot:"weapon",t:"mace",atk:34,recipe:{core:2,ore:3}},
  w_cstaff:{n:"Crystal Staff",slot:"weapon",t:"staff",atk:32,recipe:{crystal:2,wood:2,core:1},el:"ice"},
  w_wbow:{n:"Wyvern Bow",slot:"weapon",t:"bow",atk:38,recipe:{scale:2,wood:3,wing:2}},
  w_sblade:{n:"Scale Blade",slot:"weapon",t:"sword",atk:40,recipe:{scale:3,ore:3}},
  // gacha-only weapons (5-star)
  w_dragon:{n:"Dragonfang Sword",slot:"weapon",t:"sword",atk:46,gacha:5},
  w_phoenix:{n:"Phoenix Staff",slot:"weapon",t:"staff",atk:46,gacha:5,el:"fire"},
  w_kris:{n:"Nightshade Kris",slot:"weapon",t:"dagger",atk:42,gacha:5},
  w_seraph:{n:"Seraph Mace",slot:"weapon",t:"mace",atk:46,gacha:5},
  w_gale:{n:"Gale Longbow",slot:"weapon",t:"bow",atk:46,gacha:5},
  // accessories
  acc_ring:{n:"Power Ring",slot:"acc",t:"accessory",atk:4,gacha:3,col:"#ff6f91"},
  acc_charm:{n:"Vital Charm",slot:"acc",t:"accessory",hp:15,gacha:3,col:"#6fbf73"},
  acc_band:{n:"Berserker Band",slot:"acc",t:"accessory",atk:9,gacha:4,col:"#c8302c"},
  acc_amulet:{n:"Guardian Amulet",slot:"acc",t:"accessory",hp:30,def:3,gacha:4,col:"#5fb4e6"},
  acc_star:{n:"Starlight Pendant",slot:"acc",t:"accessory",atk:12,hp:40,gacha:5,col:"#ffe066"},
  w_msword:{n:"Mithril Sword",slot:"weapon",t:"sword",atk:36,price:400,lv:15},
  w_mstaff:{n:"Mithril Staff",slot:"weapon",t:"staff",atk:36,price:400,lv:15,el:"fire"},
  w_mdagger:{n:"Mithril Dirk",slot:"weapon",t:"dagger",atk:33,price:400,lv:15},
  w_mmace:{n:"Mithril Mace",slot:"weapon",t:"mace",atk:36,price:400,lv:15},
  w_mbow:{n:"Mithril Bow",slot:"weapon",t:"bow",atk:36,price:400,lv:15},
  // gacha-only weapons (3-star and 4-star)
  w_g3sword:{n:"Copper Saber",slot:"weapon",t:"sword",atk:16,gacha:3},
  w_g3staff:{n:"Ember Rod",slot:"weapon",t:"staff",atk:16,gacha:3,el:"fire"},
  w_g3dagger:{n:"Viper Fang",slot:"weapon",t:"dagger",atk:14,gacha:3},
  w_g3mace:{n:"Spiked Club",slot:"weapon",t:"mace",atk:16,gacha:3},
  w_g3bow:{n:"Recurve Bow",slot:"weapon",t:"bow",atk:16,gacha:3},
  w_g4sword:{n:"Moonlit Blade",slot:"weapon",t:"sword",atk:30,gacha:4},
  w_g4staff:{n:"Frostbloom Staff",slot:"weapon",t:"staff",atk:30,gacha:4,el:"ice"},
  w_g4dagger:{n:"Shadow Stiletto",slot:"weapon",t:"dagger",atk:27,gacha:4},
  w_g4mace:{n:"Thunder Maul",slot:"weapon",t:"mace",atk:30,gacha:4},
  w_g4bow:{n:"Windpiercer",slot:"weapon",t:"bow",atk:30,gacha:4},
  // armour
  a_tunic:{n:"Cloth Tunic",slot:"armour",t:"armour",def:0,hp:0},
  a_leather:{n:"Leather Armour",slot:"armour",t:"armour",def:5,hp:10,price:40,lv:1},
  a_chain:{n:"Chain Mail",slot:"armour",t:"armour",def:10,hp:25,price:120,lv:6},
  a_mithril:{n:"Mithril Mail",slot:"armour",t:"armour",def:16,hp:45,price:300,lv:15},
  a_g3vest:{n:"Padded Vest",slot:"armour",t:"armour",def:6,hp:15,gacha:3},
  a_g4brig:{n:"Silver Brigandine",slot:"armour",t:"armour",def:14,hp:35,gacha:4},
  a_g5aegis:{n:"Dragonscale Aegis",slot:"armour",t:"armour",def:26,hp:70,gacha:5},
  a_cloak:{n:"Bat-wing Cloak",slot:"armour",t:"armour",def:6,hp:15,agi:3,recipe:{wing:3,herb:2}},
  a_golem:{n:"Golem Plate",slot:"armour",t:"armour",def:18,hp:40,recipe:{core:2,ore:4}},
  a_scale:{n:"Scale Mail",slot:"armour",t:"armour",def:24,hp:60,recipe:{scale:4,ore:2}},
  // potions
  p_potion:{n:"Potion",slot:"use",t:"potion",heal:.4,price:15,recipe:{herb:2,gel:1}},
  p_hipotion:{n:"Hi-Potion",slot:"use",t:"potion",heal:.8,price:40,lv:4,recipe:{moonflower:2,crystal:1}},
  // hunt buffs: pick one before a hunt, used up when it starts
  b_tonic:{n:"Swift Tonic",slot:"buff",t:"potion",charge:1.3,recipe:{berry:3,leaf:2},d:"Skills charge 30% faster for one hunt"},
  b_elixir:{n:"Starberry Elixir",slot:"buff",t:"potion",charge:1.6,recipe:{starberry:1,berry:2,moonflower:1},d:"Skills charge 60% faster for one hunt"},
  b_fish:{n:"Grilled Fish",slot:"buff",t:"meal",hpx:1.25,recipe:{fish:2,wood:1},d:"Party HP +25% for one hunt"},
  b_feast:{n:"Trout Feast",slot:"buff",t:"meal",hpx:1.4,charge:1.15,recipe:{trout:1,fish:1,herb:2},d:"Party HP +40% and skills charge 15% faster for one hunt"},
  // lake gear
  a_lake:{n:"Lakescale Mail",slot:"armour",t:"armour",def:14,hp:45,recipe:{fish:4,trout:2,ore:2}},
  acc_boot:{n:"Old Boot",slot:"acc",t:"accessory",hp:8,def:1,col:"#8a6a4a",d:"Soggy, but oddly comforting."},
  acc_boots:{n:"Pair of Old Boots",slot:"acc",t:"accessory",hp:25,def:4,atk:3,col:"#a07850",recipe:{acc_boot:2},d:"A matching pair! Someone's going to be so happy… or not."}
};
/* ---------- forge ---------- */
const FORGE_MAX = 5;
/* Each forged copy is its own item key: "w_g4sword@2" = Moonlit Blade +2. Only that one copy is upgraded. */
function forgedItem(key){
  if(ITEMS[key] || !key || key.indexOf("@")<0) return;
  const [base, n] = key.split("@"), b = ITEMS[base]; if(!b) return;
  const lv = Math.min(FORGE_MAX, +n||0), it = {...b, base, fl:lv, atk:Math.round(b.atk*(1+.1*lv))};
  delete it.price; delete it.recipe; delete it.lv; delete it.gacha; it.rar = b.gacha||0;
  ITEMS[key] = it;
}
function applyForge(){
  const h = H();
  if(state.forge){ // old saves: forge levels applied to every copy -> turn one copy into a forged copy
    for(const [id,L] of Object.entries(state.forge)){ if(!L || !have(id)) continue;
      const key = id+"@"+Math.min(FORGE_MAX,L); addBag(id,-1); addBag(key,1);
      if(h.weapon===id) h.weapon=key; else { const o=Object.values(state.party.owned||{}).find(o=>o.weapon===id); if(o) o.weapon=key; } }
    delete state.forge;
  }
  Object.keys(h.bag).forEach(forgedItem); forgedItem(h.weapon);
  Object.values((state.party&&state.party.owned)||{}).forEach(o=>forgedItem(o.weapon));
}
const nm = it => it.n + (it.fl?` +${it.fl}`:"");
const STARTERS_W = ["w_rsword","w_ostaff","w_bdagger","w_wmace","w_sbow"];
const TALENTS = {
  keen:{n:"Keen Eye",d:"Wider timing windows"},
  iron:{n:"Iron Will",d:"+20% max HP"},
  rhythm:{n:"Battle Rhythm",d:"Skill gauge fills 50% faster"},
  lucky:{n:"Lucky Star",d:"Better drops and bonus finds"},
  alch:{n:"Alchemist",d:"Potions heal 50% more"}
};
const MONSTERS = [
  {id:"dummy",n:"Training Dummy",lv:1,hp:120,atk:6,def:0,hits:2,gap:420,app:1050,fee:0,gold:0,drops:[],training:true,bg:"linear-gradient(180deg,#f2c48a,#e8a35e 55%,#9a6a3a)"},
  {id:"slime",n:"Grumpy Slime",lv:1,hp:60,atk:8,def:0,hits:1,gap:380,app:1050,fee:5,gold:6,drops:[["gel",1],["herb",.4]],bg:"linear-gradient(180deg,#8fd3ff,#d6f5c4 55%,#5fae4e)"},
  {id:"shroom",n:"Mad Mushroom",lv:2,hp:90,atk:10,def:2,hits:2,gap:420,app:1000,fee:8,gold:10,drops:[["mushroom",1],["herb",.5]],bg:"linear-gradient(180deg,#2f5a3a,#4f8a4a 55%,#2b4a22)"},
  {id:"bat",n:"Cave Bat",lv:4,hp:110,atk:13,def:2,hits:3,gap:300,app:820,fee:12,gold:14,drops:[["wing",1],["ore",.3]],bg:"linear-gradient(180deg,#1a1630,#3a2f55 60%,#191326)"},
  {id:"goblin",n:"Goblin Raider",lv:6,hp:170,atk:17,def:5,hits:2,gap:360,app:880,fee:18,gold:22,drops:[["fang",1],["ore",.5],["wood",.4]],bg:"linear-gradient(180deg,#355c3a,#6b8f4a 55%,#3d4a22)"},
  {id:"golem",n:"Stone Golem",lv:9,hp:300,atk:24,def:12,hits:1,gap:400,app:1150,fee:28,gold:34,drops:[["core",.8],["crystal",.5],["ore",.7]],bg:"linear-gradient(180deg,#2a2d3a,#4b5163 60%,#23252e)"},
  {id:"wyvern",n:"Storm Wyvern",lv:13,hp:420,atk:30,def:10,hits:3,gap:320,app:780,fee:40,gold:50,drops:[["scale",1],["crystal",.4]],bg:"linear-gradient(180deg,#3a5f9a,#9cc3e8 55%,#6d7f8f)"}
];
const GATHER = [
  {id:"meadow",n:"Sunny Meadow",game:"tap",lv:0,rank:"F",fee:3,common:["herb","herb","gel"],rare:"moonflower",
   how:"Tap the sparkles before they fade. Purple ones are rare!",
   bg:"radial-gradient(circle at 20% 80%,#7ccf5a 0 12%,transparent 13%),radial-gradient(circle at 80% 70%,#6cc25a 0 14%,transparent 15%),linear-gradient(#bfe8ff,#9fd77a 55%,#6fae4a)"},
  {id:"forest",n:"Whisperwood",game:"basket",lv:0,rank:"E",fee:5,common:["leaf","berry","mushroom"],rare:"starberry",
   how:"Drag your basket to catch falling leaves and berries. Dodge the caterpillars!",
   bg:"radial-gradient(circle at 15% 12%,#2f6a3a 0 22%,transparent 23%),radial-gradient(circle at 85% 8%,#2a5e34 0 24%,transparent 25%),radial-gradient(circle at 50% 0%,#3b7a44 0 18%,transparent 19%),linear-gradient(#1f4a2a,#3f7a3e 60%,#6b8a3a)"},
  {id:"lake",n:"Mirror Lake",game:"fish",lv:0,rank:"D",fee:8,common:["fish"],rare:"trout",
   how:"Cast, strike when it bites, then hold to keep the fish in your net. Watch out for… boots?",
   bg:"repeating-linear-gradient(180deg,transparent 0 14px,rgba(255,255,255,.06) 14px 16px),linear-gradient(#ffd9a8 0%,#bfe0f0 26%,#5fa8d8 30%,#3a86c0 55%,#1f5a8e 100%)"},
  {id:"mine",n:"Crystal Mine",game:"dig",lv:0,rank:"C",fee:10,common:["ore"],rare:"crystal",
   how:"Dig out buried treasure! Pickaxe for precision, hammer for speed, but don't let the wall cave in. No timer.",
   bg:"radial-gradient(ellipse at 50% 0%,#5a4a7a 0 20%,transparent 50%),linear-gradient(#1a1626,#2b2238 50%,#3a2e2a)"}
];
/* Hero customisation. Each option's key is also its art file name (see ART_GUIDE.md), so pixel and drawn art share one list. */
const LOOK = {
  styles:["Short","Long","Ponytail","Twin tails","Spiky","Bob","Side braid","Buns"],
  hairKeys:["short","long","ponytail","twintails","spiky","bob","braid","buns"],
  eyes:[["round","Round"],["sharp","Sharp"],["sleepy","Sleepy"],["cat","Cat"],["sparkly","Sparkly"]],
  brows:[["soft","Soft"],["angry","Angry"],["worried","Worried"],["thick","Thick"]],
  mouths:[["smile","Smile"],["grin","Grin"],["neutral","Neutral"],["fang","Fang"]],
  extras:[["none","None"],["blush","Blush"],["freckles","Freckles"],["mole","Mole"],["scar","Scar"]],
  tops:[["tunic","Tunic"],["blouse","Blouse"],["hoodie","Hoodie"],["robe","Robe"],["vest","Armour vest"]],
  bottoms:[["skirt","Skirt & boots"],["longskirt","Long skirt & slippers"],["pants","Trousers & boots"],["shorts","Shorts & sandals"]],
  heads:[["none","None"],["ribbon","Ribbon"],["witch","Witch hat"],["hood","Hood"],["cat","Cat ears"]],
  hair:["#4a3b7c","#2b2b33","#c9893a","#e8d27a","#d94a5a","#5fb4e6","#eeeeee","#6fbf73"],
  eye:["#6f5be0","#3a7bd5","#2f9e6f","#c27e0a","#c8302c","#8a5a2c"],
  skin:["#fde2d2","#f2c6a0","#c98e66","#8a5a3c"],
  outfit:["#2f63e6","#c8302c","#2f9e6f","#7a3cc4","#d4951a","#333a4d","#f4f0e6","#e86fa0"]
};
const LOOK_DEFAULT = {style:0,hair:0,eye:0,skin:0,eyes:0,brows:0,mouth:0,extra:1,top:0,topCol:0,bottom:0,botCol:0,head:0};
/* upgrade looks saved before the big customisation update */
function fixLook(L){
  const o={...LOOK_DEFAULT, ...L};
  if(typeof o.bottom==="string") o.bottom = o.bottom==="pants" ? 2 : 0;
  if(L.outfit!==undefined && L.topCol===undefined){ o.topCol=L.outfit|0; o.botCol = L.bottom==="pants" ? 6 : (L.outfit|0); }
  delete o.outfit; return o;
}

/* ---------- hero state ---------- */
function heroDefault(){
  return {created:false, look:{...LOOK_DEFAULT}, talent:"keen",
    stats:{str:5,mag:5,vit:5,agi:5}, weapon:null, armour:"a_tunic", bag:{a_tunic:1,p_potion:2}, cleared:{}, req:{day:"",list:[],done:[]}};
}
function ensureHero(){
  const d = heroDefault();
  if(!state.hero || typeof state.hero!=="object"){ state.hero = d; return; }
  for(const k of Object.keys(d)) if(state.hero[k]===undefined) state.hero[k] = d[k];
  state.hero.look = fixLook(state.hero.look||{});
  state.hero.stats = {...d.stats, ...state.hero.stats};
}
const H = () => state.hero;
const have = id => (H().bag[id]||0);
const haveIng = m => MATS[m] ? have(m) : freeCount(m);   // gear used as an ingredient must be a spare copy (not equipped)
function addBag(id,n){ const b=H().bag; b[id]=(b[id]||0)+n; if(b[id]<=0) delete b[id]; }
function heroLevel(){ return levelInfo(state.xp).lvl; }
function pointsLeft(){ const s=H().stats; return (heroLevel()-1)*3 - (s.str+s.mag+s.vit+s.agi-20); }
function heroStats(){
  const h=H(), s=h.stats, w=ITEMS[h.weapon], a=ITEMS[h.armour]||ITEMS.a_tunic, ac=ITEMS[h.acc]||{};
  const wtype = w ? w.t : "none";
  const base = wtype==="staff" ? s.mag : wtype==="mace" ? Math.round((s.str+s.mag)/2) : s.str;
  const atk = (w?w.atk:2) + base*2 + (ac.atk||0);
  const agi = s.agi + (a.agi||0);
  const keen = h.talent==="keen" ? 1.25 : 1;
  return {
    wtype, cls: CLASSES[wtype] || "Novice", skill: SKILLS[wtype], el: (w&&w.el)||null,
    atk, def: a.def + s.vit + (ac.def||0), agi,
    maxHp: Math.round((40 + s.vit*8 + (a.hp||0) + (ac.hp||0)) * (h.talent==="iron"?1.2:1)),
    win: {perfect: Math.min(130, 60 + agi*2)*keen, good: Math.min(260, 130 + agi*4)*keen}
  };
}

/* ---------- art ---------- */
const EL_COL = {fire:"#ff7a3d", ice:"#7fd8ff", thunder:"#ffe066"};
const EL_ICON = {fire:"🔥", ice:"❄️", thunder:"⚡"};
function heroPxLook(look, wtype){
  const w = ITEMS[H().weapon];
  const L=fixLook(look), k=(list,i)=>(list[i]||list[0])[0];
  return {style:L.style|0, hair:LOOK.hair[L.hair]||LOOK.hair[0], eye:LOOK.eye[L.eye]||LOOK.eye[0], skin:LOOK.skin[L.skin]||LOOK.skin[0],
          eyes:k(LOOK.eyes,L.eyes), brows:k(LOOK.brows,L.brows), mouth:k(LOOK.mouths,L.mouth), extra:k(LOOK.extras,L.extra),
          top:k(LOOK.tops,L.top), topCol:LOOK.outfit[L.topCol]||LOOK.outfit[0], bottom:k(LOOK.bottoms,L.bottom), botCol:LOOK.outfit[L.botCol]||LOOK.outfit[0],
          head:k(LOOK.heads,L.head), outfit2:"#f4f0e6", weapon:wtype||"none", orb:(w&&w.el)?EL_COL[w.el]:"#7fd8ff"};
}
function avatar(look, wtype){ return pic(heroPortrait(look, wtype), "", "Your hero"); }
function monsterSVG(id, boss){ return pic(monsterArt(id, boss), "", id); }

/* ---------- adventure screens ---------- */
let advSub = "menu", shopSub = "shop";
let draft = null;   // hero creator working copy

function subtabs(group, cur, list){
  return `<div class="subtabs" role="tablist">${list.map(([k,l])=>`<button role="tab" class="${cur===k?'on':''}" aria-selected="${cur===k}" data-act="g-sub" data-k="${group}" data-v="${k}">${l}</button>`).join("")}</div>`;
}
function needHero(){
  return `<section class="frame"><span class="ribbon">NO HERO YET</span><p class="note" style="text-align:center;margin:0 0 10px">Register your hero first, then come back here.</p>
    <button class="gbtn" data-tab="party">Create my hero</button></section>`;
}
function renderHeroTab(){ ensureHero(); return (!H().created || draft) ? renderCreator() : renderHero(); }
/* Adventure landing page: Story and Event banners, then Hunt and Gather side by side */
function renderAdvMenu(){
  const e = Ev.cur(), es = Ev.S(), nx = Story.next();
  const slime = PX.img(PX.monster("slime"), "advmon"), herb = PX.img(PX.icon("herb","#6fbf73"), "advmon");
  return `<div class="advmenu">
    <button class="advcard big story" data-act="g-sub" data-k="adv" data-v="story">
      <span class="ac-ico">📖</span><span class="ac-txt"><small>MAIN STORY</small><b>${nx ? esc(nx.n) : "All caught up!"}</b><em>${nx ? esc(nx.sub) : "New chapters coming soon"}</em></span>
      ${nx && Story.ready(nx) ? `<span class="ac-badge">NEW</span>` : ""}</button>
    <button class="advcard big event" data-act="g-sub" data-k="adv" data-v="event" style="--ev:${e.col}">
      <span class="ac-ico">${e.icon}</span><span class="ac-txt"><small>MONTHLY EVENT</small><b>${esc(e.n)}</b><em>${Ev.daysLeft()} days left · ${es.dice} ${esc(e.die)}${es.dice===1?"":"s"}</em></span>
      ${es.dice ? `<span class="ac-badge">${es.dice}🎲</span>` : ""}</button>
    <div class="advrow">
      <button class="advcard small hunt" data-act="g-sub" data-k="adv" data-v="hunt">${slime}<b>Hunt</b><em>Fight monsters</em></button>
      <button class="advcard small gather" data-act="g-sub" data-k="adv" data-v="gather">${herb}<b>Gather</b><em>Collect materials</em></button>
    </div></div>`;
}
function renderAdventureTab(){
  ensureHero(); if(!H().created) return needHero();
  if(advSub==="menu") return renderAdvMenu();
  const back = `<button class="gbtn plain sm advback" data-act="g-sub" data-k="adv" data-v="menu">← Adventure</button>`;
  return back + (advSub==="gather" ? renderGather() : advSub==="story" ? Story.render() : advSub==="event" ? Ev.render() : renderHunt());
}
function renderShopTab(){
  ensureHero(); if(!H().created) return needHero();
  return subtabs("shop", shopSub, [["shop","🛒 Shop"],["craft","🔨 Craft"],["forge","⚒️ Forge"]]) + (shopSub==="craft" ? renderCraft() : shopSub==="forge" ? renderForge() : renderShop());
}

/* ---------- Picrew-style creator: hero on top, category tabs, side-scrolling picture options, colour row ---------- */
const CR_ZOOM = {face:[6,5,20], head:[1,-1,30], body:[6,16,20], legs:[6,22,20], full:[0,0,34]};   // [x, y, cells shown] on the 32x34 sprite
function crThumb(look, zoom, wtype){
  const [x,y,n] = CR_ZOOM[zoom], s = 66/n, url = PX.chibi(heroPxLook(look, wtype));
  return `<span class="pc-img" style="background-image:url(${url});background-size:${32*s}px ${34*s}px;background-position:${-x*s}px ${-y*s}px"></span>`;
}
function renderCreator(){
  const h = H();
  const firstTime = !h.created;
  if(!draft) draft = {look:fixLook(h.look), talent:h.talent, starter:null, name: firstTime ? (state.name==="Adventurer"?"":state.name) : null};
  const L = draft.look;
  const wtype = firstTime ? "none" : heroStats().wtype;
  const cats = [
    ...(firstTime?[{k:"name", i:"📝", n:"Name"}]:[]),
    {k:"hair",  i:"💇", n:"Hair",     opt:"style",  list:LOOK.styles, zoom:"head", col:"hair",  pal:LOOK.hair},
    {k:"eyes",  i:"👁️", n:"Eyes",     opt:"eyes",   list:LOOK.eyes,   zoom:"face", col:"eye",   pal:LOOK.eye},
    {k:"brows", i:"〰️", n:"Brows",    opt:"brows",  list:LOOK.brows,  zoom:"face", note:"Brows match your hair colour."},
    {k:"mouth", i:"👄", n:"Mouth",    opt:"mouth",  list:LOOK.mouths, zoom:"face"},
    {k:"extra", i:"🌸", n:"Extras",   opt:"extra",  list:LOOK.extras, zoom:"face"},
    {k:"skin",  i:"🎨", n:"Skin",     col:"skin",   pal:LOOK.skin},
    {k:"top",   i:"👕", n:"Top",      opt:"top",    list:LOOK.tops,   zoom:"body", col:"topCol", pal:LOOK.outfit},
    {k:"bottom",i:"👖", n:"Bottom",   opt:"bottom", list:LOOK.bottoms,zoom:"legs", col:"botCol", pal:LOOK.outfit},
    {k:"head",  i:"🎀", n:"Headwear", opt:"head",   list:LOOK.heads,  zoom:"head"},
    {k:"talent",i:"✨", n:"Talent"}
  ];
  if(!draft.tab || !cats.some(c=>c.k===draft.tab)) draft.tab = cats[0].k;
  const cat = cats.find(c=>c.k===draft.tab);
  const done = {name: !!(draft.name||"").trim()};
  const label = o => Array.isArray(o) ? o[1] : o;
  let body = "";
  if(cat.k==="name"){
    body = `<div class="pc-name"><input type="text" class="nameinput" id="crName" maxlength="16" placeholder="Your name in the guild" value="${esc(draft.name||"")}" oninput="draft.name=this.value">
      <p class="note" style="margin:6px 0 0;text-align:center">You can change it later in ⚙️ Settings.</p></div>`;
  } else if(cat.k==="talent"){
    body = `<div class="pc-row">${Object.entries(TALENTS).map(([k,t])=>`<button class="pc-card ${draft.talent===k?'on':''}" data-act="g-talent" data-v="${k}"><b>${t.n}</b><small>${t.d}</small></button>`).join("")}</div>`;
  } else if(cat.k==="weapon"){
    const sel = draft.starter && ITEMS[draft.starter];
    body = `<div class="pc-row">${STARTERS_W.map(id=>{const w=ITEMS[id]; return `<button class="pc-opt ${draft.starter===id?'on':''}" data-act="g-starter" data-v="${id}">${crThumb(L,"full",w.t)}<small>${TYPE_ICON[w.t]} ${CLASSES[w.t]}</small></button>`;}).join("")}</div>
      <p class="note pc-desc">${sel ? `<b>${sel.n}</b> · ${CLASSES[sel.t]} · Skill: ${SKILLS[sel.t].n}. ${SKILLS[sel.t].d}` : "Your class follows your weapon. You can switch class later by equipping a different weapon."}</p>`;
  } else {
    if(cat.opt) body += `<div class="pc-row">${cat.list.map((o,i)=>`<button class="pc-opt ${L[cat.opt]===i?'on':''}" data-act="g-look" data-k="${cat.opt}" data-v="${i}">${crThumb({...L,[cat.opt]:i}, cat.zoom, wtype)}<small>${label(o)}</small></button>`).join("")}</div>`;
    if(cat.col) body += `<div class="pc-row pc-cols">${cat.pal.map((c,i)=>`<button class="sw ${L[cat.col]===i?'on':''}" style="background:${c}" aria-label="colour ${i+1}" data-act="g-look" data-k="${cat.col}" data-v="${i}"></button>`).join("")}</div>`;
    if(cat.note) body += `<p class="note pc-desc">${cat.note}</p>`;
  }
  return `<section class="frame pc"><span class="ribbon">${firstTime?"CREATE YOUR HERO":"EDIT HERO"}</span>
    <div class="pc-stage">${avatar(L, wtype)}${firstTime&&(draft.name||"").trim()?`<span class="pc-nm">${esc(draft.name.trim())}</span>`:""}</div>
    <div class="pc-row pc-cats" id="pcCats">${cats.map(c=>`<button class="pc-cat ${draft.tab===c.k?"on":""} ${c.k in done && !done[c.k]?"todo":""}" data-act="g-ctab" data-v="${c.k}"><span>${c.i}</span>${c.n}</button>`).join("")}</div>
    <div class="pc-panel" id="pcPanel">${body}</div>
    <div class="cr-btns">
      <button class="gbtn plain sm" data-act="g-random">🎲 Random look</button>
      ${firstTime?"":`<button class="gbtn plain sm" data-act="g-cancel">Cancel</button>`}
      <button class="gbtn" data-act="g-create">${firstTime?"Begin your adventure!":"Save changes"}</button>
    </div></section>`;
}
/* re-render the creator without losing the side-scroll positions */
function crRender(newTab){
  const cats=$("pcCats"), rows=[...document.querySelectorAll("#pcPanel .pc-row")].map(r=>r.scrollLeft), cl=cats?cats.scrollLeft:0;
  render();
  if($("pcCats")) $("pcCats").scrollLeft = cl;
  const rs=[...document.querySelectorAll("#pcPanel .pc-row")];
  if(newTab){ rs.forEach(r=>{ const on=r.querySelector(".on"); if(on) r.scrollLeft = on.offsetLeft - r.clientWidth/2 + on.offsetWidth/2; });
    const c=document.querySelector(".pc-cat.on"); if(c&&$("pcCats")){ const p=$("pcCats"); p.scrollLeft = c.offsetLeft - p.clientWidth/2 + c.offsetWidth/2; } }
  else rs.forEach((r,i)=>{ if(rows[i]!==undefined) r.scrollLeft=rows[i]; });
}

function renderHero(){
  const h=H(), hs=heroStats(), pts=pointsLeft(), w=ITEMS[h.weapon], a=ITEMS[h.armour];
  const statRow = (k,label,desc) => `<div class="statrow"><span><b>${label}</b> <small class="sub">${desc}</small></span><b class="sv">${h.stats[k]}</b>
    ${pts>0?`<button class="plus" data-act="g-stat" data-k="${k}" aria-label="Add a point to ${label}">+</button>`:"<span></span>"}</div>`;
  const cur = slot => slot==="weapon"?h.weapon:slot==="armour"?h.armour:h.acc;
  const owned = slot => Object.keys(h.bag).filter(id=>ITEMS[id]&&ITEMS[id].slot===slot&&h.bag[id]>0&&(cur(slot)===id||freeCount(id,"hero")>0));
  const gear = slot => owned(slot).map(id=>{const it=ITEMS[id]; const on=cur(slot)===id;
    return `<button class="chip ${on?'on':''}" data-act="g-equip" data-v="${id}">${PX.img(PX.icon(it.t, it.el?EL_COL[it.el]:it.col),"ico")} ${it.n} <small>${it.atk?`ATK ${it.atk}`:it.def?`DEF ${it.def}`:`HP +${it.hp}`}${it.el?" "+EL_ICON[it.el]:""}</small></button>`;}).join("");
  const bagItems = Object.entries(h.bag).filter(([id,n])=>n>0&&(MATS[id]||(ITEMS[id]&&ITEMS[id].slot==="use")));
  return `<section class="frame"><span class="ribbon">HERO</span>
      <div class="herotop"><div>${avatar(h.look, hs.wtype)}</div>
        <div><div style="font-weight:800;font-size:18px">${esc(state.name)}</div>
          <span class="clspill">${hs.cls}</span> <span class="sub">LV ${heroLevel()}</span>
          <div class="sub" style="margin-top:6px">Talent: <b style="color:var(--cream)">${TALENTS[h.talent].n}</b></div>
          <div class="sub">Skill: <b style="color:var(--cream)">${hs.skill.n}</b> · ${hs.skill.d}</div>
          <div class="derived"><span>HP <b>${hs.maxHp}</b></span><span>ATK <b>${hs.atk}</b></span><span>DEF <b>${hs.def}</b></span></div>
        </div></div>
      <button class="gbtn plain" style="margin-top:12px" data-act="g-edit">Edit looks &amp; talent</button>
    </section>
    <section class="frame"><span class="ribbon">STATS</span>
      <p class="note" style="margin:0 0 4px;text-align:center">${pts>0?`<b style="color:var(--gold)">${pts} point${pts>1?"s":""} to spend!</b>`:"Clear chore quests to level up and earn 3 points per level."}</p>
      ${statRow("str","STR","sword, dagger, bow damage")}${statRow("mag","MAG","staff damage, mace")}${statRow("vit","VIT","HP and defence")}${statRow("agi","AGI","wider timing windows")}
    </section>
    <section class="frame" id="secEquip"><span class="ribbon">EQUIPMENT</span>${gearSlots("hero")}</section>
    <section class="frame"><span class="ribbon">BAG</span>
      ${bagItems.length?`<div class="bag">${bagItems.map(([id,n])=>{const m=MATS[id]||ITEMS[id];return `<div><b>${m.i||TYPE_ICON.potion}</b>${esc(m.n)}<br>×${n}</div>`;}).join("")}</div>`:`<div class="none">Your bag is empty. Go gathering or hunting!</div>`}
    </section>`;
}

/* Daily contracts: exactly one gather + one hunt, picked at random from the areas you have open.
   Reward = 5x that area's entry fee in gold, plus CONTRACT_GEMS. */
const CONTRACT_GEMS = 15;
const plural = n => /fish$|ore$|trout$/i.test(n) ? n : /leaf$/i.test(n) ? n.replace(/f$/,"ves") : /[^aeiou]y$/i.test(n) ? n.replace(/y$/,"ies") : n+"s";
function ensureRequests(){
  const h=H(), day=dayKey();
  if(h.req && h.req.day===day && h.req.v===4) return;
  if(h.req && h.req.tut && state.tut && !state.tut.done) return;   // tutorial contracts stay until the tutorial ends
  let s=0; for(const c of day+"contracts") s=(s*31+c.charCodeAt(0))>>>0;
  const rnd=()=>{ s=(s*1103515245+12345)>>>0; return (s>>>8)/16777216; };
  const pick=a=>a[Math.floor(rnd()*a.length)];
  const list=[];
  const areas=GATHER.filter(l=>gatherOpen(l));
  if(areas.length){ const L=pick(areas), rare=rnd()<.2, m=rare?L.rare:pick([...new Set(L.common)]);
    const qty=rare?1:(L.game==="fish"?2+Math.floor(rnd()*2):3+Math.floor(rnd()*3));
    list.push({id:`${day}-g-${m}`,type:"gather",mat:m,qty,area:L.n,gold:L.fee*5}); }
  const hunts=HUNTS.filter(x=>!x.training && Rank.atLeast(x.rank));
  if(hunts.length){ const x=pick(hunts), mons=[...new Set([...x.waves.flat(), ...(x.boss?[x.boss.base]:[])])], m=pick(mons), qty=2+Math.floor(rnd()*4);
    list.push({id:`${day}-s-${m}`,type:"slay",mon:m,qty,area:x.n,gold:x.fee*5}); }
  h.req={day,v:4,list,done:[],kills:(h.req&&h.req.day===day&&h.req.kills)||{}};
}
function renderGather(){
  ensureRequests();
  const lvl=heroLevel(), h=H();
  return `<section class="frame"><span class="ribbon">GATHERING</span>
    <p class="note" style="margin:0 0 6px;text-align:center">Each area has its own minigame.${GATHER_TEST_UNLOCK?" (Testing: all areas unlocked.)":""}</p>
    ${GATHER.map(L=>{const locked=!gatherOpen(L), GI={tap:"✨",basket:"🧺",fish:"🎣",dig:"⛏️"}[L.game];
      return `<div class="row"><span class="gem" style="background:${L.bg};width:44px;height:44px;display:grid;place-items:center;font-size:22px">${GI}</span>
        <span><b>${L.n}</b><small>${locked?`🔒 Unlocks at ${L.rank}-Rank`:`Finds ${[...new Set(L.common)].map(k=>MATS[k].i).join("")} · rare ${MATS[L.rare].i}${L.game==="dig"?" · 💎":L.game==="fish"?" · 👢?":""}`}</small><small class="ghow">${L.how}</small></span>
        <button class="gbtn sm" data-act="g-gather" data-v="${L.id}" ${locked||state.gold<L.fee?"disabled":""}>${locked?"Locked":`Go · ${L.fee} G`}</button></div>`;}).join("")}
  </section>`;
}

function renderSupplies(){
  ensureHero();
  if(!H().created) return `<section class="frame"><span class="ribbon">HUNT &amp; GATHER</span><p class="note" style="text-align:center;margin:0 0 10px">Register your hero to take on hunting and gathering contracts.</p><button class="gbtn" data-tab="party">Create my hero</button></section>`;
  ensureRequests();
  const h=H(), lvl=heroLevel(), rank=guildRank(lvl);
  const card = r => {
    const done=h.req.done.includes(r.id);
    if(r.type==="slay"){
      const m=MONSTERS.find(x=>x.id===r.mon), n=Math.min(r.qty,(h.req.kills||{})[r.mon]||0);
      return `<div class="contract slay"><div class="thumb">${monsterSVG(r.mon)}</div>
        <div><span class="ctype">⚔️ SUBJUGATION</span><b>Defeat ${r.qty} ${esc(m.n)}${r.qty>1?"s":""}</b>
          <div class="cbar"><i style="width:${n/r.qty*100}%"></i></div><small>${r.area?`📍 ${esc(r.area)} · `:""}${n}/${r.qty} defeated · Reward ${r.gold} G · ${CONTRACT_GEMS} 💎</small></div>
        <button class="gbtn sm" data-act="g-deliver" data-v="${r.id}" ${done?"disabled":""}>${done?"Done ✔":n>=r.qty?"Claim":"Hunt"}</button></div>`;
    }
    const m=MATS[r.mat], n=have(r.mat);
    return `<div class="contract"><div class="thumb big">${m.i}</div>
      <div><span class="ctype">🌿 GATHERING</span><b>Bring ${r.qty} ${esc(r.qty>1?plural(m.n):m.n)}</b>
        <div class="cbar"><i style="width:${Math.min(1,n/r.qty)*100}%"></i></div><small>${r.area?`📍 ${esc(r.area)} · `:""}You have ${n}/${r.qty} · Reward ${r.gold} G · ${CONTRACT_GEMS} 💎</small></div>
      <button class="gbtn sm" data-act="g-deliver" data-v="${r.id}" ${done?"disabled":""}>${done?"Done ✔":n>=r.qty?"Deliver":"Gather"}</button></div>`;
  };
  return `<section class="frame"><span class="ribbon">HUNT &amp; GATHER</span>
    <p class="note" style="margin:0 0 8px;text-align:center">Today's contracts for a ${rank}-Rank adventurer. New ones every day.</p>
    ${h.req.list.map(card).join("") || `<div class="none">No contracts today.</div>`}
  </section>`;
}

function itemStat(it){
  if(it.slot==="weapon") return `${CLASSES[it.t]} · ATK ${it.atk}`;
  if(it.slot==="armour") return `DEF ${it.def} · HP +${it.hp}${it.agi?` · AGI +${it.agi}`:""}`;
  if(it.slot==="acc") return [it.atk&&`ATK +${it.atk}`, it.hp&&`HP +${it.hp}`, it.def&&`DEF +${it.def}`].filter(Boolean).join(" · ");
  if(it.slot==="buff") return it.d;
  return `Heals ${Math.round(it.heal*100)}% HP`;
}
function renderShop(){
  const lvl=heroLevel();
  const row = id => { const it=ITEMS[id], owned=it.slot!=="use"&&have(id)>0&&freeCount(id)>0, locked=it.lv&&lvl<it.lv;
    return `<div class="row"><span style="font-size:26px">${TYPE_ICON[it.t]}</span>
      <span><b>${esc(nm(it))}</b><small>${itemStat(it)}${it.slot==="use"?` · Have ${have(id)}`:""}${locked?` · 🔒 LV ${it.lv}`:""}</small></span>
      <button class="gbtn sm" data-act="g-buy" data-v="${id}" ${owned||locked||state.gold<it.price?"disabled":""}>${owned?"Owned":`${it.price} G${have(id)?` <small>(own ${have(id)})</small>`:""}`}</button></div>`; };
  const ids = Object.keys(ITEMS).filter(id=>ITEMS[id].price);
  return `<section class="frame"><span class="ribbon">ITEM SHOP</span>
    <p class="note" style="margin:0 0 4px;text-align:center">You have <b style="color:var(--gold)">${state.gold} G</b></p>
    ${ids.filter(id=>ITEMS[id].slot==="use").map(row).join("")}
    ${ids.filter(id=>ITEMS[id].slot==="armour").map(row).join("")}
    ${ids.filter(id=>ITEMS[id].slot==="weapon").map(row).join("")}</section>`;
}
function forgeRows(){
  const rows=[], h=H();
  for(const k of Object.keys(h.bag)){ const it=ITEMS[k]; if(!it||it.slot!=="weapon"||have(k)<=0) continue;
    const users=[]; if(h.weapon===k) users.push("hero");
    for(const [cid,o] of Object.entries(state.party.owned||{})) if(o.weapon===k) users.push(cid);
    users.forEach(u=>rows.push({k, who:u}));
    const spare=have(k)-users.length; if(spare>0) rows.push({k, who:"", n:spare});
  }
  return rows.sort((a,b)=>(a.who===""?1:0)-(b.who===""?1:0) || ITEMS[b.k].atk-ITEMS[a.k].atk);
}
function fodderFor(k, who){ const base=ITEMS[k].base||k; return {base, n: freeCount(base) - (k===base && !who ? 1 : 0)}; }
function renderForge(){
  const rows = forgeRows();
  return `<section class="frame"><span class="ribbon">FORGE</span>
    <p class="note" style="margin:0 0 6px;text-align:center">Melt a spare <b>+0 copy</b> of the same weapon into one copy for <b>+10% ATK</b> (up to +${FORGE_MAX}). Free, but only that one copy gets stronger.</p>
    ${rows.map(r=>{ const it=ITEMS[r.k], lv=it.fl||0, max=lv>=FORGE_MAX, f=fodderFor(r.k, r.who), ok=!max&&f.n>0;
      const base=ITEMS[f.base], nextAtk=Math.round(base.atk*(1+.1*(lv+1)));
      const owner = r.who==="hero" ? `Equipped by ${esc(state.name||"you")}` : r.who ? `Equipped by ${ROSTER[r.who].n}` : `Spare${r.n>1?` ×${r.n}`:""}`;
      return `<div class="row"><span style="font-size:26px">${TYPE_ICON[it.t]}</span>
        <span><b>${esc(nm(it))}</b><small>${owner}</small><small>${max?`ATK ${it.atk} · MAX`:`ATK ${it.atk} → <b style="color:#7ff0b0">${nextAtk}</b> · spare +0 copies: ${Math.max(0,f.n)}`}</small>
          <span class="fdots">${"◆".repeat(lv)}${"◇".repeat(FORGE_MAX-lv)}</span></span>
        <button class="gbtn sm" data-act="g-forge" data-v="${r.k}" data-id="${r.who}" ${ok?"":"disabled"}>${max?"Maxed":ok?"Forge":"Need a spare"}</button></div>`; }).join("") || `<div class="none">No weapons yet.</div>`}
  </section>`;
}
function renderCraft(){
  const ids = Object.keys(ITEMS).filter(id=>ITEMS[id].recipe);
  return `<section class="frame"><span class="ribbon">CRAFTING</span>
    <p class="note" style="margin:0 0 4px;text-align:center">Turn gathered materials and monster drops into gear and potions.</p>
    ${ids.map(id=>{const it=ITEMS[id], owned=it.slot!=="use"&&it.slot!=="buff"&&have(id)>0&&freeCount(id)>0;
      const ok=Object.entries(it.recipe).every(([m,q])=>haveIng(m)>=q);
      return `<div class="row"><span style="font-size:26px">${TYPE_ICON[it.t]}</span>
        <span><b>${it.n}</b><small>${itemStat(it)}</small>
          <span class="ing">${Object.entries(it.recipe).map(([m,q])=>`<span class="${haveIng(m)>=q?'ok':'no'}">${MATS[m]?MATS[m].i:"👢"} ${haveIng(m)}/${q}</span>`).join("")}</span>${it.slot==="buff"&&have(id)?`<small>You have ${have(id)}</small>`:""}</span>
        <button class="gbtn sm" data-act="g-craft" data-v="${id}" ${owned||!ok?"disabled":""}>${owned?"Owned":"Craft"}</button></div>`;}).join("")}
  </section>`;
}

/* ---------- actions ---------- */
function gameAct(b){
  const act=b.dataset.act, v=b.dataset.v, k=b.dataset.k, h=H();
  if(act==="g-sub"){ if(k==="adv") advSub=v; else shopSub=v; render(); $("panel").scrollTop=0; return; }
  if(act==="g-look"){ draft.look[k]=+v; crRender(); return; }
  if(act==="g-ctab"){ draft.tab=v; crRender(true); return; }
  if(act==="g-random"){ const r=n=>Math.floor(Math.random()*n), Lk=draft.look;
    Object.assign(Lk, {style:r(LOOK.styles.length), hair:r(LOOK.hair.length), eye:r(LOOK.eye.length), skin:r(LOOK.skin.length), eyes:r(LOOK.eyes.length),
      brows:r(LOOK.brows.length), mouth:r(LOOK.mouths.length), extra:r(LOOK.extras.length), top:r(LOOK.tops.length), topCol:r(LOOK.outfit.length),
      bottom:r(LOOK.bottoms.length), botCol:r(LOOK.outfit.length), head:r(LOOK.heads.length)}); crRender(); return; }
  if(act==="g-talent"){ draft.talent=v; crRender(); return; }
  if(act==="g-starter"){ draft.starter=v; crRender(); return; }
  if(act==="g-edit"){ draft={look:fixLook(h.look),talent:h.talent,starter:null,name:null}; render(); $("panel").scrollTop=0; return; }
  if(act==="g-cancel"){ draft=null; render(); return; }
  if(act==="g-create"){
    const first=!h.created;
    if(first && !(draft.name||"").trim()){ draft.tab="name"; render(); toast("Give your adventurer a name first!"); return; }
    h.look={...draft.look}; h.talent=draft.talent;
    if(first){ state.name = draft.name.trim().slice(0,16); h.created=true; }
    draft=null; save(); if(first) go("home"); else render(); $("panel").scrollTop=0;
    if(first){ toast("Hero registered!"); say(`Welcome to the guild's hunting division, ${state.name}! You'll pick your class when you buy your first weapon.`); }
    else toast("Hero updated!");
    return;
  }
  if(act==="g-stat"){ if(pointsLeft()>0){ h.stats[k]++; save(); render(); } return; }
  if(act==="g-equip"){ const it=ITEMS[v]; if(!it||have(v)<1) return;
    if(it.slot==="acc"){ h.acc = h.acc===v ? null : v; }
    else if(it.slot==="weapon") h.weapon=v; else h.armour=v;
    save(); render(); toast(it.slot==="weapon"?`Class: ${heroStats().cls}`:`Equipped ${it.n}`); return; }
  if(act==="g-buy" && !Tut.canBuy(v)) return;
  if(act==="g-buy"){ const it=ITEMS[v]; if(!it||!it.price||state.gold<it.price) return; if(it.slot!=="use"&&have(v)>0&&freeCount(v)>0) return;
    state.gold-=it.price; addBag(v,1); Tut.bought(v); save(); render(); toast(`Bought ${it.n}!`); return; }
  if(act==="g-forge"){ const it=ITEMS[v], who=b.dataset.id||""; if(!it||it.slot!=="weapon"||(it.fl||0)>=FORGE_MAX) return;
    const f=fodderFor(v, who); if(f.n<1 || have(v)<1) return;
    const key=f.base+"@"+((it.fl||0)+1);
    addBag(f.base,-1); addBag(v,-1); addBag(key,1);
    if(who==="hero") H().weapon=key; else if(who && state.party.owned[who]) state.party.owned[who].weapon=key;
    applyForge(); save(); render(); toast(`⚒️ ${nm(ITEMS[key])}! ATK ${ITEMS[key].atk}`); return; }
  if(act==="g-craft"){ const it=ITEMS[v]; if(!it||!it.recipe) return; if(it.slot!=="use"&&it.slot!=="buff"&&have(v)>0&&freeCount(v)>0) return;
    if(!Object.entries(it.recipe).every(([m,q])=>haveIng(m)>=q)) return;
    for(const [m,q] of Object.entries(it.recipe)) addBag(m,-q);
    addBag(v,1); save(); render(); toast(`Crafted ${it.n}!`); return; }
  if(act==="g-deliver"){
    const r=h.req.list.find(x=>x.id===v); if(!r||h.req.done.includes(v)) return;
    if(r.type==="slay"){
      const n=(h.req.kills||{})[r.mon]||0;
      if(n<r.qty){ go("adventure"); advSub="hunt"; render(); toast("Find a hunt with that monster!"); return; }
      state.gold+=r.gold; state.crystals=(state.crystals||0)+CONTRACT_GEMS; h.req.done.push(v); save(); render(); toast(`Contract complete! +${r.gold} G, +${CONTRACT_GEMS} 💎`); say("Subjugation confirmed! The villagers can sleep easy tonight. Here's your reward!"); return;
    }
    if(have(r.mat)<r.qty){ go("adventure"); advSub="gather"; render(); toast("Head out gathering!"); return; }
    addBag(r.mat,-r.qty); state.gold+=r.gold; state.crystals=(state.crystals||0)+CONTRACT_GEMS; h.req.done.push(v); save(); render(); toast(`Delivered! +${r.gold} G, +${CONTRACT_GEMS} 💎`); say("Perfect, the workshop's been waiting on those. Here's your pay!"); return;
  }
  if(act==="g-hunt") return pickHuntBuff(()=>startHunt(v));
  if(act==="g-buffpick"){ huntBuff = v || null; closeModal(); const go=pickHuntBuff.go; pickHuntBuff.go=null; if(go) go(); return; }
  if(act==="g-gather") return startGather(v);
  if(act==="g-ult") return queueUlt(+v);
  if(act==="g-potion") return drinkPotion(v);
  if(act==="g-run") return fleeHunt();
  if(act==="g-mute"){ const on=Music.toggle(); b.textContent=on?"🔊":"🔇"; return; }
  if(act==="g-leave"){ if(G) endGather(); return; }
}

/* ---------- arena (battle + gathering) ---------- */
let B=null, G=null, loopId=0;
const now = () => performance.now();
function arenaOpen(html){ const a=$("arena"); a.innerHTML=html; a.classList.add("show"); }
function arenaClose(){ cancelAnimationFrame(loopId); if(typeof Music!=="undefined") Music.stop(); if(G&&G.iv) clearInterval(G.iv); if(G&&G.key) document.removeEventListener("keydown", G.key); B=null; G=null; const a=$("arena"); a.classList.remove("show"); a.innerHTML=""; render(); }
function pop(field, x, y, text, cls){
  const p=document.createElement("div"); p.className="pop "+(cls||""); p.textContent=text; p.style.left=x; p.style.top=y;
  field.appendChild(p); setTimeout(()=>p.remove(), 850);
}
function flash(id){ const el=$(id); if(!el) return; el.classList.remove("hit"); void el.offsetWidth; el.classList.add("hit"); }
function banner(t){ const b=$("bnr"); if(b){ b.textContent=t; b.classList.remove("in"); void b.offsetWidth; b.classList.add("in"); } }

/* ---------- gathering ---------- */
/* ---------- pick a tonic or meal before a hunt ---------- */
let huntBuff = null;
function pickHuntBuff(go){
  const own = Object.keys(ITEMS).filter(k=>ITEMS[k].slot==="buff" && have(k)>0);
  if(!own.length){ huntBuff=null; return go(); }
  openModal(`<span class="ribbon">BEFORE YOU GO</span><h3 class="t">Bring something?</h3>
    <p class="note" style="margin:0;text-align:center">Pick one to use for this hunt. It's used up when the hunt starts.</p>
    ${own.map(k=>`<button class="buffpick" data-act="g-buffpick" data-v="${k}"><span>${ITEMS[k].t==="meal"?"🍽️":"🧪"}</span><span><b>${ITEMS[k].n} ×${have(k)}</b><small>${ITEMS[k].d}</small></span></button>`).join("")}
    <div class="btns"><button class="gbtn plain" data-act="g-buffpick" data-v="">No thanks, just go</button></div>`);
  pickHuntBuff.go = go;
}
function startGather(id){
  const L=GATHER.find(x=>x.id===id); if(!L) return;
  if(!gatherOpen(L)){ toast(`Reach ${L.rank}-Rank first!`); return; }
  if(state.gold<L.fee){ toast("Not enough gold. Clear some chore quests!"); return; }
  state.gold-=L.fee; save(); render();
  if(L.game==="basket") return startBasket(L);
  if(L.game==="fish") return startFishing(L);
  if(L.game==="dig") return startDig(L);
  G={L, haul:{}, end:now()+20000, iv:0};
  arenaOpen(`
    <div class="ar-top"><div class="ar-name"><span>${L.n}</span><span id="gTime">20.0s</span></div></div>
    <div class="field" id="gfield" style="background:${L.bg}"><div class="banner in" id="bnr">Tap the sparkles!</div></div>
    <div class="ar-bot"><div class="haul" id="haul">Nothing yet</div><button class="gbtn plain" data-act="g-leave">Finish early</button></div>`);
  G.iv=setInterval(spawnSpark, 600); spawnSpark();
  (function tick(){ if(!G) return; const left=G.end-now(); const el=$("gTime"); if(el) el.textContent=Math.max(0,left/1000).toFixed(1)+"s"; if(left<=0){ endGather(); return; } loopId=requestAnimationFrame(tick); })();
}
function spawnSpark(){
  if(!G) return;
  const f=$("gfield"); if(!f) return;
  const lucky=H().talent==="lucky", rare=Math.random()<(lucky?.22:.15);
  const s=document.createElement("button"); s.className="spark"+(rare?" rare":""); s.setAttribute("aria-label", rare?"Rare sparkle":"Sparkle");
  const x=8+Math.random()*84, y=14+Math.random()*72; s.style.left=x+"%"; s.style.top=y+"%";
  f.appendChild(s);
  const tm=setTimeout(()=>s.remove(), rare?900:1300);
  s.addEventListener("pointerdown", e=>{
    e.preventDefault(); clearTimeout(tm); if(!G) return;
    const mat=rare?G.L.rare:G.L.common[Math.floor(Math.random()*G.L.common.length)];
    const q=1+(lucky&&Math.random()<.2?1:0);
    G.haul[mat]=(G.haul[mat]||0)+q;
    pop(f, x+"%", y+"%", `+${q} ${MATS[mat].i}`, rare?"perfect":"");
    s.remove();
    $("haul").textContent=Object.entries(G.haul).map(([k,n])=>`${MATS[k].i}×${n}`).join("  ");
  }, {once:true});
}
async function endGather(){
  if(!G) return;
  clearInterval(G.iv); if(G.key) document.removeEventListener("keydown", G.key);
  const haul=G.haul, L=G.L;
  for(const [k,n] of Object.entries(haul)){ if(k==="gems") state.crystals=(state.crystals||0)+n; else addBag(k,n); }
  Tut.gathered(); Ev.onRun("gather");
  save();
  arenaClose();
  const items=Object.entries(haul);
  await splash(`<div class="sp-title" style="font-size:clamp(28px,9vw,44px)">GATHERING<br>COMPLETE!</div><div class="sp-sub">${esc(L.n)}</div>
    <div class="loot" style="flex-wrap:wrap;justify-content:center">${items.length?items.map(([k,n])=>`<div><span style="font-size:34px;line-height:1.2">${haulIcon(k)}</span><b>×${n}</b><span>${esc(haulName(k)).toUpperCase()}</span></div>`).join(""):`<div><b>—</b><span>NOTHING FOUND</span></div>`}</div>
    <div class="tap">Tap to continue</div>`, 5000);
}
