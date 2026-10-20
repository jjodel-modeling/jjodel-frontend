# JjEL bit-vector values, slice S1: the value and its operations in the evaluator (implementation)

Prompt-ID: P-2026-10-20-2331
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (new value kind in the exported JjelValue union; continuation of P-2026-10-20-2055 after the context ceiling)
Status: da eseguire
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-20-2055
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-bitvector`, branch `jjel-bitvector`, at the commit that adds this prompt (parent `319b16865`, the
discovery report). Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here; otherwise
stop. Link `frontend/node_modules` as P14 says and remove the link at the end. Model and tier: heavy, as pinned (RC-16),
effort `xhigh`. This is a single-phase implementation lane: the discovery is done and its decisions are adopted; there
is no hard stop before the code.

## Lane discipline

Every reply opens with `[P-2026-10-20-2331 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Every gate runs in the foreground (P16). No push, no merge. Keep the context lean: read the handoff and the discovery
sections you need, not whole files you do not edit; do not re-run the discovery's probes.

## COSA

Implement slice S1 exactly as designed in the handoff of the previous session,
`/Users/alfonso/.jjodel-lanes/P-2026-10-20-2055/handoff.md` (local, not in the repository: read it first, it is the
specification of this lane), which follows §10 and §11 S1 of
`docs/discovery/discovery_2026-10-20_jjel_bitvector.md`. The previous session stopped on the context ceiling before
writing code; nothing is on disk beyond `319b16865`.

Decisions in force for this lane (recorded by this prompt's commit in `docs/decisions.md`): the discovery's nine
«Decisions taken (unattended)» are adopted; `x.bit(i)` returns a 1-bit vector; R-BV-7 (a stored bit-vector attribute
reads its width per element from the model; S2's business, not this lane's); R-REL-2 (bit-vectors ship in 3.2).

## DOVE

Write only the files of the handoff's «Scope» section: `frontend/src/jjel/evaluator/context.ts`, new
`frontend/src/jjel/evaluator/builtins/bitvectors.ts`, `frontend/src/jjel/evaluator/evaluator.ts`,
`frontend/src/jjel/evaluator/builtins/collections.ts`, `frontend/src/jjel/metadata/builtins.ts`,
`frontend/src/jjel/SPEC.md`, new `frontend/src/jjel/__tests__/bitvector.test.ts`, new
`frontend/src/jjel/__tests__/fixtures/bv-golden.json`. This list is the Rule 19 declaration: no pause. Docs in the
closure commit: `docs/decisions.md` rows R-BV-1, 3, 4, 5, 6 rewritten with the §10 amendments (still `provisional,
unattended`, `verified: none`, discovery P-2026-10-20-2055
cited in the row body), R-BV-2 with the `null` precision; the Status lines of this
prompt and of `docs/prompts/claude_2026-10-20_2055_prompt_jjel_bitvector_discovery.md`; the log-inbox entry. Any other
file under `frontend/src` is out: if the typecheck forces one, stop with `Outcome: question` and a `Recommended:` line.

## COME

1. Baseline typecheck (expected 0) and `npx vitest run src/jjel` (expected 299 passed).
2. Write `bitvectors.ts` and its tests first, then wire the evaluator, then collections and metadata, then SPEC.md.
3. Gates: typecheck 0 through `node scripts/run-quiet.mjs`; `npx vitest run src/jjel src/jjtl src/model/simulation
   src/codegen` green with the 299 earlier JjEL tests unchanged; `npm run build`; the §13 mutation bench on a scratch
   copy, every mutation killed, the killing test named in the commit body.
4. One `feat(jjel): bit-vector values in the evaluator (P-2026-10-20-2331)` commit and one docs closure commit,
   `git add` by path, `Model:` trailer (P6).

## NON FARE

No critical-zone file, no new dependency, no lexer or parser change (literals are S4), no simulator or codegen change.
Do not name the industrial partner in any file: the repository is public.

## RIFERIMENTI

The handoff above; `docs/discovery/discovery_2026-10-20_jjel_bitvector.md` §2.5, §3.2, §10, §11, §12, §13;
`docs/decisions.md` sections `## R-BV` and `## R-REL`; `frontend/src/jjel/SPEC.md`; `docs/spec/concern_languages.md`.
