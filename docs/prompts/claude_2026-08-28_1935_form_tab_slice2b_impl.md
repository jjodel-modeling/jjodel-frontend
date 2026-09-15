# Prompt Claude Code: Form tab, Slice 2b (basic, link cross-tab, titolo dei compartimenti)

**Data**: 2026-08-28 19:35 (emendato in chat: griglia unificata a 130px con header su ogni
sezione; `Clear` di un nome sconosciuto separato in `withoutBasicName`)
**Tipo**: feat (commit 1) + chore (commit 2) + docs (commit 3)
**Branch**: `alfonso-frontend-jjtl`, base `758aded1b`
**Effort**: xhigh
**Base fattuale**: `docs/discovery/discovery_2026-08-28_form_tab_authoring_slice2.md` (D2 per il link
cross-tab, D6 per il titolo, D3 per il ciclo di commit del draft). Nessuna discovery nuova: le
decisioni di design sono prese in chat e riportate qui. Se il codice reale contraddice una
premessa di questo prompt, fermati e segnala, non improvvisare.

Leggi `CLAUDE.md` e `docs/claude-code-log.md` prima di iniziare. Il log attivo e' newest-first per
giorno: le entry vanno in testa, subito sotto la riga di regola.

---

## 0. Gate d'ingresso (scoped)

```
GIT_OPTIONAL_LOCKS=0 git status --porcelain -- \
  frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.tsx \
  frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.scss \
  frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx \
  frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx \
  frontend/src/components/editor-v2/viewpoint/authoring/__tests__/formAuthoring.test.ts \
  frontend/src/components/editors/views/ViewData.tsx \
  frontend/src/events/registry.ts \
  docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md
```

Deve essere vuoto. Il resto del tree contiene modifiche di un'altra sessione (`App.tsx`,
`featureSignature.ts`, `StatusBar.*`, docs): non toccarle, non stagarle, dichiarale nella nota
finale. Ogni commit di questo prompt usa `git commit -- <path...>` con i soli file del commit.
Mai `git add .`. Nessun push: lo lancia Alfonso.

