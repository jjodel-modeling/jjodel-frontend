# Prompt Claude Code: singleton come valore del linguaggio, commit A (Fase 2)

**Data**: 2026-08-26 15:55
**Branch**: `alfonso-frontend-jjtl`, HEAD `3a07155fe`. Il working tree ha modifiche non committate di altri fronti (`StatusBar.*`, `featureSignature.ts`, `EdgeTypePopup.scss`, `M1ReferencePopup.tsx`, `PropertiesWithTreeView.*`, `TreeViewPanelContext.tsx`): non toccarle, non stagiarle.
**Tipo**: feat
**Effort**: xhigh
**Critical-zone**: `LModelElement.tsx` è D-L proxy → Layer Impact Report obbligatorio (§3.2 di `CLAUDE.md`), vedi 3.2 qui sotto. Nessun file di §3.1.
**Decisioni**: `docs/decisions.md`, serie R-SGL, ratifiche 1-9. R-SGL-2 è stata **emendata** dopo la discovery: leggi la versione attuale, non quella citata nel prompt di Fase 1.
**Discovery**: `docs/discovery/discovery_2026-08-26_singleton_instantiability.md`. È la base di questo prompt: ogni riga citata sotto viene da lì (letta su `6b66ffe3a`; cerca il simbolo se la riga è slittata).

Leggi `CLAUDE.md` e `docs/claude-code-log.md` prima di iniziare. Se qualcosa qui contraddice `CLAUDE.md`, fermati e segnala.

---

## 0. Contesto

Il singleton diventa un valore del linguaggio. Dopo questo commit: una classe singleton non è instanziabile da nessuna via utente (sei filtri di editor-v2 più JjScript); l'istanza esiste per costruzione e segue il flag (accesa: creata in ogni M1, già così; spenta: **tutte** le istanze rimosse, con il loro `DVertex`, in un solo passo di undo); lo stereotipo «singleton» resta solo sulla metaclasse.

Le risposte alle sette domande del report (§9) sono ratificate in R-SGL-6, 7, 8, 9: Q1 dentro; Q2 tutte e tre le scritture, via α (token di rientranza per oggetto); Q3 un solo undo vale solo per lo spegnimento; Q4 fallback del toggle tenuto; Q5 e Q6 a registro, non si toccano; Q7 (a) togliere `const isSingleton` e la chiave dal selettore, (b) aggiornare il commento SCSS; Q8 (§7b del report) guard di accensione per modello, dentro A.

---

## 1. COSA, file per file

Otto file di prodotto: sopra la soglia della regola 19, quindi **prima di editare** elenca in chat gli otto file con la modifica prevista per ciascuno (basta questa lista, confermata da te dopo la lettura dei file) e procedi.

### 1.1 `frontend/src/components/editor-v2/hooks/useEditorMode.ts`
- `MetaclassInfo`: aggiungi `isSingleton?: boolean` (opzionale, regola 11), con un commento di una riga: «singleton-ness of the metaclass; not folded into `isAbstract`, and not applied to `concreteSubclasses` (endpoint conformance needs them)».
- Popolamento in `resolveM1Info` (`:429-437`): `isSingleton: !!(cls as any).isSingleton`, stessa forma difensiva di `isAbstract`.
- Firma di reattività (`:173`): aggiungi `${cls.isSingleton}` alla stringa per classe. Senza questa riga la palette resta stantia dopo un toggle del flag (§3.3 del report).
- `rootableClasses` (`:499-501`): `!c.isAbstract && !c.isSingleton && !compositionTargetIds.has(c.id)`.
- **Non** filtrare `concreteSubclasses` (secondo passo, `:466`).

### 1.2 `frontend/src/components/editor-v2/utils/compositionCompat.ts`
- `getCompatibleContainmentRefs` (`:48`): `dropped && !dropped.isAbstract && !dropped.isSingleton`.
- `getCompositionChildOptions` (`:164` e `:169`): escludi il singleton sia dal target concreto sia dai `concreteSubclasses` **al consumo**, cioè nel ciclo che costruisce `concreteOptions`, non alla sorgente.

### 1.3 `frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts`
- `matchConnectRules` (`:136`): la regola che oggi salta `!edgeClass || edgeClass.isAbstract` salta anche `edgeClass.isSingleton`. È la connect gesture che crea l'edge-object via `syncCreateObject`.
- `deriveDroppableChildMetaclasses` (`:170-171`): stesso filtro, alimenta il ramo extra della palette IR.
- `conformsToRefTarget` (`:107-111`) **non si tocca**.

### 1.4 `frontend/src/components/editor-v2/EditorV2.tsx`
- Palette IR, ramo extra (`:1499-1501`): aggiungi `&& !c.isSingleton`.
- Ramo di creazione del toggle (`:729-761`): resta. Sostituisci il commento di testa con uno che lo dichiara fallback: «Fallback, not the primary path: after R-SGL-2 instances exist by construction. This branch repairs M1s saved before the feature and M1s re-pointed via `LModel.set_instanceof`, which does not seed singletons.»
- Niente altro in questo file.

