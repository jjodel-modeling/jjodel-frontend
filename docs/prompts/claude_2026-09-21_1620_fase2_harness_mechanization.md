# Prompt P-2026-09-21-1620, Phase 2: harness mechanization, decisions and scope

Prompt-ID: P-2026-09-21-1620 (Phase 2 of `claude_2026-09-21_1620_prompt_harness_mechanization_phase1.md`)
Chat: C-2026-09-21-1620
Status: eseguito 2026-09-21 · lane harness · ff5e5a84f
Repo: `~/jjodel-release` (trunk `alfonso-frontend-jjtl`, HEAD `63757d5f3` or later).
Report this phase answers: `docs/discovery/discovery_2026-09-21_harness_mechanization.md` (`63757d5f3`).
Protocollo: docs/PROTOCOL.md, clausole P1..P15 applicabili (tutte salvo deroga esplicita nel prompt).
Every message opens with `[P-2026-09-21-1620 · session <id>]`.

The report holds. Three premises of the Phase 1 prompt were wrong and the report corrected them:
the status flip is written nowhere, §4.6 gives the checkpoint to the architect, and no clause names
`rm` or a whole-tree restore. The decisions below take the report's evidence as it stands and were
ratified by Alfonso in the project chat on 2026-09-21. Where a decision needs a clause, the clause
lands in a docs commit before the setting or the hook that enforces it (P15: a rule binds where it
is written).

## Decisions (answers to the sixteen questions of the report)

1. Model: `claude-opus-5`, the full ID, in `.claude/settings.json`. The alias floats with releases,
   a pin is explicit. `CLAUDE.md` §0 stops naming a model and points to the file. No
   `PreModelSwitch` hook in this lane (unmeasured).
2. Critical-zone matcher: the §3.2 trigger, the six named files plus the D-layer write paths §3.2
   lists. The §3.1 table stays what it is, the attention list in prose. A gate on §3.1 would have
   fired on the S6 lane and on 42 commits since September, and a gate that fires on routine work
   teaches everyone to route around it.
3. Evidence for the Layer Impact Report: `permissionDecision: "ask"` with no state. The reason
   names §3.2 and asks the human to confirm that the report exists. The transcript is unreliable
   (probe 7), a marker file is an honor system, and the prompt-line candidate depends on a
   session-to-prompt mapping this lane does not build (decision 5). The cost is one terminal prompt
   per edit of six files, which happened in 2 commits since 2026-09-01.
4. `Stop` hook for the log entry: none in this lane. Blocking is destructive (probe 6A) and fires at
   every phase hard stop; warning has an unmeasured rendering and no attribution key. Ritual 3 is
   held by the `log-entry` skill plus `check:docs`. Recorded as a ticket, reopened when decision 5
   gives a session-to-prompt key.
5. Prompt-ID on messages: stays prose in this lane. The paste behaviour of `UserPromptSubmit` is
   unmeasured; Phase 2 leaves a ready probe settings file for Alfonso to run interactively (see
   COSA, batch B) and the mechanization of R5, with the `Stop` hook of decision 4, is a lane of its
   own.
6. Subject length: amend `CLAUDE.md` §6.2. The 72-character limit is measured on the subject
   without its trailing ` (P-YYYY-MM-DD-HHmm)` suffix; the suffix stays, because it is what makes
   the log chains resolvable from `git log --oneline`. The hook strips the suffix before counting.
7. The project `ask` on `git commit*` stays: it is the human gate, and a hook fails open (H8) while
   an `ask` rule does not. The `Bash` hook only adds refusals.
8. Status line: write the clause first, as a bullet of P13, then the `status-flip` skill. The
   clause: every prompt file opens with `Status: da eseguire`; the closing docs commit of the lane
   flips it to `eseguito <date> · lane <name> · <sha>`; after the human visual check the chat, or
   the session on an ACK from the chat, appends ` · verifica visiva passata|fallita <date>`. Two
   flips, both recorded in the file, none automatic.
