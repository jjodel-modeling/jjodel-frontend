# Memo di ratifica 2: esito della Fase 0 dell'arco rail (R-RAIL-6..R-RAIL-13)

**Data**: 2026-08-10, sera
**Base**: `docs/discovery/discovery_2026-08-10_rail_fase0.md` (HEAD `569f78735`), letto per
intero; controverifiche fatte in questa sessione sul clone di `abc0182`.
**Perimetro**: risponde alle 11 domande aperte del report. Nessun prompt implementativo
prima di queste ratifiche.

---

## 0. Correzione di un mio errore: i font sono caricati

Il report ha ragione e io avevo torto. `_typography.scss:81` e `:84` contengono due
`@import url('https://fonts.googleapis.com/css2?...')` che caricano **Inter** (assi
variabili 100..900) e **IBM Plex Mono** (400/500/600). Verificato direttamente.

L'errore è mio e ha una causa precisa: la grep con cui ho cercato `fonts.googleapis` era
troncata a `head -20`, e le prime venti righe erano tutte occorrenze di `IBM Plex` in
`font-family`. Ho concluso da una lista incompleta invece di controllare che fosse
completa. Lo stesso errore è finito in tre documenti: il memo di ratifica, il prompt di
Fase 0 e `contesto_progetto.md`.

**Conseguenze sulle ratifiche già prese.**

- **C5.1 resta valido** e anzi si rafforza: il rail consuma `var(--font-sans)` e
  `var(--font-mono)`, mai nomi di famiglia.
- **C5.2 è nullo.** Non esiste alcuna voce "font dichiarati ma non caricati": non c'è
  niente da caricare e nessuna dipendenza da introdurre.
- **C5.3 si semplifica.** IBM Plex Mono rende davvero, quindi le metriche di densità del
  documento di design (9 proprietà sopra la piega, niente scroll orizzontale a 360px) sono
  misurate col font giusto e valgono. La verifica visiva resta, ma senza il sospetto sul
  fallback.

Restano due voci minori, diverse da quella che avevo aperto: il TODO a
`_typography.scss:74-78` propone il self-hosting per prestazioni, **conformità privacy** e
uso offline (per un progetto universitario europeo la seconda non è teorica: `@import` da
Google Fonts fa uscire l'IP dell'utente verso Google a ogni caricamento); e
`'Inter Variable'`, primo nello stack di `--font-sans`, non è il nome servito da Google,
quindi non fa mai match e vince sempre il secondo, `'Inter'`. Entrambe fuori arco.

---

## 1. La verifica che riduce il problema più grosso

Il report presenta D2 come non decidibile, e sul piano della cascata ha ragione: quale dei
due sistemi vince dipende da uno stato utente. Ma la domanda operativa non è "quale sistema
vince", è **"quali nomi sono ambigui"**. Ho fatto il diff meccanico dei due sistemi,
risolvendo le `#{$var}` SCSS e escludendo i blocchi dark:

- il sistema SCSS definisce **304** custom property, `tokens.css` ne definisce **169**;
- l'intersezione è di **27 nomi**, non di centinaia;
- di questi, **14 sono concordi** (stesso valore in entrambi) e **13 divergono**.

I 13 nomi divergenti, per intero:

