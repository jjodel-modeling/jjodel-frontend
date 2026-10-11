# Discovery 2026-10-11: release 3.1, scope and readiness

- Start sha: **`c7575bcf7461c6c07e9081eed639606380274507`** (`docs: add prompt P-2026-10-11-1812`). Every finding below is about it.
- Prompt-ID: P-2026-10-11-1812 (`docs/prompts/claude_2026-10-11_1812_prompt_release_3_1_scope_discovery.md`), Phase 1,
  read-only. Chat C-2026-10-11-1812. Session `25d47f13-ce15-488f-a7cc-6dd9665a0c28`.
- Tree: `~/jjodel-w-release31`, branch `release-3-1-disc`, `frontend/node_modules` symlinked to `~/jjodel/frontend/node_modules`.
- Executor: Claude Opus 5.5 (`claude-opus-5-5`). Five read-only subagents ran the sweeps of §1, §2, §3, §4 and §5; every
  verdict that decides the cut was re-checked in this session by the command quoted next to it.
- Tags: **M** measured by a command run in this phase on the start sha (or on the ref named), **R** read in a file or doc.
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it rereads the real files.

## 0. Answer in brief

**The start sha cannot be released as it is, but not for the reason the prompt expected.**

1. **New blocker: the saved-project format diverges from `staging`.** Beta (`staging`) has served format **2.230** since
   2026-10-10 (deploy of `e9d694f81`, which contains `352758aa2 fix(#174): migration 2.229 -> 2.230`); the trunk stops at
   2.229. `VersionFixer.update` throws on a version it has no adapter for, and the open ends `unreadable` (§3.5). Beta and
   app share one persistence backend. A 3.1 cut from the trunk alone cannot open any project saved on beta since 10-10.
   The release line must absorb `origin/staging` (110 commits, 3 text conflicts) before the cut. (R for the throw path, M for the refs.)
2. **The drag loop no longer reproduces on the start sha.** The report's own probe: **0 crashes in 72 drags on 24 fresh
   pages** (Petri classic and Petri, at rest, after Auto layout, with an edge click, any target). Control, same probe:
   `164f846fc` (the report's tip) 3 of 3 first drags crash at depth 51; `361a11224` (trunk just before the graphVertex
   merge) 2 of 3 pages. The `replaySafe` guard that came with graphVertex (`38e7a6006`) is the likely closer (inferred).
   No longer a blocker; Fix A stays as optional hardening (the `useNodes()` amplifier is still at `useAutoAnchor.ts:568`). (M)
3. **Codegen gate: complete against R-GEN-2.** `check:codegen-lazy` ALL GREEN on the start-sha build: only `setting.ts`
   in the eager closure, 19 generator modules in the lazy `CodePanel` chunk, the runner worker referenced only from it.
   Gap against «3.1 ships without the generator»: Settings → Advanced → Experimental → «Code generation» is visible and
   switches it on. Smallest hide: a `VITE_CODEGEN` build flag over three files (§2.7). (M)
4. **Dark theme: already gone on the trunk** (merge `c08ac1c5f`, 10-10): no radio, a stored `dark` is ignored at boot,
   no `prefers-color-scheme` rule. Nothing to hide in code; `CHANGELOG.md:64` still says «not maintained». (M/R)
5. **Persistence 3.0 → trunk:** one step (2.228 → 2.229, tested), every new field additive; no `jsxString` migration due
   (`DV.tsx`, `defaultViewTemplate.ts` unchanged since 3.0). No codegen field leaks except `genTemplates`, additive by
   design (R-GEN-3/12). No 2.228 fixture exists in the repo, so no 3.0 save was loaded end to end. (M/R)
6. **Gates on the start sha, all at baseline:** typecheck 14 (the §17 set), vitest 8692/8692 with the 9 known import reds,
   build exit 0, smoke GREEN 12/12, `check:docs` 5/5, `check:codegen-lazy` 3/3. (M)

**Recommendation.** Cut from the trunk after L1 (merge `origin/staging` into it, critical zone, LIR), with L3 (codegen
flag) and optionally L2 (drag hardening) in parallel, then L4 (3.1.0, CHANGELOG) and the RC-23 checklist of §8.4.

**Decisions awaiting Alfonso** (full list at the end): D1 absorb `staging` into 3.1; D2 hold PR #184 until 3.1.0 is
tagged; D3 hide the codegen toggle; D4 a row superseding R-GEN-1's «no separate 3.1 tag»; D5 push the trunk.

