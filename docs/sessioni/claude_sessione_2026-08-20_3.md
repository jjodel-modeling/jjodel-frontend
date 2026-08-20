# Sessione 2026-08-20 (3): due file di token, tre regimi, e un inventario fatto nel regime sbagliato

**Superficie**: Cowork con `~/jjodel` connessa (l'architetto scrive su disco), Claude Code su VS Code
per l'esecuzione, misure in pagina dell'esecutore.
**Branch**: `alfonso-frontend-jjtl`. **HEAD a fine sessione**: `639babd19`.
**Questo checkpoint sostituisce** `sessione_CORRENTE.md` (versione 2026-08-20 (2)).

---

## Stato a fine sessione

Aperto l'arco token, che il checkpoint precedente indicava come prerequisito di tutto il lavoro
cromatico. Sette commit, una discovery di architettura, un censimento, un arco consegnato e
verificato, una decisione ratificata e due volte emendata.

| Commit | Contenuto |
|---|---|
| `a8cf58505` | D-UI-13, discovery della riconciliazione, prompt arco 1 |
| `c00c1e660` | **arco 1**: 16 nomi identici ritirati da `tokens.css`, 169 → 153 |
| `29101f536` | log dell'arco 1 |
| `796055e96` | D-UI-13 Emendamento 1, prompt del censimento |
| `e35132977` | **arco 3**: censimento di testo e bordi, 745 righe |
| `a8cf56cd0` | log del censimento |
| `639babd19` | D-UI-11 Emendamento 1, D-UI-13 Emendamento 2, prompt della chiusura |

**Il fatto centrale della sessione**: `styles/tokens.css` e `styles/tokens/` dichiarano **33 nomi in
comune**, 17 con valore diverso, e chi vince dipende da un attributo che nessuno imposta al boot.
Non sono due temi, sono **tre regimi**: senza `data-theme` vince `tokens.css`, con `light` vince
`tokens/`, con `dark` vince `tokens/`. Sette dei dieci nomi di colore cambiano fra il primo e il
secondo. **Scegliere «Light» nelle impostazioni non riporta al default, porta in un terzo posto.**

La parita' esiste perche' `_colors-light.scss:75-76` dichiara su `:root, :root[data-theme="light"]`,
un blocco solo dalla riga 75 alla 379. Il ramo nudo ha la stessa specificita' di `tokens.css` e non
si spegne mai, nemmeno sotto `dark`.

---

## Decisioni prese

**D-UI-13** (ratificata, `a8cf58505`). Il livello semantico dei token appartiene a
`styles/tokens/`, il livello primitivo a `styles/tokens.css`, e nessun nome resta con due
dichiaranti. Vince `tokens/` sul semantico per due ragioni misurate: **solo `tokens/` ha un tema
scuro** (183 nomi contro zero), e **l'app parla gia' quel vocabolario** (~1800 riferimenti a nomi
esclusivi di `tokens/`). `tokens.css` conserva il livello primitivo, che `components/ui/**` consuma
con 212 riferimenti contro 6: cancellarlo spegnerebbe quella libreria. **Deroga sugli z-index**: le
due scale sono incompatibili (`--z-tooltip` 1070 **sopra** `--z-modal` 1050 in una, 1050 **sotto**
9999 nell'altra) e consegnare quel ramo introdurrebbe un difetto che oggi non c'e'.

**D-UI-13 Emendamento 1** (`796055e96`). La scala del testo non e' sfalsata di un gradino, e' **un'altra
scala**: `tokens/` ne ha cinque gradi, `tokens.css` tre, e il `--color-text-tertiary` di `tokens.css`
(`#94a3b8`) **e' il `--color-text-disabled` di `tokens/`**. I 162 siti si smistano, non si consegnano.
I bordi vogliono prima un censimento.

**D-UI-13 Emendamento 2** (`639babd19`). Tre premesse dell'Emendamento 1 erano sbagliate e la misura
le corregge; le conclusioni reggono per ragioni diverse. **Lo smistamento ha tre destinazioni, non
due**, e a deciderlo e' il contrasto misurato: `#94a3b8` sta a **2.34-2.56:1**, sotto qualunque
soglia. 16 `disabled` restano a `$slate-400` (esentati), 8 `placeholder` e **19 icone** vanno a
`--color-text-placeholder` `#64748b` (le icone a `#94a3b8` non passano la soglia 3:1 del non testo),
55 `caption` a `#475569` (6.9-7.6:1). Nello stesso commit si corregge il disaccordo fra
`tokens/README.md:77` («Placeholders, disabled») e `_colors-light.scss:100` («Labels, captions»),
che e' **l'origine documentale della confusione**.

**D-UI-11 Emendamento 1** (`639babd19`). La decisione era stata dichiarata chiusa mentre **due linee
del rail usavano ancora `--color-border-primary`**: `.props-header` e `.properties-section-header`,
tutte e due in `info-improvements.scss`. Non e' un arco nuovo di D-UI-13: e' l'applicazione di
D-UI-11 come gia' ratificata.

**Il prerequisito dark resta, con un altro meccanismo.** Non e' un vuoto: **quindici nomi su sedici
portano il valore chiaro dentro il tema scuro**. I 43 siti `subtle` oggi in dark dipingono `#606060`,
corretti; dopo lo smistamento dipingerebbero `#94a3b8`, piu' prominenti del testo secondario. L'arco
4 fabbricherebbe un'inversione di gerarchia. L'arco 2 e' pero' minuscolo: **sedici usi vivi in
tutto, e nove nomi su sedici senza alcun consumatore**.

**Ordine vincolante, seconda emissione**: **1** i 16 identici, fatto; **1bis** chiusura di D-UI-11
sulle due linee; **2** copertura dark dei sedici nomi; **3** censimento, fatto; **4** smistamento
del testo a tre destinazioni; **5** bordi, ormai senza il rail dentro; **6** sfondi; **7** ombre e
transizioni; **8** scala z. `--color-border-focus` esce dalla serie e va al ticket `--accent` di
`CLAUDE.md` §7.2.

---

## Bug risolti

**Sedici nomi dichiarati due volte con lo stesso valore** (`c00c1e660`). Ritirati da `tokens.css`.
Controllo positivo: 33 nomi collisi letti nei tre regimi prima e dopo, **99 valori su 99 identici**,
con la verifica che il foglio servito fosse quello nuovo (zero dei 16 rimossi, `--radius-base` e
`--input-height-base` ancora presenti). L'arco costruito per falsificare il modello non l'ha
falsificato.

**Spiegato il `z-index: 9000` di `.donation-banner`** (todo 5 dell'indice precedente). Non e' un
valore sbagliato: e' il valore che `_z-index.scss` intende per `--z-modal-backdrop`. Chi l'ha scritto
leggeva quella scala; chi usa `var(--z-modal)` ottiene 1050, cioe' l'altra. Due mondi con lo stesso
nome, e uno non arriva mai a runtime.

**Spiegata la banda `Conforms to` chiara in dark** (todo 2). `--color-success-bg` ha **zero**
consumatori: la banda porta il letterale `#f0fdf4` proprio perche' il token non e' mai stato usato.

---

## Bug nuovi e todo

**Alta**

1. **`.props-header` e `.properties-section-header` sul token sbagliato.** Prompt pronto, non
   eseguito. Il difetto e' **live oggi** in regime B.
2. **I tre regimi restano tre** finche' gli archi 2, 4, 5, 6 non sono consegnati.
3. **`AppearanceSettings.tsx:8` scrive `data-theme` a mano** invece di chiamare `ThemeService.set`.
   Ereditato, ed e' il percorso che decide quale sistema di token vince.
4. **Nessun consumer applica `localStorage.theme` al boot**: dopo un reload con il solo storage
   impostato, `data-theme` resta `null`, cioe' regime A.

**Media**

5. **41 siti in cui un token `text-*` dipinge sfondi o bordi.** Arco a se', nessuna destinazione
   dentro lo smistamento.
6. **Tre `CHIP: React.CSSProperties` identici** (`FieldCompartmentListEditor.tsx:62`,
   `FieldSegmentEditor.tsx:13`, `LabelEntryEditor.tsx:15`) accoppiano `--color-text-tertiary` e
   `--color-border-primary` nello stesso oggetto: **cambiano su due archi diversi**.
7. **14 fallback `#94a3b8`** inerti e falsi; **29 fallback** in totale nel censimento, tutti morti e
   tutti diversi fra loro.
8. **`--color-text-tertiary-dark` non e' dichiarato da nessuna parte** (`EditorToolbar.scss:166`, con
   fallback `#6B7280` che quindi dipinge sempre).
9. **18 bordi letterali** `#e2e8f0` / `#cbd5e1` nei due fogli del rail, 16 dei quali in
   `info-improvements.scss`. Le due scale che D-UI-13 vuole distinguere esistono gia' li' dentro,
   come letterali che nessun token governa.
10. **Quattro elementi mai misurati**: `.jj-conformance-bar`, `.properties-section-header`,
    `.jj-flags__rule`, `.rail-focusbar__back`. La sonda non e' riuscita a costruirne lo stato.
11. **`widgets.scss:90` e' invalida**: `border: 2px border var(--neutral)`.
12. **Due fogli quasi gemelli**, `components/abstract/style.scss` e `style_ap.scss`, con le stesse
    sette occorrenze. Non si sa quale sia vivo.
13. **Regole morte censite**: `.text-gray` (`dashboard.scss:1247-1249`), `.props-header__badge`
    (`info-improvements.scss:903-915`), `.tree-view-panel-header`.
14. **Le custom instructions del Project dicono ancora `localhost:3001`**, P8 dice 3000. Solo
    Alfonso puo' cambiarle, e ogni chat nuova ricomincia da li'.
15. **Push**: molti commit avanti su origin, da fare dal Mac.
16. **File `_tmp_` untracked** accumulati (ora anche `_tmp_tokens33.ts`, `_tmp_censusB.ts`) e tre
    discovery report del 19/8 mai committati.
17. Backlog `2.228` ereditato e invariato; serie D mai arrivata in `decisions.md`.

---

## Documenti aggiornati

- `frontend/src/styles/tokens.css`: 16 dichiarazioni in meno, commento di testa su D-UI-13.
- `frontend/src/components/editors/properties-with-tree-view.scss`: una citazione corretta.
- `docs/decisions.md`: D-UI-13 con due emendamenti, D-UI-11 con un emendamento.
- `docs/discovery/discovery_2026-08-20_riconciliazione_token.md`: nuovo.
- `docs/discovery/discovery_2026-08-20_censimento_testo_e_bordi.md`: nuovo, 745 righe.
- `docs/claude-code-log.md`: due entry.

## Prompt generati per Claude Code

| Prompt | Esito |
|---|---|
| `claude_2026-08-20_1705_prompt_ui_I_arco1_token_identici.md` | ✅ `c00c1e660`, controllo positivo 99/99 |
| `claude_2026-08-20_2055_prompt_ui_K_arco3_censimento_testo_bordi.md` | ✅ `e35132977` |
| `claude_2026-08-20_2145_prompt_ui_M_chiusura_dui11_regime_b.md` | **da eseguire** |

## Prompt pendenti

Invariati: `claude_2026-08-19_2336_prompt_ui_B_palette_rail_sinistro.md`,
`claude_2026-08-20_0025_prompt_ui_C_fase2_property_editor.md`,
`claude_2026-08-14_1530_prompt_J1_walker_jjel_modulo_puro.md`,
`claude_2026-08-18_1656_prompt_2228_fase2.md`.

---

## Prossimi passi

1. **Eseguire il prompt M**, chiusura di D-UI-11. Piccolo, sicuro, e chiude un difetto live.
2. **Arco 2**, copertura dark dei sedici nomi solo-light. Minuscolo: 16 usi vivi. I quattro
   `--gradient-*` si **derivano** dalle superfici scure, non si inventano.
3. **Arco 4**, smistamento del testo a tre destinazioni. Verifica visiva **non** sul rail (un solo
   sito, morto): sulle superfici a densita' maggiore, `dashboard.scss` (12), `control.scss` (11),
   `console.scss` (9), `tree-view-sidebar.scss` (9).
4. **Arco 5**, bordi, ormai senza il rail dentro.
5. Rispondere alle domande 5 e 6 del censimento (i 41 siti non testuali, i 14 fallback).
6. `AppearanceSettings.tsx` su `ThemeService.set`, e applicare `localStorage.theme` al boot.

---

## Info strutturali scoperte

- **`_colors-light.scss` dichiara su `:root, :root[data-theme="light"]`**, un blocco solo (75-379).
  E' il meccanismo dei tre regimi e la ragione per cui il tema chiaro non si spegne mai in dark.
- **Ordine di import**: `App.tsx:2` inlinea `tokens/index` via `App.scss:6`, `App.tsx:8` carica
  `tokens.css`, che nel bundle finisce **dopo** (offset 691470 contro 579428). `styles/diagram.scss:6`
  importa `tokens/index` una seconda volta, ma nel bundle la copia e' una sola.
- **Quattro sistemi di token, non due**: `tokens.css`, `tokens/`, `components/editor-v2/_themes.scss`
  (91 nomi generati da mappe SCSS, vocabolario diverso), `styles/variables.scss` (dichiara su `body`).
- **La trappola di `body` e' reale e misurata**: `--neutral` e `--color-disabled` leggono vuoto su
  `document.documentElement` e dipingono su un discendente di `<body>`. Una misura presa solo su
  `:root` riporta «non dichiarato» per nomi che dipingono.
- **Cinque hairline del rail impilati nella stessa colonna 399px**: `.rail-header` y=91,
  `.tree-search` y=135, `.tree-view-panel-container`, `.props-header` **y=527**,
  `.properties-node-section__rule` y=826. Quello di mezzo e' dell'altra famiglia.
- **La coesistenza dei bordi non e' fra due file** ma fra due fogli che vestono lo stesso sottoalbero:
  `PropertiesWithTreeView.tsx:515` monta il contenitore, `:634` rende `<Info>`, `Info.tsx:1039`
  emette `.props-header`.
- **`_tmp_uiH.ts` (untracked) sa costruire lo stato dei flag** e ha prodotto
  `_tmp_uiH_flags_light.png`: e' la ricetta da riusare per gli elementi che il censimento non ha
  raggiunto.
- **`components/ui/**` consuma il livello primitivo con 212 riferimenti contro 6**: `tokens.css` non
  si puo' cancellare.

---

## Cronologia

Aperto sulla riconciliazione dei due file di token, che il checkpoint precedente aveva indicato come
prerequisito. La discovery ha trovato piu' di quanto cercava: non due sistemi in conflitto ma tre
regimi di risoluzione, con il terzo raggiungibile da un'impostazione utente.

L'arco 1 e' stato costruito **per falsificare il modello**, non per cambiare la UI: sedici nomi
dichiarati due volte con lo stesso valore, la cui rimozione deve lasciare 99 valori su 99 invariati.
Non li ha cambiati. L'esecutore ha aggiunto di sua iniziativa il controllo che il foglio servito
fosse quello nuovo, che e' la differenza fra una misura e una speranza.

Poi il censimento, e da li' due correzioni contro l'architetto. La prima: avevo promosso la copertura
dark a prerequisito credendo che quei nomi non risolvessero in dark. Risolvono, col valore chiaro.
Premessa sbagliata, conclusione salva per un motivo migliore. La seconda: avevo scritto che le due
famiglie di bordo coesistono in due file; in uno dei due gli usi vivi sono zero, e la coesistenza
vera e' fra due fogli che vestono lo stesso sottoalbero.

La scoperta che vale piu' di entrambe e' che **D-UI-11 non era chiusa**. Due linee del rail usavano
un token diverso, e l'inventario non le aveva viste perche' era stato costruito in regime A, dove le
due famiglie risolvono allo stesso valore. E' lo stesso errore della settima linea di stamattina, con
un'altra causa: allora invisibile per stato, qui invisibile per regime. **Un inventario si fa su cosa
esiste, non su cosa si vede** vale anche per il regime in cui si guarda.

Lezione di metodo dell'esecutore, pagata e registrata: **una finestra di grep non e' un parse**. Due
siti letti in finestre di dodici righe e dichiarati vivi stavano dentro blocchi di commento; la
maschera dei commenti a livello di carattere, validata su quattro casi noti prima di essere creduta,
ha ribaltato entrambe le letture.
