# Discovery, riconciliazione dei sistemi di token

**Data**: 2026-08-20 - **Branch**: `alfonso-frontend-jjtl` - **HEAD**: `d5e773047`
**Fase**: 1, read-only. Nessun file di codice modificato, nessun commit.
**Superficie**: cartella `~/jjodel` connessa al bridge, piu' misure live in Chrome su
`http://localhost:3000` (pagina `#/allProjects`, nessun progetto aperto, quindi nessun autosave).

> **Tre findings correggono premesse ereditate** da `sessione_CORRENTE.md` e da
> `contesto_progetto.md`. Sono segnati con **CORREZIONE**.

---

## 0. Obiettivo

Il checkpoint del 2026-08-20 dichiara come prossimo passo la riconciliazione fra
`styles/tokens.css` e `styles/tokens/`, descritta cosi': dieci nomi in comune, sette con valore
risolto diverso, due invertiti, e il vincitore dipende dalla presenza di `data-theme`. La discovery
verifica quella descrizione, ne misura l'ampiezza reale e stabilisce che cosa si rompe scegliendo
un vincitore.

---

## 1. File letti e misure eseguite

Letti integralmente o nelle parti rilevanti:

- `frontend/src/styles/tokens.css`
- `frontend/src/styles/tokens/index.scss`, `_colors-light.scss`, `_colors-dark.scss`,
  `_shadows.scss`, `_z-index.scss`, `_transitions.scss`, `_radius.scss`, `_spacing.scss`,
  `_typography.scss`, `_gradients.scss`, `_layout.scss`
- `frontend/src/components/editor-v2/_themes.scss`, `_color-schemes.scss`
- `frontend/src/styles/variables.scss`, `frontend/src/styles/components/_form-system.scss`
- `frontend/src/App.tsx` (righe 1..25), `frontend/src/App.scss` (righe 1..15),
  `frontend/src/index.tsx` (import), `frontend/index.html`, `frontend/dist/index.html`
- `frontend/src/services/ThemeService.ts`, `frontend/src/pages/settings/AppearanceSettings.tsx`

Misure automatiche su tutto `frontend/src`, escluse `node_modules`: inventario delle dichiarazioni
`--x:` con il selettore che le contiene, censimento dei `var(--x)` con e senza fallback,
classificazione dei consumatori per zona di codice.

Misure statiche sul bundle: `frontend/dist/assets/index-ex5eeH2A.css`, 1.81 MB, prodotto oggi alle
14:20, letto per l'ordine di emissione dei blocchi.

Misure live: `getComputedStyle(document.documentElement)` sui tre regimi di `data-theme`, con
ripristino esatto dello stato iniziale. Piu' una prova di boot con `localStorage.theme` impostato e
reload, e rimozione della chiave a fine prova.

---

## 2. I sistemi di token sono quattro, non due

**CORREZIONE.** `contesto_progetto.md` dice "due sistemi di token convivono". Ne convivono quattro,
e la differenza conta perche' cambia dove sta il problema.

| # | Sistema | Selettori | Nomi |
|---|---|---|---|
| S1 | `styles/tokens.css` | `:root` | 169 |
| S2 | `styles/tokens/*.scss` | `:root, :root[data-theme="light"]` e `:root[data-theme="dark"]` | 363 |
| S3 | `components/editor-v2/_themes.scss` | `.editor-v2.theme-dark`, `.theme-light`, `:root`, `:root[data-theme="dark"]` | 91 |
| S4 | `styles/variables.scss` piu' `styles/components/_form-system.scss` | `body` e `:root` | 71 |

Unione: **657 nomi distinti**.

Le collisioni di nome fra sistemi diversi sono pero' confinate a una sola coppia:

```
S1 ∩ S2 = 33      S1 ∩ S3 = 0      S1 ∩ S4 = 0
S2 ∩ S3 = 0       S2 ∩ S4 = 3      S3 ∩ S4 = 1  (--danger)
```

S3 e' generato da due mappe SCSS con `--#{$name}: #{$value}`, quindi nessuna grep letterale sui nomi
lo trova. E' la ragione per cui una prima passata di questa discovery ha classificato 398 `var()`
come riferimenti a nomi mai dichiarati: falso allarme, rientrato censendo le mappe. Il residuo vero
e' 121 occorrenze su 56 nomi, quasi tutti nomi costruiti a runtime (`--hl-`, `--stroke-color` e i
suoi vicini in `common/DV.tsx`, `--offset-x`) e non un buco di sistema. R-RAIL-28 vale anche qui: la
ricerca letterale non e' la ricerca.

