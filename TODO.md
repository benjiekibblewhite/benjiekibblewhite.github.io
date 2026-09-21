# TODO

Remaining problems from the 2026-09 site review. Priority order within each group.

## High

(all clear)

## Medium

(none open)
- [x] ~~Gallery modal semantics~~ — done 2026-09-21 (dialog role, focus trap/return, "n of N" counter)

## Low / decisions

- [ ] **Committed junk** — `album-tracker/.superpowers/` state files, 470 KB `lighthouse-report.json` at root.

## Design critique follow-ups (from `$impeccable critique`, 2026-09-21)

- [ ] **Logo alt text** — `alt="Blog Logo"` should describe the logo or be `""` (link's aria-label carries it).
- [ ] **Dead tags** — "Tags:" lines and tag chips promise filtering that doesn't exist. (Owner chose to leave; revisit if tag pages ever happen.)
- [ ] **Menu page brand** — only page with no header/logo.
- [ ] **Dependabot** — count went 4 → 7 after committing package-lock.json (full visibility into the tree; expected). Triage when bored.

## Done (2026-09-21, second batch)

- [x] Custom 404 page (`pages/404.html` → dist/404.html)
- [x] Touch targets ≥44px (header icons, menu close, social links)
- [x] `@view-transition` guarded by prefers-reduced-motion
- [x] Modal history spam (replaceState on prev/next)
- [x] sharedHead: 404ing preloads removed, favicon fixed, font links deduped
- [x] Skip link on all pages + `main-content` ids
- [x] Restored `images/` from history (ponyfoo, onekind, insider, see-more gif); excluded 59MB unreferenced cluster-quilt
- [x] `optimize-images.js` races fixed, destructive behavior documented
- [x] `package-lock.json` committed
- [x] Double `<body>`, double `</head>`, unique postIds
- [x] Modal history model fully fixed (replaceState nav + close consumes its entry; verified with live browser Back tests)
- [x] Legacy post images: real alt text (was `alt="Alt"` ×10)
- [x] Modal button focus rings on the dark overlay
- [x] Skip link: clipped until focus, readable colors on focus
- [x] Minors: long-form dates on home, `← All galleries`, menu label = "Posts", styled code blocks, iframe fits 320px
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
