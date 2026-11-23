// Insights page: summary cards with sparklines, trend, workout-size histogram,
// day / city / home-region breakdowns, AO and PAX leaderboards, new PAX and
// regulars gone quiet. Every card and chart has an ⓘ explaining its data.
// Sheet, tab and column names come from config.js; counting rules from data.js.

const DAY = 864e5;
const DOW_ORDER = [1,2,3,4,5,6,0];
const DOW_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const HOME_REGION = CONFIG.region;
let NEW_PAX_FROM = 0;   // the data starts with existing PAX, so joins in its first month aren't "new" (set in prep)
const MIA_MIN_POSTS = 10, MIA_FROM_DAYS = 21, MIA_TO_DAYS = 182;
const PAX_ROWS = 25;

let WORKOUTS = [], SITES = sitesFromSnapshot(), ROSTER = null, FIRST = new Map();
let CUR = null;   // current date range {k,label,a,b,pa,pb,prior}; a/b are day numbers
const aoSort = {key:"avg",dir:-1}, paxSort = {key:"posts",dir:-1};
let paxAll = false;

const $ = id => document.getElementById(id);
const esc = escHTML;
const fmt = n => n.toLocaleString("en-US");
const dOf = t => new Date(t*DAY);
const short = t => { const d = dOf(t); return `${MON[d.getUTCMonth()].slice(0,3)} ${d.getUTCDate()}` };
const long = t => `${short(t)}, ${dOf(t).getUTCFullYear()}`;
const isEvent = ao => /^\d{4}\b/.test(ao);

// ---- Preparing data --------------------------------------------------------
function prep(){
  WORKOUTS = WORKOUTS.filter(w => !(SITES.get(w.ao) || {}).qsourceOnly);   // Sites "Q Source Only" AOs aren't workouts
  WORKOUTS.forEach(w => { w.t = Date.UTC(w.y, w.m-1, w.d)/DAY; w.dow = dOf(w.t).getUTCDay() });
  WORKOUTS.sort((a,b) => a.t-b.t || a.ao.localeCompare(b.ao));
  FIRST = new Map();
  for (const w of WORKOUTS) for (const p of w.pax) if (!FIRST.has(p)) FIRST.set(p, w);
  NEW_PAX_FROM = WORKOUTS.length ? WORKOUTS[0].t + 31 : 0;
}
const HAS_FNG = () => WORKOUTS.some(w => w.fng);
function siteOf(ao){
  if (isEvent(ao)) return {city:"Event", day:"", retired:false};
  const s = SITES.get(ao);
  return s ? {...s, city: s.city || "Other"} : {city:"Other", day:"", retired:false};
}
const inRange = (a,b) => WORKOUTS.filter(w => w.t >= a && w.t <= b);

// Every summary number for a set of workouts in a..b
function metrics(ws, a, b){
  const posts = ws.reduce((s,w) => s+w.n, 0), pax = new Set(), qs = new Set(), days = new Set(), aos = new Set();
  let fng = 0;
  ws.forEach(w => { w.pax.forEach(p => pax.add(p)); w.qs.forEach(q => qs.add(q)); days.add(w.t); aos.add(w.ao); if (w.fng) fng += w.fng.length });
  return {days:days.size, workouts:ws.length, posts, postsPerDay: days.size ? posts/days.size : 0, uniqueQ:qs.size, unique:pax.size,
          fng: HAS_FNG() ? fng : null, aoCount:aos.size, postsPerPax: pax.size ? posts/pax.size : 0,
          avg: ws.length ? posts/ws.length : 0, idealPct: ws.length ? ws.filter(w => ideal(w.n)).length/ws.length*100 : 0,
          fresh: newPaxList(a, b).length};
}

// ---- Date range picker ---------------------------------------------------
// Presets plus an exact custom range. Each range carries the earlier period
// its change figures compare against (pa..pb).
const todayT = () => { const n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())/DAY };
const ymd = (y,m,d) => Date.UTC(y,m,d)/DAY;            // month is 0-based; overflow rolls over
const iso = t => dOf(t).toISOString().slice(0,10);
const fromIso = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v||""); return m ? Date.UTC(+m[1], m[2]-1, +m[3])/DAY : null };

