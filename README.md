# F3 SacTown Attendance Heatmap

A one-page site that shows every F3 SacTown workout for a chosen month as a heatmap: one row per AO, one column per week, each cell shaded by how many PAX posted. **8–15 PAX is the ideal range** and is ringed in gold; fewer PAX is lighter, more PAX is darker.

**Live site:** https://stats.f3sactown.com/

Current version: see [`VERSION`](VERSION) and [`BUILD`](BUILD), or the footer of the page.

## Using it

- Pick a month from the dropdown or step through with the arrows.
- Tap any cell to see the Q and who posted.
- Switch between Light, Dark and System (follows your device) at the bottom of the page. Your choice is remembered on that device.
- Link straight to a month by adding `#mYYYYMM` to the address, e.g. `https://stats.f3sactown.com/#m202610` for October 2026.
- The line beside the month picker says whether you're seeing live sheet data or the built-in snapshot.

## Insights page

`insights.html` (the **Insights** tab) summarises any date range. Click the date button to pick a preset (This month, Last month, Last 30 days, Last 90 days, This year, Last year, All time) or enter an exact start and end date. It shows:

- Totals with change against the previous period: workouts, posts, unique PAX, average PAX per workout, share of workouts in the 8–15 range, new PAX.
- Posts per week (per month for all time), and a histogram of workout sizes with the 8–15 ideal and the 18 DRTF line marked.
- Average PAX by day of week, posts by AO city (from the Sites tab), and posts by each PAX's home region (from the Roster).
- Sortable AO and PAX tables, the PAX table with search.
- New PAX (SacTown PAX whose Date Joined on the Roster is in the period) and "Missing in action": regulars with 10+ posts whose last post was 3–26 weeks ago.

Link straight to a range with `#this-month`, `#last-month`, `#last-30`, `#last-90`, `#this-year`, `#last-year`, `#all`, or an exact range like `#2026-01-01_2026-03-31`. Totals compare against the matching earlier period: the same days last month or last year for the calendar presets, otherwise the same number of days just before.

## Where the data comes from

The page reads the **Master Data** tab of the F3 SacTown Data Google Sheet every time it loads, so new workouts appear on their own. The sheet must stay shared as "Anyone with the link can view."

Only these sheet columns are used; everything else in the sheet is ignored:

| Tab | Columns |
| --- | --- |
| Master Data | Post Date, AO Name, PAX Name, FNG, Post, Q, QSource, Q QSource |
| Sites | AO Name, Day, City, Q Source, Q Source Only, Retired |
| Roster | F3 Name, Date Joined, Region |

Counting rules:

- Only rows with a `1` in the **Post** column count. Q-Source rows (McKinley's QSource column, and the Q-Source AO) are excluded, as are AOs marked **Q Source Only** on the Sites tab.
- A PAX listed twice at the same workout counts once.
- "Site Closed (Archived)" placeholder rows are ignored.
- AOs whose name starts with a year (e.g. `2026 QvQ Inter-Regional Championship`) are grouped as events.

If the sheet can't be reached, the page falls back to a snapshot of the data built into `data.js` (currently through Nov 5, 2026).

If the page stops loading live data, publish the tab as CSV (**File → Share → Publish to web → Master Data → CSV**) and paste that link into `SHEET_CSV_URL` at the top of `data.js`. The Insights page also reads the **Sites** and **Roster** tabs. If Sites can't be read it uses a copy in `data.js`; if the Roster can't be read, New PAX falls back to each PAX's first post and the home-region chart is hidden.

## Hosting

GitHub Pages serves `index.html` from the `main` branch root of `f3sactown/stats`, at the custom domain in [`CNAME`](CNAME) (`stats.f3sactown.com`). Pages settings: **Settings → Pages → Deploy from a branch → `main` / `(root)`**, custom domain `stats.f3sactown.com`.

## Versioning

The project uses a version number (`MAJOR.MINOR.PATCH` in `VERSION`) plus a build number (`BUILD`) that goes up by one with every release.

| Change | Command |
| --- | --- |
| Any update (build +1 only) | `scripts/bump.sh` |
| Fix | `scripts/bump.sh patch` |
| New feature | `scripts/bump.sh minor` |
| Breaking or major redesign | `scripts/bump.sh major` |

The script updates `VERSION`, `BUILD`, the version shown on the page, and adds a heading to [`CHANGELOG.md`](CHANGELOG.md) for you to fill in. Then commit and push.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Heatmap page |
| `insights.html`, `insights.js` | Insights page: KPIs, trends, workout-size histogram, AO and PAX leaderboards, new PAX, regulars gone quiet |
| `data.js` | Shared data layer: sheet links, built-in snapshots (Master Data and Sites), parsing and counting rules |
| `site.css`, `site.js` | Shared colours (light and dark), layout, page tabs, footer, theme switch and version number |
| `VERSION`, `BUILD` | Current version and build number |
| `CHANGELOG.md` | What changed in each build |
| `scripts/bump.sh` | Bumps the version and build number |
| `favicon.ico`, `icons/` | Site icon (F3 SacTown logo) for browser tabs and phone home screens |
| `CNAME` | Custom domain for GitHub Pages (`stats.f3sactown.com`) |
