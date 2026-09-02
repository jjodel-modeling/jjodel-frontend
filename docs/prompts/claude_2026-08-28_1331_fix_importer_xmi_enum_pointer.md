# R-FRM-3, Fase 2, commit 2: l'importer XMI risolve i nomi dei literal in pointer

**Tipo**: fix chirurgico all'import XMI. Secondo e ultimo commit di R-FRM-3. Il commit 1 (`fe1d5a0bd`, CHECK 10 tollerante) è verificato a schermo da Alfonso.
**Branch**: `alfonso-frontend-jjtl`.
**Prima di iniziare**: leggere `CLAUDE.md`, l'ultima pagina di `docs/claude-code-log.md`, e il discovery report `docs/discovery/discovery_2026-08-28_r_frm3_enum_canone.md` (findings B6-B10 e C11). Se qualcosa qui contraddice `CLAUDE.md`, segnalare il conflitto invece di procedere.

## Passo 0: log entry del commit 1

Prima del lavoro nuovo, scrivere l'entry di `docs/claude-code-log.md` per `fe1d5a0bd` (formato standard, tipo `fix`, esito ✅). Nella nota: verifica visiva di Alfonso confermata sul falso positivo (enum assegnato da editor, banner Conforms verde); il controllo visivo del vero positivo è rimandato alla verifica di questo commit perché gli editor non possono fabbricare una violazione (i literal non sono cancellabili da UI), e il ramo violazione è coperto dai 9 unit test. Commit separato:

```
git add docs/claude-code-log.md
git commit -m "docs: log entry for CHECK 10 enum pointer tolerance"
```

## Gate di ingresso

