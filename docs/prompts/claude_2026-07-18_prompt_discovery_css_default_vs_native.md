# Prompt Claude Code — Discovery: parità visiva tra default IR migrate e rendering nativo abstract

**Data**: 2026-07-18
**Branch di lavoro**: `cloud/ir-editorv2` (punta `dabeac79a` + il commit del fix palette). NON lavorare su `alfonso-frontend-jjtl`.
**Tipo**: FASE 1, discovery read-only con HARD STOP obbligatorio. Nessuna modifica al codice in questa fase.

## Contesto e contratto

Con la migration inversa 2.226, il viewpoint Default rende gli oggetti M1 via interprete IR (view default migrate, `migratedFrom: 'classic-default'`). Osservazione a collaudo sul progetto reale (state machine): il rendering con Default attivo differisce visivamente dal rendering nativo abstract di "nessun viewpoint", mentre pre-branch i due stati erano identici in flow.

**Contratto deciso da Alfonso (2026-07-18)**: parità totale. Default attivo e nessun viewpoint devono essere visivamente identici: stessa tipografia, stessi colori, stesse dimensioni dei nodi.

Delta osservati dagli screenshot (riferimento visivo):
1. Titolo nodo: nativo = "Nome : Tipo" sottolineato con banda header azzurrina; IR = testo piano su fondo bianco.
2. Valori attributi: nativo = corsivo blu, `=` grigio chiaro; IR = tutto nero uniforme.
3. Dimensioni nodo leggermente diverse (conseguenza di font/padding).

Ipotesi di lavoro (da confermare o smentire): non è una collisione CSS ma una mancata riappropriazione di stili; il path IR genera markup con classi proprie e non applica le classi SCSS del nodo nativo abstract.

## COSA (solo discovery)

1. **Mappare il render path nativo abstract**: quale componente rende il nodo M1 quando nessun viewpoint è attivo (ObjectNode nativo), quale markup produce (classi CSS di titolo, righe field, segmenti name/`=`/value) e da quali file SCSS arrivano sottolineatura, banda header, corsivo blu dei valori e grigio dell'uguale.
2. **Mappare il render path IR**: come l'interprete rende una view vertex default migrata (componente, markup, classi), dove vengono generati i field e con quali classi/stili, e cosa finisce nel tag `#ir-views-css`.
3. **Diff dei due path**: tabella markup/classi a confronto, con l'origine esatta di ogni delta osservato (1-3 sopra).
4. **Valutare le strade di fix** (senza implementarle), almeno queste tre, con costi e rischi:
   - (A) riuso delle classi native: il renderer IR applica le classi SCSS del nodo nativo quando rende view default migrate;
   - (B) delega: le view con `migratedFrom: 'classic-default'` (e la default wildcard built-in) delegano al componente nativo abstract, l'interprete rende solo le view IR non-default;
   - (C) estrazione: gli stili del nodo nativo diventano classi condivise usate da entrambi i path.
   Per ciascuna: file toccati, rischio di drift futuro, impatto sulle view IR custom (che NON devono ereditare la veste abstract: definiscono il proprio stile), impatto sui test esistenti.
5. **Raccomandazione motivata** su quale strada seguire.

## DOVE

- Path IR: `frontend/src/components/editor-v2/viewpoint/ir/` (renderer, compile, CSS per view) e l'innesto in ObjectNode.
- Path nativo: il componente che rende i nodi M1 in EditorV2 senza viewpoint (partire da ObjectNode e dai suoi SCSS).
- `git show c4b3b7c03` (Fase 2a, default IR) per come è definita `defaultObjectViewIR()`.
- Leggere per intero i file rilevanti prima di trarre conclusioni.

## Vincoli

- **Read-only**: nessuna modifica a codice, SCSS o spec in questa fase.
- **OBBLIGATORIO**: salvare il discovery report in `docs/discovery/` con nome `discovery_2026-07-18_css_default_vs_native.md` (obiettivo, file letti con path completi, findings con la tabella di diff, valutazione delle tre strade, raccomandazione, domande aperte per Alfonso).
- **HARD STOP a report scritto**: nessuna Fase 2 in questa sessione. L'analisi e il go-ahead avvengono nella chat di progetto sul report salvato.
- Aggiornare `docs/claude-code-log.md` con l'entry della discovery.

## RIFERIMENTI

- Spec IR v1.2: `docs/specs/spec_2026-07-18_ir_schema_v1_2.md`, sez. 10 (l'elemento senza view IR applicabile rende col nativo: è il comportamento di "nessun viewpoint") e sez. 11 (migration e marcatura).
- Report di consegna 2026-07-18, checklist punto 2 (nota CSS) e LIR VersionFixer.
- Criterio di accettazione del fix futuro: confronto screenshot Default vs no-viewpoint sul progetto state machine, pixel-identici a occhio (verifica visiva di Alfonso).
- CLAUDE.md resta la fonte di verità: in caso di conflitto, segnalare e fermarsi.
