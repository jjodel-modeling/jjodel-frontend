# Codegen: textual syntax discovery, second session (continues P-2026-11-01-2210 after the context ceiling)

Prompt-ID: P-2026-11-01-2232
Chat: C-2026-11-01-1713
Front: codegen
Status: eseguito 2026-11-01 · lane textual-syntax-discovery · addendum in docs/discovery/discovery_2026-11-01_textual_viewpoint.md · verifica visiva non applicabile
Lane: discovery (read-only; probes outside `src/`; one addendum, one docs-only commit)
Depends: P-2026-11-01-2210 (hard-stop at the context ceiling, RC-51; nothing committed)
Worktree: ~/jjodel-w-textsyntax, branch textual-syntax-discovery (the same tree as 2210, at the commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · RC-51: a session stopped at the context ceiling continues as a new lane

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-textsyntax` on
`textual-syntax-discovery`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-2232 · session <id>]`.
No subagents, no background tasks. No change under `frontend/src/`.

## What to read

The prompt of the first session, `docs/prompts/claude_2026-11-01_2210_prompt_textual_syntax_design_discovery.md`
(its questions 1 to 7 are the questions of this lane), `docs/decisions.md` section R-TXT, and the handoff
`~/.jjodel-lanes/P-2026-11-01-2210/handoff.md` with the probes in `~/.jjodel-lanes/P-2026-11-01-2210/probe/`. Do not
re-read the whole codebase: start from the handoff. Copy the probes to `~/.jjodel-lanes/P-2026-11-01-2232/probe/` and
work there.

## What is left

Measured by 2210 and only to re-run quickly (one command each, output in the addendum): base grammar plus C-like style
on the 1709 fixture matches the JjGen generator byte for byte; the 16 Briefs round-trip with the hand-written
interpreter in C-like, Pascal and indentation; nearley finds exactly one parse on the 19 samples.

To do:
1. **ohm-js:** at most 20 minutes on why every sample fails at the first feature. If not solved in that time, report
   the isolated cause as far as found and move on.
2. **Errors and recovery** on a broken input for the hand-written interpreter and nearley: show one message each, and
   what each recovers from a partly broken text.
3. **Parse time** on a generated model of 1,000 objects, for the interpreter and nearley (and ohm if it works).
4. **Monaco decorations:** a small probe outside `src/` (Monaco is already a dependency) showing whether decorations
   on printed spans survive typing, cut and paste, and undo; or, if a probe is not feasible in the time, the answer
   from Monaco's documented `deltaDecorations`/`stickiness` behaviour, said as such.
5. **The addendum** at the end of `docs/discovery/discovery_2026-11-01_textual_viewpoint.md`, headed `## Addendum:
   textual syntax from the metamodel (P-2026-11-01-2210, P-2026-11-01-2232)`, answering questions 1 to 7 of the 2210
   prompt: the concrete grammars of CoreSpec and ArbiterSpec in full, the style definitions, the annotation set (with
   the three new ones 2210 found: default-name pattern, inline containment, string printed as identifier), the
   JjScript gaps for R-TXT-19 (no id addressing, `move` only on M2, no reorder), the plan in steps, and the questions
   for Alfonso with one recommendation each. Replace «JjEL generator» with «JjGen generator» where the report names the
   generator (R-TXT-15).

Keep context low: print only what a finding needs (`head`, `tail`, `grep`), never whole files you already know from
the handoff.

## Lane discipline

`git add` the report, the log entry in `docs/log-inbox/codegen.md`, the `Status:` flip of this prompt and of the 2210
prompt (2210: `Status: eseguito 2026-11-01 · hard-stop at the context ceiling, continued by P-2026-11-01-2232`), in one
docs-only commit `docs(codegen): textual syntax addendum (P-2026-11-01-2210, P-2026-11-01-2232)`. No push, no merge.
End with «Decisions taken (unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
