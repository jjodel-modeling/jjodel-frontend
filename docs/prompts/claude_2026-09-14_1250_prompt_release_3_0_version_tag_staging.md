# Release 3.0: versione, tag e merge in `staging`

> **Nome del documento prompt**: 2026-09-14 12:50

Corsia di rilascio. Repo `jjodel-frontend`, branch `alfonso-frontend-jjtl`. Leggi `CLAUDE.md` e
`docs/claude-code-log.md` prima di iniziare. Questo prompt prepara ciò che domani, 15 settembre
2026, diventa Jjodel 3.0 su `app.jjodel.io`. Non fa il flip dei sottodomini, che è manuale e di
Alfonso.

## Dove si lavora: il worktree `~/jjodel-release`

Il checkout principale `~/jjodel` sta su `validation-skeleton` con `ValidationRulesModal.tsx` e
`.scss` modificati da un'altra corsia. Quei due file non esistono sul tronco, quindi git rifiuta lo
switch di ramo finché restano sporchi. Per non toccare la corsia altrui, questa corsia lavora in
un **secondo worktree** già creato da Alfonso:

```
~/jjodel-release    →  worktree di ~/jjodel sul branch alfonso-frontend-jjtl
```

Tutti i comandi di questo prompt si eseguono lì. Non aprire, non modificare, non committare nulla
in `~/jjodel`. `node_modules` non c'è nel worktree: prima del typecheck fare
`ln -s ~/jjodel/frontend/node_modules ~/jjodel-release/frontend/node_modules`; se il build si
lamenta del symlink, rimuoverlo e fare `npm ci` in `~/jjodel-release/frontend`.

## Contesto misurato il 14/9, conteggi rimisurati il 15/9 (non rifare l'analisi)

- `beta.jjodel.io` è lo slot `staging` di Azure (`test-jjodel`), costruito dal branch `staging`
  dal workflow `.github/workflows/staging_test-jjodel(staging).yml` a ogni push. L'ultimo merge in
  `staging` è la PR #143 del 6/9 da `alfonso-frontend-jjtl`.
- Rispetto a `origin/staging`, `alfonso-frontend-jjtl` ha **13 commit che toccano `frontend/`**
  (rimisurati il 15/9 dopo l'atterraggio della corsia A e del cherry-pick C/G/B2/D; il numero di
  questo elenco non si asserisce, si rimisura all'inizio del giro, vedi il gate d'ingresso):
  `96f718450` (docs sotto `frontend/src/jjtl/`), poi i dodici di codice `9b9730ed4`, `11f42aada`,
  `67032e14a` (i tre fix JjScript del 12/9), `df11ed769`, `1efe5c3ec`, `fa3139a37`, `ce9e78d64`,
  `e82831264` (corsia A), `adb9bfa3f`, `b934d5124`, `fccaeb0e0`, `d6dbf7bfe` (corsie C, G, B2, D).
  Entrano nella 3.0: è la decisione di Alfonso, non da rimettere in discussione qui.
- Il locale `alfonso-frontend-jjtl` è avanti di **41** commit su `origin` e **indietro di 1**:
  `27a0a436e` (README, «JJodel» → «Jjodel») fatto su GitHub il 10/9. Anche questi due numeri si
  rimisurano: l'invariante è «indietro di 1, e quell'uno è `27a0a436e`», non il numero in avanti.
- `frontend/package.json` dice `"version": "3.0.0-beta"`; `vite.config.ts` lo inietta come
  `__APP_VERSION__` e il footer lo mostra come `v3.0.0-beta (<build>)` (`frontend/src/version.ts`).
  `package-lock.json` ripete la stringa due volte (root e `packages[""]`).
- `CHANGELOG.md` di root ha una sola sezione `## [Unreleased]`, ferma a febbraio 2026.
- Nessun tag esiste nel repo.

## Gate d'ingresso (HARD STOP se fallisce)

Nel worktree, `git status --porcelain` deve essere **vuoto** e `git rev-parse --abbrev-ref HEAD`
deve dire `alfonso-frontend-jjtl`. Poi `git fetch origin`. Se `git rev-list --count
alfonso-frontend-jjtl..origin/alfonso-frontend-jjtl` è diverso da `1`, o il commit in più non è
`27a0a436e`, HARD STOP e riferisci: qualcuno ha pushato altro.

Poi si **misurano**, e si riportano, i tre numeri su cui poggiano i passi seguenti, invece di
riprendere quelli scritti qui:

