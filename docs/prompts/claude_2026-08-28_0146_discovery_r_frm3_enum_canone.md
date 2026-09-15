# R-FRM-3, Fase 1: discovery read-only su canone enum (importer XMI + CHECK 10)

**Tipo**: discovery, nessuna modifica al codice sorgente.
**Branch**: `alfonso-frontend-jjtl`. Verificare con `git status` di partire puliti; se il working tree non è pulito, fermarsi e segnalare.
**Prima di iniziare**: leggere `CLAUDE.md` nella root e l'ultima pagina di `docs/claude-code-log.md`. Se qualcosa in questo prompt contraddice `CLAUDE.md`, segnalare il conflitto invece di procedere.

## Contesto

La spec `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md` (§10, ratifica R-FRM-3) stabilisce che il canone del valore di un attributo enum è il POINTER al literal (`DEnumLiteral`); il nome del literal è forma legacy accettata solo in lettura. Oggi il codebase ha tre attori disallineati:

1. L'importer XMI scrive il NOME del literal nel D layer (`values: ['normal']`).
2. La form normalizza nome verso id in lettura (`normalizeEnumValues` in `useFormWidgets.ts`) e scrive per id, come il pannello classico.
3. Il CHECK 10 del `ConformanceValidator` legge i valori raw (`__raw.values`) e confronta per NOME contro `attrType.literals`: un pointer id non matcha mai, quindi ogni enum toccato dagli editor viene flaggato `invalid_enum_literal`.

La Fase 2 (non in questo prompt) farà due commit separati: prima il validatore tollerante a entrambe le forme, poi l'importer che scrive l'id. Questa discovery serve a rendere quei due interventi chirurgici e senza sorprese.

## COSA

Produrre un discovery report che risponda alle domande della sezione COME, senza modificare alcun file di codice. Gli unici file scrivibili in questo task sono il discovery report e l'entry di log.

## DOVE (ancore verificate al momento della scrittura del prompt, da riconfermare sul working tree)

- `frontend/src/model/conformance/ConformanceValidator.ts` (519 righe)
  - Raccolta `scalarValues` da `__raw.values` con fallback: righe ~253-272.
  - CHECK 10: righe ~301-324. `literalNames` costruito da `attrType.literals` mappando `l?.name`; confronto `literalNames.has(vName)` dove `vName` è `v.name` se `v` è oggetto, altrimenti `v` stesso.
- `frontend/src/model/conformance/__tests__/ConformanceValidator.test.ts`: copertura attuale di CHECK 10.
- `frontend/src/services/export/XMIService.ts` (1290 righe)
  - `processAttribute`: righe ~820-889. Per gli attributi non-reference scrive `values` come stringhe raw prese dall'XML, senza alcuna risoluzione enum. Due path di scrittura: conformity slot esistente (`SetFieldAction ... 'values'`) e fallback `DValue.new`.
  - `findMetafeatureByName`: righe ~742 e seguenti.
  - Export lato enum: righe ~235-260, in particolare riga ~260 dove un target `DEnumLiteral` viene serializzato col suo `name`. Sembra già pointer-aware: da confermare.
- `frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts`
  - `normalizeEnumValues`: righe ~160-197, con il commento che documenta il disaccordo tra i due writer. È il riferimento di semantica per la tolleranza in lettura, non un file da modificare.

Se un'ancora non corrisponde (file spostato, righe slittate), riportare la posizione reale nel report e proseguire; non concludere che il codice manca.

## COME

Discovery in sola lettura, con `grep` globali e lettura dei file interi dove indicato. Domande a cui il report deve rispondere:

### A. Validatore (primo commit della Fase 2)

