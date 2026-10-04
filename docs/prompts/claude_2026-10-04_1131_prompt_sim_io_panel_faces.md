# Prompt: styles of the I/O board's front panel, what is drawn (themes, shapes, icons, sizes, pop out, extras)

Prompt-ID: P-2026-10-04-1131
Chat: C-2026-10-04-1126
Lane: full (both skins of the board card, the board editor, viewer prefs; tests first; probe; visual, RC-23 by the chat). Tier: heavy (RC-32). Model: the default of `.claude/settings.json`, no deviation.
Status: da eseguire
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: no discovery of its own (motivo: the report of P-2026-10-04-1130, `docs/discovery/discovery_2026-10-04_sim_io_panel_styles.md`, covers this lane; RC-11). Read it first; if it names a decision below that the code contradicts, stop with `Outcome: question` before any code.
Chain: second of two lanes run by `lane-run chain` in `~/jjodel-w-iopanel`, branch `sim-io-panel`, after P-2026-10-04-1130 ended `done`. Before anything else: `pwd`, branch, `git log -3` (the closure commit of P-2026-10-04-1130 on top) and `git status` (clean). Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-04-1131 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Contesto (non rifare l'analisi)

P-2026-10-04-1130 added to the board record: `theme`, `accent`, `cols`, device `span` and `style`, the kinds `silk` and `buzzer`, the pure `simBoardIcons.ts` (`suggestIcon`, `suggestKeys`) and `maxDisplayLength`, with rows D-UI-16 and R-SIM-123..129. This lane draws them. Reference look: the artifact «Front panel styles» validated by Alfonso (a microwave: display `mm:ss` over four columns, LEDs Cooking and Door, a Ding bar, silkscreens TIMER and COOK, buttons +30 s, Start, Stop, Door with keycaps).

## Decisions (provisional, unattended, adopted by the chat under RC-25; R-SIM-130..133 written by this lane)

1. **R-SIM-130, the four themes are closed palettes on Variant B only.** One modifier class per theme on the front panel's root, its colours as SCSS variables local to `SimBoard.scss` (Graphite: today's values, unchanged; Appliance: white enamel face `#fbfbf8` to `#e7e9e3`, ink `#2b2f33`, glass `#16201d`, digits `#5eead4`, membrane keys `#dfe2dc`; Instrument: cream face `#efe8d6` to `#ddd3b9`, ink `#3a3326`, glass `#14110b`, amber digits `#fbbf24` with glow, round brass keys `#cfc5ab`; Print: white face, black ink and edges, no gradient, no glow, glass white with black digits, lit LEDs filled black). Go, Stop and Accent roles per theme as in the mock-up; `accent` overrides the theme's Accent only, never on Print. No theme reads an app token or `data-theme` (D-UI-16). Variant A keeps the app's light look: it shows icons, icon mode, spans and columns, and ignores theme, accent, shape, role colours, display face and size.
2. **R-SIM-131, shapes, roles, icons, sizes.** Button and Clock faces on Variant B follow `shape` (`key`, `membrane` with the icon above the text, `round` showing the icon only with the text as title and aria-label, `text`) and the resolved role (explicit, else suggested). On both skins the resolved icon (explicit, else `suggestIcon` on the event's label, `none` hides it) renders as a Bootstrap icon `<i class=bi bi-NAME>`; `iconMode` `icon` hides the text (kept as title and aria-label), `text` hides the icon. Text display and 7-segment size the glyphs from `size` and `maxDisplayLength` so the box never changes size while the value runs (no layout shift: measure it in the probe). LED shape and colour from `style`.
3. **R-SIM-132, columns and pop out.** A board of 4 columns stays in the card slot (R-SIM-119). A board of 6 or 8 columns, or any board whose viewer chose it, opens as a floating window over the canvas, draggable by its header, clamped to the canvas, with a Dock button that returns it to the slot when it fits. Window position and docked or floating are viewer prefs per model in `simViewerPrefs.ts` (never in the model, never an undo step), lost on reload like the other prefs. The window carries the same foot (viewed step, Back to live) as the card.
4. **R-SIM-133, extras.** Shortcuts: each input device shows its resolved key as a keycap; a key press fires the device as a click does, only while focus is inside the board (card or window) and never inside an input field; a disabled device ignores its key. Silkscreen: a caption with a rule across its span, theme ink. Buzzer: on the rising edge of its boolean, a short tone through WebAudio (about 1.3 kHz, 0.45 s, created lazily on the first user gesture), muted by default with a mute toggle in the board header kept as a viewer pref; a muted buzzer still shows its lamp. Editor: the inspector of a device gains the style controls of its kind, the span (w, h) and, for Button and Clock, an icon picker with search over the installed `bootstrap-icons.json` (lazy import, no new dependency) plus Auto and None, showing the suggestion and its rule; the board's header in the editor gains theme, accent (five swatches plus Auto) and columns. Palette: `silk` and `buzzer` entries.

If the code shows that one of these cannot hold as written, stop with `Outcome: question` and a `Recommended:` line.

## COSA

The four decisions above in the files the report names for this lane (expected: `SimBoard.scss`, `simBoardDevices.tsx`, `SimBoardEditor.tsx`, `SimBoardEditor.scss`, `simViewerPrefs.ts`, `SimulationPanel.tsx` for the window mount, a new `SimBoardWindow.tsx` if the report recommends it). Rows R-SIM-130..133 in `docs/decisions.md`.

## DOVE

Under `frontend/src/components/editor-v2/sim/` and its `__tests__/` only, plus `docs/decisions.md`, this prompt's Status and `docs/log-inbox/simulation.md`. Pure modules of P-2026-10-04-1130 only for a bug found here, said in the report. A file outside: stop with `Outcome: question`. No critical-zone file. Never touch other worktrees. Grep every new identifier and CSS class first (CSS classes collide silently).

## COME

1. Read `CLAUDE.md` (sections 5, 6, 17, 20, 21.2), P16, RC-17, RC-21, RC-23, RC-25, RC-26, D-UI-15, D-UI-16, and the report.
2. Tests first, red: rendering per theme class and per shape; resolved icon and role (explicit, suggested, none); icon mode; keycaps and key presses (focus inside, input fields excluded, disabled ignored); buzzer edge detection with a fake AudioContext, muted by default; window prefs round-trip and clamp; a board without any new field renders exactly as on the base commit (snapshot of the card's markup for a fixture board).
3. Implement. Gates in the foreground: `npm run typecheck` (no new errors over 14), full vitest, `npm run build` exit 0, mutation bench on the new logic (keys, buzzer edge, window clamp).
4. Lane probe (`lane-run probe`, port 3084, never 3000, 3001 or 3003), 1600 by 1000, app theme light only (D-UI-15). On DemoESM, a board with the microwave layout of the mock-up as far as DemoESM's events allow (display over 4 columns, three LEDs, two silkscreens, four buttons). Crops of Variant B in each of the four themes, of the four button shapes, of display sizes S to XL, of Variant A, of a 6-column board as a floating window, and of the editor's inspector with the icon picker, in `~/.jjodel-lanes/P-2026-10-04-1131/`, each at most 600 px on its long side (`sips -Z 600`). Measure: a text display's box size identical before and after its value changes length; keyboard shortcuts fire the bound event (step count +1). The four demo scenes without these fields: every panel reading and the board card identical to the base commit.
5. Commits `feat:` and `test:`, then the closure docs commit (Status flip with lane, shas, gates, probe; R-SIM-130..133; inbox entry); stage by explicit path. The report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso». Stop with `Outcome: hard-stop` for the chat's visual check. Do not merge.

## HARD STOP

After the closure commit. Also before any code if an RC-26 item appears.

## NON FARE

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, removing the `frontend/node_modules` link, a new dependency, a dark variant of app UI. No change to the engine's step, the trace, the STC, JjEL, or the Clock's timer.

## RIFERIMENTI

R-SIM-104, R-SIM-110..133, D-UI-15, D-UI-16; P-2026-10-04-1130 and its report; the board's merge on the trunk `18926660a`; the Clock lane `452efc6f1`.
