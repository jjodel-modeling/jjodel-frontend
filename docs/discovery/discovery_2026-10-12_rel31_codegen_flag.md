# Discovery 2026-10-12: release 3.1, the code generator behind a build flag (L3)

- Prompt-ID: P-2026-10-12-0012 (`docs/prompts/claude_2026-10-12_0012_prompt_release_3_1_codegen_flag.md`). Chat
  C-2026-10-11-1812. Session `1a23c976-213c-482b-94a9-f6ea607aaf91`, unattended.
- Tree: `~/jjodel-w-rel31-codegen`, branch `rel31-codegen-flag`, start `5f25112c4`, `frontend/node_modules` symlinked
  to `~/jjodel/frontend/node_modules` (P14, set up by the chat). Code commit **`d7c1f3df3`**.
- Executor: Claude Opus 5.5 (`claude-opus-5-5`). No subagent.
- Tags: **M** measured by a command run in this lane (on `d7c1f3df3` unless named), **R** read in a file.
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it rereads the real files.

## 0. Answer in brief

**Done: a build without `VITE_CODEGEN=true` ships no Settings toggle, no Code pill and no generator chunk.** §2.7 of
the 1812 report is implemented in the five files, all gates at baseline, and both bundles measured (M):

| build | chunks | `src/codegen/` modules in any chunk | `CodePanel-*` | `runner.worker-*` |
|---|---|---|---|---|
| `npm run build` (flag unset, 3.1) | 87 | `setting.ts` only (entry) | none | file emitted (1827 B), **named by no chunk** |
| `VITE_CODEGEN=true npm run build` (3.2) | 89 | `setting.ts` in the entry, 19 in `CodePanel-*.js` | `.js` 63068 B, `.css` 10051 B | named by `CodePanel-*.js` |

1. **One expectation of §2.7 is falsified:** the runner worker is not dropped. Vite emits every worker it bundled while
   transforming (`node_modules/vite/dist/node/chunks/config.js:26879-26893`), and Rollup transforms the module a dead
   `import()` names before it shakes it. The orphan is never fetched (no chunk names it); removing it needs
   `vite.config.ts`, outside this lane (DA1). (M/R)
2. **The flag must be the bare text `import.meta.env.VITE_CODEGEN`.** The repo idiom `(import.meta as any).env` is
   invisible to vitest's env replacer, which matches the text (`vitest/dist/chunks/cli-api.lDy4N9kC.js:9763-9779`):
   with it, 6 of 13 tests red under `vi.stubEnv`. tsc has no `vite/client` types, so each read sits under `@ts-ignore`. (M)
3. **Gates:** typecheck 14 (the §17 set), vitest 8712/8712 with the 9 known import reds, build exit 0 both ways,
   `check:codegen-lazy` ALL GREEN in both modes, `check:scripts` PASS, `check:docs` (§5), smoke GREEN 12/12 on 3143
   at the second run; the **first run was RED** (§5.1). Visual check on 3143: 2/2, with a flag-on control. (M)
4. **Mutation benches:** 3/3 killed in `setting.test.ts`; the gate's off mode dies on an un-gated EditorV2. (M)

**Recommendation.** Merge L3 as is; accept the orphan worker for 3.1 (DA1); 3.2 adds `VITE_CODEGEN=true` in the
build workflows and, so that dev servers and the codegen probes keep the generator, in `.env.development` (DA2).

**Decisions awaiting Alfonso:** DA1 the orphan worker in the 3.1 `dist`; DA2 where 3.2 sets the flag, and the probes meanwhile.

**Questions**
1. Ship 3.1 with the unreferenced `assets/runner.worker-*.js` (1827 B)? Recommended: yes; the `vite.config.ts` stub that drops it is a lane of its own, and the file is never fetched.
2. Codegen probes and 3.2 work on a dev server: start it with `VITE_CODEGEN=true` until 3.2 sets the flag in `.env.development`? Recommended: yes.