### 1.5 `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`
- Rimuovi i due blocchi `{isSingleton && (<span className="mm-node__stereotype">…)}` (ramo IR `:434-436`, ramo nativo `:496-498`) con i loro commenti.
- Rimuovi `const isSingleton = liveMetaclassInfo.isSingleton;` (`:88`) e la chiave `isSingleton` dal selettore (`:80-86`), che resta per `name`. Se il selettore ha altri lettori di `isSingleton` che il report non ha visto, hard stop.

### 1.6 `frontend/src/components/editor-v2/EditorV2.scss`
- Solo il commento a `:2175-2177` (quello che dice che il rombo è stato sostituito dallo stereotipo su metaclasse e istanza): riscrivilo per dire che lo stereotipo vive solo su `ClassNode` (R-SGL-3). Nessuna regola cambia; `.mm-node__stereotype` resta, è di `ClassNode`.

### 1.7 `frontend/src/jjscript/executor/commands/instance.ts`
- In `create instance` (`:231-241`), accanto al check su `abstract`, un check gemello su `isSingleton` della metaclasse, con messaggio e suggerimento nello stesso formato di quello per abstract (es. «Cannot create an instance of a singleton class: the instance already exists.»). Stesso stile del pre-check di delete (`:369-383`).

### 1.8 `frontend/src/model/logicWrapper/LModelElement.tsx` (D-L proxy, dopo il LIR di 3.2)

Quattro interventi, tutti in `LClass` e `LObject`, nessuna modifica a `Dummy.ts`.

**(a) Token di rientranza per oggetto.** Un `Set<Pointer<DObject>>` a livello di modulo (nome da verificare con `grep -r` prima di crearlo; proposta: `singletonInstancesBeingRemoved`). `LObject.get_delete` (`:6425-6433`): se l'id dell'oggetto è nel Set, lo consuma (`delete`) e chiama `super.get_delete(context)()` senza passare dal guard; altrimenti il guard resta com'è.

