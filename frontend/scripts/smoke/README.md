# Visual smoke

Implements `docs/PROTOCOL.md` P8. Catches the coarse layout regressions that
used to be found by eye after the commit: collapsed canvas, blank screen,
overlay parked on the status bar, new console errors.

It does **not** replace Alfonso's check, which is about proportion, visual
hierarchy and perceived behaviour.

It is also not the same instrument as the single-use `_tmp_*` probes that share
this directory. Those are documented in `README-probes.md`.

## Running it

The dev server must already be up (`npm start`).

```bash
npm run smoke              # three-valued verdict, see below
npm run smoke:calibrate    # measurements only, never fails
npm run typecheck:scripts  # type coverage for these files
```

### The verdict has three values

| Verdict | Exit | Meaning |
|---|---|---|
| **GREEN** | 0 | Every assertion passed on a run that measured what it declares |
| **RED** | 1 | An assertion failed. A statement about the **application** |
| **VOID** | 3 | The run did not measure what it declares. A statement about the **machine** |
| (harness) | 2 | `console-baseline.json` unreadable |

**A void run is not a pass and not a failure: nothing is certified, and the run
is repeated.** Report it in the prompt log as a void with its cause, never as a
green and never as a red.

A run is void when either guard fires:

- **quiescence** (`quiescence.ts`) — a file the dev server serves was added,
  removed or modified while the run was in flight. The report names the files
  and the state whose window they fell in. The watched perimeter is
  `src/`, `public/`, `vite.config.ts` and `index.html`: everything vite reads
  and pushes into the page. `vite.config.ts` is the worst case — saving it does
  not hot-update the page, it RESTARTS the dev server, so the states opened
  after it are measuring a different server than the ones before. `scripts/` is
  deliberately outside: a `_tmp_*` probe saved during a run must not void it.
  Cost measured 2026-08-30: 4756 files in 22-25 ms per scan, four scans per run.
- **boot ceiling** (`countBoots` in `assertions.ts`) — a state's page loaded the
  document more than once, counted from `[vite] connecting...`. Every console
  pattern is then that pattern taken N times, not a regression.

Void outranks red on purpose. On a run that booted three times the assertions
are arithmetic on a repeated tally, so calling it red would name the application
for something the machine did.

### Why the guards exist

The smoke shares one dev server with every other session on this machine, and
the vite client writes into the console of the very page being measured.
Measured 2026-08-30 over 12 consecutive runs
(`docs/discovery/discovery_2026-08-30_6_smoke_flaky.md`): ten runs on a still
tree gave **byte-identical** tallies — 13/14/15 messages, ten times out of ten —
and the two runs a concurrent save fell into went red on whichever state was
open at that instant. Correlation 8 out of 8 on the runs an independent watcher
covered. The "counts at 3x the baseline" of that report is not a count that
grew: it is the same count taken three times, after two `full-reload`s.

The guards are two because neither covers the other. A `hot updated` leaves the
boot count at 1, and a dev-server restart could reboot the page with nothing
moving under `src`.

**With another session editing `frontend/src`, development runs will often be
void. That is the correct behaviour, not a blockage.**

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
| `assertions.ts` | DOM measurement, the five assertions, console normalization, boot count |
| `quiescence.ts` | Snapshot and diff of what the dev server serves: did the tree move under the run |
| `run.ts` | Runs the assertions, prints the report, decides the three-valued verdict |
| `calibrate.ts` | Prints raw measurements; `--write-baseline` regenerates the baseline, unless the run is void |
| `console-baseline.json` | Generated. Never hand-edited |
| `README-probes.md` | The `_tmp_*` probes: a different instrument, its own conventions |

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

## The five assertions

They were four when this file was written, and A5 arrived without the heading
following it. Corrected 2026-08-30; the count here is the count `run.ts` runs.

| | What |
|---|---|
| **A1** | `.editor-v2__canvas`, `.editor-v2__main` and `.react-flow` are mounted. Proxy for the blank screen in states with no nodes |
| **A2** | `canvas.width / main.width >= CANVAS_MAIN_RATIO_MIN` (0.95). Measured 1.0000; a collapse to 30% gives 0.30 |
| **A3** | No visible `position: fixed` element outside the allowlist intersects `.app-statusbar`, tolerance 0 |
| **A4** | No console regression against `console-baseline.json` |
| **A5** | Chrome stack contiguous: no gap between app bar, toolbar, rail and status bar |

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

### Why the list is explicit, and not `[role="dialog"]`

`[role="dialog"]` is broader than "modal". `.app-notif-popover`
(`src/components/NotificationCenter.tsx:105`) and `NodeProblemOverlay`
(`src/components/editor-v2/problems/NodeProblemOverlay.tsx:180`) carry it and
are `position: fixed`: with that selector in the allowlist, a regression parking
either of them over the status bar would be exempted by the very assertion that
exists to catch it.

The explicit list takes the opposite risk: a new modal not yet listed produces a
false positive. That is the right way round to be wrong — a false positive is
visible and fixed in thirty seconds, a false negative is never seen. **When you
add a modal, add it here.**

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

### What A4 does not count

Keys under `debug|[vite] ` — the dev client's own `connecting...`, `connected.`
and `hot updated: …` — are excluded from the comparison, on **both** sides:
observed and baseline. The committed baseline contains three of them, and
filtering one side only would report every run as having lost a pattern.

This is not a softening. Those lines carry exactly two signals, and both moved
to the instrument that reads them properly: `hot updated` means somebody saved a
file mid-run, which the quiescence guard reports naming the file; repeated
`connecting...` means the page rebooted, which the boot ceiling reports naming
the count. Inside A4 both arrived as "a console regression", which is the one
thing they are not.

The prefix is `debug|`, not `[vite]` at any level: an
`error|[vite] Internal Server Error …` is the dev server failing to compile the
app, and that still fails A4.

**Note.** `calibrate.ts` carries the same two guards, and the rule «recalibrate
only after a quiet run» is now code rather than a note: on a perturbed run it
prints VOID, names the file that moved, exits 3 and **does not write** the
baseline. A stray `[vite] hot updated` frozen into this file would become the
reference every later run is compared against, silently and permanently — which
is why calibrate refuses where `run.ts` merely declares. The measurements are
still printed on a void run: unusable as a baseline, readable as numbers, as
long as it says so.

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

- ~~**44 React "Encountered two children with the same key"** across the three
  states (6 / 18 / 20)~~ — **paid, verified 2026-08-30.** The count is 0 in
  every state, so the pattern is gone from the baseline entirely. It had been
  recorded on 2026-08-01 as "possible relation to the pre-existing
  `Dock.tsx:388` key bug, to be verified": that verification is what the quiet
  recalibration performed, and it is why the entry is struck through rather
  than deleted — a debt that was paid is a different fact from a debt that was
  never there. A4 carried those 44 as slack until then: a margin against a bug
  that no longer existed, which would have absorbed a real regression of up to
  the same size without failing.
- **`.editor-v2__canvas` and `.editor-v2__main` have `bottom=950`** against a
  900px viewport: 50px of vertical overflow.
- **`wrong project setup in navbar`** (2/2/3) and **`stateinitializer`** (2 per
  state).
