# Task 1.3 delta: esclusione del pin da `canonicalize`

> **Non è una slice nuova.** Il task 1.3 risulta **già implementato e non committato** nel
> working tree (`ir/metaclassPin.ts` e il suo test untracked, `irTypes.ts` e i tre pannelli
> modificati). Questo prompt completa quell'implementazione con la parte che il prompt v1
> ometteva, e **non** rifà quello che è già fatto.
>
> **Non reimplementare il pin. Non ricreare `metaclassPin.ts`. Non riscrivere i memo
> `featureInfo`.** Se qualcosa in questo prompt sembra chiederti di rifare lavoro già presente
> nel tree, fermati e segnala invece di eseguirlo.

Leggi `CLAUDE.md` prima di iniziare.

## Perché esiste questo delta

`isMigratedDefaultView` (`irDefaults.ts:128-145`, riancorare per nome) decide se una view delega
al rendering nativo confrontando `irHash(canonicalize(ir meno migratedFrom))` con l'hash di
`defaultObjectViewIR()`. Il pin scritto dentro l'IR **ne cambia l'hash**: la view smette di
delegare e passa all'interprete IR. Su un progetto migrato riguarda quasi tutto il parco view, e
si manifesta come un cambio di resa diffuso senza causa apparente.

`irDefaults.ts` **non compare fra i file modificati**, quindi allo stato attuale del tree la
trappola è aperta.

**Ratificato (R-F, 2026-08-05,
`claude/ratifiche_2026-08-05_3_canonicalize_e_risalita_parent.md`)**: `canonicalize` esclude il
campo del pin dal confronto, esattamente come già fa con `migratedFrom`. Il pin è metadato di
authoring e il resolver non lo legge: farlo entrare nell'identità semantica di un IR è un errore
di categoria.

## Fase 1: ricognizione read-only, con report prima di scrivere

Non è una discovery formale e non produce un file in `docs/discovery/`: è una lettura di quattro
punti, da riportare in chat **prima** di toccare qualunque file.

1. **Il nome del campo** effettivamente introdotto in `irTypes.ts`, e se è dichiarato su
   un'interfaccia base condivisa o tre volte.
2. **La forma del campo**: mappa da nome a pointer, come ratificato, o array parallelo a
   `metaclasses`. Se è un array parallelo, **fermati**: è una divergenza dalla ratifica R-1 e si
   decide in chat, non qui.
3. **Il sito di scrittura**: il pin viene scritto nello stesso `patch` che scrive `metaclasses`,
   sempre, o esistono percorsi che scrivono l'uno senza l'altro.
4. **L'entry in `docs/claude-code-log.md`** relativa a questo lavoro, per recuperare l'esito
   della ricerca di collisione sul nome. Il file porta due entry di due sessioni diverse: leggile
   entrambe.
5. **La taglia dei diff nei tre pannelli.** `git diff --stat` misura 58, 62 e 85 righe su
   `EdgeAuthoringPanel`, `RowAuthoringPanel` e `VertexAuthoringPanel`, con **47 cancellazioni in
   tutto** il tree. Una sostituzione della sola risoluzione del pin dovrebbe essere quasi
   bilanciata, quindi la crescita va spiegata. Verifica in particolare che la catena a tre
   gradini sia **importata** da `metaclassPin.ts` e non reimplementata inline in ciascun
   pannello: sarebbe la quarta triplicazione della stessa logica, ed è precisamente ciò che il
   modulo puro esiste per impedire. Se è inlineata, **fermati e segnala**: si decide in chat se
   rientrare o accettare e rimediare dopo.

   Verifica anche che il memo `featureInfo` non sia stato toccato oltre alla sostituzione della
   risoluzione del pin, e riporta cosa spiega le righe in più (sito di scrittura congiunta dentro
   il pannello, wiring del gradino 2, altro).

## Fase 2: censimento, con hard stop

`grep` sui consumatori di `irHash` e di `canonicalize` in tutto `frontend/src`.

La conseguenza dell'esclusione è che **due IR che differiscono solo per il pin producono lo
stesso hash**. È voluto per `isMigratedDefaultView`, ma significa che nessuna memoizzazione di
livello authoring può essere keyata su `irHash`.

