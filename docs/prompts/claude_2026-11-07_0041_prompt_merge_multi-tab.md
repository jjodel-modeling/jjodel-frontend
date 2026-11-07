# Prompt: merge multi-tab into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-0041
Chat: C-2026-11-06-2333
Request: https://claude.ai/code/session_01DQt9R7EZZv9MmGKpjvzZWx (merge of multi-tab launched by chat C-2026-11-06-2333)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-07 · lane merge · 0d48b6eb0 · verifica visiva passata 2026-11-07 (docs-only merge: discovery report of the multi-tab front and the Status flips of its two prompts; no source change)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-0041 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `03be29abc`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `multi-tab` into the trunk with one merge commit, `--no-ff`, of the explicit sha `1ab4568ff`, in the shape of `a5cb8aafb` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `6fcf5d5df`. The branch carries, on top of the base, 11 commits:

- `1ab4568ff` docs: Status flips of the multi-tab discovery prompts (P-2026-11-07-0030)
- `177e95c9f` docs(discovery): multi-tab viewpoints, answer in brief (P-2026-11-07-0030)
- `702898171` docs(discovery): multi-tab viewpoints, risks, Q1..Q13, decisions (P-2026-11-07-0030)
- `125144806` docs(discovery): multi-tab viewpoints, lane plan (P-2026-11-07-0030)
- `f8f359ec4` docs(discovery): multi-tab viewpoints, persistence and probe (P-2026-11-07-0030)
- `44bc72549` docs(discovery): multi-tab viewpoints, state one per project (P-2026-11-07-0030)
- `6f1c2ab95` docs(discovery): multi-tab viewpoints, creations outside the canvas (P-2026-11-07-0030)
- `8168b608f` docs: continuation prompt P-2026-11-07-0030 for the multi-tab discovery
- `145c2b7c6` docs(discovery): multi-tab viewpoints, sync and critical zone (P-2026-11-06-2350)
- `db3b86541` docs(discovery): multi-tab viewpoints, tabs and instances (P-2026-11-06-2350)
- `721afa8c5` docs(discovery): multi-tab viewpoints, header and census (P-2026-11-06-2350)

The trunk carries, since the base, 37 commits:

- `03be29abc` docs: Status flip and log entry for the jjtl-builtin-errors merge (P-2026-11-07-0011)
- `a5cb8aafb` merge: textual-e-sync into alfonso-frontend-jjtl (P-2026-11-07-0017)
- `1afa6dfcd` docs: add prompt P-2026-11-07-0017, merge textual-e-sync into alfonso-frontend-jjtl
- `9a5a63048` merge: jjtl-builtin-errors into alfonso-frontend-jjtl (P-2026-11-07-0011)
- `59947fc70` docs: Status flip and log entry for the dcn-l21 merge (P-2026-11-06-2351)
- `ea57b6539` docs: add prompt P-2026-11-07-0011, merge jjtl-builtin-errors into alfonso-frontend-jjtl
- `a743c3f37` merge: dcn-l21 into alfonso-frontend-jjtl (P-2026-11-06-2351)
- `34035b3a0` docs: Status flip and log entry for the step E discovery (P-2026-11-06-2337)
- `65852b291` docs: Status flip and log entry for the textual-d1-comment-guard merge (P-2026-11-06-2326)
- `82a4e8626` docs: add prompt P-2026-11-06-2351, merge dcn-l21 into alfonso-frontend-jjtl
- `f0a90f80f` docs(codegen): step E discovery, lane plan, decisions, risks (P-2026-11-06-2337)
- `ee1be6797` docs(codegen): step E discovery, verification (P-2026-11-06-2337)
- `65e74b522` docs(codegen): step E discovery, critical zone (P-2026-11-06-2337)
- `5d7fa1fe4` docs(codegen): step E discovery, loops and timing (P-2026-11-06-2337)
- `79dcae642` docs(codegen): step E discovery, canvas to text (P-2026-11-06-2337)
- `87a699491` docs(codegen): step E discovery, text to canvas (P-2026-11-06-2337)
- `f9f4ea965` docs(codegen): step E discovery, T10 and scenario 2 (P-2026-11-06-2337)
- `a5283f565` docs(codegen): step E discovery, objective and files read (P-2026-11-06-2337)
- `25a63f03f` docs: log entry and Status flip for builtin errors (P-2026-11-06-2305)
- `77732b93d` docs: report on builtin errors and a failed run's write-back (P-2026-11-06-2305)
- `e1d7dc9a1` docs: add prompt P-2026-11-06-2337, step E discovery
- `8ef186680` docs(jjtl): SPEC §10, a failing builtin names the rule (P-2026-11-06-2305)
- `860597f15` fix(jjtl): a failing builtin names the rule and source element (P-2026-11-06-2305)
- `1e53fed0c` docs: add prompt P-2026-11-06-2305, builtin errors and failed write-back
- `37fc696f7` docs(dcn): L2.1 log entry and Status flip (P-2026-11-06-2300)
- `d51def3e7` feat(onto): featureSources in the binding, dormant slots in the closure (P-2026-11-06-2300)
- `12d1e16bb` docs(dcn): R-DCN-9..21 from discovery Q1..Q13, L2.1 prompt
- `e357a15fe` docs(dcn): Status flips of the foundations discovery (P-2026-11-06-2250)
- `7d3a33cbc` docs(dcn): foundations discovery, §7 decisions Q1..Q13 (P-2026-11-06-2250)
- `d635e43a1` docs(dcn): foundations discovery, §6 lane plan (P-2026-11-06-2250)
- `c80715205` docs(dcn): foundations discovery, §0 answer in brief (P-2026-11-06-2250)
- `a41c9078e` docs(dcn): discovery continuation prompt (P-2026-11-06-2250)
- `6ebd9d064` docs(dcn): foundations discovery, §4 self.in and §5 exporter (P-2026-11-06-2240)
- `4fb9bafab` docs(dcn): foundations discovery, §3 line citations (P-2026-11-06-2240)
- `5a90a9c1f` docs(dcn): foundations discovery, §3 second nucleus (P-2026-11-06-2240)
- `9af507690` docs(dcn): foundations discovery, §2 metamodel (P-2026-11-06-2240)
- `c35064743` docs(dcn): foundations discovery, §0-§1 dormant slots (P-2026-11-06-2240)