`git status --porcelain -- frontend/src/services/export` deve uscire **vuoto**. Lo stato del resto del tree non blocca ma va dichiarato nella nota finale (il lavoro instance-node di un'altra sessione è noto e atteso).

Regola sul typecheck, ratificata in chat dopo il commit 1: se un rialzo sopra baseline origina **nei file che questo task sta scrivendo**, correggerlo è parte del lavoro; se origina altrove, fermarsi e segnalare.

## Contesto

La spec (`docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md`, §10) fissa il pointer al `DEnumLiteral` come canone del valore enum. Il commit 1 ha reso CHECK 10 tollerante a nome e pointer. Resta l'importer: `processAttribute` scrive nel D layer le stringhe raw dell'XML, quindi i nomi dei literal. Questo commit lo allinea al canone: il nome che risolve diventa pointer alla scrittura; il nome che non risolve resta invariato (sarà il validatore a segnalarlo, come da decisione B8: l'import non rifiuta, la conformance riporta). Il precedente in produzione di questa politica è il mapper di `api/data.ts:355-370` (per elemento, invariato ciò che non risolve); il suo difetto R4 è fuori scope.

## COSA

In `processAttribute`, quando l'attributo è di tipo enum, risolvere ogni valore che coincide col nome di un literal dell'enum nel suo id, prima della scrittura, su entrambi i path (conformity slot e fallback `DValue.new`). Nessun cambiamento per gli attributi non-enum. Nessun cambiamento all'export.

## DOVE

Due soli file modificabili:

- `frontend/src/services/export/XMIService.ts`, metodo `processAttribute` (righe ~820-889). Il punto di intervento è dopo la costruzione di `values` (split whitespace per i multivalore, righe ~858-875) e **prima** del ramo conformity-slot / fallback, così entrambi i path ricevono l'array già mappato.
- `frontend/src/services/export/__tests__/ecore-io.test.ts`, seguendo le convenzioni locali del file.

## COME

1. **Rilevazione enum.** `metaFeature.type?.isEnum`, lo stesso accessor che usa CHECK 10 (`get_isEnum`, `LModelElement.tsx:1690`). Non usare confronti su `className` se `isEnum` è disponibile qui; se per qualche ragione non lo fosse, fermarsi e segnalare invece di improvvisare.

2. **Mappa nome-verso-id.** Da `metaFeature.type.literals` (proxy `LEnumLiteral` con `id` e `name`, finding A1/B7; metamodello già caricato, nessun lookup), costruire `Map<string, string>` nome-verso-id **filtrando** literal con `name` o `id` null/undefined. A parità di nome duplicato, vince la prima occorrenza (stessa scelta di `normalizeEnumValues`).

3. **Mapping per elemento.** `values = values.map(v => map.get(v) ?? v)`. Conseguenze volute, da preservare:
   - un nome che risolve diventa l'id del literal;
   - un nome che non risolve passa invariato (CHECK 10 lo flaggherà);
   - un valore che fosse già un id passa invariato per costruzione (la mappa è indicizzata per nome).

4. **Warning sull'irrisolto.** Per ogni valore che non risolve, aggiungere una entry a `ctx.warnings` e incrementare `ctx.summary.warnings`, nello stile dei warning esistenti del metodo (per esempio: `Enum attribute "aa" on "NewClass2": value "ZZZ" does not match any literal of enum "TYpes", kept as-is`). Questo NON è il segnale legacy escluso dalle decisioni del commit 1 (quello riguardava nomi validi): un nome irrisolto è un'anomalia del file importato e il warning di import è coerente col comportamento del metodo.

5. **Test** in `ecore-io.test.ts`:
   - import con nome di literal valido: il valore scritto nel D layer è l'**id** del literal, non il nome;
   - import con nome irrisolto: valore scritto invariato, warning presente nel risultato di import;
   - attributo enum multivalore con mix di nomi validi e uno irrisolto: risoluzione per elemento;
   - attributo non-enum: valori scritti invariati (nessuna regressione);
   - round-trip: export di un modello coi valori a pointer produce lo stesso XML di prima (l'export risolve già il pointer nel nome, finding C11: nessuna modifica attesa, il test lo fissa).

6. **Verifica.** `npm run typecheck` a **33** (baseline); suite intera verde (baseline 1598 passati più i nuovi, 9 file noti falliti all'import invariati); `npm run build` exit 0. Riportare i numeri nella nota finale.

## Commit

```
git add frontend/src/services/export/XMIService.ts frontend/src/services/export/__tests__/ecore-io.test.ts
git commit -m "fix: XMI importer resolves enum literal names to pointers"
```

Mai `git add .`. Nessun push.

## HARD STOP

1. Solo i due file in DOVE (più il log al passo 0). `ConformanceValidator.ts`, `useFormWidgets.ts`, `api/data.ts`, `importM1FromXML` e ogni altro path di import censito in B10 non si toccano: se dalla lettura emerge che valori enum vengono scritti anche fuori da `processAttribute`, segnalarlo nella nota finale senza allargare lo scope.
2. Se `isEnum` o `literals` non sono raggiungibili dal `metaFeature` in quel punto (contraddizione col finding B7), fermarsi e segnalare.
3. Rialzo di typecheck: regola scoped sopra.
4. **Dopo il commit: stop.** Verifica visiva di Alfonso (sotto). L'entry di log di questo commit si scrive solo dopo la conferma, in un commit separato.

## Verifica visiva (per Alfonso, non per Claude Code)

Su http://localhost:3000, hard refresh. Include il controllo del vero positivo rimandato dal commit 1:

1. Esportare in XMI il modello di prova (l'export scrive il nome: nel file compare `aa="AB"`), reimportarlo: il valore appare nella select, banner Conforms verde. Poi rinominare il literal nell'enum: il valore nella select deve **seguire il rename**. È la prova che l'import ha scritto il pointer, senza aprire i dev tools.
2. Modificare a mano il file XMI mettendo `aa="ZZZ"` e reimportare: warning di import, e rosso `invalid_enum_literal` col messaggio `... is not a literal (by name or id) of enum "TYpes"`. Questo chiude il controllo 2 del commit 1 e il cerchio di R-FRM-3.

## RIFERIMENTI

- `docs/discovery/discovery_2026-08-28_r_frm3_enum_canone.md`, findings B6-B10, C11
- `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md`, §10 e §12
- Commit 1: `fe1d5a0bd` (CHECK 10 tollerante)
- Precedente della politica di risoluzione: `api/data.ts:355-370` (fuori scope, difetto R4 tracciato a parte)
