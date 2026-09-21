---
target: the site
total_score: 25
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 2
target_identity: "file:/Users/benjie.kibblewhite/Developer/personal/benjiekibblewhite.github.io/pages/index.html"
target_fingerprint: "sha256:3296045a7d43b026afa2f525b14dd625689f090344f8cb244d4010286d170aab"
target_path: /Users/benjie.kibblewhite/Developer/personal/benjiekibblewhite.github.io/pages/index.html
timestamp: 2026-09-21T15-36-50Z
slug: pages-index-html
---
# Critique #2: benjie.ca main site (post-fix re-run)

## Design Health Score — 25/36 (Good, 69%; was 21/36 / 58%)

H1 3 (no aria-current) · H2 4 · H3 2 (modal trap broken; menu history.back) · H4 2 (cyclic --color-link-hover; dead CSS) · H5 3 · H6 3 (home has doors now) · H7 3 · H8 3 (front-door disclaimer wordy) · H9 2 (default 404) · H10 n/a.

## Design Specificity Verdict

Grounded in this person — content and micro-decisions carry identity; frame stays quiet. Risk: roughness-as-voice vs roughness-as-bugs. Detector: 61 findings, no new real main-site items; line-length findings GONE after typeset pass. FPs unchanged: lightbox broken-image, tight-leading, marketing-buzzword, menu transient contrast, overused-font (Montserrat).

## Overall Impression

Fixes landed and measured well (body 7.29:1, links 4.92:1, meta 5.89:1). Two regressions from the same morning's changes surfaced, one P0.

## What's Working

1. Gallery modal engineering (deep links, focus restore, aria-live counter, cache hits).
2. Accessibility written in (focus rings verified, aria-hidden filmstrips, focusable code blocks, reduced-motion guard).
3. Readable read surface (680px, 1.6 leading, AA with margin).

## Priority Issues

1. [P0] Modal Tab-trap no-ops: offsetParent is null for position:fixed buttons → trap sees 0 focusables → Tab escapes into background page. Fix: filter on getComputedStyle(btn).display !== "none"; add inert to background. (createGalleryPages.js, regression from harden pass)
2. [P1] --color-link-hover: var(--color-link-hover) self-reference (styles.css:21) → all links fade blue→gray on hover. Fix: #155a9e. (regression from token pass)
3. [P1] Menu close is history.back() with no fallback → dead on direct load. Fix: history.length check + location.href='/' fallback; fix nested body.
4. [P2] Pagination unlabeled: bare ←/→ arrows, no nav aria-label, no aria-current on current page. (createIndexPage.js)
5. [P2] Post pages are dead ends — no footer/next/prev. Peak-end problem. (createPostsPages.js)

## Persona Red Flags

- Jordan: passes 5s test; RSS icon-only; manifesto paragraph wordy; menu "Blog" vs h1 "Posts" mismatch.
- Sam: P0 trap bug; thin default focus ring on modal controls; bare-arrow pagination; no skip-link; @view-transition not reduced-motion-guarded; modal filename not announced (only counter is aria-live).
- Casey: 36px header icons, 30px menu close; per-photo pushState history spam on Back; wins: 75px menu links, 155px grid buttons, cached modal images, URL-surviving state.

## Minor Observations

.gallery-preview h2 a never matches (markup is a>h2) and references deleted --primary-color; stray second </head> in gallery pages; modal close aria-label says "gallery window"; .header-link margin-top misalignment; ASCII <- Back to list; generic meta description everywhere; duplicate font links + broken preloads in sharedHead.

## Questions to Consider

1. Why did hover drain links to gray, and how long would it have shipped without a machine reading the token?
2. What would it take for the hamburger to open the dialog pattern already proven on photos?
3. What is the front-door disclaimer defending?
4. Which room of the house have you been living in — photos or blog?
5. "View photo: a good rock 1" — voice or gap?
