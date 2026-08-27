# Prompt Claude Code: undo in editor-v2, fronte proprio. Snapshot a inizio gesto, write-back per resolver, un solo undo per ⌘Z

**Corsia completa (RC-3), two-phase, effort xhigh. Fase 1 read-only con report obbligatorio in
`docs/discovery/`, hard stop, GO di Alfonso in chat, poi Fase 2.** Leggere a inizio sessione:
`CLAUDE.md`, `docs/decisions.md` (R-LAY-14..18 come emendate il 2026-08-24),
`docs/reports/2026-08-24-lir-layout-slice1b.md` §10.4 (i due difetti misurati),
`components/editor-v2/hooks/useHistory.ts`, e `docs/claude-code-log.md`. Conflitti con CLAUDE.md
o col registro: segnalare e fermarsi. Nessun file in critical zone è previsto (`useJjomSync.ts` e
`canvasToJjom.ts` non si toccano); se la discovery dice il contrario, dirlo all'hard stop.

## COSA

L'undo di editor-v2 in modalità JjOM non funziona per i gesti di disposizione, per costruzione.
Il §10.4 del LIR della 1b ha misurato due cause: lo snapshot della storia di sessione è preso a
**fine** gesto (`EditorV2.tsx:3489-3490`, dentro `if (hasDragEnd || hasResize)`), quindi il primo
⌘Z ripristina uno stato in cui il nodo si è già mosso (sfasamento di uno); e `handleUndo`
(`:2359-2391`) riscrive solo nodi e archi React Flow più una riconciliazione dei soli attributi
(`reconcileJjomAfterUndoRedo`, `canvasToJjom.ts:1663`), senza toccare la geometria nel D-layer,
che la ri-trasformazione continua (R-LAY-18) riporta subito sul valore persistito.

A questi due se ne aggiunge un terzo, letto in chat e da misurare: **due sistemi di undo possono
scattare sullo stesso ⌘Z**. `Navbar.tsx:198` registra un `keydown` su `document` che, nei
contesti `METAMODEL_EDITOR` e `PROJECT_EDITOR` (`:1190-1195`), esegue `UndoAction.new(1, user,
false).commit()`, cioè l'undo del D-layer; il pannello di editor-v2 gestisce ⌘Z in un `onKeyDown`
React (`:2511-2513`) con `preventDefault()` ma **senza `stopPropagation()`**. React 18 ascolta sul
root container, che sta sotto `document`: se il contesto rilevato è uno dei due, un ⌘Z nella tela
fa partire la storia di sessione **e** l'`UndoAction`. E l'undo del D-layer non è quello che
sembra: a `reducer.ts:1209` ogni delta che tocca `vertexs`, `graphvertexs`, `graphelements`,
`edgepoints`, `edges` o `graphs` viene **sempre fuso nel delta undoable precedente**, quindi nel
D-layer la geometria non forma mai un passo di undo proprio e un `UndoAction` disfa l'ultimo
cambiamento «rilevante» (una rinomina, un attributo) trascinandosi tutta la geometria dopo di
esso.

Il perimetro di questo fronte è editor-v2. La regola di merge del reducer è **core** e resta
com'è: si dichiara, non si tocca (CLAUDE.md, «no modifiche al core senza discussione»).

## FASE 1 (read-only): discovery e misura

Report obbligatorio: `docs/discovery/discovery_2026-08-24_undo_editor_v2_layout.md`. Contenuto
minimo, con citazioni `file:riga` correnti e controllo positivo di ogni grep:

1. **Il doppio undo.** `detectCurrentContext()` (`utils/keyboardShortcuts.ts`) restituisce
   `METAMODEL_EDITOR` o `PROJECT_EDITOR` con editor-v2 aperto? Ordine di esecuzione tra il
   listener su `document` e l'`onKeyDown` React sul pannello; se `stopPropagation()` nel gestore
   React basta a fermare il listener di `Navbar`. Esito: «doppio undo reale» o «non raggiungibile»,
   con la prova. Se è reale, misurare anche cosa fa oggi un ⌘Z dopo un drag: quale delta del
   D-layer viene disfatto (la regola di `reducer.ts:1209`; `git log -L` o `blame` sulla riga per
   datarla e capirne il motivo, senza proporre di cambiarla).
2. **Snapshot a inizio gesto.** I call site di `takeSnapshot` sono più di trenta: interessano
   solo i due gesti di disposizione (drag e resize) in `handleNodesChange`. Misurare quali
   callback React Flow 12.10.2 offrono un «inizio gesto» affidabile: `onNodeDragStart` sul
   componente `<ReactFlow>` (`:3815`) per il drag, multi-selezione inclusa; per il resize il
   primo `{type:'dimensions', resizing: true}` per gesto in `onNodesChange`, oppure
   `onResizeStart` del `NodeResizer` nei componenti nodo (più siti, sconsigliato). Verificare che
   `onNodeDragStart` non sia già usato con un altro scopo.
3. **Write-back della geometria.** Dopo `setNodes(state.nodes)` in `handleUndo`/`handleRedo`,
   la geometria ripristinata va scritta nel D-layer **attraverso il resolver**, cioè con le
   funzioni esistenti di `canvasToJjom.ts`: `syncPositionBatchToJjom` per le posizioni,
   `syncSizeBatchToJjom` per i nodi che nello snapshot hanno `width`/`height`,
   `syncSizeResetToJjom` per quelli che non li hanno più. Misurare: cosa confrontare (snapshot
   contro `getNodes()` corrente, prima del `setNodes`), l'interazione con l'anti-bounce
   (`markCanvasUpdated`, 300 ms: il write-back porta il D-layer sul valore ripristinato, quindi
   la ri-trasformazione successiva concorda, e la finestra serve solo a non far vincere un patch
   stantio), e `scheduleLayoutSave()` a valle perché l'undo sopravviva al reload.
