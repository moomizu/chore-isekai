/* ================= Focus timer (Pomodoro + countdown) with lo-fi focus music =================
   Runs off an end timestamp, so it stays right even if the phone sleeps. Study quests stay trust quests:
   the timer is a helper, and the minutes show up in your journal. */

const LoFi = (() => {
  let ctx=null, out=null, lp=null, crackle=null, timer=0, nextT=0, step=0, playing=false;
  const BPM = 70, mtof = m => 440*Math.pow(2,(m-69)/12);
  const CHORDS = [[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]];   // Fmaj7 Em7 Dm7 Cmaj7
  const PENTA = [72,74,76,79,81,84];
  function init(){
    if(ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return false;
    ctx = new AC(); out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination);
    lp = ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=1400; lp.Q.value=.4; lp.connect(out);
    return true;
  }
  function note(m, t, dur, type, vol, attack){
    const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type; o.frequency.value=mtof(m); o.detune.value=(Math.random()-.5)*8;
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+(attack||.02)); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g); g.connect(lp); o.start(t); o.stop(t+dur+.05);
  }
  function thump(t, v){
    const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.setValueAtTime(110,t); o.frequency.exponentialRampToValueAtTime(40,t+.15);
    g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.001,t+.25); o.connect(g); g.connect(lp); o.start(t); o.stop(t+.3);
  }
  function hiss(t, dur, v, f){
    const len=Math.ceil(ctx.sampleRate*dur), b=ctx.createBuffer(1,len,ctx.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=(Math.random()*2-1);
    const s=ctx.createBufferSource(); s.buffer=b; const hp=ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=f||6000;
    const g=ctx.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.001,t+dur);
    s.connect(hp); hp.connect(g); g.connect(out); s.start(t);
  }
  function vinyl(){   // soft looping crackle bed
    const len=ctx.sampleRate*2, b=ctx.createBuffer(1,len,ctx.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<len;i++) d[i] = Math.random()<.0009 ? (Math.random()*2-1)*.8 : (Math.random()*2-1)*.012;
    crackle=ctx.createBufferSource(); crackle.buffer=b; crackle.loop=true; const g=ctx.createGain(); g.gain.value=.5;
    crackle.connect(g); g.connect(out); crackle.start();
  }
  function play(s, t){
    const e=60/BPM/2, pos=s%8, bar=Math.floor(s/8), ch=CHORDS[bar%4];
    if(pos===0) ch.forEach((m,i)=>note(m, t+i*.03, e*8.2, "triangle", .05, .25));     // lazy strummed pad
    if(pos===0||pos===5) thump(t, .5);
    if(pos===2||pos===6) hiss(t, .09, .05, 2500);
    hiss(t + (pos%2 ? e*.12 : 0), .03, .025);                                            // swung hats
    if(pos===0) note(ch[0]-12, t, e*3.5, "sine", .12, .02);
    if(pos===4) note(ch[2]-12, t, e*3.5, "sine", .09, .02);
    if((pos===3||pos===6||pos===1) && Math.random()<.45) note(PENTA[(Math.random()*PENTA.length)|0], t, e*2, "sine", .035, .01);
  }
  function sched(){ while(nextT < ctx.currentTime+.2){ play(step, nextT); nextT += 60/BPM/2; step++; } }
  return {
    get playing(){ return playing; },
    start(){
      if(playing || !init()) return; if(ctx.state==="suspended") ctx.resume();
      playing=true; step=0; nextT=ctx.currentTime+.1; vinyl();
      out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setValueAtTime(0,ctx.currentTime); out.gain.linearRampToValueAtTime(.5,ctx.currentTime+2);
      clearInterval(timer); timer=setInterval(sched, 60);
    },
    stop(){
      if(!playing) return; playing=false; clearInterval(timer);
      const t=ctx.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value,t); out.gain.linearRampToValueAtTime(0,t+.8);
      const c=crackle; setTimeout(()=>{ try{ c&&c.stop(); }catch(e){} }, 900); crackle=null;
    },
    chime(){
      if(!init()) return; if(ctx.state==="suspended") ctx.resume();
      const t=ctx.currentTime+.05, was=out.gain.value; out.gain.setValueAtTime(Math.max(was,.5),t);
      [84,88,91,96].forEach((m,i)=>note(m, t+i*.14, 1.2, "sine", .14, .005));
      if(!playing) out.gain.setValueAtTime(0, t+2);
    }
  };
})();

