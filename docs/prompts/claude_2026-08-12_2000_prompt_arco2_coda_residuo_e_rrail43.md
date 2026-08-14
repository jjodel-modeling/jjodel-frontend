# Prompt Claude Code — arco 2, coda: il residuo del working tree, R-RAIL-43, e due correzioni portate avanti

**Data**: 2026-08-12 20:00
**Tipo**: docs
**Perimetro**: due file tracciati, `docs/decisions.md` e `docs/claude-code-log.md`, più la
rimozione di un file non tracciato. Fuori dalla critical zone.
**Dipende da**: `e88fca7df`.
**Commit**: uno. La rimozione del file non tracciato non produce diff e non entra nello staging.

---

## COSA

### A. Cancellare `arco2-cowork-2026-08-12.bundle`

Non va in `.gitignore`, va cancellato. È un artefatto di trasporto già speso, e verificato tale
prima di dirlo:

```
git bundle list-heads arco2-cowork-2026-08-12.bundle
  2146725c35f0b78db3be4851e09eae25966d933c refs/heads/alfonso-frontend-jjtl
git bundle verify arco2-cowork-2026-08-12.bundle
  is okay; requires 7998de97…
git merge-base --is-ancestor 2146725c3 HEAD   → 0
```

Una testa sola, ed è il HEAD di prima del commit `e88fca7df`, raggiungibile da HEAD. Il bundle non
contiene un solo oggetto che non sia già nel branch. Gitignorarlo istituzionalizzerebbe come
convenzione un trasporto una tantum.

**Rieseguire le tre verifiche prima di cancellare.** Se nel frattempo il file fosse stato
sovrascritto da un bundle diverso, l'evidenza qui sopra è scaduta e la cancellazione perderebbe
lavoro che non sta altrove.

`.claude/settings.local.json` non va toccato: sulla tua macchina è già ignorato da
`~/.config/git/ignore:1`. Vedi la nota (2) più sotto per perché il prompt precedente diceva il
contrario.

### B. `docs/decisions.md`, nuova voce R-RAIL-43

Numero verificato libero a registro prima di scriverlo: l'ultima occupata è R-RAIL-42.

Contenuto della regola, da rendere nella forma a una riga usata dal registro:

> **R-RAIL-43** — Un rinvio che ripete la motivazione di un rinvio precedente la rimette alla
> prova, oppure la cita come ereditata e non verificata. Una stima di costo non provata non è una
> misura, e propagandola la fa degradare.

Motivazione da riportare nella voce, breve: i tre paragrafi mancanti del preambolo dell'archivio
sono stati rinviati due volte con la stessa motivazione, «ricostruirli è archeologia su git».
Il ventunesimo lotto non l'ha riderivata, l'ha copiata dal ventesimo, e nel copiarla ha anche
corrotto il conteggio, da tre paragrafi dovuti a quattro. Quando la motivazione è stata messa alla
prova (commit `e88fca7df`) è caduta in pieno: sono bastati due fatti già scritti nei due file, e
zero comandi git. La firma di un'affermazione ereditata è proprio questa, che degrada mentre si
propaga.

Rapporto con le regole vicine, da dichiarare nella voce e non da lasciare implicito: R-RAIL-28
copre le asserzioni di assenza e di presenza, R-RAIL-36 il caso in cui si misura l'elemento
sbagliato. R-RAIL-43 copre il terzo caso, la stima mai eseguita, e ha in più la parte sulla
propagazione, che le altre due non hanno.

### C. Estendere R-RAIL-27 di una riga

R-RAIL-27 dice già che le scritture git dal bridge Cowork non sono sicure. Aggiungere che **anche
le letture mentono, in un punto preciso**: `git status` eseguito dal bridge non vede
`core.excludesFile`, perché il bridge monta la cartella del repo ma non la home dell'utente, e
`HOME` punta dentro la sessione. Misurato: dal bridge `HOME=/sessions/<id>`,
`git config --get core.excludesFile` è vuoto, `~/.config/git/ignore` non esiste, e
`git check-ignore -v .claude/settings.local.json` esce diverso da zero. Sulla macchina di Alfonso
lo stesso file è ignorato. **Conseguenza operativa: un `git status` dal bridge sovrastima i file
non tracciati, sempre.** Un elenco di residuo del working tree prodotto da lì va confrontato con
quello locale prima di diventare una richiesta di decisione.

