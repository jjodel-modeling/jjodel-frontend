# Prompt: merge the Vite dependency scan lane into the trunk

Prompt-ID: P-2026-09-26-1045
Chat: C-2026-09-25-1500
Lane: full (merge with one expected conflict, trunk code moved)
Status: eseguito 2026-09-26 · lane merge · 98ff75a27 · verifica visiva passata 2026-09-26

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop. `~/jjodel-vite` is read-only here. Do not touch `~/jjodel`, `~/jjodel-open`, `~/jjodel-sim`, `~/jjodel-gate`, `~/jjodel-harness`, nor the servers on 3000 and 3002.

Single phase, with one hard stop (the visual check). A merge: no source file is edited by hand; the one expected conflict is in a docs inbox and is resolved as described below.

**This file lives on `vite-dep-scan`, not on the trunk.** It reaches the trunk with the merge. Committing it on the trunk would have moved the tip again under other chats' prompts. Two merges never run at once in this tree: if the tree is dirty or a merge is in progress, stop.

## COSA

Branch `vite-dep-scan` (tip: the commit that adds this file, on top of `d9586fef5`), closed by `P-2026-09-25-1820` with visual check passed on 3005. Commits over `a5a0bcfbf`: `59701d5f0` (report), `8a4335402` (`frontend/vite.config.ts`: `optimizeDeps.esbuildOptions.tsconfigRaw` turns `experimentalDecorators` off for the dependency scan only, and four ids added to `optimizeDeps.include`), `d9586fef5` (closure: Status, inbox entry, two tickets), and the commit that adds this prompt.

Since `a5a0bcfbf` the trunk gained code (the 1835 merge of `simulation-engine`: state operator, Expression and Action types with migration 2.229, role catalog and profiles), the P13 fold of three inboxes, and the checkpoint `b5e109519`. The branch's only code file is `vite.config.ts`, which the trunk did not touch, so the scan fix must be re-measured on the merged code: new files could hit the same esbuild bug.

Expected conflict: `docs/log-inbox/harness.md`. The trunk folded that inbox (`02f16c829`) and left it with the header only; the branch still carries the 1353 entry and its two tickets as context, plus its own three new entries. Resolution: the trunk's header, followed by exactly the branch's three new entries (the `chore(dev)` entry of P-2026-09-25-1820 and its two tickets), verbatim and in that order. The 1353 entry and its tickets are already in `docs/claude-code-log.md` and must not come back.

## COME

1. Preconditions, hard stops: `git status` empty in `~/jjodel-release` and `~/jjodel-vite`; no `MERGE_HEAD`; `git worktree list` shows `alfonso-frontend-jjtl` only here and `vite-dep-scan` only in `~/jjodel-vite`; the tip of `vite-dep-scan` adds this file and its parent is `d9586fef5`. Record it as `<B>`; later steps use `<B>`, never the branch name.
2. Measure: merge base (expected `a5a0bcfbf`), `git diff --name-only` of each side, `git merge-tree --write-tree --name-only alfonso-frontend-jjtl <B>`. Expected: exactly one conflicting path, `docs/log-inbox/harness.md`. Any other conflict or any other file changed on both sides: stop. Confirm the branch changes no normative file (`CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`, `docs/decisions.md`).
3. `git merge --no-ff <B>`. Resolve `docs/log-inbox/harness.md` as in COSA, then check: `git show <trunk tip>:docs/log-inbox/harness.md` is a prefix of the result, the result contains the three new entries once each, and `command grep -c 'P-2026-09-25-1353' docs/log-inbox/harness.md` is 0. `npm run check:docs` from `frontend/` before concluding the merge: 4/4. Subject `merge: let the Vite dependency scan parse decorators (P-2026-09-25-1820)`; body in the shape of the precedents (`7562d23bd`): the shas of COSA, what the trunk gained since `a5a0bcfbf`, the conflict and how it was resolved, the probe results; `Model:` and `Co-Authored-By` trailers. Any other conflict: `git merge --abort`, stop.
4. Gates on the merge commit, from `frontend/` (permanent symlink here: never remove it): `npm run typecheck` (the §17 set; state the expected count from the trunk tip before running), `npm run typecheck:scripts` exit 0, `npx vitest run` (expected: the trunk tip's total, since the branch adds no tests; measure it on the trunk tip before step 3 if no closing report states it), `npm run build` exit 0 with the same warnings, `npm run check:docs` 4/4, `npm run check:agents` green, `npm run check:scripts` 0 hits.
5. Scan probe on the merged code, without touching this tree's cache or the 3001 server: in a throwaway directory outside every worktree (`mktemp -d`), `git worktree add --detach <dir> <merge sha>`, temporary symlink `frontend/node_modules -> ~/jjodel/frontend/node_modules`, cold start on port **3005** (check it is free), one `curl` of the page, and the same measures as the 1820 report: scan errors (expected none), deps pre-bundled at startup, "new dependencies optimized" or reload (expected none), `_metadata.json` counts. Then stop 3005, remove the symlink, `git worktree remove <dir>` (the only worktree this lane may remove, the one it created) and confirm `git worktree list` is back to what step 1 recorded. A scan error on a new file: stop and report it with the file and line; do not patch.
6. **Visual regression, hard stop.** The 3001 server restarts by itself on a `vite.config.ts` change; do not restart it. Tell Alfonso to hard-refresh `http://localhost:3001/` and check: (a) a healthy project opens with one page load, no automatic reload; (b) on the StateMachine metamodel the simulation panel works as before the merge. Wait. On a failure, report and stop; no revert without instruction.
7. After his OK, one docs commit: this prompt's Status flipped to `eseguito 2026-09-26 · lane merge · <merge sha> · verifica visiva passata 2026-09-26`, pathspec after `--`, subject `docs: Status flip for the Vite dependency scan merge (P-2026-09-26-1045)`, `Model:` trailer. No log entry for the merge (precedents).
8. Leave `~/jjodel-vite` and `vite-dep-scan` in place. Closing report opening with `[P-2026-09-26-1045 · session <id>]`: `<B>`, merge sha, conflict resolution check, gate numbers, scan probe numbers, visual result, push state without pushing.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name instead of the sha, squash, rebase, deleting any cache, killing a server you did not start, removing any worktree but the throwaway one of step 5, push.

## RIFERIMENTI

- On `vite-dep-scan`: `docs/prompts/claude_2026-09-25_1820_prompt_vite_dep_scan.md`, `docs/discovery/discovery_2026-09-25_vite_dep_scan.md`, `docs/log-inbox/harness.md`.
- Merge precedent `7562d23bd` and `docs/prompts/claude_2026-09-25_1615_prompt_merge_event_from_trigger.md`; the fold `02f16c829`.
- `docs/PROTOCOL.md` P13, P14, P15; `docs/decisions.md` RC-12, RC-17.
