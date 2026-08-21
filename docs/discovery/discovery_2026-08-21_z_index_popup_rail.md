# Discovery, i due popup sotto il rail destro: valore o contesto?

**Data**: 2026-08-21 · **Fase**: 1, read-only · **Base**: `668b57132` · **Branch**: `alfonso-frontend-jjtl`
**Prompt**: `docs/prompts/claude_2026-08-21_1650_prompt_ui_Q_popup_sotto_rail.md`
**Decisioni che governano**: D-UI-13 (deroga sugli z-index), D-UI-12 (altezze del chrome).

---

## 0. Obiettivo e risposta netta

**Domanda**: con il rail destro aperto, il menu utente (`#navusermenu`) e il popup delle notifiche
(`.app-notif-popover`) vengono disegnati sotto il rail. È un difetto **di valore** — un numero troppo
basso — o **di contesto di impilamento** — un numero corretto ma confinato?

**Risposta**: **di contesto**, e nessuna riscalatura degli z-index lo sistema. L'ipotesi del prompt è
confermata nella tesi e **falsificata in tutti e due i colpevoli che nomina**. Il vero punto di
intrappolamento sta un livello più su di dove il prompt lo cercava: **`#root`**.

Il difetto è **riprodotto**, non dedotto: `elementFromPoint` su un punto dentro l'intersezione
restituisce il rail per entrambi i popup (§4).

---

## 1. Il meccanismo, in una riga

`div#root` è `position: fixed` (`frontend/src/index.scss:31`) con `z-index: auto`, e
`div.properties-tree-overlay`, che porta il 900 del rail, **non è dentro `#root`: è suo fratello**,
figlio diretto di `body`. Un elemento `fixed` crea un contesto di impilamento, quindi tutta
l'applicazione è confinata dentro `#root`, che nel contesto di `body` vale `auto`, cioè 0. Il rail,
fratello, vale 900. **900 batte 0, e nessun numero scritto dentro `#root` partecipa al confronto.**

I figli di `body`, misurati:

```
div#root                          pos=fixed  z=auto  transform=false isolation=auto
script                            pos=static z=auto
div.properties-tree-overlay       pos=fixed  z=900   transform=false isolation=auto
div.sim-panel.sim-panel--closed   pos=fixed  z=850   transform=false isolation=auto
```

Il confronto vero è fra `#root` (auto), il rail (900) e il pannello di simulazione (850). Tutto il
resto è interno a uno dei tre.

---

## 2. Che cosa l'ipotesi del prompt sbagliava

L'ipotesi era giusta nella forma («un numero a sei cifre che perde contro uno a tre significa che il
popup è intrappolato») e sbagliata nei due candidati.

**`.app-statusbar { z-index: 50 }` (`components/StatusBar.scss:22`) non c'entra.** La regola non
dichiara `position`, e la barra risulta **`position: static`**. Su un elemento statico lo `z-index`
è **inerte**: non ordina niente e non crea contesto. La riga 22 è una dichiarazione morta, e va letta
come tale — è un difetto suo, non la causa di questo.

**Il `100` della navbar non c'entra, e non è nemmeno il valore vivo.** Il foglio dichiara due
z-index sulla stessa regola, `100` a `pages/components/navbar.scss:170` e `var(--z-navbar)` a `:187`;
**vince la seconda**, e il valore calcolato su `nav#navbar` è **950**, misurato. Ma 950 è scritto
dentro `#root`, quindi non arriva mai al confronto col rail. Se `#root` non fosse un contesto, 950
batterebbe 900 e il menu utente si vedrebbe: **è la misura a dire che `#root` è un contesto**, non la
lettura della specifica.

Conseguenza, quella che il prompt già anticipava: **la scala unica degli z-index resta igiene e non
rimedio**. Riscalare `tokens.css` e `_z-index.scss` non muove un pixel di questo difetto.

---

## 3. Le tre catene, misurate

Stato: progetto aperto, tab metamodello, rail destro visibile, viewport 1440x900, regime di tema non
toccato. Sonda `frontend/scripts/smoke/_tmp_uiQ.ts`, non committata.

