---
target: the site
total_score: 21
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 3
target_identity: "file:/Users/benjie.kibblewhite/Developer/personal/benjiekibblewhite.github.io/pages/index.html"
target_fingerprint: "sha256:e5545d092faa23e32e743cae5007db376adc7d49dc0ceb34037f247c1d54ed8f"
target_path: /Users/benjie.kibblewhite/Developer/personal/benjiekibblewhite.github.io/pages/index.html
timestamp: 2026-09-21T14-48-45Z
slug: pages-index-html
---
# Critique: benjie.ca main site (home, menu, posts index/post, photos index/gallery)

## Design Health Score — 21/36 (Acceptable, 58%)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No active-section state; gallery modal has no "n of 11" position |
| 2 | Match System / Real World | 3 | Machine dates; UTC off-by-one gallery date; ASCII `<- Back` |
| 3 | User Control and Freedom | 2 | Modal focus escapes; menu close is history.back(); disabled pagination arrows are live 404 links |
| 4 | Consistency and Standards | 2 | Link color differs blog vs photos; headings and links share one blue; URL inconsistencies |
| 5 | Error Prevention | 3 | Keyboard path into page0/page4 404s; no custom 404 |
| 6 | Recognition Rather Than Recall | 2 | Home body links to nothing; inert photo thumbnails |
| 7 | Flexibility and Efficiency | 3 | RSS autodiscovery, ?openImage= deep links, arrow-key modal, view transitions |
| 8 | Aesthetic and Minimalist Design | 2 | 1000px prose measure; unstyled meta lines; 10 empty <p> artifacts on blog index |
| 9 | Error Recovery | 2 | Default server 404, no link home |
| 10 | Help and Documentation | n/a | Read/Experience surface |

## Design Specificity Verdict

The voice is unmistakably this person (headshot alt text, UNDER_CONSTRUCTION joke, photo filenames); the frame (Lora/Montserrat, one blue, centered column) is category-interchangeable. The most confident visual moment (menu wave field) sits behind the least-discoverable door.

Detector: 64 findings/10 rules. Real: current-page pagination chip 4.1:1 (styles.css:322); ~89-char blog line lengths (overlay). False positives: broken-image ×5 (JS-populated lightbox img), tight-leading ×8 (static misresolution of line-height 1.3), marketing-buzzword (essay prose), menu low-contrast ×3 (mid-transition), cramped-padding on .menu-container (intentional). Remainder belong to skipped apps (album-tracker, scrum-poker, joe-study).

## Overall Impression

Personally-voiced site with good accessibility instincts and one excellent piece of engineering (modal URL model), held back by: dead-end home page, keyboard-leaky modal, link/color system that never says what's clickable.

## What's Working

1. Gallery modal URL model (?openImage= deep links, pushState, popstate) — shareable photo URLs on a static site.
2. Real accessibility instincts: aria-labels, exemplary headshot alt, prefers-reduced-motion, lazy loading, visible focus.
3. The voice — a specific human within 10 seconds.

## Priority Issues

1. [P1] Home page is a dead end — bio names writing/photography, links neither; tab walk loops through chrome only. Fix: link the bio nouns; add latest-posts/recent-photos section. ($impeccable layout)
2. [P1] Gallery modal isn't modal for keyboard/SR — focus stays behind overlay, no role=dialog/aria-modal, nothing announced. Fix: dialog semantics, focus trap, "n of 11" counter. ($impeccable harden)
3. [P1] Disabled pagination arrows are keyboard-live 404 links (page0.html/page4.html). Fix: render <span aria-hidden> at boundaries. createIndexPage.js:13,33. ($impeccable harden)
4. [P2] Links are color-only (1.48:1 vs body; WCAG 1.4.1 wants 3:1) and headings share the link blue; photos index h2 links break pattern with #333. Fix: underline prose links, one link color, headings in text color. ($impeccable colorize)
5. [P2] Read typography: ~89-125 char lines at 16px; unstyled date/byline/tags; current-page chip 4.1:1 (white text fixes). Fix: ~68ch measure, 17-18px post body, styled meta line. Don't use --secondary-text (#a0a0a0 = 2.52:1) for text. ($impeccable typeset)

## Persona Red Flags

- Jordan (first-timer): no visible first action; hamburger is the only door and its Home link is circular; inert thumbnails teach wrong lesson; link affordance learned not perceived.
- Sam (SR/keyboard/low vision): modal focus leak + no dialog semantics; disabled-arrow 404 in tab order; color-only links 1.48:1; chip 4.1:1; logo alt "Blog Logo"; home footer inside <main> (contentinfo lost); menu links outline:none. Wins: 200% zoom clean, photo-button labels excellent.
- Casey (mobile one-handed): hamburger 36px top-right; social links 44x32; menu close 30px; photos index eager-loads 26 thumbnails (no lazy); menu history.back() dead on shared links. Wins: 75px menu links, deep-link persistence.

## Minor Observations

- Gallery date off by one day (UTC parse). Tags are dead text site-wide. header hover uses focus's outline box. Hidden apps ship in dist with Work link commented out. Mixed date formats. Menu page has no brand mark. No custom 404, no skip-link.

## Questions to Consider

1. What would home look like if it trusted visitors with doors instead of a waiting room?
2. What would spending the menu's confidence on the post page look like?
3. What would links say if they were allowed to look like links?
4. What changes if the writing receives the same engineering love as the modal?
5. Inert thumbnails: fewer/bigger/clickable, or intentional preview strip? Either is a decision; current state is an accident.
