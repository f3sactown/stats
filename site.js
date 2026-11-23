// Shared by every page: version number, page footer and the Light / Dark / System switch.
const APP_VERSION = "1.7.1";
const APP_BUILD = 14;

(function(){
  const foot=document.getElementById("foot");if(!foot)return;
  const ICON={
    light:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
    system:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>'};
  const opts=[["light","Light"],["dark","Dark"],["system","System"]];
  foot.innerHTML=`<div class="theme" id="theme" role="radiogroup" aria-label="Color theme">${opts.map(([k,l])=>`<button type="button" role="radio" data-theme="${k}" aria-checked="false">${ICON[k]}${l}</button>`).join("")}</div><p class="notes version">v${APP_VERSION} · build ${APP_BUILD}</p>`;
  const themeEl=document.getElementById("theme"),root=document.documentElement;
  function show(){const cur=root.dataset.theme||"system";themeEl.querySelectorAll("button").forEach(b=>b.setAttribute("aria-checked",b.dataset.theme===cur))}
  themeEl.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const t=b.dataset.theme;
    if(t==="system")delete root.dataset.theme;else root.dataset.theme=t;
    try{t==="system"?localStorage.removeItem("hm-theme"):localStorage.setItem("hm-theme",t)}catch(e){}
    show();document.dispatchEvent(new CustomEvent("themechange"))});
  themeEl.addEventListener("keydown",e=>{if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;const bs=[...themeEl.querySelectorAll("button")],i=bs.findIndex(b=>b.getAttribute("aria-checked")==="true"),n=bs[(i+(e.key==="ArrowRight"?1:2))%3];n.click();n.focus();e.preventDefault()});
  show();
})();
