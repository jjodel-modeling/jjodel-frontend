# Prompt: the low UI tickets of the simulator, one bundle

Prompt-ID: P-2026-09-29-0356
Chat: C-2026-09-28-1936
Lane: full (five small tickets, tests first, each its own commit). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-uitickets`, branch `sim-ui-tickets` (cut by the chat from `alfonso-frontend-jjtl` at `42d7a08dd`, after the merge of `sim-outputs-faces`; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-uitickets`, branch `sim-ui-tickets`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Five low-priority tickets found by the lanes of 2026-09-27..29 and filed in `docs/log-inbox/*.md` and the discovery reports of those days (grep the quoted words to find each one's origin, file:line and the proposed fix). Fix each one as its origin describes it, with the smallest change:

1. The verdict badge of a role row reading «incompatible» has no tooltip saying why (roles dialog).
2. The enabled ring on the canvas is missing, or wrong, for transitions that wait for an input event.
3. The Data declarations select «Stored or derived…» has no accessible label.
4. An equation (derived attribute) that reads a name which is also an input: find the ticket and what it asks. If the expected behaviour is written in a decision row or in the origin's text, implement it; if it is not, do not decide it: leave it out and write it as a question.
5. The navbar warning «wrong project setup»: find the ticket; fix it as described.

Not in this lane: the placement of «Add attribute» in the Data dialog (Alfonso's decision), the colour of `· accepting` (Alfonso's), the `.smv` generation, the critical zone, `irTypes.ts`, `netCompile.ts`, `netStep.ts`. If a ticket needs any of these, skip it and say why.

## DOVE

- The files each ticket's origin names; list them in the report before editing (more than 3 files: list first, as `CLAUDE.md` requires). Styles reuse existing classes; grep every new identifier and class name first.
- Closure: the fitting `docs/log-inbox/*.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (Rule 11, §21.2, SCSS and naming rules, accessibility rows if any), `docs/PROTOCOL.md` P16, RC-20..RC-22, RC-33, RC-34, and the origin of each ticket.
2. Baseline: typecheck count, vitest of the touched folders.
3. Per ticket: a test first (red, then green), the fix, one commit.
4. Gates: `npm run typecheck` (14, the known set), the touched vitest folders green, the full vitest with the 9 known reds only, `npm run build`, `check:docs`, `check:addonly`.
5. A lane probe on port 3047 (`lane-run probe`, never 3001), light theme: one DOM check per fixed ticket; the four demo scenes' M1 status lines unchanged. Crops only where a ticket is visual, `sips -Z 600`, under `docs/discovery/harness/_tmp_uitickets_*.png` (gitignored).
6. One docs commit (log entry, Status). Do not merge. Stop with `Outcome: hard-stop`, per ticket: fixed / skipped (why) / question; the shas, the diff stat and the gates.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, dark-theme work, a new dependency.

## RIFERIMENTI

- `docs/log-inbox/` and `docs/discovery/` of 2026-09-27..29; R-SIM-86, R-SIM-90..95.
