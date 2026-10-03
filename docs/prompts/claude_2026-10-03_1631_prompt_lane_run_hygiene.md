# Prompt: lane-run hygiene (node_modules link before the direct merge gate, Status flip on trunk-take runs)

Prompt-ID: P-2026-10-03-1631
Chat: C-2026-10-03-1610
Lane: fast (harness script and its templates, tests first; no app code). Tier: light.
Status: eseguito 2026-10-03 · lane lane-run-hygiene · d414c934d · gates: typecheck:scripts exit 0, check:scripts PASS, hook and gate tests 640/640 (632 plus 8), check:docs 4/4; no visual check (harness)

Worktree: `~/jjodel-w-lanehyg`, branch `lane-run-hygiene`, cut by the chat from `alfonso-frontend-jjtl` at `d2a1866b6`, `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this prompt); if any differs, stop with `Outcome: blocked`.

## COSA

Two harness defects, both seen at least twice.

1. **A lane removes the worktree `frontend/node_modules` link the direct merge needs.** Ticket in `docs/log-inbox/merge-gate.md` (2026-10-02): lane P-2026-10-02-2045 removed the link at its end, the direct merge P-2026-10-02-2315 ran the incoming vitest gate in that worktree, found no vitest and stopped at `Outcome: blocked`. Fix in `lane-run merge ... --direct` (and in the direct worker that runs the gates, about lines 1597-1610 of `frontend/scripts/lane-run.mjs`): before any gate that runs in the incoming worktree, check `<incomingTree>/frontend/node_modules`; when it is missing, create the symlink to the shared `node_modules` of the main checkout (the same target P14 uses, read from the receiving tree's own link or from `git worktree list` for the main worktree, never a hard-coded user path), and record it in result.json and the measured commit body. When it exists and is not a link or points elsewhere, leave it and say so in the findings. Same check for `--trunk-into` if it runs gates in a branch worktree.
2. **Trunk-take runs leave the prompt Status at `da eseguire`.** Seen with P-2026-10-02-1718 and P-2026-10-03-0050: sessions launched from `lane-templates/trunk-into-branch.md` merged the trunk into the branch and never flipped their prompt's `Status:` line; the chat flipped them by hand (`1c63fca7c`, `15a17ba08`). Direct merges into the trunk already flip it in the `go` closure (`lane-run.mjs` about lines 2000-2010). Fix: (a) the template `trunk-into-branch.md` carries the Status-flip clause in its closure step, in the same words as `merge-into-trunk.md` (read both); (b) if `merge --trunk-into ... --direct` exists, its closure flips the Status as the trunk direction does; (c) `lane-run status <id>` warns, once the lane has exited with `done` or `hard-stop`, when the lane's prompt in its worktree still reads `Status: da eseguire`.

## DOVE

Exactly: `frontend/scripts/lane-run.mjs`, `frontend/scripts/lane-templates/trunk-into-branch.md`, `frontend/scripts/lane-templates/merge-into-trunk.md` (only if the clause must be shared), their tests (find where `check:scripts` and `typecheck:scripts` look: `npm run` scripts in `frontend/package.json`; grep for existing tests of `lane-run.mjs`). No app code, no governance file (`CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`, `.claude/settings.json`): if a fix needs one, stop with `Outcome: question`. Plus the closure docs: this prompt's Status and `docs/log-inbox/merge-gate.md` (append under the ticket, do not rewrite it).

## COME

1. Read `CLAUDE.md` (sections 6, 17, 21.2), P14, P16, RC-17, RC-20, RC-31, the two templates and the parts of `lane-run.mjs` that render, launch and close merges.
2. Tests first, in the existing test file of the script if there is one (else a new one beside the others `check:scripts` runs): the link is created when missing, left alone and reported when it is a directory, untouched when present; the template renders the flip clause; `status` prints the warning on an exited lane whose prompt is still `da eseguire` and not on a flipped one. Red before the fix.
3. Implement. Gates in the foreground: `npm run typecheck:scripts`, `npm run check:scripts`, the script tests, `npm run check:docs`. No app build needed unless a gate requires it.
4. A dry check without merging anything: render `merge --trunk-into lane-run-hygiene --from alfonso-frontend-jjtl` without `--launch` from this worktree and show the closure step of the rendered prompt; then delete only the rendered file you created in `~/.jjodel-lanes/pending/` (name it in the report).
5. Commits: `fix(harness):` code, templates and tests, then the closure docs commit (Status flip with lane, shas, gates; inbox entry); stage by explicit path. Stop with `Outcome: done` and the shas.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, a real merge, writes outside this worktree except the one pending file of step 4, a file outside DOVE, removing the `frontend/node_modules` link.

## RIFERIMENTI

`docs/log-inbox/merge-gate.md` (ticket of 2026-10-02); P-2026-10-02-2315 (blocked) and P-2026-10-02-2330 (rerun); P-2026-10-02-1718 and P-2026-10-03-0050 (unflipped trunk-take prompts); `sessione_CORRENTE.md`, section of chat C-2026-10-01-2220.
