# Discovery — arco 2, passo 1, Fase 1: identity block e palette entity

**Data**: 2026-08-11 · **HEAD alla lettura**: `b80e713d3` · **Sola lettura sul codice**

Prima discovery sotto **R-RAIL-28**: ogni affermazione di assenza porta accanto il proprio
controllo positivo, con il risultato del controllo.

## 0. Obiettivo

Mettere Alfonso in condizione di decidere quale palette entity vince, dicendo cosa costa
ciascuna delle due direzioni. La discovery **non decide**. In più: descrivere lo stato di
`PropertiesHeader` e i vincoli che la Fase 2 troverà.

## 1. File letti

- `frontend/src/styles/components/_form-system.scss` `:1236-1262`
- `frontend/src/components/editors/views/nestedView.scss` `:3650-3720`
- `frontend/src/components/editors/properties-with-tree-view.scss` `:336`, `:364-375`, `:917`, `:1407-1413`
- `frontend/src/common/entityMeta.ts` (270 righe, letto per intero)
- `frontend/src/styles/tokens/_colors-light.scss` e `_colors-dark.scss`, blocco `--color-entity-*`
- `frontend/src/components/editors/Info.tsx` `:847-903`, `:1284`
- `frontend/src/components/editors/info-improvements.scss` `:816`, `:865-903`
- `frontend/src/constants/documentTypes.ts` `:1-70` · `frontend/src/pages/components/Navbar.tsx:290`
- `frontend/src/components/common/ElementBadge.tsx` · `frontend/src/styles/style.scss:2`
- `CLAUDE.md` §3.1, §7.2, §19.5

## 2. Le due palette affiancate (punto 1)

Sorgente pannello: `_form-system.scss:1251-1259`, nove modificatori a esadecimali inline, più
due in `nestedView.scss:3709-3710`. Sorgente tree: `entityMeta.ts` (campi `badgeBg`/`badgeText`),
replicata come token `--color-entity-*` in `_colors-light.scss:332-351`.

| kind | pannello bg / fg | tree bg / fg | esito |
|---|---|---|---|
| metamodel | `#f1f5f9` / `#475569` | `#EEEDFE` / `#534AB7` | diverse (slate vs violetto) |
| model | `#dbeafe` / `#1e40af` | `#FAEEDA` / `#854F0B` | diverse (blu vs ambra) |
| package | `#f1f5f9` / `#475569` | `#DBEAFE` / `#2563EB` | diverse (slate vs blu) |
| class | `#e0f2fe` / `#0369a1` | `#FEE2E2` / `#DC2626` | diverse (sky vs rosso) |
| attribute | `#fef3c7` / `#92400e` | `#D1FAE5` / `#059669` | **invertito con enum** |
| enum | `#d1fae5` / `#065f46` | `#FEF3C7` / `#D97706` | **invertito con attribute** |
| reference | `#fce7f3` / `#9d174d` | `#CFFAFE` / `#0891B2` | diverse (rosa vs ciano) |
| operation | `#ede9fe` / `#6d28d9` | `#E0E7FF` / `#4F46E5` | diverse (violetto vs indaco) |
| literal / enumLiteral | `#e0e7ff` / `#3730a3` | `#F3F4F6` / `#6B7280` | diverse (indaco vs grigio) |
| viewpoint | `rgba(139,92,246,.1)` / `#8b5cf6` | `#FCE7F3` / `#DB2777` | diverse (violetto vs rosa) |

**Nessuno dei dieci kind coincide.** R-RAIL-25 diceva «nessuno dei quattro kind di C9.1»: la
misura estesa a tutti conferma e allarga.

L'inversione attribute/enum è **esatta sul bg e approssimata sul fg**: `#fef3c7` e `#d1fae5`
sono gli stessi due valori scambiati, mentre i testi differiscono di gradino (il pannello usa
sempre il tono più scuro, `#92400e` contro `#D97706`, `#065f46` contro `#059669`).

Ci sono poi **due collisioni incrociate** che nessuno aveva rilevato, dello stesso tipo
dell'inversione ma fra kind diversi: il bg `literal` del pannello (`#e0e7ff`) è il bg
`operation` del tree, e il bg `model` del pannello (`#dbeafe`) è il bg `package` del tree. Chi
guarda i due pannelli affiancati vede quindi quattro casi in cui lo stesso colore significa due
cose diverse.