const Focus = (() => {
  const F = () => state.focus || (state.focus = {mode:"pomo", work:25, brk:5, rounds:4, count:25, music:true, mins:{}});
  let run = null;   // {mode, phase:"work"|"break", round, ends, left, paused, total, quest}
  let tick = 0;
  const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
  const secsLeft = () => run ? Math.max(0, run.paused ? run.left : (run.ends - Date.now())/1000) : 0;

  function addMinutes(m){ if(m<=0) return; const f=F(), d=dayKey(); f.mins[d]=(f.mins[d]||0)+m; save(); }
  function phaseLen(){ const f=F(); return run.mode==="count" ? f.count : run.phase==="work" ? f.work : f.brk; }
  function begin(phase){
    run.phase=phase; run.total=phaseLen()*60; run.ends=Date.now()+run.total*1000; run.left=run.total; run.paused=false; run.done=false;
    if(F().music && Music.on && phase==="work") LoFi.start(); else if(phase!=="work") LoFi.stop();
    renotify();
  }
  /** Schedule a notification for when the current round ends (cancelled on pause/stop) */
  function renotify(){
    if(!run || run.phase==="idle" || run.paused || run.done){ Notify.timer(null); return; }
    const f=F(), last = run.mode==="count" || (run.phase==="work" && run.round>=f.rounds);
    const [t,b] = run.phase==="break" ? ["☕ Break's over!", `Time for focus round ${run.round+1}.`]
      : last ? ["🎉 Focus session complete!", "Great work! Come back and log it in the guild~"] : ["⏱️ Focus round done!", "Take a break. Stretch, sip some water~"];
    Notify.timer(run.ends, t, b);
  }
  function open(questId){
    if(run && !questId){ show(); return; }
    if(run && questId && run.quest!==questId){ toast("A focus timer is already running."); show(); return; }
    if(!run) run = {mode:F().mode, phase:"idle", round:1, quest:questId||null, paused:true, left:0, total:0};
    show();
  }
  function show(){
    let box=$("focus"); const f=F();
    if(!box){ box=document.createElement("div"); box.id="focus"; box.className="focus"; $("app").appendChild(box); }
    const q = run.quest ? findQuest(run.quest) : null, idle = run.phase==="idle";
    const left = idle ? (run.mode==="count"?f.count:f.work)*60 : secsLeft(), total = idle ? left : run.total;
    const pct = total ? 1-left/total : 0;
    const label = idle ? "Ready" : run.done ? "Done!" : run.mode==="count" ? "Focus" : run.phase==="work" ? `Focus ${run.round}/${f.rounds}` : "Break";
    const stepper = (k,n,min,max,stepv) => `<div class="fc-step"><span>${n}</span><button data-act="fc-adj" data-k="${k}" data-v="${-stepv}" ${f[k]<=min?"disabled":""}>−</button><b>${f[k]}</b><button data-act="fc-adj" data-k="${k}" data-v="${stepv}" ${f[k]>=max?"disabled":""}>+</button></div>`;
    box.innerHTML = `<div class="fc-top"><span class="fc-title">⏱️ Focus</span><button class="fc-x" data-act="fc-hide" aria-label="Hide timer">${idle?"✕":"▾ Hide"}</button></div>
      ${q?`<div class="fc-quest">📚 ${esc(q.title)}</div>`:""}
      ${idle?`<div class="fc-modes"><button class="${run.mode==="pomo"?"on":""}" data-act="fc-mode" data-v="pomo">🍅 Pomodoro</button><button class="${run.mode==="count"?"on":""}" data-act="fc-mode" data-v="count">⏳ Countdown</button></div>`:""}
      <div class="fc-ring ${run.phase==="break"?"brk":""}" style="--p:${(pct*360).toFixed(1)}deg"><div><small id="fcLab">${label}</small><b id="fcTime">${fmt(left)}</b></div></div>
      ${idle ? (run.mode==="pomo"
        ? `<div class="fc-set">${stepper("work","Focus (min)",5,90,5)}${stepper("brk","Break (min)",1,30,1)}${stepper("rounds","Rounds",1,8,1)}</div>`
        : `<div class="fc-set"><div class="fc-chips">${[5,10,15,25,45,60].map(m=>`<button class="${f.count===m?"on":""}" data-act="fc-set" data-v="${m}">${m}m</button>`).join("")}</div>${stepper("count","Minutes",1,180,1)}</div>`) : ""}
      <div class="fc-btns">
        ${idle?`<button class="gbtn" data-act="fc-start">▶ Start</button>`
          : run.done?`${q?`<button class="gbtn" data-act="fc-report">📜 Report "${esc(q.title)}"</button>`:""}<button class="gbtn ${q?"plain":""}" data-act="fc-stop">✔ Finish</button>`
          : `<button class="gbtn" data-act="fc-pause">${run.paused?"▶ Resume":"⏸ Pause"}</button>${run.mode==="pomo"?`<button class="gbtn plain" data-act="fc-skip">⏭ ${run.phase==="work"?"Skip to break":"Skip break"}</button>`:""}<button class="gbtn plain" data-act="fc-stop">⏹ Stop</button>`}
      </div>
      <button class="fc-music ${f.music?"on":""}" data-act="fc-music">${f.music?"🎵 Focus music on":"🔇 Focus music off"}${Music.on?"":" (game sound is muted)"}</button>
      <p class="note fc-note">${idle?"Keep the app open while you focus. Hide the timer to use the rest of the app.":"Minutes you focus are saved in your Journal."}</p>`;
    box.classList.add("show"); pill();
    clearInterval(tick); tick=setInterval(update, 500);
  }
  function hide(){ const b=$("focus"); if(b) b.classList.remove("show"); if(!run || run.phase==="idle"){ end(); return; } pill(); }
  function pill(){
    let p=$("focusPill");
    const shown = $("focus") && $("focus").classList.contains("show");
    if(!run || run.phase==="idle" || shown){ if(p) p.remove(); return; }
    if(!p){ p=document.createElement("button"); p.id="focusPill"; p.className="fc-pill"; p.onclick=()=>show(); $("app").appendChild(p); }
    p.textContent = `${run.phase==="break"?"☕":"⏱️"} ${run.done?"Done!":fmt(secsLeft())}`;
  }
  function update(){
    if(!run){ clearInterval(tick); return; }
    if(run.phase!=="idle" && !run.paused && !run.done && secsLeft()<=0) phaseDone();
    const t=$("fcTime"); if(t && run.phase!=="idle"){ const l=secsLeft(); t.textContent=fmt(l); const r=t.closest(".fc-ring"); if(r) r.style.setProperty("--p", ((1-l/run.total)*360).toFixed(1)+"deg"); }
    pill();
  }
  function phaseDone(){
    LoFi.chime(); try{ navigator.vibrate && navigator.vibrate([200,100,200]); }catch(e){}
    const f=F();
    if(run.phase==="work") addMinutes(Math.round(run.total/60));
    if(run.mode==="pomo" && run.phase==="work" && run.round<f.rounds){ begin("break"); toast("☕ Break time! Stretch, sip some water~"); }
    else if(run.mode==="pomo" && run.phase==="break"){ run.round++; begin("work"); toast(`⏱️ Focus round ${run.round}!`); }
    else { run.done=true; LoFi.stop(); Notify.timer(null); toast("🎉 Focus session complete!"); }
    show();
  }
  function end(){
    if(run && run.phase==="work" && !run.done && !run.paused){ const m=Math.floor((run.total-secsLeft())/60); addMinutes(m); }
    run=null; LoFi.stop(); clearInterval(tick); Notify.timer(null); const b=$("focus"); if(b) b.remove(); pill();
  }
  function act(a, b){
    const f=F(), v=b.dataset.v;
    if(a==="fc-mode"){ run.mode=v; f.mode=v; save(); show(); }
    else if(a==="fc-adj"){ const k=b.dataset.k, lim={work:[5,90],brk:[1,30],rounds:[1,8],count:[1,180]}[k]; f[k]=Math.max(lim[0],Math.min(lim[1],f[k]+(+v))); save(); show(); }
    else if(a==="fc-set"){ f.count=+v; save(); show(); }
    else if(a==="fc-start"){ run.round=1; begin("work"); show(); Notify.ensure("timer").then(()=>renotify()); }
    else if(a==="fc-pause"){ if(run.paused){ run.ends=Date.now()+run.left*1000; run.paused=false; if(f.music&&Music.on&&run.phase==="work") LoFi.start(); } else { run.left=secsLeft(); run.paused=true; LoFi.stop(); } renotify(); show(); }
    else if(a==="fc-skip"){ if(run.phase==="work"){ const m=Math.floor((run.total-secsLeft())/60); addMinutes(m); }
      if(run.phase==="work" && run.round<f.rounds) begin("break"); else if(run.phase==="break"){ run.round++; begin("work"); } else { run.done=true; LoFi.stop(); } show(); }
    else if(a==="fc-stop"){ end(); }
    else if(a==="fc-hide"){ hide(); }
    else if(a==="fc-report"){ const id=run.quest; end(); openReport(id); }
    else if(a==="fc-music"){ f.music=!f.music; save(); if(!f.music) LoFi.stop(); else if(run && run.phase==="work" && !run.paused && !run.done && Music.on) LoFi.start(); show(); }
    else return false;
    return true;
  }
  return {open, act, renotify, minutes: d => (F().mins||{})[d]||0, get running(){ return !!run && run.phase!=="idle"; }};
})();
