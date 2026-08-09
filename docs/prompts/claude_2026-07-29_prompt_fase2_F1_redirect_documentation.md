# Fase 2 · F1 — Redirect Documentation al gruppo canvas

**Tipo:** implementazione scoped (Fase 2, commit isolato). NON discovery.
**Data prompt:** 2026-07-29
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Base:** report `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md` (Parte B, punto B5b + rischio #1). Nessuna nuova discovery: il report è già scritto, riusalo.

> Primo commit della fase floating panels. De-risca il rischio ALTO #1 (redirect Documentation) **prima** della rimozione del figlio destro del dock (F2). Isolato e verificabile a vista in autonomia.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Se qualcosa qui lo contraddice, **segnala e fermati**.
- **Scope strettissimo:** tocca SOLO `src/abstract/DockManager.tsx` (+ `docs/claude-code-log.md` a fine task). Nessun altro file.
- **Niente nuova discovery:** il report floating_panels è la base. Leggi per orientamento i file citati sotto, poi edita. Nessun discovery report da produrre per questo commit.
- **`git add` SCOPED:** solo `git add src/abstract/DockManager.tsx docs/claude-code-log.md`. **MAI `git add .`**: nel working tree ci sono modifiche card 2A unstaged e un possibile WIP TextStyle concorrente che NON devono entrare in questo commit.
- Zero refactoring opportunistico. Non rinominare identificatori. Diff minimale (preferisci `str_replace`).

## 1. COSA

Oggi la tab Documentation aperta dall'assistente Jodie punta al figlio **destro** del dockbox (`children[1]`, dove vive Properties). In F2 quel figlio sparisce. Reindirizza l'apertura della doc al **gruppo canvas** (`children[0]`), così che sopravviva alla rimozione del figlio destro.

Comportamento atteso dopo il fix: aprire una voce Documentation da Jodie fa comparire la doc come **tab nel gruppo canvas** (sinistro), non più nella colonna Properties a destra. La Properties resta dov'è (F1 non la tocca).

## 2. DOVE

- `src/abstract/DockManager.tsx`:
  - `:16` `static dock`
  - `:101-102` metodo `open(group, tab)`: risolve `index = (group === 'models') ? 0 : 1` e chiama `dockMove(tab, ...dockbox.children[index], 'middle')`.
- Caller da **NON** modificare (solo per capire l'impatto):
  - `Jodie.tsx:690` → `DockManager.open('editors', tab)` (Documentation). Unico caller con group `'editors'`.
  - `ProjectEditor.tsx:1096/1100/1794/2739` → `DockManager.open('models', ...)` / `open2`. Restano invariati (continuano a puntare a `children[0]`).

## 3. COME

Fai in modo che `open('editors', ...)` risolva il target `dockbox.children[0]` (gruppo canvas) invece di `children[1]`. Modo più infallibile: il target di `open` è sempre `dockbox.children[0]` (`children[0]` esiste sia ora con due figli, sia dopo F2 con un figlio solo). In pratica l'index effettivo diventa `0` per ogni group.

Verifica **prima** di editare:
- Che `open2` / `open('models')` continuino a risolvere `children[0]` (già così): il cambiamento non deve alterarne il comportamento.
- Che non esistano altri caller di `open` con group diverso da `'models'` / `'editors'` (`grep` su `DockManager.open(` e `.open2(`). Se ne emergono, **riportalo e fermati** prima di procedere.

Attenzione (verifica a vista, non bloccante): aprire la doc come tab canvas potrebbe cambiare `data-editor-type` (setter `Dock.tsx:248/252/259`) verso `documentation`. Il kill-switch CSS `properties-with-tree-view.scss:961-963` nasconde il cluster flottante su `documentation`. In F1 (con Properties ancora a destra) è comportamento accettabile e atteso; **non** aggiungere workaround. Segnala solo se noti regressioni visibili sulla Properties.

## 4. Verifica

- `npm run build` senza errori.
- A vista (`localhost:3001`, hard refresh): apri Jodie → una voce Documentation → la doc compare come tab nel gruppo canvas. Le tab modello/summary continuano ad aprirsi lì. La Properties a destra è intatta.

## 5. Chiusura

- Aggiorna `docs/claude-code-log.md` (tipo `refactor`, una entry: prompt, file toccati, esito).
- Commit convenzionale, inglese, una riga. Es: `refactor(dock): route documentation tab to canvas group`.
- **Hard stop dopo il commit:** torna in chat per la verifica di Alfonso prima di F2.

## 6. RIFERIMENTI

- Report: `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md`, Parte B (B5b) e rischio #1.
- Ratifiche 2026-07-29: disposizione impilata, doc → gruppo canvas, reset migrazione, INSTANCES fase separata.
