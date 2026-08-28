# Sessione 2026-08-26 (singleton): il singleton come valore del linguaggio, commit A chiuso, B in discovery

**Superficie**: Cowork con `~/jjodel` connessa; registro, prompt e questo checkpoint scritti dal
bridge; commit da Claude Code per pathspec; verifica visiva di A fatta da Alfonso (9/9).
**Branch**: `alfonso-frontend-jjtl`. **HEAD a fine sessione**: `1ef180323`, allineato a origin
(push fatto). Nel working tree restano `StatusBar.*` e `featureSignature.ts`, non di questo fronte,
più i prompt untracked `_2330_` del 24 e `_1230_` del 25. **Questo checkpoint sostituisce**
`sessione_CORRENTE.md` (versione 2026-08-25 symbol).

---

## Stato a fine sessione

| Commit | Contenuto |
|---|---|
| `4b18c349f` | docs: serie R-SGL 1-9 in `decisions.md`, report di discovery A, due prompt |
| `c824dc237` | **feat(m1)**, commit A: 8 file. `MetaclassInfo.isSingleton?`, filtro nei sei siti di editor-v2 (`rootableClasses`, palette IR extra, drop, container, figli di composizione, connect gesture) e in JjScript `create instance`; `isSingleton` nella firma di reattività di `useEditorMode`; stereotipo tolto dall'istanza (`ObjectNode`, entrambi i rami); `LModelElement`: `_removeSingletonInstances` (archi → vertice → oggetto, per ogni istanza, dentro la `TRANSACTION` del writer), token di rientranza per oggetto nel guard di `LObject.get_delete`, agganciato a `set_singleton`, `set_final(false)`, `set_sealed`; guard di accensione per modello (R-SGL-8) |
| `957516083` | docs: due entry di log (discovery A, implementazione A) |
| `1ef180323` | docs: R-SGL-9(f), prompt di discovery B |

**Commit B** (R-SGL-4, select sulle righe reference): discovery fatta, report
`docs/discovery/discovery_2026-08-26_singleton_reference_select.md` (687 righe, untracked al
momento del checkpoint), nove domande in §10 in attesa di risposta. Fase 2 non ancora scritta.

---

## Decisioni prese (tutte in `docs/decisions.md`, serie R-SGL)

- **R-SGL-1**: il singleton è un valore del linguaggio; classe non instanziabile per nessuna via.
- **R-SGL-2** (emendata): istanza segue il flag; spegnimento rimuove tutte le istanze con vertice e
  archi; bypass del guard con token per oggetto (l'ordine flag-poi-delete non funziona: le azioni si
  accodano fino a `FINAL_END`); ramo di creazione del toggle tenuto come fallback.
- **R-SGL-3**: stereotipo «singleton» solo su `ClassNode`.
- **R-SGL-4**: con singleton nascosti, riga reference singleton-conforme editabile con select;
  select singola anche per reference a molti (aggiunge).
- **R-SGL-5**: due commit `feat`, A e B.
- **R-SGL-6**: sei filtri + JjScript; `concreteSubclasses` non filtrato (serve alla conformità).
- **R-SGL-7**: tre writer del flag; un solo undo vale per lo spegnimento, non per l'accensione.
- **R-SGL-8**: guard di accensione per modello (`DClass.instances` è piatto sul progetto).
- **R-SGL-9**: registrati non chiusi: (a) rootable divergente L-layer/editor-v2, chip «Rootable»
  vince sul singleton; (b) JjScript `set .singleton` scrive il campo sbagliato; (c) riparazione
  all'apertura di un M1 senza istanza; (d) duplicate/paste senza `DObject`; (e) `Dummy.ts:254`
  scrittura morta, commento falso in `canvasToJjom.ts:449-455`; (f) la cascata non raggiunge gli
  archi M1.

---

## Bug nuovi / Todo

**Alta**
1. **Rispondere alle nove domande di B** (§10 del report) e scrivere la Fase 2. Proposte della chat
   in coda a questo file.
2. **(β) coerenza della soppressione in `useJjomSync`** (report B §6): l'incrementale filtra gli
   archi su `subElementIds` (`:1302`) e non su `isSingletonSuppressed`; il ramo `hide` del toggle
   non fa `setEdges`; il ramo `show` non rifà gli archi esclusi in init (serve reload); il guard
   `isSingletonSuppressed(objId)` a `:670` e `:764` confronta id di DObject con un Set di DVertex
   (sempre falso). Fronte suo, critical zone, LIR. Da aprire subito dopo B.
