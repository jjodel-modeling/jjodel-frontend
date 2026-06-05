# Discovery - Advanced Mode flag audit

**Tipo**: discovery read-only. Nessuna modifica al codice.
**Branch**: `alfonso-frontend-jjtl`
**Data**: 2026-06-03
**Scope**: mappare lo stato reale del meccanismo "Advanced Mode" per decidere se classificare le feature basic/advanced significa *popolare* gate esistenti o *costruirli*.

---

## TL;DR

L'Advanced Mode NON e' uno scheletro: esiste un toggle funzionante (menu, BottomBar, StatusBar, ProfileSection), un keyboard shortcut realmente cablato (`Cmd/Ctrl+Shift+M`), persistenza su localStorage e ~13 lettori reali che fanno gating effettivo. MA lo stato vive in **due store paralleli non coordinati** (Redux `state.advanced` vs localStorage `jjodel.interfaceMode` + `U.interfaceMode`), tenuti allineati solo da 3 dei ~6 writer, senza alcun bridge, e con il lato Redux **non persistito** a reload. Verdetto: **parziale** (sezione 7).

---

## Sezione 1 - Definizione e stato

Esistono **due sorgenti di verita' distinte**, entrambe attive, che rappresentano lo stesso concetto "modo basic/advanced".

### Store A - Redux root field `advanced`
- **Definizione**: `redux/store.tsx:220` -> `advanced: boolean = false;` (campo root di `DState`).
- **Tipo**: `boolean`.
- **Default a fresh load**: `false` (hardcoded nella classe state, vedi sotto: NON viene idratato da localStorage al boot).
- **Scrittura**: `SetRootFieldAction.new('advanced', <bool>)`.
- **Lettura**: `state.advanced` (mapStateToProps / `useSelector`).
- **Nota collaborative**: `components/collaborative/Collaborative.ts:24` elenca `'advanced'` tra i campi root **esclusi** dalla sincronizzazione collaborativa (accanto a `tooltip`, `alert`, `dialog`, `_lastSelected`). Quindi e' trattato come stato UI locale, non condiviso tra utenti.

### Store B - localStorage + classe `U` + global `windoww`
- **Definizione hook**: `hooks/useInterfaceMode.ts`.
  - chiave localStorage: `STORAGE_KEY = 'jjodel.interfaceMode'` (`useInterfaceMode.ts:17`), valori `'basic' | 'advanced'`.
  - statica globale: `common/U.tsx:214` -> `public static interfaceMode: 'basic' | 'advanced' = 'basic';`.
  - mirror su `windoww.advanced` (boolean) scritto dai writer "full-sync" (sezione 2).
