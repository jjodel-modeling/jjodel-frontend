# Discovery 2026-10-18 — auth page redesign (editorial layout)

- Prompt-ID: P-2026-10-18-1500
- Prompt file: `docs/prompts/claude_2026-10-18_1500_prompt_login_redesign.md`
- Session: ffa0a8d0-376b-4a03-9857-4c19f2e0996e
- Tree: `~/jjodel-w-login`, branch `login-redesign`, HEAD `87feac64a` at Phase 1
- Executor: Opus 5.5 (`claude-opus-5-5`), effort high
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

## Objective

Replace the split-screen auth page (dark `BrandingPanel` + small card) with the light, three-band editorial layout D2 decided in chat C-2026-10-17-1530, touching only `frontend/src/pages/Auth.tsx` and `frontend/src/pages/auth.scss`, with every form behaviour unchanged.

## Hypotheses under test

1. **H1 — the classes of `auth.scss` are used only by `Auth.tsx`.** Partly holds. Every `auth-*` and `login-*` class used by the page is referenced, outside the two files, only by a comment or by an independent rule of its own (detail in the inventory). No TSX outside `Auth.tsx` uses any of them.
2. **H2 — IBM Plex Mono and Inter are already loaded.** Holds (read). `frontend/src/styles/tokens/_typography.scss:88`: `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');`; `:16`: `--font-mono: 'IBM Plex Mono', 'Monaco', …`; `frontend/src/index.tsx:8`: `import '@fontsource-variable/inter';`. No new font download is needed: the eyebrow uses `var(--font-mono)`.
3. **H3 — the three views switch by local state only.** Holds (read). `Auth.tsx:55`: `const [action, setAction] = useStateIfMounted<'login'|'register'|'retrieve-password'>('login');`; switches are `setAction(...)` on `.login-link` spans (`:688`, `:694`, `:697`, `:704`, `:707`). No route change.
4. **H4 — no test or snapshot touches the auth page.** Holds (measured). `command grep -rlE 'AuthPage|auth-split|auth-form' --include='*.test.ts' --include='*.test.tsx' src` from `frontend/` returned nothing; positive control `command grep -rlE 'describe\(' --include='*.test.ts' src | wc -l` returned 352. `frontend/scripts/smoke/` and `frontend/scripts/` gave no match for the same pattern.
5. **H5 — the page can scroll inside the app shell as it is.** Falsified (read). `frontend/src/index.scss:14-20`: body and `#root` have `height: 100vh; … overflow: hidden;` and `:31` `#root{ position: fixed; // without this, it can scroll`. A taller register card would be clipped: the new root must be its own scroll container (`height: 100vh; overflow-y: auto`).

## Files read

- `frontend/src/pages/Auth.tsx` (724 lines, whole, two windows 1-259 and 260-724)
- `frontend/src/pages/auth.scss` (940 lines, whole, two windows 1-479 and 480-940)
- `frontend/src/version.ts` (whole)
- `frontend/src/components/forEndUser/Tooltip.tsx` (windows 125-150, grep of the class/function heads)
- `frontend/src/components/BrowserWarningModal/BrowserWarningModal.tsx` (grep of classNames), `browser-warning-modal.scss:7`
- `frontend/src/common/U.tsx:388-402` (`U.alert`)
- `frontend/src/App.tsx:130, 135-155, 173`
- `frontend/src/index.scss:11-35`, `frontend/src/styles/style.scss:13-22, 865-981` (grep), `frontend/src/styles/tokens/index.scss:67-85, 115-125`, `frontend/src/styles/tokens/_typography.scss:13-16, 76-92`
- `frontend/src/components/editors/views/data/viewapplyto.scss:675-690`
- `docs/PROTOCOL.md:300-317` (P13 Status line)

## Mount points

- `BrowserWarningModal` is rendered inside the page section (`Auth.tsx:716-720`) and is a `position: fixed` overlay (`browser-warning-modal.scss:7`): it is independent of the layout and stays where it is.
- Alerts: `U.alert` is a facade over the global ToastProvider (`U.tsx:390` and comment above it: "This facade dispatches to the modern ToastProvider"); nothing mounts in the page.
- Tooltips: `TooltipClass` clones its single child (`Tooltip.tsx:275`: `let ret = React.cloneElement(child, injectProps);`); the popup is drawn by the global `TooltipVisualizer` (`App.tsx:130`). No wrapper element is added around fields, so `.tooltip-container` (in `auth.scss:535, 937`) matches nothing.
- Routing: `App.tsx:146` and `:173` render `<AuthPage/>` on `auth` and `*`. Unchanged.

## Class inventory of `auth.scss`

Measured with `command grep -rlwE` over `frontend/src`, excluding the two files (BSD grep, so gitignored paths are not an issue under `src`). Positive control in the same run: `active` → 320 files.

