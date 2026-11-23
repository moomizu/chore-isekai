/* ================= In-app camera: live viewfinder only, no gallery ================= */

/** Opens the camera and resolves with a JPEG Blob, or null if the player cancels. */
function takePhoto(){
  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
    return liveCamera().catch(() => captureFallback());
  }
  return captureFallback();
}
function liveCamera(){
  return new Promise(async (resolve, reject) => {
    let stream;
    try{
      stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}, width:{ideal:1600}, height:{ideal:1600}}, audio:false});
    }catch(e){ reject(e); return; }
    const box = document.createElement("div");
    box.className = "camfx";
    box.innerHTML = `<video playsinline autoplay muted></video>
      <div class="camui"><p class="note">Show the finished job, then snap!</p>
        <div class="cambtns"><button class="gbtn plain" data-cam="cancel">Cancel</button><button class="snap" data-cam="snap" aria-label="Take photo"></button><span></span></div></div>`;
    document.getElementById("app").appendChild(box);
    const video = box.querySelector("video"), snap = box.querySelector("[data-cam=snap]"), tip = box.querySelector(".camui .note");
    video.srcObject = stream;
    // Laptop webcams show black frames for a moment while they wake up, so keep the snap button off until real frames arrive
    let ready = false; snap.disabled = true; tip.textContent = "Waking up the camera…";
    const warm = () => { if(ready) return; setTimeout(() => { ready = true; snap.disabled = false; tip.textContent = "Show the finished job, then snap!"; }, 700); };
    video.addEventListener("playing", warm, {once:true});
    video.play().catch(()=>{}); setTimeout(warm, 2500);   // some browsers never fire "playing" for autoplay
    const stop = () => { stream.getTracks().forEach(t=>t.stop()); box.remove(); };
    const isBlack = c => {   // sample the frame: is it (almost) all black?
      const x = c.getContext("2d"), d = x.getImageData(0, 0, c.width, c.height).data; let sum = 0, n = 0;
      for(let i = 0; i < d.length; i += 4*97){ sum += d[i] + d[i+1] + d[i+2]; n++; }
      return sum / (n*3) < 10;
    };
    box.addEventListener("click", e => {
      const b = e.target.closest("[data-cam]"); if(!b) return;
      if(b.dataset.cam==="cancel"){ stop(); resolve(null); return; }
      const w = video.videoWidth, h = video.videoHeight;
      if(!ready || !w || !h) return;
      const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(video, 0, 0, w, h);
      if(isBlack(c)){ tip.textContent = "That came out black. Is the camera covered, or still waking up? Try again!"; return; }
      box.classList.add("flash");
      stop(); resolve(c);   // hand over the canvas itself: drawing canvas-to-canvas is reliable in every browser
    });
  });
}
/** Fallback when the live camera isn't available: the phone's own camera app (no gallery option offered). */
function captureFallback(){
  return new Promise(resolve => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*"; inp.setAttribute("capture", "environment");
    inp.onchange = () => { const f = inp.files && inp.files[0]; resolve(f && (!f.lastModified || Date.now()-f.lastModified < 5*60*1000) ? f : (f ? "old" : null)); };
    inp.click();
  });
}

