# JjScript name resolution: close the visibility lag (Phase 2)

Prompt-ID: P-2026-09-23-1752
Chat: C-2026-09-23-1600
Status: da eseguire

## COSA

Fix F-A (silent misplacement) and F-B (bound refusal at command 2) from `docs/discovery/discovery_2026-09-23_jjscript_name_resolution.md` (P-2026-09-23-1600, commit `9ae6d942b`). Read the whole report before starting; this prompt relies on its sections §Q1, §Q4, §Q5, §7 and §10.

Root cause, as measured in §Q5: the resolver engine (E1, E2 in `resolvers.ts`) draws its candidates from `LModel.classes` / `LProject.classes`, which read the per-class store index. A class created by `create class` is in `idlookup` with `father` set at +1 to 3 ms, but appears in those collections only 65 to 268 ms later. Inside that window E1 misses the new class in the target metamodel, and E2 returns the homonym in another metamodel as a unique, wrong answer. The waiter is satisfied by that homonym, and the scope guard refuses the bare name.

### Decision (ratified by Alfonso, this chat)

Fix the candidate source, not the timing. Do not add delays, do not lengthen the waiter, do not add a run-local registry on `ExecutionContext`.

The architect's chat first proposed a run-local registry (option §7-i). It is superseded by option §7-ii, an `idlookup` + `father`-chain scan, for three reasons: it has no lifetime problem (a "run" is a loop of independent `execute` calls, with no clear start or end on the executor); it covers every lagging class, not only those created by the current run; and it fixes all call sites at once, including the twelve E2-only sites, without touching them.

Concretely:

1. **One candidate helper** in `resolvers.ts` that, for a single name and a set of kinds, returns the elements found in `idlookup` whose `name` matches (the same exact and case-insensitive rules `selectTarget` applies) and whose `father` chain reaches a given `DModel` (for E1) or any `DModel` of the project (for E2). Use the idiom in `model/CLAUDE.md` §3.6 for the `idlookup` scan and the `father` walk; read it first. Return L-proxies of the same shape the collections return, so `selectTarget` is unchanged.
2. **Union, not fallback.** In the name-based legs of E1 (`resolveByNameInMetamodel`) and E2 (`resolveByName`), merge the helper's candidates with the existing collection candidates before `selectTarget`. `selectTarget` already deduplicates by `element.id` (`resolvers.ts:271-275`). A union is required: during the lag E2 does not miss, it finds the wrong unique class, so a fallback on miss would not fix it.
3. **Qualified names.** For a two-segment `Metamodel::Name`, the path walk must also see a lagging class. Apply the same union at the point where the walk resolves the last segment inside the metamodel. Keep the existing precedence (packages first, `resolvers.ts:132-136`); changing it is out of scope.
4. **No change** to `elementWaiter.ts`, `scopeGuard.ts`, `dependencies.ts`, or the call-site compositions in `create.ts` / `set.ts` / `extends.ts` / `abstract.ts`. With E1 seeing the new class immediately, the waiter, the guard and `create.ts:280-304` all get the target's class first. If your reading shows any of them does not go through E1/E2 name legs and would still see the lagging view, stop and ask.
5. **Message wording.** "is not a class reachable from this metamodel" (`create.ts:603`, `set.ts:383`) understates the search (§Q2). Replace the `neither` text in both places with wording that states what was searched, for example `is not a class in the target metamodel or elsewhere in the project`. Keep the "Unknown type" prefix and the "Qualify as Metamodel::Name if needed" tip. Update any test asserting the old text.

### Expected behaviour after the fix

With `metamodel_1::Book` existing and `metamodel_2` as target, the quoted script (in the discovery report §0) run at a 20 ms gap:

- unbound: `title`, `isbnCode`, `copies` all land on `metamodel_2::Book`; no "trying project-wide search" warning;
- bound: all seven commands succeed; no `OUT_OF_SCOPE`;
- `set`, `rename`, `delete` on bare `Book` issued while both exist: ambiguity error listing `metamodel_1::Book, metamodel_2::Book` in the unbound project-wide leg, never a silent pick of `metamodel_1::Book`. (If a site composes E1 on the target first, the target's `Book` wins; that is the intended rule.)

## DOVE

Files you may modify:

- `frontend/src/jjscript/executor/resolvers.ts`
- `frontend/src/jjscript/executor/commands/create.ts` (message text at `:603` only)
- `frontend/src/jjscript/executor/commands/set.ts` (message text at `:383` only)
- `frontend/src/jjscript/executor/__tests__/resolvers.test.ts`
- `frontend/src/jjscript/__tests__/errorFromResult.test.ts` (only if it asserts the old wording)
- `docs/claude-code-log.md`, and this prompt file (Status line only)

Anything else: stop and ask.

## COME

### Before writing

- Read `CLAUDE.md`, `frontend/src/model/CLAUDE.md` (§3.6 at least), the discovery report, and the full bodies of `resolvers.ts`, `selectTarget`, `resolveByNameInMetamodel`, `resolveByName`, `resolveByPathInMetamodel`.
- Grep the codebase for any new exported or module-level identifier you introduce before using it. Report the grep in the log entry.
- Check how `idlookup` is reached from the executor today (store access pattern) and use the existing one; do not add a new store import style.

### Tests

Add unit tests in `resolvers.test.ts` on the existing fake-object style:

- a class present in `idlookup` with `father` under `metamodel_2` but absent from `metamodel_2.classes`: E1 on `metamodel_2` resolves it;
- the same class plus a homonym indexed under `metamodel_1`: E2 on the bare name reports an ambiguity with both qualified spellings, never a unique `metamodel_1` answer;
- the same element present in both sources: exactly one candidate (dedup by id);
- `metamodel_2::Book` qualified, lagging: resolves.

Then repeat the live probe of the discovery report (§A), unbound and bound, at 20 ms and 150 ms, fresh project, setup asserted. Record per command which class received each attribute, and the fallback warnings count. Record the cost of the scan: median and max time of one E2 name lookup on the probe project, and on a project with at least 500 elements if one is at hand (state it if not).

### Gates

`tsc` clean, the jjscript test suites green, `check:docs` A, B, C green (D is known red at 43 > 40, not this lane's). Report every gate with its exit status.

### Scope out

- The twelve E2-only call sites keep their project-first composition (a global "target first" rule is a separate decision).
- V7c (silent cross-metamodel reference when the active tab is `metamodel_1`): not this lane.
- Q6 line number: code already maps to the editor line; no change.
- Q7 error box overflow: no change until Alfonso checks it on a reloaded bundle.
- `TEMP-DISCOVERY` logs, log rotation, package-name capture of `::` walks: not this lane.
- No renaming, no reordering, no refactor of E1/E2 beyond the union.

### Stop and ask

- The `idlookup` scan needs a store access that `resolvers.ts` does not already have and that would add a new dependency direction.
- The measured scan cost exceeds 5 ms median on the probe project.
- Any expected-behaviour line above does not hold after the change.
- A critical-zone file would be touched (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`).

### Commits

Surgical `git add` on the files listed above, never `git add .`.

1. Code and tests: `fix(jjscript): resolve classes from idlookup to close the index lag (P-2026-09-23-1752)`
2. Docs only: the log entry in `docs/claude-code-log.md` and the Status flip of this file to `Status: eseguito <date> · <session> · <sha of commit 1>`.

If you receive this prompt with a `Status` that already says `eseguito`, stop and say so.

## HARD STOP

After commit 2, stop. Reply with the two shas, the probe table (before/after), the scan cost, and the gate results. Alfonso does the visual check on `localhost:3000` with a hard refresh: he re-runs the Library script in Jjodie against a project where `metamodel_1::Book` exists.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-23_jjscript_name_resolution.md` (§Q1, §Q4, §Q5, §7, §10)
- `docs/prompts/claude_2026-09-23_1600_jjscript_name_resolution_discovery.md`
- `CLAUDE.md`, `frontend/src/model/CLAUDE.md` §3.6
- Invariant: function names are not function bodies; every absence claim needs a positive control