3. **R-SGL-7 debito**: accensione del flag a due passi di undo (`setTimeout` in `addObject` fase 4,
   `LModelElement.tsx:7062`).

**Media**
4. R-SGL-9 (a)-(f), sopra.
5. `check:docs` rosso per 9 errori su entry altrui (2026-08-03..26): non ripulire per far tornare il
   verde, serve un passaggio dedicato.
6. `StatusBar.*` e `featureSignature.ts` non committati: decidere il destino prima di altri fronti.

---

## Prompt generati per Claude Code

| Prompt | Esito |
|---|---|
| `claude_2026-08-26_1435_prompt_singleton_discovery_A.md` | ✅ report scritto, hard stop rispettato |
| `claude_2026-08-26_1555_prompt_singleton_faseA_impl.md` | ✅ `c824dc237`, LIR con ACK, 9/9 visivo |
| `claude_2026-08-26_1720_prompt_singleton_discovery_B.md` | ✅ report scritto, hard stop; Fase 2 da scrivere |

---

## Proposte della chat sulle nove domande di B (da confermare)

Q1 B solo IR; con viewpoint classic la reference verso un singleton nascosto resta non
assegnabile. Q2 sì, `concreteSubclasses.length > 0`. Q3 `useEffect` su `modelid` che rissemina il
mirror. Q4 due passi di undo accettati (come il pannello Slots). Q5 (α) per B, (β) fronte suo
subito dopo. Q6 R-SGL-9(g), entra in (β). Q7 portal su `body`, copiando un precedente in-repo se
esiste. Q8 componente nuovo `InlineObjectSelect`, clone di `InlineEnumSelect`, senza toccare quello
in produzione. Q9 una riga in `irStyle.ts`, `cursor: pointer`.

---

## Info strutturali scoperte

- `LValue.set_value` è a `LModelElement.tsx:7803` e `set_values` a `:7707`; a `:4609` c'è
  `LEnumLiteral.set_value`. Su uno slot reference vuoto `.value =` è un no-op (misura del
  2026-07-20, `EditorV2.tsx:1897-1899`); le reference M1 si scrivono con `slot.values = [...]`.
- `syncUpdateFeatureValue` (`canvasToJjom.ts:1472`) non serve per le reference: serve
  `syncSetReferenceValue(vertexId, featureName, targetObjectId, mode: 'replace' | 'append')`.
- Il ramo nativo di `ObjectNode` mostra solo attributi (`:387`); le reference lì sono archi.
- `showEdgeLabels` è il precedente per uno stato mirror EditorV2 → `EditorContext` → nodi
  (`EditorV2.tsx:642`).
- `getMetaclassInfo` non è memoizzato: mai per render. Il Set dei tipi singleton-conformi si
  deriva una volta in EditorV2 da `modeInfo`.
- `.ir-node-content` ha `overflow: hidden` (`irStyle.ts:72`), `.mm-node` no (commentato,
  `EditorV2.scss:1625`); `diamond`/`cylinder` rimettono `visible`.
- `suppressedSingletonIds` contiene id di **DVertex**; `useJjomSync` filtra correttamente solo in
  init (`:1211`, su `nodeCache`).
- Il canale per trovare i vertici di un oggetto è la scansione di `idlookup` con
  `className.includes('Vertex')` (toggle e `isVertexClassName`), non `=== 'DVertex'`
  (`findVertexIdForObject`): i due precedenti divergono.
- `TRANSACTION`: le azioni si accodano fino a `FINAL_END` (`action.ts:329`, `:153`);
  `U.liveStateChanges` è `false`; dentro una transazione `c.data` è lo stato committato.
- Il bridge Cowork non può cancellare file nella cartella connessa: un `git status` dal bridge può
  lasciare `.git/index.lock`; si rimuove a mano.

---

## Cronologia

