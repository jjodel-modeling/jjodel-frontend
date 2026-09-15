# Prompt Claude Code: singleton come valore del linguaggio, discovery del commit A (Fase 1)

**Data**: 2026-08-26 14:35
**Branch**: `alfonso-frontend-jjtl`, HEAD `472afeefe` (i riferimenti a riga qui sotto sono stati letti su `778fbe0df`: se una riga è slittata, cerca il simbolo, non il numero)
**Tipo**: feat (questa è la Fase 1, read-only: nessun file di prodotto)
**Effort**: xhigh
**Critical-zone**: no per i file attesi; `LModelElement.tsx` è D-L proxy, quindi la Fase 2 porterà un Layer Impact Report compatto
**Decisioni**: `docs/decisions.md`, serie R-SGL (R-SGL-1, R-SGL-2, R-SGL-3, R-SGL-5)

Leggi `CLAUDE.md` e `docs/claude-code-log.md` prima di iniziare. Se qualcosa qui contraddice `CLAUDE.md`, fermati e segnala.

---

## 0. Contesto

Il singleton diventa un valore del linguaggio: la classe singleton non è instanziabile per nessuna via, l'istanza esiste per costruzione e segue il flag (creata all'accensione, rimossa allo spegnimento), e lo stereotipo «singleton» resta solo sulla metaclasse. Il commit A realizza R-SGL-1, 2 e 3. Il commit B (select sulle righe reference, R-SGL-4) è un fronte separato con la sua discovery: qui non si legge.

Cosa è già noto dalla chat (verifica, non ripetere):

- `LModelElement.tsx:2874-2891`, `set_singleton`: all'accensione crea un'istanza in ogni M1 del metamodello che non ne ha; allo spegnimento non fa nulla. Rifiuta l'accensione se `instances.length > 1` o se la classe è estesa; forza `final`.
- `LModelElement.tsx:2892`, `get_instantiable`: `!(abstract || interface || isSingleton)`. È la fonte del predicato.
- `LModelElement.tsx:6429`: la cancellazione rifiuta un'istanza la cui classe è singleton. `:7010`: `addObject(schema)` rifiuta l'istanziazione di un singleton. `jjscript/executor/commands/instance.ts:369-381`: pre-check sullo stesso flag.
- `classes.ts:942` (`DModel` in joiner): alla creazione di un M1 crea un'istanza per ogni classe singleton.
- `useEditorMode.ts:432`: `isAbstract = !!(cls.abstract || cls.interface)`, il singleton non entra. `:500`: `rootableClasses = !isAbstract && !compositionTarget`. È il motivo per cui la palette M1 e il drop gate (`EditorV2.tsx:2130`, `:2271`) accettano i singleton.
- `compositionCompat.ts:161-172`: le opzioni concrete per i figli di composizione sono `!targetClass.isAbstract` più `concreteSubclasses`. Stessa lacuna.
- `EditorV2.tsx:676-820`: il toggle View > Show singletons; a `:729-760` crea DObject+DVertex per i singleton senza vertice.
- `ObjectNode.tsx:434` (ramo IR) e `:496` (ramo nativo): lo stereotipo «singleton» sull'istanza. `_notations.scss:12,27,83` nasconde `.mm-node__stereotype` in tre notazioni.

---

## 1. COSA

Produrre un discovery report che risponda alle sei domande della sezione 3, con path e righe, così che la Fase 2 possa essere scritta come lista chiusa di edit. Nessuna modifica al codice.

---

## 2. DOVE

Lettura attesa (allarga se serve, e dichiaralo nel report):

