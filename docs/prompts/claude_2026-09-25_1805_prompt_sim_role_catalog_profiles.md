# Prompt: simulation role catalog and profiles, pure module (R-SIM-47..55)

Prompt-ID: P-2026-09-25-1805
Chat: C-2026-09-25-1759
Lane: full (more than 3 files)
Status: eseguito 2026-09-25 · lane simulation · 0834329e4

Worktree: `~/jjodel-sim`, branch `simulation-engine`. Before anything else: `pwd` is
`/Users/alfonso/jjodel-sim`, branch `simulation-engine`, `git log -1` is the commit that adds this file
(subject `docs: add prompt for the simulation role catalog and profiles (P-2026-09-25-1805)`),
`git status` empty. Otherwise stop.

**The decisions live on the trunk, not on this branch.** R-SIM-47..55 were ratified on
`alfonso-frontend-jjtl` (`b5e977907`) after this branch forked from it. Read them with
`git show b5e977907:docs/decisions.md` (section «Ratifiche 2026-09-25: catalogo dei ruoli e profili»)
and the memo with
`git show b5e977907:docs/ratifiche/claude_2026-09-25_1759_memo_simulation_roles_profiles.md`, whole,
before writing code. R-SIM-38 (event class derived from Trigger) is on the trunk as well
(`git show b5e977907:docs/decisions.md`, section «la classe evento si deriva dal trigger»). Do not
merge or cherry-pick the trunk into this branch.

**Parallel lane.** `P-2026-09-25-1500` (event trigger) runs in `~/jjodel-events` on port 3004 and
edits the M2 side of the simulation panel. Disjoint perimeter: this lane touches only new files under
`frontend/src/model/simulation/`. Do not touch any other tree or any server you did not start.

## COSA

A pure TypeScript module, no React, no store, nothing wired, nothing persisted: the catalog of the
simulation roles (R-SIM-47), the profiles with their modes, parameters and constraints (R-SIM-47,
R-SIM-49), the computed set of required roles and the checkability verdict (R-SIM-48), the eight
system profiles (R-SIM-54) and the codec of the `simProfile` bag key with the reconstruction of a
«Custom» profile from a bag without it (R-SIM-55). This is the data the future «Simulation roles»
modal reads; the modal, the binding compatibility check (type, owner, multiplicity) and the engine
changes for Accepting, outputs and Activity final are later lanes.

### Catalog (R-SIM-47, memo table «Catalogo e dipendenze»)

One `RoleId` per row. `key` is the bag key; `null` for a role with no key of its own.

| RoleId | group | key | kind | dependsOn |
|---|---|---|---|---|
| node | general | `simNode` | class | |
| initial | general | `simInitial` | class | node |
| initialMarking | general | `simInitialMarking` | intAttribute | node |
| terminal | general | `simTerminal` | class | node |
| accepting | general | `simAccepting` | class | node |
| activityFinal | general | `simActivityFinal` | class | node |
| bound | general | `simBound` | int | |
| transition | general | `simTransition` | class | |
| ownedTransitions | controlFlow | `simOwnedTransitions` | reference | node, transition |
| source | controlFlow | `simSource` | reference | transition |
| nextState | controlFlow | `simNextState` | reference | transition |
| fork | controlFlow | `simFork` | class | node |
| join | controlFlow | `simJoin` | class | node |
| arc | petri | `simArc` | class | |
| arcSource | petri | `simArcSource` | reference | arc |
| arcTarget | petri | `simArcTarget` | reference | arc |
| arcWeight | petri | `simArcWeight` | intAttribute | arc |
| inhibitorArc | petri | `simInhibitorArc` | class | arc |
| trigger | events | `simTrigger` | reference | transition |
| event | events | `null` (derived from `trigger`, R-SIM-38) | derived | trigger |
| eventIdentifier | events | `simEventIdentifier` | attribute | trigger |
| guard | data | `simGuard` | expressionAttribute | transition |
| action | data | `simAction` | actionListAttribute | transition |
| entry | data | `simEntry` | actionListAttribute | node |
| exit | data | `simExit` | actionListAttribute | node |
| stateAttributes | data | `null` (declarations, R-SIM-19) | declarations | |
| stateOutput | output | `simStateOutput` | attribute | node |
| transitionOutput | output | `simTransitionOutput` | attribute | transition |

Each descriptor also carries an English `label` for the UI («Owned transitions», «Next state», …) and
a one-line English `description`. The keys `simAccepting`, `simActivityFinal`, `simAction`, `simEntry`,
`simExit`, `simStateOutput`, `simTransitionOutput` are new and provisional (R-SIM-52, like R-SIM-32);
nothing reads or writes them in this lane. The key `simEvent` is not in the catalog (R-SIM-38).

