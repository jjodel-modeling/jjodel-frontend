# Prompt Claude Code: skin della form del Data Manager, Fase 1 discovery (R-SKIN)

**Data**: 2026-09-04 23:02
**Repo**: `jjodel-frontend`, branch `alfonso-frontend-jjtl`, HEAD `5b9d55998` (più il commit docs di questo prompt)
**Modello / effort**: xhigh
**Tipo**: feat, corsia completa (two-phase). Questa è la **Fase 1, read-only**, con hard stop.
**Critical zone**: non attesa (stile e un campo sul singleton). Se la discovery tocca `VersionFixer.tsx`
o i writer D-layer, fermarsi e dirlo.

Leggi `CLAUDE.md` (§7 design system, regola 27 e 28), `docs/decisions.md` (serie R-SKIN, R-DMV) e
`docs/claude-code-log.md`. Memo: `docs/ratifiche/claude_2026-09-04_2302_memo_ratifica_form_skins.md`.

## 1. COSA (contesto della Fase 2, da non implementare ora)
Quattro skin chiuse (`Slate`, `Paper`, `Ink`, `Mist`) per la form del Data Manager: registro in
`jjform/skins.ts`, `formSkin?` sul singleton, `data-skin` sulla radice `.ir-form`, rimappature dei
token in `styles/tokens/` light+dark, select nel `DataManagerViewpointPanel`. Default `Slate` = oggi.

## 2. Ipotesi da falsificare
- H1: `irFormStyle.scss` e i widget in `viewpoint/ir/widgets/` NON usano colori diretti ma solo
  `var(--…)`: una skin può quindi essere una rimappatura di token senza toccare i componenti.
  Misurare: `command grep -c "#[0-9a-fA-F]\{3,8\}\|rgb(" ` su `irFormStyle.scss` e su ogni file
  in `widgets/`; ogni occorrenza diretta è un'eccezione da elencare con `file:riga`.
- H2: i token della form sono pochi e nominabili. Censire con conteggio tutti i `var(--…)` di
  `irFormStyle.scss` e dei widget; separare i token «di forma» (`--color-form-surface`,
  `--color-form-border`, `--color-form-muted`, `--color-bg-tertiary`, `--radius-sm`, altri) da quelli
  globali che una skin NON deve rimappare (`--color-text-primary`, `--color-accent`, `--space-*`,
  `--text-*`). Proposta: la lista esatta dei token che una skin rimappa.
- H3: `--color-form-*` sono definiti in ENTRAMBI `styles/tokens/_colors-light.scss` e
  `_colors-dark.scss` (§7.2). Riportare `file:riga`.
- H4: una regola `.ir-form[data-skin="paper"] { --color-form-surface: … }` può stare in
  `styles/tokens/` (o in un file nuovo `styles/tokens/_form-skins.scss` importato da `index.scss`)
  senza violare la regola 28, e vince per specificità sulle definizioni di `:root`. Dire come il tema
  scuro si combina (`[data-theme="dark"]` o media query? leggere come `_colors-dark.scss` è applicato).
- H5: il pannello del singleton (`DataManagerViewpointPanel.tsx`) legge/scrive `formTheme` con un
  pattern replicabile per `formSkin` (`view.tsx:248` `formTheme?: FormThemeName`; dove `IRForm.tsx`
  lo legge, `:214` circa, e come lo propaga come `data-*`).
- H6: il drawer del manager e la tabella condividono lo stesso albero DOM sotto `.ir-form`? Se la
  tabella (`InstanceManagerTab.tsx`) usa token propri, la skin oggi non la tocca: dirlo, e dire se
  deve (proposta: la skin vale per la FORM del drawer; la tabella è un fronte a parte).

## 3. File da leggere
`frontend/src/components/editor-v2/viewpoint/ir/irFormStyle.scss`; `frontend/src/components/editor-v2/viewpoint/ir/widgets/*.tsx|*.scss`;
`frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` (`:200-230`, `:460-480`);
`frontend/src/components/editor-v2/viewpoint/ir/formAutoLayout.ts` (`:250-340`); `frontend/src/jjform/themes.ts`;
`frontend/src/styles/tokens/index.scss`, `_colors-light.scss`, `_colors-dark.scss`, `README.md`;
`frontend/src/styles/variables.scss`; `frontend/src/components/editors/viewpoint/properties/DataManagerViewpointPanel.tsx`
(o il path reale: grep del nome); `frontend/src/view/viewElement/view.tsx` (`:210-260`);
`docs/DESIGN-SYSTEM.md`; `docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md` (sezione Themes).

## 4. Domande a cui il referto risponde
1. La lista esatta dei token che una skin rimappa (H2), con i valori attuali light/dark di ciascuno.
2. Le eccezioni: colori diretti nella form o nei widget (H1), con `file:riga`.
3. Dove vive la regola `[data-skin]` (H4) e come si combina con il dark.
4. Dove si aggiunge `data-skin` (IRForm) e da dove si legge `formSkin` (dal singleton, come il tema).
5. Il campo `formSkin?` su `DViewElement`/`DViewPoint`: dove dichiararlo, come `formTheme`.
6. La select nel pannello: pattern di `formTheme` replicato; nessun altro controllo.
7. La tabella del manager (H6): dentro o fuori la skin, con motivazione.
8. Proposta dei valori dei quattro preset (light e dark) come tabella token × skin, da sottoporre ad
   Alfonso prima della Fase 2: è una scelta di design, non di codice.
9. Collisioni: grep di `skin`, `FormSkin`, `formSkin`, `data-skin` su `frontend/src`.
10. Test a rischio e proposta di affettatura della Fase 2 (registro + campo; token + data-skin;
    select; una slice per commit).

## 5. Referto
`docs/discovery/discovery_2026-09-04_form_skins.md` (suffisso `_N` se esiste). Contenuto minimo:
H1..H6 con esito, file letti, findings con `file:riga`, tabella token × skin proposta, rischi,
affettatura, domande aperte. **HARD STOP**: la Fase 2 parte solo dopo un GO in chat.

## 6. Cosa NON fare
Nessuna modifica al codice. Non toccare `irTypes.ts` `FormTheme` (R-SKIN-4). Nessun colore diretto
nei componenti. Nessuna migrazione.
