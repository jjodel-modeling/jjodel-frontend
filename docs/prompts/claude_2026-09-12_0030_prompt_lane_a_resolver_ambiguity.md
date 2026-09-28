# Lane A: three resolver fixes (A2, A3, A1), three separate commits

Date: 2026-09-12
Type: fix (three commits)
Mode: implementation only; discovery already done in `docs/discovery/discovery_2026-09-11_name_resolution_scope.md` (read it first, §5 for P3-d, §7 for the `DModel.new` sites, §9 for the `selectTarget` probe). Reuse its probe method; do not redo the inventory.
Gate: starts only after the visual check of `39c5bf4ab` and its cherry-pick onto `alfonso-frontend-jjtl`.

Read `CLAUDE.md` and `docs/claude-code-log.md` before starting. If anything here contradicts `CLAUDE.md`, stop and report.

Decisions already taken in chat on 2026-09-11 (do not reopen them):

- Qualifier is `::` (`Metamodel::Element`). `.` stays member access. No grammar change.
- Two spellings are deliberate: `::` for input syntax and error messages; `.` in `fullname` and the metaclass chip is display and is not touched here.
- Ambiguity applies on BOTH branches (exact-case homonyms and case-insensitive plurality) for ALL callers, restricted or not. This pays the debt declared in `7bacbd63c`. The 9 unrestricted callers stay unrestricted on kinds only.
- Order: A2, A3, A1. A1 depends on A3.

## A2: `_impl_getByName` case-insensitive fallback must not mutate the collection

**COSA.** `LModelElement.tsx` `_impl_getByName` (line ~5869 on the current branch; verify): the case-insensitive fallback rebinds the collection entry, so after one lookup of `$person` the collection answers `Person` for every later lookup (P3-d in the discovery report). The lookup must be pure: same collection before and after, whatever the spelling asked.

**COME.** Minimal change: compute the fallback match without writing back into the collection. Keep the exact-first-then-case-insensitive order and the return value. Test: build a collection, call `getByName` twice with a case-variant spelling, assert the collection is deep-equal to its pre-call snapshot after each call and that both calls return the same element. Test lives where the existing `LModelElement` tests live; if none exist under the node bench, put it beside the resolver tests with a synthetic collection and say so in the log.

**Commit.** `fix: make getByName case-insensitive fallback side-effect free`

Hard stop after commit and log entry; wait for ACK before A3.

## A3: metamodel-name uniqueness for `DModel.new`

**COSA.** `LModel.set_name` (`LModelElement.tsx:5623-5631`) refuses a taken name and stays as it is. `DModel.new` (12 call sites, listed in the discovery report §7) bypasses uniqueness. Rule to implement, inside `DModel.new` only, no caller changes: when the requested name is already taken by another metamodel in the same project, auto-suffix with the existing convention for duplicate model names (`A`, `A (1)`, `A (2)`; reuse the counter logic of `Constructors.defaultname` at `joiner/classes.ts:1455` if it applies as is, otherwise implement the same `(n)` scheme next to it, no new naming style). Comparison is exact-case, consistent with `nameUniqueness.ts`.

**COME.** Tests: two `DModel.new` with name `A` in one project yield `A` and `A (1)`; a third yields `A (2)`; `set_name("A")` on `A (1)` still refuses; `DModel.new` with a free name is untouched. Verify with a grep that no call site relies on the returned name being identical to the requested one (report any that does; if one exists and would break, stop and report before committing).

**Commit.** `fix: auto-suffix duplicate metamodel names in DModel.new`

Hard stop after commit and log entry; wait for ACK before A1.

## A1: ambiguity on exact-case plurality in `selectTarget`, qualified payload

**COSA.** `resolvers.ts` `selectTarget` (`:233` on the branch at discovery time: `if (exact.length > 0) return exact[0]`). Exact-case plurality among admissible candidates is an ambiguity, not a first-match. `ambiguousWith` stays `string[]` but every entry is metamodel-qualified `Metamodel::Name`, on both branches (exact-case homonyms and case-insensitive plurality). Message: `Ambiguous '<name>': A::Person, B::Person. Qualify as Metamodel::Name.` A qualified input (`A::Person`) resolves in that metamodel only and never reports ambiguity across metamodels. Applies to all callers, restricted or not; no opt-in, no special-casing.

**COME.**

1. Add the exact-plurality branch; qualify `ambiguousWith` entries with the owning metamodel name (the metamodel is unique after A3). Keep the existing four command messages and the 31 + 10 tests green; update the assertions that encoded the old unqualified payload (report which ones changed and why).
2. Tests, resolver-level: two metamodels each with class `Person`, unqualified lookup → ambiguity with `A::Person, B::Person`; `A::Person` → resolves; case-insensitive plurality still reports, now qualified; one unrestricted caller (`show`) exercised on both branches; the member-backtracking rule from `12a318b3a` still holds (exact-case admissible candidate with a missing member fails, does not backtrack).
3. Mutation bench: at least one mutant that restores `return exact[0]` and one that drops the qualification; both must be killed.
4. If any of the 9 unrestricted callers turns out to need first-match for a real reason, stop and report that caller with the reason; do not special-case it.

**Commit.** `fix: report ambiguity on exact-case homonyms in JjScript target resolution`

Hard stop after commit and log entry.

## Constraints for all three

- Touch only the files named per item plus tests, discovery-report addendum if needed, and the log. No renaming, no adjacent refactoring, no new dependencies, no interface changes beyond optional additions.
- `git add` specific files only; code and docs in separate commits; on `validation-skeleton`, to be cherry-picked onto `alfonso-frontend-jjtl` after the visual check of the whole lane.
- Each log entry: prompt document name `2026-09-12 00:30`, item letter in the title, `Regressions: unknown` until the visual check.
- Declared debt to carry forward in the A1 entry, not to fix here: `set <el> type <X>` (`set.ts:272`), `create parameter` non-primitive type (`create.ts:733`), `createReference` passing no kinds, and the remaining "pass a scope" and "report ambiguity" sites of the inventory, which become lane B (Jjodie `findClassByName` scope) and later lanes.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-11_name_resolution_scope.md` (§5, §7, §9, §12)
- `docs/discovery/discovery_2026-09-11_jjscript_target_resolution.md` (§4 command-to-kind table)
- Commits `7bacbd63c`, `12a318b3a`, `39c5bf4ab` and their log entries
- `nameUniqueness.ts:511` (R-M2U-2: classifier names unique per metamodel, free across metamodels)
