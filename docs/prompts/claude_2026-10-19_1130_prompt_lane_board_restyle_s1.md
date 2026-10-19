# Lane board restyle, slice 1 of 2: the shell and the Lanes tab in the agreed Linear-like design

Prompt-ID: P-2026-10-19-1130
Chat: C-2026-10-18-2225
Front: harness
Lane: phase2 (slice 1 of 2; the board page only; no change to data, routes or `/api*` shapes; no critical zone)
Status: da eseguire
Depends: P-2026-10-19-1045
Corregge: —
Request: Alfonso, 2026-10-19 11:25, in chat C-2026-10-18-2225: the board page still shows the old look, «non mi pare stia usando il tema linear come già discusso». The design was agreed on 2026-10-18 evening on the canvas «Lane Monitor Desktop» (four artboards: Lanes, Timeline, Insights, Requirements), with Alfonso choosing a dedicated look, desktop-app layout, Linear as the reference for principles (not a copy of Linear's interface, logo or icons).

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (the design is given; the measurement of the page structure below is the discovery). P8 is the visual check below, run by the chat in the built-in browser.

Worktree: `~/jjodel-w-boardstyle`, branch `board-restyle`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1`, `git status` match; otherwise `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-19-1130 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) outside the RC-26 list. Time limit 90 minutes. Use node from `~/.local/bin` (v26) first in PATH. Tests through `run-quiet.mjs`; read `lane-board.mjs` (2077 lines) with Read and `offset`/`limit`, never whole. Context ceiling RC-51.

## Context (do not redo the analysis)
The page is the `PAGE` string of `frontend/scripts/lane-board/lane-board.mjs` (style block at about `:1767`, tabs nav at about `:1802`, light tokens and a `prefers-color-scheme: dark` override), plus `timeline.js`, `insights.js`, `requirements.js` for the other tabs. The look is the original one: slate tokens, sky-blue accent, pill chips, a tab bar with a status strip.

The design reference is four HTML mockups, copied outside the repo at `~/.jjodel-lanes/board/scratch/menubar/design/{Main,Timeline,Insights,Requirements}.dc.html` (Design Component pages: read their markup and inline styles as the spec; `{{…}}` holes and `renderVals()` show what data each element binds; some values in them are placeholders or illustrative, the board's real data always wins). This slice implements `Main.dc.html` (shell and Lanes tab). The principles, in short: a dark near-black ground by default, quiet 1 px borders, compact 13 px type, numbers in a monospace with tabular figures, one indigo accent for what is live, colour reserved for state (done green, waiting amber, blocked red, hard-stop a dashed grey ring, running indigo), no pills where a dot and a word do, no gradients or emoji.

Tokens (dark): window `#08090A`, sidebar `#0C0D0F`, content `#0F1013`, panel `#121317`/`#131418`, line `#1C1E22`/`#1F2126`/`#2A2C33`, text `#EDEEF0`, secondary `#A1A4AB`, muted `#7E828B`, accent `#8A93FF` (link `#A9B1FF`), done `#4CC38A`, waiting `#F2B04C`, blocked `#F2645A`, hard-stop `#8B8F98`. Light theme, same structure: surface `#FFFFFF`, sidebar `#F7F7F8`, panel `#FBFBFC`, line `#E5E6EA`, text `#16171B`, secondary `#5D616B`, muted `#80848E`, accent `#5B63D6`, done `#2E9E66`, waiting `#B7791F`, blocked `#D64541`, hard-stop `#80848E`. Theme: System by default (`prefers-color-scheme`), with a Light / Dark / System control in the sidebar footer remembered in `localStorage` (wrapped in try/catch). Fonts: the system stacks (`-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui` and `ui-monospace, "SF Mono", Menlo`), no webfont: the board must work offline.

## COSA
1. **Shell.** Replace the tab bar with the mockup's left sidebar (232 px): product block («Jjodel Harness», the trunk name in mono), the four views as nav items (Lanes with the running count, Timeline, Insights, Requirements with the requirement count), a «Needs attention» group fed by `/api/attention` (waiting, blocked, stale with their counts; clicking filters the Lanes table as the strip pills do today), and a footer with spend today, load average, `localhost:<port>` and the last sync time, plus the theme control. A 52 px header per view with its title and that view's existing controls. The tab switching, `localStorage` tab memory, `#lane=<id>` anchoring and the strip filter keep working: same behaviour, new chrome. On a window narrower than 900 px the sidebar collapses to a top bar.
2. **Lanes tab.** The KPI strip of six cells, each with its window stated (running now, waiting now, blocked now, done last 24 h, resolved last 24 h, spend today) replacing the pill strip's role; the amber «N lanes are waiting for a GO, ACK or answer» banner when `waiting > 0`, linking to the waiting rows; running lanes as cards (id, kind, tier, elapsed and time left, title, phase progress segments, current step, started, tokens in, context peak, worktree, launched by and chat link); the 24 h table and the older days restyled as in the mockup (lane id and title stacked, outcome as dot and word, kind as a mono tag with tier, window, work over span, tokens, ctx, cost, launched by), keeping every column and tooltip the table has today and the current sort.
3. **Keep the contract.** No change to data, routes, `/api*` JSON, column meaning, element ids or `data-*` attributes other code or tests read. Where a test in `frontend/scripts/hooks/__tests__/laneBoard*.test.ts` asserts on markup (for example splitting rows on `<tr>`), keep that markup shape or update the test in the same commit with the reason; never weaken an assertion.
4. Checks: the `laneBoard*` tests and the `scripts/hooks` suite green at their count; `typecheck:scripts` 0; `check:scripts` PASS. Start a board from this worktree on 4712 (`LANE_BOARD_CACHE` under `/tmp/boardstyle/`, never touch 4700), and leave it running for the chat's check in the built-in browser (RC-23) in both themes and at 1440 and 800 px: `Outcome: hard-stop`. After the GO: commits, `Outcome: done`. Slice 2 (Timeline, Insights, Requirements) is a separate prompt.

## DOVE
`frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/README.md` (a short «Look and theme» paragraph), `frontend/scripts/hooks/__tests__/laneBoard*.test.ts` only where markup assertions must follow, `docs/log-inbox/harness.md`, this prompt's Status line. `timeline.js`, `insights.js`, `requirements.js` only for what the new shell forces (container ids, the theme variables they read); their own restyle is slice 2. Anything else: stop and ask.

## Commits (P13, RC-17), explicit pathspecs, no push
Code: `feat(lane-board): sidebar shell and Lanes tab in the agreed design, light and dark (P-2026-10-19-1130)`. Docs: Status flip and the P9 entry. Trailer `Model:` (P6).

## NON FARE
No change to the menu bar app (lane P-2026-10-19-1125 is working on it in `~/jjodel-w-menubar2`). No restart of the board on 4700 (the chat does it after the merge). No webfont, no new dependency, no copy of Linear's logo, icons or proprietary layout details.
