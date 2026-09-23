# #157 — Fase 0a: entità `DEnvironmentConfig` / `DRole` (schema + read/write, niente UI)

**Data**: 2026-09-23 12:00
**Corsia**: completa (RC-3) — nuova entità persistita, tocca `joiner/classes.ts` + `joiner/index.ts`.
**Piano**: `docs/discovery/discovery_2026-09-23_157_standalone_configurator.md` (§4 approfondimento entità, §5 Fase 0).
**Issue**: #157 (@tmaog). **Decisioni**: D1 soft-frontend, D2 stesso progetto + ruolo in URL, D3 entità dedicata (NON campi su `DProject`).
**Go-ahead**: subordinato all'approvazione del piano da parte di Tommaso sull'issue #157. **Non iniziare prima.**

## Perché è F0a e non tutta la F0

F0 completa = entità + mini-UI developer. Questo prompt implementa **solo lo schema dati e il
read/write** (nessuna UI), perché è il sottoinsieme atomico che cammina ed è testabile da solo.
La mini-UI developer (marcare i top-level types, creare i ruoli) è **F0b**, prompt separato.

**Dentro**:
- `DEnvironmentConfig` (D + L class): `father: Pointer<DProject>`; `topLevelTypes: Pointer<DClass>[]`
  (ordinati); `roles: Pointer<DRole>[]`.
- `DRole` (D + L class): `id`, `name`, e la matrice permessi per-tipo: `Dictionary<Pointer<DClass>,
  'hidden'|'read'|'edit'>` (default implicito `edit`; solo gli override sono memorizzati).
- Helper puri/di lettura: `getEnvironmentConfig(projectId)` (scan di `idlookup` per
  `className==='DEnvironmentConfig' && father===projectId`), `ensureEnvironmentConfig(projectId)`
  (create **lazy** se assente).
- Scrittura via `SetFieldAction`/`TRANSACTION` (nessun creator dentro TRANSACTION esterna vicino al
  sync — qui non siamo vicini al sync, ma vale comunque la regola 23/§3.3: usare `.new()` diretto).

**Fuori (non per dimenticanza)**:
- Qualunque UI (F0b).
- Permessi **per-campo** (solo per-tipo in v1; vedi §7.2 del piano).
- Mapping utente→ruolo (F4).
- Migrazione VersionFixer: **non serve** — creazione lazy, l'entità in idlookup persiste da sola
  (§4.3 del piano). NON aggiungere un adapter.
- Qualsiasi tocco a `DProject` o a root-field di `DState`.

## Ramo

Ramo nuovo da `staging`, `feat/157-environment-config`. Nessun merge senza decisione esplicita.

## DOVE (file previsti)

- `frontend/src/joiner/classes.ts` — 2 D class + 2 L class + builder in `Constructors`, sul pattern
  di `DProject`/`LProject` ([:3042](../../frontend/src/joiner/classes.ts#L3042), `Constructors` [:556](../../frontend/src/joiner/classes.ts#L556)).
- `frontend/src/joiner/index.ts` — export delle 4 classi + helper.
- `frontend/src/joiner/types.ts` — se servono i `Pointers`/tipi di supporto (verificare in discovery).
- (eventuale) un modulo puro `frontend/src/model/environmentConfig.ts` per gli helper di
  lettura/scrittura, se tenerli fuori da `classes.ts` è più pulito — **decidere in discovery**,
  non a priori.

> Se il conteggio supera i 5 file: pausa, elenco con cosa cambia in ciascuno, conferma (Rule 19).

## COME

1. Modellare `DEnvironmentConfig`/`DRole` come `DPointerTargetable` con `@RuntimeAccessible`,
   builder in `Constructors`, `static new()`. Copiare fedelmente il pattern di un'entità semplice
   esistente (candidata: `DViewPoint` o `DProject`); **non** inventare un pattern nuovo.
2. `father: Pointer<DProject>` per l'aggancio (back-pointer), scan idlookup per la lettura.
3. `ensureEnvironmentConfig` crea con `.new()` diretto (regola 23), idempotente (ritorna l'esistente).
4. Nessun campo su `DProject`/`DState`.

## RIFERIMENTI

- Piano: `docs/discovery/discovery_2026-09-23_157_standalone_configurator.md` §4 (entità + VersionFixer), §5 F0.
- Pattern entità: `joiner/classes.ts:3042` (DProject), `:3132` (LProject), `:556` (Constructors).
- Pattern scan idlookup: `components/abstract/tabs/instanceManagerModel.ts` (`modelIdOfObject`).
- Regole: 5 (no core), 11 (no interfacce esportate se non add optional), 19 (>5 file), 23 (no addChild/TRANSACTION esterna sui creator), §3.3.

---

## Step 0 — Discovery (READ-ONLY, hard stop)

Prima di scrivere codice, misurare e mettere a referto (addendum al piano o nuovo
`discovery_2026-09-23_...`):
1. Il pattern **esatto** per aggiungere una `DPointerTargetable`: cosa richiede `Constructors`
   (builder method), quali export in `index.ts`, se `types.ts`/`Pointers` va toccato, e se esiste
   un registro centrale delle classi da aggiornare. **Positive control**: confrontare con una
   entità aggiunta di recente (git log) per non dimenticare un punto di registrazione.
2. Come lo stato serializza/deserializza una nuova entità in idlookup (conferma che la persistenza
   è automatica e che il rehydrate non richiede altro).
3. Confermare che nessun percorso obbliga a un campo su `DProject` per la reachability.

**HARD STOP**: si riprende dopo che il referto è letto. L'esito conferma il conteggio file e se
serve `model/environmentConfig.ts` separato.

## Step 1 — Implementazione

Entità + helper, secondo l'esito dello Step 0.

## Step 2 — Verifica (gate ridotti corsia, ma è RC-3 → completi)

- `npm run typecheck`: output **completo**, baseline 33, 0 nuovi nei file toccati.
- `npm run build`: exit 0 (solo warning chunk-size).
- Test: un vitest nuovo che crea una config, aggiunge un top-level type e un ruolo con override,
  serializza→deserializza (o save→reopen simulato) e riverifica. Nessun `window` al top-level del
  modulo di test (nove suite muoiono su `window is not defined` — tenere gli helper puri).
- `npm run check:agents` **non** richiesto (nessun CLAUDE.md toccato); `check:docs` solo se si
  tocca il log.

## Consegna

- Log entry in `docs/claude-code-log.md` (formato §21.2, con `Corregge`/`Causa`).
- Referto/addendum in `docs/discovery/`.
- Commit docs separati dal codice (§6.4 / P13).
