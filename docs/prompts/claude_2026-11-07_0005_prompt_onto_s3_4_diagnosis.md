# Ontological instantiation, undo groups L3b: where the extra undo entry of S3-4 comes from, and the probe setup fix

Prompt-ID: P-2026-11-07-0005
Chat: C-2026-10-25-2159
Front: instance-of
Lane: discovery (read-only on product code; one probe setup fix)
Status: eseguito
Request: none (adopts the Recommended answer of P-2026-11-06-2340, RC-21, Alfonso away under /lane auto)
Depends: P-2026-11-06-2340
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3a`, branch `oi-s3a`, its tip this prompt's `docs:` commit, whose parent is `6b52b905d`
(merge of `oi-s2u` into `oi-s3a`). Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with
`Outcome: blocked`. Model and tier: heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-07-0005 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 75 minutes.

- **No product code.** The only code edits allowed are the probe setup line of step 1. A fix of the extra entry is not
  this lane's work: report it with evidence and a recommendation.
- One probe run per call, `uptime` beside it; before a probe wait for the 1-minute load under 20 (one `uptime` per call,
  never a sleep over 60 s). Probe assets under `/tmp/P-2026-11-07-0005/`, never in the repo.
- Short tool output; grep and windows of at most 80 lines; never `reducer.ts` or `EditorV2.tsx` whole.
- No push, no merge. Commit subjects at most 72 characters, `Model:` trailer.

## Background

L3 (P-2026-11-06-2340) merged `oi-s2u` into `oi-s3a` as `6b52b905d`; gates green, `onto-s2-instantiate.ts` 21/21.
`onto-s3a-slot-problems.ts` on the default export gave 7/8: **S3-4 FAIL**
`{"undo":[4,6,5],"created":12,"stillThere":[],"missingBackMs":22}`. «Sync slots» from the problem overlay adds two
entries: the top one is the sync and is exact; one more, below it, holds nothing the sync created and appears after the
click on the problem dot. From the node menu (S3-5) there is one entry. S3-4 passed at `329bda77e` on 2026-10-21. A
ticket of 2026-10-21 already noted an undo entry with nothing created after a problem-dot click (M4 run). On the
`uml-s3b` export the probe aborted in setup: that project opens on the metamodel tab, where the viewpoint button is
disabled (`Toolbar.tsx:1085`), and the probe only switches tabs when the button is missing (`onto-s3a-slot-problems.ts:162`).
Detail: `~/.jjodel-lanes/P-2026-11-06-2340/closing.md`.

## COSA

1. Probe setup: in `onto-s3a-slot-problems.ts` (and in `onto-s3b-ghost-rows.ts` or `onto-s2-instantiate.ts` only if the
   same check exists there), switch to the model tab when no **enabled** viewpoint button is visible
   (`:visible:not([disabled])`), not only when it is missing. No other change to any probe. `chore(probe)` commit.
2. Run `onto-s3a-slot-problems.ts` on `uml-s3b` (`UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`).
   Record every check.
3. Diagnosis of the extra entry. Capture, around the problem-dot click and the overlay's «Sync slots», the undo stack
   length and the delta of each new entry (which object ids and which fields it touches, which action type wrote it),
   by an instrumented probe run with a temporary local hook that is never committed (or the dev globals the app already
   exposes). Do it on this branch and on `329bda77e` (a detached worktree `~/jjodel-w-oi-s3a-old`, `git worktree add
   --detach`, with the `node_modules` symlink of P14; removed at the end of the lane). Answer: what writes the entry;
   why it was folded or absent at `329bda77e` (the old S2u group, its join gate on `userHasInteracted`, or the old
   merge-into-entry rule); whether the trunk alone shows it (one run of the same capture on `~/jjodel-release`,
   read-only, if the overlay exists there; otherwise say so).
4. Recommend a fix with its file list and its layer, and say whether it touches `reducer.ts` (core) or a CLAUDE.md 3.2
   file. Do not implement it.
5. Report `docs/discovery/discovery_2026-11-07_onto_s3_4_extra_undo_entry.md` (objective, hypotheses with verdicts,
   files read, the captured deltas, the recommendation, «Decisions awaiting Alfonso»). One `docs:` commit. Remove the
   detached worktree.

## DOVE

`frontend/scripts/probe/onto-s3a-slot-problems.ts` (setup check only; the two sibling probes only for the same check),
`docs/discovery/discovery_2026-11-07_onto_s3_4_extra_undo_entry.md`. Outside the repo: `/tmp/P-2026-11-07-0005/`,
`~/jjodel-w-oi-s3a-old` (temporary).

## HARD STOP

After the report commit, with `Outcome: done`, a clean tree and the temporary worktree removed.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-11-06-2340/closing.md`; `docs/discovery/discovery_2026-11-06_onto_undo_groups_reconcile.md`
(branch `oi-undo-discovery`, §2 G6, G12, G14); `docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md`;
`docs/log-inbox/instance-of.md` (ticket of 2026-10-21 on the problem-dot click).
