# Prompt Claude Code: singleton come valore del linguaggio, commit B (Fase 2)

**Data**: 2026-08-26 18:20
**Branch**: `alfonso-frontend-jjtl`, HEAD `1ef180323`. Working tree: `StatusBar.*` e `featureSignature.ts` modificati da altri fronti, più prompt untracked del 24 e 25 e il report B untracked: non toccarli, non stagiarli (il report B lo committa Alfonso).
**Tipo**: feat
**Effort**: xhigh
**Critical-zone**: **sì**. `viewpoint/ir/` (`IRNodeContent.tsx`, `irStyle.ts`) e `canvasToJjom.ts` sono in §3.1. Layer Impact Report obbligatorio (3.2 qui sotto), con hard stop per ACK prima di toccare `canvasToJjom.ts`. **`useJjomSync.ts` non si tocca**: perimetro (α), R-SGL-10(6).
**Decisioni**: `docs/decisions.md`, R-SGL-4 (la ratifica), R-SGL-6, R-SGL-10 (le nove risposte al report, vincolanti).
**Discovery**: `docs/discovery/discovery_2026-08-26_singleton_reference_select.md`. Ogni riga citata sotto viene da lì; se una riga è slittata, cerca il simbolo.

Leggi `CLAUDE.md` e `docs/claude-code-log.md` prima di iniziare. Se qualcosa qui contraddice `CLAUDE.md`, fermati e segnala.

---

## 0. Contesto

Con i singleton nascosti (View > Show singletons off), una riga reference del ramo IR il cui tipo è singleton-conforme diventa editabile: doppio click apre una select con le istanze singleton conformi al tipo, dello stesso M1; la scelta scrive `DValue.values` via write path canonico. `0..1` sostituisce (con `(none)` per svuotare); `0..N` aggiunge, escludendo i valori già presenti, senza `(none)`. Con i singleton visibili la riga resta com'è (si tira l'arco).

Le nove decisioni sono in R-SGL-10: solo ramo IR; conformità con `concreteSubclasses.length > 0`; entry point nuovo `syncSetReferenceValue`; mirror `showSingletons` + Set dei tipi conformi + `modelId` in `EditorContext`; due passi di undo accettati (valore, poi arco); perimetro (α); portal su `body`; componente nuovo `InlineObjectSelect`; `cursor: pointer` in `irStyle.ts`.

---

## 1. COSA, file per file

Sette file di prodotto (uno nuovo): sopra la soglia della regola 19, quindi **prima di editare** elenca in chat i sette file con la modifica prevista e procedi.

### 1.1 `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (dopo il LIR di 3.2)
Aggiungi, accanto a `syncUpdateFeatureValue` (`:1472`), senza toccarla:

```ts
export function syncSetReferenceValue(
    objectVertexId: string,
    featureName: string,
    targetObjectId: string | null,   // null = clear, solo in replace
    mode: 'replace' | 'append',
): void
```

Corpo sulla forma canonica del report §5.3: risolvi `lVertex.model`, `TRANSACTION('EditorV2 set ref <name>', ...)`, `slot = lObject['$' + featureName]`, `meaningful = (slot.__raw?.values ?? []).filter(v => v != null && v !== '')`; `append` → `slot.values = [...meaningful, targetObjectId]`; `replace` → `slot.values = targetObjectId ? [targetObjectId] : []`. Stessi `console.warn` di guardia di `syncUpdateFeatureValue`. In `append`, se `targetObjectId` è già in `meaningful`, non scrivere (no-op dichiarato). Nome verificato con `grep -r` prima di crearlo.

### 1.2 `frontend/src/components/editor-v2/EditorV2.tsx`
- Blocco «View toggles — mirror state» (`:635-666`): `showSingletons` seminato da `localStorage['jjodel.showSingletons.<modelid>']` in `try/catch`; listener su `JjodelEvents.TOGGLE_SINGLETONS` che filtra `detail.modelId !== modelid` (come `handleToggleSingletons` a `:678`) e fa `setShowSingletons(!!detail.show)`; `useEffect` su `modelid` che rissemina dallo stesso `localStorage` (R-SGL-10(4), Q3). Non fondere con `handleToggleSingletons`: quello muove nodi, questo è solo stato.
- `singletonConformTypeIds`: `useMemo` su `modeInfo.allClasses`, codice del report §3.4 (classe `isSingleton`, oppure `concreteSubclasses.length > 0 && every(isSingleton)`).
- Passa nel valore di `EditorContext` (`:3979`): `showSingletons`, `singletonConformTypeIds`, `modelId: modelid`.

