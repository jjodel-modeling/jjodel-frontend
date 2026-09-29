# Prompt: the deadlock reason names the guard (`ε: t2 guard false`)

Prompt-ID: P-2026-09-29-1022
Chat: C-2026-09-28-1936
Lane: fast (one function, its tests, the demo script lines). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-guardword`, branch `sim-guard-word` (cut by the chat from `alfonso-frontend-jjtl` at `0fbb550ea`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-guardword`, branch `sim-guard-word`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

`docs/discovery/discovery_2026-09-29_petri_false_deadlock.md` (branch `petri-deadlock-disc`; read it with `git show petri-deadlock-disc:docs/discovery/discovery_2026-09-29_petri_false_deadlock.md`) found no engine bug, but a reason that hides the cause: a transition blocked by its guard reads `ε: t2 false`, while an inhibitor reads `inhibited by lock` (`simBridge.ts:1011`, `:1029`). Alfonso, 2026-09-29, answered its question «yes»: the reason says `guard`, as in `Deadlock · ε: t2 guard false`; the guard's source stays only in the hover title (R-SIM-62 unchanged).

This amends the example ratified in R-SIM-58 (`Deadlock · ε: t1 false`). Record a row **R-SIM-96** in `docs/decisions.md` after R-SIM-95, header exactly: `- **R-SIM-96** (2026-09-29, ratified by Alfonso 2026-09-29, evidence: read, verified: none, reversible: branch).` Body: the new wording, what it amends, the discovery.

Update the demo script `docs/demo/models_2026_simulator_demo.md` where it quotes the old reason (`:165-170` and any other occurrence; grep `false` near `Deadlock`), with the new text, tagged as the script tags its measures, once the probe below has measured it.

## DOVE

- `frontend/src/components/editor-v2/sim/simBridge.ts` (`blocked()` or wherever the reason text is built) and `__tests__/simBridge.test.ts`; any other test pinning the old text (grep `false"` near `Deadlock`/`ε:`).
- `docs/decisions.md` (the row, add-only); `docs/demo/models_2026_simulator_demo.md` (the quoted reason only).
- Closure: `docs/log-inbox/simulation.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (Rule 11, §21.2), `docs/PROTOCOL.md` P16, RC-20, RC-33, RC-34, R-SIM-58, R-SIM-62, and the discovery.
2. Tests first (red, then green): a guard-blocked transition reads `<event>: <id> guard false`; the title unchanged; inhibitor and weight reasons unchanged; a transition blocked by both guard and something else reads as today's rule orders them (say what it does).
3. Gates: `npm run typecheck` (14, the known set), the sim vitest folders green, full vitest with the 9 known reds only, `npm run build`, `check:docs` 4/4 (the row parses in `docs:digest`), `check:addonly`.
4. A lane probe on port 3049 (`lane-run probe`, never 3001), light theme: the Petri scene of the demo script end to end; record the final status line and title verbatim; the other three scenes' final readings unchanged.
5. One code commit, one docs commit (row, demo script lines, log entry, Status). Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff and the probe readings.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, `netStep.ts`, `netCompile.ts`.

## RIFERIMENTI

- The false-deadlock discovery (§0, Question 1); R-SIM-58, R-SIM-62; the demo script §2.2.
