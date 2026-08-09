# Fase 1 — Discovery (read-only): resize/sizing dei nodi classici e affordance per-asse

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

**Questa è una discovery read-only. HARD STOP dopo il report. Nessuna modifica, nessun commit, nessun fix.** L'analisi e la decisione sul fix avvengono in chat, a partire dal report salvato.

## Contesto e sintomo

Nell'editor **classico**, un nodo default della vista **Object** (`.jjodel-classic-object`, header "name : Type" + righe "attr = value") se allargato col bounding box cresce **solo in larghezza, non in altezza**: il contenuto resta all'altezza naturale e le maniglie di selezione lasciano un frame più alto della card (box fantasma).

## Ipotesi di root cause (da confermare, NON da assumere vera)

Ricostruita in chat leggendo il branch pushato. Le righe sono indicative: **verifica sui file locali reali**, il working tree può differire dal branch pubblico.

1. La vista Object nasce con `adaptWidth = true` e `adaptHeight = true` (`src/redux/defaults/views.ts:541-544`). Il default base è `adaptWidth=false, adaptHeight=true //'fit-content'` (`src/joiner/classes.ts:1187-1188`): `adaptHeight` significa "altezza segue il contenuto".
2. `adaptSize` (`src/model/dataStructure/GraphDataElements.tsx:584-665`) dopo ogni update rimisura il rettangolo reso con `Size.of()` = `getBoundingClientRect` (`src/common/Geom.ts:641-649`) e riscrive la size sullo store (`set_size`, riga ~661). Qualsiasi dimensione non corrispondente al contenuto viene scartata al frame successivo.
3. CSS: `.jjodel-classic-object` (`src/styles/classic-object-view.scss:26-34`) ha `min-width` e `overflow:hidden` ma **nessun vincolo di altezza**; `.root` ha `height:100%` (`src/styles/view.scss:8-11`) che non si risolve senza un'altezza in pixel esplicita sul box. Quindi l'altezza resa è sempre quella del contenuto.
4. Il layer modello tratta `w` e `h` in modo **simmetrico** (`updateSize` in `src/view/viewElement/view.tsx:1538-1539`). Quindi l'asimmetria "larghezza sì, altezza no" NON è nel modello: vive nel render runtime-compilato (dove la `w` diventa `width` inline mentre la `h` no) e/o nel wiring delle maniglie.
5. I flag `view.draggable` e `view.resizable` esistono (`src/view/viewElement/view.tsx:237-238, 1022-1026`) ma l'enforcement a livello interazione è parziale: in `src/components/forEndUser/Measurable.tsx:55` `disabled: !(view.draggable)` è commentato, e `defaultOptions.resizable = {}` (riga ~57) non deriva gli `handles` da `adaptWidth`/`adaptHeight`.

## Direzione del fix (per orientare la discovery, NON da implementare ora)

Onorare all'interazione i flag che il modello già dichiara: **un asse content-defined (`adapt*=true`) non espone maniglia di resize su quell'asse e si adatta al contenuto** (niente box fantasma). Per Object (entrambi i flag `true`) niente maniglie, card che abbraccia il contenuto su entrambi gli assi. La regola generale degli handles deve essere `f(view.resizable, adaptWidth, adaptHeight)` per-asse, così le viste free (adapt=false + resizable=true, es. container/`DPackage`) mantengono le maniglie invariate.

La discovery deve dirmi se questa direzione è fattibile e cosa si rompe.

## COSA investigare (rispondi a ciascun punto con file:riga)

### Q1 — Applicazione size -> style (l'incognita principale)
Trova ESATTAMENTE dove il risultato di `view.getSize(id)` (`.w`/`.h`) diventa stile inline sul DOM del nodo. In particolare: la `w` memorizzata viene applicata come `width` inline esplicita mentre la `h` NON viene applicata come `height` (lasciata a `.root{height:100%}`/contenuto)? Se sì, dove e perché l'asimmetria. Cerca nel render del componente del graph-element (runtime-compilato: `UX.tsx`, `common/DV.tsx`, `common/sharedTypes.tsx`, `common/graphComponentRegistry.ts`, `Aliases.tsx View`), inclusi eventuali `viewStyle`/`styleoverride`/`addStyle`. Riporta la catena DOM effettiva del vertice Object (wrapper -> `<view class="view root object jjodel-classic-object">` -> header/body) con chi porta le dimensioni in pixel.

