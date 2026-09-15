# Prompt Claude Code — R1: dichiarare inerte il tab Events

**Data**: 2026-08-03 17:10
**Tipo**: fix (onesta' della UI). **Fase unica**, nessuna discovery: i punti di intervento sono gia' localizzati.
**Branch**: `alfonso-frontend-jjtl`. **Critical zone**: nessuna.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

## Contesto (dalla discovery 2026-08-03, ratificato, non ridiscutere)

`docs/discovery/discovery_2026-08-03_state_actions_events.md` §1.4 ha stabilito che il tab **Events** di una view e' una superficie di authoring sopra un runtime rimosso. Tre catene indipendenti:

- `evalContext` non ha **nessun sito di scrittura** in tutto `frontend/src` (solo dichiarazioni a `classes.ts:4030` e `:4056`, letture a `GraphDataElements.tsx:915` e `Console.tsx:813`, piu' un blocco commentato in `sharedTypes.tsx:19-25`). Il primo argomento degli handler compilati e' quindi `undefined` e il destructuring lancerebbe `TypeError`.
- `transientProperties.view[vid].JSXFunction` e' assegnata (`reducer.ts:1007`) e **mai invocata**.
- L'editor classico e' spento dalla Fase 5a (`EditorSwitch.tsx:118-124`), e nessun componente rende piu' un vertice via jsxString. L'unico jsxString vivo e' `ViewpointRenderer.tsx:12-29` (lato M2), il cui scope contiene **solo** `React` e `data`: niente `node`, niente `events`.

Gli handler quindi si scrivono, si persistono (`view.tsx:1219-1251`), si ricompilano al load (`SaveManager.ts:44-52`) e non vengono mai eseguiti. Peggio: `ViewProperties.tsx:325-357` mostra un indicatore di stato che segnala gli handler definiti come attivi.

**Decisione ratificata (R-1, `claude/ratifiche_2026-08-03_state_actions_events.md`)**: il tab non si ripara, sara' sostituito da un modello di azioni dentro l'IR. Nel frattempo va **marcato**, perche' oggi e' una trappola: accetta lavoro che non produrra' mai effetto.

## COSA

Due interventi, entrambi puramente informativi. **Nessuna rimozione, nessuna disabilitazione, nessun tocco alla persistenza o alla compilazione.**

### 1. Avviso nel tab Events

File: `frontend/src/components/editors/views/data/CustomData.tsx` (157 righe, leggilo per intero prima di editare).

In cima al render, **sopra** la sezione "Default Events" (`:29-46`), un avviso persistente e non dismissibile.

- **Primitiva**: usa il componente di avviso gia' in uso nei pannelli di authoring IR. Verifica quale sia leggendo `VertexAuthoringPanel.tsx` o `EdgeAuthoringPanel.tsx`: sono attesi `HelpText` e `ErrorText`. **Non introdurre un componente nuovo** e non inventare classi CSS se ne esiste una adatta (grep di collisione prima di crearne).
- **Registro**: questo non e' un errore dell'utente, e' un limite del prodotto. Se esistono due varianti (informativa e di errore), scegli quella informativa o di avviso, non quella di errore.
- **Lingua**: segui la lingua gia' usata nelle stringhe di questo stesso file. Non mescolare.
- **Contenuto**, in sostanza e senza abbellimenti: gli handler definiti qui vengono salvati ma non eseguiti nella versione corrente dell'editor; il canale di esecuzione dipendeva dall'editor classico, ritirato; il lavoro scritto qui viene conservato e non va perso. Due frasi, massimo tre. Nessun em dash. Niente promesse su quando tornera' o su cosa lo sostituira'.

L'avviso vale per **entrambe** le sezioni (Default Events e Custom Events): mettine uno solo in cima, non due.

### 2. Indicatore di stato in `ViewProperties`

File: `frontend/src/components/editors/viewpoint/properties/ViewProperties.tsx`, blocco `:325-357`.

Leggi il blocco per intero e stabilisci cosa segnala esattamente l'indicatore oggi. Poi rendilo coerente col fatto che quegli handler non girano.

Ordine di preferenza:
1. se l'indicatore ha gia' uno stato neutro o di avviso nel design system, usalo;
2. altrimenti sopprimi l'indicatore per gli handler di eventi, lasciando intatto il resto del blocco.

**In nessun caso** rimuovere il conteggio o l'elenco degli handler, se presenti: l'informazione "questa view ha handler definiti" resta utile e vera. Cio' che non deve piu' essere comunicato e' che siano attivi.

Se dal codice risulta che l'indicatore segnala qualcosa di diverso da quello che il report ha inteso, **fermati e segnalalo** invece di modificarlo a intuito.

## DOVE (lista chiusa)

| File | Intervento |
|---|---|
| `frontend/src/components/editors/views/data/CustomData.tsx` | avviso in cima al render |
| `frontend/src/components/editors/viewpoint/properties/ViewProperties.tsx` | indicatore di stato, blocco `:325-357` |

Qualsiasi altro file: STOP e segnala.

## Fuori scope, esplicito

- Non rimuovere il tab Events da `ViewData.tsx:115-123`.
- Non rimuovere ne' deprecare i sette campi dei default events (`view.tsx:242-251`) ne' il dizionario `events` (`:252`).
- Non toccare `set_events` (`view.tsx:1219-1251`) ne' l'auto-generazione delle `usageDeclarations`.
- Non toccare la compilazione nel reducer (`reducer.ts:915-960`, `:1056-1084`).
- Non toccare `Js.tsx` ne' l'editor Monaco.
- Non tentare di riparare `evalContext` o il runtime. E' escluso per decisione ratificata.

## Vincoli

- Zero refactoring opportunistico, mai rinominare identificatori esistenti.
- Grep di collisione per qualsiasi identificatore o classe CSS nuova.
- WIP nel working tree da non toccare (lane TextStyle e materiale del paper). `git add` puntuale, mai `git add .`.

## Gate automatici

1. `npx tsc --noEmit`: stesso set di errori della baseline, diff vuoto.
2. `npx vitest run`: tutti verdi.
3. `npm run build`: exit 0.

## Verifica visiva (la esegue Alfonso, hard stop prima del commit)

1. Seleziono una view nel Tree, apro il tab Events: l'avviso e' in cima, leggibile, non copre i campi.
2. Gli editor Monaco funzionano come prima: scrivo, esco dal campo, il contenuto si salva.
3. Riapro il progetto: gli handler sono ancora li'. Nessuna perdita di dati.
4. Nel pannello del viewpoint, l'indicatore di stato non segnala piu' gli handler come attivi, ma l'informazione sulla loro presenza resta.
5. Nessuna regressione visiva negli altri tab della view.

## Chiusura

Un solo commit dopo la conferma visiva: `fix: mark the Events tab as inert until the action model lands`. Entry in `docs/claude-code-log.md` con tipo `fix` e il nome di questo documento prompt:

```
**Nome del documento prompt**: 2026-08-03 17:10 prompt_R1_tab_events_inerte
```

Nessun push senza go-ahead.
