# Discovery + esito — #157 Fase 1: Configurator screen (primo taglio)

**Data**: 2026-09-23
**Branch**: `feat/157-environment-config`
**Piano**: `docs/discovery/discovery_2026-09-23_157_standalone_configurator.md` (§5 F1)
**Stato**: **implementato**, primo taglio come **overlay** (scelta dell'utente). Codice verde ai gate;
UI non esercitata a runtime in questa sessione.

---

## 1. Cosa fa

Una schermata «Configurator» (overlay full-screen, portallato a `document.body`) aperta da
un'azione «Open Configurator» nel project sidebar del `LeftBar`. Al posto del rail delle metaclassi,
una **top-bar** dei tipi top-level (dalla config F0); selezionando un tipo → lista delle istanze →
apri una in `IRForm` → **New** per crearne una.

## 2. Riuso (nessun tocco a InstanceManagerTab)

La discovery ha confermato che i pezzi del Data Manager sono già isolati e riutilizzabili senza
estrarre nulla dalle 3355 righe (rischiose) di `InstanceManagerTab`:

- **Lista istanze**: `instancesOfClass(idlookup, modelId, classId)` (puro, `instanceManagerModel.ts`)
  → `InstanceRow[] {id, name, metaclassName, isContained}`.
- **Dettaglio/edit**: `IRForm` è standalone, prende `{ objectId }`.
- **Create**: la stessa catena che `InstanceManagerTab` committa —
  `makeShapeCtx(modelId).shape()` (`shapeAdapter`), `newDraft(shape, className, null, null)`
  (`jjform`), `applyCreate(modelId, shape, draft): string|null` (`createAdapter`). `applyCreate`
  scrive un seed dai soli campi valorizzati (untouched = niente), quindi un draft vuoto crea
  un'istanza bare che si apre subito in `IRForm` per la compilazione.
- **Top-bar**: `visibleTopLevelTypes(config, role)` (helper F0) — ordinata e filtrata per ruolo.

**Vincolo rispettato (editor-v2 §3.3)**: `applyCreate` gestisce la propria `TRANSACTION`; è chiamata
**bare**, mai avvolta in una TRANSACTION esterna.

## 3. Scelte / semplificazioni del primo taglio

- **Collocazione**: overlay dal LeftBar (3 file), scelto dall'utente contro il "tab vero nel Dock"
  (che avrebbe toccato `DockManager`/`TabDataMaker`). Promuovere a tab = F1b.
- **Modello target**: il **primo** modello del progetto (`project.models[0]`). Un picker per progetti
  multi-modello è un raffinamento successivo.
- **Permessi**: qui il ruolo filtra **solo la visibilità** dei tipi (`visibleTopLevelTypes`). Il
  gating read/edit dei form (disabilitare l'editing) è **Fase 2**, non fatto qui.
- **Config**: sola lettura (`findEnvironmentConfig`), nessuna create lazy — la config si autora in
  «Environment config» (F0b). Se assente/vuota, empty-state che rimanda a quella schermata.

## 4. File

- `frontend/src/components/environment/ConfiguratorTab.tsx` (nuovo)
- `frontend/src/components/environment/configuratorTab.scss` (nuovo)
- `frontend/src/pages/components/LeftBar.tsx` (azione + stato + render)

## 5. Verifica

- `npm run typecheck` output completo: **14** pre-esistenti, **0** nei file toccati.
- `npm run build`: `✓ built` (solo warning chunk-size).
- **Smoke visivo NON eseguito** in questa sessione (app non avviata). Criterio d'accettazione:
  su un progetto reale, click su un tipo in top-bar → lista istanze; **New** crea e apre il form;
  la nuova istanza compare in lista.

## 6. Cosa resta

- **F1b**: promozione a tab del Dock (o rotta) invece dell'overlay; picker del modello.
- **F2**: applicazione dei permessi (tipi `read` → form sola-lettura; campi hidden/read).
- **F3**: shell ristretta (modalità consumer da `?role=`).
