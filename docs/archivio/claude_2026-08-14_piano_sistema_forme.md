# Piano: sistema forme per nodi (view layer)

**Data**: 2026-08-14
**Stato**: proposta architetturale, non ratificata
**Decisione presa in chat**: registry a codice (non forme definibili dall'utente nel viewpoint, almeno non in questo arco)

---

## 1. Il problema

Il catalogo attuale (rettangolo, rounded, circle) è insufficiente su quattro assi
distinti, e i quattro assi si risolvono a livelli diversi dello stack. Trattarli
come un unico problema ("aggiungiamo forme") produce un enum che cresce e un
motore che sa troppe cose sulle forme che disegna.

| Gap | Livello che lo risolve |
|-----|------------------------|
| Forme assenti dal catalogo | `ShapePrimitive` (dati, non codice del motore) |
| Espressività del modello (labelBox, ornamenti, contenitori, ancore) | `ShapeDescriptor.caps` + contratto |
| Modificatori ortogonali (bordo, fill, stack, badge) | `Modifier`, separato in geometrico e di stile |
| Composizione (header band, compartimenti, porte) | `Composite`: un nodo è una lista ordinata di part |

---

## 2. Il modello a quattro livelli

### 2.1 Contour

L'unica struttura che il motore consuma.

```ts
interface Contour {
  poly: Point[];        // contorno campionato in coordinate locali, centro in (0,0)
  d?: string;           // path esatto per il rendering, quando esiste
  convex: boolean;
}
```

Ancore, hit-testing, clipping dei figli e intersezione arco/nodo girano su
`Contour` e su nient'altro. Da qui in avanti il motore non sa più se sta
disegnando un esagono o una nuvola.

### 2.2 ShapePrimitive

```ts
interface ShapeDescriptor {
  id: string;
  family: 'superellipse' | 'polygon' | 'shearRect' | 'pathTemplate';
  outline(w: number, h: number, p: ShapeParams): Contour;
  labelBox(w: number, h: number, p: ShapeParams): Rect;
  ornaments?(w: number, h: number, p: ShapeParams): string[];
  caps: {
    convex: boolean;
    container: boolean;
    compartments: boolean;
    anchor: 'radial' | 'sides' | 'ports';
  };
}
```

`pathTemplate` è la quarta famiglia e assorbe tutto ciò che i tre generatori
parametrici non producono: cilindro, folder, nota con angolo piegato, chevron,
nuvola. Non è un caso speciale nel motore, è un descriptor come gli altri che
campiona il proprio path per ottenere `poly`.

`labelBox` è la novità che oggi manca del tutto: il rombo ha un contorno grande
e un'area utile piccola, e nessuno nel sistema lo sa.

### 2.3 Modifier

Due categorie, e la distinzione è load-bearing.

**GeometricModifier**: trasforma il `Contour`. Shear, taper, rotazione, raggio
d'angolo. Le ancore si spostano di conseguenza, ed è corretto che lo facciano.

**StyleModifier**: non tocca il `Contour`. Bordo tratteggiato o doppio, fill
hatch, ombra, stack per molteplicità, badge d'angolo. Lo stack disegna due copie
offset ma le ancore restano quelle della copia in primo piano; se lo stack
entrasse nel contorno, gli archi si aggancerebbero all'ombra.

### 2.4 Composite

```ts
interface NodeAppearance {
  parts: Array<{ shape: ShapeRef; region: Region; modifiers?: Modifier[] }>;
  hull: number;   // indice della part che definisce ancore e hit-testing
}
```

`Region` copre `full`, `headerBand`, `bodyBox`, `cornerBadge`, `portRing`.

**Invariante non negoziabile**: una sola part è l'hull. Senza questa regola la
composizione fa esplodere l'ancoraggio, perché ogni part rivendica un contorno e
non esiste più una risposta unica a "dove attacco questo arco".

---

## 3. Invarianti

- **I1**. Il motore consuma solo `Contour`. Nessun ramo `if (shape === 'circle')`
  fuori dai descriptor.
- **I2**. Una sola part è l'hull.
- **I3**. Gli `StyleModifier` non alterano il `Contour`.
- **I4**. `caps.container === false` vieta i figli a monte (in authoring), non a
  valle con un clip silenzioso.
- **I5**. Ogni forma non convessa dichiara esplicitamente la propria
  `anchorPolicy`. Sul chevron il raggio dal centro interseca il bordo più volte e
  "prendo la più vicina" è una scelta, non l'unica corretta.

---

## 4. Fasi

**Fase 0. Discovery read-only.** Mappare dove nasce oggi la forma di un nodo e
chi consuma la sua geometria. Report obbligatorio in `docs/discovery/`. Hard stop.

**Fase 1. Contratto e motore, zero cambi visivi.** Nuovo modulo
`components/editor-v2/shapes/`: `types.ts`, `contour.ts` (campionamento,
`anchorFromContour`, hit-test), `registry.ts`. Nessun consumatore ancora
collegato. Test unitari sul contorno e sulle ancore.

**Fase 2. Le quattro famiglie + migrazione delle tre forme esistenti al registry.**
Requisito di uscita: rendering byte-identico sulle view esistenti. È il gate di
regressione dell'intero arco. Tocca la critical zone, quindi Layer Impact Report
obbligatorio.

**Fase 3. Modificatori.** Separazione geometrico/stile, stack, tratteggio, hatch,
badge.

**Fase 4. Composizione.** Part list, regola dell'hull, `labelBox` e `contentBox`.
Qui entrano header band e compartimenti.

**Fase 5. Catalogo esteso ed esposizione nel view DSL.** Stadio, esagono, rombo,
cilindro, folder, nota, chevron. Authoring panel. Migrazione `VersionFixer` se il
`jsxString` cambia forma (CLAUDE.md regola 14 e §3.9).

---

## 5. Rischi

**Intreccio con il bug di ordinamento delle ancore.** Esiste una discovery aperta
(`docs/discovery/2026-05-27_anchor_ordering_inversion.md`). La Fase 2 cambia la
*sorgente* della geometria, non la *politica di ordinamento*. Tenere le due cose
separate, altrimenti nessuno dei due lavori è più verificabile.

**`portDistribution.ts` e `handlePosition.ts` sono critical zone.** CLAUDE.md
§3.10 nota già che `nodeHandles` è scartato da `EditorV2.tsx`. Prima di collegare
`anchorFromContour` a qualunque cosa, la Fase 0 deve stabilire quale output è
effettivamente consumato.

**Migrazione `jsxString`.** Qualunque tocco a `DV.tsx` o
`defaultViewTemplate.ts` senza migrazione `VersionFixer` funziona in dev sui
progetti nuovi e rompe ogni progetto salvato.

---

## 6. Non-goals di questo arco

- Forme definibili dall'utente dentro il viewpoint (rinviato a contratto stabile).
- Riscrittura della politica di ordinamento delle ancore.
- Layout automatico o routing degli archi.
- Ornamenti animati o morphing tra forme (il generatore lo consente, la priorità no).
