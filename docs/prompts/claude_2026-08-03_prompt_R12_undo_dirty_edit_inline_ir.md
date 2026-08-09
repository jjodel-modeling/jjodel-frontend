# Prompt Claude Code — R12: undo e dirty flag sugli edit inline dei nodi IR

**Data**: 2026-08-03 17:10
**Tipo**: fix. **Two-phase**: Fase 1 discovery breve read-only con report obbligatorio e hard stop, Fase 2 solo dopo go-ahead di Alfonso.
**Branch**: `alfonso-frontend-jjtl`. **Critical zone**: nessuna. `canvasToJjom.ts` e' critical-adiacente: sola lettura in Fase 1, e in Fase 2 non va modificata.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

## Contesto (dalla discovery 2026-08-03, non ridiscutere)

`docs/discovery/discovery_2026-08-03_state_actions_events.md` §2.2 e §2.4 hanno registrato il rischio **R12**:

- `IRNodeContent.tsx:123-128` (`commitRowEdit`) e `:130-135` (`commitLabelEdit`) scrivono via `syncUpdateFeatureValue` e `syncNodeLabel`, entrambi write path canonici corretti, ma **non chiamano `takeSnapshot()`**. L'undo del canvas (`hooks/useHistory.ts:23-70`, snapshot locali di nodes/edges) e' alimentato manualmente dai gesture handler di `EditorV2.tsx` (circa 15 siti). Gli edit inline IR non sono fra quelli.
- **`TRANSACTION` non marca il progetto dirty**: `U.isProjectModified` (`common/U.tsx:211`) non e' toccato da nessuna azione Redux. Grep su `isProjectModified` in `action.ts`, `reducer.ts`, `classes.ts`: zero occorrenze. I soli siti applicativi che lo impostano sono `MetamodelTab.tsx:150-151` e `ProjectEditor.tsx:486`.

Effetto utente: modifico il valore di un attributo o rinomino un nodo direttamente sul canvas IR, e (a) l'undo del canvas non lo annulla, (b) chiudendo la tab non ricevo il warning `beforeunload` (`U.tsx:225-238`) perche' il progetto non risulta modificato.

Nota: l'edit **e'** annullabile dall'undo Redux, che e' un sistema separato e non sincronizzato con quello del canvas. Il fix non deve unificare i due sistemi di undo: e' un lavoro diverso e molto piu' grande.

---

# FASE 1 — Discovery breve (read-only)

Due incognite bloccano la scrittura del fix. Rispondi a entrambe leggendo il codice, senza modificarlo.

## D1 — Come raggiungere `takeSnapshot` da `IRNodeContent`

`takeSnapshot` e' restituito da `useHistory` (`components/editor-v2/hooks/useHistory.ts`), consumato in `EditorV2.tsx`. `IRNodeContent` e' un componente figlio montato dentro `ObjectNode`, che a sua volta e' un node type di React Flow.

Stabilisci, con `file:riga`:

- se esiste gia' un context React, un provider o un canale che esponga `takeSnapshot` (o l'intero handle di history) ai discendenti del canvas;
- in assenza di context, quali canali il progetto gia' usa per lo stesso tipo di problema. Il pattern canonico documentato in `CLAUDE.md` §8.7 e' il CustomEvent con registry a `events/registry.ts`. Verifica se esiste gia' un evento adatto, o se ne servirebbe uno nuovo (in quel caso, grep di collisione sul nome candidato);
- come fanno oggi gli altri punti di scrittura **fuori** da `EditorV2` che devono entrare nella history, se esistono. Se non esistono, dillo esplicitamente: significa che `IRNodeContent` sarebbe il primo, e la scelta del canale e' una decisione di Alfonso, non tua.

**Non implementare nessuna delle strade.** Riporta quelle praticabili con il costo di ciascuna.

## D2 — Come marcare il progetto dirty

- Verifica la forma esatta di `U.isProjectModified` (campo statico? getter?) e come lo impostano i due call site applicativi (`MetamodelTab.tsx:150-151`, `ProjectEditor.tsx:486`).
- Verifica se esiste un helper o una facciata invece dell'assegnazione diretta. Se non esiste, dillo.
- Verifica se `scheduleLayoutSave()` (`hooks/useLayoutAutosave.ts:23`) sarebbe **appropriato** qui oppure no. Attenzione: si chiama layout autosave ed e' gated su `user.autosaveLayout !== false` (`:36-40`); un edit di dato del modello non e' layout. Riporta cosa fa realmente (chiama `ProjectsApi.save`, quindi salva tutto, non solo il layout) e se il gate sarebbe semanticamente sbagliato per questo caso. E' esattamente il tipo di dettaglio su cui serve la tua lettura, non la mia ipotesi.
- Stabilisci se marcare dirty sia sufficiente o se serva anche innescare un salvataggio. Sono due cose diverse: la prima abilita il warning di uscita, la seconda scrive su disco.

