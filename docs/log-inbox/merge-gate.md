# Log inbox — merge gate (P-2026-09-19-1622)

Entries for the merge-gate lane, kept out of the active `docs/claude-code-log.md` while
parallel lanes are running (P9). To be merged into the active log by whoever rotates it.


## 2026-10-02 — ticket: a lane removes the node_modules symlink the direct merge needs later

**Prompt**: none, ticket filed by the chat C-2026-10-01-2220 after P-2026-10-02-2315.
**File toccati**: none
**Esito**: ⚠️ open ticket, priority low
**Note**: Lane P-2026-10-02-2045 linked `frontend/node_modules` in `~/jjodel-w-vpglyph` to run its gates and removed the link at the end (its report says so). The direct merge P-2026-10-02-2315 then ran the incoming vitest gate in that worktree, found no vitest (`sh: vitest: command not found`), wrote no report and stopped at `Outcome: blocked` before any merge commit. The chat restored the link and reran the merge as P-2026-10-02-2330 (green, merged `e2e4fbc35`). Fix options for a harness lane: `lane-run merge --direct` checks or creates the worktree link before the incoming gate, or lanes keep the link (it is gitignored).
**Nome del documento prompt**: 2026-10-02 23:50
