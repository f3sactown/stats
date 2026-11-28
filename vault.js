// PAX Vault: one PAX's full record (posts, Qs, streaks, milestones, calendar,
// favorite AOs, buddies, Q history, workout log) plus region leaderboards.
// Uses only the configured workout data (date, AO, PAX, post, Q, FNG) and
// Roster (date joined, region) columns; Sites only to drop Q-Source-only AOs.

const DAY = 864e5;
const DOW_ORDER = [1,2,3,4,5,6,0];
const DOW_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const POST_MILESTONES = [1,25,50,100,150,200,250,300,400,500,750,1000,1500,2000];
const Q_MILESTONES = [1,10,25,50,100,200];
const LOG_ROWS = 25, BOARD_ROWS = 10;

let WORKOUTS = [], SITES = sitesFromSnapshot(), ROSTER = null;
let PAX = new Map();          // name -> [workouts], all time, oldest first
let SCOPE = "all", WHO = null, logAll = false;

const $ = id => document.getElementById(id);
const esc = escHTML;
const fmt = n => n.toLocaleString("en-US");
const dOf = t => new Date(t*DAY);
const short = t => { const d = dOf(t); return `${MON[d.getUTCMonth()].slice(0,3)} ${d.getUTCDate()}` };
const long = t => `${short(t)}, ${dOf(t).getUTCFullYear()}`;
const weekOf = t => t - ((dOf(t).getUTCDay()+6)%7);          // Monday of that week
const ymd = (y,m,d) => Date.UTC(y,m,d)/DAY;
const W = (f) => colsUsed("master", f);

// ---- Data ------------------------------------------------------------------
function prep(){
  WORKOUTS = WORKOUTS.filter(w => !(SITES.get(w.ao) || {}).qsourceOnly);
  WORKOUTS.forEach(w => { w.t = Date.UTC(w.y, w.m-1, w.d)/DAY; w.dow = dOf(w.t).getUTCDay() });
  WORKOUTS.sort((a,b) => a.t-b.t || a.ao.localeCompare(b.ao));
  PAX = new Map();
  for (const w of WORKOUTS) for (const p of w.pax){ if (!PAX.has(p)) PAX.set(p, []); PAX.get(p).push(w) }
}
const lastT = () => WORKOUTS[WORKOUTS.length-1].t;
const years = () => [...new Set(WORKOUTS.map(w => w.y))].sort((a,b) => b-a);
const inScope = w => SCOPE === "all" || w.y === +SCOPE;
const scopeLabel = () => SCOPE === "all" ? "all time" : SCOPE;

function streaks(list){                       // list of workouts, oldest first
  const weeks = [...new Set(list.map(w => weekOf(w.t)))].sort((a,b) => a-b);
  let best = 0, bestEnd = null, run = 0, prev = null;
  for (const wk of weeks){ run = prev != null && wk - prev === 7 ? run + 1 : 1; if (run > best){ best = run; bestEnd = wk } prev = wk }
  const thisWeek = weekOf(lastT());
  let current = 0;
  if (weeks.length && thisWeek - weeks[weeks.length-1] <= 7){ current = 1; for (let i = weeks.length-1; i > 0 && weeks[i]-weeks[i-1] === 7; i--) current++ }
  return {best, bestStart: bestEnd != null ? bestEnd - (best-1)*7 : null, bestEnd, current};
}
const isQ = (w, p) => w.qs.includes(p);