### Profiles (R-SIM-47, R-SIM-49, R-SIM-54)

A profile: `id`, `name`, `system: boolean`, optional `basedOn` (system profile id), `shape`
(`controlFlow | petri`), a mode for **every** RoleId (`edit`; `derived` with `value` or `from` and a
`note`; `off` with a `reason`), `params` (`bound: number`, `selector: 'list'`), `constraints`
(`noEpsilon | deterministic | singleToken`, identifiers only in this lane) and `addedRequired: RoleId[]`.

Runnability closure (R-SIM-48, not negotiable): `controlFlow` requires node, transition, nextState,
initial and one of source or ownedTransitions (an «either» requirement: satisfied when at least one is
bound; report it as one missing item naming both); `petri` requires node, transition, arc, arcSource,
arcTarget, initialMarking. `required(profile)` is the closure plus `addedRequired`.

The eight system profiles. «Active» means `edit`; every role not listed is `off`, with the reasons
«Not used by <profile name>» or, for the petri group in control-flow profiles, «Compiled from control
flow». In every control-flow profile `bound` is `derived` (value 1) and `initialMarking` is `derived`
(note «1 on Initial»). `event` is `derived` (from trigger) wherever `trigger` is active, `off`
elsewhere.

| id | name | shape | active beyond the closure | addedRequired | constraints | bound |
|---|---|---|---|---|---|---|
| `petri` | Petri net (P/T) | petri | arcWeight, inhibitorArc, bound, terminal | | | edit (default 1) |
| `flowchart` | Flowchart / Activity | controlFlow | guard, terminal, activityFinal, fork, join, action, entry | | | 1 |
| `stateMachine` | State machine | controlFlow | trigger, eventIdentifier, guard, terminal | | singleToken | 1 |
| `extendedStateMachine` | Extended state machine | controlFlow | trigger, eventIdentifier, guard, terminal, action, entry, exit, stateAttributes | | singleToken | 1 |
| `dfa` | DFA | controlFlow | trigger, eventIdentifier, accepting | trigger, accepting | singleToken, noEpsilon, deterministic | 1 |
| `nfa` | NFA | controlFlow | trigger, eventIdentifier, accepting | trigger, accepting | singleToken | 1 |
| `moore` | Moore machine | controlFlow | trigger, eventIdentifier, stateOutput | trigger, stateOutput | singleToken, noEpsilon, deterministic | 1 |
| `mealy` | Mealy machine | controlFlow | trigger, eventIdentifier, transitionOutput | trigger, transitionOutput | singleToken, noEpsilon, deterministic | 1 |

In the petri profile, `initial` is `off` (reason «Petri shape uses Initial marking», R-SIM-28) and the
closure roles are `edit`. In every control-flow profile the closure roles are `edit`.

### Functions

- `requiredRoles(profile)`: the required set, with the either-item.
- `validateProfile(profile)`: a list of defects, empty when valid. Defects: a closure role not `edit`
  or `derived`; an active role of the other shape's group; an active role whose `dependsOn` has a role
  `off`; a `derived` role with neither `value` nor `from`; an empty or blank name; a user profile whose
  name equals a system profile name (case-insensitive, trimmed). With one `simProfile` key per
  metamodel this is what «unique in the metamodel» reduces to. Every system profile validates.
- `checkability(profile, bag, verdicts?)`: `{ status: 'checkable' | 'warnings' | 'notCheckable',
  missing: … }`. A role is bound when its key holds a non-empty string (the filter of
  `stcFromRoles.ts`); `derived` roles count as bound; `verdicts` is an optional map
  `RoleId → 'ok' | 'warn' | 'incompatible'` supplied by the future compatibility check, absent meaning
  `ok`. Any `incompatible` makes it `notCheckable`.
- `encodeProfile(profile)` / `decodeProfile(value)`: the `simProfile` value is the system id for a
  system profile, the JSON of the user profile otherwise; decode returns `null` on anything malformed
  or on an unknown id, never throws.
- `inferCustomProfile(bag)`: for a bag without `simProfile`: shape `petri` if `simArc` is set,
  `controlFlow` otherwise (R-SIM-31(4)); every role whose key is set is `edit`; the closure roles of
  the shape are `edit`; `bound` and `initialMarking` as in the control-flow system profiles when the
  shape is control flow; everything else `off` with reason «Not bound». Name «Custom», `system: false`.
  It must validate; if a bag sets keys of both groups, the other group's roles stay `off` and the
  result carries the list of ignored keys.