/* ---------- privacy: a reminder before every photo, and a cover-up tool after ---------- */
function photoReminder(extra){
  return new Promise(resolve => {
    const box = document.createElement("div"); box.className = "camfx privacy";
    box.innerHTML = `<div class="pv-card"><div class="pv-ico">📸🙅</div>
      <p><b>Quick reminder:</b> no people or faces in proof photos, <b>including your own</b> (no selfies or mirror shots), and nothing private like IDs, cards or screens with personal info. Just show the finished task!${extra?`<br><small>${extra}</small>`:""}</p>
      <div class="pv-btns"><button class="gbtn plain sm" id="pvNo">Cancel</button><button class="gbtn" id="pvOk">Got it</button></div></div>`;
    document.getElementById("app").appendChild(box);
    box.querySelector("#pvOk").onclick = () => { box.remove(); resolve(true); };
    box.querySelector("#pvNo").onclick = () => { box.remove(); resolve(false); };
  });
}
/** Lets the player paint over faces or private bits before the photo is sent. Resolves with the edited image (or the original). */
async function loadPicture(src){
  if(src instanceof HTMLCanvasElement) return src;
  const url = URL.createObjectURL(src);
  try{
    const img = new Image(); img.src = url;
    if(img.decode) await img.decode(); else await new Promise((ok, no) => { img.onload = ok; img.onerror = no; });
    return img;   // the url is revoked later, once the picture has been drawn
  }catch(e){
    if(window.createImageBitmap){ try{ return await createImageBitmap(src); }catch(e2){} }
    throw e;
  }finally{ setTimeout(() => URL.revokeObjectURL(url), 5000); }
}
const toFile = canvas => new Promise(res => canvas.toBlob(b => res(b ? new File([b], "proof.jpg", {type:"image/jpeg", lastModified:Date.now()}) : null), "image/jpeg", .9));
function drewSomething(ctx, w, h){   // a properly drawn photo is opaque; a failed draw leaves the canvas transparent
  try{ const d = ctx.getImageData(0, 0, w, h).data; for(let i = 3; i < d.length; i += 4*211) if(d[i] > 0) return true; return false; }catch(e){ return true; }
}
/** Lets the player paint over faces or private bits before the photo is sent. Resolves with the edited image as a File, or null to retake. */
async function censorPhoto(src){
  let pic;
  try{ pic = await loadPicture(src); }catch(e){ return src instanceof HTMLCanvasElement ? toFile(src) : src; }
  const pw = pic.naturalWidth || pic.width, ph = pic.naturalHeight || pic.height;
  return new Promise(resolve => {
      const max = 1280, s = Math.min(1, max/Math.max(pw, ph));
      const box = document.createElement("div"); box.className = "camfx censor";
      box.innerHTML = `<p class="cz-tip">✏️ Cover any faces, people or private info. Keep enough of the photo visible to show the task is done!</p>
        <div class="cz-wrap"><canvas id="czCan"></canvas></div>
        <div class="cz-tools"><span>Brush</span>${[["S",14],["M",30],["L",56]].map(([l,w],i)=>`<button class="chip ${i===1?"on":""}" data-w="${w}">${l}</button>`).join("")}
          <button class="chip" id="czUndo">↩ Undo</button><button class="chip" id="czClear">Reset</button></div>
        <div class="pv-btns"><button class="gbtn plain" id="czBack">Retake</button><button class="gbtn" id="czDone">✔ Use this photo</button></div>`;
      document.getElementById("app").appendChild(box);
      const c = box.querySelector("#czCan"); c.width = Math.max(1, Math.round(pw*s)); c.height = Math.max(1, Math.round(ph*s));
      const x = c.getContext("2d");
      const paint = () => { x.fillStyle = "#000"; x.fillRect(0, 0, c.width, c.height); x.drawImage(pic, 0, 0, c.width, c.height); };
      paint();
      if(!drewSomething(x, c.width, c.height)) requestAnimationFrame(paint);   // some browsers need one more frame
      const hist = []; let w = 30, drawing = false, last = null;
      const pos = e => { const r = c.getBoundingClientRect(); return [(e.clientX-r.left)*c.width/r.width, (e.clientY-r.top)*c.height/r.height]; };
      const scale = () => c.width / c.getBoundingClientRect().width;
      const dot = (a,b) => { x.strokeStyle="#111"; x.fillStyle="#111"; x.lineCap="round"; x.lineWidth=w*scale();
        if(a){ x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); } else { x.beginPath(); x.arc(b[0],b[1],w*scale()/2,0,Math.PI*2); x.fill(); } };
      c.onpointerdown = e => { e.preventDefault(); c.setPointerCapture(e.pointerId); hist.push(x.getImageData(0,0,c.width,c.height)); if(hist.length>20) hist.shift(); drawing=true; last=pos(e); dot(null,last); };
      c.onpointermove = e => { if(!drawing) return; const p=pos(e); dot(last,p); last=p; };
      c.onpointerup = c.onpointercancel = () => { drawing=false; last=null; };
      box.querySelectorAll("[data-w]").forEach(b => b.onclick = () => { w=+b.dataset.w; box.querySelectorAll("[data-w]").forEach(o=>o.classList.toggle("on", o===b)); });
      box.querySelector("#czUndo").onclick = () => { const h=hist.pop(); if(h) x.putImageData(h,0,0); };
      box.querySelector("#czClear").onclick = () => { if(hist.length){ x.putImageData(hist[0],0,0); hist.length=0; } else paint(); };
      box.querySelector("#czBack").onclick = () => { box.remove(); resolve(null); };
      box.querySelector("#czDone").onclick = async () => { const f = await toFile(c); box.remove(); resolve(f || (src instanceof HTMLCanvasElement ? await toFile(src) : src)); };
  });
}
/** Reminder -> camera -> cover-up tool. Returns a File, "old", or null. */
async function proofShot(extra){
  if(!(await photoReminder(extra))) return null;
  const shot = await takePhoto();
  if(!shot || shot==="old") return shot;
  return await censorPhoto(shot);
}
