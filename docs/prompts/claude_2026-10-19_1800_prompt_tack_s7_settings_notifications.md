# Tack slice 7: settings and notifications

Prompt-ID: P-2026-10-19-1800
Chat: C-2026-10-19-1748
Front: tack
Lane: full (new subsystem: settings contract on three levels, notifier on the event store, settings page and host load meter in the board; store schema bump)
Status: da eseguire
Corregge: —
Request: https://claude.ai/chat/f96ef649-86b6-4a81-9ceb-08b0bfb9fd4c (Alfonso, 2026-10-19 17:50 and 17:55, in the project chat: settings for Tack (theme, a list of events with a toggle each for notifications, anything else useful); settings both global and per repository; the chat's four recommendations accepted (three files, desktop macOS plus ntfy in v0, notifier usable without the UI, this chat owns the `tack` front from now on). Alfonso, 2026-10-19 18:03 and 18:05: a visual host load indicator in Tack; «si a tutto» to the chat's three recommendations (scrolling bars in the top bar with threshold and lane ticks, samples stored once a minute, inside this slice).)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 replaced as in the earlier Tack slices: the chat checks the board after exit (RC-23).

Worktree: `~/jjodel-w-tack-s7`, branch `tack-s7`, created by `lane-run start` from the trunk. Before anything else: `pwd`, branch, `git log -1` and `git status --short` are as `lane-run` set them; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-1800 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes per phase. Node: `~/.local/bin/node` (v26). Run tests with `--test-reporter=dot` and print only failures. Write a handoff at 150k context.

## Context (do not redo the analysis)
Tack lives in `tack/` on the trunk: contract v1 (`tack/contract/v1`), CLI (`tack/bin/tack.mjs`), SQLite store (`tack/src/store`, schema 4), collectors (claude-code, git, lane-run, log), metrics, board server and page (`tack/src/board`, slices 5a, 5b, 6), zero dependencies, Node >= 24. The board CSS already follows `prefers-color-scheme` in two places. Tack is a separate product: Jjodel's D-UI-15 (no dark theme) does not apply to it.

The chat's design, accepted by Alfonso:

**Three levels, one schema.** `~/.tack/settings.json` (user, not versioned), `<repo>/tack.json` (project, versioned), `<repo>/tack.local.json` (personal overrides on that repo, git-ignored). Precedence user < project < local, last wins, merged per key. Every key in the schema declares the levels where it may appear. A key at a level it does not allow is an **error** of `tack check`, not a warning; this is what keeps channel credentials (ntfy topic, webhook URLs) out of versioned files.
- user only: appearance (theme `light | dark | system | high-contrast`, default `system`; density `comfortable | compact`; font scale; reduced motion), locale (time zone, date format), channels and their credentials, quiet hours, privacy.
- project only: harness features already modelled, lane time limit, budget thresholds, idle threshold.
- user with local override: notification toggles, each with a scope filter (all lanes, lanes of given fronts, lanes launched by given chats).

**Notifications are rules on the event store, not hooks in `lane-run`.** The notifier reads what the collectors already store, fires on the rising edge of a transition (once per transition, never once per poll), deduplicates on (event kind, unit id, transition), persists what it has delivered (store schema 5), and hands the message to a channel. It runs inside the board server when that runs, and standalone as `tack notify --watch`. Quiet hours queue messages and deliver one digest when they end; an event marked urgent passes anyway.

**Event catalogue, with default toggle:** lane in `question` (on, urgent), lane in `hard-stop` (on), lane `blocked` (on, urgent), gate red (on), context ceiling hard (on), critical-zone ask pending (on), lane silent for N minutes (on, N = 15), merge conflict (on), lane `done` (off), lane started (off), merge completed (off), daily spend over threshold (off), host load over threshold (off), unpushed commits over N (off), transcript retention shorter than the analysed window, read from Claude Code's `cleanupPeriodDays` (on).

**Channels in v0:** macOS desktop notification through `osascript` (`execFile` with arguments, never a shell string built from event data), and ntfy through `fetch` POST. Both behind one transport interface so tests inject a fake. `tack notify test <channel>` sends one test message.

**Privacy:** a notification carries only event kind, unit id, front, repository name, outcome and a board link. Never message or prompt content, under any setting.

