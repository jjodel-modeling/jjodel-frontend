# TXT1 — Fase 2: `jjodel/multiline` implementata, e cosa la misura ha aggiunto

Data: 2026-09-01. Protocollo `docs/PROTOCOL.md` P1..P10. Chiude la Fase 2 del prompt
`docs/prompts/PROMPT_TXT1_multiline_textarea.md`, sul referto di Fase 1
`discovery_2026-09-01_txt1_annotation_multiline.md`. Sonda: `_tmp_txt1_verify.ts`,
**23/23 ALL GREEN, zero errori di pagina** (non committata, `.gitignore:66`).

## 1. Cosa e' stato scritto

Cinque file di prodotto, tre di test, la spec, il referto, la voce di log. Dentro i nove
dichiarati dal prompt (regola 19), che il go-ahead ha autorizzato in anticipo.

| file | cosa cambia |
|---|---|
| `nodes/rowViewAnnotations.ts` | quinta chiave `multiline`; terza famiglia di parsing, booleana; commento in testa corretto (§4) |
| `jjform/layout.ts` | `LayoutAnnotations` allargata; rung **2b** dopo il blocco renderer; id A3 dichiarato su `STRETCH_MAX` |
| `viewpoint/ir/IRForm.tsx` | una chiave in piu' nella proiezione di `layoutAnnotations` |
| `nodes/displayAnnotationFields.ts` | gating `multiline` sulla stessa lettura `textual` di `code`; `multilineOverriddenBy` |
| `nodes/DisplayAnnotations.tsx` | il toggle Multiline e il suo hint |
| `form-autolayout-spec.md` | emendamento **A3** |

`useFormWidgets.ts` **non e' stato toccato** — era il punto di serializzazione con AUTO1
(riga 314) e la forma minima non lo richiedeva: `describeSlot` chiama gia'
`parseRowViewAnnotations`, quindi la quinta chiave arriva al descriptor senza una riga in
piu'. AUTO1 ha emendato quella riga nello stesso albero mentre TXT1 lavorava; i due diff
non si toccano. Nemmeno `shape.ts`, `create.ts`, `rowViewAnnotationsWrite.ts`,
`irFormStyle.scss`, `formWidgets.scss`.

Il write path non e' stato allargato: il toggle scrive la **stringa** `'true'`, che la
firma `string | number` di `declareRowViewAnnotation` accetta gia' e che
`parseRowViewAnnotations` rilegge come booleano. Widen di una firma per un chiamante solo:
evitato.

## 2. La precedenza, e perche' 2b non e' un `else`

Il rung 2 legge due dichiarazioni **in quest'ordine**: `jjodel/renderer=…` mappato da
`RENDERER_WIDTH_KIND`, poi `jjodel/multiline`. Non un `if/else`: due blocchi in fila.

La differenza e' misurabile e misurata. Un renderer che **decide** una larghezza (`code`)
vince e la decide: cella a 6, controllo mono. Un renderer che **non** decide una larghezza
(`enumChip`, `progress`, o un nome che nessuno conosce) cade attraverso — cosi' come faceva
prima — e lascia a `multiline` il suo turno. Con un `else` il secondo caso avrebbe bloccato
la dichiarazione senza deciderne una al posto suo: un `renderer=inventato` avrebbe spento la
textarea. Unita' `layout.test.ts`, i due casi separati.

Il gate del tipo e' scritto sulla famiglia che il rung 1 ha gia' deciso — `attr.type` in
`{string, unknown}` — e non sul nome del tipo. `boolean`, `number` ed `enum` sono usciti
sopra col loro `return`; `many` e la reference-ness prima ancora; `date` e' escluso
esplicitamente perche' e' l'unica famiglia che sopravvive allo switch. `AttrType` e'
un'unione chiusa a sei, quindi il gate e' esatto e non permissivo.

## 3. I due toggle stanno accesi insieme, e il pannello lo dice

Nessuna mutua esclusione: Code e Multiline scrivono chiavi diverse, e accenderne uno non
cancella l'altro. Misurato sulla sonda (braccio F): accesi entrambi, `readRowViewAnnotations`
legge `{multiline: true, renderer: 'code'}`, la cella torna a 6 e il controllo non e' piu'
la growtext; **tolto il renderer, la growtext torna da sola**, senza che nessuno abbia
riscritto `multiline`. E' esattamente il motivo per cui l'esclusione sarebbe stata sbagliata:
avrebbe cancellato una dichiarazione dell'utente per far rispettare una precedenza che la
scala fa rispettare da sola.