| Nome | SCSS | tokens.css |
|---|---|---|
| `--color-bg-primary` | `#f8fafc` | `#ffffff` |
| `--color-bg-secondary` | `#ffffff` | `#f8fafc` |
| `--color-border-focus` | `#64748b` | `#06b6d4` |
| `--color-border-primary` | `#cbd5e1` | `#e2e8f0` |
| `--color-border-secondary` | `#d1d9e3` | `#cbd5e1` |
| `--color-text-secondary` | `#334155` | `#475569` |
| `--color-text-tertiary` | `#475569` | `#94a3b8` |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,.05)` | scala Tailwind a due strati |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,.08)` | idem |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,.12)` | idem |
| `--shadow-xl` | `0 16px 48px rgba(0,0,0,.16)` | idem |
| `--transition-fast` | `var(--duration-fast) var(--ease-out)` | `150ms ease` |
| `--transition-slow` | `var(--duration-slow) var(--ease-in-out)` | `300ms ease` |

**Tutto il resto è deterministico**: 277 nomi esistono solo nel sistema SCSS (fra cui
`--color-selection-*`, tutti i `--color-entity-*`, `--duration-*`, `--ease-*`,
`--color-accent-subtle`, `--color-node-shadow`), 142 solo in `tokens.css` (fra cui l'intera
scala `--color-slate-*`, `--font-size-*`, `--radius-base`), e 14 coincidono nei due
(`--radius-sm/md/lg/xl/full`, `--ease-out`, `--color-text-primary`, `--color-bg-tertiary`,
`--color-text-inverse`, `--input-height-sm/lg`).

Questo cambia la natura della decisione: non bisogna scegliere un sistema, bisogna
**evitare tredici nomi**.

---

## Decisioni da ratificare

### R-RAIL-6. Token: lista nera di 13 nomi, nessuna scelta di sistema (risponde a Q1 e Q2)

Il rail consuma custom property da entrambi i sistemi e **non usa mai i 13 nomi
divergenti** della tabella sopra. Chi ha bisogno di quei valori li prende dai nomi
deterministici:

- sfondi e bordi: dalla scala `--color-slate-*` (`tokens.css`), che è l'unica definizione
  esistente di quei valori e che coincide esattamente coi colori del design;
- testo primario: `--color-text-primary` (concorde in entrambi);
- testo secondario e terziario: **non** dai nomi semantici, ma da `--color-slate-600` e
  `--color-slate-400`, che sono i valori che il design chiede;
- ombre: scritte per esteso, colore dai token slate-tinted (vedi R-RAIL-10);
- transizioni: `var(--duration-fast) var(--ease-out)` e
  `var(--duration-normal) var(--ease-out)` scritte in coppia, mai `--transition-*`.

**Vantaggio**: il rail rende identico nei due regimi di cascata, e la regola è
meccanicamente verificabile con una grep di 13 nomi sul suo stylesheet. Nessun
refactoring, nessuna scelta di campo fra CLAUDE.md e il comportamento reale.

**Q2, la cascata theme-dipendente**: si registra come **bug di design system, priorità
alta, fuori arco**. Alta perché cambia la palette dell'applicazione in base a uno stato
utente non dichiarato da nessuna parte; fuori arco perché con R-RAIL-6 il rail ne è
immune, quindi non blocca. Il fix non è banale come sembra: allineare i selettori è una
riga, ma decidere *quale dei due valori* debba vincere per ciascuno dei 13 nomi è tredici
decisioni, e oggi entrambi i valori sono in produzione su utenti diversi.

### R-RAIL-7. Il tree pane riusa `TreeViewContent`, non lo riscrive (risponde a Q4, Q7, Q8)

È la decisione che ne governa tre, e il report non la pone esplicitamente, ma è implicita
in tutte le domande sul tree. `TreeViewContent` è 2357 righe e porta filtro con potatura
gerarchica, `<mark>` sui match, Enter-to-scroll, highlight di esecuzione JjScript, pin,
context menu. Riscriverlo per il rail sarebbe un arco a sé, più grande del rail.

**Il rail lo monta com'è e ne restila il foglio.** Un accertamento che ho fatto in più
rispetto al report lo rende sicuro: **`TreeViewSidebar.tsx` non è montato da nessuna
parte**. Nessun file fuori dalla sua cartella lo importa; l'unico riferimento è un commento
in `Dock.tsx:281`. Quindi gli unici consumatori vivi di `TreeViewContent` e di
`tree-view-sidebar.scss` sono `PropertiesWithTreeView`. **Il rischio 8 del report è
inerte**: il secondo lettore di `jjodel_treeview_visible` è codice morto. Restilare il
foglio del tree non tocca nessuna seconda superficie.

Si adotta dal design **solo ciò che è restyle** (CSS, zero logica):

- suffisso di tipo in mono: `font-family: var(--font-mono)` a `tree-view-sidebar.scss:1907`.
  Una riga. Il dato e la stringa esistono già identici, virgola per virgola;
- altezza riga 26px, nome 13px peso 500 (oggi 11px), peso 600 sulla riga selezionata;
- selezione: la pill esistente (vedi R-RAIL-8).

Si **rinvia** ciò che è comportamento nuovo:

- **Q4, badge lettera: no, restano i glifi.** Le lettere reintrodurrebbero le collisioni
  C = Class/Transformation e R = Reference/Rule che la Fase 2 C3 ha risolto tredici giorni
  fa con motivazione scritta in `TreeViewContent.tsx:549-552`. Un glifo a 16px porta più
  informazione di una lettera e non collide. Il documento di design va emendato qui.
- **Q7, filtro che appiattisce a depth 0: no.** La potatura gerarchica attuale ha già tre
  cose costruite sopra (`<mark>`, `matchCount`, Enter-to-scroll). Sostituirla è
  funzionalità nuova con regressioni possibili su tutte e tre, per un guadagno che nessuno
  ha chiesto.
- **Q8, conteggio "16 items": si ripiega su `matchCount`.** Il totale non filtrato oggi non
  esiste e calcolarlo significa aggiungere un attraversamento in `mapStateToProps`. Resta
  il comportamento attuale (numero dei match, solo a filtro attivo).
- **indent**: resta `depth * 12px`. Il design chiede `8 + depth * 13`; la differenza è di
  un pixel per livello e cambiarla tocca una costante TSX più la guida di indentazione in
  CSS, che è calcolata sullo stesso 12.

**Corollario C7.1**: `TreeViewSidebar.tsx` (249 righe) e il suo essere morto vanno a
backlog come voce di igiene, **non** in questo arco. CLAUDE.md vieta di rimuovere codice
apparentemente inutilizzato senza mandato esplicito.

### R-RAIL-8. Nessuna barra di selezione: pill più peso (risponde a Q3)

La barra cyan è stata **rimossa il 2026-07-28** (Fase 2 C1) con motivazione scritta in
`tree-view-sidebar.scss:1744-1746`, che lascia `--color-selection-bar` orfano con un TODO
di ritiro. Verificato: `--color-selection-bar` ha **zero** consumatori in tutto
`frontend/src`.

Il documento di design chiede `inset 2px 0 0 var(--color-selection-bar)`, e la sua
motivazione è di accessibilità: la selezione non deve essere segnalata dal solo riempimento
cyan. **La motivazione è giusta, la soluzione no.** Il secondo canale non cromatico che il
design stesso prescrive è il **peso 600 sulla riga selezionata**: costa una riga di CSS,
non ribalta nulla, e soddisfa lo stesso requisito.

**Proposta: non si reintroduce la barra.** Resta la pill già in opera
(`--color-selection-bg`, `tree-view-sidebar.scss:1741`), più il peso 600. Il TODO di ritiro
di `--color-selection-bar` resta aperto e fuori arco: non lo si esegue e non lo si annulla.

Con questa ratifica il triplo ruolo di `#0891B2` (selection bar, `entityMeta.reference.badgeText`,
`--color-cyan-600`) **resta inerte** e non va deciso.

