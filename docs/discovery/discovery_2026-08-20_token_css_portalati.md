# Discovery, censimento dei token CSS nel contesto portalato

**Data**: 2026-08-20 - **Branch**: `alfonso-frontend-jjtl` - **HEAD**: `363e121c0`
**Prompt**: `claude_2026-08-20_0025_prompt_ui_D_token_portalati.md`
**Tipo**: discovery pura, read-only. Nessun file di codice modificato, nessun commit.

Misure prese sul DOM vivo (`http://localhost:3000`, viewport 1440x900, progetto creato ex novo dalla
UI, utente offline) con quattro sonde Playwright temporanee, **rimosse a fine sessione**: il
`git status` finale mostra solo questo report piu' gli undici file non tracciati gia' presenti a
inizio sessione. Dove una misura non e' stata presa, e' scritto.

---

## 0. Esito in una riga, e le tre premesse del prompt che la misura falsifica

**La popolazione cercata esiste ma e' piccola e nota: nel rail destro portalato c'e' una sola
variabile che non risolve, `--text-muted`, con due occorrenze senza fallback, e nessun altro
sottoalbero portalato del prodotto usa un token di tema senza fallback.** Il numero non e' una
stima: viene da un censimento statico completo su 193 fogli SCSS piu' una verifica in pagina su 234
nomi, con controllo positivo.

Tre premesse del prompt sono state falsificate dalla misura e vanno lette prima del resto.

1. **Il rail sinistro non e' portalato.** Il prompt lo elenca fra i sottoalberi da censire («Almeno:
   il rail destro [...] e il rail sinistro»). Misurato: `.editor-v2-palette` e' figlio diretto di
   `div.editor-v2.theme-light.notation-uml`, ha un antenato di tema, e tutti e 91 i token risolvono
   al suo interno. Vedi §2.2. Il rail sinistro non ha nessun problema di questa famiglia, oggi.
2. **Il dark mode arriva ai portal, per meta'.** Il prompt propone come ipotesi da falsificare che
   «i portal non cambiano affatto al cambio di tema». Falso: `data-theme` sta su `<html>`, che e'
   antenato di ogni portal, e i token del design system vivono su `:root[data-theme]`. Misurato: 58
   nomi su 234 cambiano valore fra light e dark **dentro** il rail portalato. Vedi §6.
3. **La riga che il prompt cita come esempio dice il vero ma non per la ragione che dichiara.** Il
   titolo di `GENERAL` esce nero, misurato `rgb(0, 0, 0)`; ma non «cade sull'ereditato» dal rail:
   cade sull'ereditato **dal `<button>` che lo contiene**, che nessuna regola colora e che quindi
   tiene il `color: buttontext` dello user-agent. Il rail sopra di lui e' a `rgb(15, 23, 42)`. Vedi
   §5.4: cambia quale regola va scritta per ripararlo.

Un quarto scostamento, non sul prompt ma su una ratifica: **R-RAIL-44 dichiara che il dark «resta
accessibile solo scrivendo `localStorage.theme`». Non e' piu' vero**, ed e' stato verificato
guidando l'interfaccia. Vedi §6.3.

---

## 1. File letti

Sorgenti dei portal:

- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (i due `createPortal`, il tipo `mode: 'floating'`, `overlayActive`, `showFloatingCluster`)
- `frontend/src/components/editor-v2/EditorV2.tsx` (i tre `createPortal`, la classe `editor-v2 theme-${theme} notation-${notation}`, il montaggio di `PalettePanel` e `EdgeTypePopup`)
- `frontend/src/common/ErrorPortal.tsx`, `frontend/src/components/dock/MyDock.tsx`, `frontend/src/components/dock/TabsOverflowMenu.tsx`
- `frontend/src/components/contextMenu/ContextMenu.tsx` (import morto di `createPortal`, vedi §2.3)
- `frontend/src/components/editor-v2/ContextMenu.tsx`, `frontend/src/components/editor-v2/problems/NodeProblemOverlay.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/TextStyleField.tsx`
- `frontend/src/components/editors/EdgeMarkerEditorModal.tsx`, `frontend/src/components/editors/InteractivePathCanvas.tsx`
- `frontend/src/components/envgen/EnvGenWizardModal.tsx`, `frontend/src/components/forEndUser/Color.tsx`
- `frontend/src/components/megamodel/MegamodelView.tsx`, `frontend/src/components/megamodel/MegamodelContextMenu.tsx`
- `frontend/src/components/Settings/UnifiedSettingsModal/UnifiedSettingsModal.tsx`, `frontend/src/pages/components/about/AboutDialog.tsx`, `frontend/src/pages/components/Navbar.tsx`

Definizione e consumo dei token:

