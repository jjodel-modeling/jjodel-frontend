# Discovery — #168 M0, measures for J4 (annullamento, «Unsaved», riferimenti, contenimento)

**Prompt-ID**: P-2026-10-01-2300
**Prompt file**: `docs/prompts/claude_2026-10-01_2300_prompt_168_m0_measures.md`
**Session**: unknown (not visible to this session)
**Tree / HEAD**: `/Users/juridirocco/development/jjodel-168-measures`, branch `168-measures`, `8961023e1` ("docs(#168): lane prompts M0, A, B and the jodie-consumer inbox")
**Executor**: Anthropic Claude Sonnet 5
**Stato**: Fase 1 read-only (measurement lane). Nessun file tracciato sotto `frontend/` modificato. Probe `frontend/scripts/smoke/_tmp_168_m0_measures.ts`, gitignored, non committata.

This report is a set of hypotheses with evidence, not a definitive reference. A reader acting on it rereads the real files and, where a number matters, reruns the probe (`node frontend/scripts/lane-run.mjs probe "$PWD" frontend/scripts/smoke/_tmp_168_m0_measures.ts --port 3041 --id P-2026-10-01-2300`, log at `~/.jjodel-lanes/P-2026-10-01-2300/probe-_tmp_168_m0_measures.log`). Every numbered finding below is MEASURED (31/31 checks non-FAIL in the final run, 0 page errors) unless marked READ (code inspection only, not exercised).

---

## 0. Answer in brief

