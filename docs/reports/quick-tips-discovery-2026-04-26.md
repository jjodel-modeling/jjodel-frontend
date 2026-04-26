# Discovery: Quick Tips component

> **Tipo**: solo lettura. Nessuna modifica al codice.
> **Data**: 2026-04-26
> **Scopo**: localizzare il componente che mostra le "Quick Tip" (bubble con tip rotanti) per pianificare un futuro redesign.

---

## Sezione 1 — Localizzazione

**Primary match (unico componente trovato):** `NotificationWidget`.

| Ruolo | Path |
|---|---|
| Componente principale | `frontend/src/components/NotificationWidget/NotificationWidget.tsx` (167 righe) |
| Stili | `frontend/src/components/NotificationWidget/notification-widget.scss` (170 righe) |
| Mount point | `frontend/src/App.tsx:40` (import) + `frontend/src/App.tsx:162` (`{user && <Try><NotificationWidget/></Try>}` — solo per utenti loggati) |
| Spec di design (riferimento docs) | `docs/redesign/notification-widget-spec.md` (16 KB, gennaio 2026, status "Ready for Implementation") |

**Nota disambiguazione:** il componente è chiamato `NotificationWidget` (non `QuickTip*`), ma è lui che renderizza la card "QUICK TIP" — la classe CSS `.notification-widget.is-tip` distingue lo stile tip dallo stile system-notice. Nessun file con `QuickTip` / `quickTip` / `quick-tip` come identificatore. La directory `frontend/src/components/tooltip/` contiene tooltip generiche e **NON** è correlata.

**Comandi che hanno escluso altri candidati (tutti vuoti):**
- `grep -rni "Press Ctrl+S to save" frontend/src/ frontend/public/` → 0 hit (la stringa è remota, vedi §2)
- `grep -rni "QuickTip|quick-tip|quickTip" frontend/src/` → 0 hit
- `grep -rni "tipBubble|tipPopover|tipCard|onboardingTip|userTip|hintBubble" frontend/src/ frontend/public/` → 0 hit
- `find frontend/src/ frontend/public/ -type d -iname "*tip*" -o -iname "*onboard*" -o -iname "*hint*"` → 1 hit (tooltip generic, non correlato)

---

## Sezione 2 — Sorgente delle tip

**Le tip NON sono hardcoded nel componente né in un file JSON locale. Provengono da un endpoint remoto.**

`NotificationWidget.tsx:16`:
```ts
const API_URL = 'https://jjodel-notifications.alfonso-pierantonio.workers.dev';
```

Fetch nel `useEffect` di mount (`NotificationWidget.tsx:29-43`):
```ts
useEffect(() => {
    const fetchNotifications = async () => {
        try {
            const res = await fetch(API_URL);
            const data: APIResponse = await res.json();
            setPosts(data.posts || []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setIsLoading(false);
        }
    };
    fetchNotifications();
}, []);
```

L'API è un **Cloudflare Worker** (`jjodel-notifications.alfonso-pierantonio.workers.dev`). Backend non versionato in questo repo. Lo spec a `docs/redesign/notification-widget-spec.md:15` lo descrive come ponte verso WordPress (`category: "tip"` o `"system-notice"`).

**Array effettivo delle tip (live, fetchato durante questa discovery):**
```json
{
  "posts": [
    { "id": "2eb4b66b-db50-8045-9d88-fa00b8627485", "category": "tip", "title": "", "message": "Press Ctrl+S to save your project quickly",        "priority": "info" },
    { "id": "2eb4b66b-db50-8072-a7c7-db0e63e05ea0", "category": "tip", "title": "", "message": "Drag and drop to reorder items in the tree view",  "priority": "info" },
    { "id": "2eb4b66b-db50-807f-afff-f393ceb6d9ee", "category": "tip", "title": "", "message": "Right-click on elements for more options",         "priority": "info" },
    { "id": "2eb4b66b-db50-80ad-b9fc-ff2301845f6c", "category": "tip", "title": "", "message": "Use Templates to start your project faster",       "priority": "info" },
    { "id": "2eb4b66b-db50-80dc-a778-d985b242f9bb", "category": "tip", "title": "", "message": "Double-click on a node to edit its properties",    "priority": "info" },
    { "id": "2f04b66b-db50-80cb-95c6-c267cc4ee8f3", "category": "tip", "title": "", "message": "",                                                  "priority": "info" }
  ]
}
```

