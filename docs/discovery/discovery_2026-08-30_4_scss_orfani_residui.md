# Discovery 2026-08-30 — i residui orfani fuori perimetro del 30-08

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `8bcc289ae`
**Prompt**: micro-slice «residui orfani fuori perimetro del 30-08» — chiudere i reperti dichiarati
e non toccati da `061859313`
**Base**: `discovery_2026-08-30_3_nestedview_scss_orfani.md` (il precedente autoritativo: metodo,
estrattore, gate), §6.3 «gli orfani negli altri fogli» e §3 «due candidati dichiarati per una
slice futura»
**Esito**: **chiusi tutti e tre i reperti**. 30 istanze di selettore rimosse su 660, ognuna con
almeno una classe provatamente senza emettitori; 34 variabili SCSS rimosse, ognuna con zero
consumatori in tutto il repo; intestazione di `nestedView.scss` riallineata a cio' che il foglio
stila davvero.

Strumento: `command grep` (BSD grep), mai il wrapper `ugrep --ignore-files` a cui `grep` risolve
in questa shell. Ogni asserzione di assenza porta il proprio controllo positivo.

---

## 0. Tre correzioni al referto del 30-08, tutte misurate

Il prompt riprende tre numeri dal precedente. Due sono diversi, e uno dei due cambia il metodo.

### 0.1 `_form-system.scss:657,715` non portano `.viewpoint-tab`

Il prompt cita sei righe come emettitrici di `.viewpoint-tab`. Quattro lo sono; due portano un
token **diverso**:

```
info.scss:24                 .viewpoint-tab,
info.scss:112                .viewpoint-tab h1,
_form-system.scss:657        .viewpoint-tab-container,     <- altro token
_form-system.scss:665        .viewpoint-tab,
_form-system.scss:715          .viewpoint-tab-container,   <- altro token
_form-system.scss:722          .viewpoint-tab,
```

`.viewpoint-tab-container` non e' `.viewpoint-tab`: un confronto per sottostringa li unisce, ed e'
lo stesso errore di metodo che il 30-08 aveva dichiarato vivo `.viewpoint-tab` perche' altri fogli
lo nominavano. Misurato separatamente con lo stesso scanner, **anche `.viewpoint-tab-container`
non ha emettitori**: `class-use=0`, due sole occorrenze, entrambe `css-sel` nelle righe citate.
Sta nel perimetro perche' il prompt cita quelle righe e perche' la prova e' la stessa; e' rimosso,
e la distinzione e' scritta qui perche' non passi per una svista.

### 0.2 Le variabili sono 45, non 48, e le orfane 34, non 33

`nestedView.scss` porta **45** dichiarazioni `$var:` (contate su `^\s*\$[A-Za-z0-9_-]+\s*:`,
45 distinte, nessun duplicato), non 48. Le inutilizzate sono **34**, non 33.

### 0.3 Il grep repo-wide sugli `.scss` non e' la misura giusta — e lo dice il suo stesso esito

Il prompt prescrive: «una variabile puo' essere usata da altri file: il grep e' repo-wide sugli
`.scss`». Eseguito alla lettera, dice che 39 delle 45 variabili sono vive altrove — `$color-border`
in 26 file, `$color-text-primary` in 27. Preso per buono, avrebbe salvato quasi tutto il blocco.

E' un falso positivo di massa. Le variabili SCSS sono **file-scoped**: un `$color-border` in un
altro foglio e' un'altra variabile, non un consumatore. `nestedView.scss` non ha `@use`/`@import`
(verificato: il foglio compila da solo) e nessuno lo `@use`-a — l'unico importatore e'
`ViewData.tsx:24`, cioe' un import TypeScript, che lo compila isolato.

La misura corretta separa **chi usa** da **chi dichiara**:

```
per ogni variabile, file che la USANO senza DICHIARARLA (= veri consumatori esterni):
  variabili con consumatori esterni reali: 0

controllo positivo del rilevatore di dichiarazione, stesso comando:
  file che DICHIARANO $color-accent: 18      file che USANO $color-accent: 18
```

Zero. Ogni foglio che nomina uno di quei nomi se lo dichiara per conto proprio. Il verdetto
corretto e' quindi «inutilizzata **in `nestedView.scss`**», e la conferma indipendente arriva dal
CSS compilato: rimuovere le 34 lascia il CSS di `nestedView.scss` **identico a meno
dell'intestazione** (§4.1). Una variabile che si puo' togliere senza cambiare un byte di output
non aveva consumatori.

---

## 1. Reperto 1 — `.viewpoint-tab` e `.viewpoint-tab-container`

