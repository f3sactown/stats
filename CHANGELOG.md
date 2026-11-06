# Changelog

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
