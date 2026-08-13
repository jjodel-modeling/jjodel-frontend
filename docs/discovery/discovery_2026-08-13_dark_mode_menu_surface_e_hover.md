# Discovery — superficie e hover dei menu in dark mode

**Data**: 2026-08-13
**Origine**: due screenshot di Alfonso del menu utente aperto sul sottomenu Theme, in dark,
con la richiesta «questo è un problema in dark mode, fixalo .. fixa anche la trasparenza del
sottomenu Theme».
**Esito**: due difetti distinti, stessa radice per entrambe le famiglie di menu. Fix applicato
nello stesso passo, additivo, misurato sui due temi.

---

## 1. Obiettivo

Dallo screenshot si vedono due cose insieme: il pannello Light/Dark lascia trasparire le card
dei metamodelli che gli stanno sotto, e la riga «Theme» è una barra chiara con sopra testo
bianco quasi illeggibile. Sono due difetti indipendenti che capitano sullo stesso pixel.

## 2. File letti

- `frontend/src/pages/components/menu/Menu.tsx` — componenti `Menu`, `Item`, `SubMenu`,
  `SubMenuItem`, `UserHeader`, `Divisor`.
- `frontend/src/pages/components/menu/menu.scss` — foglio del menu utente.
- `frontend/src/pages/components/Navbar.tsx:1969-2017` — istanza del menu utente.
- `frontend/src/pages/components/navbar.scss:477-640`, `:1530-1560` — dropdown Jjodel / File /
  Edit / View / Tools / Analyze / Help.
- `frontend/src/styles/tokens/_colors-dark.scss`, `_colors-light.scss`.
- `frontend/src/styles/tokens/_shadows.scss`.
- `frontend/src/services/ThemeService.ts` — `data-theme` su `document.documentElement`.
- `frontend/src/components/editors/properties-with-tree-view.scss:1383-1397` e
  `frontend/src/components/export/ExportImageMenu.scss:289-305`, come precedenti di forma per
  i blocchi dark scritti nei fogli di componente.

## 3. Difetto 1 — la superficie è un token glass usato senza blur

`.dropdown` (`menu.scss:46`) e `> .submenu` (`:180`) dichiarano
`background-color: var(--color-bg-elevated, #ffffff)`. In dark quel token vale
`rgba(255, 255, 255, 0.04)` (`_colors-dark.scss:16`): non è una superficie, è un velo pensato
per pannelli che applicano anche `backdrop-filter`. L'unico consumatore che lo usa così è
`ContextMenu.scss:17-23`, che infatti dichiara `backdrop-filter: blur(10px)` due righe sotto.
`.dropdown` e `.submenu` non hanno blur.

Perché si vede solo sul sottomenu: il dropdown principale sta sopra lo sfondo pagina, quasi
nero, e il velo al 4% lo rende appena più chiaro, cioè plausibile. Il sottomenu si apre a
sinistra (`.dropdown.left > .item.has-submenu > .submenu`, `:201-205`) e finisce sopra le card
dei metamodelli: lì il velo mostra quello che ha sotto.

Stessa dichiarazione, stesso difetto, sulla famiglia navbar: `navbar.scss:481`,
`.nav-container .content > ul`.

**Misurato in dark, prima del fix** — `getComputedStyle(dropdown).backgroundColor`:
`rgba(255, 255, 255, 0.04)`.

## 4. Difetto 2 — l'hover eredita `color: white` su un accent chiaro

`menu.scss:105-108` e `navbar.scss:614-620` dichiarano lo stesso hover:
`background-color: var(--color-accent); color: white`.

In light `--color-accent` è `$slate-700` (`#334155`), fondo scuro sotto testo bianco: 12.6:1,
corretto. In dark lo stesso token è `#94a3b8`, slate-400 (`_colors-dark.scss:47`), scelto
apposta chiaro «for visibility on dark backgrounds» — ma è pensato per il **testo**, non come
fondo. Con `color: white` sopra, il contrasto scende a **~2.7:1**: sotto AA per qualunque
dimensione di testo. È la barra chiara della riga «Theme» nello screenshot.

Il difetto non è del menu utente: è della coppia token+dichiarazione, e vive identico in
entrambe le famiglie di menu.

## 5. Fix applicato

Precedente di registro: **R-RAIL-42** (2026-08-12) ratifica esattamente questo rimedio, «i
valori del design restano per light, e un blocco `[data-theme="dark"]` corregge i soli colori
che il tema deve cambiare». Entrambi i blocchi sono **additivi**, appesi in coda al foglio:
nessuna regola light viene toccata, nemmeno riformattata.

