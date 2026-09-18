# Phase 0 — CLAUDE.md 40k limit and nested-file loading (P-2026-09-18-1930)

Date: 2026-09-18
Prompt: P-2026-09-18-1930, Phase 0 only (GO received 19:30, hard stop after this report)

## Measurement 1 — is the 40k-char limit enforced (truncation) or only reported?

1. This live session (interactive, `model=claude-opus-4-8` per `.claude/settings.json`): its own
   system-reminder at conversation start carries the full root `CLAUDE.md`. Direct comparison
   against disk:
   - `wc -c /Users/alfonso/jjodel/CLAUDE.md` → 63444 bytes (matches the debug-logged 62440 chars;
     the byte/char gap is UTF-8 multi-byte punctuation — em dashes, `→`, accents).
   - `head -c 200` / `tail -c 300` of the disk file match, verbatim, the first and last lines this
     session received (`# CLAUDE.md — Jjodel Project Reference` … `**Last calibration**: 2026-08-05
     …`).
   - Conclusion: for this session, the full 62,440-char file — 22,440 over the stated 40k limit —
     reached the model's context complete, head to tail. No truncation observed.

2. `command grep -n -i "CLAUDE.md/rules files" ~/.claude/debug/{7ff128db-8085-4966-85e1-4d14bc924e66,f192ccee-de54-4a1e-878c-177644e4b4d5}.txt`
   (exit 0 both): both pre-existing interactive debug logs report
   `"Loaded 2 CLAUDE.md/rules files:\n  [Project] /Users/alfonso/jjodel/CLAUDE.md (62440 chars)…"`
   — the raw file size at load time, not a post-truncation size.

3. `env -u ANTHROPIC_MODEL claude --debug -p "Reply with exactly: OK"` (exit 0): fresh one-shot
   session, debug log `a4bcdab6-b6c4-41ae-9b1e-0867825ebbce.txt`. `command grep -i "claude.md"` on
   it: only an unrelated plugin-cache path matches — this trivial one-shot prompt never triggered a
   logged CLAUDE.md load at all, a different code path from the interactive sessions. Positive
   control (`[WARN]` telemetry line) found in the same file, so the search ran correctly.

4. Broad search across all four `--debug` logs (2 interactive + 2 one-shot) for
   `"40\.0k|62\.4k|63444|62440|truncat|char limit|exceed|too large|oversiz"`: no match in any
   (`grep exit=1` each time), with the `[WARN]` telemetry line as positive control each time
   (`grep exit=0`) confirming the search itself runs. The debug log never logs a truncation event
   or the 40k threshold by name — only the raw read size. No `[API REQUEST]` line carries the
   request body either, so the log cannot show what the constructed system prompt actually
   contained.

**Verdict**: inconclusive by debug-log inspection alone — the log does not settle it either way.
Settled instead by direct comparison (point 1): the 40k figure is a report, not an enforced
truncation, at least for the code path this live session went through.

## Measurement 2 — does a nested CLAUDE.md under editor-v2/ actually load?

Probe: `frontend/src/components/editor-v2/CLAUDE.md`, one heading + one instruction — any closing
report for work under this directory opens with the token `EDITOR-V2-PROBE-9182`.

`npm run gen:agents` (from `frontend/`) → wrote 3 files (root, editor-v2, jjtl), 0 skipped, exit 0.
`npm run check:agents` → PASS, all 3 aligned, exit 0. `git diff --stat` on the two unrelated
siblings (root `AGENTS.md`, `frontend/src/jjtl/AGENTS.md`) is empty — only the two new probe files
(`editor-v2/CLAUDE.md`, `editor-v2/AGENTS.md`) are untracked afterward.

Two fresh one-shot sessions, `env -u ANTHROPIC_MODEL claude --debug -p "..."` (both exit 0; both
confirmed `model=claude-opus-4-8` via `[API:timing] dispatching to firstParty` in their debug logs,
so the `ANTHROPIC_MODEL` override active in this shell — a side effect of an earlier `/model`
command — did not confound either run):

- Session A (debug log `1f4cdcd6-e4de-49c5-b0ae-2fa855e0ac8f.txt`), asked only to read and report on
  `frontend/src/components/editor-v2/AlignmentToolbar.tsx` — no mention of CLAUDE.md or the token
  anywhere in the prompt. Output opened with `EDITOR-V2-PROBE-9182`.
- Session B (debug log `30c13f59-0700-4091-bf69-bf4434c065d7.txt`), asked only to read and report on
  `frontend/src/redux/createStore.ts`. Output has zero occurrences of the token.

Transcript check (`~/.claude/projects/-Users-alfonso-jjodel/<session-id>.jsonl`), decisive:
Session A's transcript shows exactly one tool call — `Read` on `AlignmentToolbar.tsx` — no `Read`
on the probe `CLAUDE.md` path, yet the probe's own text (`"Temporary probe for Phase 0…"`) and the
token each appear in the transcript once. So the content was not fetched by the model choosing to
read it on its own initiative (root `CLAUDE.md` §12.7 already documents the `jjtl/CLAUDE.md`
precedent and could have tipped it off to look) — it was injected automatically, tied to the file
path touched. Session B's transcript shows one `Read` on `createStore.ts` and zero occurrences of
the token anywhere.

**Verdict**: conclusive. The mechanism works and is directory-scoped: present for work under
`editor-v2/`, absent for work elsewhere, and demonstrably automatic rather than model-initiated
discovery.

## Bearing on the split (§6.6)

Nested loading is real and scoped, which is what phases 1-3 depend on. The 40k figure is (as
observed) a report rather than a hard cutoff, so no part of the constitution has been silently
inert — the reading of past `Causa: (c)` entries does not need revision on that account. Whether to
proceed with the split is Alfonso's call per the prompt's hard stop; this document only closes the
measurement.

## Housekeeping found, not fixed (per prompt, out of this lane's scope)

- `scripts/generate-agents.mjs`'s own header comment (lines 14-18, 75) calls the
  `editor-v2/CLAUDE.md` canary "marker-only… skipped". The probe created here has a heading, so it
  is projectable and produced a real `AGENTS.md` sibling — the comment's premise (no such file, or
  a marker-only one) is stale regardless of what happens to the probe next.
- `.claude/settings.json` pins `"model": "claude-opus-4-8"`; root `CLAUDE.md` §0 declares the agent
  runs as Claude Opus 5. Confirmed again here (`[API:timing] dispatching to firstParty
  model=claude-opus-4-8` in both fresh debug logs) — still unresolved, still out of scope.
