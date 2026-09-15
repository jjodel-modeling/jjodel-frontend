# Discovery: le skin della form del Data Manager (R-SKIN, Fase 1)

**Data**: 2026-09-04
**Prompt**: `docs/prompts/claude_2026-09-04_2302_prompt_form_skins_fase1.md`
**Memo di ratifica**: `docs/ratifiche/claude_2026-09-04_2302_memo_ratifica_form_skins.md`
**Decisioni**: R-SKIN-1..4 (`docs/decisions.md:2956-2977`), R-DMV-1/6, R-VP-14, R-B9, regole 27 e 28
**Repo**: branch `alfonso-frontend-jjtl`, HEAD al momento della lettura `b16a48f8b`
**Tipo**: Fase 1 read-only. Nessun file di codice modificato, nessun comando di build o test eseguito.

---

## 0. Esito in una pagina

| # | Ipotesi | Esito | Dove sta la prova |
|---|---|---|---|
| H1 | La form e i widget non usano colori diretti: una skin è una rimappatura di token | **Confermata, e più forte del previsto**: zero colori applicati, in tutti e tre i punti | §2 |
| H2 | I token della form sono pochi e nominabili | **Confermata**: 9 token di superficie, separabili dai globali con un criterio dichiarabile | §3 |
| H3 | `--color-form-*` sono definiti in entrambi i file colori | **Confermata**, con una asimmetria da conoscere | §4 |
| H4 | La regola `[data-skin]` può stare in `tokens/` e vince sulle definizioni di `:root` | **Confermata, ma non per specificità**: vince per *ereditarietà*, e il dark impone una seconda regola per skin | §5 |
| H5 | Il pannello del singleton replica il pattern di `formTheme` per `formSkin` | **Confermata**, tre punti, tutti già scritti in questa corsia | §6 |
| H6 | La tabella del manager è fuori dalla skin | **FALSIFICATA, ed è il finding che vale il referto** | §7 |

**Il finding che vale il referto** (§7): la tabella del Data Manager **legge gli stessi
`--color-form-*` della form**, su **143 righe** di `instanceManagerTab.scss`. Una skin agganciata
a `.ir-form` — la lettera di R-SKIN-3 — cambierebbe il **drawer** e lascerebbe la **tabella sopra
di esso** invariata, sulla stessa schermata. Il rimedio è di una parola: l'attributo va su
`.instance-manager`, che è antenato di `.ir-form`, e copre entrambi con una sola scrittura.

**Il secondo finding** (§8): la parola «skin» **è già presa in questo stesso file**. `IRForm.tsx`
rende `ir-form--${theme}` e i suoi commenti chiamano `plain | card | compact | inspector` «the four
skins»; `formAutoLayout.ts` importa quel tipo *come* `LegacySkin` ed esporta `LEGACY_SKIN_PRESET`.
Mettere `data-skin` sulla stessa radice che porta `ir-form--plain` significa due sensi di «skin» in
un tag. R-SKIN-4 prevede il conflitto ma lo risolve solo per il tipo: la scelta del nome
dell'attributo e del campo resta aperta (§11, Q1).

---

## 1. File letti (path completi)

