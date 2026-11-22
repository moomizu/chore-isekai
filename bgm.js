/* ================= Background music & ambience (all synthesised, no audio files) =================
   hall:   soft warm pads, distant chimes, a crackling hearth (menus, guild hall, library, story)
   tavern: rowdy 6/8 jig with a lute, bass and tambourine (Recruit)
   gather: cozy music box arpeggios with birdsong (gathering)
   Battles and the focus timer have their own music, so this steps aside for them. */

const BGM = (() => {
  let ctx=null, master=null, cur=null, want=null, storyMood=null;
  let on = true; try{ on = localStorage.getItem("guild-bgm")!=="off"; }catch(e){}
  const mtof = m => 440*Math.pow(2,(m-69)/12);
  function init(){
    if(ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination); return true;
  }
  /* --- instruments: each plays into the track's own bus --- */
  function osc(bus, m, t, dur, type, vol, att, rel, detune){
    const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type; o.frequency.value=mtof(m); if(detune) o.detune.value=detune;
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+att); g.gain.setTargetAtTime(0,t+att+dur*.2,rel);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t+att+dur+rel*5);
  }
  function pluck(bus, m, t, vol, type, decay){
    const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type||"triangle"; o.frequency.value=mtof(m);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+(decay||.35)); o.connect(g); g.connect(bus); o.start(t); o.stop(t+(decay||.35)+.05);
  }
  function bell(bus, m, t, vol){   // music box: sine + quiet overtone, long ring
    pluck(bus, m, t, vol, "sine", 1.6); pluck(bus, m+12, t, vol*.25, "sine", .6);
  }
  let noiseBuf=null;
  function noise(bus, t, dur, vol, type, f, q){
    if(!noiseBuf){ const n=ctx.sampleRate; noiseBuf=ctx.createBuffer(1,n,n); const d=noiseBuf.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; }
    const s=ctx.createBufferSource(); s.buffer=noiseBuf; const fl=ctx.createBiquadFilter(); fl.type=type; fl.frequency.value=f; if(q) fl.Q.value=q;
    const g=ctx.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(fl); fl.connect(g); g.connect(bus); s.start(t, Math.random()*.5); s.stop(t+dur+.02);
  }
  function chirp(bus, t, vol){   // little bird: 2-3 quick upward sweeps
    const n=2+(Math.random()*2|0), base=2400+Math.random()*1400;
    for(let i=0;i<n;i++){ const o=ctx.createOscillator(), g=ctx.createGain(), tt=t+i*.11;
      o.type="sine"; o.frequency.setValueAtTime(base,tt); o.frequency.exponentialRampToValueAtTime(base*1.5,tt+.06);
      g.gain.setValueAtTime(0,tt); g.gain.linearRampToValueAtTime(vol,tt+.01); g.gain.exponentialRampToValueAtTime(.0001,tt+.08);
      o.connect(g); g.connect(bus); o.start(tt); o.stop(tt+.1); }
  }
  const rnd = a => a[(Math.random()*a.length)|0];

  /* --- tracks: step() is called once per step; stepLen in seconds --- */
  const TRACKS = {
    hall: {vol:.6, stepLen:.3, lp:2600, step(bus, s, t){   // easygoing, cheerful: I-V-vi-IV with a bouncy keys groove
      const CH=[[60,64,67,71],[55,59,62,67],[57,60,64,67],[53,57,60,64]], bar=Math.floor(s/8), pos=s%8, ch=CH[bar%4];
      if(pos===0) pluck(bus, ch[0]-24, t, .14, "triangle", .5);
      if(pos===3) pluck(bus, ch[0]-17, t, .09, "triangle", .3);
      if(pos===4) pluck(bus, ch[0]-24, t, .1, "triangle", .45);
      if(pos===6) pluck(bus, ch[0]-22+(bar%2?2:0), t, .07, "triangle", .3);
      if(pos===2||pos===6) ch.slice(1).forEach((m,i)=>{ pluck(bus, m, t+i*.012, .026, "triangle", .45); pluck(bus, m+12, t+i*.012, .006, "sine", .3); });
      if(pos===0) noise(bus, t, .12, .06, "lowpass", 180);              // soft kick
      if(pos===4) noise(bus, t, .07, .025, "bandpass", 2200, 1.2);      // rim tap
      noise(bus, t+(pos%2?.03:0), .04, pos%2?.008:.014, "highpass", 7500);   // shaker
      const PHR=[[0,null,2,null,4,null,2,null],[4,null,5,4,2,null,null,null],[null,null,2,4,5,null,4,null],[2,null,1,null,0,null,null,null]];
      const SC=[72,74,76,77,79,81,83,84], ph=Math.floor(bar/4)%4, nt=PHR[bar%4][pos];
      if(ph%2===0 && nt!=null) bell(bus, SC[(nt+[0,4,5,3][bar%4])%8], t, .03);   // a little celesta tune every other phrase
    }},
    tavern: {vol:.6, stepLen:.155, lp:3200, step(bus, s, t){   // 6/8: 6 steps per bar
      const CH=[[50,54,57],[55,59,62],[57,61,64],[50,54,57],[47,50,54],[55,59,62],[57,61,64],[50,54,57]];
      const SCALE=[74,76,78,79,81,83,85,86];
      const bar=Math.floor(s/6), pos=s%6, ch=CH[bar%8];
      if(pos===0) pluck(bus, ch[0]-24, t, .16, "triangle", .3);
      if(pos===3) pluck(bus, ch[2]-24, t, .12, "triangle", .25);
      if(pos===1||pos===2||pos===4||pos===5) ch.forEach(m=>pluck(bus, m, t, .025, "square", .09));
      if(pos===0||pos===3) noise(bus, t, .08, .09, "highpass", 6500);   // tambourine
      else noise(bus, t, .03, .03, "highpass", 8000);
      if(pos===3 && bar%2) noise(bus, t, .1, .08, "bandpass", 1500, 1);  // clap
      if(!this.mel) this.mel=4;
      if(Math.random()<.78){ this.mel=Math.max(0,Math.min(SCALE.length-1,this.mel+rnd([-2,-1,-1,1,1,2,0]))); if(pos===0) this.mel=SCALE.indexOf(ch[0]+24)>=0?SCALE.indexOf(ch[0]+24):this.mel;
        pluck(bus, SCALE[this.mel], t, .06, "triangle", .22); pluck(bus, SCALE[this.mel]+12, t, .012, "sawtooth", .08); }
      if(Math.random()<.025) noise(bus, t, .6, .025, "bandpass", 900, .7);   // crowd cheer swell
    }},
    gather: {vol:.3, stepLen:.36, lp:2600, step(bus, s, t){
      const CH=[[67,71,74,79],[64,67,71,76],[60,64,67,72],[62,66,69,74]], bar=Math.floor(s/8), pos=s%8, ch=CH[bar%4];
      const ARP=[0,1,2,3,2,1,2,3];
      bell(bus, ch[ARP[pos]]+(pos===3?12:0), t, .05);
      if(pos===0){ osc(bus, ch[0]-24, t, 2.6, "sine", .07, .3, .9); osc(bus, ch[1]-12, t, 2.6, "triangle", .02, .6, .9); }
      if(pos===4) osc(bus, ch[2]-24, t, 1.2, "sine", .04, .2, .6);
      if(Math.random()<.07) chirp(bus, t+Math.random()*.3, .025);
      if(pos%2===0) noise(bus, t, 1.2, .004, "bandpass", 900, .5);   // gentle breeze
    }},
    /* ---------- story moods ---------- */
    calm: {vol:.3, stepLen:.42, lp:2000, step(bus, s, t){
      const CH=[[53,57,60,64],[55,59,62,65],[52,55,59,62],[57,60,64,67]], bar=Math.floor(s/8), pos=s%8, ch=CH[bar%4];
      const ARP=[0,2,1,3,2,1,3,2];
      pluck(bus, ch[ARP[pos]]+12, t, .035, "triangle", .9); if(pos%2===0) pluck(bus, ch[ARP[pos]]+24, t, .008, "sine", .6);
      if(pos===0) osc(bus, ch[0]-12, t, 2.6, "sine", .08, .05, .8);
      if(pos===4) osc(bus, ch[2]-12, t, 1.6, "sine", .05, .05, .6);
    }},
    happy: {vol:.7, stepLen:.26, lp:3000, step(bus, s, t){   // pizzicato bounce
      const CH=[[65,69,72],[70,74,77],[72,76,79],[65,69,72]], bar=Math.floor(s/8), pos=s%8, ch=CH[bar%4];
      if(pos%4===0) pluck(bus, ch[0]-24, t, .14, "triangle", .22);
      if(pos%4===2) ch.forEach(m=>pluck(bus, m, t, .03, "triangle", .12));
      const MEL=[2,null,1,0,1,null,2,null], SC=[77,79,81,82,84,86,88];
      if(MEL[pos]!=null) pluck(bus, SC[(MEL[pos]+[0,3,4,0][bar%4])%7], t, .045, "triangle", .18);
      noise(bus, t, .03, pos%2?.006:.012, "highpass", 8000);
    }},
    mystic: {vol:.3, stepLen:.55, lp:4200, step(bus, s, t){   // goddess shimmer
      const CH=[[64,68,71,75],[66,69,73,78],[64,68,71,76],[61,64,68,73]], bar=Math.floor(s/8), pos=s%8, ch=CH[bar%4];
      if(pos===0) ch.forEach((m,i)=>{ osc(bus, m, t+i*.15, 4, "sine", .03, 1.6, 1.8, i%2?7:-7); });
      if(pos===0) osc(bus, ch[0]-24, t, 4.2, "sine", .06, 1.2, 1.6);
      if(Math.random()<.55){ const m=ch[(Math.random()*4)|0]+24; bell(bus, m, t, .022); bell(bus, m, t+.27, .009); }
    }},
    tense: {vol:.65, stepLen:.21, lp:1500, step(bus, s, t){   // low pulse, minor stabs
      const R=[38,38,41,36], bar=Math.floor(s/16), pos=s%16, r=R[bar%4];
      pluck(bus, r-12, t, pos%4===0?.16:.08, "sawtooth", .16);
      if(pos===0) [r+12,r+15,r+19].forEach(m=>osc(bus, m, t, 1.2, "sawtooth", .012, .02, .5));
      if(pos===0||pos===10) noise(bus, t, .25, .12, "lowpass", 140);   // low drum
      if(pos===8) osc(bus, r+24+(bar%2?1:0), t, 1.4, "triangle", .02, .3, .4);
    }},
    sad: {vol:.3, stepLen:.48, lp:1800, step(bus, s, t){   // slow piano
      const CH=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]], bar=Math.floor(s/8), pos=s%8, ch=CH[bar%4];
      const ARP=[0,1,2,1,2,1,0,1];
      pluck(bus, ch[ARP[pos]]+12, t, .04, "triangle", 1.4); pluck(bus, ch[ARP[pos]]+12, t, .012, "sine", 1.8);
      if(pos===0) osc(bus, ch[0]-12, t, 3.4, "sine", .07, .1, 1);
      if(pos===0) ch.forEach(m=>osc(bus, m, t, 3.6, "sine", .012, 1.2, 1.4));
    }}
  };
  function startTrack(name){
    const T=TRACKS[name], bus=ctx.createGain(), lp=ctx.createBiquadFilter();
    lp.type="lowpass"; lp.frequency.value=T.lp; bus.connect(lp); lp.connect(master);
    const out=bus; out.gain.setValueAtTime(0,ctx.currentTime); out.gain.linearRampToValueAtTime(T.vol,ctx.currentTime+1.5);
    const tr={name, bus:out, step:0, next:ctx.currentTime+.1, T:Object.create(T)};
    tr.timer=setInterval(()=>{ while(tr.next < ctx.currentTime+.25){ try{ tr.T.step(tr.bus, tr.step, tr.next); }catch(e){} tr.next+=T.stepLen; tr.step++; } }, 80);
    return tr;
  }
  function stopTrack(tr){
    if(!tr) return; clearInterval(tr.timer); const t=ctx.currentTime;
    tr.bus.gain.cancelScheduledValues(t); tr.bus.gain.setValueAtTime(tr.bus.gain.value,t); tr.bus.gain.linearRampToValueAtTime(0,t+1.2);
    setTimeout(()=>{ try{ tr.bus.disconnect(); }catch(e){} }, 1500);
  }
  function apply(){
    const name = on ? want : null;
    if(cur && cur.name===name) return;
    if(!name){ if(cur){ stopTrack(cur); cur=null; } return; }
    if(!init()) return; if(ctx.state==="suspended") ctx.resume();
    if(cur) stopTrack(cur);
    cur = startTrack(name);
  }
  /** Work out what should be playing right now */
  function pick(){
    if(document.hidden || $("title") || window.inspectMode) return null;
    if($("vn")) return storyMood && storyMood!=="none" && TRACKS[storyMood] ? storyMood : null;   // story scenes pick their own
    if(typeof G!=="undefined" && G) return G.L && G.L.game==="dig" ? "calm" : "gather";
    if((typeof B!=="undefined" && B && !B.over) || ($("arena") && $("arena").classList.contains("show"))) return null;
    if(typeof LoFi!=="undefined" && LoFi.playing) return null;
    if(tab==="gacha") return "tavern";
    return "hall";
  }
  function update(){ want = pick(); apply(); }
  setInterval(()=>{ if(typeof state!=="undefined" && state) update(); }, 700);
  document.addEventListener("visibilitychange", () => update());
  return {
    get on(){ return on; },
    story(mood){ storyMood = mood; update(); },
    toggle(){ on=!on; try{ localStorage.setItem("guild-bgm", on?"on":"off"); }catch(e){} update(); },
    update,
    _dbg: () => ({ctx, master, cur: cur && cur.name})
  };
})();