**Host load meter.** One sampler in the board server reads `os.loadavg()` every 5 seconds into a ring buffer of 60 samples (5 minutes) and stores one sample per minute in the store (schema 5, same migration), with the count of running lanes. The same sampler feeds the «host load over threshold» notification. The board top bar shows a strip of 60 thin bars scrolling left on each sample, the current 1-minute value in figures beside it, a dashed horizontal line at the launch threshold (project key in `tack.json`, default 20), bar colour by zone (neutral below, amber within 15% under the threshold, red above), and a tick above the bar where a lane started or ended. Hover shows load 1/5/15 and running lanes. With reduced motion the bars update without animation. A user setting shows load normalised by core count (`os.cpus().length`); default raw, because the threshold is expressed in raw load. No memory metric in this slice.

**Settings page:** `/settings` in the board. Appearance applies live. Each event row shows toggle, scope filter, channel, and the level the effective value comes from; a change is written to the user file or to `tack.local.json`, as the person chooses per row. Project-level keys are shown read-only with the path of `tack.json`: the UI never writes a versioned file.

## COSA

### Phase 1 (read-only, then hard stop)
Write the discovery report at `docs/discovery/discovery_2026-10-19_tack_settings_notifications.md` (P4). It must answer, with `file:line` evidence:
1. For each event of the catalogue: derivable from the store today, derivable with a small collector change (which), or not derivable in v0. The ones not derivable stay in the catalogue as disabled rows with the reason, not as toggles.
2. The rising-edge model: which store columns give each transition, and how a restart of the notifier avoids replaying old transitions (first run marks the current state as delivered).
3. Where the existing feature model and any existing config live, and how they map onto the three levels without breaking `tack check` on current fixtures.
4. The schema 5 migration, additive.
5. The settings page inside the current board (routing in `server.mjs`, `page.html`, `board.js`), and how theme tokens are introduced in `board.css` without changing current colours in `light`.
5b. The load meter: where the sampler lives so the board and `tack notify --watch` share it without double sampling, how the strip is pushed to the page (existing refresh or a lighter endpoint), and where lane start and end times come from for the ticks.
6. Open questions, each with `Recommended:`.

Commit the report alone, then stop with `Outcome: hard-stop`.

### Phase 2 (after the GO, on the same session)
Implement as ratified: settings schema in `tack/contract/v1/settings.json` with per-key levels; loader and merge; `tack check` on the three files; `tack settings` (print the effective value of every key with its source level); store schema 5; notifier with rising edge, dedup, quiet hours and digest; the two channels; `tack notify --watch` and `tack notify test`; `/settings` page and theme tokens; host load sampler, stored samples and top-bar strip; README section. Tests first: merge and precedence, level violations, secret in `tack.json` rejected, rising edge (one message per transition, none on restart), dedup, quiet hours digest, urgent bypass, privacy (no content field ever reaches a transport, as the slice 2 privacy test), the transport receives arguments and never a shell string, the ring buffer keeps 60 samples and drops the oldest, one stored sample per minute, zone colour at the threshold boundaries, lane ticks placed on the right bar. Then implementation, then the board on port 4710 with the real store copy, left running.

## DOVE
`tack/**`, the discovery report, `docs/log-inbox/tack.md` (one entry), this prompt's `Status:` line. Nothing else.

## NON FARE
No new dependency. No change to Jjodel (`frontend/**`), to `lane-run.mjs`, to `.claude/` or to `~/.claude/`. No real notification sent by tests. No write to `tack.json` from the UI. No push.

## HARD STOP
End of Phase 1 (report committed). In Phase 2, only RC-26 items.

## Gates (Phase 2)
`node --test` on `tack/test` all green with the new tests; `tack check` green on the fixtures and on a sample of each of the three files; `npm run check:docs` from `frontend/`. Visual check by the chat after exit: `/settings` in light and dark, toggles persisted to the right file, `tack notify test desktop` delivered, the load strip scrolling with threshold line and lane ticks.

## RIFERIMENTI
- `tack/README.md`, `tack/contract/v1/README.md`
- `docs/prompts/claude_2026-10-19_1100_prompt_tack_v0_extraction_disc.md` and its report
- `docs/prompts/claude_2026-10-19_1440_prompt_tack_s5a_board_server.md`