Superficie e hover in dark prendono la famiglia `--color-ctx-menu-*`, che era già a token e
finora **non aveva consumatori** (`command grep -rn "color-ctx-menu" frontend/src` fuori da
`tokens/`: zero righe). I suoi valori dark sono gli stessi già usati a mano dal precedente più
recente di pannello flottante, `properties-tree-floating-cluster` (`#1e293b` di fondo,
`#334155` di bordo e di hover): la scelta allinea i menu a quella superficie invece di
introdurne una terza.

| | prima (dark) | dopo (dark) | light |
|---|---|---|---|
| fondo pannello | `rgba(255,255,255,.04)` | `#1e293b` (`--color-ctx-menu-bg`) | `#ffffff`, invariato |
| bordo | `rgba(255,255,255,.04)` | `#334155` (`--color-ctx-menu-divider`) | invariato |
| ombra | `rgba(0,0,0,.12)`, invisibile | `--shadow-lg` | invariata |
| hover fondo | `#94a3b8` | `#334155` (`--color-ctx-menu-hover`) | `#334155`, invariato |
| hover testo | `white` → 2.7:1 | `#e2e8f0` → **8.0:1** | `white`, invariato |

Tre correzioni minori nello stesso blocco, sulla stessa superficie e per lo stesso motivo:
il separatore `hr.divisor` e il bordo di `.user-header` usavano `--color-border-secondary`,
che in dark è `rgba(255,255,255,0.04)` e sulla nuova superficie opaca sparisce; `.user-email`
e `span.keystroke` usavano `--color-text-tertiary` (`#606060`), che su `#1e293b` sta a
**2.2:1**, e passano a `--color-text-secondary` (5.5:1). Il `.submenu-check` prende
`color: inherit` sotto hover, per non restare accent su un chip che ha cambiato fondo.

**File toccati**: `frontend/src/pages/components/menu/menu.scss` (+49 in coda),
`frontend/src/pages/components/navbar.scss` (+32 in coda).

## 6. Verifica

Compilazione: `node_modules/.bin/sass --no-source-map --load-path=src` su entrambi i fogli,
exit 0. Nell'output CSS ogni selettore emesso dai due blocchi porta il prefisso
`:root[data-theme=dark]`: il tema light non è raggiungibile per costruzione.

Misure sulla resa, non sul foglio, come impone R-RAIL-37 (`getComputedStyle` **su ogni tema**,
sull'elemento che dipinge, R-RAIL-36). Prese su `localhost:3000` a HMR avvenuto, con hover
reale del mouse e non simulato in JS:

- **dark**, `.dropdown`: `rgb(30, 41, 59)` — opaco, nessun canale alpha. Bordo `rgb(51, 65, 85)`.
- **dark**, `.submenu` con la riga Theme sotto hover (`sub.matches(':hover') === true`):
  `rgb(30, 41, 59)`, `opacity: 1`, `visibility: visible`.
- **dark**, riga Theme sotto hover: fondo `rgb(51, 65, 85)`, testo `rgb(226, 232, 240)`.
- **dark**, navbar File con «New Project» sotto hover: pannello `rgb(30, 41, 59)`, label
  fondo `rgb(51, 65, 85)`, testo `rgb(226, 232, 240)`, e l'icona **misurata sull'`<i>`**,
  `rgb(226, 232, 240)`: la regola globale `i.bi { color: var(--font-color-1) }`
  (`style.scss:790`) non la riporta a bianco.
- **light**, stessi elementi: pannello utente `rgb(255, 255, 255)`, pannello navbar
  `rgb(255, 255, 255)`, hover label `rgb(255, 255, 255)` di testo. Invariati.

Non verificato a schermo da Alfonso al momento della scrittura di questo report.

## 7. Domande aperte

1. **`--color-bg-elevated` resta un token glass senza contratto scritto.** Ha 20 consumatori in
   12 fogli e uno solo (`ContextMenu.scss`) applica il `backdrop-filter` che lo giustifica.
   Gli altri 19 in dark sono superfici traslucide come lo erano questi due: il difetto si vede
   solo dove il pannello finisce sopra del contenuto. Candidati da guardare per primi, perché
   flottanti: `pages/dashboard.scss:185`, `components/editors/info.scss:540/557/891`,
   `pages/components/style.scss:164`. Non toccati qui: fuori perimetro.
2. **La famiglia `--color-ctx-menu-*` ha ora due consumatori dove ne aveva zero.** Se è la
   superficie canonica dei menu, `properties-tree-floating-cluster` dovrebbe smettere di
   scrivere `#1e293b` e `#334155` a mano. Voce da valutare, non fatta qui.
3. **`--font-color-1: white` su `.content.context-menu ul`** (`navbar.scss:581`) resta come
   sta. In dark le icone bianche su `#1e293b` vanno bene; in light non è stato indagato quale
   regola le salvi dal bianco su bianco, perché fuori dal difetto riportato.
