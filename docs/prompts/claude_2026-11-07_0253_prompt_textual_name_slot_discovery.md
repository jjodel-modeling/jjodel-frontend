# Textual syntax: a model created from text has an empty raw `name` slot, discovery

Prompt-ID: P-2026-11-07-0253
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-07 · lane full · 55d88a441 · read only: report committed, hard stop for N1..N5
Lane: full (discovery, read only; root cause analysis)
Depends: P-2026-11-07-0157 (D3b found it: ticket in its log entry and final message)
Worktree: ~/jjodel-w-textns, branch textual-name-slot, from 04b782a5b (own node_modules)
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (lane auto, Alfonso 2026-11-06 23:31)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Read only: no source file changes; probes in the lane folder ~/.jjodel-lanes/P-2026-11-07-0253/. Every reply opens with [P-2026-11-07-0253 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Write the report section by section, committing after each (RC-51).

## COSA

D3b's app check found that a model created from the Text tab has the name `cpu` everywhere (labels, the tree, the text) except its raw `name` slot, which reads `[]`; conformance then warns that a named Module lacks its required name. Root cause analysis before any fix.
(1) Reproduce in a probe on the port corpus: create the model from text, read the object's `name` through the L proxy and through the raw D object (`$attr.value`, the slot), and conformance's verdict. Also an object created on the canvas and one renamed from the text, as controls.
(2) Trace the write: which path the textual apply uses to set a name (applyTextEdit and below), and where the name becomes visible without reaching the slot (a derived or cached name, a `name` property vs the `name` attribute's value).
(3) Say whether the cause is in the textual layer or in the core (LModel / DObject / the apply transaction) and, for each file a fix would touch, the CLAUDE.md 3.1 table and 3.2 triggers; draft a Layer Impact Report if any is inside.
(4) Lane plan for the fix (five files or fewer, test red first) and decisions N1..Nn with one recommendation each.

Discovery report, mandatory: docs/discovery/discovery_2026-11-07_textual_name_slot.md (objective, files read with full paths, findings, risks, open questions), committed on the branch, plus the Status flip of this prompt left uncommitted (RC-17). Hard stop after the report. No push, no merge. Public repo: name no partner company.

## DOVE

Read: frontend/src/codegen/textual/ (the apply path), the model layer it calls, model/conformance. Write: the report and the lane folder.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-07-0157/ (D3b's final message and crop d3b-3-conformance-warning.png); docs/decisions.md R-TXT-45 (nameless objects), R-TXT-46.
