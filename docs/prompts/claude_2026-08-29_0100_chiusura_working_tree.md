# Prompt: chiusura del working tree (enum picker, StatusBar, push)

**Data**: 2026-08-29 01:00
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: chore / fix
**Effort**: medium (nessun file della critical-zone)

## Contesto

Alle 00:50 del 29/8 il working tree aveva 43 voci in `git status`. L'altra sessione ha
poi committato il grosso (`71e27af72` .. `32e9b9ed9`: backlog dei prompt, checkpoint di
sessione, analisi di attribuzione, stringhe inglesi, gruppo DISPLAY). Restano sette file
modificati, mai committati, che appartengono a tre lavori distinti:

**A. Enum picker portalato su body** (entry di log gia' committata in HEAD,
`## 2026-08-28 — fix(editor-v2): il picker degli enum esce dal nodo, portalato su body`,
esito ✅, smoke 16/16). Il codice non e' mai stato committato:

- `frontend/src/components/editor-v2/components/InlineEnumSelect.tsx` (+118/-)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (stato `openEnumRect`)
- `frontend/src/components/editor-v2/panels/M1PropertiesPanel.tsx` (idem)
- `frontend/src/components/editor-v2/nodes/instanceNode.scss`, SOLO il primo hunk
  (commento sul containing block che nomina il portale)

**B. Hunk orfano in `instanceNode.scss`**: secondo hunk, regola
`.mm-object__header .mm-node__input` (colore del rename nell'header, caret e `::selection`
in cyan). Nessuna entry di log lo menziona. Provenienza da accertare.

**C. StatusBar e featureSignature** (file datati 24/8, nessuna entry di log):

- `frontend/src/components/StatusBar.tsx`: `conforms to <nome>` con pallino verde
  (`app-statusbar__conforms`, `app-statusbar__conforms-dot`)
- `frontend/src/components/StatusBar.scss`: le due classi sopra
- `frontend/src/common/featureSignature.ts`: separatore da `: ${typeName}` a ` ${typeName}`

Inoltre HEAD e' 8 commit avanti a `origin/alfonso-frontend-jjtl`: nessun push da `758aded1b`.

## Vincoli

- Leggi `CLAUDE.md` e `docs/PROTOCOL.md` prima di iniziare. Log attivo newest-first per
  giorno, entry in testa (R-RAIL-45).
- Un'altra sessione Claude Code puo' essere ancora attiva sullo stesso tree: commit SOLO per
  pathspec (`git commit -- <path>`), mai `git add .`, mai `git add -A`, mai `git stash`.
- Non toccare nessun file oltre i sette elencati e `docs/claude-code-log.md`.
- Nessun refactoring, nessuna rinomina.

## Fase 0: gate d'ingresso

```
git status --porcelain
git log --oneline -3
git rev-list --count origin/alfonso-frontend-jjtl..HEAD
```

Atteso: esattamente i sette file sopra come ` M`, nessun untracked, nessuno staged.
Se compare qualcosa d'altro, o se uno dei sette manca (l'altra sessione l'ha committato
nel frattempo), FERMATI e riporta il `git status` completo: il perimetro va ridiscusso.

## Fase 1: commit A (enum picker)

1. Rileggi l'entry di log in HEAD (`grep -n 'picker degli enum' docs/claude-code-log.md`)
   e confronta i file toccati dichiarati con `git diff --stat`. Devono coincidere sui
   quattro file di A.
2. `git diff frontend/src/components/editor-v2/nodes/instanceNode.scss` ha DUE hunk.
   Committa solo il primo (il commento). Usa `git add -p` sul file e scarta il secondo
   hunk, oppure `git apply --cached` con la patch ridotta al primo hunk. Verifica con
   `git diff --cached -- frontend/src/components/editor-v2/nodes/instanceNode.scss` che lo
   staged contenga solo il commento.
