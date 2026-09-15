# Harness evolution: phases and recalibration

> Purpose. The harness we modelled is the phase-4 snapshot of a process that evolved through four
> phases of LLM adoption. This note records the phases, anchors each to git and corpus evidence,
> models recalibration as a self-referential meta-transformation, and states where the evolution
> belongs in the paper. Observed means dated from git or read from the corpus; testimony means stated
> by the director in the meetings (not incarnated in any document). No em dashes.

## Why this matters

The FTG+PM model in the paper is a single snapshot. In reality the harness has versions: its type
space (which document types exist) and its process changed over time. Transitions were not drift,
they were deliberate recalibration events in which the architect (Claude.ai) and the implementer
(Claude Code) analysed the code base and decided, with the director, how to change the process. So
the harness is self-reflective: the process periodically rewrites its own type space. This is the
evolutionary reading of the model and a distinct contribution angle (a process that co-designs
itself), beyond the static conformance audit.

## The four phases, anchored

| Phase | Period (evidence) | Executors | Dominant document types | What it solved | Debt it left |
|---|---|---|---|---|---|
| 1. Spontaneous | before 2026-01 (testimony; no markup in corpus) | human + one chat, tool progression ChatGPT then Gemini then Claude | none (knowledge in chat sessions only) | got code generated at all | everything in transit, nothing incarnated |
| 2. Three agents | from 2026-01-17 (`CLAUDE.md` added) | director, architect (Claude.ai), implementer (Claude Code) | persistent context (constitution) | separated reasoning from implementation; a stable constitution | design coherence still in the director's head |
| 3. Intermediate+ | from 2026-01-22 (first handover doc); handover docs span 2026-01 and 2026-02 | same three | handover or end-over documents | carried design coherence and consistency across sessions | handovers verbose, token-costly, and session-bound |
| 4. Codebase support docs | log added 2026-03-17; discovery reports from 2026-05-09; session and prompt docs and decision logs through this period | same three | discovery reports, session documents, prompt artifacts, decision and operational logs | structured the loop: discovery then decision then implementation, with a written record | discovery handoff largely not incarnated (about 4 to 5 percent), log unbounded, a stale twin constitution (`AGENTS.md`, added 2026-06-05) |

Corpus-level corroboration: markup creation per month rises as the process formalizes (2026-01: 23
files added, 02: 8, 03: 12, 04: about 21, 05: 40, 06: 15 so far). The handover language is produced
only in January and February and never after, which is the phase 3 to phase 4 transition visible in
the tree.

## Recalibration as a meta-transformation

Recalibration is the transition mechanism. Evidence of recalibration events in the corpus:
`audit-2026-04-05.md` and `git-analysis-2026-04-05.md` (a paired code-base audit on the same day),
`analysis_2026-06-08_codebase_overview.md`, and the self-reported marker in `CLAUDE.md`,
"Last calibration 2026-05-22". The director's account: at each transition, Claude.ai with Claude Code
analysed the code base and decided, with the human, how to change the process.

Modelled in FTG+PM terms, recalibration is a higher-order transformation:
```
Recalibrate : (CodeBase, Harness_n) -> Harness_{n+1}
```
where a `Harness` is itself an FTG+PM configuration (its set of languages and transformations). Its
executor is collaborative (architect and implementer producing the analysis, director gating the
change). It is self-referential: its output is a new type space for the very process that runs it.
Concretely, the 2026-02 recalibration retired the handover language and introduced session
documents; later recalibrations introduced discovery reports and rewrote `CLAUDE.md`.

This gives a clean two-level picture:
- object level: within a phase, the PM enacts the loop typed by that phase's FTG;
- meta level: recalibration transforms one phase's harness into the next.

## Consequences for the analysis

1. The snapshot model should be labelled as the phase-4 harness, with `L_handover` carrying a
   validity interval (phases 3 to early 4), which makes finding D10 (retired edge) a recalibration
   outcome rather than an anomaly.
2. Knowledge debt is not monotone: recalibration pays some down (retiring verbose handovers) and
   incurs new debt (the discovery incarnation gap, the twin constitution). An honest assessment plots
   debt against phase, not as a single number.
3. Phase 1 is the extreme case of knowledge debt: a whole phase with zero incarnated documents, all
   knowledge in transit. It is the baseline the later phases improve on.

## Where it goes in the paper

Add a short subsection in the harness section (or a dedicated half-page) titled along the lines of
"From spontaneous to structured: harness evolution and recalibration", with a timeline figure
(four phases plus recalibration arrows) and the table above condensed. Frame recalibration as a
self-referential transformation, and use it to (i) justify why the modelled harness is one snapshot
among versions, and (ii) set up the future-work claim that the validated model can be fed back into a
recalibration to generate the next harness. This strengthens the special-theme fit: assessing
performance across phases, not just at one instant.

## Open points

- Phase 1 dates are testimony only; state this and do not fabricate a precise boundary.
- Confirm whether `AGENTS.md` (2026-06-05) marks a fifth phase (a second implementer, Codex, entering
  the loop) or is just a phase-4 artifact. If a second implementer was added, the triad became a
  larger team and that is a phase 5.
- The recalibration artifacts (audits, analyses) are candidates for their own Language (recalibration
  report), currently untyped: this connects to debt finding D4 (missing language for audit records).
