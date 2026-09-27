# Prompt: merge enum-edge-guard (canvas step A) into the trunk

Prompt-ID: P-2026-09-27-0250
Chat: C-2026-09-26-1702
Lane: full (merge; one inbox conflict to resolve by union)
Status: eseguito 2026-09-27 · lane merge · 1b40eacd0 · verifica visiva passata 2026-09-27 (chat, unattended; Alfonso in the morning digest)

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. No other tree is touched (the branch stays in `~/jjodel-open`, no fast-forward needed). Every reply opens with `[P-2026-09-27-0250 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `64a910c8e`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `enum-edge-guard` into the trunk with one merge commit, `--no-ff`, of the explicit sha `bda63a2b3`, in the shape of `24d8537fd` (read its body first). Merge base `39e3c151b` (the branch took the trunk at `90722c375`). The branch carries, on top of it: the discovery `4e5dff7ad` (`P-2026-09-27-0035`), the R-EDGE-1..3 rows `931943f29`, the Phase 2 prompt `70f4b1b90`, the code `5dc09a4ce` (pure predicate `connectionValidity.ts` and its 47 tests, `isValidConnection` wired in `EditorV2.tsx`, one SCSS rule for xyflow's invalid connection line), the closure `bda63a2b3` (probe 51/51 by the session and re-run by the chat).

No migration, no VersionFixer step, no critical-zone file.

**Behaviour brought into force on 3001:** on a metamodel canvas a connection completes only between two class nodes; class → enumeration, enumeration → class, enumeration → enumeration and class → package do not snap, open no popup and write nothing (no reference, no `extends`, no `DVoidEdge`); reconnecting an existing reference onto an enumeration is refused; in a model nothing changes.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `bda63a2b3` is the tip of `enum-edge-guard`; the two prompt files of the branch (`claude_2026-09-27_0035_prompt_enum_edge_guard_discovery.md`, `claude_2026-09-27_0120_fase2_enum_edge_guard_canvas.md`) read `Status: eseguito`; `git worktree list` shows `enum-edge-guard` only in `~/jjodel-open`.
2. Measure. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl bda63a2b3` (measured from chat at 02:48: one conflict, `docs/log-inbox/views.md`; `docs/decisions.md` auto-merges). `git diff --name-only 39e3c151b bda63a2b3 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. The branch's code files (`EditorV2.tsx`, `EditorV2.scss`, `connectionValidity.ts` and its test) must not have changed on the trunk since the base: `git diff --name-only 39e3c151b alfonso-frontend-jjtl -- frontend/src/components/editor-v2/EditorV2.tsx frontend/src/components/editor-v2/EditorV2.scss` empty. Any other conflict, or a code file changed on both sides: **stop** and report before merging.
3. Semantic probes on the merge-tree result: R-EDGE-1, R-EDGE-2, R-EDGE-3 once each (control: R-EDGE-4 none); R-SIM-67..72 and RC-25..30 once each.
4. `git merge --no-ff --no-commit bda63a2b3`.
5. Resolve `docs/log-inbox/views.md` by union, the only hand edit of this lane: the trunk side holds the entries of the properties rail lane `P-2026-09-27-0110`, the branch side holds the entry of `P-2026-09-27-0120`; the resolved file is the preamble, then the trunk's entries, then the branch's entry, all verbatim, no conflict markers, each heading once. `npm run check:docs` from `frontend/` must be 4/4 on the resolved tree.
6. Commit the merge. Subject within 72 characters, counted: `merge: canvas refuses class-enum connections, step A (P-2026-09-27-0120)`. Body in the shape of `24d8537fd`: the shas of COSA; the trunk's commits since the base (`8f85f1cb3` and the 0110 lane `cc2550779` `163fc6b44` `cbad59df3`, the merge prompt `2124b64fe`, the C1 merge `24d8537fd` and its flip `64a910c8e`, plus any docs commit that moved the tip); the inbox resolution; the probes; the behaviour brought into force; `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus 47 (the branch's new test file), 0 failed, the same files red at import; hook tests 255; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` 0 tracked hits. Then `Outcome: hard-stop`: 3001 runs from this tree (do not restart it; say whether it is up). The chat runs the smoke on 3001 (served `connectionValidity.ts` 200; a metamodel with a class and an enumeration: the drag class → enumeration does not open the popup) and Alfonso's confirmation goes in the morning digest.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito 2026-09-27 · lane merge · <merge sha> · verifica visiva passata 2026-09-27 (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip for the enum edge guard merge (P-2026-09-27-0250)`. No log entry for the merge. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry (the union of step 5 keeps every entry verbatim), any other tree.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29, R-EDGE-1..3.
- Precedents `24d8537fd` (merge), `64a910c8e` (Status flip); prompt `claude_2026-09-27_0135_prompt_merge_sim_c1.md`.