function withPrior(r){
  if (r.pa == null && r.k !== "all"){ const len = r.b - r.a + 1; r.pa = r.a - len; r.pb = r.a - 1; r.prior = `prior ${len} days` }
  if (r.pa != null && !WORKOUTS.some(w => w.t >= r.pa && w.t <= r.pb)) r.pa = r.pb = r.prior = null;
  return r;
}
function presets(){
  const t = todayT(), d = dOf(t), y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate();
  return [
    {k:"this-month", label:"This month",   a:ymd(y,m,1),   b:t,             pa:ymd(y,m-1,1), pb:Math.min(ymd(y,m-1,day), ymd(y,m,0)), prior:"same days last month"},
    {k:"last-month", label:"Last month",   a:ymd(y,m-1,1), b:ymd(y,m,0),    pa:ymd(y,m-2,1), pb:ymd(y,m-1,0), prior:"the month before"},
    {k:"last-30",    label:"Last 30 days", a:t-29,         b:t},
    {k:"last-90",    label:"Last 90 days", a:t-89,         b:t},
    {k:"this-year",  label:"This year",    a:ymd(y,0,1),   b:t,             pa:ymd(y-1,0,1), pb:ymd(y-1,m,day), prior:"same span last year"},
    {k:"last-year",  label:"Last year",    a:ymd(y-1,0,1), b:ymd(y-1,11,31),pa:ymd(y-2,0,1), pb:ymd(y-2,11,31), prior:String(y-2)},
    {k:"all",        label:"All time",     a:WORKOUTS[0].t, b:Math.max(t, WORKOUTS[WORKOUTS.length-1].t)}
  ].map(withPrior);
}
const customRange = (a,b) => withPrior({k:"custom", label:"Custom", a, b});

// URL hash: #this-year, #last-month, ... or #2026-01-01_2026-03-31 (older #p4w / #p2026 links still work)
function rangeFromKey(k){
  if (!k) return null;
  const old = {p4w:"last-30", p13w:"last-90", pall:"all"}[k]; if (old) k = old;
  let m = /^p(\d{4})$/.exec(k); if (m) return customRange(ymd(+m[1],0,1), ymd(+m[1],11,31));
  m = /^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/.exec(k);
  if (m){ const a = fromIso(m[1]), b = fromIso(m[2]); return a != null && b != null && a <= b ? customRange(a,b) : null }
  return presets().find(p => p.k === k) || null;
}
const keyOf = r => r.k === "custom" ? `${iso(r.a)}_${iso(r.b)}` : r.k;
function pickRange(keep){
  let r = keep ? rangeFromKey(keyOf(keep)) : rangeFromKey(location.hash.slice(1));
  if (!r) try { r = rangeFromKey(localStorage.getItem("ins-range")) } catch(e) {}
  CUR = r || rangeFromKey("this-year");
}
function setRange(r){
  CUR = r; paxAll = false;
  try { localStorage.setItem("ins-range", keyOf(r)) } catch(e) {}
  history.replaceState(null, "", "#" + keyOf(r));
  closePicker(); render();
}

const pickBtn = $("pickBtn"), pickPop = $("pickPop");
function drawPicker(){
  $("pickLabel").textContent = CUR.label;
  $("range").textContent = `${long(CUR.a)} – ${long(CUR.b)}`;
  $("presets").innerHTML = presets().map(p => `<button type="button" data-k="${p.k}" aria-pressed="${p.k===CUR.k}">${p.label}</button>`).join("");
}
function openPicker(){
  const lo = iso(WORKOUTS[0].t), hi = iso(Math.max(todayT(), WORKOUTS[WORKOUTS.length-1].t));
  for (const el of [$("dStart"), $("dEnd")]) { el.min = lo; el.max = hi }
  $("dStart").value = iso(CUR.a); $("dEnd").value = iso(CUR.b); $("pickErr").textContent = "";
  pickPop.hidden = false; pickBtn.setAttribute("aria-expanded", "true");
  (pickPop.querySelector('[aria-pressed="true"]') || $("dStart")).focus();
}
function closePicker(refocus){
  if (pickPop.hidden) return;
  pickPop.hidden = true; pickBtn.setAttribute("aria-expanded", "false");
  if (refocus) pickBtn.focus();
}
pickBtn.addEventListener("click", () => pickPop.hidden ? openPicker() : closePicker());
$("presets").addEventListener("click", e => { const b = e.target.closest("button[data-k]"); if (b) setRange(rangeFromKey(b.dataset.k)) });
$("pickCancel").addEventListener("click", () => closePicker(true));
$("pickForm").addEventListener("submit", e => {
  e.preventDefault();
  const a = fromIso($("dStart").value), b = fromIso($("dEnd").value);
  if (a == null || b == null) { $("pickErr").textContent = "Pick both a start and an end date."; return }
  if (a > b) { $("pickErr").textContent = "The start date has to be on or before the end date."; return }
  setRange(customRange(a, b));
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && !pickPop.hidden) closePicker(true) });
document.addEventListener("pointerdown", e => { if (!pickPop.hidden && !e.target.closest("#picker")) closePicker() });

