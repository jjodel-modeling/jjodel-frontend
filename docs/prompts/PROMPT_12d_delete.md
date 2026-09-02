# PROMPT — Slice 12d: delete di istanze con preflight

Implementa la delete nel manager CRUD, specificata da `CRUD Manager Simulation.dc.html` (Turno 12d) e dal contratto `docs/design/design_handoff_instance_node/form-engine-contract.md` (sezioni 4 «preflight» e 5 «eventi»). Il design HTML è la referenza autoritativa per copy, spaziature e stati.

## Dove

- Tabella e form di 2a/2b/2c. Nessuna superficie nuova. La colonna «referenced by» di 2b è già la misura che il preflight formalizza: stessa risalita `pointedBy` → DValue (non il conteggio piatto — un walk senza risalita darebbe lo stesso numero a chiunque, misurato in 2b).
- Motore puro: la logica di preflight e i verdetti stanno in `jjform/` (zero import, come `create.ts`); l'applicazione al D-graph nell'adapter, divisione `*Draw.ts` (puro, testabile) / `*Adapter.ts` (impuro) mantenuta.
- Evento: `delete(id, { reassignTo? | clearRefs })` — un solo evento, le opzioni sono il verdetto del preflight, non vie separate.

## Regole ratificate (12d)

1. **Preflight sempre**: `{ referencedBy: [{ id, refKey }], reassignCandidates: [...] }`. Non referenziato → conferma semplice. Referenziato → dialogo che elenca i referrer per nome (non per id) e offre: **reassign** (default, se esistono candidati compatibili per tipo), **clear refs**, **delete sporco**.
2. **Delete sporco dichiarato, non impedito**: il modello può diventare invalido; il motore lo dichiara (ref rotto rappresentabile, invariante sezione 2). Dopo un delete sporco la tabella mostra il ref rotto come tale — non `—`, non vuoto silenzioso.
3. **Delete di un'istanza con children**: il containment cade a cascata (i contenuti muoiono col contenitore — non esiste orfano di containment). Il preflight elenca anche i discendenti che cadranno, con conteggio; i referrer VERSO i discendenti entrano nel preflight come referrer.
4. **Candidati reassign**: stesso tipo o sottotipo concreto del target del ref, esclusa l'istanza in delete e i suoi discendenti.

## Attenzione (misure delle slice precedenti)

- Verifica la primitiva di delete del core come 2c fece con `addObject` (misura, non assunzione): se la cascata di containment la fa il core, il motore non la doppia — la dichiara nel preflight e basta. Se non la fa, la fa l'adapter, mai la UI.
- I typed element del parser Ecore e `parseDAnnotation` non c'entrano: nessun file di `api/data.ts`.

## Test attesi

- Preflight: non referenziato → conferma; referenziato → referrer per nome; con discendenti → discendenti elencati e referrer verso di loro inclusi.
- Reassign: candidati filtrati per tipo, esclusi self e discendenti; dopo reassign il ref punta al nuovo target e la riga «referenced by» si aggiorna.
- Clear refs: gli slot dei referrer si svuotano (buco dichiarato per i multivalore, coerente con `clearSlotValue` misurato in 2b — non accorcia l'array).
- Delete sporco: ref rotto visibile in tabella come rotto; il modello si dichiara invalido.
- Cascata: children spariscono, conteggi tabella coerenti; Cancel del preflight non lascia tracce.

## Fuori scope

Multi-selezione (12b), undo/redo della delete oltre quello che il core già offre, outline 10b.

## Coordinamento

Sessione parallela: rimozione NestedView (core, 5 file del censimento, nessuno in `editor-v2/`/`jjform/`). Pathspec, log con la sola tua entry, **entry di log in commit separato** (patologia da race confermata il 30-08).
