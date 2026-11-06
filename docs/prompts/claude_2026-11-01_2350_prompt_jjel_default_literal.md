# JjEL: an unset attribute reads its declared default from `defaultValueLiteral` (R-TXT-5)

Prompt-ID: P-2026-11-01-2350
Chat: C-2026-11-01-1713
Front: codegen
Status: eseguito 2026-11-01 · 59fb7c389
Lane: fast (one reader change plus tests)
Depends: P-2026-11-01-2300/2325 (merged 44c6794f2: the Ecore import now fills `defaultValueLiteral`)
Worktree: ~/jjodel-w-jjeldefault, branch jjel-default-literal (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, 2026-11-01 23:44, «Sono d'accordo» (question 2)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjeldefault` on
`jjel-default-literal`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-2350 · session <id>]`.
No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

The editor (JjScript `set … default`) and, since 44c6794f2, the Ecore import write an attribute's declared default
into `defaultValueLiteral` (a string). JjEL's unset read takes the declared default from `defaultValue`
(`frontend/src/jjscript/executor/commands/eval.ts` about `:503`, `:720-795`, `:760`), which nothing fills, so an
unset attribute with a declared default reads its type's default instead. After the change the unset read uses
`defaultValueLiteral` when `defaultValue` is absent, coerced to the attribute's primitive type exactly as `defaultValue`
is coerced today. Watch the boolean case 2300 measured: the literal `"false"` must read `false`, not `true`. Enum
defaults read the literal named by the string. An unparsable literal reads as if there were no declared default, with
no throw. An attribute with neither keeps today's behaviour.

## DOVE

`frontend/src/jjscript/executor/commands/eval.ts` only (the shell field at `:503` and the unset read). Tests next to the
existing JjEL unset-read tests (find them with grep). If another file must change, stop with `Outcome: question`.

## COME

Tests first, red before the change, on a metamodel built the way the editor builds it (`defaultValueLiteral` set,
`defaultValue` not): EInt `"7"` reads 7; EBoolean `"false"` reads false and `"true"` reads true; EString reads the
string; EDouble `"2.5"` reads 2.5; an enum literal name reads that literal; `"abc"` on an EInt reads the type default.
Then: an Ecore-imported metamodel (the `ecore-import-losses.test.ts` fixture) gives the same reads; and the default
text generator prints `level 7` for an unset defaulted attribute without any manual `defaultValue` (the case 2016 had to
patch by hand). Existing JjEL and codegen tests stay green.

## Lane discipline

`git add <specific files>` only. Commit `fix(jjel): unset attributes read their declared default literal
(P-2026-11-01-2350)`. Gates: `npx tsc --noEmit` (baseline), `npx vitest run src/jjscript src/jjel src/codegen`,
`npm run build`, `npm run check:docs`. Visual check not applicable (no UI); say so. Log entry in
`docs/log-inbox/codegen.md` and the `Status:` flip of this prompt (edit the line directly) in one docs-only commit.
No push, no merge. End with «Decisions taken (unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop |
question | blocked`.