Ri-verifica con la forma corretta (vita per **classe emessa**, non per sottostringa), sul perimetro
del 30-08 ricostruito: `frontend/src/**` (`.ts .tsx .js .jsx .scss .css .html`) + `public/*.css|html`
+ `index.html`, esclusi `public/webjars`, `boxicons`, `public/fonts`, `public/docs` e
`frontend/scripts/`. **1264 file** (erano 1263 il 30-08).

```
TOKEN viewpoint-tab            -> class-use=0  css-sel=4  other=0
TOKEN viewpoint-tab-container  -> class-use=0  css-sel=2  other=0
```

Controllo positivo dello scanner, stessa forma: `style-tab` → `class-use=1`
(`PaletteData.tsx:358`); `properties-tab` → `class-use=13`.

**Costruzione dinamica**, che nessun grep letterale vede. Il 30-08 la cercava come `` `priority- ``
— forma che **manca** il suo stesso reperto, perche' l'emettitore reale e'
`` `notification-widget priority-${...}` `` (`NotificationWidget.tsx:205`), col backtick lontano dal
prefisso. Rifatta con la forma per interpolazione:

```
viewpoint-${   viewpoint${   'viewpoint-' +   "viewpoint-" +          -> 0
}-tab   }tab   + '-tab'   + "-tab"                                    -> 0
controllo positivo, stessa forma:  priority-${ -> 1   tree-${ -> 3    (segnale)
```

Verdetto: entrambi i token sono **senza emettitori**. Le sei voci sono tolte dalle rispettive liste
di selettori, **lasciando il tronco** (`.properties-tab`, `.view-editor-root`, `.dock-tabpane`,
`.template-tab`, … restano intatti).

## 2. Reperto 2 — le regole `tree-*` di `tree.scss`

Foglio compilato con `sass` per espandere i nesting `&` prima del confronto (nessun `@use`: e'
autonomo): **70** istanze di selettore, **43** token di classe distinti, 24 token `tree-*`.

I `tree-*` si dividono in due famiglie, e la loro vita si decide **sull'emettitore**, non sul token:

- **`tree-D*`** (12 token) — **vivi**. Due produttori: `TreeViewContent.tsx` li scrive letterali
  (`badgeClassName="tree-DClass"` :1014, `"tree-DPackage"` :1105, `"tree-DModel"` :1279,
  `'tree-DAttribute'`/`'tree-DReference'` :939) e `Tree.tsx:139` li costruisce
  (`` `icon tree-${data.className}` ``), dove `data.className` e' sempre il nome D-layer
  (CLAUDE.md §3.13; la riga 140 lo assume esplicitamente con `data.className.slice(1, 2)`).
- **`tree-<NonD>`** (12 token: `tree-Model`, `tree-Package`, `tree-Class`, `tree-Attribute`,
  `tree-Reference`, `tree-Operation`, `tree-Parameter`, `tree-Enumerator`, `tree-EnumLiteral`,
  `tree-Object`, `tree-Value`, `tree-Singleton`) — **orfani**. Ognuno compare **in un solo file
  dell'intero perimetro, `tree.scss` stesso**:

```
tree-Model tree-Package tree-Class tree-Attribute tree-Reference tree-Operation
tree-Parameter tree-Enumerator tree-EnumLiteral tree-Object tree-Value tree-Singleton
  -> file: src/components/forEndUser/tree.scss      (uno solo, per tutti e dodici)

controllo positivo, stesso comando:
  tree-DClass -> properties-with-tree-view.scss, tree.scss, TreeViewContent.tsx
  tree-DModel -> tree.scss, TreeViewContent.tsx
```

L'unica via che resterebbe e' che qualcuno spogli la `D` iniziale per comporre la classe: cercato
(`replace('D'`, `slice(1)`, `substring(1)`, `substr(1` incrociati con `class`/`tree`), **nessuno
dei 33 hit alimenta un template `tree-${...}`**. I tre soli siti `tree-${` sono `Tree.tsx:135`
(dentro `{/* */}`), `:139` (vivo, D-prefissato) e `:252` — quest'ultimo dentro il blocco commentato
che va da `Tree.tsx:218` a `:261` (`/*` … `</section>);*/`), quindi **codice morto**.

Rimosse: 22 voci di lista (le NonD accanto alla gemella D, che resta) + le 2 regole intere
`.tree-Singleton` (light e dark), che non hanno gemella. **24 istanze**.

**Effetto collaterale dichiarato**: `.tree-Singleton` era l'unica consumatrice di `$color-accent`
in `tree.scss`. La variabile resta dichiarata e ora inutilizzata — **non rimossa**: `tree.scss` non
e' il foglio di cui il prompt chiede le variabili, e la Regola 9 vale. E' un candidato per la
prossima passata, non un residuo dimenticato.

## 3. Reperto 3 — la coda di `nestedView.scss`

**Intestazione.** `NESTED VIEW - VIEWPOINTS PANEL` non descriveva piu' niente: il pannello dei
viewpoint e' stato rimosso con `0494a9cad` e la potatura del 30-08 ha tolto il 78% del foglio che
vi pendeva. Riscritta su cio' che resta — `.view-editor-root`, la sua intestazione e il sistema di
tab che ha sostituito il `DockLayout` di rc-dock — e su chi la carica (`ViewData.tsx`).

**Variabili.** 45 dichiarate, 11 usate, **34 rimosse**. Quattro sezioni sono sparite per intero,
col loro commento, perche' ogni membro era orfano — `// Border Radius` (3), `// Transitions` (2),
`// Layout - COMPACT` (5), `// Type colors` (13) —; le altre 11 sono cadute singolarmente dentro
sezioni che sopravvivono. Regola sui commenti identica al 30-08: **un commento il cui unico
soggetto se ne va, se ne va con lui; uno che descrive codice vivo resta.**

Restano: `$font-family`, `$font-size-base`, `$color-text-primary|secondary|tertiary`,
`$color-bg-primary`, `$color-border`, `$color-border-hover`, `$spacing-xs|sm|md`.

## 4. I gate

### 4.1 Verifica meccanica sul CSS ricompilato

Ogni terna `(contesto at-rule, singolo selettore, blocco di dichiarazioni)` del CSS **dopo** deve
esistere identica nel **prima**; ogni terna del prima che manca nel dopo deve portare una classe
morta. Estrattore quello del 30-08, che accumula il prelude fino alla graffa (la forma riga-per-riga
perde silenziosamente le liste su piu' righe).

```
  foglio       istanze          nuove   rimosse-con-prova   rimosse-SENZA-prova   dichiarazioni-cambiate
  info.scss    169 -> 167         0             2                   0                      0
  _form-system 386 -> 382         0             4                   0                      0
  tree.scss     70 ->  46         0            24                   0                      0
  nestedView    35 ->  35         0             0                   0                      0
  TOTALI                          0            30                   0                      0
```

Zero nuove, zero rimozioni senza prova, zero dichiarazioni cambiate. Il `diff` del CSS compilato
contiene **soltanto** le voci attese: le 6 righe `.viewpoint-tab*`, i 12 token NonD con le due
`.tree-Singleton`, e per `nestedView.scss` **le sole righe dell'intestazione** — le 34 variabili
non lasciano traccia nell'output, che e' la prova che nessuna era usata.

Nel bundle di produzione, dopo una build fresca (`dist/assets/index-CNHFSfzs.css`):

```
viewpoint-tab 0   viewpoint-tab-container 0   tree-Singleton 0   tree-Model 0   tree-Package 0
tree-Class 0   tree-Attribute 0   tree-Reference 0   tree-Operation 0   tree-Parameter 0
tree-Enumerator 0   tree-EnumLiteral 0   tree-Object 0   tree-Value 0
controllo positivo, stesso comando:
tree-DClass 3   tree-DPackage 2   properties-tab 60   view-editor-root 90
```

### 4.2 Il gate visivo, e cosa copre davvero

Sonda `scripts/smoke/_tmp_orphans2.ts` (non committata), tre superfici, una per foglio:
`.view-editor-root` sui 5 tab (nestedView.scss), il pannello properties (info.scss +
_form-system.scss), `.tree-view-panel-body` (tree.scss). Light e dark: **14 ritagli**.

**Determinismo, provato prima dell'uso**: due run consecutivi sullo stesso albero → **14/14 md5
identici**, sia sul codice intatto sia sul codice modificato.

**Segnale, provato prima dell'uso — e per una superficie NON c'e'.** Perturbata una dichiarazione
per foglio, su regole **conservate**:

| Perturbazione | Esito |
|---|---|
| `nestedView.scss`, `.view-editor-tabs { padding-left: 12px → 13px }` | **10/10 ritagli view diversi** — segnale |
| `info.scss`, `.properties-tab { padding: var(--space-2) → 9px }` | `light_props` **diverso** — segnale |
| `tree.scss`, `.tree-DPackage { background-color: … 0.15 → 0.9 }` | **0 ritagli diversi** — nessun segnale |
| `tree.scss`, `.tree-DPackage/.tree-DModel { color → #ff00ff / #00ff00 }` | **0 ritagli diversi** — nessun segnale |

Il perche' e' misurato, e riproduce indipendentemente il reperto di CLAUDE.md §5 su un'altra classe:

```
span.tree-node__icon.tree-DPackage   -> color = rgb(255,0,255)  (la perturbazione ARRIVA)
                                        background-color = rgba(0,0,0,0)  (sovrascritto: la
                                        dichiarazione di tree.scss e' morta)
figlio <i class="bi bi-folder2">      -> color = rgb(15,23,42)  (dichiarazione diretta: VINCE)
```

Lo stile calcolato dello `span` segue `tree.scss`, ma a dipingere e' l'`<i>` interno, che ha il
proprio `color`. **Il gate a pixel sulla superficie del tree non certifica nulla**, e non viene
contato come se lo facesse. Per `tree.scss` il gate valido e' quello sullo **stile calcolato**, che
il segnale ce l'ha (la perturbazione lo muove).

**Esito, misurato contro un albero pulito** (`git stash` dei 4 file, cattura, `git stash pop`):

| Misura | Esito |
|---|---|
| 14 ritagli, before pulito vs after | **13/14 md5 identici** |
| il 14esimo (`light_props`) | **7 pixel su 430.800** (0,002%), righe 30-33, agli angoli arrotondati, ognuno **±1 su un solo canale** |
| stile calcolato: **ogni** proprieta' di **ogni** elemento della banda y 25..45, custom property incluse, piu' i rect | **0 differenze di valore, 0 differenze di rect** su 15 elementi |
| stile calcolato, 14 righe di misura su tutte e tre le superfici | **`diff` vuoto** |
| badge `tree-D*` dopo la potatura | light `DPackage rgb(245,158,11)` / `DModel rgb(100,116,139)`; dark `rgb(251,191,36)` / `rgb(148,163,184)` = i valori di `tree.scss` |
| controllo negativo nel DOM: i 14 token rimossi | tutti **0**, gia' prima |
| errori di pagina | 4 (boot noto: `init_dash`, `wrong project setup in navbar` ×3), **gli stessi prima e dopo** |

**I 7 pixel sono dichiarati, non nascosti dietro un «14/14».** Sono riproducibili (due run puliti
identici fra loro, due run modificati identici fra loro, i due gruppi diversi), quindi non sono
rumore di run. Ma non sono spiegabili da nessuno stile: l'unica differenza che il dump esaustivo
trova fra i due stati e' l'**ordine di enumerazione** dei custom property — gli stessi nomi con gli
stessi valori, elencati in ordine diverso, perche' togliere un selettore da una lista cambia
l'ordine interno della cascata. Valori, geometrie e rect sono identici. Restano
**antialiasing agli angoli arrotondati**, a un canale di distanza, su 7 pixel.

### 4.3 Gate di codice

| Gate | Esito |
|---|---|
| `npm run typecheck` | **33 = baseline**, contati su output completo (`grep -c "error TS"`), zero nei 4 file toccati |
| `npx vitest run` | **2008 passed / 0 failed**, 9 file rotti all'import = baseline nota |
| `npm run build` | **exit 0**, solo il chunk-warning e i deprecation `@import` preesistenti |
| `npm run smoke` | **12 passed / 0 failed / 3 skipped** = baseline |

---

## 5. Cio' che questa misura non copre, dichiarato

1. **I sei «dubbio» del 30-08 restano dubbi.** Fuori perimetro per disposizione del prompt, non
   riaperti: `#root .controls`, `.view-editor-root .dock-content .dock-tabpane`,
   `.view-editor-root .dock-layout` (con `.dock-nav-wrap`, `.dock-panel-max-btn`),
   `.view-editor-root .btn-back`, `.page-root`, `.editor-label`, e le tre regole su
   `.path-separator`.
2. **I template di view salvati.** Un `jsxString` scritto a mano da un utente puo' contenere
   qualunque `className`. La ricerca copre tutto `src`, quindi i template **di default** sono
   inclusi e non nominano nessuno dei 14 token; un progetto salvato con un `class="viewpoint-tab"`
   scritto a mano non e' visibile da qui. Vale per ogni classe del foglio, non solo per le rimosse.
3. **Gli stati che la sonda non apre.** Lo smoke non apre mai un progetto salvato
   (`docs/PROTOCOL.md`, nota a P8) e la sonda parte da un progetto creato ex novo.
4. **La superficie del tree non e' certificata a pixel** (§4.2): le regole entity di `tree.scss`
   non dipingono, l'`<i>` interno vince. Cio' che e' certificato li' e' lo stile calcolato e il
   CSS compilato.
5. **`$color-accent` in `tree.scss`** e' ora dichiarata e inutilizzata, come effetto della rimozione
   di `.tree-Singleton`. Lasciata (§2).
