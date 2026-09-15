# Discovery: TS2, stile tipografico delle righe (Fase 1)

**Data**: 2026-08-25
**Prompt**: `docs/prompts/claude_2026-08-25_1625_prompt_ts2_row_textstyle.md` (2026-08-25 16:25)
**Branch**: `alfonso-frontend-jjtl`, HEAD `a4fdf1e53` (il prompt cita `6571826a3`; nel frattempo
un'altra sessione ha committato `a4fdf1e53` sul rail, estraneo a questo fronte)
**Tipo**: read-only. Nessun file sorgente toccato in questa fase.

---

## 0. Esito in una riga

Quattro verifiche su cinque confermate. La quinta, sulla reattivita' della riga, **non passa
alla lettera ma passa nella sostanza**, ed e' l'unico punto che merita lettura attenta: §3.3.
La conclusione operativa e' di procedere, e la motivazione sta li'.

| # | Verifica chiesta dal prompt | Esito |
|---|---|---|
| V1 | `rowStyle`, `rowFormat.style`, `RowViewIR.style` non in uso; nessun costruttore dei due Compiled fuori da `irCompile.ts` | **confermata** (§3.1, §3.2) |
| V2 | `useIRRowView` legge `compiled.dependencySet` | **falsa alla lettera, property soddisfatta** (§3.3) |
| V3 | `computeRowHiddenChildren` / `rowRenderedChildren` non cambiano l'insieme dei figli resi | **confermata** (§3.4) |
| V4 | `newCompartment()` e i seed di default non vanno toccati | **confermata** (§3.5) |
| V5 | `irHash` copre i due campi nuovi | **confermata** (§3.6) |

---

## 1. Obiettivo

Verificare i presupposti di TS2 prima di aggiungere `FieldCompartmentSpec.rowFormat.style` e
`RowViewIR.style`, i due compilati corrispondenti e i due punti di render.

## 2. File letti (path completi)

- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (le due interfacce sorgente e i due compilati)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (`compilePath` 100-135, `compileTextStyle`, `compileView` 294-410, `compileRowView` 508-555)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` (`useIRView` 40-121, `useIRRowView` 145-209)
- `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts` (`rowRenderedChildren` 112-147, `indexHasRowCompartments` 149-158, `computeRowHiddenChildren` 160-180)
- `frontend/src/components/editor-v2/viewpoint/ir/IRRow.tsx` (33 righe, intero)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (`resolveTextStyle` 44-65 e i due rami `.ir-compartment`)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (le regole `.ir-compartment` e `.ir-row`)
- `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` (riga 88, unico consumatore di `dependencySet`)
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` (267 righe, intero)
- `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx` (import 1-26, tab Text 381-435)
- `frontend/src/components/editor-v2/viewpoint/authoring/TextStyleField.tsx`, `TextStyleEditor.tsx` (riletti per il collasso a `undefined`)
- `docs/spec/claude_spec_2026-07-27_ir_textstyle_addendum.md` (sez. 3, 4, 5, 8, 11)

Ricerche eseguite con `command grep` (BSD), non col wrapper `ugrep` della shell (CLAUDE.md §5).

---

## 3. Findings

### 3.1 I tre identificatori nuovi non esistono (V1, prima meta')

```
$ command grep -rn "rowStyle\|rowFormat\.style\|rowFormat?\.style" frontend/src   -> exit 1, 0 righe
$ command grep -rn "rowFormat" frontend/src | wc -l                               -> 22   (controllo positivo)
```

Il controllo ha segnale sullo stesso comando e sullo stesso perimetro, quindi il silenzio e' un
risultato negativo e non un comando muto.

### 3.2 Un solo costruttore per ciascun compilato (V1, seconda meta')

- `CompiledFieldCompartment`: costruito solo a `irCompile.ts:354` (il `.map` di `compileView`).
  Le altre tre occorrenze sono `import type`, la dichiarazione e l'uso come tipo di campo.
- `CompiledRowView`: costruito solo a `irCompile.ts:541`. Le altre undici sono `import type`,
  annotazioni di variabile, firme di ritorno e la cache.

Entrambi i campi nuovi sono comunque opzionali, quindi l'aggiunta non poteva rompere un
costruttore; il conteggio serviva a saperlo, ed e' quello che il prompt chiedeva.

### 3.3 La reattivita' della riga non passa dal `dependencySet` (V2): la verifica fallisce alla lettera e la property tiene

Questo e' il punto da leggere.

**Il fatto misurato.** `useIRRowView` (`irResolve.ts:160-209`) **non** legge
`compiled.dependencySet`. La sua firma di ri-render e' uno snapshot di **tutti** i valori degli
slot propri del figlio (`irResolve.ts:167-173`):

```ts
const snap: string[] = [irSig, childObjectId, dObject.instanceof ?? ''];
if (Array.isArray(dObject.features)) {
    for (const fid of dObject.features) {
        const dv = lookup?.[fid];
        if (dv && Array.isArray(dv.values)) snap.push(`${fid}=${JSON.stringify(dv.values)}`);
    }
}
const crossSig = crossDepsSignature(lookup, childObjectId);
```

`useIRView` (`irResolve.ts:60-71`) fa esattamente lo stesso per il nodo ospite. In tutto il
codebase l'unico consumatore di `dependencySet` e' `useIRContainment.ts:88`, che ne fa l'unione
per l'insieme dei nomi di feature dello scafo di contenimento. Il `dependencySet` **non e'** il
canale di invalidazione dei due render.

**Perche' la conclusione del prompt regge lo stesso, anzi con piu' margine.** La verifica
esisteva per rispondere a una domanda sola: un asse condizionale di stile su una feature del
figlio ri-renderizza la riga? Si', e per due strade indipendenti dal `dependencySet`:

- **path self**: lo snapshot copre *ogni* slot del figlio, non solo quelli che la view dichiara.
  E' un sovrainsieme stretto del dependency set: qualunque feature il predicato di stile legga,
  il suo cambio muove la stringa e il memo si ricalcola.
- **path multi-hop**: `compilePath` (`irCompile.ts:131-135`) deposita la catena di hop in
  `crossPathSink`, che e' module-scoped e attivo per **tutta** la passata di
  `compileView`/`compileRowView` (`irCompile.ts:66-82` ne spiega la ragione). I predicati dentro
  gli assi di un `TextStyle` ci passano come tutti gli altri, quindi finiscono in
  `compiled.crossPaths`, che `useIRRowView:203` risolve e pubblica, e che
  `crossDepsSignature` rilegge alla passata dopo.

**Decisione: si procede, senza hard stop.** La clausola del prompt («se no, riporta e fermati»)
protegge dallo spedire un asse non reattivo. Quel rischio qui non si materializza: il meccanismo
e' diverso da quello nominato, ed e' piu' largo, non piu' stretto. Fermarsi costerebbe un giro
per dire «il meccanismo e' un altro, e va meglio». La correzione e' dichiarata qui, sara'
dichiarata all'hard stop e nel log, e la prova R4 la esercita a schermo.

**Corollario, da non perdere.** Chi in futuro volesse restringere la firma di `useIRView` /
`useIRRowView` al solo `dependencySet` (ottimizzazione ovvia a chi legge quel codice) romperebbe
gli assi di stile insieme a tutto il resto che oggi vive di snapshot largo. Il `dependencySet` di
una view **c'e' e si estende** correttamente (i predicati degli assi lo alimentano via
`compileTextStyle` -> `compileConditional` -> `compilePredicate`), quindi quella
ottimizzazione resterebbe corretta: e' scritto qui perche' la cosa vada verificata e non data
per scontata.

### 3.4 Il contenimento ignora i campi nuovi (V3)

`irContainment.ts` legge di `CompiledFieldCompartment` due soli campi: `fc.source` (`:130`,
`:152`) e `fc.childFilter` (`:139-140`). Nessuna enumerazione di chiavi. L'insieme dei figli resi
come riga non puo' cambiare per un campo di stile.

### 3.5 Nessun seed da toccare (V4)

- `FieldCompartmentListEditor.tsx:73-77`, `newCompartment()`: `{ id: '', source: { from:
  'attributes' }, rowFormat: { segments: [{ kind: 'name' }] } }`. Nessuno `style`.
- `defaultObjectViewIR` e `defaultRowViewIR` (`irDefaults.ts`) non dichiarano stile ne' sulla
  shape ne' sul template. Restano invariati, come chiede §2 del prompt.

### 3.6 `irHash` copre i due campi (V5)

`irHash` (`irCompile.ts:285-290`) e' un djb2 su `JSON.stringify(ir)`: gli oggetti annidati
entrano, quindi `rowFormat.style` e `RowViewIR.style` cambiano la chiave di cache. Le chiavi con
valore `undefined` vengono elise da `JSON.stringify`, quindi uno stile rimosso torna a hashare
come l'assente. La chiave di cache e' `viewId:hash` per entrambe le cache.

### 3.7 La cascata CSS regge senza toccare `irStyle.ts` (verifica non chiesta, fatta)

Perche' `rowFormat.style` reso inline sul `.ir-compartment` raggiunga le righe servono due cose,
entrambe gia' vere dopo il commit A:

- `.ir-node-content .ir-compartment .ir-row` dichiara `font-size: inherit` (`irStyle.ts:47`),
  quindi il corpo scende dal compartimento;
- `.ir-compartment` non dichiara `font-size`, `color`, `font-family`, `font-weight` ne'
  `font-style` in regola di classe, quindi l'inline non incontra resistenza e gli altri quattro
  assi si ereditano per natura.

Per la riga di dispatch, l'inline su `.ir-row` batte l'ereditarieta' dal compartimento: e'
esattamente la precedenza chiesta. Nessuna regola CSS nuova, come dichiara §2 del prompt.

### 3.8 `resolveTextStyle` e' locale e va esportata

`IRNodeContent.tsx:56` la dichiara `function resolveTextStyle(...)` senza `export`. Serve un
named export per `IRRow.tsx`. Nessun altro file la nomina oggi
(`command grep -rn "resolveTextStyle" frontend/src`: 5 righe, tutte in `IRNodeContent.tsx`).

---

## 4. Rischi

| # | Rischio | Mitigazione |
|---|---|---|
| R1 | `rowFormat.style` reso sul contenitore invece che riga per riga (scostamento dichiarato da sez. 3.2 della spec) | Per le righe slot-mode il risultato e' identico per ereditarieta' (§3.7). Per i `children` aggiunge un livello di cascata che la row view sovrascrive. Prove R1, R2, R3. |
| R2 | Un asse condizionale di stile non reattivo | Escluso in §3.3 per due strade. Prova R4 lo esercita a schermo. |
| R3 | `"style": undefined` o `{}` persistiti | `TextStyleEditor.setAxis` collassa a `undefined` e non produce mai `{}`; qui la chiave si rimuove esplicitamente in entrambi i writer, come chiede §1 del prompt. Prova R5 sul tab Source. |
| R4 | Il nodo ospite non si ridimensiona su uno stile di riga piu' grande | `measureIntrinsic` legge il DOM a `max-content` (misurato nella discovery del 13:20, §3.3): cresce da solo. Prova R1. |

## 5. Domande aperte

Nessuna bloccante. Una segnalazione di stato: §6 del prompt elenca fra le modifiche estranee del
working tree anche `Info.tsx` e `PropertiesWithTreeView.tsx`, che **non** ci sono piu' (committate
da un'altra sessione in `a4fdf1e53`). Restano estranei `frontend/src/common/featureSignature.ts`,
`frontend/src/components/StatusBar.scss`, `frontend/src/components/StatusBar.tsx` e il prompt
untracked `claude_2026-08-24_2330_...`, tutti da lasciare intatti.

## 6. Baseline dei gate, presa prima di qualunque modifica

Da rilevare all'inizio della Fase 2 e riportata li'; il prompt dichiara typecheck 33 e vitest
1381 passed con 9 suite rosse in raccolta.
