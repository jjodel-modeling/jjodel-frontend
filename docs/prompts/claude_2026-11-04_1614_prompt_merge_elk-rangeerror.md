# Prompt: merge elk-rangeerror into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-04-1614
Chat: C-2026-11-03-2317
Request: https://claude.ai/code/session_01DQt9R6hbytx4vz5aAdzQ8i (merge of elk-rangeerror launched by chat C-2026-11-03-2317)
Lane: full (merge; 1 conflict: `docs/log-inbox/hw-notation.md` measured)
Status: eseguito 2026-11-04 · lane merge · c79e1a1ca · verifica visiva passata 2026-11-04 (gates green on c79e1a1ca; crops and layouts compared by the lane below the budget, no hand run)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-04-1614 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `e38500ec9`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `elk-rangeerror` into the trunk with one merge commit, `--no-ff`, of the explicit sha `305796ca1`, in the shape of `fe6eed263` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `a9f0b75f7`. The branch carries, on top of the base, 5 commits:

- `305796ca1` docs: Status flip and log entry for the RangeError fix (P-2026-11-04-1526)
- `68b146c32` docs: discovery, ELK auto layout RangeError and the budget check (P-2026-11-04-1526)
- `cb904099f` docs: add prompt P-2026-11-04-1526, close the RangeError fix
- `c4dfabf3b` fix(editor-v2): no network-simplex placement over 1,000 dummies (P-2026-11-04-1443)
- `fb09b1445` docs: add prompt P-2026-11-04-1443, Auto layout RangeError

The trunk carries, since the base, 48 commits:

- `e38500ec9` docs: R-TXT-44, the four open points of C1 (Alfonso 15:53)
- `4d770d936` docs: Status flip and log entry for the textual-c1-operators merge (P-2026-11-04-1542)
- `fe6eed263` merge: textual-c1-operators into alfonso-frontend-jjtl (P-2026-11-04-1542)
- `7dd75e4f4` docs: add prompt P-2026-11-04-1542, merge textual-c1-operators into alfonso-frontend-jjtl
- `dcc4231e4` docs: Status lines of the two C1c ceiling stops read eseguito, closed by P-2026-11-04-1241
- `9e32e2345` docs(codegen): close C1d, the port line, app check partial (P-2026-11-04-1312, 1355, 1447)
- `d4d2495f0` docs: Status flip and log entry for the rows-toolbar-comment merge (P-2026-11-04-1458)
- `2f61d24d6` merge: rows-toolbar-comment into alfonso-frontend-jjtl (P-2026-11-04-1458)
- `294d1d387` docs: add prompt P-2026-11-04-1458, merge rows-toolbar-comment into alfonso-frontend-jjtl
- `087abab75` docs: add prompt P-2026-11-04-1447, C1d closure
- `6304d5fd3` docs: R-JTG-21, 22 ratified, R-JTG-22 rewritten (P-2026-11-04-1442)
- `b46caa065` docs(editor-v2): correct the percent-button comment in Toolbar (P-2026-11-04-1442)
- `378a53cf5` docs: add prompt P-2026-11-04-1442, rows and Toolbar comment
- `cc7235435` test(codegen): mutation bench of the port line, survivors killed (P-2026-11-04-1355)
- `e80eaa872` test(codegen): the Briefs' port line and one-line Ref (P-2026-11-04-1355)
- `ac7a5b4b7` fix(codegen): Pascal terminator closes the expression line only (P-2026-11-04-1355)
- `9d5d474be` feat(codegen): the port line, item keyword, call layout, D3 head (P-2026-11-04-1355)
- `66032cd78` docs: add prompt P-2026-11-04-1355, C1d continuation
- `33d9efaab` docs: add prompt P-2026-11-04-1312, C1d port line
- `75fdfa6cb` docs(codegen): close C1c, slot matching for nameless expression objects (P-2026-11-04-1241)
- `725f30249` test(codegen): slot matching takes the same index first (P-2026-11-04-1241)
- `27df189f9` docs: add prompt P-2026-11-04-1241, C1c closure
- `4ffbc1ba7` feat(codegen): match nameless expression objects by slot (P-2026-11-04-1158)
- `d43e420c4` fix(codegen): order the lines around a create into a slot (P-2026-11-04-1158)
- `157d91a45` fix(codegen): a created object's handle avoids every instance name (P-2026-11-04-1158)
- `5bb033df0` test(codegen): measure the diff of nested expression edits on BOOL (P-2026-11-04-1115)
- `ec750e7ac` docs: add prompt P-2026-11-04-1158, C1c continuation
- `b7ee1c753` docs: add prompt P-2026-11-04-1115, step C lane C1c diff of nested expressions
- `f8b4079bd` docs: log entry and Status flips of step C lane C1b, crops checked by the chat (P-2026-11-04-0938, 1005, 1045)
- `8c376d5f0` test(codegen): Pascal and/or in call form read back the same model (P-2026-11-04-1045)
- `fdc328a72` test(codegen): every expression form in the oracle samples, "+" too (P-2026-11-04-1045)
- `984c45c95` docs: add prompt P-2026-11-04-1045, C1b closure
- `5e83da5cf` test(codegen): mutation bench of C1b, a loose prefix and a signed value (P-2026-11-04-1005)
- `57002a2b8` test(codegen): the nearley oracle agrees with the expression parser (P-2026-11-04-1005)
- `a50e40ec2` test(codegen): expression round trip on BOOL, ARITH and the Briefs (P-2026-11-04-1005)
- `23dbfd59a` feat(codegen): expressions in the printer, the same tree as the parse (P-2026-11-04-1005)
- `b81eaf6c2` feat(codegen): expressions in the parser, the prefix-infix symbol pair (P-2026-11-04-1005)
- `cde0d80e3` docs: add prompt P-2026-11-04-1005, C1b continuation
- `f83cbf2cc` feat(codegen): operator symbols in the tokenizer, the sign rule (P-2026-11-04-0938)
- `6db8d06fb` docs: add prompt P-2026-11-04-0938, step C lane C1b expressions in parser and printer
- and 8 more: `git log --oneline a9f0b75f7..e38500ec9`

