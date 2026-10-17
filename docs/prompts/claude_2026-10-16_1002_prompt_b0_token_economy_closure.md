# B0: close the 2026-10-13 token-economy leftovers, read-only subagents on Sonnet

Prompt-ID: P-2026-10-16-1002
Chat: C-2026-10-15-1724
Front: harness
Lane: full, interactive session (writes `.claude/`, protected path: RC-19, RC-36). Not run through `lane-run`, not eligible for the RC-45 draw.
Corregge: P-2026-10-13-1930
Request: Alfonso, 2026-10-16 09:37 (RC-49): «Sì: B0 per primo; AM-1; AM-5; AM-7; subagent di sola lettura (Explore, explorer) su Sonnet subito, general-purpose dopo la misura di B1.»
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else: `pwd`, branch, `git log -1`, `git status`. If the branch differs, stop with `Outcome: blocked`. Expected dirty state: `CLAUDE.md` modified (the §0/§0.1 text of P-2026-10-13-1930, never committed). Any other uncommitted change: list it and do not touch it.

Model: Opus 5.5 as pinned. Effort: high (AM-7, ratified in RC-49: heavy work outside the critical zone runs at high).

## Lane discipline
Every reply opens with `[P-2026-10-16-1002 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`. Time limit: 60 minutes.

## Context (read, do not redo)

- Report `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md`: §2.6 (what P-2026-10-13-1930 delivered and what it did not), §5.6 (B0), §7.1 and §7.5 (B0 row).
- `docs/decisions.md`, row RC-49 (line 294 at the time of writing), and RC-16, RC-19, RC-36.
- `docs/prompts/claude_2026-10-13_1930_prompt_token_economy_harness.md`: its DOVE and acceptance.
- Official mechanism for the built-in `Explore` subagent, verified by the chat on 2026-10-16 in the Claude Code subagents documentation (https://code.claude.com/docs/en/sub-agents): built-in `Explore` runs on the main conversation's model; `CLAUDE_CODE_SUBAGENT_MODEL` alone does not change it; a project subagent named `Explore` overrides the built-in and keeps its own `model` field. Model resolution order: per-invocation `model`, then the definition's `model` frontmatter, then `CLAUDE_CODE_SUBAGENT_MODEL`, then the main model. Do not use `CLAUDE_CODE_SUBAGENT_MODEL` or `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`: they would also move `general-purpose`, which RC-49 defers until after B1.

## COSA

1. **The uncommitted `CLAUDE.md` §0/§0.1.** Show `git diff --stat CLAUDE.md` and confirm that the diff is only the §0 effort text and the new §0.1 output discipline. Check §0 against AM-7 as ratified (heavy default `high`, `xhigh` for the critical zone and visual bugs). If anything in the diff goes beyond that or contradicts RC-49, stop with `Outcome: question` before committing. Otherwise keep the text as it is; regenerate with `npm run gen:agents` and pass `npm run check:agents`.

2. **`.claude/settings.json`.**
   - Register `frontend/scripts/hooks/output-budget.mjs` as a `PreToolUse` hook on `Bash`, in the same form as the existing `bash-guard.mjs` entry. Decide the order relative to `bash-guard` and say why in one line.
   - Add the permission allow entry the 2026-10-13 prompt specified for `node scripts/run-quiet.mjs`, if it is missing.
   - Set `effortLevel` to `high` (AM-7).
   - Nothing else in this file: model IDs in `env` (AM-1) belong to B3a and B7.

3. **Read-only subagents on Sonnet.**
   - `.claude/agents/explorer.md`: change `model: sonnet` to the full ID `claude-sonnet-5-5` (AM-1: no floating aliases). Tools unchanged.
   - `.claude/agents/Explore.md` (new): a project subagent named `Explore` that overrides the built-in, with `model: claude-sonnet-5-5` and only read-only tools (Read, Grep, Glob, and Bash if the built-in has it, subject to the same hooks). Its description and body keep the built-in's purpose: a read-only search agent that returns conclusions with `file:line`, not file dumps. Before writing it, check `/agents` or the documentation for the exact name and casing that the override requires, and that a project agent wins over the built-in at this Claude Code version (2.1.300).
   - `general-purpose` stays as it is.

4. **Verification, all measured and shown with exit codes.**
   - Hook tests: the existing `output-budget` tests, through `node scripts/run-quiet.mjs`.
   - Hook live, in this session after reloading the settings: one command the hook must deny (for example `cat` on a large file) and one it must allow (a bounded `grep -m 5`), plus one `# allow-large-output` override, checking that it lands in `.agent-logs/guard-overrides.log`.
   - Subagents: one minimal `Explore` invocation and one `explorer` invocation, each with a one-line read-only question. Show the model each one actually ran on from the session record (transcript `message.model` of the subagent, or the `/agents` view), not from the frontmatter. If `Explore` still runs on Opus, stop with `Outcome: question`, keep the file uncommitted and report what you saw.
   - `npm run check:docs`, `npm run check:agents`.

5. **Closure.** Flip `Status` of this prompt with the `status-flip` skill, and also the `Status` of `claude_2026-10-13_1930_prompt_token_economy_harness.md`, to the value that says it was completed by this correction. Write the log entry with the `log-entry` skill, `Corregge: P-2026-10-13-1930`, listing what the 2026-10-13 lane had left undone and what this session did.

## DOVE

- `.claude/settings.json`
- `.claude/agents/explorer.md`
- `.claude/agents/Explore.md` (new)
- `CLAUDE.md`, `AGENTS.md` and any file `npm run gen:agents` regenerates (list them; if it regenerates more than the root `AGENTS.md`, say so before committing)
- bookkeeping: this prompt and the 2026-10-13 prompt (Status lines only), the log file the `log-entry` skill writes

## COME

- Two commits with explicit pathspecs, never `git add .`: first `CLAUDE.md` with its generated `AGENTS.md` files (`docs(harness): commit output discipline and effort default (corrects P-2026-10-13-1930)`), then `.claude/` with the bookkeeping (`chore(harness): register output-budget hook, read-only subagents on Sonnet (P-2026-10-16-1002)`).
- Commit only after every check in step 4 has passed.

## HARD STOP

After the two commits. Close with `Outcome: done` and a short report: the hook decisions observed, the effective subagent models, the commits. If any step stopped with a question, close with `Outcome: question` and nothing committed for that step.

## NON FARE

- No change to `lane-run.mjs`, the board, other hooks, skills or application code.
- No `CLAUDE_CODE_SUBAGENT_MODEL` or `_FORCE`, no change to `general-purpose`.
- No normative text of AM-1, AM-5 or AM-7 in `docs/PROTOCOL.md` or `docs/decisions.md` (that is B2b).
- No change to user-level settings (`~/.claude/`).
- No push, no merge. No touch to RC-45 data.

## RIFERIMENTI

`docs/decisions.md` RC-16, RC-19, RC-36, RC-49; `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §2.6, §5.6, §7; `docs/prompts/claude_2026-10-13_1930_prompt_token_economy_harness.md`; `CLAUDE.md` §0, §0.1, §21; https://code.claude.com/docs/en/sub-agents.
