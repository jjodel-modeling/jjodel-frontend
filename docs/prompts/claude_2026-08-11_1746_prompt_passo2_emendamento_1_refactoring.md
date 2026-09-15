# Passo 2, emendamento 1: il kind `refactoring`, e una correzione a R-RAIL-30

**Nome del documento prompt**: 2026-08-11 17:46
**Repo**: `jjodel-frontend`
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: emendamento al prompt `2026-08-11 17:34`. Due commit nuovi prima di C.
**Ambiente**: Claude Code sul Mac.

**Stato di partenza**: hard stop 2 sollevato correttamente. HEAD `30f5e1855`, working tree con
due file modificati e non committati, `_form-system.scss` e
`frontend/src/components/editors/views/nestedView.scss`. **Non annullare quel lavoro.**

Valgono i due errata di §0-bis del prompt del 17:34: glob sempre quotati, alternanze con `-E` e
barre nude, ogni ricerca con `command grep`.

---

## 1. La decisione: strada 1

`refactoring` prende un alias verso `container`, come `transformation`. La ragione non è di
comodità: R-RAIL-30 dice che **la mappatura vive nei file di token**. La strada 2 la
sposterebbe dentro il consumatore, che è esattamente il modo in cui le due palette avevano
cominciato a divergere. La strada 3 lascia un esadecimale in un file appena tokenizzato.

Il fatto che `refactoring` sia `available: false` e `comingSoon: true` non cambia nulla: il
badge si vede lo stesso nel menu, quindi consuma la scala come gli altri.

**Autorizzazione esplicita**: il §5 del prompt del 17:34 ti vieta di toccare i due file di
token. Questo emendamento solleva quel divieto, e **solo per questo**: una coppia di alias in
ciascuno dei due file. Nessuna coppia canonica nuova, nessun altro valore toccato, nessun altro
nome aggiunto.

---

## 2. Commit B2: l'alias

In `_colors-light.scss` e in `_colors-dark.scss`, nel blocco degli alias, accanto a
`transformation`, ricalcando la forma delle righe vicine:

```scss
--color-entity-refactoring-bg: var(--color-entity-container-bg);
--color-entity-refactoring-fg: var(--color-entity-container-fg);
```

Identiche nei due file: puntano ai nomi canonici, non ai valori.

Conteggi attesi dopo questo commit, da verificare, non da assumere: **36 variabili per file**,
18 canoniche con valore letterale e 18 alias con `var()`, nomi identici nei due file
verificati con `diff` degli elenchi. Diciassette kind su nove coppie.

```bash
git add frontend/src/styles/tokens/_colors-light.scss frontend/src/styles/tokens/_colors-dark.scss
git commit -m "feat: add the refactoring entity alias"
```

---

## 3. Commit B3: togliere il numerale da R-RAIL-30

La voce R-RAIL-30, committata un'ora fa in `f8a680db9`, dice «Sedici kind mappano su nove
coppie» e, più avanti, «su sedici kind e due temi». Da questo emendamento i kind sono
diciassette, quindi il numerale è falso. Ed è falso per la ragione che la voce stessa dichiara:
la mappatura vive nei file di token e non si ricopia a registro, mentre un conteggio a registro
è una copia della mappatura, che infatti è scaduta in un'ora.

**Autorizzazione esplicita**: il divieto di riscrivere voci di `docs/decisions.md` è un vincolo
che ho posto io nei prompt, non una regola di `CLAUDE.md`. Lo sollevo qui, per questa sola
voce, per rimuovere due numerali. Il resto del testo non si tocca. Se in `CLAUDE.md` esiste una
regola che vieta comunque l'edit di una voce di registro già committata, **fermati e segnala il
conflitto**: in quel caso la correzione passerà da una voce nuova, non da un edit.

Le due sostituzioni, puntuali:

