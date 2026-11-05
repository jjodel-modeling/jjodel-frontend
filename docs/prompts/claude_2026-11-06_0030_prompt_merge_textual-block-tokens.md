# Prompt: merge textual-block-tokens into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-06-0030
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-06 · lane merge · 5dfa13429 · verifica visiva passata 2026-11-06 (non applicabile: B1 core only, no UI)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-06-0030 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `27e38755c`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-block-tokens` into the trunk with one merge commit, `--no-ff`, of the explicit sha `f6bb939a9`, in the shape of `6f1530d9c` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `0832088dc`. The branch carries, on top of the base, 16 commits:

- `f6bb939a9` docs: Status flip and log entry, textual-block-tokens took the trunk (P-2026-11-05-2346)
- `d335bdb2a` merge: textual-block-tokens takes alfonso-frontend-jjtl (P-2026-11-05-2346)
- `65d58157a` docs: add prompt P-2026-11-05-2346, merge alfonso-frontend-jjtl into textual-block-tokens
- `6e18deefb` docs: Status flips and log entry for B1 (P-2026-11-05-1541, P-2026-11-05-2212)
- `0a1d50ca6` feat(codegen): B1 (4), the style check reads per-block tokens (P-2026-11-05-2212)
- `938a4109d` fix(codegen): B1 (3), the tokenizer reads per-block punctuation (P-2026-11-05-2212)
- `98df231ae` feat(codegen): B1 (2), per-block tokens in the derivation (P-2026-11-05-2212)
- `1ba637cef` feat(codegen): B1 (1), per-block tokens resolved on classes and features (P-2026-11-05-2212)
- `b344f7c01` docs: add prompt P-2026-11-05-2212, B1 continuation
- `d2a32b95f` docs: add prompt P-2026-11-05-1541, block tokens B1
- `79272faf3` docs: Status flip of P-2026-11-05-1525, R-TXT-51 discovery
- `cb6edf13e` docs(codegen): R-TXT-51 discovery, §5 lanes, risks, D1..D10 (P-2026-11-05-1525)
- `b82b0c356` docs(codegen): R-TXT-51 discovery, §3 head prefix, §4 interplay (P-2026-11-05-1525)
- `51ade0f77` docs(codegen): R-TXT-51 discovery, §1 block tokens, §2 reserved names (P-2026-11-05-1525)
- `3ed4cefc4` docs(codegen): R-TXT-51 block tokens discovery, §0 and files read (P-2026-11-05-1525)
- `09748cf30` docs: add prompt P-2026-11-05-1525, R-TXT-51 block tokens discovery

The trunk carries, since the base, 2 commits:

- `27e38755c` docs: add the missing Corregge and Causa fields to the jjtl-method-failure-error closure entry
- `119abdb41` docs: measure harness continuations and ceiling exceptions

Measured by `lane-run merge` at 2026-11-06 00:30, trunk at `27e38755c`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f6bb939a9`: zero conflicts.
- Files changed since the base: 12 on the branch side, 5 on the trunk side; on both sides: none.
- `git diff --name-only 0832088dc f6bb939a9 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-05_1525_prompt_textual_block_tokens_discovery.md` (eseguito (discovery, report committed; hard stop)), `claude_2026-11-05_1541_prompt_textual_block_tokens_b1.md` (eseguito 2026-11-05 · lane full · 1ba637cef, 98df231ae, 938a4109d · stopped at the soft ceiling, continued by P-2026-11-05-2212), `claude_2026-11-05_2212_prompt_textual_block_tokens_b1_cont.md` (eseguito 2026-11-05 · lane full · 0a1d50ca6 · closing gates run by the chat; core only, no visual check), `claude_2026-11-05_2346_prompt_textual-block-tokens_take_trunk.md` (eseguito 2026-11-05 · lane textual-block-tokens · d335bdb2a · verifica visiva non applicabile 2026-11-06 (B1 core only; chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `textual-block-tokens` in `/Users/alfonso/jjodel-w-blocktok`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-06-0030/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `f6bb939a9` is the tip of `textual-block-tokens`; the prompt files of the branch read `Status: eseguito` at `f6bb939a9`; `git worktree list` shows `textual-block-tokens` only in `/Users/alfonso/jjodel-w-blocktok`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f6bb939a9` (measured above: zero conflicts). `git diff --name-only 0832088dc f6bb939a9 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 0832088dc alfonso-frontend-jjtl` with `git diff --name-only 0832088dc f6bb939a9` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — feat(codegen): B1, per-block tokens in the core (P-2026-11-05-1541, P-2026-11-05-2212)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — merge: textual-block-tokens takes alfonso-frontend-jjtl (P-2026-11-05-2346)` once (branch).
   - `docs/log-inbox/harness-effectiveness-followup.md`: the heading `## 2026-11-05 — docs: compare harness consumption with continuations and inspect ceiling exceptions` once (trunk).
4. `git merge --no-ff --no-commit f6bb939a9`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-block-tokens into alfonso-frontend-jjtl (P-2026-11-06-0030)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `f6bb939a9` in `/Users/alfonso/jjodel-w-blocktok`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-blocktok`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 27e38755c` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 27e38755c HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-block-tokens merge (P-2026-11-06-0030)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-blocktok`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
