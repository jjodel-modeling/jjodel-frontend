# Prompt Claude Code — arco 2, coda: i tre preamboli mancanti dell'archivio e la correzione del commento tombale

**Data**: 2026-08-12 19:00
**Tipo**: docs
**Perimetro**: due file. `docs/claude-code-log-archive.md` e
`frontend/src/components/editors/properties-with-tree-view.scss`. Fuori dalla critical zone.
**Dipende da**: `2146725c3`, cioè lo stato attuale del branch. Nessuna dipendenza da passi non
eseguiti.
**Commit**: uno solo. I due interventi sono entrambi correzioni di documentazione lasciate
indietro dall'arco, e stanno insieme.

---

## Perché

Due residui, tutti e due già dichiarati a registro da chi li ha lasciati aperti, e tutti e due
piccoli. Il primo però era stato rimandato con una motivazione che non regge, e quella parte
merita di essere detta prima del resto.

### Il preambolo dell'archivio deve tre paragrafi, non quattro

`docs/claude-code-log-archive.md` apre con un preambolo che nomina i lotti di rotazione uno per
uno. Nomina fino al **sedicesimo**, poi salta al **ventesimo**. I lotti diciassettesimo,
diciottesimo e diciannovesimo sono stati eseguiti e annotati nelle note del log, ma non hanno mai
avuto un paragrafo.

Il ventesimo lotto ha dichiarato il buco invece di sanarlo di nascosto, il che era giusto, e lo ha
rimandato a un commit suo con questa motivazione: scriverli «vuol dire ricostruire da git tre
tagli che nessuno documentò allora, ed è archeologia». Il ventunesimo ha ripetuto la stessa
motivazione, e ha anche sbagliato il conto: dice che il preambolo deve quattro paragrafi, «dal
diciassettesimo al ventesimo». Ne deve tre. Il ventesimo il suo paragrafo ce l'ha, ed è
immediatamente sopra quello del ventunesimo.

**La motivazione è falsa, e questo passo esiste perché è falsa.** Non serve git. Servono due fatti
che stanno già nei due file:

1. **L'archivio è append-only in coda.** Ogni rotazione accoda in fondo le entry che sposta, in
   ordine di file attivo. La posizione di una entry nell'archivio, contata dall'alto, non cambia
   più.
2. **Ogni lotto ha registrato nelle note del log il proprio conteggio prima e dopo.** Sedicesimo:
   «archivio da 738 a 739». Diciassettesimo: «da 739 a 740». Diciottesimo: «da 740 a 741».
   Diciannovesimo: «da 741 a 742». Ventesimo: «da 742 a 744». Ventunesimo: «da 744 a 749».

Da questi due fatti l'identificazione è aritmetica: l'entry in posizione 740 è quella che ha
spostato il diciassettesimo, la 741 il diciottesimo, la 742 il diciannovesimo.

**Controllo positivo, obbligatorio prima di scrivere e già eseguito una volta qui.** La stessa
aritmetica mette le due entry del ventesimo lotto in posizione 743 e 744. Le posizioni 743 e 744
contengono `docs: rotazione del log a 20 entry attive (ottavo lotto)` e `docs: ritiro di
docs/specs/, migrazione del design doc slice-1, nota di reindirizzamento`, che sono esattamente
le due che l'entry del ventesimo lotto dichiara di aver spostato. Il metodo ha segnale su un caso
di cui la risposta è nota per altra via. Secondo controllo, indipendente: il paragrafo del
sedicesimo lotto dice che l'entry rimasta appena sopra il suo taglio si chiamava «2026-08-10
02:25»; l'entry in posizione 740 porta `**Prompt document name**: 2026-08-10 02:25`. Le due catene
combaciano.

Il totale corrente dell'archivio è **749**, che è quello che le note prevedono. Il registro è
coerente: mancano i paragrafi, non i dati.

### Il commento tombale dice il numero giusto sul ramo sbagliato

`properties-with-tree-view.scss`, dentro `.tree-node__icon`, porta un commento lungo che spiega
perché la riga di guardia dark ha bisogno del `:not()`. L'ultima frase è invertita:

```
// Il :not() e' obbligatorio: senza, questa riga a (0,5,0) spegnerebbe anche il
// fondo di tree-viewpoint e tree-leaf-view, che stanno a (0,2,0) e sono le due
// pastiglie ratificate dall'emendamento (2) a R-RAIL-33.
```

`(0,5,0)` è la specificità della riga **con** il `:not()`, non senza. L'errore è mio, sta nel
prompt del passo 7, e Claude Code lo ha applicato verbatim segnalandolo nella nota 6 della sua
entry, che era la cosa giusta da fare: preservare la corrispondenza con l'hash e alzare la mano.

Misurato ora sul sorgente, non dedotto. La catena di annidamento è `.tree-view-panel-body`
(`:979`) → `.tree-node__icon` (`:1056`), quindi `&` vale `.tree-view-panel-body .tree-node__icon`,
cioè (0,2,0). Ne segue:

