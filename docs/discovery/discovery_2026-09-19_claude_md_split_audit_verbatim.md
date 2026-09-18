# Discovery — verbatim audit of the CLAUDE.md split (Phases 1 to 3) and state of Phase 2 §5

Prompt-ID: P-2026-09-18-2110
Date: 2026-09-19
Type: discovery (read-only audit, no normative file touched)
Baseline: `084d99b3b` (trunk, before Phase 1). Audited: `e22ccfe5e` (trunk HEAD).
Tree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`.
Probes: `docs/discovery/harness/probe_2026-09-19_claude_md_audit_lines.mjs` (line level) and
`docs/discovery/harness/probe_2026-09-19_claude_md_audit_blocks.mjs` (block level). Both read the
two revisions with `git show`, so they do not depend on the working tree, which is dirty with another
lane's WIP.

## 1. Verdict

**The moves are verbatim.** Of the 856 non-blank lines of the baseline `CLAUDE.md`, 850 are present
byte for byte (trailing space ignored) somewhere in the current corpus (root, the eight nested
modules, `docs/PROTOCOL.md`), 0 are present only after whitespace or newline normalization, and 6 are
absent. The 6 are all accounted for in section 3 below. No word, table, path or date was altered in
a block that was moved.

That verdict covers the moved text. It does not cover three things the moving commits also did, which
are listed in section 4 and need a decision.

## 2. Method and commands

Line level. Every non-blank baseline line is looked up as an exact line in the union of the current
files, then, failing that, as a substring of the whitespace-collapsed union. Reverse direction: every
current line whose collapsed text is not a substring of the collapsed baseline (`CLAUDE.md`, `jjtl/CLAUDE.md`,
`docs/PROTOCOL.md`) is listed as added.

```
node docs/discovery/harness/probe_2026-09-19_claude_md_audit_lines.mjs 084d99b3b HEAD   # exit 0
```

Block level. The baseline is cut into 72 blocks at each `##` / `###` heading (fence-aware, so the
`## YYYY-MM-DD` inside the §21.2 code block is not a heading). A block passes when its
whitespace-collapsed text, with the `---` section rules removed, is a substring of one current file:
that tests verbatim text, order and contiguity together.

```
node docs/discovery/harness/probe_2026-09-19_claude_md_audit_blocks.mjs                  # exit 0
blocks=72  whole-and-verbatim-in-one-file(ignoring '---' rules)=65  not-whole=7
```

Placement. `VERBOSE=1` on the block probe prints, for every block that passes, the file that holds
it. Result: §3.3 to §3.5, §3.10 and §3.11 in `editor-v2/CLAUDE.md`; §3.6 to §3.8, §3.12, §3.13 and
§9 (with 9.1 to 9.3) in `model/CLAUDE.md`; §3.9 in `redux/CLAUDE.md`; §7, §7.1, §7.2 in
`styles/CLAUDE.md`; §11 in `jjel/CLAUDE.md`; §13, §13.1, §13.2 in `jjscript/CLAUDE.md`; §14 in
`services/export/CLAUDE.md`; and §3.1, §3.2, §12.6 and §21.2 left in the root. That is the placement
the prompt asks for.

The 7 blocks that are not whole in one file:

| Block | Why it is not whole | Verbatim? |
|---|---|---|
| §5 | Three worked examples were compressed on purpose (Phase 2), section 3 | as designed |
| §6.4, §6.5, §6.6 | Body moved to `docs/PROTOCOL.md` P13, P14, P15 (where the heading is renamed); the heading and a stub stay in the root | yes: 39 of 40, 21 of 22, 19 of 20 lines in PROTOCOL.md, the remaining one being the heading in the root |
| §12 | Heading stays in the root, its two body lines moved to `jjtl/CLAUDE.md` | yes: 2 of 3 lines in the module, the third being the heading in the root |
| §12.7 | Removed, not moved (section 4, finding B) | no |
| §21.3 | Artifact of the probe: the block's own `---` rule is stripped from the baseline text and kept in the root. All 34 lines are present in the root | yes |

## 3. The 6 baseline lines that are not present

| Baseline line | Where | What happened |
|---|---|---|
| L440, L444, L467 (three long paragraphs of §5) | root §5 | Phase 2 compression: each worked example replaced by one sentence naming what it established and the date, plus a pointer to the account. See below |
| L861, L863, L864 (§12.7 heading and its two lines) | root | Dropped, finding B |

Phase 2 compression, checked against the cited accounts. The prompt says the full account must exist
in a discovery or session file, created if absent. Each detail that left the root was searched for in
the file the root now cites (`command grep -c`, an explicit path, positive control `513` returning
1 before the others were read):

