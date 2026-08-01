# Visual smoke

Implements `docs/PROTOCOL.md` P8. Catches the coarse layout regressions that
used to be found by eye after the commit: collapsed canvas, blank screen,
overlay parked on the status bar, new console errors.

It does **not** replace Alfonso's check, which is about proportion, visual
hierarchy and perceived behaviour.

## Running it

The dev server must already be up (`npm start`).

```bash
npm run smoke              # assertions, exit != 0 on failure
npm run smoke:calibrate    # measurements only, never fails
npm run typecheck:scripts  # type coverage for these files
```

### Node version

The scripts are TypeScript run through node's own type stripping, so there is
no transpiler dependency:

```
node --disable-warning=ExperimentalWarning --experimental-strip-types <file>.ts
```

`--experimental-strip-types` requires **Node >= 22.6.0**. Verified on 23.3.0.
Type stripping only erases annotations: no `enum`, no `namespace`, no parameter
properties in these files.

## Files

| File | Role |
|---|---|
| `states.ts` | Environment, thresholds, allowlist, the three states, localStorage seeding |
| `assertions.ts` | DOM measurement, the four assertions, console normalization |
| `run.ts` | Runs the assertions, prints the report, sets the exit code |
| `calibrate.ts` | Prints raw measurements; `--write-baseline` regenerates the baseline |
| `console-baseline.json` | Generated. Never hand-edited |

## Reaching the app

Everything is behind authentication, and the persistence backend
(`localhost:5002`) is not running in dev. Offline mode is the supported way in.

`states.ts` seeds `localStorage` before the first script of the page runs:

- `user` — the offline user in the exact shape `AuthApi.offline()` writes
  (`src/pages/Auth.tsx:660` -> `DUser.offline()`, `src/joiner/classes.ts:2734`)
- `offline: true` — so `src/redux/reducer/reducer.ts:1513` skips the token check
- `jjodel_welcome_3_seen` — `WelcomeModal`'s backdrop otherwise swallows clicks
- `jjodel.interfaceMode` — `basic` or `advanced`

The project is then created through the real UI and opened by URL,
`#/project?id=<id>`. No application code is modified or bypassed.

## The four assertions

| | What |
|---|---|
| **A1** | `.editor-v2__canvas`, `.editor-v2__main` and `.react-flow` are mounted. Proxy for the blank screen in states with no nodes |
| **A2** | `canvas.width / main.width >= CANVAS_MAIN_RATIO_MIN` (0.95). Measured 1.0000; a collapse to 30% gives 0.30 |
| **A3** | No visible `position: fixed` element outside the allowlist intersects `.app-statusbar`, tolerance 0 |
| **A4** | No console regression against `console-baseline.json` |

`.app-statusbar` is **not** `position: fixed` — it is a flex child
(`src/components/StatusBar.scss:9-24`). Its rect is measured, never assumed to
be at the bottom of the viewport.

A state may declare `skip: [{assertion, reason}]`. `empty-project` skips A1 and
A2 because no tab is open and the editor is legitimately not mounted. Skipped
assertions print as `SKIP` with the reason — never as `PASS`.

### Why the allowlist

`#root` is `position: fixed` at full viewport (`src/index.scss:31`), so it
intersects the status bar by construction: a structural false positive. The
other entries are modal backdrops, fixed and full-screen by design. Their
selectors were read from the SCSS, not guessed.

Matching is exact (`el.matches`), never `el.closest`: with `#root` in the list,
an ancestor-based match would exempt the whole document.

None of the modals is open in the three current states, so that part of the
allowlist is prophylaxis for states added later, not something exercised today.

`[role="dialog"]` is in the list as a safety net, and it is broader than
"modal": `.app-notif-popover` (`src/components/NotificationCenter.tsx:105`) and
`NodeProblemOverlay` (`src/components/editor-v2/problems/NodeProblemOverlay.tsx:180`)
also carry it and are fixed, so a regression parking either over the status bar
would be exempted. Narrow it if that ever matters.

## The console baseline

`console-baseline.json` is **generated**, never hand-edited:

```bash
npm run smoke:calibrate -- --write-baseline
```

**It records the console debt that exists today. It does not absolve it.**
When a bug is fixed, regenerate so the counts go down. A4 already helps: a count
below the baseline is not a failure, it prints

```
IMPROVED: <pattern> — 44 -> 12, lower the baseline
```

A4 fails only when a pattern absent from the baseline appears, or when an
existing pattern exceeds its baseline count.

### Key normalization

Raw messages are not stable across runs, so each is reduced to a key
`<level>|<pattern>`:

1. whitespace and newlines collapsed to single spaces, then trimmed — most
   messages carry a multi-line stack trace, and without this the 120-char
   truncation would cut inside the first line and produce keys that differ run
   to run
2. full URLs -> `<URL>`
3. UUIDs and hex hashes of 8+ chars -> `<ID>`
4. runs of 4+ digits -> `<N>`
5. truncated to 120 characters

Order matters: URLs first, since a URL contains both digits and hex.

## Not covered

Printed on every run, so a gap is never mistaken for a pass:

1. **Node count > 0.** Every state has 0 nodes, correctly — the assertion was
   meant for the populated viewpoint. A1 replaces it as the blank-screen proxy.
2. **Children clipped beyond tolerance** (P8, point 5). The calibration produced
   no element from which to define it without false positives.
3. **States `properties-panel-open` and `viewpoint-populated`.** They need
   `data-testid` attributes and a project fixture, neither authorized.

## Known debt, recorded not fixed

Visible in the baseline, deliberately not addressed here:

- **44 React "Encountered two children with the same key"** across the three
  states (6 / 18 / 20). Possible relation to the pre-existing `Dock.tsx:388` key
  bug noted on 2026-07-31 — to be verified.
- **`.editor-v2__canvas` and `.editor-v2__main` have `bottom=950`** against a
  900px viewport: 50px of vertical overflow.
- **`wrong project setup in navbar`** (2/2/3) and **`stateinitializer`** (2 per
  state).
