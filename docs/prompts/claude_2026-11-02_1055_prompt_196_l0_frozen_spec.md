# #196 L0, phase 2: frozen spec (continues P-2026-11-02-1020 after its context ceiling)

Prompt-ID: P-2026-11-02-1055
Chat: C-2026-11-02-1016
Front: ai-provider
Lane: full (docs only)
Depends: P-2026-11-02-1020
Status: eseguito 2026-11-02 · lane 196-ai-refactor · ad209a6ad
Corregge: —
Request: Juri, 2026-11-02, in chat (GO on phase 2 of P-2026-11-02-1020 with decisions R-AI-1..5)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/development/jjodel-196`, branch `docs/196-l0-spec`, at the commit that adds this prompt, on top of
`cc252b1ca` (rows R-AI-1..5). Before anything else: `pwd`, branch, `git log -3 --oneline`, `git status --short` (only
the `frontend/node_modules` symlink may show). Otherwise stop.

## Context

Lane P-2026-11-02-1020 ran phase 1 of #196 L0 and committed the discovery report
`docs/discovery/discovery_2026-11-02_196_l0_ai_layer.md` (`712aae6dd`). Juri answered its questions; the chat committed
the rows R-AI-1..5 in `docs/decisions.md` (`cc252b1ca`). The lane received the GO and stopped at the AM-8 context
ceiling before writing anything (RC-51: it continues as a new lane). Its handoff is
`~/.jjodel-lanes/P-2026-11-02-1020/handoff.md`: read it first and in full. It is the task list of this lane; this
prompt only fixes scope and closure.

## COSA

1. The frozen spec `docs/spec/claude_spec_2026-11-02_ai_provider_refactor.md`, as item 1 of the handoff says: the plan
   (second half of `~/.jjodel-lanes/spike196/issue196.md`, lines 160-420) with the 15 file-list corrections (A4), the
   transport table with today's file:line and tests (A6), the localStorage keys (A5), the pins (C), the spike measures
   (B), the decisions cited as R-AI-1..5, L5 marked done (`b524fa1da`), question 6 (Anthropic key, OpenAI credit)
   recorded as a precondition of L4 that does not block L1. Status line «frozen 2026-11-02». Read the report by ranges,
   section by section as you write; do not load the whole report and the whole plan at once. Commit it alone:
   `docs: #196 L0 frozen spec, AI provider refactor`.
2. Before committing the spec, run the key-material scan the handoff names (compare the file against the values in
   `~/.jjodel-lanes/keys196.env` in a node one-liner that prints only a hit count). Zero hits or stop.
3. Closure commit (docs only, P13): the `## 0. Answer in brief` section of the discovery report in the shape P16 gives;
   the log-inbox entry in `docs/log-inbox/196-ai-refactor.md` (skill `log-entry`), one entry for L0 that names both
   Prompt-IDs; the `Status:` line of BOTH prompts (skill `status-flip`): P-2026-11-02-1020 ends at `712aae6dd` with
   «phase 2 in P-2026-11-02-1055», this one at the spec commit. `npm run check:docs` through the quiet runner, green.

## DOVE

- `docs/spec/claude_spec_2026-11-02_ai_provider_refactor.md` (new)
- `docs/discovery/discovery_2026-11-02_196_l0_ai_layer.md` (the «Answer in brief» section only)
- `docs/log-inbox/196-ai-refactor.md` (new)
- the `Status:` lines of `docs/prompts/claude_2026-11-02_1020_prompt_196_l0_ai_spec_discovery.md` and of this prompt

## HARD STOP

- The scan of item 2 finds a hit.
- A fact the spec needs is in neither the report nor the plan: write it as an open item in the spec, do not rerun the
  spike or the inventory.

## NON FARE

Nothing in `frontend/`, `package.json`, `docs/decisions.md` or `cloudflare-worker/`. No spike run, no network call. No
merge, no push, no issue comment.

## Lane discipline

Every reply opens with `[P-2026-11-02-1055 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended (RC-21,
RC-25) except the RC-26 list. Time limit: 60 minutes. No subagents, no background tasks. Context discipline (CLAUDE.md
§0.1). Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Every commit with
`git commit -- <paths>`, after comparing `git diff --cached --name-only` with the declared files. `Outcome: done` at the
end.
