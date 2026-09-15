# Prompt Claude Code: fix, una riga reference vuota non ha area di click per la select

**Data**: 2026-08-26 23:05
**Branch**: `alfonso-frontend-jjtl`, HEAD `1635e8450` (commit B, non ancora loggato: questo fix va prima del GO finale di B)
**Tipo**: fix
**Effort**: medium
**Critical-zone**: `viewpoint/ir/irStyle.ts` è in §3.1, ma la modifica è solo CSS di presentazione: nessun LIR, nessuna scrittura D/L.
**Decisioni**: R-SGL-4, R-SGL-10(9)

Leggi `CLAUDE.md`. Nessuna discovery: il difetto è misurato.

## Difetto

Misurato dalla chat su `localhost:3000`, progetto `dd`, `model_1`, con la view per `Shape` a compartimento `references` e segmenti `name`, `" = "`, `value`: gli span `.ir-row__value--select` con valore vuoto hanno `width: 0` (`w=0 h=18` su cinque righe). Il doppio click non ha bersaglio, quindi la **prima assegnazione** di una reference, il caso normale di R-SGL-4, è impossibile dal canvas. Con un valore presente (`color = Red`) la select si apre e scrive correttamente. Lo stesso vale per `.ir-row__value--editable` degli attributi vuoti, pre-esistente e mascherato dai default.

## COSA

In `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`, accanto alle regole esistenti a `:174-178`:

1. Area minima di click per entrambe le classi (attributi e reference), così un valore vuoto resta cliccabile:
   `.ir-node-content .ir-row__value--editable { display: inline-block; min-width: 1.5em; }` (aggiungi le due proprietà alla regola esistente a `:174`, non una regola nuova).
2. Placeholder solo per la select, che dice «assegnabile» senza inventare un valore:
   `.ir-node-content .ir-row__value--select:empty::after { content: '…'; color: #94a3b8; }`
   Se in `irStyle.ts` esiste già un token o un colore muted usato per testo secondario, usa quello al posto dell'esadecimale e dillo nel log.

Nessun altro file. Verifica che lo span vuoto sia davvero `:empty` (nessun whitespace figlio in `IRNodeContent.tsx:495-520`); se il render emette `{row.value}` con stringa vuota React non crea nodi di testo, quindi dovrebbe esserlo: se non lo è, hard stop e dillo, la soluzione cambia (placeholder da JSX).

## Gate

`npm run typecheck` a baseline, `npm run build`. Commit unico: `fix(ir): empty reference rows keep a click area and show a placeholder for the singleton select`.

**HARD STOP** dopo il commit. Verifica di Alfonso: su `Shape_1`, `color = …` in grigio; doppio click sul `…` apre la select; dopo la scelta il placeholder sparisce; un attributo vuoto resta cliccabile. Poi si riprende la checklist di B dal punto 2, e l'entry di log di B include questo fix come commit aggiuntivo.
