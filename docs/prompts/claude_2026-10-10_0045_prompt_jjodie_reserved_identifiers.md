# Jjodie never emits reserved identifiers: single reserved list and pre-execution gate

Prompt-ID: P-2026-10-10-0045
Chat: C-2026-10-10-0039
Lane: full (more than three files; moves a reserved-name list the JjScript lexer owns today). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-jjodiereserved`, branch `jjodie-reserved`, cut from the trunk tip that carries the docs
commit adding this prompt (on top of `0c516ef1f`), `frontend/node_modules` symlinked (P14). Before anything else:
`pwd`, branch, `git log -1` and a clean `git status`. Record the base sha in the report. Otherwise stop with
`Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-0045 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (do not redo the analysis)

Alfonso asked Jjodie to generate a metamodel. The generated JjScript named a reference `copy`, and execution
failed with an error about `copy`. He resubmitted with "do not use copy" and the app froze.

Jjodie's system prompt has a hand-maintained rule ("NEVER use JjScript reserved keywords as identifiers") with its
own list: `create`, `delete`, `rename`, `class`, `abstract`, `attribute`, `reference`, `containment`, `enum`,
`literal`, `extends`, `in`, `to`, `type`, `String`, `int`, `boolean`, `Date`. `copy` is not in it. The list has
drifted from whatever actually reserves names. A prompt instruction is also probabilistic, so a list alone cannot
guarantee anything: the guarantee has to be a check on the generated script before it runs.

Known neighbour, not this lane: the JjEL lexer looks keywords up with `in` and `[]` on plain objects
(`jjel/lexer/lexer.ts:414` and `:430`), so `toString`, `constructor` and other prototype members leak in. Record
whether the JjScript lexer has the same pattern. Do not fix it here.

The freeze is a separate defect. This lane removes its trigger, not its cause. Record what you learn about it; do
not fix it.

## WHAT

### Phase 1, read-only discovery

Hypothesis to falsify: "`copy` is reserved by the JjScript lexer, and Jjodie's output reaches the executor with no
validation step in between."

1. **Where `copy` is reserved.** Reproduce in a test or a probe: a minimal JjScript creating a class and a
   reference named `copy`. Capture the exact error and the layer that throws it. Candidates: the JjScript lexer
   keyword table, the JjEL keywords, members of the LModel/LPointerTargetable proxy (a feature named like a proxy
   method), JjTL. The answer decides what the shared list must contain. If `copy` collides at the proxy level,
   the list must include proxy-reserved member names, not only lexer keywords.
2. **Inventory of every definition of reserved names.** Both lexers, Jjodie's prompt, any validator, the
   conformance checks. For each: `file:line`, contents, case sensitivity, lookup style (`in`/`[]` on an object, or
   `Set`/`Map`). Add a table of the differences between them.
3. **Path from Jjodie's reply to execution.** The full function chain from the model response to the JjScript
   executor, with `file:line`. Is the script parsed before it runs? Is there a natural place for a gate? How is
   the model called (is there an existing helper for a follow-up turn)?
4. **Atomicity.** When a JjScript run fails halfway, does it roll back? Is any "running" flag or lock left set?
   Reproduce the two-run sequence (failing script, then a corrected one) once and say whether it hangs the main
   thread or only the Jjodie UI. Record only; this is the freeze ticket's evidence.
5. **Proposal**: the module that will hold the single list (grep the name before proposing it), and the exact
   files Phase 2 will touch.

Save the report to `docs/discovery/discovery_2026-10-10_jjodie_reserved_identifiers.md` (P4 contents: hypothesis,
goal, files read with full paths, findings with `file:line` and verbatim quotes, dependencies and risks, open
questions). The hard stop is not reached until the report is written and committed.

### Phase 2, after GO (intended design; Phase 1 may amend it)

A. **One list.** A pure module exporting the reserved identifiers (union of what Phase 1 shows is actually
   reserved for user names), as a `ReadonlySet<string>` in lowercase, with a `isReservedIdentifier(name: string):
   boolean` helper that is case-insensitive and does not walk the prototype. The JjScript lexer imports it instead
   of its own copy. Do not change *what* is reserved; only move it.

B. **Prompt generated from the list.** Jjodie's reserved-words rule is built from that module at prompt
   assembly, not typed by hand. Every reserved word appears in the rendered prompt.

C. **Pre-execution gate.** Before running a JjScript produced by Jjodie, extract every identifier the script
   *declares* (`create class|attribute|reference|containment|enum|literal <name>`, `rename ... to <name>`) and
   check it with `isReservedIdentifier`. If any is reserved:
   - do not execute anything (no partial run);
   - send one automatic repair turn to the model naming the offending identifiers and asking for a renamed
     script;
   - check the new script the same way;
   - if it still violates, execute nothing and show the user a message that lists the names.
   The repair loop is bounded to one round. Scripts the user types by hand are not affected; the executor's own
   error stays as it is.

D. **Tests first** (P-clause on tests before implementation):
   - the list contains `copy` (or whatever Phase 1 proves);
   - `isReservedIdentifier('copy')` and `('Copy')` are true, `('copyOf')`, `('toString')`, `('constructor')` are
     false unless the list reserves them;
   - the rendered prompt contains every reserved word;
   - the gate rejects a script declaring `copy` and accepts the renamed one;
   - with a mocked model that keeps answering with `copy`, the gate makes exactly one repair call and executes
     nothing.

## HARD STOP

After the Phase 1 report is committed: stop with `Outcome: hard-stop`. Phase 2 starts only on GO.

## DO NOT

- Fix the freeze, the rollback behaviour, or the JjEL prototype lookup.
- Change which names are reserved, or the executor's error messages.
- Rename a user's identifiers silently. The repair goes through the model, and the user sees it if it fails.
- Touch critical-zone files (CLAUDE.md §3.2). If Phase 1 finds the path crosses one, stop and say so.
- Add dependencies.

## REFERENCES

- `docs/PROTOCOL.md` P4, P9, P13, P14.
- `docs/spec/concern_languages.md` (identity of JjScript and JjEL, known lexer issues).
- `docs/spec/claude_spec_2026-09-08_user_defined_validation.md`: prerequisite "single list of reserved names
  imported by both lexers". This lane covers the JjScript side and Jjodie. Say in the report whether the JjEL
  lexer can import the same module now or needs its own lane.
