# Prompt: merge sim-gate into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-1200
Chat: C-2026-09-28-1936
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-09-29 · lane merge · 131701a16 · verifica visiva passata 2026-09-29 (lane probe on 3050: gate 8/8, Jjodie (216,903) 48x48 and chip (281,911) on y 927; four scenes vs 09-29c identical except dialog focus on open and 2.1 Undo; demo script re-measured; old probe kit superseded by probe-kit/simgate)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-1200 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `dc150224f`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-gate` into the trunk with one merge commit, `--no-ff`, of the explicit sha `accc6f182`, in the shape of `faa3cd66f` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `cd2b5fec9`. The branch carries, on top of the base, 5 commits:

- `accc6f182` docs: R-SIM-97, the demo script re-measured, entry and tickets (P-2026-09-29-1106)
- `ea326ef6a` style(sim): Jjodie 48 px in editor tabs, the chip on its centre line (P-2026-09-29-1106)
- `381353f75` feat(sim): Semantic type in the metamodel's Properties; the pill gated (P-2026-09-29-1106)
- `9f32ed9e0` feat(sim): the Semantic type predicate and the pill's gate (P-2026-09-29-1106)
- `40eea9520` docs(prompts): P-2026-09-29-1106 sim gate phase 2

The trunk carries, since the base, 7 commits:

- `dc150224f` docs: Status flip and log entry for the petri-notation-l2b merge (P-2026-09-29-1103)
- `faa3cd66f` merge: petri-notation-l2b into alfonso-frontend-jjtl (P-2026-09-29-1103)
- `bdb3f2874` docs: add prompt P-2026-09-29-1103, merge petri-notation-l2b into alfonso-frontend-jjtl
- `59b4245c0` docs(views): R-VP-16, log entry and Status of the revised Petri lane (P-2026-09-29-1021)
- `7a254a52f` feat(views): Petri notation revised, centred names, bar, Manhattan (P-2026-09-29-1021)
- `449c583b6` feat(ir): the bar form, a thin fixed box for the Petri transition (P-2026-09-29-1021)
- `22efe0670` docs(prompts): P-2026-09-29-1021 petri notation lane 2 revised

Measured by `lane-run merge` at 2026-09-29 12:00, trunk at `dc150224f`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl accc6f182`: zero conflicts.
- Files changed since the base: 10 on the branch side, 12 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only cd2b5fec9 accc6f182 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_1106_prompt_sim_gate_p2.md` (eseguito 2026-09-29 · lane sim-gate · 9f32ed9e0, 381353f75, ea326ef6a · non fuso: hard-stop, lane probe on 3050 (light), four scenes and the gate, crop in docs/discovery/harness/_tmp_simgate_*.png (gitignored), R-SIM-97 nel commit docs, verifica visiva alla chat).
- `git worktree list`: `sim-gate` in `/Users/alfonso/jjodel-w-simgate2`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-1200/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `accc6f182` is the tip of `sim-gate`; the prompt files of the branch read `Status: eseguito` at `accc6f182`; `git worktree list` shows `sim-gate` only in `/Users/alfonso/jjodel-w-simgate2`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl accc6f182` (measured above: zero conflicts). `git diff --name-only cd2b5fec9 accc6f182 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only cd2b5fec9 alfonso-frontend-jjtl` with `git diff --name-only cd2b5fec9 accc6f182` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-97` (branch), `R-VP-16` (trunk); control: `- **R-VP-17**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: the pill behind Advanced and a Semantic type, Jjodie aligned, R-SIM-97 (P-2026-09-29-1106)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — ticket: the Problems producer does not follow the pill's gate` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — ticket: an undo does not restore a key removed from a state bag` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — feat(views): the Petri notation revised, no token marks, centred names, bar, Manhattan (P-2026-09-29-1021)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — ticket: a `bar` view in the Symbol Editor reads «Custom» and has no Shape option` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-29 — merge: petri-notation-l2b into alfonso-frontend-jjtl (P-2026-09-29-1103)` once (trunk).
4. `git merge --no-ff --no-commit accc6f182`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-gate into alfonso-frontend-jjtl (P-2026-09-29-1200)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `accc6f182` in `/Users/alfonso/jjodel-w-simgate2`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard dc150224f` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-gate merge (P-2026-09-29-1200)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-simgate2`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