- senza `:not()`: `[data-theme="dark"] .tree-view-panel-body .tree-node__icon` = **(0,3,0)**;
- con `:not()`, che aggiunge due classi: **(0,5,0)**.

E il punto sostanziale, che la frase invertita nasconde: il `:not()` non serve ad **abbassare** la
specificità sotto le due pastiglie, perché la alza. Serve a **escluderle dal match**. Un lettore
che prendesse per buona la frase attuale ne dedurrebbe una regola falsa sul funzionamento della
cascata, ed è il genere di errore che questo commento esiste per prevenire.

---

## COSA

### Parte A — i tre paragrafi mancanti in `docs/claude-code-log-archive.md`

Inserire i tre paragrafi qui sotto **dopo** il paragrafo del sedicesimo lotto e **prima** di quello
del ventesimo, così che la serie torni continua da uno a ventuno. Il registro linguistico è quello
del preambolo esistente: inglese, ordinali in lettere, l'aritmetica esplicita fra parentesi.

Testo esatto da inserire, i quattro paragrafi in quest'ordine:

```
Seventeenth batch (2026-08-12): the single oldest by active-file position, leaving 20
(20 - 1 + 1, where the +1 is the arco 2 passo 4 entry added by this same commit, the two-row
properties shell). Positional cut as in batches four to sixteen. The "Prompt document name"
criterion can rank this boundary and agrees with position: the moved entry is named
"2026-08-10 02:25", the entry kept just above it "2026-08-10 02:40". No inversion. Appended
below.

Eighteenth batch (2026-08-12): the single oldest by active-file position, leaving 20
(20 - 1 + 1, where the +1 is the passo 4 tail entry added by this same commit, the metamodel
breadcrumb segment and the italic abstract classes). Positional cut. Position and "Prompt
document name" agree again: moved "2026-08-10 02:40", kept just above "2026-08-10 03:05". No
inversion. Appended below.

Nineteenth batch (2026-08-12): the single oldest by active-file position, leaving 20
(20 - 1 + 1, where the +1 is the passo 5 entry added by this same commit, R-RAIL-36 and the
fourth entity palette). Positional cut. Position and "Prompt document name" agree: moved
"2026-08-10 03:05", kept just above "2026-08-10 04:05". No inversion. Appended below.

Numbering, reconciled (2026-08-12). The three paragraphs above were written after the fact,
in a commit of their own, and they close the gap the twentieth batch declared. Both the
twentieth and the twenty-first deferred them on the ground that writing them meant reading
cuts out of git that nobody had documented at the time. That premise does not hold, and
saying so is the useful part of this reconciliation: the archive is append-only at its tail,
so a batch is identifiable by the positions it added, and every batch recorded its own
before-and-after archive count in the log notes. The three cuts were arithmetic, not
archaeology. Positive control: the same arithmetic puts the twentieth batch's two entries at
positions 743 and 744, which is what that batch's entry says it moved; and the sixteenth
paragraph names "2026-08-10 02:25" as the entry left just above its cut, which is the entry
at position 740, the one the seventeenth then moved. Two independent chains agree. One
residual correction: the twenty-first paragraph says the preamble owes four paragraphs, "the
seventeenth through the twentieth". It owed three. The twentieth has its paragraph, directly
above the twenty-first, and that paragraph's own closing sentence stands as written.
```

Non toccare nessun altro paragrafo del preambolo, e in particolare **non riscrivere** la frase
sbagliata dentro il paragrafo del ventunesimo lotto. Il preambolo è cronaca: si corregge
aggiungendo, mai emendando all'indietro. La correzione sta nel quarto paragrafo qui sopra, che è
il posto giusto.

### Parte B — la frase invertita in `properties-with-tree-view.scss`

Sostituire le tre righe di commento (oggi a `:1083-1085`, verificare la posizione prima di
toccare) con queste cinque:

```scss
        // Il :not() e' obbligatorio, ma non per specificita'. Senza, la riga sta a
        // (0,3,0) e batte comunque tree-viewpoint e tree-leaf-view, che stanno a
        // (0,2,0) e sono le due pastiglie ratificate dall'emendamento (2) a
        // R-RAIL-33: ne spegnerebbe il fondo. Il :not() non abbassa la specificita',
        // la alza a (0,5,0); quello che fa e' escludere le due classi dal match.
```

Solo il commento. **La riga di CSS sotto non si tocca**, il selettore non cambia, il CSS emesso
resta identico byte per byte.

---

## Verifiche

**Parte A**, meccaniche, tutte da eseguire:

1. `command grep -c '^## 20' docs/claude-code-log-archive.md` deve dare **749** prima e **749**
   dopo. Il commit non sposta entry.
2. `command grep -c '^## 20' docs/claude-code-log.md` deve dare **20** prima e **21** dopo, per
   la sola entry di log di questo task. Se sale a 22, hai spostato qualcosa che non dovevi.
3. Il controllo positivo del metodo, da rieseguire e non da dare per buono sulla parola:
   l'intestazione in posizione 743 e quella in 744 devono essere le due che l'entry del ventesimo
   lotto dichiara. Se non lo sono, **STOP**: la premessa di tutto il passo cade e i tre paragrafi
   non vanno scritti.