Nota di merito su una mia imprecisione: nel primo memo ho scritto che il rail è "il task
futuro" nominato dal TODO in `_colors-light.scss:350-351`. Vale per `--color-selection-bg`,
non per `--color-selection-bar`, che nel frattempo era stato dismesso.

### R-RAIL-9. I 7 valori `nuovo`: letterali per le altezze, token per le entity (risponde a Q5)

Sono due gruppi con natura diversa e meritano risposte diverse.

**Tre altezze di controllo (26, 28, 44px): letterali nel foglio del rail.** La scala
esistente è 32/40/48 e non ha gradini sotto i 32. Introdurre tre token globali per le
altezze di riga di un solo componente inquinerebbe la scala di piattaforma con misure che
nessun altro consuma. CLAUDE.md vieta le CSS variables nei file di componente, quindi
nemmeno una scala locale in custom property: **valori letterali, raccolti in un blocco di
commento in testa al foglio del rail** che li dichiari come scala di altezze del rail. Se
la scala si dimostrasse generale, diventerà una voce DS a valle, con i numeri veri in mano.

**Quattro coppie entity (attribute, reference, operation, enum): diventano token.** Qui la
situazione è opposta: `_colors-light.scss:329-341` definisce già cinque coppie
`--color-entity-*`, e i commenti di `entityMeta.ts:10-12` e `_colors-light.scss:329-330`
prescrivono esplicitamente la sincronia bidirezionale fra i due file. Le quattro coppie
mancanti sono un debito già dichiarato, non una richiesta del rail.

