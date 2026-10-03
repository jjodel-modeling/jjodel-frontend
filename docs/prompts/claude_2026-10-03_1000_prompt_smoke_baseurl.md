# Prompt: the visual smoke takes its server address from the environment
Prompt-ID: P-2026-10-03-1000
Chat: C-2026-10-01-1725
Lane: fast. Tier: light (scripts only, no app code). Model: Sonnet 5, declared deviation from RC-16 (peripheral lane, RC-32 light tier).
Status: eseguito 2026-10-03 · lane smoke-baseurl · 582ecb569 · non fuso
Worktree: `~/jjodel-w-smokeurl`, branch `smoke-baseurl`, cut from the trunk at `fba1549ee` (`frontend/node_modules` symlinked, P14).

## COSA
`frontend/scripts/smoke/states.ts:15` fixes `BASE_URL` to `http://localhost:3000`. On Alfonso's machine nothing listens there (his server is 3001, lanes use their own ports), so `npm run smoke` navigates to a dead address and ends RED with every state NOT REACHED. That RED says something about the machine, not the app, and it misled a trunk check on 2026-10-03. Wanted: the address comes from an environment variable, the default stays `http://localhost:3000`, and a run against 3001 is refused, as `scripts/probe/hidden-tab-loop.ts:68` already does.

## DOVE
`frontend/scripts/smoke/states.ts` (the constant and its comment), `frontend/scripts/smoke/README.md` (the Running it section, one short paragraph). Nothing else. `run.ts` and `calibrate.ts` import the constant and print it; they must not need changes.

## COME
1. Read `CLAUDE.md` (the scripts rules, §17), `docs/PROTOCOL.md` P8, `frontend/scripts/smoke/README.md`, `states.ts` whole, and how `scripts/probe/hidden-tab-loop.ts` reads `PROBE_URL` and refuses 3001.
2. Grep `SMOKE_URL` across the repo first; if the name is taken, stop and say so.
3. `export const BASE_URL = (process.env.SMOKE_URL || 'http://localhost:3000').replace(/\/$/, '')`, and throw a clear error when the port is 3001 (the seeding writes projects: it must never run against the server Alfonso uses). Keep the existing comment about `[::1]` and add the variable and the 3001 rule in one or two lines.
4. README: one paragraph, in English, on `SMOKE_URL` and the 3001 refusal, with one example command. No admonitions.
5. Verify: `npm run typecheck:scripts`, `npm run check:scripts`, `npm run check:docs`. Then run the smoke once against a dev server of the worktree on a free port other than 3000 and 3001 (for example 3016) with `SMOKE_URL=http://localhost:3016`, and report the verdict as GREEN, RED or VOID with the state list. A VOID is reported as a void with its cause, never as green or red (README, verdict table). Also show that `SMOKE_URL=http://localhost:3001` is refused with the error, and that with no variable the address printed is 3000.
6. One commit with `(P-2026-10-03-1000)` in the subject, then one docs commit: the entry in `docs/claude-code-log.md` (or the inbox the rotation left for it) and this prompt's Status. No merge. Stop with a short report: files, the measured verdicts, anything unexpected.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, port 3001, writes in any other tree. Discovery report: none needed (no exploration beyond reading the files above); if you find you need one, write it in `docs/discovery/discovery_2026-10-03_smoke_baseurl.md`.

## RIFERIMENTI
- `frontend/scripts/smoke/states.ts:13-15`, `frontend/scripts/smoke/README.md`.
- `frontend/scripts/probe/hidden-tab-loop.ts:67-68` (precedent for the env variable and the 3001 refusal).
