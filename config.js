// Settings logic: merges the site-wide defaults (site-config.js) with any
// settings saved on this device from the Settings page.
// What each configurable column means (used by the Settings page and the ⓘ explanations).
const FIELD_INFO = {
  master: { label: "Workout data", fields: {
    date: "Date of the workout", ao: "AO (workout site) name", pax: "PAX name", fng: "Marks a PAX's first post (1)",
    post: "Marks a counted post (1)", q: "Marks the Q (1)", qsource: "Marks a Q-Source post (1), left out", qqsource: "Marks the Q-Source Q (1), left out" } },
  sites: { label: "Sites", fields: {
    ao: "AO name (matches workout data)", day: "Day of the week", city: "City", qsource: "AO also hosts Q-Source",
    qsourceOnly: "AO is Q-Source only (left out)", retired: "AO is retired" } },
  roster: { label: "Roster", fields: {
    name: "PAX name (matches workout data)", joined: "Date joined", region: "Home region" } }
};

const CONFIG_KEY = "site-config";
function mergeConfig(base, over){
  const out = JSON.parse(JSON.stringify(base));
  if (!over || typeof over !== "object") return out;
  for (const k of ["org","region","website","logo","sheet"]) if (typeof over[k] === "string" && over[k].trim()) out[k] = over[k].trim();
  if (out.org !== "FiA") out.org = "F3";
  for (const t of Object.keys(out.tabs)) if (over.tabs && typeof over.tabs[t] === "string" && over.tabs[t].trim()) out.tabs[t] = over.tabs[t].trim();
  for (const t of Object.keys(out.cols)) for (const f of Object.keys(out.cols[t]))
    if (over.cols && over.cols[t] && typeof over.cols[t][f] === "string" && over.cols[t][f].trim()) out.cols[t][f] = over.cols[t][f].trim();
  return out;
}
function savedConfig(){ try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || "null") } catch(e) { return null } }
const CONFIG = mergeConfig(DEFAULT_CONFIG, savedConfig());

const sheetIdOf = s => { const m = /\/d\/([a-zA-Z0-9_-]{20,})/.exec(s || "") || /^([a-zA-Z0-9_-]{20,})$/.exec((s || "").trim()); return m ? m[1] : "" };
const csvUrl = (cfg, tab) => `https://docs.google.com/spreadsheets/d/${sheetIdOf(cfg.sheet)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
const BRAND = `${CONFIG.org} ${CONFIG.region}`;
// The built-in data snapshot only belongs to the default sheet.
const USING_DEFAULT_SHEET = sheetIdOf(CONFIG.sheet) === sheetIdOf(DEFAULT_CONFIG.sheet);
