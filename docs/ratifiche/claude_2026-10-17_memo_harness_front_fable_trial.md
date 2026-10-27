# Memo 2026-10-17: harness front handover, AM-8/AM-9 thresholds, Fable 5.1 trial on the heavy tier

Chat: C-2026-10-17-1757 (architect, Fable 5.1)
Written under RC-25 (the chat decides and records; Alfonso has the veto, silence does not block). Alfonso's answer at 19:39, «francamente non sono in grado di rispondere, non saprei», to the question of which chat owns the harness front and to the three points below.

## 1. Front ownership (decided, unattended)

From this memo the harness front is owned by chat `C-2026-10-17-1757`. The previous owner, `C-2026-10-15-1724`, closed its lane P-2026-10-15-1725 on 2026-10-16 09:37 with the RC-49 ratification and has emitted nothing since: no B0 prompt in 34 hours, no section in `sessione_CORRENTE.md`. Whether that chat is still open in Alfonso's sidebar cannot be read from the repository, and he does not know. The mechanical rule applied: an owner chat whose last lane is closed and that has not written the next approved step within a day is treated as closed. If `C-2026-10-15-1724` turns out to be open, it stops emitting prompts for this front (one chat per front, decision of 2026-09-19); nothing it wrote is redone.

## 2. AM-8 and AM-9 thresholds (provisional, unattended; RC-26 veto window open)

RC-49 (5) accepted AM-8 (context ceiling per session) and AM-9 (one slice per session) in principle and left threshold and text to ratify. Adopted as proposed in report §7.3 and §7.4: soft ceiling 200k tokens of context (the hook denies once and asks for a handoff), hard ceiling 250k (only the handoff writes pass, then `lane-run next --fresh`); Phase 2 after a Phase 1 hard stop and a rework after a failed visual GO are new slices and start fresh from the committed report or Phase 2 prompt (amends RC-20 for those two cases). Evidence: the note of 2026-10-15 (`ba192edb0`), finding 4: the ten most expensive sessions were discovery plus fix in one session. The row enters `docs/decisions.md` with batch B8c, as §7.5 assigns it; nothing applies before B8a and B8b.

## 3. Fable 5.1 trial on the heavy tier (confirmed by Alfonso, 2026-10-17 18:54 «si confermo»; conditioned)

Alfonso asked at 18:41 whether to use `claude-fable-5-1` in the harness and confirmed the recommendation: not on the light or standard work, only as a measured trial on the heavy tier for discoveries and critical-zone lanes, where the cost that matters is rework, not the tokens of one lane. Conditions, in order:

- Batch B1 first (plan-usage recording per lane, report §7.2). The baseline of 2026-10-15 shows seven-day utilization rising from 0.77 to 1.0 inside the window with `isUsingOverage: true` at the end; Fable draws on the plan faster than Opus, so the trial without the number would aggravate the constraint it is meant to relieve.
- Then ten heavy lanes (discovery or critical zone, `Lane: full`, never RC-45 drawn lanes) on `claude-fable-5-1` at effort xhigh, compared with the ten previous heavy lanes on Opus 5.5 on the Insights metrics: tokens and plan usage per lane, first-shot success, `Causa c`, RC-23 outcomes, plus the count of unavailability fallbacks. The fallback, if Fable is unavailable, is the pin (`claude-opus-5-5`) with a marker in the log entry; RC-16 has no automatic chain and this adds none.
- Decision after the tenth lane, with the numbers: Fable stays on the heavy tier, or the pin stays, recorded as a new RC amending RC-16 (model: RC-26 list, Alfonso's yes required for the permanent change; the trial itself is his 18:54 confirmation).
- Sequence constraint (RC-15): the model trial runs with the current startup context; the CLAUDE.md slimming (B2, B4) comes after the trial is decided, so the two effects are not confounded.

## 4. What this memo does not do

It does not reopen RC-49. The six-step plan this chat drafted on 2026-10-17 afternoon (measurement, startup-context diet, tiers by work type, tool-output noise, lane shape, chat side) was already decided and measured by P-2026-10-15-1725; the only new items are the three above. Next lane: B0, prompt P-2026-10-17-1945 (`docs/prompts/claude_2026-10-17_1945_prompt_b0_token_economy_leftovers.md`), interactive.
