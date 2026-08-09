# Discovery (read-only) — Stato e azioni: dove scrivono gli eventi, su sintassi astratta e concreta

**Data**: 2026-08-03 16:28
**Tipo**: Fase 1 di un two-phase. **Read-only: nessun edit al codice sorgente.** L'unico file che puoi scrivere e' il discovery report.
**Branch**: `alfonso-frontend-jjtl`. Attenzione: il branch locale e' avanti rispetto a origin di circa 25 commit. Lavora sul working tree locale, non fidarti di GitHub.
**Critical zone**: nessuna da toccare. `useJjomSync.ts` e `portDistribution.ts` si possono leggere, mai modificare.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

## Contesto

L'arco di authoring della sintassi concreta IR e' chiuso: vertici, righe ed edge hanno tutti un pannello end-to-end. Lo schema IR (`irTypes.ts`) descrive pero' una funzione pura: dato il modello, produce una notazione. Non ha nessun costrutto per lo **stato mutabile** ne' per le **azioni**.

Il gap emerso in chat: gli eventi possono triggerare azioni che memorizzano risultati, anche intermedi, e quei risultati possono finire in due posti diversi.

- Sui **nodi della sintassi astratta**, tipicamente per cose che riguardano la semantica: il risultato di una simulazione, uno stato di esecuzione, un valore calcolato.
- Sui **nodi della sintassi concreta**, tipicamente per customizzare il comportamento dell'editor o l'interazione fra utente e notazione: collasso, evidenziazione, modalita' di editing, marcature temporanee.

Meta' di questa seconda categoria esiste gia' nel codebase, ma cablata caso per caso (`DVertex.irEdgeLayout`, `DVertex.irCollapsed`, `ghostOffsets`, i singleton di sessione, il flag `persistWaypoints`). Nessuna di queste e' dichiarabile dall'autore di una view.

**Obiettivo della discovery**: mappare il comportamento reale e il substrato disponibile. Non proporre uno schema, non progettare la soluzione. Il modello di stato lo decide Alfonso a partire dal tuo report.

## COSA mappare

Per ogni finding serve `file:riga`. Dove una cosa non esiste, dillo esplicitamente invece di dedurlo.

### 1. Il tab Events: cosa e', cosa persiste, chi lo esegue

`ViewData.tsx` monta una barra di sotto-tab per una view (attesi: Apply to, Template, IR, Style, Events, Options, Components; conferma l'elenco reale).

Per il tab **Events**:

- componente che lo rende, `file:riga`;
- quale campo del `DViewElement` scrive, e forma del dato (stringa di codice? mappa evento → handler? JSX?);
- chi lo legge e lo esegue a runtime, e con quale meccanismo (eval, template engine, registrazione DOM);
- **quali identificatori sono in scope dentro un handler**: quali variabili, oggetti o API sono raggiungibili dal codice che l'utente scrive. E' il punto piu' importante di questa sezione, perche' determina cosa un'azione puo' gia' fare oggi;
- se gli handler restano validi su un nodo **IR-authored**: il DOM e' diverso (`.ir-node-content` invece della struttura classica). Segnala selettori o assunzioni sul DOM classico che si romperebbero.

Se il tab Events risulta inerte, non cablato o mai completato, dillo chiaramente: e' un esito valido e cambia la decisione a valle.

### 2. Write path verso la sintassi astratta

Quali API canoniche esistono per scrivere una feature di un oggetto M1 da dentro un handler o da codice dell'editor. Attese almeno: `syncUpdateFeatureValue`, `SetFieldAction`, l'executor JjScript. Per ciascuna:

- firma e `file:riga`;
- se e' undoable (e con quale dei sistemi di undo, dato che il progetto ne ha piu' di uno);
- se passa dalla validazione di conformita' M2 o la scavalca;
- se marca il progetto come dirty e innesca il salvataggio.

La spec IR v1.2 §5 dichiara che il commit dell'editabilita' passa dal path canonico e **mai** da write path nuovi. Verifica che questo sia vero nell'implementazione attuale di `editable` (label e segmenti), e riporta il punto esatto in cui il valore viene scritto.

### 3. Censimento dello stato gia' esistente sulla sintassi concreta

Per **ciascuno** di questi, e per altri che trovi con grep:

- `DVertex.irEdgeLayout`
- `DVertex.irCollapsed`
- `ghostOffsets` / `ghostParentOffsets`
- i singleton di sessione (`irEdgeInteraction.ts`, `irCollapseState.ts`)
- il flag `persistWaypoints` in `irTypes.ts` / `irCompile.ts`

Riporta in tabella: dove vive il dato, chi lo scrive, chi lo legge, **scope** (per-vertex condiviso fra viewpoint / per-viewpoint / per-sessione), **durata** (sessione o persistito col progetto), come e' esposto al proxy L, se ha richiesto una migrazione `VersionFixer`.

Lo scope e' la colonna piu' importante: `irEdgeLayout` e' stato messo su `DVertex` ed e' condiviso fra viewpoint per decisione esplicita (2026-07-19). Verifica se le altre voci hanno lo stesso scope o uno diverso, e se la differenza e' deliberata o accidentale.

### 4. Esiste un substrato generico?

Domanda secca: c'e' gia' un campo libero, una mappa o un dizionario aperto su `DVertex`, `DViewElement` o `DViewPoint` dove uno stato **dichiarato dall'utente** potrebbe vivere senza aggiungere un campo cablato per ogni caso?

- Se si': `file:riga`, tipo, chi lo serializza, se il proxy L lo espone, se ha vincoli di forma.
- Se no: quantifica il costo di aggiungerne uno. Serve una migrazione `VersionFixer`? Un campo opzionale additivo basta (precedente: `irEdgeLayout` non ha richiesto migrazione perche' `undefined` significa comportamento attuale)?

Riporta anche come si comporta la serializzazione generica con un oggetto di forma libera: viene salvata e ricaricata verbatim, o passa da uno schema che scarterebbe chiavi sconosciute?

### 5. Reattivita': cosa fa ridisegnare la notazione

`computeIRSignature` (`irResolveCore.ts`) invalida il rendering quando cambia l'oggetto `ir` di una view. Ma lo stato di interazione non e' l'`ir`.

- Come propagano oggi i cambi dei singleton di sessione (collasso, override di edge)? Chi li legge, e cosa provoca il re-render (`ObjectNode`, `IRContainmentHulls`, altro)?
- Se domani un valore di stato dichiarato cambiasse, **quale meccanismo esistente potrebbe farlo reagire** senza introdurre un canale nuovo? Elenca i candidati che il codice gia' offre, senza sceglierne uno.
- Segnala il costo: `computeIRSignature` e' viewpoint-wide (limite noto: un commit su una view fa re-risolvere tutte le view del viewpoint). Uno stato che cambia a ogni click non puo' passare da li'. Riporta se esiste gia' un canale a granularita' piu' fine.

### 6. Namespace nelle espressioni

`PathExpr` e' una micro-grammatica chiusa: inizia con `$` piu' nome di feature, `.value`, `.values[n]`, navigazione concatenata. Vietati `?.`, `??`, ternari, chiamate.

- Dove vive il parser e dove il valutatore di `PathExpr` (`file:riga`).
- Dove vive il valutatore di `Predicate` e di `Conditional<T>`.
- Se si volesse leggere, dentro un `Conditional`, un valore di stato invece di una feature del modello, **quale sarebbe il punto di innesto minimo**? Un secondo prefisso riconosciuto dal parser, un contesto di valutazione esteso, altro? Riporta i punti di innesto che il codice rende praticabili, con il costo di ciascuno, senza raccomandarne uno.
- Verifica se `makeReadCtx` o il contesto di lettura equivalente ha gia' un posto dove infilare valori non provenienti dal modello.

### 7. Copertura delle feature (sezione minore, additiva)

Dato un oggetto `ir`, quali sono **tutti** i siti in cui puo' comparire il riferimento a una feature del metamodello? Attesi: label, segmenti dei compartimenti, sorgente dei compartimenti, badge, template di una row view, capi `source`/`target` di una object-as-edge, `predicate`, `when` dei `Conditional`, `childFilter`.

- Elenco completo con `file:riga` del punto di lettura.
- Esiste gia' una funzione che attraversa l'intero IR in modo generico (visitor, walker, normalizzatore)? Se si', `file:riga`. Se no, dillo.
- Esiste gia' una funzione che estrae il nome della feature da un `PathExpr`? Se si', `file:riga`.

Serve per valutare il costo di una vista di copertura (quali feature della metaclasse sono usate dalla view, quali no, quali citano path che non risolvono piu'). Non progettarla: rispondi solo alle tre domande sopra.

## Report OBBLIGATORIO

Salva il report in:

```
docs/discovery/discovery_<data-di-esecuzione>_state_actions_events.md
```

con `<data-di-esecuzione>` in formato `YYYY-MM-DD`. Se lo esegui il 3 agosto 2026: `discovery_2026-08-03_state_actions_events.md`. Crea `docs/discovery/` se non esiste. Per piu' discovery nello stesso giorno sullo stesso tema, aggiungi suffisso `_N`.

Contenuto minimo: obiettivo, file letti con path completi, i sette findings con `file:riga`, la tabella dello stato esistente (punto 3) con le colonne scope e durata, rischi individuati, domande aperte per Alfonso.

Aggiungi una sezione finale **"Opzioni praticabili"** in cui elenchi, **senza sceglierne una**, le strade che il codice rende possibili per dichiarare stato e azioni nell'IR. Per ciascuna: cosa richiederebbe toccare, se richiede una migrazione, quale rischio introduce. Se una strada e' preclusa da un vincolo reale del codebase, dillo e cita il vincolo.

**La Fase 1 non e' completa finche' il report non e' scritto.** L'analisi in chat parte dal report salvato, non dalla memoria della sessione.

## COME

- Solo lettura del codice sorgente. Zero modifiche, zero refactoring, nessun rename, nessun file nuovo tranne il report.
- Grep globali sui nomi dei campi, sui write path, sulle stringhe UI dei tab.
- Non toccare la critical zone (`useJjomSync.ts`, `portDistribution.ts`): leggerle e' ammesso, modificarle no.
- Se un componente atteso non esiste con quel nome, **non concludere che la feature non esiste**: cerca per campo persistito e per stringa visibile in UI, poi segnala l'incertezza nel report.
- Dove trovi un comportamento che sembra un bug, annotalo nel report senza correggerlo.

## RIFERIMENTI

- Schema e runtime IR: `frontend/src/components/editor-v2/viewpoint/ir/` (`irTypes.ts`, `irCompile.ts`, `irResolveCore.ts`, `irReadCtx.ts`, `irEdgeInteraction.ts`, `irCollapseState.ts`, `IRNodeContent.tsx`).
- Editor di view a tab: `frontend/src/components/editors/views/ViewData.tsx`.
- Pannelli di authoring: `frontend/src/components/editor-v2/viewpoint/authoring/` (`VertexAuthoringPanel.tsx`, `RowAuthoringPanel.tsx`, `EnableIRPanel.tsx`). **Non toccare** il memo `featureInfo` di `VertexAuthoringPanel`.
- Campi persistiti su DVertex: `frontend/src/model/dataStructure/GraphDataElements.tsx`.
- Write path canonico: `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (critical-adiacente: sola lettura).
- Registry degli eventi custom interni: `frontend/src/events/registry.ts` (infrastruttura dell'app, distinta dagli eventi user-facing della view: non confondere i due piani nel report).
- Spec IR v1.2 §5 (editabilita'), §7 (`persistWaypoints`, policy endpoint), §8 (collasso): `docs/specs/spec_2026-07-18_ir_schema_v1_2.md`.
- Discovery precedenti utili come modello di formato: `docs/discovery/discovery_2026-07-19_persistenza_edge_sintetici.md`, `docs/discovery/discovery_2026-08-02_eobj_object_as_edge_authoring.md`.

## HARD STOP

Dopo aver scritto il report, **fermati**. Nessuna modifica al codice, nessuna proposta di implementazione.

Puoi committare il solo file del report con `git add` mirato (mai `git add .`, mai `git commit -a`), messaggio `docs: discovery on state and actions across abstract and concrete syntax`, piu' l'entry in `docs/claude-code-log.md`.

Entry di log, con il nome di questo documento prompt:

```
**Nome del documento prompt**: 2026-08-03 16:28 prompt_discovery_state_actions_events
```

Poi torna in chat con il contenuto del report.