| Detail removed from the root | Cited file | Present |
|---|---|---|
| `513` lines, `--exclude-dir=node_modules` | `discovery_2026-08-11_ugrep_wrapper_ignore_files.md` (created by `da07e3169`) | yes |
| `tail -60`, count of 12 against 33 | `discovery_2026-08-13_arco3_fase1_griglia_84.md` (pre-existing, 2026-08-13) | yes |
| `#7A4056` to `#0ea5e9`, `style.scss:790`, `tree-node__icon` | `discovery_2026-08-12_harness_visivo_e_scala_entity_nel_tree.md` (pre-existing) | yes |
| `14/14`, `scalarOf`, `2 red` | `discovery_2026-09-16_symbolrecognition_scalarof_mutation_bench.md` (created by `da07e3169`) | yes |

## 4. Findings that are not pure moves

**A. `frontend/src/jjtl/CLAUDE.md`: text that existed there before the split was rewritten.** The
2026-08-05 preamble line `**Full reference**: frontend/src/jjtl/SPEC.md. Cross-language symbol
ownership (...) stays in the root CLAUDE.md §12.6 — it governs JjEL and JjScript too.` no longer
exists as such. It was split: the `Full reference` line now carries the longer text that used to be
in root §12, and the cross-language sentence became its own paragraph with the same words. The
preamble paragraph above it also gained four lines. The sentence at line level is intact, but two
pre-existing lines were merged and reflowed, which is not a move.

**B. §12.7 was deleted, and the note says it was moved.** `### 12.7 Editing the language` plus its
two lines ("The 5-file checklist ... live in `frontend/src/jjtl/CLAUDE.md`, which loads when working
under that directory.") are absent from the whole corpus. The sentence pointed at the file it would
now live in, so dropping it is defensible. The preamble added to `jjtl/CLAUDE.md` nevertheless says
"former §12.7 pointer moved here verbatim". That statement is false as written.

**C. The clause range is undercounted again.** `docs/PROTOCOL.md` now has P1 to P15. Three places
still say P1..P12: `CLAUDE.md:14`, `CLAUDE.md:108` and `docs/PROTOCOL.md:11`. It is the same defect
that was corrected from P1..P11 to P1..P12 on 2026-09-18, and P13 to P15 are the clauses Phase 2 added.

**Prose added by the moving commits (expected, listed for completeness).** 48 added lines in the
root (the "Moved to ..." stubs, plus the three compressed §5 paragraphs) and 3 to 10 lines of header
in each module. One paragraph in `redux/CLAUDE.md` (the `DV.tsx` gap, four lines) is new prose and not a move
of §3.9; the Phase 1 log entry already flags it.

**Other files changed since the baseline**, beyond the ones above: `docs/decisions.md` (RC-13 now cites
P13, +3 -1) and `docs/log-inbox/claude-md-split.md` (new). No code file.

## 5. Phase 2, §5: what was done and what is left

The premise that the §5 compression "was not done" does not hold. `da07e3169` compressed all four
named examples to one sentence with the date and a pointer, and the accounts are in the cited files
(section 3). §5 went from 9,382 to 9,074 characters, measured in node over the section text from
its `## 5.` heading to the next `## ` heading, newline included: a saving of 308. Three paragraphs
changed (the positive-control one, which carries two examples, the computed-style one, and the
mutation-bench one). The saving is small because each example sat inside a paragraph that is mostly
rule, and only the example sentences were replaced. The 9,381 and 9,073 quoted in the handover message are
the same section without the trailing newline.

The rest of §5 is rules and sub-rules. Its largest paragraphs, by characters: the positive-control
paragraph 1,356 (rule plus the two compressed measurements), the "a test is judged by the mutations
it kills" rule 530, the "do not trust fixtures" sub-rule 495, the computed-style rule 473, the
source-text rule 443. There is no further worked example to move without cutting a rule, which the
prompt forbids.

## 6. Counts

| | characters (`wc -m`) | bytes (`wc -c`) |
|---|---|---|
| Root `CLAUDE.md` before Phase 1 (`084d99b3b`) | 62,440 | not measured |
| Root `CLAUDE.md` now (`e22ccfe5e`) | 40,551 | 41,386 |
| Target of the prompt | under 40,000, expected 21,000 to 25,000 | |
| Gap to the limit | 551 over | |

The root is over the limit by 551 characters, and 'with headroom' means well over that. §5 cannot
supply it under the prompt's own constraint. Largest remaining root sections by characters, measured
in node on `e22ccfe5e` (fence-aware, newline included): §5 9,074; §3 with 3.1, 3.2 and the stubs
4,900; the non-negotiable block and preamble 4,593; §21 4,479; §12 (the language table and stubs)
2,209; §6 2,027; §19 1,956; §17 1,831; §8 1,795; §18 1,190.

## 7. What this audit did not do

The three gates were not run for this report: no gated file (`CLAUDE.md`, `AGENTS.md`,
`docs/PROTOCOL.md`, `docs/claude-code-log.md`) was touched. The trunk worktree has no
`frontend/node_modules`, and `npm run` resolves `package.json` under `frontend/`, not at the root.
The previous run of the three gates is recorded in the Phase 3 inbox entry and was not re-measured.
