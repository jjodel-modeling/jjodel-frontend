# Discovery: notification system

> **Tipo**: solo lettura. Nessuna modifica al codice.
> **Data**: 2026-04-25
> **Scopo**: mappare i sistemi di notifica/toast esistenti prima del redesign.

---

## 1. Sistema notifiche esistente

**Esiste: PARZIALE → coesistono DUE sistemi paralleli + alcuni feedback widget isolati. È esattamente il caso da unificare.**

### 1A. Sistema "moderno" — ToastProvider (Context-based)

| Componente | Path | Ruolo |
|---|---|---|
| Provider + Context | `frontend/src/components/Toast/ToastContext.tsx:14` | Context API + state stack |
| Container | `frontend/src/components/Toast/ToastContainer.tsx:12` | Renderizza la lista toast |
| Singolo toast | `frontend/src/components/Toast/Toast.tsx:24` | Render del singolo card |
| Dispatch standalone | `frontend/src/components/Toast/toastDispatch.ts:40` | API senza React (CustomEvent) |
| Tipi & prefs | `frontend/src/components/Toast/toastTypes.ts:3` | `ToastType` + `ToastPreferences` |
| Stili | `frontend/src/components/Toast/toast.scss` | 162 righe, 4 position variants + dark theme |
| Index | `frontend/src/components/Toast/index.ts:4` | esporta `ToastProvider`, `useToastContext`, `toast` |

**API esposta** (`ToastContext.tsx:14-23`):
```tsx
interface ToastContextValue {
    toasts: ToastMessage[];
    addToast: (message: ReactNode, type?: ToastType, options?: ToastOptions) => string;
    removeToast: (id: string) => void;
    clearAll: () => void;
    success: (message: ReactNode, options?: ToastOptions) => string;
    error:   (message: ReactNode, options?: ToastOptions) => string;
    info:    (message: ReactNode, options?: ToastOptions) => string;
    warning: (message: ReactNode, options?: ToastOptions) => string;
}
```

**API standalone (no React)** — `toastDispatch.ts:40-84`:
```ts
toast(input: string | ToastOptions): void
toast.success(message, title?)
toast.error  (message, title?)
toast.warning(message, title?)
toast.info   (message, title?)
```
Sotto al cofano fa `window.dispatchEvent(new CustomEvent(JjodelEvents.TOAST, { detail }))`. Il listener è in `ToastContext.tsx:97-125`.

**Tipi supportati**: `'success' | 'error' | 'warning' | 'info'` (`toastTypes.ts:3`).
Icone (Bootstrap Icons, `Toast.tsx:17-22`):
- success → `bi-check-circle-fill`
- error → `bi-x-circle-fill`
- warning → `bi-exclamation-triangle-fill`
- info → `bi-info-circle-fill`

**Stack/durata/dismissal**:
- Max 5 toast contemporanei (`MAX_TOASTS = 5` in `ToastContext.tsx`)
- Auto-dismiss: info/success → 4000 ms, warning/error → manual (default)
- Override per-toast con `dismiss: 'auto' | 'manual'`
- Preferenze persistite in `localStorage` con key `'jjodel-toast-preferences'` (toggle per tipo + position + duration)