Se trovi un consumatore di livello authoring: **fermati e segnala**. Non aggirarlo, non
adattarlo. Si decide in chat.

## Fase 3: la modifica

Una riga in `canonicalize` (`irDefaults.ts`), che esclude il campo del pin nello stesso punto e
con lo stesso pattern con cui esclude `migratedFrom`.

Se il pattern esistente non è una lista di chiavi escluse ma una costruzione esplicita
dell'oggetto canonico, **adeguati alla forma locale** invece di introdurre un meccanismo nuovo.

In `irDefaults.ts` si tocca **solo** `canonicalize`, e solo per questo. Nient'altro nel file,
nessun altro file oltre a quello e al file di test.

## Fase 4: due test

Nel file di test di `irDefaults` se esiste, altrimenti in `ir/__tests__/irDefaults.test.ts`:

1. due IR identici salvo il pin → **stesso** `irHash`;
2. un IR uguale a `defaultObjectViewIR()` più il solo pin → `isMigratedDefaultView` continua a
   ritornare vero. È il test che dimostra che la trappola è chiusa.

I test esistenti restano verdi senza modifiche. Se uno diventa rosso, fermati e segnala invece
di aggiustarlo.

## Gate automatici

1. `npx tsc --noEmit`: baseline **33**, zero nei file toccati.
2. `npx vitest run`: verdi, salvo i 9 file che falliscono in import per `window is not defined`
   (baseline nota).
3. `npm run build`: exit 0.
4. `npm run check:docs`: rosso da prima per due entry del 2026-08-03. Verifica solo che la tua
   entry passi e che non si aggiungano fallimenti nuovi.

## Hard stop: verifica visiva (la esegue Alfonso)

**Nessun commit prima del go-ahead.** I cinque controlli sono nel prompt v2
(`claude/2026-08-05_prompt_1_3_pin_identita_metaclasse_v2.md`). Il decisivo per questo delta è
il **terzo**: progetto migrato, scrivo il pin su una view di default migrata, la resa dei nodi
non cambia, hard refresh e ricontrollo.

## Commit: perimetro esatto, e un avvertimento

L'indice contiene WIP di un'altra sessione (`editors/languages/Jsx.tsx`,
`editors/views/ViewData.tsx`, `editors/views/data/TemplateData.tsx`). **Non committarlo, non
includerlo, non toccarlo.** Se al momento del commit risulta ancora staged, fermati e segnalalo
invece di procedere: lo sblocca Alfonso.

`git add` per path espliciti, mai `git add .`, mai `git add -A`, mai `git commit -a`. Il
perimetro è:

- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/metaclassPin.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/metaclassPin.test.ts`
- il file di test di `irDefaults`
- i tre pannelli di authoring
- `docs/claude-code-log.md`

Un solo commit: `feat: pin the authoring metaclass by identity in the IR`. L'esclusione in
`canonicalize` viaggia con il pin, non separata: senza di essa il pin è una regressione, quindi
non esiste un commit intermedio sano.

Entry in `docs/claude-code-log.md` con tipo `feat`, `Corregge` e `Causa` nella forma prescritta
da §21.3. Il file ha già modifiche non committate: **integra la tua entry, non sovrascrivere
quella esistente**.

Nel report di chiusura: le risposte ai quattro punti della Fase 1 e l'esito del censimento della
Fase 2.

**Il prompt log è sopra la soglia di 20 entry**: la rotazione è dovuta ma **non in questo
commit**.

Nessun push senza go-ahead.

## Vincoli

- Zero refactoring opportunistico. Mai rinominare identificatori esistenti, incluse le classi
  SCSS.
- Non rimuovere `appliableToClasses` né il controllo `Applicable to`: è il task 1.4, commit
  separato dopo questo.
- Non cambiare la semantica di `metaclasses` né il resolver. Non toccare `irCompile.ts`,
  `irResolveCore.ts`, `irValidate.ts`, `view.tsx`, né alcun file sotto `ui/`.
- Nessun bump di `irVersion`, nessuna migration.
- Critical zone (`useJjomSync.ts`, `portDistribution.ts`): non entrarci.

---
**Nome del documento prompt**: 2026-08-05 14:55 prompt_1_3_delta_canonicalize