**Il problema e' una coppia sola, S1 contro S2.** Non c'e' nessun groviglio a quattro.

---

## 3. Il selettore del file light non e' quello che il checkpoint dice

**CORREZIONE.** `_colors-light.scss` non dichiara su `:root[data-theme="light"]`. Le righe 75 e 76
sono:

```scss
:root,
:root[data-theme="light"] {
```

Il ramo `:root` ha specificita' `(0,1,0)`, **identica** a quella di `tokens.css`. Quando l'attributo
`data-theme` non c'e', i due blocchi non si distinguono per specificita' e vince l'ordine di
caricamento. Quando l'attributo c'e', il ramo con l'attributo sale a `(0,2,0)` e vince S2.

L'ordine di caricamento e' misurato, non dedotto. `App.tsx:2` importa `App.scss`, che al rigo 6
inlinea `tokens/index`; `App.tsx:8` importa `tokens.css`. Nel bundle prodotto:

| blocco | offset |
|---|---|
| `:root,:root[data-theme=light]` | 579428 |
| `:root[data-theme=dark]` | 587288 |
| `:root` di `tokens.css` | 691470 |

**`tokens.css` e' l'ultimo e vince tutte le parita'.** La misura del 19/8 su
`--color-border-secondary`, che risolveva `#cbd5e1` e non il `#d1d9e3` scritto in
`_colors-light.scss`, e' il controllo positivo di questo modello.

---

## 4. I regimi sono tre, e passare da uno all'altro non e' un no-op

Misurato live, con ripristino:

| token | A, nessun attributo | B, `data-theme="light"` | C, `data-theme="dark"` |
|---|---|---|---|
| `--color-bg-primary` | `#ffffff` | `#f8fafc` | `#08090a` |
| `--color-bg-secondary` | `#f8fafc` | `#ffffff` | `#0f1012` |
| `--color-bg-tertiary` | `#f1f5f9` | `#f1f5f9` | `#16181a` |
| `--color-border-focus` | `#06b6d4` | `#64748b` | `#06b6d4` |
| `--color-border-primary` | `#e2e8f0` | `#cbd5e1` | `rgba(255,255,255,.08)` |
| `--color-border-secondary` | `#cbd5e1` | `#d1d9e3` | `rgba(255,255,255,.04)` |
| `--color-text-inverse` | `#ffffff` | `#ffffff` | `#08090a` |
| `--color-text-primary` | `#0f172a` | `#0f172a` | `#f0f0f0` |
| `--color-text-secondary` | `#475569` | `#334155` | `#a0a0a0` |
| `--color-text-tertiary` | `#94a3b8` | `#475569` | `#606060` |

Sette righe su dieci cambiano fra A e B. **Scegliere "Light" nelle impostazioni non riporta allo
stato di partenza: porta in un terzo posto.** Un utente che non ha mai aperto Appearance vede una UI
diversa da uno che ha scelto Light esplicitamente, e tutta la verifica visiva fatta finora e' stata
calibrata nel regime A.

Due dettagli che il valore da solo non dice:

- **La scala del testo e' sfalsata di un gradino.** `--color-text-tertiary` di S2 vale `#475569`,
  che e' esattamente `--color-text-secondary` di S1. Un testo marcato "terziario" in regime B ha il
  peso che in regime A ha il secondario. Non e' una sfumatura, e' un livello intero.
- **`--color-border-focus` in dark resta ciano.** S2 dark non lo dichiara, quindi in regime C vince
  ancora S1 con `#06b6d4`. Il focus del design system e' `#334155`.

---

## 5. Il ramo non colore e' peggio del ramo colore

Delle 33 collisioni, 10 stanno fuori dai file di colore e **tutte e 10 divergono**:

| token | `tokens.css` (vince) | `tokens/` (perde) | usi |
|---|---|---|---|
| `--z-modal` | `1050` | `9999` | 6 |
| `--z-modal-backdrop` | `1040` | `9000` | 1 |
| `--z-sticky` | `1020` | `100` | 1 |
| `--z-tooltip` | `1070` | `1050` | 2 |
| `--shadow-sm` `-md` `-lg` `-xl` | scala Tailwind a due strati | scala morbida a uno strato | 39 |
| `--transition-fast` | `150ms ease` | `var(--duration-fast) var(--ease-out)` | 66 |
| `--transition-slow` | `300ms ease` | `var(--duration-slow) var(--ease-in-out)` | 0 |

