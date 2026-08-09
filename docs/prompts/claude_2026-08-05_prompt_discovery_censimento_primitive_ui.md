# Discovery (read-only) — Censimento trasversale delle primitive UI

**Data**: 2026-08-05
**Tipo**: Fase 1 di un two-phase. **Read-only: nessuna modifica al codice sorgente.** L'unico file che puoi scrivere e' il discovery report.
**Repo**: `jjodel-frontend`, branch `alfonso-frontend-jjtl`. Il branch locale puo' essere avanti rispetto a origin: lavora sul working tree locale.
**Critical zone**: nessuna da toccare. `useJjomSync.ts` e `portDistribution.ts` si leggono, mai si modificano.
**Hard stop**: a fine discovery, dopo aver scritto il report. Nessuna Fase 2.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

## Discovery report: obbligatorio

Salva il report in `docs/discovery/`, creando la cartella se non esiste, con nome `discovery_2026-08-05_censimento_primitive_ui.md`. L'analisi in chat parte dal file salvato, non dall'output di terminale: **la Fase 1 non e' completa finche' il report non e' scritto**.

**Se un report con questo nome esiste gia'**: leggilo per intero, non riscriverlo, e produci solo il delta in coda con una intestazione datata che dichiara cosa e' cambiato rispetto alla versione precedente.

## Contesto

Il progetto sta per estendere un design system a tutta la piattaforma, con migrazione **per componente e trasversale**: si unifica una primitiva alla volta ovunque compaia. Prima di poterlo fare serve sapere quante implementazioni di ciascuna primitiva esistono davvero e dove.

Un censimento parziale limitato al pannello Properties esiste gia' ed e' del 28 luglio: cinque implementazioni di controllo booleano (`ui/Checkbox`, `ui/Toggle`, `.bool-toggle`, `<input>` nativi legacy, `.viewpoint-checkbox`) e tre scale di spacing (token `--space-*`, `jj-*` di `_form-system.scss`, scala privata di `nestedView.scss`). **Verificalo e allargalo**, non darlo per buono.

**Attenzione al perimetro, che e' il punto dove questo progetto si e' gia' sbagliato una volta.** Il 4 agosto un censimento e' stato eseguito su `frontend/src/examples/` assumendo senza verificarlo che quei blob fossero il corpus esposto dal prodotto: erano codice morto, e il risultato e' valso per file che nessuno carica. Qui vale la stessa cautela: **una superficie va misurata solo dopo aver verificato che sia raggiungibile**. La sezione 1 viene prima delle altre per questo motivo.

## COSA mappare

Per ogni finding serve `file:riga`. Dove una cosa non esiste, dillo esplicitamente invece di dedurlo dal silenzio.

### 1. Il perimetro reale (da fare per prima)

Elenca le superfici dell'applicazione: route, viste di primo livello, pannelli, dialoghi. Per ciascuna dichiara:

- il componente radice, `file:riga`;
- se e' **raggiungibile** da un utente nella build corrente, e attraverso quale percorso di navigazione;
- se risulta vuota, disabilitata o segnata come non ancora disponibile.

Attese come non vive, da confermare o smentire: Templates, che renderizza una pagina senza nodi, ed Explore, dichiarata "coming soon". Se trovi altre superfici morte, dillo.

### 2. Controlli booleani

Ogni implementazione di checkbox, toggle, switch o pulsante a due stati. Per ciascuna:

- componente o classe CSS, `file:riga` della definizione;
- **numero di call site** e in quali superfici della sezione 1 compaiono;
- resa visiva: forma, colore acceso, colore spento, dimensioni;
- se scrive nel modello, in Redux, in `localStorage` o in stato locale.

### 3. Select, dropdown e picker

Stesso schema della sezione 2. Includi `JjSelect`, i `<select>` nativi, i picker ad hoc dentro `builder.value()` di `Info.tsx`, e ogni combo costruita a mano con un menu assoluto.

### 4. Sezioni collassabili e disclosure

