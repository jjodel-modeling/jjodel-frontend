# Ontological instantiation, lane B: the binding editor with «Detect»

Prompt-ID: P-2026-11-08-0113
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (new pure module, a modal, one row in `Info.tsx`; no core change; Layer Impact Report: not-required, declared)
Status: eseguito 2026-11-08 · lane full · c55874212
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 00:35: «rail e dichiarazione e procedi in /lane auto»; the discovery's recommended answers adopted unattended, RC-21)
Depends: P-2026-11-08-0049
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `e138a09ca` (the
discovery report). Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome:
blocked`. Model and tier: heavy, effort `xhigh`. Alfonso's dev server runs on port 3005 from `~/jjodel-release`: do not
stop it; probe ports outside 3000, 3001, 3005, 3015.

## Lane discipline

Every reply opens with `[P-2026-11-08-0113 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 90 minutes.

- One test or probe run per call; `uptime` beside each probe; before a probe wait for the 1-minute load under 20 (one
  `uptime` per call, never a sleep over 60 s). Assets under `/tmp`.
- Code, probe and docs in separate commits (RC-13). Subjects at most 72 characters, `Model:` trailer.
- No push, no merge. No edit to `reducer.ts`, to a CLAUDE.md §3.1 or §3.2 file, or to an exported interface; if one
  becomes necessary, stop with `Outcome: question`.
- First reply: the list of files you will touch and what changes in each (rule 19), then proceed.

## Source

`docs/discovery/discovery_2026-11-08_onto_rail_binding_declaration.md` (this branch), §3.4, §3.5, §4 and **§5 lane B**:
implement lane B as written there. Decisions adopted from its §6 (recommended answers, Alfonso away, RC-21; the chat
will report them to him):
- Q3: Detect's `link` record carries the four slot roles, `valueKinds` shared with `object`, so it passes
  `checkBindings`.
- Q5: one modal, opened from the «Ontological binding…» row of `Info.tsx` «Semantic type class» (Advanced only); lane A
  will open the same modal from the rail.
- Q6: on an undecodable bag, show the decode errors and offer «Replace with detected» behind a confirmation; never a
  silent overwrite.

## Constraint added by the chat (DCN)

The DCN front reads the same bag (`problems/dcnToProblems.ts:128`, `model/simulation/dcn/dcnRoles.ts`, R-DCN-1). Confirm
and Remove replace **only** the records the editor edits (`object`, `link`); every other record (a DCN metamodel's
`featureSources` records, any foreign record) and every unknown root or record key survive byte-equal after decode.
Remove gives `{"v":1,"bindings":[...foreign records]}`, empty only when there are none. A unit test proves it with a
foreign record and an unknown root key, and a mutant that drops foreign records is red.

## COSA

1. `model/ontological/bindingDetect.ts` and its test, as §5 B (owner-class match, inherited features searched, rows
   `found` or `missing`, nothing proposed on a non-UML sketch, `value` resolved by owner).
2. `components/editor-v2/onto/OntoBindingModal.tsx` on the `SimRolesModal` shell, styles under the prefix
   `onto-binding` (grep it again before use), `checkBindings` defects on their rows.
3. `components/editors/Info.tsx`: one row only.
4. Gates: typecheck 0; the new tests, `bindingCodec`/`bindingCheck`/`bindingReader` tests, `instantiate.test.ts`,
   `undoGroup.test.ts` green; `npm run build` 0. Code commit.
5. Probe `scripts/probe/onto-binding-editor.ts` (or a block in `onto-s2-instantiate.ts`) on
   `UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`, checks as §5 B: Detect, Confirm, the bag equals
   the probe table, +1 undo entry, one Cmd+Z restores the previous bag (measure whether the key goes or stays and
   report it), the pane menu opens with the same options as the console setup. Regression, one run each:
   `onto-s2-instantiate.ts`, `onto-s3a-slot-problems.ts`. Crops (sips -Z 1200) to `~/.jjodel-lanes/P-2026-11-08-0113/crops/`:
   the editor after Detect, a row corrected by hand with its defect message, «Semantic type class» in Advanced and its
   absence in Basic. `chore(probe)` commit.
6. Mutants, each red and reverted: owner match dropped (name only); foreign records dropped on Confirm; Remove writes an
   empty list unconditionally. To `~/.jjodel-lanes/P-2026-11-08-0113/bench.txt`.
7. Docs commit: one entry in `docs/log-inbox/instance-of.md` covering P-2026-11-08-0049 and this lane (the adopted
   recommended answers named), flip `Status:` of both prompts; `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier with `Outcome: question` as stated, or if the
undo check shows a Cmd+Z that leaves a defective bag.

## RIFERIMENTI

The discovery report above; `docs/decisions.md` R-OI-1..17, R-DCN-1, R-DCN-3; `frontend/scripts/probe/onto-s2-instantiate.ts:233-254`;
CLAUDE.md §3.1, §3.2, rule 19.
