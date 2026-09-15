# BACKLOG (parcheggiato) — JjScript con contesto progetto per creare metamodelli/modelli

**Stato:** 🅿️ PARCHEGGIATO — non iniziare senza go-ahead esplicito di Alfonso.
**Data park:** 2026-07-14
**Origine:** discussione in chat durante la sessione 2b.3 (Alfonso: "è possibile estendere JjScript per dargli come contesto il progetto e creare un metamodello oppure un modello?").
**Natura:** feature con arco lungo, NON un refactor come la 2b.x. Tocca la critical zone (executor, model). Richiede architettura → discovery → LIR prima di qualsiasi codice. Da NON incastrare in 2b.3/2b.4.

## L'idea in una riga
Dare a JjScript la capacità di creare interi metamodelli (classi/tipi) o modelli (istanze), con il progetto corrente come contesto — sia per via deterministica (linguaggio di authoring), sia via Jjodie (LLM che genera lo script).

## Le due vie (e la loro dipendenza)
- **A — deterministica.** JjScript come vero linguaggio di authoring: uno script definisce più classi/attributi/reference/ereditarietà in un colpo. "Contesto progetto" = l'executor risolve i riferimenti contro il progetto (classi esistenti, viewpoint attivo). Nessun LLM, tutto testabile.
- **B — LLM-generation.** Jjodie genera il metamodello/modello da linguaggio naturale, usando il progetto come contesto iniettato, ed emette JjScript che l'executor esegue.
- **Nodo:** B poggia su A. L'IR deterministico e verificabile (JjScript/JjTL) è il bersaglio pulito per l'LLM. Coerente con la visione JjTL-come-core-IR.

## Cosa c'è già (substrato)
- JjScript manipola già il livello metamodello: `create class`, `extends`, `set attr`, `delete`, `rename`.
- **LModel proxy** → accesso al progetto (find by NAME): il contesto per il path deterministico c'è in gran parte.
- **`ConsoleContext.projectContext?` + `ragInitialized?`** → hook per iniettare contesto nell'LLM (groundwork RAG già presente).
- `src/ai/` → client LLM configurabili (OpenAI/Anthropic/Ollama).
- Registry/provider (post-2b.1) → punto di estensione naturale.
- **Card di offerta della 2b.3** → gate già pronto: l'LLM propone lo script, `[Esegui]` lo applica. Il pattern non-silenzioso scala da 1 comando a un batch di N.

## Gap veri (dove sta il lavoro)
1. **Single-command → multi-statement (il più grosso).** Oggi il parser parsa UN comando dal primo token e ignora i residui (confermato discovery 2b.3). Per un intero metamodello serve semantica di script/batch (sequenze, forse blocchi). È lo stesso nodo dei "token residui" rimandato più volte. "Script" nel nome oggi è aspirazionale.
2. **Livello modello (istanze M1).** `create class` è metamodello (M2). Da confermare con discovery se esistono comandi per istanziare conformemente; probabilmente più sottili.
3. **Atomicità/validazione/undo del batch.** Un metamodello a metà è peggio di niente: esecuzione transazionale + validate + undo *sul batch*, non sul singolo comando.
4. **Context assembly per l'LLM (solo via B).** Cosa mettere nel prompt (viewpoint attivo, classi esistenti, naming, vincoli): troppo = costo/rumore, troppo poco = metamodelli incoerenti.
5. **Naming/collisioni** con classi/modelli esistenti (riusare la convenzione suffisso (1),(2)).

## MVP raccomandato (da Claude, vetabile)
- **Step 1 — batch deterministico:** JjScript multi-statement + esecuzione transazionale (+ M1). Puoi già creare un metamodello incollando uno script. Deterministico, testabile, zero LLM.
- **Step 2 — LLM sopra l'IR:** context assembly + flusso "Jjodie, crea un metamodello per X" → l'LLM genera lo script → offerta (riuso card 2b.3) → esegui.

## Domande aperte da sciogliere quando si spacchetta
- Via deterministica (JjScript diventa linguaggio di authoring) o via LLM (Jjodie genera), o entrambe in sequenza (MVP sopra)?
- Livello: metamodello (M2), modello (M1), o entrambi?
- **Prima di fissare la terminologia:** rileggere `jjtljjelpaper.pdf` (file di progetto) per allineare M1/M2 alla semantica di leveling che Jjodel adotta davvero (potrebbe essere meno rigida della coppia classica).
