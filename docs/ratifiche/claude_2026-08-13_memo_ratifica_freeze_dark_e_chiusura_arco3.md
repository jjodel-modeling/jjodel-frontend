# Memo di ratifica: freeze del dark theme (R-RAIL-44) e chiusura dell'arco 3

**Data**: 2026-08-13, sessione Cowork.
**Base misurata**: `origin/alfonso-frontend-jjtl` a `8cc34ed`, fetch delle 15:00.
**Fonti**: `docs/discovery/discovery_2026-08-13_arco3_fase1_griglia_84.md` (Fase 1, eseguita
14:30-14:55), il codice su origin letto da clone, `docs/decisions.md` R-RAIL-1..43,
`docs/redesign/rail/README.md` §7.

Due cose in un memo solo perché la prima cambia il criterio di chiusura della seconda.

---

## 1. R-RAIL-44, il freeze del dark theme

**Decisione**: il dark theme è **sospeso**, non deprecato. Il codice resta in albero, nessuno
ci lavora, e un domani si riprende senza aver buttato niente.

**Il fatto che lo ha già reso vero a codice**: `e682047a1` (13/8, 14:47:59) toglie il
sottomenu Theme dalla navbar. Spariti `setTheme('light')` e `setTheme('dark')`, meno 21 righe
in `Navbar.tsx`. Il dark non è più raggiungibile dall'interfaccia: ci si arriva solo scrivendo
`localStorage.theme` a mano, che è quello che fa l'harness Playwright.

**Testo da iscrivere in `docs/decisions.md`**, in coda alle voci attive, dopo R-RAIL-43:

```markdown
- **R-RAIL-44** (2026-08-13) — **Il dark theme è sospeso: i componenti nuovi non scrivono
  varianti dark.** Sospeso e non deprecato: i blocchi `[data-theme="dark"]` esistenti restano
  in albero e non si rimuovono (Regola 9), semplicemente non si manutengono e non si
  verificano. Il freeze era già vero a codice prima di essere scritto qui: `e682047a1` toglie
  il sottomenu Theme dalla navbar, quindi il dark non è raggiungibile dall'interfaccia e resta
  accessibile solo scrivendo `localStorage.theme`. **Emenda R-RAIL-42**: cade la clausola dei
  due temi come condizione di chiusura di una superficie nuova; sopravvive intatta la seconda
  metà, cioè che i grade `--color-slate-*` sono palette grezza e non seguono il tema. La
  ragione per cui la sospensione va scritta invece che sottintesa è che senza questa voce ogni
  prompt SCSS futuro continua ad aggiungere blocchi dark per abitudine, e il freeze si erode
  senza che nessuno lo decida. Nel solo foglio del rail i blocchi dark sono dieci, cinque dei
  quali sulle superfici dell'arco 3.
```

Nota per chi lo incolla: `docs/decisions.md` usa il trattino lungo come separatore fra id e
testo in tutte le 43 voci precedenti. **Non va "corretto" applicando le regole di scrittura
dei documenti**, esattamente come per il formato validato da `check:docs`.

### Cosa cade e cosa resta di R-RAIL-42

R-RAIL-42 è una voce doppia, e va emendata con precisione invece che superata in blocco.

| parte | contenuto | esito |
|---|---|---|
| prima | una superficie nuova del rail si guarda nei due temi prima di dichiararla finita | **sospesa** da R-RAIL-44 |
| seconda | i grade `--color-slate-*` sono palette grezza e non seguono il tema | **resta viva**, non c'entra con il dark |

La seconda metà è una lezione sul design system, non sul tema, ed è la stessa specie del
debito già a registro sul caret `--color-slate-400`. Dichiarare R-RAIL-42 "superata" la
butterebbe via insieme all'altra.

---

## 2. L'arco 3 è implementato, e la Fase 1 lo verifica invece di istruirlo

I quattro passi sono su origin in `ad8e8e061` (`Info.tsx` +228 righe,
`properties-with-tree-view.scss` +494 righe, due file in tutto), con report di discovery e
handover in `96bbd8bbc`. La Fase 1 lanciata dopo ha quindi prodotto una verifica a posteriori.
Regge.