## Report OBBLIGATORIO (Fase 1)

Salva in `docs/discovery/discovery_<data-di-esecuzione>_r12_undo_dirty_edit_inline.md`, formato `YYYY-MM-DD`. Crea la cartella se non esiste.

Contenuto minimo: obiettivo, file letti con path completi, risposta a D1 e D2 con `file:riga`, strade praticabili con costo, rischi, domande aperte per Alfonso.

**HARD STOP dopo il report.** Torna in chat col contenuto. La scelta del canale la fa Alfonso.

Puoi committare il solo file del report con `git add` mirato, messaggio `docs: discovery on undo and dirty flag for IR inline edits`, piu' l'entry di log.

---

# FASE 2 — Fix (solo dopo go-ahead esplicito)

Da eseguire **solo** quando Alfonso ha scelto il canale per D1 e la strategia per D2. Fino ad allora questa sezione non e' un mandato.

## COSA

In `IRNodeContent.tsx`, nei due soli punti `commitRowEdit` (`:123-128`) e `commitLabelEdit` (`:130-135`):

1. snapshot per l'undo del canvas **prima** della scrittura, con il canale scelto;
2. marcatura dirty del progetto, con la strategia scelta.

L'ordine conta: lo snapshot deve fotografare lo stato **precedente** all'edit, altrimenti l'undo riporta allo stato gia' modificato.

## DOVE (lista chiusa)

| File | Intervento |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | i due handler di commit |
| `frontend/src/events/registry.ts` | **solo se** il canale scelto e' un CustomEvent nuovo |
| `frontend/src/components/editor-v2/EditorV2.tsx` | **solo se** serve il listener del nuovo evento |

Qualsiasi altro file: STOP e segnala. In particolare **non toccare** `canvasToJjom.ts`, `useHistory.ts`, `useLayoutAutosave.ts`, `U.tsx`.

## Vincoli

- Non unificare i due sistemi di undo. Fuori scope, dichiarato.
- Non cambiare il write path: `syncUpdateFeatureValue` e `syncNodeLabel` restano quelli.
- Non toccare il gate di editabilita' (`irCompile.ts:308-310`, `IRNodeContent.tsx:196`, `:215`, `:257`).
- Le righe row-dispatch restano read-only per contratto (`IRRow.tsx:4`): non estendere il fix a `IRRow`.
- Zero refactoring opportunistico, mai rinominare identificatori esistenti, grep di collisione per ogni nome nuovo.
- Attenzione al WIP nel working tree (lane TextStyle: `ObjectNode.tsx`, `LabelEntryEditor.tsx`, `TextStyleEditor.tsx`, `irStyle.ts`, `TextStyleField.tsx`, piu' `MegamodelView.tsx`, `_form-system.scss` e il materiale del paper). Non toccarlo, non committarlo. `git add` puntuale per file, mai `git add .`.

## Gate automatici

1. `npx tsc --noEmit`: stesso set di errori della baseline, diff vuoto.
2. `npx vitest run`: tutti verdi.
3. `npm run build`: exit 0.

## Verifica visiva (la esegue Alfonso, hard stop prima del commit)

1. Nodo IR con label intrinseca editabile: rinomino inline, poi undo del canvas. La label torna al valore precedente.
2. Riga di compartimento con segmento `value` editabile su un attributo: cambio il valore, poi undo. Il valore torna indietro.
3. Dopo un edit inline, chiudo la tab del browser: compare il warning di uscita.
4. Un edit fatto dal pannello Properties (non inline) continua a comportarsi come prima: nessuna regressione.
5. Undo Redux dopo un edit inline: comportamento invariato rispetto a oggi, nessuna doppia annullazione.

## Chiusura

Un solo commit dopo la conferma visiva: `fix: snapshot and mark project dirty on IR inline edits`. Entry in `docs/claude-code-log.md` con tipo `fix` e il nome di questo documento prompt:

```
**Nome del documento prompt**: 2026-08-03 17:10 prompt_R12_undo_dirty_edit_inline_ir
```

Nessun push senza go-ahead.