| Class | External files | What the external reference is |
|---|---|---|
| `auth-split-screen` | 1 | `viewapplyto.scss:682`, a comment only ("`auth.scss`'s `select:invalid` is scoped to `.auth-split-screen.dirty`") |
| `auth-checkbox-row` | 1 | `styles/tokens/index.scss:119`, its own independent rule; no TSX uses the class anywhere |
| `login`, `login-button`, `login-link` | `styles/style.scss:865-981` (+ `joiner/classes.ts`, `api/persistance/auth.ts` on the word only) | `style.scss` defines its own `.login { … & .login-button … & .login-link }` block, scoped to `.login`. No `className` containing `login` as a class exists outside `Auth.tsx` (`grep "className=[^>]*\blogin\b"` → 0) |
| `form-control`, `mt-3`, `dirty`, `register`, `checked`, `active`, `bg` | many | Bootstrap / generic names; `auth.scss` uses them only scoped under `.auth-split-screen` or `.auth-*` (except `.login.bg`) |
| `auth-branding*`, `auth-feature`, `auth-partners-*`, `auth-form`, `auth-form-panel`, `auth-form-header`, `auth-footer-links`, `auth-footer-row`, `auth-section-divider`, `auth-field-hint`, `auth-checkbox-label`, `auth-toggle*`, `auth-custom-checkbox*`, `auth-terms-*`, `login-buttons`, `login-button--secondary`, `tooltip-container` | 0 | — |

Unused even inside `Auth.tsx` today (read): `auth-branding-features`, `auth-feature`, `auth-branding-affiliation`, `auth-checkbox-row`, `auth-checkbox-label`, `auth-toggle*`, the legacy `.login` / `.login.bg` block, `label.mt-3`, `.tooltip-container`.

Consequence for Phase 2: every rule of `auth.scss` is removable as far as other files go. The legacy `.login` block of `auth.scss` duplicates the one in `style.scss`, and no element carries `login`; removing it changes no rendering. The `.auth-checkbox-row` rule of `tokens/index.scss` is self-sufficient.

## New class names (BEM, prefix `auth-`)

Grep for each prefix over `frontend/src` with `command grep -rlE -- '<name>([^a-zA-Z0-9-]|$)'`: `auth-page` 0, `auth-card` 0, `auth-header` 0, `auth-main` 0, `auth-intro` 0, `auth-footer` 0 (exact, not `auth-footer-links`), `auth-eyebrow` 0, `auth-pillars` 0, `auth-adoption` 0, `auth-partners` 0 (exact), `auth-name-row` 0, `auth-label-row` 0, `auth-forgot` 0, `auth-switch` 0, `auth-alt` 0. Positive control in the same run: `auth-form` → 2.

Chosen: block `auth-page` (root section, keeps the `register` / `retrieve` / `dirty` modifiers) with elements `__header`, `__logo`, `__nav`, `__nav-link`, `__github`, `__switch`, `__main`, `__intro`, `__eyebrow`, `__eyebrow-mark`, `__title`, `__subtitle`, `__pillars`, `__pillar`, `__pillar-title`, `__pillar-text`, `__adoption`, `__adoption-label`, `__adoption-value`, `__footer`, `__partners`, `__partner`, `__partner--univaq`, `__meta`, `__terms`, `__version`; block `auth-card` (added to the existing `auth-form`) with `__title`, `__lead`, `__row`, `__field`, `__label-row`, `__link`, `__alt`. Kept on the elements that stay: `auth-form`, `login-buttons`, `login-button`, `login-button--secondary`, `auth-section-divider`, `auth-field-hint`, `auth-custom-checkbox*`, `auth-terms-text`, `auth-terms-link`.

## Risks