Alfonso apre con tre punti sui singleton (classe non instanziabile, niente stereotipo sull'istanza,
select sulle righe reference con singleton nascosti). La chat verifica sul repo, chiude quattro
domande (composizione inclusa, rimozione allo spegnimento, sibling = conformi al tipo, select
singola) e classifica il requisito come feature in due commit. Registro R-SGL e prompt di discovery
A; il report smonta tre assunzioni (sei filtri, guard non liberato dall'ordine, tre writer) e trova
la scrittura morta di `Dummy.ts:254`. Emenda R-SGL-2, ratifiche 6-9, Fase 2 con LIR e hard stop;
Claude Code chiede e ottiene tre deroghe (scansione `idlookup`, archi inclusi, simmetria del
filtro), corregge una guardia mancante nel prompt, consegna A; 9/9 visivo, log, push. Prompt di
discovery B; il report trova che il ramo nativo non ha righe reference, che `.value` è un no-op
sugli slot vuoti, e che la soppressione dei singleton è incoerente in `useJjomSync` da prima di B.
Checkpoint qui, con le proposte sulle nove domande in attesa di Alfonso.

---

## Aggiornamento di fine serata (23:50): commit B chiuso

| Commit | Contenuto |
|---|---|
| `1635e8450` | **feat(ir)**, commit B: `syncSetReferenceValue` (`canvasToJjom.ts`), mirror `showSingletons` + `singletonConformTypeIds` + `singletonClassIdsByType` + `modelId` in `EditorContext`, token `feat.type` in `compartmentSig` e `typeId` su `CompartmentRowData`, ramo `selectable` nel `case 'value'` di `IRNodeContent`, `InlineObjectSelect` nuovo (portal su body, `nodrag nowheel`), `cursor: pointer` in `irStyle.ts`. Sei file, non sette: `CompartmentRowData` vive in `IRNodeContent.tsx:98`. Candidati da `DModel.objects` (solo radici), non da `o.model` (getter L, assente sul raw). |
| `5d9ea54fa` | **fix(ir)**: span vuoto a larghezza zero, `display: inline-block; min-width: 1.5em` su `--editable`, placeholder `…` via `:empty::after` in `var(--text-dim)` su `--select`. |
| `a207f1bbe` | commit di un'altra sessione che ha raccolto anche le due entry di log di B (`git add docs/claude-code-log.md` su file condiviso, rule 17); Claude Code non ha riscritto la storia. |

**Verifica visiva** (11/11): 1-5 e 9 dalla chat via Chrome prima del fix; 2 bis, 6, 7, 8 dalla chat
dopo il fix; 10 da Alfonso (rombi). Undo: **due passi**, prima l'arco poi il valore. Console muta
in tutti i passaggi. La prima prova di Alfonso era fallita per fixture: la view aveva il
compartimento `source: children` (dispatch, read-only, senza segmento `value`); corretto in
`references` con `name`, `" = "`, `value`. **La view corretta va salvata (File > Save)** o al reload
torna `children`.

**Fronte (β), quattro voci, numero di partenza misurato**:
1. *hide*: archi RF 9 → 7 senza `setEdges`, React Flow scarta in silenzio gli archi con target sparito.
2. assegnazione con singleton nascosti: valore e `DVoidEdge` scritti, archi RF fermi.
3. *show*: l'arco creato mentre il target era soppresso **non compare** (D-layer 1, RF 0), serve reload (§6.4 del report B, riprodotto).
4. **nuova**: al mount con chiave `false` i nodi singleton erano visibili e il menu senza spunta; la soppressione al mount (`EditorV2.tsx:792-816`) non è scattata, il primo click è finito nel ramo `show` a vuoto. Probabile ordine fra quell'effetto e l'init di `useJjomSync`.
Più R-SGL-9(g) (`isSingletonSuppressed(objId)` sempre falso). Critical zone, LIR, discovery propria.

**Nota di processo**: due sessioni di Claude Code hanno lavorato in parallelo sullo stesso working
tree (HMR su `UnifiedEdge.tsx` e altri durante la verifica di B, commit `a207f1bbe`); `git add` per
path su file condivisi raccoglie il lavoro altrui. Da tenere in conto quando si apre β.

**Convenzione nuova (26/8)**: ogni prompt, GO o ACK per Claude Code chiude la risposta con l'etichetta
in grassetto «Prompt per Claude Code:»; brevi in blocco mono, lunghi come path in `docs/prompts/`.
Alfonso la aggiunge alle istruzioni del progetto.

**Prossimi passi**: push; prompt di discovery β (quattro voci sopra, `useJjomSync.ts` +
`EditorV2.tsx` toggle e mount, con LIR); decidere il destino di `StatusBar.*` e `featureSignature.ts`.
