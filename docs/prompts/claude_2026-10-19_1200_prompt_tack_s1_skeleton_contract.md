# Tack slice 1: skeleton, contract v1 schemas, `tack check`

Prompt-ID: P-2026-10-19-1200
Chat: C-2026-10-19-0001
Front: tack
Lane: fast (new isolated folder `tack/`, no existing file touched outside the DOVE; discovery done in P-2026-10-19-1100)
Status: eseguito 2026-10-19 · lane tack-s1 · code commit b47906cf6, docs commit carrying this line
Depends: P-2026-10-19-1100
Corregge: none
Request: Alfonso, 2026-10-19 11:54, in the project chat: «ok alle raccomandazioni», after the Tack v0 discovery

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (the discovery is `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md`, §5, §6 and §11). P8 does not apply (no UI).

Worktree: `~/jjodel-w-tack-s1`, branch `tack-s1`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-1200 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. Read `docs/decisions.md`, the logs and every file above 500 lines with `offset`/`limit` or `rg`, never whole.

## Context

Tack is the project-agnostic harness monitor planned in the vision document (MIT, maintainers Alfonso and Juri) and inventoried in P-2026-10-19-1100. Until it moves to its own repository, **Tack lives in the top-level folder `tack/` of this repository**, self-contained: nothing in `tack/` imports from `frontend/`, nothing outside `tack/` imports from it, and the folder must work unchanged after `git subtree split --prefix=tack`. This is the chat's decision of 2026-10-19 (reason: the lane harness, worktrees and gates keep working while Tack is young; the extraction keeps the history).

Decisions already taken, not to be reopened (report §9 and §11): Node ≥ 22, ESM, plain `.mjs`, no TypeScript build, **no runtime or dev dependency** (validation is hand-written, tests use `node:test`); the log of an adopting repository is one append-only file `.tack/log.jsonl`; commit linkage accepts the trailer `Unit: <id>` (canonical) and the subject suffix `(P-...)` (alias); the store keeps metadata only.

## COSA

1. **Skeleton**, following report §6.1 but only what slice 1 needs: `tack/package.json` (name `tack`, `private: true`, `license: "MIT"`, `type: "module"`, `engines.node: ">=22"`, `bin: { "tack": "bin/tack.mjs" }`, script `test`: `node --test test/`), `tack/LICENSE` (MIT, `Copyright (c) 2026 Alfonso Pierantonio and the Tack contributors`), `tack/README.md` (what Tack is in five lines, the three data layers, `tack check` usage, "status: slice 1 of 7").
2. **Contract v1**, in `tack/contract/v1/`: `unit.json` (identity layer) and `entry.json` (one log entry), as JSON Schema 2020-12 documents taken from report §5.2, with the field names of §5.1 and the resolutions of §11. `contract/v1/README.md` gives the field table (name, type, required, meaning, origin in Jjodel's §21.2) and states which rules are structural (schema) and which are referential (`tack check` pass 2).
3. **`tack check [file]`** in `tack/bin/tack.mjs` plus `tack/src/contract/validate.mjs`: reads a JSON Lines file (default `.tack/log.jsonl` in the current directory), validates each line against the v1 rules with a hand-written validator (no generic JSON Schema engine: one function per rule, each returning `{ line, field, rule, message }`), then a referential pass: unit ids unique, every `corrects` resolves to an earlier id in the file, `cause` present exactly when §21.3 requires it. Exit code 0 when clean, 1 with one line per violation `file:line field rule: message`. Unknown subcommands print usage and exit 2.
4. **Tests** in `tack/test/`: fixtures `valid.jsonl` (10 synthetic entries covering every outcome and both commit-linkage forms) and `invalid/` (one file per rule of report §5.3 "kept" and "gained", at least 10, each breaking exactly one rule); `check.test.mjs` asserts that every valid entry passes and that each invalid file fails with exactly the expected rule. Fixtures are synthetic: no text from real transcripts, logs or prompts.
5. Run `cd tack && node --test test/` and `node bin/tack.mjs check test/fixtures/valid.jsonl`; paste both outputs (counts only) in the entry.

## DOVE

`tack/**` (new), `docs/log-inbox/tack.md` (one entry), this prompt's `Status:` line. Nothing else.

## Gates

`cd tack && node --test test/` green; `check:docs` after the commit (from `frontend/`, as the other lanes run it).

## Commits (P13, RC-17), explicit pathspecs, no push

1. `feat(tack): skeleton, contract v1 and tack check (P-2026-10-19-1200)` with `tack/**`. Trailer `Model:` (P6).
2. `docs: Status flip and log entry for Tack slice 1 (P-2026-10-19-1200)` with the entry and the Status line.

## NON FARE

No file outside `tack/` except the two docs of the DOVE. No `npm install`, no `package-lock.json`, no dependency of any kind. No import from `frontend/`. No collector, store, metric or board code (slices 2..5). No real transcript or log content in fixtures. No new GitHub repository, no push.

## HARD STOP

None planned: close with `Outcome: done`. `Outcome: question` only if a rule of §5.3 cannot be expressed without a dependency.

## RIFERIMENTI

- `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §5 (contract draft), §6.1 (layout), §6.3 (slice 1 criterion), §9 and §11 (decisions)
- `CLAUDE.md` §21.2 and §21.3 (the Jjodel log format the contract derives from)
- `frontend/scripts/gates/check-docs.ts` (the checks `tack check` re-expresses)
