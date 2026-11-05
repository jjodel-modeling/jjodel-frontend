# Prompt: textual-block-tokens takes the trunk before its own merge

Prompt-ID: P-2026-11-05-2346
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge of the trunk into the branch; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-blocktok`, branch `textual-block-tokens`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-blocktok`, branch `textual-block-tokens`, `git log -1` is the commit that adds this file (its parent `6e18deefb`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-05-2346 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `0832088dc` into `textual-block-tokens` with one merge commit, `--no-ff`, in the shape of `45fcd7233` (the last merge commit on `textual-block-tokens`; read its body first). Merge base `2c15d1761`. The trunk brings, since the base, 49 commits:

- `0832088dc` docs: Status flip and log entry for a direct merge (P-2026-11-05-2247)
- `179138ef5` docs: audit October harness effectiveness
- `892ac50b2` docs: Status flip and log entry, blocked jjtl-method-failure-error merge closed (P-2026-11-05-2234)
- `6f1530d9c` merge: textual-ebnf-literals-step2 into alfonso-frontend-jjtl (P-2026-11-05-2247)
- `f9822e3a5` docs: add prompt P-2026-11-05-2247, merge textual-ebnf-literals-step2 into alfonso-frontend-jjtl
- `abbdf419d` docs: Status flip and log entry for B0 (P-2026-11-05-2220)
- `1b70ba7f3` merge: jjtl-method-failure-error into alfonso-frontend-jjtl (P-2026-11-05-2234)
- `b636d655f` docs: add prompt P-2026-11-05-2234, merge jjtl-method-failure-error into alfonso-frontend-jjtl
- `3ff841fc3` docs: Status flip and log entry, R-FA-12 closes the ticket (P-2026-11-05-2225)
- `2a14b3e72` docs: discovery report, a failing JjEL method in JjTL (P-2026-11-05-2225)
- `e12db26dc` test(codegen): B0, style tokens are EBNF islands, linked by origin (P-2026-11-05-2220)
- `f28661bdd` fix(codegen): B0, a tokens input for the style token rows (P-2026-11-05-2220)
- `8746cb976` docs: register R-FA-12, mark R-XMI-1 ratified (P-2026-11-05-1530)
- `097410e34` docs(jjtl): SPEC §10, a failing JjEL method is an error (P-2026-11-05-1530)
- `32e777031` fix(jjtl): a failing JjEL method stops the mapping (P-2026-11-05-1530)
- `9c123c45a` docs: add prompt P-2026-11-05-2225, close R-FA-12 after the context ceiling
- `cd3620be8` docs: ratify R-TXT-52, the block tokens decisions
- `9d506acfb` docs: add prompt P-2026-11-05-2220, B0 token fields and style-token islands
- `d01f05e5e` docs: Status flips and log entry, textual-ebnf-literals-step2 took the trunk (P-2026-11-05-1537, 1538)
- `2f6c8111d` merge: textual-ebnf-literals-step2 takes alfonso-frontend-jjtl (P-2026-11-05-1537)
- `72d2dabb2` docs: R-TXT-52, the block tokens decisions taken under lane auto, provisional
- `828d8d2d0` docs: add prompt P-2026-11-05-1538, merge alfonso-frontend-jjtl into textual-ebnf-literals-step2
- `ea1680e06` docs: add prompt P-2026-11-05-1537, merge alfonso-frontend-jjtl into textual-ebnf-literals-step2
- `95359d75e` docs: Status flip and log entry for the textual-ebnf-literals merge (P-2026-11-05-1522)
- `5f18f7e19` docs: add prompt P-2026-11-05-1530, a failing JjEL method stops a JjTL mapping
- `eddaf1e6d` merge: textual-ebnf-literals into alfonso-frontend-jjtl (P-2026-11-05-1522)
- `34168b38a` docs: add prompt P-2026-11-05-1522, merge textual-ebnf-literals into alfonso-frontend-jjtl
- `df8678701` docs: Status flip and log entry, textual-ebnf-literals took the trunk (P-2026-11-05-1455)
- `f4751483b` docs: Status flip and log entry for the xmi-typed-integers merge (P-2026-11-05-1512)
- `450864a4b` merge: xmi-typed-integers into alfonso-frontend-jjtl (P-2026-11-05-1512)
- `62fc7d950` merge: textual-ebnf-literals takes alfonso-frontend-jjtl (P-2026-11-05-1455)
- `452c602a7` docs: add prompt P-2026-11-05-1512, merge xmi-typed-integers into alfonso-frontend-jjtl
- `f1a3911d0` docs: R-XMI-1, ticket and log entry for the XMI typed values (P-2026-11-05-1446)
- `31831a082` docs: XMI typed integers discovery, app and node measures (P-2026-11-05-1446)
- `07ce98735` docs: add prompt P-2026-11-05-1455, textual-ebnf-literals takes the trunk
- `6ef8fbd10` docs(codegen): close EBNF literals L1b, editable literal islands (P-2026-11-05-0921, 0945, 1415)
- `36e67e7da` fix(xmi): type imported attribute values by the metamodel (#607) (P-2026-11-05-1446)
- `782262393` docs: add prompt P-2026-11-05-1446, XMI import typed integers (#607)
- `d95d5b9ca` docs: Status flip and log entry for the hw-core-jjtl-app merge (P-2026-11-05-1431)
- `6b98a59de` merge: hw-core-jjtl-app into alfonso-frontend-jjtl (P-2026-11-05-1431)
- and 9 more: `git log --oneline 2c15d1761..0832088dc`

This branch brings, 13 commits:

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

Measured by `lane-run merge --trunk-into` at 2026-11-05 23:46, trunk at `0832088dc`:

- `git merge-tree --write-tree --name-only textual-block-tokens 0832088dc`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 11 on the branch side, 39 on the trunk side; on both sides: `docs/log-inbox/codegen.md`, `frontend/src/codegen/textual/syntaxForm.ts`.
- `git diff --name-only 2c15d1761 6e18deefb -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-05_1525_prompt_textual_block_tokens_discovery.md` (eseguito (discovery, report committed; hard stop)), `claude_2026-11-05_1541_prompt_textual_block_tokens_b1.md` (eseguito 2026-11-05 · lane full · 1ba637cef, 98df231ae, 938a4109d · stopped at the soft ceiling, continued by P-2026-11-05-2212), `claude_2026-11-05_2212_prompt_textual_block_tokens_b1_cont.md` (eseguito 2026-11-05 · lane full · 0a1d50ca6 · closing gates run by the chat; core only, no visual check).
- `git worktree list`: `textual-block-tokens` in `/Users/alfonso/jjodel-w-blocktok`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** `lane-run merge --direct` fell back:

- code files changed on both sides since the base; step 5 of the template is a reading no script does: `frontend/src/codegen/textual/syntaxForm.ts`

## COME

1. Preconditions above, plus: `0832088dc` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `0832088dc` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only textual-block-tokens 0832088dc` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 0832088dc`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-52` (trunk), `R-FA-12` (trunk), `R-XMI-1` (trunk); control: `- **R-XMI-2**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — feat(codegen): B1, per-block tokens in the core (P-2026-11-05-1541, P-2026-11-05-2212)` once (branch).
   - `docs/decisions.md`: the heading `## R-XMI: attribute values of the XMI M1 import (decisions 2026-11-05)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — feat(codegen): L1b, the editable literals of the EBNF mode over the shared syntax draft (P-2026-11-05-0921, P-2026-11-05-0945, P-2026-11-05-1415)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — merge: textual-ebnf-literals takes alfonso-frontend-jjtl (P-2026-11-05-1455)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — merge: textual-ebnf-literals into alfonso-frontend-jjtl (P-2026-11-05-1522)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — merge: textual-ebnf-literals-step2 takes alfonso-frontend-jjtl (P-2026-11-05-1537)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — fix(codegen): B0, a tokens input for the style token rows, style-token islands after L2a (P-2026-11-05-2220)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-05 — merge: textual-ebnf-literals-step2 into alfonso-frontend-jjtl (P-2026-11-05-2247)` once (trunk).
   - `docs/log-inbox/harness-effectiveness-audit.md`: the heading `## 2026-11-05 — docs: audit the effectiveness of the October harness changes` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — ticket: XMI-imported integer attributes reach JjTL as strings` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — ticket: JjTL: one-line 'attr := expr -> feature {...}' fails to parse with the source text` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — ticket: EInt value above 2^31-1 silently clamped on L-layer read` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — ticket: Smoke seed sets a stale welcome-modal key` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — discovery: core JjTL with called rules, node on the trunk and the app write-back (P-2026-11-05-1400)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — merge: hw-core-jjtl-app into alfonso-frontend-jjtl (P-2026-11-05-1431)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — ticket: JjTL: a JjEL method unknown for the value's type warns instead of R-FA-11's error` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — fix(xmi): attribute values typed by the metamodel (P-2026-11-05-1446)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — merge: xmi-typed-integers into alfonso-frontend-jjtl (P-2026-11-05-1512)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — fix(jjtl): a failing JjEL method stops the mapping (P-2026-11-05-1530, P-2026-11-05-2225)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-05 — docs: closure of the blocked jjtl-method-failure-error merge` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/log-inbox/codegen.md`, `frontend/src/codegen/textual/syntaxForm.ts`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-block-tokens takes alfonso-frontend-jjtl (P-2026-11-05-2346)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-blocktok/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 6e18deefb` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane textual-block-tokens · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, textual-block-tokens took the trunk (P-2026-11-05-2346)` (P16, RC-17). `Outcome: done`. The merge of `textual-block-tokens` into the trunk gets its own prompt (`lane-run merge textual-block-tokens --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
