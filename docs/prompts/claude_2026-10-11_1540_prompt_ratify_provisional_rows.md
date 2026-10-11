# Ratify the provisional decision rows per the digest, apply two amends, fix the headers the generator cannot parse

Prompt-ID: P-2026-10-11-1540
Chat: C-2026-10-10-1145
Request: https://claude.ai/code/session_01FWUFsDDVN1SMB4MGco19GJ
Front: harness
Lane: fast (docs only: `docs/decisions.md`, the digest file, the regenerated `docs/digest/` files, the log entry). No critical-zone go-ahead.
Depends: P-2026-10-11-1430
Status: eseguito 2026-10-11, lane P-2026-10-11-1540 (ratify-provisional, d7a251297), merged c6804f3d3 (P-2026-10-11-1559); RC-38 still awaiting Alfonso

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-ratify`, branch `ratify-provisional`, cut from the trunk tip that carries the docs commit
adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a
clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1540 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended (lane auto): a question with one recommendation inside this lane's perimeter is answered as recommended
(RC-21).

## Context (decided by Alfonso, do not reopen)
`docs/ratifiche/claude_ratifiche_2026-10-11_provisional_digest.md` (lane P-2026-10-11-1430, on the trunk) lists 77
rows of `docs/decisions.md` whose header says `provisional`, with one recommendation each (ratify 74, amend 3,
revoke 0), and in §7 the minimal header rewrites that make `npm run docs:digest -- --all` parse the register.
On 2026-10-11 at 15:36 Alfonso replied «ok alle raccomandazioni». The chat reads that as: every `ratify` and every
`amend` of the digest is accepted, and the §7 rewrites are accepted, **except RC-38**, whose recommendation depends on
a fact only Alfonso knows (whether commit `53aed9baa` carries his ratification); RC-38 stays exactly as it is.

## WHAT
1. **Ratify.** For each of the 74 rows recommended `ratify` (§3, §5, and the B group if any, as listed in the
   digest), rewrite the header to the ratified form already used in the register, keeping date and the three keys:
   `(<date>, ratified by Alfonso 2026-10-11, evidence: ..., verified: ..., reversible: ...)`. Drop `provisional`,
   `unattended` and any adoption clause from the header; if the adoption clause carries information (which chat
   adopted it), move it into the first sentence of the body, unchanged in meaning. Do not change the body otherwise.
   Where a row says `reversible: branch` but its code is on the trunk (digest §0), write `reversible: trunk`.
2. **Amend.** R-SIM-120 and R-VP-29, exactly as the digest says (§3 and §5 rows): R-SIM-120 states the reading R-SIM-122
   already applies (held values answer presses from the board, ticks included); R-VP-29 keeps the class order and
   moves the hue rule, superseded by R-VP-37, to the row's «Superate» part (or the register's equivalent). Both are
   then ratified as in step 1. Two sentences each at most; cite the row that superseded or clarified them.
3. **Headers.** Apply the §7 rewrites (kinds 1a, 1b, 1c, 2, 3, 4, 5 and the 11 provisional rows without the leading
   `- `, kind 6) to every row except RC-38. For kind 5 use `verified: none` with the probe named in the body; do not
   change the script's vocabulary. For R-SIM-137..140 (kind 7) the details are now ratified too: write the ratified
   form. Do not touch the 154 non-provisional rows without `- ` and the non-`R` ids: they are out of scope.
4. **Check.** `npm run docs:digest -- --all` from `frontend/` must exit 0 except for RC-38's header, which stays as it
   is; if RC-38 is the only failure, write that in the report. Then `npm run docs:digest -- --all --write` to
   regenerate `docs/digest/`, and `npm run check:docs`. Count the headers that still contain `provisional`: expected 1
   (RC-38).
5. **Digest file.** Append to the digest a short `## 10. Outcome` section: Alfonso's reply, date, what was applied,
   RC-38 left pending with the question for him.
6. Commit with an explicit pathspec, one commit: `docs(decisions): ratify the provisional rows of the digest,
   amend R-SIM-120 and R-VP-29, fix headers (P-2026-10-11-1540)`. Log entry in `docs/log-inbox/harness.md`
   uncommitted (RC-17). Stop with `Outcome: hard-stop (ready to merge)`.

## DO NOT
- Touch RC-38, any row not listed in the digest, any row body beyond steps 1 and 2, or any script.
- Revoke anything.
- Touch `~/.jjodel-lanes/`, port 4700 or other worktrees.

## REFERENCES
- `docs/ratifiche/claude_ratifiche_2026-10-11_provisional_digest.md` (§0, §3, §5, §7, §8).
- `docs/decisions.md` RC-25..RC-28; `docs/digest/README.md`; `frontend/scripts/gates/docs-digest.ts`; `docs/PROTOCOL.md` P9, P16; RC-17.
