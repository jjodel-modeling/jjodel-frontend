# Ratifiche wiring connect + containment drop (D1-D5 + 3 domande)

Data ratifica: 2026-07-21. Fonte: `claude/discovery_2026-07-20_wiring_connect_containment_ir.md`. Ratificate da Alfonso in chat.

Decisioni formali che alimentano la Fase 2 del wiring (connect gesture object-as-edge + containment drop). Perimetro file e sequenze restano quelli del discovery (sez. C3): nessun file di critical zone, le 4 API esistenti di `canvasToJjom` coprono entrambi i gesti.

## Decisioni ratificate

- **D1 — matching + auto-create (H1).** Ratificata. 0 reference dirette + 1 rule -> creazione diretta; qualunque coesistenza -> popup unico a due famiglie di voci, reference dirette prima e object-as-edge dopo. **Wording voce object-as-edge: "New <Metaclasse>"** (es. "New Transition"). Scartata "Transition (source -> target)" per uniformita con le voci composition/reference.
- **D2 — posizione vertex nascosto.** Ratificata: punto medio tra i due endpoint.
- **D3 — container collassato come drop target.** Ratificata: in v1 NON e drop target (dropEffect 'none'), niente auto-expand al drop. L'auto-expand si valuta dopo la v1.
- **D4 — palette IR estesa ai child droppabili.** Ratificata come DEFAULT (non dietro toggle): in modalita IR la palette offre anche le metaclassi child dei dropContainers, altrimenti il gesto drop non e esercitabile quando i child non sono rootable (caso State/Transition del test bed). Fallback normativo invariato.
- **D5 — feedback drop.** Ratificata: solo cursore via dropEffect ('move' | 'none'), niente highlight hull in v1.

## Stato

Le 3 domande aperte del discovery sono chiuse (auto-expand = rifiuto v1; palette = default; wording = "New Transition"). Le condizioni della Fase 2 condizionata erano gia entrambe verdi (perimetro fuori critical zone; sequenza D->L validabile con test-first). Il cantiere wiring e pronto per la generazione del prompt Claude Code di Fase 2 (2 commit separati: connect gesture, containment drop), quando Alfonso lo richiede. Il test di integrazione della sequenza A2 (file 5 del perimetro) va scritto PRIMA del wiring: se fallisse, la Fase 2 si ferma li e si riporta.
