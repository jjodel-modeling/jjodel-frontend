# Discovery, coerenza del property editor destro

**Data**: 2026-08-19 - **Branch**: `alfonso-frontend-jjtl` - **HEAD**: `363e121c0`
**Prompt**: `claude_2026-08-19_2336_prompt_ui_C_property_editor.md`
**Fase**: 1, read-only. Nessun file di codice modificato, nessun commit.

> **Prerequisito non soddisfatto.** Il prompt lo dichiara come "prompt A completato e verificato (il
> pannello destro e' gia' a filo)". Il prompt A e' fermo al suo hard stop di Fase 1, zero commit, il
> pannello e' ancora una card flottante. Questa discovery e' read-only e le sue misure non dipendono
> dal fatto che il rail sia a filo o no, quindi restano valide; vedi pero' il rischio 3.4.

Misure prese sul DOM vivo (`http://localhost:3000`, viewport 1440x900, progetto creato ex novo,
modalita' avanzata, tab M1 aperto) con la sonda temporanea `frontend/scripts/smoke/_tmp_uiC.ts`,
non committata. Dove non ho potuto riprodurre, e' scritto.

---

## 1. File letti

- `frontend/src/components/editors/Info.tsx` (componente locale `CollapsibleSection`, sezioni GENERAL / DEPENDENCIES / Advanced, stringa `Depends from models`)
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (sezione NODE, preset `PRESET_2A`, montaggio del rail)
- `frontend/src/components/editors/properties-with-tree-view.scss` (blocco `.jj-disclosure`, `.properties-node-section`, `.properties-fields`, pane del tree)
- `frontend/src/components/editors/info-improvements.scss` (regole base `.props-section__*`)
- `frontend/src/components/ModeSystem/CollapsibleSection.tsx` (omonimo **non** usato qui, vedi §2.1)
- `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (righe del tree)
- `frontend/src/components/editor-v2/_themes.scss` (definizione di `--text-muted`)
- `docs/decisions.md`, serie R-RAIL

---

## 2. Findings

### 2.1 Punto 1: le quattro sezioni sono **tre** implementazioni, non due

| Sezione | Implementazione | Markup |
|---|---|---|
| `GENERAL`, `DEPENDENCIES` | `CollapsibleSection` **locale a `Info.tsx`** | `.props-section > .props-section__header-row > .props-section__header > [__title, __chevron]` |
| `ADVANCED` | **lo stesso componente**, avvolto in `<div className="jj-disclosure">` | identico al precedente |
| `NODE` | markup proprio, inline in `PropertiesWithTreeView.tsx` | `.properties-node-section > __header > [i, __label, __rule]` |

Quindi la risposta alla domanda decisiva e': **`GENERAL`, `DEPENDENCIES` e `ADVANCED` sono lo stesso
componente**, e la loro differenza e' interamente CSS. `NODE` e' invece un secondo pezzo di markup,
con classi proprie, e per lui la convergenza e' un allineamento di stile, non una prop.

Attenzione a un omonimo che e' una trappola: esiste
`frontend/src/components/ModeSystem/CollapsibleSection.tsx`, esportato, con classi `.collapsible-section__*`
e il chevron gia' a sinistra nel DOM. **Non e' quello usato qui**: `Info.tsx` definisce una propria
funzione `CollapsibleSection` che lo oscura, con firma diversa (`defaultOpen`, `headerRight`, contro
`expanded`, `onToggle`, `badge`, `icon`). Chi cerca per nome finisce sul file sbagliato.

Nel DOM del componente locale **il titolo viene prima del chevron**. La posizione a sinistra che si
vede su `ADVANCED` non e' un markup diverso: e' `order` sul flex.

### 2.2 Punto 2: da dove viene la differenza di stile

Da una sola regola, `properties-with-tree-view.scss`, blocco
`.properties-with-tree-view--rail .jj-disclosure`, che si applica soltanto perche' `Info.tsx` avvolge
la sola sezione Advanced in `<div className="jj-disclosure">`. Dentro quel blocco:

- `.props-section__chevron { order: -1; font-size: 10px; }` porta il caret a sinistra,
- `.props-section__title { order: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; color: $pc-slate-400; }`,
- `.props-section__header::after { order: 1; flex: 1 1 auto; height: 1px; }` disegna il filetto.

Il commento in testa al blocco e' esplicito e vincolante per il commit 1: *"`order` sui figli del
flex lo sistema senza toccare il componente, che ha **altri undici chiamanti in questo file**"*.
Cambiare il DOM del componente locale ricadrebbe su undici sezioni, fra cui `INHERITANCE`,
`CONTENTS` e sette altri `GENERAL`.

**Valori misurati a schermo**, che danno la distanza esatta da colmare:

| Sezione | font-size | weight | color | letter-spacing | chevron |
|---|---|---|---|---|---|
| GENERAL | 13px | 500 | `rgb(0, 0, 0)` | 0.5px | **destra** (x 1406 contro titolo 1047) |
| DEPENDENCIES | 13px | 500 | `rgb(0, 0, 0)` | 0.5px | **destra** |
| Advanced | 11px | 500 | `rgb(148, 163, 184)` | 0.88px | **sinistra** (x 1061 contro titolo 1079) |
| NODE | 11px | 600 | `rgb(148, 163, 184)` | 0.88px | **sinistra** (x 1045 contro titolo 1064) |

**Il badge `default`**: viene da `Info.tsx`, prop `headerRight` della sezione Advanced, che rende
`<span className="jj-disclosure__summary">` con `'default'` quando `ddata._state` e' vuoto e
altrimenti le prime tre chiavi unite da `·`. Il componente lo posiziona in
`.props-section__header-right`, che ha `margin-left: auto`. Resta dov'e' senza toccarlo, perche' il
commit 1 non tocca ne' il componente ne' quella classe.

**Scoperta collaterale, da decidere.** Il nero dei titoli `GENERAL` e `DEPENDENCIES` non e' voluto.
La regola base e' `.props-section__title { color: var(--text-muted) }` in `info-improvements.scss`,
ma `--text-muted` e' definita **solo** in `editor-v2/_themes.scss`, su `.editor-v2.theme-light` e
`.theme-dark`. Il rail e' portalato su `<body>`, fuori da quel sottoalbero, quindi la variabile non
risolve e il colore cade sull'ereditato, cioe' `rgb(0, 0, 0)`. D-UI-6 dice di uniformare "sul modello
di `GENERAL`, che e' quello leggibile": leggibile lo e', ma per un token che non risolve. Vedi
domanda 2. E' la **seconda** occorrenza dello stesso difetto: il prompt A ha trovato l'identico caso
su `--border-subtle`.

### 2.3 Punto 3: l'allineamento delle label e' **locale**, non globale

Risposta esplicita, come richiesto: **locale**. La Fase 2 puo' partire.

La regola e' `properties-with-tree-view.scss`, blocco
`.properties-with-tree-view--rail .properties-fields`, dove `.jj-field-label` porta
`justify-self: end` e `text-align: right`. E' scopata due volte: al rail, e a `.properties-fields`.
Il commento sopra il blocco documenta il perimetro e cita
`docs/discovery/discovery_2026-08-13_form_inspector_griglia_84.md` §2 (il file esiste): la classe
`.properties-fields` compare **solo** nel ramo model element in modalita' tab, e non nel popup del
menu contestuale ne' nel ramo view. Nessun altro pannello e' toccato.

Misure a schermo che lo confermano, e che spiegano anche perche' le due label divergono:

- `Name *` e' un `.jj-field-label` dentro `.jj-field`, che e' una **griglia a due colonne**
  `84px 276px`, con `text-align: right` e `justify-self: end`.
- `Depends from models` non e' una `.jj-field-label`: e' un `<b class="me-2">` dentro un
  `<label class="input-container">` in flex, `display: block`, `text-align: start`.

Le due label non condividono nessuna regola: sono due markup diversi in due sezioni diverse. Per
questo D-UI-7 tocca solo il lato `Name`, e `Depends on models` ha bisogno della sola sostituzione di
stringa.

Un'avvertenza sulla portata. La griglia `84px minmax(0, 1fr)` non e' solo un allineamento: e' la
struttura della riga, con la label come prima colonna. "Allineate a sinistra" ammette due letture,
e la differenza fra le due e' grande. Vedi domanda 1.

Nessuna ratifica in `docs/decisions.md` prescrive le label a destra: la ricerca su `right-align` e
`allineat` non restituisce voci pertinenti. La scelta e' pero' implementata di proposito, con un
commento che dice *"che e' cio' che il design chiede con «right-aligned»"*, quindi D-UI-7 rovescia una
decisione di design documentata, non un caso.

### 2.4 Punto 4: la stringa

**Letterale nel componente**, nessun i18n (assente nel repo, verificato nel giro B con controllo
positivo). Sta in `Info.tsx`, ramo model, dentro la sezione DEPENDENCIES:
`<b className={'me-2'}>Depends from models</b>`. Occorrenza unica in tutto `frontend/src`.

### 2.5 Punto 5: l'altezza dell'area del tree, e perche' il fix non e' quello previsto

Misure:

- `.tree-view-panel-container`: **altezza fissa inline `392px`**, scritta dal componente da
  `PRESET_2A.treePaneHeight` (`PropertiesWithTreeView.tsx`), con `flex: none` e `overflow: hidden`.
- `.tree-view-panel-body`: `clientHeight` 391 (il contenitore ha 1px di bordo inferiore),
  `padding: 4px 0`, **`overflow-y: auto`**.
- Righe di sezione `.tree-section__header`: **22px** misurati.

L'aritmetica del taglio a scroll 0: 391 meno 8 di padding fa 383 di area utile; 383 diviso 22 fa 17
righe piu' **9px di resto**. Con contenuto abbastanza alto, la diciottesima riga viene tagliata a
circa un terzo, che e' esattamente il sintomo descritto.

**Due cose che non tornano con il fix previsto dal prompt, e vanno dette.**

**(a) Non ho riprodotto il taglio.** Sul progetto sintetico il tree e' corto: misurato
`scrollHeight` 391 uguale a `clientHeight` 391, `scrollable: false`, e la lista degli elementi che
attraversano il bordo inferiore e' **vuota**. Il tuo caso ha piu' contenuto. Quindi ho l'aritmetica
ma non la riproduzione, e non affermo che il taglio cada su `MODELS` per la ragione che ho calcolato.

**(b) Il pane scrolla, quindi nessuna altezza fissa risolve in generale.** Con
`overflow-y: auto` sul corpo, il bordo inferiore taglia **la riga che capita a quello scroll
offset**. Rendere l'altezza un multiplo della riga rende deterministico il solo caso `scrollTop = 0`,
e per una sola forma di contenuto. Appena l'utente scrolla di un pixel, il taglio a meta' riga torna.

C'e' poi un secondo ostacolo all'opzione "altezza multipla": **non esiste una altezza di riga sola**.
I 22px misurati sono di `.tree-section__header`; le righe di elemento `.tree-node__header` non hanno
altezza dichiarata, solo `padding: 3px 6px` nel blocco del rail, quindi la loro altezza dipende dal
contenuto. Un multiplo che allinea le une disallinea le altre.

Conseguenza: quello che D-UI-9 vuole ottenere, cioe' che non si nasconda l'esistenza della sezione
modelli, si ottiene in modo stabile solo con un segnale che l'area continua, non con un'altezza.
Vedi domanda 3.

### 2.6 Punto 6: collisione di nomi

Gli interventi proposti in §3 **non introducono nessun nome nuovo**: agiscono su dichiarazioni dentro
regole esistenti (`.props-section__chevron`, `.props-section__title`, `.jj-field-label`,
`.tree-view-panel-body`) e su una stringa. Se la domanda 3 sceglie la soluzione con la sfumatura in
basso, servira' un nome nuovo, e il grep di collisione andra' fatto allora.

Verifica sui selettori che tocco, per accertarmi che non servano ad altro:

- `.props-section__*`: regole base in `info-improvements.scss`, override nel blocco `.jj-disclosure`
  di `properties-with-tree-view.scss`, piu' un riferimento in `views/data/viewoptions.scss` che
  **allinea a questa tipografia** i titoli "Field" e "Vertex". Cambiare le regole base ricadrebbe
  anche li': va scopato al rail.
- `.jj-field-label`: la dichiarazione da cambiare vive gia' dentro
  `.properties-with-tree-view--rail .properties-fields`, quindi e' gia' scopata.
- `.tree-view-panel-body`: la regola base e' fuori dal blocco del rail, quindi un padding va scopato.

---

## 3. Proposte per i tre commit (da approvare, non eseguite)

### 3.1 Commit 1, disclosure uniforme

Solo `properties-with-tree-view.scss`, **nessun tocco ai componenti**, seguendo il precedente gia'
in casa (l'`order` di `.jj-disclosure`):

- una regola scopata al rail che porta `order: -1` sul chevron di `.props-section` **fuori** da
  `.jj-disclosure`, cosi' GENERAL e DEPENDENCIES prendono il caret a sinistra senza toccare gli
  undici altri chiamanti fuori dal rail;
- dentro `.jj-disclosure`, riportare `.props-section__title` alla tipografia di GENERAL (13px,
  weight 500, letter-spacing 0.5px, colore secondo la domanda 2);
- su `.properties-node-section__label`, stessa tipografia.

Default di apertura invariati, badge `default` non toccato, nessuna rinomina.

La duplicazione fra il `CollapsibleSection` locale di `Info.tsx` e quello di `ModeSystem`, e fra
entrambi e il markup inline di `NODE`, resta e va censita come debito nel log, come chiede il prompt.

### 3.2 Commit 2, label e stringa

- `Info.tsx`: `Depends from models` diventa `Depends on models`.
- `properties-with-tree-view.scss`, blocco `.properties-with-tree-view--rail .properties-fields`:
  `.jj-field-label` passa a `justify-self: start` e `text-align: left`, se la domanda 1 sceglie la
  lettura minima.

Asterisco non toccato, controlli non toccati.

### 3.3 Commit 3, taglio del tree

Dipende dalla domanda 3. Se si sceglie la via minima entro il perimetro dichiarato: nel blocco del
rail, `.tree-view-panel-body { padding-bottom: 13px; }`, che porta l'area utile da 383 a 374, cioe'
esattamente 17 righe di sezione da 22px, e lascia il taglio nel vuoto **a scroll 0**. Non tocca
`PRESET_2A.treePaneHeight`, che e' un valore di preset ratificato.

---

## 4. Rischi

### 4.1 Il token che non risolve (§2.2)

Uniformare "sul modello di GENERAL" significa oggi uniformare su un nero accidentale. Qualunque cosa
si scelga, va scelta sapendolo.

### 4.2 La griglia a 84px non e' un allineamento (§2.3)

Se D-UI-7 va letta come "label sopra il controllo", il commit 2 smonta la griglia a due colonne e
annulla il lavoro documentato in `discovery_2026-08-13_form_inspector_griglia_84.md`. E' molto piu'
di un cambio di allineamento.

### 4.3 Il taglio del tree non ha una soluzione stabile a costo zero (§2.5)

Riassunto: il pane scrolla, le righe non hanno un'altezza unica, e io il taglio non l'ho riprodotto.
Qualunque fix di altezza o padding vale per un solo contenuto e per un solo scroll offset.

### 4.4 Dipendenza dal prompt A

`properties-with-tree-view.scss` e' toccato dal commit 1 del prompt A (inset e chrome del guscio) e
da due dei tre commit di questo prompt. Regole diverse, ma stesso file: aprire le due Fasi 2 in
parallelo produce conflitti di merge inutili. Vanno serializzate.

---

## 5. Domande aperte per Alfonso

1. **Come va letta D-UI-7** (§2.3, §4.2). Opzione minima: la griglia `84px 1fr` resta e la label si
   allinea a sinistra dentro la sua colonna, quindi le label finiscono a filo sinistro e i campi
   restano incolonnati. Opzione piena: la label torna a essere un blocco sopra il campo, la griglia
   sparisce, i campi prendono tutta la larghezza. Propongo la minima, che e' due dichiarazioni e
   reversibile; la piena e' una ristrutturazione del form.
2. **Che colore per i titoli** (§2.2, §4.1). Il nero attuale e' un token che non risolve. Opzioni:
   (a) uniformare tutti e quattro al nero ereditato, cioe' congelare l'incidente; (b) dare a tutti e
   quattro un colore esplicito e leggibile preso dai token globali (`--color-text-secondary` o
   simile), che e' la cosa giusta ma cambia anche GENERAL e DEPENDENCIES rispetto a oggi; (c) lasciare
   il colore fuori da questo giro e uniformare solo dimensione, peso e spaziatura. Propongo (b), e la
   segnalo perche' altera due sezioni che a schermo oggi ti vanno bene.
3. **Cosa deve garantire D-UI-9** (§2.5, §4.3). Il padding a 13px sistema il caso a scroll 0 per un
   contenuto della tua forma, e nient'altro. Se quello che vuoi e' che non si nasconda mai
   l'esistenza di altre sezioni, la via stabile e' un segnale che l'area continua, per esempio una
   sfumatura di due o tre pixel sul bordo inferiore quando il corpo e' scrollabile: indipendente dal
   contenuto e dallo scroll, e non e' uno split trascinabile. Costa una regola e un nome nuovo. Quale
   dei due vuoi?
4. **Riproduzione del taglio.** Mi confermi che nel tuo progetto il pane del tree scrolla, cioe' che
   scorrendo `MODELS` si vede per intero? Se invece non scrolla affatto, il difetto e' un altro e
   l'analisi di §2.5 va rifatta.

---

## 6. Stato

Fase 1 chiusa. Nessun file di codice modificato, nessun commit. Sonda `_tmp_uiC.ts` e screenshot
`_tmp_uiC.png` lasciati untracked, da cancellare a fine serie.

Prossimo passo, **su go-ahead**: commit 1, che non dipende da nessuna delle quattro domande.