**Mounting**: `App.tsx:48` (import) + `App.tsx:110` (`<ToastProvider>` wrappa tutta l'app).

**Eventi globali ascoltati** (`ToastContext.tsx`):
- `JjodelEvents.TOAST` (linea 122) — payload toast generico
- `JjodelEvents.GUARD_VIOLATION` (linee 81-94) — emessi da `model/conformance/ConformanceGuard.ts`, mostrato come warning se `enableGuardViolations: true`
- `jjodel:toast-prefs-changed` (linea 37) — reload prefs da localStorage

### 1B. Sistema "legacy" — Alert Redux-based

| Componente | Path |
|---|---|
| Componente render | `frontend/src/components/alert/Alert.tsx:108` (rendering toast-style) |
| Helper API | `frontend/src/common/U.tsx:393` (`U.alert()`) |
| Stili | `frontend/src/components/alert/style.scss:396-564` |

**API**: `U.alert('e' | 'w' | 'i' | 's', title, message)` → scrive in Redux state via `SetRootFieldAction.new('alert', type + U.alertSeparator + title + U.alertSeparator + message, '')`.

**Catena**: `U.alert()` → Redux `state.alert` → `mapStateToProps` (`Alert.tsx:156`) splitta sul separatore `£` (`Alert.tsx:161`) → renderizza `.toast-alert-container`.

**Auto-dismiss**: 4000 ms + 300 ms exit animation (uguale al sistema nuovo, ma duplicato).

**Mounting**: `App.tsx:121` (`<AlertVisualizer/>` dentro il `ToastProvider`).

> **Nota critica**: il toast del name clash che l'utente vede oggi proviene da QUESTO sistema legacy, non dal nuovo `ToastProvider`. Sono due overlay che convivono visivamente — qualunque redesign deve unificarli.

### 1C. Altri feedback temporanei sparsi

| Componente | Path | Pattern |
|---|---|---|
| `Dialog` (modal con conferma) | `frontend/src/components/alert/Dialog.tsx` | Redux `state.dialog`, trigger `U.dialog()` (`U.tsx:396-411`) |
| `NotificationCenter` (popover bell) | `frontend/src/components/NotificationCenter.tsx:32-41` | Hook `useNotifications()` ma sample notifications hardcoded — **mockup non collegato** |
| `NotificationWidget` (banner system notices) | `frontend/src/components/NotificationWidget/NotificationWidget.tsx` | Fetch da Cloudflare Workers, dismiss persistente in localStorage/sessionStorage |
| `JjtlNotifyToast` (toast locale JjTL) | `frontend/src/jjtl/components/dialogs/JjtlNotifyToast.tsx:56-90` | Hook locale `useToasts()` → auto-dismiss 3000 ms — **isolato a JjTL** |
| `react-hot-toast` (import unused) | `frontend/src/components/forEndUser/SizeInput.tsx:3` | **Import morto da rimuovere** |

---

## 2. Trigger del toast name clash

### File primari che generano il messaggio

| File | Linea | Funzione | Messaggio |
|---|---|---|---|
| `frontend/src/model/logicWrapper/LModelElement.tsx` | **5981** | `set_name()` | `Name '${name}' is already used in this scope by: ${others}` |
| `frontend/src/model/logicWrapper/LModelElement.tsx` | 6005 | `set_father()` | `Cannot reparent '${self.name}': name is already used in the new scope by: ${others}` |
| `frontend/src/joiner/classes.ts` | 2120 | `set_name()` (LNamedElement) | `Cannot rename the selected element since this name is already taken.` |
| `frontend/src/model/logicWrapper/LModelElement.tsx` | 5293 | `set_name()` (LModel) | `Cannot rename the selected model, this name is already taken.` |

### Catena di chiamata

```
1. User edita un nome nel UI (rename inline / properties panel)
   ↓
2. set_name() su LModelElement (LModelElement.tsx:5978)
   ↓
3. validateNameUniqueness(self, name)        // helper interno
   ↓
4. if (!result.valid) → U.alert('e', title, message)   // LModelElement.tsx:5981
   ↓
5. SetRootFieldAction.new('alert', 'e£title£message', '')   // U.tsx:393
   ↓
6. Redux state.alert si aggiorna
   ↓
7. AlertComponent (Alert.tsx:156) tramite mapStateToProps consuma alert
   ↓
8. Render <ToastAlertContainer> + .toast-alert (style.scss:396-564)
   ↓
9. Auto-dismiss 4000 ms + 300 ms exit animation
```

> **Quindi**: il toast del name clash viaggia sul **sistema legacy** (`U.alert` → Redux → `Alert.tsx`), NON sul nuovo `ToastProvider`. Questo spiega perché lo stile è incoerente con il design system attuale.

### Ampiezza dell'utilizzo di `U.alert()`

**~122 chiamate totali** nel codebase. Top per file:

| File | # calls | Contesto |
|---|---|---|
| `components/project/ProjectEditor.tsx` | ~35-42 | Export/import metamodel, transformation errors, download |
| `components/abstract/DockManager.tsx` | 6 | Errori apertura tab documentation/transformation |
| `components/abstract/tabs/MetamodelTab.tsx` | 5 | Canvas export, copia immagine |
| `components/Settings/UnifiedSettingsModal/sections/*` | 4 | Profile update, password change |
| `model/logicWrapper/LModelElement.tsx` | 3 | Name uniqueness, reparent |
| `joiner/classes.ts` | 2 | Rename element, print publish |
| `App.tsx` | 1 | Browser compatibility (Firefox) |

> Migrare il name clash al nuovo `ToastProvider` significa **non** migrare tutte le 122 occorrenze, ma il name clash è il caso visibile più frequente — punto giusto da cui partire.

---

## 3. Jjodie (assistente AI)

**Esistono DUE componenti distinti**, uno in produzione e uno demo.

### 3A. Jodie (sistema in produzione)

| File | Path | Righe |
|---|---|---|
| Wrapper / state manager | `frontend/src/components/Jodie/Jodie.tsx` | 378 |
| Finestra chat (draggable + resizable) | `frontend/src/components/Jodie/JodieWindow.tsx` | 311 |
| Pulsante minimizzato (FAB) | `frontend/src/components/Jodie/JodieMinimized.tsx` | 29 |
| Stili | `frontend/src/components/Jodie/JodieWindow.css` | ~250 |

**Mounted in**: `App.tsx:40` import + `App.tsx:~193` render `<Jodie/>` dentro `<Try>` wrapper.

**Posizionamento** (`JodieWindow.css` + JS dinamico in `JodieWindow.tsx:76-81`):
```css
.jodie-window { position: fixed; z-index: 10000; }
/* width/height dinamici via state, default 380x520px */
```
```ts
const initialPosition = config.position || {
    x: window.innerWidth - DEFAULT_SIZE.width - 20,    // bottom-right
    y: window.innerHeight - DEFAULT_SIZE.height - 20,  // offset 20px
};
```

**Stati esistenti** (`Jodie.tsx:39-45`):
```ts
const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isOpen: false,        // ← finestra aperta/chiusa
    isMinimized: false,   // ← compat tipo
    isWaiting: false,     // ← typing indicator
    hasUnread: false,     // ← unread badge
});
```

**Eventi globali ascoltati** (`Jodie.tsx:69-91`):
```ts
window.addEventListener(JjodieEvents.OPEN, handleOpenJodie);
window.addEventListener(AIEvents.SETTINGS_CHANGED, handleSettingsChanged);
window.addEventListener(JjScriptEvents.EXECUTING, handleExecuting);
window.addEventListener(JjScriptEvents.EXECUTION_END, handleExecutionEnd);
```

**Render principale** (`Jodie.tsx:349-374`):
```tsx
return (
    <>
        {chatState.isOpen
            ? <JodieWindow ... onClose={handleClose} ... />
            : <JodieMinimized hasUnread={chatState.hasUnread} onClick={handleOpen} />}
    </>
);
```

**Features**: drag/resize 8-direction, multi-provider AI, vision API, PDF support, RAG (`JjodieRagService`), JjScript execution listener, settings modal integration, unread badge.

### 3B. JjodieWidget (demo UI-only — NON mounted)

| File | Path |
|---|---|
| Componente | `frontend/src/components/JjodieWidget/JjodieWidget.tsx` (469 righe) |
| Stili | `frontend/src/components/JjodieWidget/jjodie-widget.scss` (508 righe) |

Standalone, demo con risposte simulate basate su keyword. Posizionamento `position: fixed; bottom: 24px; right: 24px; z-index: 10000` (FAB) + `z-index: 10001` (panel). **NON viene renderizzato in App.tsx** — riferimento utile per stile/animazioni ma non per logica.

### Event registry rilevante

`frontend/src/events/registry.ts:70-73`:
```ts
export const JjodieEvents = {
  METAMODEL_UPDATED: 'jjodie:metamodel-updated',
  OPEN: 'jodie:open',   // ← trigger esterno per aprire la chat
} as const;
```

> **Punto di estensibilità**: Jodie è già un container di stato + listener di eventi globali. Per agganciare notifiche basta (a) aggiungere un listener in `Jodie.tsx` per un nuovo evento `JjodieEvents.NOTIFICATION_RECEIVED`, (b) estendere `chatState` con `notificationCount`/`hasNotification`, (c) propagare via callback a `JodieWindow`. Tutto idiomatic con il pattern già in uso (no Redux).

---

## 4. Settings panel

### Componenti

| File | Path | Ruolo |
|---|---|---|
| Modal principale | `frontend/src/components/Settings/UnifiedSettingsModal/UnifiedSettingsModal.tsx` | Sidebar nav + content area |
| Context (state + hooks) | `frontend/src/contexts/SettingsModalContext.tsx` | `useSettingsModal()`, `useOpenSettings()` |
| Stili | `frontend/src/components/Settings/UnifiedSettingsModal/UnifiedSettingsModal.scss` (1012 righe) | Design system tokens |
| Sezioni | `frontend/src/components/Settings/UnifiedSettingsModal/sections/` | 6 file (Profile, Security, Providers, Prompts, Appearance, Advanced) |

**Tipo di UI**: modal overlay con `ReactDOM.createPortal`, position fixed, backdrop blur, animazione `scale(0.95) → 1` + `opacity 0 → 1` (200ms ease-out). Chiude su Escape o backdrop click.

**Layout**: sidebar 240px a sinistra (NAV_GROUPS) + content scrollable a destra (padding 32×40, flex:1).

### Pattern dichiarativo per le sezioni

`UnifiedSettingsModal.tsx:17-61`:
```tsx
export type SettingsSection = 'profile' | 'security' | 'providers' | 'prompts' | 'appearance' | 'advanced';

const NAV_GROUPS: NavGroup[] = [
    { label: 'GENERAL',   items: [
        { id: 'profile',    label: 'Profile',    icon: 'bi-person' },
        { id: 'security',   label: 'Security',   icon: 'bi-shield-lock' }] },
    { label: 'AI',        items: [
        { id: 'providers',  label: 'Providers',  icon: 'bi-robot' },
        { id: 'prompts',    label: 'Prompts',    icon: 'bi-chat-left-text' }] },
    { label: 'DISPLAY',   items: [
        { id: 'appearance', label: 'Appearance', icon: 'bi-palette' }] },
    { label: 'DEVELOPER', items: [
        { id: 'advanced',   label: 'Advanced',   icon: 'bi-gear' }] },
];
```

**Render** (`UnifiedSettingsModal.tsx:119-136`) — switch case su `activeSection`:
```tsx
const renderSectionContent = () => {
    switch (activeSection) {
        case 'profile':    return <ProfileSection />;
        case 'security':   return <SecuritySection />;
        case 'providers':  return <ProvidersSection />;
        // ...
        default:           return <ProfileSection />;
    }
};
```

### API per aprire una sezione specifica

`SettingsModalContext.tsx:29-35`:
```tsx
const openSettings = useCallback((section?: SettingsSection) => {
    if (section) setCurrentSection(section);
    setIsOpen(true);
}, []);
```

**Usage**:
```tsx
const { openSettings } = useSettingsModal();
openSettings('providers');
```
Esempi nel codebase:
- `pages/components/Navbar.tsx:341` → `openSettings('profile')`
- `components/StatusBarRightZone.tsx` → `settingsModal?.openSettings('providers')`
- `components/common/ProviderSelector.tsx` → `settingsModal.openSettings('providers')`

### Controlli UI già disponibili (classi CSS riutilizzabili)

| Controllo | Classe SCSS |
|---|---|
| Toggle switch orizzontale | `.settings-toggle` |
| Input text/email | `.settings-field-input` |
| Select | `.settings-field-select` |
| Password con reveal | `.settings-password-input` |
| Buttons | `.settings-btn-primary`, `.settings-btn-secondary`, `.settings-btn-danger` |
| Form row 2-col grid | `.settings-form-row` |
| Card collapsible | `.settings-card` |
| Password strength bar | `.settings-password-strength` |
| Divider | `.settings-divider` |
| Header sezione | `.settings-section-header` (titolo + descrizione + badge "Unsaved") |

**State persistence** per sezione: Profile → backend (`UsersApi.updateUserById`), Appearance → localStorage, Security → backend (`ChangePasswordRequest`). Le notification preferences seguirebbero il pattern Appearance (localStorage), coerente con `ToastPreferences` che già usa `'jjodel-toast-preferences'`.

> **Per aggiungere "Notifications"**: 4 step → (1) creare `sections/NotificationsSection.tsx` copiando il pattern da `ProvidersSection`, (2) aggiungere `'notifications'` al type `SettingsSection`, (3) aggiungere item al gruppo (probabilmente nuovo gruppo "FEEDBACK" o sotto "DISPLAY"), (4) aggiungere `case 'notifications'` allo switch + export in `sections/index.ts`. Pattern esistente, zero refactor.

---

## 5. Convenzioni rilevanti

### A. SCSS

- **File SCSS sempre accanto al `.tsx`** del componente (es. `Toast/toast.scss` accanto a `Toast/Toast.tsx`)
- **Token design system centralizzati**: `frontend/src/styles/tokens/_colors-light.scss` + `_colors-dark.scss` (entry point `index.scss`, variabili attive in `variables.scss`)
- **Naming**: BEM (`.toast-container`, `.toast--success`, `.toast-icon`)
- **Token rilevanti per notifiche** (light theme):
  ```scss
  --color-success: #22c55e;       --color-success-bg: #f0fdf4;
  --color-error:   #ef4444;       --color-error-bg:   #fef2f2;
  --color-warning: #f59e0b;       --color-warning-bg: #fffbeb;
  --color-info:    #3b82f6;       --color-info-bg:    #eff6ff;
  --color-accent:  #334155;       /* slate-700 — per backgrounds */
  ```
- **Token spacing**: `--space-1: 4px`, `--space-2: 8px`, `--space-4: 16px`...
- **Token elevation**: `--shadow-sm/md/lg`
- **Token z-index**: `--z-toast: 10100`, `--z-modal: 9999`
- **Dark mode**: `[data-theme="dark"]` selector
- **Token legacy ELIMINATI** (da CLAUDE.md): `--accent`, `--bg-1..5`, `--secondary`, `--terziary`, `--radius`, `--color`. **NON reintrodurre**.
- **Icone**: solo Bootstrap Icons `bi-*`. Mai altre librerie.

### B. State management per dialog/modal/overlay

**Pattern dominante**: React Context + `useState` (no Redux per UI overlay, no MobX). Provider che include il container visuale al proprio interno.

Esempi paradigmatici:
- `Toast/ToastContext.tsx` → Provider include `<ToastContainer>`
- `contexts/GlobalDrawerContext.tsx` → Provider include `<GlobalDrawer>`
- `contexts/SettingsModalContext.tsx` → Provider include `<UnifiedSettingsModal>`
- `components/ConfirmDialog/ConfirmDialog.tsx` → state delegato al parent (props + callback) — pattern per dialog locali

`U.alert()` + `state.alert` Redux è **eccezione legacy** — non ripeterla per nuovi sistemi.

### C. Custom DOM events già esistenti

Registry centralizzato: `frontend/src/events/registry.ts`. Top 10 rilevanti per UI feedback:

| Evento | Dispatch | Listener | Uso |
|---|---|---|---|
| `JjodelEvents.TOAST` (`'jjodel:toast'`) | `Toast/toastDispatch.ts:81` | `ToastContext.tsx:122` | Standalone toast dispatch |
| `'jjodel:toast-prefs-changed'` | Settings | `ToastContext.tsx:37` | Reload prefs da localStorage |
| `JjodelEvents.GUARD_VIOLATION` | `model/conformance/ConformanceGuard.ts` | `ToastContext.tsx:92` | Warning conformance |
| `JjodieEvents.OPEN` (`'jodie:open'`) | (chiunque) | `Jodie.tsx:69` | Apri assistente AI |
| `JjodieEvents.METAMODEL_UPDATED` | (Jodie) | (futuri listener) | Notifica MM aggiornato |
| `'jjodel:help-open'` | `ContextMenu.tsx:237` | `HelpDrawer.tsx` | Apri drawer help |
| `'jjodel:explain-open'` | `EditorV2.tsx:402` | `ExplainModal.tsx` | Apri modal AI explanation |
| `AIEvents.SETTINGS_CHANGED` | `Settings/sections/ProvidersSection` | `Jodie.tsx:81` | Reload provider AI |
| `JjScriptEvents.EXECUTING` | `ScriptBlock.tsx:263` | `Jodie.tsx`, `StatusBar.tsx` | Inizio script |
| `JjScriptEvents.EXECUTION_END` | `ScriptBlock.tsx:452` | `Jodie.tsx`, `StatusBar.tsx` | Fine script |

**Convenzione**: nuovo evento → aggiungere costante tipizzata in `events/registry.ts` (no string letterali sparse). Pattern consolidato.

### D. Notifiche esistenti da unificare

| Sistema | Stato | Azione consigliata |
|---|---|---|
| `ToastProvider` (nuovo) | ✅ Production-ready | **Tenere come single source of truth** |
| `Alert` Redux + `U.alert()` | ⚠️ Legacy in uso (122 chiamate) | Migrare gradualmente — facade `U.alert()` può delegare a `toast()` |
| `NotificationCenter` (mockup popover) | 🟡 Non collegato | Decidere: cestinare o collegare al nuovo provider |
| `NotificationWidget` (banner system notices) | ✅ Funzionante (uso diverso) | Tenere separato — è system status, non transient feedback |
| `JjtlNotifyToast` (locale JjTL) | ⚠️ Duplicato | Migrare a `ToastProvider` globale |
| `Dialog` Redux (`U.dialog()`) | ✅ Use case diverso (modal di conferma) | Tenere — non è notifica transient |
| `react-hot-toast` import | ❌ Import morto | Rimuovere |

---

## 6. Raccomandazione architetturale

**Estendere il `ToastProvider` esistente, non crearne un altro.** Il sistema in `frontend/src/components/Toast/` è già completo, mountato in App, integrato con preferenze localStorage e con un canale CustomEvent per dispatch da codice non-React. È esattamente la base che serve.

**Lavoro effettivo del redesign** (in ordine):

1. **Stile**: rifare `Toast/toast.scss` usando i token del design system corrente (`--color-{success,error,warning,info}{,-bg}`, `--shadow-md`, `--space-2`, `--z-toast`). Oggi usa numeri hardcoded.
2. **Migrare il name clash**: in `LModelElement.tsx:5981` (e i 3 punti correlati) sostituire `U.alert('e', ...)` con `toast.error(...)`. È il caso più visibile e isolato.
3. **Spegnere il sistema legacy gradualmente**: il facade `U.alert()` in `common/U.tsx:393` può internamente delegare a `toast()` — così tutte le 122 chiamate restano funzionanti senza refactor di massa, ma rendono il render via il nuovo sistema. `Alert.tsx` + `state.alert` Redux possono restare temporaneamente come fallback finché non si verifica che nessuno scrive direttamente.
4. **Sezione Settings → "Notifications"**: nuova `sections/NotificationsSection.tsx` che espone i toggle di `ToastPreferences` (position, autoDismissDuration, enableGuardViolations, enableSuccess, enableInfo). Aggiungere `'notifications'` a `SettingsSection` type, item nel gruppo NAV_GROUPS (proporrei nuovo gruppo "FEEDBACK"), case nello switch, export.
5. **Hook con Jodie (opzionale)**: se serve sincronizzare un badge sul FAB di Jodie quando arrivano notifiche importanti, aggiungere listener `JjodelEvents.TOAST` in `Jodie.tsx` (o un nuovo `JjodieEvents.NOTIFICATION_RECEIVED`) → setState `hasUnread`. Niente Redux, pattern già in uso.

**File da toccare nella fase implementativa**:

| File | Azione |
|---|---|
| `frontend/src/components/Toast/toast.scss` | Restyling con design tokens |
| `frontend/src/components/Toast/Toast.tsx` | Eventuali tweak struttura (icone, action button) |
| `frontend/src/model/logicWrapper/LModelElement.tsx:5981, 6005, 5293` | Sostituzione `U.alert` → `toast.error` |
| `frontend/src/joiner/classes.ts:2120` | Idem |
| `frontend/src/common/U.tsx:393` | (Opt) facade `U.alert` → `toast()` |
| `frontend/src/components/Settings/UnifiedSettingsModal/sections/NotificationsSection.tsx` | **Nuovo file** |
| `frontend/src/components/Settings/UnifiedSettingsModal/sections/index.ts` | Export |
| `frontend/src/components/Settings/UnifiedSettingsModal/UnifiedSettingsModal.tsx` | +type, +NAV_GROUPS, +switch case |
| `frontend/src/events/registry.ts` | (Opt) `JjodieEvents.NOTIFICATION_RECEIVED` |
| `frontend/src/components/Jodie/Jodie.tsx` | (Opt) listener + `hasUnread` |

**Rischi noti**:

- **Doppio rendering visuale durante migrazione**: finché `Alert.tsx` Redux convive con `ToastContainer` nuovo, due overlay potrebbero apparire insieme per brevi finestre. Mitigare facendo passare `U.alert` → `toast()` con un singolo commit, non gradualmente.
- **Collisione z-index**: `JodieWindow` z-index 10000, `JjodieWidget panel` 10001, `--z-toast` 10100, `--z-modal` 9999. I toast hanno priorità più alta — ok per visibilità su Jodie, ma verificare che non coprano la finestra Settings (modal=9999). Confermare scelta esplicita.
- **`react-hot-toast`**: import morto in `SizeInput.tsx:3` — rimuoverlo opportunisticamente per evitare confusione futura.
- **`NotificationCenter` mockup**: lasciato in codebase con sample data, può confondere chi cerca "notification". Decidere fate prima del redesign.
- **`JjtlNotifyToast`**: anch'esso parallelo, locale a JjTL — migrarlo nel nuovo sistema con feature flag se ha use case specifici.
- **Token legacy reintrodotti per sbaglio**: il nuovo SCSS deve usare SOLO i token attuali. CLAUDE.md elenca i token vietati (`--accent`, `--bg-1..5`, `--secondary`, `--terziary`, `--radius`, `--color`). `grep -r` prima di aggiungere variabili.
