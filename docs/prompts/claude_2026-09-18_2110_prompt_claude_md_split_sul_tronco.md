# Amendment to P-2026-09-18-1930: the split lands on the trunk, after a transport

Prompt-ID: P-2026-09-18-2110
Chat: C-2026-09-18-2110
Status: da eseguire
Date: 2026-09-18 21:10 (Europe/Rome)
Type: chore (docs only)
Amends: `claude_2026-09-18_1930_prompt_claude_md_split_oltre_limite.md`. Its phase 0 is closed
(`45558b815`, `fbcbcb820`) and its phases 1 to 3 stand as written except for the branch they run on
and the order of two steps. Read that prompt for the phase contents; this one changes only what it
says here.
Lane: harness, exclusive, repo fermo. No code file is touched.

## What phase 0 settled, and what follows from it

The nested mechanism loads and is directory-scoped (token present under `editor-v2/`, absent
elsewhere, with a transcript showing injection rather than a `Read`). The 40k figure is a report and
not an enforced truncation: the decisive control is that the file's **tail**, which sits at 62k and
therefore well past the limit, reached the session byte for byte. Head and tail together are enough
precisely because a truncation would cut at 40,000.

Two consequences, and they point the same way.

The split is no longer urgent, because nothing is being silently repealed. What remains is hygiene,
and hygiene can be sequenced properly instead of raced.

The split must therefore happen where `CLAUDE.md` lives. §6.6 says the trunk, and the trunk's file is
60,208 characters against the branch's 63,444: splitting on `validation-skeleton` would produce two
constitutions with different section numbers on the two sides of a merge gate that already carries
220 commits. Restructuring a file on a branch is the most expensive thing that file can do to a
merge. Done on the trunk first and taken back into the branch immediately, `CLAUDE.md` leaves the
merge gate's conflict surface altogether.

## Step 1: remove the phase 0 probe (this branch, now)

`frontend/src/components/editor-v2/CLAUDE.md` is a live instruction: it orders every closing report
for work under `editor-v2/` to open with `EDITOR-V2-PROBE-9182`, and phase 0 proved it is obeyed.
It has done its job. Delete it and its generated `AGENTS.md` sibling, run `npm run gen:agents` and
`npm run check:agents`, and commit. Phase 1 creates the real module at that path later, from the
trunk; it does not inherit the probe's text.

## Step 2: transport the branch-only normative material to the trunk

Measured at `fbcbcb820` against `alfonso-frontend-jjtl` (`7bc6c7365`), the whole normative delta is
four things, and three of them travel now.

Travel now, verbatim, in one docs commit on the trunk: `CLAUDE.md` §9.3 (attribute slots versus
reference slots, with its two measurement tables and both discovery citations), the two pointer lines
that read `P1..P9` on the trunk and must read `P1..P12`, and the `Model:` trailer paragraph of
`docs/PROTOCOL.md` P6 together with the version line 1.1 → 1.2.

Does **not** travel: the rotation sentence of P9, which cites `npm run log:rotate`. The trunk has
neither `frontend/scripts/gates/rotate-log.ts` nor the script entry in `package.json`, so the
sentence would name a command that does not exist there (RC-10). It arrives with the merge, or with
its own lane. State this in the commit body rather than leaving it to be rediscovered.

**COME.** The trunk worktree `/Users/alfonso/jjodel-release` is listed as prunable: re-create it
before touching anything, do not check the trunk out over `~/jjodel`, which another lane holds
(§6.4, §6.5). Verbatim moves, `git add` per pathspec, `Model:` trailer on every commit (P6, which
this very transport is putting on the trunk).

## Step 3: phases 1 to 3 of P-2026-09-18-1930, on the trunk

Same contents, same order, same acceptance criteria, same one-commit-per-phase, run in the trunk
worktree after step 2 has landed. The character counts in that prompt were measured on the branch and
will differ by roughly 3,200 on the trunk once §9.3 has arrived; report the trunk's own numbers and
do not treat the difference as a discrepancy.

The known gap stands as written: `frontend/src/common/DV.tsx` sits under none of the three module
directories, rule 14 covers it in the non-negotiable block, and no fourth module gets invented for
one file.

## Step 4: bring the split back into the branch

With the trunk split and green, take the trunk's `CLAUDE.md` and the new nested modules into
`validation-skeleton` so that the two sides are identical before the merge gate ever looks at them.
Regenerate and run `check:agents` on the branch as well, because the branch has files the trunk does
not and the generator walks the tree it is run in.

**HARD STOP** at the end of step 2 and again at the end of step 4, with the character counts and the
three gates' exit statuses.

## Two out-of-scope findings from phase 0, now with a decision

The stale `[CANARY]` comment in `scripts/generate-agents.mjs`: correct it in the same commit as
whichever phase first touches that file, not before.

`.claude/settings.json` pins `claude-opus-4-8` while `CLAUDE.md` §0 declares Opus 5, and both phase 0
sessions dispatched as `claude-opus-4-8`. Configuration wins, and the three-actor model puts Claude
Code on Opus 4.8 deliberately, so §0 is the stale side. Do not edit it in this lane: it is a one-line
normative change and it belongs to the phase that rewrites the core anyway. Flag it again there.
