# Textual syntax, step B2 discovery, continuation: write and commit the report (continues P-2026-11-04-0005 after the context ceiling)

Prompt-ID: P-2026-11-04-0021
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-04 · lane fast · 10133057a
Lane: fast (report only; measurements done)
Depends: P-2026-11-04-0005 (hard-stop at the ceiling; findings with file:line and figures in its handoff)
Worktree: ~/jjodel-w-textb2, branch textual-b2-discovery (the same tree)
Request: none (RC-51 continuation, no new words from Alfonso)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 1f5e99097 and the only changes are the untracked probes under docs/discovery/harness/, otherwise stop with Outcome: blocked. No production code, no new measurements unless a figure in the handoff is missing. Every reply opens with [P-2026-11-04-0021 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. No subagents, no background tasks.

## COSA
From ~/.jjodel-lanes/P-2026-11-04-0005/handoff.md, write docs/discovery/discovery_2026-11-04_textual_b2_outline_hover.md as docs/prompts/claude_2026-11-04_0005_prompt_textual_b2_discovery.md asks (objective, files read, findings with file:line and figures, the label table over every corpus case, risks, one recommended design per point with rejected alternatives, Decisions taken (unattended), Decisions awaiting Alfonso). On the hover card, state plainly: Monaco's own hover cannot stay open through public API (the sticky switch is a constant in the source); what works is trusted command links inside the hover and a pinned card as a content widget with our own close rules; Shift+F12 shows nothing with a single use. Commit the report and the probes; log entry in docs/log-inbox/codegen.md (Notes under 500 characters); npm run check:docs through node scripts/run-quiet.mjs; Status flips of 0005 and this prompt. Commit the docs. Stop with Outcome: question. Public repo: name no partner company. No push, no merge.
