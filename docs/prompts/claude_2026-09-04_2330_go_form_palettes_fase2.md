# GO emendato: palette della form del Data Manager (R-SKIN), Fase 2

**Data**: 2026-09-04 23:30
**Referto**: `docs/discovery/discovery_2026-09-04_form_skins.md` (`715054349`, Fase 1 chiusa)
**Ratifiche**: R-SKIN-1..4 + R-SKIN-3-bis in `docs/decisions.md`
**Effort**: xhigh. Corsia completa; ogni slice un commit.

## Risposte alle quattro domande (§11 del referto)
- **Q1 — `palette`**, ovunque: `jjform/palettes.ts`, `FormPaletteName`, `FORM_PALETTE_PRESETS`,
  `FORM_PALETTE_NAMES`, `FORM_PALETTE_DEFAULT_NAME = 'Slate'`, `isFormPaletteName`; campo `formPalette?`
  su `DViewElement` accanto a `formTheme`; attributo `data-palette`; etichetta «Palette» nel pannello.
  Grep di ogni nome prima di crearlo (§10 del referto: 0 occorrenze per `palette`).
- **Q2 — sì, `.instance-manager`** (`InstanceManagerTab.tsx:2178`): una scrittura copre tabella e
  drawer. `IRForm.tsx` non porta l'attributo.
- **Q3 — `--radius-sm` fuori.** La lista è i nove token di §3 (`--color-form-surface`, `-panel`,
  `-border`, `-border-strong`, `-muted`, `-label`, `-section`, `-summary`, `--color-bg-tertiary`).
- **Q4 — la tabella §9 è la bozza**, con due ritocchi: `Ink` dark `--color-form-border` `#c4c9ce`
  (non `#ffffff`; `border-strong` resta `#ffffff`); `Mist` `--color-form-border` `rgba(15,23,42,.05)`
  light e `rgba(255,255,255,.04)` dark invece di `transparent`. Calibrazione a schermo all'HARD STOP
  della slice B, light e dark.

## Vincolo portante (§5 del referto)
La regola della palette vince per ereditarietà, non per specificità, quindi copre anche il dark:
**due regole per palette**, light e dark, nello stesso file `styles/tokens/_form-palettes.scss`, con la
stessa condizione con cui `_colors-dark.scss` è applicato (leggerla, non presumerla). `Slate` non ha
regole: è l'assenza di attributo o `data-palette="slate"` senza rimappature, così nessun progetto cambia.

## Slice (§12 del referto, con Q1)
**A** registro + campo: `jjform/palettes.ts` (nuovo, zero import, a specchio di `themes.ts`),
`view/viewElement/view.tsx` (`formPalette?: FormPaletteName` accanto a `formTheme`, stesso docstring
«absent is a value», nessuna migrazione), `joiner/index.ts` (riesporto), test del registro.
Verifica: niente cambia; commit.
**B** token + attributo: `styles/tokens/_form-palettes.scss` (nuovo), `styles/tokens/index.scss`
(import), `InstanceManagerTab.tsx` (`data-palette` su `.instance-manager`, letto dal singleton come il
tema, in kebab-case minuscolo). **HARD STOP**: le quattro palette scritte da console sul singleton
(`formPalette`), light E dark, tabella e drawer insieme; qui si calibrano i valori.
**C** select nel `DataManagerViewpointPanel` sotto «Form theme», stesso `writeViewpoint`, etichetta
«Palette», default «Slate». Sonda end-to-end su B+C: `getComputedStyle` su un campo della tabella e uno
del drawer per ciascuna palette (misura Q2). **HARD STOP**: un progetto senza `formPalette` identico a oggi.

Ogni slice: `git commit -- <file>`, docs e codice separati, entry di log dopo la conferma visiva.

## Cosa resta com'era
`irTypes.ts` `FormTheme` intatto (R-SKIN-4). Nessun colore nei componenti (regola 28). Nessuna
proprietà CSS nuova: solo i nove token. Nessuna migrazione.