// ---- Picker and scope ------------------------------------------------------
function fillPicker(){
  const names = [...PAX].sort((a,b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  $("paxList").innerHTML = names.map(([n,l]) => `<option value="${esc(n)}">${l.length} posts</option>`).join("");
}
function findPax(q){
  q = q.trim().toLowerCase(); if (!q) return null;
  const names = [...PAX.keys()];
  return names.find(n => n.toLowerCase() === q) || names.find(n => n.toLowerCase().startsWith(q)) || names.find(n => n.toLowerCase().includes(q)) || null;
}
function choose(name){
  WHO = name; logAll = false; $("findErr").textContent = "";
  if (name) $("find").value = name;
  saveState(); render();
  if (name) $("profile").scrollIntoView({block:"start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
}
$("find").addEventListener("change", () => {
  const v = $("find").value; if (!v.trim()) return;
  const n = findPax(v);
  if (n === WHO){ $("find").value = WHO; return }
  if (n) choose(n); else $("findErr").textContent = `No PAX matches “${v}”.`;
});
$("find").addEventListener("keydown", e => { if (e.key === "Enter"){ e.preventDefault(); $("find").dispatchEvent(new Event("change")) } });
function drawScope(){
  const opts = [["all","All time"], ...years().map(y => [String(y), String(y)])], el = $("scope");
  if (el.dataset.keys !== opts.map(o => o[0]).join()){        // only rebuild when the list of years changes
    el.innerHTML = opts.map(([k,l]) => `<button type="button" data-k="${k}">${l}</button>`).join("");
    el.dataset.keys = opts.map(o => o[0]).join();
  }
  el.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === SCOPE));
}
$("scope").addEventListener("click", e => { const b = e.target.closest("button[data-k]"); if (!b) return; SCOPE = b.dataset.k; logAll = false; saveState(); render() });
document.addEventListener("click", e => { const b = e.target.closest("button.namebtn[data-pax]"); if (b) choose(b.dataset.pax) });

function saveState(){
  const h = new URLSearchParams(); if (WHO) h.set("pax", WHO); if (SCOPE !== "all") h.set("y", SCOPE);
  history.replaceState(null, "", h.toString() ? "#" + h.toString() : location.pathname + location.search);
  try { localStorage.setItem("vault", JSON.stringify({who:WHO, scope:SCOPE})) } catch(e) {}
}
function loadState(){
  const h = new URLSearchParams(location.hash.slice(1));
  let st = {who:h.get("pax"), scope:h.get("y")};
  if (!st.who && !st.scope) try { st = JSON.parse(localStorage.getItem("vault")) || {} } catch(e) { st = {} }
  SCOPE = st.scope && years().includes(+st.scope) ? String(st.scope) : "all";
  WHO = st.who && PAX.has(st.who) ? st.who : null;
  if (WHO) $("find").value = WHO;
}

// ---- Render ----------------------------------------------------------------
function render(){
  drawScope();
  document.title = pageTitle(WHO ? `${WHO} · PAX Vault` : "PAX Vault");
  $("profile").hidden = !WHO; $("prompt").hidden = !!WHO;
  if (WHO) profile(WHO);
  boards();
}

const nameBtn = n => `<button type="button" class="namebtn" data-pax="${esc(n)}">${esc(n)}</button>`;
function hbars(el, rows, valueOf, labelOf, nameOf = r => esc(r.name)){
  if (!rows.length){ el.innerHTML = `<p class="empty">Nothing in this period.</p>`; return }
  const max = Math.max(...rows.map(valueOf)) || 1;
  el.innerHTML = rows.map(r => `<div class="hb"><span class="lab">${nameOf(r)}</span><span class="track"><i style="width:${valueOf(r)/max*100}%"></i></span><span class="val">${labelOf(r)}</span></div>`).join("");
}
function nice(max){ if (max <= 4) return 4; const step = Math.pow(10, Math.floor(Math.log10(max))); for (const m of [1,2,2.5,5,10]) if (m*step >= max) return m*step; return 10*step }
const gridLines = max => [max, max/2].map(v => `<div class="gl" style="bottom:${v/max*100}%"><span>${fmt(Math.round(v))}</span></div>`).join("");

function profile(p){
  const all = PAX.get(p) || [], list = all.filter(inScope);
  const roster = ROSTER && ROSTER.get(p);
  const aoCount = {}; list.forEach(w => aoCount[w.ao] = (aoCount[w.ao]||0) + 1);
  const home = Object.entries(aoCount).sort((a,b) => b[1]-a[1])[0];
  const fngW = all.find(w => w.fng && w.fng.includes(p));
  const qList = list.filter(w => isQ(w, p));
  const st = streaks(all.filter(inScope));
  const stAll = streaks(all);

  // header
  $("paxName").textContent = p;
  const meta = [];
  if (home) meta.push(`Home AO <b>${esc(home[0])}</b>`);
  if (roster && roster.region) meta.push(`Region <b>${esc(roster.region)}</b>`);
  if (roster) meta.push(`Joined <b>${long(roster.joined)}</b>`);
  if (fngW) meta.push(`FNG at <b>${esc(fngW.ao)}</b>, ${long(fngW.t)}`);
  if (all.length) meta.push(`First post <b>${long(all[0].t)}</b> at ${esc(all[0].ao)}`);
  $("paxMeta").innerHTML = meta.map(m => `<span>${m}</span>`).join("");

  // rank among all PAX in scope
  const counts = new Map(); WORKOUTS.filter(inScope).forEach(w => w.pax.forEach(x => counts.set(x, (counts.get(x)||0) + 1)));
  const rank = list.length ? 1 + [...counts.values()].filter(c => c > list.length).length : null;
  const end = lastT(), first = list.length ? list[0].t : null, lastPost = list.length ? list[list.length-1].t : null;
  const weeksSpan = first != null ? Math.max(1, Math.round(((SCOPE === "all" ? end : Math.min(end, ymd(+SCOPE,11,31))) - weekOf(first))/7) + 1) : 0;
  const avgSize = list.length ? list.reduce((s,w) => s+w.n, 0)/list.length : 0;
  const D = W(["date","ao","pax","post"]);
  const cards = [
    ["Posts", fmt(list.length), rank ? `#${rank} of ${fmt(counts.size)} PAX` : "", `Workouts this PAX posted at in ${scopeLabel()}.\nCalc: count of workouts listing this PAX (once per workout).\nData: ${D}`],
    ["Q's", fmt(qList.length), list.length ? `${Math.round(qList.length/list.length*100)}% of posts` : "", `Workouts this PAX led.\nCalc: workouts where this PAX has ${CONFIG.cols.master.q} = 1 (co-Qs count for each Q).\nData: ${W(["date","ao","pax","post","q"])}`],
    ["AOs Visited", fmt(Object.keys(aoCount).length), home ? `most at ${home[0]}` : "", `Different AOs this PAX posted at.\nCalc: count of distinct AO names among their workouts.\nData: ${D}`],
    ["Posts per Week", weeksSpan ? (list.length/weeksSpan).toFixed(2) : "0", weeksSpan ? `over ${fmt(weeksSpan)} weeks` : "", `How often this PAX posts.\nCalc: posts ÷ weeks from their first post in ${scopeLabel()} to the end of the period.\nData: ${D}`],
    ["Longest Streak", `${st.best} wk${st.best===1?"":"s"}`, st.best ? `${short(st.bestStart)} – ${long(st.bestEnd+6)}` : "", `Most consecutive Monday–Sunday weeks with at least one post, in ${scopeLabel()}.\nData: ${D}`],
    ["Current Streak", `${stAll.current} wk${stAll.current===1?"":"s"}`, `as of ${long(end)}`, `Consecutive weeks with a post, counting back from the latest week in the data (or the week before). Always all time.\nData: ${D}`],
    ["Last Post", lastPost != null ? short(lastPost) : "–", lastPost != null ? `${fmt(end - lastPost)} day${end - lastPost === 1 ? "" : "s"} before the latest workout` : "", `Most recent workout this PAX posted at in ${scopeLabel()}.\nData: ${D}`],
    ["Avg Workout Size", avgSize.toFixed(1), "PAX at their workouts", `Average number of PAX at the workouts this PAX attended.\nCalc: sum of PAX at their workouts ÷ their posts.\nData: ${D}`]
  ];
  $("cards").innerHTML = cards.map(([l,v,n,t]) => `<div class="kpi"><span class="lab">${l}${infoTip(t, l)}</span><b>${v}</b><span class="note">${esc(n) || "&nbsp;"}</span></div>`).join("");

  calendar(p, all);
  months(p, list);
  hbars($("aos"), Object.entries(aoCount).sort((a,b) => b[1]-a[1]).slice(0, 10).map(([name,posts]) => ({name, posts, qs:qList.filter(w => w.ao === name).length})),
    r => r.posts, r => `<b>${r.posts}</b>${r.qs ? ` · ${r.qs} Q` : ""}`);
  hbars($("dow"), DOW_ORDER.map(d => ({name:DOW_FULL[d], posts:list.filter(w => w.dow === d).length})).filter(r => r.posts),
    r => r.posts, r => `<b>${r.posts}</b> · ${Math.round(r.posts/list.length*100)}%`);
  const bud = new Map(); list.forEach(w => w.pax.forEach(x => { if (x !== p) bud.set(x, (bud.get(x)||0) + 1) }));
  hbars($("buddies"), [...bud].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0, 10).map(([name,n]) => ({name, n})),
    r => r.n, r => `<b>${r.n}</b> · ${Math.round(r.n/list.length*100)}%`, r => nameBtn(r.name));
  milestones(p, all);
  $("qSub").textContent = qList.length ? `${qList.length} Q${qList.length===1?"":"s"} in ${scopeLabel()}, newest first, with PAX count.` : `No Qs in ${scopeLabel()}.`;
  $("qList").innerHTML = qList.slice().reverse().map(w => `<li><span>${esc(w.ao)}${w.qs.length > 1 ? ` <small style="color:var(--muted)">· with ${esc(w.qs.filter(x => x !== p).join(", "))}</small>` : ""}</span><span>${long(w.t)} · ${w.n} PAX</span></li>`).join("");
  $("qList").style.cssText = qList.length > 12 ? "max-height:440px;overflow:auto" : "";
  log(p, list);
}

function calendar(p, all){
  let a, b;
  if (SCOPE === "all"){ b = lastT(); a = b - 364 } else { a = ymd(+SCOPE,0,1); b = ymd(+SCOPE,11,31) }
  $("calSub").textContent = SCOPE === "all" ? `The 52 weeks up to ${long(lastT())}. Hover or tap a day for the workout.` : `Every day of ${SCOPE}. Hover or tap a day for the workout.`;
  const byDay = new Map(); all.forEach(w => { if (w.t >= a && w.t <= b){ if (!byDay.has(w.t)) byDay.set(w.t, []); byDay.get(w.t).push(w) } });
  let h = "", lastMonth = -1;
  for (let wk = weekOf(a); wk <= b; wk += 7){
    const mo = dOf(Math.max(wk, a)).getUTCMonth();
    h += `<span class="m">${mo !== lastMonth ? MON[mo].slice(0,3) : ""}</span>`; lastMonth = mo;
    for (let i = 0; i < 7; i++){
      const t = wk + i;
      if (t < a || t > b){ h += `<span class="d x"></span>`; continue }
      const ws = byDay.get(t);
      if (!ws){ h += `<span class="d" data-tip="${DOW_FULL[dOf(t).getUTCDay()]}, ${long(t)}\nNo post"></span>`; continue }
      const q = ws.some(w => isQ(w, p));
      h += `<span class="d ${q ? "q" : "p"}" data-tip="${DOW_FULL[dOf(t).getUTCDay()]}, ${long(t)}\n${ws.map(w => `${esc(w.ao)} · ${w.n} PAX${isQ(w,p) ? " · Q" : ""}`).join("\n")}"></span>`;
    }
  }
  $("cal").innerHTML = h;
  const wrap = $("cal").parentElement; wrap.scrollLeft = wrap.scrollWidth;   // show the latest weeks first on small screens
}

function months(p, list){
  if (!list.length){ $("months").innerHTML = ""; $("monthsX").innerHTML = ""; return }
  const a = dOf(list[0].t), b = SCOPE === "all" ? dOf(lastT()) : dOf(ymd(+SCOPE,11,31)), start = SCOPE === "all" ? a : dOf(ymd(+SCOPE,0,1));
  const rows = [];
  for (let y = start.getUTCFullYear(), m = start.getUTCMonth(); y*12+m <= b.getUTCFullYear()*12+b.getUTCMonth(); m === 11 ? (y++, m = 0) : m++){
    const ws = list.filter(w => w.y === y && w.m === m+1);
    rows.push({label:`${MON[m].slice(0,3)}${m === 0 || !rows.length ? " ’"+String(y).slice(2) : ""}`, full:`${MON[m]} ${y}`, posts:ws.length, qs:ws.filter(w => isQ(w,p)).length});
  }
  const max = nice(Math.max(1, ...rows.map(r => r.posts)));
  $("months").innerHTML = gridLines(max) + rows.map(r => `<div class="bar" data-tip="${r.full}\n${r.posts} post${r.posts===1?"":"s"}${r.qs ? ` · ${r.qs} Q` : ""}"><i style="height:${r.posts/max*100}%"></i></div>`).join("");
  const every = Math.ceil(rows.length / (innerWidth < 600 ? 5 : 10));
  $("monthsX").innerHTML = rows.map((r,i) => `<span>${i % every === 0 ? r.label : ""}</span>`).join("");
}

function milestones(p, all){
  const qs = all.filter(w => isQ(w, p)), out = [];
  const add = (list, marks, noun) => {
    for (const m of marks){
      if (list.length >= m) out.push({t:list[m-1].t, done:true, text: m === 1 ? `First ${noun}` : `${fmt(m)} ${noun}s`, where:list[m-1].ao});
      else { out.push({t:Infinity, done:false, text:`${fmt(m)} ${noun}s`, where:`${fmt(m - list.length)} to go`}); break }
    }
  };
  add(all, POST_MILESTONES, "post"); add(qs, Q_MILESTONES, "Q");
  out.sort((a,b) => a.t - b.t);
  $("ms").innerHTML = out.map(m => `<li class="${m.done ? "done" : "next"}"><span>${m.text}</span><span>${m.done ? `${esc(m.where)} · ${long(m.t)}` : `next · ${m.where}`}</span></li>`).join("") || `<li><span class="empty">No posts yet.</span></li>`;
}

function log(p, list){
  const rows = list.slice().reverse(), shown = logAll ? rows : rows.slice(0, LOG_ROWS);
  $("log").innerHTML = `<thead><tr><th>Date</th><th class="l">AO</th><th>PAX</th><th class="l">Q</th></tr></thead><tbody>${shown.map(w =>
    `<tr><td class="name">${DOW[w.dow]} ${long(w.t)}</td><td class="l">${esc(w.ao)}</td><td>${w.n}</td><td class="l">${isQ(w,p) ? `<b style='color:var(--ink)'>${esc(p)}</b>` + (w.qs.length > 1 ? " + " + esc(w.qs.filter(x => x !== p).join(", ")) : "") : esc(w.q) || "–"}</td></tr>`).join("")}</tbody>`;
  $("logMore").hidden = rows.length <= LOG_ROWS;
  $("logMore").textContent = logAll ? `Show the latest ${LOG_ROWS}` : `Show all ${fmt(rows.length)} workouts`;
}
$("logMore").addEventListener("click", () => { logAll = !logAll; log(WHO, (PAX.get(WHO) || []).filter(inScope)) });

function boards(){
  $("boardScope").textContent = `· ${scopeLabel()}`;
  const posts = new Map(), qs = new Map(), scoped = new Map();
  WORKOUTS.filter(inScope).forEach(w => { w.pax.forEach(p => { posts.set(p, (posts.get(p)||0) + 1); if (!scoped.has(p)) scoped.set(p, []); scoped.get(p).push(w) }); w.qs.forEach(q => qs.set(q, (qs.get(q)||0) + 1)) });
  const top = m => [...m].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0, BOARD_ROWS);
  const li = (rows, unit) => rows.map(([n,v],i) => `<li><span><span class="rank">${i+1}.</span>${nameBtn(n)}</span><span>${fmt(v)} ${unit}</span></li>`).join("") || `<li><span class="empty">No data.</span></li>`;
  $("bPosts").innerHTML = li(top(posts), "posts");
  $("bQs").innerHTML = li(top(qs), "Qs");
  const st = new Map([...scoped].map(([p,l]) => [p, streaks(l).best]));
  $("bStreak").innerHTML = li(top(st), "weeks");
}