Legenda: **CONTESTO** marca un antenato che crea un contesto di impilamento (z-index diverso da `auto`
su elemento posizionato, oppure `transform`, `filter`, `opacity < 1`, `will-change`, `contain`,
`isolation`, `mix-blend-mode`).

### 3.1 Il rail

```
div.properties-with-tree-view.--floating    pos=relative z=auto
div.properties-tree-overlay                 pos=fixed    z=900   CONTESTO [z-index:900 su fixed]
body                                        pos=static   z=auto
html                                        pos=static   z=auto
```

**Contesto radice: `body`.** Il rail ci arriva con 900. Due passi soli fra lui e la radice.

### 3.2 Il menu utente

```
div.dropdown.left                           pos=absolute z=1000   CONTESTO [z-index:1000 su absolute]
div.menu-container                          pos=relative z=200    CONTESTO [z-index:200 su relative]
div#navusermenu.user-menu-container         pos=static   z=auto
div.main-header-right                       pos=static   z=auto
nav#navbar.nav-container.appbar             pos=relative z=950    CONTESTO [z-index:950 su relative]
div.router-wrapper                          pos=static   z=auto
div#root                                    pos=fixed    z=auto   <-- LA TRAPPOLA
body                                        pos=static   z=auto
html                                        pos=static   z=auto
```

Tre contesti annidati (1000 dentro 200 dentro 950) e tutti e tre dentro `#root`. Il `1000` della riga
`menu.scss` ordina il dropdown **rispetto ai suoi fratelli dentro `.menu-container`**, e basta.

### 3.3 Il popup delle notifiche

```
div.app-notif-popover                       pos=absolute z=999998 CONTESTO [z-index:999998 su absolute]
div.sb-rz__bell-wrapper                     pos=relative z=auto
div.sb-rz                                   pos=static   z=auto
div.app-statusbar__right                    pos=static   z=auto
div.app-statusbar                           pos=static   z=50     <-- INERTE, non è un contesto
div.router-wrapper                          pos=static   z=auto
div#root                                    pos=fixed    z=auto   <-- LA TRAPPOLA
body                                        pos=static   z=auto
html                                        pos=static   z=auto
```

Il `999998` di `--z-toast` ordina il popover **rispetto ai fratelli dentro `.sb-rz__bell-wrapper`**.
Fuori di lì non conta niente. Si noti che l'unico antenato con uno z-index scritto, `.app-statusbar`,
è statico: non contribuisce nemmeno lui.

---

## 4. Il difetto riprodotto, non dedotto

`elementFromPoint` sul centro dell'intersezione fra popup e rail:

| popup | rect popup | rect rail | punto | elemento colpito | dentro il popup | dentro il rail |
|---|---|---|---|---|---|---|
| menu utente | x=1166 y=39 w=242 h=234 | x=1040 y=91 w=400 h=777 | (1287, 182) | `span.tree-section__label` | **no** | **sì** |
| popup notifiche | x=999 y=773 w=320 h=97 | x=1040 y=91 w=400 h=777 | (1179, 820) | `button.properties-node-section__header` | **no** | **sì** |

I due popup **intersecano** il rail e in entrambi i casi a schermo c'è il rail. È lo stato «prima»
che il gate della Fase 2 dovrà ribaltare.

**Falso allarme scartato per strada.** Alla prima esecuzione il punto di prova del popup notifiche
restituiva `div.jj-toast__row`: un toast, aperto dal `Cmd+S` usato per generare la notifica, copriva
il punto. Misura rifatta dopo il ritiro del toast (verificato: `.jj-toast` a zero). Un terzo elemento
sopra il punto avrebbe dato una risposta che non riguardava né il popup né il rail.

---

## 5. File letti

