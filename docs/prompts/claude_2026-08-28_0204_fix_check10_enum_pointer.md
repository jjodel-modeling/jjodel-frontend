# R-FRM-3, Fase 2, commit 1: CHECK 10 tollerante a nome e pointer

**Tipo**: fix chirurgico al validatore di conformance. Primo dei due commit di R-FRM-3; l'importer XMI (secondo commit) NON è in questo prompt.
**Branch**: `alfonso-frontend-jjtl`.
**Prima di iniziare**: leggere `CLAUDE.md`, l'ultima pagina di `docs/claude-code-log.md`, e il discovery report `docs/discovery/discovery_2026-08-28_r_frm3_enum_canone.md`, che è la base fattuale di questo prompt. Se qualcosa qui contraddice `CLAUDE.md`, segnalare il conflitto invece di procedere.

## Gate di ingresso (regola scoped, ratificata in chat)

`git status --porcelain -- frontend/src/model/conformance` deve uscire **vuoto**. Lo stato del resto del working tree non blocca, ma va dichiarato nella nota finale. Se il perimetro non è pulito, fermarsi e segnalare.

## Contesto

La spec (`docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md`, §10, ratifica R-FRM-3) stabilisce che il canone del valore di un attributo enum è il pointer al `DEnumLiteral`; il nome del literal è forma legacy accettata in lettura **senza scadenza** (nessun VersionFixer tocca `DValue.values`, riga commentata a `:277`). Oggi CHECK 10 confronta solo per nome, quindi flagga come `invalid_enum_literal` ogni valore scritto dagli editor, che scrivono il pointer.

Decisioni prese in chat, vincolanti per questo commit:

1. Un pointer a un literal di **un altro** enum resta flaggato: è un errore di tipo, non una forma alternativa. Non serve codice dedicato: l'insieme degli id si costruisce dai soli `attrType.literals`.
2. **Nessun** segnale "questo modello usa la forma legacy". Il nome è forma accettata, non deprecata.
3. Il messaggio di violazione si sistema qui (vedi COME, punto 3), senza lookup globali.
4. Gli **ordinali numerici** (residuo del difetto R4 in `api/data.ts`, fuori scope) NON vanno tollerati: un ordinale che non matcha resta una violazione. Nessun ramo speciale per i numeri.

## COSA

Rendere CHECK 10 tollerante a entrambe le forme canoniche di lettura (nome legacy e pointer id), preservando ogni altro comportamento, e coprire la modifica con test che passano dal percorso di lettura di produzione.

## DOVE

Due soli file modificabili:

- `frontend/src/model/conformance/ConformanceValidator.ts`
  - CHECK 10: righe ~301-324. `literalNames` costruito da `attrType.literals` mappando `l?.name`; confronto `literalNames.has(vName)`.
  - I valori arrivano da `scalarValues`, raccolti da `__raw.values` con fallback su `feat.values` / `feat.value` (righe ~253-272). Non toccare la raccolta.
  - Il modulo è una funzione pura con soli `import type`: deve restare così. Nessun import runtime, nessun helper esterno.
- `frontend/src/model/conformance/__tests__/ConformanceValidator.test.ts`

Se il blocco CHECK 10 non corrisponde alle ancore (refactor intervenuto), fermarsi e segnalare.

## COME

1. **Doppio insieme.** Accanto a `literalNames`, costruire `literalIds` dagli stessi `attrType.literals`, mappando `l?.id` e **filtrando null e undefined** (le fixture legacy dei test hanno literal senza `id`: un set che raccoglie `undefined` è una bomba a orologeria, discovery A4/C). I proxy `LEnumLiteral` espongono `id` e `name` (discovery A1): nessuna risoluzione da fare.

2. **Confronto tollerante.** Un valore `v` è valido se:
   - `v` è un oggetto e (`v.name` è in `literalNames` oppure `v.id` è in `literalIds`);
   - altrimenti (`literalNames.has(v)` oppure `literalIds.has(v)`).

   Tutto il resto è violazione, inclusi pointer estranei, nomi di literal rimossi, ordinali numerici.

3. **Messaggio.** Per un valore violante, `vName` resta come oggi (`v.name ?? v` per gli oggetti, con `v.id` come ripiego se il nome manca). La formulazione diventa:

   `Object "...": attribute "..." has value "${vName}" which is not a literal (by name or id) of enum "${attrType.name}"`

   Niente sniffing del formato pointer e niente risoluzione del pointer violante: nominarlo richiederebbe l'idlookup globale che questo modulo non deve importare. Se `conformanceToProblems.ts` o i suoi test matchano la stringa esatta del vecchio messaggio, segnalarlo nella nota finale invece di modificarli.

4. **Test.** In `ConformanceValidator.test.ts` aggiungere casi per:
   - valore pointer id di un literal dell'enum: nessuna violazione (fixture con `literals: [{id: 'l1', name: 'RED'}, ...]`);
   - valore nome legacy: nessuna violazione (già coperto, verificare che resti);
   - pointer sconosciuto o di un literal estraneo: violazione;
   - valore oggetto con `name` valido: nessuna violazione (comportamento preesistente preservato);
   - ordinale numerico non matchante: violazione;
   - fixture legacy con literal **senza** `id` e valore violante: la violazione c'è e il messaggio non contiene `undefined`.
   - **Almeno uno dei casi sopra deve leggere da `__raw.values`** (fixture con `feat.__raw.values` popolato): oggi l'intera suite esercita solo il fallback `feat.values` mentre il prodotto legge il raw (discovery A2/C). Mantenere comunque anche casi sul fallback.

5. **Verifica.** `npm run typecheck` deve restare a **33** errori (baseline registrata nel discovery report); l'intera suite deve passare (baseline 1589 verdi più i nuovi, con i 9 file noti falliti all'import invariati). Riportare i numeri nella nota finale.

## Commit

Un commit, scope stretto:

```
git add frontend/src/model/conformance/ConformanceValidator.ts frontend/src/model/conformance/__tests__/ConformanceValidator.test.ts
git commit -m "fix: CHECK 10 accepts enum literal pointers alongside legacy names"
```

Mai `git add .`. Nessun push.

## HARD STOP

1. Solo i due file in DOVE. `conformanceToProblems.ts`, `useFormWidgets.ts`, `XMIService.ts`, `api/data.ts` non si toccano, qualunque cosa emerga: le scoperte vanno nella nota finale.
2. Nessun nuovo import runtime in `ConformanceValidator.ts`: se la soluzione sembra richiederne uno, fermarsi e segnalare.
3. Se typecheck sale sopra 33 o un test preesistente si rompe, fermarsi e segnalare senza tentare fix fuori perimetro.
4. **Dopo il commit: stop.** La verifica visiva la fa Alfonso su http://localhost:3000 (modello con enum toccato dagli editor: il rosso di CHECK 10 deve sparire; un enum davvero rotto deve restare rosso). L'entry in `docs/claude-code-log.md` si scrive e si committa **solo dopo la conferma visiva**, come da convenzione, in un commit separato.

## RIFERIMENTI

- `docs/discovery/discovery_2026-08-28_r_frm3_enum_canone.md` (findings A1-A5, C11-C13)
- `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md`, §10 e §12
- `normalizeEnumValues` in `frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts` (righe ~160-197): semantica di riferimento della tolleranza in lettura; NON va modificato né importato.
- Fuori scope, già tracciati: importer XMI (commit 2, prompt successivo), difetto R4 in `api/data.ts` (task a sé, prima misura runtime).
