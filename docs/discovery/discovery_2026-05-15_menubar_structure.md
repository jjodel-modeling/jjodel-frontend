# Discovery — MenuBar structure (6 top-level menus)

**Data:** 2026-05-15
**Tipo:** discovery (read-only)
**Branch:** `alfonso-frontend-jjtl`
**Scope output:** input per il refactor "hide-not-grey" + cambi Jjodel/File menu

---

## MenuBar — stato attuale

### File coinvolti

| Path | Ruolo |
|---|---|
| `frontend/src/pages/components/Navbar.tsx` | File principale. Contiene config dei 6 menu (`items: MenuEntry[]` a line 1277-1515), il renderer (`makeEntry`, `Submenu`, `MainMenu` a line 355-453), e i keydown listener globali per le shortcut (line ~900-1230). |
| `frontend/src/pages/components/about/AboutDialog.tsx` | Modal "About Jjodel", aperto da `AboutDialogController.open()` (line 1281). |
| `frontend/src/components/ModeSystem/ModeToggle.tsx`, `UpgradePrompt.tsx` | Logica del toggle Basic/Advanced Mode usato dalla voce "Switch to … Mode" (line 1401). |
| `frontend/src/components/polymetric/PolymetricView.tsx` | Componente del Polymetric View, aperto via `JjodelEvents.OPEN_POLYMETRIC` (line 1490). |
| `frontend/src/utils/keyboardShortcuts.ts` | Definizione canonica del set `SHORTCUTS` usato da Navbar (line 117-149). |
| `frontend/src/constants/shortcuts.ts` | **SHORTCUTS duplicato e non usato dal Navbar** — keys `'file.new.project'` etc. (vedi Note collaterali). |
| `frontend/src/common/U.tsx:3386` | Classe `Keystrokes` (registry per menu shortcuts via `Keystrokes.register()`). |
| `frontend/src/api/persistance/ProjectsApi.ts` (e `frontend/src/pages/AllProjects.tsx`) | `ProjectsApi.create(type, name, ..., projects)` + dialog `CreateProjectDialog` apribile via `JjodelEvents.NEW_PROJECT`. |

### Architettura voci (Q1)

**Config-driven.** Le 6 voci top-level (Jjodel/File/Edit/View/Tools/Analyze) sono un singolo array `items: MenuEntry[]` dichiarato in `Navbar.tsx:1277-1515`, dentro al body del functional component (ricalcolato a ogni render — gli `isDashboard`/`isProject`/`isFavorite` cambiano in funzione di props/state). `MenuEntry` (typedef a line 422-432) ha campi `name`, `icon`, `function`, `keystroke`/`shortcutPills`, `subItems`, `disabled`, `jsx?` (override JSX del nome), `id?`.

Render: `MainMenu` (line 448-453) itera `items` e renderizza un `<Submenu>` per ciascuno; `makeEntry` (line 355-405) ricorsivamente trasforma `MenuEntry` → `<li>` con dropdown nested. **Top-level item con `subItems.length === 0` viene già nascosto dal renderer** (line 451: `!m || !m.subItems?.length ? null : ...`) — utile per il refactor hide-not-grey.

### Visibility & disabled (Q2)

**Mix di tre pattern** già presenti nel codice attuale:

1. **Hide via condizionale `cond ? null : {...}`** — solo nel **File menu** (line 1308, 1319, 1320, 1323, 1344, 1352, 1362, 1364, 1381). Esempio: `isDashboard ? null : {name: 'Save Project', ...}`. `makeEntry` salta i `null` (line 356: `if (!i) return null`).
2. **Disabled inline via `disabled: bool`** — pattern dominante in Edit/View/Tools/Analyze. Esempi: `disabled: isDashboard` (line 1389, 1394, 1411, 1417, 1423, ecc.), `disabled: isDashboard || metamodels.length === 0` (line 1484, 1493, 1506), `disabled: !isActiveTabModel` (line 1431), `disabled: true` (placeholder permanenti come "Live Validation", "Validate", "Custom Tools").
3. **Hide condizionale di intero blocco** via spread + ternary su array — Tools (line 1465-1476): `...(isDashboard || metamodels.length === 0 ? [stub] : [real])`, e Analyze (line 1504-1509): `...(props.advanced ? [advanced-items] : [])`.