```
AHEAD=$(git rev-list --count origin/alfonso-frontend-jjtl..HEAD)
FRONTEND=$(git rev-list --count origin/staging..HEAD -- frontend/)
git rev-list --reverse origin/staging..HEAD -- frontend/    # l'elenco per il body della PR
```

`AHEAD` e `FRONTEND` valgono per questo giro e servono al confronto prima/dopo del passo 1, non
come soglie da confermare. Un valore diverso da quello del contesto non è un errore: significa che
altre corsie hanno consegnato, ed è il numero misurato a fare fede.

## Passo 1, allineamento con origin

`git rebase origin/alfonso-frontend-jjtl`. Il commit remoto tocca solo `README.md`: un conflitto è
improbabile; se compare, HARD STOP senza risolverlo. Dopo il rebase, il gate è un confronto con la
misura presa al gate d'ingresso, non un letterale:

- `git rev-list --count origin/alfonso-frontend-jjtl..HEAD` deve valere di nuovo `AHEAD`, lo stesso
  numero di prima: il rebase riscrive i commit, non ne aggiunge né ne toglie;
- `git merge-base --is-ancestor origin/alfonso-frontend-jjtl HEAD` deve uscire 0, cioè il commit del
  README è ora in cronologia;
- `git rev-list --count origin/staging..HEAD -- frontend/` deve valere di nuovo `FRONTEND`.

Un solo numero fuori posto è un HARD STOP.

## Passo 2, commit `chore(release): version 3.0.0`

In `frontend/`: `npm version 3.0.0 --no-git-tag-version`. Verificare che siano cambiati **solo**
`frontend/package.json` e `frontend/package-lock.json` e che `grep -c '3.0.0-beta'` sia `0` su
entrambi. Commit con pathspec esplicito su quei due file. Non toccare `docs/decisions.md:926` né gli
altri riferimenti storici a `3.0.0-beta` sotto `docs/`: sono cronaca, non configurazione.

## Passo 3, commit `docs(changelog): 3.0.0 section`

Corsia docs separata dal codice (RC-13). In `CHANGELOG.md` di root:

- l'intestazione `## [Unreleased]` esistente diventa `## [3.0.0] - 2026-09-15`;
- subito sotto l'intestazione, prima del contenuto esistente, una riga:
  `The full list of user-facing changes is at https://docs.jjodel.io/whats-new/. The entries below are partial.`
- sopra di essa, una nuova sezione vuota `## [Unreleased]`.

Inglese, nessun trattino lungo. Nessun'altra modifica al file. Commit con pathspec su `CHANGELOG.md`.

## Passo 4, verifica

Da `frontend/`: `npm run typecheck` e `npm run build`, entrambi verdi. Poi
`grep -rl 'v3.0.0 (' dist/assets/*.js | head -1` deve trovare almeno un bundle, e
`grep -rl '3.0.0-beta' dist/assets/*.js` deve trovarne zero. Non committare `dist/`.

## Passo 5, push e pull request (poi HARD STOP)

`git push origin alfonso-frontend-jjtl`. Poi la PR verso `staging`: se `gh` è disponibile,
`gh pr create --base staging --head alfonso-frontend-jjtl --title "Release 3.0.0" --body-file <file>`
con un body breve che elenca i commit di codice misurati al gate d'ingresso e il bump di versione;
altrimenti stampa l'URL
`https://github.com/jjodel-modeling/jjodel-frontend/compare/staging...alfonso-frontend-jjtl`
e il body, e Alfonso apre la PR a mano.

**HARD STOP qui.** Il merge della PR lo fa Alfonso: il push su `staging` fa partire la build Azure
e lo slot `beta.jjodel.io` si aggiorna. Alfonso verifica su beta (footer `v3.0.0`, hard refresh) e
dà il GO.

## Passo 6, solo su GO esplicito: il tag

`git tag -a v3.0.0 -m "Jjodel 3.0.0" <sha del commit chore(release)>` e `git push origin v3.0.0`.
Il tag sta sul commit di versione di `alfonso-frontend-jjtl`, che il merge porta in `staging`.

## Log

Corsie parallele attive: il log attivo `docs/claude-code-log.md` non si tocca (P9). L'entry va in
`docs/log-inbox/release-3-0.md`, formato standard, un'entry per questo prompt con l'esito dei
passi 1-5 e, dopo il GO, una riga aggiunta per il tag. Commit docs separato.

## Fuori perimetro

`validation-skeleton`, `origin/damdev`, il popover senza `max-height`, `Info.tsx:647`, qualunque
modifica sotto `frontend/src`. Se qualcosa in questo prompt contraddice `CLAUDE.md`, fermati e
segnalalo.
