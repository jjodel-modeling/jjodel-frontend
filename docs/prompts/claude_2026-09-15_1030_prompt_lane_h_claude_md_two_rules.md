# Lane H: two process rules in CLAUDE.md (static tests, scope-file for regenerated artifacts)

Date: 2026-09-15 10:30
Type: docs (CLAUDE.md + its regenerated AGENTS.md + log)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: medium

## COSA

Add two process rules to `CLAUDE.md`, both learned during the 2026-09-14 parallel lanes.

1. Static source-text tests. A test that asserts against the source text of a file (a substring/regex on the source rather than a behavior) is allowed only when a mutation bench demonstrates its effectiveness on the commented-out variant. Rationale: during lanes A2/A3/A4 the mutation bench repeatedly unmasked source-text tests that pinned a substring instead of a behavior and survived real mutations. If a behavior cannot be exercised because the file is not importable in the bench (`window is not defined`), the gap is stated in the log entry; a source-text test is not a substitute.

2. Scope-file for regenerated artifacts. When a prompt's file scope includes a file whose change triggers a regeneration rule (for example `CLAUDE.md` → `AGENTS.md` under §17), the regenerated artifact must be named in the scope too, so the lane is never forced to choose between the scope and the rule. Rationale: on 2026-09-14 the lane F prompt scoped only `CLAUDE.md`; §17 required regenerating `AGENTS.md`; the lane had to violate either the scope or the rule.

## DOVE

`CLAUDE.md`. Read the file and place each rule in the most fitting existing section, without restructuring:
- rule 1 near the testing / verification discipline (the section with §5 positive-control / signal guidance, or the mutation-bench discussion if present);
- rule 2 near the scope-of-changes / prompt-conventions rules for Claude Code (the "Scope delle modifiche" area or the prompt-file scope rules).
If a clearly better location exists, use it, but do not reorganize the document.

Then regenerate `AGENTS.md` (§17). This is in scope for this lane.

## COME

- English, imperative, no filler, no em dashes, matching the surrounding style.
- Each rule is a short paragraph or a couple of lines, not a new top-level section unless the file's convention makes that natural.
- Run `npm run check:agents` and `npm run check:docs`; both must pass.

## Parallel-lane discipline

Other Claude Code sessions may run in this tree; their dirty files are expected, never touch them. Assert `git rev-parse --abbrev-ref HEAD` prints `validation-skeleton` before writing. Stage only `CLAUDE.md`, `AGENTS.md`, and the log. `docs/claude-code-log.md`: write your entry only at the end, before the docs commit, and stage it only if `git diff docs/claude-code-log.md` shows your entry alone.

Commits:
1. `docs: static-test and scope-file rules in CLAUDE.md` (CLAUDE.md + AGENTS.md)
2. `docs: log entry for lane H`

Report in chat: which section each rule landed in, and that both checks passed.

## RIFERIMENTI

- `docs/sessioni/sessione_2026-09-14.md` and the current session file: decisions of 2026-09-12 (A4, mutation bench), 2026-09-14 (lane F / AGENTS.md conflict)
- `CLAUDE.md` §5 (verification, positive control), §17 (AGENTS.md regeneration), the scope-of-changes rules
- `docs/claude-code-log.md`: lane A2/A3/A4 entries (static tests unmasked), lane F entry (AGENTS.md flagged)