3. Gate: `npm run typecheck` (33 errori = baseline, diff identico), `npx vitest run`
   (baseline nota: 9 file rotti all'import), `npm run build` exit 0.
4. Commit per pathspec dei quattro file (per `instanceNode.scss` conta lo staged parziale):

```
git add frontend/src/components/editor-v2/components/InlineEnumSelect.tsx \
        frontend/src/components/editor-v2/nodes/ObjectNode.tsx \
        frontend/src/components/editor-v2/panels/M1PropertiesPanel.tsx
git commit -m "fix(editor-v2): portal the enum picker onto body so the node no longer clips it"
```

Nessuna entry di log nuova: l'entry esiste gia'. Aggiungi in coda alla sua riga
`**Notes**` la frase: `Codice committato in <sha> il 2026-08-29; il log era stato
committato prima del codice.` (la riga va emendata? No: e' un'aggiunta in coda a una nota,
non una correzione dell'esito. Se CLAUDE.md §log lo vieta, apri invece una entry `chore`
in testa che dice la stessa cosa.)

## HARD STOP 1

Riporta ad Alfonso i due diff residui per intero, senza interpretarli:

```
git diff frontend/src/components/editor-v2/nodes/instanceNode.scss
git diff frontend/src/components/StatusBar.tsx frontend/src/components/StatusBar.scss \
         frontend/src/common/featureSignature.ts
```

e per ciascuno dei due gruppi (B e C) chiedi una sola cosa: **tenere e committare**,
oppure **scartare** (`git checkout -- <path>`, mai `git stash`). Non procedere senza
risposta esplicita per entrambi.

## Fase 2: B e C, secondo la risposta

**Se B si tiene**: verifica a schermo (Alfonso, http://localhost:3000, hard refresh) che il
rename inline nell'header del nodo istanza sia leggibile in light e in dark, poi
`git commit -- frontend/src/components/editor-v2/nodes/instanceNode.scss` con messaggio
`fix(editor-v2): the inline rename in the instance node header inherits the name colour`.
Entry di log in testa, tipo fix, con la nota che il diff era orfano dal cantiere instance-node.

**Se C si tiene**: prima cerca chi usa `featureSignature` (`grep -rn featureSignature
frontend/src`) e riporta se il cambio di separatore altera test o snapshot; esegui
`npx vitest run` mirato su quei file. Poi un commit per i tre file, messaggio
`feat(statusbar): show the conforms-to target with a status dot`. Entry di log in testa.
Se `featureSignature.ts` risulta indipendente dalla StatusBar, due commit separati.

**Se si scarta**: `git checkout -- <path>` per i file del gruppo, poi `git status` pulito
per quel gruppo. Nessuna entry di log per uno scarto, ma una riga nelle Note dell'entry
di chiusura (sotto).

## Fase 3: push e chiusura

1. `git status --porcelain` deve essere vuoto (o contenere solo file che l'altra sessione
   ha toccato NEL FRATTEMPO: in quel caso elencali e non toccarli).
2. `git push origin alfonso-frontend-jjtl`. Se il push viene rifiutato per non-fast-forward,
   FERMATI e riporta: non fare `pull --rebase` da solo con un'altra sessione attiva.
3. `git rev-list --count origin/alfonso-frontend-jjtl..HEAD` deve dare 0.
4. `npm run check:docs` deve restare 3/3.
5. Entry di log in testa, tipo chore, `chore: close the working tree, push 8+ commits`,
   con: gli sha dei commit fatti, cosa e' stato scartato (se qualcosa), il conteggio del push.
   Commit per pathspec di `docs/claude-code-log.md` soltanto.

## Cosa NON fare

- Non pulire gli stash (4, tutti vecchi: sono di Alfonso).
- Non toccare `docs/analysis/`, `docs/prompts/`, `docs/sessioni/`: gia' committati.
- Non rigenerare `_tmp_enum_verify.ts` ne' gli screenshot in `scripts/smoke/`.
- Non fare `git pull`, `git rebase`, `git merge`.