## 1. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | `import.meta.env.VITE_CODEGEN === 'true'` is replaced at build time, so Rollup drops the panel's chunk | holds (M) | §3: 87 chunks off, 89 on; no `CodePanel-*` file off |
| H2 | ... and drops the runner worker (§2.7: «the chunk and the worker») | **falsified** (M/R) | §3.2: worker file emitted off, named by no chunk |
| H3 | `vi.stubEnv` reaches the flag whatever its spelling | **falsified** (M) | §2.1: `(import.meta as any).env` 6/13 red, bare text 13/13 |
| H4 | The flag is undefined in vitest and in a build that does not set it | holds (M) | §3: off mode `resolved unset`; the off test passes with `undefined` |
| H5 | With the flag off, the key `'true'` shows nothing (Settings, pill) | holds (M) | §4: DOM with the key seeded, Advanced mode |
| H6 | The gate's off mode has signal | holds (M) | §2.3: EditorV2 un-gated → off 1 and off 3 red |

## 2. What changed (`d7c1f3df3`, 5 files, +180 −60)

### 2.1 The flag (R on the committed files)
- `frontend/src/codegen/setting.ts:30-31` `// @ts-ignore -- ...` / `if (import.meta.env.VITE_CODEGEN !== 'true') return false;`,
  first line inside the existing `try` of `getCodegenEnabled`, read on every call. In a plain node run (`tsx` probes,
  no `import.meta.env`) the `TypeError` falls in the `catch`: off.
- `frontend/src/components/editor-v2/EditorV2.tsx:417-419`
  `const CODEGEN_BUILD: boolean = import.meta.env.VITE_CODEGEN === 'true';`
  `const CodePanel = CODEGEN_BUILD ? React.lazy(() => import('../../codegen/ui/CodePanel')) : null;`
  `:455` `{open && CodePanel ? (` (tsc needs the guard; inert, the slot never mounts without the flag);
  `:5006` `{CODEGEN_BUILD && modelid && codePill && <CodegenSlot modelid={modelid} />}`.
- `frontend/src/pages/settings/AdvancedSettings.tsx:11-12` the same `CODEGEN_BUILD`; `:90` `{CODEGEN_BUILD && (` over
  the divider and the Experimental group, so the page keeps one divider between groups (§4).