**Cosa la verifica dimostra**, in ordine di quanto costava sbagliarlo:

**La convenzione dei bound è `-1`, e il segmentato la rispetta.** Era la domanda più cara,
perché un errore qui corrompe il modello senza dare errore di compilazione. Tre prove
indipendenti dentro lo stesso setter (`LModelElement.tsx:1504-1531`): il clamp
`Math.max(-1, val)` rende `-1` il minimo rappresentabile; il fallback su `NaN` è `-1`; e le
due clausole correttive escludono esplicitamente `-1` dal confronto d'ordine, cosa che ha
senso solo se `-1` non è un numero ma un simbolo. Il `999` che convive in `Info.tsx` è
normalizzazione locale al rendering degli slot M1 e non raggiunge mai il modello.
`MULTIPLICITY_PRESETS` scrive `-1`, e `applyPreset` scrive upper prima di lower, che è
l'ordine giusto per non far scattare la clausola correttiva su uno stato intermedio.

**L'ancora del passo A è quella che una discovery indipendente avrebbe raccomandato.** Non
`--rail`, che è troppo largo, ma `.properties-with-tree-view--rail .properties-fields`.
`properties-fields` ha un sito di mount solo in tutto il progetto (`Info.tsx:1480`), collocato
dopo il ritorno anticipato del ramo view e prima del fallback popup: è esattamente il form
dell'inspector e nient'altro. Specificità (0,3,0) contro (0,1,0) di `_form-system.scss:945`,
quindi vince senza `!important` e senza toccare il foglio globale (R-RAIL-25 rispettata). La
domanda "il passo A va spezzato in A1 scopatura più A2 griglia" ha risposta no, perché il
selettore di scopatura esisteva già e non andava creato: P2 non viene nemmeno sfiorata.

**Non esiste alcun ostacolo `!important` al layout.** In tutto il progetto le regole che
prendono `.jj-field` come contenitore sono **due**, e nessuna delle due usa `!important`. Le
due regole note (`viewapplyto.scss:815`, `info-improvements.scss:1130`) hanno `.jj-field` come
antenato e agiscono su bordo, ombra e outline di `select` e `input`.

**R-RAIL-12 è rispettata, e questo il report non lo verifica.** Misurato qui: zero occorrenze
di `Appearance` in `Info.tsx`; `NODE` resta nel guscio a `PropertiesWithTreeView.tsx:640-657`,
con un commento che cita la ratifica per nome; la disclosure unica del passo D è `Advanced`
(`Info.tsx:1487`). Il passo D rispetta il vincolo e la decisione 2 del piano del 12/8.

**Il perimetro negativo non è stato violato.** Il diff di `ad8e8e061` tocca due file.
`_form-system.scss`, `info-improvements.scss`, la critical zone, il tree, l'header del rail e
il canvas non compaiono. **Il perimetro non va rinegoziato.**

### Posizione

L'arco 3 si chiude come fatto. Non c'è niente nella verifica che argomenti una riscrittura di
`ad8e8e061`, e quello che manca non è codice: è misura.

---

## 3. Cosa resta prima di dichiararlo chiuso

**La definition of done, che adesso ha una gamba sola.** Il design chiede la misura nei due
temi, e R-RAIL-42 esisteva proprio perché una Focus bar in dark non l'aveva aperta nessuno.
Con R-RAIL-44 l'harness gira **una volta, in light**. Restano da misurare: almeno nove
controlli visibili a 420×1000 in preset `2a` senza scroll, contati sul DOM con
`getBoundingClientRect` e non a occhio; nessuna scrollbar orizzontale da 360px in su, con
controllo mirato sulla riga multiplicity. `harness_arco3.mjs` è già scritto e copre i kind
che questo arco tocca.

**Il giudizio estetico resta tuo** e l'harness non lo sostituisce: proporzioni, gerarchia
visiva, comportamento percepito.

**Il delta non committato sul foglio del rail.** Il lavoro delle 14:47 su
`--color-selection-bg` nei chip di multiplicity e nei flag non è entrato in nessuno dei tre
commit ed è ancora nell'albero (`git log ad8e8e0..8cc34ed -- properties-with-tree-view.scss` è
vuoto, e `color-selection-bg` non compare nella versione committata). Sta esattamente sulle
superfici dei passi B e C. Va committato se è lavoro light, buttato se è dark, non lasciato lì.

