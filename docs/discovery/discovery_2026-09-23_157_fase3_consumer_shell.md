# Discovery + esito — #157 Fase 3: shell "consumer" ristretta (primo taglio)

**Data**: 2026-09-23
**Branch**: `feat/157-environment-config`
**Piano**: `docs/discovery/discovery_2026-09-23_157_standalone_configurator.md` (§5 F3)
**Perimetro (scelto dall'utente)**: primo taglio **LeftBar + guardie DockManager**; il trim della
Navbar è **F3b** (rinviato).
**Stato**: implementato; gate verdi; UI non esercitata a runtime in questa sessione.

---

## 1. Trigger

Modalità **consumer** attiva quando l'URL porta un **`?profile=`** (D2: la coppia
`(progetto, profilo)` è un ambiente). Senza profilo → developer, tutto invariato. Il trigger è un
helper condiviso `components/environment/consumerMode.ts` — `isConsumerMode()` = `!!U.getHashParam('profile')`,
letto **live** dall'hash (stessa fonte di `ConfiguratorTab`/`getProjectID_URL`).

## 2. Cosa nasconde (soft, D1)

**LeftBar** (`pages/components/LeftBar.tsx`), quando `consumer`:
- sezioni **Metamodels**, **Transforms**, **Viewpoints** (le `renderSection` corrispondenti);
- l'item **Project Megamodel**;
- l'azione **«Configure environment»** (authoring developer).

Resta: **Models** (apri/edita + instance manager), **Open Configurator**, e le azioni progetto
(Download/Favorite/Share/Close). Il **syntax picker** del Toolbar non è toccato (resta).

**DockManager** (`components/abstract/DockManager.tsx`) — difesa a valle, anche per aperture
programmatiche:
- `open2(me)` rifiuta se `consumer && me.isMetamodel` (l'editor M2 non si apre; i **modelli** sì);
- `openViewpoint(vp)` rifiuta interamente in consumer mode.

## 3. Layer Impact

- **View/shell**: cambia solo la *visibilità* di sezioni/azioni del LeftBar in base al profilo.
- **DockManager**: guard che rifiuta l'apertura di editor M2/viewpoint in consumer; nessun cambiamento
  senza profilo.
- **NON cambia**: D-layer, sync (`useJjomSync`/`portDistribution`/`canvasToJjom`), persistenza, IRForm,
  `DEnvironmentConfig`/`DProfile`. **Nessun file di §3.1 toccato.**
- **Enforcement soft (D1)**: nasconde percorsi UI, non è sicurezza — lo stato del progetto arriva
  comunque al client.

## 4. File

- `frontend/src/components/environment/consumerMode.ts` (nuovo)
- `frontend/src/pages/components/LeftBar.tsx`
- `frontend/src/components/abstract/DockManager.tsx`

## 5. Verifica

- `npm run typecheck` output completo: **14** pre-esistenti, **0** nei file toccati.
- `npm run build`: `✓ built`.
- **Smoke visivo NON eseguito** in sessione. Da provare: aprire `#/project?id=…&profile=<id>` →
  il LeftBar non mostra Metamodels/Viewpoints/Transforms/Megamodel/«Configure environment»; Models e
  «Open Configurator» restano; senza `?profile=` tutto torna developer.

## 6. Cosa resta

- **F3b**: trim della **Navbar** (New Metamodel/Model, Tools→Configure Environment, Analyze/validazione,
  viewpoint) in consumer mode.
- Reattività: `isConsumerMode()` è letto al render; se serve il toggle *live* (aggiungere/togliere
  `?profile=` senza reload) si aggiunge un listener `hashchange` che forza il re-render del LeftBar.
- Nascondere anche la **creazione di modelli** («New model») al consumer, se voluto.
- **F4**: assegnazione profilo→utente e generazione dei link `?profile=` (es. «Copy stand-alone link»).
