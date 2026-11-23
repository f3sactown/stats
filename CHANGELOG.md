# Changelog

## v1.8.0 (build 15) - 2026-11-23

- Insights: the period buttons are replaced by a **date range picker** like Data Studio's. Presets: This month, Last month, Last 30 days, Last 90 days, This year, Last year, All time; or enter an exact start and end date. Totals compare against the matching earlier period. Short ranges (45 days or less) show posts per day. The chosen range is kept in the link (e.g. `#last-month`, `#2026-01-01_2026-03-31`) and remembered; older `#p2025`-style links still work.
- Insights: tidier change text on the total tiles (no forced capitals; average PAX change always shows one decimal).

## v1.7.1 (build 14) - 2026-11-23

- Fix: right after a release, browsers could load the new page with an old cached script, leaving the Insights page half empty. Shared CSS and JS links now carry the build number (`?v=14`), which `scripts/bump.sh` updates on every release, so the page and its scripts always match.

## v1.7.0 (build 13) - 2026-11-23

- The site now uses only these sheet columns: Master Data (Post Date, AO Name, PAX Name, FNG, Post, Q, QSource, Q QSource), Sites (AO Name, Day, City, Q Source, Q Source Only, Retired) and Roster (F3 Name, Date Joined, Region). Sites Style, Area and Launch are no longer read or stored.
- Insights: "By workout style" is replaced by **By city**, and AO rows show day · city. New **Home region** chart shows posts by each PAX's Roster region.
- Insights: **New PAX** now comes from the Roster's Date Joined (SacTown PAX), falling back to first post if the Roster can't be read. AOs marked Q Source Only on Sites are left out.

## v1.6.0 (build 12) - 2026-11-22

- New **Insights** page, linked from Heatmap / Insights tabs at the top of both pages. Pick a period (last 4 or 13 weeks, a year, or all time) to see totals with change vs the prior period, posts per week or month, a workout-size histogram with the 8–15 ideal and the 18 DRTF line, average PAX by day and posts by style, sortable AO and PAX tables, new PAX, and regulars who have gone quiet. Day and style come from the Sites tab.
- Shared code split out of `index.html`: `data.js` (snapshot, sheet links, counting rules) and `site.css` / `site.js` (colours, theme switch, footer, version). `scripts/bump.sh` now updates `site.js`.

## v1.5.0 (build 11) - 2026-11-16

- Light and dark mode, chosen with a Light / Dark / System switch at the bottom of the page. System follows the device setting, and the choice is remembered. In dark mode the heat ramp runs dim to bright so busy workouts still stand out; the legend note now reads "The stronger the blue, the more PAX."

## v1.4.0 (build 10) - 2026-11-15

- Ideal range changed from 5–8 to 8–15 PAX: gold rings, stat counts (in range, under 8, over 15), the cell detail verdict, the legend IDEAL marker (now over the 8–11 and 12–15 swatches) and the page text all follow it.

## v1.3.1 (build 9) - 2026-11-15

- Added a footnote: past 18 PAX at a workout, DRTF (diminishing returns to fellowship) sets in (Freed to Lead, Chapter 4).

## v1.3.0 (build 8) - 2026-11-15

- Heatmap shade ranges changed to 1–3, 4–7, 8–11, 12–15, 16–18 and 19+. The IDEAL marker on the legend now sits over 5–8 across the second and third swatches, and the legend note mentions the gold ring.

## v1.2.0 (build 7) - 2026-11-05

- F3 SacTown logo added beside the page title, linking to f3sactown.com.

## v1.2.0 (build 6) - 2026-11-05

- Added the F3 SacTown logo as the site icon: browser tab favicon and phone home-screen icon.

## v1.1.0 (build 5) - 2026-11-05

- Built-in snapshot: The Refinery's Aug 17 entries moved to Aug 15 to match the fix in the sheet (7 PAX that day).

## v1.1.0 (build 4) - 2026-11-05

- Mobile layout: AO and event names wrap onto multiple lines so the counts sit closer to them, and all week columns are the same width.
- Name column stays frozen on the left when the grid scrolls sideways on small screens.
- Day of week is now a heading row above each group (Monday, Tuesday, …, Events) instead of its own column.
- Week headers stack the month over the date range to save width.

## v1.0.1 (build 3) - 2026-11-05

- Heatmap shading changed from green to blue, with neutrals tinted to match.

## v1.0.0 (build 2) - 2026-11-05

- Repo renamed from `heat` to `stats`; site now served at `stats.f3sactown.com` (CNAME added).
- README links updated to the new address.

## v1.0.0 (build 1) - 2026-11-05

- First release: monthly attendance heatmap for F3 SacTown, one row per AO grouped by workout day, one column per Mon–Sun week.
- Shading runs light (few PAX) to dark (many PAX); 5–8 PAX is ringed in gold as the ideal range.
- Month picker with previous/next arrows; months can be linked directly with `#mYYYYMM`.
- Reads the Master Data tab of the Google Sheet live on every load, with a built-in snapshot (through Nov 5, 2026) as a fallback.
- Counts only the Post column, so Q-Source rows are excluded; a PAX listed twice at one workout counts once; "Site Closed" rows are ignored.
- Tap a workout to see the Q and the PAX list.
- Version and build shown at the bottom of the page.
