# Remove the dead SymbolCard component and its styles

Prompt-ID: P-2026-09-29-1929
Chat: C-2026-09-29-1826
Lane: fast (deletion of dead code, no behaviour change)
Status: to execute
Model: claude-opus-5-5 (default from .claude/settings.json)

## COSA

After P-2026-09-29-1826 (Symbol tab opens the Symbol Editor directly, merged in f7c5fd910) the intermediate Symbol pane is no longer rendered. Its component and styles have no users. Delete them. Alfonso approved the deletion on 2026-09-29 (RC-26 item: deletions).

## DOVE

- `SymbolCard.tsx` (delete)
- `SymbolCard.scss` (delete)
- `railSystem.scss`, the SymbolCard rules around lines 326-354 (remove only those rules)
- any now-unused import that pointed to the deleted files

Nothing else. No renaming, no refactor of neighbouring rules.

## COME

1. Short discovery, report in `docs/discovery/` as `discovery_2026-09-29_remove_symbolcard.md`: global search for `SymbolCard` and for every CSS class defined in `SymbolCard.scss` and in the `railSystem.scss` block. List each hit. If any class or symbol has a user outside the files to delete, STOP with `Outcome: question`. Otherwise continue in the same session.
2. Delete with `git rm <file>` and edit `railSystem.scss` surgically.
3. Gates: typecheck at baseline count (14), vitest at baseline, `npm run build`, `check:docs`.
4. Visual smoke (Playwright probe on :3002, crops gitignored): the vertex view Symbol tab still opens the modal, the rail tab bars look identical to before (tab widths unchanged versus the P-2026-09-29-1826 measures).

## Lane discipline

- `git add`/`git rm` on specific paths only. One commit: `refactor(authoring): remove unused SymbolCard and its styles (P-2026-09-29-1929)`, with the `Model:` trailer.
- Log entry via the `log-entry` skill and the Status flip in one docs-only closure commit after the smoke passes.
- Do not merge. Last line: `Outcome: done | hard-stop | question | blocked`.

## RIFERIMENTI

- P-2026-09-29-1826 report (dead code note: `SymbolCard.tsx`, `SymbolCard.scss`, `railSystem.scss:326-354`).
