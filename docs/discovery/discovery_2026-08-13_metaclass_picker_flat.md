# Discovery 2026-08-13: il picker delle metaclassi e' flat e deduplicato per nome

Fase 1 read-only. Nessun file modificato oltre a questo report.

## Obiettivo

Segnalazione: nella tab "Applied To" il dropdown delle metaclassi e' flat; tutte le
metaclassi del progetto sono elencate insieme, senza dire da quale metamodello vengono,
con ambiguita' quando due metamodelli dichiarano una classe con lo stesso nome.
Ipotesi di miglioria proposte: raggruppare le voci per metamodello, oppure due select in
cascata (metamodello, poi metaclasse).

Capire quale superficie e' quella flat, da dove vengono le opzioni, cosa viene scritto
nel modello e come il runtime usa quel dato.

## File letti

- `frontend/src/components/editors/views/data/InfoData.tsx` (tab classica "Apply to")
- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/ir/metaclassPin.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts`
- `frontend/src/components/ui/Select/Select.tsx`
- `frontend/src/components/ui/PredicateBuilder/PredicateBuilder.tsx`

## Findings

### 1. Le superfici "Applies to" sono due, e solo una e' flat

**Tab classica** (`InfoData.tsx`, campo "Applicable to" su `appliableToClasses`):
gia' gerarchica. Le opzioni sono costruite in gruppi `Classes from <nome metamodello>`
e ogni voce ha label `<metamodello>.<classe>`; il valore scritto e' il **pointer** della
DClass. Qui il problema non c'e'.

**Tab "Applies to" dei pannelli IR** (`irTabs.tsx` id `ir-applies-to`): e' questa la
flat. Il picker vive in tre copie quasi identiche:

| File | Riga del Select | Sorgente opzioni |
|------|-----------------|------------------|
| `MatchingSection.tsx` (vertex) | 103 | `available` da prop `classNames` |
| `EdgeAuthoringPanel.tsx` | 511 | `available` da `classNames` locale |
| `RowAuthoringPanel.tsx` | ~313 | `available` da `classNames` locale |

In tutte e tre: `options={available.map(n => ({ value: n, label: n }))}`.

### 2. Le opzioni non sono solo flat: sono deduplicate per nome

`classNames` e' costruito allo stesso modo nei tre pannelli
(`VertexAuthoringPanel.tsx:222`, `RowAuthoringPanel.tsx:203`, `EdgeAuthoringPanel.tsx:332`):

```ts
const names = new Set<string>();
for (const mm of metamodels) for (const c of info.allClasses) names.add(c.name);
return Array.from(names);
```

Due metamodelli che dichiarano `Person` producono **una sola voce** nel dropdown. La
collisione non e' visibile come doppione: e' invisibile, e la voce che resta e' quella
del primo metamodello in ordine di iterazione. Il caso peggiore non e' "due voci uguali",
e' "una voce che non dice a quale delle due classi si riferisce".

Nota: la stessa `classNames` alimenta anche il selettore `isKind` del `PredicateBuilder`
(`PredicateBuilder.tsx:249`), dove una lista di soli nomi deduplicati e' semanticamente
corretta. Il picker delle metaclassi e il selettore `isKind` vogliono liste diverse: la
prima va sdoppiata, la seconda no.

### 3. Cosa viene scritto: nomi, non identita'

`ir.metaclasses` e' `string[] | '*'`, e sono **nomi**. L'identita' esatta esiste ma sta
altrove: `ir.authoringMetaclassPins`, mappa nome -> id di classe, riconciliata da
`withMetaclassPins` nella stessa patch che muove `metaclasses` (`metaclassPin.ts`).

La catena di risoluzione (`resolveMetaclassId`) e' a tre passi: pin, poi
`appliableToClasses` della view (identita' legacy), poi prima classe con quel nome nel
progetto. Il pin serve al **layer di authoring** (feature set del PathBuilder), non alla
risoluzione runtime; l'intestazione di `metaclassPin.ts` lo dichiara esplicitamente.

Esiste gia' un avviso di ambiguita' attiva: `VertexAuthoringPanel.tsx` mostra
`metaclassAmbiguityWarning` quando `metamodelsWithClass > 1`. Segnala il problema, non lo
risolve.

### 4. Il matching a runtime e' per nome (questo e' il punto che conta)

`irResolveCore.ts:100-190` indicizza le view per nome di metaclasse:

```ts
for (const mc of ir.metaclasses ?? []) {
    const arr = byMetaclass.get(mc) ?? [];
    arr.push(entry);
    byMetaclass.set(mc, arr);
}
```

Quattro indici (`byMetaclass`, `edgeByMetaclass`, `objectAsEdgeByMetaclass`,
`rowByMetaclass`), tutti chiavati sul nome. Conseguenza: una view che dichiara `Person`
si applica alle istanze di **qualunque** classe chiamata `Person` nel progetto, e il pin
non entra nella decisione.

Quindi la miglioria richiesta, presa alla lettera, e' una miglioria di **authoring**:
rende esplicito quale classe stai scegliendo e mette il pin giusto (feature del
PathBuilder corrette). Non cambia a quali istanze la view si applica. Un picker che
distingue `A.Person` da `B.Person` mentre il resolver le tratta come la stessa cosa e'
onesto solo se lo dice, o se il resolver viene allineato.

### 5. Vincolo tecnico sul componente Select

`components/ui/Select/Select.tsx` accetta solo `SelectOption[]` piatto: nessun supporto
`optgroup`. Il raggruppamento in una sola select richiede un'estensione additiva del
componente del design system (usato anche altrove); la cascata a due select non tocca
nulla di condiviso.

Per confronto, la tab classica usa un altro componente (`Select` di `joiner`, con
`jjSelect`) che i gruppi li supporta gia'.

## Opzioni

**A. Cascata metamodello + metaclasse.** Nessuna modifica al design system. Due controlli
anche quando il progetto ha un solo metamodello, a meno di nasconderlo in quel caso
(regola in piu' da mantenere).

**B. Select unica con optgroup per metamodello.** Una sola interazione, coerente con la
tab classica che gia' raggruppa cosi'. Costo: `options` di `ui/Select` diventa
`SelectOption[] | SelectOptionGroup[]` (allargamento retrocompatibile, i chiamanti
esistenti non cambiano). Tocca un componente condiviso.

Comune ad entrambe: sdoppiare la lista deduplicata (usare i `MetaclassRef` con id, gia'
calcolati come `allClasses` nei tre pannelli), qualificare le chip selezionate con il
nome del metamodello quando il nome e' ambiguo, e passare la nuova lista alle tre copie
del picker (o estrarne una sola, che pero' e' refactoring e va deciso a parte).

**C. Allineare il matching all'identita'.** Il resolver, avendo l'id della classe
dell'istanza, potrebbe preferire le entry il cui pin per quel nome coincide, lasciando il
match per nome alle view senza pin (retrocompatibile). E' un intervento sull'indice IR:
arco separato, con test.

## Rischi

- R1. Il picker esiste in tre copie: un fix in una sola lascia due tab incoerenti.
- R2. `classNames` e' condivisa con `PredicateBuilder.isKind`: cambiarne il tipo in loco
  toccherebbe una superficie che non ha questo problema.
- R3. Estendere `ui/Select` e' fuori dallo scope di un fix di pannello: va dichiarato.
- R4. Nessun cambiamento qui altera il comportamento a runtime; se l'aspettativa era
  "cosi' le view smettono di applicarsi alla classe sbagliata", l'aspettativa non e'
  soddisfatta senza C.

## Domande aperte per Alfonso

1. A o B per il picker.
2. C entra ora o diventa un arco separato.
3. Le chip selezionate: qualificate sempre con il metamodello, o solo quando il nome e'
   ambiguo.
4. Se si estrae un componente unico per le tre copie del picker, o se si applica lo
   stesso diff tre volte lasciando il refactoring a dopo.

---

## Esito (2026-08-14)

Le quattro domande aperte hanno risposta, ratificata in chat prima della diff.

1. **Picker**: opzione B, select unica con `<optgroup>` per metamodello. `components/ui/Select`
   accetta ora `SelectOption[] | SelectOptionGroup[]`; il ramo piatto resta identico per tutti i
   chiamanti esistenti.
2. **Resolver**: opzione C nello stesso task, in un commit separato. `classAncestry` porta gli id
   accanto ai nomi e `pinAccepts` filtra le entry dell'indice: una view pinnata matcha solo se
   l'antenato che ha chiavato il bucket e' la classe pinnata. Una view senza pin matcha per nome
   come prima.
3. **Chip**: qualificate `MM.Nome` solo quando piu' di un metamodello dichiara quel nome, e la
   qualificazione viene dal pin, non dal primo candidato.
4. **Copie**: stesso diff nelle tre, nessun componente condiviso estratto. Le due funzioni pure
   (`metaclassGroups`, `metaclassChipLabel`) e il tipo `MetaclassChoice` stanno in
   `MatchingSection.tsx` e sono importati dai due pannelli con picker inline: logica in un posto
   solo, JSX ancora tre volte. Il debito di duplicazione del markup resta e non e' stato toccato.

### Scostamento dal perimetro dichiarato

La lista concordata era di nove file, i toccati sono tredici. I quattro in piu':

- `components/ui/Select/index.ts` e `components/ui/index.ts`: export del tipo nuovo.
- `viewpoint/ir/metaclassPin.ts` e il suo test: `withMetaclassPins` ricostruiva la mappa dai pin
  di `prev`, quindi la scelta esplicita fra due omonime veniva persa fra il click e il draft. Ora
  un pin dichiarato su `next` vince.
- `viewpoint/ir/irTypes.ts`: la doc di `AuthoringMetaclassPins` diceva «il resolver non lo legge
  mai», che dopo questo task e' falso; e `GraphVertexViewIR` non dichiarava il campo, che il ramo
  vertex dell'indice ora legge.

### Gate

Container cloud, tarball dell'albero modificato, `npm ci` pulito.

- `npm run typecheck`: 17 errori su output integrale, exit 2, identici alla baseline Linux;
  zero nei tredici file toccati.
- `npx vitest run src/components/editor-v2/viewpoint/`: 9 file, 230 test verdi, i 9 nuovi inclusi.
- `npm run build`: verde, solo il warning chunk-size noto.
- Smoke visivo: da eseguire.

### Debito residuo

- Il markup del picker resta in tre copie.
- I pin scritti prima di oggi possono puntare alla classe sbagliata su progetti gia' ambigui
  (venivano risolti col passo «prima classe con quel nome»): dopo questo task quella view si
  applica solo a quella classe. Serve un progetto con metamodelli omonimi e view IR gia' autorate;
  riselezionare la metaclasse nel picker nuovo lo sana. Nessuna migration prevista.