4. **Storia e chiave di layout.** Lo snapshot contiene nodi resi sotto la chiave in forza al
   momento del gesto; ripristinarlo sotto un'altra chiave scriverebbe la geometria di `A` nel
   record di `B`. Misurare come EditorV2 può osservare il cambio di chiave (`getLayoutKeyOf`
   dell'adapter in un `useSelector`) e cosa costa aggiungere `clear()` a `useHistory` (metodo
   nuovo sull'interfaccia, ammesso). Politica proposta, da confermare: **la storia si azzera al
   cambio di chiave**; l'undo non attraversa un cambio di layout, dichiarato.
5. **Redo** simmetrico e i pulsanti della toolbar (`:3956-3957`) che passano dagli stessi
   handler. **Modalità non JjOM** (`isJjomMode` falso): invariata, dichiararlo.
6. **Impatto per layer**, rischi, piano dei diff file per file (attesi: `EditorV2.tsx`,
   `useHistory.ts`; Regola 19 se ne emergono altri).

**Hard stop: report committato (`git add` del solo file) ed esposto in chat. Fase 2 solo dopo
il GO esplicito di Alfonso.**

## FASE 2 (dopo il GO): implementazione

Design proposto; la discovery può correggerlo, il GO lo fissa.

1. **`EditorV2.tsx`, snapshot a inizio gesto.** `onNodeDragStart` su `<ReactFlow>` chiama
   `takeSnapshot()` una volta per gesto; in `handleNodesChange` il primo
   `{type:'dimensions', resizing: true}` per gesto chiama `takeSnapshot()` (guardia con un
   `useRef` azzerato quando arriva `resizing: false`). Il `takeSnapshot()` di `:3490` viene
   rimosso, perché è quello sbagliato nel tempo; ogni altro call site resta com'è.
2. **`EditorV2.tsx`, write-back in `handleUndo` e `handleRedo`.** Prima del `setNodes`,
   confrontare `state.nodes` con `getNodes()`: per ogni nodo con posizione diversa, un'entry per
   `syncPositionBatchToJjom`; per ogni nodo con `width`/`height` nello snapshot e diversi (o
   assenti) nel corrente, un'entry per `syncSizeBatchToJjom`; per ogni nodo senza
   `width`/`height` nello snapshot ma con essi nel corrente, `syncSizeResetToJjom`. Solo in
   `isJjomMode`. Poi `scheduleLayoutSave()`. Le tre funzioni leggono la chiave in forza da sole:
   nessuna nuova firma.
3. **`EditorV2.tsx`, un solo undo per ⌘Z.** Se la Fase 1 conferma il doppio undo:
   `event.stopPropagation()` accanto al `preventDefault()` nei due rami di undo e redo
   dell'`onKeyDown` del pannello. Lato editor-v2, nessuna modifica a `Navbar.tsx`.
4. **`useHistory.ts`**: `clear()` che azzera `past` e `future`. **`EditorV2.tsx`**: un
   `useSelector` su `getLayoutKeyOf(state)` e un `useEffect` che chiama `clear()` quando la
   chiave cambia (non al mount).

### Non-obiettivi (dichiarati, non risolti)

- La regola di merge di `reducer.ts:1209` e in generale l'undo del D-layer: core, fuori.
- Il ⌘Z che richiede il fuoco nella tela e non scatta su `INPUT`/`SELECT`: UX preesistente.
- L'undo del cambio di layout (non è un gesto), gli archi (`irEdgeLayout`, waypoints) oltre a
  quello che la storia di sessione già ripristina, la modalità non JjOM, il renderer classico.

### Gate

`tsc` byte-identico alla baseline (33), vitest 1349 passed con le stesse 9 suite rosse, build
exit 0, `check:docs`. `useHistory.clear()` si testa senza DOM se un test del hook esiste già;
altrimenti si dichiara.

### Verifica visiva (Alfonso, hard refresh)

1. Sposta un nodo, ⌘Z una volta: torna esattamente dove stava. Nessuno sfasamento di uno.
2. Reload: resta dove l'undo l'ha rimesso (il write-back è passato dal resolver ed è salvato).
3. Ridimensiona un nodo, ⌘Z: torna alla taglia di prima; reload: persiste. ⌘⇧Z: la taglia
   nuova torna.
4. Rinomina un attributo, poi sposta un nodo, poi ⌘Z: si disfa **solo** lo spostamento, la
   rinomina resta. Se sparisce anche la rinomina, il doppio undo è ancora vivo.
5. Sotto `A` sposta un nodo, passa a `B`, ⌘Z: non succede niente, `B` è intatto; torna ad `A`:
   il nodo è dove l'hai lasciato (la storia si è azzerata al cambio di chiave).
6. Multi-selezione: sposta tre nodi insieme, ⌘Z: tornano tutti e tre.

### Chiusura

Entry in `docs/claude-code-log.md` dopo la verifica visiva; commit `fix(editor-v2): ...` con
`git add` dei soli file toccati. Righe candidate per il registro, da ratificare in chat: l'undo
di editor-v2 è una storia di sessione per chiave di layout con write-back per resolver, che non
attraversa un cambio di layout; l'undo del D-layer non è raggiunto da editor-v2 e la regola di
`reducer.ts:1209` è dichiarata come vincolo del core.
