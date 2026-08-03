# Discovery R12 — undo e dirty flag sugli edit inline dei nodi IR

**Data**: 2026-08-03. Sessione **read-only** su `/Users/alfonso/jjodel`, branch `alfonso-frontend-jjtl`, HEAD `b32c2dbd9`.
**Fase**: 1 di 2. Hard stop dopo questo report: la scelta del canale (D1) e della strategia (D2) e' di Alfonso.
**Working tree**: contiene il lavoro R8 non ancora committato (5 file, in attesa di verifica visiva). Non toccato, non messo in staging: unica scrittura di questa sessione sono questo report e l'entry di log.

---

## 0. Obiettivo

Rispondere a due incognite che bloccano la scrittura del fix R12:

- **D1** — come raggiungere `takeSnapshot` dal componente `IRNodeContent`, che vive dentro un node type di React Flow.
- **D2** — come marcare il progetto dirty dopo un edit inline, e se marcare basti.

Non implementare nulla.

---

## 1. File letti

Tutti i path sono relativi a `frontend/src/`.

| File | Perche' |
|---|---|
| `components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (`:1-150`) | i due handler oggetto del fix |
| `components/editor-v2/hooks/useHistory.ts` (integrale, 84 righe) | cosa contiene realmente uno snapshot |
| `components/editor-v2/contexts/EditorContext.tsx` (integrale, 32 righe) | il canale candidato |
| `components/editor-v2/EditorV2.tsx` (`:930`, `:2343-2400`, `:3741`, `:3912`, `:4042`) | provider, handleUndo/handleRedo |
| `components/editor-v2/nodes/ObjectNode.tsx` (`:40-60`, `:222-320`, `:405-425`) | l'analogo nativo dei due handler, e il sito di render di `IRNodeContent` |
| `components/editor-v2/sync/canvasToJjom.ts` (`:1580-1689`) | **sola lettura**: l'unico ponte da RF restaurato al D-layer |
| `components/editor-v2/hooks/useLayoutAutosave.ts` (integrale, 85 righe) | cosa fa davvero `scheduleLayoutSave` |
| `common/U.tsx` (`:203-247`) | forma di `isProjectModified` e del warning di uscita |
| `common/libraries/projectModified.ts` (integrale) | esistenza di una facciata |
| `components/abstract/tabs/MetamodelTab.tsx` (`:140-160`) | primo call site applicativo |
| `components/project/ProjectEditor.tsx` (`:395-500`) | secondo call site applicativo + installazione del `beforeunload` |
| `components/abstract/tabs/ModelsSummaryTab.tsx` (`:14`) | dove e' montato `ProjectEditor` |
| `docs/TECH-DEBT.md` (`:7-17`) | debito gia' registrato sul dual undo |

---

## 2. D1 — come raggiungere `takeSnapshot` da `IRNodeContent`

### 2.1 Il canale esiste gia', ed e' un context React

Non serve alcun CustomEvent. `EditorContext` espone `takeSnapshot` ai discendenti del canvas:

- dichiarazione del valore: `contexts/EditorContext.tsx:5-17` (`takeSnapshot: () => void` e' il **primo** campo, `:6`);
- context: `:19`;
- due hook di consumo: `useEditorContext()` (`:21-27`, lancia se manca il provider) e **`useEditorContextSafe()`** (`:29-31`, ritorna `null` senza lanciare);
- valore memoizzato: `EditorV2.tsx:3741`;
- provider che avvolge l'intero albero del canvas: `EditorV2.tsx:3912` .. `:4042`.

### 2.2 `IRNodeContent` non sarebbe il primo: sarebbe il sesto

La domanda del prompt («se non esistono, dillo esplicitamente: significa che `IRNodeContent` sarebbe il primo») ha risposta negativa netta. Cinque componenti node consumano gia' il context per esattamente questo scopo, con 15 call site:

| Componente | Call site di `editorContext?.takeSnapshot()` |
|---|---|
| `nodes/ClassNode.tsx` | `:292`, `:313`, `:356`, `:396`, `:410`, `:782`, `:859` |
| `nodes/ObjectNode.tsx` | `:232`, `:274`, `:300`, `:531`, `:593` |
| `nodes/EnumNode.tsx` | `:48`, `:82`, `:128` |
| `nodes/PackageNode.tsx` | `:40` |

`ObjectNode` e' il **padre diretto** di `IRNodeContent` (`ObjectNode.tsx:414-419`) e ha gia' `const editorContext = useEditorContextSafe();` a `:45`.

**Conseguenza sulla lista DOVE della Fase 2**: `events/registry.ts` e `EditorV2.tsx` non servono. La lista si riduce a un solo file, `IRNodeContent.tsx`. Il grep di collisione su un nome di evento nuovo e' inutile perche' nessun evento nuovo serve.

### 2.3 Ma lo snapshot sarebbe **inerte**: due ragioni indipendenti

Questo e' il ritrovamento principale della discovery, e cambia la fattibilita' della Fase 2.

**(a) Uno snapshot fotografa solo `nodes`/`edges` di React Flow, e il contenuto IR non vive li'.**

`useHistory.ts:30-42` costruisce lo snapshot con `JSON.parse(JSON.stringify(getNodes()))` e `getEdges()`. Nient'altro.

`IRNodeContent` deriva **tutto** da Redux, non dai dati del nodo RF:
- le righe di compartimento da `useSelector` su `state.idlookup` (`IRNodeContent.tsx:70-91`, signature stringa `compartmentSig`);
- i figli row-dispatch idem (`:110-114`);
- le sue props sono `compiled`, `objectId`, `vertexId`, `readCtx` (`:44-50`, passate a `ObjectNode.tsx:414-419`): **nessuna label e nessun valore di feature transita dai dati del nodo RF**.

Il contrasto con l'analogo nativo e' esplicito. `ObjectNode.commitName` (`:227-240`) e `ObjectNode.commitFeatureEdit` (`:270-293`) fanno **tre** cose in quest'ordine: `takeSnapshot()`, poi `setNodes(...)` che riflette l'edit nei dati del nodo RF, poi la scrittura canonica (`syncNodeLabel` / `syncUpdateFeatureValue`). E' il `setNodes` a rendere lo snapshot diverso dallo stato successivo. `IRNodeContent` non lo fa e non puo' farlo: per un nodo IR quei dati non sono la sorgente del render.

Quindi: snapshot preso, edit scritto in Redux, `nodes`/`edges` **identici prima e dopo**. `handleUndo` (`EditorV2.tsx:2343-2375`) farebbe `setNodes(state.nodes)` / `setEdges(state.edges)` con array che non sono mai cambiati. Effetto visibile: nessuno.

**(b) L'unico ponte dal RF restaurato al D-layer salta i nodi IR, e il ramo rename e' disabilitato per decisione.**

`reconcileJjomAfterUndoRedo` (`canvasToJjom.ts:1591-1689`, chiamata da `EditorV2.tsx:2354` e `:2389`) e' l'unico punto in cui un undo del canvas puo' propagarsi al modello. Due sbarramenti:

- `:1599` — `if (node.type !== 'classNode') continue;`. I nodi IR sono `objectNode`. **Saltati per intero.**
- `:1665-1684` — il ramo che risincronizzava i rename e' **commentato dal 2026-04-23**, con la motivazione per esteso nel codice e il trade-off dichiarato: *«Ctrl+Z dopo inline-edit rename non revoca piu' il rename»*. Registrato in `docs/TECH-DEBT.md:7-17` come *Dual undo-system*, con il fix strutturale raccomandato (Opzione 3: snapshot Redux ID-keyed dentro `useHistory`, restore atomico, rimozione di `reconcileJjomAfterUndoRedo`).

**(c) Corollario: anche l'`ObjectNode` nativo non si annulla davvero.** Prende lo snapshot e aggiorna i dati RF, ma al momento dell'undo il D-layer non viene ripristinato (stessi due sbarramenti). E' esattamente il trade-off accettato nel 2026-04-23. Cioe': la differenza fra IR e nativo non e' «il nativo funziona e l'IR no», e' «il nativo prende lo snapshot e l'IR no», con l'undo del dato che non funziona in nessuno dei due.

### 2.4 Effetto sui criteri di accettazione della Fase 2

I punti 1 e 2 della verifica visiva della Fase 2 — *«rinomino inline, poi undo: la label torna al valore precedente»* e *«cambio il valore, poi undo: il valore torna indietro»* — **non sono raggiungibili** aggiungendo `takeSnapshot()`. Raggiungerli richiede il fix strutturale di `TECH-DEBT.md`, che il prompt mette esplicitamente fuori scope (*«Non unificare i due sistemi di undo»*).

Aggiungere comunque la chiamata resta difendibile, ma va chiamato per quello che e': **allineamento al pattern dei fratelli**, che diventa efficace il giorno in cui l'undo unificato arriva. Non un fix osservabile oggi.

---

## 3. D2 — come marcare il progetto dirty

### 3.1 Forma esatta

`U.tsx:211` — `public static isProjectModified: boolean = false;`

Campo statico pubblico. **Non** un getter, nessun setter, nessuna reattivita': assegnazione diretta.

### 3.2 Nessuna facciata di scrittura

`common/libraries/projectModified.ts` esporta **solo un lettore**: `isProjectModified()` (`:15-17`), che ritorna `U.isProjectModified`. Il file contiene un blocco commentato (`:5-13`) di un approccio localStorage abbandonato con i suoi setter. **Non esiste alcun helper di scrittura**: l'assegnazione diretta e' l'unico pattern in uso.

### 3.3 I due call site applicativi

- `MetamodelTab.tsx:149-152` — guardia + doppia assegnazione:
  ```
  if (!U.isProjectModified) { U.isProjectModified = U.userHasInteracted = true; }
  ```
  Nota: imposta **anche** `U.userHasInteracted`.
- `ProjectEditor.tsx:483-487` — dentro `markDirty`, `useCallback`, con stato React locale in parallelo:
  ```
  const markDirty = useCallback(() => { setIsDirty(true); U.isProjectModified = true; }, []);
  ```
  Il simmetrico `clearDirty` e' a `:490-494`.

Siti che lo azzerano: `topbar/SaveManager.ts:34`, `api/persistance/projects.ts:111`, `pages/components/LeftBar.tsx:140` e `:152`, `pages/components/Navbar.tsx:491` e `:514`, `ProjectEditor.tsx:493`.

### 3.4 Il buco non e' degli edit IR: e' dell'intero canvas v2

`grep -rn "isProjectModified" frontend/src/components/editor-v2/` → **0 occorrenze.**

Nessun gesto del canvas v2 marca il progetto come modificato: ne' gli edit inline IR, ne' i loro equivalenti nativi in `ObjectNode`, ne' i drag, ne' la creazione o cancellazione di nodi. Toccare i soli due handler di `IRNodeContent` produrrebbe l'asimmetria opposta a quella di oggi: l'edit inline su nodo IR marcherebbe dirty, lo stesso edit sullo stesso oggetto reso senza IR no.

### 3.5 `scheduleLayoutSave()` e' inadatto, e nel modo peggiore

Il sospetto del prompt e' fondato, e il dettaglio e' piu' netto dell'ipotesi.

`useLayoutAutosave.ts:62-68` — `scheduleLayoutSave` fa **solo** debounce a 1000 ms e poi chiama `runSave`. `runSave` (`:31-60`) chiama `ProjectsApi.save(project)` (`:50`): **salvataggio completo del progetto**, non del solo layout — la docstring lo dichiara, *«full state serialization»* (`:16`).

Tre ragioni per cui non va bene qui:

1. **Non marca dirty. Lo azzera.** `api/persistance/projects.ts:111` esegue `U.isProjectModified = false` a salvataggio riuscito. Usarlo per «marcare dirty» otterrebbe l'esatto contrario: il warning di uscita non comparirebbe mai.
2. **Il gate e' semanticamente sbagliato.** `:37` — `if (!project || user?.autosaveLayout === false) return;`. Un utente che ha disattivato l'autosave del **layout** si vedrebbe silenziosamente non persistere un edit di **dato del modello**. Sono due preferenze diverse sotto un solo interruttore.
3. Il nome e la docstring vincolano il contratto al layout (`:6-20`): riusarlo per i dati e' un cambio di contratto su un file che la Fase 2 dichiara intoccabile.

### 3.6 Marcare dirty e salvare sono due cose diverse, e ce n'e' una terza

- **Marcare dirty** (`U.isProjectModified = true`) abilita il warning di uscita. Non scrive nulla su disco.
- **Salvare** (`ProjectsApi.save`) scrive e azzera il flag.
- **Terza condizione, non ovvia**: il warning funziona solo se l'handler `beforeunload` e' stato installato. `U.enableUnsavedChangesWarning()` (`U.tsx:225-238`) e' chiamato in **un solo punto**, `ProjectEditor.tsx:401-407`, dentro un `useEffect` con cleanup che lo disinstalla allo unmount. E `ProjectEditor` e' montato come tab del dock (`ModelsSummaryTab.tsx:14`).

  **Domanda aperta che non ho potuto chiudere in sola lettura**: se il tab che ospita `ProjectEditor` viene smontato quando l'utente lavora sul tab del canvas, l'handler risulta disinstallato e il punto 3 della verifica visiva della Fase 2 (*«chiudo la tab del browser: compare il warning»*) fallirebbe **anche con il flag correttamente impostato**. Va verificato a runtime prima di scommetterci.

---

## 4. Strade praticabili, con costo

### D1 — canale per lo snapshot

| # | Strada | Costo | Note |
|---|---|---|---|
| **A** | `useEditorContextSafe()` dentro `IRNodeContent`, `editorContext?.takeSnapshot()` prima delle due scritture | **~4 righe, 1 file** | Pattern identico ai 15 call site esistenti. Nessun evento, nessun registry, nessuna modifica a `EditorV2.tsx`. **Ma inerte oggi** (§2.3) |
| **B** | Come A, piu' il `setNodes` che riflette l'edit nei dati del nodo RF, come fa `ObjectNode` | 1 file, ~15 righe | Renderebbe lo snapshot non vuoto, ma resta bloccato allo sbarramento `:1599` di `reconcileJjomAfterUndoRedo`: l'undo ripristinerebbe dati RF che nessuno legge per un nodo IR. Aggiunge stato duplicato per zero effetto. **Sconsigliata** |
| **C** | Fix strutturale `TECH-DEBT.md` Opzione 3: snapshot Redux dentro `useHistory` | Alto: tocca `useHistory.ts`, `EditorV2.tsx`, rimozione di `reconcileJjomAfterUndoRedo` | E' l'unica che soddisfa i criteri 1 e 2 della verifica visiva. **Esplicitamente fuori scope** in questo prompt |

### D2 — marcatura dirty

| # | Strada | Costo | Note |
|---|---|---|---|
| **A** | `U.isProjectModified = true` in linea nei due handler | 2 righe, 1 file | Coerente con i due call site esistenti. Crea l'asimmetria di §3.4 rispetto all'`ObjectNode` nativo |
| **B** | Come A, esteso ai due handler nativi di `ObjectNode` per simmetria | +2 righe, +1 file | **Fuori dalla lista DOVE**: richiede autorizzazione esplicita |
| **C** | Marcatura dirty centralizzata nei write path (`syncNodeLabel`, `syncUpdateFeatureValue`) | 1 file | Chiuderebbe il buco per tutti i chiamanti in un colpo, ma il file e' `canvasToJjom.ts`, **critical-adiacente e dichiarato intoccabile** dalla Fase 2 |
| **D** | Un helper di scrittura in `common/libraries/projectModified.ts` accanto al lettore | 1 file nuovo-ish | Elimina l'assegnazione diretta sparsa. Fuori DOVE, e sarebbe un refactoring opportunistico non richiesto |

---

## 5. Rischi

1. **Rischio principale — un fix che sembra funzionare e non fa nulla.** D1/A supera i tre gate automatici, non rompe niente, e non produce alcun effetto osservabile. Senza questo report finirebbe a log come «fix dell'undo», e il debito resterebbe aperto sotto un'etichetta di chiuso. E' la stessa forma del dead write descritto in `CLAUDE.md` §5 («verify consumers before assuming an output is load-bearing»).
2. **Asimmetria introdotta da D2/A**: il comportamento dirty diverge fra nodo IR e nodo nativo a parita' di gesto e di oggetto.
3. **Il warning di uscita potrebbe non comparire comunque** per la questione di montaggio di §3.6, indipendentemente dal flag.
4. **Ordine delle chiamate**: il prompt chiede giustamente lo snapshot *prima* della scrittura. In D1/A e' rispettato banalmente, ma va notato che i due handler odierni non hanno guardia di «valore effettivamente cambiato» — `ObjectNode` ce l'ha (`:230` `if (name !== lastCommittedName.current)`, `:273` `if (feature && editValue !== feature.value)`), `IRNodeContent` no (`:123-135`). Snapshot e marcatura dirty incondizionati scatterebbero anche su un commit che non cambia nulla (Enter senza modifiche), gonfiando la history e marcando dirty un progetto intatto.

---

## 6. Domande aperte per Alfonso

1. **D1** — visto che lo snapshot sarebbe inerte (§2.3): si aggiunge comunque la chiamata come allineamento al pattern (A), oppure si lascia `IRNodeContent` com'e' e si rimanda tutto al fix strutturale del dual undo? Aggiungere D1/A e chiamarlo «fix dell'undo» nel log sarebbe scorretto; aggiungerlo dichiarandolo preparatorio e' legittimo.
2. **D2** — si accetta l'asimmetria (A, solo IR, dentro la lista DOVE) o si estende ai due handler nativi di `ObjectNode` (B, richiede di ampliare la lista)?
3. **§5.4** — si aggiunge la guardia «valore cambiato» ai due handler, allineandoli a `ObjectNode`? E' un cambiamento di comportamento, per quanto piccolo, e non e' nel prompt.
4. **§3.6** — vuoi che verifichi a runtime se l'handler `beforeunload` e' installato mentre il canvas e' attivo? Senza quella verifica il criterio 3 della verifica visiva non e' predicibile.