- `frontend/src/components/editor-v2/viewpoint/ir/irFormStyle.scss` (1243 righe; censimento integrale dei `var(--…)` e dei colori diretti)
- `frontend/src/components/editor-v2/viewpoint/ir/widgets/formWidgets.scss` (censimento integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/widgets/*.tsx` (17 file; censimento dei colori diretti su tutti)
- `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` (`:20-30`, `:160-180`, `:420-485`)
- `frontend/src/components/editor-v2/viewpoint/ir/formAutoLayout.ts` (`:240-330`)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (`:206-212`)
- `frontend/src/jjform/themes.ts` (`:1-75`)
- `frontend/src/styles/tokens/index.scss` (intero)
- `frontend/src/styles/tokens/_colors-light.scss` (`:1-50`, `:75-105`, `:390-435`)
- `frontend/src/styles/tokens/_colors-dark.scss` (`:1-40`, `:290-322`)
- `frontend/src/styles/tokens/_radius.scss`, `_spacing.scss` (`:35-40`), `_shadows.scss` (`:28-56`)
- `frontend/src/styles/tokens.css` (misurato: **0** occorrenze di `--color-form-`)
- `frontend/src/components/abstract/tabs/instanceManagerTab.scss` (censimento integrale dei `var(--…)`)
- `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` (`:2178`, `:2995-3020`)
- `frontend/src/components/editors/viewpoint/properties/DataManagerViewpointPanel.tsx` (intero)
- `frontend/src/view/viewElement/view.tsx` (`:210-260`)
- `docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md` (`§Themes`, `:36-48`)

**Critical zone**: nessun file di `CLAUDE.md` §3.1 è implicato. `VersionFixer.tsx` non è stato
letto e **non serve**: `formSkin?` è additivo e opzionale come `formTheme`, e «assente è un valore»
(§6). Nessun writer D-layer è coinvolto oltre all'assegnazione sul proxy che il pannello già fa.

---

## 2. H1 — I colori diretti: **confermata**

`command grep -c -E "#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\("`, conteggio per **righe**:

| File | Righe con un colore letterale | Di cui codice |
|---|---|---|
| `irFormStyle.scss` (1243 righe, 306 `var(--…)`) | **0** | 0 |
| `widgets/formWidgets.scss` | 2 | **0** |
| `widgets/ChipInputWidget.tsx` | 2 | **0** |
| `widgets/ColorWidget.tsx` | 4 | **1** |
| gli altri 14 `widgets/*.tsx` | 0 | 0 |

**Controllo positivo**: lo stesso pattern sullo stesso comando dà **167** righe su
`components/TreeViewSidebar/tree-view-sidebar.scss`. Il silenzio su `irFormStyle.scss` è un
risultato, non un comando che non ha girato.

Le otto righe non nulle, lette una per una, sono **sette righe di prosa** e una sola di codice:

- `formWidgets.scss:109` e `:355`, `ChipInputWidget.tsx:18` e `:21` — commenti che *citano* il
  valore del token per dire quale colore del design esso vale (`«whose light values are exactly
  the #ecfeff / #0891b2 / #a5f3fc the design names»`). Nessuna dichiarazione.
- `ColorWidget.tsx:25`, `:33`, `:83` — commenti sul formato dei valori che il widget stampa.
- `ColorWidget.tsx:100`, verbatim, **l'unica occorrenza di codice**:

```tsx
placeholder="#000000"
```

È il placeholder testuale di un `<input type="text">`, cioè il *formato* che il campo si aspetta,
non un colore che dipinge qualcosa. Lo swatch dipinge `--ir-swatch`, che è il **valore dello slot**
passato inline (`:87`) — un dato del modello, non del tema, e giustamente fuori da ogni skin.

**Conseguenza**: una skin può essere **soltanto** una rimappatura di token. Non c'è un solo punto
in cui un componente della form vada toccato per cambiarne l'aspetto. È il presupposto di R-SKIN-1
ed è vero alla lettera.

---

## 3. H2 — I token, e quali una skin rimappa: **confermata**

Censimento con `grep -o -E "var\(--[a-z0-9-]+"`, occorrenze (non righe).

### 3.1 I nove candidati — i token «di superficie»

Sono i token che dicono *di che materiale è fatta la form*: superfici, bordi, toni del testo
secondario. Ognuno è già `--color-form-*` o è il grigio di riempimento dei campi.

| Token | `irFormStyle` | `formWidgets` | `instanceManagerTab` | Light | Dark |
|---|---:|---:|---:|---|---|
| `--color-form-surface` | 11 | 5 | 16 | `#ffffff` | `#16181a` |
| `--color-form-panel` | 2 | 0 | 1 | `$slate-50` `#f8fafc` | `#0f1012` |
| `--color-form-border` | 19 | 6 | 25 | `$slate-200` `#e2e8f0` | `rgba(255,255,255,.08)` |
| `--color-form-border-strong` | 7 | 6 | 14 | `$slate-300` `#cbd5e1` | `rgba(255,255,255,.16)` |
| `--color-form-muted` | 22 | 5 | 44 | `$slate-400` `#94a3b8` | `var(--color-text-tertiary)` `#606060` |
| `--color-form-label` | 2 | 1 | 15 | `var(--color-text-tertiary)` `#475569` | `var(--color-text-secondary)` `#a0a0a0` |
| `--color-form-section` | 4 | 1 | 11 | `$slate-500` `#64748b` | `var(--color-text-tertiary)` `#606060` |
| `--color-form-summary` | 1 | 0 | 0 | `#fcfdfe` | `#121416` |
| `--color-bg-tertiary` | 10 | 7 | 12 | `$slate-100` `#f1f5f9` | `#16181a` |

Conteggi presi con `grep -o "var(--<nome>)"` per nome esatto, non con un pattern di prefisso: senza
le parentesi, `--color-form-border` avrebbe inghiottito `--color-form-border-strong` e i due numeri
sarebbero stati entrambi sbagliati.

`--color-form-summary` ha **un solo** consumatore, `irFormStyle.scss:147`
(`background: var(--color-form-summary);`, la striscia di riepilogo dei problemi), e zero fuori da
lì — misurato su tutto `frontend/src`. Vivo, quindi dentro la lista, ma è l'unico dei nove che la
tabella non usa: una skin che lo dimentica sfasa solo quella striscia.

### 3.2 I token che una skin NON deve rimappare, e perché

- **Semantica**: `--color-error`, `--color-error-text`, `--color-error-subtle`, `--color-warning*`,
  `--color-success`, `--color-marker-required`, `--color-inode-broken`. Dicono *cosa non va*, non
  *com'è fatta la form*. §7.1 riserva il rosso alla diagnostica: una skin che lo sposta rende
  l'errore meno leggibile su un preset e più su un altro.
- **Focus**: `--focus-ring`, `--color-form-focus-border`, `--color-form-focus-ring`,
  `--color-border-focus`. §7.1 riserva il ciano esattamente a questo. Il focus è un segnale di
  sistema e deve essere lo stesso ovunque nell'app; una skin che lo cambia rompe l'accessibilità
  per una scelta estetica.
- **Testo primario**: `--color-text-primary`. Rimapparlo è cambiare il contrasto del contenuto, che
  è il mestiere del tema chiaro/scuro, non di una skin. `Ink` («testo pieno», R-SKIN-2) si ottiene
  con bordi e superfici, non spostando il nero.
- **Accento e selezione**: `--color-accent`, `--color-selection-bg`, `--color-selection-bar`,
  `--color-opt-*`, `--color-entity-object-*`. Vocabolari condivisi con il canvas e l'albero.
- **Metrica**: `--space-*`, `--text-*`, `--font-*`, `--control-height-*`, `--transition-fast`.
  Sono il **layout**, cioè l'asse del tema a tre campi (FL2). R-SKIN-1 dice ortogonale: se una
  skin tocca la metrica, i due assi smettono di esserlo.

### 3.3 Il caso `--radius-sm`, da decidere

Il memo lo elenca fra i token di una skin. È vero che la form lo usa molto (14 in `irFormStyle`,
6 in `formWidgets`), ma **non è un token della form**: `_radius.scss:41` lo aliasa a `--radius`
(«old default»), `:32` ai tooltip, `:42` ai tab, `:52` all'utility `.rounded-sm`. Rimapparlo
*dentro* lo scope della skin è tecnicamente innocuo — nessuna regola fuori da quello scope lo
vede — ma cambia anche **ogni controllo non della form che si trova dentro quello scope**: i
bottoni del manager, i chip della testata, il segmented. Se `Paper` vuole «bordi morbidi», la
strada pulita è `--radius-control` (6px, dichiarato «form views») e/o un token nuovo
`--color-form-radius`; non l'alias generico. **Proposta: fuori dalla lista**, decisione ad Alfonso
(§11, Q3).

---

## 4. H3 — Le definizioni in entrambi i file: **confermata**

`--color-form-*` sono dichiarati in `_colors-light.scss:405-429` e in `_colors-dark.scss:300-318`.
Il blocco chiaro porta un avviso che vale la pena riportare, `_colors-light.scss:397-404` verbatim:

```
  /* Spelled out, NOT aliased to --color-bg-secondary / --color-bg-primary /
     --color-border-primary, which is how these three were first written and how they came out
     INVERTED. Those names are on the list of 15 declared by BOTH styles/tokens/ and
     styles/tokens.css with different values (discovery finding 7), and tokens.css wins the
     cascade: --color-form-surface painted #f8fafc and --color-form-panel painted #ffffff, each
     other's value, while border-strong collapsed onto border. Measured 2026-08-27. */
```

**Verificato per questa corsia**: `command grep -c -- "--color-form-" src/styles/tokens.css` → **0**.
Il secondo file di token non dichiara nessuno dei nove, quindi la trappola del 27-08 non si
ripresenta qui. Va detto perché il rischio *sembra* applicabile e non lo è.

**Asimmetria da conoscere**: nel blocco chiaro i valori sono letterali o `$slate-*`; nel blocco
scuro tre di essi sono **alias** (`--color-form-label: var(--color-text-secondary)`,
`--color-form-muted` e `--color-form-section: var(--color-text-tertiary)`). Una skin che li
sovrascrive nel dark rompe quell'aggancio — è esattamente ciò che deve fare, ma va scritto
letterale, come i due file già fanno per la stessa ragione.

---

## 5. H4 — Dove vive `[data-skin]`: **confermata, con una precisazione portante**

### 5.1 Come è applicato il dark

`_colors-dark.scss:9` verbatim:

```scss
:root[data-theme="dark"] {
```

e `_colors-light.scss:75-76`:

```scss
:root,
:root[data-theme="light"] {
```

**Attributo sulla radice, non media query.** `tokens/index.scss:20` lo conferma («Add
`[data-theme="dark"]` to `<html>` or `<body>`»).

### 5.2 Perché la regola della skin vince — e non è la specificità

Una regola come

```scss
.instance-manager[data-skin="paper"] { --color-form-surface: #fffdf7; }
```

vince su `:root` **per ereditarietà, non per specificità**: le custom property si ereditano, e un
valore ridichiarato su un discendente sostituisce quello ereditato dalla radice qualunque sia la
specificità della regola che l'ha messo lì. Il confronto di specificità non avviene affatto: sono
due elementi diversi.

**La conseguenza operativa, che è il punto**: siccome non c'è confronto con `:root[data-theme="dark"]`,
**la regola della skin sovrascrive anche il dark**. Una skin che dichiara solo i valori chiari
dipinge quelli chiari *anche in tema scuro*. Servono quindi **due regole per skin**:

```scss
/* styles/tokens/_form-skins.scss */
.instance-manager[data-skin="paper"] { --color-form-surface: #fffdf7; /* … */ }
:root[data-theme="dark"] .instance-manager[data-skin="paper"] { --color-form-surface: #1a1714; /* … */ }
```

Il file nuovo `styles/tokens/_form-skins.scss`, importato da `tokens/index.scss` dopo
`colors-dark`, rispetta la regola 28 (nessuna variabile CSS nei componenti) e tiene le otto
rimappature in un posto solo. `index.scss` ha già la forma per accoglierlo: importi numerati con
un commento «Order matters!» (`:24-26`).

`Slate` **non ha regola**: è l'assenza dell'attributo, cioè i valori di `:root`. È ciò che rende
vero «nessun progetto cambia» (R-SKIN-2) senza dover scrivere il default due volte.

---

## 6. H5 — Il campo e il pannello: **confermata**

Tre punti, tutti già scritti in questa stessa corsia, quindi il pattern è replicabile riga per riga.

**Il campo** — `view/viewElement/view.tsx:248`:

```typescript
    formTheme?: FormThemeName;
```

Dichiarato su `DViewElement` e non su `DViewPoint`, con la ragione a `:234-239` verbatim:
«`DViewPoint` carries no own data field at all … A first own field on the subclass would also have
to be taught to `Constructors.DViewPoint`». `formSkin?: FormSkinName` va **accanto**, stessa
classe, stesso commento su «assente è un valore» (`:222-227`), **nessuna migrazione**.

**La lettura** — `IRForm.tsx:232-236`, come questa corsia l'ha lasciata:

```tsx
    const viewpointTheme = useSelector((state: any) => {
        const vp = viewpointOfHost(host) ?? state?.viewpoint;
        const t = vp ? state?.idlookup?.[vp]?.formTheme : undefined;
        return isFormThemeName(t) ? t : undefined;
    });
```

`viewpointOfHost` (`:190-192`) restituisce già `DATA_MANAGER_VIEWPOINT_ID` per `host === 'manager'`:
la skin si legge dallo stesso selettore, con lo stesso `isFormSkinName` di guardia.

**La scrittura** — `DataManagerViewpointPanel.tsx:235-241`: `handleFormThemeChange` passa per
`writeViewpoint`, che materializza il singleton alla prima scrittura (R-DMV-6). Una select
`formSkin` sotto «Form theme» riusa quella funzione **senza aggiungere niente**: la
materializzazione è già nel canale.

---

## 7. H6 — La tabella: **falsificata**

`command grep -c -- "--color-form-" src/components/abstract/tabs/instanceManagerTab.scss` → **143 righe**.

Le prime sei per frequenza, con il conteggio delle occorrenze:

| Token | Occorrenze nella tabella |
|---|---:|
| `--color-form-muted` | 44 |
| `--color-form-border` | 25 |
| `--color-form-surface` | 16 |
| `--color-form-label` | 15 |
| `--color-form-border-strong` | 14 |
| `--color-form-section` | 11 |

La tabella **non ha token propri**: è costruita sugli stessi `--color-form-*` della form. Il memo
supponeva il contrario («la skin vale per la FORM del drawer; la tabella è un fronte a parte»), e
la supposizione è falsa nel senso che conta: la tabella *seguirebbe già* la skin, se solo la skin
la raggiungesse.

**Il DOM**. `InstanceManagerTab.tsx:2178`:

```tsx
        <div className="instance-manager">
```

e `:3014`, dentro quel div:

```tsx
                        <IRForm objectId={formSubjectId ?? subjectId} host="manager" />
```

`.instance-manager` è **antenato** di `.ir-form`. Quindi:

- `data-skin` su `.ir-form` (la lettera di R-SKIN-3): il drawer cambia, la tabella **no**. Due
  materiali diversi nella stessa schermata, con il drawer che si apre *sotto* la tabella
  (design handoff: «Instance form: below the table (chosen)»). È l'incoerenza che la slice C di
  R-DMV ha lavorato per evitare fra tabella e drawer, ripresentata sull'asse dell'aspetto.
- `data-skin` su `.instance-manager`: **una sola scrittura, entrambi**. Nessuna riga di CSS in più,
  nessun token in più, e la form nel drawer continua a ereditare.

**Proposta**: l'attributo va su `.instance-manager`. R-SKIN-3 nomina `.ir-form` perché quella è la
radice della form; la misura dice che la radice della *superficie* è un livello sopra. È un
emendamento di una parola, ma è una decisione (§11, Q2).

Nota di perimetro: `.ir-form` è montato **solo** dentro il manager (i due mount di
`InstanceManagerTab.tsx:3014` e `:3048`, entrambi `host="manager"`, dopo R-VP-14). Non esiste oggi
una form fuori dal manager che una skin agganciata a `.instance-manager` mancherebbe.

---

## 8. La parola «skin» è già presa

`command grep -rniE "\bskins?\b" src` → **45 righe**. (Il conteggio senza confini di parola dà 161:
120 sono `asking` / `masking` / `tasking`. Il numero utile è 45.)

Dove, e in che senso:

| File | Righe | Che cosa chiama «skin» |
|---|---:|---|
| `viewpoint/ir/irFormStyle.scss` | 12 | `plain \| card \| compact \| inspector` |
| `viewpoint/ir/formAutoLayout.ts` | 8 | idem, **come identificatori** |
| `viewpoint/ir/IRForm.tsx` | 5 | idem |
| `viewpoint/ir/irTypes.ts` | 1 | `/** Panel skin of a form rendering. */` su `FormTheme` |
| `jjform/themes.ts` | 1 | «the four panel skins» |

Non è solo prosa. `formAutoLayout.ts:77`, `:258`, `:316`, `:324` verbatim:

```typescript
import type { FormTheme as LegacySkin } from './irTypes';
export const LEGACY_SKIN_PRESET: Readonly<Record<LegacySkin, FormThemeName>> = {
    skin?: LegacySkin,
    const preset = skin ? FORM_THEME_PRESETS[LEGACY_SKIN_PRESET[skin]] : null;
```

E la radice che dovrebbe portare `data-skin` **già rende una classe di skin**, `IRForm.tsx:468`:

```tsx
            className={`ir-form ir-form--${theme}`}
```

con il commento a `:440` che dice «The skin keeps its class — every committed rule of the four
skins is untouched».

R-SKIN-4 dichiara che i due non entrano in conflitto *come tipi*, ed è vero: `FormSkinName` è
libero (`grep` = 0, §10). Ma **come vocabolario** il conflitto c'è, ed è su un elemento solo:
`class="ir-form ir-form--plain" data-skin="paper"` chiede a chi legge di tenere in testa due sensi
della stessa parola. Le uscite sono tre, tutte legittime, ed è una scelta di nomenclatura non di
codice: §11, Q1.

---

## 9. Proposta dei quattro preset (da ratificare, §11 Q4)

Tabella token × skin. `Slate` è l'assenza di regola e riporta i valori di oggi come riferimento.
**Sono una proposta di design, non una misura**: nessuno di questi valori è stato visto a schermo.

### Light

| Token | Slate (oggi) | Paper | Ink | Mist |
|---|---|---|---|---|
| `--color-form-surface` | `#ffffff` | `#fffdf8` | `#ffffff` | `#f7f9fb` |
| `--color-form-panel` | `#f8fafc` | `#faf6ec` | `#f1f5f9` | `#ffffff` |
| `--color-form-border` | `#e2e8f0` | `#e8dfcc` | `#334155` | `transparent` |
| `--color-form-border-strong` | `#cbd5e1` | `#d6c9ae` | `#0f172a` | `#e2e8f0` |
| `--color-form-muted` | `#94a3b8` | `#a1937a` | `#475569` | `#9aa7b4` |
| `--color-form-label` | `#475569` | `#6b5f4a` | `#0f172a` | `#64748b` |
| `--color-form-section` | `#64748b` | `#8a7c63` | `#1e293b` | `#94a3b8` |
| `--color-bg-tertiary` | `#f1f5f9` | `#f3ecdd` | `#e2e8f0` | `#eef2f6` |

### Dark

| Token | Slate (oggi) | Paper | Ink | Mist |
|---|---|---|---|---|
| `--color-form-surface` | `#16181a` | `#1c1915` | `#000000` | `#131517` |
| `--color-form-panel` | `#0f1012` | `#14120f` | `#0a0a0a` | `#0f1012` |
| `--color-form-border` | `rgba(255,255,255,.08)` | `rgba(232,223,204,.12)` | `#ffffff` | `transparent` |
| `--color-form-border-strong` | `rgba(255,255,255,.16)` | `rgba(232,223,204,.22)` | `#ffffff` | `rgba(255,255,255,.10)` |
| `--color-form-muted` | `#606060` | `#8a7f6a` | `#c8c8c8` | `#6b7076` |
| `--color-form-label` | `#a0a0a0` | `#bdb29a` | `#ffffff` | `#93999f` |
| `--color-form-section` | `#606060` | `#8a7f6a` | `#e0e0e0` | `#6b7076` |
| `--color-bg-tertiary` | `#16181a` | `#211d18` | `#141414` | `#1a1c1e` |

Il carattere di ciascuno, per come i valori sopra lo costruiscono, e da confrontare con R-SKIN-2:

- **Paper**: superficie calda avorio, bordi che virano al sabbia. Il contrasto testo/superficie
  resta quello del tema, perché `--color-text-primary` non si tocca (§3.2).
- **Ink**: bordi netti e scuri, etichette a piena forza. È l'unica skin che alza il contrasto, e lo
  fa dove è sicuro — bordi e testo secondario — senza toccare né il focus né la diagnostica.
- **Mist**: bordi trasparenti; i campi si distinguono dal solo tono della superficie contro il
  pannello. **Rischio da verificare a schermo**: `--color-form-border` a `transparent` toglie il
  bordo anche a controlli che oggi lo usano per essere *cliccabili* (il checkbox, il bottone Add
  tratteggiato, che usano `--color-form-border-strong` e restano visibili — ma va guardato).

---

## 10. Collisioni

`command grep -rn <id> frontend/src --include="*.ts" --include="*.tsx" --include="*.scss"`:

| Identificatore | Occorrenze | Verdetto |
|---|---:|---|
| `FormSkin` | 0 | libero |
| `formSkin` | 0 | libero |
| `data-skin` | 0 | libero |
| `SKIN_NAMES` | 0 | libero |
| `FORM_SKIN` | 0 | libero |
| `LegacySkin` | 4 | **occupato** (`formAutoLayout.ts`), §8 |
| `LEGACY_SKIN_PRESET` | 7 | **occupato** (+ 2 asserzioni in `formAutoLayout.test.ts`) |
| la parola `skin` | 45 righe | **occupata semanticamente**, §8 |
| `styles/tokens/_form-skins.scss` | il file non esiste | libero |

---

## 11. Domande aperte per Alfonso

**Q1 — Come si chiama il nuovo asse?** «Skin» è già il nome dei quattro preset di layout in
`irFormStyle.scss`, `formAutoLayout.ts` (`LegacySkin`, `LEGACY_SKIN_PRESET`), `IRForm.tsx` e
`irTypes.ts`, e la radice porta già `ir-form--plain`. Tre uscite:
(i) **tenere `skin`** e accettare i due sensi, contando su R-SKIN-4 e sul fatto che il vecchio è
marcato `Legacy`; (ii) **rinominare il nuovo** — `data-palette` / `formPalette` / `FormPaletteName`,
che descrive esattamente ciò che fa (rimappa colori) e non collide con niente;
(iii) rinominare il vecchio, che è **escluso**: sono literal persistiti (R-B9) e R-SKIN-4 lo vieta.
Raccomandazione: **(ii)**, perché il costo è zero oggi e il conflitto è permanente.

**Q2 — L'attributo su `.instance-manager` invece che su `.ir-form`?** §7 dice che con `.ir-form` la
tabella non segue, e che con `.instance-manager` seguono entrambi senza una riga in più. È un
emendamento a R-SKIN-3.

**Q3 — `--radius-sm` dentro o fuori?** §3.3: rimapparlo nello scope cambia anche i controlli non
della form che stanno dentro lo scope. Se «bordi morbidi» serve a `Paper`, la strada pulita è
`--radius-control` o un token nuovo. Proposta: **fuori**.

**Q4 — I valori dei quattro preset** (§9) sono una proposta di design, non una misura. Da guardare
a schermo prima di scriverli: sono definitivi solo nel senso che i progetti persistono il *nome*,
non i valori, quindi si possono correggere — ma vanno visti.

**Q5 — chiusa in discovery, non è una domanda.** `--color-form-summary` è vivo: un consumatore,
`irFormStyle.scss:147`. Resta nella lista dei nove. Nessuna decisione richiesta.

**Q6 — La skin è per progetto o per viewpoint?** R-SKIN-3 dice sul singleton, quindi **una per
progetto**, coerente con R-DMV-6 («un tema e un set di override per progetto»). Confermare: è
l'unica lettura che non richiede una cascata.

---

## 12. Proposta di affettatura della Fase 2

Ogni slice sotto i 5 file, ciascuna committabile e verificabile da sola.

**Slice A — il registro e il campo** (3 file + 1 test)
`jjform/skins.ts` nuovo (registro chiuso, zero import, a specchio di `themes.ts`: i nomi, il
default, `isFormSkinName`), `view/viewElement/view.tsx` (`formSkin?` accanto a `formTheme`),
`joiner/index.ts` (riesporto), test del registro.
*Verifica*: niente cambia a schermo; il campo esiste e nessuno lo scrive.

**Slice B — i token e `data-skin`** (3 file)
`styles/tokens/_form-skins.scss` nuovo (quattro × due regole, §5.2), `styles/tokens/index.scss`
(un import), `IRForm.tsx` o `InstanceManagerTab.tsx` a seconda di Q2 (l'attributo sulla radice).
*Verifica*: **a mano**, scrivendo `formSkin` dalla console sul singleton: le quattro skin in light
e in dark, tabella e drawer insieme.

**Slice C — la select** (1 file)
`DataManagerViewpointPanel.tsx`, sotto «Form theme», stesso `writeViewpoint`.
*Verifica*: R-SKIN-3 per intero, più il negativo — un progetto senza `formSkin` è identico a oggi.

Una sonda end-to-end sul modello delle cinque di R-DMV chiude B e C insieme: stessa sessione,
stesso progetto, le quattro skin scritte a caldo, i valori calcolati letti da
`getComputedStyle` su un campo della tabella **e** su uno del drawer — che è l'unico modo di
misurare Q2 invece di guardarlo.

---

## 13. Rischi

| # | Rischio | Gravità | Mitigazione |
|---|---|---|---|
| R1 | La skin aggancia `.ir-form`: tabella e drawer si sfasano (§7) | **Alta** — incoerenza visibile nella stessa schermata | Q2, e la sonda che misura entrambi |
| R2 | La regola della skin dichiara solo il light e dipinge il chiaro anche in dark (§5.2) | **Alta** — silenziosa, si vede solo aprendo il tema scuro | Due regole per skin, e lo smoke in entrambi i temi |
| R3 | Due sensi di «skin» sullo stesso elemento (§8) | Media — costo di comprensione permanente | Q1 |
| R4 | `--radius-sm` rimappato tocca controlli non della form nello scope (§3.3) | Media | Q3: fuori dalla lista |
| R5 | `Mist` con `--color-form-border: transparent` toglie il bordo a controlli che lo usano per essere leggibili | Media | Verifica a schermo del checkbox e del bottone Add |
| R6 | Un token della skin è alias nel dark (`--color-form-label` e altri due, §4) e la sovrascrittura rompe l'aggancio | Bassa — voluto, ma va scritto letterale | Valori letterali nelle regole delle skin |
| R7 | `--color-form-summary` ha un solo consumatore, nella form e non nella tabella: una skin che lo dimentica sfasa la striscia dei problemi | Bassa | Nella lista dei nove, §3.1 |

---

## 14. Test a rischio

| Test | Cosa asserisce | Rischio |
|---|---|---|
| `viewpoint/ir/__tests__/formAutoLayout.test.ts:248-249` | `Object.keys(LEGACY_SKIN_PRESET).sort()` è esattamente `['card','compact','inspector','plain']` | **Nullo** se il nuovo registro è un modulo a parte; **certo** se qualcuno prova a fondere i due |
| `viewpoint/ir/__tests__/irFormLabelColumn.test.ts` | una riga cita «skin» | Basso, prosa |
| `editors/viewpoint/properties/__tests__/viewpointThemeHint.test.ts` | `ViewpointProperties.tsx` non contiene `LProject.getProject`, `viewpoints`, `_lastSelected` | **Nullo**: la select nuova sta in `DataManagerViewpointPanel.tsx`, che è un file diverso |
| `TreeViewSidebar/__tests__/dataManagerSection.test.ts` | il pannello e la sezione | Nullo |
| Smoke `npm run smoke` | tre stati, tutti da progetto nuovo | Non copre il tema scuro né la skin: da dichiarare, non da dare per coperto |

---

## 15. Cosa questa discovery **non** ha misurato

Dichiarato perché non venga letto come silenzio.

- **Non ho eseguito nulla.** Nessun `npm run build`, nessun test, nessun dev server, nessuno
  screenshot. Ogni «funziona così» è lettura di sorgente più aritmetica di `grep`.
- **I valori dei quattro preset** (§9) sono una proposta a tavolino: nessuno è stato visto a
  schermo, in nessuno dei due temi.
- **Che la regola della skin vinca sull'ereditarietà** (§5.2) è la semantica delle custom property,
  non una misura su questo repo: da confermare eseguendo, ed è la prima cosa che la sonda della
  slice B deve dire.
- **I 17 file `widgets/*.tsx`** sono stati censiti per i colori diretti (§2), non letti per intero.
- **`docs/DESIGN-SYSTEM.md`** non è stato letto: `CLAUDE.md` §7 lo riassume e nulla in questa
  discovery dipendeva da un dettaglio che solo lui porta. Se la Fase 2 introduce un token nuovo
  (`--color-form-radius`, Q3), va letto prima.
- **Il tema scuro a schermo**: mai aperto in questa sessione. R2 resta un rischio dedotto.
