# S1: riparare la classificazione legacy (`isKnownDefault` + drop del flag alla rigenerazione)

**Data**: 2026-08-04 17:30
**Tipo**: fix, scope stretto. Nessuna discovery: l'evidenza è allegata qui sotto.
**Branch**: `alfonso-frontend-jjtl`
**Effort**: xhigh (tocca `VersionFixer.tsx`, critical zone dichiarata)

**Stato al lancio**: S2 (`2026-08-04 17:31`, tab Template read-only sulle view legacy) è già
stato eseguito, verificato a video e committato. I due perimetri sono disgiunti: S2 ha toccato
`ViewData.tsx`, `data/TemplateData.tsx` e `languages/Jsx.tsx`, nessuno dei quali compare qui.
Nessuna riconciliazione attesa.

**Come viene verificato questo task**: non a video, perché il flag non è letto da nessuno e
nessun pixel cambia. L'accettazione è il rieseguire il censimento sui progetti reali salvati:
oggi 1315 view su 1550 finiscono nel terzo ramo, dopo il fix devono restare poche decine. Quel
conteggio lo esegue Alfonso in chat di progetto; da qui bastano i test unitari verdi.

---

## CONTESTO (leggere, è il motivo del task)

La migration `2.225 -> 2.226` (`frontend/src/redux/VersionFixer.tsx:1007-1040`) marca con
`irLegacyClassic = true` ogni `DViewElement` il cui `jsxString` non passa `isKnownDefault`.

Censimento eseguito il 2026-08-04 sui **progetti reali** salvati (64 progetti con stato, 1680
`DViewElement`, 1550 con `jsxString`):

- **1315 view su 1550, cioè l'85%, finiscono marcate legacy**;
- i template distinti in quel gruppo sono **50**, di cui 27 presenti una sola volta;
- i più frequenti **non sono notazione autorata**: sono view di default che Jjodel stesso
  genera.

Occorrenze dei template non riconosciuti, dal censimento:

| Occorrenze | Contenuto identificativo |
|---|---|
| 195 | `className={"edge hoverable hide-ep clickthrough fullscreen Association..."}` |
| 62 | idem per `Aggregation` |
| 62 | idem per `Composition` |
| 62 | idem per `Extension` |
| 122 + 61 + 61 + 60 + ... | commento di testa `/* -- Jjodel Abstract Syntax Specification vX.Y -- */` (v2.0, v2.2, v2.3) |
| 62 | `<div className={"edgePoint"} tabIndex="-1">{decorators}</div>` |
| 61 | overlay degli anchor: `className={"overlap"}` con map su `anchors` |
| 61 | placeholder `className="void model-less"` con icona bootstrap |

`isKnownDefault` conosce solo la famiglia del default M1 object/singleton/value. Tutto il resto
che il tool genera da sé non è riconosciuto.

Secondo difetto, indipendente dal primo: la migration scrive il flag **prima** che
`updateDefaultView` rigeneri le view di default, e il carry-over introdotto in Fase 4
(`637a5e238`) preserva il flag anche su quelle rigenerate, cioè su un contenuto che nel
frattempo è stato sostituito.

Il flag oggi non è letto da nessuno tranne la guardia di idempotenza della migration su sé
stessa, quindi **nessun comportamento visibile cambia con questo fix**. Serve a rendere il
flag vero prima che qualcuno lo usi per segnalare il degrado all'utente.

## COSA

### 1. Estendere `isKnownDefault` alle famiglie di default spedite dal tool

In `frontend/src/redux/VersionFixer.tsx`, dentro `['2.225 -> 2.226']`, aggiungere ai rami
esistenti il riconoscimento delle famiglie sopra. Vincoli sulla forma:

- **Le nuove costanti vanno definite in `frontend/src/utils/defaultViewTemplate.ts`**, accanto
  ai marker esistenti (righe 146-148), esportate, e importate nel VersionFixer. Non scrivere
  stringhe letterali dentro la migration.