Nessuna prop dichiarativa tipo `visible: bool` o `enabled: () => boolean` esiste in `MenuEntry`. Il pattern del File (`isDashboard ? null : {...}`) è il candidato naturale da generalizzare per hide-not-grey.

`makeEntry` (line 378): `if (i.subItems && i.subItems.length === 0) return undefined` — se la lista `subItems` arriva vuota (es. tutto filtrato via `?:null`), la voce parent viene rimossa. Quindi **cascading hide funziona già**, senza modifiche al renderer.

### Context-awareness (Q3)

**Già implementata** via due flag derivati al volo:

```ts
// Navbar.tsx:1273-1274
const isDashboard = !project;
const isProject = !!project;
```

`project: LProject | undefined` arriva da `user?.project || undefined` (line 560), sincronizzato con l'URL via `U.getProjectID_URL()` (line 561). Quindi siamo "in dashboard" ⇔ `project === undefined` ⇔ URL non `/project?id=...`.

Esiste anche `context` (`'DASHBOARD' | 'PROJECT_EDITOR' | 'METAMODEL_EDITOR' | ...`) ottenuto via `detectCurrentContext(...)` da `utils/keyboardShortcuts`, ma è usato solo dentro i listener keydown (line 949, 1021, ecc.), **non** dalla config dei menu. Per i menu basta `isDashboard`/`isProject`.

### Roadmap action (Q4)

**Già a posto.** Line 1282:
```ts
{name: 'Roadmap',
 function: () => open('https://github.com/jjodel-modeling/jjodel-frontend/milestones'),
 icon: <i className="bi bi-calendar3" />}
```
URL identico a quello richiesto dal design doc. `open()` qui è `window.open` (alias globale), apre in nuova tab di default. **Nessuna modifica richiesta.**

### Sign-out vs Logout (Q5)

**Handler funzionalmente identici** (line 1284-1292 vs 1293-1301). Entrambi:

1. Controllano `isProjectModified()`
2. Se modificato → mostrano `U.dialog('You are about to log out without saving...', 'logout', ...)`
3. In ogni caso chiamano `await AuthApi.logout()`

Differenze:
- **Icona**: Sign-out usa `<i className="bi bi-box-arrow-right" />`, Logout usa `icon['logout']` (oggetto/lookup, da `./icons/Icons`).
- **Shortcut**: Sign-out ha `shortcutPills: formatShortcutPills(SHORTCUTS.SIGN_OUT)` (⌥⌘Q), Logout **non ha shortcut**.
- Una è asincrona dichiarata (`async ()`) e l'altra `async()` — formattazione, no semantica.

**Logout è una duplicazione legacy.** Rimuoverla è safe.

### Recent Projects (Q6)

- **Source**: `user.projects` (Redux, via `props.user`). Popolato a Navbar.tsx:1238-1251.
- **Ordering & cap esistenti**: `.sort((a,b) => (b.lastModified > a.lastModified) ? 1 : -1).slice(0,20)` — **cap hardcoded a 20**. Le voci `disabled` se `pid === projectid` (cioè il progetto attualmente aperto).
- **Click handler**: `() => R.navigate('/project?id=' + pid)` — **NB: `R.navigate` fa full reload** (vedi fix `2026-05-15` sidebar FILTERS, U.tsx:140). Lasciato così intenzionalmente per ora.
- **Riuso altrove**: la **stessa logica** è duplicata in `LeftBar.tsx:491-505` (sezione "Recently Modified", cap 5, `.slice(0,5)`) e in `RightPanel/RightPanel.tsx` (quick links). Non c'è un selector/hook condiviso, le 3 implementazioni navigano direttamente i progetti dell'utente.

