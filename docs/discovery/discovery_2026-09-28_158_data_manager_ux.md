# Discovery 2026-09-28 — #158, UX del Data Manager (navigazione, pannelli, riferimenti)

- **Prompt-ID**: nessuno — prompt in chat di Juri (2026-09-28): «fai un branch per risolvere la issue #158. Pianifica e risolve in dettaglio i punti evidenziati sulla issue». Nessun file di prompt.
- **Sessione**: `ea12e59f-6368-4419-af86-c2ff32b06257`
- **Albero**: `/Users/juridirocco/development/jjodel`, branch `feat/158-data-manager-ux` creato da `alfonso-frontend-jjtl` @ `db1aea725`
- **Esecutore**: Anthropic Claude Opus 5.5 (`claude-opus-5-5`)
- **Lane**: full (RC-3: più di 3 file)

Questo referto è un insieme di ipotesi con evidenze, non un riferimento definitivo. Chi lo usa a valle rilegge i file reali.

## 1. Obiettivo

La issue #158 (autore @tmaog, lo stesso field-test della #157) elenca cinque punti, tutti sul **Data Manager** (`InstanceManagerTab`): i sette screenshot allegati mostrano la vista Outline di un modello M1 (`elena_usecase_scenario`), colonne MODEL OUTLINE / METACLASSES / tabella / form. Obiettivo: localizzare ogni punto nel codice, falsificarne la causa e fissare il piano della Fase 2.

| # | Titolo della issue | Tipo |
|---|---|---|
| P1 | Back navigation after opening a list element | feature |
| P2 | Side panels are not resizable or collapsible | bug |
| P3 | Missing «mappedLearners» list, inconsistent with «mappedCompetencies» | bug |
| P4 | Show key information of the selected element in selection fields | feature |
| P5 | The panel/graph of the selected element cannot be collapsed | bug |

## 2. File letti

- `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` (3355 righe, per intero)
- `frontend/src/components/abstract/tabs/instanceManagerTab.scss` (righe 1-420 e le regole dei pannelli)
- `frontend/src/components/abstract/tabs/instanceTable.ts` (intestazione, `tableColumns`, `orderColumns`, `tableRow`)
- `frontend/src/components/abstract/tabs/instanceManagerModel.ts` (righe 1-60)
- `frontend/src/components/abstract/tabs/__tests__/instanceManagerFl6.test.ts` (righe 1-135), `instanceManager10c.test.ts` (375-400), `instanceManager10h.test.ts` (grep)
- `frontend/src/jjform/nav.ts` (per intero), `frontend/src/jjform/index.ts` (150-185), `frontend/src/jjform/shape.ts` (tipi)
- `frontend/src/components/editor-v2/viewpoint/ir/widgets/ReferenceWidget.tsx` (per intero)
- `frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts` (380-445), `formHosts.ts` (per intero), `tableViews.ts` (per intero), `irResolveCore.ts` (270-326), `irReadCtx.ts` (`makeDrawReadCtx`), `irTypes.ts` (`TableSpec`, `FormSpec.basic`)
- `frontend/src/components/ResizeHandle/ResizeHandle.tsx` e `resize-handle.scss` (per intero)
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (900-960, montaggio del `ResizeHandle`)
- Issue #158 via `gh issue view 158 --json` (exit 0) e i 7 allegati scaricati (PNG, 918-3421 px di larghezza)

## 3. Ipotesi e verdetti

### H1 — Da un drill-in si torna indietro solo dal breadcrumb (P1). **Regge.**

Letto. Il drill-in sostituisce il corpo della form (`nav`), e la sola uscita resa è il breadcrumb, che compare solo da due passi in su:

- `InstanceManagerTab.tsx:3046` — `{crumbs.length > 1 && (`
- `InstanceManagerTab.tsx:3209` — `onClick={() => drillTo(targetId, slot.ref.key)}` (il link di un riferimento, lo scenario dello screenshot 1: «CompetencyGoal_0 > D01»)

Il puro che fa «su di un livello» esiste già ed è testato, ma nessuna superficie lo chiama:

- `jjform/nav.ts:137` — `export function drillOut(nav: NavState): NavState {`
- `grep -rn drillOut` su `frontend/src` (ts/tsx): 5 righe, tutte in `nav.ts`, `index.ts` (export) e `nav.test.ts`. Il controllo positivo è la definizione stessa, trovata dalla stessa ricerca.

Osservazione a margine, non nel perimetro: durante un drill-in la testata della form continua a nominare la riga (`InstanceManagerTab.tsx:3093` — `{ego?.subject.name || ...}`) e il suo Delete cancella la riga, non l'elemento mostrato (`:3113`). Lo screenshot 1 lo mostra («CompetencyGoal_0» sopra un corpo che è D01). Registrato, non toccato.

### H2 — I pannelli laterali hanno larghezza fissa, e solo l'outline si nasconde (P2). **Regge.**

Letto.

- `instanceManagerTab.scss:65` — `&__pane--outline { flex: 0 0 300px; padding: 14px 0; }`
- `instanceManagerTab.scss:66` — `&__pane--classes { flex: 0 0 200px; }`
- `InstanceManagerTab.tsx:1375` — `const [showOutline, setShowOutline] = useState(true);` — l'outline si chiude solo dalla voce VIEWS › Outline, dentro il pannello Metaclasses; il pannello Metaclasses (`:2305`) non ha nessun controllo di chiusura.

Le due larghezze sono fissate anche dai test (`instanceManager10h.test.ts:92-93`), quindi restano come **default**; la larghezza scelta dall'utente va applicata sopra, inline.

Esiste già il divisore del design system: `components/ResizeHandle/ResizeHandle.tsx:44` (`export const ResizeHandle`), grip-pill, tastiera (`onResizeBy`), readout, già montato verticale in `PropertiesWithTreeView.tsx:921`. Si riusa, nessun componente nuovo.

Vincolo di montaggio: i separatori fra i pannelli sono UNA regola di adiacenza (`&__pane { + .instance-manager__pane, + .instance-manager__main { border-left } }`, scss:58-59, asserita da 10h). Un divisore messo come fratello fra due pannelli spezzerebbe l'adiacenza e toglierebbe i bordi. Per questo il divisore si posiziona in **overlay** sulla radice, all'ascissa del confine, fuori dal flusso flex.

### H3 — La «lista mappedLearners» manca perché `learners` è di un figlio inline, e le sezioni dei riferimenti si rendono solo per il soggetto (P3). **Regge (letto), non riprodotto a runtime.**

Lo screenshot 3 mostra la form di `ElenaScenario` scorsa in basso: dentro la cornice del figlio inline c'è «IDENTITY name Phase_0», poi REFERENCES `goal`, `teacher`, `learners` (chip Antonio, Anita), poi CHILDREN; dopo la cornice la barra «pathway Phase [1/1]» (`childSlots` del soggetto). `learners` è quindi una feature di **Phase**, non di Scenario. Nello screenshot 4 invece `mappedCompetencies` è del soggetto (CompetencyGoal_0), e sotto la form compare la sezione «MAPPEDCOMPETENCIES Competency [12/*]» con i link.

Il codice lo spiega: le sezioni dei riferimenti sono calcolate sul solo soggetto della form.

- `InstanceManagerTab.tsx:2065` — `const refSlots = useMemo(() => {` … `const targets = childrenIn(idlookup, formSubjectId, ref.key);`
- `InstanceManagerTab.tsx:3156` — il figlio inline monta solo la sua form: `<IRForm objectId={childId} host="manager" />`, e nient'altro dopo.

Non riprodotto: il progetto `elena_usecase_scenario` non è nel repo (`docs/discovery/andrea.json`, non tracciato, è un log di telemetria, non un progetto). La verifica a runtime è un passo della checklist visiva (§6).

### H4 — Il campo di selezione mostra solo badge e nome del target (P4). **Regge.**

Letto. `ReferenceWidget.tsx:141` — `<span className="ir-ref__name">{name}</span>`, preceduto dal solo badge della metaclasse; nessun altro dato del target.

