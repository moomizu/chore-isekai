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
    const video = box.querySelector("video"); video.srcObject = stream;
    const stop = () => { stream.getTracks().forEach(t=>t.stop()); box.remove(); };
    box.addEventListener("click", e => {
      const b = e.target.closest("[data-cam]"); if(!b) return;
      if(b.dataset.cam==="cancel"){ stop(); resolve(null); return; }
      const w = video.videoWidth, h = video.videoHeight;
      if(!w || !h) return;
      const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(video, 0, 0, w, h);
      box.classList.add("flash");
      c.toBlob(blob => { stop(); resolve(blob); }, "image/jpeg", .9);
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
function censorPhoto(file){
  return new Promise(resolve => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const max = 1280, s = Math.min(1, max/Math.max(img.width, img.height));
      const box = document.createElement("div"); box.className = "camfx censor";
      box.innerHTML = `<p class="cz-tip">✏️ Cover any faces, people or private info. Keep enough of the photo visible to show the task is done!</p>
        <div class="cz-wrap"><canvas id="czCan"></canvas></div>
        <div class="cz-tools"><span>Brush</span>${[["S",14],["M",30],["L",56]].map(([l,w],i)=>`<button class="chip ${i===1?"on":""}" data-w="${w}">${l}</button>`).join("")}
          <button class="chip" id="czUndo">↩ Undo</button><button class="chip" id="czClear">Reset</button></div>
        <div class="pv-btns"><button class="gbtn plain" id="czBack">Retake</button><button class="gbtn" id="czDone">✔ Use this photo</button></div>`;
      document.getElementById("app").appendChild(box);
      const c = box.querySelector("#czCan"); c.width = Math.round(img.width*s); c.height = Math.round(img.height*s);
      const x = c.getContext("2d"); x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
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
      box.querySelector("#czClear").onclick = () => { if(hist.length){ x.putImageData(hist[0],0,0); hist.length=0; } };
      box.querySelector("#czBack").onclick = () => { box.remove(); resolve(null); };
      box.querySelector("#czDone").onclick = () => c.toBlob(b => { box.remove(); resolve(b ? new File([b], "proof.jpg", {type:"image/jpeg", lastModified:Date.now()}) : file); }, "image/jpeg", .9);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}
/** Reminder -> camera -> cover-up tool. Returns a File, "old", or null. */
async function proofShot(extra){
  if(!(await photoReminder(extra))) return null;
  const shot = await takePhoto();
  if(!shot || shot==="old") return shot;
  return await censorPhoto(shot);
}
