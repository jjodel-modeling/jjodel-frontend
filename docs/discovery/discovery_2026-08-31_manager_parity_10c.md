# Discovery — Slice 10c: manager parity con la board

Data: 2026-08-31. Fase 1 (read-only) del prompt «Slice 10c — manager parity con la
board (SERIALE)».

## Ipotesi che questa discovery falsifica

1. «La board `Manager Admin Form Bottom.dc.html` e' nel repo e si puo' leggere.»
   **Falsa.** `find . -iname "*Manager*Admin*"` e `find .. -iname "*.dc.html"` non
   trovano nulla. La board e' un artefatto di design fuori repo; il prompt la
   dichiara «illustrativa» e dichiara normative le proprie regole. Si costruisce
   sul testo del prompt, non su un file.
2. «`entities.css` esiste come file.» **Falsa.** La coppia pastello/saturato di
   `class` non vive in un `entities.css` ma nei token:
   `styles/tokens/_colors-light.scss:336-337` (`--color-entity-class-bg: #FCE1EA`,
   `--color-entity-class-fg: #7A4056`) e `_colors-dark.scss:244-245`. Il vestito
   gia' pronto e' `.jj-type-badge--class` (`styles/components/_form-system.scss:1248`).
3. «Serve un componente badge nuovo.» **Falsa.** `Info.tsx:1085` fa esattamente il
   badge quadrato a lettera: `<span className={"props-header__glyph jj-type-badge--" + badgeClass}>{letter}</span>`,
   geometria in `properties-with-tree-view.scss:380-400`. Qui si riusa la classe di
   colore e si dichiara la sola geometria locale.
4. «Esiste gia' un export/download nella tab.» **Falsa.** `grep download` su
   `components/abstract/tabs/` trova solo `DocumentationTab.tsx:380,852` (markdown).
   Nessun percorso riusabile per la tabella: il prompt prevede questo caso
   («altrimenti CSV client-side minimale»).

## Obiettivo

Chiudere il delta di superficie fra il manager consegnato (FL6 + 10b + FL7) e la
board. Motore invariato; deviazione A3 (niente Save/Discard/«Unsaved changes»)
resta ratificata e viene ESTESA: il badge «Unsaved changes» oggi presente in
`InstanceManagerTab.tsx:2018` va via, perche' A3 dice «dove la board li mostra,
non li costruire» e quel badge e' il residuo della stessa famiglia.

## File letti

- `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` (2183 righe)
- `frontend/src/components/abstract/tabs/instanceManagerTab.scss` (1408 righe)
- `frontend/src/components/abstract/tabs/instanceTable.ts`
- `frontend/src/components/abstract/tabs/instanceManagerModel.ts`
- `frontend/src/jjform/shape.ts`, `frontend/src/jjform/index.ts`
- `frontend/src/components/editors/Info.tsx` (1045-1095)
- `frontend/src/components/editors/properties-with-tree-view.scss` (370-400)
- `frontend/src/styles/components/_form-system.scss` (1238-1255)
- `frontend/src/styles/tokens/_colors-light.scss`, `_colors-dark.scss`
- `frontend/src/common/entityMeta.ts` (`resolveEntityType`, `entityLetter`)
- `frontend/src/components/abstract/tabs/__tests__/instanceManagerFl6.test.ts`
- `docs/PROTOCOL.md`, `CLAUDE.md`

## Findings, con file:riga

- **Rail.** `InstanceManagerTab.tsx:1659-1701`: la riga di metaclasse e' oggi
  `<span className="instance-manager__row-name">{cls.name}</span>` + tag +
  `<span className="instance-manager__count">`. Nessun badge. La campitura di
  selezione c'e' gia' (`instanceManagerTab.scss:157-171`,
  `--color-selection-bg` + barra `--color-selection-bar`): la clausola 1
  «riga attiva = campitura selezione» e' **gia' soddisfatta**, il delta e' il
  solo badge.
