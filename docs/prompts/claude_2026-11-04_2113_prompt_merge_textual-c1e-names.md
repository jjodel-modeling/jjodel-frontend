# Prompt: merge textual-c1e-names into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-04-2113
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-04-2113 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `d6fc11ebf`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-c1e-names` into the trunk with one merge commit, `--no-ff`, of the explicit sha `77a4dd682`, in the shape of `c79e1a1ca` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `e38500ec9`. The branch carries, on top of the base, 6 commits:

- `77a4dd682` docs(codegen): close C1e, names reprinted, removing a name applies, outline groups (P-2026-11-04-1605, 1627)
- `ec9f91341` docs: add prompt P-2026-11-04-1627, C1e closure
- `c7f6249be` fix(codegen): removing a name from the text applies (P-2026-11-04-1605)
- `f74e401c0` fix(codegen): reprint the names the app gives to nameless objects (P-2026-11-04-1605)
- `5fc137c02` feat(codegen): one outline group per per-item keyword feature (P-2026-11-04-1605)
- `27680b61e` docs: add prompt P-2026-11-04-1605, C1e names and outline groups

The trunk carries, since the base, 10 commits:

- `d6fc11ebf` docs: add prompt P-2026-11-04-1640, realign the trunk with staging
- `604273359` docs: R-TXT-45, an object can be nameless in the model (Alfonso 16:28)
- `a16608933` docs: Status flip and log entry for the elk-rangeerror merge (P-2026-11-04-1614)
- `c79e1a1ca` merge: elk-rangeerror into alfonso-frontend-jjtl (P-2026-11-04-1614)
- `5aed3578a` docs: add prompt P-2026-11-04-1614, merge elk-rangeerror into alfonso-frontend-jjtl
- `305796ca1` docs: Status flip and log entry for the RangeError fix (P-2026-11-04-1526)
- `68b146c32` docs: discovery, ELK auto layout RangeError and the budget check (P-2026-11-04-1526)
- `cb904099f` docs: add prompt P-2026-11-04-1526, close the RangeError fix
- `c4dfabf3b` fix(editor-v2): no network-simplex placement over 1,000 dummies (P-2026-11-04-1443)
- `fb09b1445` docs: add prompt P-2026-11-04-1443, Auto layout RangeError

Measured by `lane-run merge` at 2026-11-04 21:13, trunk at `d6fc11ebf`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 77a4dd682`: zero conflicts.
- Files changed since the base: 8 on the branch side, 10 on the trunk side; on both sides: none.
- `git diff --name-only e38500ec9 77a4dd682 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-04_1605_prompt_textual_c1e_names_outline.md` (eseguito 2026-11-04 · lane textual-c1e-names · c7f6249be · hard-stop at the context ceiling after items 1-5 and 7, closed by P-2026-11-04-1627), `claude_2026-11-04_1627_prompt_textual_c1e_closure.md` (eseguito 2026-11-04 · lane textual-c1e-names · c7f6249be · gates green, app check 13 of 13 of P-2026-11-04-1605, crops c1e-*.png; crops checked by the chat (RC-23); merge on Alfonso «A» 16:28).
- `git worktree list`: `textual-c1e-names` in `/Users/alfonso/jjodel-w-textc1e`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-04-2113/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `77a4dd682` is the tip of `textual-c1e-names`; the prompt files of the branch read `Status: eseguito` at `77a4dd682`; `git worktree list` shows `textual-c1e-names` only in `/Users/alfonso/jjodel-w-textc1e`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 77a4dd682` (measured above: zero conflicts). `git diff --name-only e38500ec9 77a4dd682 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only e38500ec9 alfonso-frontend-jjtl` with `git diff --name-only e38500ec9 77a4dd682` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-45` (trunk); control: `- **R-TXT-46**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — fix(codegen): C1e, names the app gives, removing a name, outline groups (P-2026-11-04-1605, P-2026-11-04-1627)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — fix(editor-v2): no network-simplex placement over 1,000 dummies (P-2026-11-04-1443, P-2026-11-04-1526)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — merge: elk-rangeerror into alfonso-frontend-jjtl (P-2026-11-04-1614)` once (trunk).
4. `git merge --no-ff --no-commit 77a4dd682`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-c1e-names into alfonso-frontend-jjtl (P-2026-11-04-2113)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `77a4dd682` in `/Users/alfonso/jjodel-w-textc1e`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textc1e`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard d6fc11ebf` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only d6fc11ebf HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-c1e-names merge (P-2026-11-04-2113)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textc1e`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