**Corollario C9.1**: le quattro coppie entrano con un **commit separato e precedente**
all'arco (`refactor(tokens): complete the --color-entity-* pairs from entityMeta`), che
tocca `_colors-light.scss` e `_colors-dark.scss` e nient'altro. Sono file di token: non
vanno toccati dentro un commit di rail, e il commit chiude un debito che esisteva prima.

### R-RAIL-10. I 14 valori `snap`: si adotta sempre il gradino vicino, tranne le ombre (risponde a Q6)

Regola unica invece di quattordici micro-decisioni: **dove esiste un gradino di scala
entro un pixel o due, si adotta il gradino e si emenda il design.** Vale per i tre raggi
(7 e 9 vanno a `--radius-base` 6px e `--radius-md` 8px; 10 va a `--radius-md`), per i 19px
del titolo in Focus (a `--font-size-xl` 18px), per i 10px mono (a `--font-size-xs` 11px),
per le due altezze 30 e 34 (a `--input-height-sm` 32px), e per i due grigi `#fcfdfe` e
`#eef2f7` (a bianco e a `--color-slate-100`). Nessuna di queste differenze è visibile, e
ognuna difesa singolarmente costerebbe un token.

Due eccezioni motivate:

- **`letter-spacing: 0.08em` delle eyebrow resta letterale.** Il token più vicino
  (`--tracking-wide`) vale `0.05em`, e su un maiuscoletto di 11px la differenza si vede.
  Il letter-spacing non è una scala che valga la pena tokenizzare per un valore.
- **Le quattro ombre si compongono, non si snappano.** Lo scostamento non è di misura ma di
  tinta: il design è slate, la scala è nero puro, e `--shadow-*` è per di più fra i 13 nomi
  ambigui di R-RAIL-6. Si scrive la geometria per esteso e si prende il colore dai token
  slate-tinted che già esistono: `--color-accent-subtle` è **esattamente**
  `rgba(51,65,85,0.06)`, cioè l'anello di focus del design; `--color-node-shadow` è
  `rgba(15,23,42,0.06)` contro lo `0.07` dell'ombra del rail, differenza invisibile. Per il
  knob dello switch non c'è un token di colore all'alpha giusto: letterale.

### R-RAIL-11. Una visibilità, una larghezza (risponde a Q9)

- **Visibilità.** Il rail ne ha **una sola**, che è "rail aperto o collassato", persistita
  sulla chiave esistente `jjodel_property_panel_visible`, e comandata dal bottone
  `bi-chevron-double-right` dell'header. La visibilità del tree **sparisce come concetto**:
  in `2a` il tree pane non si chiude, collassa a 0px in postura Focus, e la postura è di
  sessione, non persistita (già stabilito da R-RAIL-3).
- **`jjodel_treeview_visible` e `TreeViewPanelContext` non si toccano.** Il rail smette di
  consumarli; il context resta in piedi con il suo altro contenuto (l'highlight di
  esecuzione JjScript, che serve al tree). Ora che `TreeViewSidebar` risulta morto
  (R-RAIL-7) la chiave non ha più lettori vivi, ma il suo ritiro è igiene, non arco.
- **Larghezza.** Una sola, sulla chiave esistente `jjodel_property_overlay_width`, con il
  minimo portato da 320 a **360px** (la soglia sotto cui il design non regge). L'altezza
  del tree pane è derivata dalla postura, quindi `jjodel_property_tree_height` smette di
  essere scritta.
- **Spariscono senza referente**: lo stato accordion `cardMaximized`, i due
  `toggleMaximize*`, lo splitter `tree-view-panel-vsplit`, i due `CollapsedPanelToggle`, la
  pill di riapertura di `bothCollapsed`. Il doppio click sull'header unico cambia
  **postura**.
- **`--jj-canvas-right-inset` resta il contratto verso il canvas**, con una larghezza sola
  da pubblicare. È l'unica cosa che il canvas legge dal rail e non va rotta.

