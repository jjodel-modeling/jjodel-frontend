# Ontological instantiation, S2: closure (clamp, probe commit, build, log)

Prompt-ID: P-2026-10-21-0635
Chat: C-2026-10-20-1835
Front: instance-of
Lane: full (EditorV2 menu, visual check owed)
Status: eseguito 2026-10-21 · lane oi-s2 · code 4b156d003 + fix 09f63ce6c, probe 4f1e07953, log b65bb3e41 · build 0 · visual check: cascade pass, new-instance node fail (ticket b, blocks the merge of oi-s2)
Request: https://claude.ai/code/session_015eDtjagjBtuPHhhhfUTTo5
Depends: none
Corregge: P-2026-10-21-0100, whose session (e7d1d822) reached the context ceiling (AM-8) after the code commit 4b156d003
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s2`, branch `oi-s2` at `4b156d003`, with exactly two untracked paths,
`frontend/scripts/probe/onto-s2-instantiate.ts` and `docs/discovery/assets/onto-s2/`. Check `pwd`, the branch and that
state; otherwise stop with `Outcome: blocked`. Model and tier: heavy.

## Lane discipline

Every reply opens with `[P-2026-10-21-0635 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 60 minutes. One `Recommended:` answer inside this perimeter
is adopted and recorded (RC-21). **No subagent and no background task.** Gates and probes in the foreground (P16).
**Context economy:** read `~/.jjodel-lanes/P-2026-10-21-0100/handoff.md` first and do not re-read whole files; grep for
the lines you edit; short tool output; never print a whole diff. Commit each step as soon as its gate is green. No push,
no merge. Do not touch `Status`.

## COSA

1. The vertical clamp of the cascade in `frontend/src/components/editor-v2/ContextMenu.tsx`, as written in the handoff:
   a submenu that would cross the bottom edge of the viewport opens upward or is shifted up so that its last item is
   fully visible. Typecheck zero, unit tests green, commit `fix(onto): clamp the instance cascade to the viewport
   (P-2026-10-21-0635)`.
2. Rerun the probe on port 3087 (12 checks, page errors `[]`), add one check that the last item of the cascade lies
   inside the viewport, refresh the two screenshots in `docs/discovery/assets/onto-s2/`, commit
   `chore(probe): S2 acceptance probe and assets (P-2026-10-21-0635)`.
3. `npm run build` exit 0 and `npm run check:docs` green.
4. Report and stop for the GO. After the GO: the log entry in `docs/log-inbox/instance-of.md` with two tickets, (a)
   place the new instance at the click without breaking undo, (b) size the new instance's node from its rows (the
   sizing lives in `viewpoint/layout`, outside this lane), then commit it.

## DOVE

`ContextMenu.tsx` (and `EditorV2.scss` only if the clamp needs a style), the probe, the assets, the log entry. Nothing
else.