- **Sezione VIEWS.** Non esiste. `OutlinePanel` e' montato incondizionatamente
  (`:1651-1666`): non c'e' stato di apertura, quindi «Outline» va costruito come
  toggle nuovo. «Canvas» ha gia' il suo innesto: `openInCanvas(modelid, subjectId)`
  (`:1563`, adapter a `neighborhoodAdapter.ts:64`), oggi raggiungibile solo dal
  nastro della riga espansa.
- **Testata.** `:1720-1745`: un solo `<h3 className="instance-manager__eyebrow">`
  con `«{name} · {n} instances»`, il search «Search…» e il bottone New. Manca il
  titolo 24px, il sottotitolo di provenienza, il segmented, l'indicatore colonne,
  l'Export. Il bottone New esiste gia' ed emette `openCreate(classShape.key, null, null)`
  — **lo stesso evento** dell'outline (`outlineCreate` -> `openCreate`, `:1497`):
  la clausola «stesso evento della create outline» e' gia' vera e va solo asserita.
- **Footer.** Non esiste. Il conteggio istanze vive nell'eyebrow.
- **Stato di riposo.** `:1755-1760` e `:2139-2143`: i DUE cartelli in cascata che
  il prompt chiede di far sparire — «Pick a metaclass to list its instances» e
  l'`EmptyState` «No instance selected». Nessuna preselezione: `selectedClassId`
  nasce `null` (`:1135`).
- **Enum discriminante.** `jjform/shape.ts:89-99`: un `AttrShape` con
  `type === 'enum'` e `enum` che chiave in `MetamodelShape.enums`, i cui
  `literals` sono `{id, name}`. Leggibile dalla shape, come il prompt chiede;
  nessun literal da cablare.
- **Filtro.** `instanceTable.ts:241-245` `filterRows(rows, query)` filtra sul
  `haystack` — tutta la riga, non il nome. Il prompt chiede «Filter by name…»,
  filtro sul NOME: serve un predicato nuovo, non un rinomino del segnaposto.
- **Test.** L'idioma e' `instanceManagerFl6.test.ts`: asserzioni sul SORGENTE per
  il TSX (che sotto node muore all'import — arriva a monaco via il barrel di
  `editor-v2`) e test veri sui moduli puri. Quindi la logica nuova va nei moduli
  puri, o non e' provabile.

## Dipendenze e rischi

- `instanceTable.ts` non e' fra i «file tuoi» del prompt, che nomina
  `InstanceManagerTab.tsx` e «il rail». Ma la logica di 10c (colonne vuote,
  segmented, CSV, paginazione, preselezione) e' pura e **non e' provabile** se
  nasce dentro il TSX. Scelta: le funzioni pure in `instanceTable.ts`, che e' gia'
  il modulo dati della tabella, e l'estensione dichiarata come out-of-scope.
- Zero file di `CLAUDE.md` §3.1 nel perimetro: nessun Layer Impact Report dovuto.
- Nessuna dipendenza nuova (Regola 4): il CSV e' una `join`, il download un
  `Blob` + `<a download>` come `DocumentationTab.tsx:852`.

## Domande aperte, risolte per decisione dichiarata

1. **Su quali righe si misura la colonna vuota?** Su TUTTE le righe della
   metaclasse, non sulle filtrate: misurarle sulle filtrate farebbe apparire e
   sparire colonne mentre si scrive nel filtro.
2. **Quale enum e' «il discriminante» se ce n'e' piu' d'uno?** Il primo attributo
   a valore singolo (`many === false`) di tipo `enum` con almeno due literal,
   nell'ordine della shape. Regola dichiarata, non cablata sui literal.
3. **Canvas senza istanza selezionata?** `openInCanvas` prende un `objectId`. La
   voce resta visibile e inerte, con la causa nel `title` — la stessa regola con
   cui il rail tiene visibili le metaclassi astratte.

---

# Addendum — Fase 2 e sonda visiva (2026-08-31)

## Cosa e' stato scritto

Commit `d448573ff`, cinque file:

| File | Delta |
|------|-------|
| `instanceTable.ts` | Nove funzioni pure nuove, in coda: `filterRowsByName`, `discriminantEnum`, `filterBySegment`, `emptyColumnKeys`, `visibleColumns`, `pageCount`, `pageOf`, `toCsv`, `mostPopulatedClassId`, piu' `PAGE_SIZE = 50`. Zero righe esistenti toccate. |
| `InstanceManagerTab.tsx` | Badge nel rail, sezione VIEWS, testata, barra strumenti, footer, preselezione, empty state unico, form collassabile, rimozione del badge «Unsaved changes». |
| `instanceManagerTab.scss` | Geometria del badge, sezione VIEWS, testata, segmented, indicatore, Export, footer, paginazione, pannello collassato. Due regole esistenti modificate in loco (`&__toolbar` guadagna `flex-wrap`, `&__search` perde `margin-left: auto`) invece di essere ridichiarate piu' in basso. |
| `__tests__/instanceManager10c.test.ts` | **Nuovo**, 69 casi. |
| `__tests__/instanceManagerFl6.test.ts` | Due asserzioni superate da 10c, aggiornate. Vedi sotto. |

## Le due asserzioni di FL6 che 10c supera

1. `colSpan={columns.length + 5}` → `shownColumns.length + 5`. **Stessa affermazione**: la
   cella dell'espansione copre tutte le colonne RESE. Se continuasse a contare `columns`,
   sborderebbe di una cella per ogni colonna nascosta.
2. `expect(TSX).toContain('Unsaved changes')` → invertita in un'asserzione di ASSENZA,
   scoped alla testata della form. FL6 lo asseriva presente; A3 lo toglie. Invertita e non
   cancellata, cosi' il giorno in cui qualcuno lo rimette il test lo dice.

## Il reperto sui test: un'asserzione di assenza non puo' leggere i commenti

Quattro asserzioni di ASSENZA sono nate rosse su PROSA, non su codice: «Pick a metaclass
to list its instances», «Unsaved changes» e «Discard» comparivano nei commenti che
spiegano perche' sono stati tolti, e `expandedId` nel commento di FL6 che spiega perche'
non esiste. Un `toContain` che legge anche i commenti non distingue «X e' stato rimosso e
documentato» da «X e' ancora li'». Il file di test ora deriva un `CODE` senza commenti e
usa quello per ogni negativa; le positive restano su `TSX`. E' §5 applicata al testo: li'
il pericolo e' il silenzio, qui e' il rumore.

## Il reperto sull'A3 troppo larga

La prima stesura cercava «Discard» su tutto il file e lo trovava — nel multi-form di 12b,
dove il bottone **resta e deve restare**: li' un draft esiste davvero (`bulkTouched`
tiene le battute finche' «Apply to N» non le scrive), quindi annullarlo e' un'azione con
un oggetto. A3 parla della form a UNA istanza, che scrive diritto. L'asserzione e' ora
scoped alla testata, con un controllo positivo sulla finestra.

## Mutazioni

Cinque, tutte rosse, verde al ripristino:

| # | Mutazione | Rossi |
|---|-----------|-------|
| 1 | badge senza `jj-type-badge--class` | 1 |
| 2 | `emptyColumnKeys` ignora `broken`/`missingRequired` | 2 |
| 3 | `filterBySegment` non filtra | 3 |
| 4 | preselezione disattivata | 1 |
| 5 | `pageOf` non pinza la pagina | 1 |

## Sonda visiva — `_tmp_10c_verify.ts`, app vera, fixture Heater

**50 PASS / 0 FAIL / 0 errori di pagina.** Screenshot: `_tmp_10c_rail.png`,
`_tmp_10c_rest.png`, `_tmp_10c_expanded.png`, `_tmp_10c_filters.png`, `_tmp_10c_paged.png`.

Fixture estesa rispetto a FL7 con due aggiunte necessarie e dichiarate: `kind : Kind`
(enumerazione vera — senza, ogni asserzione sul segmented sarebbe muta) e `note : EString`
mai valorizzata (la colonna che deve sparire — senza, «N empty columns hidden» sarebbe
provato solo per la sua assenza).

Misure che contano:

- badge 18×18 quadrato, `background rgb(252,225,234)` / `color rgb(122,64,86)` — cioe'
  esattamente `--color-entity-class-bg` (#FCE1EA) e `-fg` (#7A4056). Il badge NON dichiara
  colore proprio: e' la coppia dei token, misurata sul computed style.
- rail: `State=6  StateMachine=2  Transition=3`, riga attiva `rgb(224,247,250)`.
- VIEWS: due voci, `bi-list-nested` e `bi-diagram-3`, nessuna Diagram. Canvas inerte senza
  soggetto, attivo con soggetto.
- testata: titolo `24px` con `text-transform: none`, provenienza «Created from the
  container's form · SmM1», segnaposto «Filter by name…», segmented `All|initial|normal|final`.
- filtro nome ∩ segmented: «warm» ∩ normal = 1 riga (Warmup); «warm» ∩ final = 0 righe.
  **Un OR ne avrebbe restituite due**: e' l'asserzione che distingue la composizione giusta.
- filtro sul NOME e non sulla riga: «initial» e' un valore di cella e non trova niente.
- Export: 2 righe dati sul filtro `final`, file `SmM1-State.csv`, intestazione senza `note`.
- footer: «6 instances · 0 selected», «3 instances of 6 · 1 selected» sotto filtro;
  paginazione assente a 6 righe, presente a 66 con «Page 1 of 2» e 50/16 righe.
- riposo: pannello form alto **33px** con la barra, **372px** con la form; zero empty state
  a schermo con la tabella piena; nessun «Pick a metaclass», nessun «No instance selected».
- FL6/FL7 intatti: nastro 1, scatola owner 1, riga selezionata «Running».
- zero overflow orizzontale, zero errori di pagina.

## Tre reperti dalla sonda, nessuno un difetto del prodotto

1. **La colonna `name` e' DUE cose.** L'indicatore dichiara `2 empty columns hidden`, non
   una: `note` e `name`. Il `name` che si VEDE nella tabella e' un `<th>` dedicato fuori da
   `columns`, che stampa `row.name` (cioe' `DObject.name`); il `name` nascosto e' la FEATURE
   `name : EString`, il cui slot in questa fixture non e' mai stato popolato. Le due si
   chiamano uguale e sono cose diverse. Su un modello dove la sincronia slot↔nome di §3.12
   ha girato, la feature non e' vuota e la colonna resta.
2. **`+ New` e' assente su `State`, ed e' giusto.** E' la scorciatoia ROOTABLE (Route 1 di
   Turno 10); `State` e' contenuta in `StateMachine`, quindi il bottone non c'e' e la
   ragione sta nella frase sotto la barra. La sonda ora lo asserisce come regola invece di
   scambiarlo per un difetto, e prova il New su `StateMachine`.
3. **Il toast copre la paginazione.** Le 60 creazioni fanno comparire il widget di
   notifica in basso a destra, che intercetta il puntatore sul bottone «Next page».
   Playwright lo riporta onestamente. `force: true` **non basta** — forza l'azione ma la
   manda comunque al punto, dove c'e' il toast: misurato, con `force` la pagina restava la
   prima. La sonda usa `el.click()`. E' un limite dell'ambiente della sonda, non della
   superficie; ma su uno schermo stretto il toast copre davvero quel bottone.

## Punto aperto, dichiarato

Il sottotitolo di provenienza («Created from the container's form · SmM1») e la frase di
`newInstanceReason` («Created from its container's form (StateMachine)») ora convivono a
sessanta pixel di distanza e dicono quasi la stessa cosa. Le due portano informazioni
diverse — la prima il MODELLO, la seconda le METACLASSI contenitrici — ma la formulazione
si sovrappone. Non risolto in questa slice per due ragioni: il prompt fissa il testo del
sottotitolo alla lettera, e la frase di `newInstanceReason` e' copy del motore
(`jjform/create.ts:154`), fuori perimetro. Fonderle richiede una decisione su quale delle
due sopravvive, che e' di Alfonso. Visibile in `_tmp_10c_rest.png`.
