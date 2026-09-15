# Prompt Claude Code — fix: fallback della palette IR quando l'intersezione con le rootable è vuota

**Data**: 2026-07-18
**Branch di lavoro**: `cloud/ir-editorv2` (HEAD `18a08cc0f`, applicato via bundle v6). NON lavorare su `alfonso-frontend-jjtl`.
**Tipo**: fix scoped + emendamento spec. Nessun file critical-zone atteso.

## Contesto

EditorV2 filtra la palette M1 alle metaclassi con view vertex/graphVertex dichiarate nel viewpoint IR attivo (introdotto nel commit `876339c72`, Fase 3). Caso limite osservato nello smoke: un viewpoint che dichiara view solo per metaclassi non-rootable produce una palette vuota ("No rootable classes found").

Decisione di Alfonso (2026-07-18): **fallback alla palette completa**. Rationale: la spec sez. 6 richiede che un viewpoint senza `interaction` sia pienamente editabile con i gesti derivati, e la sez. 10 vieta i vicoli ciechi; il filtro derivato è un aiuto di focusing, non una restrizione. La restrizione dura fino a vuoto resterà prerogativa della futura `interaction.palette` esplicita.

## COSA

1. **Fallback**: quando l'insieme (metaclassi con view IR dichiarate nel viewpoint attivo ∩ metaclassi rootable) è vuoto, la palette mostra tutte le metaclassi rootable, identica al comportamento senza filtro, con una notice testuale nella palette: `Active viewpoint declares no views for creatable root classes. Showing all.` (adattare il wording alle convenzioni UI esistenti; testo secondario 11px).
2. **Caso comune invariato**: intersezione non vuota → filtro attivo come oggi, nessuna notice.
3. **Emendamento spec**: in `docs/specs/spec_2026-07-18_ir_schema_v1_2.md`, sez. 6, dopo il blocco `InteractionSpec` e il paragrafo normativo, aggiungere questo paragrafo verbatim:

   > **Fallback della palette derivata (normativo)**: se l'insieme derivato dalle view, intersecato con le metaclassi instanziabili alla radice, è vuoto, l'interprete mostra la palette completa (tutte le rootable) con una notice; il filtro derivato è un aiuto di focusing, non una restrizione. Solo `interaction.palette` esplicita può restringere la palette fino a vuoto.

4. **Unit test**: nel modulo dove vive la logica del filtro, aggiungere il caso intersezione vuota → fallback (palette = tutte le rootable) e verificare che il caso non vuoto resti filtrato. Non modificare i test esistenti.

## DOVE (discovery breve, read-only)

- Localizzare la logica del filtro palette: `git show 876339c72 --stat` per i file toccati dalla Fase 3; il plan di interaction è in `src/components/editor-v2/viewpoint/ir/` (irInteraction.ts), il wiring del filtro sta in EditorV2. Individuare il punto unico dove oggi si calcola l'intersezione con le rootable.
- Leggere per intero i file interessati prima di modificarli.
- **OBBLIGATORIO**: salvare il discovery report in `docs/discovery/` con nome `discovery_2026-07-18_palette_ir_fallback.md` (obiettivo, file letti con path completi, findings, dipendenze e rischi, domande aperte). Il report va scritto anche se la discovery dura cinque minuti.
- **Go-ahead pre-concesso** per la Fase 2 nella stessa sessione, SALVO che la discovery riveli che il filtro tocca `canvasToJjom`, `useJjomSync.ts`, `portDistribution.ts` o che esistono più punti di iniezione del filtro: in quei casi HARD STOP dopo il report e segnalazione ad Alfonso.

## COME

- Il fallback si decide dopo il calcolo dell'intersezione, nel punto unico del filtro. Non duplicare la logica, non introdurre state nuovo.
- Diff minimale: zero refactoring opportunistico, mai rinominare identificatori esistenti.
- Prima di introdurre nuovi identificatori (es. classe CSS/SCSS della notice), `grep -r` globale per verificare che il nome non sia già in uso.
- La notice appare solo nel caso fallback; markup minimo dentro il componente palette esistente, niente layout shift nel caso comune.
- Verifica: `npm run build` verde; `npx tsc --noEmit` = 14 errori (baseline invariata, 0 nei file toccati); `npx vitest run` sui test del modulo IR tutti verdi.
- Un solo commit (codice + test + spec): `fix: fall back to full palette when IR-declared classes are not rootable`. `git add` dei soli file toccati, mai `git add .`.
- Aggiornare `docs/claude-code-log.md` a fine task (entry standard con data, tipo, prompt, file toccati, esito).

## RIFERIMENTI

- Spec IR v1.2: `docs/specs/spec_2026-07-18_ir_schema_v1_2.md`, sez. 6 (interaction) e sez. 10 (fallback espliciti).
- Report di consegna, checklist punto 7 e todo "Palette IR" (alta, UX).
- Commit di riferimento del filtro: `876339c72` (Fase 3).
- CLAUDE.md resta la fonte di verità: in caso di conflitto con questo prompt, segnalare e fermarsi.

## Dopo il fix (a carico di Alfonso)

Ri-eseguire il punto 7 della checklist su tre casi: viewpoint con view su rootable (filtro attivo), viewpoint con sole view non-rootable (palette piena + notice), nessun viewpoint (palette piena, nessuna notice).