**Osservazioni sull'array:**
- 6 post di categoria `"tip"`. L'API ritorna anche post di categoria `"system-notice"` (filtrati altrove); nello snapshot corrente non ce ne sono.
- L'ultimo post (`2f04b66b…`) ha `message: ""` vuoto — bug remoto, il componente lo conta come tip valida (lo include in `tips.length`) e lo mostra come body vuoto: `Tip 6 of 6` con stringa vuota.
- Il campo `title` è sempre vuoto stringa per i tip (è renderizzato solo per system-notice — `NotificationWidget.tsx:127`).
- Il campo `priority` per i tip è sempre `"info"` ed è inerte sui tip (le classi `priority-*` sono applicate solo al ramo system-notice — `NotificationWidget.tsx:116`). Per i tip il colore icona è hardcoded amber `#F59E0B` su `.tip-icon-wrapper i` (`notification-widget.scss:128`).

---

## Sezione 3 — Logica di rotazione e persistenza

### Come decide quale tip mostrare

`NotificationWidget.tsx:21,76,81`:
```ts
const [tipIndex, setTipIndex] = useState(0);
// ...
const tips = posts.filter(p => p.category === 'tip');
const currentTip = tips.length > 0 ? tips[tipIndex % tips.length] : null;
```

- **Indice in `useState<number>(0)`** — sempre parte da 0 al mount.
- Modulo `% tips.length` rende il giro circolare.
- Nessuna randomizzazione, nessun seed deterministico, nessun ordering basato su data o ID.

### Risposta inequivocabile alla domanda critica

> **Il componente persiste già lo stato di quali tip sono state viste? → NO.**

`tipIndex` è puramente in-memory. Al refresh / nuovo mount riparte da 0. **Non esiste alcuna scrittura/lettura su `localStorage` o `sessionStorage` per `tipIndex`.**

### Persistenze esistenti nel componente (per system-notices e per il flag "tips dismissed")

Verificate con `grep -rn "localStorage\|sessionStorage" NotificationWidget.tsx` (4 hit totali):

| Storage | Key | Scope | Cosa persiste | Letta da | Scritta da |
|---|---|---|---|---|---|
| `localStorage` | `jjodel-dismissed-notifications` | utente (cross-session) | array di ID di **system-notice** già dismissati (mai tip) | `useState` initializer (`NotificationWidget.tsx:23-26`) | `useEffect` su `dismissedIds` change (linea 47) |
| `sessionStorage` | `jjodel-tips-dismissed` | sessione (singolo tab) | flag `'true'` quando l'utente clicca × sulla tip card → l'intera UI tip scompare per la sessione | `useEffect` linea 53 + early-return linea 84 | `dismiss()` linea 91 quando chiamata senza `id` |

**Punto importante:** `jjodel-tips-dismissed` salva solo il fatto che l'utente *ha chiuso* le tip in questa sessione. NON salva quale tip è stata vista, né quante volte, né l'indice di rotazione. Riaprendo l'app in una nuova sessione (chiusura tab + riapertura) le tip ricompaiono dall'indice 0.

### Click su "Next →"

`NotificationWidget.tsx:96-98`:
```ts
const nextTip = () => {
    setTipIndex(prev => (prev + 1) % tips.length);
};
```
Avanza l'indice circolare. Nessun side effect su storage. Nessuna chiamata API. Nessun custom event.

### Click su "×" (close button della tip card)

`NotificationWidget.tsx:147` → `onClick={() => dismiss()}` → `dismiss()` chiamata senza `id` → ramo `else` (linea 89-93):
```ts
sessionStorage.setItem('jjodel-tips-dismissed', 'true');
setIsVisible(false);
```
Effetto: per il resto della sessione le tip non vengono più mostrate. Le system-notice continuano a comparire (vedi `NotificationWidget.tsx:84` — l'early-return è skippato se c'è una system-notice attiva).

### Trigger di apertura

Non c'è un trigger esterno: il widget si auto-monta sempre se l'utente è loggato (App.tsx:162 con condizione `user`). I gating sono interni:
- Hide su pagina auth: `if (window.location.hash.includes('auth')) return null;` (linea 69).
- Hide se `isLoading || !isVisible || posts.length === 0` (linea 111).
- Hide tip se `sessionStorage.getItem('jjodel-tips-dismissed') === 'true'` E non c'è system-notice (linea 84).

Quindi: **post-login, dopo la fetch, se ci sono tip e nessuna è stata dismissata in sessione, la card appare immediatamente.** Nessun delay esplicito, nessun dispatch di eventi richiesto.

---

## Sezione 4 — Interfacce TypeScript

`NotificationWidget.tsx:4-14`:
```ts
interface NotificationPost {
    id: string;
    category: 'system-notice' | 'tip';
    title?: string;
    message: string;
    priority?: 'warning' | 'info' | 'success' | 'error';
}

interface APIResponse {
    posts: NotificationPost[];
}
```