Verificato live: `--z-modal` risolve `1050` in tutti e tre i regimi, `--transition-fast` risolve
`150ms ease` in tutti e tre. Le ombre invece flippano fra A e B come i colori, perche'
`_shadows.scss` usa lo stesso selettore doppio.

**Qui c'e' la spiegazione del todo 5 dell'indice.** `.donation-banner` porta `z-index: 9000`
letterale, che e' il valore che `_z-index.scss` intende per `--z-modal-backdrop`. Chi ha scritto quel
9000 leggeva la scala di `tokens/`; chi usa `var(--z-modal)` ottiene 1050, cioe' la scala di
`tokens.css`. Il banner sta sopra qualunque modale del sistema perche' le due scale sono
incompatibili e una delle due non e' mai arrivata a runtime. Non e' un valore sbagliato: sono due
mondi con lo stesso nome.

---

## 6. Che cosa c'e' davvero dentro `tokens.css`

| gruppo | nomi | anche in `tokens/` |
|---|---|---|
| palette primitiva (`--color-slate-*`, `-cyan-*`, `-red-*`, ...) | 61 | 0 |
| altro (input, icone, disabled, focus ring) | 36 | 0 |
| spazi e taglie | 18 | 2 |
| tipografia | 14 | 0 |
| semantici `--color-*` | 12 | 10 |
| z-index | 8 | 6 |
| radius | 7 | 6 |
| transizioni | 7 | 5 |
| ombre | 6 | 4 |

Il livello semantico di `tokens.css` e' **12 nomi**, dei quali 10 duplicati e 2 soli orfani
(`--color-bg-overlay`, `--color-border-error`). Tutto il resto e' un livello primitivo che `tokens/`
non ha mai avuto.

Dei 136 nomi esclusivi di `tokens.css`, **81 non sono mai usati** e 55 sono vivi. I 55 vivi hanno un
consumatore riconoscibile:

| zona | usa solo `tokens.css` | usa solo `tokens/` | comune | fuori sistema |
|---|---|---|---|---|
| `components/ui/**` | **212** | 6 | 67 | 9 |
| `components/**` (resto) | 58 | 962 | 875 | 1187 |
| `pages/**` | 0 | 669 | 402 | 63 |
| `styles/**` | 0 | 184 | 146 | 171 |

**La cucitura e' netta.** La libreria `components/ui/` (Button, Input, Select, Checkbox, gli altri
`*.module.css` ispirati a shadcn) e' scritta contro `tokens.css`; tutto il resto dell'app e' scritto
contro `tokens/`. L'unica altra eccezione e' `properties-with-tree-view.scss`, che attinge alle
primitive `--color-slate-*`.

Non e' quindi vero che `tokens.css` sia un doppione da cancellare. E' un livello primitivo con
addosso un livello semantico di dodici nomi, e sono quei dodici, piu' i venti fra ombre, z-index e
transizioni, a produrre tutto il danno.

---

## 7. Il buco dark, misurato

- **137 nomi di `tokens.css` non hanno alcun valore dark.** Se un componente li usa, in dark resta
  chiaro. Fra questi c'e' tutta la palette primitiva, ed e' corretto che sia cosi': una primitiva non
  ha tema. Ma `components/ui/**` dipinge con le primitive, quindi **la libreria `ui` non ha un dark**.
- **16 nomi di `_colors-light.scss` non hanno corrispondente in `_colors-dark.scss`**:
  `--color-bg-active`, `--color-border-focus`, `--color-error-bg`, `--color-info-bg`,
  `--color-interactive-active` / `-default` / `-disabled` / `-hover`, `--color-success-bg`,
  `--color-text-disabled`, `--color-text-placeholder`, `--color-warning-bg`, piu' i quattro
  `--gradient-*`.

Il secondo elenco tocca direttamente il todo 2 dell'indice. La banda `Conforms to` e' chiara in dark
perche' `info-improvements.scss` porta il letterale `#f0fdf4`, e il token che le corrisponde e'
`--color-success-bg`, che vale `#f0fdf4` e **resta `#f0fdf4` anche in regime C** (misurato).
Passare dal letterale al token non risolve niente: bisogna prima dare a quei 16 nomi un valore dark.

---

## 8. Chi decide il regime

**CORREZIONE.** `sessione_CORRENTE.md` afferma che nessun consumer applica `localStorage.theme` al
boot e che dopo un reload con il solo storage impostato `data-theme` resta `null`. Non e' cosi'.
`frontend/index.html`, righe 13..21, porta uno script inline che legge `localStorage.getItem('theme')`
e scrive l'attributo prima che React monti. Lo script sopravvive alla build ed e' presente in
`dist/index.html`.

