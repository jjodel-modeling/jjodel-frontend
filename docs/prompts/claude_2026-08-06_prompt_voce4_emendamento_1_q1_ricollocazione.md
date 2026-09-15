# Prompt Claude Code: voce 4, emendamento 1 (Q1 ricollocazione e disposizioni sugli esiti della Fase 0)

**Documento prompt**: 2026-08-06 12:50 (emendamento del prompt "2026-08-06 12:27 voce 4 barra 1.5 strada B")
**Da leggere insieme al prompt base**: modifica COSA, COME e Chiusura nei soli punti elencati qui; tutto il resto del prompt base resta in vigore.
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Stato di partenza**: Fase 0 eseguita e chiusa con hard stop sulla guardia git 1; report `docs/discovery/discovery_2026-08-06_barra_15_reanchor.md` agli atti, ancorato a HEAD `061be4b5c`, re-ancoraggio verde. La Fase 1 riparte da lì **senza rifare il re-ancoraggio**.

## Prerequisito di sblocco (ratificato da Alfonso il 2026-08-06)

1. L'unico prerequisito è il micro-commit `docs: normalize Causa in two 2026-08-03 log entries`: il diff +8 −5 sulle tre entry già nel working tree, committato da solo. La Fase 1 parte a `docs/claude-code-log.md` pulito.
2. **Deroga d'ordine ratificata**: la voce 2 adattiva e `chore: regenerate AGENTS.md` non sono più prerequisiti di questa slice; devono atterrare prima della voce 5. Le guardie del prompt base restano intere: STOP se `docs/claude-code-log.md`, `CLAUDE.md` o `.gitignore` risultano sporchi al momento di partire o di committare.
3. Validità del re-ancoraggio: se prima della Fase 1 atterrano solo commit docs/config (normalizzazione, voce 2, regen AGENTS), il report resta valido; se atterra altro su `src/`, rieseguire i soli punti impattati e annotarli in addendum al report (R-E/E-1 in `docs/decisions.md`).

## Q1 ratificata: Applies to assorbe i controlli autoritativi del tab legacy

COSA 1 e la mappa di Applies to cambiano così:

- In testa ad Applies to, prima del matching: **Name** (l'input esistente, unico writer di `DViewElement.name`) e i **select del father** (Viewpoint e, se oggi vive nel tab legacy per queste view, Parent view), ricollocati **verbatim**: stesso componente, stesso binding, stesso write path.
- Il bug del doppio writer di `father` (`InfoData.tsx:306,323`: due Select sullo stesso campo senza setter custom, il riparenting perde il parent precedente) viaggia intatto. È registrato; esplicitamente NON si corregge in questa slice.
- Se il pannello non ha già in scope l'handle dati che quei controlli richiedono, è ammesso UN prop opzionale aggiuntivo passato da `ViewData` al pannello, dichiarato nel report. Niente context nuovi, niente altro plumbing: se non basta, STOP e riportare.
- I controlli morti da triage (`Applicable to` / `appliableToClasses`) NON si ricollocano: spariscono dalla barra per le view IR; la rimozione del codice resta alla 1.6.

## Disposizioni sugli esiti non bloccanti della Fase 0

- **R-1 del report, padding (vincolante, entra in COME)**: i cinque corpi si raggruppano DENTRO la `section.properties-tab.properties-panel` esistente; nessun wrapper interposto fra `.view-editor-tab-content` e la section. Le due regole `!important` con combinatore figlio diretto (`viewapplyto.scss:28`, `properties-with-tree-view.scss:367`) collasserebbero il padding su entrambi gli host, e tsc non lo vede.
- **Q2, reference dell'edge**: nessuno spezzamento; la collocazione segue il JSX esistente. Il blocco della reference resta intero e va in Structure (R-5); se oggi `refName` è renderizzato dentro la sezione matching, resta col matching in Applies to e lo si annota nel report.
- **Q3, pin**: l'item "pin di identità" si cancella dal contenuto di Applies to. `authoringMetaclassPins` è un metadato di authoring senza UI per decisione (R-1 del 2026-08-04: scritto dal pannello alla scelta della metaclasse, letto solo dal livello di authoring). Nessun lavoro in 1.5.
- **Q4, breadcrumb**: COSA 4 si rinvia (scatta il renvoi già previsto): con viewpoint e parent che scrivono lo stesso `father` degenererebbe in `VP › VP › view`, e con il select Viewpoint dentro Applies to non aggiungerebbe niente. Una riga nel report e in chat; si riapre quando parent e viewpoint saranno distinguibili.
- **Q5, label e visible della row**: `draft.label` va in Text col suo blocco (R-5). Regola generale per i residui della row: ogni controllo vivo che non sta naturalmente in Applies to va in Text, in coda, annotando nel report la collocazione scelta con `file:riga`; se oggi vive dentro la sezione matching, resta in Applies to.
- Nota a margine ricevuta: `CLAUDE-BAK-NOT-TO-USE.md` untracked alla root è noto e non si tocca (lo elimina Alfonso a coda chiusa).

## Chiusura, delta rispetto al prompt base

1. Il commit della slice include il report di re-ancoraggio: `git add docs/discovery/discovery_2026-08-06_barra_15_reanchor.md` insieme ai file toccati (P4 del report: l'evidenza viaggia col codice, come per E-route).
2. **Deroga puntuale al "decisions.md non si tocca"**: aggiungere in coda alla sezione Arco A di `docs/decisions.md` UNA riga, nello stesso commit:
   `- **R-H** (2026-08-06) — Per le view IR il tab Applies to assorbe i controlli autoritativi del tab legacy (Name; father: Viewpoint/Parent), ricollocati verbatim con write path invariati; il doppio writer di father resta registrato e non corretto qui. Breadcrumb rinviata finché parent e viewpoint non sono distinguibili.`
3. La entry di log cita entrambi i documenti prompt: "2026-08-06 12:27 voce 4 barra 1.5 strada B" più "2026-08-06 12:50 emendamento 1".
4. Checklist della voce 5, tre punti in più:
   10. Padding orizzontale dei pannelli invariato su entrambi gli host (standalone e with-tree-view): nessun collasso da wrapper interposto.
   11. Su una view IR: Name editabile da Applies to e il rename riflesso su card e tree; cambio Viewpoint da Applies to funzionante, con lo stesso comportamento di oggi (limite noto del father compreso).
   12. Nessuna breadcrumb visibile (rinviata).

## RIFERIMENTI

- Prompt base: "2026-08-06 12:27 voce 4 barra 1.5 strada B" (nel KB: `claude/2026-08-06_prompt_voce4_barra_1_5_strada_b.md`).
- Report Fase 0: `docs/discovery/discovery_2026-08-06_barra_15_reanchor.md` (HEAD `061be4b5c`).
- `docs/decisions.md`: R-A, R-B, R-E/E-1, "validateIR muto sulla divergenza"; questo emendamento vi aggiunge R-H.
