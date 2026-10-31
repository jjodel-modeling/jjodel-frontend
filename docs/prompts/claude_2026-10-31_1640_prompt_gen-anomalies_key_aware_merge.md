# gen-anomalies: take the trunk's metaclass dispatch, by meaning

Prompt-ID: P-2026-10-31-1640
Chat: C-2026-10-31-1328
Front: codegen
Status: da eseguire
Lane: fast (merge with code resolution on the branch, two files plus tests, no exported interface change)
Depends: P-2026-10-31-1605 (cg-dispatch merged into the trunk, de897d1a4)
Worktree: ~/jjodel-w-genanom, branch gen-anomalies
Request: none (adopted recommendation of P-2026-10-31-1631, unattended, RC-21)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-genanom` on
`gen-anomalies`, stop with `Outcome: blocked`. The tree must be clean and no merge in progress. Every reply opens
with `[P-2026-10-31-1640 · session <id>]`. No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

P-2026-10-31-1631 (trunk into gen-anomalies) stopped on a conflict in
`frontend/src/codegen/ui/TemplateEditorTab.tsx` that is one of meaning: the trunk (cg-dispatch, P-2026-10-31-1410)
identifies templates by key (`templateKey`, `name:Type` when the first parameter is typed) for drafts and
selection, while this branch (P-2026-10-31-1342) added `savedNames`, `retargetGenerator`, `freshTemplateName` and
the gone-metamodel preview guard (`exists`, `previewOff`), all by name.

Merge `de897d1a4` into `gen-anomalies` (`git merge --no-ff de897d1a4`) and resolve by meaning:

1. `retargetGenerator` and `savedNames` work on keys: renaming or deleting one of two templates that share a name
   under different types retargets only entries naming that template's key; entries and root keep naming by the
   form the generator stores (check what `root` and `files[].entry` hold after cg-dispatch: a name or a key; follow
   the stored form, do not change the format).
2. `freshTemplateName` counts names and keys of saved templates and drafts, so a new template never collides and
   names stay gapless (the 1342 test still passes).
3. The preview keeps both guards: `exists`/`previewOff` from this branch and `dispatchRows` from the trunk.
4. `docs/log-inbox/codegen.md`: union of both sides.

Tests: the existing tests of both sides green; one new test with two templates `expr:Ref` and `expr:Const`, rename
and delete each and check that root and file entries follow the right one; a new template after them gets a
fresh, gapless name.

Gates: `npx tsc --noEmit`, `npx vitest run src/codegen`, `npm run build`, `npm run check:docs`.

## Lane discipline

`git add <specific files>` only; the merge commit message `merge: alfonso-frontend-jjtl into gen-anomalies, key-aware
(P-2026-10-31-1640)`. Log entry in `docs/log-inbox/codegen.md` and the `Status: da eseguire` flip in one docs-only
commit. No push. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», then
`Outcome: done | hard-stop | question | blocked`.