**Headline finding, cross-cutting Q1/Q2**: `U.userHasInteracted` (`common/U.tsx:211`) is the single gate on the D-layer undo history (`redux/reducer/reducer.ts:1278`). It is set `true` in exactly two places in the whole codebase — `EditorV2.tsx:4283` (`.editor-v2`'s own `onPointerDownCapture`/`onKeyDownCapture`) and `MetamodelTab.tsx:164` — both developer-only canvas surfaces the consumer Configurator never mounts. **In a pure consumer session Ctrl+Z is a complete no-op for everything Jodie writes via JjScript**: 0 history entries before and after the script, 0 after 3× Ctrl+Z (MEAS Q1a-history, Q1a-ctrlz-noop). The same script, with `userHasInteracted` forced true (simulating a developer who touched an editor), produces 2 history entries for 4 JjScript lines and fully undoes in 2 Ctrl+Z presses (MEAS Q1b-history-grows, Q1b-full-undo-at).

- **Q1 (Ctrl+Z)**: no-op today in consumer. Recommended: J4 cannot promise "Apply → Undo" via Ctrl+Z as-is; it needs either (a) an explicit `U.userHasInteracted = true` raised on Jodie's own first proposal-apply gesture in consumer mode (cheapest, one line, same pattern as `EditorV2.markUserInteracted`), or (b) its own apply-local undo (D5's "declare and defer" branch) if touching that gate is judged sync-adjacent enough to need its own go-ahead. Either way: even gated open, one script maps to as many history entries as it has non-`TRANSACTION`-wrapped creator calls — `create instance` is 1 entry per call (not batched with the `set`s that follow), so a 4-line script needs ~2 presses (one per create+its immediately-following merged sets within the 300ms-ish merge window), not 1. A single-press "Apply → Undo" is only honest if J4 wraps the whole proposal in one option it controls, not by relying on raw Ctrl+Z granularity.
- **Q2 ("Unsaved")**: `U.isProjectModified` stays `false` after any JjScript write (MEAS Q2-flag) — no file under `jjscript/` sets it (confirmed by exhaustive grep, zero hits). The indicator (`LastSavedIndicator.tsx`) does flip to "Unsaved…" when the flag is forced true, but only on its own 10s poll (`lastSaved.ts:58`, `LAST_SAVED_TICK_MS = 10_000`) — confirmed by positive control (MEAS Q2-control). Recommended: J4's "Apply" must set `U.isProjectModified = true` itself (one line, same spot as `createAdapter.ts:547`); do not expect a 10s-delayed indicator to double as "Apply succeeded" feedback — that needs its own immediate UI cue.
- **Q3 (riferimento singolo)**: G4 CONFIRMED on this code — `set s.lead = p2` after `set s.lead = p1` appends (`values` → length 2) instead of replacing a 0..1 reference (MEAS Q3-single-ref); conformance does catch the overfill afterwards (`multiplicity_upper_exceeded`, MEAS Q3-conformance-overfill) but only on reopen/revalidate, not at write time. **New finding, not in the original question**: two `set` calls on the *same* reference back-to-back in **one script with no gap** can instead **lose** the earlier value — confirmed by a per-contrasto pair (no-gap arm loses one of two values; same two `set`s with a 400ms gap keep both, MEAS Q3-multi-ref-race / Q3-multi-ref-contrast). Root cause: each `set` reads `__raw.values` synchronously then writes through a deferred `setTimeout(0)` dispatch (`redux/action/action.ts:349`) — the exact ENG1 stale-index race `README-probes.md` already documents for probes, now reachable from JjScript's own command sequencing. Recommended: J4's executor rewrite (already planned, per the chat decision on G4) must fix **both** bugs with one change: compute the write from an **accumulating cursor over the script's own pending writes**, never from a synchronous re-read of the store, and make it **replace** when the target reference is 0..1. `people` (genuinely multi-valued, run with a gap) accumulates correctly — not a regression target.
- **Q4 (contenimento)**: JjScript creates a non-rootable `Competency` instance anyway (no `rootable` check in `executeCreateInstance`, unlike the Configurator's own create path after R3 — `instance.ts:259-343` vs. `LModelElement.tsx:3091-3094`), rooted at the model (MEAS Q4-created-despite-not-rootable). `set s.competencies = c1` DOES move it: `c1.father` becomes the slot's `DValue` id (MEAS Q4-father-moved) — containment via `set` on a composition reference works. But **`c1`'s id stays in `model.data.objects`/`LModel.objects` after the move** (MEAS Q4-stale-model-objects, Q4-LModel-objects-getter): the write path (`LModelElement.tsx:7912-7930`, inside `get_setValueAtPosition`) reparents via a raw `SetFieldAction.new(val, "father", ...)`, bypassing `LObject.set_father` (`:6510-6532`) and whatever bookkeeping a canvas-driven reparent would do through it. `validateConformance` has no "stale root" check, so this is invisible there too (MEAS Q4-conformance-silent). Recommended: declare and defer to J4 with an explicit scope note — this is a pre-existing framework gap in reparenting-via-reference-set, not something J4 introduces, but J4's "Apply" will be the first consumer-facing path that routinely exercises it (every `create` + `set <containment>` proposal). J4 should either (a) explicitly prune the stale entry itself after a containment `set` (its own responsibility, since it already controls the apply sequence), or (b) flag the gap to whoever owns `LModelElement.tsx`/`get_setValueAtPosition` as a core fix, scoped outside J4.
- **Q5 (spostamento fallito)**: a `set` naming a nonexistent owner is refused cleanly (`INSTANCE_NOT_FOUND`, MEAS Q5-set-refused) — no partial write. The created child is left exactly where `create` put it: a model root (MEAS Q5-orphan-unchanged). Since `Competency` is not a top-level type, the consumer's Configurator never lists it standalone (no type bar entry) and it is not nested under any Scenario — it is **invisible to the consumer**, visible only via raw store inspection or a developer-side Data Manager view that shows all types. Recommended: J4 can promise "a refused proposal leaves no partial state" as-is (true today); it should NOT promise "the fruitore will see the leftover" — they won't, by design of the Configurator's top-level-types gate (R3). If J4 wants the fruitore to see a refused-but-partially-executed multi-step proposal's debris, it needs its own surfacing, not a reliance on the Configurator.
- **Q6 (Configurator)**: the instance list **does** refresh live after a JjScript create, with no reload and no click — confirmed by a DOM row count before/after (MEAS Q6-live-refresh, 3→4 rows). Mechanism: `idlookup` is a direct `useSelector` dependency (`ConfiguratorTab.tsx:66`) feeding the `instances` `useMemo` (`:145-150`); any Redux-dispatched write re-renders it. No code change needed here for J4. There is **no existing event to move the Configurator's selected **instance** from outside** — only `EnvGenEvents.CONFIGURATOR_SELECT_TYPE`/`CONFIGURATOR_TYPE_CHANGED` exist (`events/registry.ts:121-128`), both type-level; `selectedInstanceId` is local `useState` with no external hook (confirmed by registry enumeration, MEAS Q6-no-instance-select-event). Recommended: if J4 wants "Apply" to land the fruitore on the newly-created/edited instance, it needs a new `CONFIGURATOR_SELECT_INSTANCE` event (detail `{typeId, instanceId}`) added to the registry and wired into `ConfiguratorTab.tsx`'s existing `selectedInstanceId` state — a small, additive, non-critical-zone change.

---

## 1. Hypotheses under test

1. **H1** — "Ctrl+Z undoes a JjScript-authored script in the Configurator, in some number of steps." PARTLY FALSIFIED: it undoes nothing at all in a pure consumer session (the realistic #168 scenario), because of the `userHasInteracted` gate — a fact the chat's framing of Q1 did not anticipate. Once that gate is bypassed, it does undo, in 2 steps for the 4-line fixture script. See §5.1.
2. **H2** — "Nothing sets `U.isProjectModified` from JjScript, so 'Unsaved' never lights up." CONFIRMED. See §5.2.
3. **H3** (G4, from `docs/discovery/2026-06-12_jjscript_m1_coverage.md`) — "`set` on a single-valued reference appends instead of replacing." CONFIRMED, and a second, previously-undocumented race (data loss on back-to-back same-reference `set`s with no gap) was found alongside it. See §5.3.
4. **H4** (Juri's hypothesis, prompt §Contenimento) — "JjScript does not create instances inside other instances directly, but a script can create two root elements and then set a containment reference to move one inside the other." CONFIRMED for the move itself; PARTLY FALSIFIED for "clean move" — the old root-list entry survives. See §5.4.
5. **H5** — "A failed containment `set` leaves the would-be child an orphan at the root." CONFIRMED, with the added finding that the Configurator's top-level-types gate (R3) makes this orphan invisible to the consumer regardless. See §5.5.
6. **H6** — "The Configurator list is a live view of the store (via `useSelector`), so it reflects a JjScript create without a reload." CONFIRMED. See §5.6.

## 2. Files read

- `docs/PROTOCOL.md` (P4, P8, P9, P13, P16 read in full)
- `docs/decisions.md` (grepped for RC-13/20/21/22 and `168`; no #168-specific decision recorded there — D1-D5 live in the GitHub issue, per the prompt)
- `docs/log-inbox/standalone-environment.md`, `docs/log-inbox/jodie-consumer.md` (full)
- `frontend/scripts/smoke/README-probes.md` (full)
- `frontend/src/jjscript/CLAUDE.md`, `frontend/src/model/CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`, `frontend/src/redux/CLAUDE.md` (full)
- `docs/discovery/discovery_2026-10-01_157_r3_rootable_types.md`, `discovery_2026-10-01_157_r5_consumer_landing.md` (full)
- `frontend/src/jjscript/executor/commands/instance.ts`, `set.ts` (full)
- `frontend/src/jjscript/services/JjScriptService.ts` (full)
- `frontend/src/components/Jodie/ChatMessages.tsx:397-490` (`handleJjScriptExecute`)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (targeted: `:3058-3104` rootable, `:4087-4116` containment, `:5716-5760` objects/roots, `:6500-6537` set_father, `:7257-7397` get_addObject, `:7868-7970` get_setValueAtPosition/set_values)
- `frontend/src/redux/reducer/reducer.ts:1120-1340` (UndoAction/RedoAction handling, history push/merge, `isRelevantChangeCheck`)
- `frontend/src/redux/store.tsx:60-90` (`statehistory`)
- `frontend/src/redux/action/action.ts:630-720` (UndoAction/RedoAction classes), `:340-350` (deferred dispatch)
- `frontend/src/common/U.tsx:211` (`userHasInteracted` declaration)
- `frontend/src/components/editor-v2/EditorV2.tsx:1038-1077, 2549-2620, 2700-2755, 4283` (undo wiring, `markUserInteracted`)
- `frontend/src/pages/components/Navbar.tsx:1190-1300, 1985-2010` (Ctrl+Z global handler, Save button, `LastSavedIndicator` mount)
- `frontend/src/utils/keyboardShortcuts.ts` (full — `detectCurrentContext`, `matchesShortcut`, `SHORTCUTS`)
- `frontend/src/common/libraries/projectModified.ts` (full)
- `frontend/src/components/topbar/LastSavedIndicator.tsx` (full)
- `frontend/src/common/libraries/lastSaved.ts:55-120` (`formatLastSavedLabel`, `useLastSaved`, `LAST_SAVED_TICK_MS`)
- `frontend/src/model/conformance/ConformanceValidator.ts:1-70, 480-550` (signature, CHECK 4/5 multiplicity)
- `frontend/src/model/conformance/ConformanceTypes.ts:38-67` (`ConformanceViolation` shape)
- `frontend/src/components/environment/ConfiguratorTab.tsx:1-430` (useSelector, `instances` memo, instance list markup, `CONFIGURATOR_SELECT_TYPE` wiring)
- `frontend/src/components/environment/consumerMode.ts` (full)
- `frontend/src/pages/components/Dashboard.tsx:570-660` (consumer branch, `variant="page"`)
- `frontend/src/events/registry.ts:115-149` (`EnvGenEvents` and neighbours)
- `frontend/src/joiner/classes.ts:3720-3797` (`DEnvironmentConfig`, `DProfile`), `:454-480` (`RuntimeAccessible` → `windoww`), `:1660-1664` (`Pointers.ESTRING`)
- `frontend/src/joiner/types.ts:192`, `frontend/src/joiner/classes.ts:162` (`windoww === window`)
- `frontend/src/common/Defaults.ts:28-45` (`Pointer_ESTRING`)
- `frontend/scripts/smoke/states.ts` (full — reused `seed`, `link`, timing constants; NOT `BASE_URL`/`createProject`, which bake in `localhost:3000`)
- Reference probes (main tree, read-only): `/Users/juridirocco/development/jjodel/frontend/scripts/smoke/_tmp_157_r5_verify.ts`, `_tmp_157_158_globals.ts`, `_tmp_157_r3_measure.ts`

## 3. Fixture

Built by the probe itself (`frontend/scripts/smoke/_tmp_168_m0_measures.ts`, gitignored), against the worktree's own vite on port 3041 via `lane-run.mjs probe`:

- Metamodel `M0MM`, one package `default`.
- Classes: `Scenario` (root-capable: not abstract, not composed), `Competency` (composed — target of `competencies`, so not rootable per `LClass.rootable`), `Person` (root-capable).
- `Scenario.title : EString`, `Competency.label : EString`.
- References, all on `Scenario`: `competencies → Competency` (composition, `upperBound = -1`), `lead → Person` (non-containment, `upperBound = 1`), `people → Person` (non-containment, `upperBound = -1`).
- M1 model `m0_model`, conforming to `M0MM`.
- `DEnvironmentConfig` with `topLevelTypes = [Scenario, Person]`, one `DProfile` "Viewer" (no restrictive `typePermissions` — full edit, since Q6 only needs a resolvable `?profile=`).
- Persisted (stored `lastModified` changed, sentinel per P12/README-probes) before the first consumer-landing navigation.
- Names used downstream: instances `p1`/`p2`/`p3` (Person), `s1`/`s2` (Scenario, Arm A/B of Q1), `sRaceA`/`sRaceB` (Scenario, Q3 race test), `c1`/`c2` (Competency, Q4/Q5), `s_new` (Scenario, Q6).

## 4. Method notes

- All navigation used `PROBE_URL` (port 3041, this worktree's own vite), never `localhost:3000` — `states.ts`'s own `BASE_URL`/`createProject`/`openState` bake in 3000 and were **not** imported; a local `createProject` was written against `PROBE_URL` instead. `seed` and `link` have no `BASE_URL` dependency and were reused as-is.
- Every `page.evaluate` body was preceded by the `__name` shim (`README-probes.md` "The `__name` gotcha").
- `JjScriptService.execute` was reached via a live Vite ES-module import (`await import('/src/jjscript/services/JjScriptService.ts')`) inside the page — the same function `ChatMessages.tsx:437` calls, with an explicit `scope` (mirroring the "Jodie reply with a bound scope" path, `JjScriptService.ts:27-30`), not a lower-level command or a UI click. Per P11, the probe executes the subject.
- Two P12 positive controls were run: forcing `U.isProjectModified = true` to confirm the indicator CAN change (Q2-control), and a delayed-pair arm to confirm the Q3 data-loss is a timing race and not a multiplicity-logic defect (Q3-multi-ref-contrast).
- One genuine probe-authoring mistake surfaced and was fixed before the final run: a curried function accidentally passed to `page.evaluate`, and a baseline state snapshot taken before a deferred slot-value commit (CLAUDE.md §9.2) had landed — both are noted here per the "do not trust a result that turns out to be the probe's own artifact" discipline (§5), not folded silently into the numbers.
- The final run (31/31 non-FAIL, 0 page errors) is quoted throughout; two earlier runs in the same session hit transient environment issues unrelated to the measured subject (a `page.evaluate` racing the app's own boot once, a 30s `page.goto` timeout once under machine load) — neither reused as evidence.

## 5. Findings in detail

### 5.1 Q1 — Ctrl+Z

- `common/U.tsx:211`: `public static userHasInteracted: boolean = false;`
- `redux/reducer/reducer.ts:1278`: `if (!U.userHasInteracted) return false;` inside `isRelevantChangeCheck`, which gates whether a reducer delta is ever pushed to `statehistory` (`:1259-1269`).
- Exhaustive grep for `userHasInteracted` (4 hits total): declaration, the gate read above, and exactly two setters — `EditorV2.tsx:1052` (`if (!U.userHasInteracted) U.userHasInteracted = true;`) wired at `:4283` to `.editor-v2`'s own `onPointerDownCapture`/`onKeyDownCapture`, and `MetamodelTab.tsx:164`. Both are developer canvas surfaces; the consumer Configurator (`ConfiguratorTab.tsx`, per R5) renders neither.
- MEAS (`LAND0`): on the fresh consumer landing (`#/project?id=X&profile=Y`, no editor ever opened in the session — not even during fixture build, which used direct `page.evaluate` D-layer calls, not the canvas), `userHasInteracted: false`, `.GraphContainer`/`.Graph` absent.
- MEAS (`Q1a-history`): `statehistory.all.undoable.length` is 0 before the 4-line script and 0 after it, despite all 4 commands reporting `success: true` (`Q1a_exec`: create p1, create s1, set title, set lead all succeeded).
- MEAS (`Q1a-ctrlz-noop`): 3× `Meta+z` (this machine reports `navigator.platform: MacIntel`, so `isMac()` in `keyboardShortcuts.ts:22-25` selects the `metaKey` branch) changed nothing — `statehistory` still 0, p1/s1/title/lead all unchanged.
- MEAS (`Q1a-context`): `detectCurrentContext()` on the consumer landing resolves to `'PROJECT_EDITOR'` (`keyboardShortcuts.ts:58-60`, since the path includes `/project` and no `.GraphContainer`/`.Graph` is mounted) — so the Ctrl+Z handler's `context === 'PROJECT_EDITOR'` branch (`Navbar.tsx:1209`) is live; the no-op is entirely the `userHasInteracted` gate downstream, not a context mismatch.
- MEAS (`Q1b-history-grows`, `userHasInteracted` forced `true`): the same 4-line script (fresh instances p2/s2) added exactly 2 entries to `statehistory.all.undoable` (0 → 2). The two creates (`create instance of Person`, `create instance of Scenario` — each a bare `DObject.new(...)`, explicitly **not** wrapped in an outer `TRANSACTION`, `instance.ts:361-362`) did not merge with each other or with the two `set`s that followed (each wrapped in its own `TRANSACTION`, `instance.ts:710`/`:828`) — `isRelevantChangeCheck`'s merge window (`reducer.ts:1276`, `mergeTolerance = U.UpdatingTimer*1.5`) evidently did not bridge all four, but did bridge enough of them to land at 2, not 4.
- MEAS (`Q1b-steps`, `Q1b-full-undo-at`): press 1 left p2 existing but with `title`/`lead` cleared (partial state — the "which intermediate state does each step leave" the prompt asked for: a scenario with an empty name-slot and no attributes, visible to a fruitore who happened to look mid-undo); press 2 removed both p2 and s2 entirely. Presses 3-8 were no-ops (stack exhausted at depth 2). So: **full rollback of a 4-line script = 2 Ctrl+Z presses once the gate is open, each leaving a different partial state**, not 1 and not 4.
- Options for "one step", costed, per the prompt's request (not implemented here):
  1. **Wrap the whole proposal's script in one outer `TRANSACTION`.** Forbidden as written: `create instance` calls `DObject.new` directly, and Rule 12 (CLAUDE.md top block) says an outer `TRANSACTION` around a `DObject.new`/`DVoidEdge.new2/3` causes coordinate loss / dropped `SetFieldAction`s. Cost: a sync-layer change, needs its own Layer Impact Report and go-ahead; not free.
  2. **A `CombineHistoryAction`-style merge after the fact** (`redux/action/action.ts:705-718`, currently a `// todo: delete or find original idea back` stub) — coalesce the N deltas the script produced into one `statehistory` entry once the script finishes. Cost: touches the reducer/history internals directly (critical-zone-adjacent), and the stub's own TODO suggests it was abandoned once already.
  3. **J4 does not rely on Ctrl+Z at all**: "Apply" computes its own pre-image (the instance ids it is about to touch, snapshotted before running) and "Undo" replays a hand-rolled inverse (delete what was created, restore prior attribute/reference values) — no D-layer undo stack involved. Cost: J4's own logic, no core/sync-layer touch, but it is a real implementation (not "free") and has to handle the same containment/reference subtleties as §5.3/5.4 when inverting.
  - Recommended (restating §0): option 3 is the only one that does not require a critical-zone go-ahead; D5 ("undo in one step only if it can be done without touching the sync layer, else declare and defer") points the same way.

### 5.2 Q2 — "Unsaved"

- Exhaustive grep for `isProjectModified\s*=\s*true` (CLAUDE.md §5's "proof the search ran" discipline: the positive control is `createAdapter.ts:547`, `formWrite.ts:160/206/247/275/385`, `IRNodeContent.tsx:295/305/366`, `ProfilesStep.tsx:81`, `MetaclassesStep.tsx:50`, `ProjectEditor.tsx:492` — ten real hits elsewhere in the codebase, so the grep itself has signal) — **zero** hits under `frontend/src/jjscript/`.
- MEAS (`Q2-flag`): after both Arm A and Arm B's JjScript writes, `U.isProjectModified === false`.
- `topbar/LastSavedIndicator.tsx:41`: `formatLastSavedLabel(savedAt, !!(U as any).isProjectModified)`; `lastSaved.ts:105-109`: `dirty ? (rel ? 'Unsaved, last saved '+rel : 'Unsaved') : ...`.
- `lastSaved.ts:58`: `LAST_SAVED_TICK_MS = 10_000`; `:83`: `setInterval(onChange, LAST_SAVED_TICK_MS)` — the indicator is re-read on a 10s timer, not pushed reactively off the static flag.
- MEAS (`Q2-control`, positive control, waited 10.8s): `q2before: "Saved just now"` → after forcing `U.isProjectModified = true` and waiting past one tick → `"Unsaved, last saved just now"`. Confirms the mechanism works and that §2's negative reading is real, not a broken probe.
- Who else sets it: the Save button (`appbar-save`, `Navbar.tsx:2000-2008`) and `saveProjectWithFeedback` reset it to `false` on save; nothing resets or reads it from the JjScript executor path at all today.

### 5.3 Q3 — single-valued reference `set` (G4) + a second race

- `jjscript/executor/commands/instance.ts:826-841` (`executeSetInstance`, reference branch, unconditional on declared multiplicity):
  ```
  const rawVals: any[] = refProxy.__raw?.values ?? [];
  const meaningful = rawVals.filter((v: any) => v != null && v !== '');
  refProxy.values = [...meaningful, targetInstance.id];
  ```
- MEAS (`Q3-single-ref`): `set s1.lead = p1` then (after a full separate `page.evaluate` round-trip, i.e. with a natural gap) `set s1.lead = p3` → `lead.__raw.values` went `[p1]` → `[p1, p3]`, length 2 on a `upperBound = 1` reference. G4 CONFIRMED.
- MEAS (`Q3-conformance-overfill`): `validateConformance` on the resulting model does raise `violationType: 'multiplicity_upper_exceeded'` (`ConformanceValidator.ts:494`) — but only when run; nothing runs it at `set`-time, so the overfill is silent until a reopen/revalidate.
- **New, not asked for but found alongside G4**: MEAS (`Q3-multi-ref-race`): two `set sRaceA.people = ...` calls issued back-to-back inside **one** `page.evaluate` (the shape a Jodie script naturally has — consecutive lines, no artificial gap) left `people.__raw.values` at length **1** (only the second target), not 2. MEAS (`Q3-multi-ref-contrast`, per contrasto): the identical pair of `set`s on a fresh instance (`sRaceB`), with a 400ms gap inserted between them, correctly accumulated to length 2. Root cause: the reference branch above reads `__raw.values` **synchronously**, but the write that reads it goes through `redux/action/action.ts:349`'s `setTimeout(()=>storee.dispatch({...this}), 0)` — a deferred dispatch. A second `set` arriving before that timeout fires reads the pre-write store and recomputes the same append from a stale base, silently dropping the first write. This is the ENG1 "index is the caller's" race `README-probes.md` documents for hand-written probes (`link()`'s whole reason for existing), now shown to be reachable from JjScript's own command sequencing, independent of G4.
- Recommended: the J4 executor rewrite already planned for G4 (per the chat decision: rule (b) in `defaultPrompts.ts` M1 INSTANCE COMMANDS is being rewritten together with the executor) should fix both in the same pass — an accumulating cursor over the **script's own** pending writes (not a re-read of `__raw.values`) for every reference `set` in a run, with "replace" semantics specifically when the target is 0..1. `people` with a real gap is the correctness baseline to keep (MEAS `peopleWithGap`: `[p1, p3]`).

### 5.4 Q4 — containment via JjScript (Juri's hypothesis)

- `LClass.rootable` (`LModelElement.tsx:3091-3094`, per the R3 discovery already on this branch): `Competency` is not rootable (composed by `competencies`). `executeCreateInstance` (`instance.ts:259-343`) checks `abstract` and `isSingleton` only — no `rootable`/composed check. MEAS (`Q4-created-despite-not-rootable`): `create instance of Competency "c1"` succeeds, `c1.father === m1Id` (the model, i.e. a root) — confirming Juri's premise that JjScript does not refuse this.
- `get_setValueAtPosition` (`LModelElement.tsx:7868-7930`), the `info.isContainment` branch: on `set s1.competencies = c1`, it schedules (via `outactions`) a detach-from-old-container step and `SetFieldAction.new(val, "father", c.data.id, undefined, true)` (`:7927-7929`) — a **direct D-layer field write**, not a call through `LObject.set_father` (`:6510-6532`, the L-proxy setter that also runs `checkNameUniqueness`). MEAS (`Q4-father-moved`): after the `set`, `c1.father`'s `className` is `'DValue'` (the slot), confirming the move happened and matching the README-probes `link()` note that containment fathers resolve to the slot, not the owning object directly.
- `LModel.get_objects` (`LModelElement.tsx:5717-5721`): `context.data.objects.map(...)` — a maintained D-layer array, not a dynamic filter by `father`. Nothing in the containment write path above touches it. MEAS (`Q4-stale-model-objects`): `m0_model`'s `objects` array still contains `c1`'s id after the move. MEAS (`Q4-LModel-objects-getter`): the L-proxy getter consumers actually call (`LPointerTargetable.fromPointer(m1Id).objects`) agrees — `c1` is listed by name alongside the genuine roots (`["p1","s1","p3","sRaceA","sRaceB","c1"]`).
- MEAS (`Q4-conformance-silent`): `validateConformance(m1, mm)` on this state raises 1 violation, and it is the pre-existing `lead` overfill from §5.3 — filtering for anything naming `c1`'s id returns empty. `ConformanceValidator.ts`'s object loop (`:35, :50-52`) has no "object reachable as both a root and a containment target" check, so the stale entry produces zero signal there.
- This is a **framework gap in reparenting-via-reference-set**, not something J4 introduces — but J4's "Apply" is the first consumer-facing, routine path that will create-then-contain in one gesture, every time a proposal nests a new element. Recommended: J4 either prunes the stale `model.objects` entry itself right after a containment `set` it just ran (it already controls the sequence and knows the ids), or this is flagged as a core ticket against `get_setValueAtPosition`/`model.objects` maintenance, scoped outside J4's own diff.
- Not measured (declared, not closed): whether the developer's EditorV2 canvas, if opened after this state, draws `c1` as a stray root vertex alongside the (correct) nested rendering inside `s1`. This touches `useJjomSync.ts`/canvas rendering (§3.1 critical zone) and this lane did not open an editor (doing so would also have flipped `userHasInteracted`, contaminating §5.1's Arm A reading, which ran first in the same session). Recommended: J4 or a follow-up measures this specifically if/when it touches the sync layer, with its own Layer Impact Report.

### 5.5 Q5 — failed containment `set`

- MEAS (`Q5-set-refused`): `set totallyWrongOwnerName.competencies = c2` → `{success: false, errors: [{code: 'INSTANCE_NOT_FOUND', message: "No instance named 'totallyWrongOwnerName' in 'm0_model'"}]}` — refused before any write (`resolveInstanceHandle` on the target runs first, `instance.ts:644-667`).
- MEAS (`Q5-orphan-unchanged`): `c2.father` is still `m0_model` (`className: 'DModel'`) — exactly where `create` left it, untouched by the failed `set`.
- Per R3 (`docs/discovery/discovery_2026-10-01_157_r3_rootable_types.md`), the Configurator's type bar only lists `topLevelTypes` (`Scenario`, `Person` in this fixture) — `Competency` has no entry at all, so `c2` is invisible to the consumer regardless of where it sits, unless nested under a Scenario the consumer can navigate to. A failed proposal step therefore leaves debris that is real (in the store) but not fruitore-visible through the Configurator as it stands.
- Recommended: J4 can honestly promise "a refused step leaves no partial write" (true). It should not promise "the fruitore can see and clean up the leftover via the Configurator" — they structurally cannot, for a non-top-level type. If a multi-step proposal can partially fail (step 2 of 3 refused), J4 needs its own accounting of what it already applied, independent of what the Configurator happens to expose.

### 5.6 Q6 — Configurator reactivity + instance selection

- `ConfiguratorTab.tsx:66`: `const idlookup = useSelector((s: DState) => s.idlookup);`; `:145-150`: `instances` is a `useMemo` keyed on `[idlookup, typeModelIds, selectedTypeId]`.
- MEAS (`Q6-live-refresh`): with the Configurator page mounted and `Scenario` selected (via a direct `CONFIGURATOR_SELECT_TYPE` dispatch, no UI click needed), `.configurator__instances li` went from 3 to 4 rows immediately after a JjScript `create instance of Scenario "s_new"` — no `page.reload`, no click. Confirms the live-refresh hypothesis without any code change.
- `events/registry.ts:121-128`, full `EnvGenEvents` enumeration (MEAS `Q6-no-instance-select-event`): `CONFIG_CHANGED`, `OPEN_WIZARD`, `CONFIGURATOR_SELECT_TYPE`, `CONFIGURATOR_TYPE_CHANGED` — no instance-level event. `selectedInstanceId` (`ConfiguratorTab.tsx:68`) is local `useState`, set only by the `<li onClick>` handler (`:412`) — nothing external can move it today.
- Recommended: add `CONFIGURATOR_SELECT_INSTANCE` (detail `{typeId, instanceId}`) to `EnvGenEvents`, dispatched by J4 after "Apply", consumed by a new `useEffect` in `ConfiguratorTab.tsx` mirroring the existing `CONFIGURATOR_SELECT_TYPE` listener (`:114-122`) to also call `setSelectedInstanceId`. Additive, no existing identifier renamed, not a §3.1 file — ordinary scope for J4 itself.

## 6. Dependencies and risks

- Everything in §5.1-5.3 was measured through `JjScriptService.execute`, the exact function Jodie's chat path calls (`ChatMessages.tsx:437`) — not a lower-level command executor call. A change to that call site (unlikely, but) would need this report re-verified.
- §5.1's "2 presses" and §5.3's race window are timing-dependent (`U.UpdatingTimer`, the merge tolerance, the `setTimeout(0)` dispatch) — re-measure if J4 changes anything in `redux/action/action.ts` or the reducer's merge logic; the qualitative findings (gate exists; race exists) are robust, the exact counts are this machine's.
- §5.4's stale `model.objects` entry is a **read-only** observation; this lane made no attempt to fix it, and fixing it is explicitly out of this lane's scope (D-layer/L-proxy write path, §3.1-adjacent).
- The fixture's `Competency` is composed only by `Scenario.competencies`; a class composed by more than one reference, or a reference with `lowerBound > 0`, was not measured and could interact differently with the stale-root finding.

## 7. Open questions for J4 (one line each, `Recommended:` per P16)

1. Does J4 raise `U.userHasInteracted` on its own "Apply" gesture, or build its own undo instead of relying on Ctrl+Z? Recommended: build its own undo (§5.1, option 3) — no critical-zone touch, and D5 already points this way.
2. Does J4's "Apply" set `U.isProjectModified = true` itself? Recommended: yes, one line, same pattern as `createAdapter.ts:547`.
3. Does the J4 executor rewrite for G4 also fix the same-reference-no-gap data-loss race (§5.3), or ship G4's replace-semantics fix alone and leave the race for later? Recommended: fix both together — same code path, same root cause (synchronous re-read vs. deferred dispatch).
4. Who owns pruning the stale `model.objects` entry after a JjScript containment `set` (§5.4) — J4 itself, post-apply, or a core ticket against `get_setValueAtPosition`? Recommended: J4 prunes it itself in the apply sequence it already controls; file a core ticket only if J4 judges that out of its own scope.
5. Should `CONFIGURATOR_SELECT_INSTANCE` be added now (§5.6) so "Apply" can land the fruitore on the result? Recommended: yes — small, additive, outside the critical zone.