9. Checkpoint: stays with the architect, §4.6 unchanged, no skill.
10. Hook interpreter: plain `.mjs`, no TypeScript syntax, invoked as
    `node "$CLAUDE_PROJECT_DIR/frontend/scripts/hooks/<name>.mjs"`; runs on node 16 to 26, no
    absolute interpreter path committed. The deny list is the fail-closed layer under every hook.
11. Skill single source: live injection of §21.2 from `CLAUDE.md`, no copy, with a guard that exits
    2 when the extraction is empty (so a renamed heading aborts the skill instead of loading it
    hollow). `check:docs` Check A is not touched.
12. Deny extensions: only the whole-tree restore forms, and only after the clause. RC-13-bis in P9
    says a tracked file is restored "solo con `git checkout HEAD -- <path>`": the amendment says
    `<path>` names files, never `.` or a directory, and that `git reset --hard`, `git restore` with
    `.` or a directory, and `git clean` are the same class of incident on a shared tree. Plain `rm`
    stays out (no clause, and `rm -rf*` stays as it is, a pre-existing deny without a clause, noted
    in the log entry, not fixed here).
13. Branches: no carry. `validation-skeleton` is closed (decision of 2026-09-21) and
    `simulation-engine` takes the trunk at its next realignment. Said in the log entry.
14. The user-level `effortLevel` value is not quoted anywhere. It is irrelevant: the project pin
    wins at launch (probe 3).
15. The probe transcripts under `~/.claude/projects/` stay. They are user-level state outside the
    repo; Alfonso deletes them if he wants.
16. The `include` line in `frontend/vitest.config.ts` is in scope (rule 5 and rule 19 flagged in
    the entry, `Out-of-scope changes: no` because this file declares it).

## COSA

Two batches, each closed by a hard stop with the gates reported. Docs and code never in the same
commit (P13). Every commit of this lane must pass the hooks it introduces: test your own commit
commands against `bash-guard.mjs` before running them.

**Batch A, rules and enforcement.**

- A1 (docs): `docs/PROTOCOL.md`: P13 gains the Status-line bullet (decision 8); P9 RC-13-bis gains
  the whole-tree amendment (decision 12); version 1.4 becomes 1.5 with the date. The P9 format
  block is not touched (Check A compares it byte for byte with `CLAUDE.md` §21.2).
  `CLAUDE.md`: §6.2 (decision 6, the suffix rule), §0 (decision 1: the model is named only in
  `.claude/settings.json`; the effort text stays; §0 keeps the `claude update` note). Then
  `npm run gen:agents`, `npm run check:agents`, `npm run check:docs`. Commit subject
  `docs: clauses for the status line, whole-tree restore and subject suffix (P-2026-09-21-1620)`.
- A2 (code): `.claude/settings.json`: `"model": "claude-opus-5"`; `deny` gains `Bash(git stash *)`,
  `Bash(git stash)`, `Bash(git add --all*)`, `Bash(git add -u*)`, `Bash(* --no-verify*)`,
  `Bash(git checkout HEAD -- .)`, `Bash(git checkout -- .)`, `Bash(git restore .)`,
  `Bash(git restore --staged .)`, `Bash(git reset --hard*)`, `Bash(git clean*)`. No `hooks` block
  yet. Commit subject `chore(harness): pin claude-opus-5 and deny the whole-tree forms
  (P-2026-09-21-1620)`.