Measured by `lane-run merge` at 2026-11-07 00:41, trunk at `03be29abc`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 1ab4568ff`: zero conflicts.
- Files changed since the base: 3 on the branch side, 27 on the trunk side; on both sides: none.
- `git diff --name-only 6fcf5d5df 1ab4568ff -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-07_0030_prompt_multi_tab_viewpoints_discovery_cont.md` (eseguito 2026-11-07 · lane full · 177e95c9f).
- `git worktree list`: `multi-tab` in `/Users/alfonso/jjodel-w-multitab`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-07-0041/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `1ab4568ff` is the tip of `multi-tab`; the prompt files of the branch read `Status: eseguito` at `1ab4568ff`; `git worktree list` shows `multi-tab` only in `/Users/alfonso/jjodel-w-multitab`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 1ab4568ff` (measured above: zero conflicts). `git diff --name-only 6fcf5d5df 1ab4568ff -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 6fcf5d5df alfonso-frontend-jjtl` with `git diff --name-only 6fcf5d5df 1ab4568ff` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-DCN-9` (trunk), `R-DCN-10` (trunk), `R-DCN-11` (trunk), `R-DCN-12` (trunk), `R-DCN-13` (trunk), `R-DCN-14` (trunk), `R-DCN-15` (trunk), `R-DCN-16` (trunk), `R-DCN-17` (trunk), `R-DCN-18` (trunk), `R-DCN-19` (trunk), `R-DCN-20` (trunk), `R-DCN-21` (trunk); control: `- **R-DCN-22**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — merge: textual-d1-comment-guard into alfonso-frontend-jjtl (P-2026-11-06-2326)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — docs: step E discovery, T10 and synced selection (P-2026-11-06-2337)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-06 — feat: featureSources in the ontological binding, dormant slots in the feature closure` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — merge: dcn-l21 into alfonso-frontend-jjtl (P-2026-11-06-2351)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-06 — fix(jjtl): a failing builtin names the rule and source element (P-2026-11-06-2305)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-07 — merge: jjtl-builtin-errors into alfonso-frontend-jjtl (P-2026-11-07-0011)` once (trunk).
4. `git merge --no-ff --no-commit 1ab4568ff`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: multi-tab into alfonso-frontend-jjtl (P-2026-11-07-0041)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `1ab4568ff` in `/Users/alfonso/jjodel-w-multitab`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-multitab`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 03be29abc` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 03be29abc HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of the `docs/log-inbox/` file of this branch's front (the branch adds headings to none), both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the multi-tab merge (P-2026-11-07-0041)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-multitab`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