Baseline da registrare prima di scrivere: `npm run typecheck` (atteso 33 errori, tutti fuori
perimetro), `npx vitest run` (atteso 1677 passati, 9 file noti falliti all'import), `check:docs` 3/3.

---

## 1. COSA (commit 1, feat)

Tre estensioni al tab `Form` del pannello di authoring vertex, un commit:

1. **Authoring di `FormSpec.basic`**: colonna Basic per riga con checkbox, stato
   «derived / declared» leggibile in un punto solo, reset all'euristica.
2. **Link «Edit compartments»** dal marcatore R-FRM-1 del tab Form al tab Structure, via
   CustomEvent del registry, listener in `ViewData` filtrato su `viewId` e sui tab correnti.
3. **Campo `Title`** in `FieldCompartmentListEditor`, chiave rimossa quando il campo e' vuoto.

Perimetro del commit 1 (nient'altro):

- `frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.scss`
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (una prop)
- `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/formAuthoring.test.ts`
- `frontend/src/components/editors/views/ViewData.tsx`
- `frontend/src/events/registry.ts`
- `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md` (§14)

---

## 2. COME, parte A: la colonna Basic

### Semantica (spec §6, `useFormWidgets.isBasicField`)

- `basic` assente: euristica, un campo e' in Basic se `lowerBound >= 1`.
- `basic` presente (array): **e' la risposta completa**, anche quando omette un'obbligatoria e
  anche quando e' `[]`. Un array vuoto e' uno stato legittimo («niente in Basic»), NON va
  potato: `pruneForm` non deve toccare `basic`. Solo il reset esplicito rimuove la chiave.
- Una feature `hidden` non compare in Basic ne' in Advanced, qualunque cosa dica `basic`.

### Resa (decisione di chat, non riaprire)

**Colonna.** Terza colonna `Basic` in ogni tabella di sezione, tra il nome e il controllo.

Griglia: **una sola larghezza di colonna di controllo per tutte le righe**, `1fr 40px 130px`,
applicata a `&__head` e `&__row`; la regola `&__row--treatment` perde il suo
`grid-template-columns` e resta solo come gancio di classe (non rimuoverla, non rinominarla).
Oggi `&__head` e' `1fr 110px` e `&__row--treatment` e' `1fr 130px`: in una sezione mista
l'intestazione non e' mai stata allineata alle righe reference, e aggiungere una colonna
peggiorerebbe il disallineamento invece di introdurlo. Unificare a 130px lo chiude, allarga di
20px la Select dei widget e non tocca nessun identificatore. Niente nuove variabili, solo token.
Dichiara il cambio di larghezza nella nota finale.

Aggiorna anche la riga di metriche nel commento di testa del file: `widget control 110px,
treatment control 130px` diventa `control column 130px, unified 2026-08-28`.

L'header va reso su **ogni** sezione, non solo su quelle di attributi (oggi e' gated da
`attributeSection`, riga 438). Una sezione puo' essere mista, quindi la terza etichetta non puo'
dipendere dalla riga: usa `Feature | Basic | Widget` quando la sezione ha almeno un attributo
(`attributeSection === true`, la variabile esiste gia'), `Feature | Basic | Render` altrimenti.

Nella cella un `Checkbox` condiviso (`components/ui`), senza `label`, `ariaLabel`/`title` con il
nome della feature.

**Stato del checkbox.** `checked = isBasicRow(row, form)`, helper puro esportato che replica
`isBasicField` sui dati del metamodello: `Array.isArray(form?.basic) ? basic.includes(row.name)
: row.lowerBound >= 1`. Documenta nel JSDoc che e' la stessa regola dell'interprete letta dal
metamodello, come gia' fa `deriveAuthoringWidget` per `describeSlot`.

**Il pallino esistente.** Il `form-authoring__dot` accanto al nome si accende anche quando la
membership dichiarata differisce dall'euristica (`Array.isArray(basic) && basic.includes(name)
!== (lowerBound >= 1)`). Estendi `anyOverride` di conseguenza, cosi' la legenda «overridden
default» copre anche questo caso. Nessun secondo marcatore.

**Riga di stato, una sola per tab.** Sopra la prima sezione (dentro il gating Advanced, dopo gli
`HelpText` esistenti), un blocco `form-authoring__state`:

- `basic` assente: testo `Basic: derived from multiplicity (required features)`.
- `basic` presente: testo `Basic: declared` seguito da un bottone `form-authoring__link` con
  etichetta `Reset to derived`, che chiama `onChange(withoutBasic(form))`.

Il blocco si rende anche con `target === null` o senza sezioni, se `basic` e' dichiarato:
altrimenti un `basic` persistito su una view wildcard resterebbe invisibile e senza uscita.

**Toggle.** `withBasic(form, rows, name, checked): FormSpec | undefined`, helper puro esportato:

- se `form.basic` e' assente, prima **materializza** la lista dall'euristica
  (`rows.filter(r => r.lowerBound >= 1).map(r => r.name)`, nell'ordine delle righe), poi applica
  il toggle. Il primo click trasforma lo stato in «declared»: e' voluto, e la riga di stato lo
  mostra subito.
- se presente, ricostruisce la lista **nell'ordine delle righe** (`rows.filter(member)`), e
  accoda in coda, nell'ordine originale, i nomi che non corrispondono a nessuna riga (preservati
  verbatim, mai riscritti).
- il risultato passa da `pruneForm`; `[]` sopravvive.

**Reset.** `withoutBasic(form): FormSpec | undefined`: spread senza la chiave `basic`, poi
`pruneForm` (una `FormSpec` con solo `basic` torna `undefined`, come per le altre chiavi). Non
allargare l'unione dei tipi di `withFormKey`: `basic` non e' uno scalare e merita un helper suo.

**Riga hidden.** Se `form.features[name] === 'hidden'`, il checkbox e' `disabled`, `title`
`Hidden removes the feature in both Basic and Advanced`, e mostra comunque la membership reale
(`isBasicRow`): nessuna riscrittura di `basic` quando una feature diventa hidden o smette di
esserlo.

**Nomi sconosciuti in `basic`.** Helper puro esportato `unknownBasicNames(form, rows): string[]`.
Ogni nome va nel blocco degli override ignorati (stesso `renderIgnored`, stesso `CHIP`), testo
`ignored: basic entry on unknown feature "<nome>"`, con `Clear` che rimuove **solo quel nome**
dalla lista.

Due operazioni distinte, due helper distinti: non caricare `withBasic` di un caso speciale che
dipende dal fatto che il nome non corrisponda a una riga.

- `withBasic(form, rows, name, checked)`: toggle di una **riga**. Il ramo che ricostruisce la
  lista accoda sempre in coda, verbatim, i nomi che non corrispondono a nessuna riga.
- `withoutBasicName(form, name)`: rimuove un nome qualsiasi dalla lista, senza consultare `rows`
  e senza materializzare nulla (se `form.basic` non e' un array, ritorna `form` invariata). E'
  questo che chiama il `Clear` del blocco ignorati. Il risultato passa da `pruneForm`; `[]`
  sopravvive.

Il blocco degli ignorati si rende anche senza sezioni quando ci sono nomi sconosciuti (estendi la
condizione `sections.length === 0 && ignored.length > 0`).

### Vincolo di commit (D3, invariato)

Ogni scrittura parte da `{ ...form }`. Il commit del pannello e' whole-object: un helper che
ricostruisce `FormSpec` da zero cancella le chiavi che non conosce.

---

## 3. COME, parte B: link «Edit compartments»

**Registry** (`frontend/src/events/registry.ts`, gruppo `JjodelEvents`, sezione UI Navigation,
subito dopo `ACTIVE_TAB`):

```ts
  // Ask the host of the IR authoring bar (ViewData) to activate one of its tabs.
  // detail: { viewId: string; tab: IRTabId }. Distinct from ACTIVE_TAB, which is the
  // dock's own bar (Dock emits, StatusBar and Navbar listen).
  IR_AUTHORING_TAB: 'jjodel:ir-authoring-tab',
```

Prima verifica con `grep -rn "ir-authoring-tab\|IR_AUTHORING_TAB" frontend/src` che il nome sia
libero.

**Emissione** (`FormAuthoringBody.tsx`): nuova prop opzionale `viewId?: string` su
`FormAuthoringBodyProps` (additiva). Nel marcatore `form-authoring__residual` il testo attuale
resta; la frase finale «Edit compartments in the Structure tab» diventa testo + bottone
`form-authoring__link` con etichetta `Edit compartments`, reso solo se `viewId` e' definito:

```ts
window.dispatchEvent(new CustomEvent(JjodelEvents.IR_AUTHORING_TAB, {
    detail: { viewId, tab: 'ir-structure' },
}));
```

Importa `JjodelEvents` dal registry, mai lo string literal (Rule 25). Il tab `ir-structure` e'
nell'elenco vertex in entrambe le modalita' (`irTabsForKind`), quindi il link non ha bisogno di
un gating proprio.

**Passaggio della prop** (`VertexAuthoringPanel.tsx`, ~riga 428): `viewId={view.id as string}`
sul `<FormAuthoringBody>`. Nient'altro in quel file.

**Listener** (`ViewData.tsx`, accanto a `activeTab`, ~riga 193). `ViewData` puo' essere montato
due volte in contemporanea (Properties card e NestedView, D2): il listener filtra su
`detail.viewId === view.id` e ignora un `tab` che non e' nell'elenco corrente, altrimenti si
finisce nel corpo tutto nascosto di D1.

```ts
const tabIds = tabs.map(t => t.id).join(',');
useEffect(() => {
    const onTab = (e: Event) => {
        const detail = (e as CustomEvent<{ viewId?: string; tab?: string }>).detail;
        if (!detail || detail.viewId !== view.id) return;
        if (!tabIds.split(',').includes(detail.tab ?? '')) return;
        setActiveTab(detail.tab as TabId);
    };
    window.addEventListener(JjodelEvents.IR_AUTHORING_TAB, onTab);
    return () => window.removeEventListener(JjodelEvents.IR_AUTHORING_TAB, onTab);
}, [view.id, tabIds]);
```

`tabs` e' ricostruito a ogni render: la dipendenza e' la stringa degli id, non l'array. Aggiungi
`useEffect` all'import di React e l'import di `JjodelEvents`. Nessun'altra modifica a `ViewData`.

---

## 4. COME, parte C: campo `Title` dei compartimenti

`FieldCompartmentListEditor.tsx`: un `jj-field` `Title` subito dopo `Id`, `Input` con
`value={comp.title ?? ''}`, `placeholder="Defaults to the id"`. Helper puro esportato, accanto a
`withRowStyle`, con lo stesso idioma:

```ts
/** `''` drops the `title` KEY (the form falls back to the id), so a title typed and erased
 *  round-trips byte-identical to a compartment authored without one. */
export function withCompartmentTitle(comp: FieldCompartmentSpec, title: string): FieldCompartmentSpec {
    if (title === '') { const { title: _dropped, ...rest } = comp; return rest; }
    return { ...comp, title };
}
```

Rimozione solo su stringa vuota esatta, non su whitespace: trimmare a ogni keystroke impedisce di
digitare uno spazio. `FieldCompartmentSpec.title` esiste gia' (`irTypes.ts:147`); `irCompile`
lo copia verbatim solo se presente; il fallback resta in `formSections.sectionTitle`, che NON va
esportata ne' duplicata (D6): il tab Form mostra gia' il titolo con lo stesso fallback per
costruzione.

---

## 5. Test (`formAuthoring.test.ts`, stesso file)

Aggiungi, senza toccare i 38 esistenti. Il describe `basic (Slice 2b) round-trips verbatim`
resta valido e va lasciato com'e'.

- `isBasicRow`: euristica su `lowerBound`; lista dichiarata vince, anche omettendo un'obbligatoria;
  `[]` esclude tutto.
- `withBasic`: primo toggle materializza l'euristica nell'ordine delle righe; deselezionare
  l'ultimo produce `[]`, non `undefined`; nomi sconosciuti preservati in coda; nessuna mutazione
  dell'input.
- `withoutBasicName`: rimuove solo il nome chiesto e lascia il resto nell'ordine originale; su
  una `FormSpec` senza `basic` ritorna l'input invariato; rimuovere l'ultimo nome produce `[]`.
- `withoutBasic`: rimuove la chiave; una `FormSpec` con solo `basic` torna `undefined`; le altre
  chiavi sopravvivono.
- `pruneForm` (via `withFormKey`/`withFormEntry`): un `basic: []` sopravvive a un cambio di tema
  e a un override di widget.
- `unknownBasicNames`: nome fuori metaclasse rilevato; nessuna lista, nessun risultato.
- `withCompartmentTitle`: set, rimozione su `''`, whitespace conservato, round-trip byte-identico.
- Registry: `JjodelEvents.IR_AUTHORING_TAB === 'jjodel:ir-authoring-tab'` (un `it` nel blocco
  test piu' vicino, oppure un describe nuovo nello stesso file).

Il listener di `ViewData` e la resa del checkbox non hanno test unitari qui (nessun harness DOM
nel file): li copre la verifica visiva.

---

## 6. Spec §14

Aggiorna lo stato: la Slice 2b implementa `basic` (colonna Basic, stato derived/declared, reset),
il link «Edit compartments» via `JjodelEvents.IR_AUTHORING_TAB` e il campo `Title` dei
compartimenti. Restano fuori: form document a piena pagina (Slice 3), widget `link`, `EDate`.
Aggiungi in §6 una riga: «In authoring il primo toggle materializza la lista dall'euristica; `[]`
e' uno stato dichiarato legittimo e solo il reset rimuove la chiave.» Niente em dash.

---

## 7. Gate di uscita del commit 1

- `npm run typecheck`: 33 errori, diff identico alla baseline. Un rialzo che origina nei file di
  questo prompt si corregge e si prosegue; un rialzo altrove e' stop.
- `npx vitest run`: 1677 + i nuovi, 9 file noti falliti all'import invariati.
- `npm run build`: exit 0.
- Commit: `feat(authoring): Form tab authors basic, links to compartments, titles sections (slice 2b)`,
  con `git commit -- <gli 8 path del perimetro>`.

**HARD STOP 1.** Riporta l'hash, il diff del typecheck, il conteggio vitest e la nota sul tree.
Alfonso verifica a schermo su http://localhost:3000 (hard refresh):

1. colonna Basic in ogni sezione, header su tutte, e in una sezione mista header e righe
   allineati sulla stessa colonna di controllo;
2. stato «derived» con checkbox che seguono `lowerBound`;
3. primo click: stato «declared», pallino sulla riga che devia, legenda accesa;
4. deselezionare tutto: `[]` persiste, riga di stato ancora «declared»;
5. `Reset to derived`: chiave rimossa, checkbox tornano all'euristica;
6. riga hidden: checkbox disabilitato con tooltip;
7. `Edit compartments` porta al tab Structure nel pannello giusto, non nell'altro mount;
8. campo Title: la sezione nel tab Form cambia titolo in tempo reale, svuotare torna all'id.

Non procedere ai commit 2 e 3 senza GO.

---

## 8. Commit 2 (chore, dopo GO): `CHIP` condiviso e token dark

**Estrazione di `CHIP`.** Quattro copie inline identiche in `FieldCompartmentListEditor.tsx:76`,
`FieldSegmentEditor.tsx:13`, `FormAuthoringBody.tsx:86`, `LabelEntryEditor.tsx:15`. Verifica prima
con `diff` che siano byte-identiche a meno dei commenti; se differiscono, stop e segnala. Poi:

- nuovo file `frontend/src/components/ui/preservedChip.ts` che esporta `PRESERVED_CHIP:
  React.CSSProperties` (controlla con `grep -rn "PRESERVED_CHIP\|preservedChip" frontend/src`
  che il nome sia libero), JSDoc con la convenzione «read-only chip for a value preserved
  verbatim, inline style, no CSS class»;
- export da `frontend/src/components/ui/index.ts`;
- nei quattro componenti: rimuovi la costante locale, importa `PRESERVED_CHIP` e sostituisci
  `style={CHIP}` con `style={PRESERVED_CHIP}`. Niente altro in quei file.

**Token dark.** `--color-text-placeholder` e `--color-text-disabled` esistono nella palette light
(`_colors-light.scss:101-102`, slate-500 e slate-400) e mancano in quella dark; li leggono
`variables.scss:46`, `style.scss:82,88,935`, `_buttons.scss:93`. Aggiungili in
`frontend/src/styles/tokens/_colors-dark.scss` accanto agli altri `--color-text-*`, con lo stesso
commento, scegliendo i due gradini della scala slate coerenti con il `--color-text-tertiary` dark
gia' definito (placeholder un gradino piu' visibile di disabled). Dichiara nella nota i valori
scelti. Se la palette dark ha una convenzione di fallback diversa, segnala prima di scrivere.

Gate: typecheck invariato, vitest invariato, build exit 0. Commit
`chore(ui): share the preserved-value chip, add dark tokens for placeholder and disabled text`
con `git commit -- <path...>` sui soli file toccati.

## 9. Commit 3 (docs, insieme al 2)

- `CLAUDE.md` ~riga 909: «as an append-only operational log» diventa «as an add-only operational
  log: entries are never amended, and a new entry goes at the top of the file, newest-first per
  day (R-RAIL-45)». Solo quella frase.
- `docs/claude-code-log.md`: due entry in testa (una per il commit 1, una per il 2), formato di
  CLAUDE.md §21.2, smoke visivo segnato come passato solo dopo il GO di Alfonso.
- `check:docs` 3/3.

Commit `docs: log entries for slice 2b and the shared chip, add-only wording in CLAUDE.md`.

**HARD STOP 2.** Hash dei tre commit, nota sul tree (modifiche dell'altra sessione, intatte).
Nessun push.

---

## 10. Non fare

- Non toccare `irValidate.ts`, `formSections.ts`, `useFormWidgets.ts`, `irCompile.ts`,
  `PathBuilderFeatures`, `SegmentedControl`, `Checkbox`, ne' i file dell'altra sessione.
- Non rinominare classi SCSS o identificatori esistenti; le nuove classi sono solo
  `form-authoring__state` e `form-authoring__link`.
- Non ricostruire mai `FormSpec` da zero; non potare `basic: []`.
- Non rimuovere `&__row--treatment`: perde solo la sua riga `grid-template-columns`.
- Non riparare in silenzio un `basic` con nomi sconosciuti o incoerente con `hidden`.
- Non aggiungere dipendenze.
