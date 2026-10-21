# Core: LModel.get_name without the $name scan, and duplicate names in O(n) (fixes 4 and 2 of round 2)

Prompt-ID: P-2026-10-21-0030
Chat: C-2026-10-20-0839
Front: maintenance
Lane: full (core: `src/model/`; Phase 1 waived by Alfonso)
Status: eseguito 2026-10-21 · lane core-name-scans · b16e1ad57 · verifica visiva della chat dopo il merge
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: P-2026-10-20-2305
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Core go-ahead: Alfonso, 2026-10-21 00:13, «Ok», answering the chat's question «Mi dai l'ok a toccare il core per 4
e 2, e la critical zone per 1?» after the report
`docs/discovery/discovery_2026-10-20_large_model_slowness_round2.md` (§5). It covers fixes 4 and 2 of that table,
only in the files of the DOVE. The discovery is that report: there is no new Phase 1. A Layer Impact Report is the
first step all the same (core, CLAUDE.md §3.2 template).

Worktree: `~/jjodel-w-corenames`, branch `core-name-scans`, cut from `alfonso-frontend-jjtl` at the commit that adds
this prompt. Model and tier: heavy, as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-0030 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Every gate runs in the foreground (P16). No push, no merge. Watch the AM-8 ceiling (RC-51): write the handoff before
the soft ceiling.

## COSA

Read the report §3.4, §3.6, §4 and §5 first; the numbers below come from it.

Fix 4. `LModel` has no `get_name` and inherits `LPointerTargetable.get_name` (`joiner/classes.ts:2220-2226`), which
reads `proxyObject.$name`; on an `LModel` that falls into `_defaultGetterM1` (`LModelElement.tsx:5313`), which scans
`get_allSubObjects` reading every object's name (:5331-5332), and the result is then discarded because an L proxy
reports the D className, so the getter always ends at `c.data.name || c.data.className`. Add
`LModel.get_name(c) { return c.data.name || c.data.className; }` (or the M1/M2 equivalent the class hierarchy needs:
check `_defaultGetterM2` too and state what you chose). Expected: `fullname` from 32 ms with 409 name reads to about
0.1 ms with 2; opening References on the Activity from 2.6 s of long tasks to none.

Fix 2. `detectDuplicateNames` (`src/model/logicWrapper/nameUniqueness.ts:~300-310`) compares each object with its
siblings by `filter` (29,996 name reads per rename commit). Group the siblings by name once (a `Map` per sibling
set), same result. Expected: the rename commit from 2.0 s to about 0.8 s in dev. The validation badges and
`UniquenessProblemSync.tsx` must keep their behaviour and signature (the 2026-08-31 missed-notification fix).

## DOVE

1. `docs/lir/lir_2026-10-21_core_name_scans.md` (LIR, committed first, docs only).
2. `frontend/src/model/logicWrapper/LModelElement.tsx`: the new getter only.
3. `frontend/src/model/logicWrapper/nameUniqueness.ts`: `detectDuplicateNames` only, signature unchanged.
4. Tests beside the existing ones for these modules (grep first; if `LModelElement.tsx` cannot be loaded by vitest,
   test the name logic through what can be loaded and cover the rest with the probe, recording the gap, CLAUDE.md §5).
5. Closure: `docs/log-inbox/maintenance.md` and this prompt's Status line.

Nothing else: no change to `proxy.ts`, `classes.ts`, `_defaultGetterM1`, `set_name`, any interface or any caller.

## COME

1. LIR, docs commit. Layers: L-layer getters only; no D-layer, JjOM, sync or persistence change; name-based lookups
   `model.$foo` go through `_defaultGetter` and must stay untouched (say how you checked).
2. Baseline gates: `npm run typecheck` (0, RC-48), the full vitest count, `npm run build`, through
   `node scripts/run-quiet.mjs` from `frontend/`.
3. Tests red first, executing the code (P11): `model.name` returns the same value as before for a named and an
   unnamed model, without reading the objects' names; `fullname` of a nested object unchanged; duplicate detection
   returns the same collisions on a fixture with duplicates in two sibling sets and none in a third, including the
   empty-name and case rules the current code applies (read them first).
4. Mutation bench (CLAUDE.md §5): (m1) the getter falls back to the scan; (m2) the grouping keys ignore the sibling
   set; (m3) the grouping drops the second of two duplicates. Each killed by a named test.
5. Probe acceptance with `frontend/scripts/probe/large-model-click-profile.ts` on the fixture
   `~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`, dev, three runs, medians before
   and after: `CLICK_STEPS=commit` (target ≤ 0.9 s), `CLICK_OPEN_REFS=1` (no long task above 200 ms), `fullname`
   name reads ≤ 4, and click Activity and gateway not worse.
6. One `fix(model):` commit (code and tests), measurements and mutation table in the body, `git add` by path,
   `Model:` trailer. Closure in one docs commit (RC-17). `Outcome: done`. The visual check is the chat's after the
   merge.

## Rollback

`pre-core-name-scans-2026-10-21` on the trunk before this prompt; `lane-run merge` tags again before the merge;
undo with `git revert -m 1 <merge sha>`.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-20_large_model_slowness_round2.md`; `frontend/src/model/CLAUDE.md` §3.12 and §3.13;
CLAUDE.md §3.2 (LIR), §5 (tests and mutation bench).