**Dark.** Il tree ha valori dark espliciti (`badgeBgDark`/`badgeTextDark` in `entityMeta.ts`,
replicati in `_colors-dark.scss`). Il pannello **non ha alcuna variante dark**: le undici regole
`.jj-type-badge--*` sono tutte a colonna 0, quindi top-level, e i blocchi `[data-theme="dark"]`
dei tre fogli le precedono senza contenerle.
*Controllo positivo*: la parola `dark` compare in **103** fogli `.scss` sotto `frontend/src`, e la
grep su `jj-type-badge` restituisce tutte e quindici le occorrenze note — lo strumento vede sia
il termine sia il selettore, quindi lo zero è reale e non un difetto di ricerca.

## 3. Chi consuma cosa (punto 2)

**`.jj-type-badge` — due soli consumatori TSX**, contro l'attesa del prompt che ce ne fossero
altri:

| Sito | Uso |
|---|---|
| `components/editors/Info.tsx:895` | `jj-type-badge--${badgeClass}`, dentro `PropertiesHeader` |
| `components/editors/views/ViewData.tsx:221` | `--viewpoint` o `--view` |

*Controllo positivo*: la stessa grep trova entrambi i siti già noti da R-RAIL-25, quindi cerca
davvero nei `.tsx`.

Lato fogli le definizioni sono **tre**, non una: `_form-system.scss:1251-1259` (nove),
`nestedView.scss:3709-3710` (`--view`, `--viewpoint`), e il foglio del rail che ne ritocca
geometria a `properties-with-tree-view.scss:364` e `:373`.

**`entityMeta.ts` — un solo importatore**: `components/common/ElementBadge.tsx:9`, che importa
`resolveEntityType` ed `entityLetter`, **non i campi colore**. Fuori dal file stesso nessuno
legge `badgeBg`, `badgeText` o `color`.
*Controllo positivo*: `badgeBg` compare **32 volte dentro `entityMeta.ts`**, quindi il termine è
cercabile e l'assenza altrove è reale. I colori del tree arrivano a video **solo** per la via
dei token, non per la via TypeScript.

**`getElementTypeInfo`** (`Info.tsx:847`) ha firma
`(className: string) => { badge: string; badgeClass: string; icon: string }`: restituisce un
nome di classe e nessun colore. Confermato.

**Terza palette, fuori perimetro ma da sapere**: `constants/documentTypes.ts` ha campi
`badgeBg`/`badgeColor` propri, consumati da `pages/components/Navbar.tsx:290`. La sua voce
viewpoint è copiata da `entityMeta` (commento a `:44`), le altre no. Sono quindi **tre** copie
della stessa idea, non due.

## 4. Il costo delle due direzioni (punto 3)

**Direzione A — vince la palette del pannello.** Cambiano: `entityMeta.ts` (10 kind × 4 campi),
`_colors-light.scss` e `_colors-dark.scss` (18 valori di token). Il costo vero non è il numero
di siti ma il **dark inesistente**: il pannello non ha valori dark, quindi vanno inventati da
zero per nove kind, e §7.2 impone di scriverli in entrambi i file. Superfici che cambiano a
video: tutto il tree, i badge di `ElementBadge`, e i nodi del canvas, che consumano gli stessi
token (commento a `properties-with-tree-view.scss:917`). È la direzione che tocca meno file e
più pixel.

**Direzione B — vince la palette del tree.** Cambiano: `_form-system.scss:1251-1259` (nove
regole da esadecimale a `var(--color-entity-*)`), `nestedView.scss:3709-3710` (due), e vanno
**aggiunte due coppie di token** che oggi non esistono, per `literal`/`enumLiteral` e per
`view`, in light e in dark.
*Controllo positivo dell'assenza*: i token entity sono **venti** ed è stato letto l'elenco
completo — nove kind × bg/fg più `--color-entity-viewpoint-saturated` e
`--color-entity-model-saturated`; `literal` e `view` non ci sono.
Superfici che cambiano a video: **due sole**, il badge dell'header del pannello proprietà e
quello di view/viewpoint. In regalo arriva il dark, che oggi il pannello non ha affatto.
È la direzione che tocca più file e meno pixel.

**Il vincolo che pesa sulla direzione B**: `_form-system.scss` è importato globalmente da
`styles/style.scss:2`, ed è la condizione che ha fermato il passo 3 dell'arco 1. Resta
intoccabile senza una decisione esplicita.

## 5. Esistono già token entity? (punto 4)

**Sì, e sono la palette del tree già tokenizzata.** `_colors-light.scss:332-351` e l'omologo
dark definiscono **venti** variabili ciascuno, con gli stessi nomi nei due file (verificato con
un `diff` degli elenchi: identici). I valori coincidono con `badgeBg`/`badgeText` di
`entityMeta.ts` — per esempio `--color-entity-class-bg: #FEE2E2` contro `badgeBg: '#FEE2E2'`.

