# Changelog

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
