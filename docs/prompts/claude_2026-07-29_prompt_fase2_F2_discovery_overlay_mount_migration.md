# Fase 2 · F2 — Discovery mirata: mount overlay + migrazione layout

**Tipo:** discovery read-only (Fase 1 di F2). Nessuna modifica al codice, nessun git, nessuna build.
**Data prompt:** 2026-07-29
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Base:** report `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md` + ratifiche 2026-07-29. Questa **NON** rimappa il report: pinna solo i due meccanismi che F2 toccherà e che il report ha lasciato parzialmente mappati.

> Perché F2 ha una discovery e F1 no: F2 (a) monta la coppia Properties+Tree come overlay app-level (oggi vive dentro la tab dock) e (b) resetta i layout persistiti, che vivono nei dati di progetto salvati (`DUser/DProject.layout`). Non vogliamo che l'implementazione improvvisi la migrazione su dati utente. Questa fase mappa il wiring esatto, poi hard stop → chat → prompt di implementazione F2a/F2b.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Contraddizioni → **segnala e fermati**.
- **READ-ONLY:** nessun edit, nessun `git`, nessuna build.
- **Report OBBLIGATORIO** in `docs/discovery/discovery_2026-07-29_f2_overlay_mount_migration.md` (suffisso `_N` se più discovery lo stesso giorno). L'hard stop non è completo finché il report non è scritto.
- Riusa il report floating_panels: **referenzialo, non rimapparlo**.
- **Critical-zone:** per OGNI file letto verifica import di `useJjomSync` / `portDistribution` / `sync/*`. Atteso: catena dock+overlay critical-zone-free. Se il mount host o un file di persistenza li importa, **segnalalo in evidenza**.

## 1. Obiettivo

Pinnare il wiring esatto per i due meccanismi di F2: (A) mount app-level dell'overlay Properties+Tree impilato; (B) reset dei layout persistiti. Più tre conferme di contorno (full-width, disposizione impilata, cluster di riapertura). Output: piano F2a/F2b con injection point precisi.

## 2. Domanda A — Mount host dell'overlay

Oggi `PropertiesWithTreeView` è il content del figlio destro del dock (`Dock.tsx:282`, `mode='tab'`). In F2 quel figlio sparisce, quindi il componente va montato altrove e portalato su body (strategia (b) del report; precedente `.properties-tree-floating-cluster`, `PropertiesWithTreeView.tsx:448-470`). Mappa:

- Le **props** che `PropertiesWithTreeView` riceve oggi (`mode` e altre) e cosa cambia montandolo standalone. Può montarsi senza il contesto dock? Cosa legge da store/context (selezione live `store.getState()._lastSelected`, eventi, ecc.)?
- Il **candidato mount host**: sibling di `<Dock/>` in `Dashboard.tsx:622`, oppure app-level vicino al FAB (`App.tsx:170`). Pro/contro di ciascuno rispetto a lifecycle, accesso allo store, z-index, gating per `editorType`/`layoutMode`.
- Il valore di `mode`: `'tab'` oggi guida l'effect width-lock (`:257-280`). Serve un nuovo mode (`'floating'`?) o si riusa? (Solo mappatura; la scelta si decide in chat.)
- Come il componente porterebbe **tutto** il suo contenuto su body in `position:fixed` (oggi solo il cluster lo fa): cosa va portalato, l'intero pannello o un wrapper nuovo.

## 3. Domanda B — Persistenza e reset del layout

Il report indica `MyRcDock` defaultLayout `:453-485`, save/load `:665-732`, e `DUser/DProject.layout`. Mappa il meccanismo esatto:

- Come viene **caricato** il layout all'apertura di un progetto: chi legge `DProject.layout` / `DUser.layout`, quando, e lo passa a `DockLayout` come `defaultLayout`/`loadLayout`.
- Esiste un **campo versione** del layout? Un `VersionFixer` o una migrazione esistente su cui agganciarsi (cerca `VersionFixer`, versione layout, migrazioni `DProject`/`DUser`)?
- L'**injection point più sicuro** per forzare il nuovo default a un pannello e scartare i layout salvati a due pannelli (reset ratificato, non migrazione mirata). Deve essere infallibile: un progetto salvato col vecchio layout a due pannelli deve aprire il nuovo layout senza il figlio destro fantasma.
- **Cosa si perde** col reset: solo il ratio dock? Altro stato viaggia in `DProject.layout` (tab aperte, active tab)? Elenca.

## 4. Conferme di contorno

- **Full-width:** rimosso il figlio destro (`Dock.tsx:348`), il figlio sinistro (gruppo canvas) si espande a riempire il dockbox? `calculatePanelSizes(layoutMode)`/ratio (`Dock.tsx:50-53`, `:328`) va toccato o basta rimuovere il child? Verifica l'assunzione `.editor-v2` `100vh`/`width:100%` (report A1, rischio #6): a tutta larghezza c'è off-by-chrome? Di' esattamente cosa cambia per il full-width.
- **Disposizione impilata:** mappa la struttura attuale Tree|Properties dentro `PropertiesWithTreeView` (split affiancato, flex/handle). Cosa cambia per impilarli verticalmente (Tree sopra, Properties sotto) nell'overlay: struttura flex, e i due handle di resize (oggi alla giunzione orizzontale) che diventano resize sul bordo di ciascuna card.
- **Cluster di riapertura:** conferma che `.properties-tree-floating-cluster` (portal body, `:448-470`) funziona indipendentemente dal dock; mappa il gating attuale (`showFloatingCluster :245-247`, kill-switch CSS `:961-963`) e cosa serve per disaccoppiarlo dallo stato dock (diventa: card nascosta → mostra pill di riapertura).

## 5. Critical-zone

Per ogni file letto (`Dashboard.tsx`, `App.tsx`, `Dock.tsx`, `MyRcDock.tsx`, `DockManager.tsx`, `PropertiesWithTreeView.tsx`, i moduli di persistenza `DProject`/`DUser` layout, SCSS): import di `useJjomSync`/`portDistribution`/`sync/*`? Atteso vuoto. Segnala eccezioni in evidenza.

## 6. Deliverable e hard stop

Report in `docs/discovery/discovery_2026-07-29_f2_overlay_mount_migration.md`: obiettivo, file letti con path, findings per A/B/conferme, **injection point proposti per F2a (structural) e F2b (reset layout)**, rischi, domande aperte per Alfonso. Nessuna modifica. **Hard stop → chat.**

## 7. Riferimenti

- Report floating: `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md` (A1 mount chain, B5 dipendenze figlio destro, B6 overlay/z-index, B7 resize/persistenza/cluster, B8 retire width-lock).
- Ratifiche 2026-07-29: impilato, doc→canvas, reset migrazione, INSTANCES fase separata; overlay = portal body z ~900, offset 8px.