- R1: The `dirty` required-star rule (`auth.scss:507`, `label:has(> input:required:invalid, …)::before`) depends on a label that wraps its input. The login Password row has to carry the «Forgot?» link next to the label; a `<button>` inside a `<label>` that also holds the input would be legal but fragile (a labelable element placed first becomes the label's control). The Password field becomes a `div.auth-card__field` with a `label htmlFor` and a separate input, and the star rule gets an extra selector for that structure.
- R2: Bootstrap `.btn-primary` styles reach the submit buttons; the new rules must out-specify them, as the current ones do (`.auth-split-screen .login-button`).
- R3: Root class rename `auth-split-screen` → `auth-page`: the only external reference is a comment (`viewapplyto.scss:682`), left as it is (Rule 8).
- R4: At 1920px the grid stretches; the spec fixes columns and gaps, not a max width, so the card sits at the right edge of a 1760px band. Followed as specified.

## Decisions taken (unattended)

1. Root class is `auth-page`, replacing `auth-split-screen` (new names asked by the prompt; only external reference is a comment). Recommended: as taken.
2. The register lead line «It takes a minute. Fields marked * are required.» is omitted: the form marks required fields with `*` only after a failed submit (`.dirty` state, `auth.scss:505-516`), never at rest. Recommended: omit.
3. The primary button labels stay «Login», «Create», «Retrieve»: the design gives no copy for them and the prompt forbids other copy changes. Recommended: keep.
4. The in-card view links become `<button type="button">` styled as links instead of `span tabIndex={-1}`, so they are keyboard reachable; same handlers. Recommended: as taken.
5. The «Offline mode» button (localhost / file only) stays, restyled as an outlined secondary under the primary. Recommended: keep.
6. Main band gets 48px vertical padding (not specified) so the grid never touches header and footer. Recommended: as taken.
7. The register / retrieve lead texts, card titles and footer links use the prompt's copy verbatim; «Go back to the Login page» and the retrieve view's «Don't have an account? Register» are replaced by «Already have an account? Sign in» as the design says.
8. The report, the log entry and the Status flip stay uncommitted in the worktree for the closure commit after the chat's visual check (P13: "the lane writes the Status flip, its log or inbox entry and the visual-check line into its worktree and does not commit them").

9. **Header logo is `frontend/src/static/img/logo-light-150.png`, not `jjodel.png`.** Measured in Phase 2: `jjodel.png` (1000×562 RGBA) is a white wordmark on transparent, made for the old dark panel; on the white header it rendered at 50×28 with nothing visible (headless Chromium, 1440×900, element `display: block`, `opacity: 1`, `naturalWidth 1000`). The prompt's context item 2 ("Product logo: `jjodel.png` (dark wordmark)") does not hold. `logo-light-150.png` (150×60) is the dark wordmark the app already uses in `pages/components/Navbar.tsx:3` and `about/AboutDialog.tsx:3`; existing asset, no new image. Recommended: as taken.

## Decisions awaiting Alfonso

None from the RC-26 list.

## Phase 2 results (2026-10-18)

- Code commit `b8a12dc99`, `frontend/src/pages/Auth.tsx` and `frontend/src/pages/auth.scss` only.
- `npm run typecheck`: exit 0, no `error TS` (`.agent-logs/typecheck-*.log`).
- `npm run build`: exit 0, only the chunk-size warning.
- Lint: no `lint` script in this repo (CLAUDE.md §17: ESLint not installed), not run.
- `npm run test`: 12 files failed, 367 passed; 25 tests failed, 9255 passed. Nine are the known `window is not defined` import failures of CLAUDE.md §17. The other three are `frontend/scripts/hooks/__tests__/laneRun.test.ts`, `laneRunDirect.test.ts`, `laneRunRouting.test.ts`, failing on `Unknown file extension ".ts" for …/frontend/scripts/gates/decisions-query.ts` (lane-run harness, not imported by the auth page). Measured on the tip: a detached worktree at `87feac64a` (HEAD before this lane), `npx vitest run scripts/hooks/__tests__/laneRunRouting.test.ts` → 5 failed / 8 passed, so they are older than this lane. No test touches the auth page (H4).
- Headless probe (Playwright from the existing `node_modules`, script in `/tmp`, not in the repo) against the dev server on port 3010, three views × 1440×900, 1280×720, 390×844, 360×740: no horizontal scroll in any of the 12 states (`scrollWidth` equals `clientWidth` on `.auth-page`, `documentElement.scrollWidth` equals the viewport), no page error. Card titles «Sign in» / «Create an account» / «Reset your password», switch button «Register» / «Sign in» / «Sign in». At 1440: header 72px, card at x=940 width 420, intro at x=80 width 740, footer 104px. At 390: card first (y=96), intro after it (y=555 login), title 40px, Documentation `display: none`. Submit background `rgb(30, 41, 59)` (#1e293b), card link `rgb(3, 105, 161)` (#0369a1). These are the lane's own measures; the visual check is the chat's (RC-23).
- Dev server left running: `npx vite --port 3010 --strictPort --host 127.0.0.1` from `frontend/`, log `.agent-logs/devserver-3010.log`. URL `http://127.0.0.1:3010/#/auth`.

### Correction round after the chat's visual check (2026-10-18)

- Chat check (RC-23) at 1440×900 and 390×844: layout matches D2, two corrections asked. Fix commit `a42694244`, same two files, no amend.
- (1) `.auth-page__main` `align-items: center` → `start`, 48px vertical padding kept. Before: register view at 1440, card 1012px tall at y=120, intro at y=363 (chat measured y=404 in its browser).
- (2) Primary labels: «Login» → «Sign in», «Create» → «Create account», «Retrieve» → «Send reset link». Overrides unattended decision 3 above (chat, RC-25).
- `npm run typecheck` exit 0; `npm run build` exit 0, only the chunk-size warning. Tests not re-run: the fix changes three text nodes and one CSS value, and no test touches the page (H4).
- Headless probe, same 12 states, port 3010: no horizontal scroll, 0 page errors. Two-column states, card top = intro top: 1440 login 171/171, register 120/120, retrieve 171/171; 1280 login, register, retrieve 120/120. One-column states unchanged (card first at y=96). Submit labels read «Sign in» / «Create account» / «Send reset link» in all four sizes.
- Dev server still on 3010.
