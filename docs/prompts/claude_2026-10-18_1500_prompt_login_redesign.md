# Auth page redesign: editorial layout for sign in, register and password reset

Prompt-ID: P-2026-10-18-1500
Chat: C-2026-10-17-1530
Front: maintenance
Lane: full (user-facing page every user goes through; two phases in cascade)
Status: da eseguire
Request: Alfonso, 2026-10-18 14:58, «macmaster ha approvato, metti online la D2» (design D2 chosen in this chat on 2026-10-17/18 from four mockups)
Depends: none
Corregge: —
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-login`, branch `login-redesign`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and `git status` match; otherwise stop with `Outcome: blocked`.

Model and tier: standard, Opus 5.5 as pinned (RC-16), effort `high`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-18-1500 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`. Unattended (RC-21, RC-25): take the recommended answer on every question outside the RC-26 list and record it in the report under «Decisions taken (unattended)».
Time limit: 90 minutes. Phase 2 follows Phase 1 in the same session without waiting for a GO, unless Phase 1 finds something on the RC-26 list.

## Context (measured by the chat on 2026-10-18, do not redo)

1. One component serves the three auth views: `frontend/src/pages/Auth.tsx` (724 lines), `AuthPage` with `action: 'login' | 'register' | 'retrieve-password'`, styled by `frontend/src/pages/auth.scss` (940 lines). The current layout is a split screen: `BrandingPanel` (lines ~27-51: logo, «Welcome to Jjodel», tagline, three partner logos, jjodel.io link) on a dark panel, and `.auth-form-panel` with a small card (`<section className="auth-split-screen …">` at line ~251).
2. Partner logos: `frontend/src/static/img/partners/univaq.png` is already white on transparent (2685×1468); `mdu.svg` and `fbk.png` are dark. Product logo: `frontend/src/static/img/jjodel.png` (dark wordmark).
3. Version: `frontend/src/version.ts` exports `APP_VERSION` (from `__APP_VERSION__`).
4. Icons: Bootstrap Icons only (`bi bi-github` exists).
5. The register view has many fields (first name, last name, nickname, affiliation, country, email, password, password check, newsletter, terms) with tooltips and validation; the retrieve view has email only.

## Design (decided, not to reopen)

The page is a light, editorial layout with three bands. Exact copy is in English and must be used verbatim.

