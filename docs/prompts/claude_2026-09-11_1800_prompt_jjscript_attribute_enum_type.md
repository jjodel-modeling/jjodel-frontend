# JjScript: `create attribute ... type <Enum>` silently falls back to EString

Date: 2026-09-11
Type: fix
Mode: two-phase (discovery read-only, hard stop, then scoped implementation)
Gate: starts only after the visual check of `7bacbd63c` + `12a318b3a` and their cherry-pick onto `alfonso-frontend-jjtl` are done. Lane A (A2, A3, A1) and lane B come after this one.

Read `CLAUDE.md` and `docs/claude-code-log.md` before starting. If anything here contradicts `CLAUDE.md`, stop and report.

## COSA (what)

Found during `discovery_2026-09-11_jjscript_target_resolution.md` (§10.3): `create attribute animalMood in Animal type Mood`, with `Mood` an existing enum, returns `success: true` and creates an attribute of type `EString`. `normalizeAttributeType('Mood')` (`create.ts:69`) does not know the name and falls through `?? 'EString'`. No error, no warning. `createReference` resolves its `type` against the model; `createAttribute` does not.

Expected behavior after the fix:

1. `type <Name>` on `create attribute` resolves `<Name>` in this order: primitive type (current normalization, unchanged), then enum in the current metamodel by the same kind-aware, exact-first rule used by `selectTarget` (kinds: enumerators only; `Metamodel::Name` qualification accepted since `::` already resolves). Discovery must confirm how an enum-typed attribute is represented on `DAttribute`/`LAttribute` (pointer to the enum vs. type string) and the fix must use that representation, not a string.
2. A name that is neither a primitive nor a resolvable enum is an error: `Unknown type '<Name>' for attribute '<attr>'. Expected a primitive type or an enum.` The line is skipped like any other failed command. No silent fallback.
3. Case-insensitive plurality or exact-case homonyms among enums follow the ambiguity rule of `selectTarget` (qualified spellings in the message once A1 lands; until then, the current `ambiguousWith` payload is acceptable and must be noted in the log).
4. The same treatment applies to any other command that takes `type <Name>` for an attribute (`set ... type`, if it exists). Discovery lists them; implementation covers them only if they share the same normalization path, otherwise they are reported and left for a follow-up.

Acceptance: the reproduction script in RIFERIMENTI executes with `Animal.animalMood` typed with enum `Mood`, and `create attribute x in Animal type Nope` fails with the message above.

## DOVE (where)

- `frontend/src/jjscript/executor/commands/create.ts` (or wherever `normalizeAttributeType` lives on the current branch; verify), the attribute-creation path and any other `type` consumer.
- `frontend/src/jjscript/executor/resolvers.ts`: `selectTarget` and the kind-aware entry points from `7bacbd63c`, to be reused, not duplicated.
- The model layer: how `DAttribute.type` holds an enum (grep `EEnum`, `enumType`, `type:` on `DAttribute`, and how the Properties panel or the Ecore exporter reads an enum-typed attribute). This decides the representation.
- Existing resolver tests next to `resolvers.ts` and any `create` tests.

## COME (how)

### Phase 1: discovery (read-only)

1. Read `normalizeAttributeType` and every caller. List all commands that accept `type <Name>` for attributes.
2. Establish the representation of an enum-typed attribute in the model (file:line, with the code excerpt), and how the UI creates one, so the script path produces exactly the same shape as the UI path. If the UI path goes through a helper, the fix must call that helper.
3. Check how `createReference` resolves its `type` and whether the same resolution can be reused for enums with a kinds restriction.
4. Write `docs/discovery/discovery_2026-09-11_attribute_enum_type.md`: objective, files read, findings with excerpts, representation decision with evidence, commands affected, risks, open questions.

**HARD STOP.** Wait for go-ahead.

### Phase 2: implementation (after go-ahead)

1. Minimal change in the attribute-creation path: primitive first, then enum via the kind-aware resolver, then error. Reuse `selectTarget`; no new lookup code.
2. Resolver-level or command-level tests (whichever the bench allows without jsdom; the previous lane established that `create.ts` cannot be imported under `environment: 'node'`, so if a command-level test is impossible, test the new resolution helper in isolation and say so): enum resolved; primitive unchanged; unknown name errors; `Metamodel::Mood` resolves.
3. `npm run build` and the test suite green. `git add` specific files only. Commit message: `fix: resolve enum types in JjScript create attribute instead of silent EString fallback`.
4. Log entry in `docs/claude-code-log.md` (prompt document name `2026-09-11 18:00`), `Regressions: unknown` until the visual check.

### Scope constraints

- Touch only the attribute type path, the reused resolver entry points (no changes to `selectTarget` itself in this lane), tests, discovery report, log.
- No renaming, no adjacent refactoring, no new dependencies, no changes to TypeScript interfaces beyond optional additions.
- If the fix requires changing how `DAttribute` stores its type, stop and report: that is a core change and needs discussion.

## RIFERIMENTI (references)

Reproduction (after the fix, `animalMood` must be typed with the enum):

```
create class Animal
create attribute species in Animal type String

create enum Mood
create literal HAPPY in Mood
create literal CALM in Mood
create attribute animalMood in Animal type Mood
create attribute broken in Animal type Nope
```

Expected: 7 lines executed, 1 error on the last line (`Unknown type 'Nope' for attribute 'broken'. Expected a primitive type or an enum.`), `Animal.animalMood` typed with `Mood`.

Related: `discovery_2026-09-11_jjscript_target_resolution.md` §10.3; commits `7bacbd63c`, `12a318b3a`; decisions on `::` qualifier and ambiguity payload (A1) in chat, 2026-09-11.