| path | perché |
|---|---|
| `frontend/src/index.scss` (riga 31) | `#root { position: fixed }`, l'origine del contesto |
| `frontend/src/components/NotificationCenter.scss` (riga 16) | `z-index: var(--z-toast)` sul popover |
| `frontend/src/components/NotificationCenter.tsx` (righe 98-140) | markup del popover, `anchorRef` già in firma |
| `frontend/src/components/StatusBar.scss` (riga 22) | `z-index: 50` su elemento statico |
| `frontend/src/components/StatusBarRightZone.tsx` (righe 75-95) | la campanella e il montaggio di `NotificationCenter` |
| `frontend/src/pages/components/navbar.scss` (righe 170, 187) | i due z-index in conflitto, 100 e `var(--z-navbar)` |
| `frontend/src/pages/components/Navbar.tsx` (righe 1890-1915, 1971-1999) | il pattern portale già in uso, e il menu utente |
| `frontend/src/pages/components/menu/Menu.tsx` (righe 37-70) | il ramo `trigger`, che rende il dropdown del menu utente |
| `frontend/src/pages/components/menu/menu.scss` | `.dropdown`, `.menu-container` |
| `frontend/src/components/editors/properties-with-tree-view.scss` (riga 1434) | `z-index: 900` sull'overlay del rail |
| `frontend/src/styles/tokens/_z-index.scss` (righe 26, 37, 66, 71) | `--z-dropdown` 1000, `--z-toast` 999998, `--z-navbar` 950, `--z-dropdown-menu` |

---

## 6. Che cosa ne segue per la Fase 2

**Il rimedio proposto dal prompt è quello giusto, per una ragione diversa da quella scritta.** Il
portale su `document.body` non serve a scavalcare la status bar o la navbar: serve a **uscire da
`#root`**. Una volta fuori, il popup è fratello del rail e il confronto avviene per davvero, dove
`var(--z-dropdown-menu)` (1000) batte 900 e sta sotto `--z-modal` (9999).

**Il pattern esiste già ed è il controllo positivo.** `Navbar.tsx:1902` porta il menu di overflow
delle tab su `document.body` con `ReactDOM.createPortal` e posizione calcolata dal
`getBoundingClientRect()` dell'ancora, con `position: fixed` e top/left inline. È lo stesso problema
risolto una volta.

**Il raggio del menu utente è contenuto, ma va detto.** Il dropdown è reso dal componente condiviso
`Menu` (`pages/components/menu/Menu.tsx`), che ha **12 consumatori**. Il ramo che rende il menu utente
è però quello di `props.trigger`, e quel ramo ha **un consumatore solo**, `Navbar.tsx:1972` —
verificato. Portare il portale **dentro quel ramo** lascia intatti gli altri undici usi. Se invece si
toccasse il ramo legacy, cambierebbero LeftBar, Notes e Project.

---

## 7. Domande aperte per Alfonso

1. **`.app-statusbar { z-index: 50 }` è una dichiarazione morta** (elemento statico). Si toglie, si
   accompagna con un `position`, o si lascia con un `// TODO: cleanup`? Non è in perimetro qui.
2. **`navbar.scss` dichiara due z-index nella stessa regola**, 100 a `:170` e `var(--z-navbar)` a
   `:187`, con il commento del primo («per stare sopra la tree view sidebar») ormai orfano. Vince il
   secondo. Va tolto il primo? È fuori perimetro per questo prompt.
3. **`.sim-panel` è il terzo fratello di `body`, a 850.** Sta sotto il rail per costruzione. È voluto?
   Nessuno l'ha dichiarato in una decisione.
4. **Il `--z-toast` sul popover era il nome sbagliato** ma anche il valore inerte. Dopo il portale
   servirà un nome: il prompt indica `--z-dropdown-menu`. Confermi che il popover delle notifiche è un
   dropdown e non una notifica, ai fini della scala?
5. `#root` come contesto di impilamento è una **proprietà strutturale dell'applicazione**: qualunque
   futuro overlay figlio di `body` con z-index esplicito passerà sopra tutto. Vale la pena scriverlo a
   registro come vincolo, invece di riscoprirlo al prossimo popup?

---

## 8. Esito

Ipotesi **confermata nella tesi** (contesto, non valore) e **falsificata nei colpevoli** (né la status
bar né il `100` della navbar). La Fase 2 del prompt è il rimedio giusto e può partire.