**(b) Helper unico di spegnimento.** Metodo privato di `LClass` (nome da verificare; proposta: `removeSingletonInstances(c: Context)`), chiamato **dentro** la `TRANSACTION` del chiamante, che:
1. per ogni `o` in `this.get_instances(c)` (tutte, il campo è piatto sul progetto):
   - trova i `DVertex` che puntano a `o` via `model`. Canale preferito: lo stesso che `Dummy.get_delete` usa nel `case 'model'` (`Dummy.ts:222-233`) per trovare gli edge; se da `LModelElement` non è raggiungibile senza un import nuovo verso editor-v2 o senza cambiare `Dummy.ts`, ripiega su una scansione di `idlookup` filtrata su `className` di vertice e `model === o.id`, con la guardia `typeof e !== 'object'` (in `idlookup` c'è anche `clonedCounter`, number). Dichiara nel log quale dei due hai usato.
   - chiama `.delete()` sul proxy di ogni vertice trovato;
   - aggiunge `o.id` al Set di (a) e chiama `o.delete()`.
2. non scrive il flag: lo scrive il chiamante.
Le `TRANSACTION` annidate aperte dalla cascata a profondità > 0 non chiudono nulla, quindi tutto resta un solo delta (§4.5 del report).

**(c) I tre writer.**
- `set_singleton` (`:2874-2891`): nel ramo `!val`, dopo la `SetFieldAction` sul flag, chiama l'helper. Ordine irrilevante per il guard (le azioni si accodano), rilevante per la leggibilità: flag, poi rimozione.
- `set_final(false)` (`:2867`) e `set_sealed([...])` (`:2850`): dove oggi c'è la sola `SetFieldAction.new(c.data, 'isSingleton', false)`, aggiungi la chiamata all'helper, **solo se `c.data.isSingleton` è vero** (altrimenti non c'è nulla da rimuovere e il ciclo non deve girare).

**(d) Guard di accensione per modello (R-SGL-8).** In `set_singleton`, sostituisci `c.data.instances.length > 1` con: rifiuta se **un singolo M1** ha più di un'istanza (raggruppa `this.get_instances(c)` per `o.model?.id`). Aggiorna il messaggio dell'alert di conseguenza («…since a model already has multiple instances»). Il ramo di creazione (`:2883-2888`) resta: salta già i modelli che hanno un'istanza.

**Non toccare**: `get_instantiable`, `get_rootable`, `addObject` e `forceCreation` (è il canale con cui il sistema crea i singleton), `Dummy.ts`, `canvasToJjom.ts`, `useJjomSync.ts`, `syncState.ts` (il residuo in `suppressedSingletonIds` non ha effetto osservabile, resta a registro).

---

## 2. DOVE: riepilogo

`useEditorMode.ts`, `compositionCompat.ts`, `irInteraction.ts`, `EditorV2.tsx`, `ObjectNode.tsx`, `EditorV2.scss`, `instance.ts`, `LModelElement.tsx`. Più `docs/claude-code-log.md` alla chiusura. `git add` per path esplicito su questi e solo questi.

---

## 3. COME

### 3.1 Ordine
1. Lettura dei file e lista della regola 19 in chat.
2. Editor-v2 e JjScript (1.1-1.7): nessun LIR, procedi.
3. **Layer Impact Report** compatto (3.2) in chat, poi **HARD STOP** per ACK di Alfonso.
4. `LModelElement.tsx` (1.8).
5. Gate, commit unico, **HARD STOP** per la verifica visiva (4).

### 3.2 Layer Impact Report (prima di 1.8)
Compatto, nel formato di §3.2 di `CLAUDE.md`: quali scritture D-layer nascono (`SetFieldAction` sul flag, `DeleteElementAction` via cascata su oggetti e vertici), in quale `TRANSACTION` stanno e perché è un solo dispatch, come il canvas reagisce (diff di `graph.subElements` in `useJjomSync.ts:1330`, nessun evento), cosa fa l'undo, e la dichiarazione esplicita che nessuna `TRANSACTION` esterna avvolge un `.new()` (caso «TRANSACTION pura» di §3.3). Includi il canale scelto per trovare i `DVertex`.

### 3.3 Gate
`npx tsc --noEmit` a baseline 33 (Δ0), `npm run build`, `npx vitest run` con attenzione a `ir.test.ts` (copre `matchConnectRules`). Nessuno degli otto file ha una suite propria: la prova della rimozione è la verifica visiva, non i test.

### 3.4 Commit
Uno solo: `feat(m1): singleton classes are not instantiable; instances follow the flag; no stereotype on instances`.

---

## 4. Verifica visiva (Alfonso o la chat via Chrome, porta 3000, hard refresh)

Fixture: M2 con `Config` singleton, `Person` con containment `items 0..*` verso `Item` singleton (per il menu contestuale), e una metaclasse edge `Link` singleton con due reference verso `Person` (per la connect gesture); due M1 sullo stesso M2. La verifica del punto 2 è **osservazionale** (rischio 1 del report): l'istanza deve sparire dal modello, non solo dal diff.

1. Palette M1: `Config`, `Item`, `Link` assenti; `Person` presente. Drag di `Person` ok.
2. Chip «Singleton» off su `Config` dal Properties: l'istanza sparisce dal canvas e dal tree M1 di **entrambi** gli M1; `windoww.store.getState().idlookup` non contiene più `DObject` con `instanceof` = `Config` né `DVertex` con `model` su quegli id. Un solo ⌘Z riporta flag, istanze e nodi.
3. Chip «Final» off su una classe singleton: stesso esito del punto 2.
4. Con i due M1 aperti e un'istanza ciascuno, chip «Singleton» on → off → on: la riaccensione è accettata (R-SGL-8) e ricrea un'istanza per M1.
5. Reattività: con un M1 aperto, accendi il flag su `Person`: sparisce dalla palette senza altre modifiche; spegnilo: ricompare.
6. Menu contestuale su un `Person`: nessuna voce «Add Item»; connect gesture fra due `Person`: nessun `Link` creato.
7. Console JjScript: `create instance Config` rifiutato col messaggio nuovo.
8. Sintassi astratta: «singleton» su `Config` in `ClassNode`; M1: nessuno stereotipo sull'istanza, ramo nativo e ramo IR (viewpoint con e senza view dichiarata).
9. View > Show singletons: mostra/nasconde ancora; nessuna console rossa nei passi 1-8.

**HARD STOP** dopo il commit, in attesa dell'esito.

---

## 5. Chiusura (dopo il GO)

Entry in `docs/claude-code-log.md` col formato standard, con: il canale usato per i `DVertex`, il LIR in sintesi, i numeri dei gate, e in `Note` la scoperta della scrittura morta `Dummy.ts:254` e del commento falso in `canvasToJjom.ts:449-455` (registrati in R-SGL-9e, non corretti qui). Commit `docs:` separato per il log.

---

## 6. Vincoli

- Nessun refactoring oltre le righe elencate; nessun rename di identificatori esistenti.
- Nomi nuovi (il Set, l'helper) verificati con `grep -r` prima di crearli.
- Nessuna modifica a `Dummy.ts`, `canvasToJjom.ts`, `useJjomSync.ts`, `syncState.ts`, `ContextMenu.tsx` classic, `PalettePanel.tsx` (la palette legge la lista già filtrata).
- Se il canale per i `DVertex` richiede un import da editor-v2 dentro `LModelElement.tsx`, hard stop: è un confine di layer da decidere in chat.