Ogni meccanismo che apre e chiude una porzione di interfaccia: `CollapsibleSection`, accordion, pannelli espandibili, chevron con stato. Per ciascuno indica dove vive lo stato aperto o chiuso e se e' persistito.

### 5. Bottoni

Ogni variante visiva di bottone in uso: primario pieno, secondario, ghost, icon button, link testuale. Interessa quante varianti esistono **di fatto**, comprese quelle nate da stili inline o da una classe usata una volta sola.

### 6. Header di pannello

`.props-header` e i suoi modifier, piu' ogni altro pattern di intestazione con titolo, icona, badge e azioni. Chi sono i consumatori di ciascuno e dove divergono.

### 7. Spacing, colore, tipografia

- Quali file **definiscono** valori: token SCSS, variabili CSS, mappe, costanti TS.
- Quante scale distinte di spacing coesistono e chi usa quale.
- **Valori hardcoded**: quante occorrenze di colori esadecimali e di misure in pixel scritte a mano invece che prese da un token. Basta l'ordine di grandezza per file o per cartella, non serve l'elenco completo.
- Font size in uso e quanti valori distinti sono.

### 8. Il caso del controllo di scelta

Non risulta esistere alcun controllo segmented o a scelta esclusiva fra poche alternative. **Verificalo**: se qualcosa di simile esiste gia' da qualche parte, anche costruito a mano, la nuova primitiva deve partire da li' invece che da zero.

### 9. Precedenti di vetrina

Esiste gia' una route, una pagina o una storia che mostra componenti isolati, anche abbandonata? Se si', dove e in che stato. Il piano prevede una pagina viva: se una base esiste, si riusa.

## COME procedere

- Ricerca globale prima di concludere che qualcosa non esiste: una `grep` sull'intero `src/` costa dieci secondi e viene prima della conclusione, non dopo.
- Non aprire file interi quando basta la definizione piu' i call site: questo censimento e' ampio e va tenuto leggibile.
- Non proporre la soluzione. Il canone lo decide Alfonso a partire dal report. Se durante la lettura ti viene in mente un fix ovvio, va nel report, non nel codice.
- Se una sezione richiede molto piu' tempo delle altre, dillo nel report e consegna comunque il resto: e' preferibile un censimento completo al novanta percento consegnato, che uno perfetto non consegnato.

## Cosa NON fare

- Nessuna modifica a file sorgente, nessun rename, nessun refactoring, nemmeno banale.
- Nessun `git add`, nessun commit. Il report resta untracked: lo committa Alfonso.
- Nessuna modifica a `CLAUDE.md`.

## Struttura attesa del report

Obiettivo della discovery; file letti con path completo; una sezione per ciascuno dei nove punti sopra; una tabella riassuntiva finale con, per ogni primitiva, il numero di implementazioni trovate e il numero totale di call site; dipendenze e rischi individuati; domande aperte per Alfonso.

Chiudi il report con una riga esplicita su **quali superfici della sezione 1 risultano morte**, perche' e' il dato che fissa il perimetro di tutto il lavoro successivo.

## RIFERIMENTI

**I documenti che iniziano con `claude/` vivono nel knowledge base di progetto e non esistono nel repo: non cercarli e non segnalarli come mancanti.** Tutto il contesto che serve a eseguire questa discovery e' gia' contenuto in questo prompt; i riferimenti sotto servono ad Alfonso per la tracciabilita'.

- Piano di adozione: `claude/2026-08-05_piano_design_system_piattaforma.md`.
- Spec del primo componente da creare: `claude/2026-08-05_design_property_card_sintassi_astratta.md`.
- Censimento parziale del pannello Properties: sezione "Info strutturali scoperte" di `claude/sessione_2026-07-28.md`.
- Lezione di metodo sul perimetro: sezione omonima di `contesto_progetto.md`, datata 2026-08-04.

Nel repo, e quindi da leggere davvero: `CLAUDE.md`, `docs/claude-code-log.md`, e i report esistenti in `docs/discovery/`.
