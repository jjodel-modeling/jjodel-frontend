# Prompt: merge fix/typecheck-baseline-zero into staging

Prompt-ID: P-2026-10-13-1023
Chat: C-2026-10-12-1955
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-13 · lane merge · e4421dc62 · verifica visiva passata 2026-10-13 (chat, unattended; Juri in the digest)

Worktree: `/Users/juridirocco/development/jjodel`, branch `staging`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/juridirocco/development/jjodel` on `staging`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-13-1023 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `38f0add16`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `fix/typecheck-baseline-zero` into the trunk with one merge commit, `--no-ff`, of the explicit sha `fe2efc098`, in the shape of `c2cf77016` (the last merge commit on `staging`; read its body first). Merge base `38f0add16`. The branch carries, on top of the base, 10 commits:

- `fe2efc098` docs: lane closure, entry and Status (P-2026-10-12-2002)
- `8a8575ec0` docs: the typecheck baseline is zero, RC-48 (P-2026-10-12-2002)
- `69ec1a9b5` chore(harness): merge templates expect a zero typecheck baseline (P-2026-10-12-2002)
- `1d70f97b5` docs: add prompt P-2026-10-12-2002, lane 3/3 of chain-P-2026-10-12-2000
- `34a800d43` docs: lane closure, entry and Status (P-2026-10-12-2001)
- `315c62715` fix(types): import DDataType in the Ecore parser, typecheck at zero (P-2026-10-12-2001)
- `0dd4028f6` docs: add prompt P-2026-10-12-2001, lane 2/3 of chain-P-2026-10-12-2000
- `07deacb4a` docs: lane closure, entry and Status (P-2026-10-12-2000)
- `b3f44be17` fix(types): clear 11 baseline typecheck errors in six files (P-2026-10-12-2000)
- `e76c59c55` docs: add prompt P-2026-10-12-2000, lane 1/3 of chain-P-2026-10-12-2000

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-10-13 10:23, trunk at `38f0add16`:

- `git merge-tree --write-tree --name-only staging fe2efc098`: zero conflicts.
- Files changed since the base: 19 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 38f0add16 fe2efc098 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: `AGENTS.md`, `CLAUDE.md`.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-12_2000_prompt_typecheck_zero_s1_type_only.md` (eseguito 2026-10-12 · lane fix/typecheck-baseline-zero · b3f44be17), `claude_2026-10-12_2001_prompt_typecheck_zero_s2_ecore_parser.md` (eseguito 2026-10-12 · lane fix/typecheck-baseline-zero · 315c62715), `claude_2026-10-12_2002_prompt_typecheck_zero_s3_gate_at_zero.md` (eseguito 2026-10-13 · lane fix/typecheck-baseline-zero · 8a8575ec0).
- `git worktree list`: `fix/typecheck-baseline-zero` in `/Users/juridirocco/development/jjodel-tc0`; `staging` in `/Users/juridirocco/development/jjodel`.

**Findings.** governance files changed on the branch: `AGENTS.md`, `CLAUDE.md`; launch allowed by Alfonso's yes (`--governance-goahead`, 2026-10-13 10:23)

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `fe2efc098` is the tip of `fix/typecheck-baseline-zero`; the prompt files of the branch read `Status: eseguito` at `fe2efc098`; `git worktree list` shows `fix/typecheck-baseline-zero` only in `/Users/juridirocco/development/jjodel-tc0`.
2. Measure again. `git merge-tree --write-tree --name-only staging fe2efc098` (measured above: zero conflicts). `git diff --name-only 38f0add16 fe2efc098 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 38f0add16 staging` with `git diff --name-only 38f0add16 fe2efc098` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-48` (branch); control: `- **RC-49**` none.
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-13 — chore(harness): the typecheck baseline is zero in the norms and the merge templates, RC-48 (P-2026-10-12-2002)` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-12 — fix(types): 11 of the 14 baseline typecheck errors cleared in six files (P-2026-10-12-2000)` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-12 — ticket: SaveManager's XML import branch always throws, X.xml2json is not a function` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-12 — fix(types): last 3 baseline typecheck errors cleared in data.ts, baseline at zero (P-2026-10-12-2001)` once (branch).
4. `git merge --no-ff --no-commit fe2efc098`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: fix/typecheck-baseline-zero into staging (P-2026-10-13-1023)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `fe2efc098` in `/Users/juridirocco/development/jjodel-tc0`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 38f0add16` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/juridirocco/development/jjodel` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of the `docs/log-inbox/` file of this branch's front (the branch adds headings to `docs/log-inbox/harness.md`, `docs/log-inbox/maintenance.md`), both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the fix/typecheck-baseline-zero merge (P-2026-10-13-1023)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/juridirocco/development/jjodel-tc0`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