Dove si configura «quali attributi mostrare»: la issue suggerisce un flag nel metamodello. Un campo nuovo su `DAttribute` è un core change (Regola 5), tocca D-layer e persistenza (Regola 20). Esiste già un meccanismo che dice «questi sono i campi essenziali della metaclasse», editabile oggi dall'authoring della vista (`FormAuthoringBody.tsx:195-258`):

- `irTypes.ts:319` — `basic?: string[];` («Feature names visible in Basic. Absent = heuristic `lowerBound >= 1`»)
- `useFormWidgets.ts:399-400` — `if (Array.isArray(declared)) return declared.includes(field.name);` / `return field.isRequired;`

È la stessa lista del toggle Basic/Advanced degli screenshot 1-4.

Vincolo: `ReferenceWidget`, `ChipInputWidget`, `ListWidget` e `IRFormField` stanno in `editor-v2/viewpoint/ir/`, critical zone (CLAUDE.md §3.1), e li montano anche il rail e il canvas. Un riassunto DENTRO il campo è una modifica di critical zone: richiede go-ahead esplicito e Layer Impact Report (P5, RC-26). La Fase 2 lo tiene fuori e lo porta come decisione in attesa (§7).

### H5 — Il vicinato è sempre aperto sulla riga selezionata (P5). **Regge.**

Letto. `InstanceManagerTab.tsx:2857` — `const isExpanded = row.id === subjectId;`, e il chevron è un indicatore senza click (`:2926-2932`). I test lo fissano come regola di design (FL6): `instanceManagerFl6.test.ts:75` — `expect(TSX).toContain('const isExpanded = row.id === subjectId;');` e `:109` — `expect(cell.slice(0, end)).not.toContain('onClick');`.

La issue chiede proprio di cambiare questo comportamento. Il principio del test (una sola riga espansa, nessuno stato per riga) si conserva: l'espansione resta derivata dalla selezione, con in AND un solo interruttore di vista a livello di tab, come `showOutline`. Il test cambia per dirlo.

## 4. Misure di baseline (questa sessione, HEAD `db1aea725`)

- `npx tsc --noEmit` (output completo): exit 2, **14** errori, l'insieme di CLAUDE.md §17 per file e codice.
- `npx vitest run src/components/abstract/tabs src/jjform`: exit 0, 27 file, **776** test passati.

## 5. Piano della Fase 2

Un commit di codice per punto (§6.2), sullo stesso branch.

