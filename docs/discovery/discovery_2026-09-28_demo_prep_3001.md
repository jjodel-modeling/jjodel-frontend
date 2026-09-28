# Discovery — can the four demo projects be created inside Alfonso's own 3001 instance

- Prompt-ID: `P-2026-09-28-1015` (chat `C-2026-09-27-1437`)
- Prompt file: `docs/prompts/claude_2026-09-28_1015_prompt_demo_prep_3001.md` (path as declared by the prompt; not
  verified to exist under that exact name in this phase — see open question 3)
- Session: `70c8e78e-f467-4967-975e-54c30214b578`
- Tree: `/Users/alfonso/jjodel-w-demoprep`, branch `demo-prep`, HEAD `1a3425531e45dcc6405557a21d8680df9b9b5048`
  (`docs: add prompt P-2026-09-28-1015, prepare the four demo projects on 3001`). `git status` clean at the start
  (per the session's git-status snapshot).
- Executor: Sonnet 5 (session banner: model id `claude-sonnet-5`).
- Read-only. No source file was edited, no server started or stopped, no browser profile touched.

This report is a set of hypotheses with evidence, not a definitive reference. Anyone who uses it downstream should
re-read the real files.

---

## 0. Answer in brief

**Writing a project into Alfonso's own 3001 instance — meaning the browser session he is actually running against
`http://localhost:3001` — is not possible under this lane's constraints.** Project data in this app is not held by
the dev server; it is held in the browser's own `localStorage`, partitioned per browser profile. A headless
Chromium context driven by this lane gets its own, separate `localStorage` even when it points its address bar at
`http://localhost:3001` — it shares the server process with Alfonso's tab, not the storage. The only channel that
would let this lane's script write into Alfonso's *actual* storage is attaching to his already-running Chrome over
a remote-debugging port, and no such port is listening (checked, see §2). Starting one, or touching his Chrome
profile on disk, are both forbidden by the prompt's DOVE section.

Per the prompt's COSA section, this is exactly the condition that triggers `Outcome: question`. The recommendation
below matches the one the prompt already names as expected.

## 1. Hypotheses under test

1. **H1 — a headless browser context pointed at `http://localhost:3001` writes into the same storage Alfonso's
   Chrome tab reads.** Falsified. See §3.
2. **H2 — a Chrome DevTools Protocol (remote-debugging) endpoint is already listening, that this lane could attach
   to instead of a fresh headless context.** Falsified. See §2.
3. **H3 — the app's Import/Export project functions operate on a JSON shape this lane's builder script can
   produce.** Holds. See §4.

## 2. No remote-debugging port is listening

Measured in this phase, this machine:

```
$ lsof -iTCP:3001 -sTCP:LISTEN -n -P
COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    61660 alfonso   27u  IPv6 0x42b3bab27b0c0787      0t0  TCP [::1]:3001 (LISTEN)

$ ps -p 61660 -o pid,ppid,command
  PID  PPID COMMAND
61660 61637 node /Users/alfonso/jjodel-release/frontend/node_modules/.bin/vite --port 3001 --strictPort
```

Confirms the prompt's claim: port 3001, pid 61660, is Alfonso's dev server (Vite, tree `~/jjodel-release`). It is
a static/dev-asset server, not a storage backend (see §3).

```
$ lsof -iTCP -sTCP:LISTEN -n -P | grep -Ei "922|chrome|Chromium"
(no output)
```

No process on any of the conventional Chrome remote-debugging ports (9222 and neighbours), and no listening
process with `chrome`/`Chromium` in its command line. Positive control: the same command found the *actual*
listener on 3001 above, and `lsof` exited without error on both invocations — so the empty grep result is a
genuine negative, not a broken search (CLAUDE.md §5, the absence sub-rule).

**Conclusion: H2 is falsified.** There is no already-listening debug port to attach a controller to, and per DOVE
this lane may not start one or restart Alfonso's Chrome to create one.

## 3. Project data lives in `localStorage`, not on the server

`frontend/scripts/smoke/README.md:101-104` (read, current tree):

```
Everything is behind authentication, and the persistence backend
(`localhost:5002`) is not running in dev. Offline mode is the supported way in.
```

and (same file, "Reaching the app"):

```
`states.ts` seeds `localStorage` before the first script of the page runs:
```

This is the harness's own account of how every probe in this repo reaches a project: there is no dev-mode backend
at all (the real persistence backend, if any, is `localhost:5002`, and it is off). The 3001 dev server, confirmed
above, is Vite serving the app's JS/HTML/CSS — a client sees a project because its **own browser** holds one in
`localStorage`, not because the server does.

The write side is in the app itself. `frontend/src/pages/components/LeftBar.tsx:193` (export) builds the download
from `project.__raw`; the counterpart, `frontend/src/pages/Notes.tsx:239-251` (import), shows where a project
comes from on load:

```ts
const projects = Storage.read<DProject[]>('projects') || [];
const filtered = projects.filter(p => p.id !== project.id);
filtered.push(project);
Storage.write('projects', filtered);
```

`Storage` here is the app's `localStorage` wrapper (consistent with the README's account above): the whole
project catalog is one array under the key `'projects'`, scoped by the browser to the origin
`http://localhost:3001` **inside a given browser profile**. A Playwright/headless Chromium context started by
this lane, even navigated to the exact same origin, is a different profile with its own, empty `localStorage` for
that origin — it is not a second window onto Alfonso's data, it is a separate copy of the app starting from
nothing. This matches the prompt's own framing in COME step 1 ("a headless context on `localhost:3001` has its
own storage and is not his").