- `Sedici kind mappano su **nove coppie**` diventa `I kind mappano su **nove coppie**`
- `Contrasto minimo misurato 5.96, su sedici kind e due temi.` diventa
  `Contrasto minimo misurato 5.96 su tutte le coppie e su entrambi i temi.`

```bash
git add docs/decisions.md
git commit -m "docs: drop the stale kind count from R-RAIL-30"
```

---

## 4. Poi il commit C, come da prompt del 17:34

Il lavoro già nel working tree resta e va committato lì. Aggiungi soltanto la conversione di
`refactoring` in `documentTypes.ts`, che ora ha il suo token.

**Il perimetro allargato a `nestedView.scss:3710` resta.** La tua ragione regge: un esadecimale
entity sulla riga successiva, dentro il file appena toccato, avrebbe violato la definition of
done. Non ripristinarlo. Va dichiarato, non nascosto: entra nel campo
`**Out-of-scope changes**` dell'entry di log, che esiste per questo.

Il `git add` di §3.1 del prompt del 17:34 porta un path sbagliato per `nestedView.scss`. Usa
quello reale, `frontend/src/components/editors/views/nestedView.scss`, che è quello che hai già
trovato tu.

---

## 5. Da mettere agli atti, senza agire

**L'override del badge `view` dentro il rail.** `properties-with-tree-view.scss:373-376`
sovrascrive `.jj-type-badge--view` con `$pc-accent-soft` e `$pc-accent-strong` a specificità
maggiore, quindi dentro il rail il badge `view` non consuma la scala entity e la tokenizzazione
di `nestedView.scss` agisce solo fuori dal rail. Non toccare quel file: resta intoccabile.

Apri una voce in `docs/TECH-DEBT.md` **nel passo successivo, non ora**, con questo contenuto:
una superficie che mostra un badge entity ma non consuma la scala entity, dentro il foglio del
rail, che è perimetro dell'arco 2. Priorità media.

---

## 6. Cosa cambia nell'entry di log del passo 2

Restano tutti i campi come da §3.5 del prompt del 17:34. Si aggiungono:

- `**Out-of-scope changes**`: la conversione di `nestedView.scss:3710`, il modificatore
  `--viewpoint`, non nominato dal prompt, convertito per non lasciare un esadecimale entity nel
  file appena toccato.
- Nelle `**Notes**`, oltre alle cinque già previste, altre tre:
  6. `refactoring` scoperto in `documentTypes.ts` e assorbito dalla famiglia contenitori con un
     alias; kind da sedici a diciassette, coppie canoniche ferme a nove.
  7. Il numerale dei kind rimosso da R-RAIL-30, perché un conteggio a registro duplica una
     mappatura che vive altrove ed è scaduto in un'ora.
  8. Il prompt del 17:34 dava un path sbagliato per `nestedView.scss`; il guard di §2 ha
     funzionato ed è stato usato il path reale.

Il conteggio della rotazione non cambia: attivo 20, archivio 737, quattordicesimo lotto.

---

## 7. Condizioni di hard stop

1. `CLAUDE.md` contiene una regola che vieta di editare una voce già committata di
   `docs/decisions.md`: fermati e segnala, non eseguire il commit B3.
2. I conteggi di §2 non tornano dopo il commit B2.
3. Un altro kind di `documentTypes.ts`, oltre a `refactoring`, risulta senza token.
4. `typecheck` o `build` rossi.
5. Restano le condizioni 1, 2, 3 dello stop condizionale di §3.2 del prompt del 17:34.

---

## 8. Definition of done di questo emendamento

- Commit B2 e B3 fatti, in quest'ordine, prima di C.
- 36 variabili per file, 18 e 18, nomi identici nei due file.
- R-RAIL-30 senza numerali, resto del testo invariato.
- Il lavoro già nel working tree committato in C, col path reale di `nestedView.scss`.
- Niente pushato.

Riporta: sha di B2 e B3, i conteggi verificati, e se il commit B3 è stato eseguito o fermato dal
conflitto di §7.1.
