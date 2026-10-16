# Prompt: release 3.1, What's new screen for 3.1 with a short recall of 3.0

Prompt-ID: P-2026-10-17-0040
Chat: C-2026-10-11-1812
Front: release-3-2
Lane: full (user-facing UI copy and layout in one component; visual GO required before the 3.1 PR is merged)
Depends: P-2026-10-16-1000
Request: none (Alfonso, 2026-10-17 00:35 "SI" to a 3.1 welcome screen, 00:38 "puoi anche mettere un richiamo a cosa era nuovo nella 3.0"; the chat's content choice stands)
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Worktree: `~/jjodel-w-welcome31`, branch `rel31-welcome`, created by the chat from `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-17-0040 · session <id>]` and ends with an `Outcome:` line (P16). Gates run in the foreground.

## COSA

`frontend/src/components/WelcomeModal/WelcomeModal.tsx` (and its stylesheet, if it has one beside it) is today the «What's new · Jjodel 3.0» screen: a featured block (JjTL with the `state_machines_to_petri_nets.jjtl` snippet and pills), then «Also new» cards (Transformation Editor, the Jj-languages family, Documentation Generation, an Editor card). It shows once per browser, keyed by `jjodel_welcome_3_seen`.

Turn it into the 3.1 screen, keeping the component's structure, class names and visual language (read the file whole first; reuse existing `wm-*` classes; add new ones only if needed, grep-checked for collisions):

1. **Title** «Jjodel 3.1» under the existing «What's new» label.
2. **Featured: Simulation.** Title «Run your models». One or two sentences: models run step by step (automata, Petri nets, Moore and Mealy machines, statecharts) with events, guards and actions, step back and scenarios, coverage on the canvas, and an I/O board with buttons, LEDs and a clock. In place of the JjTL code block, a small static illustration built with the existing markup and CSS (no image file, no new dependency): either a three-place Petri net with tokens, or an I/O board strip (two buttons, a LED, a clock). Pills, as the 3.0 block had: e.g. «Step / Play», «Scenarios», «Coverage», «I/O board».
3. **Also new**, three cards in the existing card style:
   - «Derive viewpoint»: a full viewpoint from a metamodel in one click, in the notation you pick (statechart, Petri net, flowchart, UML activity, ER Chen and more).
   - «Containers and Auto layout»: containers drawn as frames and partitions, and Auto layout for the whole graph from the toolbar.
   - «Validation»: your own rules, the Validate command, and violation dots on the instances.
4. **Recall of 3.0**, a compact strip at the bottom, visibly secondary (smaller, quieter than the cards): heading «New in 3.0» and one line of four chips or short items: JjTL model-to-model transformations, the Transformation Editor, the Jj-languages (JjTL, JjEL, JjScript, JjModal), Documentation generation. Do not keep the 3.0 code snippet.
5. **Key** `jjodel_welcome_3_1_seen`, so every user sees the 3.1 screen once. Leave the old key untouched (do not read or delete it).
6. Copy rules: English, plain, no marketing adjectives, no em dashes, no exclamation marks. Do not mention the code generator.
7. The modal must fit without scrolling at 1280×800 and stay usable at 1024×768; check both.

Gates: typecheck (baseline 0 on this trunk), vitest for the component's tests if any, build, smoke on a dev server of this tree on port 3171, `check:docs`. Crops in `~/.jjodel-lanes/P-2026-10-17-0040/crops/`: the modal at 1280×800 and 1024×768, a close-up of the featured illustration and of the 3.0 strip, and the modal not shown again after dismissal (reload). Describe each crop in one line; do not judge them: the visual GO is Alfonso's.

Report: `docs/discovery/discovery_2026-10-17_rel31_welcome_modal.md`, with the copy as shipped, the files changed, gates, crop list, «Decisions taken (unattended)», «Decisions awaiting Alfonso». Log entry in `docs/log-inbox/release-3-1-welcome.md`. Commit (`feat(welcome): 3.1 what's new screen`), then stop with `Outcome: hard-stop`.

## NON FARE

No push, no merge, no tag. Touch only the WelcomeModal component and its stylesheet, the report and the inbox. No new dependency, no image asset. No critical-zone file. Do not change `CHANGELOG.md` or the version.

## RIFERIMENTI

`CHANGELOG.md` `[3.1.0]` for the facts; CLAUDE.md §17; PROTOCOL P4, P8, P9, P14, P16; RC-23.