Quindi R-RAIL-25 non parlava di token da creare: parlava di far **consumare** al pannello token
che esistono già. Consumatori attuali dei token: il foglio del rail per metamodel e model
(`:1407-1413`) e il tree per viewpoint (`tree-view-sidebar.scss:1482-1483`).

Il commento `SYNC` a `entityMeta.ts:10-12` dichiara la duplicazione e chiede di mantenerla in
sync a mano: è un debito già scritto, non una scoperta di oggi.

## 6. Stato di `PropertiesHeader` (punto 5)

Funzione locale in `Info.tsx:877-903`, montata a `:1284`. Rende tre cose:
`.props-header__icon` con un glifo Bootstrap, `.props-header__name` col nome dell'elemento, e
il badge `.jj-type-badge--<kind>`. L'unica logica è l'override per `DModel`, che sceglie fra
`Model` e `Metamodel` in base a `isMetamodel`.

Le classi sono stilate in **`components/editors/info-improvements.scss:865-903`**, che R-RAIL-26
dichiara intoccabile **per l'arco 1**. «Restilare in loco» secondo R-RAIL-16 significa quindi
toccare quel foglio, e va sciolto se il divieto vale ancora nell'arco 2.

Attenzione al raggio: le stesse classi base sono riusate dall'header del view editor
(`nestedView.scss:3652-3717`, che le chiama esplicitamente «the shared base `.props-header*`
(info-improvements.scss…)») e ritoccate dal foglio del rail a `:336`. Un restyle in loco si vede
quindi in **due** header, non uno.

`.props-header__badge` è definita a `info-improvements.scss:903` ma **non è usata in nessun
TSX**: è una classe orfana, il badge reale è `.jj-type-badge`.
*Controllo positivo*: `props-header__name`, cercata con lo stesso comando, compare in `Info.tsx`.

## 7. Vincoli rilevati (punto 6)

- `_form-system.scss` è globale (`styles/style.scss:2`): intoccabile senza discussione.
- `info-improvements.scss` è intoccabile per l'arco 1 (R-RAIL-26); per l'arco 2 va deciso.
- §7.2: mai variabili CSS nei file di componente, e ogni token nuovo va scritto **sia** in
  `_colors-light.scss` **sia** in `_colors-dark.scss`.
- La sincronia fra `entityMeta.ts` e i due file di token è manuale e dichiarata: qualunque
  direzione si scelga, va aggiornata in entrambi i posti o eliminata la duplicazione.
- Esiste una terza palette (`documentTypes.ts`) che nessuna delle due direzioni tocca.

## 8. Critical zone (punto 7)

**Nessuno** dei file candidati alla Fase 2 compare in `CLAUDE.md` §3.1 (`:146-163`). `Info.tsx`
è citato una sola volta, a `:867`, nella tabella §19.5 «UI shell»; `_colors-light.scss` una sola
volta, a `:482`, in §7.2. Gli altri cinque — `info-improvements.scss`, `_form-system.scss`,
`entityMeta.ts`, `nestedView.scss`, `properties-with-tree-view.scss` — non compaiono affatto.
*Controllo positivo*: `useJjomSync.ts`, che di §3.1 fa parte, compare **6** volte nello stesso
file cercato con lo stesso comando.

**Conseguenza**: la Fase 2 **non** richiede un Layer Impact Report, salvo che il suo perimetro
cambi.

## 9. Dipendenze e rischi

- La direzione A richiede di inventare una palette dark che non esiste: è lavoro di design, non
  di migrazione, ed è il rischio maggiore delle due.
- La direzione B passa da un foglio globale: il raggio d'azione è l'app, non il rail.
- In entrambe, i due kind senza token (`literal`, `view`) vanno risolti prima, o resteranno
  esadecimali inline in mezzo a token.
- `ElementBadge.tsx` importa da `entityMeta` solo tipo e lettera: non è un rischio, ma è la
  prova che i colori del file sono già oggi una sorgente di verità solo per i token.

## 10. Domande aperte per Alfonso

**La domanda della palette, in una riga**: vince la palette del **tree** — già tokenizzata,
con dark, e costa nove regole in un foglio globale più due token nuovi — oppure quella del
**pannello**, che costa un dark da inventare per nove kind e ridipinge tree, canvas e badge?

Subordinate, da sciogliere solo dopo:

1. `info-improvements.scss` resta intoccabile anche nell'arco 2, o il divieto era solo dell'arco 1?
2. Il restyle dell'identity block deve valere anche per l'header del view editor, che riusa le
   stesse classi base, o va isolato con un modificatore?
3. La terza palette di `documentTypes.ts` entra nel perimetro dell'arco 2 o resta a backlog?
