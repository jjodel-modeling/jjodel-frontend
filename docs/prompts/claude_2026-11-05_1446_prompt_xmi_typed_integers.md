# XMI import: integer attributes typed by the metamodel (#607)

Prompt-ID: P-2026-11-05-1446
Chat: C-2026-11-03-1202
Front: hw-notation
Status: eseguito 2026-11-05 · lane full · 36e67e7da · fix #607, discovery, ticket R-FA-11 scope
Lane: full (unattended; root cause first, then the smallest fix in this same lane)
Depends: P-2026-11-05-1400
Worktree: ~/jjodel-w-xmiints, branch xmi-typed-integers
Request: none (Alfonso's words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-xmiints` on `xmi-typed-integers`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-05-1446 · session <id>]`. No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. The repo is public: name no partner company, cite no path outside this tree in anything committed.

## COSA

Read `docs/discovery/discovery_2026-11-05_core_jjtl_called_rules_in_app.md` and the ticket #607. The XMI import stores integer attributes as strings (`xlen="4"`), the source reaches JjTL with strings, `xlen.log2()` fails and integers are written to the target as strings: 136 of 1,999 attribute values wrong on `rv_mc4`.

Decided by the chat under Alfonso's «decidi tu»: the fix is in the XMI import, which casts an attribute's value by its metamodel type. A transformation may assume a typed source. Do not touch the JjTL files.

1. Write a failing test first, on the import, then the fix. Cover EInt, ELong, EShort, EByte, EDouble, EFloat, EBoolean; a value that does not parse for its type is reported, not silently kept or turned into NaN or 0. Strings and enumerations stay as they are.
2. Say whether projects already saved with string integers exist as a case, and how they read after the fix, by measuring one. Do not write a migration; if one is needed, it is a decision awaiting Alfonso.
3. Find out why the failing `log2` showed as warnings in the output panel when R-FA-11 says a failing builtin stops the mapping with an error. Report the cause. If it is a defect, file a ticket; do not fix it here unless it is the same code path.
4. Verify in the app with the probes of `~/.jjodel-lanes/P-2026-11-05-1400/`: `rv_mc4` with `CoreSpec2SyncRTL.jjtl` against its reference, expecting zero attribute differences apart from the known clamped mask of #609; state exactly what remains. Then `rv_pf4`.
5. In node, on the source-text path, the arbiter (`ArbiterSpec2SyncRTL.jjtl`, already edited to multi-line constants, in the inputs) on `arbiter3` against `arb3-syncrtl.json`.
6. For #609, with a private copy of `SyncRTL.ecore` having `Const.value : ELong`, measure whether the app reads 4,261,441,663 back unclamped. Measure only: the metamodel in the inputs is not changed and #609 is not fixed here.

Write the findings to `docs/discovery/discovery_2026-11-05_xmi_typed_integers.md`, in English, beginning with `## 0. Answer in brief`, each figure marked measured or read.

## DOVE

Inputs, read only: `~/.jjodel-lanes/pending/corexf-inputs/`. Written: the import code and its test, the report, `docs/log-inbox/hw-notation.md`, a decision row in `docs/decisions.md` if the behaviour on a bad value needs one (provisional, unattended), the `Status:` line of this prompt. Stop and ask, Outcome: question, if the fix needs a critical-zone file, an exported interface that breaks outside this lane, or an amendment of a ratified R- row. Dev server on a free port above 3010, never 3000, 3001 or 3003; stop it when done.

## COME

The usual gates of the frontend, on the touched files and the JjTL and import suites. Atomic commits, named paths. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