### 1.3 `frontend/src/components/editor-v2/contexts/EditorContext.tsx`
Quattro campi **opzionali** su `EditorContextValue` (regola 11): `showSingletons?: boolean`, `singletonConformTypeIds?: ReadonlySet<string>` (i tipi conformi: la riga è editabile se il suo `typeId` è qui), `singletonClassIdsByType?: ReadonlyMap<string, ReadonlySet<string>>` (per ogni tipo conforme, le classi singleton che lo soddisfano: il tipo stesso se singleton, altrimenti i suoi `concreteSubclasses`; serve a filtrare i candidati senza importare `getMetaclassInfo`), `modelId?: string`. Entrambe le strutture si derivano nello stesso `useMemo` di 1.2. Nessun altro cambio.

### 1.4 `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`
- `compartmentSig` (`:139`): un token in più per feature, `feat.type ?? ''`, tra il nome del tipo e il display, come nel report §3.2. `CompartmentRowData` guadagna `typeId: string`. Dichiara nel log l'effetto sulla firma (diventa sensibile al retarget verso un tipo omonimo).
- `rows` (`:146-155`): la riga porta `typeId`; `editableValue` resta `kind === 'A'`, la select non passa da lì.
- Nel `case 'value'` (`:413`), con `ctx = useEditorContextSafe()` (`EditorContext.tsx:29-31`, `null` fuori dal provider: l'anteprima dell'authoring non deve rompersi), calcola `selectable = riga R && ctx?.showSingletons === false && ctx.singletonConformTypeIds?.has(row.typeId) && (seg as any).editable !== false`.
- Se `selectable`: lo span ha `ir-row__value--editable ir-row__value--select` e `onDoubleClick` apre la select per quella riga (stato `selectingRow: { key, name, typeId } | null`, nome verificato con `grep`). **All'apertura**, non per render, calcola:
  - `ref = lookup[lookup[row.key].instanceof]` (il `DValue` della riga punta alla `DReference`): `upperBound` da lì; `mode = upperBound === 1 ? 'replace' : 'append'`; `allowNone = mode === 'replace'`;
  - `classIds = ctx.singletonClassIdsByType.get(row.typeId)`;
  - candidati = `DObject` in `idlookup` (guardia `typeof e === 'object'`) con `classIds.has(o.instanceof)` e `o.model === ctx.modelId` (se il campo raw del modello sul `DObject` ha un altro nome, dillo nel log). In `append` escludi gli id già presenti in `lookup[row.key].values`;
  - `value` = l'id corrente per `replace`, `null` per `append`.
- `onChange(id)` → `syncSetReferenceValue(vertexId, row.name, id, mode)`, chiudi. `onClose` → chiudi. Escape chiude.
- La riga attributo (`editableValue`) non cambia in nulla.

### 1.5 `frontend/src/components/editor-v2/components/InlineObjectSelect.tsx` (nuovo)
Clone di `InlineEnumSelect` con le props del report §7.3: `{ value: string | null; typeName: string; options: {id, name}[]; allowNone: boolean; onChange(objectId | null); onClose }`. Stesse classi `.inline-type-select*` (nessuno SCSS nuovo), stessa tastiera/click-fuori/scroll. Differenze: `(none)` solo se `allowNone`; nessuna opzione stale. **Portal**: renderizza il popover con `createPortal` su `document.body`, posizione calcolata da `getBoundingClientRect` dell'ancora al mount (precedenti in-repo: `viewpoint/authoring/TextStyleField.tsx`, `problems/NodeProblemOverlay.tsx`; copia il più vicino). Aggiungi `nodrag nowheel` sul contenitore del popover (report §7.2b). Nome verificato: `InlineObjectSelect` è libero (report §7.3).

### 1.6 `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`
Una riga accanto a `:174-175`: `.ir-node-content .ir-row__value--select { cursor: pointer; }`. Nessun'altra regola.

### 1.7 `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`
Solo se `CompartmentRowData` vive lì e non in `IRNodeContent.tsx`: il campo `typeId`. Altrimenti questo file non si tocca e i file sono sei.

**Non toccare**: `useJjomSync.ts`, `useM1ReferenceEdges.ts`, `syncState.ts`, `syncUpdateFeatureValue`, `InlineEnumSelect.tsx`, `ObjectNode.tsx`, `IRRow.tsx`, `irResolve.ts`, `irValidate.ts`, `useEditorMode.ts`, `Navbar.tsx`.

---

## 2. DOVE: riepilogo

`canvasToJjom.ts`, `EditorV2.tsx`, `EditorContext.tsx`, `IRNodeContent.tsx`, `InlineObjectSelect.tsx` (nuovo), `irStyle.ts`, eventualmente `irTypes.ts`. Più `docs/claude-code-log.md` alla chiusura. `git add` per path esplicito.

---

## 3. COME

### 3.1 Ordine
1. Lettura e lista della regola 19 in chat.
2. `EditorContext.tsx`, `EditorV2.tsx`, `InlineObjectSelect.tsx`, `irStyle.ts` (fuori dal write path).
3. **Layer Impact Report** (3.2) in chat, **HARD STOP** per ACK.
4. `canvasToJjom.ts`, poi `IRNodeContent.tsx`.
5. Gate, commit unico, **HARD STOP** per la verifica visiva (4).

