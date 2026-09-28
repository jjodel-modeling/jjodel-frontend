# Lane C: type resolution in `set ... type`, `create parameter`, `createReference`

Date: 2026-09-14 16:31
Type: fix, two-phase with a conditional gate (see below)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh

## Parallel-lane discipline (applies to this whole prompt)

This lane runs concurrently with other Claude Code sessions in the same working tree (simulation engine; lane B on the Jjodie files under `frontend/src/ai/`; lane D on `ProjectEditor.tsx`; possibly a docs-only lane on `CLAUDE.md`). Their uncommitted files are expected in `git status`. Never touch, stash, checkout or revert them. Never switch branch.

- Before any write, assert `git rev-parse --abbrev-ref HEAD` prints `validation-skeleton`. Otherwise stop and report.
- Read `CLAUDE.md` and `docs/claude-code-log.md` first.
- Stage only the files this prompt names, with `git add <path>`. Never `git add .`, `-A` or `-u`.
- `docs/claude-code-log.md` is shared. Write your entry only at the very end, immediately before your docs commit. Before staging it, `git diff docs/claude-code-log.md` must show only your entry; if another lane's uncommitted entry is present, do not commit the log: report and leave it.
- Gates: `tsc --noEmit` baseline on this branch was 33 at `26d04febc`; other lanes' dirty files may move it, so report the total, then 0 errors in each touched file, with a positive control that has signal. Tests for the touched test files. Build.
- Cherry-pick to `alfonso-frontend-jjtl` is not part of this prompt.

## COSA

Three JjScript sites still resolve a type name by a path that ignores the rules established in lane A (exact match first, admissible kinds per command, ambiguity across metamodels reported with qualified names, unknown type is an error):

1. `set <el> type <X>` (`set.ts`, around line 272): resolves an enum through its own path, project-wide, without kinds, with a string fallback.
2. `create parameter ... type <X>` (`create.ts`, around line 733): silently discards a non-primitive type.
3. `createReference`: does not pass kinds to `selectTarget`, so a reference type can match a non-class.

Bring the three onto the same helper as `create attribute ... type <X>` (`resolveEnumTypeTarget` in `resolvers.ts`, commit `39c5bf4ab`), generalized to the admissible kinds of each command.

## DOVE

- `frontend/src/jjscript/executor/resolvers.ts` (`resolveEnumTypeTarget`, `selectTarget`, `ambiguityMessage`, `QUALIFY_ADVICE`)
- the `set` command file (`set.ts`, locate under `frontend/src/jjscript/executor/`)
- the `create` command file (`create.ts`, same folder): `create parameter` and the reference creation path (`createReference`)
- the existing test file(s) for `resolvers.ts` under the same tree (locate with `grep -rln resolveEnumTypeTarget frontend/src`)

Do not touch `frontend/src/model/nameLookup.ts`, `LModelElement.tsx`, anything under `frontend/src/ai/`, or `ProjectEditor.tsx`.

## COME

### Phase 1: discovery (read-only, report mandatory)

For each of the three sites document: the current lookup (pool, kinds, exact or case-insensitive, first match or all), the behavior on unknown type, on a homonym across two metamodels, and on a primitive (`int`, `EString`); the return shape expected by the caller; whether the caller can be exercised in the bench (`vitest`, `environment: 'node'`; `create.ts` and `set.ts` were not importable on 2026-09-12 because of `window`, verify whether that still holds).

Save `docs/discovery/discovery_2026-09-14_type_resolution_kinds.md` (objective, files read with full paths, findings, risks, open questions).

Conditional gate. If the discovery confirms the three behaviors as described in COSA, finds no additional caller of the same paths, and the change is contained in the files listed in DOVE, proceed to Phase 2 without stopping. If any of these fails (a fourth site, a caller outside `jjscript/executor`, a return shape that forces an interface change, a semantic doubt), stop after the report and ask in chat.

### Phase 2: implementation

Target behavior, same for all three sites:

- Resolution goes through one helper in `resolvers.ts`. Extend `resolveEnumTypeTarget` with an admissible-kinds parameter, or add a sibling `resolveTypeTarget(ctx, name, kinds)` that `resolveEnumTypeTarget` delegates to. Do not rename `resolveEnumTypeTarget`; it has a live caller in `create attribute`.
- Admissible kinds: attribute type via `set` = enumerators (primitives handled as today, before the lookup); parameter type = enumerators and classes, plus primitives; reference type = classes only.
- Exact match first, then case-insensitive, as in `selectTarget`. Exact plurality across metamodels raises the A1 ambiguity with the qualified payload and message (`Ambiguous 'X': A::X, B::X. Qualify as Metamodel::Name.`), reusing `ambiguityMessage`, not a new string.
- Qualified input `Metamodel::X` resolves within that metamodel (already supported by `selectTarget`; verify it is reachable from the helper).
- Unknown type is an error that skips the line, with `success: false`. No string fallback, no silent `EString`, no silent discard. This is the decision of 2026-09-11 (a false success is not a working script). Saved projects are not touched.
- No changes to existing TypeScript interfaces except optional additions.

Tests: behavior tests on the helper in the existing `resolvers.ts` test file (importable): exact-first, ambiguity payload, qualified input, unknown type, each admissible-kinds set. For the three callers, if the file is not importable in the bench, do not add source-text (substring) tests; state the gap in the log entry instead. If it is importable now, add behavior tests for the three commands.

Commits, in this order, each with the specific paths:

1. `fix: resolve types through admissible kinds in set, create parameter and createReference` (code + tests)
2. `docs: log entry for lane C` (log only, see discipline)

Then stop. Report in chat: the helper signature you ended up with, the three call sites (file:line), the test counts, and the gates. Visual verification by Alfonso follows on localhost: `set age type Mood` with `Mood` in two metamodels (ambiguity), `create parameter p in op type Person` (class resolved), `create reference r in A to Mood` (rejected, not a class).

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-11_attribute_enum_type.md` and commit `39c5bf4ab` (the pattern to extend)
- `docs/discovery/discovery_2026-09-11_name_resolution_scope.md` (inventory)
- `docs/claude-code-log.md`: entries of A1 `a52dfe5f3` (ambiguity rule, `ambiguityMessage`) and A4 `dc5f8d3aa`
- Decisions of 2026-09-11 and 2026-09-12: unknown type is an error; primitives written bare in ambiguity payloads; one ambiguity rule for all callers
- `CLAUDE.md`: minimal diff, no renaming, log never amended in place
