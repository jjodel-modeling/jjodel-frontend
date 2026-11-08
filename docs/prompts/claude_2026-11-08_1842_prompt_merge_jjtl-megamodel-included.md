# Prompt: merge jjtl-megamodel-included into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-1842
Chat: C-2026-11-03-1202
Request: https://claude.ai/code/session_01DQt9R5EJe1reXq5Xut2Jif (merge of jjtl-megamodel-included launched by chat C-2026-11-03-1202)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-08 · lane merge · ea9bacb81 · verifica visiva passata 2026-11-08 (Megamodel: included edges on separate tracks, crop checked by the chat)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1842 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `34677007c`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-megamodel-included` into the trunk with one merge commit, `--no-ff`, of the explicit sha `8d695c689`, in the shape of `4a75388f7` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `4c51808e8`. The branch carries, on top of the base, 11 commits:

- `8d695c689` docs: Status flip of the megamodel included edges lane (P-2026-11-08-1720)
- `b22c6e5da` docs: log entry and conformsTo pills ticket (P-2026-11-08-1720)
- `f9ca9cd8c` docs(jjtl): report addendum, tracks and short pill (P-2026-11-08-1720)
- `f28299521` docs: R-JTG-35, input edges of included models, tracks (P-2026-11-08-1720)
- `17abe0030` docs(jjtl): SPEC, the megamodel reads the included models (P-2026-11-08-1720)
- `7c172384a` feat(megamodel): vertical tracks in a gap, short included pill (P-2026-11-08-1612)
- `295c5429b` feat(megamodel): one input edge per included model of a run (P-2026-11-08-1612)
- `c66b4972c` docs: add prompt P-2026-11-08-1720, close the megamodel included edges lane
- `9338afd34` docs(jjtl): probe of included edges, routing stop condition holds (P-2026-11-08-1612)
- `7cf79d345` docs(jjtl): discovery of included models in the megamodel (P-2026-11-08-1612)
- `65735858d` docs: add prompt P-2026-11-08-1612, megamodel edges for included models

The trunk carries, since the base, 22 commits:

- `34677007c` docs: Status flip and log entry for the dcn-l47 merge (P-2026-11-08-1757)
- `4a75388f7` merge: dcn-l47 into alfonso-frontend-jjtl (P-2026-11-08-1757)
- `9cfe2bcc4` docs: add prompt P-2026-11-08-1757, merge dcn-l47 into alfonso-frontend-jjtl
- `2274a79e7` docs: ticket blocks from the multi-tab chat (P-2026-11-08-1247, P-2026-11-08-1003)
- `266ebb690` docs: checkpoint update, afternoon round of the codegen front (C-2026-11-03-1037)
- `04d739dd4` docs(dcn): L4.7 closure, visual check passed (P-2026-11-08-1652)
- `722a38972` docs(dcn): L4.7 log entry and Status (P-2026-11-08-1652)
- `11f6f1c0b` test(dcn): run probe checks no defects line, initial state (P-2026-11-08-1652)
- `de1ff2fb8` test(dcn): drone fixture fills every empty slot (P-2026-11-08-1652)
- `149b2cdcf` docs(dcn): prompt P-2026-11-08-1652
- `956990177` docs(dcn): L4.6 closure, visual check passed (P-2026-11-08-1606)
- `2df3c9a32` docs(dcn): R-DCN-25..28, slice 5 rendering, snapshot and coherence watches
- `f3e6028b5` docs(dcn): Status of the L4.6 prompt (P-2026-11-08-1606)
- `a08a63ede` docs(dcn): log entry of the L4.6 panel polish (P-2026-11-08-1606)
- `4bf647cf4` test(dcn): probe reads Tick, takeOff off in Charging, on in Ready (P-2026-11-08-1606)
- `4a7b147c6` fix(dcn): the arguments of an invocation reach its body (P-2026-11-08-1606)
- `040f431ee` fix(dcn): the classification title lists a multi-valued link (P-2026-11-08-1606)
- `69d4a4da7` feat(dcn): an input is on only when admissible (P-2026-11-08-1606)
- `fe041980c` fix(dcn): the last step says the input label once (P-2026-11-08-1606)
- `f081ad4f2` docs: R-MT-26 order of the remaining multi-tab work, R-MT-23 amended, prompt P-2026-11-08-1608 (L6b)
- `1af6fc775` fix(dcn): the Tick input reads Tick in the panel (P-2026-11-08-1606)
- `d8c4665dd` docs(dcn): prompt P-2026-11-08-1606

Measured by `lane-run merge` at 2026-11-08 18:42, trunk at `34677007c`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 8d695c689`: zero conflicts.
- Files changed since the base: 11 on the branch side, 20 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only 4c51808e8 8d695c689 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_1612_prompt_jjtl_megamodel_included.md` (eseguito 2026-11-08 · lane full · 295c5429b, 7c172384a · closed by P-2026-11-08-1720 after the context ceiling · crop viewed and accepted by the chat), `claude_2026-11-08_1720_prompt_megamodel_included_close.md` (eseguito 2026-11-08 · lane full · 295c5429b, 7c172384a (code), 17abe0030 (SPEC), f28299521 (R-JTG-35), f9ca9cd8c (report) · gates green (typecheck 0, build, check:docs, vitest 15450 passed with the 3 baseline import reds) · ticket #781 · not merged).
- `git worktree list`: `jjtl-megamodel-included` in `/Users/alfonso/jjodel-w-megainc`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-08-1842/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `8d695c689` is the tip of `jjtl-megamodel-included`; the prompt files of the branch read `Status: eseguito` at `8d695c689`; `git worktree list` shows `jjtl-megamodel-included` only in `/Users/alfonso/jjodel-w-megainc`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 8d695c689` (measured above: zero conflicts). `git diff --name-only 4c51808e8 8d695c689 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 4c51808e8 alfonso-frontend-jjtl` with `git diff --name-only 4c51808e8 8d695c689` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-JTG-35` (branch), `R-DCN-25` (trunk), `R-DCN-26` (trunk), `R-DCN-27` (trunk), `R-DCN-28` (trunk), `R-MT-26` (trunk); control: `- **R-MT-27**` none.
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — ticket: two conformsTo pills touch model nodes in the megamodel` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — feat(megamodel): an input edge per included model, tracks in a gap (P-2026-11-08-1720)` once (branch).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — fix: DCN Simulation panel polish, findings of the L4.5 visual check (P-2026-11-08-1606)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — test: DCN drone fixture fills the empty slots, exports regenerated (P-2026-11-08-1652)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — merge: dcn-l47 into alfonso-frontend-jjtl (P-2026-11-08-1757)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-08 — ticket: lane-run merge template: rollback reset names the commit before the prompt commit` once (trunk).
   - `docs/log-inbox/jjodie-ui.md`: the heading `## 2026-11-08 — ticket: Refactoring finds no M1 target on the multi-tab demo project` once (trunk).
4. `git merge --no-ff --no-commit 8d695c689`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-megamodel-included into alfonso-frontend-jjtl (P-2026-11-08-1842)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `8d695c689` in `/Users/alfonso/jjodel-w-megainc`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-megainc`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 34677007c` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 34677007c HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-megamodel-included merge (P-2026-11-08-1842)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-megainc`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
