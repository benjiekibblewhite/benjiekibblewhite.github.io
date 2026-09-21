---
target: the site
total_score: 23
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 2
target_identity: "file:/Users/benjie.kibblewhite/Developer/personal/benjiekibblewhite.github.io/pages/index.html"
target_fingerprint: "sha256:6d6e4de5a18e9d7342ab1eb0a36d8c7719b89e1860277cb51570c9a9788ce03c"
target_path: /Users/benjie.kibblewhite/Developer/personal/benjiekibblewhite.github.io/pages/index.html
timestamp: 2026-09-21T16-10-10Z
slug: pages-index-html
---
# Critique #3: benjie.ca main site (post-batch-2)

## Design Health Score — 23/36 (Good, 64%; trend 21 → 25 → 23)

H1 3 (aria-current exists; no current-section in chrome) · H2 4 · H3 2 (closeModal pushState: Back reopens viewer) · H4 2 (ISO vs long dates; Blog vs Posts; ASCII vs entity arrows) · H5 3 · H6 2 (all nav behind hamburger; captions hover-only) · H7 3 · H8 3 (code blocks unstyled) · H9 3 (404 with wit + links) · H10 n/a.

## Verified fixed since last run

Modal trap + inert; hover color real; legacy images 200; preload/favicon 404s gone; menu close fallback; pagination labels; 404 page.

## Priority Issues

1. [P0] Skip link illegible on focus (a:focus overrides to blue-on-blue, 1.37:1). FIXED same day.
2. [P1] closeModal pushStates clean URL → Back reopens viewer. Fix: history.back() when ?openImage present, else replaceState.
3. [P1] Legacy post images alt="Alt" (onekind ×4, ponyfoo, insider); real copy stranded in title attrs.
4. [P2] Modal buttons: only Chrome default 1px focus ring on near-black overlay.
5. [P2] No persistent nav / current-location marker; 3 links would fit in header even at 390px.

## Minor Observations

Home list ISO dates vs long form elsewhere; gallery ASCII <- vs &larr;; menu "Blog" vs h1 "Posts"; pre code blocks unstyled (bg/syntax) though focusable; YouTube iframe 300px fixed overflows 320px; no footer/contentinfo except home; logo alt "Blog Logo".

## Questions

1. What dies if the 3 menu links live in the header and the playfulness moves with them?
2. Are the galleries content or storage — what would a caption a stranger could feel look like?
3. Who is the "work in progress" disclaimer protecting?
4. Which is the interface — the address bar or the overlay?
5. After the TODO joke lands, what does the page choose for the visitor?
