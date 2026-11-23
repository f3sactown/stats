# Project rules

## Sheet columns

Use only these columns from the F3 SacTown Data Google Sheet. Ignore every other tab and column.

| Tab | Columns |
| --- | --- |
| Roster | F3 Name, Date Joined, Region |
| Master Data | Post Date, AO Name, PAX Name, FNG, Post, Q, QSource (header "QSource"), Q QSource |
| Sites | AO Name, Day, City, Q Source, Q Source Only, Retired |

Don't read, store in a snapshot, or display anything else from the sheet. These are the defaults in `site-config.js`; the Settings page only lets people rename which header each of these fields maps to, not add new fields.

## Workflow

- After making changes: bump the version with `scripts/bump.sh` (fill in the CHANGELOG entry), commit, push, open a PR to `main`, and merge it.