### 3.2 Layer Impact Report
Parti dalla bozza del report §9 e completala con le scelte fatte: la `SetFieldAction` su `DValue.values` (replace/append/clear), nessun `.new()` avvolto, il secondo dispatch dell'arco da `useM1ReferenceEdges` dichiarato (due passi di undo, R-SGL-10(5)), il perimetro (α) dichiarato con i tre effetti attesi in console (§6.2-6.4 del report), l'effetto sulla firma di `compartmentSig`, e la riga su `set_values → setValueAtPosition` per i side-effect di `pointedBy`/`father`.

### 3.3 Gate
`npx tsc --noEmit` a baseline 33 (Δ0), `npm run build`, `npx vitest run` (attenzione a `ir.test.ts` e a ogni suite che tocchi `compartmentSig` o `IRNodeContent`). Nessuna suite copre la select: la prova è la verifica visiva.

### 3.4 Commit
Uno: `feat(ir): reference rows typed on singleton classes open a select among conforming singleton instances when singletons are hidden`.

---

## 4. Verifica visiva (Alfonso, `localhost:3000`, hard refresh, console aperta)

Fixture: M2 con `Color` astratta e `Red`, `Green`, `Blue` singleton (final); `Shape` con `color: Color 0..1` e `tags: Color 0..*`; `Config` singleton; `Shape` con `cfg: Config 0..1`. Viewpoint con una view IR per `Shape` che ha un compartimento `references` con segmenti `name` e `value`. Due M1 sullo stesso M2, M1a e M1b, con uno `Shape` ciascuno. Singleton nascosti in M1a.

1. **Riga editabile.** In M1a, la riga `color` mostra il cursore a mano e l'hover; doppio click apre la select con `(none)`, `Red`, `Green`, `Blue`; nessun'altra opzione (in particolare nessun singleton di M1b).
2. **Scrittura, misurata.** Scegli `Red`: la riga mostra `Red`; in console `windoww.LPointerTargetable.fromPointer('<id dello Shape>').$color.values` contiene l'id dell'istanza `Red` di M1a. Un ⌘Z toglie il valore (il secondo ⌘Z, se c'è, è l'arco: dichiaralo, non è un fallimento).
3. **Replace.** Doppio click, scegli `Green`: la riga mostra `Green`, `values` ha un solo id. `(none)`: riga vuota, `values` vuoto.
4. **Append.** Riga `tags`: nessun `(none)`; scegli `Red`, poi riapri: `Red` non c'è più tra le opzioni, scegli `Blue`; la riga mostra `Red, Blue`, `values` ha due id. Riapri con tutti assegnati: la select è vuota o non si apre (dillo quale).
5. **Config.** Riga `cfg`: select con `(none)` e `Config`. Assegna.
6. **Singleton visibili.** View > Show singletons on: le righe `color`, `tags`, `cfg` non sono più editabili (niente cursore, doppio click inerte); gli archi verso `Green`, `Red`, `Blue`, `Config` compaiono o no: **riporta cosa vedi e cosa dice la console** (è la misura di §6.4 per il fronte β).
7. **Nascondi di nuovo.** Off: nodi via; console: riporta i warning di React Flow sugli archi, se ci sono (misura di §6.3).
8. **Reattività.** Con M1a aperto, toggle on/off due volte: la riga passa da non editabile a editabile senza reload.
9. **Non conformi.** Una reference verso una classe non singleton (aggiungi `owner: Person`) non è editabile, con singleton nascosti o visibili. Riga attributo: doppio click apre ancora l'input di testo.
10. **Portal e forme.** La select si apre intera, non tagliata, su un nodo `rect` e su un nodo `diamond`; il canvas non panna né zooma mentre la select è aperta e si scrolla.
11. Nessuna riga rossa in console nei passi 1-5 e 8-10; i warning di 6-7 vanno riportati testualmente.

**HARD STOP** dopo il commit, in attesa dell'esito.

---

## 5. Chiusura (dopo il GO)

Entry in `docs/claude-code-log.md` col formato standard: il LIR in sintesi, i gate, i warning misurati ai passi 6-7 (sono il numero di partenza del fronte β), l'effetto sulla firma di `compartmentSig`, e in Note il debito «unificare `InlineObjectSelect` e `InlineEnumSelect`». Commit `docs:` separato.

---

## 6. Vincoli

- Nessun refactoring oltre le righe elencate; nessun rename.
- `useJjomSync.ts` fuori perimetro anche se «basterebbe una riga»: è il fronte β, con il suo LIR. Se una modifica lì ti sembra indispensabile per far funzionare B, hard stop e motiva.
- Nessun import runtime da `useEditorMode` dentro `viewpoint/ir/` (oggi c'è solo `import type`); nessun `localStorage` dentro `viewpoint/ir/`.
- Se il portal richiede di toccare uno SCSS oltre le classi `.inline-type-select*` già esistenti, hard stop e motiva.