// ---- Render ----------------------------------------------------------------
function render(){
  drawPicker();
  const ws = inRange(CUR.a, CUR.b);
  const prev = CUR.pa != null ? inRange(CUR.pa, CUR.pb) : null;
  document.title = pageTitle(`${CUR.k === "custom" ? `${short(CUR.a)} – ${long(CUR.b)}` : CUR.label} Insights`);
  const B = buckets(ws);
  kpis(ws, prev, B);
  trend(B);
  histogram(ws);
  byDow(ws);
  byCity(ws);
  byRegion(ws);
  aoTable(ws, prev);
  paxTable(ws);
  newPax();
  mia();
}

// ---- Summary cards ---------------------------------------------------------
const W_COLS = () => colsUsed("master", ["date","ao","pax","post"]);
const CARDS = [
  {k:"days",        label:"1st F Days",            f:v => fmt(v),        tip:() => `Days with at least one workout.\nCalc: count of distinct workout dates.\nData: ${colsUsed("master",["date","post"])}`},
  {k:"workouts",    label:"Total Workouts",        f:v => fmt(v),        tip:() => `Each AO + date with at least one post is one workout.\nCalc: count of AO/date pairs.\nData: ${W_COLS()}`},
  {k:"posts",       label:"Total Posts",           f:v => fmt(v),        tip:() => `Calc: PAX at every workout, added up. A PAX listed twice at one workout counts once; Q-Source rows are left out.\nData: ${colsUsed("master",["date","ao","pax","post","qsource","qqsource"])}`},
  {k:"postsPerDay", label:"Average Posts per Day", f:v => v.toFixed(2),  tip:() => `Calc: Total Posts ÷ 1st F Days.\nData: ${W_COLS()}`},
  {k:"uniqueQ",     label:"Unique Q's",            f:v => fmt(v),        tip:() => `Different PAX who led at least one workout.\nCalc: distinct names with ${CONFIG.cols.master.q} = 1.\nData: ${colsUsed("master",["pax","q","post"])}`},
  {k:"unique",      label:"Unique PAX",            f:v => fmt(v),        tip:() => `Different PAX who posted at least once.\nCalc: distinct PAX names.\nData: ${colsUsed("master",["pax","post"])}`},
  {k:"fng",         label:"FNG",                   f:v => v == null ? "–" : fmt(v), tip:() => `First-time PAX marked in the workout data.\nCalc: posts with ${CONFIG.cols.master.fng} = 1.\nData: ${colsUsed("master",["pax","fng","post"])}`},
  {k:"aoCount",     label:"AO Count",              f:v => fmt(v),        tip:() => `AOs with at least one workout.\nCalc: count of distinct AO names.\nData: ${colsUsed("master",["ao","post"])}`},
  {k:"postsPerPax", label:"Average Posts per PAX", f:v => v.toFixed(2),  tip:() => `How often the average PAX posted.\nCalc: Total Posts ÷ Unique PAX.\nData: ${W_COLS()}`},
  {k:"avg",         label:"Avg PAX per Workout",   f:v => v.toFixed(1),  tip:() => `Calc: Total Posts ÷ Total Workouts.\nData: ${W_COLS()}`},
  {k:"idealPct",    label:`In ${IDEAL_LO}–${IDEAL_HI} Range`, f:v => Math.round(v) + "%", pts:true, tip:() => `Share of workouts with ${IDEAL_LO} to ${IDEAL_HI} PAX, the ideal size.\nCalc: workouts with ${IDEAL_LO}–${IDEAL_HI} PAX ÷ Total Workouts. Change is in percentage points.\nData: ${W_COLS()}`},
  {k:"fresh",       label:"New PAX",               f:v => fmt(v),        tip:() => ROSTER
      ? `${HOME_REGION} PAX who joined in the range.\nCalc: Roster rows with ${CONFIG.cols.roster.region} = ${HOME_REGION} and ${CONFIG.cols.roster.joined} in the range (not counting the data's first month).\nData: ${colsUsed("roster",["name","joined","region"])}`
      : `The Roster couldn't be read, so this counts PAX whose first post on record is in the range (not counting the data's first month).\nData: ${colsUsed("master",["date","pax","post"])}`}
];
function spark(values){
  const vals = values.map(v => v ?? 0), lo = Math.min(...vals), hi = Math.max(...vals), n = vals.length;
  if (n < 2) return "";
  const y = v => hi === lo ? 14 : 25 - (v - lo)/(hi - lo)*22;
  const pts = vals.map((v,i) => `${(i/(n-1)*100).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  return `<svg class="spark" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}"/></svg>`;
}
function kpis(ws, prev, B){
  const s = metrics(ws, CUR.a, CUR.b), p = prev && prev.length ? metrics(prev, CUR.pa, CUR.pb) : null;
  const per = B.rows.map(r => metrics(r.list, r.a, r.b));
  $("kpis").innerHTML = CARDS.map(c => {
    const v = s[c.k], pv = p ? p[c.k] : null;
    let change = "&nbsp;";
    if (p && v != null && pv != null){
      const d = c.pts ? Math.round(v - pv) : pv ? (v - pv)/pv*100 : null;
      if (d == null) change = `<span class="flat">${c.f(pv)} in ${CUR.prior}</span>`;
      else if (Math.abs(d) < 0.05) change = `<span class="flat">no change</span> vs ${CUR.prior}`;
      else change = `<span class="${d > 0 ? "up" : "down"}">${d > 0 ? "▲" : "▼"} ${c.pts ? Math.abs(d) + " pts" : Math.abs(d).toFixed(1) + "%"}</span> vs ${CUR.prior}`;
    } else if (v == null) change = `<span class="flat">needs the live sheet</span>`;
    const line = v == null ? "" : spark(per.map(m => m[c.k]));
    return `<div class="kpi"><span class="lab">${c.label}${infoTip(c.tip() + `\nLine: per ${B.unit} across the range.`, c.label)}</span><b>${c.f(v)}</b><small>${change}</small>${line}</div>`;
  }).join("");
}