**La spec e il codice divergono di due caratteri.** `docs/redesign/rail/README.md:244` dice
`84px 1fr`, il codice scrive `84px minmax(0, 1fr)` per una ragione misurata e documentata in
loco: una traccia `1fr` ha `min-width: auto`, non scende sotto il min-content e produce scroll
orizzontale a rail stretto. **Va aggiornata la spec.** È la stessa specie della lacuna che il
delta v31 ha già segnalato per la regola del booleano: un prompt futuro che citasse §7 come
autorità riprenderebbe il valore sbagliato e si ricomprerebbe lo scroll.

---

## 4. Voci nuove da aprire

**L'undo di un preset di multiplicity.** `applyPreset` esegue due assegnazioni consecutive che
aprono due TRANSACTION distinte (`LModelElement.tsx:1509` e `:1526`). Un solo Ctrl-Z potrebbe
ripristinare metà preset, e un preset applicato a metà è uno stato del modello, non un
artefatto visivo.

Precisazione che cambia come si classifica la voce: **i due stepper facevano già lo stesso**,
con due scritture separate. Non è una regressione introdotta dal passo B, è una proprietà
preesistente che il segmentato rende raggiungibile con un click solo invece che con due gesti
deliberati. **L'esposizione sale, la classe di bug no.** Va aperta come voce sua, priorità
media, non come difetto dell'arco 3.

Verifica proposta: applicare `[1..*]` a un attributo `[0..1]`, un solo Ctrl-Z, leggere i due
bound in `windoww.store.getState().idlookup[<id>]`.

**Un conteggio si prende sull'output completo, mai su una finestra.** La Fase 1 ha eseguito
`npm run typecheck | tail -60` e ha contato 12 errori; sull'output intero sono 33, la baseline
attesa. Il report se ne è accorto da solo e lo ha scritto, che è il comportamento giusto. Ma è
la **seconda occorrenza** della stessa lezione con uno strumento diverso: la prima fu la grep
chiusa con `head -20` che dichiarò Inter e IBM Plex Mono non caricate, e finì in tre documenti
prima che la Fase 0 la smontasse. Che si ripresenti dopo che la lezione è già scritta significa
che non è operativa. **Vale una riga in CLAUDE.md §5, non un'altra voce di backlog.**

**Il censimento SCSS del piano era incompleto** di tre fogli (`viewParenting.scss`,
`nestedView.scss`, `viewoptions.scss`, quattro righe in tutto). Tutti fuori perimetro, nessuno
prende `.jj-field` come contenitore: la conclusione non cambia e non c'è niente da propagare.
Il documento di piano del 12/8 non va mantenuto, è superato dall'handover.

---

## 5. Cosa va fatto nel repo

In ordine, e sono commit separati:

1. **R-RAIL-44 in `docs/decisions.md`**, testo sopra, più l'emendamento a R-RAIL-42 scritto
   come nota nella voce esistente e non come riscrittura.
2. **`docs/redesign/rail/README.md:244`**: `84px 1fr` diventa `84px minmax(0, 1fr)`, con la
   ragione in una riga.
3. **Le due voci nuove** in `docs/TECH-DEBT.md`: l'undo dei preset, e la riga in CLAUDE.md §5
   sui conteggi su output troncato.
4. **Rotazione del log**: 23 intestazioni attive contro una soglia di 20. Era già dovuta prima
   di questa sessione, è una voce e un commit a parte.

Fuori dal repo e prima di tutto: decidere del delta non committato sul foglio del rail.

---

## Cosa ti serve firmare

Niente. Le due decisioni sono già prese in chat: **dark sospeso** e **arco 3 chiuso come
fatto**. Questo memo le scrive per intero perché al momento vivono in due righe di
conversazione, che è precisamente il modo in cui la regola del booleano è finita fuori da
`decisions.md` e R-RAIL-14 è rimasta in limbo fino a R-RAIL-38.

Resta una sola cosa che non è una firma ma una misura: la definition of done, un tema, e il
tuo occhio.