**Osservazioni:**
- Non esiste un'interfaccia dedicata a `QuickTip` o `Tip`. Le tip sono rappresentate dalla stessa `NotificationPost` con `category === 'tip'`.
- `title` è optional ma lato API è sempre stringa vuota per i tip — il render del titolo (`NotificationWidget.tsx:127`) controlla solo `currentNotice.title` (ramo system-notice), mai per i tip.
- `priority` è optional e inerte per i tip (vedi §2).

---

## Sezione 5 — Integrazione con altri sistemi Jjodel

### Custom DOM events

**Nessun listener** di eventi `jjodel:*` nel componente. **Nessun dispatch** di custom events. Verificato con `grep -rn "addEventListener\|dispatchEvent\|JjodelEvents\|JjodieEvents" NotificationWidget.tsx` → 0 hit.

### Toast / notification system

**Non integrato col `ToastProvider` né con `U.alert()`.** È un canale parallelo. La discovery `discovery-notifications.md` (sezione 1C, linea 93) lo classifica come "system status, non transient feedback" — uso volutamente diverso dai toast.

### Hook condivisi

Nessuno. Usa solo i React core hooks (`useState`, `useEffect`).

### Collegamento con Jjodie (avatar robot in alto a destra)

**Sì — collegamento unidirezionale via attributo DOM su `body`**.

`NotificationWidget.tsx:51-66`:
```ts
useEffect(() => {
    const shouldShow = isVisible && posts.length > 0 && !isLoading;
    const hasTipsDismissed = sessionStorage.getItem('jjodel-tips-dismissed') === 'true';
    const hasSystemNotice = posts.filter(p => p.category === 'system-notice' && !dismissedIds.includes(p.id)).length > 0;
    const isActuallyVisible = shouldShow && (hasSystemNotice || !hasTipsDismissed);

    if (isActuallyVisible) {
        document.body.setAttribute('data-notification-visible', 'true');
    } else {
        document.body.removeAttribute('data-notification-visible');
    }

    return () => {
        document.body.removeAttribute('data-notification-visible');
    };
}, [isVisible, posts, isLoading, dismissedIds]);
```

Consumer del segnale (verificato con `grep -rn "data-notification-visible"`):
- `frontend/src/components/Jodie/JodieWindow.css:877` → `body[data-notification-visible="true"] .jodie-minimized { ... }` (probabilmente sposta o nasconde il FAB Jjodie quando il widget è visibile per evitare overlap visivo).

**Note sull'integrazione:**
- L'unica direzione è widget → mondo. Jjodie non comunica con NotificationWidget.
- Non c'è integrazione con `JjodieEvents.OPEN` o altri eventi Jjodie.
- Non c'è badge/unread state che alimenti Jjodie.

### NotificationCenter (popover separato)

`discovery-notifications.md:92` cita `frontend/src/components/NotificationCenter.tsx` come "popover bell con sample notifications hardcoded — mockup non collegato". È un componente DISTINTO dal Quick Tips, non condivide stato né storage keys. Da non confondere.

---

## Sezione 6 — Convenzioni del componente

### Pattern di styling

- **SCSS file separato** accanto al `.tsx` (pattern dominante nel progetto, vedi `CLAUDE.md` e `discovery-notifications.md:327`).
- **Naming**: BEM-ish con prefissi senza `jj-` (es. `.notification-widget`, `.notification-header`, `.notification-close`, `.notification-content`, `.notification-message`, `.notification-footer`, `.tip-icon-wrapper`, `.tip-counter`, `.tip-next-btn`). Nessuna classe `.jj-quick-tip*` — se il futuro redesign vuole prefissarle (analogamente al recente rename `.toast*` → `.jj-toast*` in `b6fd2c5c1`), va fatto esplicitamente.
- Modifier per stato tip: `.notification-widget.is-tip` (linea 110 dello SCSS).
- Modifier per priorità (system-notice only): `.priority-warning|info|success|error`.

### Design tokens — **NON conforme a CLAUDE.md**

Lo SCSS hardcoda **tutti** i colori e numeri:

| Riga | Valore hardcoded | Token dovrebbe essere |
|---|---|---|
| `:11` `background: #ffffff;` | `--color-bg-primary` |
| `:13` `box-shadow: 0 4px 24px rgba(0,0,0,0.12);` | `--shadow-md`/`--shadow-lg` |
| `:14` `border: 1px solid #e2e4e8;` | `--color-border` |
| `:17` `z-index: 1000;` | `--z-toast` (= 10100) — incoerenza |
| `:25,27,135` `#f1f5f9 / #fafbfc` | `--color-bg-secondary` |
| `:42` `color: #6B7280;` | `--color-text-secondary` |
| `:60,76,151` `#374151 / #111418 / #475569` | `--color-text-primary` |
| `:91` `color: #F59E0B;` | `--color-warning` |
| `:95` `color: #6B7280;` | `--color-info` (logically) |
| `:99` `color: #10B981;` | `--color-success` |
| `:103` `color: #EF4444;` | `--color-error` |
| `:122-128` `.tip-icon-wrapper { background:#FEF3C7; i { color:#F59E0B } }` | bg `--color-warning-bg`, color `--color-warning` |

Inoltre **nessun blocco `[data-theme="dark"]`** — il widget non ha dark mode support, ma il design system Jjodel sì. Da aggiungere nel redesign.

`font-family: 'Inter Variable', -apple-system, sans-serif;` (linea 16) — overload locale del font, non corrispondente al global stack del progetto. Il progetto usa Inter come default ma in altri punti senza il suffisso "Variable" — verificare.

### Iconografia

- Lampadina header tip: `<i className="bi bi-lightbulb-fill" />` (`NotificationWidget.tsx:143`) — Bootstrap Icons, conforme.
- Close button: `bi-x-lg`.
- Next arrow: `bi-arrow-right` (linea 157).
- System-notice icons via `getPriorityIcon(priority)` (linea 100-108): `bi-exclamation-triangle-fill` / `bi-info-circle-fill` / `bi-check-circle-fill` / `bi-x-circle-fill` / `bi-bell-fill`. Tutte Bootstrap Icons.

### Posizionamento

`notification-widget.scss:6-18`:
```scss
.notification-widget {
    position: fixed;
    bottom: 60px;     // 60px sopra il bordo (offset per non collidere con eventuale status bar)
    right: 24px;
    width: 320px;
    z-index: 1000;
}
```
Anchorage **bottom-right**. Width fissa 320px, no min/max, no responsive breakpoints — su viewport stretti potrebbe esagerare il margine destro. Da considerare nel redesign.

---

## Sezione 7 — File contigui da considerare

`ls /Users/alfonso/jjodel/frontend/src/components/NotificationWidget/`:

| File | Note |
|---|---|
| `NotificationWidget.tsx` | Il componente — 5.6 KB, 167 righe, modificato `19 feb 13:47` |
| `notification-widget.scss` | Gli stili — 3.0 KB, 170 righe, modificato `17 gen 23:22` |

**Solo 2 file nella cartella.** Nessun `index.ts`, nessun helper, nessun test, nessun mock. L'import esterno (`App.tsx:40`) è diretto al `.tsx`, non passa da un barrel.

**File esterni rilevanti per il redesign** (oltre a quelli citati in §1):
- `docs/redesign/notification-widget-spec.md` — design spec ufficiale di gennaio 2026 (16 KB) per stile e comportamento.
- `discovery-notifications.md` (root del repo, untracked) — discovery più ampia del sistema notifiche; sezione 1C cita NotificationWidget al volo.
- `frontend/src/components/Jodie/JodieWindow.css:877` — unico consumer del segnale `data-notification-visible` (Jjodie FAB).

---

## Riepilogo per la prossima sessione

1. **Componente**: `frontend/src/components/NotificationWidget/NotificationWidget.tsx` — anche se chiamato `NotificationWidget`, è LUI che mostra le Quick Tip.
2. **Tip array**: remoto, da Cloudflare Worker `jjodel-notifications.alfonso-pierantonio.workers.dev`. Nessun fallback locale. La sorgente WordPress è esterna a questo repo.
3. **Persistenza tip-vista**: **non esiste**. `tipIndex` è solo `useState(0)` — riparte da 0 ad ogni mount/sessione. L'unico flag persistito è "tips dismissed for this session" in `sessionStorage`.
4. **Quick win per persistere "ho già visto questa tip"**: aggiungere `localStorage` (key tipo `jjodel-tips-seen` → array di `id`) e all'inizio escludere `tips.filter(t => !seenIds.includes(t.id))`. Pattern speculare a `dismissedIds` per system-notice.
5. **Design system non conforme**: tutti i colori e ombre sono hardcoded, niente dark mode, niente token. Da rifare con `--color-*` / `--shadow-*` / `--z-toast` (vedi `CLAUDE.md` e `discovery-notifications.md` §5A).
6. **Integrazione esistente con Jjodie**: solo via `body[data-notification-visible="true"]` consumato da `JodieWindow.css:877`. Niente eventi, niente badge bidirezionale.
