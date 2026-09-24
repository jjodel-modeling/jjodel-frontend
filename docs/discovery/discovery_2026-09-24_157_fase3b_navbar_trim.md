# Discovery — #157 Fase 3b: trim della Navbar in consumer mode

**Data**: 2026-09-24
**Branch**: `feat/157-environment-config`
**Fase**: F3b (completamento della shell consumer iniziata in F3: LeftBar + guardie DockManager).
**Ipotesi che questa discovery falsifica**: che la Navbar esponga in consumer mode solo item
developer facilmente individuabili e nascondibili con lo stesso helper `isConsumerMode()` di F3,
senza toccare file fuori da `Navbar.tsx`.

---

## 1. Obiettivo

In consumer mode (`?profile=` nell'URL, D2), la **Navbar** superiore deve smettere di esporre le
azioni da language developer, coerentemente con quanto già fatto su LeftBar (F3). Perimetro dal
prompt di handoff: «New Metamodel/Model, Tools→Configure Environment, Analyze/validazione,
viewpoint».

Enforcement **soft** (D1): si nasconde la superficie UI, non è sicurezza.

## 2. File letti (path completi)

- `frontend/src/pages/components/Navbar.tsx` (2091 righe) — struttura menu + strip delle tab.
- `frontend/src/components/environment/consumerMode.ts` — helper `isConsumerMode()`.
- `frontend/src/pages/components/LeftBar.tsx` — pattern F3 (sezioni nascoste + listener hashchange).

## 3. Findings (file:riga, verbatim)

### 3.1 La Navbar costruisce i menu come array `items: MenuEntry[]`

`Navbar.tsx:1327` `const items: MenuEntry[] = [` — menu top-level: **Jjodel, File, Edit, View,
Tools, Analyze** (Help è componente separato a destra). I `null` nell'array sono tollerati:
`makeEntry` (`:365 function makeEntry(i: MenuEntry|null|undefined, ...)`) li salta, e
`MainMenu`/`Submenu` accettano `(MenuEntry|null|undefined)[]` (`:445`, `:458`). Il pattern in uso
ovunque è `cond ? null : {...}` (es. `:1354 isDashboard ? null : {name:'New', ...}`).

### 3.2 Mappa degli item developer da nascondere

- **New Metamodel** — `Navbar.tsx:1357` (`File → New → Metamodel`, `createM2`). Developer.
- **New Model** — `Navbar.tsx:1358` (`newModel`, def. `:1303-1320`, `createM1`). Il submenu «New»
  contiene entrambi (`:1355-1360`).
- **Tools** — `Navbar.tsx:1507` (`(isDashboard || !props.advanced) ? null : {name:'Tools', ...}`).
  Contiene `Metamodel Tools` (`:1512`), `Custom Tools` (`:1519`), **`Configure Environment...`**
  (`:1524`, `EnvGenEvents.OPEN_WIZARD`), `Polymetric View` (`:1531`). Tutto authoring developer.
- **Analyze** — `Navbar.tsx:1543`. Contiene `Live Validation`/`Validate` (stub disabilitati),
  `M2 Analytics` (`:1550`), `Debug loops` (`:1551`), `Check integrity` (`:1552`). Validazione =
  concern developer (#157: «validazione … NON editabili/visibili»).

### 3.3 «viewpoint» = strip delle tab, non un item di menu

`grep` di `viewpoint` in `Navbar.tsx` non trova alcun **item di menu**: le occorrenze sono nella
**strip delle tab aperte** (`:1667 id.startsWith('vp_') → type='viewpoint'`; badge `:1774`;
label `:1785`). La strip è costruita da `openTabs`→`visibleTabs` (`:1793 const visibleTabs =
openTabs.filter(t => t.type !== 'project')`), che oggi mostra qualunque tipo tranne `project`:
`metamodel`, `viewpoint`, `transformation`, `model`, `manager`, `documentation`.

In F3 il `DockManager` già **rifiuta l'apertura** di metamodelli e viewpoint in consumer mode, ma
una tab ripristinata dal layout salvato o aperta prima dell'ingresso in consumer potrebbe
comparire nella strip: filtrarla è **difesa a valle**, coerente con F3.

### 3.4 Reattività

`LeftBar.tsx` (F3-A, commit `32d11c2ab`) usa un listener `hashchange` per ri-valutare
`isConsumerMode()` senza reload. La Navbar ri-renderizza spesso (redux + `setInterval(syncTabs,
1000)` a `:1729`), ma il solo toggle di `?profile=` potrebbe non innescarla: per consistenza con
F3-A si aggiunge lo stesso listener `hashchange`.

### 3.5 Import

`isConsumerMode` da `../../components/environment/consumerMode` (Navbar è in
`src/pages/components/`). `EnvGenEvents`/`JjodelEvents` già importati (`:67`). `useEffect`/`useState`
già importati.

## 4. Scope proposto (1 file)

`frontend/src/pages/components/Navbar.tsx`:
1. import `isConsumerMode` + listener `hashchange` (re-render), come LeftBar.
2. `const consumer = isConsumerMode();` in render.
3. `File → New Project` (`:1349`): `consumer ? null : {...}`. `File → New → Metamodel` (`:1357`):
   `consumer ? null : {...}` (si **tiene** New Model). *(decisioni §6)*
4. `Tools`: aggiungere `|| consumer` alla condizione di null esistente (`:1507`).
5. `Analyze`: `consumer ? null : {name:'Analyze', ...}`.
6. Strip tab: in consumer, `visibleTabs` esclude anche `metamodel`, `viewpoint`, `transformation`
   (restano `model`, `manager`, `documentation`).

**Nessun file di §3.1 toccato.** Solo view/shell. Layer Impact Report non richiesto.

## 5. Rischi

- La strip legge `type` già calcolato (`:1699`): filtrare per `type` non tocca la logica di lookup.
- I `null` aggiunti seguono un pattern già compilante (baseline typecheck 14 invariata attesa).
- La chiusura di una tab filtrata non è possibile dalla strip: la tab resta aperta nel dock ma
  invisibile nella strip. In consumer mode il fruitore non deve gestirla → accettabile (soft, D1).

## 6. Decisioni comportamentali (confermate dall'utente 2026-09-24)

1. **New Model**: **tenuto**. Si nasconde solo **New Metamodel**; il submenu «New» resta con la sola
   voce Model (il fruitore può creare nuovi modelli M1 dalla Navbar, non metamodelli).
2. **New Project** (`:1349`): **nascosto** anche in consumer (il fruitore è legato all'ambiente
   `(progetto, profilo)`; niente creazione di nuovi progetti dalla Navbar).
