# GO emendato: R-VP slice 1, Fase 2

**Data**: 2026-09-03 23:20
**Prompt di riferimento**: `docs/prompts/claude_2026-09-03_2224_prompt_rvp_slice1_manager_section.md`
**Referto**: `docs/discovery/discovery_2026-09-03_rvp_slice1_manager_section.md` (Fase 1 chiusa)
**Ratifiche**: R-VP-1..13 ora in `docs/decisions.md` (sezione «Serie R-VP») e nel memo
`docs/ratifiche/claude_2026-09-03_1441_memo_ratifica_viewpoint_vs_annotazioni.md`. La domanda F
del referto è chiusa: le regole sono scritte.

Prima di tutto: **`.git/index.lock` è un residuo del mio commit `4392bc30e` dal bridge desktop**
(stesso secondo, stesso owner della VM). Alfonso lo rimuove a mano dal Mac insieme ai 5
`.git/objects/*/tmp_obj_*`. Fino ad allora non committare: lavora, e committa quando il lock è
sparito. Il referto, il memo, la sezione di `decisions.md` e questo GO sono su disco non committati:
il primo commit di Fase 2 li include, **prima** del commit 1 di codice, come commit docs separato:
`docs: R-VP ratifications, discovery report and GO for slice 1`.

## Risposte alle sei domande

**A → A2 (R-VP-9).** `hosts.manager.widgets` vale solo per la form del drawer. Nel docstring di
`FormHostOverride` una riga lo dice: *«`widgets` here reaches the drawer form only; the manager
table does not map rung 0 yet (R-VP-9, slice 1b)»*. Nessun lavoro su `instanceTable.ts` per il
renderer.

**B → fuori (R-VP-10).** `ManagerSpec` è `{ columns?: string[] }` e basta. Colonne non citate:
seguono nell'ordine di oggi, **visibili**. Nessun secondo canale in cui una colonna sparisce
(`InstanceManagerTab.tsx:1527`).

**C → confermata (R-VP-11).** Solo view senza `predicate`, specificità decrescente, warn una volta
per una view con predicato che porta `manager`.

**D → `hosts` (R-VP-12).** `FormSpec.hosts?: { manager?: FormHostOverride }`. Riverifica con
`command grep -rn "\bhosts\b"` che resti solo in commenti prima di scrivere il tipo.

**E → dall'indice (R-VP-11).** `entry.ir.manager` da `index.byMetaclass.get(className)`, nessuna
modifica a `irCompile.ts` né a `CompiledView`.

**F → chiusa.** Regole in `decisions.md`.

## Emendamenti al §3 del prompt

### Commit 1 (`feat: add optional ManagerSpec.columns to class view (R-VP-3, R-VP-10, R-VP-11)`)
- `irTypes.ts`: `ManagerSpec { columns?: string[] }` con docstring (additivo, R-B9, divieto `op`);
  chiave `manager?: ManagerSpec` su `VertexViewIR` accanto a `form?`. Solo su `VertexViewIR`: i
  due `form?: FormSpec` a `:379` e `:469` non ricevono `manager` (il referto dice cosa sono; se uno
  dei due è la view di classe che il manager legge davvero, fermati e dillo).
- `instanceTable.ts`: funzione pura `orderColumns(columns: TableColumn[], spec?: ManagerSpec):
  TableColumn[]`, senza spec restituisce l'input; con `columns` porta in testa le citate
  nell'ordine dato, poi le altre nell'ordine di ingresso; nome inesistente ignorato (il warn sta nel
  chiamante, non nel modulo puro). Grep del nome prima di crearlo.
- `InstanceManagerTab.tsx`: subito dopo `:1501`, prima di `hiddenColumnKeys`: lettura di
  `manager` dalla prima view senza predicato di `index.byMetaclass.get(className)` per specificità
  decrescente (riusa il criterio di `resolveIRView`; se serve una funzione condivisa, estraila
  accanto a `irResolveCore.ts` con grep del nome), `console.warn` una volta per classe se una view
  con predicato porta `manager`, poi `orderColumns`. Commento con la regola di risoluzione R-VP-11.
- Test: `instanceTable.test.ts` (`orderColumns`: spec assente, parziale, nome inesistente, ordine
  duplicato nel citato). Nessun test snapshot.
- Verifica visiva: progetto senza `manager` identico; con `manager.columns` scritto a mano nell'IR
  il manager apre con quelle colonne in testa e le altre dopo, tutte visibili.

**HARD STOP** dopo il commit 1.

### Commit 2 (`feat: add order, labels, hidden and hosts.manager override to FormSpec (R-VP-8, R-VP-12, R-VP-13)`)
- `irTypes.ts`: `order?`, `labels?`, `hidden?`, `hosts?` su `FormSpec`; `FormHostOverride`.
  Docstring di `hidden`: esplicito, l'omissione non nasconde (R-FRM-1). Docstring di `order`:
  la frase di R-VP-13.
- `resolveFormSpec(spec: FormSpec | undefined, host: 'rail' | 'nodeForm' | 'manager')` pura, in un
  file nuovo `formHosts.ts` accanto a `formSections.ts` (grep del nome): merge per chiave, record
  (`widgets`, `features`, `labels`) uniti con l'override che vince per feature; liste (`order`,
  `hidden`, `basic`) sostituite intere se presenti; `theme`/`labelPlacement` sostituiti se presenti;
  per host diverso da `manager` o override assente restituisce il base **senza** `hosts`.
- `IRForm.tsx`: prop nuova opzionale `host?: 'rail' | 'nodeForm' | 'manager'` su `IRFormProps`
  (default `'rail'`; il referto dice che i tre mount passano solo `objectId`: aggiungi `host` nei
  tre mount, un identificatore per mount, nessun altro cambiamento lì). Lo spec passa da
  `resolveFormSpec` a `:182`. `order` riordina `visible` a `:381`, prima di `buildFormSections`,
  mai dentro `describeSlots`. `labels` nel punto in cui la label del campo viene scelta (il referto
  lo indica; se non è unico, fermati).
- `useFormWidgets.ts:420`: `hidden` entra nello stesso `continue` di `features: 'hidden'`.
- `irValidate.test.ts`: caso `hosts.manager.widgets.op` respinto, caso `hosts` accettato.
- Test: `formHosts.test.ts` (override assente → base senza `hosts`; `hidden` toglie; `labels`
  cambia solo la label; `order` parziale → resto in coda nel proprio gruppo; `widgets` in override
  vince per feature senza azzerare le altre; host `rail` ignora l'override).
- Verifica visiva: rail e nodo-form invariati; manager con override scritto a mano applicato
  (campi nascosti, label, ordine dentro la sezione). `widgets` nell'override si vede nel drawer e
  **non** nelle colonne: è atteso (R-VP-9), non un bug.

**HARD STOP** dopo il commit 2. Entry di `docs/claude-code-log.md` dopo la conferma visiva.

## Cosa resta com'era
Tutto il §4 del prompt. In più: nessun tocco a `irCompile.ts`, `irValidate.ts`, `CompiledView`,
`pruneForm` (debito registrato nel memo, non ora).
