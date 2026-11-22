/* ================= Pixel sprite engine =================
   Sprites are drawn into a small grid of colour roles, auto-outlined and shaded,
   then turned into a PNG data URL (cached) and shown with image-rendering: pixelated. */

const PX = (() => {
  const cache = new Map();
  function grid(w,h){ return Array.from({length:h},()=>Array(w).fill(null)); }
  function put(g,x,y,c){ x|=0; y|=0; if(y>=0&&y<g.length&&x>=0&&x<g[0].length) g[y][x]=c; }
  function rect(g,x0,y0,x1,y1,c){ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) put(g,x,y,c); }
  function ellipse(g,cx,cy,rx,ry,c,cond){
    for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++) for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){
      const dx=(x+.5-cx)/rx, dy=(y+.5-cy)/ry;
      if(dx*dx+dy*dy<=1 && (!cond||cond(x,y))) put(g,x,y,c);
    }
  }
  function tri(g,ax,ay,bx,by,cx2,cy2,c){
    const minx=Math.floor(Math.min(ax,bx,cx2)), maxx=Math.ceil(Math.max(ax,bx,cx2)), miny=Math.floor(Math.min(ay,by,cy2)), maxy=Math.ceil(Math.max(ay,by,cy2));
    const s=(px,py,x1,y1,x2,y2)=>(px-x2)*(y1-y2)-(x1-x2)*(py-y2);
    for(let y=miny;y<=maxy;y++) for(let x=minx;x<=maxx;x++){ const px=x+.5, py=y+.5;
      const d1=s(px,py,ax,ay,bx,by), d2=s(px,py,bx,by,cx2,cy2), d3=s(px,py,cx2,cy2,ax,ay);
      if(!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))) put(g,x,y,c); }
  }
  function line(g,x0,y0,x1,y1,c){ const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1; for(let i=0;i<=n;i++) put(g,Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),c); }
  // colour helpers
  function hex(h){ h=h.replace("#",""); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
  function shade(h,f){ const [r,g,b]=hex(h); const m=v=>Math.max(0,Math.min(255,Math.round(v*f))); return `rgb(${m(r)},${m(g)},${m(b)})`; }
  function toURL(g, scale, opts={}){
    const h=g.length, w=g[0].length, outline=opts.outline||"#1b1026";
    // outline pass
    const o=g.map(r=>r.slice());
    for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(!g[y][x]){
      const n=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{ const v=(g[y+dy]||[])[x+dx]; return v && !v.noOutline; });
      if(n) o[y][x]={c:outline};
    }
    const c=document.createElement("canvas"); c.width=w*scale; c.height=h*scale; const ctx=c.getContext("2d");
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const v=o[y][x]; if(!v) continue;
      let col=v.c;
      if(v.shade && !opts.flat){ const right=g[y][x+1], down=(g[y+1]||[])[x];
        if(!right||!down||right.part!==v.part||down.part!==v.part) col=v.shade; }
      if(v.hi && !opts.flat){ const up=(g[y-1]||[])[x], left=g[y][x-1]; if((!up||up.part!==v.part)&&(!left||left.part!==v.part)) col=v.hi; }
      ctx.fillStyle=col; ctx.fillRect(x*scale,y*scale,scale,scale); }
    return c.toDataURL("image/png");
  }
  const P = (c,part,opt={}) => ({c, part, shade:opt.flat?null:shade(c,.72), hi:opt.hi?shade(c,1.25):null, noOutline:opt.noOutline});

  /* ---------- chibi ----------
     look: {style 0-7, hair, eye, skin (hex), eyes:"round|sharp|sleepy|cat|sparkly", brows:"soft|angry|worried|thick",
            mouth:"smile|grin|neutral|fang", extra:"none|blush|freckles|mole|scar", top:"tunic|blouse|hoodie|robe|vest", topCol,
            bottom:"skirt|longskirt|pants|shorts", botCol, head:"none|ribbon|witch|hood|cat", outfit2 (accent), weapon, orb}
     Older looks (outfit + bottom skirt/pants) still work for the recruits. */
  function chibi(L0){
    const key="c"+JSON.stringify(L0); if(cache.has(key)) return cache.get(key);
    const L={eyes:"round",brows:"soft",mouth:"smile",extra:"blush",top:"tunic",head:"none",...L0};
    L.topCol = L.topCol || L.outfit || "#2f63e6";
    L.botCol = L.botCol || (L.bottom==="pants" ? (L.outfit2||"#f4f0e6") : (L.outfit||"#2f63e6"));
    const g=grid(32,34);
    const hair=P(L.hair,"hair",{hi:true}), skin=P(L.skin,"skin"), top=P(L.topCol,"top"), bot=P(L.botCol,"bot"), acc2=P(L.outfit2||"#f4f0e6","cloth2"),
          boot=P("#4a2e1e","boot"), gold=P("#f2c14e","gold",{flat:true}), eye={c:L.eye,part:"eye"}, white={c:"#ffffff",part:"eye"},
          blush={c:"#ff9db4",part:"skin"}, mouth={c:"#9a3a4a",part:"skin"}, dark={c:"#2a1830",part:"eye"}, brow={c:shade(L.hair,.5),part:"brow"},
          steel=P("#c9d2e0","steel",{hi:true});
    const cx=16, st=L.style|0;
    // hood (back)
    if(L.head==="hood") ellipse(g,cx,12,11.8,10.8,top);
    // back hair
    if(st===1) { ellipse(g,cx,12,10.5,9.5,hair); rect(g,6,12,25,25,hair); }           // long
    if(st===2) { ellipse(g,cx,12,10,9,hair); ellipse(g,26,18,3,7,hair); }               // ponytail
    if(st===3) { ellipse(g,cx,12,10,9,hair); ellipse(g,4.5,19,3,7,hair); ellipse(g,27.5,19,3,7,hair); } // twin tails
    if(st===5) { ellipse(g,cx,12,10.5,9.5,hair); rect(g,7,12,24,19,hair); }          // bob
    if(st===6) { ellipse(g,cx,12,10,9,hair); for(const [y,r] of [[17.5,2.4],[21,2.3],[24.5,2.1]]) ellipse(g,25,y,r,r,hair); put(g,25,27,{c:"#ff6f91",part:"acc"}); } // side braid
    if(st===7) { ellipse(g,cx,12,10,9,hair); ellipse(g,8.5,4.5,3.4,3.4,hair); ellipse(g,23.5,4.5,3.4,3.4,hair); } // buns
    // legs, shoes and bottoms
    const legs=(y0,y1)=>{ rect(g,12,y0,14,y1,skin); rect(g,18,y0,20,y1,skin); };
    const boots=()=>{ rect(g,11,31,14,33,boot); rect(g,18,31,21,33,boot); };
    if(L.bottom==="longskirt"){ rect(g,10,25,22,30,bot); tri(g,8,32,16,24,24,32,bot); rect(g,9,31,23,31,bot);
      const sl=P("#c97a8a","shoe"); rect(g,11,32,14,33,sl); rect(g,18,32,21,33,sl); }
    else if(L.bottom==="pants"){ boots(); rect(g,11,25,21,30,bot); rect(g,16,27,16,30,{c:shade(L.botCol,.7),part:"bot"}); }
    else if(L.bottom==="shorts"){ legs(29,32); rect(g,11,25,21,28,bot); rect(g,16,27,16,28,{c:shade(L.botCol,.7),part:"bot"});
      const sd=P("#8a5a2c","shoe"); rect(g,11,33,14,33,sd); rect(g,18,33,21,33,sd); put(g,13,32,sd); put(g,19,32,sd); }
    else { legs(28,31); boots(); tri(g,9,30,16,22,23,30,bot); rect(g,9,28,23,29,bot); }   // skirt
    // tops
    const robe = L.top==="robe";
    if(robe){ rect(g,10,20,22,31,top); rect(g,16,21,16,31,acc2); rect(g,10,31,22,31,gold); }
    else rect(g,11,20,21,26,top);
    if(L.top==="tunic"){ rect(g,11,25,21,25,gold); tri(g,13,20,16,24,19,20,acc2); }
    if(L.top==="blouse"){ rect(g,12,20,20,20,P("#ffffff","frill")); put(g,13,21,P("#ffffff","frill")); put(g,19,21,P("#ffffff","frill"));
      const rb={c:"#e0475a",part:"rib"}; put(g,15,21,rb); put(g,17,21,rb); put(g,16,22,rb); put(g,16,21,rb); }
    if(L.top==="hoodie"){ rect(g,10,19,22,20,{c:shade(L.topCol,.8),part:"top"}); const s={c:"#f4f0e6",part:"str"}; rect(g,14,21,14,23,s); rect(g,18,21,18,23,s);
      rect(g,13,24,19,24,{c:shade(L.topCol,.75),part:"top"}); }
    if(L.top==="vest"){ rect(g,12,21,20,24,steel); rect(g,12,25,20,25,gold); ellipse(g,9.5,21,2.2,1.7,steel); ellipse(g,22.5,21,2.2,1.7,steel); }
    // arms
    if(robe){ rect(g,7,21,10,26,top); rect(g,22,21,25,26,top); rect(g,8,27,9,27,skin); rect(g,23,27,24,27,skin); }
    else { rect(g,8,21,10,25,top); rect(g,22,21,24,25,top); rect(g,8,26,10,27,skin); rect(g,22,26,24,27,skin); }
    // head
    ellipse(g,cx,12.5,9,8.5,skin);
    // face extras
    if(L.extra==="blush"){ rect(g,9,16,10,16,blush); rect(g,21,16,22,16,blush); }
    if(L.extra==="freckles"){ const f={c:"#b8734f",part:"skin"}; for(const [x,y] of [[10,16],[12,16],[11,17],[19,16],[21,16],[20,17]]) put(g,x,y,f); }
    if(L.extra==="mustache"){ const m={c:shade(L.hair,.85),part:"hair"}; rect(g,13,16,18,16,m); put(g,12,17,m); put(g,19,17,m); }
    if(L.extra==="mole") put(g,20,17,{c:"#3a2430",part:"skin"});
    if(L.extra==="scar"){ const s={c:"#d9707a",part:"skin"}; put(g,21,13,s); put(g,22,14,s); put(g,21,15,s); put(g,22,16,s); }
    // eyes
    for(const [ex,side] of [[11,-1],[19,1]]){
      const outer = side<0 ? ex-1 : ex+2;
      if(L.eyes==="sharp"){ rect(g,ex,14,ex+1,15,eye); put(g,ex,14,white); rect(g,ex-1,13,ex+2,13,dark); put(g,outer,12,dark); }
      else if(L.eyes==="sleepy"){ rect(g,ex,15,ex+1,15,eye); rect(g,ex-1,14,ex+2,14,dark); }
      else if(L.eyes==="cat"){ const x0=side<0?ex-1:ex; rect(g,x0,13,x0+2,15,eye); rect(g,x0+1,13,x0+1,15,dark); put(g,x0,13,white); rect(g,x0-0,12,x0+2,12,dark); put(g,side<0?x0-1:x0+3,12,dark); }
      else if(L.eyes==="sparkly"){ const x0=side<0?ex-1:ex; rect(g,x0,13,x0+2,15,eye); put(g,x0,13,white); put(g,x0+1,13,white); put(g,x0+2,15,white); rect(g,x0,12,x0+2,12,dark); put(g,x0+1,15,{c:shade(L.eye,.6),part:"eye"}); }
      else { rect(g,ex,13,ex+1,15,eye); put(g,ex,13,white); put(g,ex+1,15,dark); rect(g,ex-1,12,ex+2,12,dark); }   // round
    }
    // mouth
    if(L.mouth==="grin"){ rect(g,14,17,17,17,{c:"#ffffff",part:"skin"}); rect(g,15,18,16,18,mouth); put(g,14,17,mouth); put(g,17,17,mouth); }
    else if(L.mouth==="neutral"){ put(g,15,17,mouth); put(g,16,17,mouth); }
    else if(L.mouth==="frown"){ put(g,14,18,mouth); put(g,15,17,mouth); put(g,16,17,mouth); put(g,17,18,mouth); }
    else if(L.mouth==="o"){ rect(g,15,17,16,18,mouth); }
    else if(L.mouth==="fang"){ rect(g,14,17,17,17,mouth); put(g,16,18,{c:"#ffffff",part:"skin"}); }
    else { put(g,14,16,mouth); put(g,15,17,mouth); put(g,16,17,mouth); put(g,17,16,mouth); }   // smile
    // front hair / bangs
    ellipse(g,cx,9,10,7,hair,(x,y)=>y<=9);
    const bang=[[7,11],[8,12],[9,11],[10,10],[11,12],[12,11],[13,10],[14,11],[15,12],[16,10],[17,11],[18,12],[19,10],[20,11],[21,12],[22,11],[23,12],[24,11]];
    const browGap = x => (x>=10&&x<=13)||(x>=18&&x<=21);   // bangs part a little over the brows so expressions show
    for(const [x,y] of bang) for(let yy=8;yy<=(browGap(x)?Math.min(y,9):y);yy++) put(g,x,yy,hair);
    if(st===0||st===4||st===6||st===7){ rect(g,6,9,7,15,hair); rect(g,24,9,25,15,hair); }   // short side locks
    if(st===4){ tri(g,9,4,12,0,14,4,hair); tri(g,14,3,17,-1,19,3,hair); tri(g,19,4,23,1,23,6,hair); } // spiky
    if(st===2) put(g,23,8,{c:"#ff6f91",part:"acc"}), put(g,24,8,{c:"#ff6f91",part:"acc"});
    if(st===3){ put(g,6,10,{c:"#ff6f91",part:"acc"}); put(g,26,10,{c:"#ff6f91",part:"acc"}); }
    if(st===1||st===5){ rect(g,6,12,7,22,hair); rect(g,24,12,25,22,hair); }
    // brows (drawn over the bangs so expressions read)
    const B={soft:[[10,11],[11,11],[12,11],[13,11]], angry:[[10,10],[11,10],[12,11],[13,11]], worried:[[10,11],[11,11],[12,10],[13,10]],
             thick:[[10,10],[11,10],[12,10],[13,10],[10,11],[11,11],[12,11],[13,11]]}[L.brows]||[];
    for(const [x,y] of B){ put(g,x,y,brow); put(g,31-x,y,brow); }
    // headwear
    if(L.head==="cat"){ const pink={c:"#ff9db4",part:"ear"}; tri(g,6,8,8,0,13,4,hair); tri(g,19,4,24,0,26,8,hair); put(g,9,4,pink); put(g,9,5,pink); put(g,23,4,pink); put(g,23,5,pink); }
    if(L.head==="hood"){ ellipse(g,cx,9,11.2,7.6,top,(x,y)=>y<=4); rect(g,5,9,6,19,top); rect(g,26,9,27,19,top); }
    if(L.head==="ribbon"){ const r=P("#e0475a","rib"); tri(g,19,2,19,8,23,5,r); tri(g,27,2,27,8,23,5,r); rect(g,22,4,24,6,P("#ff6f91","rib2")); }
    if(L.head==="witch"){ const hat=P("#3b2a5c","hat",{hi:true}); tri(g,10,5,22,5,20,-3,hat); rect(g,4,5,28,6,hat); rect(g,11,4,21,4,gold); }
    // weapon
    weapon(g, L.weapon||"none", L.orb);
    const url=toURL(g, 4); cache.set(key,url); return url;
  }
  function weapon(g, t, orb){
    const steel=P("#dfe6f0","steel",{hi:true}), gold=P("#f2c14e","gold"), wood=P("#8a5a2c","wood");
    if(t==="sword"){ rect(g,26,8,27,22,steel); rect(g,24,23,29,23,gold); rect(g,26,24,27,27,wood); }
    if(t==="staff"){ rect(g,26,9,27,31,wood); ellipse(g,26.9,6.5,2.8,2.8,P(orb||"#7fd8ff","orb",{hi:true})); }
    if(t==="dagger"){ rect(g,26,17,27,23,steel); rect(g,25,24,28,24,gold); rect(g,26,25,27,27,wood); }
    if(t==="mace"){ rect(g,26,14,27,30,wood); ellipse(g,26.9,11.5,3.2,3.2,P("#a8b0c0","mace",{hi:true})); put(g,27,7,{c:"#a8b0c0",part:"mace"}); put(g,30,11,{c:"#a8b0c0",part:"mace"}); put(g,23,11,{c:"#a8b0c0",part:"mace"}); }
    if(t==="bow"){ for(let y=6;y<=30;y++){ const x=Math.round(26+4*Math.sin((y-6)/24*Math.PI)); put(g,x,y,wood); } line(g,26,6,26,30,{c:"#f4f4f4",part:"string",noOutline:true}); }
  }

  /* ---------- monsters ---------- */
  function monster(id, boss){
    const key="m"+id+(boss?"b":""); if(cache.has(key)) return cache.get(key);
    const g=grid(32,32); const E=(x,y,c="#1e2a20")=>{ rect(g,x,y,x+1,y+2,{c,part:"eye"}); put(g,x,y,{c:"#fff",part:"eye"}); };
    if(id==="slime"){ const b=P("#5bd47a","b",{hi:true}); ellipse(g,16,21,13,10,b,(x,y)=>y<=29); rect(g,4,26,28,29,b); E(11,18); E(19,18); rect(g,9,16,12,16,{c:"#1e2a20",part:"eye"}); rect(g,19,16,22,16,{c:"#1e2a20",part:"eye"}); rect(g,14,25,17,25,{c:"#1e2a20",part:"eye"}); put(g,8,15,{c:"#e8fff0",part:"b"}); put(g,9,14,{c:"#e8fff0",part:"b"}); }
    if(id==="shroom"){ const cap=P("#d8443c","cap",{hi:true}), stem=P("#f4e4bd","stem"); rect(g,10,15,21,29,stem); ellipse(g,16,12,14,9,cap,(x,y)=>y<=16); for(const [x,y] of [[9,8],[10,8],[9,9],[16,5],[17,5],[16,6],[22,9],[23,9],[22,10],[13,12],[19,13]]) put(g,x,y,{c:"#fff",part:"cap"}); E(12,20); E(18,20); rect(g,13,26,18,26,{c:"#5a3a1e",part:"eye"}); }
    if(id==="bat"){ const w=P("#4a2f78","w"), b=P("#6e4aa8","b",{hi:true}); tri(g,16,14,0,6,6,24,w); tri(g,16,14,32,6,26,24,w); tri(g,10,10,12,3,15,10,b); tri(g,22,10,20,3,17,10,b); ellipse(g,16,16,8,8,b); E(12,14,"#ff3b4a"); E(18,14,"#ff3b4a"); put(g,13,20,{c:"#fff",part:"f"}); put(g,18,20,{c:"#fff",part:"f"}); }
    if(id==="goblin"){ const s=P("#7cc455","s",{hi:true}); tri(g,8,14,0,8,8,20,s); tri(g,24,14,32,8,24,20,s); rect(g,8,26,24,31,P("#7a4a2a","cl")); ellipse(g,16,16,9,10,s); ellipse(g,16,9,9,4,P("#5a3a24","hood"),(x,y)=>y<=9); E(11,14,"#c9a400"); E(19,14,"#c9a400"); rect(g,12,21,19,22,{c:"#3a1a14",part:"m"}); put(g,13,21,{c:"#fff",part:"m"}); put(g,18,21,{c:"#fff",part:"m"}); }
    if(id==="golem"){ const st=P("#8b8f99","st",{hi:true}); rect(g,5,12,26,28,st); rect(g,1,14,5,25,st); rect(g,26,14,30,25,st); rect(g,9,3,22,12,st); rect(g,11,6,13,7,{c:"#6ff0ff",part:"e"}); rect(g,18,6,20,7,{c:"#6ff0ff",part:"e"}); ellipse(g,16,19,2.5,2.5,P("#b48cff","core")); rect(g,10,29,14,31,st); rect(g,18,29,22,31,st); put(g,7,13,{c:"#5fae4e",part:"st"}); put(g,8,13,{c:"#5fae4e",part:"st"}); put(g,20,3,{c:"#5fae4e",part:"st"}); }
    if(id==="wyvern"){ const s=P("#3aa39a","s",{hi:true}), w=P("#256b66","w"), h=P("#f4e4bd","h"); tri(g,10,16,0,2,4,22,w); tri(g,22,16,32,2,28,22,w); tri(g,10,10,6,0,13,8,h); tri(g,22,10,26,0,19,8,h); ellipse(g,16,15,9,9,s); ellipse(g,16,22,6,5,P("#5cc4b8","sn")); E(11,13,"#ffd23f"); E(19,13,"#ffd23f"); put(g,14,22,{c:"#174744",part:"n"}); put(g,18,22,{c:"#174744",part:"n"}); put(g,13,26,{c:"#fff",part:"f"}); put(g,19,26,{c:"#fff",part:"f"}); }
    if(id==="dummy"){ const st=P("#e2c27a","st",{hi:true}); rect(g,15,18,16,31,P("#7a4a24","post")); rect(g,5,15,26,17,st); ellipse(g,16,21,6,6,st); ellipse(g,16,9,6,6,st); line(g,13,7,15,9,{c:"#5a3a1e",part:"x"}); line(g,15,7,13,9,{c:"#5a3a1e",part:"x"}); line(g,17,7,19,9,{c:"#5a3a1e",part:"x"}); line(g,19,7,17,9,{c:"#5a3a1e",part:"x"}); ellipse(g,16,21,3,3,{c:"#c8302c",part:"t"}); ellipse(g,16,21,1.5,1.5,{c:"#f4e4bd",part:"t"}); }
    if(boss){ const cr=P("#f3cb64","crown"); const y0=({slime:6,shroom:0,bat:2,goblin:2,golem:0,wyvern:0}[id]||0); rect(g,11,y0+3,20,y0+4,cr); for(const x of [11,15,20]) rect(g,x,y0,x+(x===15?1:0),y0+2,cr); put(g,15,y0+3,{c:"#ff3d6a",part:"gem"}); }
    const url=toURL(g, 4); cache.set(key,url); return url;
  }

  /* ---------- item icons ---------- */
  function icon(type, colour){
    const key="i"+type+(colour||""); if(cache.has(key)) return cache.get(key);
    const g=grid(16,16), steel=P("#dfe6f0","s",{hi:true}), gold=P("#f2c14e","g"), wood=P("#8a5a2c","w");
    if(type==="herb"){ const lf=P(colour||"#6fbf73","l",{hi:true}), st=P("#3f7a3a","st"); line(g,8,15,8,5,st);
      ellipse(g,5,8,3,1.6,lf); ellipse(g,11,6,3,1.6,lf); ellipse(g,5,12,2.6,1.4,lf); ellipse(g,11,11,2.8,1.5,lf); ellipse(g,8,3,1.6,2.4,lf); }
    if(type==="sword"){ line(g,4,11,12,3,steel); line(g,5,11,13,3,steel); line(g,3,9,7,13,gold); line(g,2,13,4,11,wood); }
    if(type==="staff"){ line(g,3,14,10,5,wood); line(g,4,14,11,5,wood); ellipse(g,12,3.5,2.6,2.6,P(colour||"#7fd8ff","o",{hi:true})); }
    if(type==="dagger"){ line(g,6,9,11,4,steel); line(g,7,9,12,4,steel); line(g,4,8,8,12,gold); line(g,3,12,5,10,wood); }
    if(type==="mace"){ line(g,3,13,9,7,wood); line(g,4,13,10,7,wood); ellipse(g,11.5,4.5,3.2,3.2,P("#a8b0c0","m",{hi:true})); }
    if(type==="bow"){ for(let i=0;i<=12;i++){ put(g,Math.round(3+i),Math.round(13-i-2*Math.sin(i/12*Math.PI)*2),wood); } line(g,3,13,15,1,{c:"#f4f4f4",part:"str",noOutline:true}); }
    if(type==="armour"){ rect(g,3,4,12,12,P(colour||"#7a8aa8","a",{hi:true})); rect(g,6,2,9,4,P(colour||"#7a8aa8","a")); rect(g,3,8,12,8,gold); }
    if(type==="accessory"){ ellipse(g,8,9,4.5,4.5,gold); ellipse(g,8,9,2,2,{c:null}); g[9][8]=null; ellipse(g,8,4,2,2,P(colour||"#ff6f91","gem",{hi:true})); }
    if(type==="crystal"){ tri(g,8,1,3,7,13,7,P("#9be7ff","c",{hi:true})); tri(g,3,7,13,7,8,15,P("#5fb4e6","c2")); }
    // clean any null-colour placeholders
    for(const r of g) for(let i=0;i<r.length;i++) if(r[i]&&r[i].c===null) r[i]=null;
    const url=toURL(g, 4); cache.set(key,url); return url;
  }

  return {chibi, monster, icon, img:(src,cls="",alt="")=>`<img class="px ${cls}" src="${src}" alt="${alt}">`};
})();
