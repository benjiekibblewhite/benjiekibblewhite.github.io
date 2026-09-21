# TODO

Remaining problems from the 2026-09 site review. Priority order within each group.

## High

- [ ] **Fix 404'd preloads/favicon** — `ui/sharedHead.html` points at `/static/optimized/logo.{webp,png}`, which don't exist. Fires on every page.
- [ ] **Restore missing `images/` folder** — 4 old posts reference `/images/*.png|jpg|gif` that 404. Restorable from commit `3a83cf5` (`git checkout 3a83cf5 -- images/`).

## Medium

- [ ] **Malformed post HTML** — `postId` (derived from title) can collide or be empty (stray `"` fixed 2026-09-21).
- [ ] **Double `<body>`** — `pages/index.html` and `pages/menu.html` contain `<body>` tags, then `generateCompletePage` wraps them in another.
- [ ] **`optimize-images.js` races** — un-awaited `forEach(async …)` + 10s `setTimeout` cleanup hack. Also overwrites originals in `static/` (irreversible, undocumented).
- [ ] **Invalid font preload** — `sharedHead.html` Google Fonts `rel="preload"` missing `as="style"` (browser warning / possible double fetch).
- [ ] **Commit `package-lock.json`** — currently gitignored; installs aren't reproducible and Dependabot works better with it.
- [x] ~~Gallery modal semantics~~ — done 2026-09-21 (dialog role, focus trap/return, "n of N" counter)

## Low / decisions

- [ ] **Committed junk** — `album-tracker/.superpowers/` state files, 470 KB `lighthouse-report.json` at root.

## Design critique follow-ups (from `$impeccable critique`, 2026-09-21)

- [ ] **Custom 404 page** — server default "Cannot GET" currently ships; no link home.
- [ ] **Logo alt text** — `alt="Blog Logo"` should describe the logo or be `""` (link's aria-label carries it).
- [ ] **Dead tags** — "Tags:" lines and tag chips promise filtering that doesn't exist. Wire up tag pages or remove.
- [ ] **Menu close = `history.back()`** — no-op when arriving via shared link; JS-only. Give it a real `href="/"` fallback.
- [ ] **Touch targets** — hamburger 36×36px, social links 44×32px, menu close 30px; all under 44px.
- [ ] **Skip link** — low cost (3 header tab stops), still missing.
- [ ] **Menu page brand** — only page with no header/logo.
- [ ] **Decide: dist committed AND gh-pages-deployed** — pick one deployment source.
- [ ] **Decide: 45 MB photo originals in git** — keeping for now.
- [ ] **Skipped apps' axe violations** — fallbright-tips (7), album-tracker login (6), scrum-poker (2). The 3 YouTube-embed violations on onekind-kiosk are unfixable third-party markup.
- [ ] **Remaining dependabot vulns** — 1 high, 3 moderate (down from 17).

## Done (2026-09-21)

- [x] RSS `Invalid Date` pubDate (use filename date)
- [x] `benjie.webp` restored to source from git history
- [x] Dead files removed (`index.js`, `slodein/slideout.css`, `ui/gallery.html`)
- [x] Dev watcher: added `photos`, `unbuilt-pages`, `album-tracker/frontend`
- [x] Gallery photo items are real keyboard-accessible buttons
- [x] `[object Object]` images (marked v16 token signatures)
- [x] Main-site axe violations: alt text, h1s, landmarks, link contrast (`#58aceb` → `#1f6fbd`), iframe title
- [x] Menu spacing regression from `<main>` landmark
