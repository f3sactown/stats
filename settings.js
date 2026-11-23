// Settings page: edit region, branding, sheet link, tab names and column headers.
// Saves to this browser (applies straight away) or downloads site-config.js to
// change the site for everyone.
const $ = id => document.getElementById(id);
const REQUIRED = { master: ["date","ao","pax","post"], sites: ["ao"], roster: ["name","joined"] };
const TAB_HINT = { master: "One row per PAX per workout.", sites: "One row per AO. Optional: adds day, city and Q-Source flags.", roster: "One row per PAX. Optional: adds join dates and home regions." };
const TAB_KEYS = Object.keys(DEFAULT_CONFIG.tabs);

// ---- Build the tab and column inputs
$("tabs-fields").innerHTML = TAB_KEYS.map(t =>
  `<label class="field"><span>${FIELD_INFO[t].label} tab${t === "master" ? ' <span class="req">*</span>' : ""}</span><input id="t-${t}" autocomplete="off"><small>${TAB_HINT[t]}</small></label>`).join("");
$("cols").innerHTML = TAB_KEYS.map(t => `<fieldset><legend id="lg-${t}">${escHTML(FIELD_INFO[t].label)}</legend><div class="fields">${
  Object.entries(FIELD_INFO[t].fields).map(([f, what]) =>
    `<label class="field" id="f-${t}-${f}"><span>${escHTML(what)}${REQUIRED[t].includes(f) ? ' <span class="req">*</span>' : ""}</span><input id="c-${t}-${f}" list="dl-${t}" autocomplete="off"><span class="st" id="s-${t}-${f}"></span></label>`).join("")
}</div><datalist id="dl-${t}"></datalist></fieldset>`).join("");

// ---- Fill from the settings in effect
function fill(cfg){
  document.querySelectorAll('input[name="org"]').forEach(r => r.checked = r.value === cfg.org);
  for (const k of ["region","website","logo","sheet"]) $(k).value = cfg[k];
  for (const t of TAB_KEYS){ $("t-" + t).value = cfg.tabs[t]; for (const f in cfg.cols[t]) $(`c-${t}-${f}`).value = cfg.cols[t][f] }
  preview(); clearChecks();
}
function read(){
  const cfg = { org: (document.querySelector('input[name="org"]:checked') || {}).value || "F3", tabs:{}, cols:{} };
  for (const k of ["region","website","logo","sheet"]) cfg[k] = $(k).value.trim();
  for (const t of TAB_KEYS){ cfg.tabs[t] = $("t-" + t).value.trim(); cfg.cols[t] = {}; for (const f in DEFAULT_CONFIG.cols[t]) cfg.cols[t][f] = $(`c-${t}-${f}`).value.trim() }
  return cfg;
}
function preview(){
  const c = read();
  $("brandPrev").textContent = `${c.org} ${c.region || "Region"}`;
  $("logoPrev").src = c.logo || DEFAULT_CONFIG.logo;
  for (const t of TAB_KEYS) $("lg-" + t).textContent = `${FIELD_INFO[t].label} · ${c.tabs[t] || "(tab name)"} tab`;
}
$("logoPrev").onerror = () => { if (!$("logoPrev").src.endsWith(DEFAULT_CONFIG.logo)) $("logoPrev").src = DEFAULT_CONFIG.logo };
$("form").addEventListener("input", e => { preview(); if (e.target.id === "sheet" || e.target.id.startsWith("t-")) clearChecks() });
$("form").addEventListener("change", preview);

// ---- Validation
function problems(c){
  const out = [];
  if (!c.region) out.push("Enter a region name.");
  if (!sheetIdOf(c.sheet)) out.push("The Google Sheet link doesn't look right. Paste the full link from the address bar.");
  if (!c.tabs.master) out.push("Enter the workout data tab name.");
  for (const t of TAB_KEYS) for (const f of REQUIRED[t]) if (!c.cols[t][f]) out.push(`Enter the column for “${FIELD_INFO[t].fields[f]}” (${FIELD_INFO[t].label}).`);
  return out;
}