### R-RAIL-12. La sezione NODE resta dov'è (risponde a Q10)

Il design mappa `NODE` sulla disclosure "Appearance" dentro l'inspector. Ma `NODE` oggi non
sta in `Info`: sta nel guscio del rail (`PropertiesWithTreeView.tsx:489-506`), dopo lo slot
dell'inspector, gated su `advanced`. Spostarla dentro il renderer dell'elemento di
metamodello ne cambierebbe **quando compare**, non solo dove: oggi compare per qualunque
selezione, lì comparirebbe solo per gli elementi di metamodello.

**Proposta: in arco 1 resta dov'è**, come sezione del corpo del rail sotto lo slot, gated
su `advanced` come oggi, restilata per somigliare alle disclosure row del design (caret,
eyebrow, filo, riepilogo a destra). È una modifica di resa, non di comportamento, ed è
coerente con C1.1. La migrazione dentro l'inspector si valuta quando si affronta il
renderer, con la domanda vera sul tavolo: NODE ha senso per una view?

### R-RAIL-13. Il rail legge una sola modalità (risponde a Q11)

Il rail consuma **solo Redux `state.advanced`**, come già fa oggi
(`PropertiesWithTreeView.tsx:253`). Non introduce `useInterfaceMode` e non tocca i gate
esistenti dentro `Info.tsx`. Il segmented resta nella top bar (C3.3, già ratificato).

La convivenza dei due sistemi va a backlog come **bug di architettura, priorità alta**:
`Info.tsx:96` legge `useInterfaceMode` e `Info.tsx:105` legge il `advanced` di Redux, a
nove righe di distanza, senza alcun meccanismo di allineamento, e
`SystemEvents.INTERFACE_MODE_CHANGE` non ha ascoltatori che risincronizzino Redux. Il
sintomo osservabile è un pannello che mostra "Allow cross-extend" e nasconde "Extends", o
il contrario, secondo quale dei due stati l'utente ha mosso per ultimo.

---

## Voci che questa Fase 0 apre, tutte fuori arco

| Voce | Priorità | Origine |
|---|---|---|
| Cascata dei token theme-dipendente: 13 nomi con due valori, vincitore deciso da `localStorage.theme` | alta | R-RAIL-6 / Q2 |
| Due sistemi di modalità non sincronizzati (Redux `advanced` contro `useInterfaceMode`) | alta | R-RAIL-13 / Q11 |
| `TreeViewSidebar.tsx` (249 righe) e `jjodel_treeview_visible` sono codice morto | media | C7.1 |
| Tre palette entity divergenti: `badgeBg`/`badgeText`, `color` dello stesso `entityMeta`, `$color-*` locali del tree. Cinque tipi su sette hanno un `color` di famiglia cromatica diversa dal proprio badge | media | report §4.7 |
| ~90 righe di rami `mode==='tab'` irraggiungibili in `PropertiesWithTreeView` più due chiavi di storage inerti | bassa | report §10.9 |
| Self-hosting dei font: prestazioni, conformità privacy (l'`@import` da Google espone l'IP dell'utente), uso offline. TODO già scritto a `_typography.scss:74-78` | bassa | §0 |
| `'Inter Variable'` è primo nello stack di `--font-sans` ma non è il nome servito da Google: non fa mai match | bassa | §0 |

---

## Cosa serve da te

Ratifica di **R-RAIL-6..R-RAIL-13**, più i corollari C7.1 e C9.1. Le tre che cambiano il
documento di design e che quindi vale la pena guardare due volte:

- **R-RAIL-7**: il tree resta quello che è, restilato. Niente filtro che appiattisce,
  niente conteggio totale, niente lettere al posto dei glifi.
- **R-RAIL-8**: niente barra di selezione, contro la lettera del design.
- **R-RAIL-10**: si adotta sempre il gradino vicino e si emenda il design, invece di
  difendere il valore esatto.

Col tuo ok l'ordine di lavoro diventa: prima il commit dei token entity (C9.1), poi il
prompt di implementazione dell'arco 1, con i passi 1-5 del build order del design ridotti a
quello che queste ratifiche lasciano in piedi.
