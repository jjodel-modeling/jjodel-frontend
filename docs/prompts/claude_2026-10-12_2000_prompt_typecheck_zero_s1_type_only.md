# Prompt: typecheck baseline to zero, slice 1 of 3: six files, edits the compiler erases

Prompt-ID: P-2026-10-12-2000
Chat: C-2026-10-12-1955
Lane: full (more than 3 files). One phase: the six edits were measured by the chat, the oracle is mechanical, no visual check is due.
Depends: none
Front: maintenance
Request: none (no URL: Juri asked in a local Claude Code session on 2026-10-12; his words are `request.md` in the lane folder, RC-43)
Status: da eseguire
Limite: 60 minuti

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).
Deroga: P4 non si applica (motivo: no discovery phase and no hard stop before the edit; the chat measured the six edits on `38f0add16` in a throwaway worktree, this lane re-measures BEFORE and AFTER, and steps 2, 4 and 5 stop it wherever a measure disagrees).
Deroga: P8 non si applica (motivo: step 4 proves the emitted JavaScript of the six files byte-identical, so nothing that renders can change; no dev server, no browser).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the
RC-26 list, the digest), Juri decides for this lane.

Critical zone: none. No file of this lane is one of the six of the root rules file §3.2, and none is a row
of the §3.1 table (`EditorV2.tsx` sits under `components/editor-v2/` and is not listed). No Layer Impact
Report is owed. `frontend/src/common/Dummy.ts` is core (rule 5): the go-ahead is Juri's request of
2026-10-12, «risolvere una volta per tutte i 14 errori di baseline», and the edit there is the deletion of
one unused import line.

