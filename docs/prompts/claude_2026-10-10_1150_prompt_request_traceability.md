# Prompts name the request they answer: Request header, local request.md, shown by the lane board

Prompt-ID: P-2026-10-10-1150
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Lane: full (more than 3 files)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-request`, branch `prompt-request`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a
clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1150 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)
Alfonso asked whether the requests he types are inspectable. They are not. What the harness keeps is the chat's
rewrite of a request: the prompt in `docs/prompts/`, the turns in `~/.jjodel-lanes/<Prompt-ID>/input-k.md`, the
transcript in `log.jsonl`. His own words stay only in the claude.ai conversation, and the way back to it is weak:
`Chat: C-…` is an id the chat coins and resolves to nothing, and the only real link is the `Claude-Session:`
trailer of the commit that adds the prompt. Measured on 2026-10-10: 138 commits added a prompt under
`docs/prompts/` since 2026-10-01, 56 of them carry that trailer. Alfonso ratified the fix in chat ("si"): a
`Request:` header with the URL, his words stored locally (the repo is public and in English, his words are in
Italian), and the lane board showing them. This lane implements it, mirroring how RC-42 added `Depends:`.

## WHAT
1. **PROTOCOL.md, P13.** After the bullet "Every prompt declares what it depends on", add a bullet
   "Every prompt names the request it answers." The header of a prompt in `docs/prompts/` carries
   `Request: <URL>`: the claude.ai conversation or session where Alfonso asked, the GitHub issue for an
   auto-intake lane, or `Request: none (<reason>)` when nobody asked (a lane the chat opens on its own initiative,
   a follow-up it derives from a report). The words of the request are never committed: the launching chat passes
   them to `lane-run start --request <file>`, which keeps them as `~/.jjodel-lanes/<Prompt-ID>/request.md`.
   Merge prompts rendered by `lane-run` are exempt. New from 2026-10-10; earlier prompts are not amended. The lane
   board shows the request first in a lane's detail. Decided RC-43. Match the register and line width of the
   surrounding bullets.
2. **docs/decisions.md.** Add the **RC-43** row right after RC-42, in RC-42's format: 2026-10-10, requested by
   Alfonso in chat `C-2026-10-10-0840`, evidence: measured (the 56 of 138 above), verified: agent, reversible:
   trunk. One paragraph, same content as the P13 bullet.
3. **lane-run.mjs, `start`.** New option `--request <file>`: before the session starts, copy the file into the
   lane folder as `request.md`; refuse, naming the path, when the file is missing or empty. When the prompt has
   no `Request:` header line and no `--request` is given, print one warning line and go on (no refusal); merge
   prompts produce no warning. Update the usage comment at the top of the file and the `usage:` text. Leave
   `chain`, `resume`, `merge` and `go` unchanged; say in the report whether `chain` should forward the option.
4. **frontend/scripts/lane-templates/issue-discovery.md.** Add `Request: <issue URL>` after the `Chat:` line,
   built from the template's variables (`{{repo}}`, `{{issue}}`); read `auto-intake.mjs` to see the form of
   `{{repo}}` and build a correct `https://github.com/<owner>/<name>/issues/<n>`. The merge templates stay as
   they are.
5. **lane-board.mjs.** Give each timeline lane a `request` field: `{ url, text }`, `url` from the `Request:` line
   of `input-1.md` (empty when absent, `none (…)` kept as text), `text` from `request.md` (up to 4000 characters,
   empty when absent). The exited-lane timeline cache (`tlCache`) must not freeze an empty value for a lane whose
   `request.md` is written after its first read: read the request outside the cached value, or key the cache on
   the file's mtime. Pick the smaller change and state which one.
6. **timeline.js, `detail()`.** Directly under the "Launched by" line and before the turns table, a "Request"
   block: the text of `request.md` in a blockquote that keeps line breaks (escaped), then the URL as a link
   (`target="_blank" rel="noopener"`, only for `http(s)` URLs; any other value printed as text). With neither:
   `Request: not recorded`. No other change to the detail or to the Lanes tab.
7. **Checks.** `node --check` on `lane-run.mjs`, `lane-board.mjs`, `timeline.js`; `npm run check:scripts` from
   `frontend/`. `lane-run start` with `--request` on a missing file must refuse before any session starts: run it
   and paste the refusal. Do not start a real session. Start this tree's board in the background on port 4701
   (`node frontend/scripts/lane-board/lane-board.mjs --port 4701 --refresh 30`); confirm with `curl` that the
   timeline data of `P-2026-10-10-0840` and `P-2026-10-10-1150` carries a non-empty `request.text` (the chat has
   written both `request.md` files) and that a lane without one carries empty values. Leave the board running and
   report its PID; the chat runs the visual check and stops it.
8. **Commits.** One code commit with an explicit pathspec,
   `feat(harness): prompts name the request they answer (RC-43)`. Then the log entry in
   `docs/log-inbox/harness.md`, uncommitted (RC-17), and stop with `Outcome: hard-stop (visual check due)`.
   No merge.

## DO NOT
- Commit any `request.md` or quote Alfonso's words in any committed file.
- Amend the header of earlier prompts.
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.
- Touch other lanes' folders under `~/.jjodel-lanes/` beyond reading them.

## REFERENCES
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-23, RC-42 (the `Depends:` precedent, same files on the board side).