## DOVE

New files only, all under `frontend/src/model/simulation/`:

- `roleCatalog.ts`: `RoleId`, the descriptor type, the catalog constant, the dependency lookups.
- `simProfiles.ts`: the profile types, the eight system profiles, `requiredRoles`, `validateProfile`,
  `checkability`.
- `profileCodec.ts`: `encodeProfile`, `decodeProfile`, `inferCustomProfile`.
- `__tests__/roleCatalog.test.ts`, `__tests__/simProfiles.test.ts`, `__tests__/profileCodec.test.ts`.

Name check before creating anything: `command grep -rnE "roleCatalog|simProfiles|profileCodec|SYSTEM_PROFILES|simProfile|RoleId" frontend/src`
must print nothing; paste the command and its output in the report, together with a positive control
(`command grep -rn "stcFromRoles" frontend/src` must print at least one line). A hit on the first
command is a stop.

Out of scope: every existing file (including `stcFromRoles.ts`, `netCompile.ts`, `simBridge.ts`,
the panel and `SimulationPanel.tsx`), the engine, the modal, the compatibility check, the validation
viewpoint generation, `VersionFixer.tsx`, every critical-zone file, `docs/decisions.md`.

## COME

1. Baseline: `npm run typecheck`, `npx vitest run`, `npm run build`, `check:docs`, `check:scripts`.
   State the expected numbers before running, then record the measured ones.
2. Tests first, red, then the code. The tests must cover: catalog ids unique and every `dependsOn`
   pointing to an existing id, dependency graph acyclic; every key of the catalog that is not in the
   «new» list above appears as a string literal in `frontend/src/model/simulation/` or
   `frontend/src/components/editor-v2/sim/` (read the files, do not import the panel); the eight system
   profiles valid and complete (a mode for every RoleId); `requiredRoles` for each system profile as a
   table-driven test against the table above; each `validateProfile` defect with one failing
   profile; a user profile that drops a closure role is rejected; `checkability` on an empty bag,
   a complete control-flow bag, a complete petri bag, a bag with source only, with ownedTransitions
   only, with neither, and with one `warn` and one `incompatible` verdict; codec round-trip for a
   system and a user profile; `decodeProfile` on `''`, `'{'`, an unknown id and a JSON with a missing
   mode; `inferCustomProfile` on an empty bag, a control-flow bag, a petri bag and a bag with keys of
   both groups.
3. Implement. Minimal, typed, no `any` in exported signatures, no dependency, English comments.
4. Gates on the code commit: typecheck as the baseline, vitest the baseline plus the new tests with
   0 failed, build exit 0, `check:docs` and `check:scripts` as the baseline. `git diff --stat` of every
   path outside the six files above is empty.
5. Code commit, pathspec after `--` with the six files, subject
   `feat(sim): role catalog and simulation profiles (P-2026-09-25-1805)` (within §6.2), body with
   baseline, gates, name check, `Model:` trailer.
6. No visual check (pure module, nothing wired). Closure commit right after the code commit (P13,
   RC-17): the entry in `docs/log-inbox/simulation.md` (CLAUDE.md §21.2; Layer Impact Report: none,
   no existing file touched; `Smoke visivo: non applicabile`) and the Status of this file flipped to
   `eseguito 2026-09-25 · lane simulation · <code sha>`.
7. Closing report opening with `[P-2026-09-25-1805 · session <id>]`: the two shas, the gates, any
   deviation from this prompt and any point where the ratified text and the table above disagree
   (the ratified text wins; say which). Then stop.

Stop and ask, instead of choosing, if: a table above contradicts R-SIM-47..55 as read from
`b5e977907`; an existing key in the catalog is not found in the code; a system profile cannot be made
to validate without changing the rules.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`,
`--no-verify`, `rm` of the `node_modules` symlink, a critical-zone edit, a merge or cherry-pick from
the trunk, push.

## RIFERIMENTI

- `b5e977907:docs/decisions.md`: R-SIM-47..55, R-SIM-38.
- `b5e977907:docs/ratifiche/claude_2026-09-25_1759_memo_simulation_roles_profiles.md`.
- `docs/decisions.md` on this branch: R-SIM-10, R-SIM-19, R-SIM-22, R-SIM-27, R-SIM-28, R-SIM-31,
  R-SIM-32, R-SIM-37; RC-3, RC-17.
- `frontend/src/model/simulation/stcFromRoles.ts` (the bound-key filter).
- `docs/PROTOCOL.md` P13.
