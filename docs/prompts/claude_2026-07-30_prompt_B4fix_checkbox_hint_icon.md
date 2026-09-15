# B4-fix — Checkbox reali e icona hint (due residui, un commit)

**Data prompt:** 2026-07-30
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** high
**Contesto:** la skin B4 è verificata VIVA nell'app (ispezione DOM/stili computati su localhost:3000): chip VIEW, breadcrumb, tab bar, hint (32px/290px), bottoni ghost sono conformi alla replica. Restano due residui, diagnosticati con certezza dal DOM reale. Questo prompt fixa SOLO quelli.

## 0. Vincoli

- Niente critical-zone. `git add` per path espliciti, mai `git add .` (WIP TextStyle nel working tree).
- Scope: SOLO i due punti sotto. Non toccare le parti della skin già funzionanti.
- Grep di collisione prima di ogni classe nuova.

## 1. FIX A — Checkbox: il selettore attuale spara a vuoto

**Diagnosi dal DOM vivo**: la regola B4 usa `button[role="checkbox"]`, ma nell'overlay esistono **0** elementi con quel role. I pattern reali:

- Tab Style: `<label><span class="toggle-label">…</span><input type="checkbox" class="checkbox"></label>` dentro `.css-scope-toggle` — input nativo nascosto (0×0), visuale demandata agli elementi della label.
- Authoring IR (Resizable, Editable inline, Visible): componente checkbox proprio, probabilmente con classi CSS-module (nel bundle esistono classi tipo `_toggleChecked_*`); nel pre-B4 rendeva un quadrato slate scuro con spunta.

**Cosa fare**:
1. Individua con grep il componente checkbox REALE usato da `VertexAuthoringPanel` (e dai suoi figli: `LabelEntryEditor`, ecc.): parti dagli import del componente, non da ipotesi sui selettori. Trova anche il pattern `input.checkbox` della tab Style.
2. Applica la spec della replica a ENTRAMBI i pattern, scoped alla card (`.properties-panel-container`): box 20×20px, radius 6px, bordo `2px solid #cbd5e1`, sfondo bianco; checked: sfondo e bordo `#3b82f6`, spunta bianca. Niente slate scuro.
3. Se il componente è a CSS module, la strada più pulita è modificare il SUO stile module (se è usato SOLO dentro la card) oppure aggiungere una classe hook stabile sul wrapper e stilarla scoped (se è condiviso fuori dalla card). Decidi in base al grep degli usi e riporta quale strada hai preso.
4. Rimuovi la regola morta `button[role="checkbox"]` (e varianti) dal blocco B4: `grep` conferma che non matcha nulla; lasciarla è rumore.

## 2. FIX B — Icona (i) degli hint ancora renderizzata

**Diagnosi dal DOM vivo**: il `p` dell'hint dentro `.jj-field` ha già lo stile B4 (32px/290px/#94a3b8) ma contiene ancora l'icona `(i)` (`hasIcon=1`).

**Cosa fare**: rimuovi l'icona dal markup degli hint NEL CONTESTO della card. Se il componente hint è condiviso fuori dalla card, non toccare il markup globale: nascondila scoped (`.properties-panel-container .jj-field > p > i { display:none }` o equivalente sul selettore reale dell'icona). Verifica con grep dove il componente è usato e riporta la scelta.

## 3. Verifica

- Build verde, typecheck Δ0.
- Su localhost (hard refresh, porta del dev server aggiornato): tab Style e authoring IR di un vertex: checkbox chiare arrotondate da spente, blu `#3b82f6` da accese; hint senza icona (i); tutto il resto della skin invariato.
- Attenzione regressioni: se hai toccato lo style module del componente checkbox, verifica che fuori dalla card (dove è eventualmente usato) non cambi nulla che non debba cambiare.

## 4. Chiusura

- Entry in `docs/claude-code-log.md` (tipo `fix`): i due residui, la strada scelta per il componente checkbox, la regola morta rimossa.
- Commit: `fix(panels): style real checkbox components and drop hint icons in properties card`.
- **Hard stop**: verifica visiva di Alfonso contro la replica.

## Nota per Alfonso (fuori prompt)

La verifica va fatta sulla porta giusta: le modifiche sono vive su **localhost:3000** (verificato dall'ispezione). Se il tab aperto è su 3001 o non è stato hard-refreshato, la skin non si vede a prescindere dal codice.
