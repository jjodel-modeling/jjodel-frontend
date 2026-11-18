# Textual syntax, step B2 discovery: outline structure, unnamed objects, the hover card in Monaco

Prompt-ID: P-2026-11-04-0005
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-04 · lane full · 10133057a
Lane: full (discovery only in this prompt, read-only on the code)
Depends: P-2026-11-03-2300 (step B design); runs beside P-2026-11-03-2350 (B1, same code, other worktree): read only
Worktree: ~/jjodel-w-textb2, branch textual-b2-discovery
Request: none (R-TXT-39, Alfonso 2026-11-04 00:00, from the mockup he approved)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: the tree is clean on the stated branch, otherwise stop with Outcome: blocked. No production code in this lane; probes under docs/discovery/harness/ only. Every reply opens with [P-2026-11-04-0005 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. A question with a recommendation carries one line: Recommended: <one line>. No subagents, no background tasks except a foreground probe server. Never cat a probe log: summary lines only. One probe run per tool call. Commit the report before stopping.

## COSA
Read R-TXT-39, R-TXT-38, R-TXT-36 and docs/discovery/discovery_2026-11-03_textual_language_service.md (the outline and breadcrumb are React components inside the Text tab). Measure three things and write docs/discovery/discovery_2026-11-04_textual_b2_outline_hover.md (objective, files read with paths, findings with file:line and figures, risks, one recommended design per point with rejected alternatives, Decisions taken (unattended), Decisions awaiting Alfonso).

(1) Outline structure: the outline shows the containment feature groups (`transitions`) as nodes between an object and its children, so outline and breadcrumb follow the text; read how the tree's item and list nodes give that, and what a feature printed inline or positionally (annotations) shows. (2) Unnamed objects: propose one rule, valid for every metamodel with no metamodel-specific code, that labels an unnamed object in the outline by a distinguishing value: candidates are the first printed single-valued attribute or reference with a value, the first mandatory feature, the class keyword plus a reference target, with the fallback `Class[k]` as the paths print; the rule must give `Transition coin` on demoESM and something sensible on the library, turnstile and garage cases of __tests__/tolerantCorpus.ts, and the same label must be stable across a reprint. Show the labels the candidates give on every corpus case in a table. (3) The hover card: Monaco's hover is transient; measure, with a probe in the app on a free port, what the standalone Monaco in the repo's version allows: a hover that stays open until closed or until a click on the text, carrying actions («Go to definition», the list of lines using the reference, each a link), through the hover provider's contents (command links, MarkdownString `isTrusted`), the sticky-hover option, a custom content widget or overlay widget, or a React card positioned from the editor's coordinates; for each, what works, what breaks (keyboard, scrolling, other hovers) and whether it is a forcing of Monaco; also check that F12, Shift+F12 and the context menu entries work with providers registered the B1 way. If no clean way exists, say so and recommend the closest honest behaviour.

Stop with Outcome: question. The repo is public: name no partner company. No push, no merge.
