# Textual syntax T4a: syntax annotations as data, applied by the derivation (R-TXT-16 level 3, R-TXT-21 (2), R-TXT-25 (12))

Prompt-ID: P-2026-11-02-0846
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: full, Phase 2 (design in addendum §A.3 of `docs/discovery/discovery_2026-11-01_textual_viewpoint.md`); no UI in this slice
Depends: T1, T2, T3 and the path change of P-2026-11-02-0652 on the trunk; decisions R-TXT-16..26
Worktree: ~/jjodel-w-textt4, branch textual-t4 (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, 2026-11-02 06:43 and 08:34; T4 is split (RC-52): T4a data and derivation, T4b the form

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-textt4` on
`textual-t4`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-0846 · session <id>]`.
No subagents, no background tasks. Read only: `docs/decisions.md` R-TXT-16..26, addendum §A.3 and §A.7 (T4), and
`frontend/src/codegen/textual/`. Keep context low.

## COSA

1. **The annotation record**, plain data, stored in the metamodel's `_state` keyed by element id, one record next to
   the generators (R-TXT-21 (2)): the nine annotations of §A.3 (feature keyword, one-line class, positional class,
   enumeration-subset grouping, binary operator with symbol and precedence, default-name pattern with an optional
   segment, inline containment, string printed as identifier, plus any the addendum lists), the top-level restriction
   override (R-TXT-24 (a)), and the **language name** (R-TXT-25 (12)). Reading and writing go through one small API;
   find how generators are stored on the metamodel and follow it.
2. **The derivation applies them**: base grammar plus style plus annotations gives the concrete grammar; printer and
   parser (T1, T2a) follow without other changes; T3's style check runs on the annotated grammar and refuses an
   annotation that makes it ambiguous, with the reason (R-TXT-21 (4): grouping only on a mandatory attribute).
3. **The textual entry's label** uses the language name when set (T2b falls back to the metamodel's name today).
4. **Acceptance, read-only, outside the repo**: with annotations written in a test fixture, the C-like style reproduces
   the prototype's 16 `.brief` files (`~/Downloads/micron-proto/`, the two comment lines excepted, R-TXT-21 (9)); copy
   nothing from that folder into the repo; report the result in the log entry.
No form or editor for annotations in this slice (T4b).

## DOVE

New files in `frontend/src/codegen/textual/` (annotations, their application, tests); the storage helper next to where
generators are stored on the metamodel (find it, one file); the label in `dataManagerOption.ts` or the opener. List the
files in your first message. No change to `useJjomSync.ts` or `portDistribution.ts`. If more than 6 files, stop with
`Outcome: question`.

## Lane discipline

`git add <specific files>` only. Commit `feat(codegen): textual syntax annotations (P-2026-11-02-0846)`. Gates:
`npx tsc --noEmit`, `npx vitest run src/codegen`, `npm run build`, `npm run check:docs`, `npm run check:codegen-lazy`.
Visual check not applicable (no UI beyond the label; say so). Log entry in `docs/log-inbox/codegen.md` and the
`Status:` flip (edit the line) in one docs-only commit. No push, no merge. End with «Decisions taken (unattended)»,
«Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
