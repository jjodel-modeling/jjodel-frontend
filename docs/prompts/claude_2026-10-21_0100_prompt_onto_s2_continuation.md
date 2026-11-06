# Ontological instantiation, S2: finish the creation menu (continuation in a fresh session)

Prompt-ID: P-2026-10-21-0100
Chat: C-2026-10-20-1835
Front: instance-of
Lane: full (EditorV2.tsx, visual check owed)
Status: non completato 2026-10-21 · lane oi-s2 · code 4b156d003 (typecheck 0, 63 unit tests, bench 10/10, probe 12/12) · context ceiling before the probe commit · continued by P-2026-10-21-0635
Request: https://claude.ai/code/session_015eDtjagjBtuPHhhhfUTTo5
Depends: none
Corregge: P-2026-10-21-0040, whose session (ad02d142) reached the context ceiling (AM-8) in Phase 2 with the code uncommitted
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s2`, branch `oi-s2` (the tree of P-2026-10-21-0040, reused), at `75e8e793a` with uncommitted
work: modified `ContextMenu.tsx`, `EditorV2.scss`, `EditorV2.tsx` under `frontend/src/components/editor-v2/`, untracked
`hooks/instantiate.ts` and `hooks/__tests__/instantiate.test.ts`. Check `pwd`, the branch and exactly that state;
otherwise stop with `Outcome: blocked`. Model and tier: heavy.

## Lane discipline

Every reply opens with `[P-2026-10-21-0100 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. One `Recommended:` answer inside this perimeter
is adopted and recorded (RC-21). **No subagent and no background task.** Gates and probes in the foreground (P16).
**Context economy:** do not re-read `EditorV2.tsx` whole (read only the lines around your insertions, by grep), keep tool
output short (grep, tail, head, `--reporter=dot`), never print a whole diff. No push, no merge. Do not touch `Status`.

## COSA

Finish `docs/prompts/claude_2026-10-21_0040_prompt_onto_s2_instantiate.md` (its COSA and the acceptance of its COME
Phase 2 step 3 are unchanged). Start from `~/.jjodel-lanes/P-2026-10-21-0040/handoff.md` and the plan
`docs/discovery/discovery_2026-10-20_onto_s2_plan.md`. The five decisions of the previous session are accepted by the
chat: the adapter reads the raw D records; a new instance is named `<class lower-first><first free number>`; «New
instance» on a class node places it 80 px to the right; only the record `object` feeds the menu; a declared record with
no instantiable class shows the cascade item disabled. `EditorV2.scss` is accepted as the menu's stylesheet.

Remaining: add `onPaneContextMenu={onPaneContextMenu}` on `<ReactFlow>`; typecheck zero; mutation bench on
`instantiate.ts` (at least: closure order reversed, abstract filter dropped, defaultValue mapping skipped; each must turn
a test red); the acceptance probe `frontend/scripts/probe/onto-s2-instantiate.ts` on port 3087, built on the fixture
`frontend/scripts/probe/uml-class-object-fixture.ts` (import its exported helpers, do not copy it) with the UML binding
written through `mm.state`; screenshots of the open cascade and of the new instance in the object diagram viewpoint,
light theme, in `docs/discovery/assets/onto-s2/` with the measures JSON; `npm run check:docs` green.

## DOVE

The five files above, the probe, the assets, and at closure after the GO the log entry in
`docs/log-inbox/instance-of.md`. No critical-zone file, nothing under `redux/`, `joiner/`, `viewpoint/`, `problems/`.

## COME

Commits after the gates: `feat(onto): creation menu and slot synthesis (P-2026-10-21-0100)` with the code and the unit
tests (bench results in the body), and `chore(probe): S2 acceptance probe and assets (P-2026-10-21-0100)`; `git add` by
path, `Model:` trailer. Then stop for the GO. If the context gets short before the commits, commit the code that passes
the typecheck and the unit tests first, then stop with `Outcome: hard-stop` listing what is left.