**Header** (72px, `border-bottom: 1px solid #e2e8f0`, horizontal padding 80px). Left: `jjodel.png`, height 28px, alt «Jjodel». Right, gap 28px, 14px text: a «Documentation» link to `https://docs.jjodel.io` (color #334155, new tab); an icon-only link to `https://github.com/jjodel-modeling/jjodel-frontend` with `bi bi-github` at 20px, `aria-label="Jjodel on GitHub"`, 36×36 hit area; an outlined button (36px high, padding 0 16px, `1px solid #cbd5e1`, radius 6px, 500 weight, color #0f172a) reading «Register» that switches to the register view. In the register and retrieve views that button reads «Sign in» and switches to login.

**Main** (fills the remaining height, horizontal padding 80px): a two-column grid `minmax(0, 1fr) 420px`, column gap 120px, rows centered vertically.

Left column, vertical gap 28px:
- Eyebrow: 8×8px square, radius 2px, `#06b6d4`, then «Jjodel X.Y» where X.Y is the major.minor of `APP_VERSION`; IBM Plex Mono if already loaded by the app (otherwise the app's monospace stack), 12px, uppercase, letter-spacing 0.06em, #475569.
- Title (`h2`): «The modeling workbench for research and teaching.» 56px / 62px, weight 600, letter-spacing -0.03em, #0f172a, max-width 640px.
- Subtitle: «Metamodels and models side by side, with viewpoints, transformations and an AI assistant. Open source, in the browser.» 18px / 28px, #475569, max-width 560px.
- Three columns (`repeat(3, minmax(0, 1fr))`, max-width 640px, `border-top: 1px solid #e2e8f0`, 1px #e2e8f0 vertical hairlines between them, 20px top padding, 24px side padding inside the rules). Each has a 14px/600 heading and a 13px/20px #64748b line: «Metamodels» / «Languages and the models that conform to them.»; «Viewpoints» / «Several notations for the same model.»; «Transformations» / «Model to model, with JjTL.»
- Adoption block: a grid `112px minmax(0, 1fr)`, row gap 10px, column gap 16px, max-width 640px. Labels in the eyebrow's mono face, 11px, uppercase, letter-spacing 0.06em, #64748b; values 14px / 22px, #334155. Row 1: «Teaching» / «University of L'Aquila (Italy), Mälardalen University (Sweden), McMaster University (Canada), An-Najah National University (Palestine)». Row 2: «Research» / «European projects AIM-PRO and PISAI». Keep the entries in one array constant at the top of the file so adding a university is a one-line change.

Right column: the form card. Padding 40px, `1px solid #e2e8f0`, radius 12px, white, `box-shadow: 0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.05)`, vertical gap 20px.
- Title (`h1`) 22px / 30px, 600, letter-spacing -0.01em: «Sign in» / «Create an account» / «Reset your password». Under it, 14px / 22px #475569: «Continue to your projects.» / «It takes a minute. Fields marked * are required.» (only if the form already marks required fields; otherwise omit the line) / «We will send a reset link to your email.»
- Labels 13px, 500, #1e293b, 8px above the field. Inputs and selects 44px high, padding 0 14px, `1px solid #cbd5e1`, radius 6px, 14px text; focus as the design system (`border-color: #334155`, `box-shadow: 0 0 0 3px rgba(51,65,85,.12)`).
- Login: the «Forgot?» link sits on the Password label row, right-aligned, 13px, and opens the retrieve view.
- Primary button: full width, 44px, radius 6px, background #1e293b, white, 14px/600; hover #0f172a.
- Below a 1px #e2e8f0 rule, 13px #475569: «New to Jjodel? Create an account» (login), «Already have an account? Sign in» (register, retrieve).
- Links on white use #0369a1, hover #075985 with underline (contrast ≥ 4.5:1; the current #0ea5e9 fails).
- Register: keep every field, tooltip, validation, the newsletter checkbox and the terms sentence exactly as today, restyled with the rules above; first and last name may share a row. The card can be taller than the viewport: the page scrolls, the header and footer are not sticky.

**Footer** (104px, horizontal padding 80px, `background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`). Left, gap 40px, no label: `univaq.png` at 38px high, opacity .9 (no filter, it is already white); `mdu.svg` and `fbk.png` at 34px high with `filter: brightness(0) invert(1)`, opacity .9; alt texts as today. Right, gap 20px, 12px: a «Terms» link (#cbd5e1) to the terms URL already used in the register form, then `v{APP_VERSION}` in mono 11px #94a3b8.

**Small screens.** Below 1100px the grid becomes one column with the form card first and the left column after it, max-width 560px, centered; the title drops to 40px / 46px. Below 640px horizontal padding is 20px, the header keeps the logo, the GitHub icon and the Register/Sign in button (Documentation hides), the three columns stack, the footer logos wrap. No horizontal scroll at 360px.

Removed: the dark `BrandingPanel`, «Welcome to Jjodel», the «Research partners» label, the jjodel.io link (the logo in the header is not a link).

## COSA

**Phase 1 (read-only, short).** Read `Auth.tsx` and `auth.scss` whole (CLAUDE.md §0.1: with offset/limit). List: every class in `auth.scss` and whether anything outside these two files uses it (grep `frontend/src`); the fonts the app already loads (Inter, IBM Plex Mono); how the three views switch and where the browser warning modal and alerts mount; any test or snapshot touching the auth page. Propose the new class names (BEM, prefix `auth-`) and grep each against the codebase before using it (§ name collision rule). Write the report, then continue to Phase 2 unless an RC-26 item appears.

**Phase 2.**
1. Restructure the JSX of `AuthPage` into header, main (copy column + card) and footer as designed. Keep all state, handlers, `onSubmit`, API calls, field `name`s, validation patterns, tooltips, `isDirty`/`dirty` classes and `BrowserWarningModal` unchanged in behaviour.
2. Rewrite `auth.scss` for the new layout. Remove only the rules that Phase 1 proved unused outside the two files.
3. `npm run lint`, `npm run typecheck` (or the repo's equivalents), `npm run build` and the existing tests must pass.
4. Start the dev server on the worktree's port and leave it running for the chat's visual check (RC-23): login, register and retrieve at 1440×900, 1280×720 and 390×844.

## DOVE

`frontend/src/pages/Auth.tsx`, `frontend/src/pages/auth.scss`. Nothing else under `frontend/src`. If a third file is needed (for example a constant module), stop and ask with a recommendation.

## Report

`docs/discovery/discovery_2026-10-18_auth_page_redesign.md`: objective, files read with paths, the class inventory, the new class names with grep results, risks, «Decisions taken (unattended)», «Decisions awaiting Alfonso» (numbered, each with `Recommended:`).

## Commits (P13), explicit pathspecs

1. `feat(auth): editorial layout for sign in, register and password reset (P-2026-10-18-1500)` with the two files.
2. One docs commit after the chat's visual check: the report, the log entry in `docs/log-inbox/maintenance.md` (§21.2, `Corregge: —`) and the Status flip of this prompt. `npm run check:docs` must pass.

No push, no merge (RC-19). The merge into `alfonso-frontend-jjtl` is the chat's, after the visual check; the page reaches app.jjodel.io with the next release.

## NON FARE

No change to the auth API, DTOs, routing, storage or the dashboard. No new dependency, no new font download, no new image asset. No change to copy other than what is written above. No dark-theme rules (D-UI-15).

## RIFERIMENTI

`frontend/src/pages/Auth.tsx:27-51, 251-724`; `frontend/src/pages/auth.scss`; `frontend/src/version.ts`; `frontend/src/static/img/partners/`; design system tokens (slate #334155 accent, cyan #06b6d4 accent used sparingly, hairline #e2e8f0).
