# Discovery 2026-08-12: harness di verifica visiva, e la causa accertata dei glifi monocromi

**Versione 2.** La v1 di questa sessione conteneva una conclusione sbagliata, ottenuta con una
misura corretta letta sull'elemento sbagliato. La correzione sta al §4 ed è il risultato più utile
del giro, quindi non è stata nascosta: è documentata come è avvenuta.

**Ambiente**: clone Linux del repo, `alfonso-frontend-jjtl` a `f48cc299a`, non il Mac. Build di
produzione servita con `vite preview`, app in modalità Offline, Playwright su Chromium.

---

## 1. L'harness

Tre fatti lo rendono possibile, tutti misurati:

1. **La build di produzione gira su Linux.** `npm ci` installa 831 pacchetti in 16 secondi,
   `npm run build` esce 0 con il solo warning di chunk-size. Il vincolo noto (`@esbuild`
   darwin-arm64 contro VM Linux) valeva per il `node_modules` del Mac visto attraverso il bridge,
   non per un `npm ci` fatto qui.
   `npm run typecheck` dà **14** errori, che sono i 33 del Mac meno i 19 di casing, invisibili su
   filesystem case-sensitive. È una calibrazione utile: il baseline locale è 14.
2. **Il dev server non serve.** `vite` in sviluppo fallisce l'ottimizzazione dipendenze su
   `src/DSL/nearley/nearley.tsx` e la pagina resta a 504. La `preview` della `dist` non ha quel
   problema.
3. **La modalità Offline apre l'app senza backend**, ma il bottone è gated su
   `window.location.host.includes('localhost')` (`frontend/src/pages/Auth.tsx:659`): su
   `127.0.0.1:3002` non esiste, su `localhost:3002` sì.

Note operative che costano tempo se non si sanno: il modale «what's new» monta un `.wm-backdrop`
che intercetta i click anche quando i suoi bottoni sono visibili, e va rimosso dal DOM; la palette
dei classificatori usa HTML5 drag-and-drop (`PalettePanel.tsx:78-89`), quindi un drag simulato con
eventi mouse non produce nulla e servono `DragEvent` sintetici con `DataTransfer` condiviso e
`clientX`/`clientY` passati al costruttore.

L'harness produce screenshot a `deviceScaleFactor: 2` e un probe JSON di **stili computati**, su
uno scenario deterministico: progetto nuovo, primo metamodello, una classe concreta e una astratta
sul canvas, classe concreta selezionata.

**Cosa non copre**: tema dark, modelli M1, attributi (quindi `.tree-feature__name` non compare),
e il dev server con hot reload. Non sostituisce il tuo occhio sul giudizio estetico.

---

## 2. La domanda

`docs/TECH-DEBT.md`, ultima voce: «il CSS dichiara un colore per tipo che a video non si vede.
Causa **non accertata**». Fix raccomandato: «rimuovere i selettori, non farli funzionare», con la
previsione «nessun effetto visibile».

---

## 3. Prima misura, e la conclusione sbagliata che ne ho tratto

Stili computati sulle icone del tree, tema light, con una classe a video:

| selettore | `color` computato | esadecimale | token |
|---|---|---|---|
| `.tree-node__icon.tree-DModel` | `rgb(69, 86, 111)` | `#45566F` | `--color-entity-container-fg` |
| `.tree-node__icon.tree-DPackage` | `rgb(69, 86, 111)` | `#45566F` | `--color-entity-container-fg` |
| `.tree-node__icon.tree-DClass` | `rgb(122, 64, 86)` | `#7A4056` | `--color-entity-class-fg` |

Da qui ho concluso che i selettori applicavano, che la voce era falsa e che la rimozione avrebbe
cambiato la resa. **Sbagliato.** La misura è giusta; la conclusione no.

Quello che è vero e resta: l'osservazione originale («i glifi restano monocromi») era stata fatta
su uno schermo con soli kind della famiglia contenitori, tutti slate per costruzione, quindi non
poteva distinguere le ipotesi. Serviva una classe sul canvas. Ma averla messa non bastava a
concludere.

---

## 4. La misura che corregge: i pixel

Ho rimosso i tre blocchi entity dai fogli, ricostruito e rifotografato lo stesso scenario. Poi ho
confrontato le due immagini pixel per pixel.

**153.258 pixel campionati, 0 diversi, delta massimo 0.** Le due schermate sono identiche.

Eppure gli stili computati sul `<span>` cambiano, e parecchio:

| selettore | con i tre blocchi | senza |
|---|---|---|
| `.tree-DClass` | `rgb(122, 64, 86)` | `rgb(14, 165, 233)` |
| `.tree-DPackage` | `rgb(69, 86, 111)` | `rgb(245, 158, 11)` |
| `.tree-DModel` | `rgb(69, 86, 111)` | `rgb(100, 116, 139)` |

Un colore che cambia da bordeaux a cyan senza muovere un pixel significa una cosa sola: **quel
colore non dipinge niente.**

### La causa

Il glifo è `<span class="tree-node__icon tree-DClass"><i class="bi bi-..."></i></span>`. A dipingere
è l'`<i>`, e l'`<i>` ha un colore suo:

```scss
// frontend/src/styles/style.scss:790-791
i.bi {
  color: var(--font-color-1);
}
```

Regola globale, top-level, nel foglio principale dell'app. `--font-color-1` risolve a `#0F172A`.
Misurato sull'elemento che dipinge: `color` computato dell'`<i>` = `rgb(15, 23, 42)`, mentre il
`<span>` che lo contiene ha `rgb(245, 158, 11)`. Una dichiarazione diretta batte l'ereditarietà
sempre, a qualunque specificità stia il genitore.

**I selettori entity del tree colorano il contenitore di un glifo che ha già il suo colore.** Sono
inerti quanto alla resa, e lo sono anche tutti i loro concorrenti.

### Cosa ne segue, voce per voce

- **La previsione della voce di debito, «nessun effetto visibile», è corretta.** Misurata: zero
  pixel. La rimozione si può fare senza rischio visivo.
- **«Causa non accertata» è ora accertata**, e va scritta: non è ereditarietà mancata per
  specificità, non è un selettore che non colpisce; è che l'elemento colorato non è l'elemento
  dipinto.
- **La premessa di R-RAIL-33 regge.** Il tree rende monocromo, e la voce descrive correttamente
  quello che si vede. La bozza di emendamento della v1 di questo report **si ritira**.
- **La mia conclusione della v1 era il caso da manuale** di una nuova specie di errore: lo stile
  computato di un elemento è una misura della resa **solo se quell'elemento è quello che dipinge**.
  Altrimenti la misura sono i pixel. Vale la pena metterlo a registro: è il gradino successivo
  dell'emendamento a R-RAIL-28, che aveva già stabilito che un report di esecuzione non è una
  misura della resa.

---

## 5. Una quarta palette entity, non inventariata

Cercando quale regola vincesse è emerso un concorrente che nessun documento nomina:
`frontend/src/components/forEndUser/tree.scss`, **ventitré** selettori entity, senza alcuno scoping,
con una palette propria: ambra per i package, **cyan `#0ea5e9` per le classi**, verde per gli
attributi, viola per le reference, cyan più scuro per le operation, grigio per i parameter.

Il foglio è importato da `components/forEndUser/Tree.tsx:16`, cioè dal tree legacy per end user, ma
i suoi selettori sono globali e **colpiscono anche il tree del rail**, dove oggi perdono per
specificità (0,1,0 contro 0,2,0 e 0,3,0).

Con i tre blocchi rimossi diventa la regola vincente: misurato, `.tree-DClass` passa a
`rgb(14, 165, 233)`. È il cyan che R-RAIL-30 ha escluso dalla scala entity perché prenotato dalla
selezione.

Oggi è innocuo per la stessa ragione per cui lo sono gli altri: non dipinge. Ma è una mina a
scoppio ritardato precisa: **chiunque un giorno faccia arrivare il colore al glifo, dopo la
rimozione dei tre blocchi, si ritrova la palette del 2023 e il cyan sulle classi.** Va inventariato
prima, non dopo.

Ne segue anche un ordine di esecuzione. Se un giorno si volesse davvero portare il colore entity nel
tree, non basta aggiungere una regola: bisogna prima disinnescare `i.bi` dentro il perimetro del
rail, e a quel punto tutte e quattro le palette diventano rilevanti insieme.

---

## 6. Altre misure, utili ai passi successivi

### 6.1 Il badge del pannello consuma la scala

`.jj-type-badge--class`: `background-color: rgb(252,225,234)` = `#FCE1EA`, `color: rgb(122,64,86)`
= `#7A4056`, 10px, radius 4. Coincide con la coppia `class` di R-RAIL-30. Il badge è testo dentro
il proprio elemento, quindi il colore lo consuma davvero: qui la scala funziona.

### 6.2 Gli `@import` dei font: la voce si chiude

Misurato su entrambi i percorsi.

- **Produzione**: in `dist/assets/index-*.css` i due `@import` sono le prime cose dopo
  `@charset "UTF-8"`, prima di qualunque regola. Validi.
- **Sviluppo**: progetto vite minimo che importa il solo `_typography.scss`. Lo `<style>` iniettato
  espone due `CSSImportRule` come prime due regole, e le due richieste a `fonts.googleapis.com`
  partono. Il rialzo è della compilazione Sass, non del bundler, quindi vale su entrambi i percorsi.
- **Controprova** che la misura sa distinguere gli esiti: uno `<style>` in cui l'`@import` segue una
  regola perde l'import dal CSSOM e non emette richieste.

**I font si caricano.** La voce di debito si chiude senza debito; resta solo il commento a
`_typography.scss:72`, che nomina JetBrains Mono dove l'import è IBM Plex Mono.

### 6.3 Il breadcrumb posizionale e la trappola di scope

Con una classe selezionata, `.jj-context-bar` rende `metamodel_1 › metamodel_1 › NewClass`, tre
segmenti, l'ultimo `--current`. Fondo `rgb(241,245,249)`, padding `8px 16px`, 11px, altezza 31px.
Il terzo segmento duplica l'identity block che sta 40px sopra; i primi due sono la stessa stringa
perché metamodello e package radice nascono con lo stesso nome, ma sono due elementi diversi e su
un `.ecore` importato possono differire.

