# JjScript: fix target resolution for `in <Target>` (case-insensitive match picks wrong element kind)

Date: 2026-09-11
Type: fix
Mode: two-phase (discovery read-only, hard stop, then scoped implementation)

Read `CLAUDE.md` and `docs/claude-code-log.md` before starting. If anything in this prompt contradicts `CLAUDE.md`, stop and report the conflict.

## COSA (what)

A JjScript script fails on `create literal HAPPY in Mood` with:

```
Cannot create literal in attribute 'mood'. Literals can only be added to enums
```

The script contains, earlier, `create attribute mood in Scene type String`, and later `create enum Mood`. The enum is created (it appears empty in the diagram), but all four `create literal ... in Mood` lines are skipped. Root cause (to be confirmed in Phase 1): the resolver for the target after `in` performs a case-insensitive lookup over all model elements and returns the first match, which is the attribute `Scene.mood` created before the enum `Mood`. The lookup is not restricted to the element kinds admissible for the command.

Expected behavior after the fix:

1. The target lookup of each command is restricted to the admissible element kinds. `create literal ... in X` searches only enums. `create attribute ... in X`, `create reference ... in X`, `create containment ... in X` search only classes. Apply the same principle to every other `in <Target>` command found during discovery (delete, rename, set, etc.), based on what each command can legitimately operate on.
2. Within the admissible kinds, an exact (case-sensitive) name match wins. A case-insensitive match is used only as a fallback when no exact match exists. If the fallback produces more than one candidate, fail with an explicit ambiguity error listing the candidates instead of picking the first.
3. Error messages stay explicit. When no target is found among the admissible kinds, the message must say what kind was expected, for example: `Enum 'Mood' not found. Literals can only be added to enums.` Keep the wording of existing messages where they are still accurate; do not rewrite unrelated messages.

The reproduction script is in the RIFERIMENTI section. After the fix it must execute with zero skipped lines and the enum `Mood` must contain HAPPY, CALM, PLAYFUL, ALERT.

## DOVE (where)

Unknown until discovery. Start from the literal error string: run a global search for `Cannot create literal in attribute` (and, if that exact string is built dynamically, for `Literals can only be added to enums`). From there, locate:

- the JjScript command parser/executor (expected under `src/ai/` or a dedicated JjScript folder; do not assume, verify);
- the function that resolves the target name after `in` (the one doing the case-insensitive lookup);
- every command that calls that resolver;
- existing unit tests for JjScript, if any (their location and runner).

Do not modify anything in Phase 1.

## COME (how)

### Phase 1: discovery (read-only)

1. Find the code paths listed in DOVE. Read the resolver and every call site in full.
2. Confirm or refute the hypothesis: is the lookup case-insensitive? Is it unrestricted by element kind? Is the result the first match in insertion order?
3. Check whether the resolver is also used by Jjodie (the conversational assistant) or by any other consumer outside JjScript. If so, list those consumers: they are affected by the change.
4. Check how element names are compared elsewhere in the codebase for name resolution (for example in JjEL or JjTL) so the fix stays consistent with the rest of the platform. Report, do not change.
5. Write the discovery report to `docs/discovery/discovery_2026-09-11_jjscript_target_resolution.md`. Minimum content: objective, files read (full paths), findings with the exact code excerpt of the resolver, list of commands using `in <Target>` and the element kinds each should admit, other consumers of the resolver, risks, open questions for Alfonso. If `docs/discovery/` does not exist, create it.

**HARD STOP.** Phase 1 is not complete until the report is written. Do not start Phase 2 until Alfonso gives an explicit go-ahead in chat after reading the report.

### Phase 2: implementation (only after go-ahead)

1. Modify the resolver (or add a kind-aware variant next to it, if changing the signature would break other consumers) so that:
   - it accepts the set of admissible element kinds;
   - it returns the exact-case match when one exists among admissible kinds;
   - otherwise it falls back to a case-insensitive match, failing with an ambiguity error when more than one candidate matches;
   - it returns a not-found error naming the expected kind otherwise.
2. Update every `in <Target>` command to pass its admissible kinds. The table of command to kinds comes from the discovery report.
3. Add a test that executes the reproduction script below through the JjScript executor and asserts: zero skipped lines, zero errors, enum `Mood` with four literals, attribute `Scene.mood` of type String still present, attribute `Animal.animalMood` typed with the enum. Add a second, minimal test for the ambiguity case (two enums differing only by case, literal added with a third spelling) if the platform allows two such enums to coexist; if it does not, note it in the log and skip the test.
4. Run the existing test suite and `npm run build`. Both must pass.
5. Stage only the files you touched (`git add <specific files>`, never `git add .`). Commit message: `fix: restrict JjScript target lookup to admissible element kinds, prefer exact-case match`.
6. Append an entry to `docs/claude-code-log.md` following the existing format (date, type, prompt summary, files touched, outcome, notes, prompt document name `2026-09-11 10:15`).

### Scope constraints

- Touch only the resolver, its call sites inside JjScript, the new tests, the discovery report and the log. Nothing else.
- No renaming of existing identifiers, no refactoring of adjacent code, no changes to TypeScript interfaces beyond adding optional properties if strictly needed.
- No new dependencies.
- Before introducing any new exported function, type or constant, grep the codebase to ensure the name is not already in use.
- If the fix requires touching Jjodie's code paths or anything under the critical zone listed in `CLAUDE.md`, stop and report instead of proceeding.

## RIFERIMENTI (references)

Reproduction script (must execute cleanly after the fix):

```
create class Scene
create attribute title in Scene type String
create attribute mood in Scene type String
create attribute timeOfDay in Scene type String

create abstract class Creature
create attribute name in Creature type String
create attribute age in Creature type int
create attribute posture in Creature type String

create class Human extends Creature
create attribute outfitColor in Human type String
create attribute hasBeard in Human type boolean

create class Animal extends Creature
create attribute species in Animal type String
create attribute breed in Animal type String
create attribute furColor in Animal type String
create attribute isDomesticated in Animal type boolean

create enum Mood
create literal HAPPY in Mood
create literal CALM in Mood
create literal PLAYFUL in Mood
create literal ALERT in Mood
create attribute animalMood in Animal type Mood
```

Observed output on the current branch: lines with `create literal ... in Mood` are skipped, each with the error `Cannot create literal in attribute 'mood'. Literals can only be added to enums`. Enum `Mood` is created but empty.

Working branch: `alfonso-frontend-jjtl`.
