# Prompt: merge the event-from-trigger lane into the trunk

Prompt-ID: P-2026-09-25-1615
Chat: C-2026-09-25-1500
Lane: full (more than 3 files)
Status: da eseguire

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop. Do not touch `~/jjodel`, `~/jjodel-open`, `~/jjodel-sim`, `~/jjodel-gate`, `~/jjodel-harness`. `~/jjodel-events` is read-only here.

Single phase, with one hard stop (the visual check). A merge, not a feature: no source file is edited by hand.

**This file lives on `sim-event-trigger`, not on the trunk.** It reaches the trunk with the merge. It was committed on the branch on purpose: chat `C-2026-09-25-1353` has `P-2026-09-25-1610` (merge of the hash-change fix) pending in this same tree, and its precondition refuses a trunk tip other than `79175e94c` or `332c88984`. Two merges never run at once in this tree. **Run this prompt only after 1610 is closed**: its Status on the trunk reads `eseguito`, `git status` is empty, no merge in progress. If 1610 is not closed, stop and say so; do not wait in a loop.

## COSA

Branch `sim-event-trigger` (tip: the commit that adds this file, on top of `51ccf1e6a`), closed by `P-2026-09-25-1500` with visual check passed on 3004. It implements R-SIM-38 (`docs/decisions.md`, already on the trunk at `79175e94c`): the event metaclass is derived from the type of the Trigger reference at every read of the bag, `simEvent` is no longer written, the Events group of the M2 face has Trigger, a read-only Event class row and Event identifier.

Branch commits over `79175e94c`: `623b330d4` (discovery report), `332f8d03c` (feat), `470149a51` (refactor, comment only), `51ccf1e6a` (closure: Status, inbox entry, three tickets), and the commit that adds this prompt.

## COME

1. Preconditions, each a hard stop if false: 1610's Status on the trunk reads `eseguito`; `git status` empty in `~/jjodel-release` and in `~/jjodel-events`; `git rev-parse -q --verify MERGE_HEAD` empty; `git worktree list` shows `alfonso-frontend-jjtl` only in `~/jjodel-release` and `sim-event-trigger` only in `~/jjodel-events`; the tip of `sim-event-trigger` adds this file and its parent is `51ccf1e6a`. Record that tip sha as `<B>`; every later step uses `<B>`, never the branch name.
2. Re-measure both sides from the merge base (`git merge-base alfonso-frontend-jjtl <B>`, expected `79175e94c`): `git diff --name-only` each side, and `git merge-tree --write-tree --name-only alfonso-frontend-jjtl <B>`. Any conflict, or any file changed on both sides: stop and report before merging. Confirm with `git diff --name-only 79175e94c <B> -- CLAUDE.md AGENTS.md docs/PROTOCOL.md docs/decisions.md` that the branch changes no normative file (P15); if it does, stop.
3. Semantic probes (P14), read-only:
   - Inbox lint: overwrite `docs/log-inbox/simulation.md` here with `git show <B>:docs/log-inbox/simulation.md`, run `npm run check:docs` from `frontend/`, record, restore with `git show HEAD:docs/log-inbox/simulation.md`, confirm `git status` empty. A rejection: stop, report message and line.
   - Removed API: on the trunk tip, `command grep -rnw -e missingEventRoles frontend/src` must find hits only under `components/editor-v2/sim/` (the branch deletes it there). A hit elsewhere: stop.
   - The 1610 merge touched the open path; confirm that nothing under `components/editor-v2/sim/` or `model/simulation/` imports the files it changed (`command grep -rn` on the imports), so the two merges do not interact.
4. `git merge --no-ff <B>`. Subject: `merge: derive the event class from the Trigger reference (P-2026-09-25-1500)`. Body in the shape of the precedents (`f10352a7`): the shas of COSA; what the trunk gained since `79175e94c` (the 1610 merge and its prompts); the probe results; the behaviour change this merge brings into force (the event role is configured by Trigger alone; a `simEvent` already in a metamodel bag is ignored; a Trigger typed to a primitive gives no event role; the half-set warning is gone); `Model:` and `Co-Authored-By` trailers. Any conflict: `git merge --abort`, stop, report.
5. Gates on the merge commit, from `frontend/` (this tree has a permanent `node_modules` symlink: never remove it):
   - `npm run typecheck`: 14 errors, the §17 set by file and code.
   - `npm run typecheck:scripts`: exit 0.
   - `npx vitest run`: state the expected total before running: the trunk total after 1610 (from its closing report, or measured on the trunk tip before step 4) plus 4 (the branch goes from 4620 to 4624 over `79175e94c`: minus 5 `missingEventRoles`, plus the new tests). 0 failed, the same 9 files red at import.
   - `npm run build`: exit 0.
   - `npm run check:docs`: 4/4; report the telemetry lines.
   - `npm run check:agents`: green. `npm run check:scripts`: 0 hits in tracked files.
6. **Visual regression, hard stop.** Tell Alfonso to hard-refresh `http://localhost:3001/` (the trunk's server; if it is not running, say so and let him start it; do not restart it yourself) and check: (a) a healthy project opens and a hash change between two projects opens the second (the 1610 fix is below this merge); (b) on the StateMachine metamodel the Events group shows Trigger, Event class and Event identifier; (c) on a model of it, the event buttons fire as on 3004. Wait for his answer. On a failure, report and stop; do not revert without instruction.
7. After Alfonso's OK, one docs commit on the trunk: this prompt's Status flipped to `eseguito 2026-09-25 · lane merge · <merge sha> · verifica visiva passata 2026-09-25`, pathspec after `--`, subject `docs: Status flip for the event-from-trigger merge (P-2026-09-25-1615)`, `Model:` trailer. No log entry for the merge (precedents). The inbox entry and its three tickets stay for the next P13 fold.
8. Leave `~/jjodel-events` and `sim-event-trigger` in place: removing the worktree and the branch is Alfonso's call, not this lane's. Do not realign `simulation-engine`: `P-2026-09-25-1445` is running there.
9. Closing report, opening with `[P-2026-09-25-1615 · session <id>]`: `<B>`, merge sha, probe outputs, gate numbers, visual result, push state without pushing.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name instead of the sha, squash, rebase, `git worktree remove`, `git branch -d`, push.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P15; `docs/decisions.md` RC-13, RC-17, R-SIM-16, R-SIM-37, R-SIM-38.
- Merge precedents `f10352a7` and `docs/prompts/claude_2026-09-25_1247_prompt_merge_sim_step3.md`; the pending `docs/prompts/claude_2026-09-25_1610_prompt_merge_open_hash.md`.
- On `sim-event-trigger`: `docs/prompts/claude_2026-09-25_1500_prompt_sim_event_from_trigger.md`, `docs/discovery/discovery_2026-09-25_sim_event_from_trigger.md`, `docs/log-inbox/simulation.md`.
