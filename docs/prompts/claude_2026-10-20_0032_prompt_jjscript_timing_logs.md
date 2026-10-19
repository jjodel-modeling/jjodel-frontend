# JjScript: remove the TEMP-DISCOVERY timing logs

Prompt-ID: P-2026-10-20-0032
Chat: C-2026-10-20-0003
Front: maintenance
Lane: fast (two files, temporary instrumentation only)
Status: eseguito 2026-10-20 · lane maintenance · ee21998fd · verifica visiva non applicabile (P8 derogated: no visible change)
Request: https://claude.ai/code/session_01Mk7LmH7N6YcSQiKx7oNZP5 (Alfonso, 2026-10-20 00:03: «chiudi tutto quello che puoi chiudere, compresi i ticket, vai in /lane auto»; harness ticket of the 2026-10-11 session of chat C-2026-10-10-0039)
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 replaced: no visible change; gates and an empty grep are the check.
Worktree: `~/jjodel-w-timinglogs`, branch `jjscript-timing-logs`, created by the chat from the trunk; the commit that adds this prompt is on the branch. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.
Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-20-0032 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 30 minutes. Node: `~/.local/bin/node`.

## COSA

1. `frontend/src/jjscript/executor/executor.ts` and `frontend/src/jjscript/components/ScriptBlock.tsx` carry instrumentation marked `TEMP-DISCOVERY` since 2026-07-13: `performance.now()` timers, `(this as any)._t*` fields and two `console.log('[JjScript-TIMING] ...')` calls, against CLAUDE.md §2. Remove exactly those lines and the variables only they use; keep every other statement and its order. Where a timer wraps real work, keep the work.
2. `rg -n 'TEMP-DISCOVERY|JjScript-TIMING' frontend/src` must print nothing.
3. Gates: typecheck at baseline (CLAUDE.md §17), vitest on `src/jjscript`, `npm run build` exit 0.
4. Commits (`git add` named files only): `chore(jjscript): remove TEMP-DISCOVERY timing logs (P-2026-10-20-0032)` with trailer `Model:` (P6); then `docs: Status flip and log entry (P-2026-10-20-0032)` with the entry in `docs/log-inbox/maintenance.md`. `check:docs` from `frontend/`.

## DOVE

The two files above, `docs/log-inbox/maintenance.md`, this prompt.

## NON FARE

No other cleanup, no reformatting, no renamed identifier. No push, no merge.

## RIFERIMENTI

CLAUDE.md §2 and §17.
