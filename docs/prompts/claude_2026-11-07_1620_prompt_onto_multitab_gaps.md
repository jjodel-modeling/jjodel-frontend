# Ontological instantiation on the multi-tab trunk: problem producer per mount, placement by the tab's layout key

Prompt-ID: P-2026-11-07-1620
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (`editor-v2/problems/` is in the critical-zone table of CLAUDE.md 3.1; two small code changes)
Status: da eseguire
Request: none (follows P-2026-11-07-1517, Alfonso away from the decision under /lane auto; chat's choice, see below)
Depends: P-2026-11-07-1517
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3b`, branch `oi-s3b`, its tip this prompt's `docs:` commit, whose parent is `cbc392c69`
(merge: oi-s3b takes the trunk at `4834b0edb`, tag 3.2.0). Check `pwd`, the branch, `git log -2` and a clean `git
status`; otherwise stop with `Outcome: blocked`. Model and tier: heavy, effort `xhigh`. Alfonso's dev server runs from
this worktree on port 3005: do not stop it; probe ports outside 3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-07-1620 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 75 minutes.

- One test or probe run per call; `uptime` beside each probe; before a probe wait for the 1-minute load under 20 (one
  `uptime` per call, never a sleep over 60 s). Assets under `/tmp`.
- Code and docs in separate commits (RC-13). Subjects at most 72 characters, `Model:` trailer.
- No push, no merge, no reset. No edit to `reducer.ts` or a CLAUDE.md 3.2 file.

## Background (P-2026-11-07-1517, `~/.jjodel-lanes/P-2026-11-07-1517/`)

The trunk-into-branch merge `cbc392c69` is correct: gates green (typecheck, vitest 14,912 passed, hook tests 967, build,
check:docs), the `undoGroup.test.ts` union byte-identical to both sides, the reducer keeps the R-MT-20 `noUndo` skip and
the (c) tail, and a `noUndo` write neither clears nor consumes the tail. Only `check:addonly` fails, on an entry of
`docs/log-inbox/hw-notation.md` rewritten by trunk commit `3f7f6f7f4` without a `Log-Repair:` trailer: the gate compares
a merge with its first parent, so any merge that takes the trunk past `3f7f6f7f4` inherits it. **The chat keeps
`cbc392c69` and declares the inherited rewrite** (the repair belongs to the trunk's owner of that log, not to this
front; the merge of `oi-s3b` into the trunk has the trunk as first parent and does not see it).

The lane found two semantic gaps the merge creates with the multi-tab front:
1. `problems/InstantiationProblemSync.tsx:125-130` clears its problems on every unmount; with two tabs on one model,
   closing one removes the other tab's badges. The trunk solved this for the other producers with
   `acquireProducerMount` (`registry.ts`; `SimCheckProblemSync.tsx:69`, `ConformanceProblemSync.tsx:127`, multi-tab
   L4b).
2. `runInstantiate` (`EditorV2.tsx:3247`) places new instances under `getActiveLayoutKey()`, the root's key, not the
   tab's key that the trunk's L3 introduced (`tabLayoutKey()`, `EditorV2.tsx:600-601`).

## COSA

1. First reply: a short Layer Impact Report for the two changes.
2. `InstantiationProblemSync.tsx`: the unmount cleanup goes through `acquireProducerMount(INSTANTIATION_KIND, modelid,
   …)` exactly as `SimCheckProblemSync.tsx` does. Nothing else in the file.
3. `EditorV2.tsx`: in `runInstantiate` only, the active key is the tab's (`tabLayoutKey()`), so the click placement and
   the "centre of the view" fallback both follow the tab's own layout. Check whether `instantiate.ts`'s `placeAt`
   contract needs nothing else; if it does, stop with `Outcome: question`.
4. Tests that fail without each change: for 1, a unit test (two mounts of the producer on one model, unmount one, the
   problems stay; unmount both, they go), following the trunk's L4b tests of the other producers; for 2, a unit test if
   `runInstantiate`'s key choice can be isolated, otherwise a probe check (two tabs on one model under different
   viewpoints, instantiate from the second: the new vertex lands at the click in that tab's layout). Gates: typecheck 0,
   the new tests, `instantiate.test.ts`, `undoGroup.test.ts`, the problems tests green, `npm run build` 0. Code commit.
5. Probes, one per call: `onto-s2-instantiate.ts`, `onto-s3a-slot-problems.ts` (default export), `onto-s3b-ghost-rows.ts`
   (`uml-s3b`), and the trunk's multi-tab probe that covers the problem producers across tabs (find it under
   `scripts/probe/`, name it in the report).
6. Mutants, each red and reverted: the producer back to the plain unmount clear; the root key back in `runInstantiate`.
   To `~/.jjodel-lanes/P-2026-11-07-1620/bench.txt`.
7. Docs commit: one entry in `docs/log-inbox/instance-of.md` covering P-2026-11-07-1517 and this lane, with
   `**Notes**` stating that `cbc392c69` inherits the `check:addonly` failure from trunk commit `3f7f6f7f4`
   (`hw-notation.md`, entry of 2026-11-05) and a proposed ticket for the owner of that log (a `Log-Repair:` trailer or a
   `KNOWN_REPAIRS` entry in `check-addonly.ts`); flip `Status:` of P-2026-11-07-1517 and of this prompt.
   `check:docs` green.

## DOVE

`frontend/src/components/editor-v2/problems/InstantiationProblemSync.tsx`, `frontend/src/components/editor-v2/EditorV2.tsx`
(`runInstantiate` only), one or two new test files under the matching `__tests__/`, a probe check only if step 4 needs
it, `docs/log-inbox/instance-of.md`, the two `Status:` lines.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier with `Outcome: question` as stated, or if a
multi-tab probe turns red.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-07-1517/` (result, closing notes); `docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md`;
`docs/decisions.md` R-MT-*, R-OI-*; CLAUDE.md §3.1.
