# JjScript name resolution: discovery (Phase 1, read-only)

Prompt-ID: P-2026-09-23-1600
Chat: C-2026-09-23-1600
Status: eseguito 2026-09-23 · session 2a2c8148-b9bb-4734-8afe-a505da854491 · 9ae6d942b

## COSA

Phase 1 discovery, read-only, on how the JjScript executor resolves class names. No code changes. The output is a discovery report and nothing else.

A user script run on a project where `metamodel_1` already contains a class `Book` produced four defects. The script, executed into `metamodel_2`:

```
# Library metamodel — step 1: bibliographic work vs physical copy

# The bibliographic work (title-level concept)
create class Book
create attribute title in Book type String
create attribute isbnCode in Book type String

# The physical exemplar on the shelf
create class BookCopy
create attribute inventoryNumber in BookCopy type String
create attribute shelfLocation in BookCopy type String

# A Book owns its physical copies (containment, 0..*)
create containment copies in Book type BookCopy [0..*]
```

Observed behaviour, reproduced by Alfonso:

1. The run stops with the dialog "Execution stopped at line 7". The failing command is on source line 14; 7 is its command index (comments and blank lines are not counted). "6 commands executed" is consistent with the command index.
2. The error reads `Ambiguous 'Book': metamodel_2::Book, metamodel_2::Book. Qualify as Metamodel::Name.` The real candidates are `metamodel_1::Book` and the `metamodel_2::Book` just created by command 1. Both candidates are printed with the same prefix, so the suggested fix cannot work as printed. The error text also does not wrap and overflows the red box horizontally.
3. `create containment copies in metamodel_2::Book type metamodel_2::BookCopy [0..*]` fails with `Unknown type 'metamodel_2::BookCopy' for reference 'copies'. Expected a class. 'metamodel_2::BookCopy' is not a class reachable from this metamodel`, although `BookCopy` was created by command 4 of the same run.
4. `create containment copies in metamodel_2::Book type BookCopy [0..*]` succeeds.

Working hypothesis (to confirm or refute, not to assume): there are two distinct resolvers. The container lookup (`in X`) parses `::` but searches every metamodel in the project with no preference for the target one. The type lookup (`type X`) searches a restricted, reachability-based scope but does not parse `::`, so it looks up the whole qualified string as a simple name. The ambiguity message builds the prefix from a shared value (target or active metamodel) instead of each candidate's own owner.

## DOVE

Start from the JjScript parser/executor and follow the calls. Locate with a global search, do not assume paths:

- the handler for `create containment` / `create reference` and `create attribute ... in X`
- every function that resolves a class name from a string (search for the literal messages `Ambiguous '`, `Qualify as Metamodel::Name`, `is not a class reachable from this metamodel`, `Unknown type '`)
- the code that decides which metamodel a script writes into ("target", "current", "active" metamodel, whatever it is called)
- the code that produces "Execution stopped at line N" and "N commands executed", and the dialog component that renders the error box

## COME

Read every function body you cite. Do not draw conclusions from function names. For each claim of absence (for example "the type resolver never splits on `::`"), include in the same invocation a positive control proving the search would have found it (a search that does hit a known occurrence), with properly quoted patterns.

Answer these questions in the report, each with file path and line numbers:

- Q1. How many name resolvers exist for class names in JjScript? For each: entry point, callers, the scope it searches (whole project, target metamodel, reachability set), whether it handles `Metamodel::Name`.
- Q2. What exactly is "this metamodel" in the reachability message? How is the reachability set computed? Does it include classes created earlier in the same run?
- Q3. Where does the ambiguity message take the `Metamodel::` prefix from? Show the expression that yields `metamodel_2` for the `metamodel_1` candidate.
- Q4. Does the executor have a notion of the target metamodel available at resolution time? If yes, where and how is it passed; if not, where would it have to come from.
- Q5. How are created classes identified during a run (temporary `DObject.new()` IDs versus persisted IDs)? Could any resolver see the same class twice, or miss a class created earlier in the run?
- Q6. Where does the line number in the dialog come from? Is the source line of each command already available (parser positions, token offsets) or would it have to be tracked?
- Q7. Error box overflow: which component and which style rule prevent wrapping.

Also list the tests that currently cover name resolution, if any.

Do not propose a fix yet. The report may end with a short "options" section describing where a single resolver with the rule "target metamodel first (including classes created in this run), then other metamodels, ambiguity only among non-target candidates, `::` honoured everywhere" would plug in, and what it would touch. The design decision stays with Alfonso.

### Discovery report (mandatory)

Save the report as `docs/discovery/discovery_2026-09-23_jjscript_name_resolution.md` (add `_N` if the name exists). Minimum content: objective, files read with full paths, findings per question Q1 to Q7, dependencies and risks, open questions for Alfonso. Phase 1 is not complete until the report is written.

### Scope

Read-only on all source files. The only files you may create or modify:

- `docs/discovery/discovery_2026-09-23_jjscript_name_resolution.md`
- `docs/claude-code-log.md` (one entry)
- this prompt file, only to update the `Status` line

Out of scope: any change to the parser, executor, resolvers, dialog, styles, tests. No refactoring, no renaming.

### Stop and ask

Stop and ask Alfonso if the resolution path touches a critical-zone file (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`), or if the observed behaviour cannot be matched to code (for example the messages are not found by the search).

### Lane discipline

At the end of the work, in the same docs-only commit as the log entry, replace `Status: da eseguire` in this file with `Status: eseguito <date> · <session> · <sha of the report commit>`. Alfonso will later append the outcome of his review. If you receive this prompt with a `Status` that already says `eseguito`, stop and say so.

Commit with surgical staging (`git add` on the three files above, never `git add .`), message:

```
docs: discovery on JjScript class name resolution (P-2026-09-23-1600)
```

## HARD STOP

After the commit, stop. Do not start Phase 2. Reply with the report path, the commit sha, and a five-line summary of the answers to Q1 to Q4.

## RIFERIMENTI

- CLAUDE.md (two-phase discipline, discovery report, log entry format)
- `docs/claude-code-log.md`
- Invariant: DObject.new() IDs are temporary
- Invariant: function names are not function bodies
