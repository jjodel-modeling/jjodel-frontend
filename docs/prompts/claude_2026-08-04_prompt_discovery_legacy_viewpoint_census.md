# Discovery read-only: censimento delle view legacy e destino runtime di `irLegacyClassic`

**Data**: 2026-08-04 15:38
**Tipo**: discovery, read-only. Nessuna modifica al codice sorgente.
**Branch**: `alfonso-frontend-jjtl`
**Effort consigliato**: xhigh

---

## Contesto (leggere prima di iniziare)

La migration `2.225 -> 2.226` (commit `637a5e238`, Fase 4 dell'arco IR) classifica al load le view dei progetti salvati prima del bump e le smista in tre secchi:

1. **default classic M1 marker-matched** (`CLASSIC_OBJECT_VIEW_MARKER`, `CLASSIC_SINGLETON_VIEW_MARKER`): ricevono `ir = defaultObjectViewIR()` con `migratedFrom: 'classic-default'`;
2. **`CLASSIC_VALUE`**: nessun IR, solo `irLegacyClassic = true`;
3. **`jsxString` custom non riconosciuto**: nessun IR, solo `irLegacyClassic = true`.

Nessun `jsxString` viene riscritto. La Fase 5a (`197b6c3d0`) ha spento il runtime classic e cancellato `WorkbenchCanvas`, `EdgeOverlay`, `graphContainer`, `SubViewComponent`, quindi non esiste più un motore che interpreti quei template.

Ne discende un'ipotesi da verificare, non da assumere: per i secchi 2 e 3 il progetto apre senza errori ma con la notazione persa, e probabilmente senza alcun segnale all'utente. La consegna del 2026-07-18 marca ⚠️ DA VERIFICARE A MANO proprio gli scenari sui progetti salvati pre-2.226, e non risultano chiusi in nessuna sessione successiva.

Questa discovery serve a decidere se il problema è teorico (tutti i progetti reali cadono nel secchio 1, che è indolore per costruzione) oppure se serve una strategia esplicita per il secchio 3. Non deve proporre soluzioni: deve produrre numeri e catene di codice.

---

## OBIETTIVO

Rispondere a sei domande, con evidenza di codice (path più riga) o con conteggi riproducibili:

1. Quante view, nei blob di esempio del repo, cadono in ciascuno dei tre secchi (più un quarto secchio: view che hanno già `ir`)?
2. La migration `2.225 -> 2.226` esiste ancora a HEAD e con quale predicato di classificazione esatto?
3. `irLegacyClassic` viene **letto** da qualcuno a runtime, o è un flag scritto e mai consumato?
4. Cosa rende oggi, concretamente, un elemento la cui unica view applicabile è di secchio 2 o 3? Quale componente, quale ramo, con quale fallback?
5. Esiste un qualsiasi segnale all'utente (badge, warning, log di console, riga nel selector del viewpoint) che distingua una view degradata da una view sana?
6. Aprendo l'editor di view su una view con `irLegacyClassic = true`, quali tab vengono montati e quali di essi scrivono ancora su campi che non influenzano più il rendering?

---

## AREA A: censimento del corpus

Il corpus è `frontend/src/examples/`. Contenuto verificato sul branch:

| File | Registrato in `index.ts` |
|---|---|
| `first.ts` (168 KB) | sì |
| `second.ts` (124 KB) | sì |
| `sequence.ts` (197 KB) | sì |
| `statechartplus.ts` (559 KB) | sì |
| `conflictsimulation.ts` (346 KB) | no |
| `shapes.ts` (94 KB) | no |
| `statechartplus_old.ts` (403 KB) | no |
| `StateMachine/`, `examples/` (sottocartelle) | da ispezionare |

Sono file grossi: **non leggerli a occhio**. Scrivere uno script node usa e getta che li carichi, estragga i `DViewElement` e li classifichi. Lo script va scritto **fuori dal repo** (per esempio in `/tmp`) e non va committato; il suo output va incollato nel report. Se lo script risulta riusabile e vale la pena tenerlo, segnalarlo nel report come proposta, senza aggiungerlo in questa fase.

Per ciascun blob riportare:

- versione di schema dichiarata nel blob (serve a sapere se la migration scatterebbe davvero al load);
- numero totale di `DViewElement`;
- ripartizione nei quattro secchi (default marker-matched, `CLASSIC_VALUE`, custom non riconosciuto, già IR), usando **gli stessi identici predicati che usa la migration a HEAD**, non predicati riscritti a mano. Se la classificazione della migration non è isolabile in una funzione richiamabile, replicarla riportando esplicitamente nel report il rischio di divergenza;
- per il secchio 3, un estratto dei primi 200 caratteri di ogni `jsxString` distinto, così da capire se sono template davvero custom oppure varianti di default sfuggite ai marker.

Distinguere nel conteggio i blob registrati in `index.ts` dagli altri: i primi sono raggiungibili dalla UI, gli altri sono materiale morto o di test e vanno contati a parte.

**Limite da dichiarare nel report**: gli esempi del repo sono un proxy dei progetti reali degli utenti, non i progetti reali. Se dal censimento risulta che gli esempi non contengono affatto view custom, il report deve dirlo come "il corpus disponibile non contiene il caso peggiore", non come "il caso peggiore non esiste".

---

## AREA B: destino runtime dei tre secchi

- **Migration a HEAD**: individuare `'2.225 -> 2.226'` in `frontend/src/redux/VersionFixer.tsx`, riportare il predicato di classificazione con path e riga, e dove sono definite `CLASSIC_OBJECT_VIEW_MARKER`, `CLASSIC_SINGLETON_VIEW_MARKER` e la costante che identifica `CLASSIC_VALUE`. Verificare che `updateDefaultView` in `frontend/src/view/viewElement/view.tsx` faccia ancora il carry-over di `ir` e `irLegacyClassic`.
- **Grep su `irLegacyClassic`**: censire **tutti** i siti, separando scrittura e lettura. Se le letture sono zero, dirlo esplicitamente: è il risultato più importante di quest'area.
- **Stessa cosa per `migratedFrom`**: chi lo scrive, chi lo legge. La spec v1.2 §11 dice che le view `migratedFrom: 'classic-default'` strutturalmente identiche alla factory delegano al rendering astratto nativo; verificare che quel confronto con la factory esista davvero nel codice e con quale criterio di uguaglianza (identità strutturale profonda? confronto di campi? id?).
- **Catena di rendering del secchio 2 e 3**: partendo da `ObjectNode.tsx` (e `ClassNode.tsx` per M2), tracciare cosa succede quando la view risolta non ha `ir`. Riportare il ramo esatto e dire se il `jsxString` viene ancora letto da qualche parte oppure ignorato del tutto.
- **Segnali all'utente**: cercare qualunque emissione (console.warn, badge, tooltip, riga di stato) legata a view prive di IR. Se non esiste nulla, dirlo.

---

## AREA C: superficie di authoring sulle view legacy

Questa area collega la discovery alla frizione F1 del dogfooding del 2026-08-04 (coesistenza dei tab dell'editor v1 con il tab IR sulla stessa view).

- In `frontend/src/components/editors/views/ViewData.tsx`, riportare la condizione esatta di `showIRTab` e l'elenco dei tab montati quando quella condizione è falsa.
- Per una view con `irLegacyClassic = true`: quali tab v1 restano montati, su quali campi del `DViewElement` scrivono, e quali di quei campi hanno ancora un effetto sul rendering a valle della Fase 5a. Classificare ogni tab in uno dei tre secchi già concordati per la tab map: **morto** (scrive su campi che nessuno legge più), **ridondante** (l'IR è autorità sullo stesso concern), **autoritativo** (è l'unico posto dove quel concern è esprimibile).
- Segnalare in particolare se esiste un tab autoritativo su una view legacy: sarebbe il caso peggiore, cioè un pannello che funziona su un rendering che non c'è più.

Non estendere l'analisi alle view IR-authored: quella è la discovery tab map, separata.

---

## VINCOLI (rigidi)

- **Read-only sul codice sorgente.** Nessuna modifica a file `.ts`, `.tsx`, `.scss`. L'unica scrittura ammessa nel repo è il discovery report.
- **Non toccare la critical zone** (`useJjomSync.ts`, `portDistribution.ts`). Non serve leggerli per questo perimetro; se il tracciamento ci finisce dentro, fermarsi e segnalarlo nel report.
- **Attenzione allo stato del working tree**: c'è un commit di igiene docs **preparato ma non eseguito** (indice già popolato con `CLAUDE.md`, `docs/claude-code-log.md`, `docs/claude-code-log-archive.md`, più il discovery report del selector viewpoint), da chiudere con `bash _finish.sh` alla root. **Non disturbare quell'indice**: se risulta popolato, fermarsi e segnalarlo invece di aggiungerci sopra. Mai `git add .`, mai committare `.claude/settings.local.json`.
- **Discovery report obbligatorio**: `docs/discovery/discovery_2026-08-04_legacy_viewpoint_census.md`. Contenuto minimo: obiettivo, file letti con path completi, findings per area, tabella del censimento, dipendenze e rischi, domande aperte per Alfonso. L'output del terminale non basta e la Fase non è chiusa finché il file non è scritto.
- **Hard stop dopo il report.** Nessuna proposta di fix, nessuna slice implementativa, nessun refactor. L'analisi si fa in chat a partire dal report salvato.
- **Log**: entry in `docs/claude-code-log.md` a fine task. `check:docs` è rosso da prima del 2026-08-04 per due entry del 2026-08-03 con `Corregge` e `Causa` in prosa libera: usare la forma prescritta e non aggiungere una terza entry malformata. Non rettificare le due vecchie in questo task, hanno un task loro.

---

## PROCEDURA

1. Leggere `CLAUDE.md` e `docs/claude-code-log.md`.
2. Verificare lo stato del working tree con `git --no-optional-locks status` prima di scrivere qualunque cosa.
3. Area B per prima (è la più economica e decide il peso delle altre due): grep su `irLegacyClassic` e `migratedFrom`, migration a HEAD, catena di rendering.
4. Area A: script di censimento e conteggi.
5. Area C: tab montati sulle view legacy.
6. Scrivere il report, aggiungere l'entry di log, `git add` dei soli due file, poi **STOP** senza committare (il commit lo esegue Alfonso).

## RIFERIMENTI

- Consegna dell'arco IR con il LAYER IMPACT REPORT della migration: `claude/2026-07-18_consegna_ir_editorv2.md` (KB di progetto).
- Spec IR v1.2, §11 (delega delle default migrate) e §13 (il lift inverso `jsxString` custom verso IR è dichiarato fuori dal core): `claude/spec_2026-07-18_ir_schema_v1_2.md`.
- Frizione F1 e triage dell'autorità sui tab: `claude/sessione_2026-08-04_2.md`, `claude/proposta_2026-08-04_tab_ir_partizione.md`.
- Discovery precedente sulla deprecazione del classic, Area B (dipendenze persistite): `claude/2026-07-17_prompt_discovery_classic_editor_deprecation_viewpoint_editorv2.md`.