| Commit | Punto | Cosa cambia |
|---|---|---|
| C1 | P1 | Bottone «Back» in testa alla riga del breadcrumb, che chiama `drillOut` (il puro esistente); riga del breadcrumb `sticky` in cima al pannello della form, così resta raggiungibile mentre si scorre; al Back la posizione di scorrimento del livello a cui si torna viene ripristinata (si torna «alla lista» da cui si era partiti). |
| C2 | P2 | Pulsante di chiusura nella testata di Outline e Metaclasses; un pannello chiuso diventa una barra di 32px con il pulsante per riaprirlo e l'etichetta verticale. Outline riusa lo stato esistente `showOutline` (VIEWS › Outline e la barra agiscono sullo stesso stato). Due `ResizeHandle` verticali in overlay sui confini, trascinabili e da tastiera, larghezza limitata a un intervallo, doppio click = default. Stato di sessione del tab, nessun `localStorage` (R-RAIL-11). |
| C3 | P3 | Le sezioni dei riferimenti (link al target, «New … & link») si rendono anche per ogni figlio inline, sotto la sua form; il drill-in da quel link passa per il figlio, così il breadcrumb dice la strada vera (Scenario › Phase_0 › Antonio). |
| C4 | P4 | Sotto ogni target elencato nelle sezioni dei riferimenti, una riga con le informazioni chiave: i campi **Basic** del target (dichiarati dall'autore nella vista del Data Manager, altrimenti gli obbligatori), valori non vuoti, al più 3; se l'euristica non trova nulla, i primi attributi valorizzati. Funzione pura nuova in `instanceTable.ts`, con test. Il `formSpec` del target si risolve in lettura con `resolveIRView` sul viewpoint del Data Manager, come già fa il tab per le colonne. |
| C5 | P5 | Il chevron diventa un controllo: sulla riga selezionata chiude/riapre il vicinato, su un'altra riga la seleziona e lo apre; «hide» nella testata del vicinato. L'interruttore è uno solo e resta fra una selezione e l'altra. Aggiornati i due asserti di FL6. |

**File** (5 di codice, dichiarati prima, RC-11):

1. `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` — C1-C5
2. `frontend/src/components/abstract/tabs/instanceManagerTab.scss` — C1, C2, C3, C4, C5
3. `frontend/src/components/abstract/tabs/instanceTable.ts` — C4 (funzione pura `referenceSummary`)
4. `frontend/src/components/abstract/tabs/__tests__/instanceTable.test.ts` — C4 (test della funzione)
5. `frontend/src/components/abstract/tabs/__tests__/instanceManagerFl6.test.ts` — C5 (due asserti)

Docs, in commit separati (P13): questo referto, la entry nell'inbox di corsia.

**Layer Impact Report**: non richiesto. Nessun file di §3.2; nessuna scrittura D-layer nuova (il «New & link» di un figlio inline usa lo stesso `appendValue` del soggetto). I moduli di `viewpoint/ir/` sono solo **letti** (`resolveIRView`, `resolveFormSpec`), come il tab già fa con `resolveTableSpec`.

## 6. Checklist visiva per la verifica (RC-23)

Fixture: un modello con una metaclasse A che ha un riferimento multiplo a B e un figlio contenuto C, che a sua volta ha un riferimento multiplo a D (lo schema di `CompetencyGoal.mappedCompetencies` e di `Scenario.pathway: Phase.learners`).

1. Selezionare una A, cliccare un target nella sezione del riferimento: compaiono breadcrumb e «Back»; «Back» riporta alla form di A con la sezione nella stessa posizione di scorrimento.
2. Chiudere Outline e Metaclasses dai loro pulsanti: restano due barre da 32px; riaprirle dalle barre. VIEWS › Outline apre e chiude la stessa barra.
3. Trascinare i due confini: la larghezza cambia entro i limiti; frecce sinistra/destra col divisore a fuoco; doppio click torna a 300/200.
4. Selezionare una A che contiene una C: sotto la form inline di C c'è la sezione del riferimento a D, con i link.
5. Sotto ogni link di target c'è la riga delle informazioni chiave; dichiarando `basic` sulla vista del target nel Data Manager, la riga segue la dichiarazione.
6. Chevron della riga selezionata: il vicinato si chiude e resta chiuso selezionando un'altra riga; il chevron di una riga lo riapre; «hide» nella testata lo chiude.
7. Tema chiaro e scuro, console senza errori.

## 7. Decisioni

**Prese (unattended, RC-25):**

1. Base del branch: `alfonso-frontend-jjtl` (il tronco), non `feat/157-environment-config`: la #158 non dipende dal codice #157.
2. P4 senza flag nel metamodello: la configurazione è `FormSpec.basic`, già editabile; nessun core change.
3. P4 fuori dalla critical zone: il riassunto sta nell'host (sezioni dei riferimenti del tab), non dentro il campo.
4. P2: larghezze e chiusure sono stato di sessione del tab, non preferenze persistite.
5. P5: un solo interruttore di vista per il tab, persistente fra le selezioni; nessuno stato di espansione per riga.

**In attesa (lista RC-26):**

1. P4 dentro il campo: una riga di riassunto sotto `ReferenceWidget` / chip di `ChipInputWidget`, per l'host `manager`. È critical zone (`viewpoint/ir/`): serve go-ahead e Layer Impact Report.

## 8. Domande aperte

1. La testata della form deve nominare l'elemento mostrato durante un drill-in (e il suo Delete cancellarlo), invece della riga? (H1, osservazione)
2. P4 dentro il campo (decisione in attesa 1): go-ahead per la corsia di critical zone?