**Conclusion: H1 is falsified.** Building the four projects in a headless context pointed at 3001 exercises the
same server and the same app code Alfonso uses, but the resulting projects would sit in the headless context's own
throwaway storage, gone once that context closes — never inside Alfonso's instance.

Hitting `http://localhost:3001` from a headless context is otherwise harmless to Alfonso's server: it is an
ordinary client connection like any browser tab, not a restart, kill, or reconfiguration, so it does not violate
the DOVE constraint on pid 61660. It was not exercised in this read-only phase (no navigation was attempted).

## 4. Import/Export: format and code paths

Three call sites read/write project JSON. All three were read in full in this phase.

**Export, dashboard tile menu** — `frontend/src/pages/components/Project.tsx:199-202`:
```ts
const exportProject = async() => {
    // await ProjectsApi.save(data);
    U.download(`${data.name}.jjodel`, JSON.stringify(data.__raw));
}
```
Downloads the raw `DProject` object verbatim, filename `<name>.jjodel` (JSON text under a `.jjodel` extension).

**Export, open-project rail** — `frontend/src/pages/components/LeftBar.tsx:190-195`:
```ts
const exportProject = async() => {
    if(project) {
        await ProjectsApi.save(project);
        U.download(`${project?.name}.jjodel`, JSON.stringify(buildProjectExportJson(project?.__raw as unknown as Record<string, unknown>, project ? getRuntimeMegamodel(project.id) : undefined)));
    }
}
```
`buildProjectExportJson` (`frontend/src/model/megamodelPersistence.ts:97-106`):
```ts
export function buildProjectExportJson(
    rawProject: Record<string, unknown>,
    megamodel?: Megamodel,
): Record<string, unknown> {
    const result = { ...rawProject }
    if (megamodel) {
        result.megamodel = serializeMegamodel(megamodel)
    }
    return result
}
```
Same shape as the first export, with one added top-level key (`megamodel`) when a runtime megamodel exists. Both
exports are, at top level, the `DProject` object (plus optionally that one extra key) — never a wrapper object
that nests it deeper.

**Import** — `frontend/src/pages/Notes.tsx:239-259` (`AllProjectsComponent`, the dashboard "All projects" /
Catalog page):
```ts
const reader = new FileReader();
reader.onload = async e => {
    const content = String(e.target?.result);
    if(!content) return;
    try {
        const project = JSON.parse(content) as DProject;
        const projects = Storage.read<DProject[]>('projects') || [];
        const filtered = projects.filter(p => p.id !== project.id);
        filtered.push(project);
        Storage.write('projects', filtered);
        U.resetState();
    } catch (e) { U.alert('e', 'Invalid project File.') }
}
const importProject = async(e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files || [];
    if(!files.length) return;
    const file = files[0];
    reader.readAsText(file);
}
```
Reads a picked file as text, `JSON.parse`s it directly as a `DProject`, and merges it into the same
`Storage`-backed `'projects'` array that the app reads its catalog from, keyed by `id`. No schema check beyond
`JSON.parse` succeeding and the object having an `id` field the filter can compare — the exact shape either export
above produces is accepted.

