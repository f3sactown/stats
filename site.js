// Shared by every page: version number, page tabs, branding from config.js,
// footer with the Light / Dark / System switch, and hover / tap tooltips.
const APP_VERSION = "1.9.0";
const APP_BUILD = 16;

const escHTML = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pageTitle = s => `${s} · ${BRAND}`;

// ⓘ button whose tooltip explains a card or chart (lines separated by \n)
function infoTip(text, what){
  return `<button type="button" class="info" data-tip="${escHTML(text)}" aria-label="${escHTML((what ? what + ": " : "") + text.replace(/\n/g, ". "))}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/></svg></button>`;
}
// "Workout data (Master Data): Post Date, AO Name" from config field keys
function colsUsed(tab, fields){ return `${CONFIG.tabs[tab]} tab · ${fields.map(f => CONFIG.cols[tab][f]).join(", ")}` }

(function(){
  // ---- Page tabs
  const nav = document.getElementById("tabs");
  if (nav){
    const page = document.body.dataset.page;
    const TABS = [
      ["heatmap", "./", "Heatmap", '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'],
      ["insights", "insights.html", "Insights", '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'],
      ["settings", "settings.html", "Settings", '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>']
    ];
    nav.innerHTML = TABS.map(([k,href,label,icon]) => `<a href="${href}"${k===page ? ' aria-current="page"' : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>${label}</a>`).join("");
  }

  // ---- Branding: org + region name, logo, website
  document.querySelectorAll("[data-brand]").forEach(el => el.textContent = BRAND);
  document.querySelectorAll(".brand").forEach(a => {
    a.href = CONFIG.website || "#"; a.setAttribute("aria-label", `${BRAND} home`);
    const img = a.querySelector("img"); if (!img) return;
    img.alt = `${BRAND} logo`;
    img.onerror = () => { if (!img.src.endsWith(DEFAULT_CONFIG.logo)) img.src = DEFAULT_CONFIG.logo };
    img.src = CONFIG.logo || DEFAULT_CONFIG.logo;
  });
  if (document.body.dataset.title) document.title = pageTitle(document.body.dataset.title);

  // ---- Footer: theme switch + version
  const foot = document.getElementById("foot"); if (!foot) return;
  const ICON = {
    light:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
    system:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>'};
  const opts = [["light","Light"],["dark","Dark"],["system","System"]];
  foot.innerHTML = `<div class="theme" id="theme" role="radiogroup" aria-label="Color theme">${opts.map(([k,l]) => `<button type="button" role="radio" data-theme="${k}" aria-checked="false">${ICON[k]}${l}</button>`).join("")}</div><p class="notes version">v${APP_VERSION} · build ${APP_BUILD}</p>`;
  const themeEl = document.getElementById("theme"), root = document.documentElement;
  function show(){ const cur = root.dataset.theme || "system"; themeEl.querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", b.dataset.theme === cur)) }
  themeEl.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; const t = b.dataset.theme;
    if (t === "system") delete root.dataset.theme; else root.dataset.theme = t;
    try { t === "system" ? localStorage.removeItem("hm-theme") : localStorage.setItem("hm-theme", t) } catch(e) {}
    show(); document.dispatchEvent(new CustomEvent("themechange")) });
  themeEl.addEventListener("keydown", e => { if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return; const bs = [...themeEl.querySelectorAll("button")], i = bs.findIndex(b => b.getAttribute("aria-checked") === "true"), n = bs[(i + (e.key === "ArrowRight" ? 1 : 2)) % 3]; n.click(); n.focus(); e.preventDefault() });
  show();
})();

// ---- Tooltips: any element with data-tip. Hover on desktop, tap on phones, focus for keyboards.
(function(){
  const tip = document.createElement("div"); tip.id = "tip"; tip.setAttribute("role", "tooltip"); document.body.appendChild(tip);
  let pinned = null;
  function place(x, y){
    const r = tip.getBoundingClientRect();
    let left = x + 12, top = y - r.height - 10;
    if (left + r.width > innerWidth - 8) left = Math.max(8, x - r.width - 12);
    if (top < 8) top = y + 18;
    tip.style.left = Math.max(8, Math.min(left, innerWidth - r.width - 8)) + "px"; tip.style.top = top + "px";
  }
  function show(el, x, y){
    document.querySelectorAll(".bar.on").forEach(b => b !== el && b.classList.remove("on"));
    el.classList.add("on"); tip.textContent = el.dataset.tip; tip.classList.add("on"); place(x, y);
  }
  function hide(){ tip.classList.remove("on"); pinned = null; document.querySelectorAll(".bar.on").forEach(b => b.classList.remove("on")) }
  const target = e => e.target.closest && e.target.closest("[data-tip]");
  document.addEventListener("pointermove", e => { if (e.pointerType !== "mouse") return; const el = target(e); if (el) show(el, e.clientX, e.clientY); else if (!pinned) hide() });
  document.addEventListener("pointerdown", e => { const el = target(e); if (el){ pinned = el; show(el, e.clientX, e.clientY) } else hide() });
  document.addEventListener("focusin", e => { const el = target(e); if (el && el.matches(".info")){ const r = el.getBoundingClientRect(); pinned = el; show(el, r.right, r.top) } });
  document.addEventListener("focusout", e => { if (target(e) === pinned) hide() });
  document.addEventListener("keydown", e => { if (e.key === "Escape") hide() });
  addEventListener("scroll", hide, {passive:true});
})();