const BOARD_INFO = {
  bPosts: () => `PAX with the most posts in the selected period.\nData: ${W(["date","ao","pax","post"])}`,
  bQs: () => `PAX who Q'd the most workouts in the selected period (co-Qs count for each).\nData: ${W(["date","ao","pax","post","q"])}`,
  bStreak: () => `Most consecutive Monday–Sunday weeks with at least one post, within the selected period.\nData: ${W(["date","pax","post"])}`,
  cal: () => `One square per day. Blue = posted that day; gold ring = Q'd.\nData: ${W(["date","ao","pax","post","q"])}`,
  months: () => `Calc: this PAX's posts in each month (from their first post, or across the chosen year).\nData: ${W(["date","pax","post","q"])}`,
  aos: () => `Calc: this PAX's posts at each AO (top 10), and how many of those they Q'd.\nData: ${W(["ao","pax","post","q"])}`,
  dow: () => `Calc: this PAX's posts by weekday of the workout date, and the share of their posts.\nData: ${W(["date","pax","post"])}`,
  buddies: () => `Calc: for every workout this PAX posted at, count the other PAX there; top 10 with the share of this PAX's workouts they shared.\nData: ${W(["date","ao","pax","post"])}`,
  ms: () => `Post milestones (1st, 25, 50, 100, …) and Q milestones (1st, 10, 25, …) from all of this PAX's data, with the AO and date each was reached, plus the next one to go.\nData: ${W(["date","ao","pax","post","q"])}`,
  qs: () => `Workouts this PAX led in the period, with co-Qs and PAX count.\nData: ${W(["date","ao","pax","post","q"])}`,
  log: () => `Every workout this PAX posted at in the period: date, AO, PAX count and the Q.\nData: ${W(["date","ao","pax","post","q"])}`
};
function drawInfo(){ document.querySelectorAll("[data-info]").forEach(el => el.innerHTML = infoTip(BOARD_INFO[el.dataset.info](), el.dataset.what)) }

