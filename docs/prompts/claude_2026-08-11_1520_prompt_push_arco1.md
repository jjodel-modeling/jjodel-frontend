# Push dell'arco 1

**Nome del documento prompt**: 2026-08-11 15:20
**Repo**: `jjodel-frontend`
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: nessuna modifica. Zero commit, un solo push.
**Ambiente**: Claude Code sul Mac.
**Nessuna entry di log**: questo passo non tocca file, quindi non produce entry in
`docs/claude-code-log.md` e non ruota nulla. Non inventarne una.

---

## 0. Guard

```bash
git rev-parse --abbrev-ref HEAD
git log --oneline -1
git status --porcelain
```

| Controllo | Atteso |
|---|---|
| branch | `alfonso-frontend-jjtl` |
| HEAD | `54154fd4a docs: log the R-RAIL register audit and rotate the oldest entry` |
| working tree | vuoto |

Tolleranza dichiarata, per R-RAIL-27: `.claude/settings.local.json` non deve comparire, perché
sul Mac lo copre `~/.config/git/ignore`. Se compare, non sei sul Mac di Alfonso: fermati.

---

## 1. Pre-flight, prima di spingere

```bash
git fetch origin
git rev-list --left-right --count origin/alfonso-frontend-jjtl...HEAD
git diff --stat origin/alfonso-frontend-jjtl..HEAD
git show origin/alfonso-frontend-jjtl:docs/claude-code-log.md | grep -c '^## '
```

Attesi e regole:

1. **`--left-right --count` deve dare `0    10`.** Se il numero di sinistra è diverso da zero,
   qualcuno ha spinto sulla branch: **fermati** e riporta i commit remoti. Non fare merge, non
   fare rebase, non fare pull.
2. **`git diff --stat` deve elencare solo** file sotto `docs/` più
   `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss`. Qualunque altro path è un
   hard stop: vuol dire che nei dieci commit è finito qualcosa che non doveva esserci, e va
   visto prima di renderlo pubblico. Questo è l'unico controllo che conta davvero in questo
   passo.
3. **Il conteggio delle entry sulla versione remota del log** è una diagnostica, non un gate:
   serve solo a riconciliare un'anomalia. Riporta il numero e le date della prima e
   dell'ultima entry di quella versione:
   ```bash
   git show origin/alfonso-frontend-jjtl:docs/claude-code-log.md | grep '^## ' | sed -n '1p;$p'
   ```
   Da una lettura fatta via GitHub risultavano 38 entry ferme al 2026-07-21, che non torna con
   dieci soli commit di distacco. Se il comando conferma 38, la lettura via GitHub era giusta e
   c'è da capire come si sia formato quel divario; se dà un numero vicino a 20 con date di
   agosto, la lettura via GitHub era inaffidabile e il caso si chiude qui. **In nessuno dei due
   casi questo blocca il push**: riporta e prosegui.

---

## 2. Push

```bash
git push origin alfonso-frontend-jjtl
```

Nessun `--force`, nessun `--force-with-lease`, nessun `--tags`, nessun `-u`, nessun altro
refspec. Solo questa riga.

---

## 3. Verifica

```bash
git status -sb
git rev-list --left-right --count origin/alfonso-frontend-jjtl...HEAD
```

Atteso: nessun `ahead`, e `0    0`.

---

## 4. Cosa NON fare

- Nessun merge, rebase, pull, cherry-pick, tag, force.
- Non toccare nessun file. Il working tree resta vuoto prima e dopo.
- Non scrivere entry di log, non ruotare, non toccare `docs/`.
- Non aprire pull request.

---

## 5. Definition of done

- I dieci commit sono su `origin/alfonso-frontend-jjtl`.
- `git status -sb` non riporta `ahead`.
- Working tree vuoto.

Riporta in chat: l'esito del `--left-right --count` prima e dopo; l'elenco dei path toccati dai
dieci commit come lo dà `git diff --stat`; il numero di entry e le due date della versione
remota del log rilevati al punto 1.3.
