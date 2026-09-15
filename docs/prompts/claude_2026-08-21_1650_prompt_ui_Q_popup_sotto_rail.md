# Prompt Claude Code, 2026-08-21 16:50: i due popup che finiscono sotto il rail destro

**Fase**: 1 poi 2, nello stesso prompt, con **hard stop** in mezzo.
**Zona critica**: no. **Branch**: `alfonso-frontend-jjtl`. **Base**: `668b57132` o successivo.
**Decisioni che governano**: D-UI-13 (deroga sugli z-index: le due scale non si consegnano per
coerenza), e D-UI-12 per le altezze del chrome. **Prompt piu' corto del solito, e apposta**: il difetto
e' osservato, il perimetro e' due componenti.

---

## Il difetto, osservato

Con il rail destro aperto, **il menu utente** (avatar in alto a destra, `#navusermenu`) e **il popup
delle notifiche** (campanella nella status bar) vengono disegnati **sotto** il rail. Screenshot alla
mano: il popup c'e', e il pannello del rail gli passa sopra.

## L'ipotesi, registrata prima della misura perche' sia falsificabile

**Non e' un problema di valore, e' un problema di contesto di impilamento.** Il popup delle notifiche
(`.app-notif-popover`, `NotificationCenter.scss:16`) dichiara `z-index: var(--z-toast)`, cioe'
**999998**, e perde comunque contro il rail, che sta a **900**
(`properties-with-tree-view.scss:1434`). Un numero a sei cifre che perde contro uno a tre significa
una cosa sola: il popup e' **intrappolato** in un contesto piu' basso. Il candidato e' la status bar,
`StatusBar.scss:22`, `z-index: 50`, e 50 sta sotto 900.

Per il menu utente il candidato e' analogo ma va misurato: il foglio della navbar dichiara **due**
z-index diversi su due regole, `100` alla riga 170 («per stare sopra la tree view sidebar») e
`var(--z-navbar)` (950) alla riga 187. Se l'antenato di `#navusermenu` e' quello a 100, il suo
`z-index: 1000` interno (riga ~1964) non lo salva: 100 sta sotto 900.

**Se l'ipotesi regge, nessuna riscalatura degli z-index sistema questo difetto**, e la scala unica
resta l'igiene che era, da fare quando conviene.

---

## Fase 1, misura, read-only

Con l'app a `http://localhost:3000` (**non 3001**), un progetto aperto e il rail destro visibile,
aprire prima il menu utente e poi il popup della campanella, e per ciascuno **risalire la catena degli
antenati fino alla radice**, registrando per ogni antenato: tag e classe, `position`, `z-index`
calcolato, e se crea un contesto di impilamento (z-index diverso da `auto` su un elemento
posizionato, oppure `transform`, `filter`, `opacity < 1`, `will-change`, `contain`, `isolation`).

Serve la stessa catena per il rail (`.properties-with-tree-view--floating` o l'elemento che porta il
900), cosi' da confrontare i **contesti radice** dei tre.

**Il report va salvato** in `docs/discovery/discovery_2026-08-21_z_index_popup_rail.md`, con: obiettivo,
file letti con path completi, le tre catene, la risposta netta alla domanda «il difetto e' di valore o
di contesto», e le domande aperte. **La Fase 1 non e' finita finche' il report non e' scritto.**

**Hard stop.** Se la misura **falsifica** l'ipotesi, fermarsi e riportare: vuol dire che il difetto e'
altrove e la Fase 2 di questo prompt non e' il rimedio giusto.

---

## Fase 2, solo se la misura conferma

Due componenti, un commit.

1. **Il popup delle notifiche esce dal contesto della status bar.** Portale su `document.body`, come
   fa gia' `Navbar.tsx:1902` per il menu di overflow delle tab: il pattern esiste nel repo, si riusa
   quello, non se ne inventa un altro. La posizione si calcola dal `getBoundingClientRect()`
   dell'ancora (`anchorRef` esiste gia' nella firma di `NotificationCenter`), come fa il menu utente
   con `position: fixed` e top/left inline.
2. **Il menu utente**, allo stesso modo, se la catena mostra che e' intrappolato.
3. **Lo z dei due popup viene da un nome, non da un letterale**: `var(--z-dropdown-menu)` (1000 in
   `styles/tokens/_z-index.scss`), che sta sopra il rail (900) e sotto i modali. Il `--z-toast`
   (999998) del popup notifiche **si toglie**: e' il nome sbagliato, un popover ancorato a una
   campanella non e' un toast.

**Da NON toccare**: lo z-index del rail (900) e il suo commento; le due scale z di `tokens.css` e
`_z-index.scss`, che restano divergenti (deroga di D-UI-13, arco a se'); gli altri z-index letterali
del foglio navbar, che sono una decina e sono lo stesso difetto ma non sono questo difetto; i
letterali di colore di `StatusBar.scss` (`#f8fafc`, `#e2e8f0`, `#64748b`), censiti altrove.

### Gate

- **Il difetto sparisce**: con il rail aperto, entrambi i popup si disegnano **sopra** il rail.
  Misura, non impressione: leggere il `getBoundingClientRect()` di popup e rail e verificare la
  sovrapposizione, poi `document.elementFromPoint()` su un punto **dentro l'intersezione** e
  controllare che l'elemento restituito appartenga al popup, non al rail. Prima del fix la stessa
  sonda deve restituire il rail: se non lo restituisce, non stai misurando il difetto giusto.
- **Niente si rompe sopra**: i modali e i dialoghi restano sopra i due popup. Aprire un modale con un
  popup aperto e verificare con la stessa sonda `elementFromPoint`.
- Build exit 0; typecheck **33**; smoke **12 passed / 0 failed / 3 skipped**, A5 invariata;
  `check:docs` senza warning.

### Vincoli

- Due componenti e i loro fogli, niente altro. Se serve un terzo file, fermarsi e chiedere.
- Zero refactoring opportunistico; nessun rename di classi o identificatori.
- Staging per file esplicito, `git commit -m "<messaggio>" -- <path...>`.
- Messaggio proposto: `fix(ui): portal the user menu and the notification popover above the rail`

## Log

Entry in `docs/claude-code-log.md` a fine task, tipo `fix`, con nelle note le tre catene di antenati e
l'esito di `elementFromPoint` prima e dopo.
Nome del documento prompt: `2026-08-21 16:50 claude_2026-08-21_1650_prompt_ui_Q_popup_sotto_rail.md`.
