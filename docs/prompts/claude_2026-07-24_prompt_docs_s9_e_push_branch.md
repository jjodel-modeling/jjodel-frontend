# Prompt Claude Code: chiusura discovery picker (§9) e push del branch

**Tipo**: task meccanico docs + git. Nessuna fase esplorativa: nessun discovery report richiesto. Nessuna modifica a codice sorgente.
**Branch**: `alfonso-frontend-jjtl` (working tree locale, condiviso con sessioni concorrenti: scope strettissimo).
**Data**: 2026-07-24

---

## COSA

Tre cose in sequenza:
1. Chiudere il discovery report del feature-picker aggiungendo la sezione §9 (esito della diagnostica console: H-fantasma confermata).
2. Sistemare l'entry di log della discovery e committare i due file docs con add mirato.
3. Ispezionare e pushare il branch.

## DOVE

- `docs/discovery/discovery_2026-07-23_ir_feature_picker_stale.md` (append del §9 in coda, dopo la sezione 8)
- `docs/claude-code-log.md` (entry della discovery)
- Nessun altro file.

## COME

### Fase 0: stato del working tree (read-only)

- Leggere `CLAUDE.md` e `docs/claude-code-log.md` (convenzione di inizio sessione).
- `git status` e `git diff docs/claude-code-log.md`.
- Atteso nel working tree, in tutto o in parte: (a) l'entry di log della discovery picker non ancora committata (lasciata lì dal task precedente, commit `805fb4cb2`); (b) eventuale materiale di una sessione concorrente (report classic node resize e relativa entry di log), se non già committato da Alfonso; (c) rumore `.claude/*`. Il materiale (b) e (c) NON va toccato né committato.

### Task 1: append §9 al report

Aggiungere in coda a `docs/discovery/discovery_2026-07-23_ir_feature_picker_stale.md`, dopo la sezione 8, il testo seguente VERBATIM (ratificato in chat di progetto; non riformularlo, non correggerne lo stile):

```markdown
## 9. Esito diagnostica console (2026-07-23) — H-fantasma confermata: due metamodelli

Output della diagnostica §7.3 (eseguita da Alfonso):
- `n. classi State: 2` → `...742933795_USER_193` con attributes `[name, isInitial]`; `...825150387_USER_195` con `[isFinal, isInitial, attr_0, attr_1]`.
- `instanceof usati dalle istanze: [...193, ...195]` → le istanze del modello sono agganciate a ENTRAMBE le State.
- `allAttributes L`: `...193` → `[name, isInitial]`; `...195` → `[isFinal, isInitial, attr_0, attr_1, name]`.
- `metamodels: [...USER_185, ...USER_185]` → DUE metamodelli con lo stesso suffisso canonico `USER_185`; i timestamp li datano a ~23h di distanza (`...742933793` vs `...825130993`).

Verdetto: H-fantasma confermata, variante multi-metamodello. Non due DClass nello stesso metamodello, ma due metamodelli quasi-duplicati (stesso `USER_185`), ciascuno con la sua `State`. Il memo `find(c => c.name === 'State')` itera i metamodelli e prende la `State` del primo (`...193`, la vecchia: name+isInitial); le feature nuove stanno sulla `State` del secondo (`...195`). H-forward-collection e H-troncamento cadono: la forward-collection di `...195` è completa e il getter la legge intera.

Causa prossima (picker): risoluzione della metaclasse per NOME invece che per ID; con duplicati pesca la State del metamodello sbagliato. Fix difensivo isolato a `VertexAuthoringPanel.tsx` (risolvere per id/pointer via `appliableToClasses`), da valutare rispetto allo schema `.ir` (oggi nomi).

Causa radice (bug separato, a monte): il progetto contiene due metamodelli duplicati (`USER_185`) con le istanze splittate fra le due `State`. Modello internamente incoerente. Il fix del picker cura il sintomo, non sana il modello. Da investigare come filone dedicato (candidati: confine di versione codice / migrazione VersionFixer all'apertura, re-import, doppio tab; il ciclo save+refresh su progetto fresh NON riproduce). Hard stop invariato sul picker finché non è decisa la strategia sulla duplicazione.
```

### Task 2: entry di log

- Se nel diff non committato di `docs/claude-code-log.md` esiste già l'entry della discovery picker: estenderne il campo **Note** con una riga: `Esito diagnostica console: H-fantasma confermata (due metamodelli quasi-duplicati nel progetto); §9 aggiunto al report.`
- Se l'entry non esiste: crearla ex novo secondo il formato standard del log (tipo `docs`), includendo la nota sopra.
- Se il diff del log contiene ANCHE entry di altre sessioni (es. classic node resize): applicare la danza del log già usata tre volte in questo repo: backup del file, accantonamento temporaneo del blocco altrui, add e commit del solo materiale di questo task, ri-append del blocco altrui, verifica byte-identica del ripristino rispetto al backup.

### Task 3: commit docs

- `git add docs/discovery/discovery_2026-07-23_ir_feature_picker_stale.md docs/claude-code-log.md`
- MAI `git add .` e MAI `git commit -a`.
- Ricontrollare `git status`: in staging devono esserci SOLO i due file sopra. Se compare altro: de-stageare e ripartire.
- Commit message: `docs: add console verdict (section 9) to ir feature picker discovery`
- Build NON richiesta (modifica solo Markdown): non eseguire `npm run build`.

### Task 4: ispezione e push

- `git branch --show-current`: atteso `alfonso-frontend-jjtl`. Se diverso: STOP e segnalare.
- `git fetch origin`
- `git log --oneline origin/alfonso-frontend-jjtl..HEAD` e riportare la lista INTEGRALE nel report finale. Attesi nell'ordine di una quindicina di commit (arco IR fino a `1bce6eb94`, `805fb4cb2`, i commit della sessione concorrente treeview, il commit di questo task). Se Alfonso ha già pushato in precedenza la lista sarà più corta: va bene, procedere comunque. Se `origin` non ha ancora il branch, la lista è l'intera storia locale.
- `git push` (oppure `git push -u origin alfonso-frontend-jjtl` se manca l'upstream).
- MAI `--force`, in nessuna variante. Se il push viene rifiutato (non fast-forward): STOP immediato, riportare l'errore testuale ad Alfonso, nessun `pull`/`rebase` autonomo.
- Verifica finale: `git status` deve riportare "up to date with 'origin/alfonso-frontend-jjtl'".

### HARD STOP finale

Riportare ad Alfonso: hash del commit docs, lista integrale dei commit pushati, stato residuo del working tree (il materiale della sessione concorrente e `.claude/*` devono risultare intatti e non committati).

## RIFERIMENTI

- Report da chiudere: `docs/discovery/discovery_2026-07-23_ir_feature_picker_stale.md`, sezioni 1-8 già committate in `805fb4cb2`.
- Contesto completo della RCA: `claude/sessione_2026-07-24.md` nel knowledge base del progetto (il §9 è nella sua appendice).
- Scope: toccare SOLO i due file docs elencati. Zero refactoring, zero modifiche al codice, zero rimozioni di materiale altrui dal working tree (fuori dalla danza del log, che è temporanea e reversibile).
