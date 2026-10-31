# Prompt: merge gen-anomalies into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-31-1702
Chat: C-2026-10-31-1328
Request: none (rendered by lane-run, no chat URL known for C-2026-10-31-1328)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-31-1702 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `53e9528ac`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `gen-anomalies` into the trunk with one merge commit, `--no-ff`, of the explicit sha `7c3da13e1`, in the shape of `81ff3f45b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `de897d1a4`. The branch carries, on top of the base, 9 commits:

- `7c3da13e1` docs: Status of P-2026-10-31-1631, superseded by P-2026-10-31-1640
- `ac2244dbb` docs: Status flip and log entry for the key-aware trunk merge (P-2026-10-31-1640)
- `c9f9828ad` merge: alfonso-frontend-jjtl into gen-anomalies, key-aware (P-2026-10-31-1640)
- `42c80ef86` docs: add prompt P-2026-10-31-1640, key-aware trunk merge into gen-anomalies
- `ca78ca13f` docs: add prompt P-2026-10-31-1631, merge alfonso-frontend-jjtl into gen-anomalies
- `e5fbd104d` docs: Status flip, log entry and lazy-gate ticket (P-2026-10-31-1342)
- `092c33b68` fix(codegen): generator root follows templates, names without gaps (P-2026-10-31-1342)
- `038934225` docs(discovery): generators export and import anomalies (P-2026-10-31-1342)
- `62537f5cb` docs(prompts): add P-2026-10-31-1342, generators export and import anomalies

The trunk carries, since the base, 7 commits:

- `53e9528ac` docs: Status flip and log entry for the xmi-abstract merge (P-2026-10-31-1635)
- `81ff3f45b` merge: xmi-abstract into alfonso-frontend-jjtl (P-2026-10-31-1635)
- `ed3f83935` docs: add prompt P-2026-10-31-1635, merge xmi-abstract into alfonso-frontend-jjtl
- `7857d5f62` docs: Status flip for the XMI abstract-fallback lane (P-2026-10-31-1411)
- `b4f0ec5eb` docs: log entry for the XMI abstract-fallback lane (P-2026-10-31-1411)
- `ac7c92039` fix(xmi): skip and count unknown or abstract classes on M1 import (P-2026-10-31-1411)
- `9f6e85fe2` docs(prompts): add P-2026-10-31-1411, XMI import abstract fallback

Measured by `lane-run merge` at 2026-10-31 17:02, trunk at `53e9528ac`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7c3da13e1`: zero conflicts.
- Files changed since the base: 8 on the branch side, 5 on the trunk side; on both sides: none.
- `git diff --name-only de897d1a4 7c3da13e1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-31_1342_prompt_generators_export_and_import_anomalies.md` (eseguito 2026-10-31 · lane gen-anomalies · 092c33b68), `claude_2026-10-31_1631_prompt_gen-anomalies_take_trunk.md` (eseguito 2026-10-31 · lane gen-anomalies · stopped with Outcome: question (semantic conflict in TemplateEditorTab.tsx), superseded by P-2026-10-31-1640 (c9f9828ad)), `claude_2026-10-31_1640_prompt_gen-anomalies_key_aware_merge.md` (eseguito 2026-10-31 · gen-anomalies · c9f9828ad).
- `git worktree list`: `gen-anomalies` in `/Users/alfonso/jjodel-w-genanom`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `7c3da13e1` is the tip of `gen-anomalies`; the prompt files of the branch read `Status: eseguito` at `7c3da13e1`; `git worktree list` shows `gen-anomalies` only in `/Users/alfonso/jjodel-w-genanom`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7c3da13e1` (measured above: zero conflicts). `git diff --name-only de897d1a4 7c3da13e1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only de897d1a4 alfonso-frontend-jjtl` with `git diff --name-only de897d1a4 7c3da13e1` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-31 — fix(codegen): generator root follows templates, names without gaps (P-2026-10-31-1342)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-31 — ticket: check:codegen-lazy cannot pass its off mode while every .env sets VITE_CODEGEN on` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-31 — merge: alfonso-frontend-jjtl into gen-anomalies, key-aware (P-2026-10-31-1640)` once (branch).
   - `docs/log-inbox/xmi-abstract.md`: the heading `## 2026-10-31 — fix(xmi): skip and count unknown or abstract classes on M1 import (P-2026-10-31-1411)` once (trunk).
   - `docs/log-inbox/xmi-abstract.md`: the heading `## 2026-10-31 — merge: xmi-abstract into alfonso-frontend-jjtl (P-2026-10-31-1635)` once (trunk).
4. `git merge --no-ff --no-commit 7c3da13e1`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: gen-anomalies into alfonso-frontend-jjtl (P-2026-10-31-1702)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `7c3da13e1` in `/Users/alfonso/jjodel-w-genanom`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-genanom`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 53e9528ac` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 53e9528ac HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the gen-anomalies merge (P-2026-10-31-1702)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-genanom`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
