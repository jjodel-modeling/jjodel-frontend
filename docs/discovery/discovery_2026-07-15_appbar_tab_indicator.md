# Discovery — montare ConformanceIndicator nell'appbar-tab (il sink vero della UI v3)

**Data**: 2026-07-15
**Tipo**: Fase 1 discovery breve (read-only). Precede il fix Fase 2.
**Branch**: `alfonso-frontend-jjtl`
**Root cause (verificata a runtime da Alfonso)**: la title-chain nativa di rc-dock è sotto `.dock-bar.drag-initiator { display:none }` (la UI v3 nasconde la tab bar nativa per design). Il `<ConformanceIndicator>` montato in `TabDataMaker` vive lì → **non è MAI dipinto**. Il tab visibile è un componente app-level `BUTTON.appbar-tab` (in `NAV.nav-container`) che non monta alcun indicator. Motore/hook/indicator funzionano (`validateConformance` → `errors`): manca solo il mount nell'albero dipinto.
**Supersede**: `discovery_2026-07-15_conformance_dot_hidden_title.md` (ipotesi `LModel.set_name` textContent) — moot: l'intera tab bar rc-dock è `display:none`, quindi qualunque indicator lì è invisibile a prescindere.

---

## Obiettivo

Trovare il componente appbar, verificare che l'id del modello sia disponibile e che `ConformanceIndicator` sia importabile senza cicli; definire il fix path. Nessun edit in Fase 1.

---

## File letti

- `frontend/src/pages/components/Navbar.tsx` (loop `appbar-tabs` `:1826-1857`; stato `openTabs` `:1580`; costruzione tabList `:1588-1659`; badge/type helper `:1723-1745`)
- `frontend/src/model/conformance/ConformanceIndicator.tsx` (import `:1-3`)
- `git status` (stato working tree)

---

## Fase 1 — findings

### 1. Componente che renderizza appbar-tab
`Navbar.tsx:1826-1857`: `<div className="appbar-tabs">` → `tabsToShow.map(tab => <button className={`appbar-tab appbar-tab--${tab.type} ...`} key={tab.id} onClick={()=>handleTabClick(tab.id)}> [badge] <span className="appbar-tab__name">{tab.title}</span> [close] </button>)`. Il badge 'm'/'M' è `getTabBadge(tab.type)` (`:1723-1726`). Overflow dropdown separato a `:1858-1896` (stesso pattern, fuori scope del fix).

### 2. Id del modello disponibile + tipo
`openTabs: Array<{id, title, type, active, closable}>` (`:1580`), costruito da `modelsPanel.tabs` (`:1596-1659`):
- ramo model/metamodel (`:1644-1655`): `const raw = state[id] || state.idlookup[id]` → **`tab.id` È l'id del `DModel`** (risolve il modello dallo store per quell'id); `type = raw.isMetamodel ? 'metamodel' : 'model'` (`:1652`); i tab ghost (modello cancellato) sono **skippati** (`:1653-1654`, ritorna null).
- Quindi al mount serve solo: `<ConformanceIndicator modelId={tab.id}/>` gated su `tab.type === 'model'`. `modelId` corretto per l'editor-v2 (stesso id usato altrove).

### 3. Import senza cicli
`ConformanceIndicator.tsx` importa solo `./useConformance` e `./ConformanceTypes` (`:1-3`). Nessun file in `model/conformance/` importa da `pages/`. → import di `ConformanceIndicator` in `Navbar.tsx` (`../../model/conformance/ConformanceIndicator`) **senza cicli**.

### 4. Stato working tree (verifica supersede 18-09)
`git status`: **nessuna modifica dock/tabs prodotta dal prompt 18-09** (mai implementato: solo report di discovery). `DockManager.tsx` risulta modificato ma è il **fix trasformazioni di altro task** (modificato da inizio sessione), non correlato ai tab-title. Gli altri file modificati sono il WP1 conformance (`ConformanceValidator.ts`, `ConformanceTypes.ts` + test) e i report di discovery.

---

## Gate

"Se l'appbar non ha accesso all'id del modello, o il fix richiede più di 3 file → STOP AND ASK." L'appbar **ha** l'id (`tab.id`), il fix tocca **1 file** (`Navbar.tsx`: import + un blocco JSX gated). → **gate NON scatta**, si procede alla Fase 2.

---

## Fix path (Fase 2)

1. `Navbar.tsx` — import `ConformanceIndicator`.
2. `Navbar.tsx:1845` — dopo `<span className="appbar-tab__name">{tab.title}</span>`, aggiungere, **solo per `tab.type === 'model'`**, `<ConformanceIndicator modelId={tab.id}/>` dentro un wrapper a **larghezza fissa** (inline style) per evitare layout shift quando il dot appare/scompare (l'indicator ritorna `null` se conformant).
- NON toccare `TabDataMaker`/`ConformanceIndicator`/`useConformance`; l'istanza orfana nel titolo rc-dock resta innocua.
- Costo: un `useConformance` (debounced 500ms) per tab modello aperto (accettabile; l'orfano ne aggiunge un secondo — anch'esso accettato dal prompt).

**Follow-up (annotati, NON fatti qui)**: (a) il pallino verde "Conforms to …" nel Properties panel è display-only, da bindare a `useConformance` in un WP successivo; (b) pulizia dell'indicator orfano in `TabDataMaker` quando si deciderà il destino della dock-bar nativa.

---

## Hard stop

Fase 1 chiusa. La Fase 2 (fix in `Navbar.tsx`) procede perché il gate non scatta; build/typecheck verdi → hard stop per la verifica visiva di Alfonso, poi i due commit.
