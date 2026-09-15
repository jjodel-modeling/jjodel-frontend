# Verifica ancore — U-2, breadcrumb read-only nel blocco parenting

**Data di esecuzione**: 2026-08-09
**HEAD**: `8704221de` (docs: rotate claude-code-log entries beyond 20 to archive)
**Branch**: `alfonso-frontend-jjtl`, 0 commit non pushati
**Prompt**: "2026-08-09 23:28"
**Tipo**: verifica di ancore in sola lettura, non una nuova discovery.

## Obiettivo

La discovery di riferimento (`docs/discovery/discovery_2026-08-08_uniformazione_card_properties.md`,
§D2) è precedente ai commit di voce 5 e voce 6. Questo documento riverifica su HEAD le sei ancore
che U-2 tocca, prima di scrivere qualunque diff.

## Verifica d'ingresso

- `git log --oneline origin/alfonso-frontend-jjtl..HEAD` → **0 commit**.
- `git status --porcelain` → il residuo noto e nient'altro:
  - ` M frontend/src/components/ui/SegmentedControl/SegmentedControl.module.css`
  - ` M frontend/src/styles/tokens.css`
  - `?? docs/_to_delete/`
  - `?? docs/discovery/discovery_2026-08-08_property_card_segmented_control.md`
- **Nessuno dei due CSS modificati è `viewParenting.scss`**: la condizione di HARD STOP del prompt
  non scatta. Il file che U-2 modifica è pulito rispetto a HEAD.

## File letti (path completi)

| File | Righe | Ruolo nella verifica |
|------|-------|----------------------|
| `frontend/src/components/viewParenting/viewParentingOptions.ts` | 83 | ancora 1 |
| `frontend/src/components/viewParenting/ViewParentingFields.tsx` | 141 | ancora 2 |
| `frontend/src/components/viewParenting/viewParenting.scss` | 151 | target dell'override scoped |
| `frontend/src/components/viewParenting/__tests__/viewParentingOptions.test.ts` | 100 | ancora 5 |
| `frontend/src/styles/components/_form-system.scss` | 1197-1239 | ancora 3 (skin) |
| `frontend/src/styles/style.scss` | 1-8 | import globale del form-system |
| `frontend/src/components/editors/Info.tsx` | 1286-1293 | ancora 3 (unico consumer) |
| `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` | 4, 108 | host IR |
| `frontend/src/components/editors/views/data/InfoData.tsx` | 27, 284 | host legacy |
| `docs/decisions.md` | 61-65, 204-209 | ancora 6 |

## Esito delle sei verifiche

### 1. `viewParentingOptions.ts` — CORRISPONDE

`ViewParentingFacts` (`:32-44`) espone esattamente i sei campi attesi: `viewpointId`,
`viewpointName`, `fatherId`, `detached`, `parentOptions`, `descendantCount`. **Il nome del padre
non c'è**, come previsto dal prompt. `readViewParenting` (`:46-83`) legge `state.idlookup[viewId]`
e ricava `viewpointName` da `state.idlookup?.[viewpointId]?.name` (`:70`) — la riga su cui si
innesta il calcolo simmetrico di `fatherName`.

### 2. `ViewParentingFields.tsx` — CORRISPONDE

Struttura confermata: fragment che apre a `:67`, campo **Viewpoint** (`:69-115`, riga read-only
`jj-viewpoint-row` più il blocco Move to viewpoint), poi campo **Parent view** (`:118-136`).
`import { InfoTooltip } from '../ui'` presente a `:28` (voce 5). `React` già importato a `:24`,
quindi `React.Fragment` nella map dei segmenti non richiede import nuovi.

### 3. `jj-context-bar` — CORRISPONDE

`grep -rn "jj-context-bar" src/` restituisce **solo** i due siti attesi:

- `src/styles/components/_form-system.scss:1197` (`.jj-context-bar`), `:1208`
  (`.jj-context-bar__segment`, con `&--current` annidato a `:1231`), `:1237`
  (`.jj-context-bar__sep`). Il blocco chiude a `:1239`.
- `src/components/editors/Info.tsx:1286, 1291, 1293` — markup inline, la breadcrumb legacy.

Import globale confermato: `src/styles/style.scss:2` fa `@import "./components/form-system"`,
quindi la skin è disponibile a `ViewParentingFields` senza import nuovi.

Fatto rilevante per l'override scoped: `--current` è annidato dentro `.jj-context-bar__segment`
(specificità `(0,1,0)` per il selettore composto risultante) e dichiara già `cursor: default` e
`&:hover { background: transparent }`. L'override di U-2 estende quel trattamento a **tutti** i
segmenti, non solo all'ultimo.

### 4. `jj-parenting-breadcrumb` — CORRISPONDE

`grep -rn "jj-parenting-breadcrumb" src/` → **zero occorrenze** (exit 1). Nome nuovo libero,
verifica anti-collisione superata.

