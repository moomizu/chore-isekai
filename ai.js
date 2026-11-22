/* ================= Bring-your-own-key AI (OpenRouter, Claude, OpenAI) =================
   Google Gemini was removed: its API terms don't allow apps likely to be used by under-18s.
   The key is stored only on this device and sent only to the provider the user picked. */

const AI_PROVIDERS = {
  openrouter: {n:"OpenRouter (many models)", model:"openrouter/free", keyUrl:"https://openrouter.ai/keys",
               note:"One key for many AI models. The default \"openrouter/free\" picks a free model that can see photos (about 50 free checks a day). You can also type any vision model name from openrouter.ai/models."},
  anthropic:  {n:"Claude (Anthropic)", model:"claude-haiku-5-5", keyUrl:"https://console.anthropic.com/settings/keys",
               note:"Paid per use. Small cost per photo check."},
  openai:     {n:"OpenAI", model:"gpt-4o-mini", keyUrl:"https://platform.openai.com/api-keys",
               note:"Paid per use. Small cost per photo check."},

};

const AI = (() => {
  let cfg = {provider:"openrouter", model:"", key:""};
  try{ cfg = {...cfg, ...JSON.parse(localStorage.getItem("guild-ai")||"{}")}; }catch(e){}
  if(!AI_PROVIDERS[cfg.provider]) cfg = {provider:"openrouter", model:"", key:""};   // old Gemini setups need a new key
  const persist = () => { try{ localStorage.setItem("guild-ai", JSON.stringify(cfg)); }catch(e){} };

  const blobToB64 = blob => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(String(r.result).split(",")[1]); r.onerror=rej; r.readAsDataURL(blob); });

  function parseJSON(text){
    if(!text) throw new Error("Empty reply from the AI");
    const m = text.match(/\{[\s\S]*\}/);
    if(!m) throw new Error("The AI didn't reply in the expected format");
    return JSON.parse(m[0]);
  }
  async function http(url, opts){
    const C = window.Capacitor;
    let r;
    try{
      if(C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.CapacitorHttp){
        // Inside the Android app: send natively so browser security rules (CORS) can't block it
        const res = await C.Plugins.CapacitorHttp.request({url, method:opts.method, headers:opts.headers, data:JSON.parse(opts.body)});
        const data = typeof res.data==="string" ? (()=>{ try{ return JSON.parse(res.data); }catch(e){ return {}; } })() : res.data;
        r = {ok: res.status>=200 && res.status<300, status: res.status, json: async () => data};
      } else r = await fetch(url, opts);
    }
    catch(e){ const err = new Error("Couldn't reach the AI. Check your internet connection."); err.code="network"; throw err; }
    if(!r.ok){
      let msg = ""; try{ const j = await r.json(); msg = (j.error && (j.error.message||j.error)) || j.message || ""; }catch(e){}
      const err = new Error(
        r.status===401||r.status===403 ? "The AI rejected your API key. Check it in Settings." :
        r.status===429 ? "You've hit your AI's rate limit. Try again in a bit." :
        r.status===404 ? `Model "${model()}" wasn't found. Check the model name in Settings.` :
        `AI error ${r.status}${msg?": "+String(msg).slice(0,140):""}`);
      err.code = r.status===429 ? "rate_limited" : "http"; throw err;
    }
    return r.json();
  }
  const model = () => cfg.model || AI_PROVIDERS[cfg.provider].model;

  async function ask(prompt, imageBlob){
    if(!cfg.key) { const e=new Error("No API key set. Add one in Settings."); e.code="no_key"; throw e; }
    const b64 = imageBlob ? await blobToB64(imageBlob) : null;
    const p = cfg.provider;
    if(p==="anthropic"){
      const content=[]; if(b64) content.push({type:"image", source:{type:"base64", media_type:"image/jpeg", data:b64}}); content.push({type:"text", text:prompt});
      const j = await http("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"content-type":"application/json","x-api-key":cfg.key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:model(), max_tokens:400, messages:[{role:"user", content}]})});
      return parseJSON((j.content||[]).map(x=>x.text||"").join(""));
    }
    // OpenAI and OpenRouter share the chat-completions format
    const url = p==="openrouter" ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
    const content=[{type:"text", text:prompt}]; if(b64) content.push({type:"image_url", image_url:{url:"data:image/jpeg;base64,"+b64}});
    const headers={"content-type":"application/json","authorization":"Bearer "+cfg.key};
    if(p==="openrouter"){ headers["X-Title"]="Chore Isekai"; }
    const j = await http(url, {method:"POST", headers, body:JSON.stringify({model:model(), max_tokens:400, messages:[{role:"user", content}]})});
    return parseJSON(((j.choices||[])[0]||{}).message?.content || "");
  }

  return {
    get cfg(){ return {...cfg}; },
    ready: () => !!cfg.key,
    model,
    set(next){ cfg = {...cfg, ...next}; persist(); },
    clearKey(){ cfg.key=""; persist(); },
    json: (prompt) => ask(prompt, null),
    vision: (prompt, blob) => ask(prompt, blob),
    async test(){ const r = await ask('Reply with JSON only: {"ok": true}', null); if(!r || r.ok!==true) throw new Error("The AI replied, but not as expected. Try another model."); return true; }
  };
})();
