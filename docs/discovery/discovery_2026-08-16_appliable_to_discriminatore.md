# Discovery — `appliableTo` come discriminatore residuo

**Data**: 2026-08-16
**Branch**: `alfonso-frontend-jjtl` @ `ecc3048f3`
**Tipo**: discovery read-only (Fase 1), nessun file modificato
**Origine**: discussione in chat di progetto sul collasso IR-nativo. Prerequisito del selettore di kind dinamico nel tab `Applies to`.

## Obiettivo

Stabilire se `DViewElement.appliableTo` possa essere derivato da `ir.kind` o ritirato, mappando ogni lettore e ogni scrittore del campo e classificandoli in vivi e morti rispetto allo shutdown del classic editor (Fase 5a).

La domanda nasce da un difetto misurato: una view IR porta oggi due discriminatori paralleli sul proprio tipo, `appliableTo` (enum legacy) e `ir.kind` (IR), che nessuno tiene allineati. Un selettore che scriva `ir.kind` senza toccare `appliableTo` produrrebbe view che si dichiarano riga all'interprete e vertice al codice legacy.

## File letti

Tutti i path sono relativi a `frontend/src/`.

**Dichiarazione e scrittura del campo**
- `view/viewElement/view.tsx` (D class 225-226, L class 970-977, `set_appliableTo` 1698-1712, `set_forceNodeType` 1713-1726, `newDefault` 317-424)
- `joiner/classes.ts` (1088-1100, 1166)
- `redux/defaults/views.ts` (46-47, 121-123, 170-173, 318-321, 420-422, 444-446, 467-469, 509-510, 529-531, 542, 586, 645, 670, 695, 707, 759)
- `common/DV.tsx` (1054-1057)
- `utils/lastViewpoint.ts` (166-192 `createBlankViewInViewpoint`, 201-310 `createViewInWorkbench`)
- `components/editor-v2/viewpoint/ir/irDemoFixture.ts` (12, 103-111)
- `redux/VersionFixer.tsx` (849-892, 1232-1233)

**Lettura del campo**
- `components/editors/views/data/GenericNodeData.tsx` (16-47)
- `components/editors/views/data/FieldData.tsx` (14-38)
- `components/editors/views/NestedView.tsx` (87-98, 129, 233-234, 292-304, 334, 355-356)
- `redux/selectors/selectors.ts` (356-373, commenti 450, 479, 550)
- `components/forEndUser/Tree.tsx` (238-239)
- `components/editors/views/data/edgeCandidate.ts` (6, 87)
- `components/editors/views/data/InfoData.tsx` (103-127, 272)

