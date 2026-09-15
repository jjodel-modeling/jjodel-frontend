# Docs — Append §9 al discovery report del feature-picker (+ verifica stato del fix)

> Versione **alleggerita** del prompt `2026-07-24_prompt_docs_s9_e_push_branch.md`, che non è
> stato eseguito. Rimosse le parti obsolete: il push del branch è già avvenuto (il branch su
> origin ha assorbito `4d620c4` e il merge `dbbe229` di `staging`), e i caveat sul materiale
> concorrente non committato non servono più (quel materiale è landed).

Leggi `CLAUDE.md` prima di iniziare. Task di sola documentazione, con **una verifica di codice
read-only** che può modificare il testo da scrivere (vedi punto 1). Nessuna modifica al codice.

## COSA

Chiudere il discovery report del feature-picker aggiungendo la sezione §9 con l'esito della
diagnostica console. Il report attuale si ferma a §8.

### 1. Verifica read-only PRIMA di scrivere (determina una frase del §9)

Apri `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` e guarda
il memo che costruisce la lista delle feature (nome atteso `featureInfo` o simile; nel report
§1-§8 è descritto alle righe ~84-106, oggi potrebbe essere più lungo e più in basso).

Rispondi a **una** domanda, leggendo il codice a HEAD del branch corrente:

> Il memo risolve la metaclasse target **per nome** (`find(c => c.name === targetName)`) oppure
> **per identità/pointer** (via `appliableToClasses` o equivalente)?

Motivo della verifica: il report §1-§8 documenta la risoluzione **per nome** come causa prossima,
e propone il fix per-id come lavoro futuro. Un discovery successivo (shapes, 2026-07-24) ha però
descritto lo stesso memo come **già risolto per identità/pointer, con warning quando
`metamodelsWithClass > 1`**. Se il fix è già stato applicato (plausibilmente arrivato col merge di
`staging`, fatto a mano e non tracciato), il §9 non deve raccomandare un fix già presente.

Riporta l'esito in chat: **stato del memo a HEAD, con `file:riga` e la riga di codice della
risoluzione**. È l'informazione che serve ad Alfonso indipendentemente dal resto.

### 2. Append del §9 al report

File: `docs/discovery/discovery_2026-07-23_ir_feature_picker_stale.md`. Aggiungi in coda,
**senza toccare §1-§8**, il testo seguente **verbatim**, scegliendo la variante del blocco finale
"Causa prossima" in base all'esito del punto 1:

```markdown
## 9. Esito diagnostica console (2026-07-23) — H-fantasma confermata: due metamodelli

Output della diagnostica §7.3 (eseguita da Alfonso):
- `n. classi State: 2` → `...742933795_USER_193` con attributes `[name, isInitial]`; `...825150387_USER_195` con `[isFinal, isInitial, attr_0, attr_1]`.
- `instanceof usati dalle istanze: [...193, ...195]` → le istanze del modello sono agganciate a ENTRAMBE le State.
- `allAttributes L`: `...193` → `[name, isInitial]`; `...195` → `[isFinal, isInitial, attr_0, attr_1, name]`.
- `metamodels: [...USER_185, ...USER_185]` → DUE metamodelli con lo stesso suffisso canonico `USER_185`; i timestamp li datano a ~23h di distanza (`...742933793` vs `...825130993`).

Verdetto: H-fantasma confermata, variante multi-metamodello. Non due DClass nello stesso metamodello, ma due metamodelli quasi-duplicati (stesso `USER_185`), ciascuno con la sua `State`. Il memo `find(c => c.name === 'State')` itera i metamodelli e prende la `State` del primo (`...193`, la vecchia: name+isInitial); le feature nuove stanno sulla `State` del secondo (`...195`). H-forward-collection e H-troncamento cadono: la forward-collection di `...195` è completa e il getter la legge intera.
```

Poi, **variante A** (se il memo a HEAD risolve ancora **per nome**), aggiungi:

```markdown
Causa prossima (picker): risoluzione della metaclasse per NOME invece che per ID; con duplicati pesca la State del metamodello sbagliato. Fix difensivo isolato a `VertexAuthoringPanel.tsx` (risolvere per id/pointer via `appliableToClasses`), da valutare rispetto allo schema `.ir` (oggi nomi).
```

**variante B** (se il memo a HEAD risolve già **per identità/pointer**), aggiungi invece:

```markdown
Causa prossima (picker): risoluzione della metaclasse per NOME invece che per ID; con duplicati pesca la State del metamodello sbagliato. Stato a oggi: il memo di `VertexAuthoringPanel.tsx` risolve già per identità/pointer, con warning quando la classe è presente in più metamodelli; la causa prossima è quindi chiusa in codice e questa sezione la registra a fini storici. Resta aperta la questione multi-target (il picker usa `metaclasses[0]`, Domanda B del report).
```

In entrambi i casi chiudi con:

```markdown
Causa radice (bug separato, a monte): il progetto contiene due metamodelli duplicati (`USER_185`) con le istanze splittate fra le due `State`. Modello internamente incoerente. Il fix del picker cura il sintomo, non sana il modello. RCA chiusa il 2026-07-24: l'import di metamodello non è idempotente (`EcoreParser.parseM2Model`, `frontend/src/api/data.ts:423`, fa sempre `DModel.new` senza check di esistenza), quindi reimportare un `.ecore` in un progetto che ce l'ha già aggiunge un secondo metamodello. VersionFixer è scagionato: la migrazione `2.226 → 2.227` bonifica duplicati da import XMI, non li crea. Decisione: won't-fix operativo, il trigger è un'azione operatore. Nota operativa: evolvere i metamodelli in place, non reimportarli.
```

> Il blocco di chiusura è **nuovo** rispetto al testo originale del §9 (che diceva "da investigare
> come filone dedicato"): la RCA è stata chiusa dopo la stesura di quel testo, e il report deve
> riflettere lo stato finale, non l'ipotesi intermedia.

### 3. Commit e log

- `git add` del **solo** `docs/discovery/discovery_2026-07-23_ir_feature_picker_stale.md`
  (mai `git add .`, mai `git commit -a`).
- Messaggio una riga: `docs: close feature-picker discovery with console diagnosis (§9)`.
- Entry in `docs/claude-code-log.md` (data 2026-07-24 + ora, tipo `docs`, prompt, file toccati,
  esito, nome documento prompt).

Questo è un task di sola documentazione: **nessun hard stop per verifica visiva**, non c'è nulla da
guardare in UI. Committa direttamente dopo aver scritto il report.

## COME

- Append puro in coda al report. Non riscrivere né riformattare §1-§8.
- Nessuna modifica al codice, nemmeno se al punto 1 scopri che il fix manca: quella resta una
  decisione di Alfonso.
- Regole di scrittura: niente em dashes nella prosa, niente filler. Il testo sopra è già conforme,
  riportalo verbatim.

## RIFERIMENTI

- Report da chiudere: `docs/discovery/discovery_2026-07-23_ir_feature_picker_stale.md` (§1-§8 committati in `1187101`, `805fb4c`).
- RCA della causa radice: checkpoint `sessione_2026-07-24_2.md` (import non idempotente, VersionFixer scagionato, won't-fix).
- Prior art nel repo: `docs/discovery/discovery_2026-07-19_dvalue_duplicati_import_xmi.md`, `docs/discovery/discovery_2026-07-20_versionfixer_bonifica_slot.md`.
- Discrepanza da verificare al punto 1: `docs/discovery/discovery_2026-07-24_shapes_circle_diamond.md`, Finding 2.
