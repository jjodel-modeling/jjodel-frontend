# Prompt: feat/186-endpoints takes the trunk before its own merge

Prompt-ID: P-2026-10-17-1032
Chat: C-2026-10-14-1020
Lane: full (merge of the trunk into the branch; zero conflicts measured)
Status: eseguito 2026-10-17 · lane feat/186-endpoints · 348deae2a · verifica visiva passata 2026-10-17 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/juridirocco/development/jjodel-186`, branch `feat/186-endpoints`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/juridirocco/development/jjodel-186`, branch `feat/186-endpoints`, `git log -1` is the commit that adds this file (its parent `790cf6ad0`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-17-1032 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `staging` at the explicit sha `f7d0d1d7c` into `feat/186-endpoints` with one merge commit, `--no-ff`, in the shape of `0780366c3` (the last merge commit on `feat/186-endpoints`; read its body first). Merge base `358a91da3`. The trunk brings, since the base, 10 commits:

- `f7d0d1d7c` docs: Status flip and log entry for a direct merge (P-2026-10-17-0950)
- `5bf91bf01` merge: feat/187-configurator-panel into staging (P-2026-10-17-0950)
- `5a19b7ca4` docs: add prompt P-2026-10-17-0950, merge feat/187-configurator-panel into staging
- `ce402506c` docs(#187): lane closure, entry and Status (P-2026-10-14-1100)
- `95537be08` feat(#187): ConfiguratorTab mounts the panel (P-2026-10-14-1100)
- `8f414c0e4` feat(#187): the Configurator panel's components (P-2026-10-14-1100)
- `afecf5bd8` feat(#187): panelModel, pure rules of the Configurator panel (P-2026-10-14-1100)
- `e893f7191` feat(#187): consumer chrome, role chip beside the title (P-2026-10-14-1100)
- `41d6f3e81` docs(#187): Phase 1 report on the Configurator panel (P-2026-10-14-1100)
- `304266fd6` docs: add prompt P-2026-10-14-1100, #187 Configurator panel

This branch brings, 9 commits:

- `790cf6ad0` docs(#186): lane closure, entry and Status (P-2026-10-14-1101)
- `3b84117d7` feat(#186): steps point to the window's «Done» again (P-2026-10-14-1101)
- `896833e2f` feat(#186): Endpoints window opened from an app bar menu (P-2026-10-14-1101)
- `6f8ddaa83` docs(#186): R-CFG-5, Endpoints in a top-bar menu (C-2026-10-14-1020)
- `0179876d5` feat(#186): Endpoints section on the project page (P-2026-10-14-1101)
- `0f90bee15` feat(#186): steps write nothing at mount, Role wording, fold (P-2026-10-14-1101)
- `5d88838f2` feat(#186): fold helper for not selectable metaclasses (P-2026-10-14-1101)
- `68eaecbf6` docs(#186): Phase 1 report on the Endpoints section (P-2026-10-14-1101)
- `2ce07f7fa` docs: add prompt P-2026-10-14-1101, #186 Endpoints section

Measured by `lane-run merge --trunk-into` at 2026-10-17 10:32, trunk at `f7d0d1d7c`:

- `git merge-tree --write-tree --name-only feat/186-endpoints f7d0d1d7c`: zero conflicts.
- Files changed since the base: 12 on the branch side, 14 on the trunk side; on both sides: `frontend/src/pages/components/Navbar.tsx`.
- `git diff --name-only 358a91da3 790cf6ad0 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-14_1101_prompt_186_endpoints.md` (eseguito 2026-10-16 · lane endpoints · 3b84117d7 · verifica visiva passata 2026-10-17 (Juri, port 3186, ScenarioMM fixture; chat probe chat_186b_independent.mts 9/9)).
- `git worktree list`: `feat/186-endpoints` in `/Users/juridirocco/development/jjodel-186`; `staging` in `/Users/juridirocco/development/jjodel`.

## COME

1. Preconditions above, plus: `f7d0d1d7c` is the tip of `staging` (if a docs-only commit moved it, say so and merge `f7d0d1d7c` all the same); `git worktree list` shows `staging` only in `/Users/juridirocco/development/jjodel`.
2. Measure again: `git merge-tree --write-tree --name-only feat/186-endpoints f7d0d1d7c` (measured above: zero conflicts). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit f7d0d1d7c`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/log-inbox/endpoints.md`: the heading `## 2026-10-16 — feat(#186): the Endpoints window and its app bar menu` once (branch).
   - `docs/log-inbox/configurator-panel.md`: the heading `## 2026-10-15 — feat(#187): the Configurator panel and the consumer chrome` once (trunk).
   - `docs/log-inbox/configurator-panel.md`: the heading `## 2026-10-17 — merge: feat/187-configurator-panel into staging (P-2026-10-17-0950)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`frontend/src/pages/components/Navbar.tsx`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: feat/186-endpoints takes staging (P-2026-10-17-1032)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/juridirocco/development/jjodel` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 790cf6ad0` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane feat/186-endpoints · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/endpoints.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, feat/186-endpoints took the trunk (P-2026-10-17-1032)` (P16, RC-17). `Outcome: done`. The merge of `feat/186-endpoints` into the trunk gets its own prompt (`lane-run merge feat/186-endpoints --into staging`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/juridirocco/development/jjodel`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