### D. Nell'entry di log, portare avanti due correzioni

La nota (7) dell'entry di `e88fca7df` contiene due affermazioni che oggi non reggono. Il log è
append-only e non si emenda: le correzioni vanno nell'entry di **questo** task, con il rimando
esplicito.

1. **`_to_delete/` non c'è più**, ed era presente quando quella nota è stata scritta. Nessun
   comando eseguito l'ha rimossa e hook non ce ne sono. C'è un precedente registrato per la stessa
   cartella, `docs/discovery/discovery_2026-08-10_triage_residuo_serie_u.md:155-157`. **Ipotesi, da
   scrivere come ipotesi e non come causa accertata**: la cartella `_to_delete/` è la convenzione
   che il bridge Cowork impone quando gli si chiede di cancellare (non può eseguire `rm` sui file
   montati, quindi sposta lì), e le due sparizioni sono entrambe di cartelle create in quel modo.
   Se il bridge le raccoglie, la convenzione cancella davvero, con ritardo. Non verificato, e non
   va verificato in questo passo.
2. **`.claude/settings.local.json` non era non tracciato.** L'errore è nel prompt delle 19:00, ed
   è dello stesso ambiente descritto al punto C: l'elenco del residuo veniva da un `git status`
   eseguito dal bridge, che non poteva vedere il gitignore globale. Vale la pena scriverlo perché
   la causa è più utile dell'errore, e perché è la seconda volta in un giorno che una misura viene
   riportata senza dichiarare dove è stata presa.

---

## Verifiche

1. Le tre verifiche del bundle rieseguite, esito riportato per esteso.
2. `command grep -c 'R-RAIL-43' docs/decisions.md` deve dare almeno 1 dopo, 0 prima. Se dà
   diverso da 0 prima, **STOP**: il numero è occupato.
3. `npm run check:docs` verde.
4. Nessuna build: non tocchi codice. `npm run build` non serve e non va eseguito.
5. `git status --short` dopo il commit: deve restare la sola voce
   `?? .claude/settings.local.json` sul bridge, e **nessuna voce** sulla tua macchina.

## Hard stop

1. **Se `git bundle list-heads` mostra una testa diversa da `2146725c3`**, o se
   `merge-base --is-ancestor` esce diverso da zero, STOP e non cancellare.
2. **Se R-RAIL-43 risulta già occupato**, STOP.
3. **Se `_to_delete/` è ricomparsa**, riportalo e non toccarla: sarebbe un dato nuovo
   sull'ipotesi del punto D1.

## Cosa questo passo NON fa

- **Non emenda `e88fca7df`**, né con `--amend` né altrimenti. È non pushato e si potrebbe, ma
  l'append-only del log vale sul contenuto e non sullo stato del remoto: emendare produrrebbe una
  storia più ordinata di quello che è successo, che è esattamente ciò che il ventesimo lotto ha
  rifiutato di fare con la rotazione. Le correzioni vanno avanti, mai indietro.
- **Non aggiunge `.claude/settings.local.json` al `.gitignore` del repo.** Sarebbe una riga sola e
  renderebbe l'esclusione portabile ad altre macchine, ma è una convenzione di repo e la chiama
  Alfonso, non questo passo.
- **Non ruota il log** e **non fa push**.

## Log

Entry in `docs/claude-code-log.md`, formato §21.2.
`Corregge`: `2026-08-12 19:00`. `Causa`: `(c)`. `Regressions`: `no`.
`Out-of-scope changes`: `no`. `Layer Impact Report`: `not-required`.
`Smoke visivo`: `non applicabile`.

Nelle note: le due correzioni del punto D con il rimando esplicito all'entry di `e88fca7df`,
l'esito delle verifiche sul bundle, e la misura dell'ambiente al punto C con i quattro valori
rilevati.
