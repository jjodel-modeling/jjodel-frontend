# Prompt di ripresa sessione (2026-07-25)

Riprendi il lavoro sul progetto Jjodel dal checkpoint della sessione precedente.

## Contesto da caricare (in quest'ordine)

1. `claude/sessione_2026-07-25.md`: checkpoint completo della sessione precedente. Contiene l'intero arco row view dispatch: decisioni ratificate (OQ-1..8, P1/P2/P3), RCA di dogfooding a tre stadi, commit, info strutturali e diagnostica console riusabile.
2. `contesto_progetto.md`: cruscotto aggiornato (stato corrente, bug aperti, code).
3. `claude/spec_2026-07-25_ir_row_dispatch_addendum.md`: solo se si entra nel merito di schema o semantica delle row view.

Non serve rileggere la catena dei checkpoint precedenti; sono indicizzati nel cruscotto.

## Quadro in breve

- **Arco row dispatch: FATTO e PUSHATO.** Kind `row`, compartment `source: {from:'children', filter}`, dispatch polimorfico per metaclasse concreta (cascata esatta > ereditata > wildcard > default built-in), soppressione top-level via hidden, edge assorbiti. Verifica visiva PASS sul class diagram (Person con righe `name : String` / `surname : String`). Origin allineato a `d12a54aa0` (sotto: `8a650833b` R1, `bb88adab4` discovery).
- **Finding aperto dal dogfooding**: il `FieldCompartmentListEditor` (B2a) corrompe le sorgenti che non conosce (una source `children` viene riscritta in `attributes` interagendo col pannello). **Mitigazione attiva: non aprire il tab IR di view con compartment `children` finché R3 non è landed.**
- **R3 generata, da eseguire**: `claude/2026-07-25_prompt_faseR3_row_authoring_preserve.md` (RowAuthoringPanel nuovo; opzione `children` + preserve-verbatim nel compartment editor; seed row da EnableIRPanel; MatchingSection e runtime IR non si toccano).
- **WIP estraneo nel working tree** su ~7 file (ClassNode, EnumNode, ObjectNode, VertexAuthoringPanel, IRNodeContent, irStyle, nodeSizing): probabile filone resize/content-hug eseguito e mai committato. R1 e R2 l'hanno isolato con staging filtrato. R3 tocca `VertexAuthoringPanel`, quindi il tema si ripresenta.
- Ambiente di test: viewpoint valido "Class Diagram IR v2" (id `Pointer_CD2_*`); il v1 è corrotto e cancellabile. Progetto con 1 metamodello (sentinella ok); Person = `Pointer1784936315522_USER_194`.

## Agenda della sessione

1. **Chiarire il WIP dei 7 file PRIMA di eseguire R3.** Identificare il filone (candidati: i prompt fase 2 resize/content-hug del 23-24/07), verificarne lo stato con Alfonso e chiuderlo con verifica visiva + commit tematico proprio, oppure stasharlo consapevolmente. Meglio arrivare a R3 con working tree pulito o quantomeno mappato.
2. **Eseguire R3** con Claude Code e verificarla: (a) round-trip del compartment `children` dal tab IR della view "IR Class v2" senza corruzione (il bug del dogfooding non deve ripresentarsi); (b) modifica del template della row view (es. literal ' : ' -> ' = ') riflessa sul canvas; (c) creazione di una row view da UI via EnableIRPanel.
3. Al PASS di R3: rimuovere la mitigazione dal cruscotto, cancellare il viewpoint v1 corrotto, Save del progetto di test.
4. In coda, invariati: docs §9 picker (`2026-07-24_prompt_docs_s9_alleggerito.md`, include la verifica della questione aperta by-name/by-id); discovery tab map (`2026-07-24_prompt_discovery_tab_map_ir_authored.md`); treeview double-click pin Fase 2.
5. Slice future quando si riapre il design: Operation (row view con parametri + fix del limite multi-compartment: render per-compartment, unione solo per l'hidden set), filtro per-reference, editing inline delle righe.

## Vincoli e promemoria

- Mitigazione attiva fino a R3: niente tab IR su view con compartment `children`.
- Limite noto R2 (documentato, non bug): con piu' compartment `children` nella stessa view, l'unione e' resa una volta sola al primo; si sistema nella slice Operation.
- Mistero edge-fantasma ARCHIVIATO (edge visibili con values vuoti nel modello pre-esistente; il flusso vivo scrive correttamente): riaprire solo se si ripresenta su modelli nuovi.
- Sentinella metamodelli prima di ogni sessione di dogfooding: `LProject.getProject().metamodels.map(m => m.id)`; 2 id = congelare.
- Ogni prompt Claude Code con fase di discovery include l'istruzione del report in `docs/discovery/` col naming `discovery_<data>_<descrizione>.md`.