Quello che il pannello aggiunge e' l'unico fatto che altrimenti resterebbe nascosto: un hint
asciutto sotto il toggle, «Overridden by renderer: code». La condizione e'
`multilineOverriddenBy`, che interroga **la stessa `RENDERER_WIDTH_KIND`** che decide nella
scala — non un `=== 'code'` scritto a mano, che sarebbe una seconda verita' destinata a
divergere alla sesta voce della mappa. Un renderer che non decide larghezze non produce
hint, perche' non sta sovrascrivendo niente.

## 4. Il commento stale, corretto — e la meta' che il referto aveva ragione a smentire

L'intestazione di `rowViewAnnotations.ts` dichiarava `parseDAnnotation` stubbata e il
round-trip perso «perche' il parser e' stubbato anche in lettura». Entrambe le frasi sono
state riscritte sulle misure della Fase 1 (§2.1, §2.2), verificate di nuovo qui:

- `EcoreParser.parseDAnnotation` e' **implementata** (`api/data.ts:691-709`), ha un test, e
  quando l'annotation porta dei details emette `source + '/' + key + '=' + value`, cioe' il
  nostro formato di filo. Un `.ecore` con `<eAnnotations source="jjodel"><details
  key="multiline" value="true"/></eAnnotations>` importa gia' come `jjodel/multiline=true`,
  senza una riga di codice in piu'. La via Ecore per dichiarare `multiline` **esiste, in
  import, ed e' gratis**;
- `DAnnotationDetail` (`LModelElement.tsx:192`) e' **ancora** una classe il cui corpo e'
  `// todo`. Il parser appiattisce i details in `source` proprio per aggirarla;
- la perdita del round-trip e' sull'**export**: `EcoreService.ts` non emette alcuna
  `eAnnotations`, il suo `includeAnnotations?: boolean` (`:42`) e' dichiarato e mai letto, e
  `exportDataType` (`:500`) rimanda a «W5/W4». Corsia sua, non chiusa qui.

## 5. Le sette mutazioni

Un test che non diventa rosso non pinna niente. Ogni punto portante e' stato girato e
rimesso; suite `nodes/__tests__/` + `jjform/__tests__/`, 476 casi.

| # | mutazione | rossi |
|---|---|---|
| 1 | la quinta chiave tolta dall'unione di `annotationKeyOf` | **7** |
| 2 | rung 2b spostato PRIMA del rung 1 | **2** |
| 3 | precedenza invertita: 2b prima del blocco renderer | **1** |
| 4 | `multiline` coerciuto invece che scartato (`b !== 'false'`) | **1** |
| 5 | il gate del tipo tolto dal rung 2b | **1** |
| 6 | il gating sganciato da `textual` (toggle sempre acceso) | **3** |
| 7 | l'hint reso incondizionato (qualunque renderer) | **1** |

Ripristino: **476/476**.

## 6. Cosa la sonda ha trovato e le unita' non potevano trovare

### 6.1 La form non si ridisegna sulla scrittura di un'annotation — ed e' PRE-ESISTENTE

Il primo giro della sonda ha misurato la form **ancora vecchia a 15 secondi** dalla
scrittura di `jjodel/multiline=true`: `input`, 6 colonne, mentre `readRowViewAnnotations`
sullo store leggeva gia' `{multiline: true}`.

La causa e' `IRForm`: i descriptor si ricalcolano da
`useMemo(..., [slots, spec, resolution, offer])`, e un'annotation vive sulla
**metafeature**, fuori da quelle dipendenze. La dichiarazione si vede alla prima re-render
che arriva per altra via.

**Non e' di TXT1, ed e' misurato per contrasto, non dedotto** (braccio G): la stessa cosa
succede identica a `jjodel/renderer=code`, che e' committato da prima. Scritto sul
CONTROLLO — un attributo mai toccato — a 3 secondi dalla scrittura la cella e' byte per byte
quella di prima; dopo una re-render qualunque la dichiarazione si vede. Le due chiavi
passano per la stessa `useMemo` e non possono comportarsi diversamente.

Conseguenza di prodotto, dichiarata e **non riparata qui**: accendere Multiline (o Code) nel
pannello Display non ridisegna la form finche' qualcos'altro non la ridisegna. Ripararlo
vuol dire toccare la sottoscrizione di `IRForm`, che e' in critical zone (§3.1) e non e' il
buco che questo task chiude. Corsia sua.

### 6.2 Il ri-impacchettamento delle righe, che non e' una regressione

Dichiarato `multiline` su `description`, un vicino (`ratio`, un numero) e' passato da 6 a 3.
Non e' il tetto violato: e' il packer che rifa' le righe quando una larghezza cambia (regola
1, riempimento greedy in ordine di dichiarazione). `ratio` stava a 6 perche' era l'ultimo
scalare di una riga corta e aveva assorbito le colonne libere; quella riga non esiste piu',
e il campo e' tornato alla sua larghezza di **base**. La direzione e' quello che conta e
viene asserita: fra i campi che si sono mossi, **nessuno e' cresciuto**.