- A3 (code): `frontend/scripts/hooks/lib.mjs` (stdin JSON parse, output helpers, suffix strip,
  heredoc and quoted-string stripping for the wrapper check), `bash-guard.mjs` (PreToolUse on
  `Bash`: on `git commit` require ` -- <paths>` in the command, the `Model:` trailer in the message
  when the message is in the string or in a readable `-F <file>`, subject within 72 after the
  suffix strip, and no pathspec that mixes `docs/` with non-docs paths; each violation is a `deny`
  whose reason cites the clause; a wrapper form of `git stash` found after stripping heredocs and
  quotes is an `ask`), `critical-zone.mjs` (PreToolUse on `Edit|Write|NotebookEdit`: `ask` with
  the §3.2 reason when `tool_input.file_path` resolves to one of the six files or the D-layer write
  paths §3.2 lists; the list is read from a constant in the script and the script's test compares
  that constant with `CLAUDE.md` §3.2 so the two cannot drift silently), tests under
  `frontend/scripts/hooks/__tests__/` that run each script as a subprocess with real stdin JSON
  (P11) and carry a mutation bench (§5: each mutant red then restored, listed in the commit body),
  `frontend/vitest.config.ts` (one `include` entry). Commit subject `feat(harness): bash guard and
  critical-zone ask hooks with subprocess tests (P-2026-09-21-1620)`.
- A4 (code): `.claude/settings.json` gains the `hooks` block wiring A3, after A3 exists (a `hooks`
  block naming a missing script fails open). Then a live check in the session itself: a
  `git commit` without pathspec is refused with the reason; a commit with pathspec, trailer and
  a short subject passes; an `Edit` on a §3.2 file prompts. Report the three outputs verbatim.
  Commit subject `chore(harness): wire the hooks (P-2026-09-21-1620)`.
- Hard stop A: gates (`npm run typecheck` at baseline, `npx vitest run` with the count, `npm run
  build`, `npm run check:docs`, `npm run check:agents`), the four shas, the three live outputs.

**Batch B, skills, pointers, registers.**

- B1 (code): `.claude/skills/log-entry/SKILL.md` (injects §21.2 live from `CLAUDE.md` with the
  empty guard, points to §21.3 for the field semantics, writes to `docs/log-inbox/<lane>.md`,
  `allowed-tools` limited to what the extraction needs), `.claude/skills/discovery-report/SKILL.md`
  (P4 naming and minimum content, path `docs/discovery/`), `.claude/skills/status-flip/SKILL.md`
  (the two flips of decision 8, exact wording, `disable-model-invocation: true` so only the user
  invokes it). Commit subject `feat(harness): log-entry, discovery-report and status-flip skills
  (P-2026-09-21-1620)`.
- B2 (docs): `CLAUDE.md` §1 gains the pointer sentence to `.claude/settings.json` (deny list and
  hooks), `frontend/scripts/hooks/` and `.claude/skills/`; `gen:agents`, `check:agents`,
  `check:docs`. `docs/HARNESS-DOCS.md` §6: the gates table gains the deny list, the two hooks and
  the three skills, each with the clause it holds and the words "fails open" where true; version
  1.3 becomes 1.4. `docs/decisions.md`: one ratification line, RC-15, for the direction of
  2026-09-19 (norms move to enforcement where a machine holds them honestly; deny list fail-closed,
  hooks fail-open and say so, skills for the form, prose for what has no signal) with the sixteen
  decisions by number. `docs/discovery/harness/probe_2026-09-21_userpromptsubmit.json`: a settings
  file for the interactive paste measurement of decision 5, with a one-paragraph README line in the
  report addendum on how Alfonso runs it (`claude --settings <file>` in a scratch directory, paste
  a `[P-...]` message, read the log). Commit subject `docs: pointers, HARNESS-DOCS 1.4, RC-15 and
  the R5 probe (P-2026-09-21-1620)`.
- B3 (docs): the entry in `docs/log-inbox/harness.md` (P9 format, `Corregge: —`, `Causa: —`,
  `Regressions: no` only if the live checks of A4 and the gates say so, else `unknown`,
  `Out-of-scope changes: no`, `Layer Impact Report: not-required`, `Smoke visivo: non applicabile`,
  `Notes` under 500 characters naming the two tickets: the `Stop` hook of decision 4 and the
  `rm -rf*` deny without clause; `Prompt document name: 2026-09-21 16:20`), the Status flip of both
  prompt files (Phase 1 and this one) to `eseguito 2026-09-21 · lane harness · <sha of A4>`. Commit
  subject `docs: harness lane entry and Status flip (P-2026-09-21-1620)`.
