/* ================= Drawn art: drop-in PNGs with pixel-sprite fallback =================
   Put PNG files in the art/ folder using the names in ART_GUIDE.md. Anything missing falls back to pixel art. */

const ART_BASE = "art/";
const HAIR_FILES = () => LOOK.hairKeys;
const HEAD_TINT = {hood:"top", cat:"hair"};   // other headwear is drawn in full colour

const Art = (() => {
  const ok = new Map();           // path -> HTMLImageElement | false
  const comp = new Map();         // hero composite cache
  const drawn = new Set();
  function probe(path){
    return new Promise(res => {
      if(ok.has(path)) return res(ok.get(path));
      const im = new Image();
      im.onload = () => { ok.set(path, im); res(im); };
      im.onerror = () => { ok.set(path, false); res(false); };
      im.src = ART_BASE + path;
    });
  }
  const has = p => !!ok.get(p);
  const url = p => has(p) ? ART_BASE + p : null;

  function allPaths(){
    const p = [];
    for(const id of Object.keys(ROSTER)) p.push(`characters/${id}/chibi.png`, `characters/${id}/portrait.png`);
    for(const m of MONSTERS) p.push(`monsters/${m.id}.png`, `monsters/${m.id}_boss.png`);
    for(const kind of ["chibi","portrait"]){
      const d=`hero/${kind}/`, keys=l=>l.map(o=>o[0]);
      for(const h of HAIR_FILES()) p.push(`${d}hair_back_${h}.png`, `${d}hair_front_${h}.png`);
      for(const e of keys(LOOK.eyes)) p.push(`${d}eyes_${e}.png`, `${d}eyeline_${e}.png`);
      for(const b of keys(LOOK.brows)) p.push(`${d}brows_${b}.png`);
      for(const m of keys(LOOK.mouths)) p.push(`${d}mouth_${m}.png`);
      for(const x of keys(LOOK.extras)) if(x!=="none") p.push(`${d}extra_${x}.png`);
      for(const t of keys(LOOK.tops)) p.push(`${d}top_${t}.png`);
      for(const b of keys(LOOK.bottoms)) p.push(`${d}bottom_${b}.png`, `${d}shoes_${b}.png`);
      for(const h of keys(LOOK.heads)) if(h!=="none") p.push(`${d}head_${h}.png`, `${d}head_back_${h}.png`);
      for(const w of ["sword","staff","dagger","mace","bow"]) p.push(`${d}weapon_${w}.png`);
      p.push(`${d}skin.png`);
    }
    for(const l of ["base","eyes_open","eyes_closed","mouth_closed","mouth_open"]) p.push(`lilia/${l}.png`);
    for(const id of ["tidea","barnaby","marigold","lilia"]){ if(id!=="lilia") p.push(`story/${id}.png`); for(const f of EXPRESSIONS) if(f!=="happy") p.push(`story/${id}_${f}.png`); }
    for(const k of Object.keys(STORY_BGS)) p.push(`story/bg_${k}.png`);
    return p;
  }
  async function preload(){ await Promise.all(allPaths().map(probe)); comp.clear(); }

  /* Tint a greyscale layer: multiply by the colour, keep the layer's own transparency */
  function tinted(img, colour, w, h){
    const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
    x.drawImage(img, 0, 0, w, h);
    if(colour){
      x.globalCompositeOperation = "multiply"; x.fillStyle = colour; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = "destination-in"; x.drawImage(img, 0, 0, w, h);
    }
    return c;
  }
  /** Composite hero art from layers, or null if the required layers aren't drawn yet */
  function hero(kind, L){
    const key = kind + JSON.stringify(L);
    if(comp.has(key)) return comp.get(key);
    const hair = HAIR_FILES()[L.style] || "short", dir = `hero/${kind}/`;
    const need = [`${dir}skin.png`, `${dir}top_${L.top}.png`, `${dir}bottom_${L.bottom}.png`, `${dir}hair_front_${hair}.png`];
    if(!need.every(has)){ comp.set(key, null); return null; }
    const headCol = {top:L.topCol, hair:L.hair}[HEAD_TINT[L.head]] || null;
    const layers = [
      [`head_back_${L.head}`, headCol], [`hair_back_${hair}`, L.hair], ["skin", L.skin],
      [`bottom_${L.bottom}`, L.botCol], [`shoes_${L.bottom}`, null], [`top_${L.top}`, L.topCol],
      [`extra_${L.extra}`, null], [`eyes_${L.eyes}`, L.eye], [`eyeline_${L.eyes}`, null], [`mouth_${L.mouth}`, null],
      [`hair_front_${hair}`, L.hair], [`brows_${L.brows}`, L.hair], [`head_${L.head}`, headCol], [`weapon_${L.weapon}`, null]
    ].map(([n,c]) => [dir+n+".png", c]).filter(([p]) => has(p));
    const base = ok.get(layers.find(([p]) => p.endsWith("skin.png"))[0]);
    const w = base.naturalWidth, h = base.naturalHeight;
    try{
      const out = document.createElement("canvas"); out.width = w; out.height = h; const ctx = out.getContext("2d");
      for(const [p, c] of layers) ctx.drawImage(tinted(ok.get(p), c, w, h), 0, 0);
      const u = out.toDataURL("image/png"); comp.set(key, u); drawn.add(u); return u;
    }catch(e){ comp.set(key, null); return null; }   // e.g. opened as a local file, where browsers block reading image pixels
  }
  return {preload, has, url, hero, isDrawn: s => drawn.has(s)};
})();

