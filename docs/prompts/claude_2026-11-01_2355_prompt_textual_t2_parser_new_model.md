# Textual syntax T2: the textual entry of a model, the parser, «New model from text» (R-TXT-16..24)

Prompt-ID: P-2026-11-01-2355
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: full (inline discovery with a file list before any change, then Phase 2; UI change authorised by Alfonso 2026-11-01 23:44)
Depends: T1 (P-2026-11-01-2320, merged by P-2026-11-01-2349); decisions R-TXT-16..24; addendum §A.4, §A.5, §A.7 (step T2)
Worktree: ~/jjodel-w-textt2, branch textual-t2 (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, 2026-11-01 23:44 (R-TXT-23) and 23:50 «ok», /lane auto

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-textt2` on
`textual-t2`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-2355 · session <id>]`.
No subagents, no background tasks. Read `docs/decisions.md` section R-TXT (rows 16-24) and the module
`frontend/src/codegen/textual/` first. Keep context low: print only what a decision needs.

## COSA

1. **Parser.** A hand-written interpreter of the concrete grammar of T1 (C-like style), with recovery (R-TXT-21 (1)),
   producing the model input shape T1's printer takes (`{id, cls, slots}`, references by name resolved after the
   parse, R-TXT-4/11). Round trip on T1's corpus: print, parse, print gives the same text. Errors with line and column
   («expected an integer; found name "four"»). The port reference is `~/.jjodel-lanes/P-2026-11-01-2232/probe/parser.mjs`.
2. **The textual entry** (R-TXT-23): in the toolbar's viewpoint picker, next to the viewpoints and «Data manager», a
   synthetic entry labelled with the language's name (the metamodel's name by default), built on the pattern of
   `frontend/src/components/editor-v2/dataManagerOption.ts` (a sentinel value intercepted before any viewpoint write,
   never a fake `DViewPoint`). It opens a dock tab with the model's text in Monaco, printed by T1, **read-only** in this
   step (editing an existing model is T6). The tab can also show the concrete EBNF, read-only.
3. **«New model from text»**: an action on the metamodel (find where its other model actions live) that opens the same
   tab on an empty, editable text. On each pause in typing the text is parsed; errors show as Monaco markers; recovered
   objects are never applied (R-TXT-21 (8)). A «Create model» button, enabled only when the text parses without
   errors, creates the model through JjScript `create`/`set` lines via the existing guard, planner, preview and
   `applyAsOneStep`, in one undo step (R-TXT-19). The new model's diagram uses the default layout.

Not in this lane: applying edits to an existing model (T6), annotations (T4), other styles (T5), style checks (T3).

## DOVE

Inline discovery first: list every file you will create or change, with one line on why, in the log entry and in your
first message, before writing code (rule for more than 3 files). Expected: new files in `frontend/src/codegen/textual/`
(parser and its tests) and a new tab component; changes to the picker (`Toolbar.tsx` and the option module), the dock
registration, and the metamodel menu. Check every new identifier, class name and CSS class with a global search
(project rule). No change to `useJjomSync.ts` or `portDistribution.ts` (critical zone): if one is needed, stop with
`Outcome: question`. No new dependency.

## COME

Tests first for the parser (round trip on the corpus, error positions, recovery never applied). Then the UI. Monaco is
already a dependency; follow how existing Monaco tabs (generators, JjScript) are mounted. Design tokens and Bootstrap
Icons only, 11 px labels, no layout shift. The JjScript lines for creation are tested on a fixture (the model created
from the printed text of a model equals that model up to ids).

## Lane discipline

`git add <specific files>` only. Commits `feat(codegen): textual parser (P-2026-11-01-2355)` and `feat(ui): textual
entry and New model from text (P-2026-11-01-2355)`. Gates: `npx tsc --noEmit` (baseline), `npx vitest run src/codegen`
plus the tests of every touched folder, `npm run build`, `npm run check:docs`. Visual check on a probe port (30xx, not
3000/3001/3003), four crops under the lane folder: the picker with the textual entry; the tab with a model's text; a
broken text with its markers; the diagram of a model created from text. Log entry in `docs/log-inbox/codegen.md` and
the `Status:` flip of this prompt (edit the line directly) in one docs-only commit. No push, no merge. End with
«Decisions taken (unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
