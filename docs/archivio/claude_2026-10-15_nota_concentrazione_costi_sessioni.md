# Session cost concentration: input for the lean-context Phase 2

Date: 2026-10-15. Author: project chat, measurement run on the Mac through osascript. For: chat C-2026-10-15-1724, which owns P-2026-10-15-1725 and its report `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md`. This note is not a prompt and records no decision.

## Method

- Source: local Claude Code transcripts under `~/.claude/projects/*jjodel*`, files modified in the 14 days to 2026-10-15.
- Sample: 185 sessions with more than two turns; 16,061 assistant messages deduplicated by `message.id`. Subagent transcripts stored in their own files count as their own sessions.
- Prices: API list prices for Opus 5.5, $4 input, $20 output, $5 cache write (5-minute TTL assumed), $0.20 cache read.
- Aggregates by script only. No transcript entered the chat context.

## Findings

1. Total input context D is 3.97B tokens, and Opus carries 93% of the messages. The Opus API-equivalent cost is $1,346 over 14 days, about $1,500 if the writes use the 1-hour TTL; Sonnet adds less than $70. That is about $3,000 a month at list price.
2. Cost is concentrated. The median session costs $5.79, the top 10% of sessions carry 35% of the cost, and the most expensive one cost $110.
3. Context growth drives the cost, not the initial prefix:
   - first-turn context: median 48k tokens, which is about 19% of D summed over all turns, in line with the 19.4% of report §3.3;
   - last-turn context: median 264k, p90 467k, max 863k;
   - turns per session: median 72.
4. The ten most expensive sessions are all discoveries, or discovery plus fix, on Opus, and all end between 416k and 863k tokens of context:
   - P-2026-10-10-0105 (graphVertex), $110: 751 turns from 2026-10-09 23:04 to 2026-10-10 18:50, with several slices carried in one session;
   - P-2026-10-03-1304, $69;
   - P-2026-10-02-1450, $35;
   - P-2026-10-01-2215, $29;
   - P-2026-10-11-1156, $27.
5. Crude simulation: capping each turn's context at 150k tokens lowers the 14-day Opus figure from $1,346 to about $1,003, that is -25%. The simulation truncates the context instead of restarting from a handoff, so the figure is an upper bound on what a ceiling can save, not a forecast.
6. `docs/decisions.md` is 643 KB and was opened by Read in 31 of the 185 sessions. `CLAUDE.md` line 62 still describes it as one line per decision.

## Points the 1725 report does not cover

- **A context ceiling per session in `lane-run`.** This would be a token analogue of the RC-20 time limit: when the main context passes a threshold, the session writes its state to a file and exits with a hard stop, and work resumes from that file in a fresh session. The levers in the report are tool output, subagents and model choice; none of them bounds context growth, which is what findings 3 and 4 show.
- **One slice per session.** A lane that runs several slices under one Prompt-ID keeps the whole history in context (finding 4).
- **Price input for H5.** Several secondary sources report that the Sonnet 5.5 cache-read price fell from $0.20 to $0.10 per MTok on 2026-10-07, citing the Anthropic release notes. This chat has not checked the official pricing page. If the drop is confirmed, the -12% to -28% estimate in report §3.5 is low, because cache reads are the largest cost line.
