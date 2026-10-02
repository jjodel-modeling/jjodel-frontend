# Prompt: merge sim-state-disc into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-03-0032
Chat: C-2026-10-02-2340
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-03-0032 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `7c9ae4e0d`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-state-disc` into the trunk with one merge commit, `--no-ff`, of the explicit sha `fece79bc3`, in the shape of `e2e4fbc35` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `872d0abe8`. The branch carries, on top of the base, 3 commits:

- `fece79bc3` docs: R-SIM-109, merge before the MODELS demo and the discovery recommendations adopted (P-2026-10-02-2340)
- `ebf0d4f10` docs: discovery of the simulator's state UI (P-2026-10-02-2340)
- `60b60c31d` docs: add prompt P-2026-10-02-2340 and rows R-SIM-102..109, simulator state UI

The trunk carries, since the base, 10 commits:

- `7c9ae4e0d` docs: merge-gate ticket in the ticket entry format
- `52a06669f` docs: Status of P-2026-10-02-2315 (superseded by 2330) and merge-gate ticket on the worktree node_modules link
- `3d9a1702b` docs: Status flip and log entry for the vp-glyph-nocolor merge (P-2026-10-02-2330)
- `e2e4fbc35` merge: vp-glyph-nocolor into alfonso-frontend-jjtl (P-2026-10-02-2330)
- `99520574e` docs: add prompt P-2026-10-02-2330, merge vp-glyph-nocolor into alfonso-frontend-jjtl
- `8ef9e3c48` docs: add prompt P-2026-10-02-2315, merge vp-glyph-nocolor into alfonso-frontend-jjtl
- `e6bbc9829` docs: report addendum, R-VP-50, log entry, ticket, Status (P-2026-10-02-2045)
- `00b16d998` fix(views): notation glyphs keep their colours under Color by metaclass (P-2026-10-02-2045)
- `353fa49b4` docs: discovery, notation glyphs out of Color by metaclass (P-2026-10-02-2045)
- `c14dc0c67` docs: add prompt P-2026-10-02-2045, notation glyphs out of Color by metaclass

Measured by `lane-run merge` at 2026-10-03 00:32, trunk at `7c9ae4e0d`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl fece79bc3`: zero conflicts.
- Files changed since the base: 4 on the branch side, 12 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only 872d0abe8 fece79bc3 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-02_2340_prompt_discovery_sim_state_ui.md` (eseguito 2026-10-02 · lane discovery sim-state-disc · report docs/discovery/discovery_2026-10-02_sim_state_ui.md, measured on 60b60c31d · hard-stop, one decision for Alfonso (the MODELS demo) and seven questions with Recommended in §0, three Phase 2 lanes in §8).
- `git worktree list`: `sim-state-disc` in `/Users/alfonso/jjodel-w-simstate`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-03-0032/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `fece79bc3` is the tip of `sim-state-disc`; the prompt files of the branch read `Status: eseguito` at `fece79bc3`; `git worktree list` shows `sim-state-disc` only in `/Users/alfonso/jjodel-w-simstate`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl fece79bc3` (measured above: zero conflicts). `git diff --name-only 872d0abe8 fece79bc3 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 872d0abe8 alfonso-frontend-jjtl` with `git diff --name-only 872d0abe8 fece79bc3` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-102` (branch), `R-SIM-103` (branch), `R-SIM-104` (branch), `R-SIM-105` (branch), `R-SIM-106` (branch), `R-SIM-107` (branch), `R-SIM-108` (branch), `R-SIM-109` (branch), `R-VP-50` (trunk); control: `- **R-VP-51**` none.
   - `docs/decisions.md`: the heading `### Decisions 2026-10-02: the simulator's state UI (R-SIM-102..109)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-02 — discovery: the simulator's state UI, R-SIM-102..107 and 109 (P-2026-10-02-2340)` once (branch).
   - `docs/log-inbox/merge-gate.md`: the heading `## 2026-10-02 — ticket: a lane removes the node_modules symlink the direct merge needs later` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — fix(views): notation glyphs out of «Color by metaclass» (P-2026-10-02-2045)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: name-ink marks outside a coloured node take its text colour` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: vp-glyph-nocolor into alfonso-frontend-jjtl (P-2026-10-02-2330)` once (trunk).
4. `git merge --no-ff --no-commit fece79bc3`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-state-disc into alfonso-frontend-jjtl (P-2026-10-03-0032)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `fece79bc3` in `/Users/alfonso/jjodel-w-simstate`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 7c9ae4e0d` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-state-disc merge (P-2026-10-03-0032)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-simstate`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
