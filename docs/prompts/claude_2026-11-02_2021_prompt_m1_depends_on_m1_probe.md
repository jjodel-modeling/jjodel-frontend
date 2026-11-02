# Probe: can an M1 model depend on another M1 model

Prompt-ID: P-2026-11-02-2021
Chat: C-2026-11-02-1541
Front: hw-notation
Status: eseguito 2026-11-02, lane P-2026-11-02-2021 (hw-notation)
Lane: discovery (read-only on product code; one probe outside the repo, one short report, one docs-only commit)
Depends: P-2026-11-02-1942
Worktree: ~/jjodel-w-jjtlnotation, branch jjtl-notation-measure (the same tree, at the commit that adds this prompt)
Request: none (Alfonso's ok of 2026-11-02 20:19; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlnotation` on
`jjtl-notation-measure`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2021 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. No product code. Keep context low: never print a whole log.

## COSA

Q4 of `docs/discovery/discovery_2026-11-02_jjtl_generic_transformation.md`, which decides both C0 and the cross-model reference of `docs/discovery/discovery_2026-11-02_textual_notation_for_templates.md`. Start from `LModelElement.tsx:5234-5239`, `5727` and `5862-5886`. Measure with `lane-run probe` on a free port, in a real project with one metamodel and two M1 models, Brief and Library:

1. Is there a UI gesture that makes one M1 depend on another? If only the API allows it, name the call.
2. After declaring it, can an object of Brief hold a reference to an object of Library? Does `allSubObjects` with its cross option, `crossObjects` and the dependency getters see it?
3. Does it survive save and reopen, with the pointer intact?
4. What happens on deleting the Library, and on a dependency cycle?
5. What does the JjTL Execute path receive today for Brief (`ProjectEditor.tsx:1437`, `1463-1464`): is the reference to Library serialised or lost?

Then say, for C0: works as is, needs a small change (name it), or a platform change. Also add to `docs/decisions.md`, in the R-JTG section, as provisional and unattended: **R-JTG-8**: recommendation to the owner of the kernel metamodel: the `for each`, `where`, guard and substitution source of a template are modelled expressions, not strings, so that the generic transformation interprets no text. Not decided here: it belongs to the hardware prototype, and it sizes the expression sub-language.

Report: `docs/discovery/discovery_2026-11-02_m1_depends_on_m1.md`, in English, beginning with `## 0. Answer in brief`.

## DOVE

Written: the report, `docs/decisions.md`, `docs/log-inbox/hw-notation.md`, the `Status:` line. Probe files in `~/.jjodel-lanes/P-2026-11-02-2021/`. The repo is public: name no partner company.

## COME

`check:docs`, and check the new row against `parseRows` of `scripts/gates/docs-digest.ts`. Docs-only commit, named paths only. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