### 5. Test esistente — CORRISPONDE

`__tests__/viewParentingOptions.test.ts`, 10 test. La fixture è la funzione `project()` (`:19-32`):
costruisce un `ViewSubtreeSource` con `viewelements: string[]` e `idlookup` letterale, due
viewpoint (`vpA` "Alpha", `vpB` "Beta") e cinque view — `root` (father `vpA`), `child` (father
`root`), `grandchild` (father `child`), `sibling` (father `vpA`), `other` (father `vpB`). Le
asserzioni mutano la fixture per caso (`s.idlookup.sibling.father = ''`, `:88`), mai la definizione.
Le asserzioni di `fatherName` seguono lo stesso pattern: `project()` fresco, nessuna modifica ai
test esistenti.

Il caso detached esiste già a `:86-94` e azzera `father` **e** `viewpoint`: è la fixture giusta per
asserire `fatherName === undefined`.

### 6. `docs/decisions.md` — CORRISPONDE, con uno scostamento (vedi sotto)

`R-H` è a `:61-65`, nel formato del registro: `- **SIGLA** (data) — testo`, bullet a un livello,
continuazione indentata di due spazi.

## Scostamenti dalla discovery del 2026-08-08

**Uno solo, ed è nel registro delle decisioni, non nel codice.**

Lo scioglimento della sospensiva di R-H **è già a registro**: `docs/decisions.md:204-209`, voce
`Q2 — sospensiva di R-H sciolta` (2026-08-08), nella sezione «Uniformazione delle due property
card». Ne riporta già i tre contenuti che il prompt chiede di annotare: la sospensiva è sbloccata
perché la voce 4 ha reso il viewpoint derivato e `father` writer unico; U-2 può partire; la
breadcrumb legge `readViewParenting`, mai `get_viewpoint`.

Il prompt chiede la stessa annotazione **sotto R-H**. Le due cose non sono in conflitto — R-H sta
nella sezione cronologica precedente e chi la legge lì non vede Q2 — ma trascrivere il testo
verbatim metterebbe due ratifiche della stessa decisione in due punti del registro, che è
esattamente il difetto che il registro esiste per evitare. La riga aggiunta sotto R-H è quindi un
**rimando** a Q2 con la data di scioglimento e il vincolo di lettura, non una seconda ratifica.
Forma adattata, significato invariato, come il prompt concede esplicitamente.

Nessun altro scostamento: le ancore di codice del §D2 reggono tutte su HEAD dopo voce 5 e voce 6.
Gli anchor di riga citati nei RIFERIMENTI del prompt sono esatti (`irTabs.tsx:108`,
`InfoData.tsx:284`, `_form-system.scss:1197-1239`, `style.scss:2`), con l'unica precisazione che
`viewParentingOptions.ts` è di 83 righe e `ViewParentingFields.tsx` di 141.

## Rischi

1. **`fatherId` può puntare al viewpoint.** È il modo canonico di archiviare una view di primo
   livello (D-4-7: `father = viewpoint`). Senza il guard `facts.fatherId !== facts.viewpointId` la
   breadcrumb renderebbe il nome del viewpoint due volte. Il guard è nel prompt e va tenuto.
2. **`fatherName` non è filtrato per tipo.** `state.idlookup[fatherId].name` legge il nome
   qualunque sia la `className` del padre. È voluto: sul caso di primo livello il valore c'è ma il
   guard di cui sopra impedisce che venga reso.
3. **La skin è light-only.** `.jj-context-bar` ha colori hardcoded (`#f1f5f9`, `#64748b`,
   `#e2e8f0`) senza controparti dark, come già tutta la property card. L'override di U-2 neutralizza
   background e border-bottom, quindi in dark la breadcrumb eredita il fondo del pannello e resta
   il solo colore del testo a essere fisso — meno esposta della barra legacy, non più.
4. **L'aggancio è per nome di classe globale.** Se `_form-system.scss` cambia i nomi
   `jj-context-bar__segment`/`__sep`, la breadcrumb di U-2 perde la skin in silenzio: nessun errore
   di compilazione lo segnala. È la stessa fragilità già dichiarata per gli hook `:has()` della
   skin B4.
5. **Nessun test copre la resa.** Le asserzioni aggiunte coprono `fatherName` in
   `readViewParenting`; la logica dei segmenti vive nel componente, che non è testabile sotto
   vitest per il limite noto (`window is not defined`, 9 collection failures). La verifica dei tre
   casi di segmenti resta lo smoke di Alfonso.

## Domande per Alfonso

Nessuna bloccante. Una sola, differibile: se preferisca che la riga sotto R-H sia il rimando a Q2
descritto sopra oppure il testo verbatim del prompt, accettando la doppia ratifica. Ho proceduto
col rimando; è una riga, si cambia in un istante.