`.jj-context-bar` è dichiarata in `styles/components/_form-system.scss:1196-1237`, partial globale
importato da `styles/style.scss:2`, e la riusa `viewParenting/ViewParentingFields.tsx:76` come
`.jj-parenting-breadcrumb.jj-context-bar`: è il breadcrumb di «Applies to», che R-RAIL-2 dichiara
sopravvivente. **Togliere le regole dal partial rompe «Applies to».** La rimozione va fatta sul sito
di render in `Info.tsx`, non sul foglio.

Il design lo conferma e chiude la questione: `docs/redesign/rail/README.md:239-240` dice che
l'identity block «replaces the current title row **and** the breadcrumb», e «do not render a
separate breadcrumb in Browse posture». Il breadcrumb torna come Focus bar (§6) quando il tree pane
si collassa.

### 6.4 Il padding del form body parte da zero

`.properties-panel-body` computa `padding: 0px`, e `.properties-tab` dentro il rail pure, malgrado
`info-improvements.scss:140` dichiari `padding: 24px`. Il `4px 14px 18px` di R-RAIL-26 parte da
zero, non da 24.

### 6.5 L'astrattezza, quattro canali di cui uno morto

Tree: nome in corsivo, `is-abstract`, `font-style: italic` misurato (`TreeViewContent.tsx:815`,
`tree-view-sidebar.scss:1763-1765`). Pannello: toggle «Abstract» in INHERITANCE (`Info.tsx:100-101`).
Lista Contents: tag testuale minuscolo (`Info.tsx:228`). Identity block: **niente**, il badge dice
`CLASS` anche su una classe astratta. Più un selettore morto, `tree-view-sidebar.scss:648`
`.tree-DClass &.abstract-class`, il cui produttore vive solo nel tree legacy
(`forEndUser/Tree.tsx:139`).

I token `--color-entity-abstract-class-*` sono alias di `class` in entrambi i file: se l'astrattezza
deve arrivare al badge, il canale non può essere il colore.

### 6.6 La postura Browse/Focus è recuperabile, misurato

Scritta in `bcc68da8f`, ritirata in `77e2bb6a6` con commit additivo. Revert su HEAD:
`PropertiesWithTreeView.tsx` **applica pulito**; `properties-with-tree-view.scss` ha **un hunk in
conflitto** (il foglio è cambiato di 109 righe dopo, quasi tutte tokenizzazione). Lo stepper dei
fratelli **non c'era**: zero occorrenze di `sibling`, `chevron-up`, `chevron-down` nel diff.

Il codice ritirato porta il commento «The tree pane is a height, not a mount», cioè in Focus il pane
è alto zero ma montato: il suo DOM resta interrogabile, e lo stepper può leggere l'ordine **reso**
senza duplicare il modello, che è il vincolo di R-RAIL-7.

### 6.7 Correzioni ai riferimenti di `TECH-DEBT.md`

| voce | dice | è |
|---|---|---|
| `entityMeta.ts` | «le diciotto voci di `ENTITY_META`» | **quindici**, `:60-202` |
| selettori, blocco light | `tree-view-sidebar.scss:649-709` | `:634-694` |
| selettori, blocco dark | `:1054-1064` | `:1038-1050` |
| selettori, copia pannello | `properties-with-tree-view.scss:919-931` | `:921-937` |
| righe da tenere | `:1481-1498` | `:1466-1472` e `:1477-1483` |
| `.tree-feature__name` | `:1899` | `:1890`; `:1899` è in `.tree-feature__type` |
| teal in `MegamodelView.scss` | `:261-262` | `:261-262` e `:467` |

Correzione di sostanza: la voce descrive i tre blocchi come «fondo trasparente». Vero per il dark e
per la copia del pannello; **falso per il light**, dove ogni kind dichiara `color` più
`background-color`.

---

## 7. Domande aperte

1. **Va a registro la regola nuova?** «Lo stile computato di un elemento è una misura della resa solo
   se quell'elemento è quello che dipinge; altrimenti la misura sono i pixel.» Proposta come
   R-RAIL-34.
2. **La quarta palette è un debito o si rimuove?** `forEndUser/tree.scss` serve un tree legacy vivo:
   la via pulita è lo scoping dei suoi selettori sotto la radice di quel componente, non la
   cancellazione.
3. **`i.bi` globale resta?** È la ragione per cui nessuna palette entity arriva ai glifi, ovunque
   nell'app. Toccarla è un cambio globale e non appartiene a questo arco, ma la sua esistenza va
   scritta dove qualcuno la trovi.
4. **L'harness entra nel repo?** Starebbe accanto a `npm run smoke` in `frontend/scripts/smoke/`.
   `playwright-core` è presente in `node_modules` ma non in `package.json` come dipendenza diretta,
   quindi entrarci è una dipendenza nuova e serve la tua approvazione (regola 4).
