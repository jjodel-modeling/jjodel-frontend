# Discovery — FAB Jjodie in basso a sinistra, dentro il canvas

**Data**: 2026-08-01
**Prompt**: `2026-08-01 01:06` — fix(jodie), one-shot con mini-discovery
**HEAD di riferimento nel prompt**: `07cee5219` — HEAD attuale `ea02928fd`
**Tipo**: read-only, propedeutica all'edit di un solo file CSS

---

## 1. Obiettivo

Spostare il floating button minimizzato di Jjodie (`.jodie-minimized`, `bi bi-robot`, visibile a chat chiusa) da basso-destra a basso-sinistra, restando dentro l'area contenuto:

- tab editor (rail sinistro smontato): 30px dal bordo sinistro del viewport;
- viste con rail montato (dashboard, project summary): 240px + 30px.

`bottom: 100px` invariato. Geometria della finestra Jodie aperta invariata.

## 2. File letti

| File | Perché |
|------|--------|
| `frontend/src/components/Jodie/JodieWindow.css` (860-930, 1175-1190) | blocco `.jodie-minimized` + regole correlate |
| `frontend/src/components/Jodie/JodieMinimized.tsx` | verifica assenza di stili inline |
| `frontend/src/pages/dashboard.scss` (340-395, 795-830) | larghezza rail + breakpoint responsive |
| `frontend/src/pages/components/Dashboard.tsx` (310-330, 549, 620-621) | mount condizionale del rail |
| `frontend/src/components/NotificationWidget/notification-widget.scss` (1-10) | posizione del widget, a supporto della rimozione 2c |

## 3. Esito delle 5 verifiche

### 3.1 Il posizionamento del FAB vive solo in `JodieWindow.css` — PASS

`grep -rn "jodie-minimized" frontend/src` → 8 occorrenze, 7 in `JodieWindow.css` + 1 in `JodieMinimized.tsx`:

| Riga | Regola | Tocca left/right/bottom? |
|------|--------|--------------------------|
| 871 | `.jodie-minimized` (base) | **sì** — `bottom: 100px`, `right: calc(var(--jj-canvas-right-inset, 0px) + 30px)` |
| 892 | `.jodie-minimized i` | no (font-size, color) |
| 897 | `:hover` | no (transform, box-shadow, background) |
| 903 | `:hover i` | no (color) |
| 908 | `body[data-notification-visible="true"]` | **sì** — `bottom: 280px` |
| 912 | `.jodie-has-unread::after` | `top/right: -2px` ma `position: absolute` **relativa al bottone**, non al viewport → non impattata dallo spostamento |
| 1179 | `[data-theme="dark"]` | no (background, box-shadow) |

`JodieMinimized.tsx:15-25` renderizza `<button className={...}>` senza `style=` inline: nessun posizionamento in JS.

### 3.2 Larghezza del rail — PASS

`dashboard.scss:804-808`:
```scss
.leftbar {
  /* Fixed width 240px as per design */
  width: 240px;
  min-width: 240px;
  max-width: 240px;
```
Valore confermato: **240px**. Il `calc(240px + 30px)` della Fase 2b è corretto.

### 3.3 Mount condizionale del rail (premessa del selettore `:has`) — PASS

`Dashboard.tsx:621`:
```tsx
{!hideLeftBar && <LeftBar active={'Project'} project={project} />}
```
Smontaggio reale del nodo, **non** `display: none`. `hideLeftBar` è `useState(false)` (`:549`) e la classe `hide-leftbar` sul container (`:620`) cambia solo la grid (`dashboard.scss:378-380`). Nelle viste dashboard il rail è montato incondizionatamente (`Dashboard.tsx:322`).

Nota aggiuntiva (rilevante per il breakpoint della Fase 2b): sotto 768px il rail resta nel DOM ma scivola fuori canvas (`dashboard.scss:352-357` e `385-390`: `position: fixed; left: -240px`, `.open { left: 0 }`). Da qui il guard `@media (min-width: 769px)` sull'offset: sotto quella soglia `:has(.leftbar)` sarebbe vero ma il rail non occupa spazio.

### 3.4 `:has()` già in uso — PASS

Occorrenze esistenti: `App.scss:137,170,253,258,259,401`, `styles/diagram.scss:899`, `styles/style.scss:724,727,732,756`, `components/editors/views/nestedView.scss:97`. Pattern ammesso, nessuna nuova dipendenza.

### 3.5 Corrispondenza testuale del blocco ~871 col FROM del prompt — PASS

`git diff 07cee5219 HEAD -- frontend/src/components/Jodie/JodieWindow.css` → vuoto: il file è identico al commit di riferimento del prompt (ultimo commit sul file: `867c9affc`, viewport insets). Le righe 872-876 corrispondono testualmente al FROM della Fase 2a.

## 4. Contesto per la rimozione 2c (override notification)

`notification-widget.scss:7-9` → `position: fixed; bottom: 60px; right: 24px`. Il widget è in basso a **destra**: col FAB a sinistra non c'è sovrapposizione, e `body[data-notification-visible="true"] .jodie-minimized { bottom: 280px }` farebbe solo saltare il FAB verso l'alto senza motivo. Rimozione autorizzata esplicitamente dal prompt; l'attributo `data-notification-visible` e `NotificationWidget.tsx` restano intatti.

## 5. Rischi

| Rischio | Valutazione |
|---------|-------------|
| Altri consumer di `--jj-canvas-right-inset` | La variabile resta pubblicata (`PropertiesWithTreeView.tsx`) e consumata altrove (MiniMap in `EditorV2.tsx`): sparisce solo da questo blocco, nessun writer toccato. |
| Collisioni in basso a sinistra nel canvas | Zoom controls in toolbar, MiniMap a destra: area libera. Da confermare nella verifica visiva. |
| Viste che montano il rail senza essere dashboard | Il selettore `body:has(.leftbar)` è per costruzione esatto: si applica ovunque il nodo esista, indipendentemente dalla route. |
| `:has()` su browser non supportati | Fallback = FAB a `left: 30px` anche con rail montato (sovrapposizione al rail). Baseline browser del progetto già dipende da `:has()` altrove. |
| Badge unread | `::after` posizionato in `absolute` sul bottone: segue il FAB, nessuna modifica necessaria. |

## 6. Esito

**5/5 verifiche superate** → si procede alla Fase 2 (edit di `JodieWindow.css`) senza hard stop intermedio, come previsto dal prompt.
