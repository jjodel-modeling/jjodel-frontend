# Auth page: compact two-column register view, legal links, no newsletter opt-in

Prompt-ID: P-2026-10-18-1720
Chat: C-2026-10-17-1530
Front: maintenance
Lane: fast (two files already reshaped by P-2026-10-18-1500; layout and copy only)
Status: da eseguire
Request: Alfonso, 2026-10-18 16:58, «è possibile ristrutturare la pagina di registrazione in modo che non si sviluppi in verticale e costringa allo scrolling?» and the Terms link that leads to a 404; 17:08 newsletter checkbox to be removed
Depends: P-2026-10-18-1500 (merged, f73a2274c)
Corregge: —
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-register`, branch `register-compact`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1`, `git status` match; otherwise `Outcome: blocked`.

Model and tier: standard, Opus 5.5 as pinned (RC-16), effort `high`.

## Lane discipline

Every reply opens with `[P-2026-10-18-1720 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`. Unattended (RC-21, RC-25): take the recommended answer outside the RC-26 list and record it. Time limit 60 minutes. No separate discovery phase: the previous report `docs/discovery/discovery_2026-10-18_auth_page_redesign.md` is the discovery; append a section «Register compact (P-2026-10-18-1720)» to it.

## Design (decided)

Applies to the register view only, at widths ≥ 1100px; below 1100px the register view stays one column as today. Login and reset views do not change except for the footer links.

1. Main grid in the register view: `minmax(0, 1fr) 720px`, column gap 96px, inside the existing 1200px container, `align-items: start`, main vertical padding 40px.
2. Intro column in the register view: eyebrow, title at 40px / 46px, subtitle at 16px / 26px; the three feature columns and the Teaching/Research block are hidden in this view. Below the subtitle, 13px / 20px #64748b: «Your name and nickname are shown to the people you share projects with. Your email is never shown.»
3. Card in the register view: padding 32px 36px, gap 16px. Lead line under the title: «It takes a minute.» Fields in a 2-column grid (`repeat(2, minmax(0, 1fr))`, column gap 16px, row gap 14px), input and select height 40px, labels 13px, label-to-field gap 6px, in this order: First name | Last name; Nickname | Affiliation; Country | Email; Password | Confirm password. The «At least 8 characters» hint becomes the Password placeholder. Keep every field `name`, validation pattern, required flag and the tooltips (tooltips may move to an info icon next to the label if they no longer fit; keep their text).
4. Remove the newsletter checkbox from the form. The register request keeps sending the newsletter field as `false` (no DTO or API change); if the field is optional in the DTO, leave it unset. Record which in the report.
5. Bottom row of the register card: on the left, 12px / 18px #64748b, «By creating an account you accept the <a>Terms of Use</a> and the <a>Privacy Notice</a>.» with links to `https://jjodel.io/terms/` and `https://jjodel.io/app-privacy/` (new tab, `rel="noopener noreferrer"`); on the right the primary button «Create account», 44px high, padding 0 24px. Then the rule and «Already have an account? Sign in» as today.
6. Footer (all views): the «Terms» link points to `https://jjodel.io/terms/`, and a «Privacy» link to `https://jjodel.io/app-privacy/` follows it, same style. The old `https://www.jjodel.io/terms-conditions-page/` URL must not remain anywhere in the two files.

Target: at 1440×900 the register view has no vertical scroll of the page.

## DOVE

`frontend/src/pages/Auth.tsx`, `frontend/src/pages/auth.scss`. If removing the newsletter field forces a change elsewhere, stop and ask with a recommendation.

## Checks

Typecheck and build pass. Headless probe on a dev server on port 3011: register, login and reset at 1440×900, 1280×800, 1920×1080, 390×844; report the page `scrollHeight` against the viewport height for register at each desktop size, and confirm no horizontal scroll. Leave the dev server running for the chat's visual check (RC-23).

## Commits (P13), explicit pathspecs

1. `feat(auth): compact two-column register view, legal links, no newsletter opt-in (P-2026-10-18-1720)` with the two files.
2. Report section, log entry in `docs/log-inbox/maintenance.md` and Status flip: written in the worktree, left uncommitted for the chat's closure commit after the visual check.

No push, no merge (RC-19).

## NON FARE

No change to the auth API, DTOs, routing or storage. No new dependency or asset. No copy changes beyond the ones above.