- `frontend/src/components/editor-v2/hooks/useEditorMode.ts`
- `frontend/src/components/editor-v2/utils/compositionCompat.ts`
- `frontend/src/components/editor-v2/EditorV2.tsx` (drop handler, drag-over, toggle singletons, menu contestuale M1)
- `frontend/src/components/editor-v2/ContextMenu.tsx`
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`
- `frontend/src/components/editor-v2/_notations.scss`, `EditorV2.scss` (solo le regole di `.mm-node__stereotype`)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (`set_singleton`, percorso di cancellazione di un `DObject`, `:6429`)
- `frontend/src/joiner/classes.ts:929-948`
- `frontend/src/components/editors/Info.tsx` (il campo `singleton`, riga 187: da dove parte la scrittura dalla UI)
- `frontend/src/services/JjodieContext.ts:122-160` e ogni altro sito che costruisce un `MetaclassInfo` a mano

**Report** in `docs/discovery/discovery_2026-08-26_singleton_instantiability.md`: obiettivo, file letti con path completi, findings per domanda, dipendenze e rischi, domande aperte per Alfonso.

---

## 3. COME: le sei domande

**D1. Vie di instanziazione in editor-v2.** Elenca ogni sito che può creare un `DObject` da una classe scelta dall'utente: palette (drag), drop sul canvas, drop dentro un contenitore IR, menu contestuale dei figli di composizione, voce «Add instance» o simili nel menu contestuale del canvas, comandi JjScript, Jjodie. Per ciascuno: quale lista o predicato filtra le classi, e se il singleton oggi passa. L'obiettivo di Fase 2 è un solo punto di verità: dire se basta aggiungere `isSingleton` (o `instantiable`) a `MetaclassInfo` e usarlo nei due filtri (`useEditorMode.ts:500`, `compositionCompat.ts:163-170`), o se ci sono siti che non passano da `MetaclassInfo`.

**D2. `MetaclassInfo`.** Chi costruisce letterali `MetaclassInfo` fuori da `resolveM1Info` (`compositionCompat.ts:150`, `JjodieContext.ts:153`, altri). Se il campo nuovo è opzionale (regola 11 di `CLAUDE.md`, come `allAttributes`), quei siti non cambiano: conferma. Proponi il nome del campo e la semantica: `isSingleton: boolean` letto da `cls.isSingleton`, oppure `instantiable` letto da `cls.instantiable`. Preferenza della chat: `isSingleton`, così `concreteSubclasses` resta com'è e il filtro è esplicito.

**D3. Rimozione allo spegnimento del flag.** Qual è il percorso canonico per cancellare un `DObject` con il suo `DVertex` (la cascata di `Dummy.get_delete` citata nel log, l'`orphanStore` per i `DValue`), e cosa fa `:6429` se la cancellazione parte dentro la stessa `TRANSACTION` che ha appena scritto `isSingleton = false` (l'ordine flag-poi-delete è quello previsto da R-SGL-2: verifica che il guard legga lo stato già aggiornato). Cosa succede ai `DValue` di altri oggetti che puntano all'istanza rimossa. Cosa succede sul canvas: `useJjomSync` toglie il nodo da sé quando il `DVertex` sparisce, o serve un evento. Il tutto deve essere un solo passo di undo.

**D4. Coerenza col toggle.** Con l'istanza garantita per costruzione, il toggle View > Show singletons resta un puro mostra/nascondi. Il ramo di creazione a `EditorV2.tsx:729-760` serve ancora per i modelli salvati prima (M1 creati quando il flag è stato acceso senza `set_singleton`, o con l'istanza cancellata a mano)? Conta i casi e proponi: tenerlo come fallback dichiarato, o toglierlo. Verifica anche che la soppressione al mount (`:793-815`) non dipenda dall'esistenza del ramo di creazione.

**D5. Stereotipo.** Confermare che togliere i due blocchi in `ObjectNode.tsx` non lasci regole SCSS orfane: `.mm-node__stereotype` serve ancora a `ClassNode`, quindi resta; verifica se esistono regole scritte solo per l'istanza (`.mm-object .mm-node__stereotype` o simili). Nessun altro consumatore di `isSingleton` in `ObjectNode` va toccato (`liveMetaclassInfo` resta, serve al ramo `title` o ad altro: dillo).

**D6. Modelli esistenti.** Cosa fa il commit A con un M1 salvato che ha (a) una classe singleton senza istanza, (b) due istanze della stessa classe singleton, (c) un'istanza di una classe che non è più singleton. Nessuna migrazione è prevista: il report dice solo come si comportano i tre casi dopo A, così Alfonso decide se serve altro.

**HARD STOP** a report scritto. L'analisi si fa in chat sul report, non in questa sessione.

---

## 4. Vincoli

- Read-only: nessun file di prodotto toccato, nessun `git add`.
- Il report è l'unico artefatto; niente entry di log finché la Fase 2 non è chiusa.
- Non leggere `IRNodeContent.tsx` e `canvasToJjom.ts` oltre quanto serve a D3: sono il fronte del commit B.
- Se una risposta richiede di guardare un branch diverso o uno stato non committato, scrivi la domanda nel report e vai avanti.
