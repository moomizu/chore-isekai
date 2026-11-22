/* ================= "Support the guild" rewarded ads (Android app only) =================
   Uses @capacitor-community/admob. Every ad request is tagged child-directed and capped at G-rated content,
   so no personalised or grown-up ads are ever shown. The player opts in to each ad with its own button tap.
   Before release: replace the TEST ids below with your own from admob.google.com (see README). */

const ADS_CFG = {
  rewardedId: "ca-app-pub-3940256099942544/5224354917",   // Google's TEST rewarded ad unit. Swap for yours before release.
  testing: true,                                           // set to false with your real id
  reward: 10,                                              // 💎 per ad
  perDay: 3
};

const Ads = (() => {
  let ready=false, busy=false, initd=false;
  const plugin = () => { const C=window.Capacitor; return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.AdMob; };
  const S = () => { const t=dayKey(); if(!state.ads || state.ads.day!==t) state.ads={day:t, n:0}; return state.ads; };
  const left = () => Math.max(0, ADS_CFG.perDay - S().n);

  async function init(){
    const A=plugin(); if(!A || initd) return; initd=true;
    try{
      await A.initialize({
        initializeForTesting: ADS_CFG.testing,
        tagForChildDirectedTreatment: true,   // no personalised ads, for everyone
        tagForUnderAgeOfConsent: true,
        maxAdContentRating: "General"          // G-rated ads only
      });
      prepare();
    }catch(e){ initd=false; }
  }
  async function prepare(){
    const A=plugin(); if(!A || ready) return;
    try{ await A.prepareRewardVideoAd({adId: ADS_CFG.rewardedId, isTesting: ADS_CFG.testing}); ready=true; }catch(e){ ready=false; }
    if(tab==="gacha") render();
  }
  async function watch(){
    const A=plugin(); if(!A || busy) return;
    if(!left()){ toast("That's all the ads for today. Thank you for supporting the guild! 💕"); return; }
    if(!ready){ toast("No ad is ready yet. Try again in a moment!"); prepare(); return; }
    busy=true; ready=false;
    try{
      const r = await A.showRewardVideoAd();   // resolves with the reward once the ad has been watched
      if(r){ S().n++; state.crystals=(state.crystals||0)+ADS_CFG.reward; save(); renderHUD();
        say(`Thank you for supporting the guild! Here's ${ADS_CFG.reward} 💎~`); toast(`+${ADS_CFG.reward} 💎`); }
    }catch(e){ toast("The ad didn't finish, so no crystals this time."); }
    busy=false; prepare(); render();
  }
  function card(){
    if(!plugin()) return "";   // the website has no ads
    const l=left();
    return `<div class="earn adearn"><span>☕ Support the guild<small>Watch a short ad. ${l} of ${ADS_CFG.perDay} left today</small></span>
      <button class="gbtn sm" data-act="ad-watch" ${!l||!ready?"disabled":""}>${!l?"Done for today":ready?`▶ Watch ad · +${ADS_CFG.reward} 💎`:"Loading ad…"}</button></div>`;
  }
  return {init, watch, card};
})();