**Contesto IR e barra dei tab**
- `components/editors/views/ViewData.tsx` (39-190)
- `components/editor-v2/viewpoint/authoring/irTabs.tsx` (18-70)
- `components/editor-v2/viewpoint/ir/metaclassPin.ts` (9-15, 37, 64, 126)
- `components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (194-207)
- `components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx` (123-136)
- `components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` (195-208)
- `components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` (28-40, 60-108)
- `components/editor-v2/viewpoint/ir/irValidate.ts` (intero, 51 righe)
- `components/editor-v2/viewpoint/ir/irCompile.ts` (225-240)
- `components/editor-v2/viewpoint/ir/irCreationSeed.ts` (intero)
- `components/editor-v2/hooks/useEditorMode.ts` (230-270, 490-515)
- `components/abstract/tabs/ModelTab.tsx` (35-45)
- `components/abstract/tabs/TabDataMaker.tsx` (30-45)

## Findings

### F1. `appliableTo` e `appliableToClasses` sono due campi con destini opposti

Vanno separati in ogni ragionamento successivo. Sono stati trattati come una cosa sola nelle discussioni precedenti e non lo sono.

`appliableToClasses: string[]` (`view.tsx:225`) è **vivo e strutturale nell'IR**. È il secondo anello della catena di risoluzione dell'identità della metaclasse in `metaclassPin.ts:64`: quando una view non ha `authoringMetaclassPins` (perché autorata prima che i pin esistessero), la disambiguazione degli omonimi passa da lì e solo da lì. I tre pannelli di authoring lo leggono direttamente (`VertexAuthoringPanel.tsx:199`, `RowAuthoringPanel.tsx:128`, `EdgeAuthoringPanel.tsx:200`), memoizzando sulla sua serializzazione. `EnableIRPanel.tsx:37` lo usa per seedare `ir.metaclasses`. Anche il matching classico lo usa (`selectors.ts:358-372`, `matchesMetaClassTarget`), come pure `Tree.tsx:238` e `edgeCandidate.ts:87`.

**Non va toccato.** Rimuoverlo o derivarlo romperebbe la disambiguazione degli omonimi su tutte le view autorate prima dei pin, in modo silenzioso: `irResolveCore` salta senza rumore una view che non risolve.

`appliableTo: 'Any'|'Graph'|'GraphVertex'|'Vertex'|'Edge'|'EdgePoint'|'Field'` (`view.tsx:226`) è l'enum che duplica `ir.kind`. È questo il campo in discussione.

### F2. Il renderer vivo non legge mai `appliableTo`

Ricerca su tutto `components/editor-v2/`: nessuna lettura funzionale di `appliableTo`. Le uniche occorrenze non-commento sono due **scritture** in `irDemoFixture.ts:105,111`, deliberate e documentate a `irDemoFixture.ts:12` ("appliableTo/appliableToClasses so switching to the classic editor with this fixture still works").

`EditorV2.tsx` non nomina mai il campo. Il rendering passa da `ir.kind` attraverso `irResolveCore` e `irCompile`.

Questo è il fatto che rende la domanda decidibile: `appliableTo` non è più un discriminatore di rendering, è un residuo letto da superfici periferiche.

### F3. I lettori vivi di `appliableTo` sono quattro, tutti fuori dal rendering

| Lettore | Riga | Cosa fa | Raggiungibile da una view IR? |
|---|---|---|---|
| `GenericNodeData.tsx` | 26 | smista il tab Options in FieldData / EdgeData / NodeData / GraphData | **No.** `ViewData.tsx:105` è un ternario esclusivo: con `ir.kind` autorabile la barra legacy non viene costruita |
| `FieldData.tsx` | 18-38 | legge `appliableTo` per `preferredDisplay` e offre un `Select` che **lo riscrive** | No, stesso motivo |
| `NestedView.tsx` | 96, 302 | lettera dell'icona nell'albero, solo quando `appliableToClasses.length === 0` | Sì, ma è cosmetico |
| `VersionFixer.tsx` | 862, 892 | `if (e.appliableTo !== 'Edge') continue;` filtro di migrazione delle edge view salvate | Sì, gira al caricamento di progetti salvati |

`selectors.ts` lo nomina solo in commenti (450, 479, 550, incluso un todo su `view.appliableTo`); il matching reale usa `appliableToClasses`.

### F4. Scrivere `appliableTo` via L-proxy scrive anche `forceNodeType`

`view.tsx:1698-1712`:

```ts
set_appliableTo(val, c) {
    if (!val) val = 'Any';
    let forceNodeType = c.data.forceNodeType;
    if (forceNodeType !== val) switch(val) { default: forceNodeType = val; }
    TRANSACTION(..., () => {
        if (forceNodeType !== c.data.forceNodeType) SetFieldAction.new(c.data, "forceNodeType", forceNodeType, ...);
        SetFieldAction.new(c.data, "appliableTo", val, ...);
    })
}
```

L'accoppiamento è unidirezionale: `set_forceNodeType` (1713-1726) ha il ramo inverso commentato e non riscrive `appliableTo`. `forceNodeType` è documentato a `view.tsx:219` come "used in DefaultNode", cioè il renderer classico, non montato da Fase 5a (`ModelTab.tsx:39`).

Conseguenza pratica: una scrittura derivata via L-proxy porta con sé una seconda `SetFieldAction` su un campo che nessun renderer vivo legge. Scrivere invece direttamente sul D salta l'accoppiamento e lascia `forceNodeType` disallineato.

### F5. Le view nate da `newDefault` hanno `appliableTo` indefinito

`newDefault` (`view.tsx:317-424`) scrive `css`, `palette`, `css_MUST_RECOMPILE`, `oclCondition` e (da R-IRN-4) `ir`. **Non scrive mai** `appliableTo` né `appliableToClasses`.

`joiner/classes.ts:1100` mette `'Any'` al costruttore, quindi il campo non è tecnicamente undefined, ma cade nel ramo `case undefined: case 'Any':` di `GenericNodeData.tsx:32`, che monta tutti i sotto-pannelli insieme.

Le view nate da `createViewInWorkbench` invece lo scrivono (`'Vertex'`, `'Graph'`, `'GraphVertex'` secondo il ramo).

Quindi la divergenza fra i due gesti di creazione non è solo sul seed IR: è anche su questo campo.

### F6. Il gate `EnableIRPanel` non è più raggiungibile dalle view seedate

`ViewData.tsx:132-152` monta `EnableIRPanel` dentro il tab `IR`, che appartiene alla barra **legacy**. Una view che nasce con `ir` non vede quella barra. Il pannello resta raggiungibile solo dalle view senza `ir`.

Non è un difetto in sé (una view seedata non ha bisogno del gate), ma significa che la strada di ritorno da IR a classico non esiste, e che ogni cambio di kind dovrà per forza vivere dentro i tab IR.

## Dipendenze e rischi

**R1 — `appliableToClasses` non è ritirabile.** Vedi F1. Qualunque prompt di implementazione deve dichiarare esplicitamente che il campo resta intatto, altrimenti il rischio è che venga assimilato a `appliableTo` per somiglianza di nome. È la classe di errore che CLAUDE.md chiama collisione silenziosa: nessun errore di compilazione, difetto visibile solo su progetti vecchi con metamodelli omonimi.

**R2 — VersionFixer legge dati salvati.** Le due righe `862` e `892` filtrano le edge view per `appliableTo === 'Edge'`. Un ritiro del campo (o una sua derivazione che cambi i valori storici) cambia il comportamento di migrazioni che girano su progetti già sul disco degli utenti. `irValidate.ts:16-19` nota che le edge view salvate non hanno un VersionFixer proprio: il margine di recupero è nullo.

**R3 — Secondo writer latente in `FieldData.tsx:33-38`.** C'è un `Select` legato a `field={'appliableTo'}` con setter esplicito. Oggi è irraggiungibile dalle view IR, ma se il tab Options venisse reintrodotto per le view IR (punto 4 della discussione) tornerebbe a essere un writer concorrente. Va rimosso o reso read-only nello stesso intervento che rende `ir.kind` writer unico, non dopo.

**R4 — `set_appliableTo` non è idempotente rispetto a `forceNodeType`.** Vedi F4. La scelta fra scrittura L-proxy e scrittura D va fatta consapevolmente e documentata, non lasciata al caso del call site.

**R5 — `NestedView.tsx` sembra non montato.** Nessun uso JSX fuori dal file stesso; l'import in `Dock.tsx:21` è commentato; `TabDataMaker.tsx:36-39` lo cita come host del pannello Viewpoints ma non lo costruisce. Se davvero è morto, due dei quattro lettori di F3 cadono. Non ho rimosso nulla e non concludo che sia dead code: CLAUDE.md vieta di trattare come inutilizzato ciò che sembra tale.

## Conclusione tecnica

`appliableTo` **non va ritirato, va derivato in scrittura da `ir.kind`**.

Il ritiro romperebbe R2 (migrazioni su dati salvati) e degraderebbe le icone dell'albero, in cambio di nulla: il campo non costa nulla a nessun percorso caldo, perché il renderer non lo legge (F2).

La derivazione costa una riga per ogni scrittura di kind e mantiene coerenti i lettori periferici. Mappatura proposta:

| `ir.kind` | `appliableTo` |
|---|---|
| `vertex` | `'Vertex'` |
| `edge` | `'Edge'` |
| `row` | `'Field'` (da confermare, vedi Q2) |

La derivazione va scritta **nella stessa transazione** della scrittura di `ir`, come già fa il seed di creazione, che scrive `ir` dentro la callback di `new2` eseguita da `Constructors.end()` prima della persist.

## Domande aperte per Alfonso

**Q1 — Chi scrive la derivazione?** Due opzioni: (a) dentro `set_ir` in `view.tsx`, così ogni scrittura di `ir` allinea `appliableTo` ovunque avvenga, incluso il seed di creazione e le scritture dei pannelli; (b) nei singoli call site che cambiano kind. La (a) è single-writer vero e copre anche i pannelli di authoring, ma tocca il core del L-proxy. La (b) è più contenuta ma lascia la coerenza alla disciplina dei call site. Propendo per (a), con go-ahead esplicito perché è core.

**Q2 — `row` mappa davvero su `'Field'`?** È l'analogo legacy più vicino (`redux/defaults/views.ts` usa `'Field'` per attributi, reference, operazioni, parametri, literal), ma una riga IR non è un DAttribute: è una riga di compartimento dentro un vertex. Se `'Field'` non è corretto, l'alternativa è lasciare `'Any'` per il kind row e accettare che `GenericNodeData` monti tutto, dato che comunque non è raggiungibile.

**Q3 — `NestedView` è ancora montato?** Serve una conferma visiva: apri il pannello Viewpoints a destra e dimmi se le righe delle view mostrano l'icona con la lettera del tipo. Se sì è vivo e la derivazione lo serve; se no, R5 si chiude e i lettori vivi scendono a due.

**Q4 — Il `Select` di `FieldData.tsx:33-38` va rimosso ora o quando si riapre Options?** Rimuoverlo ora è un intervento su un file legacy fuori dallo scope IR; lasciarlo è un writer latente documentato. Propendo per lasciarlo e annotarlo, rimuovendolo nell'intervento su Options.

## Prossimo passo proposto

Con le risposte a Q1 e Q2 il prompt Claude Code è scrivibile e resta piccolo: derivazione in un solo punto, nessun rinominamento, nessun file legacy toccato. Il selettore di kind e lo stash per-kind vengono dopo, come slice separate.