- Hard stop B: gates again, the shas, and the list of every file touched in the lane with one line
  each (more than five files: RC-11, listed here and repeated in the entry).

## DOVE

Writes, and only these: `.claude/settings.json`, `.claude/skills/log-entry/SKILL.md`,
`.claude/skills/discovery-report/SKILL.md`, `.claude/skills/status-flip/SKILL.md`,
`frontend/scripts/hooks/lib.mjs`, `bash-guard.mjs`, `critical-zone.mjs`,
`frontend/scripts/hooks/__tests__/*.test.ts`, `frontend/vitest.config.ts`, `CLAUDE.md` (§0, §1,
§6.2 only), `AGENTS.md` (generated, never by hand), `docs/PROTOCOL.md` (P9, P13, version line),
`docs/HARNESS-DOCS.md` (§6, version line), `docs/decisions.md` (one line, RC-15),
`docs/discovery/harness/probe_2026-09-21_userpromptsubmit.json`, the Phase 1 report (addendum
only, dated, existing text untouched), `docs/log-inbox/harness.md`, the two prompt files (Status
line only). Not touched: `frontend/src/**`, `frontend/scripts/gates/**`, `frontend/tsconfig.json`,
`~/.claude/**`, `.mcp.json` (none is created), any other branch, any other section of `CLAUDE.md`.
No new dependency.

## COME

Preflight as in Phase 1 (worktree, HEAD, clean tree, `Claude-Session` grep). The P14 symlink for
the gates, removed before each hard stop, never committed. `.claude/` and `.mcp.json` are protected
paths: expect a prompt on every write there and say so in the report, do not work around it.
Gates run with `~/.local/bin/node` (v26); the hook tests must also pass when run with
`/opt/homebrew/bin/node` (v23) once, reported, because the hooks are promised to run on any node
the launcher provides. `str_replace` over rewrites. Every claim of absence names its search with a
positive control (R-RAIL-28, P12). Commit bodies carry the P6 `Model:` trailer in the same
paragraph as `Co-Authored-By`; the executor is whatever the banner shows. No rotation (P13), no
push: report the shas and stop.

Stop-and-ask conditions: a hook cannot be made to pass on this lane's own commits without a
false-positive the report did not predict; `check:agents` is red after the §0 or §1 edit for a
reason other than the expected regeneration; the `ask` decision of `critical-zone.mjs` is not
honored in the session's permission mode; the skill injection is blocked by permissions in the
real project directory (probe 8 passed only inside `${CLAUDE_PROJECT_DIR}`); any clause text in
P9 or P13 would alter the byte-compared P9 block.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-21_harness_mechanization.md`: H1 (table and escapes), H2
  (matcher and candidates), H3 (the two designs), H4 (injection and guard), H5 (precedence, IDs),
  H6 (deny semantics, `tool_input.command` shapes), H8 (interpreters), §5, §6, §7.
- `docs/PROTOCOL.md` P6, P9 (RC-13-bis), P13, P15; `CLAUDE.md` §0, §1, §3.2, §5, §6.1, §6.2, §21;
  `docs/HARNESS-DOCS.md` §6; `docs/decisions.md` RC-11, RC-13.
- Official docs for 2.1.278: `hooks.md` (PreToolUse decision control, `ask`; exit codes; Stop),
  `permissions.md` (Bash patterns, `ask` not lifted by hooks), `skills.md` (dynamic content,
  `disable-model-invocation`), `settings.md` (precedence), `model-config.md` (IDs).
- `docs/prompts/claude_2026-09-21_1455_prompt_symbol_editor_s6_underline_corner_rules.md` and
  `docs/log-inbox/symbol-editor.md`: the last lane, the sample every hook must let through.
