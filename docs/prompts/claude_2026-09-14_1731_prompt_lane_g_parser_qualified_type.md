# Lane G: qualified type names parse in create / returnType

Date: 2026-09-14 17:31
Type: fix (scoped), two-phase with a conditional gate
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: high

## Context

Lane C (`3e3ab691a`) routed type resolution for `set`, `create attribute`, `createReference`, `createOperation`, `createParameter` through `resolveTypeTarget`, which accepts a qualified `Metamodel::Name`. But the qualified type path is reachable end-to-end only via `set`, because in the `create` family the parser hands a `QualifiedName` object to `parseTypeReference(raw: string)` behind an `as string` cast. So `create attribute age in C type MM::Mood` does not parse. Fix the parser so a qualified type name reaches `parseTypeReference` as the string it expects (or so `parseTypeReference` accepts a `QualifiedName`), whichever is the smaller, safer change.

## Parallel-lane discipline

Other Claude Code sessions may run in this tree (in particular lane B2 in the Jjodie area and `create.ts`). Their uncommitted files are expected; never touch them. Assert `git rev-parse --abbrev-ref HEAD` prints `validation-skeleton` before writing. Stage only the files this prompt names, `git add <path>`, never `git add .`/`-A`/`-u`. `docs/claude-code-log.md`: entry at the end only, staged only if `git diff` shows your entry alone. If a CLAUDE.md rule forces regenerating an artifact (§17 → `AGENTS.md`), stage that artifact in the same commit and note it. Cherry-pick is not part of this prompt.

This lane must not modify `create.ts` (lane B2 may be editing it). The fix belongs in the parser and, if needed, in `parseTypeReference`'s own file. If Phase 1 finds the fix unavoidably requires editing `create.ts`, stop and report instead of proceeding.

## DOVE

- `frontend/src/jjscript/parser/parser.ts` around `:352` (type) and `:404` (returnType): `parseTypeReference(this.expectIdentifierOrQualified('type name') as string)`
- `expectIdentifierOrQualified` (same file): what it returns (a `QualifiedName`? a token? a string?)
- `parseTypeReference`: locate its definition (`grep -rn "function parseTypeReference" frontend/src`), read its signature and body, and `qualifiedNameToString` in `grammar.ts` (a `QualifiedName` → `Metamodel::Name` serializer already exists)
- the parser test file (`grep -rln parseTypeReference frontend/src` and the parser's own tests)

Do not touch `create.ts`, `set.ts`, `resolvers.ts`, anything under `services/` or `frontend/src/model/`.

## COME

### Phase 1: discovery (read-only, report mandatory)

Establish: what `expectIdentifierOrQualified` actually returns at `:352`/`:404`; what `parseTypeReference` accepts and what it does with `::` (does it already split, or does it treat the whole string as one name?); whether `qualifiedNameToString` produces exactly the string `parseTypeReference` would accept for a qualified type; whether any other caller of `parseTypeReference` relies on the current `as string` behavior; whether the parser is importable in the bench (it is pure, likely yes, unlike `create.ts`).

Save `docs/discovery/discovery_2026-09-14_parser_qualified_type.md`.

Conditional gate: if the fix is a localized change in `parser.ts` (and optionally `parseTypeReference`'s signature to accept `QualifiedName | string`) with no `create.ts` edit and no behavior change for unqualified names, proceed to Phase 2. Otherwise stop and report.

### Phase 2: implementation

Preferred shape, smallest first:
- If `expectIdentifierOrQualified` returns a `QualifiedName`, serialize it with `qualifiedNameToString` before passing to `parseTypeReference`, at both `:352` and `:404`. This keeps `parseTypeReference`'s signature unchanged.
- Only if that loses information (a qualified type must stay structured) widen `parseTypeReference` to accept `QualifiedName | string` and handle both, keeping the string branch byte-identical in behavior.
- Unqualified type names must behave exactly as before. No renaming.

Tests: in the parser test file, add cases for `create attribute a in C type MM::Mood` and `create operation op in C returns MM::Result` (returnType) parsing to a qualified type reference, plus an unqualified control (`type int`, `type Mood`) that must be unchanged. If the parser is importable, these are real behavior tests; if not, state the gap.

Commits: `fix: qualified type names parse in create and returnType` (parser + tests + report, or report separately if committed at the gate), then `docs: log entry for lane G`.

Report in chat: which of the two shapes you used, the two `:line`s, test counts, gates. Visual verification by Alfonso: `create attribute age in Person type Mood2::Level` with `Level` in a second metamodel `Mood2` resolves the qualified enum; the end-to-end qualified type path now works for `create`, not only `set`.

## RIFERIMENTI

- Lane C report `docs/discovery/discovery_2026-09-14_type_resolution_kinds.md` and commit `3e3ab691a` (the `resolveTypeTarget` side that already accepts qualified names)
- `frontend/src/jjscript/parser/grammar.ts`: `parseQualifiedName`, `qualifiedNameToString`
- Decision 2026-09-11: `::` is input syntax; documented form `Metamodel::Element`
- `CLAUDE.md`: minimal diff, no renaming, no opportunistic refactoring