// ---- Check sheet: read row 1 of each tab and match the configured headers
function clearChecks(){
  $("checks").innerHTML = ""; $("checkMsg").textContent = ""; $("checkMsg").className = "msg";
  document.querySelectorAll(".field .st").forEach(el => { el.textContent = ""; el.className = "st" });
  document.querySelectorAll(".field.bad").forEach(el => el.classList.remove("bad"));
}
$("check").addEventListener("click", async () => {
  const c = read(); clearChecks();
  if (!sheetIdOf(c.sheet)){ $("checkMsg").textContent = "Enter the Google Sheet link first."; $("checkMsg").className = "msg no"; return }
  $("check").disabled = true; $("checkMsg").textContent = "Checking…";
  const lines = []; let allGood = true;
  for (const t of TAB_KEYS){
    if (!c.tabs[t]) { lines.push([`${FIELD_INFO[t].label}: no tab name`, t === "master" ? "no" : "ok"]); continue }
    let rows;
    try { rows = await fetchCSV(csvUrl(c, c.tabs[t]) + "&tq=" + encodeURIComponent("select * limit 3")) }
    catch(e) { allGood = false; lines.push([`${c.tabs[t]}: couldn't read the sheet. Check the link and that it's shared as Anyone with the link.`, "no"]); continue }
    const hdr = (rows[0] || []).map(h => String(h).trim());
    $("dl-" + t).innerHTML = hdr.filter(Boolean).map(h => `<option value="${escHTML(h)}">`).join("");
    const lower = hdr.map(h => h.toLowerCase());
    let missing = 0, missingReq = 0;
    for (const f in c.cols[t]){
      const name = c.cols[t][f], st = $(`s-${t}-${f}`), fld = $(`f-${t}-${f}`);
      if (!name){ st.textContent = REQUIRED[t].includes(f) ? "required" : "not used"; st.className = "st" + (REQUIRED[t].includes(f) ? " no" : ""); continue }
      const ok = lower.includes(name.toLowerCase());
      st.textContent = ok ? "✓ found" : "✕ not found on this tab"; st.className = "st " + (ok ? "ok" : "no");
      if (!ok){ missing++; fld.classList.add("bad"); if (REQUIRED[t].includes(f)) missingReq++ }
    }
    if (missingReq) allGood = false;
    lines.push([`${c.tabs[t]}: ${hdr.filter(Boolean).length} columns found${missing ? `, ${missing} setting${missing === 1 ? "" : "s"} not matched${missingReq ? " (required)" : ""}` : ", all settings matched"}`, missingReq ? "no" : "ok"]);
  }
  $("checks").innerHTML = lines.map(([txt, cls]) => `<li class="${cls}">${escHTML(txt)}</li>`).join("");
  $("checkMsg").textContent = allGood ? "Looks good." : "Some settings need fixing. Google returns the first tab when a tab name is wrong, so a column mismatch can also mean a misspelled tab name.";
  $("checkMsg").className = "msg " + (allGood ? "ok" : "no");
  $("check").disabled = false;
});

// ---- Save / download / reset
function say(text, ok){ $("saveMsg").textContent = text; $("saveMsg").className = "msg " + (ok ? "ok" : "no") }
$("form").addEventListener("submit", e => {
  e.preventDefault();
  const c = read(), bad = problems(c);
  if (bad.length) return say(bad[0], false);
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(mergeConfig(DEFAULT_CONFIG, c))) } catch(err) { return say("This browser won't save settings (private mode?).", false) }
  document.querySelectorAll("[data-brand]").forEach(el => el.textContent = `${c.org} ${c.region}`);
  $("banner").hidden = false;
  say("Saved on this device. Heatmap and Insights now use these settings here.", true);
});
$("download").addEventListener("click", () => {
  const c = read(), bad = problems(c);
  if (bad.length) return say(bad[0], false);
  const cfg = mergeConfig(DEFAULT_CONFIG, c);
  const text = `// Site-wide settings: region, branding, which Google Sheet, tabs and columns to read.
// Everyone sees these. The Settings page can override them on one device, and its
// "Download site-config.js" button produces a replacement for this file.
const DEFAULT_CONFIG = ${JSON.stringify(cfg, null, 2)};
`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], {type:"text/javascript"}));
  a.download = "site-config.js"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  say("Downloaded site-config.js. Replace the file in the GitHub repo to apply it for everyone.", true);
});
function useSite(){
  try { localStorage.removeItem(CONFIG_KEY) } catch(e) {}
  fill(DEFAULT_CONFIG); $("banner").hidden = true;
  document.querySelectorAll("[data-brand]").forEach(el => el.textContent = `${DEFAULT_CONFIG.org} ${DEFAULT_CONFIG.region}`);
  say("Back to the site's settings.", true);
}
$("reset").addEventListener("click", useSite);
$("useSite").addEventListener("click", useSite);

$("banner").hidden = !savedConfig();
fill(CONFIG);
