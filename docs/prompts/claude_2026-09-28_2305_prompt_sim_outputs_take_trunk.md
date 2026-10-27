# Prompt: sim-outputs-accepting takes the trunk and closes the engine slice (R-SIM-50/51/52 ratified)

Prompt-ID: P-2026-09-28-2305
Chat: C-2026-09-28-1936
Lane: full (merge of the trunk into the branch with code conflicts in the simulation engine, then gates). Tier: heavy.
Status: eseguito 2026-09-28 · lane sim-outputs-accepting · 813b1c058 · non fuso nel tronco: hard-stop, le quattro scene le sonda la chat

Worktree: `~/jjodel-w-outputs`, branch `sim-outputs-accepting` (6 commits ahead of the merge base, about 260 behind `alfonso-frontend-jjtl` at `fb044365b`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-outputs`, branch `sim-outputs-accepting`, `git log -1` is the docs commit that added this prompt, `git status` empty; if any differs, stop with `Outcome: blocked` and say which.

## COSA

The engine slice S4 of P-2026-09-27-1725 (`ab4b8de8b`: the engine reads Accepting and the role-bound outputs; discovery `docs/discovery/discovery_2026-09-27_sim_outputs_accepting.md`) was done on this branch the 27th and never merged. Since then the trunk changed the same engine files (R7 `else` without siblings, R-SIM-88 input variables, R-SIM-89 mixin owners, S6-S8). Alfonso ratified R-SIM-50, R-SIM-51 and R-SIM-52 and wants everything in the MODELS build before the freeze of 2026-10-01, except the `.smv` generation.

Goal: this branch takes the trunk, every conflict resolved keeping both sides' behaviour, the three rows no longer provisional, all gates green at the trunk's baseline, ready for a direct merge by the chat.

## DOVE

- `git merge alfonso-frontend-jjtl` in this worktree (never a rebase); the conflicted files, expected in `frontend/src/model/simulation/` (`netCompile.ts`, `netStep.ts`, `netTypes.ts`, `roleCatalog.ts` and their tests) and `docs/decisions.md`, `docs/log-inbox/simulation.md`.
- `docs/decisions.md`: the headers of R-SIM-50, R-SIM-51, R-SIM-52 (provisional to ratified by Alfonso, date 2026-09-28), nothing else in those rows.
- Out of scope: the `.smv` exporter and anything generating nuXmv text (deferred after Malaga by Alfonso); the M2 rows and the faces of the outputs (the next lane, `sim-outputs-faces`); any file outside the simulation model and its tests.

## COME

1. Read `CLAUDE.md` (§6, Rule 11, §21.2), `docs/PROTOCOL.md` P16, RC-14, RC-20..RC-22, RC-33, RC-34, the discovery above (§0 and the engine section), and the rows R-SIM-50..52, R-SIM-86..90 of the trunk (`git show alfonso-frontend-jjtl:docs/decisions.md`).
2. Baseline on the branch before the merge: vitest of `src/model/simulation` (counts), typecheck count.
3. `git merge alfonso-frontend-jjtl`. For each conflict: read both sides and both commits, keep both behaviours; an engine conflict is resolved by composing the two changes, never by picking a side. Add-only files (`docs/claude-code-log.md`, `docs/log-inbox/*.md`): keep both sides' entries whole and in order (RC-34); `npm run check:addonly` on the merge commit must pass. If a conflict needs a semantic choice between the two sides (the same case handled two ways), stop with `Outcome: question` and a `Recommended:` line.
4. Headers of R-SIM-50/51/52: ratified by Alfonso 2026-09-28; `npm run docs:digest` exit 0.
5. Gates on the result: `npm run typecheck` (14, the trunk's set), vitest of `src/model/simulation` and `src/components/editor-v2/sim` all green (counts), the full vitest with its known reds unchanged (name them), `npm run build`, `check:docs`, `check:addonly`. A test that the trunk's changes break on the branch's new code is fixed on the branch, and said.
6. Commits: the merge commit (message `merge: alfonso-frontend-jjtl into sim-outputs-accepting (P-2026-09-28-2305)`, conflicts listed in the body), then one docs commit with the R-SIM header change, the log entry in `docs/log-inbox/simulation.md` and this prompt's Status.
7. Do not merge into the trunk, no dev server, no probe (the chat probes the four scenes). Stop with `Outcome: hard-stop`, the shas, the conflicts and how each was resolved, the counts before and after.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, rebase, writes in any other tree, a critical-zone file, dark-theme work.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_sim_outputs_accepting.md` (this branch), R-SIM-50/51/52.
- Trunk rows R-SIM-86..R-SIM-90; RC-33, RC-34.
