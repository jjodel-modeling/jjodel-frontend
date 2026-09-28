# Prompt: R-SIM-90 Phase 2, Entry, Exit, Action and Guard multi-valued

Prompt-ID: P-2026-09-29-0010
Chat: C-2026-09-28-1936
Lane: full (Phase 2, simulation engine across modules and the roles dialog, tests first). Tier: heavy.
Status: eseguito 2026-09-29 · lane sim-multi-roles-p2 · c6e28f893, 1bb05b781, 2fbb1fa97, 9ab66e047 · non fuso: hard-stop, crop in docs/discovery/harness/_tmp_multi_*.png (gitignored), le quattro scene le sonda la chat

Worktree: `~/jjodel-w-multi2`, branch `sim-multi-roles-p2` (cut by the chat from `alfonso-frontend-jjtl` at `024d95345`, after the merge of `sim-outputs-accepting`; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-multi2`, branch `sim-multi-roles-p2`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Implement R-SIM-90 (ratified, with the Guard amendment; `docs/decisions.md`) as planned by the discovery `docs/discovery/discovery_2026-09-28_sim_multi_roles.md` of P-2026-09-28-2306 (branch `sim-multi-roles`; read it with `git show sim-multi-roles:docs/discovery/discovery_2026-09-28_sim_multi_roles.md`). The chat adopted its nine `Recommended:` answers under RC-21; they are part of this prompt:

1. Storage: a plain id for one attribute, a JSON array string for two or more, `roleValues`/`encodeRoleValues` in `roleCatalog.ts`, duplicates dropped, a parse failure kept as one bad value.
2. `NetStc`: `guard/action/entry/exit` stay the first attribute; optional `guards/actions/entries/exits` added.
3. `else` with several Guard attributes: `else` in any of them marks the element as the `else` branch; its other non-blank guards still have to hold, as G7 does for a fused transition's other edges.
4. Double assignment: no new rule; pin the existing checks (Reset in `simBridge.ts`, run-time halt in `netStep.ts`) with a two-attribute test.
5. Role verdict: the worst attribute's verdict; optional `currents` on `RoleCompatibility`.
6. Dialog: the primary select unchanged; the other attributes as 24 px tags on one line, a 24 px «+» select to add one, the control 32 px high, no layout shift; «+» only with two or more compatible candidates.
7. Binder: proposes one attribute; `profileBinder.ts` unchanged.
8. `simCheckToProblems.ts` untouched before the freeze (ticket).
9. Order: this branch starts after the outputs merge (done).

The discovery measured a silent failure: today's engine reads a list value as one pointer, the guard text comes back `null` and counts as `true`. Every reader of the four keys moves in one commit, each with a test. The `.smv` generation is out of scope. The four demo scenes bind at most one attribute per role: their dialogs and runs must read as today.

## DOVE

The files listed in the discovery's plan (10 code files, 6 test files), no critical-zone file, nothing in the `.smv` exporter. Closure: `docs/log-inbox/simulation.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (§6, Rule 11, §21.2, the SCSS and naming rules), `docs/PROTOCOL.md` P16, RC-20..RC-22, RC-33, R-SIM-17, R-SIM-24, R-SIM-38, R-SIM-89, R-SIM-90, and the discovery end to end. Grep every new identifier and CSS class before introducing it.
2. Baseline: typecheck count, vitest of `src/model/simulation` and `src/components/editor-v2/sim` (counts).
3. Tests first (red before, green after): codec (one, many, duplicates, bad value), engine (union of actions, conjunction of guards, an attribute not carried contributes `true` or no assignment, the silent-failure case), `else` (point 3), double assignment with two attributes, verdicts (worst element), dialog (tags and «+», keyboard, accessible names, no «+» with fewer than two compatible candidates).
4. Implement, one commit per layer (codec and `NetStc`, engine, verdicts, dialog), each green.
5. Gates: `npm run typecheck` (14, the known set), the two vitest folders green, the full vitest with its known reds unchanged (name them), `npm run build`, `check:docs`, `check:addonly`.
6. Crops for the chat (light theme only, RC-23), at `sips -Z 600`, under `docs/discovery/harness/_tmp_multi_*.png` (gitignored): the Entry row of a metamodel with two compatible candidates, before and after adding the second attribute; the same row on the DemoESM scene (no «+»). Use a lane probe on port 3039 (`lane-run probe`), never 3001.
7. Commits as above, then one docs commit with the log entry and this prompt's Status. Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the counts, the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, dark-theme work, a new dependency.

## RIFERIMENTI

- `docs/decisions.md` R-SIM-90, R-SIM-89; the discovery of P-2026-09-28-2306; the R-SIM-89 tests (`bindingCompat.test.ts`, `actionEvaluator.test.ts`).