1. `attrType.literals` nel contesto di CHECK 10: che oggetti sono (LEnumLiteral proxy? raw?), ed espongono `id` oltre a `name`? Con quale forma esatta dell'id (pointer string)?
2. Quali forme può assumere un valore enum in `scalarValues` nei casi reali: nome (import XMI), pointer id string (editor), oggetto `LEnumLiteral` (menzionato nel commento a riga ~311). Per ciascuna forma, da quale writer proviene? Verificare in particolare cosa contiene `__raw.values` dopo una scrittura della form (`setSlotValue` con `isPtr: true`).
3. Esiste già nel codebase un helper per risolvere un pointer verso un `DEnumLiteral` (lookup per id) utilizzabile dal validatore senza importare mezzo joiner? Cercare come altri siti risolvono pointer di literal (per esempio l'export a riga ~260 di XMIService, il getter L `values`, `normalizeEnumValues`).
4. CHECK 10 nei test: quali fixture esistono, in che forma mettono i valori (nome o id), cosa andrà aggiunto per coprire la tolleranza a entrambe le forme.
5. Il messaggio di violazione interpola `vName`: con un pointer non risolto oggi stampa l'id grezzo. Annotare cosa serve per un messaggio sensato in entrambe le forme.

### B. Importer (secondo commit della Fase 2)

6. In `processAttribute`, al punto in cui si costruisce `values`, il tipo del `metaFeature` è interrogabile per capire che l'attributo è enum (equivalente di `isEnum` / `typeClass === 'DEnumerator'`)? Con quale accesso esatto?
7. Come si risolve, in quel punto, il nome del literal nel suo pointer: il metamodello è già caricato e `attrType.literals` è raggiungibile dal `metaFeature`? Documentare il path di navigazione esatto.
8. Cosa deve succedere se il nome non matcha nessun literal: oggi la stringa passa e CHECK 10 la flagga (comportamento corretto per la spec, che vuole il warning di conformance, non un rifiuto in import). Confermare che scrivere il nome non risolto invariato preserva questo comportamento.
9. Multi-valued: lo split whitespace a righe ~863-871 produce piu nomi; la risoluzione va applicata per elemento. Verificare che entrambi i path di scrittura (conformity slot e fallback `DValue.new`) trattino gli array allo stesso modo.
10. Altri import path che scrivono nomi di literal: `importFromXML` vs `importM1FromXML` (righe ~393 e ~526), `EcoreParser` in `api/data.ts`, eventuali path in `DSL/`. Mappare quali esistono e quali scrivono enum per nome. NON vanno fixati in Fase 2: solo censiti nel report con una riga ciascuno.

### C. Contorno e rischi

11. Consumer che leggono i valori enum raw e assumono nomi: export XMI (confermare che il path a righe ~256-260 gestisce già il pointer), `conformanceToProblems.ts`, diagnostica della form, altri siti trovati con `grep -rn "isEnum\|DEnumLiteral" frontend/src --include="*.ts" --include="*.tsx"`. Per ciascuno: continua a funzionare se il D layer contiene pointer? Continua a funzionare se contiene nomi legacy?
12. Modelli salvati esistenti contengono nomi (forma legacy): confermare che nessun VersionFixer o migrazione li tocca, cioè che la tolleranza in lettura deve restare a tempo indeterminato, come dice la spec.
13. Baseline: annotare nel report i numeri correnti di `npm run typecheck` (baseline attesa 33) e della test suite, per confronto in Fase 2. Nessun altro comando che modifichi file.

## Discovery report (OBBLIGATORIO)

- Path: `docs/discovery/`, creare la cartella se manca.
- Nome: `discovery_2026-08-28_r_frm3_enum_canone.md` (se già esistente, suffisso `_2`).
- Contenuto minimo: obiettivo, file letti con path completi, findings per le domande A1-A5, B6-B10, C11-C13 (numerarli così), dipendenze e rischi, domande aperte per Alfonso.
- L'hard stop di fine Fase 1 non è completo finché il report non è scritto: l'analisi in chat parte dal report, non dalla memoria della sessione.

## Log

Aggiungere l'entry a `docs/claude-code-log.md` secondo il formato standard (tipo `docs`, esito, file toccati: solo report e log). Il report non sostituisce l'entry: sono due artefatti distinti.

## Commit

Un solo commit, scope stretto:

```
git add docs/discovery/discovery_2026-08-28_r_frm3_enum_canone.md docs/claude-code-log.md
git commit -m "docs: discovery report for R-FRM-3 enum canonical form"
```

Mai `git add .`. Nessun push: lo decide Alfonso dopo l'analisi in chat.

## HARD STOP

1. Nessuna modifica a file `.ts`/`.tsx`/`.scss`: questo task è read-only sul codice. Se durante la lettura emerge un fix "ovvio", va nel report, non nel codice.
2. Se il working tree non è pulito all'avvio, fermarsi e segnalare prima di qualunque lettura.
3. Se `ConformanceValidator.ts` o `XMIService.ts` risultano sostanzialmente diversi dalle ancore di questo prompt (refactor intervenuto), fermarsi dopo il censimento e segnalare la divergenza nel report senza tentare di rispondere alle domande su codice che non corrisponde.
4. Fine del task al commit del report: la Fase 2 parte solo da un nuovo prompt, dopo il go-ahead in chat.

## RIFERIMENTI

- `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md`, §10 (canone enum) e §12 (stato dei delta).
- `docs/spec/spec_attive.md` per la catena delle spec.
- `docs/prompts/claude_2026-08-28_0045_prompt_frm1_gruppi_non_reclamati.md` come esempio di formato dei prompt precedenti.
- Nota di architettura: il validatore non è critical zone (`useJjomSync.ts` e `portDistribution.ts` restano intoccabili), ma è codice condiviso; da qui il two-phase pieno.