Prova eseguita: `localStorage.theme = 'dark'`, reload. Dopo il reload `data-theme` vale `"dark"` e
`--color-bg-primary` risolve `#08090a`. Chiave rimossa a fine prova. Non so spiegare la misura
precedente, e conviene rifarla prima di costruirci sopra.

Il percorso di scrittura resta pero' rotto in tre punti:

1. `AppearanceSettings.tsx:2` importa `useTheme`, e la riga 6 lo tiene commentato. Il componente
   riscrive a mano attributo e storage e **non emette** `JjodelEvents.THEME_CHANGED`.
2. `EditorV2.tsx:102` consuma `useTheme()`, che si aggiorna solo su quell'evento. Cambiare tema dalle
   impostazioni lascia l'editor sul valore vecchio finche' non rimonta.
3. `ThemeService.read()` preferisce `localStorage` all'attributo. Puo' quindi restituire `dark`
   mentre il DOM e' in regime A, cioe' chiaro. Il componente crede una cosa, il CSS ne dipinge
   un'altra.

L'applicazione al boot avviene comunque, quindi il punto 3 morde solo se lo storage viene scritto da
un percorso che non tocca l'attributo.

---

## 9. `--accent` e `--danger`, misurati

Il todo 4 dell'indice e' confermato e la causa e' gia' scritta in testa a `_themes.scss`.

| token | su `:root` | su `body` |
|---|---|---|
| `--accent` | `#0284c7` | `#334155` |
| `--danger` | `#dc2626` | `#ef4444` |

`styles/variables.scss` dichiara su `body`. Per qualunque elemento sotto `body`, incluso un portal
montato su `document.body`, `body` e' un antenato piu' vicino di `:root` e vince a prescindere dalla
specificita'. E' un quinto meccanismo, distinto dai quattro precedenti: non e' cascata, e' ereditarieta'.

---

## 10. Dipendenze e rischi

1. **Ampiezza.** I sette colori divergenti sono consumati da **741 siti `var()`**. Le quattro ombre
   da 39, i quattro z-index da 10, `--transition-fast` da 66. Qualunque scelta di vincitore li
   sposta tutti insieme, in un colpo, e nessun gate oggi guarda un colore.
2. **La verifica visiva accumulata vale per il regime A.** D-UI-11, D-UI-12 e tutto l'arco del rail
   destro sono stati misurati e approvati senza `data-theme`. Promuovere S2 a vincitore invalida
   quelle verifiche, non i commit.
3. **`components/ui/` non sopravvive alla cancellazione di `tokens.css`.** 212 riferimenti alle
   primitive. Un ordine di caricamento invertito, invece, e' innocuo per quella zona: i suoi nomi
   non collidono con niente.
4. **Colore, ombre e z-index sono tre archi con rischi diversi.** Il colore e' visibile e reversibile;
   i z-index cambiano chi sta sopra chi e un errore li' si manifesta come una finestra irraggiungibile.
5. **A5 non copre niente di tutto questo.** Lo smoke asserisce relazioni geometriche fra le bande del
   chrome, non valori di token.

---

## 11. Domande aperte per Alfonso

1. **Quale regime e' il light buono?** A, cioe' `tokens.css`, oppure B, cioe' `_colors-light.scss`.
   E' la domanda che decide tutto il resto, e non ha una risposta tecnica: sono due palette
   plausibili, con quella di `tokens/` piu' scura di un gradino sul testo e piu' chiara sui fondi.
   La scelta va fatta a occhio, non a tavolino.
2. **`tokens.css` si smonta in due?** L'ipotesi che regge alle misure e' togliergli i 12 nomi
   semantici e i 20 fra ombre, z-index e transizioni, e tenere il resto come livello primitivo,
   spostato in `tokens/_primitives.scss` o lasciato dov'e'. Cosi' resta un solo dichiarante per ogni
   nome e la parita' di specificita' non si presenta piu'.
3. **Le ombre e i z-index vanno nello stesso arco del colore o in uno separato?** Sono indipendenti,
   e separarli permette di verificarli a occhio uno alla volta.
4. **I 16 nomi senza dark si completano ora o si dichiara il buco?** Senza di loro il todo 2 non si
   chiude e la meta' bassa del rail resta chiara comunque.
5. **La libreria `components/ui/` deve avere un dark?** Oggi non ce l'ha e nessuno se n'e' accorto,
   il che suggerisce che quei componenti non compaiano ancora nelle superfici che si guardano in dark.

---

## 12. Hard stop

Fase 1 chiusa. Nessuna modifica proposta prima della risposta alla domanda 1.