function nice(max){
  if (max <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  for (const m of [1,2,2.5,5,10]) if (m*step >= max) return m*step;
  return 10*step;
}
function grid(max){ return [max, max/2].map(v => `<div class="gl" style="bottom:${v/max*100}%"><span>${fmt(Math.round(v))}</span></div>`).join("") }

// Split the range into day / week / month buckets: {unit, rows:[{k,a,b,label,full,list}]}
function buckets(ws){
  const span = CUR.b - CUR.a + 1, monthly = span > 400, daily = span <= 45;
  const m = new Map();
  if (daily){
    for (let t = CUR.a; t <= CUR.b; t++) m.set(t, {a:t, b:t, label:short(t), full:`${DOW_FULL[dOf(t).getUTCDay()]}, ${long(t)}`});
  } else if (monthly){
    const a = dOf(CUR.a), b = dOf(CUR.b);
    for (let y=a.getUTCFullYear(), mo=a.getUTCMonth(); y*12+mo <= b.getUTCFullYear()*12+b.getUTCMonth(); mo===11 ? (y++, mo=0) : mo++){
      const k = y*100+mo+1;
      m.set(k, {a:Math.max(CUR.a, ymd(y,mo,1)), b:Math.min(CUR.b, ymd(y,mo+1,0)), label:`${MON[mo].slice(0,3)}${mo===0 || m.size===0 ? " ’"+String(y).slice(2) : ""}`, full:`${MON[mo]} ${y}`});
    }
  } else {
    for (let t = CUR.a - ((dOf(CUR.a).getUTCDay()+6)%7); t <= CUR.b; t += 7) m.set(t, {a:Math.max(t, CUR.a), b:Math.min(t+6, CUR.b), label:short(t), full:`Week of ${long(t)}`});
  }
  const keyOf = monthly ? w => w.y*100+w.m : daily ? w => w.t : w => w.t - ((w.dow+6)%7);
  for (const r of m.values()) r.list = [];
  ws.forEach(w => { const r = m.get(keyOf(w)); if (r) r.list.push(w) });
  return {unit: monthly ? "month" : daily ? "day" : "week", rows:[...m.values()]};
}
function trend(B){
  const rows = B.rows.map(r => { const pax = new Set(); r.list.forEach(w => w.pax.forEach(p => pax.add(p)));
    return {...r, posts:r.list.reduce((s,w) => s+w.n, 0), workouts:r.list.length, unique:pax.size} });
  $("trendTitle").textContent = `Posts per ${B.unit}`;
  $("trendUnit").textContent = B.unit;
  const max = nice(Math.max(1, ...rows.map(r => r.posts)));
  $("trend").innerHTML = grid(max) + rows.map(r =>
    `<div class="bar" data-tip="${esc(r.full)}\n${fmt(r.posts)} posts · ${r.workouts} workouts\n${r.unique} unique PAX"><i style="height:${r.posts/max*100}%"></i></div>`).join("");
  const every = Math.ceil(rows.length / (innerWidth < 600 ? 5 : 9));
  $("trendX").innerHTML = rows.map((r,i) => `<span>${i % every === 0 ? r.label : ""}</span>`).join("");
}

function histogram(ws){
  const CAP = 25, counts = Array(CAP+1).fill(0);
  ws.forEach(w => counts[Math.min(w.n, CAP)]++);
  const max = nice(Math.max(1, ...counts));
  const N = CAP, pos = i => `calc(34px + (100% - 34px) * ${i/N})`;
  let h = grid(max);
  h += `<div class="band" style="left:${pos(IDEAL_LO-1)};width:calc((100% - 34px) * ${(IDEAL_HI-IDEAL_LO+1)/N})"><span>IDEAL</span></div>`;
  h += `<div class="cap" style="left:${pos(18)}"><span>DRTF · 18</span></div>`;
  for (let n = 1; n <= CAP; n++){
    const b = bin(n), c = counts[n], lab = n === CAP ? `${CAP}+ PAX` : `${n} PAX`;
    h += `<div class="bar" data-tip="${lab}\n${c} workout${c===1?"":"s"}"><i style="height:${c/max*100}%;background:var(${b.c})"></i></div>`;
  }
  $("hist").innerHTML = h;
  const show = new Set([1,4,IDEAL_LO,12,IDEAL_HI,18,22,CAP]);
  $("histX").innerHTML = Array.from({length:CAP}, (_,i) => i+1).map(n => `<span>${show.has(n) ? (n===CAP ? CAP+"+" : n) : ""}</span>`).join("");
}

function hbars(el, rows, valueOf, labelOf){
  if (!rows.length){ el.innerHTML = `<p class="empty">No workouts in this period.</p>`; return }
  const max = Math.max(...rows.map(valueOf));
  el.innerHTML = rows.map(r => `<div class="hb"><span class="lab">${esc(r.name)}</span><span class="track"><i style="width:${valueOf(r)/max*100}%"></i></span><span class="val">${labelOf(r)}</span></div>`).join("");
}
function byDow(ws){
  const rows = DOW_ORDER.map(d => {
    const list = ws.filter(w => w.dow === d && !isEvent(w.ao));
    return {name: DOW_FULL[d], workouts: list.length, avg: list.length ? list.reduce((s,w) => s+w.n, 0)/list.length : 0};
  }).filter(r => r.workouts);
  hbars($("dow"), rows, r => r.avg, r => `<b>${r.avg.toFixed(1)}</b> · ${r.workouts}`);
}
function byCity(ws){
  const m = new Map();
  ws.forEach(w => { const s = siteOf(w.ao).city; if (!m.has(s)) m.set(s, {name:s, posts:0, workouts:0}); const r = m.get(s); r.posts += w.n; r.workouts++ });
  const rows = [...m.values()].sort((a,b) => b.posts-a.posts);
  hbars($("city"), rows, r => r.posts, r => `<b>${fmt(r.posts)}</b> · ${(r.posts/r.workouts).toFixed(1)} avg`);
}

// ---- Tables ----------------------------------------------------------------
function sortRows(rows, st){
  return rows.sort((a,b) => {
    const x = a[st.key], y = b[st.key];
    if (typeof x === "string") return x.localeCompare(y) * st.dir;
    return ((x ?? -1e9) - (y ?? -1e9)) * st.dir || a.name.localeCompare(b.name);
  });
}
function thead(cols, st){
  return `<thead><tr>${cols.map(([k,l,c]) => `<th${c ? ` class="${c}"` : ""}${st.key===k ? ` aria-sort="${st.dir>0?"ascending":"descending"}"` : ""}><button type="button" data-sort="${k}">${l}</button></th>`).join("")}</tr></thead>`;
}
function onSort(tableId, st, redraw){
  $(tableId).addEventListener("click", e => {
    const b = e.target.closest("button[data-sort]"); if (!b) return;
    const k = b.dataset.sort;
    if (st.key === k) st.dir *= -1; else { st.key = k; st.dir = k === "name" ? 1 : -1 }
    redraw();
  });
}
const chip = v => { const b = bin(Math.round(v)) || BINS[0]; return `<span class="chip${ideal(Math.round(v)) ? " ideal" : ""}" style="background:var(${b.c});color:${b.t}">${v.toFixed(1)}</span>` };

let AO_ROWS = [];
function aoTable(ws, prev){
  const group = list => { const m = new Map(); list.forEach(w => { if (!m.has(w.ao)) m.set(w.ao, []); m.get(w.ao).push(w) }); return m };
  const now = group(ws), before = prev ? group(prev) : new Map();
  AO_ROWS = [...now].map(([ao, list]) => {
    const posts = list.reduce((s,w) => s+w.n, 0), pax = new Set(), qs = {};
    list.forEach(w => { w.pax.forEach(p => pax.add(p)); w.qs.forEach(q => qs[q] = (qs[q]||0) + 1) });
    const site = siteOf(ao), avg = posts/list.length;
    const usual = site.day || DOW_FULL[Object.entries(list.reduce((c,w) => (c[w.dow]=(c[w.dow]||0)+1, c), {})).sort((a,b) => b[1]-a[1])[0][0]];
    const pl = before.get(ao), pavg = pl ? pl.reduce((s,w) => s+w.n, 0)/pl.length : null;
    const topQ = Object.entries(qs).sort((a,b) => b[1]-a[1])[0];
    return {name:ao, day:usual, city:site.city, retired:site.retired, workouts:list.length, avg,
            idealPct: list.filter(w => ideal(w.n)).length/list.length*100, unique:pax.size,
            topQ: topQ ? `${topQ[0]} (${topQ[1]})` : "", change: pavg == null ? null : avg - pavg};
  });
  drawAo();
}
function drawAo(){
  const t = $("aoTable");
  if (!AO_ROWS.length){ t.innerHTML = `<tbody><tr><td class="empty">No workouts in this period.</td></tr></tbody>`; return }
  const cols = [["name","AO"],["workouts","Workouts"],["avg","Avg PAX"],["idealPct",`In ${IDEAL_LO}–${IDEAL_HI}`],["unique","Unique PAX"],["topQ","Top Q","l"],["change","Change"]];
  const sorted = sortRows(AO_ROWS, aoSort), rows = sorted.filter(r => r.city !== "Event").concat(sorted.filter(r => r.city === "Event"));
  t.innerHTML = thead(cols, aoSort) + "<tbody>" + rows.map(r =>
    `<tr><td class="name">${esc(r.name)}${r.retired ? `<span class="tag">retired</span>` : ""}<small>${esc([r.day, r.city].filter(Boolean).join(" · "))}</small></td>
     <td>${r.workouts}</td><td>${chip(r.avg)}</td><td>${Math.round(r.idealPct)}%</td><td>${r.unique}</td>
     <td class="l">${esc(r.topQ) || "–"}</td>
     <td class="delta">${r.change == null ? "new" : (r.change >= 0 ? "▲ " : "▼ ") + Math.abs(r.change).toFixed(1)}</td></tr>`).join("") + "</tbody>";
}
onSort("aoTable", aoSort, drawAo);

let PAX_ROWS_DATA = [];
function paxTable(ws){
  const m = new Map();
  ws.forEach(w => w.pax.forEach(p => {
    if (!m.has(p)) m.set(p, {name:p, posts:0, qs:0, aos:new Map(), last:0});
    const r = m.get(p); r.posts++; r.aos.set(w.ao, (r.aos.get(w.ao)||0) + 1); if (w.t > r.last) r.last = w.t;
  }));
  ws.forEach(w => w.qs.forEach(q => { if (m.has(q)) m.get(q).qs++ }));
  PAX_ROWS_DATA = [...m.values()].map(r => ({...r, aoCount:r.aos.size, home:[...r.aos].sort((a,b) => b[1]-a[1])[0][0]}));
  drawPax();
}
function drawPax(){
  const q = $("paxSearch").value.trim().toLowerCase();
  const rows = sortRows(PAX_ROWS_DATA.filter(r => !q || r.name.toLowerCase().includes(q)), paxSort);
  const shown = paxAll || q ? rows : rows.slice(0, PAX_ROWS);
  const cols = [["name","PAX"],["posts","Posts"],["qs","Qs"],["aoCount","AOs"],["home","Home AO","l"],["last","Last post","l"]];
  $("paxTable").innerHTML = thead(cols, paxSort) + "<tbody>" + (shown.length ? shown.map(r =>
    `<tr><td class="name">${esc(r.name)}</td><td>${r.posts}</td><td>${r.qs || "–"}</td><td>${r.aoCount}</td><td class="l">${esc(r.home)}</td><td class="l">${short(r.last)}</td></tr>`).join("")
    : `<tr><td class="empty" colspan="6">No PAX match.</td></tr>`) + "</tbody>";
  const more = $("paxMore");
  more.hidden = !!q || rows.length <= PAX_ROWS;
  more.textContent = paxAll ? `Show top ${PAX_ROWS}` : `Show all ${fmt(rows.length)} PAX`;
}
onSort("paxTable", paxSort, drawPax);
$("paxSearch").addEventListener("input", drawPax);
$("paxMore").addEventListener("click", () => { paxAll = !paxAll; drawPax() });

function newPax(){
  const list = newPaxList(CUR.a, CUR.b).sort((a,b) => b.t-a.t || a.name.localeCompare(b.name));
  $("newPaxSub").textContent = ROSTER ? `${HOME_REGION} PAX whose ${CONFIG.cols.roster.joined} on the Roster falls in the range, with their first AO.`
    : "First post on record during the period (the Roster tab couldn't be read).";
  $("newPax").innerHTML = list.length ? list.map(r => `<li><span>${esc(r.name)}</span><span>${r.ao ? esc(r.ao) + " · " : ""}${short(r.t)}</span></li>`).join("")
    : `<li><span class="empty">No new PAX on record in this period.</span></li>`;
  $("newPax").style.cssText = list.length > 12 ? "max-height:440px;overflow:auto" : "";
}
// New PAX come from the Roster's Date Joined (home region only); without the
// Roster, fall back to each PAX's first post on record.
function newPaxList(a, b){
  const from = Math.max(a, NEW_PAX_FROM);
  if (ROSTER) return [...ROSTER].filter(([,r]) => r.region === HOME_REGION && r.joined >= from && r.joined <= b)
    .map(([name,r]) => { const f = FIRST.get(name); return {name, t:r.joined, ao: f && f.t >= r.joined - 7 ? f.ao : ""} });
  return [...FIRST].filter(([,w]) => w.t >= from && w.t <= b).map(([name,w]) => ({name, t:w.t, ao:w.ao}));
}

function byRegion(ws){
  const el = $("region");
  if (!ROSTER){ el.innerHTML = `<p class="empty">Needs the Roster tab, which couldn't be read.</p>`; return }
  const m = new Map();
  ws.forEach(w => w.pax.forEach(p => {
    const reg = (ROSTER.get(p) || {}).region || "Not on roster";
    if (!m.has(reg)) m.set(reg, {name:reg, posts:0, pax:new Set()});
    const r = m.get(reg); r.posts++; r.pax.add(p);
  }));
  const rows = [...m.values()].sort((a,b) => (a.name==="Not on roster") - (b.name==="Not on roster") || b.posts - a.posts);
  hbars(el, rows, r => r.posts, r => `<b>${fmt(r.posts)}</b> · ${r.pax.size} PAX`);
}

function mia(){
  const end = WORKOUTS[WORKOUTS.length-1].t, m = new Map();
  WORKOUTS.forEach(w => w.pax.forEach(p => {
    if (!m.has(p)) m.set(p, {posts:0, last:0, aos:{}});
    const r = m.get(p); r.posts++; r.last = Math.max(r.last, w.t); r.aos[w.ao] = (r.aos[w.ao]||0) + 1;
  }));
  const list = [...m].filter(([,r]) => r.posts >= MIA_MIN_POSTS && end - r.last >= MIA_FROM_DAYS && end - r.last <= MIA_TO_DAYS)
    .sort((a,b) => b[1].posts - a[1].posts || b[1].last - a[1].last);
  $("miaSub").textContent = `Regulars (${MIA_MIN_POSTS}+ posts) whose last post was 3 to 26 weeks before ${long(end)}. Worth a call.`;
  $("mia").innerHTML = list.length ? list.map(([p,r]) => {
    const home = Object.entries(r.aos).sort((a,b) => b[1]-a[1])[0][0], wk = Math.floor((end - r.last)/7);
    return `<li><span>${esc(p)} <small style="color:var(--muted)">· ${r.posts} posts, mostly ${esc(home)}</small></span><span>${short(r.last)} · ${wk} wk${wk===1?"":"s"}</span></li>`;
  }).join("") : `<li><span class="empty">Everyone's posting. Nobody to chase.</span></li>`;
  $("mia").style.cssText = list.length > 12 ? "max-height:440px;overflow:auto" : "";
}

// ---- ⓘ explanations on each chart and table ---------------------------------
const PANEL_INFO = {
  trend: () => `Calc: PAX posts added up for each day, week or month (by range length).\nHover a bar for workouts and unique PAX.\nData: ${W_COLS()}`,
  hist: () => `Calc: number of workouts at each PAX count (25+ grouped). Gold band = ${IDEAL_LO}–${IDEAL_HI} ideal; dashed line = 18, where DRTF sets in.\nData: ${W_COLS()}`,
  dow: () => `Calc: Total Posts ÷ Total Workouts for each weekday of the workout date; events (AO names starting with a year) left out. The second number is workouts.\nData: ${W_COLS()}`,
  city: () => `Calc: posts at AOs in each city, and Total Posts ÷ Total Workouts. AOs not on the Sites tab show as Other.\nData: ${W_COLS()}; ${colsUsed("sites",["ao","city"])}`,
  region: () => `Calc: posts by each PAX's home region, and how many different PAX. PAX missing from the Roster show as Not on roster.\nData: ${colsUsed("master",["pax","post"])}; ${colsUsed("roster",["name","region"])}`,
  ao: () => `Per AO in the range: workouts; average PAX (posts ÷ workouts); share of workouts with ${IDEAL_LO}–${IDEAL_HI} PAX; different PAX; who Q'd most; change in average PAX vs the comparison period. Day, city and retired come from Sites.\nData: ${colsUsed("master",["date","ao","pax","post","q"])}; ${colsUsed("sites",["ao","day","city","retired","qsourceOnly"])}`,
  pax: () => `Per PAX in the range: posts; times as Q; different AOs posted at; the AO posted at most; last post date.\nData: ${colsUsed("master",["date","ao","pax","post","q"])}`,
  newpax: () => ROSTER ? `${HOME_REGION} PAX whose join date is in the range, newest first, with the AO of their first post.\nData: ${colsUsed("roster",["name","joined","region"])}; ${colsUsed("master",["date","ao","pax","post"])}`
    : `The Roster couldn't be read, so this lists PAX whose first post on record is in the range.\nData: ${colsUsed("master",["date","ao","pax","post"])}`,
  mia: () => `PAX with ${MIA_MIN_POSTS}+ posts in all the data whose last post was 3 to 26 weeks before the latest workout. Not affected by the date range.\nData: ${colsUsed("master",["date","ao","pax","post"])}`
};
function drawPanelInfo(){
  document.querySelectorAll("[data-info]").forEach(el => { el.innerHTML = infoTip(PANEL_INFO[el.dataset.info](), el.dataset.what) });
}

// ---- Start: snapshot first (default sheet only), then live sheet data -------
const src = $("source");
function start(){
  drawPanelInfo();
  const empty = !WORKOUTS.length;
  document.querySelectorAll(".needs-data").forEach(el => el.hidden = empty);
  if (empty){ $("pickBtn").disabled = true; return }
  $("pickBtn").disabled = false;
  render();
}
WORKOUTS = fromSnapshot(); prep(); if (WORKOUTS.length) pickRange(); start();
src.textContent = WORKOUTS.length ? `Snapshot from ${SNAPSHOT_DATE} · checking the sheet…` : "Loading from the Google Sheet…";
Promise.allSettled([fetchCSV(SHEET_CSV_URL), fetchCSV(SITES_CSV_URL), fetchCSV(ROSTER_CSV_URL)]).then(([m, s, ro]) => {
  if (s.status === "fulfilled") try { const live = sitesFromRows(s.value); if (live.size) SITES = live } catch(e) {}
  if (ro.status === "fulfilled") try { const live = rosterFromRows(ro.value); if (live.size) ROSTER = live } catch(e) {}
  let live = null, why = m.status === "rejected" ? "check the link and that it's shared as Anyone with the link" : "";
  if (m.status === "fulfilled") try { const l = fromRows(m.value); if (l.length) live = l; else why = "no workouts found" } catch(e) { why = e.message }
  const keep = CUR; WORKOUTS = live || fromSnapshot(); prep();
  if (WORKOUTS.length) pickRange(keep);
  start();
  src.textContent = live ? `Live from the Google Sheet · ${new Date().toLocaleString([], {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"})}`
    : WORKOUTS.length ? `Showing snapshot from ${SNAPSHOT_DATE} (couldn't reach the sheet)` : `Couldn't read the sheet: ${why}. See Settings.`;
});
