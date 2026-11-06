# F3 SacTown Attendance Heatmap

A one-page site that shows every F3 SacTown workout for a chosen month as a heatmap: one row per AO, one column per week, each cell shaded by how many PAX posted. **5–8 PAX is the ideal range** and is ringed in gold; fewer PAX is lighter, more PAX is darker.

**Live site:** https://f3sactown.github.io/heat/

Current version: see [`VERSION`](VERSION) and [`BUILD`](BUILD), or the footer of the page.

## Using it

- Pick a month from the dropdown or step through with the arrows.
- Tap any cell to see the Q and who posted.
- Link straight to a month by adding `#mYYYYMM` to the address, e.g. `https://f3sactown.github.io/heat/#m202610` for October 2026.
- The line beside the month picker says whether you're seeing live sheet data or the built-in snapshot.

## Where the data comes from

The page reads the **Master Data** tab of the F3 SacTown Data Google Sheet every time it loads, so new workouts appear on their own. The sheet must stay shared as "Anyone with the link can view."

Counting rules:

- Only rows with a `1` in the **Post** column count. Q-Source rows (McKinley's QSource column, and the Q-Source AO) are excluded.
- A PAX listed twice at the same workout counts once.
- "Site Closed (Archived)" placeholder rows are ignored.
- AOs whose name starts with a year (e.g. `2026 QvQ Inter-Regional Championship`) are grouped as events.

If the sheet can't be reached, the page falls back to a snapshot of the data built into `index.html` (currently through Nov 5, 2026).

If the page stops loading live data, publish the tab as CSV (**File → Share → Publish to web → Master Data → CSV**) and paste that link into `SHEET_CSV_URL` near the top of the script in `index.html`.

## Hosting

GitHub Pages serves `index.html` from the `main` branch root. To turn it on: **Settings → Pages → Deploy from a branch → `main` / `(root)` → Save**.

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
| `index.html` | The whole site: page, heatmap code, and data snapshot |
| `VERSION`, `BUILD` | Current version and build number |
| `CHANGELOG.md` | What changed in each build |
| `scripts/bump.sh` | Bumps the version and build number |