La prima stesura del braccio D asseriva «nessun campo supera 6» ed e' andata rossa su
`name` (12) e `tags` (12). Nessuno dei due c'entra: `name` e' l'identita', che `IRForm`
rende sulla sua riga, e `tags` e' un multivalore promosso a 12 dall'overflow dei chip (FL4,
`growsOnOverflow`), che e' una misura in pixel e non una decisione del packer. La pretesa e'
stata riscritta con precisione invece che allargata: **gli scalari** non annotati stanno a
6 o meno, le due eccezioni sono nominate.

### 6.3 I quattro preset, senza clip — la trappola FL9 non scatta, e si vede

`.ir-growtext` **non** porta `.ir-field__control`, quindi la regola di densita'
`.ir-form[data-density] .ir-field__control` non lo raggiunge e non puo' tagliargli il testo:
il suo padding e' fisso (`6px 8px`), l'altezza la scrive `GrowTextWidget` da `scrollHeight`,
e `overflow: hidden` significa che un taglio non si vedrebbe. Misurato in tutti e quattro i
preset, con due righe di prosa dentro: `scrollHeight <= clientHeight` (52/52 in tutti e
quattro) e due righe restano due. Controllo positivo nello stesso braccio: i quattro preset
sono davvero quattro stati diversi (`density` e `skin` letti dal DOM).

### 6.4 Il newline sopravvive al giro salva/ricarica

`prima riga\nseconda riga` scritto nella growtext, poi `JSON.stringify` ->
`VersionFixer.update` -> `LoadAction`, che e' la strada di `SaveManager.load`. Il `\n` torna
identico e la dichiarazione con lui (`{multiline: true}` dopo il fixer e dopo il load), con
`jjodel/multiline=true` visibile fra le `source` del JSON. **Scostamento dichiarato**, lo
stesso della Fase 1: il trasporto verso il backend (`ProjectsApi.save`) non e' esercitato.

Nota di metodo: il primo giro di questo braccio e' morto con «unexpected action type: LOAD»
perche' la sonda usava un `store.dispatch` inventato invece di `LoadAction.new`. Era la
sonda a essere sbagliata, non il prodotto.

## 7. Canvas e tabella: mostrato, non affermato

Il prompt chiedeva la prova, non l'asserzione. Sta nelle unita'
(`rowViewAnnotations.test.ts`, blocco «the canvas and the table do not see the fifth key»):
si costruisce la proiezione che il canvas fa davvero — `rendererOverride`, `unit`, `min`,
`max`, quattro campi per NOME (`jjomTransformers.ts:456-459`, `instanceTable.ts:168-171`) —
e si confronta il verdetto di `metamodelRenderer` con e senza la dichiarazione: **oggetti
uguali**. Con `renderer=code` in piu': ancora uguali, e il verdetto e' `code`. Controllo
positivo nello stesso test, cosi' un parse che non fosse avvenuto non passerebbe per
un'assenza.

## 8. La sonda di Fase 1, girata di verso e non cancellata

`_tmp_txt1_recon.ts` misurava il buco. Tre bracci si sono invertiti, tutti attesi:

- **3.0** riscritto a mano dopo VF1 (`2bba8d1d8`): asseriva `highestVersion === 0` a freddo,
  adesso asserisce che vale gia' l'ultima versione. Da misura di un difetto a
  non-regressione della sua riparazione. **Verde.**
- **4** («`multiline` viene SCARTATA oggi») e **5b** («`multiline` non cambia NULLA»): ora
  **rossi**, ed e' il punto. Erano la misura del buco; il buco e' chiuso. Restano dichiarati
  come inversione attesa, non riscritti: il verdetto di Fase 2 e' `_tmp_txt1_verify.ts`.

Gli altri 14 bracci, giro di persistenza compreso, restano verdi.

## 9. Aperto, e a chi tocca

- **La re-render della form su una scrittura di annotation** (§6.1). Pre-esistente, comune a
  tutte e cinque le chiavi, critical zone. Corsia sua.
- **L'export Ecore delle annotation** (§4). `EcoreService`, non `parseDAnnotation`. Corsia sua.
- **`DAnnotationDetail`** resta `// todo`. Core change, fuori scope per costruzione.
- **`richtext`**: la seconda riga a span 12 della tabella resta raggiungibile solo dal nome
  del tipo. Un `jjodel/richtext` sarebbe la stessa forma di questo diff, se qualcuno lo
  vuole; nessuno l'ha chiesto.