4. Le tre coppie di timestamp citate nei paragrafi devono corrispondere ai campi
   `**Prompt document name**` delle entry in posizione 740, 741, 742 e 743. Quattro letture,
   quattro confronti.
5. `npm run check:docs` verde. Tocchi l'archivio e il log, quindi il gate si applica.

**Parte B**:

6. `npm run build` exit 0.
7. Diff del CSS emesso: il commento SCSS non arriva nel bundle, quindi il file in
   `frontend/dist/assets/index-*.css` deve avere lo **stesso md5** prima e dopo. Costruisci prima,
   salva l'hash, modifica, ricostruisci, confronta. Se l'hash cambia hai toccato una riga di
   stile.
8. Nessuna verifica visiva: non c'è nulla da vedere. `Smoke visivo: non applicabile`.

---

## Hard stop

1. **Se il totale dell'archivio non è 749**, STOP e riporta. Significa che una rotazione è passata
   fra la scrittura di questo prompt e la sua esecuzione, e le posizioni citate vanno rifatte
   (restano valide: le tre entry sono le stesse, cambia solo il totale).
2. **Se il controllo positivo sulle posizioni 743 e 744 fallisce**, STOP. Il metodo è quello, e se
   non ha segnale sul caso noto non ha segnale nemmeno sugli altri tre.
3. **Se il preambolo contiene già un paragrafo per il diciassettesimo, diciottesimo o
   diciannovesimo lotto**, STOP: qualcuno ci è arrivato prima e questo passo è a vuoto. Controllo
   positivo obbligatorio sulla stessa ricerca: `Sixteenth` e `Twentieth` devono trovarsi entrambi.
4. **Se l'md5 del CSS emesso cambia**, STOP e riporta cosa è cambiato prima di committare.
5. **Se le tre righe di commento non sono più a `:1083-1085`**, non è un motivo di stop: cercale
   per contenuto (`command grep -n 'spegnerebbe'`) e correggi la posizione nel report. È un motivo
   di stop solo se non esistono più, il che vorrebbe dire che qualcun altro le ha già toccate.

---

## Cosa questo passo NON fa

- **Non ruota il log.** L'attivo passa da 20 a 21 con l'entry di questo task e ci resta. La
  rotazione è un atto suo e il ventunesimo lotto è di poche ore fa.
- **Non emenda i paragrafi del ventesimo e del ventunesimo lotto**, nemmeno la frase sbagliata sul
  numero di paragrafi dovuti. Il preambolo è cronaca, si corregge in avanti.
- **Non tocca il residuo non tracciato del working tree** (`_to_delete/`, il bundle,
  `.claude/settings.local.json`). Vedi la nota qui sotto: è una decisione di Alfonso, non di
  questo passo.
- **Non fa push.** Il branch è a dieci commit da origin e il push è una chiamata sua.

---

## Nota fuori perimetro, da riportare e non da eseguire

`git status` sul branch mostra tre voci non tracciate: `.claude/settings.local.json`,
`_to_delete/` (che contiene `_probe_write`, `gittest/` e `index.lock.stale`, cioè il residuo
quarantenato di un lock stantio, R-RAIL-27) e `arco2-cowork-2026-08-12.bundle`, 44 KB. Nessuna è
in `.gitignore`. Finché stanno lì, qualunque passo che apra con «working tree pulito → STOP»
inciampa su di loro senza che ci sia niente di rotto.

Non rimuoverle in questo passo. Riportale nel report di chiusura e chiedi ad Alfonso quali vanno
in `.gitignore` e quali vanno cancellate.

---

## Log

Entry in `docs/claude-code-log.md`, formato §21.2.

`Corregge`: `2026-08-12 15:00` (il prompt del passo 7, da cui viene la frase invertita).
`Causa`: `(a)` per la parte B, specifica sbagliata nel prompt. La parte A non ha una causa nella
tassonomia: è un residuo dichiarato, non un errore di esecuzione, e va detto nelle note.
`Regressions`: `no`. `Out-of-scope changes`: `no`. `Layer Impact Report`: `not-required`.
`Smoke visivo`: `non applicabile`.

Nelle note, quattro cose almeno:

1. Il conteggio dell'archivio prima e dopo, che deve essere lo stesso.
2. L'esito del controllo positivo sulle posizioni 743 e 744, riportato per esteso.
3. L'md5 del CSS emesso prima e dopo.
4. **La motivazione che è caduta**: due rotazioni di seguito hanno rimandato questi tre paragrafi
   dicendo che ricostruirli era archeologia su git, e non lo era. Vale la pena registrarlo come
   caso: una difficoltà stimata senza provare a farla costa più del lavoro che evita. Se merita
   una voce a `docs/decisions.md` lo decide Alfonso, non questo passo.

---

## Cruscotto

Non chiude voci del cruscotto. Chiude due residui interni dell'arco 2, entrambi tracciati solo
nelle note del log.
