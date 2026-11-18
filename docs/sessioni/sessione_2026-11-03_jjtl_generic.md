# Session 2026-11-02/03: JjTL slices A0, A and B (chat C-2026-11-02-1541)

Continues `sessione_2026-11-02_jjtl_generic.md`.

## State

On the trunk: A0 (`8f14055bf`), A (`c58e00349`), B (`f716c5f31`), R-JTG-1..9, the reports on the textual notation for templates and on M1 depending on M1. No lane of this chat running. Worktrees of merged branches not retired: `~/jjodel-w-jjtlgeneric`, `~/jjodel-w-jjtlcontain`, `~/jjodel-w-jjtlnotation`, `~/jjodel-w-jjtlcalled`. Rollback tags: `pre-merge-jjtl-a0-2026-11-02`, `pre-merge-jjtl-containment-2026-11-02`, `pre-merge-jjtl-called-2026-11-03`.

## Verification

Gates on `f716c5f31`: 13193 tests, 0 failed, 9 files red at import (known). App probe on the branch at `04acda933`: all checks true, with four scenarios edited around #473 and #474. No hand run on the trunk: where a merge Status reads visual verification passed, what was verified is HTTP 200 on 3001 plus the branch probe. The merge P-2026-11-02-2245 was blocked on 15 vitest failures (hook tests and simRandom) during another chat's stress test; the branch is docs only; cause not proven.

## Open

Provisional, unattended: the `= expression` form, builtins `extendEnv`, `envHas`, `envLookup`, depth limit 256, a bound value's matched descendants resolved through the trace, `resolve()` finding matched targets only. Tickets: #473 (high), #474, #475, #445, #446, #447, #457, #458. C0, D, C1 and the cross-model reference in `codegen` await a GO. Not done: the real transformation rewritten by hand, the acceptance measure of the source prompt.

## Lessons

Lanes on this front reach the context ceiling in about 15 minutes: split by step, commit each. A probe result is valid only if its mtime follows the run. `lane-run status` can exceed the bridge's limit under high load: read `exit.txt`. `merge --launch` is refused when code changed on both sides: run `merge --trunk-into` first, and rerun the probe.
