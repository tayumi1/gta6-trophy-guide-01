# Leonida Trophy Atlas — GTA 6 Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/tayumi1/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/tayumi1/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy keeps its official name, description and grade, and gets a guide written in our own words that names its source beside it — Push Square, Output Lag, KeenGamer and PlanetGTA6, among others. Five trophies had no confirmed unlock method at launch; their guides say so plainly instead of guessing.

What it does:

- **Tracker** — tick a trophy off and it stays ticked (saved in your browser's localStorage). Export your progress to a file and import it back, on any machine.
- **Filters** — by kind (story, missable, collectibles, activities, online), by grade, by name, and free-text search. The online filter is empty on purpose: all 55 trophies unlock in single-player.
- **Spoiler setting** — hides the names, descriptions and guides of hidden story trophies until you earn them.
- **Roadmap to the platinum** — six stages in play order, built from the official descriptions: which chapters and missions, which collectibles and counts, and what to do first.
- **Missable flags** — exactly one trophy can be missed (Positive Mental Attitude: Lucia's balcony meditation in Chapter 1), flagged on its card, in the roadmap and in a banner at the top.

The whole app is static files under `app/` with no build step and no network requests at run time. It works with the network off: the only thing it loads is its own `app/data/trophies.json`.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080>.

You can also serve `app/` with any static file server. Share a view with query parameters, for example `?earned=28,15,31&filter=missable&spoiler=1`.

## Files

- `app/index.html` — the page: progress, controls, roadmap, trophy list.
- `app/style.css` — the look: an original deep-night Leonida palette, CSS only, no images.
- `app/app.js` — the tracker: rendering, filters, spoiler mode, localStorage, export/import.
- `app/data/trophies.json` — the 55 trophies with official names, descriptions and grades, plus a cited guide, kind, missable flag, count and roadmap stage each.
- `main.ts` — the entrypoint: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.
- `screenshots/` — four screenshots of the app running in a browser.

<sub>Entered on [make.fun](https://make.fun/?ref=96v1b6sn&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