- **Tipo**: union `'basic' | 'advanced'` (string), piu' il mirror boolean su `windoww.advanced`.
- **Default a fresh load**: `'basic'` (`getInterfaceMode()` ritorna `'basic'` se la chiave e' assente, `useInterfaceMode.ts:28`; `U.interfaceMode` inizializzato a `'basic'`).

### Relazione tra A e B
I due store NON sono lo stesso dato. Sono mantenuti coerenti solo perche' alcuni writer scrivono manualmente entrambi (sezione 2). Non esiste reducer, middleware o listener che propaghi un cambiamento dell'uno verso l'altro. Conseguenza operativa: a fresh load **entrambi** partono da basic, ma a reload con localStorage gia' valorizzato i due divergono (sezione 2, Persistenza).

---

## Sezione 2 - Toggle e persistenza

### Handler `Cmd/Ctrl+Shift+M`
- **Config**: `utils/keyboardShortcuts.ts:139` -> `ADVANCED_MODE: { key: 'M', modifiers: ['shift', 'cmd'] }`.
- **Match**: `matchesShortcut()` (`keyboardShortcuts.ts:175`); su Mac usa `metaKey`, su Win `ctrlKey`.
- **Registrazione listener**: `pages/components/Navbar.tsx:1247-1248`, in capture phase su `window` **e** `document` (`addEventListener('keydown', handleKeyDown, true)`), deps `[project, metamodels, props.advanced, user]`.
- **Dispatch**: `Navbar.tsx:1137-1142` -> `toggleAdvancedMode()`.
- **No-op?**: **NO**. E' un toggle pienamente funzionante.

### Cosa fa il toggle (writer "full-sync")
`toggleAdvancedMode()` (`Navbar.tsx:860`) chiama `enableAdvancedMode()` / `disableAdvancedMode()` (`Navbar.tsx:838-858`), che scrivono **tutti e quattro** i canali:
```
SetRootFieldAction.new('advanced', true/false);   // Store A (Redux)
windoww.advanced = true/false;                     // mirror global
localStorage.setItem('jjodel.interfaceMode', ...); // Store B (persist)
U.interfaceMode = 'advanced'/'basic';              // Store B (runtime)
```

### Inventario completo dei writer (e quale store toccano)

| Writer | file:linea | Store A (Redux) | Store B (localStorage/U) | mirror windoww |
|---|---|---|---|---|
| Navbar enable/disable/toggle (menu + Cmd+Shift+M) | `Navbar.tsx:838-866` | si | si | si |
| BottomBar `ModeIndicator` | `pages/components/BottomBar.tsx:54-58` | si | si | si |
| ProfileSection (Settings) toggle | `ProfileSection.tsx:366-369` | si | si | si |
| StatusBarRightZone toggle | `StatusBarRightZone.tsx:25` (`toggleMode`) | **NO** | si | NO |
| ModeSystem `ModeToggle` | `ModeToggle.tsx:23` (`toggleMode`) | **NO** | si | NO |
| ModeSystem `UpgradePrompt` | `UpgradePrompt.tsx:46` (`setMode('advanced')`) | **NO** | si | NO |
| ModeSystem `LockedFeature` unlock | `LockedFeature.tsx:40-42` (`SetRootFieldAction`) | si | **NO** | NO |

Tre writer scrivono entrambi gli store; quattro ne scrivono uno solo. Il toggle della **StatusBar** (sempre visibile, montato in `StatusBar.tsx:392` e `JjtlStatusBar.tsx:161`) aggiorna **solo** lo Store B: i lettori Redux (Node tab, sezione NODE delle Properties, sezioni advanced di Info, ecc.) **non reagiscono** a quel click finche' la pagina non viene ricaricata o non si tocca un writer full-sync. Simmetricamente `LockedFeature` aggiorna solo Redux: i lettori di Store B (Metrics, riga "Allow cross-extend", StatusBar label) non si aggiornano.

### Persistenza
- **Store B**: persiste. Chiave `jjodel.interfaceMode` riletta a ogni mount da `getInterfaceMode()`/`useInterfaceMode()` (`useInterfaceMode.ts:22-29,57-65`). Sync cross-tab via evento `storage` (`useInterfaceMode.ts:68-78`). **Sopravvive al reload.**
- **Store A**: NON persiste in modo indipendente. Non c'e' `redux-persist` nel progetto (grep `redux-persist|persistStore|persistReducer` = 0 hit pertinenti); nessun codice di boot legge `jjodel.interfaceMode` e fa `SetRootFieldAction('advanced')`. A fresh reload `state.advanced` torna `false` (default `store.tsx:220`) anche se localStorage dice `'advanced'`.
- **Bridge mancante**: `useInterfaceMode` emette `SystemEvents.INTERFACE_MODE_CHANGE` (`useInterfaceMode.ts:87,96`, costante `events/registry.ts:105`) ma **nessun componente lo ascolta** (grep listener = 0). Quindi non c'e' riconciliazione automatica A<->B.

**Conseguenza netta**: dopo un reload, i lettori Redux mostrano sempre basic (a meno che lo stato del progetto, caricato nello store, non riporti `advanced=true`); i lettori localStorage mostrano l'ultimo valore scelto. I due insiemi di lettori possono divergere.

---

## Sezione 3 - Lettori del flag

Legenda colonna "Store": **A** = Redux `state.advanced`; **B** = localStorage/`U.interfaceMode`/`useInterfaceMode`.

| file:linea | Store | Cosa nasconde/mostra | Visibile in |
|---|---|---|---|
| `abstract/Dock.tsx:352` | A | tab **Node** nel right panel | solo advanced |
| `abstract/Dock.tsx:354` | A | tab **Languages** (MTM) | solo advanced |
| `abstract/Dock.tsx:355` | A | tab **Logger** | solo advanced |
| `editors/PropertiesWithTreeView.tsx:215` | A | sezione **NODE** nelle Properties | solo advanced |
| `editors/Info.tsx:121` (`InheritanceSection`) | A | campo **Extends** (cross-metamodel superclass) | solo advanced |
| `editors/Info.tsx:400` | A | toggle **Serializable** su enum | solo advanced |
| `editors/Info.tsx:431` | A | `CollapsibleSection "ADVANCED"` su feature | solo advanced |
| `editors/Info.tsx:454` | A | `CollapsibleSection "FLAGS"` su attribute | solo advanced |
| `editors/Info.tsx:1298` | A | `CollapsibleSection "ADVANCED STATE"` su oggetto | solo advanced |
| `editors/Console.tsx:1006` | A | mostra `UpgradePrompt` quando **!advanced**; nasconde tool di debug | prompt in basic / tool in advanced |
| `editors/Console/CollapsibleShortcuts.tsx:64` | A (via prop) | sezione scorciatoie console | solo advanced |
| `editors/views/NestedView.tsx:243,429,472` | A (`isAdvanced=state.advanced`, `:545`) | editor **Viewpoints**; in basic mostra `LockedFeature` | solo advanced |
| `metrics/Metrics.tsx:85` | B (`U.interfaceMode`) | pannello **Metamodel Analytics** | solo advanced |
| `editors/Info.tsx:133` (`InheritanceSection`, `globalAdvanced`) | B (`useInterfaceMode`) | riga **Allow cross-extend** (animata) | solo advanced |
| `StatusBarRightZone.tsx:66-70` | B (`useInterfaceMode`) | label/stato del toggle Basic/Advanced | sempre (e' il toggle) |
| `ModeSystem/ModeToggle.tsx:29-46` | B (`useInterfaceMode`) | bottone toggle dedicato | sempre (e' il toggle) |
| `ModeSystem/UpgradePrompt.tsx:43` | B (`useInterfaceMode`) | si nasconde se gia' advanced | solo basic |
| `ModeSystem/LockedFeature.tsx:36` | A (prop) + B (import `isAdvancedMode`) | placeholder "feature bloccata" | solo basic |

**Nota chiave sulla frammentazione interna a un singolo componente**: `InheritanceSection` (`Info.tsx:106-140`) legge **entrambi** gli store nello stesso render: la prop `advanced` (Store A) gate il campo "Extends" (`:121`), mentre `globalAdvanced` da `useInterfaceMode` (Store B) gate la riga "Allow cross-extend" (`:133`). Due feature adiacenti nello stesso pannello dipendono da due sorgenti diverse.

---

## Sezione 4 - Dev Mode

**Esiste, e' un flag completamente separato e ortogonale.**

- **Definizione**: `contexts/DevModeContext.tsx` - React Context (`isDevMode: boolean`, `useState(false)`, `:58`).
- **Shortcut**: `Ctrl/Cmd+Shift+D` (`DevModeContext.tsx:63`), listener proprio su `window` keydown (`:73`), bubble phase (NON capture). Non passa per `keyboardShortcuts.ts` ne' per `SHORTCUTS`.
- **Default**: `false`. **Persistenza**: nessuna (solo `useState`, si resetta a ogni reload). Non scrive localStorage.
- **Consumatori**: solo il componente `DevModeLabel` (`components/DevModeLabel/DevModeLabel.tsx:16`, `if (!isDevMode) return null`), usato per overlay di etichette tier dei componenti (T1.1, T2.2, ...): `EmptyDashboard.tsx:14`, `CreateProjectDialog.tsx:96`, `LeftBar.tsx:362`, `RightPanel.tsx:66`, `Catalog.tsx:616`.
- **Relazione con advanced**: **nessuna**. Store diverso (Context vs Redux/localStorage), shortcut diverso, scopo diverso (overlay di sviluppo/design per i tier dei componenti, non gating di feature di prodotto). Sono **ortogonali**, non si sovrappongono in alcun reader.

**Flag adiacente da non confondere**: `pages/settings/AdvancedSettings.tsx:9` definisce un terzo flag locale `debugMode` (localStorage, checkbox nel tab Settings > Advanced). E' separato sia da advanced-mode sia da dev-mode.

---

## Sezione 5 - Disclosure locale indipendente (non usa il flag globale)

Componenti che fanno progressive disclosure con **logica propria**, senza leggere ne' Store A ne' Store B. Misurano la frammentazione attuale.

| Componente | file:linea | Pattern di gating | Legge il flag globale? |
|---|---|---|---|
| `InfoData.tsx` (campi Edge) | `views/data/InfoData.tsx:174,194` | campi **Is Edge** / **Edge Source** / **Edge Target** gate dal **campo di dominio** `view.isEdge` (`:194`) e dal computed `edgeCandidate` (useMemo su numero di reference, `:124-127`); il banner "edge candidate" da `edgeCandidate` (`:174`) | **NO** - logica di dominio propria |
| `FunctionComponent.tsx` | `forEndUser/FunctionComponent.tsx:191,283-285` | `state.advancedMode` **locale al componente** (toggle col bottone settings), modalita' "detailed vs simple" dell'editor di template/funzioni | **NO** - state locale, concetto diverso |
| `ViewProperties.tsx` (Advanced rendering) | `viewpoint/properties/ViewProperties.tsx:182-279` | sezione "Advanced rendering" come `<details><summary>` nativo (`AdvancedRenderingSection`); commento dice "Expert only" ma il collasso e' guidato dal `<details>` nativo | non confermato che legga il flag (disclosure nativa) |
| `InfoData.tsx` `InfoTooltip` | `views/data/InfoData.tsx:33` | `useState(false)` per hover tooltip | n/a (non e' feature gating, e' hover) |

**Test chiave del prompt (InfoData.tsx)**: confermato che `InfoData.tsx` **NON** legge il flag globale advanced. La sua disclosure (Is Edge / Edge Source / Edge Target) e' interamente guidata dallo stato di dominio `view.isEdge` e dal classificatore `edgeCandidate`. E' progressive disclosure, ma su asse "il modello e' un edge?", non su asse "modo UI basic/advanced". Questo e' un esempio diretto di gating frammentato/indipendente.

---

## Sezione 6 - Falsi positivi notevoli

Occorrenze di `advanced`/`Advanced` non correlate al modo UI:

- **Tab/sezione "Advanced" nei Settings**: `Settings/UnifiedSettingsModal/sections/AdvancedSection.tsx`, `pages/settings/AdvancedSettings.tsx`, `UnifiedSettingsModal.tsx:65,140`, `GlobalDrawer/SettingsDrawerContent.tsx:17,31`, `pages/Settings.tsx:14,28`. E' una sezione di impostazioni "developer/advanced settings", non il gate del modo UI.
- **`SHORTCUTS.NEW_METAMODEL`** `keyboardShortcuts.ts:137` (`'M'`, `alt+cmd`): shortcut diverso, non e' advanced-mode (che e' `shift+cmd`).
- **`Collaborative.ts:24`** `'advanced'`: e' il **nome del campo** in una lista di esclusione dalla sync, non un reader (contesto utile, citato in sezione 1).
- **`jjel/evaluator/index.ts:17`**: commento "for advanced usage". Nessuna relazione.
- **`common/Button/Button.tsx:15`**: docstring d'esempio ("Enable advanced mode"). Non e' un reader.
- **`FunctionComponent` `advancedMode`**: naming collidente ma feature distinta (vedi sezione 5).
- **`AdvancedModeTutorial`** (`components/AdvancedModeTutorial/`): modale one-shot mostrata al primo enable; chiave localStorage propria `jjodel_advanced_mode_tutorial_seen`. E' correlato (innescato dall'enable in `Navbar.tsx:845`) ma non e' ne' stato ne' reader del flag; e' UX accessoria.

---

## Sezione 7 - Verdetto

**parziale.**

L'infrastruttura esiste ed e' realmente usata: toggle funzionante su quattro superfici (menu/keyboard, BottomBar, StatusBar, ProfileSection), shortcut `Cmd/Ctrl+Shift+M` pienamente cablato, persistenza su localStorage, e ~13 reader che fanno gating effettivo di tab, sezioni e campi. Classificare una feature come basic/advanced significa quindi **popolare gate gia' esistenti** (il pattern `{advanced && ...}` o `{isAdvanced && ...}` e' gia' consolidato), non costruirli da zero.

Tuttavia l'infrastruttura e' **frammentata su due store non coordinati** (Redux `state.advanced` vs localStorage `jjodel.interfaceMode`/`U.interfaceMode`), allineati solo da 3 dei ~6 writer, senza bridge (`INTERFACE_MODE_CHANGE` non ha listener) e con il lato Redux non persistito a reload. Ogni nuovo gate deve quindi scegliere consapevolmente **quale** dei due store leggere, sapendo che: (a) i gate su Redux non reagiscono ai toggle di StatusBar/ModeToggle/UpgradePrompt; (b) i gate su localStorage non reagiscono allo unlock di `LockedFeature`; (c) i gate su Redux possono resettarsi a basic dopo un reload. Prima (o durante) il lavoro di classificazione conviene decidere se unificare le due sorgenti, altrimenti la frammentazione attuale si propaga a ogni nuovo gate.

---

## Appendice - File toccati

Solo questo report e l'entry in `docs/claude-code-log.md`. Nessun file di codice modificato.
