# Prompt: the event class is derived from Trigger (R-SIM-38)

Prompt-ID: P-2026-09-25-1500
Chat: C-2026-09-25-1500
Lane: fast (M2 panel and one pure helper; no exported interface changes, one export added)
Status: da eseguire

Worktree: a new one, `~/jjodel-events`, on a new branch `sim-event-trigger` from the trunk. Setup, in this order, each a hard stop if it fails: from `~/jjodel`, `git worktree list` shows no `jjodel-events` and no branch `sim-event-trigger`; `git -C ~/jjodel worktree add ~/jjodel-events -b sim-event-trigger alfonso-frontend-jjtl`; `cd ~/jjodel-events`; `pwd` is `/Users/alfonso/jjodel-events`; `git log -1` reads `docs: ratify R-SIM-38 and add prompt P-2026-09-25-1500` (if the trunk has moved past it, stop and say so). Every commit of this lane goes on `sim-event-trigger`. The merge into the trunk is a separate step, not this lane's.

**Parallel lanes.** `P-2026-09-25-1440` runs in `~/jjodel-open` (port 3003) and `P-2026-09-25-1445` in `~/jjodel-sim` (port 3002). Do not touch `~/jjodel-release`, `~/jjodel-sim`, `~/jjodel-open`, `~/jjodel-gate`, `~/jjodel`, `~/jjodel-harness`, nor any server you did not start. Never work by absolute path on another worktree.

**Environment (P14).** This tree has no `node_modules`: create the temporary symlink `frontend/node_modules -> ~/jjodel/frontend/node_modules`, name it in the report, and at the end remove it only after checking it did not exist when the lane started. The Vite cache is `frontend/.vite-cache` of this tree. Dev server on **3004**, from this tree only; check with `lsof -nP -iTCP:3004 -sTCP:LISTEN` that the port is free first.

Single phase with one hard stop (step 7, visual check by Alfonso).

## COSA

The Events group of the M2 face of the Simulation panel has three selects: Event (a metaclass), Trigger (a reference), Event identifier (an attribute). Event is redundant: it is the declared type of the Trigger reference. Three independent fields also admit incoherent bags (Event = `A`, Trigger typed `B`). R-SIM-38 (read it whole in `docs/decisions.md` before anything else, together with R-SIM-12 and R-SIM-16) fixes the rule:

- The event role is configured by **Trigger alone**. The event metaclass is the declared type of the Trigger reference, **derived at every read of the bag, never stored**.
- An abstract type is fine: events are the instances of its concrete subclasses through the engine's `isKindOf` (`netCompile.ts:130` already uses `kind(id, stc.event)`). No override to restrict to a subclass.
- Trigger is a reference only (today's `kind: 'reference'` already enforces it). Multiplicity > 1 means any-of (already the engine's behaviour, `triggersOf` in `netCompile.ts`).
- Event identifier stays optional, default `name` (`objectLabel` in `objectSlots.ts` already falls back to `name`).
- `simEvent` is no longer written. A value already in a bag is ignored, no migration. The "half-set event role" state disappears.

Wanted in the end: the Events group shows **Trigger**, then a read-only row **Event class** with the derived class name (or an explanatory text when Trigger is unset), then **Event identifier** with placeholder `name (default)`. The engine, the M1 face, the event buttons and the overlap rules behave exactly as if `simEvent` had been set to the Trigger's type.

## DOVE

Expected files (list them again after step 2, before editing; a file not here is a stop-and-ask):

- `frontend/src/model/simulation/netCompile.ts` (or a new small module in `model/simulation/`, your choice, stated in the report): one new pure exported function that takes the bag and the lookup and returns the bag with `simEvent` replaced by the derived class id (removed when Trigger is unset or its type does not resolve to a class). Working name `withDerivedEventRole`; name check first.
- `frontend/src/components/editor-v2/sim/simBridge.ts`: `startRun` (line ~165) and `runSignature` (line ~208) read the derived bag.
- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: `mapStateToProps` (line ~595) builds `roles` from the derived bag; `ROLE_GROUPS` Events keys become `['simTrigger', 'simEventIdentifier']`; the read-only Event class row; `writeRole` computes the overlap verdict on the derived roles after the write (a change of Trigger changes the event class, and the overlap check must see it); `eventRole` becomes `!!(roles.simEvent && roles.simTrigger)` on derived roles (unchanged expression, derived input); remove the `eventGap` / `missingEventRoles` use.
- `frontend/src/components/editor-v2/sim/simRoleStatus.ts`: the `simEvent` entry leaves `ROLE_SPECS` only if nothing else iterates `ROLE_SPECS` to read the bag (check; if `mapStateToProps` loops on `ROLE_KEYS` derived from `ROLE_SPECS`, keep the key readable and hide it from the panel instead, and say which you did); `missingEventRoles` is deleted with its tests; the `simEventIdentifier` placeholder becomes `name (default)`.
- Tests: `model/simulation/__tests__/` for the new function; `components/editor-v2/sim/__tests__/simRoleStatus.test.ts` and `simBridge.test.ts` adjusted.
- Closure (docs): this prompt's Status line and the entry in `docs/log-inbox/simulation.md`.

