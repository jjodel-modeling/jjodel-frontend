# Prompt Claude Code: singleton come valore del linguaggio, discovery del commit B (Fase 1)

**Data**: 2026-08-26 17:20
**Branch**: `alfonso-frontend-jjtl`, HEAD `957516083` (commit A landato: `c824dc237` codice, `957516083` log)
**Tipo**: feat (questa è la Fase 1, read-only: nessun file di prodotto)
**Effort**: xhigh
**Critical-zone**: **sì**. `viewpoint/ir/` e `canvasToJjom.ts` sono in §3.1 di `CLAUDE.md`. La Fase 2 porterà un Layer Impact Report; questa fase lo prepara.
**Decisioni**: `docs/decisions.md`, R-SGL-4 (la ratifica di questo commit), R-SGL-6 (perché `concreteSubclasses` non è filtrato), R-SGL-9.
**Precedenti**: `docs/discovery/discovery_2026-08-26_singleton_instantiability.md` (report di A, §2.2 sulla conformità degli endpoint); entry di log del commit A.

Leggi `CLAUDE.md` e `docs/claude-code-log.md` prima di iniziare. Se qualcosa qui contraddice `CLAUDE.md`, fermati e segnala.

---

## 0. Contesto

Dopo A, le istanze singleton esistono per costruzione e la vista può nasconderle (View > Show singletons). Quando sono nascoste, un oggetto che ha una reference verso una classe singleton non ha modo di assegnarla: non c'è un nodo a cui tirare un arco. R-SGL-4 dice: una riga reference il cui tipo dichiarato è singleton-conforme (classe singleton, o classe i cui sottotipi concreti sono tutti singleton) diventa editabile quando i singleton sono nascosti; il doppio click apre una select con le istanze singleton conformi al tipo, sottotipi inclusi; la scelta scrive via write path canonico; select singola anche per le reference a molti, la scelta aggiunge. Con i singleton visibili resta l'arco.

È il pattern «singleton come valore enumerato»: `Color` astratta con `Red`, `Green`, `Blue` singleton e final; la reference `color: Color` si assegna da una lista.

Cosa è già noto (verifica, non ripetere):

- Nel ramo IR le righe reference **non sono editabili**: `IRNodeContent.tsx:151`, `editableValue: kind === 'A'`. Il doppio click sul segmento `value` (`:433`) apre un `<input>` di testo e committa con `syncUpdateFeatureValue(vertexId, name, editValue)` (`:186`).
- `syncUpdateFeatureValue` (`canvasToJjom.ts:1472-1497`) fa `featureProxy.value = newValue` dentro una `TRANSACTION`, con `newValue: string | number | boolean | null`. Non è mai stata usata per una reference.
- `LValue.set_value` (`LModelElement.tsx:4609`), `set_values`, e l'append `(...val) => set_values([...values, ...val.map(v => v?.id || v)])` (`:6875`) sono i setter candidati; l'ultimo accetta proxy o id.
- La conformità di una classe al tipo di una reference è `conformsToRefTarget(ref, classId, classById)` in `irInteraction.ts:107-111`, su `MetaclassInfo.concreteSubclasses`. Dopo A `MetaclassInfo` ha `isSingleton?: boolean`. `getMetaclassInfo(modelId)` (`useEditorMode.ts:234`) è la versione non-hook, ricalcolata a ogni chiamata.
- Lo stato «singleton nascosti» vive in tre posti: `localStorage['jjodel.showSingletons.<modelid>']` (Navbar, `:639-664`), il Set `suppressedSingletonIds` in `syncState.ts:161-179` (id dei vertici), e l'evento `JjodelEvents.TOGGLE_SINGLETONS` che EditorV2 ascolta (`:820`). Nessuno dei tre è reattivo per un componente figlio.
- `DClass.instances` è piatto sul progetto (report di A, §7b): le istanze singleton di **altri M1** esistono e conformano, ma non sono valori legittimi per questo oggetto.
- Precedente di select inline: `InlineEnumSelect` (`components/InlineEnumSelect.tsx`), props `{ value, enumName, literals: {name}[], isStale?, onChange, onClose }`, popover, opzione `(none)` in testa, usato dal ramo nativo di `ObjectNode` per gli attributi enum (`:535-560`).

---

## 1. COSA

Un discovery report che risponda alle sette domande della sezione 3, così che la Fase 2 sia una lista chiusa di edit con il Layer Impact Report già abbozzato. Nessuna modifica al codice.

---

## 2. DOVE

Lettura attesa:

- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (righe, editing, `compartmentSig`, `readCtx`)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (`FieldCompartmentSpec`, i segmenti, `editable`)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` (`useIRView`: la firma include i valori reference?)
- `frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` (`conformsToRefTarget`)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (`syncUpdateFeatureValue`, e i punti in cui una reference M1 viene scritta oggi: `syncCreateCompositionLink` `:1505`, la scrittura degli archi di reference `:1552-1563`)
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (Step 4, archi di reference; comportamento con target soppresso) e `useM1ReferenceEdges.ts`
- `frontend/src/components/editor-v2/sync/syncState.ts`
- `frontend/src/components/editor-v2/EditorV2.tsx` (`handleToggleSingletons` `:676-822`; eventuali stati mirror del toggle; context forniti ai nodi)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (ramo nativo: le reference compaiono come righe? con quale valore?)
- `frontend/src/components/editor-v2/components/InlineEnumSelect.tsx` e il suo SCSS
- `frontend/src/model/logicWrapper/LModelElement.tsx` (`LValue.set_value` `:4609`, `set_values`, `:6840-6900`)

**Report** in `docs/discovery/discovery_2026-08-26_singleton_reference_select.md`: obiettivo, file letti con path completi, findings per domanda, dipendenze e rischi, bozza del Layer Impact Report, domande aperte per Alfonso.

---

## 3. COME: le sette domande

**D1. Dove si rende una riga reference, e in quanti rami.** Nel ramo IR è il `case 'value'` di `IRNodeContent.tsx:411`. Nel ramo nativo di `ObjectNode` le reference hanno una riga con valore? Se sì, R-SGL-4 va applicata anche lì (stesso gesto, stessa select) o il ramo nativo resta fuori: descrivi cosa mostra oggi e stima il costo. Il ramo dispatch (`IRRow`, compartimenti `children`) è fuori per costruzione: conferma.

**D2. Il predicato «singleton-conforme» a livello di riga.** Data la `DReference` della riga (tipo dichiarato `T`): candidati = istanze `o` con `o.instanceof` conforme a `T` (`conformsToRefTarget`, sottotipi inclusi) **e** `isSingleton` sulla metaclasse **e** `o.model` uguale al modello dell'oggetto della riga. La riga è editabile se il tipo è singleton-conforme secondo R-SGL-4 (T singleton, oppure T con tutti i sottotipi concreti singleton) e i singleton sono nascosti. Dire: da dove `IRNodeContent` ottiene la `DReference` della riga (oggi `compartmentSig` porta `fid`, nome, nome del tipo e valore, non l'id del tipo), da dove ottiene `MetaclassInfo` (`getMetaclassInfo` non-hook a ogni render, o un context già presente), e il costo. Proponi la forma più economica che non aggiunga campi a `compartmentSig` se evitabile; se serve aggiungerne uno, dillo e spiega l'effetto sulla firma.

**D3. Lo stato «nascosti» in modo reattivo.** Il componente deve sapere se i singleton del suo modello sono nascosti, e reagire al toggle senza remount. Tre candidati: un context nuovo di EditorV2 alimentato da `handleToggleSingletons`; un `useState` locale con listener su `TOGGLE_SINGLETONS` più lettura iniziale da `localStorage`; la lettura di `suppressedSingletonIds` (non reattiva). Valuta e proponi uno, con costo. Vincolo: nessun accesso diretto a `localStorage` dentro `viewpoint/ir/` se esiste già un canale.

**D4. Il write path per una reference.** Cosa accetta `featureProxy.value = x` quando la feature è una reference (`set_value` a `:4609`): un id, un proxy, entrambi? Per `0..1` è sostituzione; per `0..N` è append (`:6875`). `syncUpdateFeatureValue` con la sua firma attuale basta, o serve un secondo entry point (proposta: `syncSetReferenceValue(vertexId, featureName, targetObjectId, mode: 'replace' | 'append')`)? Un solo passo di undo in entrambi i casi: conferma dalla `TRANSACTION`.

**D5. L'arco, quando i singleton sono nascosti e quando tornano visibili.** Scrivere il valore di una reference verso un oggetto il cui vertice è **soppresso**: cosa fa `useJjomSync` Step 4 / `useM1ReferenceEdges` con un target senza nodo RF (warning, arco pendente, nulla)? E quando il toggle li mostra di nuovo, l'arco compare da solo? Controlla anche il caso inverso, già possibile oggi: un valore di reference verso un singleton, assegnato con i singleton visibili, cosa succede al suo arco quando li si nasconde. Questa è la domanda che decide il Layer Impact Report.

**D6. Il componente.** `InlineEnumSelect` si riusa così com'è (letterali = nomi delle istanze candidate, mappa nome→id nel chiamante) o serve una variante? Punti da verificare: il popover funziona dentro `.ir-node-content` (overflow, `nodrag`/`nowheel`, z-index, posizionamento rispetto alla riga); l'opzione `(none)` per `0..1` significa svuotare la reference, per `0..N` non ha senso; per `0..N` le opzioni escludono i valori già presenti. Se serve un componente nuovo, nome verificato con `grep -r` e stile dallo stesso SCSS.

**D7. Visualizzazione del valore.** `row.value` mostra già i nomi degli oggetti puntati (`IRNodeContent.tsx:137`). Con i singleton nascosti e la riga editabile, serve un affordance (classe `ir-row__value--editable`, già esistente, o un chevron come nell'enum nativo)? Proposta minima, senza SCSS nuovo se possibile.

**HARD STOP** a report scritto. L'analisi si fa in chat sul report.

---

## 4. Vincoli

- Read-only: nessun file di prodotto toccato, nessun `git add`.
- Il report è l'unico artefatto; niente entry di log finché la Fase 2 non è chiusa.
- Non rileggere il perimetro di A oltre quanto serve a D2 e D5.
- Il working tree ha modifiche non committate di altri fronti (`StatusBar.*`, `featureSignature.ts`, e altri): non toccarle.
