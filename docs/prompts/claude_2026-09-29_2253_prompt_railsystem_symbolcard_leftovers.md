# Remove the two SymbolCard leftovers in railSystem.scss

Prompt-ID: P-2026-09-29-2253
Chat: C-2026-09-29-1826
Lane: fast (dead selector and stale comment, no visible change)
Status: to execute
Model: claude-sonnet-5-5 (light tier)

## COSA

P-2026-09-29-1929 removed `SymbolCard` and reported two leftovers in `frontend/src/components/editors/railSystem.scss`, both invisible:

1. around line 52, the selector `> section.properties-tab.properties-panel.symbol-card` in a selector list: it matches nothing now, and the selector above it already covers the same elements. Remove only that selector from the list (and its trailing comma if the list syntax needs it).
2. around line 26, the header comment still names the SymbolCard. Remove that mention only; keep the rest of the comment.

Decided by the project chat on Alfonso's "decidi tu" (2026-09-29).

## DOVE

`frontend/src/components/editors/railSystem.scss` only.

## COME

1. Grep `symbol-card` and `SymbolCard` across `frontend/src`: the only hits must be the two lines above. Otherwise stop with `Outcome: question`.
2. Edit surgically. No other change in the file.
3. Gates: `npm run build`, typecheck at baseline (14), `check:docs`. No visual probe needed: the removed selector matches no element (state the grep result as evidence).
4. One commit `style(editors): drop SymbolCard leftovers in railSystem.scss (P-2026-09-29-2253)` with the `Model:` trailer; then one docs-only closure commit with the log entry (`log-entry` skill) and the Status flip.
5. Do not merge. Last line: `Outcome: done | hard-stop | question | blocked`.