// ---- Start -----------------------------------------------------------------
const src = $("source");
function start(){
  drawInfo();
  if (!WORKOUTS.length){ document.querySelectorAll(".three, #prompt").forEach(el => el.hidden = true); return }
  document.querySelectorAll(".three").forEach(el => el.hidden = false);
  fillPicker(); render();
}
WORKOUTS = fromSnapshot(); prep(); if (WORKOUTS.length) loadState(); start();
src.textContent = WORKOUTS.length ? `Snapshot from ${SNAPSHOT_DATE} · checking the sheet…` : "Loading from the Google Sheet…";
Promise.allSettled([fetchCSV(SHEET_CSV_URL), fetchCSV(SITES_CSV_URL), fetchCSV(ROSTER_CSV_URL)]).then(([m, s, ro]) => {
  if (s.status === "fulfilled") try { const live = sitesFromRows(s.value); if (live.size) SITES = live } catch(e) {}
  if (ro.status === "fulfilled") try { const live = rosterFromRows(ro.value); if (live.size) ROSTER = live } catch(e) {}
  let live = null, why = m.status === "rejected" ? "check the link and that it's shared as Anyone with the link" : "";
  if (m.status === "fulfilled") try { const l = fromRows(m.value); if (l.length) live = l; else why = "no workouts found" } catch(e) { why = e.message }
  const keep = {who:WHO, scope:SCOPE};
  WORKOUTS = live || fromSnapshot(); prep();
  if (WORKOUTS.length){ if (keep.who || keep.scope !== "all"){ WHO = PAX.has(keep.who) ? keep.who : null; SCOPE = years().includes(+keep.scope) ? keep.scope : "all" } else loadState() }
  start();
  src.textContent = live ? `Live from the Google Sheet · ${new Date().toLocaleString([], {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"})}`
    : WORKOUTS.length ? `Showing snapshot from ${SNAPSHOT_DATE} (couldn't reach the sheet)` : `Couldn't read the sheet: ${why}. See Settings.`;
});