Out of scope: restricting the Trigger options to the references of the arc/transition class (a ticket, not this lane); any change to `netStcFromRoles`' signature, `NetStc`, the engine, `stcFromRoles.ts` rules (they receive derived roles, their code stays); `docs/decisions.md`.

## COME

1. Preconditions, hard stops: setup above done; `git status` empty; read `CLAUDE.md`, `docs/PROTOCOL.md` P13/P14, the tail of `docs/claude-code-log.md`, and R-SIM-8, R-SIM-12, R-SIM-16, R-SIM-37, R-SIM-38.
2. Short discovery, read-only, saved as `docs/discovery/discovery_2026-09-25_sim_event_from_trigger.md` (mandatory even if short): how a `DReference` stores its type in `idlookup` (field name, pointer or object; how an inherited or proxied type shows); every read of `simEvent` or of the `sim*` bag in `frontend/src` (grep `simEvent`, `_state`, `ROLE_KEYS`, `netStcFromRoles`), with the file:line list; whether `runSignature` already changes when the Trigger reference's type changes in the metamodel (through the `buildValidationSignature` part) or needs the derived class added; the trunk totals of `npx vitest run` and `npm run typecheck` before any edit. Stop and ask if the type is not a single resolvable class pointer, or if more than the files in DOVE read the bag.
3. Name check (CLAUDE.md) for the new function name: `command grep -rn -e 'withDerivedEventRole' --exclude-dir=node_modules frontend/src` finds nothing.
4. Tests first for the new function: Trigger unset (no `simEvent` in output, stale `simEvent` in input removed); Trigger typed to a concrete class; typed to an abstract class (the abstract id is returned, `isKindOf` does the rest); Trigger id not in the lookup or typed to a non-class (removed); input bag not mutated. One panel-level test that a bag with a stale `simEvent` of another class yields events of the Trigger's type.
5. Edits as in DOVE. Minimal diff, no renames, no opportunistic changes. The read-only row reuses the existing row and label classes of the panel (`sim-panel__row`, `sim-panel__label`); no new CSS class unless unavoidable, and then name-checked. Text when Trigger is unset: `Set Trigger to enable events.` Text when the type does not resolve: `The Trigger reference has no class type.`
6. Measure: `npm run typecheck` (the §17 set, unchanged count), `npm run build` exit 0, `npm run check:docs`, `npx vitest run` (trunk total from step 2 plus the new tests, stated before running). `git status` shows only the DOVE files and the report.
7. **Hard stop.** Commit the report and the code (`git commit -- <paths>`; new files `git add <path>` first), subject `feat(sim): derive the event class from the Trigger reference (P-2026-09-25-1500)`, body with the measurements, `Model:` trailer. Start the dev server on 3004 from this tree. Then tell Alfonso what to check on `http://localhost:3004/` after a hard refresh: (a) in the StateMachine metamodel the Events group shows Trigger, the derived Event class row and Event identifier, and no Event select; (b) setting Trigger to `Transition.event` shows `Event` as event class; (c) in an M1 model the event buttons are the same as before and fire the same arcs; (d) clearing Trigger leaves only the ε step. Wait for his answer.
8. After his OK, the closure commit (P13, RC-17): Status flipped to `eseguito 2026-09-25 · lane sim-event-trigger · <code sha> · verifica visiva passata <date>`, entry in `docs/log-inbox/simulation.md` (CLAUDE.md §21.2 format; `Layer Impact Report: not-required`; one Ticket for restricting the Trigger options to the arc class). Subject `docs: close the event-from-trigger lane (P-2026-09-25-1500)`. Remove the temporary symlink under the P14 rule. Stop the 3004 server.
9. Closing report opening with `[P-2026-09-25-1500 · session <id>]`: the shas, the measurements, the files touched, the symlink state, the branch state (not merged, not pushed).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, touching another worktree or a server on 3000..3003.

## RIFERIMENTI

- `docs/decisions.md`: R-SIM-8, R-SIM-12, R-SIM-16 (and its «Esecuzione» note, any-of), R-SIM-37, R-SIM-38.
- `frontend/src/model/simulation/netCompile.ts` (`netStcFromRoles`, `ROLE_KEYS`, `eventAlphabet`, `triggersOf`); `objectSlots.ts` (`objectLabel`); `stcFromRoles.ts` (`ROLE_SORTS`, `roleWriteVerdict`).
- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx` (`ROLE_GROUPS`, `writeRole`, `groupOpen`, `mapStateToProps`, `eventSigOf`); `simRoleStatus.ts`; `simBridge.ts` (`startRun`, `runSignature`).
- `docs/PROTOCOL.md` P13, P14.
