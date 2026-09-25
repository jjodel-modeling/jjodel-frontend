# Prompt: profiles, shape and genre are independent (R-SIM-56)

Prompt-ID: P-2026-09-25-1840
Chat: C-2026-09-25-1759
Lane: fast
Status: da eseguire

Worktree: `~/jjodel-sim`, branch `simulation-engine`. Before anything else: `pwd` is
`/Users/alfonso/jjodel-sim`, branch `simulation-engine`, `git log -1` is the commit that adds this file
and R-SIM-56 to `docs/decisions.md` (subject
`docs: ratify R-SIM-56 and add the profiles genre fix prompt (P-2026-09-25-1840)`), its parent is the
fast-forward to the trunk merge of `P-2026-09-25-1835`, `git status` empty. Otherwise stop.

## COSA

Fix the role catalog and profiles module of `P-2026-09-25-1805` (`0834329e4`) as ratified in
R-SIM-56 (read it whole in `docs/decisions.md`, together with R-SIM-28, R-SIM-48, R-SIM-54, R-SIM-55).
The closure of R-SIM-48 confused the shape with the genre: a control-flow STC of the naturals genre
(k > 1, initial marking from `simInitialMarking`, possibly no `simInitial`) is ratified by R-SIM-28,
and today its Custom profile reports Initial missing and ignores `simBound` and `simInitialMarking`.
Pure module; nothing is wired.

## DOVE

- `frontend/src/model/simulation/simProfiles.ts`
- `frontend/src/model/simulation/profileCodec.ts`
- `frontend/src/model/simulation/__tests__/simProfiles.test.ts`
- `frontend/src/model/simulation/__tests__/profileCodec.test.ts`

`roleCatalog.ts` and every other file are out of scope.

## COME

1. Baseline: `npm run typecheck`, `npx vitest run`, `npm run build`. State the expected numbers, then
   record the measured ones.
2. Tests first, red:
   - the control-flow closure is `node`, `transition`, `nextState`, `{ anyOf: [initial, initialMarking] }`,
     `{ anyOf: [source, ownedTransitions] }`; the Petri closure is unchanged;
   - in every control-flow system profile `initial` is `edit`, `initialMarking` is `derived` with
     `from: 'initial'` and note «1 on Initial», `bound` is `derived` with value 1 (unchanged);
   - `checkability`: a `derived` role with `from` counts as bound only when its source role is bound;
     a `derived` role with `value` counts as bound. Cases: a control-flow system profile on a bag
     without `simInitial` reports the Initial either-item missing (today it would pass through the
     derived Initial marking); `event` derived from an unbound `trigger` is not bound;
   - `inferCustomProfile` on a control-flow bag: `simBound` set → `bound` `edit` and `params.bound`
     from the bag; `simInitialMarking` set → `initialMarking` `edit`; neither key is in
     `ignoredKeys` any more; a bag with `simInitialMarking` and no `simInitial` gives a profile that
     validates and whose `checkability` has no Initial item missing; a bag with neither gets
     `initialMarking` `derived` from `initial` and `bound` `derived` 1, as today;
   - every system profile still validates, and `requiredRoles` for each system profile matches the
     updated closure (table-driven test updated, not deleted).
3. Implement with minimal diffs. The Ticket paragraph of `a14c7dfa8` in `docs/log-inbox/simulation.md`
   is closed by this lane: say so in the new entry, do not edit the old one.
4. Gates: typecheck as the baseline, vitest the baseline plus or minus the changed tests with 0
   failed, build exit 0. `git diff --stat` outside the four files is empty.
5. Code commit, pathspec after `--`, subject
   `fix(sim): profile closure separates shape and genre (P-2026-09-25-1840)`, body with baseline and
   gates, `Model:` trailer. No visual check. Closure commit right after (P13, RC-17): the entry in
   `docs/log-inbox/simulation.md` (Layer Impact Report: none; `Smoke visivo: non applicabile`) and
   the Status of this file flipped to `eseguito 2026-09-25 · lane simulation · <code sha>`.
6. Closing report opening with `[P-2026-09-25-1840 · session <id>]`: the two shas, the gates, any
   deviation. Then stop.

Stop and ask if a system profile cannot keep validating, or if the change requires touching
`roleCatalog.ts`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`,
`--no-verify`, a critical-zone edit, push.

## RIFERIMENTI

- `docs/decisions.md`: R-SIM-28, R-SIM-47..56.
- `0834329e4`, `a14c7dfa8` (the lane being fixed and its Ticket paragraph).
- `docs/PROTOCOL.md` P13.