- Usare `includes` su frammenti stabili e identificativi, non uguaglianza sul template intero:
  i template esistono in più versioni storiche e l'uguaglianza fallirebbe su quasi tutte. Il
  commento `Jjodel Abstract Syntax Specification` è stabile attraverso v2.0, v2.2 e v2.3 e
  copre da solo la fetta più grande.
- Prima di introdurre i nomi delle nuove costanti, **grep anti-collisione** nel codebase.
- Scegliere frammenti abbastanza specifici da non catturare notazione autorata che per caso
  contenga la stessa classe CSS. In particolare `overlap` da solo è troppo generico: qualificarlo.

### 2. Droppare il flag quando la view viene rigenerata

In `frontend/src/view/viewElement/view.tsx`, nel punto in cui `updateDefaultView` rigenera una
default view e fa carry-over di `ir` e `irLegacyClassic`: `ir` continua a essere preservato,
`irLegacyClassic` **no**, va rimosso. Motivazione: il `jsxString` su cui il verdetto era stato
emesso non esiste più, quindi il verdetto non ha oggetto. Non serve alcun ricalcolo, perché la
view rigenerata è per costruzione una default corrente.

Se dalla lettura del file risulta che il carry-over dei due campi è un unico blocco non
separabile senza toccare altro, **STOP e segnala** invece di improvvisare.

## DOVE (perimetro, `git add` solo questi)

| File | Modifica |
|---|---|
| `frontend/src/utils/defaultViewTemplate.ts` | AGGIUNTA delle nuove costanti marker, nessuna modifica a quelle esistenti |
| `frontend/src/redux/VersionFixer.tsx` | MODIFICA del solo `isKnownDefault` dentro `['2.225 -> 2.226']` |
| `frontend/src/view/viewElement/view.tsx` | MODIFICA del solo carry-over di `irLegacyClassic` |
| `frontend/src/redux/__tests__/` (nome da allineare alla convenzione locale) | NUOVO test |

Non toccare altro. Non rinominare nulla. Nessun refactoring opportunistico.

## COME (vincoli)

- **Nessun bump di `highestVersion`**: si corregge il predicato di una migration esistente, non
  se ne aggiunge una. I progetti già migrati con il flag sbagliato **non vengono ripuliti** da
  questo task: la guardia di idempotenza (`e.ir !== undefined || e.irLegacyClassic`) li salta.
  È accettato e va scritto nel report: la bonifica dei 60 già flaggati è una decisione separata
  che Alfonso non ha ancora preso.
- Non modificare la struttura dei tre rami di classificazione, solo il predicato del terzo.
- Non toccare `useJjomSync.ts` né `portDistribution.ts`.
- `VersionFixer.tsx` è critical zone: produrre un **LAYER IMPACT REPORT** prima di modificarlo,
  nello stesso formato usato per la Fase 4, e includerlo nel report finale.

## TEST (obbligatorio)

Test unitario sul predicato, con fixture minime ricavate dai frammenti reali elencati sopra:
per ciascuna delle famiglie (edge relation, abstract syntax v2.0 / v2.2 / v2.3, edgePoint,
anchor overlay, void model-less) una fixture che **prima** cadeva nel terzo ramo e **ora** cade
nel quinto (nessun flag). Più almeno una fixture di controllo, un template chiaramente autorato
che deve continuare a ricevere il flag.

## GATE

- Typecheck: baseline invariata, Δ0 nei file toccati.
- Vitest: suite esistente invariata più i nuovi test verdi.
- `npm run build` verde.
- HARD STOP per verifica di Alfonso. **Non committare**: preparare l'indice con i soli file del
  perimetro e fermarsi.

## REPORT

Discovery report non richiesto (non c'è fase esplorativa). Richiesti invece: il LAYER IMPACT
REPORT su `VersionFixer.tsx`, e l'entry in `docs/claude-code-log.md` nella forma prescritta
(attenzione: `check:docs` è rosso per due entry malformate del 2026-08-03, non aggiungerne una
terza e non rettificare quelle, hanno un task loro).

Nome di questo documento prompt: `2026-08-04 17:30`.
