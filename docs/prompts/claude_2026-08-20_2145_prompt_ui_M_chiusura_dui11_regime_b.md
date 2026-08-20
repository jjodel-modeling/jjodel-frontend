# Prompt Claude Code, 2026-08-20 21:45: chiusura di D-UI-11 sulle due linee del rail

**Fase**: 2, implementazione. **Un solo commit, tre edit.** Nessuna discovery: la Fase 1 e' chiusa
con `e35132977`.
**Zona critica**: no. **Branch**: `alfonso-frontend-jjtl`. **Base**: `a8cf56cd0` o successivo.
**Decisioni che governano**: **D-UI-11 e il suo Emendamento 1**, piu' **D-UI-13 Emendamento 2**, in
`docs/decisions.md`. **Rileggile prima di cominciare.**
**Evidenza**: `docs/discovery/discovery_2026-08-20_censimento_testo_e_bordi.md`, §4.1 e §4.2.

---

## Inquadramento

Questo **non e' un arco nuovo di D-UI-13**. E' l'applicazione di D-UI-11, che dice «ogni linea di
separazione interna al rail destro usa `--color-panel-border`, un solo token per tutte» e che il
2026-08-20 e' stata dichiarata chiusa mentre due linee usavano ancora `--color-border-primary`.

L'inventario non le ha viste perche' e' stato costruito **in regime A**, dove le due famiglie
risolvono tutte e due `#e2e8f0`. In regime B (`data-theme="light"`) il censimento ha misurato
`.props-header` a `rgb(203,213,225)` mentre le cinque linee vicine della stessa colonna stanno a
`rgb(226,232,240)`, con quella diversa **in mezzo**, a y=527, quattro sorelle sopra e una sotto.
Il difetto e' **live oggi** per chiunque abbia scelto «Light» nelle impostazioni.

**E' uno scambio di token, non un cambio di valore.** In regime A nulla cambia a schermo, e questo
e' anche il controllo: se in regime A qualcosa si muove, l'edit ha toccato piu' di quanto doveva.

---

## COSA

Un commit. Tutti e tre gli edit in `frontend/src/components/editors/info-improvements.scss`.
Sostituire `var(--color-border-primary)` con `var(--color-panel-border)`, **solo** in queste tre
dichiarazioni. Ancorare al testo, non al numero di riga.

1. **riga ~467**, regola `.properties-section-header`.
2. **riga ~872**, regola `.props-header`.
3. **riga ~914**, regola `.props-header__badge`. **Questa e' regola morta** e lo sappiamo: non e'
   mai resa, ed e' documentata come tale in `properties-with-tree-view.scss:373-378`. Si corregge
   **lo stesso**, perche' una regola morta con il token sbagliato rinasce sbagliata il giorno che
   qualcuno la rianima. Non rimuoverla: Rule 9.

> **Da NON toccare, dichiarato qui perche' l'istinto dice il contrario.**
> `properties-with-tree-view.scss:869` contiene `border-bottom: 1px solid #f1f5f9; //
> var(--color-border-primary);`, cioe' un letterale piu' il token **commentato**, dentro un blocco
> gia' marcato `// TODO: cleanup — no longer rendered since rail arc 1`. Resta esattamente com'e':
> non e' una linea del rail, e' un residuo censito. Non scommentarlo, non allinearlo, non rimuoverlo.
> Restano fuori perimetro anche i **18 bordi letterali** `#e2e8f0` / `#cbd5e1` dei due fogli (§4.3):
> sono la stessa famiglia di difetto e sono censiti, ma non si toccano qui.

Nessun altro uso di `--color-border-primary` nel repo entra in questo commit: gli altri 128 siti
vivi sono materia dell'arco 5.

---

## COME, il gate

**Asserzione relazionale, non su valori assoluti** (P8). Il gate non deve dire
`colore === 'rgb(226,232,240)'`: deve dire **che le sei linee del rail dipingono tutte lo stesso
colore, e che quel colore e' quello di `--color-panel-border`**. Un gate sul valore assoluto eredita
il modello che ha prodotto quel valore e fallisce senza spiegare; questo fallisce dicendo quale linea
non combacia.

Sonda `_tmp_` non committata, viewport 1440x900, `http://localhost:3000` (**non 3001**), progetto
aperto con un nodo selezionato, come il censimento. Per ciascuno di
`.rail-header`, `.tree-search`, `.tree-view-panel-container`, `.props-header`,
`.properties-node-section__rule`, leggere il colore di bordo effettivo **nei due regimi chiari**,
A (nessun attributo) e B (`data-theme="light"`), ripristinando l'attributo a fine misura.

- **In regime A**: sei valori su sei identici, e identici a PRIMA dell'edit. Nessun movimento.
- **In regime B**: sei valori su sei identici **fra loro**. Prima dell'edit non lo erano: registrare
  nel report del log il valore di `.props-header` prima e dopo, perche' quella singola cella e' la
  prova che il commit ha fatto qualcosa.

**`.properties-section-header` va misurata o dichiarata non misurata.** Il censimento non e' riuscito
a costruirne lo stato (`querySelectorAll` = 0), e la stessa cosa vale per `.jj-conformance-bar`,
`.jj-flags__rule` e `.rail-focusbar__back`. Prima di dichiararla non misurabile, prova a riusare la
ricetta di stato di `frontend/scripts/smoke/_tmp_uiH.ts`, untracked ma presente nell'albero: quella
sonda il 2026-08-20 ha costruito lo stato dei flag e ha prodotto `_tmp_uiH_flags_light.png`. Se anche
cosi' non si raggiunge, **dillo esplicitamente** invece di lasciarlo implicito: una copertura
dichiarata mancante e' un risultato, una copertura taciuta e' un errore.

---

## Gate di regressione

- `npm run build`, exit 0.
- `npm run typecheck`: baseline **33**. Zero errori nuovi.
- `npm run smoke`: baseline **12 passed / 0 failed / 3 skipped**, A5 invariata.
- `npm run check:docs`, exit 0 senza warning.

---

## Vincoli

- **Un solo file di stile toccato.** Se ti accorgi che ne servirebbe un secondo, fermati e chiedi.
- **Zero refactoring opportunistico.** Nessun riordino, nessun rename, nessuna correzione di
  commenti adiacenti.
- Staging per file esplicito, `git commit -m "<messaggio>" -- <path>`, con il `--` dopo il messaggio.
- Messaggio proposto:
  `fix(rail): the last two hairlines onto the panel-border token (D-UI-11)`

## Hard stop

Dopo il commit, **fermarsi**. Il prossimo passo e' l'arco 2 di D-UI-13, la copertura dark dei sedici
nomi, e non parte senza il go-ahead di Alfonso.

## Log

Entry in `docs/claude-code-log.md` a fine task, tipo `fix`, con nelle note la tabella dei sei colori
nei due regimi, prima e dopo, e lo stato di copertura di `.properties-section-header`.
Nome del documento prompt: `2026-08-20 21:45 claude_2026-08-20_2145_prompt_ui_M_chiusura_dui11_regime_b.md`.