### Q2 — Wiring delle opzioni jQuery UI
In `Measurable.tsx`: come vengono costruite le opzioni `resizable` passate a jQuery UI (`afterUpdateSingle`, merge in `~166-170`, `($measurable)[type](options)`). È possibile derivare `handles` (es. `'e,w'`, `'n,s'`, corner) e/o `disabled` per-nodo dai flag `view.resizable` + `adaptWidth` + `adaptHeight`? Chi passa `props.resize`/`resizable`/`transformMode`/`draggable` a `Measurable` (il chiamante a monte)? Conferma lo stato del `disabled` commentato (`~55`).

### Q3 — Maniglie e frame di selezione
Dove sono renderizzate le maniglie (i quadrati blu): sono `.ui-resizable-handle` di jQuery UI o un overlay custom? Con quali classi/token (`--color-handle-border/bg/hover`)? Il bounding box di selezione è dimensionato dalla size memorizzata o dal rect DOM reale? Cioè: **sopprimere gli handles su un asse elimina il frame fantasma su quell'asse?**

### Q4 — Read path dei flag adapt e loop-guard
Dove `adaptWidth`/`adaptHeight` vengono letti per pilotare `adaptSize` a ogni render (chi popola `canTriggerSet` `{w,h}`). Conferma il guard anti-loop (`GraphDataElements.tsx:~642-658`) che disabilita l'autosize su oscillazione: il fix proposto lo può far scattare per errore?

### Q5 — (secondario, per il futuro modello opzioni — solo lettura, nessuna azione)
Dove sono impostati i default per-view (`draggable`/`resizable`/`adaptWidth`/`adaptHeight`) delle viste built-in (`redux/defaults/views.ts`: Object, Package/container, Value, Singleton, Enum, edge-like). Quali viste built-in sono oggi free-resizable (adapt=false) e devono restare invariate col fix. Dove vive il pannello properties delle viste (per esporre in futuro "sizing mode" e toggle draggable). Cattura solo i fatti strutturali, non progettare la UI.

## DOVE (perimetro di lettura atteso, estendi solo se necessario)
- `src/model/dataStructure/GraphDataElements.tsx` (adaptSize, set_size, get_size)
- `src/view/viewElement/view.tsx` (adaptWidth/adaptHeight/resizable/draggable, getSize/updateSize)
- `src/components/forEndUser/Measurable.tsx` (jQuery UI draggable/resizable, defaultOptions, handles)
- `src/common/UX.tsx`, `src/common/DV.tsx`, `src/common/sharedTypes.tsx`, `src/common/graphComponentRegistry.ts`, `src/components/forEndUser/Aliases.tsx` (render runtime-compilato del graph-element, size->style)
- `src/common/Geom.ts` (`Size.of`)
- `src/redux/defaults/views.ts` (flag per-view built-in)
- `src/styles/view.scss`, `src/styles/classic-object-view.scss` (CSS del root e della card)
- `src/utils/defaultViewTemplate.ts` (template Object/value/singleton)

## COME
- Leggi i file locali reali; NON fidarti delle righe di questo prompt, verificale.
- Ragiona sul comportamento DOM a runtime (position, containing block, `height:100%` vs altezza esplicita, `getBoundingClientRect`).
- Nessuna modifica al codice. Nessun `git add`, nessun commit.

## Report (OBBLIGATORIO)
Salva il report in `docs/discovery/discovery_2026-07-23_classic_node_resize_sizing.md` (se la cartella non esiste, creala). Contenuto minimo: obiettivo della discovery; file letti con path completi; findings per Q1..Q5 con file:riga; catena DOM del vertice Object; rischi individuati (impatto di toccare `Measurable` su TUTTI i nodi/edge, semantica `handles` jQuery UI, loop-guard, eventuali migrazioni VersionFixer se si toccassero default); domande aperte per Alfonso.

**La Fase 1 non è completa finché il report non è scritto. HARD STOP dopo il report.**
