# Prompt: Phase 2, wave A of the `.[x]` lane: the core types `Expression` and `Action`

Prompt-ID: P-2026-09-25-1445
Chat: C-2026-09-25-1353
Lane: full (critical zone, migration, changed exported interface)
Status: da eseguire

Worktree: `~/jjodel-sim`, branch `simulation-engine`, the session that ran Phase 1 and wave B1. Before anything else: `pwd` is `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, `git log -1` is the commit that adds this file (subject `docs: wave A prompt of the state operator lane (P-2026-09-25-1445)`), `git status` empty. Otherwise stop.

**Numbering.** The series ratified for this lane is now **R-SIM-39..46** (`8f97d4f6f`): the trunk had ratified a different R-SIM-38 first. B1's commit bodies, its prompt and its inbox entry keep the old numbers 38..45; `docs/decisions.md` maps them. From here on cite only 39..46: wave A is bound by **R-SIM-44** (the types, one exported set of primitive ids), **R-SIM-45** (Ecore) and **R-SIM-46** (VersionFixer `2.229`, amends R-IRN-19). The code comments of B1 were already shifted in `4d96ba1fb`.

**Parallel lanes.** `P-2026-09-25-1440` (hash change, `~/jjodel-open`, port 3003) and `P-2026-09-25-1500` (event class from the trigger, another chat, branch `sim-event-trigger`) may be running. Do not touch any other tree or server. If you find that `sim-event-trigger` touches a file of this wave, say so in the closing report; do not coordinate with it.

## COSA

Wave A of report §7.2, as ratified: two primitive types, `Expression` and `Action`, from the definition to the saved projects, the Properties and canvas type choices, the conformance check, JjScript and Ecore. B1's strict parse (`parseExpressionStrict` or whatever name B1 gave it) and `parseAction` are the syntax checks; do not write a second parser.

Two code commits, one concern each, then one visual check and one closure:

- **A1, the type in the tool:** `common/U.tsx` (the two enum members **after** `EDouble`, `ShortAttribSuperTypes`, `AttribETypes`), `common/Defaults.ts`, `redux/VersionFixer.tsx` (step `'2.228 -> 2.229'` and the comment at `:1193`, R-SIM-46), `model/logicWrapper/LModelElement.tsx` (the `get_values` string branch, the `set_type` aliases), `common/Dummy.ts`, `model/conformance/ConformanceValidator.ts` (CHECK 3: Expression by the strict parse, Action by `parseAction`, `''` skipped, exactly `else` accepted, `type_mismatch` at `warning`), `jjscript/executor/commands/create.ts` (aliases), the single exported set of primitive ids (R-SIM-44: name-check first, place it next to the enum or in `Defaults.ts`, say where and why) read by `joiner/classes.ts:899`, `services/export/EcoreService.ts:702` and `services/export/JsonModelService.ts:321`.
- **A2, the type at the borders:** `services/export/EcoreService.ts` (the `jjodel`/`type` annotation on an `EString`, R-SIM-45), `api/data.ts` (the two members kept out of the `#//<name>` map; the import post-pass that restores the type and drops the annotation), `components/editor-v2/types.ts` (labels and the `EDataType` union).

Line numbers are from the report and may have moved: read whole functions.

Tests: `redux/__tests__/versionfixer_2229_migration.test.ts` (new), `model/conformance/__tests__/ConformanceValidator.test.ts`, `services/export/__tests__/ecore-io.test.ts`, a JjScript `create` test (existing file if one fits), `joiner/__tests__/dTypedElement.test.ts` for the set. Rule 19: more than five files, authorized by this list; any file outside it is a stop.

Out of scope: `DV.tsx` (the new types render grey there, Rule 14), `jjomTransformers.ts`, `canvasToJjom.ts`, `useFormWidgets.ts`, every other critical-zone file; the simulator (`simBridge.ts`, `guardContext.ts`, the panel: wave B2); `parseExpression` (ticket); `Pointer_EOBJECT` (ticket); retyping `simGuard` (R-SIM-44: EString keeps working).

## COME

1. Baseline: typecheck (14, §17 set), vitest (state the expected total first: 4654 after B1), build, `check:docs`, `check:scripts`.
2. Tests first, red where the feature is missing, for the ten mutants of report §7.2 plus two: (11) one of the three primitive-id checks reads its own literal instead of the shared set; (12) the step appends the new ids before `EDouble`'s record in `primitiveTypes` (enum order broken; `api/data.ts:255` takes index 1 as EString by position).
3. **Hard stop before `VersionFixer.tsx`** (critical zone, CLAUDE.md §3.2). Post the Layer Impact Report for wave A in chat, starting from the draft of report §8 corrected with what you now know, and wait for Alfonso's OK. RC-19: the hook's `ask` is not the gate, this stop is. The other A1 files may be written before the stop; the step may not.
4. A1 code commit after the OK and after the gates; A2 code commit after its gates. Subjects within 72 characters, counted before committing; bodies with the gates and the mutant table (A1 mutants in A1's body, A2's in A2's); `Model:` trailer; pathspec after `--`.
5. Mutation bench: the twelve mutants, each applied, run, reverted; a survivor is a stop. Known gap: `LModelElement.tsx` does not load under vitest, so its branch is held by the visual check (CLAUDE.md §5); say so in the table.
6. Gates on each code commit: typecheck 14, same set; vitest expected total, 0 failed, the same 9 files red at import; build exit 0; `check:docs` 4/4; `check:scripts` as baseline.
7. **Visual check, hard stop.** Start a dev server on 3002 from this tree (port free first). Give Alfonso the steps of report §7.2: (1) the M2 type dropdowns (canvas `InlineTypeSelect`, Info `TypeSelect`) list Expression and Action; (2) on M1, `a +` in an Expression attribute is saved and shows a conformance problem in the overlay, a well-formed value and `else` show none; (3) a project saved before the step opens with the two types listed; (4) export a metamodel with an Expression attribute, re-import, the type is Expression again; (5) the smoke: views render, `Families.ecore` imports with 8 Family/Member edges, save and reopen give the same state plus the two records. Wait for his answer.
8. After his OK, one closure commit (P13, RC-17): the entry in `docs/log-inbox/simulation.md` (Layer Impact Report `produced`; cite R-SIM-44..46 with the new numbers), this file's Status flipped to `eseguito <date> · lane simulation · <A2 sha> · verifica visiva passata <date>`. Stop your server.
9. Closing report opening with `[P-2026-09-25-1445 · session <id>]`: the shas, gates, mutants, deviations, the overlap with `sim-event-trigger` if any. Then stop: wave B2 gets its own file from chat.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `rm` of the `node_modules` symlink, an edit to `VersionFixer.tsx` before the OK of step 3, push.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-25_state_operator_core_types.md` §3, §7.2, §8, §9 (R1, R2, R6, R7, R8).
- `docs/decisions.md` R-SIM-17, R-SIM-39..46 (the note on the renumbering), R-IRN-19; RC-3, RC-13, RC-17, RC-19.
- `CLAUDE.md` §3.2, §5; `docs/PROTOCOL.md` P5, P13, P14.
