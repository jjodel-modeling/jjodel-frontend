# PROMPT — VER1: `save` legge la versione da un `__raw` stantio (corsia L1, PARALLELA)

Data: 2026-09-02. Branch `alfonso-frontend-jjtl`, cwd root del repo (`check:docs` gira da `frontend/`). Leggi `CLAUDE.md`, `docs/PROTOCOL.md` P9 (+ regola log-inbox `061453e65`), §21.3, RC-13 §6.4.

**Corsia parallela.** Altre sessioni lavorano sullo stesso albero. Vincoli, non negoziabili:

- **Commit per pathspec**, sempre. L'indice contiene staged di altre corsie (EGO1 e altro): non fare mai `git add -A`, non fare mai `git commit -a`.
- **Non toccare `docs/claude-code-log.md`.** La tua entry va in `docs/log-inbox/ver1.md`, formato P9 completo, `Causa` a lettera parentesizzata `(x)`, `Corregge` al sentinella `—` se non correggi una entry precedente. La sposta la §6.1 di chiusura batch.
- **Nessun rewrite di history**, nessun `--amend`, nessun `stash`. Il ripristino di un file tracciato si fa **solo** con `git checkout HEAD -- <path>`: mai da copie su disco, mai da backup in `/tmp` — tre incidenti in due batch sono nati esattamente lì.
- Se il tuo perimetro risulta già staged o modificato da altri, hard stop e dichiara il diff.

## Il difetto

`frontend/src/api/persistance/projects.ts`, `ProjectsApi.save` (`:114-141`). Il metodo copia `project.__raw` (`:114`), calcola `nextVersion` da `dProject.version` (`:124-126`), persiste, e scrive la nuova versione in Redux con `SetFieldAction` (`:141`).

Redux avanza. **L'oggetto del chiamante no**: `project.__raw` resta al valore che aveva. Due save espliciti consecutivi sullo stesso `LProject` producono `1.1` due volte invece di `1.1` e poi `1.2`.

C'è già un test **in albero** che asserisce il comportamento sbagliato com'è — scritto durante DIRTY1, con una nota che dice che diventerà rosso quando il difetto sarà corretto. Trovalo (cerca `1.1` / `version` nei test di `api/persistance/`), e **invertilo** in questa corsia: è la stessa correzione, non un cambio fuori perimetro. La nota va aggiornata, non cancellata.

## Cosa NON è chiesto

Non ridisegnare la versione come stato derivato, non spostare la fonte di verità, non toccare la regola ratificata del 2026-08-24 (`:102-107`: il bump è un `SetFieldAction`, e su un silent save non avviene — l'ha reso vero DIRTY1 in `4400a510f`). Il silent save resta senza bump e senza azzeramento del flag.

## Il lavoro

1. **Riproduci prima di correggere.** Sonda `frontend/scripts/smoke/_tmp_ver1_verify.ts` (cade in `.gitignore:66`, non committarla), contro il dev server. Due save espliciti sullo stesso `LProject`, leggendo la versione **dopo** ogni chiamata da tre punti che devono concordare: `project.version` (proxy), `project.__raw.version`, e lo store. Terzo save per confermare la progressione. Un silent save in mezzo come controllo: non deve muovere nulla.
2. **Censisci i lettori di `version`** prima di decidere il fix: chi legge `project.version` o `__raw.version` e in che ordine rispetto a `save` (`:399` e i lettori del dashboard sono i sospetti; `versionUtils.formatVersion` è il formatter). Dichiara i path con riga. Se un lettore **dipende** dal valore stantio, hard stop.
3. **Correggi nel punto minimo.** La direzione attesa è che `save` riallinei l'oggetto sorgente dopo il bump, così che una seconda chiamata legga il valore avanzato — non che il chiamante debba rileggere dallo store. Motiva la scelta contro l'alternativa (proxy che rilegge sempre da Redux) e di' quale hai scartato e perché.
4. **Test unitario**, accanto a quello esistente: progressione su tre save espliciti; silent save che non avanza; concordanza fra i tre punti di lettura. Ambiente `node`: `projects.ts` si importa doppiando i suoi import e stubbando il `window` che dereferenzia a modulo (`:453`) — l'idioma è già nel test DIRTY1, riusalo.
5. **Mutazioni**, almeno tre, tutte da vedere rosse: riallineamento rimosso; riallineamento fatto **anche** sul silent save; `getNextVersionNumber` sostituito con l'identità.

## Gate, da misurare e riportare

`tsc --noEmit` — baseline attesa **33** sull'output completo, **0** nei file toccati. `build` exit 0. `vitest` intera — atteso 0 falliti; i 9 file che non si raccolgono (`window is not defined` in import) sono pre-esistenti, riverificali su HEAD e dichiarali. `npm run check:docs` non è dovuto (non tocchi il log attivo).

## Referto

Before/after in tabella, misurato non letto, col numero di PASS/FAIL per corsa. Righe con `file:riga:colonna`. Censimento dei lettori. Mutazioni con esito. Gate. Cosa resta aperto.

## Fuori perimetro — registrare, non toccare

UNQ1-C6 (campo modello su `NodeProblem`) è la corsia gemella di questo batch: non toccare `problems/`. EGO1 staged. §A.1/§A.5 lettori, disallineamento chiavi canvas. Merito per Alfonso: §8 `get_children_idlist`, tense error text + metamodel shape, `2..*` multi-reference.
