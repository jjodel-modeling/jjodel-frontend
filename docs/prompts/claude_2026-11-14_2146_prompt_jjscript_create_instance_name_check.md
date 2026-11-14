# JjScript: `create instance` checks the name, so a script cannot create instances it cannot address

Prompt-ID: P-2026-11-14-2146
Chat: C-2026-11-12-1346
Front: maintenance
Lane: full, two phases (Phase 1 discovery read-only with a saved report and a hard stop; Phase 2 the fix, after the chat's GO)
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R4bYnjEzX4r18SudeG Alfonso, chat of 2026-11-14 21:35: "fixa il problema" on ticket #938, found by the third part of the external review of the Jjodel book
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-create-instance-name`, branch `create-instance-name`, cut from `alfonso-frontend-jjtl` at the
commit that adds this prompt. Model and tier as pinned (RC-16), effort `xhigh`. Before anything else: `pwd`, branch,
`git log -1` and `git status` are as stated here. Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-11-14-2146 · session <id>]`; every final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 90 minutes. Grep and read the parts you need, never
cat whole large files or logs. If the session nears its context ceiling, write the report first, then the handoff with
the six headings `## Task`, `## Scope`, `## Decisions taken`, `## Evidence`, `## Current diff`, `## Remaining checks`.
No push, no merge. The critical zone (`useJjomSync.ts`, `portDistribution.ts`) is out of scope: if the fix seems to
need it, stop and say so.

## The problem

The resolver of instance names in JjScript searches all the instances of the model, roots and contained alike, and
refuses a name borne by two of them with `AMBIGUOUS_INSTANCE`. `rename instance` checks the new name against the whole
model. `create instance` checks nothing. A script can therefore create two instances with one name, and no later
command (`set`, `delete instance`, `rename instance`, a reference by name) can address either of them. The canvas
refuses two instances with the same name in one container. Evidence: probes of book lane P-2026-11-14-2100, report
`author/discovery/discovery_2026-11-14_gpt_review_third_part.md` in the book repository (`~/jjodel-book-w-book32`),
section on finding 12.

## The decision (chat, on Alfonso's "fix the problem")

`create instance` refuses a name that another instance of the model already bears: the same scope and the same check
as `rename instance`, and the same error it gives. Reason: JjScript addresses an instance by its bare name over the
whole model, so the only names a script may give are those it can later resolve. The scope of the canvas (the
container) is narrower and would leave the problem open for two instances in different containers. Nothing is created
when the command is refused, and the message names the instance that already bears the name.

Not in this lane: changing the resolver (qualified names), changing what the canvas checks, changing M2 commands.

## Phase 1, discovery (read-only)

Establish from the code, with file and line:

1. Where `create instance` is parsed and executed, on every path it has (script run, Jjodie's Apply, the preview or
   dry run that shows effects before applying, a `do ... end` body, a `forall ... do` body, a batch).
2. How it names the instance: the quoted name, and what happens when no name is given (generated names: can they
   collide with an existing one?).
3. What `rename instance` checks, in which function, with which error code and message; whether that function can be
   called by `create instance` as it is.
4. What the canvas checks when an instance is created or renamed there, and in which scope.
5. Within one script: two `create instance` with the same name in the same run, before anything is committed to the
   model. Does the check see the instances the script has just created (preview state included)?
6. What breaks: tests, smoke scripts, examples, Jjodie prompt texts and documentation scripts that create two
   instances with the same name today. List each with file and line, and say for each whether it relies on the
   duplicate or merely happens to have it.
7. The M2 side for comparison only (`create class` and friends): do they check, and how.

Save the report as `docs/discovery/discovery_2026-11-14_create_instance_name_check.md` (the folder exists; this naming
is mandatory): objective, files read with full paths, findings, dependencies and risks, the exact change proposed for
Phase 2 (files, functions, the test cases to add), open questions for Alfonso. Commit the report alone. Then stop with
`Outcome: hard-stop` and a summary: the chat reads the report and answers with a GO or a correction. Do not start
Phase 2 on your own.

## Phase 2, after the GO

Implement the decision with the minimal change: call the existing check from `create instance` (or the smallest shared
helper, without renaming any existing identifier); the check also sees the instances created earlier in the same run.
Tests: a duplicate of an existing instance is refused and nothing is created; a duplicate inside one script is refused
at the second command; two different names pass; a generated name never collides; `rename instance` unchanged. Update
the JjScript SPEC or command reference where it describes `create instance` and the error catalogue, in English.
Gates: typecheck, the JjScript tests, the build. Touch only the files the report listed; anything more, ask first.

## Closure

Commits with explicit files only (never `git add .`), subjects within 72 characters (`fix:` for the code, `docs:` for
the report and the log). Entry in the maintenance log per P16, closing ticket #938, after the chat's GO on the visual
line: the check is visible in the Console and in Jjodie's script panel, so the final message says exactly what to run
there to see the refusal.

## REFERENCES

- Ticket #938 in `docs/log-inbox/maintenance.md`
- Book repository: `author/appendix-jjscript.tex`, sections on names, errors and current limitations (it describes
  today's behaviour and will be updated by the chat after this lane)
