# Harness test: criticalZone.test.ts must not inherit a go-ahead from the lane's environment (ticket #393)

Prompt-ID: P-2026-11-02-0645
Chat: C-2026-11-01-1434
Front: harness
Lane: fast (one test file)
Status: eseguito 2026-11-02 · lane criticalzone-test-env · 3c54c9d3f
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-czenv`, branch `criticalzone-test-env`, cut from `alfonso-frontend-jjtl` at `aa68ad049`, HEAD at the
commit that adds this prompt. Clean tree. Model and tier as pinned, effort as default.

## Lane discipline

Every reply opens with `[P-2026-11-02-0645 · session <id>]`; final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 30 minutes. No push, no merge.

## Contesto

Ticket #393 (inbox entry in `docs/log-inbox/harness.md`, found by P-2026-11-01-1605): inside a lane started with
`--critical-zone-goahead`, `JJODEL_CRITICAL_ZONE_GOAHEAD` is set in the environment and the hook spawned by
`frontend/scripts/hooks/__tests__/criticalZone.test.ts` inherits it, so 4 cases that expect `ask`/`deny` fail. With the
variable unset the file passes 70/70.

## COSA

1. In `criticalZone.test.ts` only: the helper that spawns the hook (`runScript` or its caller) builds the child
   environment from `process.env` with `JJODEL_CRITICAL_ZONE_GOAHEAD` removed, then applies the case's own `env`. Cases
   that set the variable on purpose keep working. Do not touch `critical-zone.mjs`.
2. Prove it: run the file with the variable unset and with `JJODEL_CRITICAL_ZONE_GOAHEAD=P-2026-11-02-0645` exported in
   the shell; both 70/70 (or the file's current total). Mutation: put the inheritance back, the run with the variable set
   fails.
3. `npm run check:scripts` if it exists; typecheck if the file is in its scope.
4. Commit with explicit pathspec. Log entry in `docs/log-inbox/harness.md` that closes ticket #393 (cite it), Status flip,
   committed in a second docs-only commit (no visual check: RC-17 closure in the same lane). Exit `Outcome: done`.

## HARD STOP

If the fix needs a file other than the test: stop, `Recommended:` line.
