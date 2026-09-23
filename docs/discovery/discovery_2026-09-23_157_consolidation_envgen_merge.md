# Consolidamento — #157: merge del configuratore F0/F1 nel wizard EnvGen

**Data**: 2026-09-23
**Branch**: `feat/157-environment-config`
**Piano**: `docs/discovery/discovery_2026-09-23_157_standalone_configurator.md`
**Riferimenti**: `frontend/src/components/envgen/` (bozza pre-esistente), `docs/feature-inventory.md` §17.
**Stato**: **implementato**. Gate verdi; UI non esercitata a runtime in questa sessione (le parti
metaclassi/profili sono le stesse di F0b, già confermate dall'utente).

---

## 1. La nuova informazione (dall'utente)

Esisteva già una bozza di configuratore stand-alone: il **wizard EnvGen**
(`components/envgen/EnvGenWizardModal.tsx`), orientato alla **generazione di codice** (tech stack,
output = React project / prompt, provider Claude/OpenAI). Direttiva:

1. **Un solo configuratore**: fondere il mio F0/F1 dentro il wizard esistente.
2. **Il sistema NON viene generato**: userà la **modalità stand-alone** (config live nel progetto,
   `?profile=` URL) — quindi via la premessa di code-gen.
3. Tenere ciò che avevo fatto: **gestione profili** (ex "ruoli", **rinominati "profile"**) e
   **metaclassi editabili**.
4. Step non necessari per ora: **Tech Stack, Concrete Syntax, Output** → rimossi.
5. Tenere: General, Design & UI, Features (scelta utente).
6. **Consolidare F0/F1** prima di avanzare.

## 2. Il nodo architetturale: persistenza

Misurato: `EnvGenPersistence` salva in **`localStorage`** (per-browser). La mia config
(`DEnvironmentConfig`/`DProfile`) vive nello **stato del progetto** (idlookup, persistito e
condiviso). Per la modalità stand-alone (config raggiungibile a un `?profile=` URL da altri utenti)
serve lo stato del progetto: **localStorage non basta**. Decisione:

- **Metaclassi + profili** → stato di progetto (`DEnvironmentConfig`/`DProfile`), scritti **live**
  (ogni toggle è una `SetFieldAction`), come faceva il modale F0b. È la parte che conta per la
  modalità stand-alone.
- **General / Design / Features** → restano sulla loro persistenza `localStorage` esistente
  (`EnvGenPersistence`), **immutata**. Non hanno ancora effetto sull'ambiente; ripuntarle allo stato
  di progetto è un raffinamento successivo. Doppio store dichiarato, non nascosto.

## 3. Cosa è cambiato

**Rename role → profile** (era brand-new in F0a, non rilasciato):
- `DRole`/`LRole` → `DProfile`/`LProfile`; `DEnvironmentConfig.roles` → `profiles`; builder,
  `set_extend`, `WRole`→`WProfile`, export.
- helper: `findRole`→`findProfile`; nuovi `profileIdsOf`/`profilesOfConfig`;
  `ROLE_CLASSNAME`→`PROFILE_CLASSNAME`. `?role`→`?profile` (ConfiguratorTab).
- **Back-compat**: `findProfile` accetta anche il vecchio `className:'DRole'`, e `profileIdsOf`
  legge anche il vecchio campo `roles` — così i profili creati nello smoke di F0b non si perdono.

**Wizard EnvGen**:
- Step rimossi: `tech-stack`, `concrete-syntax`, `output` (da `EnvGenStepId`, `STEP_ORDER`,
  `ENVGEN_NAV_GROUPS`, `renderStepContent`, e dalla `Record<EnvGenStepId>` di validazione nell'hook).
  Le loro *interfacce*/default/step-files restano (Rule 9), solo non più navigabili.
- Step aggiunti: `MetaclassesStep` (editabili) e `ProfilesStep` (profili+permessi), **assorbiti dal
  modale F0b**, self-contained (leggono/scrivono le entità di progetto).
- Header: "Generate Environment" → "Configure environment". Footer: "Export Prompt"/"Generate" →
  **"Done"** (`handleSaveAndClose`); rimossi `handleExportPrompt`/`handleGenerate`.
- Nav groups: CONFIGURATION (General) · APPEARANCE (Design & UI, Features) · STAND-ALONE (Editable
  metaclasses, Profiles).

**F0b modale assorbito e rimosso**: `EnvironmentConfigModal.tsx` + `.scss` cancellati. L'azione
LeftBar «Environment config» → «Configure environment», ora **apre il wizard** (dispatch
`EnvGenEvents.OPEN_WIZARD`, lo stesso della Navbar). La Navbar «Generate Environment...» →
«Configure Environment...».

**F1 ConfiguratorTab (runtime)**: invariato nella sostanza; consuma la config scritta dal wizard;
solo il rename `role→profile` (`findProfile`, `?profile`).

## 4. Ruolo di ciascun pezzo, dopo il merge

- **Wizard EnvGen** = authoring/config della modalità stand-alone (developer). Unico configuratore.
- **ConfiguratorTab** = schermata runtime che il fruitore usa; consuma la config.
- **DEnvironmentConfig/DProfile** = la config live nello stato di progetto.

## 5. Verifica

- `npx vitest run src/joiner/__tests__/environmentConfig.test.ts` → **21/21** (aggiornati al rename +
  back-compat legacy).
- `npm run typecheck` output completo: **14** pre-esistenti, **0** nei file toccati.
- `npm run build`: `✓ built`.
- **Smoke visivo NON eseguito** in questa sessione. Da provare: Navbar/LeftBar → «Configure
  environment» → step «Editable metaclasses» (marca) + «Profiles» (crea/permessi); persistenza
  save→reopen; il ConfiguratorTab riflette i tipi.

## 6. Scope

15 file (deroga dichiarata alla soglia dei 5, RC-11): è la conseguenza diretta del merge di due
sottosistemi richiesto dall'utente, con piano e stima file confermati prima di procedere.

## 7. Cosa resta

- F2: applicare i permessi in lettura/edit nel ConfiguratorTab/IRForm (oggi il profilo filtra solo
  la visibilità dei tipi).
- General/Design/Features: se servono a runtime, migrarle dallo `localStorage` allo stato di progetto.
- Delete profilo: oggi soft-delete (unreference), `// TODO: cleanup` per `DeleteElementAction`.
- F3: shell ristretta (modalità consumer da `?profile=`).
