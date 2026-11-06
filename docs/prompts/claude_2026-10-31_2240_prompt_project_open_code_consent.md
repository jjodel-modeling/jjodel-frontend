# Opening a project runs code stored in it: confirm, map every path, design the consent

Prompt-ID: P-2026-10-31-2240
Chat: C-2026-10-31-1743
Front: plugins
Status: da eseguire
Lane: full (discovery only; core loading path, reducer; a fix changes what every existing project does on open)
Depends: none (R-PLG-6 is on the trunk at a20220f45)
Worktree: ~/jjodel-w-opencode, branch open-code-consent (from alfonso-frontend-jjtl a20220f45)
Request: none (ratified in the project chat on 2026-10-31 at 22:29; kept locally via --request)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-opencode` on
`open-code-consent`, stop with `Outcome: blocked`. Check that `P-2026-10-31-2240` exists only as this file in
`docs/prompts/` and as this lane in `~/.jjodel-lanes/`. Every reply opens with `[P-2026-10-31-2240 · session <id>]`.

No subagents, no background tasks. One probe run per tool call. Never `cat` a probe log, a dev server log or a whole
test output: grep the summary lines.

## Contesto (do not redo the analysis)

R-PLG-6 (`docs/decisions.md`, ratified 2026-10-31): opening a project never runs code stored in it without the
user's consent, and this is fixed before any plugin work. The plugin discovery (P-2026-10-31-1800, report on branch
`plugin-discovery`, read it with `git show plugin-discovery:docs/discovery/discovery_2026-10-31_plugin_mechanism.md`,
§3 row 13 and §10) found by reading only that the classic view fields persist code which the reducer executes with
`new Function` on open, from `reducer.ts:542` to `reducer.ts:862`. Nobody has confirmed it with a crafted project.

## COSA

Three things, in order.

1. **Confirm or refute.** Build a minimal crafted project whose stored view code has a benign, observable effect
   (it sets `window.__jjOpenCodeProbe = <timestamp>` and logs one console line; nothing else, no network, no storage
   write). Load it in a dev server of this worktree on a free port in 3020..3099 (never 3000, 3001, 3003) through
   every way a project can arrive: import of an exported file, the project list after a reload (localStorage), and any
   other path you find (gallery, notation library, shared link, template). Record for each path whether the marker is
   set before any user gesture. Use the browser automation the existing probes use (`frontend/scripts/probe/`).

2. **Map every path where persisted text becomes code.** Search the whole `frontend/src` for `new Function`, `eval(`,
   `Function(`, `setTimeout`/`setInterval` with a string, `import(` with a computed specifier, JSX or template
   compilation of stored strings, and any helper that wraps them. For each site: file:line with a verbatim quote, which
   persisted field feeds it, when it runs (open, render, event, user action), and whether a user gesture precedes it.
   Say how you searched (commands) so that an absence is backed by a search. Count how many bundled examples, gallery
   or notation-library projects, and default views carry code in those fields, and whether IR views (the current
   default) carry any.

3. **Design the consent, no code.** Compare at least these options and recommend one: (a) a per-project trust state
   (untrusted on import or first open; classic code fields do not run until the user trusts the project; the canvas
   shows those views degraded and marked, per R-PLG-7); (b) running classic view code inside the R-PLG-2 sandbox;
   (c) refusing classic code fields outright for imported projects. For each: what an existing user sees on the next
   open, what breaks in the bundled examples and the course material, where the trust state persists and whether it
   travels with an export (it must not), which files change, whether any change touches the critical zone
   (`CLAUDE.md` §3.2) and therefore needs a Layer Impact Report, and the smallest slice that closes the hole.

## DOVE

Read-only on `frontend/src`. New files only: the crafted project and its probe under
`docs/discovery/harness/open-code-consent/` (the probe may live at `frontend/scripts/probe/open-code-consent-probe.ts`),
and the report. No product code change, no dependency, no change to `package.json`. Do not put the crafted project
anywhere a user could load it by accident (gallery, examples, templates).

## Report

Save it as `docs/discovery/discovery_2026-10-31_project_open_code_consent.md`, opening with `## 0. Answer in brief`
(the P16 check), then: objective, files read with full paths, the confirmation table (arrival path, marker set before
any gesture yes or no, evidence), the site map, the counts, the options compared, the recommendation with its slice,
risks, and the questions for Alfonso, each with one `Recommended:` line. Commit the harness and probe, then the report
as a docs-only commit (`git add` those paths only), then the log entry in `docs/log-inbox/plugins.md` and the Status
flip in one docs-only commit, and run `check:docs`. Then hard stop: this lane has no Phase 2.

## HARD STOP

After the closure commits. Stop earlier with `Outcome: question` if the dev server or the browser automation cannot
run here, with what is missing.

## NON FARE

No change to product code, `CLAUDE.md`, `docs/decisions.md`, `PROTOCOL.md`. No payload beyond the benign marker. No
new dependency, no browser installation, no push, no merge.

## RIFERIMENTI

- `docs/decisions.md`: R-PLG-1..11 (R-PLG-6, R-PLG-7 and R-PLG-2 above all), R-IRN-3
- `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` §10 and §11 (explicit fallbacks, marking)
- `frontend/src/redux/reducer/reducer.ts` around lines 542 and 862 (path to confirm in discovery)
- `CLAUDE.md` §3 (critical zone, read only here)

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-31-2240)`.
Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», then
`Outcome: done | hard-stop | question | blocked`.
