# Textual syntax, lane D4 continuation: app check and docs of the safe rename

Prompt-ID: P-2026-11-07-0609
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-07 · lane full · e42169108 · gates green · app check ALL PASS, crops in ~/.jjodel-lanes/P-2026-11-07-0609/, checked by the chat · log entry in docs/log-inbox/codegen.md
Lane: full (app check with crops; docs)
Depends: P-2026-11-07-0515 (D4, stopped at the soft ceiling after items 1-3; code commits ec89f027f, 63c4fffc6), R-TXT-53
Worktree: ~/jjodel-w-textd4, branch textual-d4-rename
Request: none (lane auto, «Procedi con E e poi F»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency. Every reply opens with [P-2026-11-07-0609 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call.

## COSA

Finish D4 from its handoff, ~/.jjodel-lanes/P-2026-11-07-0515/handoff.md (read it whole first; its decisions stand). Items (1)-(3) of P-2026-11-07-0515 are done and their gates green; no code change is expected here.

(1) **App check**, item (4) of P-2026-11-07-0515, following the handoff's plan (port 3561 or the next free one, the setup it names, the text it gives to type, its fallback for a nameless object). Crops, light theme, scale 1, in ~/.jjodel-lanes/P-2026-11-07-0609/: 1-rename-box (the rename box on an object referenced twice); 2-after-enter (declaration and both references renamed in the text); 3-canvas (the canvas showing the new name after the pause, same element, no confirm panel); 4-nameless (the refusal on a nameless object); 5-collision (the refusal on a colliding name). The probe-only CSS rule for the docked Text panel stays in the probe; no product change for it (lane E3). If a check fails because of the code, stop with Outcome: question and the evidence; do not fix outside DOVE. Stop your server at the end.

(2) **Docs**: one log entry in docs/log-inbox/codegen.md via the log-entry skill covering P-2026-11-07-0515 and this continuation: Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required; the Notes say that names inside JjEL strings and validation rules are not rewritten (step F). Flip the Status of both prompt files (0515 and this one). Leave all of it uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

Docs only: docs/log-inbox/codegen.md and the two prompt files. Code files of D4 (languageService.ts, ui/textualMonaco.ts, __tests__/languageService.test.ts) only if the app check proves a defect, and then ask first. ui/TextualTab.tsx is not touched.

## COME

Reuse the probes the handoff names (~/.jjodel-lanes/P-2026-11-05-2220/probe.mjs, ~/.jjodel-lanes/P-2026-11-07-0346/common.mjs), copied into the new lane folder.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-07-0515/handoff.md and handoff.diff; docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md (§5, §8 D4 row); docs/decisions.md R-TXT-53.
