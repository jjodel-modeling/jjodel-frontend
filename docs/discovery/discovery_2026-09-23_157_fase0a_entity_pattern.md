# Discovery + esito — #157 Fase 0a: entità `DEnvironmentConfig` / `DRole`

**Data**: 2026-09-23
**Branch**: `feat/157-environment-config` (da `staging`)
**Prompt**: `docs/prompts/claude_2026-09-23_1200_prompt_157_fase0a_environment_config.md`
**Piano**: `docs/discovery/discovery_2026-09-23_157_standalone_configurator.md` (§4, §5 F0)
**Stato**: **implementato**. Codice verde ai gate; nessuna UI (è F0a). L'hard-stop del prompt
(attesa approvazione di Tommaso) è stato sciolto dal committente (Juri), che ha dato il via
all'implementazione il 2026-09-23.

---

## 1. Step 0 — pattern di creazione di una entità persistita (misurato)

Positive control: confronto con `DProject`/`LProject` in `frontend/src/joiner/classes.ts`.

Per aggiungere una `DPointerTargetable` servono, tutti nello stesso file `classes.ts`:
1. la **D class** decorata `@RuntimeAccessible('DXxx')`, con `static subclasses = []` e
   `static _extends = []`, i campi (i pointer come `Pointer<T, min, max, L>`), e uno `static new()`
   che fa `new Constructors(new DXxx('dwc'), father, persist, fatherType).DPointerTargetable().DXxx(...).end(cb)`;
2. la **L class** `@RuntimeAccessible('LXxx')` che estende `LPointerTargetable`, con i mirror dei
   campi (`!`); il proxy auto-wrappa i pointer (nessun getter esplicito necessario per i campi semplici);
3. un **builder method** `DXxx(...)` **dentro la classe `Constructors`** che setta i default;
4. **tre righe di registrazione** dopo le classi — è la parte che si dimentica:
   ```ts
   RuntimeAccessibleClass.set_extend(DPointerTargetable, DXxx);
   RuntimeAccessibleClass.set_extend(LPointerTargetable, LXxx);
   export type WXxx = getWParams<LXxx, DXxx>;
   ```
5. gli **export** in `joiner/index.ts` (classi runtime nel blocco `from "./classes"`; tipi `W` nel
   blocco `export type ... from "./classes"`).

Nessun registro centrale oltre a questi: il decorator `@RuntimeAccessible` registra la classe da sé.

## 2. Aggancio al progetto senza toccare il core

`father!: Pointer<DProject>` (back-pointer). Nota misurata: un campo dichiarato con `!` e senza
default **non** viene settato dal costruttore di `Constructors` (`this.thiss.hasOwnProperty("father")`
è falso finché il campo non è assegnato) — per questo `father` si setta nel **builder** via
`this.setPtr('father', projectId)`. Nessun campo aggiunto a `DProject` né a `DState`.

## 3. Persistenza automatica, nessun VersionFixer

`CreateElementAction` (dentro `Constructors.persist`, che wrappa già la propria `TRANSACTION`) mette
l'entità in `idlookup`, che è ciò che lo stato serializza. La creazione è **lazy**
(`DEnvironmentConfig.getOrCreate`), quindi nessun adapter di `VersionFixer` è necessario in questa
fase. VersionFixer resterà per migrazioni **future** di forma.

## 4. Testabilità — logica pura fuori da `classes.ts`

`classes.ts` non importa nel bench Node (`window is not defined`, come nove suite — CLAUDE.md §5).
Perciò la logica testabile (scan `idlookup`, risoluzione permessi) vive in
`frontend/src/joiner/environmentConfig.ts`, modulo **a zero import** che opera su `Record<string,any>`,
sul modello di `components/abstract/tabs/instanceManagerModel.ts`. Le sole parti impure (store,
`.new()`) stanno sui metodi statici della D class. Test: `joiner/__tests__/environmentConfig.test.ts`,
17 casi, verdi in Node.

## 5. Gotcha misurato — `static get` collide con la base

Il primo giro aveva `static get(projectId?, state?)` sulla D class → **TS2417** («static side
incorrectly extends») + cascata su `set_extend`. Causa: `RuntimeAccessibleClass.get(dclassname, mode?)`
(`classes.ts:340`) è un membro statico ereditato con firma incompatibile. **Fix**: rinominato in
`getForProject`. Da ricordare per le prossime entità: `get` è occupato sulla base.

## 6. Verifica

- `npx vitest run src/joiner/__tests__/environmentConfig.test.ts` → **17/17**.
- `npm run typecheck` output **completo**: **14** errori pre-esistenti (baseline dei file noti),
  **0** nei file toccati; il rename ha riportato il conteggio da 16 a 14.
- `npm run build` → `✓ built`, solo il warning chunk-size noto.

## 7. Cosa resta (fuori F0a)

- **F0b**: mini-UI developer per marcare i `topLevelTypes` e creare/editare i ruoli (write path via
  `SetFieldAction(configId, 'topLevelTypes'|'roles', ptr, '+=', true)` — isPointer true per il pointedBy).
- Permessi per-campo (v1 è solo per-tipo).
- F1 (Configurator), F2 (applicazione permessi), F3 (shell ristretta).

---

## Addendum — Fase 0b (mini-UI developer) implementata (2026-09-23)

Mini-UI per il language developer, sullo stesso branch `feat/157-environment-config`.

**Cosa fa**: un modale `EnvironmentConfigModal` (portallato a `document.body`, come SymbolEditorModal)
aperto da un'azione «Environment config» nel project sidebar del `LeftBar`. Due sezioni:
1. **Top-level types** — checkbox per ogni metaclasse del progetto (`LProject.getProject().classes`);
   il toggle scrive `SetFieldAction.new(config.id, 'topLevelTypes', next, '', true)`.
2. **Ruoli** — crea (`DRole.new(configId, name)` + append a `config.roles`), rinomina
   (`SetFieldAction name`), elimina (unreference da `config.roles`); per il ruolo selezionato, un
   `Select` per ogni top-level type con `Editable`/`Read only`/`Hidden` che scrive
   `DRole.typePermissions` (solo gli override; `edit` = chiave assente).

**Scelte**: la config si crea **lazy** all'apertura (`DEnvironmentConfig.getOrCreate`); la lettura è
su `idlookup` via `findEnvironmentConfig` (reattiva con `useSelector`); le scritture usano la
semantica **replace** (op `''`), calcolando il nuovo array/dict in JS. L'eliminazione ruolo è un
**soft-delete** (unreference): l'entità `DRole` orfana resta in `idlookup` — `// TODO: cleanup` per il
`DeleteElementAction` (che cascata sui sub-elementi, non testato qui).

**File**: `components/environment/EnvironmentConfigModal.tsx` (+ `.scss`), `pages/components/LeftBar.tsx`.

**Verifica**: `typecheck` 14 pre-esistenti / 0 nei file toccati; `build` ✓. **Smoke visivo NON
eseguito** (app non avviata): la UI compila ed è type-safe ma il criterio d'accettazione «marca 4
tipi + crea 2 ruoli persistenti» va provato a runtime.