Per il refactor cap=7: cambiare `.slice(0,20)` → `.slice(0,7)` in `Navbar.tsx:1241`. Niente costante da estrarre se non strettamente richiesto (i tre punti hanno 3 cap diversi e indipendenti: navbar=20, LeftBar=5, RightPanel=N).

### New Project action (Q7)

**Esiste, ma non collegata al menu File**. Il pattern attuale:

1. **API**: `ProjectsApi.create(type: 'private'|'public'|'collaborative', name: string, ..., existingProjects?: LProject[])` — usata sia in `AllProjects.tsx:38` (con il dialog) sia in `RightPanel/RightPanel.tsx:51` (quick create con default).
2. **UI dialog**: `CreateProjectDialog` (`components/CreateProjectDialog/CreateProjectDialog.tsx`), monta in `AllProjects.tsx` (line 145-152). Aperto/chiuso via state locale `showCreateDialog` + handler `handleOpenCreateDialog`.
3. **Trigger inter-componente**: l'event globale `JjodelEvents.NEW_PROJECT`. Listener in `AllProjects.tsx:50-55` chiama `handleOpenCreateDialog`. Dispatch già usato da:
   - Navbar keydown ⌥⌘N (`SHORTCUTS.NEW`) quando `context === 'DASHBOARD'` (line 949-953): `window.dispatchEvent(new CustomEvent(JjodelEvents.NEW_PROJECT))`.
   - Listener registrato solo se la `AllProjectsPage` è montata. **Limite**: se l'utente è nell'editor (`/project`), il listener non c'è — bisogna prima navigare a `/allProjects` e poi firare l'evento (o cambiare strategia).
4. **Side effects post-create**: dipendono dal tipo. `ProjectsApi.create` (verificare in `frontend/src/api/persistance/ProjectsApi.ts` per dettaglio; non letto in questo discovery — fuori scope per i quesiti Q1-Q8).

Per il menu: aggiungere voce "New Project" che chiama `window.dispatchEvent(new CustomEvent(JjodelEvents.NEW_PROJECT))`. La voce attualmente esistente in `File > New > Project` (line 1311) è `function: placeholder, disabled: true` — andrebbe sostituita o spostata fuori dal sotto-menu New (la nuova voce è top-level del File menu, non un nested).

Voce **già pronta come scaffold** in shortcut layer: `SHORTCUTS.NEW` è `⌥⌘N` (con Alt per evitare intercept di Chrome — vedi commento line 119). Il design doc richiede **⌘N** liscio — **conflitto noto** con "Nuova finestra" del browser. Va presa una decisione: (a) mantenere ⌥⌘N e mostrarla sulla voce di menu, (b) cambiare a ⌘N e accettare il rischio di intercept (vedi line 119: "Using Alt+CMD to avoid Chrome intercepting CMD+N, CMD+W, etc.").

### Keyboard shortcuts (Q8)

**Due sistemi coesistenti** (non strettamente sovrapposti):

1. **Listener globale inline in Navbar.tsx** (line ~900-1230): un grosso `useEffect` con `document.addEventListener('keydown', ...)` che usa `matchesShortcut(event, SHORTCUTS.X)` per branchare su context (`detectCurrentContext()`) e dispatchare l'azione. Questo è il sistema **autoritativo** per le shortcut globali (⌥⌘N, ⌘S, ⌥⌘W, ⌥⌘Q, ⌥⌘M, ⌘+, ⌘-, ⌘0, ⇧⌘L, ⌘B, ecc.).
2. **Registrazione menu-derivata** (line 1518-1521): `Keystrokes.register('#root', 'navbar', keybindings)` dove `keybindings = flattenObjectByKey(items, 'subItems').filter(e => e?.keystroke?.length && !e.disabled)`. Usa `i.keystroke` (NON `i.shortcutPills`). Le voci del menu attuali usano `shortcutPills: formatShortcutPills(SHORTCUTS.X)` per il **display visivo** del badge, ma molte non hanno il campo `keystroke` valorizzato → il registry `Keystrokes` è essenzialmente **dormiente** per la maggior parte delle voci di menu (la deduplicazione è gestita dal listener globale).

