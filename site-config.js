// Site-wide settings: region, branding, which Google Sheet, tabs and columns to read.
// Everyone sees these. The Settings page can override them on one device, and its
// "Download site-config.js" button produces a replacement for this file.
const DEFAULT_CONFIG = {
  org: "F3",                       // "F3" or "FiA"
  region: "SacTown",               // region name without F3 / FiA
  website: "https://f3sactown.com/",
  logo: "icons/icon-192.png",      // image link (full URL or a file in this repo)
  sheet: "https://docs.google.com/spreadsheets/d/1_R4F0syR4m7eBen4j92PJCFeGrxEvNrbrL7LxFG46So/edit",
  tabs: { master: "Master Data", sites: "Sites", roster: "Roster" },
  cols: {
    master: { date: "Post Date", ao: "AO Name", pax: "PAX Name", fng: "FNG", post: "Post", q: "Q", qsource: "QSource", qqsource: "Q QSource" },
    sites:  { ao: "AO Name", day: "Day", city: "City", qsource: "Q Source", qsourceOnly: "Q Source Only", retired: "Retired" },
    roster: { name: "F3 Name", joined: "Date Joined", region: "Region" }
  }
};