- Why the bare text (M): the first version used `(import.meta as any).env.VITE_CODEGEN`, the idiom of
  `SmokeBoot.tsx:35` and `portDistribution.ts:284`. `npx vitest run src/codegen/__tests__/setting.test.ts`: **6 failed |
  7 passed**, every «on» case reading off under `vi.stubEnv('VITE_CODEGEN', 'true')`. Cause (R): vitest's
  `MetaEnvReplacerPlugin` rewrites `/\bimport\.meta\.env\b/` in the raw source (`cli-api.lDy4N9kC.js:9768-9776`);
  the cast never matches. Vite's build is not affected (its define runs after the TS strip), so the idiom is not wrong
  where it is, only here. The bare text without `@ts-ignore`: tsc **18** errors, the 4 new ones TS2339 `Property 'env'
  does not exist on type 'ImportMeta'` (tsconfig's `"types": []` sits outside `compilerOptions`, no `vite/client`).
  `@ts-ignore` has 211 uses in `src`, `@ts-expect-error` 4.
- The literal is held in a module `const` in EditorV2 and AdvancedSettings, not repeated inline: Rollup folds the
  const (`undefined === 'true'`), measured by the chunk count in §3.

### 2.2 The test
- `frontend/src/codegen/__tests__/setting.test.ts:45` `vi.stubEnv('VITE_CODEGEN', 'true');` in `beforeEach`, `:49`
  `vi.unstubAllEnvs();` in `afterEach` (P11: no env survives a test). `:190-203` one «off» case: the key `'true'`, the
  flag `undefined`, `'false'`, `'1'`, `'TRUE'`: `getCodegenEnabled()` and the hook render false; flag `'true'`: true.

### 2.3 The gate
- `frontend/scripts/gates/check-codegen-lazy.ts:130` `checkBuild(mode)`: one production build per mode, with
  `VITE_CODEGEN` set (`on`) or deleted (`off`) in `process.env` for the build and restored after. `npm run
  check:codegen-lazy` runs both, off first; `-- --off` / `-- --on` one. `package.json` unchanged.
- Clause 0, both modes (`:95`, `:173`): the value Vite resolved, read in the recorder's `configResolved`.
- Off (`:193-196`): 1. no module under `src/codegen/` but `setting.ts` in any chunk; 2. `setting.ts` in a chunk (the
  control that the recorder sees the directory); 3. no emitted script names a `runner.worker` file.
- On (`:202-221`): the three existing clauses unchanged, and 4. a script names the worker (the control of off 3).
- Mutation bench (M), `--off` with `EditorV2.tsx:418` forced to `= true`: `FAIL off 1 ... 19: src/codegen/engine/generate.ts,
  ...`, `FAIL off 3 ... assets/runner.worker-CKXSmFr8.js named by assets/CodePanel-Ced6yhzL.js`, exit 1. Restored, `git diff` clean.
- Test bench (M), each mutation of `setting.ts` run alone, file restored after: flag line dropped → 1 red; `!import.meta.env.VITE_CODEGEN`
  → 1 red; flag read once at import → 5 red. Restored: 13/13.

## 3. The bundle both ways (M, `d7c1f3df3`)

### 3.1 `check:codegen-lazy`, both modes, exit 0
```
build  off (VITE_CODEGEN unset): 55 s, 87 chunks
PASS  off 0. the build resolved VITE_CODEGEN as anything but "true"  resolved unset
PASS  off 1. no module under src/codegen/ but src/codegen/setting.ts in any chunk  87 chunks read
PASS  off 2. src/codegen/setting.ts is in a chunk (the control: the recorder sees src/codegen/)  assets/index-C5vQi9PY.js
PASS  off 3. no chunk names a runner.worker file (never fetched)  1587 scripts read; assets/runner.worker-CKXSmFr8.js named by no chunk
build  on (VITE_CODEGEN true): 64 s, 89 chunks
PASS  on 0. ... resolved "true"
PASS  on 1. no generator module in the eager closure (Rollup module ids)  only src/codegen/setting.ts allowed, found 1
PASS  on 2. no manifest entry of the eager closure has a generator src  1 entries walked from index.html
PASS  on 3. src/codegen/ui/CodePanel.tsx is a dynamicImports target ...; chunk assets/CodePanel-BZvXfUdE.js; 19 generator modules outside the eager closure
PASS  on 4. a chunk names a runner.worker file (the control of off 3)  ... named by assets/CodePanel-BZvXfUdE.js
ALL GREEN (off, on)
```

### 3.2 `npm run build` into `frontend/dist`, string reads (`command grep -l -F` over `dist/assets/*.js`)
| pattern | off (`d7c1f3df3`) | on (same code, `VITE_CODEGEN=true`) |
|---|---|---|
| files named `CodePanel*`, `runner.worker*` | `runner.worker-CKXSmFr8.js` | `CodePanel-Cf2Bq5Tc.css`, `CodePanel-DwLF8jpm.js`, `runner.worker-CKXSmFr8.js` |
| `jjodel.experimental.codegen` (control: `setting.ts` stays eager) | `index-*.js` | `index-*.js` |
| `CodePanel-` | none | `index-*.js` |
| `runner.worker-` | none | `CodePanel-*.js` |
| `"Code generation"`, `"Experimental"`, `templates over the metamodel`, `codegen-pill` | none | `index-*.js` |
`assets` 121 files / 93 js off, 124 / 95 on. Both builds exit 0, only the known chunk-size warning. `dist` is left at the off build.

### 3.3 Why the worker stays (R)
Vite's worker plugin: `generateBundle(opts, bundle) { ... for (const asset of workerOutputCaches.get(config$2).getAssets()) { ... this.emitFile({ type: "asset", ... }) } }`
(`config.js:26879-26893`): it emits every worker bundled during `transform`, with no check that the importer survived.
`runner.ts:41` `new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' })` is transformed because
Rollup loads every module an `import()` names while it builds the graph, before tree-shaking removes the branch.
Nothing in the five files can keep that `import()` out of the graph.

## 4. Visual check, dev server of this tree on 3143 (M)
Probe `~/.jjodel-lanes/P-2026-10-12-0012/visual-check.mjs` (outside every tree), Playwright, 1600×1000, light, fixture
`frontend/scripts/probe/fixtures/scene_3_DemoESM.jjodel`, `localStorage['jjodel.experimental.codegen']='true'` and
Advanced mode seeded: the state where the pill and the group render if the flag does not hide them. Logs
`visual-check-off.log`, `visual-check-on.log`; crops in `~/.jjodel-lanes/P-2026-10-12-0012/crops/`.
- Off (dev server started with `VITE_CODEGEN` unset): M1 `demoESM` 10 nodes; `.codegen-pill` 0, `[title="Code generation"]` 0;
  Settings → Advanced groups `["Developer Options","Data Management","Danger Zone"]`, sequence
  `Developer Options | Data Management | Danger Zone`, «Code generation» checkboxes 0; requests 3639, `/src/codegen/(?!setting)` 0,
  `setting.ts` 2 (control). ALL GREEN. Crops `off_settings_advanced.png` (880×715), `off_editor_bottom_left.png` (760×140).
- Control, same probe, same port, server restarted with `VITE_CODEGEN=true`: pill 1, titled 1; groups
  `["Developer Options","Experimental","Data Management","Danger Zone"]`, checkbox 1. ALL GREEN. Crops `on_*.png`.
- One console error in both runs, `init_dash`, which is in `frontend/scripts/smoke/console-baseline.json`.

## 5. Gates (M, foreground)
- `npm run typecheck`: 14 before and after, the same file/code set as §17 (diff of the sorted lists empty).
- `npm run test`: Test Files 9 failed | 350 passed; Tests 8712 passed. The 9 failed are exactly the §17 import reds.
- `npm run build`: exit 0 without the flag (1m 30s) and with it (1m 42s).
- `npm run check:codegen-lazy`: §3.1. `npm run check:scripts`: `PASS 85 file(s), no await in a read-modify-write`.
- `npm run check:docs`: exit 0, `5/5 check(s) passed, 36 warning(s)`; it read the new inbox (`lane "release-3-1-codegen"
  ... has 1 entry(ies) waiting to be folded`).

### 5.1 Smoke: first run RED, second GREEN
`SMOKE_URL=http://localhost:3143 npm run smoke`, server started with the flag unset:
- Run 1 (00:38): `empty-project NOT REACHED`, `SETUP FAILED: page.goto: Timeout 30000ms exceeded` on
  `http://localhost:3143/#/allProjects`; the other two states 5/5 each; `10 passed, 1 failed`, VERDICT RED.
  The tree's `.vite-cache` was created at 00:36:07, when this server started (`stat`): the first navigation met the
  dependency optimisation of a fresh worktree. Inferred, not proven.
- Run 2 (00:39), nothing changed: `12 passed, 0 failed, 3 skipped`, VERDICT GREEN.

## 6. Consequences outside the five files (R)
- The codegen probes (`frontend/scripts/probe/codegen-{panel,check,examples,oracle}.ts`) seed the key and expect the
  generator: from `d7c1f3df3` their dev server must run with `VITE_CODEGEN=true`. Not changed (NON FARE).
- The Import Settings path to the key (1812 §2.2) is closed by the flag: the key has no effect without it.
- `window.__jjodelOracle` (`oracle.ts:360`) follows `getCodegenEnabled`, so it is off in a 3.1 build.
- The two `public/examples/codegen/*.jjodel` stay (D8).

## 7. Files read
`CLAUDE.md`; `frontend/src/components/editor-v2/CLAUDE.md`; `docs/PROTOCOL.md`; `docs/decisions.md` (5752-5762 and the
tail); `docs/claude-code-log.md` (1-30); `docs/discovery/discovery_2026-10-11_release_3_1_scope.md` (1-135, 186-190, 345-431);
`docs/log-inbox/release-3-1.md` (header); `.claude/skills/log-entry/SKILL.md`, `.claude/skills/discovery-report/SKILL.md`;
`frontend/src/codegen/setting.ts`; `frontend/src/codegen/__tests__/setting.test.ts`;
`frontend/src/pages/settings/AdvancedSettings.tsx`; `frontend/scripts/gates/check-codegen-lazy.ts`;
`frontend/src/components/editor-v2/EditorV2.tsx` (400-470, 4990-5006); `frontend/src/vite-env.d.ts`; `frontend/tsconfig.json`;
`frontend/vite.config.ts` (52-66, 85-110); `frontend/vitest.config.ts`; `frontend/.env.{development,production,staging}` (keys);
`frontend/src/App.tsx` (10-40); `frontend/src/components/devtools/SmokeBoot.tsx` (15-45);
`frontend/src/components/editor-v2/utils/portDistribution.ts` (276-295); `frontend/src/codegen/oracle/oracle.ts` (350-365);
`frontend/src/codegen/runner/runner.ts` (grep), `runner.worker.ts` (1-20); `frontend/scripts/probe/codegen-panel.ts` (1-380);
`frontend/scripts/smoke/states.ts` (105-125, 179-205); `node_modules/vite/dist/node/chunks/config.js` (define plugin,
worker plugin `generateBundle`); `node_modules/vitest/dist/chunks/cli-api.lDy4N9kC.js` (9755-9790).

## 8. Dependencies and risks
- L1 (staging into the trunk): `git diff --name-only $(git merge-base HEAD origin/staging) origin/staging` (local ref
  `cb5952876`) lists 112 files, none of the five (control: `VersionFixer.tsx` found by the same grep). L2's declared files
  (`useAutoAnchor.ts`, a test, a probe) are disjoint from them (R, 1812 §8.3).
- `check:codegen-lazy` now runs two builds (about 2-4 min) in one process; still not wired into CI or a hook.
- `@ts-ignore` silences any other error on those three lines too; each line holds only the flag read.
- Temporary material outside the tree: `/tmp/rel31cg_*` (gate, build, smoke and tsc outputs, the measure script),
  `/tmp/codegen-lazy-*` removed by the gate. Dev servers on 3143 started and stopped by this session.

## Decisions taken (unattended)
1. The flag is the bare text `import.meta.env.VITE_CODEGEN` under `@ts-ignore`, not the repo's `(import.meta as any)`
   idiom (§2.1, measured) and not a `vite/client` reference in `vite-env.d.ts` (outside the five files).
2. EditorV2 and AdvancedSettings hold the literal in a module `const CODEGEN_BUILD` used at both sites; the chunk drop is measured.
3. `CodegenSlot` renders the panel on `open && CodePanel` (`EditorV2.tsx:455`): required by tsc, inert at runtime.
4. Both gate modes are wired by the script itself (no argument = both), not by `package.json`, outside the five files.
5. Off 3 asserts that no chunk names the worker, not that no worker file exists: the file is measured and cannot be
   removed from the five files (§3.3). The first version asserted «no file» and was red; the orphan is reported, not hidden (DA1).
6. The off mode deletes `VITE_CODEGEN` from the environment, the 3.1 build, rather than setting `'false'`.
7. Commit type `feat(codegen)`: P6 asks the type of the prompt, which names none; earlier codegen lanes used `feat(codegen)`.
8. The inbox entry is written and left uncommitted for the closure commit with the Status flip (P13); the Status flip
   is not done here (NON FARE: only the five files, the report and the inbox).
9. The smoke was re-run once after the cold-start timeout, with nothing changed; both runs reported (§5.1).
10. The visual check ran as a lane-folder probe reading the DOM, with a flag-on control on the same port.
11. The test bench mutated `setting.ts` in place and restored it from a copy in `/tmp` made and deleted in the same
    shell command (`cmp` identical, then 13/13); a file-local copy, not a tree backup (RC-13-bis), declared here.

## Decisions awaiting Alfonso
- **DA1** (what ships): the 3.1 `dist` holds `assets/runner.worker-CKXSmFr8.js` (1827 B), named by no chunk. Dropping it
  needs a `vite.config.ts` hook (for instance resolving `src/codegen/ui/CodePanel.tsx` to an empty module when the flag
  is off). Recommended: ship as is; the hook is a lane of its own if wanted.
- **DA2** (3.2 and lanes meanwhile): 3.2 sets `VITE_CODEGEN=true` in the two build workflows and in `.env.development`;
  until then codegen probes and codegen lanes start their dev server with `VITE_CODEGEN=true`. Recommended: yes.