Worktree: `/Users/juridirocco/development/jjodel-tc0`, branch `fix/typecheck-baseline-zero`, cut from
`staging` at `38f0add16`; `frontend/node_modules` is a symlink to the main tree's (P14: do not remove it).
This lane is the first of three run by `lane-run chain` in this worktree. Before anything else: `pwd` is
that worktree, the branch is `fix/typecheck-baseline-zero`, `git log -1` is the commit that adds this file
(subject `docs: add prompt P-2026-10-12-2000, lane 1/3 of chain-P-2026-10-12-2000`), `git status` is
empty; otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-12-2000 · session <id>]` (`session unknown` if you
cannot see it, never invented). Every final message ends with one line:
`Outcome: done | hard-stop | question | blocked`. Every question that has a recommendation carries it in
one line: `Recommended: <one line>`. A message with another Prompt-ID, or with none, is not acted on (P13).
The chain starts the next lane only on `Outcome: done` with a clean tree: every commit of this lane is
made before the final message.

## Context (measured by the chat on `38f0add16`: verify, do not trust; re-measure where a number counts)

`npm run typecheck` on `38f0add16`: exit 2, 14 lines `error TS`, read on the complete output. They are the
14 of the root rules file §17, in 7 files:

| File (under `frontend/`) | Line | Code | Count |
|---|---|---|---|
| `src/api/data.ts` | 899, 899, 1163 | TS2304 ×2, TS2322 | 3 |
| `src/common/Dummy.ts` | 46 | TS2307 | 1 |
| `src/components/editor-v2/EditorV2.tsx` | 3350 | TS2339 | 1 |
| `src/components/forEndUser/Measurable.tsx` | 271, 287, 289, 292, 298, 302 | TS2552, TS7053 ×4, TS2345 | 6 |
| `src/components/Jodie/ChatMessages.tsx` | 282 | TS2322 | 1 |
| `src/components/project/ProjectEditor.tsx` | 227 | TS2769 | 1 |
| `src/pages/components/Dashboard.tsx` | 599 | TS2339 | 1 |

The chat applied seven one-site fixes in a throwaway worktree: typecheck exit 0, 0 errors, no new error.
It then transpiled each file before and after, one module at a time: six files emit **byte-identical
JavaScript**; `src/api/data.ts` alone differs, by one name in an import list. The six are this lane.
`src/api/data.ts` is slice 2 (P-2026-10-12-2001), the norms that name the baseline are slice 3
(P-2026-10-12-2002): neither is touched here.

## COSA

Six edits, each at one site, each erased by the compiler. The text on the left is what the file holds on
`38f0add16`. **If a site reads differently, stop with `Outcome: question`; do not adapt the edit.**

1. `frontend/src/common/Dummy.ts:46` (TS2307). Delete the whole line
   `import {i} from "vite/dist/node/chunks/moduleRunnerTransport";`. It is an editor auto-import: no code
   reads that binding (every other `i` of the file is a loop variable, a parameter or a property name;
   confirm with a search before deleting). The blank line after the import block stays.
2. `frontend/src/components/Jodie/ChatMessages.tsx:282` (TS2322). In
   `{inspectorKind && inspectorOpen && entry.rawValue && (`, the operand `entry.rawValue` becomes
   `(entry.rawValue as Record<string, unknown> | null | undefined)`. `rawValue` is `unknown`, which is not
   a `ReactNode`; the cast is the one the next lines already apply when they pass it to
   `JjelValueInspector`.
3. `frontend/src/components/editor-v2/EditorV2.tsx:3350` (TS2339).
   `const lClass: any = LPointerTargetable.fromPointer(node.id)?.model;` becomes
   `const lClass: any = (LPointerTargetable.fromPointer(node.id) as any)?.model;`. The call resolves to
   `never` for a plain string id; line 3303 of the same handler already reads it `as any`.
4. `frontend/src/components/forEndUser/Measurable.tsx:271` (TS2552, and the five that follow from it: TS7053
   at 287, 289, 292, 302, TS2345 at 298). In the signature of `makeEvent`, the parameter
   `evtkey: keyof typeof jquievent` becomes `evtkey: EventLetter`. `jquievent` is a local declared inside
   the body, out of scope in the signature; `EventLetter` is the file's own type (line 35), the same three
   keys. Nothing else in the method changes, and its one caller (line 340) is not touched.
5. `frontend/src/components/project/ProjectEditor.tsx:227` (TS2769). In
   `SetFieldAction.new(project.id, 'transformations', next, '', false);` the third argument becomes
   `next as any`. No overload of `SetFieldAction.new` takes a non-pointer array for a field typed `any[]`;
   the read of the same field at line 219 is already `(project as any).transformations`.
6. `frontend/src/pages/components/Dashboard.tsx:599` (TS2339).
   `const activeId = layout?.dockbox?.children?.[0]?.activeId;` becomes
   `const activeId = (layout?.dockbox?.children?.[0] as { activeId?: string } | undefined)?.activeId;`.
   `children` holds panels and boxes and only a panel has `activeId`; the read stays optional, as today.

## DOVE

- `frontend/src/common/Dummy.ts`: line 46 deleted.
- `frontend/src/components/Jodie/ChatMessages.tsx`: one operand on line 282.
- `frontend/src/components/editor-v2/EditorV2.tsx`: one expression on line 3350.
- `frontend/src/components/forEndUser/Measurable.tsx`: one parameter type on line 271.
- `frontend/src/components/project/ProjectEditor.tsx`: one argument on line 227.
- `frontend/src/pages/components/Dashboard.tsx`: one expression on line 599.
- `docs/log-inbox/maintenance.md`: the closing entry (the `log-entry` skill, P9 format).
- `docs/prompts/claude_2026-10-12_2000_prompt_typecheck_zero_s1_type_only.md`: the `Status` line.

Eight files, above five (rule 19, P6): they are listed here with what changes in each, and the entry
repeats the count under RC-11. Any other file, or a second line in one of the six: stop and ask.

Not committed: `frontend/scripts/smoke/_tmp_tc0_jsdelta.cjs`, the oracle, placed by the chat (gitignored).

## COME

1. Read the root rules file (the non-negotiable block, §2, §5, §6, §17, §21), `docs/PROTOCOL.md` P6, P9,
   P12, P13, P16, `docs/decisions.md` RC-11, RC-17, RC-20, RC-21, and the last five entries of
   `docs/claude-code-log.md`. Read the oracle before running it.

2. **BEFORE.** From `frontend/`, in the foreground: `npm run typecheck`, its complete output kept in
   `~/.jjodel-lanes/P-2026-10-12-2000/` with the exit status. It must be exit 2 with exactly the 14 of the
   table above, by file and code. Anything else: stop with `Outcome: blocked` and the complete list.

3. The six edits of COSA, and nothing else.

4. **The oracle.** From `frontend/`:
   `node scripts/smoke/_tmp_tc0_jsdelta.cjs HEAD src/common/Dummy.ts src/components/Jodie/ChatMessages.tsx src/components/editor-v2/EditorV2.tsx src/components/forEndUser/Measurable.tsx src/components/project/ProjectEditor.tsx src/pages/components/Dashboard.tsx`.
   Expected: `CONTROL ok`, then six lines `IDENTICAL JS`, each with `source changed: true`, exit 0. A
   `DIFFERENT JS`, a `source changed: false` or a failed control: keep the tree as it is and stop with
   `Outcome: question`, quoting the lines it printed.

5. **AFTER**, every gate in the foreground, from `frontend/`, read on its **complete** output with its
   exit status (root rules file §5):
   - `npm run typecheck`: exit 2 with exactly **3** errors, all in `src/api/data.ts` (TS2304 ×2, TS2322).
     A fourth error, or one of the 11 still there: stop with `Outcome: question`.
   - `npm run test`: the nine files of §17 red at import, nothing else red. Another red is not
     pre-existing until you have run the same file on `HEAD` and seen it red there.
   - `npm run build`: exit 0.
   - `npm run check:docs`, `npm run check:addonly`, `npm run check:scripts`: exit 0 each.

6. One code commit, the pathspec on the commit itself (`git commit ... -- <the six paths>`), subject
   `fix(types): clear 11 baseline typecheck errors in six files (P-2026-10-12-2000)`. Body: the six sites
   with their codes, typecheck 14 to 3, the oracle's six lines, the `Model:` trailer of P6 (the model your
   session banner shows).

7. Closure, at once (no visual check, RC-17): the entry in `docs/log-inbox/maintenance.md` and this
   prompt's `Status` line, `Status: eseguito <YYYY-MM-DD> · lane fix/typecheck-baseline-zero · <sha of step 6>`,
   in one docs commit, `docs: lane closure, entry and Status (P-2026-10-12-2000)`. In the entry:
   `Corregge` and `Causa` are `—`; `Regressions: no` only if every gate of step 5 read as expected and
   the oracle printed six `IDENTICAL JS`; `Out-of-scope changes: no`; `Layer Impact Report: not-required`;
   `Smoke visivo: non applicabile` with the oracle as the reason; `Notes` within 500 characters, naming the
   two derogations (P4, P8) and the eight files.

8. `git status` is empty. Final message: the two shas; the typecheck BEFORE and AFTER by file and code;
   the oracle's output verbatim; every gate with its numbers and exit status; the diff of the six files;
   «Decisions taken (unattended)»; «Decisions awaiting Juri»; then `Outcome: done`.

## NON FARE

- No file outside DOVE; no second line in a file of DOVE; no `frontend/src/api/data.ts` (slice 2); no
  `CLAUDE.md`, `AGENTS.md`, `docs/HARNESS-DOCS.md` or lane template (slice 3).
- No `@ts-ignore`, `@ts-expect-error` or `@ts-nocheck`; no change to `tsconfig.json`; no change to an
  exported type, class or signature (`SetFieldAction.new`, `DProject`, `LPointerTargetable.fromPointer`);
  no rename; no reformat; no import reordered or added (the one deleted line of `Dummy.ts` is the only
  import change); no adjacent cleanup; no new dependency; no test written on source text (§5).
- `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git restore .`,
  `git clean`, `--no-verify`, push, merge, log rotation or folding, writes in another tree (the main tree
  is read-only for this lane), a dev server, a browser, a real call to an AI provider, a background gate.

## RIFERIMENTI

- Root rules file §17 (the list of the 14, the gates), §5 (complete output, positive control), §6.1.
- `frontend/src/joiner/classes.ts:1556` and `:2554` (`fromPointer`), `frontend/src/redux/action/action.ts:529-567`
  (`SetFieldAction.new` and its overloads): read, not edited.
- Slices 2 and 3: `docs/prompts/claude_2026-10-12_2001_prompt_typecheck_zero_s2_ecore_parser.md`,
  `docs/prompts/claude_2026-10-12_2002_prompt_typecheck_zero_s3_gate_at_zero.md` (each is committed by the
  chain at its own launch, so neither is in the tree yet).
