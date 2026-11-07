# Textual syntax, lane C2e: the `: <Class>` label of a nameless target on the IR form chip (critical zone, two phases)

Prompt-ID: P-2026-11-06-2041
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-06 · lane full · ed9054afd (report), baec942aa (code) · app probe 7 checks pass, crop c2e-1-ir-form-mod.png in ~/.jjodel-lanes/P-2026-11-06-2041/; verifica visiva passata 2026-11-06 23:01 (Alfonso, GO on the crop)
Lane: full (critical zone, CLAUDE.md 3.1 `viewpoint/ir/`; Phase 1 read only with a Layer Impact Report, then a hard stop)
Depends: C2d (f1bef5364, the `: <Class>` label on the default view), R-TXT-46 D4, R-TXT-47
Worktree: ~/jjodel-w-c2e, branch textual-c2e-ir-chip, from fc79098ad (own node_modules)
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-06 20:34, «decidi tu in /lane auto», on the chat's question whether to start C2e)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of fc79098ad and the tree is clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-06-2041 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD.

## COSA

Row 5 of docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md §4: the IR form chip of a reference to a nameless object shows `: <Class>` as the default view does after C2d, instead of an empty label. Today `displayValue` in frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx (:147-161) returns `l.name`, which is '' for a nameless target. A named target and a broken pointer stay as they are.

**Phase 1, read only.** Read CLAUDE.md 3.1 and 3.12, IRFormField.tsx in full, C2d's helper in frontend/src/components/editor-v2/utils/jjomTransformers.ts and its test namelessRefTarget.test.ts. Write the Layer Impact Report (which layers the change touches, which subscriptions and proxies it reads, what it cannot affect, the exact lines) as docs/discovery/discovery_2026-11-06_textual_c2e_ir_chip.md, commit it, flip nothing, and stop with Outcome: hard-stop. Phase 2 starts only on a GO from the chat that quotes this Prompt-ID.

**Phase 2, after the GO.** Reuse C2d's helper (import it; do not copy it). Test red first in namelessRefTarget.test.ts: nameless target labelled `: <Class>`, named target unchanged, broken pointer unchanged. Gates from frontend/, one call each: npm run typecheck; full npx vitest run (3 baseline import reds; harness or order reds rerun alone); npm run build; npm run check:docs. App check: an IR view with a reference to a nameless target, crop in ~/.jjodel-lanes/P-2026-11-06-2041/, light theme, scale 1, beside a named target and a broken one; stop the server. Log entry (Layer Impact Report: the report's path) and Status flip, uncommitted (RC-17). No push, no merge.

## DOVE

frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx (displayValue only), frontend/src/components/editor-v2/utils/__tests__/namelessRefTarget.test.ts. Nothing else; if the helper must change to be importable, stop with Outcome: question.

## RIFERIMENTI

docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md §3, §4 (rows 4 and 5); docs/decisions.md R-TXT-46, R-TXT-47; crop ~/.jjodel-lanes/P-2026-11-04-2255/sD4-v2flow-peer-to-nameless.png.