**SHORTCUTS source of truth**: `frontend/src/utils/keyboardShortcuts.ts:117` (modifier-based config). **NON** `frontend/src/constants/shortcuts.ts` (presente ma orphaned — vedi Note collaterali).

Per aggiungere "New Project ⌘N" sulla voce di menu basta `shortcutPills: formatShortcutPills(SHORTCUTS.NEW)` (renderizza ⌥⌘N) oppure introdurre una nuova entry tipo `NEW_PROJECT_CMD_N: { key: 'N', modifiers: ['cmd'] }` se si vuole forzare ⌘N puro (con i rischi di cui sopra). Il listener globale ⌥⌘N per dashboard esiste già (line 944-953).

---

## Stima refactoring per hide-not-grey

**Cambio strutturale: PICCOLO.**

Motivazione: il pattern di hiding via `cond ? null : {...}` esiste già in File menu, è supportato nativamente da `makeEntry` (skip su `null` + skip su `subItems.length === 0`), e `MainMenu` skipa top-level senza `subItems`. **Niente refactor del renderer.** Il lavoro è di sostituzione meccanica per ciascuna voce: `disabled: isDashboard` → `isDashboard ? null : {...}` (o variante più granulare con `isDashboard || metamodels.length === 0`).

Stima per menu (numero di voci da convertire):

| Menu | Voci da convertire | Note |
|---|---|---|
| Jjodel | 1 (Logout duplicato → remove, non hide) | Rimozione, non hide |
| File | già fatto in larga parte (8 voci con `?:null`), residuo: line 1311 "Project" placeholder | Quasi tutto hide già |
| Edit | 4-5 voci (Undo, Redo, Favorites, Copy Public Link) | Tutto `disabled: isDashboard` |
| View | 7-8 voci (Zoom in/out/reset, edge labels, background, dot grid, singletons, M2 analytics-style) | "Switch to Mode" + Fullscreen + Debug devono restare visibili anche in dashboard |
| Tools | 3 voci (Generate Environment, Polymetric View, Metamodel Tools) | Già usa spread condizionale per la prima parte |
| Analyze | 2 voci sempre disabled (Live Validation, Validate) + 3 advanced | Decidere: nascondere i placeholder permanenti `disabled:true` (Live Validation, Validate, Copy Public Link, "Delete Project") oppure tenerli come stub di roadmap |

**Diff totale stimato**: 20-40 righe modificate in `Navbar.tsx` (il file della config), zero altri file toccati. Rimozione del duplicato Logout: 1 voce (~9 righe).

**Caso speciale**: dopo hide aggressivo, alcuni top-level menu **scomparirebbero in dashboard**:
- **Tools** in dashboard ha solo "No metamodel tools" (disabled) + Polymetric View (disabled). Se hide-not-grey → menu vuoto → `MainMenu` lo nasconde automaticamente.
- **Analyze** in dashboard non-advanced ha solo 2 placeholder permanenti `disabled:true`. Idem.
- **Edit** in dashboard: solo "Copy Public Link" che è `disabled:true` permanente. Idem.

In dashboard quindi resterebbero verosimilmente: **Jjodel, File, View** (3 menu su 6). Decisione di design implicita ma rilevante — vale la pena confermare con Alfonso prima di applicare.

---

## Proposta di scomposizione prompt operativi

Suggerisco **3 prompt separati** in sequenza, non uno solo, per le seguenti ragioni:

1. **Prompt B1 — Jjodel menu cleanup + File menu New Project**
   - Rimuovere voce "Logout" duplicata.
   - Sostituire voce stub "Project" in `File > New > Project` (line 1311) con voce top-level "New Project" che dispatcha `JjodelEvents.NEW_PROJECT`, con `shortcutPills: formatShortcutPills(SHORTCUTS.NEW)` (oppure decidere ⌘N puro — domanda da fare).
   - Cambiare cap `recentProjects` da 20 a 7 (1 cifra).
   - Diff: ~15 righe in 1 file.
   - **Sano da fare prima** perché chiude i cambi più mirati senza ambiguità di design.

2. **Prompt B2 — Hide-not-grey su Edit / Tools / Analyze**
   - Conversione meccanica di `disabled: isDashboard` → `isDashboard ? null : {...}` su voci specifiche.
   - Rimozione/hide dei placeholder permanenti (`disabled:true` senza function reale: "Live Validation", "Validate", "Copy Public Link", "Delete Project").
   - Top-level Edit/Tools/Analyze potrebbero scomparire in dashboard (conferma).
   - Diff: ~20 righe in 1 file.
   - Separato da B1 perché richiede una **decisione di design** (i menu top-level possono scomparire?).

3. **Prompt B3 — Hide-not-grey su View**
   - Più delicato: View ha voci che restano valide anche in dashboard ("Switch to Advanced Mode", "Fullscreen", "Debug Mode") e voci editor-only (zoom, edge labels, background, dot grid, singletons).
   - Conversione granulare voce-per-voce.
   - Diff: ~10 righe.
   - Separato perché va testato visivamente con cura (è il menu più usato).

Vantaggio della scomposizione: ogni prompt produce un commit atomico testabile, e B2/B3 possono essere ricalibrati dopo aver visto come si comporta B1.

---

## Note collaterali

(Cose emerse durante il discovery che non rientrano nei quesiti Q1-Q8 ma vale la pena segnalare. **Nessuna azione presa.**)

1. **SHORTCUTS duplicato e orphaned**: `frontend/src/constants/shortcuts.ts:11` definisce un `SHORTCUTS` parallelo con keys lowercase-dotted (`'file.new.project'`, ecc.) e helper `getShortcut(id)`. Nessun import di questo file da Navbar (Navbar usa `frontend/src/utils/keyboardShortcuts.ts`). Cercare `from '.*constants/shortcuts'` per vedere se è usato altrove o se è dead code. Eventuale cleanup separato.

2. **"Recent Projects" tripla duplicazione**: stessa lista user.projects, 3 implementazioni indipendenti con cap diversi (Navbar 20, LeftBar 5, RightPanel N). Non da rifattorizzare ora, ma se un giorno serve un selector condiviso `useRecentProjects(cap)`, qui ci sono 3 call-site da uniformare.

3. **`R.navigate` su Recent Projects**: la voce di Navbar (`function: ()=> R.navigate('/project?id=' + pid)`, line 1247) usa `R.navigate` che fa **full reload** (vedi U.tsx:140). Per il caso "ho un progetto aperto e clicco un altro Recent" il reload è in realtà desiderabile (resetta stato). Per ora va bene, ma è coerentemente diverso dal pattern React Router usato dopo il fix delle FILTERS sidebar.

4. **"Export Canvas" condizioni misti**: line 1352-1361 usa sia `isDashboard ? null` (hide) sia `disabled: metamodels.length === 0` (grey) sullo stesso blocco. Coerenza imperfetta: il parent è hidden in dashboard, i child sono comunque marked disabled. Ridondante ma non rotto.

5. **`globalProject = project` line 566**: side effect che assegna `project` a una variabile module-level (line 99 forse, non letta). Pattern fragile per testing, non oggetto di questo discovery.

6. **`Keystrokes.register('#root', 'navbar', keybindings)`** chiamato a OGNI render (line 1521, body del componente). Dentro `Keystrokes.register` (U.tsx:3442-3443) c'è guard `if (avoidDuplicateRegisters[src]) return` quindi è no-op dopo la prima call — ma è uno smell da segnalare per future ottimizzazioni (dovrebbe essere in `useEffect`).

---

**STOP.** Nessuna modifica al codice in questa fase.