**Conclusion: H3 holds.** A JSON file with `data.__raw`'s shape (what `Project.tsx`'s exporter writes) is both
producible by the builder script — which already operates on the store's raw D-layer objects — and consumable by
`Notes.tsx`'s importer, with no translation step in between.

## 5. The builder script

`/Users/alfonso/jjodel-sim/frontend/scripts/smoke/_tmp_demo2_scenario.js` (read, header only, lines 1-45) is an
async IIFE evaluated in a page that already has a project open. Its header comment confirms it builds exactly the
four presets of `docs/demo/models_2026_simulator_demo.md` §2.1-§2.4, empty bag, through the store (`nav.createM2`,
`nav.createM1`, `mm.pkg.addClass`, `L(m1).addObject`, slot writes via `.values =`/`.value =` — the forms
`frontend/src/model/CLAUDE.md` §9.3 marks as the ones that actually write, not the silent no-op forms). It was
measured against port 3011 in the readiness lane; the prompt's own instruction is to copy it under
`~/.jjodel-lanes/P-2026-09-28-1015/` and change the port to 3001. Full read of the script body, and of its named
helper `_tmp_sim3b_scenarios.js`, was not completed in this read-only phase (time budget) — open question 2.

## 6. Findings summary

| # | Claim | file:line | Tag |
|---|---|---|---|
| 1 | Port 3001 is Alfonso's Vite dev server, pid 61660, tree `~/jjodel-release` | measured, this phase (`lsof`, `ps`) |
| 2 | No CDP/remote-debug port listening on this machine | measured, this phase (`lsof`) |
| 3 | Dev mode has no persistence backend; offline/localStorage is the supported path in | `frontend/scripts/smoke/README.md:101-104` | read |
| 4 | Project catalog is one `localStorage` array under key `'projects'` | `frontend/src/pages/Notes.tsx:246-249` | read |
| 5 | Export (dashboard tile) downloads `data.__raw` as-is | `frontend/src/pages/components/Project.tsx:199-202` | read |
| 6 | Export (open-project rail) wraps `__raw` plus optional `megamodel` key | `frontend/src/pages/components/LeftBar.tsx:190-195`, `frontend/src/model/megamodelPersistence.ts:97-106` | read |
| 7 | Import parses the picked file directly as `DProject` and merges by `id` into `'projects'` | `frontend/src/pages/Notes.tsx:239-259` | read |
| 8 | Builder script exists and targets the four presets of the demo script, empty bag | `/Users/alfonso/jjodel-sim/frontend/scripts/smoke/_tmp_demo2_scenario.js:1-45` | read |

## 7. Dependencies and risks

- The fallback route (headless build + JSON export + Alfonso imports) still requires Alfonso to perform the Import
  himself in his own browser — this lane cannot do that step for him without violating the "do not touch his
  Chrome profile" constraint.
- The builder script's helper `_tmp_sim3b_scenarios.js` was named by the prompt but not located or read in this
  phase; its absence at the expected path would block Phase 2 even under the fallback route.
- `Storage.write('projects', ...)` in `Notes.tsx` replaces the whole array; if Alfonso's real catalog is large,
  importing four files one at a time is the safe order (each import is filter-by-id + push, not a wholesale
  overwrite, so this is low risk, but untested here).
- The two export shapes differ by one key (`megamodel`). Either is accepted by the importer (§4), so this lane can
  produce the simpler shape (`data.__raw`, matching `Project.tsx`) without needing to construct a
  `MegamodelSerialized`.

## 8. Open questions

1. Confirm with Alfonso: is the fallback (headless build on 3001's app code, four JSON exports, Alfonso imports
   them himself via Notes.tsx's "All projects" Import) acceptable, or does he want a different channel (e.g. he
   opens a Chrome with remote debugging enabled himself, on a port he chooses, and tells this lane the port)?
2. Should this phase read the full builder script and `_tmp_sim3b_scenarios.js` before Phase 2 starts, or is that
   deferred to Phase 2 itself?
3. The prompt file path `docs/prompts/claude_2026-09-28_1015_prompt_demo_prep_3001.md` was assumed by naming
   convention; it was not opened or verified to exist in this phase.