**Questions**
1. Absorb `origin/staging` (format 2.230, #168 #171 #173 #174 #175 #176 #178 #179 #182 #157 A/B) into 3.1? Recommended: yes, it is the only way 3.1 opens beta saves.
2. Ask Juri and Damiano to hold PR #184 (it rewrites the format chain) until 3.1.0 is tagged? Recommended: yes.
3. Hide the «Code generation» toggle in 3.1 with a build flag? Recommended: yes, L3 as in §2.7.
4. Run Fix A of the drag loop as optional hardening? Recommended: yes, in parallel, shipped only if green before the cut.
5. Hold 3.1 for the pre-existing data-loss paths of §5.2? Recommended: no, they are live in production already; open a maintenance lane.

## 1. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The drag loop crashes first drags on the start sha | **falsified** (M) | §5.1: 0 of 72 drags; control `164f846fc` 3 of 3, `361a11224` 2 of 3 pages |
| H2 | With the setting off no generator module loads (R-GEN-2) | holds (M) | §2.3: `check:codegen-lazy` 3/3 on the start-sha build |
| H3 | With the setting off no codegen UI entry is visible | partly (R) | §2.4: the pill is gated; the Settings toggle itself is always shown |
| H4 | A project saved by 3.0.0 (2.228) opens in 3.1 | holds by read, not measured (R) | §3.1-§3.3: one tested step, additive fields; no 2.228 fixture in the repo (§3.6) |
| H5 | A project saved by the live apps opens in a trunk-only 3.1 | **falsified for beta** (R+M) | §3.5: beta writes 2.230, trunk has no 2.230 adapter; app (2.229) opens |
| H6 | The Dark radio is still reachable (D-UI-15) | falsified on the trunk, holds on staging and production (M) | §4 |
| H7 | 3.1 can be cut from the trunk alone | **falsified** | H5, §3.5, §8 |
| H8 | The gates of the start sha are at baseline | holds (M) | §7 |

## 2. Code generator gate

### 2.1 What is on the trunk (M: `git ls-files frontend/src/codegen`, 46 files)
- `frontend/src/codegen/setting.ts` (the setting and the pill rule, the one eager module), `stcAccess.ts`;
  `engine/{generate,text,origin,indent,templates,templateCodec}.ts`; `target/js/{access,identifiers,printer}.ts`;
  `runner/{runner,runner.worker,protocol}.ts`; `oracle/{oracle,observe,storedScenarios}.ts`;
  `ui/{CodePanel.tsx,CodePanel.scss,TemplateEditor.tsx,checkView.ts}`; 21 test files; `examples/{turnstile,petri-producer-consumer}/`.
- Outside `src/codegen`: `frontend/public/examples/codegen/{turnstile,petri-producer-consumer}.jjodel` (`4a7fb2755`),
  `frontend/scripts/gates/check-codegen-lazy.ts`, `frontend/scripts/examples/build-codegen-examples.ts`,
  `frontend/scripts/probe/codegen-*.ts`.
- Codegen code in non-codegen files: `EditorV2.tsx` (126, 411-463, 612-614, 5000), `events/registry.ts` (82-84),
  `pages/settings/AdvancedSettings.tsx` (3, 15, 83-100); the JjEL S1 interpolation (`7e06abb4c`: lexer, parser,
  evaluator), inert unless a caller passes `interpolation: true` / `textHost` / `readObserver`, and only `src/codegen`
  does (subagent, `git grep` with positive control).
- Merges: `c242ed7a3`, `7e06abb4c`, `c43001de4`, `f02a57d59`, `601ec1379`, `bd73d6e54`, `28c9b0aad`, `4f117a0b0`,
  `f735959f6`, `87d05057c`, `42337a06f` (10-10 and 10-11). The only codegen branch not merged is `codegen-pilot` (docs).

### 2.2 The setting (R)
- `frontend/src/codegen/setting.ts:19` `export const CODEGEN_SETTING_KEY = 'jjodel.experimental.codegen';`
- `frontend/src/codegen/setting.ts:24` `return typeof localStorage !== 'undefined' && localStorage.getItem(CODEGEN_SETTING_KEY) === 'true';`
  Off by default: no key, no storage or a throwing storage read as off. Per browser (localStorage), not per project, not
  per account; never saved in a project. Tested: `codegen/__tests__/setting.test.ts:51`, `:61` (subagent).
- Side paths (subagent, R): «Clear local data» removes it (`AdvancedSettings.tsx:25`); «Import settings» writes any key
  back (`AdvancedSettings.tsx:53-55`), so an imported settings file can switch the generator on.

### 2.3 The bundle (M)
- `npm run build` on the start sha: exit 0. `dist/assets/CodePanel-TLk7R_5E.js` 63.07 kB, `dist/assets/runner.worker-CKXSmFr8.js`, entry `index-D7YTRwhp.js` 16.6 MB.
- `npm run check:codegen-lazy` (its own build in a temp dir), exit 0:
  `MEAS  entries assets/index-D7YTRwhp.js; eager closure 1 chunks, 3549 modules; src/codegen/ in it: src/codegen/setting.ts`
  `PASS  1. no generator module in the eager closure`, `PASS  2. ...`, `PASS  3. src/codegen/ui/CodePanel.tsx is a dynamicImports target ... 19 generator modules outside the eager closure`, `ALL GREEN`.
- Independent string check on `dist/assets` (`command grep -o`): `jjodel.experimental.codegen` entry 2 / CodePanel 0;
  `runner.worker` entry **0** / CodePanel 1 (the only file naming it); `CodePanel-TLk7R_5E` entry 2 (the lazy import).
  Positive control: the setting key is found in the entry chunk by the same command.
- Static edges into `src/codegen` from outside it (`git grep -n -E "from ['\"][^'\"]*codegen..."`, M): exactly three,
  `EditorV2.tsx:126` `import { codePillVisible, useCodegenEnabled } from '../../codegen/setting';`,
  `AdvancedSettings.tsx:3` (setting only), and `EditorV2.tsx:413` `const CodePanel = React.lazy(() => import('../../codegen/ui/CodePanel'));`.
- `check:codegen-lazy` is not wired into CI or any hook (subagent: only `package.json:106` names it).

### 2.4 UI entries with the setting off (R)
- «Code» pill: `EditorV2.tsx:614` `codePillVisible(codegenEnabled, ...)` and `:5000` `{modelid && codePill && <CodegenSlot modelid={modelid} />}`;
  `setting.ts` `if (!enabled || !isModelMode) return false;`. Gated.
- `window.__jjodelOracle`: set only after the lazy chunk loads and only with the setting on (`oracle.ts:360`). Gated.
- **Not gated, by construction:** the toggle, `AdvancedSettings.tsx:85-100`, `{/* Experimental (R-GEN-2): off by default; ... */}`,
  `<span className="checkbox-label">Code generation</span>`. Settings → Advanced is always listed.
- None found (subagent, positive controls): menu, context menu, command palette, shortcut, route, Jjodie tool, JjScript
  command. The Jjodie strings «Code generation guidance» predate the pilot (generic capability text).
- Indirect: in Advanced mode the generic `_state` viewer shows key names, so a metamodel holding templates shows
  `genTemplates` (`Info.tsx:1754-1756`, subagent, R). Cosmetic.

### 2.5 Persistence of codegen (R)
- One write site: `codegen/ui/CodePanel.tsx:238` (the metamodel's `_state.genTemplates`, a JSON string, R-GEN-12).
  Reachable only with the panel, so only with the setting on. Additive: nothing outside `src/codegen` reads it; a
  round-trip through the real `VersionFixer.update` is tested (`templateCodec.test.ts:149-166`, read, not run).
- The two `public/examples/codegen/*.jjodel` carry `genTemplates` inside the compressed state and ship in `dist`
  (M: `ls frontend/dist/examples/codegen` lists both). No app code links them. Importing one stores the key whether or not
  the setting is on; harmless by R-GEN-3.

### 2.6 Verdict
Complete against R-GEN-2 as ratified. Incomplete against «3.1 ships everything except the generator» only through the
toggle (and the Import-settings path to the same key): a 3.1 user can switch the generator on.

### 2.7 Smallest change that closes it (proposal, not implemented)
Build-time flag, read as `import.meta.env.VITE_CODEGEN === 'true'` (undefined in vitest, so tests default to off):
1. `frontend/src/codegen/setting.ts:22-28`: first line of `getCodegenEnabled`, `if (import.meta.env.VITE_CODEGEN !== 'true') return false;`
2. `frontend/src/components/editor-v2/EditorV2.tsx:413`: `React.lazy(...)` only under the flag (`null` otherwise), and the
   same literal before `codePill` at `:5000`, so Rollup drops the dynamic import, the chunk and the worker.
3. `frontend/src/pages/settings/AdvancedSettings.tsx:83-100`: the divider and the Experimental group under the flag.
4. `frontend/src/codegen/__tests__/setting.test.ts`: the «on» cases with `vi.stubEnv('VITE_CODEGEN', 'true')`.
5. `frontend/scripts/gates/check-codegen-lazy.ts:157-165`: clause 3 expects the chunk; run it with `VITE_CODEGEN=true`, or
   add a flag-off mode asserting no `src/codegen/` module but `setting.ts` in any chunk.
`EditorV2.tsx` is not in the §3.1 table. 3.2 builds with `VITE_CODEGEN=true` (one line in the two CI workflows or `.env.*`).

## 3. Persistence and migrations since 3.0

### 3.1 VersionFixer steps (M: `git show <ref>:frontend/src/redux/VersionFixer.tsx | grep -o "\['2\.[0-9]* -> 2\.[0-9]*'\]" | tail -1`)
| ref | highest step |
|---|---|
| `cb699ad58` (3.0.0) | `['2.227 -> 2.228']` |
| `c7575bcf7` (start sha) | `['2.228 -> 2.229']` |
| `origin/dotnet-backend-integration` `73307b7ed` (production) | `['2.228 -> 2.229']` |
| `origin/staging` `cb5952876` (beta) | `['2.229 -> 2.230']` |

The format number is `VersionFixer.get_highestversion()` (`frontend/src/redux/store.tsx:104`), not the app version.

| from → to | what | commit | test |
|---|---|---|---|
| **2.228 → 2.229** (new) | primitives `Pointer_EXPRESSION`, `Pointer_ACTION` after EDouble, idempotent | `b14294906` | `redux/__tests__/versionfixer_2229_migration.test.ts`, 9 tests |
| 2.1 → 2.2 (body) | returns `s` (3.0 returned undefined on unversioned saves) | `d1db82011` | `versionfixer_old_states.test.ts:132` |
| 2.2 → 2.201 (body) | `|| []` and `if (!c) continue;` guards | `d1db82011` | `versionfixer_old_states.test.ts:138` |
| 2.225 → 2.226 (body) | stamps `ir.migratedHash` on migrated default views | `e7e47a7f0` | helper only, `ir.test.ts:1571` |

`npx vitest run src/redux/__tests__/versionfixer_old_states.test.ts`: exit 0, 25/25 (subagent, M). The whole suite ran green in §7.

### 3.2 Default view (rule 14) (M)
`git diff cb699ad58 c7575bcf7 -- frontend/src/common/DV.tsx frontend/src/utils/defaultViewTemplate.ts` is empty (both
files exist at both refs). No `jsxString` migration is due. The default IR in `irDefaults.ts` changed (parity batch);
3.0 views are recognised by the frozen `LEGACY_OBJECT_VIEW_SNAPSHOT` (`irDefaults.ts:138`) and keep native rendering,
tested at `ir.test.ts:1433` (subagent, R). Side effect (R): the tail loop of `VersionFixer.update` regenerates every
untouched default view whose `version` is not the highest, so every 3.0 project's untouched default views are rebuilt
on first open in 3.1, as at every bump.

### 3.3 New persisted data (R, subagent with diffs; all additive, no step)
- Annotation keys: one new, `jjodel/type`, written only in the `.ecore` export (`EcoreService.ts:326-328`) and consumed at
  import, never stored (`api/data.ts:958-961`; test `ecore-io.test.ts:463`).
- Simulator: 3.0 had 6 role keys in the M2 `_state`; new `simProfile`, `simEnabled`, `simGuard`, `simAction`, `simTrigger`,
  `simEvent*`, `simArc*`, `simInhibitorArc`, `simInitialMarking`, `simBound`, `simFork`, `simJoin`, `simAccepting`, ...
  Absent `simProfile` rebuilds a «Custom» profile (`profileCodec.ts` header). M1 bag: `ioBoard`, `runWatches`,
  `runScenarios`, `simStateAttributes` (codec tests for each).
- Derived viewpoint `_state` keys `derivedFrom`, `derivedNotation`, `derivedLayout`, `derivedRole_<classId>`;
  `DViewElement.metaclassColoring` (absent reads off, `view.tsx:291`).
- IR optional fields: `TextStyle.underline` (`irTypes.ts:115`), `ShapeSpec.cornerRadius` (`:235`), `border`, label
  `anchor`/`orientation`, containment `layout`/`membership`/`edges` (graphVertex), edge `terminations`, `defaultSize`,
  `generated`, `migratedHash`. No `irVersion` bump (only `'ir-1.0'` and `'ir-1.2'` exist at both refs). `FormSpec` has no
  diff hunk since 3.0.
- New D-classes, created lazily: `DEnvironmentConfig`, `DProfile` (`b45b866cf`), `DValidationViewpoint`,
  `DValidationRule` (`9f16e7703`); absent reads `null` (`environmentConfig.test.ts:46`).
- localStorage: `jjodel.experimental.codegen` only.

Behaviour change on 3.0 projects, for the release notes (R): the Simulation pill now mounts only in Advanced mode and
when the metamodel's Simulation toggle is on (`components/editor-v2/sim/simRoleStatus.ts:297-305`); a 3.0 metamodel with
roles and no `simProfile` keeps the pill hidden until the toggle is turned on.

### 3.4 Codegen leak
None beyond `genTemplates` (§2.5). No `jjodel/*` codegen key, no D-field, no Redux root key (subagent grep for
`SetFieldAction|SetRootFieldAction|TRANSACTION(|'jjodel/|annotations` over `src/codegen`: one comment).

### 3.5 Divergence with staging: the blocker
- Staging adds `private ['2.229 -> 2.230']` (`git show origin/staging:frontend/src/redux/VersionFixer.tsx`, the #174 step
  «Every instance is listed by its model (R-NEST-6, #174)») and a per-load `purgeDeadGraphElements` (`948ea2884`).
  `git diff c7575bcf7 origin/staging -- VersionFixer.tsx`: 136 insertions, 0 deletions; 2.228 → 2.229 byte-identical (subagent, M).
- None of it is on the trunk: `git cherry -v c7575bcf7 origin/staging` 97 `+`, 0 `-`; `--grep` for `352758aa2`,
  `948ea2884`, `#174`, `#182` empty; positive control: `purgeDeadGraphElements` found on staging by the same `git grep` (subagent, M).
- What a trunk build does with a 2.230 save (R, re-read in this session):
  `frontend/src/redux/VersionFixer.tsx:128` `Log.exDev(!VersionFixer.versionAdapters[currVer], "missing version adapter from \""+ currVer+"\", please notify the developers.",`
  → `frontend/src/common/Log.ts:113` `let exception: Error | undefined = (canthrow ? new MyError(prefixedstr, ...restArgs) : undefined);`
  and `:119` `if (exception) throw exception;` (exDev passes `canthrow` true)
  → `frontend/src/redux/reducer/reducer.ts:1614` `ProjectsApi.loadError = {kind: 'unreadable', ...`. Not run in a browser.
- Beta writes 2.230 (M, `gh run list --branch staging`): «Build and deploy Node.js app to Azure Web App - test-jjodel»
  success on `e9d694f81` at 2026-10-10T09:47Z and on `cb5952876` at 13:22Z; `git merge-base --is-ancestor 352758aa2 e9d694f81` true.
- Shared backend (R): `frontend/.env.staging:10` and `frontend/.env.production:15`, both
  `VITE_PERSISTANCE = "https://jjodel-persistence-huc4gteqe6cyevc4.italynorth-01.azurewebsites.net"`.
- Consequence: a 3.1 from the trunk alone (2.229) refuses every project saved on beta since 10-10. Production (2.229)
  is in the same position today (inferred, same mechanism); 3.1 with staging inside closes it.
- Future collision (R): `VersionFixer.tsx:1193` reserves «the first free number after 2.229» for the R-IRN-19 purge;
  after the merge that number is 2.231 (or later, see PR #184).
- **PR #184** `staging-dam-merged` → `staging` (Damiano, opened 2026-10-10T23:23Z, 28 commits, +41160 −7737, 88 files,
  MERGEABLE; M, `gh pr view 184`, `gh pr diff 184`): rewrites the chain to `2.229 -> 2.2291 -> 2.2292 -> 2.2293 -> 2.230`
  and adds `if (currVer >= VersionFixer.highestVersion) return s; // highest version can happen when migrating a save from staging to production`,
  plus `redux/reducer.ts`, `action.ts`, `store.tsx`, `createStore.ts`, new D-classes (`DTypeDeclaration`, `DPlaceholder`).
  If it lands on staging before the cut, L1 has to absorb it too.
- Text conflicts of trunk × staging (M, `git merge-tree --write-tree --name-only c7575bcf7 origin/staging`, exit 1):
  `docs/decisions.md`, `frontend/src/components/Jodie/Jodie.tsx`, `frontend/src/constants/defaultPrompts.ts`. Clean but
  touched on both sides: `jjscript/parser/parser.ts` (#175 vs the do-block fixes), `events/registry.ts`, `AISettingsContent.scss`.
- Staging touches none of the files of L2, L3 or L4 (M: `git diff --stat 799e9f50a origin/staging -- EditorV2.tsx useAutoAnchor.ts src/codegen AdvancedSettings.tsx package.json AboutDialog.tsx CHANGELOG.md` empty).

### 3.6 Loading a 3.0-era fixture
Not feasible as asked: no 2.228 project is tracked (subagent, M: `git grep -l '"className" *: *"DProject"'` over
`*.json *.jjodel *.txt` finds 8 `.jjodel`, all `n: 2.229`, dated 2026-09-28..10-04; `frontend/src/examples/*.ts` are
pre-2.1 blobs). Run instead: (a) `versionfixer_old_states.test.ts` 25/25 (pre-2.1 blobs through the real chain, joiner
mocked); (b) the 2.229 fixture `scene_2_DemoPetri.jjodel` imported and opened on the start sha on 24 fresh pages by the
probe of §5.1, no load error. Missing: a `.jjodel` exported from a 3.0.0 build, pinned in a test with the 2.230 throw (§8, L5).

## 4. Dark theme reachability (M/R)
- Trunk: `frontend/src/pages/settings/AppearanceSettings.tsx` has 0 matches for `name="theme"|value="dark"` and 1 for
  «Coming Soon» (M). Boot, `frontend/index.html:15-18`:
  `// Jjodel has no dark theme (D-UI-15): a stored 'dark' is ignored and the page opens in the default light state.`
  `if (t === 'light') {`. Test `frontend/src/__tests__/bootTheme.test.ts:47-64` (subagent). `ThemeService` deleted (`e88f1a22e`).
- System preference: no `prefers-color-scheme` rule or `matchMedia` in `frontend/src` (subagent `git grep`; control
  `prefers-reduced-motion` found in 3 files). One inert rule, `viewpoint/authoring/StructureGroups.scss:82-84`
  `html[data-theme='dark'] ...`, left by the removal lane because the file is critical zone.
- Removal merged: `c08ac1c5f merge: dark-theme-removal into alfonso-frontend-jjtl (P-2026-10-10-1059)`;
  `git log c7575bcf7..dark-theme-removal` empty (subagent, M).
- Still reachable on `origin/staging` and `origin/dotnet-backend-integration` (radio and `t === 'dark'` at boot, 1 each;
  control: 1 on `cb699ad58`, 0 on the trunk). The trunk × staging merge tree has 0 of both (staging did not touch the files).
- Smallest hide for 3.1: **nothing in code**; it ships with the trunk. Docs: `CHANGELOG.md:64`
  `- The dark theme is not maintained in this release.` becomes a `### Removed` line (L4).

## 5. Blockers

### 5.1 The drag loop on object-as-edge views (M)
- The report `docs/discovery/discovery_2026-10-10_petri_classic_drag_loop.md` lives only on `petri-loop-disc`
  (`c70018271`), not on the trunk. Fix A and guard B are not on the trunk: `useAutoAnchor.ts:568` `const nodes = useNodes();`.
  A partial guard B is: `EditorV2.tsx:4363` `const replaySafe = <T extends object>(fn: (prev: T) => T) => {` and `:4405`
  `setEdges(replaySafe((currentEdges: Edge[]) => {` (`38e7a6006`, graphVertex S3, merged by `eb5600dbb` 2026-10-11 01:01).
- Re-measure. Probe `frontend/scripts/probe/petri-drag-loop.ts` of `petri-loop-disc`, copied to `/tmp/r31probe` with the
  fixture (identical on both refs) and a symlink to this tree's `scripts/smoke` (`seed`, `setTheme` exported, light only),
  run with `node --experimental-strip-types` against a dev server of the code under test, React's nested-update counter patched (`patched {"react":7}`).

| code served | runs | pages | drags | crashed pages | depth |
|---|---|---|---|---|---|
| start sha `c7575bcf7` (this tree, port 3131) | petriClassic rest/first | 6 | 18 | **0** | max 3 |
| start sha | petriClassic and petri × layout/first, rest/first + edge click, rest/any | 18 | 54 | **0** | max 3 |
| `164f846fc` (`git archive` to `/tmp/r31-old`, port 3132) | petriClassic rest/first | 3 | 3 | **3** (first drag, p1) | 51, «occurred in the <StoreUpdater> component» |
| `361a11224` (trunk before the graphVertex merge, `/tmp/r31-pregv`) | petriClassic rest/first | 3 | 6 | **2** (p1 first; lock second) | 51 |

  The control discriminates (P12): the same probe and harness turn red on the code the report measured.
- Verdict: **not a blocker for 3.1.** The fix landed between `361a11224` and `c7575bcf7`; `replaySafe` is the likely cause
  (inferred, not bisected inside `eb5600dbb..c7575bcf7`). The amplifier stays (ticket `docs/log-inbox/ir-graphvertex.md:69`,
  medium): any other updater re-run under a rebase could reopen it. Fix A (one file, not critical zone) is the hardening.

### 5.2 Other user-facing defects (subagent triage, R; blocker = crash, data loss, corrupt save)
| defect | source | blocker for 3.1 | rationale |
|---|---|---|---|
| Format 2.230 unreadable by a trunk-only build | §3.5 | **yes** | projects saved on beta do not open |
| No unload warning after a canvas edit | `docs/claude-code-log-archive.md:3060` (high) | no, pre-existing | loses unsaved work on navigation; the warning lives only in `ProjectEditor.tsx:409` at 3.0 and today; live in production |
| User menu Dashboard resets before confirming; Sign-out order | `docs/claude-code-log-archive.md:3072` (medium) | no, pre-existing | `Navbar.tsx:2054-2057` `U.resetState(); R.navigate('/allProjects');`; behaviour since `982581260` (09-26), already on production |
| Online favorite / tags PUT the editor's empty state | `docs/claude-code-log-archive.md:526` (medium) | unclassified | same code at 3.0 (`projects.ts:211` then, `:243` now); the backend's reaction never measured: the strongest unconfirmed data-loss candidate |
| Editor Download exports an empty state | `docs/claude-code-log-archive.md:520` | no | stored project untouched; the file is useless |
| Views read-only after a page load (F2) | `docs/log-inbox/new-model-instantiate.md:22` (high) | no | no crash, no saved effect |
| Ghost vertex after nested-object delete; pointedBy growth; undo misses; layout items; validation false negatives | `views.md:479`, `archive:3352`, `TECH-DEBT.md:7,216`, `decisions.md:1842,1965` | no | drawing, bloat or wrong result, no crash or loss shown |
| Unclassified for lack of evidence | partial DEdge after undoing an M2 reference delete (`archive:408`); JjScript child in two containers (`jjscript.md:120`); `.ecore` import throw on older saves (`decisions.md:1967`); unguarded read at `classes.ts:4408` (`TECH-DEBT.md:319`) | — | read, not reproduced |

Closed on the trunk (subagent, R): do-block freeze (`294a29084`), cancelled-reload loss (`U.tsx:140-142`), unversioned
VersionFixer crash (`0609e9793`, `d1db82011`), stale M1 edge (`ad08a8519`), hidden-tab loop (`cd348df03`). Harness and
tooling tickets excluded: 29, plus 7 codegen-only.

## 6. Release mechanics (subagent, M with `gh` read-only, and R)
- **3.0 flow.** `7e37a1b3d chore(release): version 3.0.0` (package.json and lock), `6e9a31fe7 docs(changelog): 3.0.0 section`,
  PR #144 `alfonso-frontend-jjtl` → `staging`, merged by jdirocco 2026-09-15 09:40Z as `cb699ad58`. Tag `3.0.0` is
  lightweight on `cb699ad58`, created by the GitHub release «JJODEL v3» (jdirocco, 15:12Z), not the `git tag -a v3.0.0`
  the release prompt planned. Production: PR #146 `staging` → `dotnet-backend-integration` (16:16Z). Later production
  pushes #159 (09-23) and #165 (10-01): production runs post-3.0 code (format 2.229) and still shows 3.0.0.
- **Workflows** (`.github/workflows/`, identical on trunk and staging; none on tags, no approval gate):
  `staging_test-jjodel(staging).yml:8` push to `staging` → Azure `test-jjodel` slot `'staging'` (`:70-71`, beta.jjodel.io);
  `docker-staging.yml` → Docker Hub `jjodel-standalone-staging`; `dotnet-backend-integration_test-jjodel.yml:8` push to
  `dotnet-backend-integration` → slot `'Production'` (`:68-69`, app.jjodel.io, inferred: the README does not link the two);
  `docker.yml`, `docker-microserices.yml` the same branch.
- **Manual steps outside git:** Juri's merge of each PR; the second PR staging → production; for 3.0 a manual subdomain
  flip by Alfonso (`docs/sessioni/sessione_2026-09-16.md:9`), not needed again if app.jjodel.io already serves the
  Production slot (inferred). No DEPLOY doc; `package.json:94` `"dev"` points to a compose file that does not exist.
- **Version string** (R): `frontend/package.json:3` `"version": "3.0.0",` → `vite.config.ts` `__APP_VERSION__` → `src/version.ts`
  → footer `StatusBarRightZone.tsx:102`; `frontend/package-lock.json:3`, `:9`; hardcoded
  `frontend/src/pages/components/about/AboutDialog.tsx:79` `<span className="about-dialog__version">v3.0.0</span>`;
  `WelcomeModal.tsx:4` `'jjodel_welcome_3_seen'` and `:52` «Jjodel 3.0» (optional; the key is also in
  `scripts/smoke/states.ts:186`). For 3.1.0: the package pair (`npm version 3.1.0 --no-git-tag-version`), `AboutDialog.tsx:79`
  (or read `APP_VERSION`), the CHANGELOG heading. `BUILD_COUNT` comes from `git rev-list --count HEAD`, which a shallow CI
  checkout reduces (inferred).
- **Changelog:** `CHANGELOG.md:9` `## [Unreleased]`, `:11` «Planned as 3.1.0 ... work still on branches or on `staging` is
  added when it lands.» Last touched 10-04: it misses the notations, graphVertex, edge ends, metaclass colours, everything
  after 10-04 and the staging fixes; `:64` the dark theme line. `## [3.0.0] - 2026-09-15` at `:66`. In-app «What's new»
  links `jjodel.io/whats-new/`, the CHANGELOG `docs.jjodel.io/whats-new/` (two URLs).

## 7. Gates at the start sha (M, foreground, this tree)

| gate | result | baseline |
|---|---|---|
| `npx tsc --noEmit` | exit 2, **14** errors: `api/data.ts` TS2304×2 TS2322; `common/Dummy.ts` TS2307; `EditorV2.tsx` TS2339; `Measurable.tsx` TS2552, TS7053×4, TS2345; `ChatMessages.tsx` TS2322; `ProjectEditor.tsx` TS2769; `Dashboard.tsx` TS2339 | 14, the same set (§17) |
| `npx vitest run` | exit 1; files 350 passed, 9 failed; tests **8692 passed of 8692**; 173 s | the 9 failed files are exactly the §17 import reds (`window is not defined` via monaco) |
| `npm run build` | exit 0, 1 min 19 s; chunk-size warning; Sass `@import` deprecations and `eval` notices | exit 0 |
| `npm run smoke` (`SMOKE_URL=http://localhost:3131`, dev server of this tree) | VERDICT GREEN, 12 passed, 0 failed, 3 skipped (empty-project A1/A2/A5, declared gaps); 2 baseline patterns reported IMPROVED | green |
| `npm run check:docs` | exit 0, 5/5 (A-E), 34 warnings (inbox entries waiting to be folded) | green |
| `npm run check:codegen-lazy` (added) | exit 0, ALL GREEN 3/3 | green |

The smoke opens only new projects (P8 note): it does not exercise a saved state, so it says nothing about §3.

## 8. Proposal

### 8.1 Inventory (subagent, M; detail in its sections, here the shape)
- Range `cb699ad58..c7575bcf7`: 2497 commits, 945 first-parent (217 merges, 728 direct), 285 merges in all, 2212 non-merge.
  `3.0.0` and `cb699ad58` agree (`git rev-parse 3.0.0^{commit}` = `cb699ad5800f…`).
- **Not on origin: 233** (`git rev-list --count c7575bcf7 --not --remotes=origin`), all after `origin/alfonso-frontend-jjtl`
  `f731577da` (10-10 21:26): graphVertex 60, codegen 25, maintenance 18, JjScript/Jjodie 11, harness 22, trunk merges and
  direct docs 97. Oldest `1153700ce` 2026-10-10 01:03. (Remote refs as of the last fetch; `git fetch --dry-run` showed
  only the new `staging-dam-merged`, no update to the trunk's remote ref.)
- By front, user-facing (approximate commits / code commits): **simulator** 441 / ~145 (events, guards and actions,
  Petri core, roles and profiles, DFA/NFA/Moore/Mealy, inputs and globals, state face, I/O board and Clock, step back,
  scenarios, timeline, coverage; merges `3092e5aa8` … `45ad56bd6`); **IR and views** ~342 / ~114 (default-view parity
  R-IRN-29..36 `6ee6efcd5` `fb876efaa` `e7e47a7f0`, Derive viewpoint and six notations `530c18a7e`, metaclass colours
  `524bdd3f1`, edge ends `0bcdac22a`, ELK auto-layout `788570c06`, relayout-on-open `15c687010`, graphVertex `eb5600dbb`
  `f7ebd0f5b` `9cc9c7c83`); **symbol editor** ~35 / ~21 (Symbol Editor 1b, rules tables, corner radius, underline, Symbol
  tab opens it, default vertex size; `4d397ac02`, `f7c5fd910`, `7d1b0da4f`); **JjScript and Jjodie** ~55 / ~35 (forward
  refs, deferred re-run, M1 in container, reserved names `72762297b`, do-block fixes `294a29084` `75479afc6`, lexer own
  keys `0d2ad8f11`); **validation** user-defined rules (`4d397ac02`); **standalone editor** 78 / 36 (#142, #157 0a-4a and
  R2-R6, #158; `d4d9c4323` `447e4239b` `54a9b0a12`); **maintenance** 123 / ~34 (error screen on a failed open, Cmd+S
  live save, canvas export, update-depth and hidden-tab loops, object-as-edge delete, dark theme removed `c08ac1c5f`,
  subclass edge gesture `91be061fc`, new-project instantiate `58a407501`); **codegen** 37 / 11 (§2.1, switched off);
  **harness and docs** the rest (lane-run, gates, board, goal model, CAIN data).
- Not on the trunk, so not in 3.1 by the rule «everything on the trunk»: `elk-handles-a3` (R-VP-60), `edge-label-edit`
  (`a5421ff70`, R-IRN-42, prompt Status «eseguito» 10-11, not merged), `nested-vertices` (discovery only), `origin/damdev`
  (inside PR #184), R-SIM-145.

### 8.2 The cut
Not the start sha: **the trunk after L1** (staging absorbed), plus L3 and, if green in time, L2, plus the L4 version
commit. The release commit is L4's on the trunk; 3.1.0 is the tag on the merge commit of the trunk → staging PR, as 3.0.0.

### 8.3 Lanes
| lane | what | files | zone | parallel |
|---|---|---|---|---|
| L0 (Alfonso) | push the trunk (233 commits); ask Juri and Damiano to hold PR #184; fetch `origin/staging` into the lane's tree | — | — | first |
| **L1** staging → trunk | branch from `origin/staging`, merge the trunk into it, resolve `Jodie.tsx`, `defaultPrompts.ts` (#168 vs trunk Jodie work) and `docs/decisions.md` (union), re-read `jjscript/parser/parser.ts` (#175 vs do-block fixes); gates plus a probe that opens a 2.230 save and a 2.229 save; then `--no-ff` into the trunk (RC-14, gate report) | the three conflicts; `redux/VersionFixer.tsx` and the rest of what staging brings; the `VersionFixer.tsx:1193` reservation moves to 2.231 (a row, not code) | **critical zone** (VersionFixer, migration): LIR, go-ahead | with L2, L3 (disjoint files, §3.5 last bullet) |
| L2 drag hardening (optional) | Fix A: `useStoreApi().getState().nodes` at call time instead of `useNodes()`; carry the probe to the trunk as its gate | `editor-v2/hooks/useAutoAnchor.ts` (540-630), a unit test, `scripts/probe/petri-drag-loop.ts` and its fixture | not §3.1 | with L1, L3 |
| L3 codegen flag | §2.7 | `codegen/setting.ts`, `EditorV2.tsx` (413, 5000), `pages/settings/AdvancedSettings.tsx` (83-100), `codegen/__tests__/setting.test.ts`, `scripts/gates/check-codegen-lazy.ts` | not §3.1 | with L1, L2 |
| L4 release 3.1.0 | version, About, CHANGELOG `[3.1.0]` from §8.1 plus the staging fixes; `:64` to `### Removed`; then the RC-23 checklist on the release build | `frontend/package.json`, `frontend/package-lock.json`, `pages/components/about/AboutDialog.tsx`, `CHANGELOG.md` (optional `WelcomeModal.tsx` and `scripts/smoke/states.ts:186` together) | — | after L1-L3 merge |
| L5 (recommended, small) | a 3.0.0-exported `.jjodel` pinned in a VersionFixer test: 2.228 → highest, primitives after EDouble, migrated view kept; and a build without the 2.230 step throwing | new `redux/__tests__/` file and fixture | test only | after L1 |
| Ship (Alfonso, Juri) | PR trunk → `staging`; beta check; GitHub release `3.1.0` on the merge commit; PR `staging` → `dotnet-backend-integration`; footer and About read v3.1.0 on app.jjodel.io | — | outward | last |

### 8.4 Visual checklist for RC-23, on the release build
Built from the release commit with `vite build --mode staging` (the CI command), served by `vite preview` on a free port
(never 3001), light, 1600×1000; each item read from the DOM or the console.
1. Boot: no console error beyond `scripts/smoke/console-baseline.json`; footer and About read `v3.1.0`.
2. Saved projects: a 3.0.0 export (L5 fixture), a 2.229 export (`scripts/probe/fixtures/scene_*.jjodel`) and a 2.230 beta
   save each open without the error screen; `version.n` equals the build's highest; node count > 0.
3. Default views: DemoPEST, DemoESM, DemoFlowB under «Abstract syntax» draw nodes and edges; a 3.0 classic default view
   still renders natively (`isMigratedDefaultView`).
4. Symbol editor: the Symbol tab opens the modal above the rail (`elementsFromPoint` on its Save button), a corner radius
   change shows in the preview, Save then reopen gives the same values.
5. Simulator: DemoPetri derived as Petri net (classic), Advanced mode, Simulation toggle on: Reset, Step, Play change
   the marking; then 10 fresh-page first drags of p1, lock and t3 with no «The canvas stopped» fallback and no «Maximum update depth».
6. JjScript: a script that creates M1 instances in a container runs, one summary modal; a `do` block with a non-command body does not freeze.
7. Jjodie reserved names: a generated script using a reserved identifier is refused with its message.
8. No codegen entry: key absent → no element with `title="Code generation"` in any M1 editor, basic and Advanced;
   Settings → Advanced has no «Experimental» group (after L3); the network log holds no `CodePanel-*.js` nor `runner.worker-*.js`;
   `localStorage['jjodel.experimental.codegen']='true'` set by hand still shows nothing (after L3).
9. No dark theme: Settings → Appearance has no `input[name="theme"]`; with `localStorage.theme='dark'` seeded before boot
   `html` has no `data-theme="dark"` and every `.editor-v2` carries `theme-light`; emulated `prefers-color-scheme: dark`
   leaves the canvas background unchanged.
10. graphVertex: the BPMN lanes scene draws pools and lanes; a child drag moves its frame.

## 9. Files read
`CLAUDE.md`; `docs/PROTOCOL.md`; `docs/claude-code-log.md` (lines 1-120); `docs/log-inbox/release-3-0.md`;
`docs/harness/fronts.json`; `docs/decisions.md` (5740-5760 and searches); `CHANGELOG.md` (1-30, 64, 66);
`.claude/skills/log-entry/SKILL.md`; `frontend/package.json`; `frontend/vite.config.ts` (1-130);
`frontend/index.html` (13-22); `frontend/.env.staging`, `frontend/.env.production` (the persistence lines);
`frontend/scripts/smoke/run.ts`, `states.ts` (base URL, `seed`, `setTheme`); `frontend/scripts/gates/check-codegen-lazy.ts` (1-60);
`frontend/src/codegen/setting.ts`; `frontend/src/components/editor-v2/EditorV2.tsx` (126, 413, 613-614, 4363, 4405, 5000);
`frontend/src/components/editor-v2/hooks/useAutoAnchor.ts:568`; `frontend/src/pages/settings/AdvancedSettings.tsx` (80-104);
`frontend/src/pages/components/about/AboutDialog.tsx:79`; `frontend/src/redux/VersionFixer.tsx` (110-150, 1185-1200);
`frontend/src/redux/store.tsx:104`; `frontend/src/common/Log.ts` (99-151); `frontend/src/redux/reducer/reducer.ts:1614`;
`frontend/src/components/editor-v2/sim/simRoleStatus.ts` (290-310); `frontend/src/pages/components/Navbar.tsx` (2052-2058);
`frontend/src/components/project/ProjectEditor.tsx` (405-411); `docs/claude-code-log-archive.md` (520-530, 3055-3076);
`petri-loop-disc:docs/discovery/discovery_2026-10-10_petri_classic_drag_loop.md` (1-140);
`petri-loop-disc:frontend/scripts/probe/petri-drag-loop.ts` (1-75, 470-560);
`origin/staging:frontend/src/redux/VersionFixer.tsx` (1355-1372); `.github/workflows/*.yml` (trigger and slot lines);
PR #184 diff of `frontend/src/redux/VersionFixer.tsx`. The subagents' reads are named next to their findings.

## 10. Dependencies and risks
- L1 is the critical path and the largest: 110 commits, two code conflicts in Jodie, a semantic overlap in the JjScript
  parser, a migration. If PR #184 lands first, L1 grows by 88 files and a rewritten format chain.
- PR #184's early return skips migrations, the default-view refresh and the purge for any save at or above the build's
  highest version; whether 3.1 wants that behaviour is a decision of its own, not taken here.
- The `replaySafe` attribution of §5.1 is inferred; without L2 the loop's amplifier stays.
- The 3.0 → 3.1 open is proven by tests on synthetic and pre-2.1 states and by 2.229 fixtures, not by a 3.0.0 save (L5).
- Production already cannot open beta 2.230 saves (inferred); every day before 3.1 reaches production keeps that window open.
- Temporary material outside every tree, left in place: `/tmp/r31probe`, `/tmp/r31-old`, `/tmp/r31-pregv`, `/tmp/r31_*.txt`,
  `/tmp/r31_pr184.diff`. Dev servers on 3131 and 3132 were started and stopped by this session; the tree's `git status`
  stayed empty (`dist/`, `.vite-cache/` are gitignored).

## Decisions taken (unattended)
1. Log entry written in a lane inbox, `docs/log-inbox/release-3-1.md`, not in `docs/claude-code-log.md` as the prompt says:
   P9 and the `log-entry` skill forbid the active log to a parallel lane (the fold is an exclusive lane).
2. The prompt's Status line is not flipped: NON FARE limits `docs/` edits to the report and the log entry. The chat flips it.
3. The drag loop was re-measured instead of taken from the report (CLAUDE.md §5, fixtures not trusted across sessions),
   with the probe of `petri-loop-disc` run from `/tmp` and two `git archive` controls; no file in the tree changed.
4. The smoke ran against a dev server of this tree on 3131 (`SMOKE_URL`), not on 3000 (P14: a port no other tree uses).
5. `check:codegen-lazy` run beside the requested gates; a read-only `gh` view of PR #184 and of the staging deploy runs.
6. The prompt's premise «3.1 ships now» was followed over R-GEN-1's «no separate 3.1 tag» (`docs/decisions.md:5751`); the conflict is D4.

## Decisions awaiting Alfonso
- **D1** (what ships): the 3.1 line absorbs `origin/staging` (format 2.230 and #157 A/B, #168, #171, #173, #174, #175,
  #176, #178, #179, #182). Recommended: yes; without it 3.1 cannot open beta saves.
- **D2** (outward): ask Juri and Damiano to hold PR #184 until 3.1.0 is tagged. Recommended: yes.
- **D3** (what ships): hide the «Code generation» toggle with the `VITE_CODEGEN` build flag (L3). Recommended: yes.
- **D4** (a decision row): record the 2026-10-11 scope (3.1 now, without the generator) as a row amending R-GEN-1. Recommended: yes, written by the chat.
- **D5** (push): push `alfonso-frontend-jjtl` (233 commits) before L1, so both parents of the staging merge are public (P14). Recommended: yes.
- **D6** (what ships): Fix A of the drag loop as optional hardening, shipped only if green before the cut. Recommended: yes.
- **D7** (what ships): `edge-label-edit` (R-IRN-42) is not on the trunk; it ships only if merged before the cut. Recommended: decide with its visual GO.
- **D8** (what ships): keep `frontend/public/examples/codegen/*.jjodel` in the 3.1 build (static, unlinked). Recommended: keep (switched off, not removed).
- **D9** (what ships): do not hold 3.1 for the pre-existing data-loss paths of §5.2; open a maintenance lane for the unload warning and a measurement of the favorite/tags PUT. Recommended: yes.
