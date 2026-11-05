# Prompt: merge textual-ebnf-literals into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-05-1522
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-05-1522 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `f4751483b`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-ebnf-literals` into the trunk with one merge commit, `--no-ff`, of the explicit sha `df8678701`, in the shape of `450864a4b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d95d5b9ca`. The branch carries, on top of the base, 9 commits:

- `df8678701` docs: Status flip and log entry, textual-ebnf-literals took the trunk (P-2026-11-05-1455)
- `62fc7d950` merge: textual-ebnf-literals takes alfonso-frontend-jjtl (P-2026-11-05-1455)
- `07ce98735` docs: add prompt P-2026-11-05-1455, textual-ebnf-literals takes the trunk
- `6ef8fbd10` docs(codegen): close EBNF literals L1b, editable literal islands (P-2026-11-05-0921, 0945, 1415)
- `c637ebf5f` feat(codegen): L1b item 2, the editable literals of the EBNF mode (P-2026-11-05-0921)
- `c948c1e17` docs: add prompt P-2026-11-05-1415, L1b continuation 2
- `5b15dd1f7` docs: add prompt P-2026-11-05-0945, L1b continuation
- `a44ff8319` feat(codegen): L1b item 1, the syntax draft lifted into useSyntaxDraft (P-2026-11-05-0921)
- `1853f9425` docs: add prompt P-2026-11-05-0921, EBNF literals L1b

The trunk carries, since the base, 7 commits:

- `f4751483b` docs: Status flip and log entry for the xmi-typed-integers merge (P-2026-11-05-1512)
- `450864a4b` merge: xmi-typed-integers into alfonso-frontend-jjtl (P-2026-11-05-1512)
- `452c602a7` docs: add prompt P-2026-11-05-1512, merge xmi-typed-integers into alfonso-frontend-jjtl
- `f1a3911d0` docs: R-XMI-1, ticket and log entry for the XMI typed values (P-2026-11-05-1446)
- `31831a082` docs: XMI typed integers discovery, app and node measures (P-2026-11-05-1446)
- `36e67e7da` fix(xmi): type imported attribute values by the metamodel (#607) (P-2026-11-05-1446)
- `782262393` docs: add prompt P-2026-11-05-1446, XMI import typed integers (#607)

Measured by `lane-run merge` at 2026-11-05 15:22, trunk at `f4751483b`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl df8678701`: zero conflicts.
- Files changed since the base: 11 on the branch side, 7 on the trunk side; on both sides: none.
- `git diff --name-only d95d5b9ca df8678701 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-05_0921_prompt_textual_ebnf_literals_l1b.md` (eseguito 2026-11-05 · lane full · a44ff8319, c637ebf5f (stopped at the ceiling, continued by P-2026-11-05-0945 and P-2026-11-05-1415, RC-51) · app probe 23 checks pass; verifica visiva in attesa del GO di Alfonso (crops l1b-1..11 in ~/.jjodel-lanes/P-2026-11-05-1415/)), `claude_2026-11-05_0945_prompt_textual_ebnf_literals_l1b_cont.md` (eseguito 2026-11-05 · lane full · no commit (died in the bridge outage after its probe; closed by P-2026-11-05-1415, RC-51) · verifica visiva in attesa del GO di Alfonso (crops of P-2026-11-05-1415)), `claude_2026-11-05_1415_prompt_textual_ebnf_literals_l1b_cont2.md` (eseguito 2026-11-05 · lane full · c637ebf5f · app probe 23 checks pass; verifica visiva della chat passata 2026-11-05 (RC-23), lane auto (crops l1b-1..11 in ~/.jjodel-lanes/P-2026-11-05-1415/)), `claude_2026-11-05_1455_prompt_textual_ebnf_literals_take_trunk.md` (eseguito 2026-11-05 · lane full · 62fc7d950 · probes L1b 23/23, picker 9/9, guard 15/15 (direct-write variant); verifica visiva in attesa del GO (crops in ~/.jjodel-lanes/P-2026-11-05-1455/)).
- `git worktree list`: `textual-ebnf-literals` in `/Users/alfonso/jjodel-w-ebnflit`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-05-1522/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `df8678701` is the tip of `textual-ebnf-literals`; the prompt files of the branch read `Status: eseguito` at `df8678701`; `git worktree list` shows `textual-ebnf-literals` only in `/Users/alfonso/jjodel-w-ebnflit`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl df8678701` (measured above: zero conflicts). `git diff --name-only d95d5b9ca df8678701 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d95d5b9ca alfonso-frontend-jjtl` with `git diff --name-only d95d5b9ca df8678701` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-XMI-1` (trunk); control: `- **R-XMI-2**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — feat(codegen): L1b, the editable literals of the EBNF mode over the shared syntax draft (P-2026-11-05-0921, P-2026-11-05-0945, P-2026-11-05-1415)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — merge: textual-ebnf-literals takes alfonso-frontend-jjtl (P-2026-11-05-1455)` once (branch).
   - `docs/decisions.md`: the heading `## R-XMI: attribute values of the XMI M1 import (decisions 2026-11-05)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — ticket: JjTL: a JjEL method unknown for the value's type warns instead of R-FA-11's error` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — fix(xmi): attribute values typed by the metamodel (P-2026-11-05-1446)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — merge: xmi-typed-integers into alfonso-frontend-jjtl (P-2026-11-05-1512)` once (trunk).
4. `git merge --no-ff --no-commit df8678701`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-ebnf-literals into alfonso-frontend-jjtl (P-2026-11-05-1522)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `df8678701` in `/Users/alfonso/jjodel-w-ebnflit`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-ebnflit`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard f4751483b` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only f4751483b HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-ebnf-literals merge (P-2026-11-05-1522)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-ebnflit`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