- `frontend/src/components/editor-v2/_themes.scss` (i due soli blocchi, 91 nomi ciascuno)
- `frontend/src/components/editor-v2/_color-schemes.scss`, `frontend/src/components/editor-v2/_notations.scss`
- `frontend/src/components/editor-v2/hooks/useCustomPaletteStyleSheet.ts`, `frontend/src/components/editor-v2/utils/derivePalette.ts`
- `frontend/src/components/editor-v2/EditorV2.scss` (blocco `.context-menu` e il suo commento, blocchi scheme 3447-3530, `.jj-properties`, `.editor-v2-minimap-portal`)
- `frontend/src/components/editor-v2/sim/simulation-panel.scss` (il precedente gia' in albero)
- `frontend/src/styles/tokens/index.scss`, `_colors-light.scss`, `_colors-dark.scss`, `frontend/src/styles/variables.scss`, `frontend/src/App.scss`
- `frontend/src/components/abstract/style.scss`, `frontend/src/components/abstract/style_ap.scss`, `frontend/src/pages/components/style.scss` (le mappature legacy su `body`)
- `frontend/src/components/editors/info-improvements.scss`, `frontend/src/components/editors/properties-with-tree-view.scss`, `frontend/src/styles/style.scss` (regola `i.bi`)
- `frontend/src/styles/classic-object-view.scss` (il commento che gia' documenta il vincolo)
- `frontend/src/services/ThemeService.ts`, `frontend/src/pages/settings/AppearanceSettings.tsx`, `frontend/src/components/Settings/UnifiedSettingsModal/sections/AppearanceSection.tsx`

Documenti: `docs/decisions.md` (serie R-RAIL, in particolare R-RAIL-44), `docs/claude-code-log.md`,
`docs/discovery/discovery_2026-08-19_layout_rail_e_overlay.md` §3.1,
`docs/discovery/discovery_2026-08-19_property_editor_coerenza.md` §2.3.

---

## 2. Punto 1: il perimetro portalato

### 2.1 I portal esistenti

Venti chiamate a `createPortal` in diciannove file. Diciotto puntano a `document.body`; una punta a
un contenitore rc-dock che sta dentro l'albero dell'app; una e' un import mai usato.

| Componente | Chiamata | Nodo di destinazione | Fuori da `.editor-v2` |
|---|---|---|---|
| `editors/PropertiesWithTreeView.tsx` | :671 | `document.body` | **si** (rail destro) |
| `editors/PropertiesWithTreeView.tsx` | :681 | `document.body` | **si** (pillola di riapertura) |
| `editor-v2/EditorV2.tsx` | :4045 | `document.body` | **si** (`ContextMenu`) |
| `editor-v2/EditorV2.tsx` | :4055 | `document.body` | **si** (`PolymetricView`) |
| `editor-v2/EditorV2.tsx` | :4066 | `document.body` | **si** (`SimulationPanel`) |
| `editor-v2/problems/NodeProblemOverlay.tsx` | :174 → :241 | `document.body` | **si** |
| `editor-v2/viewpoint/authoring/TextStyleField.tsx` | :166 → :190 | `document.body` | **si** |
| `editors/EdgeMarkerEditorModal.tsx` | :497 | `document.body` | **si** |
| `editors/InteractivePathCanvas.tsx` | :757 → :821 | `document.body` | **si** |
| `envgen/EnvGenWizardModal.tsx` | :154 → :259 | `document.body` | **si** |
| `forEndUser/Color.tsx` | :122 → :134 | `document.body` | **si** |
| `megamodel/MegamodelView.tsx` | :1019 e :1045 | `document.body` | **si** |
| `megamodel/MegamodelContextMenu.tsx` | :76 → :110 | `document.body` | **si** |
| `Settings/UnifiedSettingsModal/UnifiedSettingsModal.tsx` | :149 → :204 | `document.body` | **si** |
| `pages/components/about/AboutDialog.tsx` | :49 → :128 | `document.body` | **si** |
| `pages/components/Navbar.tsx` | :1902 → :1924 | `document.body` | **si** |
| `dock/TabsOverflowMenu.tsx` | :173 → :206 | `document.body` | **si** |
| `common/ErrorPortal.tsx` | :118 | `document.body` | **si** |
| `dock/MyDock.tsx` | :34 | `this.container` (prop o `document.querySelector`) | no, sta nell'albero rc-dock |
| `contextMenu/ContextMenu.tsx` | :47, solo import | mai chiamata | n/a, vedi §2.3 |

Nella catena DOM misurata in pagina, il rail destro e' `div.properties-tree-overlay` figlio diretto
di `body`, e il rail vero e' `div.properties-with-tree-view...` dentro di lui. `el.closest('.editor-v2')`
vale `null`, e `el.closest('.theme-light, .theme-dark')` vale `null`.

**Il rail destro e' sempre portalato, non solo sopra un canvas.** Il prompt A lo descrive come
overlay sul canvas; misurato, e' portalato anche sulla pagina di progetto senza nessun tab editor
aperto (`overlay: true, insideEditor: false, parent: DIV.properties-tree-overlay`). Il tipo della
prop e' il letterale `mode: 'floating'` e l'unico sito di montaggio e' `Dashboard.tsx:639`: non
esiste un ramo non portalato.

### 2.2 Il rail sinistro non e' portalato: correzione al prompt

`PalettePanel.tsx` restituisce un `<aside className="editor-v2-palette">` che `EditorV2.tsx` monta
in flusso. Catena misurata, per entrambe le istanze presenti (M2 e M1):

```
aside.editor-v2-palette
  div.editor-v2.theme-light.notation-uml      <- antenato di tema presente
    div.editor-switch-stage
      div.editor-switch-container
        ...
```

Tutti e 91 i token di tema risolvono dentro `.editor-v2-palette`. Il censimento dinamico delle
regole che lo vestono trova cinque variabili in uso (`--color-accent`, `--font-color-1`,
`--text-dim`, `--text-muted`, `--text-secondary`) e tutte e cinque risolvono.

Il rail sinistro entra in questo report per una ragione sola: **e' il donatore delle regole che il
prompt A voleva trapiantare sul rail destro** (`--border-subtle` per il bordo), e quel trapianto e'
esattamente il caso in cui il difetto si crea. Vedi §5.3.

### 2.3 Un import morto e una collisione di nome

`components/contextMenu/ContextMenu.tsx:47` importa `createPortal` e non lo chiama mai: quel menu
(quello della navbar, `className={'context-menu round'}`) resta in flusso. Misurato in pagina:
tredici elementi `.context-menu` presenti, tutti nella catena
`div.content.context-menu < div.nav-hamburger < nav#navbar < div.router-wrapper < div#root < body`.

Ne segue una collisione che riguarda chiunque tocchi quel blocco: **due componenti diversi emettono
la stessa classe `.context-menu`**, quello legacy sopra e quello dell'editor
(`editor-v2/ContextMenu.tsx:30`, portalato su `body`), e il blocco `.context-menu` di
`EditorV2.scss:3259` e' un selettore globale, quindi li veste entrambi. Censita, non toccata; e'
rilevante perche' la strada di fix B (§7.2) passa proprio da li'.

### 2.4 Esiste gia' un punto in cui il tema viene ricopiato sul nodo portalato?

**No per la classe, si per il meccanismo, e il meccanismo che esiste e' migliore.**

- Nessuno ricopia `theme-light`/`theme-dark` su un nodo portalato. La ricerca di quelle due stringhe
  nel `.ts`/`.tsx` restituisce un solo sito di scrittura, `EditorV2.tsx:3937`, che le mette sul
  `div.editor-v2`. Controllo positivo sulla stessa forma di ricerca: cercando `data-theme` la stessa
  grep restituisce sette file, quindi ha segnale.
- **Il tema e' pero' gia' su un antenato di ogni portal**: `ThemeService.apply` scrive
  `document.documentElement.setAttribute('data-theme', theme)` (`ThemeService.ts:33`), e i token del
  design system sono definiti su `:root` e `:root[data-theme="dark"]` (`styles/tokens/`). Le due
  sorgenti non possono divergere: `EditorV2.tsx:814` legge `useTheme()`, che e' lo stesso
  `ThemeService`. Il pattern da riusare, quindi, non e' «ricopiare la classe» ma «pubblicare i token
  anche dove il tema gia' arriva».

Due precedenti in albero mostrano invece la **rinuncia** al problema, non la sua soluzione, ed
entrambi sono documentati a commento:

- `EditorV2.scss:3257-3259`: «Context menu is portaled to `<body>` via createPortal, so CSS variables
  defined on `.editor-v2.theme-dark/.theme-light` are NOT inherited. Every `var()` MUST have a
  hardcoded fallback matching the dark float palette.» Verificato: le otto occorrenze di token di
  tema in quel blocco hanno **tutte** un fallback.
- `sim/simulation-panel.scss:3-8`: stessa constatazione, e la scelta opposta, cioe' usare solo i token del
  design system, che stanno su `:root`, e non definire nessuna variabile nel file.

`styles/classic-object-view.scss:9-13` documenta il caso complementare, cioe' un consumatore che sta
**dentro** `.editor-v2` e che per questo puo' usare i token di tema senza fallback.

---

## 3. Punto 2: dove sono definite le variabili di tema

### 3.1 `_themes.scss`, due blocchi, 91 nomi, insiemi identici

`components/editor-v2/_themes.scss` ha **due soli selettori di primo livello**, verificato leggendo
tutte le righe non indentate del file:

- `.editor-v2.theme-dark` (riga 6)
- `.editor-v2.theme-light` (riga 152)

Ciascuno definisce **91** custom property. **Gli insiemi di nomi sono identici**: il `comm -23` e il
`comm -13` fra le due liste ordinate restituiscono entrambi zero righe. Questa e' la risposta alla
domanda che il prompt segnala come decisiva per il costo del fix: non c'e' un tema che ne definisce
di piu', quindi promuovere i token e' una duplicazione simmetrica, 91 e 91, senza buchi da colmare a
mano.

Delle 91, **73 sono referenziate almeno una volta** in `src` e **18 non lo sono mai**:
`--canvas-dots`, `--accent-hover`, `--green`, `--purple`, `--amber`, `--field-row-border`,
`--danger`, `--menu-bg`, `--menu-shadow`, `--minimap-mask`, `--topbar-bg`, `--topbar-border`,
`--topbar-text`, `--panel-bg`, `--panel-border`, `--sidebar-bg`, `--sidebar-border`,
`--float-text-muted`. Chi decide il fix puo' usare questo numero: la duplicazione minima indispensabile
e' 73 nomi, non 91.

### 3.2 Chi ridefinisce quei nomi, e a quale specificita'

| Sorgente | Selettore | Specificita' | Nomi toccati |
|---|---|---|---|
| `_themes.scss` | `.editor-v2.theme-{dark,light}` | (0,2,0) | 91 |
| `_notations.scss` | `.editor-v2.notation-{simplified,compact,wireframe,er}` | (0,2,0) | 7 occorrenze |
| `_color-schemes.scss` | `.editor-v2.scheme-X` + `&.theme-{dark,light}` annidato | (0,3,0) | 8 palette |
| `EditorV2.scss` 3447-3530 | `.editor-v2.scheme-X .theme-Y` | (0,3,0) | header/testo dei nodi |
| `EditorV2.scss:2218` | `.editor-v2.hide-background` | (0,2,0) | `--canvas-bg` |
| `useCustomPaletteStyleSheet.ts` | `.editor-v2.scheme-<id>.theme-<t>`, iniettato a runtime in `<style id="jjodel-custom-palettes">` | (0,3,0) | palette utente |

L'ordine di sorgente e' fissato da `EditorV2.scss:4-6`: `@import './themes'` prima, poi
`'./notations'`, poi `'./color-schemes'`. I pareggi a (0,2,0) sono risolti da quest'ordine, che va
preservato da qualunque fix.

### 3.3 Il livello `:root` esiste gia', con un sottoinsieme disgiunto

`App.scss:6` importa `./styles/tokens/index`, che a sua volta importa `colors-light` (`:root` nudo e
`:root[data-theme="light"]`), `colors-dark` (`:root[data-theme="dark"]`), tipografia, spaziature,
ombre, raggi, transizioni, z-index. **Nessuno dei 91 nomi di `_themes.scss` e' fra questi**: i due
insiemi sono per nome disgiunti, `--text-primary` contro `--color-text-primary`, `--surface-1`
contro `--color-bg-secondary`, e cosi' via. Non c'e' quindi nessun rischio di collisione se i token
di tema vengono promossi.

### 3.4 Due nomi che risolvono anche su `body`, con un valore diverso

Due dei 91 sono anche mappature legacy su `body`:

| Nome | Definito su `body` in | Valore su `body` | Valore in `.editor-v2` (light) |
|---|---|---|---|
| `--accent` | `abstract/style.scss:10`, `abstract/style_ap.scss:10`, `pages/components/style.scss:9` (`var(--color-accent)`) | `#334155` | `#0284c7` |
| `--danger` | `variables.scss:32`, `abstract/style.scss:25`, `abstract/style_ap.scss:25`, `pages/components/style.scss:17`, `dock/DockManagerStyles.scss:22` | `#ef4444` | `#dc2626` |

Questa e' la categoria peggiore delle tre, e va detta esplicitamente perche' nessun test la vede:
**la variabile risolve, quindi non c'e' nessun sintomo di rottura, ma il valore e' quello sbagliato.**
Chiunque scriva `color: var(--accent)` dentro un sottoalbero portalato ottiene lo slate del dock
invece del blu dell'editor, in silenzio. Oggi nessuna regola del rail lo fa; e' un rischio per la
Fase 2 di A e C, non un difetto in essere. `--accent` e' inoltre un token legacy che
`CLAUDE.md` §7.2 vieta di reintrodurre, il che rende il caso teorico piu' che pratico.

---

## 4. Punto 3: il censimento statico

### 4.1 I fogli che vestono il rail destro

L'insieme e' stato calcolato, non indovinato: chiusura transitiva degli `import` locali a partire da
`PropertiesWithTreeView.tsx`, profondita' 6, 151 moduli visitati, **33 fogli SCSS/CSS raggiunti**.

```
components/HelpButton.scss                       components/editors/node-editor-redesign.scss
components/TreeViewSidebar/tree-view-sidebar.scss components/editors/node-editor.scss
components/commandbar/commandbar.scss            components/editors/properties-with-tree-view.scss
components/common/element-badge.scss             components/editors/style.scss
components/editor-v2/viewpoint/authoring/SymbolCard.scss
components/editors/EdgeMarkerEditorModal.scss    components/editors/viewpoint/properties/properties.scss
components/editors/EditorFullscreenModal.scss    components/editors/views/data/events-tab.scss
components/editors/EditorToolbar.scss            components/editors/views/data/palette-data.scss
components/editors/InteractivePathCanvas.scss    components/editors/views/data/viewapplyto.scss
components/editors/editors.scss                  components/editors/views/data/viewoptions.scss
components/editors/empty.scss                    components/editors/views/nestedView.scss
components/editors/info-improvements.scss        components/forEndUser/FunctionComponent.scss
components/editors/info.scss                     components/forEndUser/GenericInput.scss
components/forEndUser/Info.scss                  components/forEndUser/color.scss
components/forEndUser/control.scss               components/forEndUser/inputselect.scss
components/ui/Toggle/Toggle.module.css           components/viewParenting/viewParenting.scss
components/widgets/widgets.scss                  pages/components/icons/icons.scss
```

Su questi 33 file: **902 occorrenze di `var(--`, 144 nomi distinti**.

### 4.2 Quante di quelle 144 sono token di tema: una

| Nome | Occorrenze | Senza fallback | Con fallback | File |
|---|---|---|---|---|
| `--text-muted` | 2 | **2** | 0 | `components/editors/info-improvements.scss:943, :951` |

Le altre 143 sono token del design system (`--color-*`, `--space-*`, `--radius-*`, `--font-*`),
token locali, o nomi morti. I dieci nomi piu' usati, per dare la scala: `--radius-sm` (71),
`--color-accent` (51), `--color-text-primary` (42), `--space-2` (42), `--btn-bg` (39),
`--color-text-secondary` (29), `--color-bg-tertiary` (28), `--color-text-tertiary` (28),
`--color-bg-secondary` (24), `--space-3` (22). Nessuno di questi e' scoped a `.editor-v2`.

### 4.3 Il censimento a livello di repo, per sapere se il rail e' un caso isolato

Stessa misura su **tutti** i 193 fogli SCSS di `frontend/src`: **478 occorrenze di token di tema, in
17 file**, 290 delle quali senza fallback.

| Occorrenze | Senza fallback | File | Sottoalbero portalato? |
|---|---|---|---|
| 308 | 273 | `components/editor-v2/EditorV2.scss` | quasi tutto no, vedi sotto |
| 34 | 34 | `components/editor-v2/_color-schemes.scss` | no, definizioni dentro `.editor-v2` |
| 24 | 0 | `components/Settings/AISettingsContent.scss` | **si**, tutte con fallback |
| 18 | 16 | `styles/classic-object-view.scss` | no, `.GraphContainer` sta dentro `.editor-v2` |
| 15 | 0 | `components/common/MarkdownRenderer.scss` | **si**, tutte con fallback |
| 15 | 0 | `components/export/ExportImageMenu.scss` | **si**, tutte con fallback |
| 11 | 0 | `components/Settings/PromptEditor.scss` | **si**, tutte con fallback |
| 11 | 11 | `components/editor-v2/components/EdgeTypePopup.scss` | no, montato a `EditorV2.tsx:3891` |
| 8 | 0 | `components/Settings/PromptsSettingsSection.scss` | **si**, tutte con fallback |
| 7 | 7 | `components/editor-v2/_notations.scss` | no, definizioni dentro `.editor-v2` |
| 6 | 0 | `components/common/ExportImportMenu.scss` | **si**, tutte con fallback |
| 6 | 0 | `components/common/ProviderSelector.scss` | **si**, tutte con fallback |
| 6 | 0 | `components/project/project-editor.scss` | **si**, tutte con fallback |
| 4 | 0 | `components/Settings/UnifiedSettingsModal/UnifiedSettingsModal.scss` | **si**, tutte con fallback |
| 2 | 0 | `components/common/ImportDropZone.scss` | **si**, tutte con fallback |
| **2** | **2** | **`components/editors/info-improvements.scss`** | **si, e senza fallback** |
| 1 | 1 | `components/abstract/style.scss:582` | riga commentata, non viva |

Le 308 di `EditorV2.scss` sono state attribuite al blocco di primo livello che le contiene, contando
le graffe. Solo due di quei blocchi vestono un sottoalbero portalato, e **nessuno dei due ha
occorrenze senza fallback**: `.context-menu` (8 occorrenze, 0 senza fallback) e
`.editor-v2-minimap-portal` (2, 0 senza fallback).

**Due blocchi di `EditorV2.scss` sono CSS morto, e uno di essi da' solo 40 delle 273 occorrenze senza
fallback.** `.jj-properties` (40 occorrenze, tutte senza fallback) e `.editor-v2-minimap-portal` non
compaiono in nessun `.tsx`, `.ts`, `.jsx` o `.js`: la ricerca su tutto `src` per qualunque estensione
restituisce solo `EditorV2.scss`. Controllo positivo sulla stessa forma di ricerca:
`properties-with-tree-view` restituisce due file `.tsx`, quindi la ricerca ha segnale. Censite, non
toccate (Regola 9). Sono rilevanti qui perche' gonfiano il conteggio senza corrispondere a niente
sullo schermo.

**Conclusione del censimento statico**: fuori da `info-improvements.scss` non esiste, oggi, un
sottoalbero portalato che consumi un token di tema senza fallback. La disciplina scritta a commento
in `EditorV2.scss:3257` e in `simulation-panel.scss:3` e' stata rispettata ovunque tranne li'.

---

## 5. Punto 4: la verifica dinamica

### 5.1 Il controllo positivo, prima del risultato

Metodo: `getComputedStyle(el).getPropertyValue(nome)` su un elemento **dentro** il portal e sullo
stesso nome su un elemento **dentro** `.editor-v2`. Se il secondo torna vuoto, e' il metodo a essere
rotto, non il codice.

| Bersaglio | Selettore | Token di tema non vuoti su 91 |
|---|---|---|
| Portal, rail destro | `.properties-with-tree-view` | **2** |
| Controllo positivo | `.editor-v2` | **91** |
| Controllo positivo 2 | `.editor-v2-palette` (rail sinistro, in flusso) | **91** |

Il controllo ha segnale. Il risultato regge.

Un secondo controllo, sulla completezza della scansione dei fogli: `document.styleSheets` viene
percorso interamente e **un solo foglio e' bloccato dalla same-origin policy**, quello di Google
Fonts (`fonts.googleapis.com/css2?family=JetBrains+Mono...`), che non definisce custom property. La
scansione ha visto 17596 regole.

### 5.2 La tabella dei 91 token di tema

Sono tutti nello stesso stato, quindi la tabella si compatta in tre righe invece di 91. Valori
misurati con tema light.

| Categoria | Quanti | Risolve nel portal | Risolve in `.editor-v2` | Valore che l'utente vede oggi |
|---|---|---|---|---|
| Non risolvono nel portal | **89** | no, stringa vuota | si | la dichiarazione che li usa e' invalida a computed-value time; per una proprieta' ereditata equivale a `inherit` |
| Risolvono col valore legacy | **2** (`--accent`, `--danger`) | si, dal `body` | si | `#334155` invece di `#0284c7`; `#ef4444` invece di `#dc2626` |
| Risolvono col valore giusto | **0** | n/a | n/a | n/a |

I 89 nomi che non risolvono sono l'intero contenuto di `_themes.scss` meno i due sopra. Per esteso:
`--canvas-bg`, `--canvas-dots`, `--surface-1..3`, `--surface-hover`, `--border-subtle`,
`--border-default`, `--border-strong`, `--text-primary`, `--text-secondary`, `--text-muted`,
`--text-dim`, `--accent-hover`, `--accent-muted`, `--accent-subtle`, `--green`, `--purple`,
`--amber`, tutti i `--class-*`, `--enum-*`, `--package-*`, `--node-*`, `--field-*`, `--edge-*`,
`--stereotype-color`, `--menu-*`, `--minimap-*`, `--topbar-*`, `--panel-*`, `--sidebar-*` e tutti i
`--float-*`.

### 5.3 La tabella che conta: i nomi effettivamente consumati dal rail

Delle 89 che non risolvono, **una sola e' usata** da una regola che veste il rail. Il censimento
dinamico delle regole che matchano dentro il rail, nello stato ricco (advanced attivo, elemento
selezionato, tutte le sezioni aperte: 152 elementi, 166 regole matchate su 17596), trova 31 nomi
distinti, di cui 30 risolvono.

| Nome | Usata in | Risolve nel portal | Risolve in `.editor-v2` | Valore che l'utente vede oggi |
|---|---|---|---|---|
| `--text-muted` | `info-improvements.scss:943` (`.props-section__title`) | **no** | si, `#64748b` | `rgb(0, 0, 0)`, vedi §5.4 |
| `--text-muted` | `info-improvements.scss:951` (`.props-section__chevron`) | **no** | si, `#64748b` | `rgb(15, 23, 42)`, ma la regola e' morta anche dentro l'editor, vedi §5.5 |
| gli altri 29 (`--color-text-primary`, `--color-bg-secondary`, `--font-size-xs`, `--space-2`, `--radius-sm`, ...) | vari | si | si | il valore atteso, identico nei due contesti |

I 29 nomi che risolvono sono stati confrontati uno per uno fra portal e `.editor-v2`: **nessuna
differenza di valore**, in nessuno dei due temi. Il design system attraversa il portal senza perdite.

### 5.4 Cosa si vede oggi al posto di cosa, per `.props-section__title`

Numeri misurati sul tab metamodello, rail portalato, tema light, con `GENERAL` visibile a schermo:

| Grandezza | Chiesto dalla regola | Misurato |
|---|---|---|
| `color` | `var(--text-muted)` = `#64748b` = `rgb(100, 116, 139)` | **`rgb(0, 0, 0)`** |
| `font-size` | `13px` | `13px` |
| `font-weight` | `500 !important` | `500` |
| `--text-muted` sull'elemento | `#64748b` | stringa vuota |

**La ragione del nero non e' quella che il prompt riporta.** Il prompt (e il report C §2.3) dicono
che il colore «cade sull'ereditato» dal rail. Il rail e' pero' a `rgb(15, 23, 42)`, non nero. Il nero
viene dal `<button class="props-section__header">` che contiene il titolo: **nessuna regola gli
assegna un `color`**: `info-improvements.scss:922-936` imposta `display`, `padding`, `border`,
`background`, `cursor`, `transition`, e nient'altro, quindi il bottone tiene il `color: buttontext`
dello user-agent, che e' nero. Misurato: `btnColor` del bottone di `GENERAL` = `rgb(0, 0, 0)`.

Il meccanismo esatto e' quello del `var()` invalido: `color: var(--text-muted)` senza fallback e con
la variabile non definita rende la dichiarazione **invalida at computed-value time**, che per una
proprieta' ereditata significa `inherit`, non il valore iniziale. Il titolo eredita percio' il nero
del bottone.

Perche' questo cambia il fix: promuovere `--text-muted` a `:root` ripara la riga. Aggiungere invece
un `color` sul bottone la ripara anche, e senza toccare i token. Sono due strade diverse e la §7 le
tiene distinte.

Il confronto che rende visibile il difetto sta nella stessa schermata: nello stesso rail,
`Advanced` e `NODE` escono a `rgb(148, 163, 184)` e 11px perche' due blocchi a specificita' piu' alta
li ricolorano (`properties-with-tree-view.scss` blocco `.jj-disclosure` per il primo, il markup
proprio di `PropertiesWithTreeView.tsx` per il secondo), e ogni sopracciglio del tree
(`MEGAMODEL`, `METAMODELS`, `MODELS`, `VIEWPOINTS`, `DOCUMENTATION`) esce grigio. `GENERAL` e' l'unica
riga nera della colonna.

### 5.5 La seconda occorrenza e' morta ovunque, non solo nel portal

`info-improvements.scss:951` scrive `.props-section__chevron { color: var(--text-muted) }`, ma il
chevron e' un `<i className="bi bi-chevron-right props-section__chevron ...">` (`Info.tsx:51`) e
`styles/style.scss:790` porta `i.bi { color: var(--font-color-1) }`. Specificita': `i.bi` e' (0,1,1),
`.props-section__chevron` e' (0,1,0). **`i.bi` vince sempre**, dentro e fuori dal portal. E' lo stesso
inganno gia' registrato in `CLAUDE.md` §5 sul glifo del tree.

Misurato: il chevron di `GENERAL` esce `rgb(15, 23, 42)` (= `--font-color-1`), quello di `Advanced`
esce `rgb(148, 163, 184)` perche' `properties-with-tree-view.scss:2297` ha specificita' superiore.

Conseguenza operativa: **riparare i token non ripara questa riga**. Va contata fra le due occorrenze
per onesta' del censimento, ma non fra i difetti che un fix ai token chiude.

### 5.6 La pillola di riapertura

`.properties-tree-floating-cluster` non era montata in nessuno degli stati misurati (compare solo
quando entrambe le zone del rail sono collassate), quindi non e' stata misurata in pagina. Il suo
foglio, `properties-with-tree-view.scss`, **non compare** fra i 17 file che usano token di tema
(§4.3), quindi staticamente e' pulita. Detto come limite: e' una deduzione dal censimento statico,
non una misura sul DOM.

---

## 6. Punto 6: il dark mode

### 6.1 L'ipotesi del prompt e' falsa

Il prompt propone: «se le variabili non risolvono, i portal non cambiano affatto al cambio di tema».
Misurato, con `data-theme` portato a `dark`:

| Bersaglio | Nomi misurati | Non vuoti (light) | Cambiano valore light → dark |
|---|---|---|---|
| `.properties-with-tree-view` (portal) | 234 | 116 | **58** |
| `.editor-v2` | 234 | 205 | **132** |

Il portal cambia. La ragione e' in §2.4: `data-theme` sta su `<html>`, antenato di ogni portal, e i
token del design system sono su `:root[data-theme]`. Campione, letto dentro il rail portalato:

| Nome | rail, light | rail, dark |
|---|---|---|
| `--color-bg-primary` | `#ffffff` | `#08090a` |
| `--color-text-primary` | `#0f172a` | `#f0f0f0` |
| `--color-border-primary` | `#e2e8f0` | `rgba(255, 255, 255, 0.08)` |
| `--color-panel-border` | `#e2e8f0` | `#334155` |
| `--text-muted` (token di tema) | vuoto | vuoto |
| `--text-primary` (token di tema) | vuoto | vuoto |

### 6.2 Come il rail arriva comunque scuro: un sistema parallelo scritto a mano

Nella chiusura dei 33 fogli del rail ci sono **44 blocchi `[data-theme=...]`**, distribuiti su 16
file, che riscrivono a mano i colori scuri con letterali:

```
 11  components/editors/properties-with-tree-view.scss
  7  components/editors/views/nestedView.scss
  4  components/TreeViewSidebar/tree-view-sidebar.scss
  4  components/editors/views/data/viewapplyto.scss
  3  components/editors/node-editor-redesign.scss
  2  components/editors/EditorFullscreenModal.scss
  2  components/editors/views/data/palette-data.scss
  2  components/editors/views/data/viewoptions.scss
  2  components/forEndUser/FunctionComponent.scss
  1  ciascuno: element-badge, EdgeMarkerEditorModal, EditorToolbar,
     InteractivePathCanvas, empty, info-improvements, info
```

E' questo sistema, non i token, che fa funzionare il dark del rail. Prova incidentale, ed e' anche
un'inversione: `.props-section__title` **in dark e' corretto e in light e' rotto**, perche'
`info-improvements.scss:826` dentro il blocco `html[data-theme="dark"]` scrive
`color: #94a3b8` come letterale, che non passa da nessuna variabile. Misurato: `rgb(148, 163, 184)`
in dark, `rgb(0, 0, 0)` in light.

Lo screenshot del rail in dark, preso durante la sessione, mostra una colonna correttamente scura e
leggibile. Il difetto di questa discovery e' un difetto **del tema chiaro**.

Nota per chi ripara: promuovere i token renderebbe **ridondanti** parte di questi 44 blocchi, non
tutti. Rimuoverli sarebbe una seconda decisione, e Regola 9 dice di non farlo di iniziativa.

### 6.3 Il dark e' raggiungibile dall'interfaccia: correzione a R-RAIL-44

R-RAIL-44 (2026-08-13) scrive: «il dark non e' raggiungibile dall'interfaccia e resta accessibile
solo scrivendo `localStorage.theme`, che e' quello che fa l'harness Playwright». **Oggi non e' piu'
vero**, e la verifica e' stata fatta guidando l'interfaccia reale, non leggendo il codice:

avatar in alto a destra → voce **Settings** (`Navbar.tsx:1986-1988`, `openSettings()`) → la modale
`.unified-settings-modal` si apre su `body` con sette sezioni (`Profile`, `Security`, `Providers`,
`Prompts`, **`Appearance`**, `Notifications`, `Advanced`) → `Appearance` rende due radio
`input[name="theme"]`, misurati `[{value: 'light', checked: true}, {value: 'dark', checked: false}]`
→ click su `dark` porta `html[data-theme]` a `dark` e `localStorage.theme` a `dark`.

Il fatto che ha prodotto R-RAIL-44 resta vero, `e682047a1` ha tolto il sottomenu Theme dalla navbar,
ma la strada esiste altrove: `UnifiedSettingsModal.tsx:53` registra la voce `appearance`, `:136`
la instrada su `AppearanceSection`, che avvolge `pages/settings/AppearanceSettings.tsx`. Non tocca a
questa discovery decidere se il freeze vada mantenuto, ampliato o ritirato; il punto e' che
**l'argomento «tanto non e' raggiungibile» non e' piu' disponibile** per chi lo decidera'.

---

## 7. Opzioni di fix

Nessuna scelta e' fatta qui. Le tre strade sono ordinate per raggio d'azione crescente.

### 7.1 Strada A: riparare le due righe, senza toccare i token

Sostituire `var(--text-muted)` in `info-improvements.scss:943` con il token del design system
equivalente (`--color-text-tertiary`, misurato `#94a3b8` in light e `#606060` in dark, gia' risolto
nel portal) oppure aggiungere un fallback. Per la riga `:951` non serve niente, e' morta per
specificita' (§5.5), e per la stessa ragione toccarla non produce nessun effetto.

- **Blast radius**: un file, una riga viva. `.props-section__title` compare solo dentro il rail e
  dentro `Info.tsx`, quindi il cambiamento e' contenuto in una superficie.
- **Cosa non risolve**: niente cambia per chi domani scrivera' `var(--border-subtle)` sul rail. La
  trappola resta armata, ed e' la trappola che la Fase 2 di A e' sul punto di far scattare (§7.4).
- **Costo**: minimo. Verifica: un confronto di colore prima/dopo sul titolo, nei due temi.

### 7.2 Strada B: ricopiare la classe di tema sul nodo di destinazione

Portare `theme-light`/`theme-dark` su `<body>` (o su ogni radice portalata) da un unico scrittore,
per esempio accanto a `ThemeService.apply`, e cambiare il selettore di `_themes.scss` da
`.editor-v2.theme-X` a `.editor-v2.theme-X, body.theme-X` (o a un selettore che li copra entrambi).

- **Blast radius**: **alto e mal delimitato**. Mettere quelle classi su `body` significa esporre 91
  variabili all'intero documento con la stessa specificita' che hanno oggi dentro l'editor. Vanno
  verificate una per una le collisioni con le mappature legacy di `body` (`--accent` e `--danger`
  cambierebbero valore in tutta l'app, §3.4) e con i blocchi `.context-menu` globali, che vestono
  anche il menu della navbar (§2.3).
- **Rischio specifico**: con due editor aperti in due tab rc-dock si ha un solo `body`, quindi una
  sola classe di tema, mentre le classi `scheme-*` restano per-editor. Il tema diventerebbe globale e
  gli schemi no: una asimmetria nuova.
- **Perche' e' comunque nella lista**: e' la strada che il prompt nomina, ed e' l'unica che rende
  disponibili anche gli override `scheme-*` e `notation-*` fuori dall'editor, se un giorno servisse.

### 7.3 Strada C: promuovere i token a `:root`, in modo additivo

Emettere le stesse 91 (o le 73 vive, §3.1) coppie nome/valore anche su `:root` per il chiaro e
`:root[data-theme="dark"]` per lo scuro, **lasciando intatti** i due blocchi `.editor-v2.theme-*`.

- **Perche' e' additiva**: dentro `.editor-v2` non cambia niente. `.editor-v2.theme-light` e' (0,2,0)
  e batte `:root` che e' (0,1,0); `:root[data-theme="dark"]` e' (0,2,0) e pareggia con
  `.editor-v2.theme-dark`, ma i due porterebbero lo stesso valore, quindi il pareggio e' innocuo.
  Tutti gli override reali (`scheme-*`, `notation-*` annidati) stanno a (0,3,0) e restano sopra.
- **Punto da verificare prima**: l'ordine di caricamento fra il bundle di `App.scss`
  (`styles/tokens/index`) e quello di `EditorV2.scss`, perche' `.editor-v2.hide-background` e
  `.editor-v2.notation-*` sono a (0,2,0) e oggi vincono per ordine di sorgente. Se i token promossi
  finissero **dopo**, quei quattro blocchi perderebbero. La misura non e' stata fatta: e' una
  domanda aperta, la 3 di §8.
- **Blast radius**: un file nuovo (o due blocchi nuovi in `styles/tokens/`), zero modifiche ai
  consumatori. Nessuna collisione di nome con i token esistenti, verificata: i due insiemi sono
  disgiunti (§3.3).
- **Cosa risolve in piu' delle altre due**: disarma la trappola per sempre. Ogni futuro `var(--...)`
  di tema dentro un portal risolve, e i due commenti di rinuncia (`EditorV2.scss:3257`,
  `simulation-panel.scss:3`) diventano storia invece di regola.
- **Cosa NON risolve**: `--accent` e `--danger` continuerebbero ad avere due valori diversi dentro e
  fuori dall'editor finche' le mappature legacy su `body` restano. Vanno o lasciate (e allora quei
  due nomi restano una trappola) o affrontate come parte del ticket `--accent` gia' aperto in
  `CLAUDE.md` §7.2.

### 7.4 Un vincolo che vale per tutte e tre: la Fase 2 del prompt A

Il prompt A vuole dare al rail destro il bordo del rail sinistro, che e' `1px solid var(--border-subtle)`.
`--border-subtle` e' uno degli 89 che non risolvono nel portal, e **non ha fallback nel foglio di
origine**. Scritto alla lettera, quel commit produce un rail senza bordo, senza nessun errore.
Le tre strade lo evitano in modi diversi: A no (non tocca `--border-subtle`), B si, C si. Se il fix
scelto e' A, la Fase 2 di prompt A deve usare `--color-panel-border` (misurato `#e2e8f0` in light,
`#334155` in dark, gia' risolto nel portal) o un letterale.

---

## 8. Domande aperte per Alfonso

1. **Quale strada.** Se la scelta e' C, va deciso se promuovere tutte e 91 o solo le 73 vive: le 18
   mai referenziate (§3.1) sarebbero peso morto pubblicato a `:root`.
2. **`--accent` e `--danger`.** Restano due nomi che risolvono con valori diversi dentro e fuori
   dall'editor. Si affrontano insieme al fix, si lasciano censiti, o si legano al ticket `--accent`
   di `CLAUDE.md` §7.2?
3. **L'ordine di caricamento CSS.** Serve una misura di quale bundle vince fra `styles/tokens/index`
   (via `App.scss`) e `EditorV2.scss` prima di procedere con C. Non l'ho fatta perche' e' una misura
   sul bundle di build, non sul DOM, e questa discovery e' read-only sul dev server. Va fatta prima
   del commit, non prima della decisione.
4. **R-RAIL-44.** Il freeze del dark theme e' motivato anche dalla irraggiungibilita' del tema, che
   §6.3 misura come non piu' vera. Va emendata la ratifica, va rimossa la voce `Appearance` dalla
   modale, o va lasciato tutto com'e' con la motivazione corretta?
5. **I due blocchi morti di `EditorV2.scss`.** `.jj-properties` (40 dichiarazioni) e
   `.editor-v2-minimap-portal` non hanno nessun consumatore. Regola 9 dice di non rimuoverli di
   iniziativa: vuoi un `// TODO: cleanup` sopra di loro, o un ticket a parte?
6. **La collisione `.context-menu`.** Due componenti diversi, stessa classe, e le regole di
   `EditorV2.scss` sono globali e vestono entrambi. Va disambiguata prima di toccare quel blocco, o
   e' materia di un altro giro?
