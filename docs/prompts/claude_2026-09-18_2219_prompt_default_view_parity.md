# Prompt-ID: P-2026-09-18-2219

**Titolo**: parità della view di default con la sintassi astratta

**Tipo**: two-phase (Fase 1 discovery read-only con hard stop, Fase 2 solo dopo go-ahead)

**Repo / branch**: `jjodel-frontend`, `alfonso-frontend-jjtl`

---

## COSA

Oggi, quando si seleziona una sintassi concreta diversa da quella astratta e per la metaclasse esiste
una view, il nodo nasce con una resa povera: box squadrato, bordo grigio uniforme, nome non
sottolineato, nessun compartimento. La resa in sintassi astratta dello stesso oggetto ha invece corner
radius, bordo chiaro (famiglia slate/cyan), nome dell'istanza sottolineato secondo la convenzione UML,
riga di separazione e compartimento sotto.

Il default deve coincidere con la sintassi astratta. Una view appena nata non deve mostrare alcuna
differenza rispetto alla resa astratta dello stesso elemento; la personalizzazione parte da lì.

**Decisioni già prese da Alfonso, non da rinegoziare:**

1. Parità piena, non solo il chrome del box: radius, bordo, sottolineatura del nome, separatore e
   compartimento vuoto. I valori degli slot nel compartimento restano fuori scope.
2. Ambito: object view (M1), edge view e row view. La class view (M2) resta fuori da questo giro.
3. Nessuna migrazione dei progetti salvati. Il nuovo seme vale per le view create da qui in avanti.
   Non toccare `VersionFixer.tsx` e non aggiungere metodi di migrazione: è un non-goal esplicito.
4. La resa non va ottenuta montando il componente della sintassi astratta dentro la view. Il default
   deve restare interamente autorabile: ogni parte visibile deve essere un elemento che l'autore può
   selezionare e modificare nel Symbol Editor / Structure editor. Un componente opaco che disegna il
   nodo violerebbe il punto del viewpoint.

---

## DOVE

Non assumere i path: la Fase 1 serve proprio a stabilirli. Punti di partenza per la ricerca:

- il seme della view alla creazione dal `+` sul viewpoint (R-IRN: le view nuove nascono IR-native, il
  dialogo chiede a cosa serve la view e la fa nascere con il suo IR);
- `updateDefaultView` e i template di default persistiti come `jsxString`, per capire quale dei due
  percorsi è effettivamente vivo oggi per object, edge e row view;
- il renderer della sintassi astratta per l'istanza M1 (`ObjectNode` e il suo SCSS), da cui si
  ricavano le misure reali;
- `editor-v2/viewpoint/ir/` per la forma del nodo IR da emettere.

**Critical zone da non toccare**: `useJjomSync.ts`, `portDistribution.ts`, `handlePosition.ts`.
Se la Fase 1 conclude che il task le tocca, fermarsi e dichiararlo nel report invece di procedere.

---

## COME

### Fase 1 — discovery read-only

Nessuna scrittura di codice. Obiettivi:

1. Stabilire dove nasce il seme di default, separatamente per object view, edge view e row view, e in
   quale forma (IR nativo, `jsxString` legacy, o entrambi conviventi). Se i tre casi passano da punti
   diversi, dirlo esplicitamente: cambia il numero di interventi della Fase 2.
2. Misurare la resa astratta, non dedurla dai token. Per il nodo oggetto in sintassi astratta
   riportare, letti da `getComputedStyle` sul DOM a runtime e non dal solo SCSS: `border-width`,
   `border-color`, `border-radius`, `background`, `padding`, `font-size` e `font-weight` del nome,
   `text-decoration` e larghezza effettiva della sottolineatura, spessore e colore della riga di
   separazione, altezza minima del compartimento. Riportare i valori in light e in dark.
3. Fare la stessa misura sul nodo che nasce oggi nel viewpoint, così la Fase 2 lavora su un delta
   numerico e non per approssimazioni successive.
4. Verificare quali token esistono già per quei valori. La Fase 2 dovrà riusarli, non ricopiare
   letterali: se un valore della sintassi astratta è cablato e non tokenizzato, segnalarlo come
   domanda aperta invece di inventare un token nuovo.
5. Verificare con ricerca globale che gli eventuali nomi nuovi (classi SCSS, id di elementi nel seme
   IR) non siano già in uso.
6. Individuare l'equivalente astratto di edge e row view e dire se esiste davvero. Se per uno dei due
   non c'è un riferimento astratto sensato, dirlo: quel pezzo esce dallo scope invece di essere
   inventato.

**Discovery report obbligatorio**: salvare in `docs/discovery/` il file
`discovery_2026-09-18_default_view_parity.md` con obiettivo, file letti con path completi, findings,
misure della tabella al punto 2 e 3, dipendenze e rischi, domande aperte per Alfonso. L'hard stop non
è completo finché il report non è scritto su file: l'output del terminale non basta.

**Hard stop.** Fermarsi qui e attendere l'analisi in chat.

### Fase 2 — implementazione (solo dopo go-ahead esplicito)

Verrà definita a valle del report. Perimetro previsto: riscrittura del seme di default in modo che la
resa iniziale coincida con la sintassi astratta, riusando i token esistenti, con ogni parte della resa
esposta come elemento autorabile. Diff minima, nessun refactoring opportunistico, nessuna rinomina di
identificatori esistenti, nessuna modifica alle interfacce TypeScript esistenti.

---

## CRITERIO DI ACCETTAZIONE

Creata una view nuova su una metaclasse in un viewpoint di sintassi e istanziato un oggetto, il nodo
reso nel viewpoint e il nodo reso in sintassi astratta hanno gli stessi valori calcolati per le
proprietà elencate al punto 2 della Fase 1, in light e in dark, e il nome dell'istanza è sottolineato
in entrambi. Una sola differenza misurata è un fallimento.

---

## RIFERIMENTI

- `CLAUDE.md` in root, fonte di verità delle convenzioni. Se questo prompt lo contraddice, segnalare
  il conflitto invece di eseguire.
- `docs/PROTOCOL.md` 1.2, clausole P1..P12.
- `docs/decisions.md`, serie R-IRN (view IR-native) e R-VP (nascita delle view).
- Aggiornare `docs/claude-code-log.md` a fine task, dopo la conferma visiva di Alfonso.
- Ogni messaggio verso questa lane apre con `[P-2026-09-18-2219]`.