Measured by `lane-run merge` at 2026-11-04 16:14, trunk at `e38500ec9`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 305796ca1`: 1 conflict: `docs/log-inbox/hw-notation.md`.
- Files changed since the base: 7 on the branch side, 35 on the trunk side; on both sides: `docs/log-inbox/hw-notation.md`.
- `git diff --name-only a9f0b75f7 305796ca1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-04_1443_prompt_elk_rangeerror.md` (eseguito 2026-11-04 · lane full · c4dfabf3b · closed by P-2026-11-04-1526 · b10_8 settled view not fixed (useJjomSync, lane P-2026-11-04-1500) · verifica visiva non applicabile (unattended: probe crops, no hand run)), `claude_2026-11-04_1526_prompt_elk_rangeerror_close.md` (eseguito 2026-11-04 · lane fast · no code change · 68b146c32 discovery · 35 canvases below the budget equal before/after, no demo above · verifica visiva non applicabile (unattended: probe crops, no hand run)).
- `git worktree list`: `elk-rangeerror` in `/Users/alfonso/jjodel-w-elkrange`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-04-1614/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `305796ca1` is the tip of `elk-rangeerror`; the prompt files of the branch read `Status: eseguito` at `305796ca1`; `git worktree list` shows `elk-rangeerror` only in `/Users/alfonso/jjodel-w-elkrange`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 305796ca1` (measured above: 1 conflict: `docs/log-inbox/hw-notation.md`). `git diff --name-only a9f0b75f7 305796ca1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only a9f0b75f7 alfonso-frontend-jjtl` with `git diff --name-only a9f0b75f7 305796ca1` (measured above: `docs/log-inbox/hw-notation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-44` (trunk), `R-JTG-21` (trunk), `R-JTG-22` (trunk); control: `- **R-JTG-23**` none.
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — fix(editor-v2): no network-simplex placement over 1,000 dummies (P-2026-11-04-1443, P-2026-11-04-1526)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — feat(codegen): operators in the grammar and the style check, textual step C lane C1a (P-2026-11-04-0732, P-2026-11-04-0910)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — test(codegen): C1b closure, call form under Pascal, "+" in the oracle samples, in-app check (P-2026-11-04-1045)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — ticket: a Text tab edit adding an operand runs a set that cannot resolve the new Use` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — feat(codegen): C1c, slot matching of expression objects, handle names, slot ordering (P-2026-11-04-1115, P-2026-11-04-1158, P-2026-11-04-1241)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — feat(codegen): C1d, the port line, item keyword, call layout, optional head name (P-2026-11-04-1312, P-2026-11-04-1355, P-2026-11-04-1447)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — merge: textual-c1-operators into alfonso-frontend-jjtl (P-2026-11-04-1542)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — docs: R-JTG-21, 22 ratified, R-JTG-22 rewritten; Toolbar comment (P-2026-11-04-1442)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — merge: rows-toolbar-comment into alfonso-frontend-jjtl (P-2026-11-04-1458)` once (trunk).
4. `git merge --no-ff --no-commit 305796ca1`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: elk-rangeerror into alfonso-frontend-jjtl (P-2026-11-04-1614)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `305796ca1` in `/Users/alfonso/jjodel-w-elkrange`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-elkrange`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard e38500ec9` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only e38500ec9 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the elk-rangeerror merge (P-2026-11-04-1614)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-elkrange`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
