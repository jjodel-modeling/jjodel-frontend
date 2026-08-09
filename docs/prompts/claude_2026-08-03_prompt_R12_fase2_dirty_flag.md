# Prompt Claude Code — R12 Fase 2 (ridotta): dirty flag sugli edit inline dei nodi IR

**Data**: 2026-08-03 23:54
**Tipo**: fix. **Fase 2** di un two-phase. La Fase 1 e' chiusa: discovery piu' verifica runtime, commit `3fee6947c` (docs only).
**Branch**: `alfonso-frontend-jjtl`. **Critical zone**: nessuna.

Questo prompt **sostituisce** la Fase 2 del documento `2026-08-03 17:10 prompt_R12_undo_dirty_edit_inline_ir`, che prevedeva anche uno snapshot per l'undo del canvas. Quella parte e' **ritirata**: vedi la sezione "D1 chiuso in negativo". Se trovi in giro la versione precedente, questa ha precedenza.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

## Cosa ha stabilito la Fase 1

### D2 verificato a runtime, non per plausibilita'

Marcare `U.isProjectModified = true` dal canvas **e' sufficiente** a far comparire il warning di uscita. Verificato con due probe Playwright guidate dagli helper dello smoke harness (stesso seed, stessi timing, stesso viewport):

- **Probe 1**: il handler `beforeunload` e' installato sia con progetto aperto senza tab, sia con canvas tab aperto. `U.beforeUnloadHandler` risulta set in entrambi gli stati, con listener live confermati da strumentazione di `addEventListener` prima di ogni script dell'app. Aprire il canvas **non** smonta `ProjectEditor`.
- **Probe 2**: `page.close({ runBeforeUnload: true })` con canvas attivo. Controllo negativo con flag `false`: zero dialoghi. Test con flag `true` scritto dalla pagina: un dialogo `beforeunload`.
- **Rappresentativita'**: `joiner/index.ts:134` e' `export var U = windoww.U`, quindi l'export **e'** l'oggetto globale. La scrittura su `window.U` ha fatto scattare il handler, che legge dalla propria closure sulla classe in `common/U.tsx:231`. Stesso oggetto scritto e letto, ed e' quello che questo fix ottiene importando `U` da `joiner`.

### D1 chiuso in negativo: NIENTE snapshot

**Non aggiungere `takeSnapshot()` in questo fix, ne' ora ne' come miglioria.** Il rationale va capito, altrimenti qualcuno lo riaggiunge per completezza:

`useHistory` (`hooks/useHistory.ts:23-70`) fotografa `nodes` ed `edges` di React Flow via `JSON.parse(JSON.stringify(getNodes()))`. Un edit inline di un valore cambia un `DValue` in Redux e **non tocca quelle strutture**: i valori degli slot non vivono in `node.data`, li legge `IRNodeContent` a render-time via `readCtx` da `idlookup`. Uno snapshot preso prima dell'edit sarebbe identico allo stato dopo l'edit, e l'undo del canvas ripristinerebbe strutture gia' uguali. Anche se i valori fossero in `node.data`, l'undo scriverebbe su React Flow e non su Redux, e il primo re-render li risovrascriverebbe dalla fonte.

L'undo del canvas e' un undo di **layout**. Non puo' annullare un edit di **modello**, per costruzione. Aggiungere lo snapshot significherebbe committare una riga inerte che il prossimo lettore interpreterebbe come garanzia di annullabilita'.

L'unificazione dei due sistemi di undo resta fuori scope, come gia' dichiarato.

## COSA

In `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`, nei due soli handler di commit:

- `commitRowEdit` (circa `:123-128`, chiama `syncUpdateFeatureValue`)
- `commitLabelEdit` (circa `:130-135`, chiama `syncNodeLabel`)

marcare il progetto come modificato **dopo** la chiamata di scrittura, e **solo nel ramo in cui la scrittura avviene davvero**.

Punti da rispettare:

1. **Leggi entrambi gli handler per intero prima di editare.** Se hanno una guardia che evita la scrittura quando il valore non e' cambiato (entrare in edit e uscire senza modificare), la marcatura deve stare **dentro** il ramo che scrive, non prima della guardia. Un progetto marcato dirty da un edit che non ha modificato nulla e' un falso positivo che produce warning di uscita ingiustificati.
2. **Import di `U`**: verifica se `U` e' gia' importato in questo file. Se si', riusa l'import esistente. Se no, aggiungilo seguendo il pattern degli altri import del file, da `joiner` (`joiner/index.ts:134` esporta `U`). Non importare da `common/U` direttamente se il resto del codebase passa da `joiner`: verifica il pattern locale prima di scegliere.
3. **Forma della scrittura**: `U.isProjectModified = true`. Verifica prima come lo fanno i due call site applicativi esistenti, `MetamodelTab.tsx:150-151` e `ProjectEditor.tsx:486`, e allineati alla loro forma. Se esiste un helper o una facciata invece dell'assegnazione diretta, usa quello.
4. **Non introdurre un salvataggio.** Marcare dirty abilita il warning di uscita; innescare un save e' un'altra cosa. In particolare **non** chiamare `scheduleLayoutSave()`: e' gated su `user.autosaveLayout !== false` e riguarda il layout, non i dati del modello.

## DOVE (lista chiusa)

| File | Intervento |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | i due handler di commit, piu' eventuale import di `U` |

**Un solo file.** Qualsiasi altro: STOP e segnala. In particolare non toccare `canvasToJjom.ts`, `useHistory.ts`, `useLayoutAutosave.ts`, `U.tsx`, `EditorV2.tsx`, `events/registry.ts`.

## Fuori scope, esplicito

- Nessuno snapshot per l'undo (vedi sopra).
- Nessuna unificazione dei due sistemi di undo.
- Nessun cambio del write path: `syncUpdateFeatureValue` e `syncNodeLabel` restano quelli.
- Nessun tocco al gate di editabilita' (`irCompile.ts:308-310`, `IRNodeContent.tsx:196`, `:215`, `:257`).
- Le righe row-dispatch restano read-only per contratto (`IRRow.tsx:4`): non estendere il fix a `IRRow`.
- L'anomalia dei due listener `beforeunload` registrata in §7.4 del report di Fase 1 (la guardia di idempotenza a `U.tsx:226` non tiene, probabile doppio mount in dev) **non** si tocca qui.

## Vincoli

- Diff minimale: sono attese poche righe. Zero refactoring opportunistico, mai rinominare identificatori esistenti.
- Attenzione al WIP nel working tree (lane TextStyle, materiale del paper, piu' quanto lasciato da R8 se non ancora committato). `git add` puntuale del solo file toccato piu' il log, mai `git add .`.

## Gate automatici

1. `npx tsc --noEmit`: stesso set di errori della baseline, diff vuoto.
2. `npx vitest run`: tutti verdi.
3. `npm run build`: exit 0.

## Verifica visiva (la esegue Alfonso, hard stop prima del commit)

1. **Il caso che conta**: apro un progetto, faccio un edit inline su un nodo IR (rinomino una label oppure cambio il valore di un attributo in una riga), poi chiudo la tab del browser. Compare il warning di uscita.
2. **Controllo negativo**: apro un progetto, non modifico nulla, chiudo la tab. Nessun warning.
3. **Ciclo completo**: edit inline, poi salvataggio esplicito (Ctrl+S o toolbar), poi chiudo la tab. Nessun warning, perche' il flag e' azzerato in `SaveManager.ts:34`.
4. **Falso positivo**: entro in edit su una label, esco senza modificare nulla, chiudo la tab. Nessun warning. Se compare, la marcatura e' finita fuori dal ramo che scrive.
5. **Non regressione**: l'edit inline continua a scrivere correttamente. Il valore modificato persiste dopo un reload.

## Chiusura

Un solo commit dopo la conferma visiva: `fix: mark project dirty on IR inline edits`.

Entry in `docs/claude-code-log.md` con tipo `fix`, che cita **anche** la chiusura in negativo di D1 (nessuno snapshot, con il motivo in una riga), cosi' resta a verbale perche' non c'e':

```
**Nome del documento prompt**: 2026-08-03 23:54 prompt_R12_fase2_dirty_flag
```

Nessun push senza go-ahead.
