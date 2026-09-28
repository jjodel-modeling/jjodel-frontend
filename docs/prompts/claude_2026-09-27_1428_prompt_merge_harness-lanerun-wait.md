# Prompt: merge harness-lanerun-wait into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-27-1428
Chat: C-2026-09-27-1428
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-09-27 · lane merge · 6500fc4d9 · verifica visiva passata 2026-09-27 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1428 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `7256eb383`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `harness-lanerun-wait` into the trunk with one merge commit, `--no-ff`, of the explicit sha `c56c4599d`, in the shape of `23c7a19dc` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `097696d88`. The branch carries, on top of the base, 3 commits:

- `c56c4599d` docs: close the lane-run wait and Outcome tickets (P-2026-09-27-1225)
- `e3c95ce23` fix(harness): lane-run Outcome while running, wait exit code (P-2026-09-27-1225)
- `5e37e6027` docs: add prompt P-2026-09-27-1225, lane-run Outcome while running and wait exit code

The trunk carries, since the base, 12 commits:

- `7256eb383` docs: session checkpoint 2026-09-27_3, R3 and polish on the trunk (C-2026-09-27-1140)
- `fda626569` docs: Status flip for the sim-polish-g13-g14 merge (P-2026-09-27-1409)
- `23c7a19dc` merge: sim-polish-g13-g14 into alfonso-frontend-jjtl (P-2026-09-27-1409)
- `6a2a5ae96` docs: add prompt P-2026-09-27-1409, merge sim-polish-g13-g14 into alfonso-frontend-jjtl
- `836c6851d` docs: close the G13 and G14 polish (P-2026-09-27-1310)
- `5739b950f` fix(sim): choice header ε, Profile select width (P-2026-09-27-1310)
- `145e916c6` docs: add prompt P-2026-09-27-1310, G13 and G14 polish
- `72177a866` docs: Status flip for the sim-r3-face merge (P-2026-09-27-1216)
- `342707779` merge: sim-r3-face into alfonso-frontend-jjtl (P-2026-09-27-1216)
- `cb27e9060` docs: close R3, the M1 face for the audience (P-2026-09-27-1145)
- `766b9643c` feat(sim): marking and σ line, choice list above the buttons (P-2026-09-27-1145)
- `b9528c991` docs: add prompt P-2026-09-27-1145, R3 the M1 face for the audience

Measured by `lane-run merge` at 2026-09-27 14:28, trunk at `7256eb383`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c56c4599d`: zero conflicts.
- Files changed since the base: 5 on the branch side, 10 on the trunk side; on both sides: none.
- `git diff --name-only 097696d88 c56c4599d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: `docs/PROTOCOL.md`.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-27_1225_prompt_harness_lanerun_wait_and_outcome.md` (eseguito 2026-09-27 · lane harness-lanerun-wait · e3c95ce23).
- `git worktree list`: `harness-lanerun-wait` in `/Users/alfonso/jjodel-icons`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- governance files changed on the branch: `docs/PROTOCOL.md`

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `c56c4599d` is the tip of `harness-lanerun-wait`; the prompt files of the branch read `Status: eseguito` at `c56c4599d`; `git worktree list` shows `harness-lanerun-wait` only in `/Users/alfonso/jjodel-icons`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c56c4599d` (measured above: zero conflicts). `git diff --name-only 097696d88 c56c4599d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 097696d88 alfonso-frontend-jjtl` with `git diff --name-only 097696d88 c56c4599d` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-27 — fix: lane-run hides the Outcome of a running lane, wait exits 0 at the deadline (P-2026-09-27-1225)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: the M1 face for the audience, lane R3 (P-2026-09-27-1145)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — fix: the ε of the choice header, the Profile select fits its options (P-2026-09-27-1310)` once (trunk).
4. `git merge --no-ff --no-commit c56c4599d`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: harness-lanerun-wait into alfonso-frontend-jjtl (P-2026-09-27-1428)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `c56c4599d` in `/Users/alfonso/jjodel-icons`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip for the harness-lanerun-wait merge (P-2026-09-27-1428)`. No log entry for the merge. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-icons`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
