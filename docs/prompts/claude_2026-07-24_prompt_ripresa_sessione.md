# Prompt di ripresa sessione (2026-07-24)

Riprendi il lavoro sul progetto Jjodel dal checkpoint della sessione precedente.

## Contesto da caricare (in quest'ordine)

1. `claude/sessione_2026-07-24.md`: checkpoint completo della sessione precedente. Contiene l'intera RCA del feature-picker e della duplicazione metamodello, le decisioni, e in appendice il testo §9 per il discovery report.
2. `contesto_progetto.md`: cruscotto aggiornato (stato dei 4 passi di chiusura del mega task IR, bug aperti).

Non serve rileggere l'intera catena dei checkpoint precedenti; sono indicizzati nei riferimenti del cruscotto.

## Quadro in breve

- Mega task authoring IR: codice completo e verificato (verifica post-chore PASS). Per la chiusura restano: push (in corso via prompt Claude Code), dogfooding, tab map.
- Il dogfooding ha scoperto un bug grave: il progetto di test contiene DUE metamodelli quasi-duplicati (stesso suffisso canonico `USER_185`, ~23h di distanza) e le istanze M1 sono splittate tra le due copie della classe `State`. H-fantasma confermata via diagnostica console. Il sintomo del feature-picker (lista parziale) è conseguenza: il memo di `VertexAuthoringPanel` risolve la metaclasse per NOME e pesca il metamodello sbagliato.
- Progetto corrotto CONSERVATO come reperto (non cancellare). Progetto fresh creato per il dogfooding: stabile al ciclo save + refresh (1 metamodello, id `Pointer1784917386942_USER_185` persistito).
- Fix del picker in HARD STOP finché non è decisa la strategia sulla causa radice.

## Agenda della sessione

1. **Verificare l'esito del prompt** `2026-07-24_prompt_docs_s9_e_push_branch.md` (§9 committato? push riuscito? lista dei commit pushati?). Se non ancora eseguito, farlo eseguire a Claude Code.
2. **Test riapertura dalla lista progetti** sul progetto fresh (Alfonso, 1 minuto): chiudere il progetto, riaprirlo dalla lista progetti, eseguire in console `LProject.getProject().metamodels.map(m => m.id)`.
   - Due id: il percorso di riapertura duplica. Generare la discovery Fase 1 sul load-project.
   - Un id (stesso timestamp `...917386942`): riapertura innocente. Generare la discovery Fase 1 "censimento dei creatori di metamodello": tutti i punti del codice che creano un metamodello (seed new-project, import Ecore/XMI, VersionFixer/migrazioni, clone) e quali possono eseguirsi all'apertura di un progetto esistente. Candidato principale: il confine di versione del codice tra le due giornate del progetto corrotto, con la migrazione VersionFixer 2.225 -> 2.226 che gira all'apertura. VersionFixer è critical zone: two-phase con go-ahead, eventuale Layer Impact Report in Fase 2.
3. Con la causa radice inquadrata: **decisione di Alfonso** tra strategia difensiva (il picker risolve per id; contenuta solo se non impone di cambiare lo schema `.ir`, oggi `metaclasses: string[]` di nomi) e curativa (eliminare il percorso che duplica). Solo dopo: sbloccare il fix del picker, in un unico prompt che copre risoluzione per id + dependency del memo (il fix del memo da solo è insufficiente).
4. **Riprendere il dogfooding IR** sul progetto fresh. Sentinella: eseguire la riga console dei metamodelli prima di ogni sessione seria; se compaiono 2 id, congelare e segnalare.
5. In coda: **tab map delle view IR-authored** (passo 4 della chiusura del mega task), preceduta da discovery su Style/Options vs interprete IR.

## Vincoli e promemoria

- Non cancellare il progetto corrotto; valutare un export su disco come backup del reperto.
- Ogni prompt Claude Code con fase di discovery include l'istruzione del report in `docs/discovery/` col naming `discovery_<data>_<descrizione>.md`.
- Pendenti fuori filone, non bloccanti: Fase 2 treeview double-click pin; Fase 2 classic node resize; ratifica border non-Conditional; Domanda B del report (picker multi-target, usa solo `metaclasses[0]`).