/* ---------- picture helpers (drawn art if present, pixel sprite otherwise) ---------- */
function pic(src, cls="", alt=""){
  const isArt = src && (src.startsWith(ART_BASE) || Art.isDrawn(src));
  return isArt ? `<img class="art ${cls}" src="${src}" alt="${alt}">` : PX.img(src, cls, alt);
}
function charChibi(id){ return Art.url(`characters/${id}/chibi.png`) || charSprite(id); }
function charPortrait(id){ return Art.url(`characters/${id}/portrait.png`) || charSprite(id); }
function heroLook(){ const h=H(), hs=heroStats(); return heroPxLook(h.look, hs.wtype); }
function heroChibi(){ const L=heroLook(); return Art.hero("chibi", L) || PX.chibi(L); }
function heroPortrait(look, wtype){ const L = look ? heroPxLook(look, wtype) : heroLook(); return Art.hero("portrait", L) || PX.chibi(L); }
function monsterArt(id, boss){ return Art.url(`monsters/${id}${boss?"_boss":""}.png`) || (boss && Art.url(`monsters/${id}.png`)) || PX.monster(id, !!boss); }

/* ---------- Lilia, PNGtuber style ---------- */
const Lilia = (() => {
  let on = false, talkT = 0, blinkT = 0;
  function init(){
    if(!Art.has("lilia/base.png")) return;
    on = true;
    const box = document.getElementById("liliaArt");
    const L = p => Art.has(p) ? `<img class="ll ${p.split("/")[1].replace(".png","")}" src="${ART_BASE+p}" alt="">` : "";
    box.innerHTML = `<div class="lilia-stack">${L("lilia/base.png")}${L("lilia/eyes_open.png")}${L("lilia/eyes_closed.png")}${L("lilia/mouth_closed.png")}${L("lilia/mouth_open.png")}</div>`;
    box.classList.add("drawn");
    blinkLoop();
  }
  function setEyes(closed){ const b=document.getElementById("liliaArt"); if(b) b.classList.toggle("blink", closed); }
  function setMouth(open){ const b=document.getElementById("liliaArt"); if(b) b.classList.toggle("talk", open); }
  function blinkLoop(){
    clearTimeout(blinkT);
    blinkT = setTimeout(() => { setEyes(true); setTimeout(() => { setEyes(false); blinkLoop(); }, 130); }, 2500 + Math.random()*3500);
  }
  function talk(ms){
    if(!on) return;
    clearInterval(talkT); let open = false; const end = Date.now() + ms;
    talkT = setInterval(() => { open = !open && Date.now() < end; setMouth(open); if(Date.now() >= end){ clearInterval(talkT); setMouth(false); } }, 120);
  }
  return {init, talk};
})();
