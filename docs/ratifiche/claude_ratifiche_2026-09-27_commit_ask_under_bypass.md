# Ratification 2026-09-27: the commit gate of a launched lane (RC-29)

**Date**: 2026-09-27, 00:10. **Branch**: `alfonso-frontend-jjtl`. **Reference commit**: `651f10543`.
**Source**: simulator and harness chat `C-2026-09-26-1702`, measured from the chat on the real tree after the first two orchestrated launches (`P-2026-09-26-2340`, `P-2026-09-26-2350`) both stopped at their first `git commit`.
**Rows**: `docs/decisions.md`, «Ratifica 2026-09-27: the commit gate of a launched lane».
**Status**: decided under RC-25 (`provisional, unattended`) on Alfonso's request in chat («non possiamo lanciare adesso una lane-run per sistemare l'harness?»); the digest of lane C1 carries it.

## What was measured

Both lanes launched by `lane-run` on 2026-09-26 (session `permissionMode: bypassPermissions`, model `claude-opus-5-5`) ended with `Outcome: question` at their first commit: `Claude requested permissions to use Bash, but you haven't granted it yet`, one entry in `permission_denials`. The discovery of `P-2026-09-26-1640` (§7) had measured the opposite in a probe repository (0 denials under bypass). Four probes from the chat, `claude -p` on `~/jjodel-release` at `651f10543`, each asked to run one command and report:

| # | Command | Settings | Result |
|---|---|---|---|
| 1 | `git commit --allow-empty -m …` | trunk | refused by `bash-guard` (P13: a commit takes a pathspec) |
| 2 | `git add f && git commit -m … -- f` | trunk | refused by `bash-guard` (P6: no `Model:` trailer) |
| 3 | same, with the `Model:` trailer | trunk | **refused by the `ask` rule** (`permission_denials` 1, nothing staged) |
| 4 | same, `--allowedTools 'Bash(git commit*)' 'Bash(git add *)'` | trunk | **refused by the `ask` rule**: `allow` does not override `ask` |
| 5 | same, `Bash(git commit*)` removed from `permissions.ask` | trunk, edited | **committed** (`d3819d857`, dropped with `git reset HEAD~1`; settings restored byte for byte) |

So on the real tree the `ask` on `git commit*` holds under `-p` and `bypassPermissions`, and a launched lane cannot commit while the rule exists. The probe repository of 1640 differed in a way not identified (its result is not reproduced here); the measurement that counts is the one on the tree the lanes run in. `bash-guard` kept every rule of its own in all five probes (pathspec, `Model:` trailer, push deny), so the hook layer is intact without the `ask`.

## Decision

**RC-29, the commit gate of a lane is the hook layer, not an `ask`.** `Bash(git commit*)` leaves `permissions.ask` in `.claude/settings.json`; `Bash(git push*)` stays (the push is Alfonso's act, RC-19, and `bash-guard` denies it under bypass anyway). A commit from a session, interactive or launched, is gated by `bash-guard` (pathspec after `--`, `Model:` trailer, no `--no-verify`, no merge state read from another tree) and by the lane's own gates before the commit (typecheck, vitest, build, the mutation bench), and reviewed after the fact through the digest and the veto of RC-25. The interactive human gate on `git commit` of 2026-09-21 is withdrawn: RC-19 had already moved human gates off `ask`, and RC-25 moved ratification after the decision. The change is applied to the trunk now and reaches `simulation-engine` with the next merge; a lane already running keeps the settings it loaded.

## What stays manual, on purpose

The push, the visual GO until 2026-10-03 (RC-23), the pre-approval list of RC-26. A lane that stops with a question still needs `lane-run resume`, by the chat.

## Ticket

Recorded in `docs/log-inbox/harness.md` by the next harness lane, not here: the 1640 probe repository gave a result the real tree does not; the probe design (a fresh `git init` with a copied `settings.json`) is not a valid oracle for permission rules, and §7 of that report should be read with this memo beside it.
