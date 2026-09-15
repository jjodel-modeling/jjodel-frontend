# Discovery — Footer build version derivata da git (Fase 1, READ-ONLY)

**Data**: 2026-06-06
**Branch**: `alfonso-frontend-jjtl`
**Esito**: ✅ discovery completata — **nessun file di produzione modificato**
**Stato**: HARD STOP, in attesa di go-ahead per la Fase 2.

---

## ASSERZIONE

> **Nessun file di produzione modificato.** L'unico file scritto in questa fase è
> questo report (`docs/discovery/2026-06-06_footer_build_version.md`). Nessuna
> modifica a `package.json`, `vite.config.ts`, file `.d.ts`, componenti, o
> `VersionFixer.tsx`.

---

## 1. Dove viene renderizzato il testo della versione nel footer

**File**: `frontend/src/components/StatusBarRightZone.tsx`

Questo è il componente "right zone" della status bar, **condiviso** tra due footer
(commento di intestazione, righe 1–8): renderizza il toggle Basic/Advanced, lo stato
AI Jjodie, la campanella delle notifiche e **la versione**. Combacia esattamente con
la descrizione del prompt ("vicino al toggle Advanced, all'icona Jjodie e alla
campanella").

Righe rilevanti:

```tsx
// righe 32–35 — SORGENTE del testo
const engineVersion = useSelector((state: DState) => {
    const v = (state as any).version;
    return v?.n ? `v${v.n}` : 'v2.0';
});

// righe 113–114 — RENDER
{/* Version */}
<span className="sb-rz__version">{engineVersion}</span>
```

**Classe CSS**: `sb-rz__version` (definita in `StatusBarRightZone.scss:229`,
usata solo qui — verificato con grep). Da preservare as-is in Fase 2.

### 1.1 Il componente è condiviso da DUE footer (da tenere presente)

`StatusBarRightZone` è montato in due punti:

| Consumer | Riga | Variante |
|----------|------|----------|
| `frontend/src/components/StatusBar.tsx` | `:392` | `variant="light"` (status bar app) |
| `frontend/src/jjtl/components/JjtlStatusBar.tsx` | `:161` | `variant="dark"` (status bar editor JjTL) |

→ La nuova etichetta di build comparirà in **entrambi** i footer. È coerente con
l'obiettivo (versione di build unica ovunque), ma va dichiarato esplicitamente:
non esiste un secondo punto di rendering della versione da modificare a parte.

---

## 2. Sorgente attuale del testo versione — accertata

**Categoria: (c) altro.** NON è `(highestVersion).toFixed(2)`. NON è una costante
hardcoded. La premessa del prompt sul *meccanismo* è errata (vedi §2.2 per perché
l'output coincide comunque con `v2.22`).

### 2.1 Catena reale

1. `StatusBarRightZone.tsx:32-35` legge via `useSelector` il campo Redux
   `state.version.n` e lo formatta come template literal `` `v${v.n}` ``
   (fallback `'v2.0'` se assente). **Nessun `.toFixed`.**

2. Il valore di default di `state.version.n` è impostato in
   `frontend/src/redux/store.tsx:109`:

   ```ts
   version:{n:number, date:string, conversionList: number[]} =
     {n:VersionFixer.get_highestversion(), date: new Date().toString(), conversionList: []};
   ```

   cioè `state.version.n` = `VersionFixer.get_highestversion()`.

3. `VersionFixer.get_highestversion()` (`VersionFixer.tsx:75-78`) ritorna
   `VersionFixer.highestVersion`, calcolato automaticamente come `Math.max(...)`
   dei target dei metodi-migrazione (`VersionFixer.tsx:99`).

4. Su caricamento di un progetto persistito, `VersionFixer.update` riallinea
   `s.version.n` all'ultima versione di schema (`VersionFixer.tsx:120`,
   `currVer = s.version.n = n`). Quindi `state.version.n` **traccia la versione di
   schema** in ogni caso (store fresco o progetto migrato).

→ Conferma concettuale: **il footer mostra oggi la versione di schema**. L'obiettivo
del task (disaccoppiarla in una versione di build) è corretto; è solo il *meccanismo*
(toFixed) che il prompt ipotizzava in modo errato.

### 2.2 Perché si vede `v2.22` (e non `v2.218`)

**La versione di schema reale è `2.220`, NON `2.218`** — sia il prompt sia
`CLAUDE.md` (§ RIFERIMENTI) sono **stale** su questo punto.

I metodi-migrazione in `VersionFixer.tsx` arrivano fino a:

```
private ['2.217 -> 2.218'](s: DState): DState { ... }   // riga 804
private ['2.218 -> 2.219'](s: DState): DState { return s; }  // riga 834 (bump-only, reale)
private ['2.219 -> 2.220'](s: DState): DState { return s; }  // riga 839 (bump-only, reale)
```

(Le righe 40/57 `'2.1 -> 2.3'` sono dentro il docstring di intestazione, non metodi.)

Quindi `highestVersion = 2.220`. Come **numero** JavaScript, `2.220 === 2.22`, e
`` `v${2.22}` `` produce la stringa `"v2.22"`.

Coincidenza che ha tratto in inganno: anche `(2.218).toFixed(2)` darebbe `"2.22"`.
Due meccanismi diversi, stesso output a schermo. Il meccanismo reale è il template
literal su `state.version.n = 2.220`.

> **Nota per la verifica di Fase 2 (correzione al prompt)**: il punto 4 di "Verifica"
> dice «confermare che `VersionFixer.highestVersion` resta 2.218». Il valore corrente
> è **2.220**. La verifica corretta è: `highestVersion` resta **2.220** e
> `VersionFixer.tsx` non viene toccato. (Nessuna azione su VersionFixer in ogni caso.)

---

## 3. Module style di `vite.config.ts`

**File**: `frontend/vite.config.ts` — **ESM** (non CJS).

- `import { defineConfig } from 'vite'` + `export default defineConfig(...)`.
- Usa già `const __dirname = import.meta.dirname` (riga 6) e `import path from 'path'` (riga 4).
- Forma a **funzione**: `export default defineConfig(({ mode }) => ({ ... }))`.

→ Lo snippet ESM del prompt è applicabile direttamente. Accortezze per la Fase 2:
- **Non ridichiarare `__dirname`** (già presente alla riga 6). Per leggere
  `package.json` si può riusare `path.resolve(__dirname, './package.json')` con
  `readFileSync`, evitando di reintrodurre `fileURLToPath`/`new URL`.
- `path` è già importato; servono solo `execSync` (`node:child_process`) e
  `readFileSync` (`node:fs`).
- I costanti git vanno calcolate a **module-scope** (prima di `export default`),
  eseguite una volta per avvio `vite dev` / `vite build`.

### 3.1 Esiste già un blocco `define` → da FONDERE (non duplicare)

`vite.config.ts:48-52`:

```ts
define: {
  'global': 'globalThis',
  // 'window.jQuery': 'window.$',
  // 'window.$': 'window.$'
},
```

→ In Fase 2 le tre chiavi `__APP_VERSION__` / `__BUILD_COUNT__` / `__BUILD_SHA__`
vanno aggiunte **dentro questo oggetto esistente**, non in un secondo `define`.

---

## 4. File di dichiarazione TS globale + versione package.json

- **File `.d.ts` globale esistente**: `frontend/src/react-app-env.d.ts`.
  - **Non esiste** `vite-env.d.ts` né `global.d.ts` (verificato con `ls`).
  - → Le tre `declare const __APP_VERSION__ / __BUILD_COUNT__ / __BUILD_SHA__: string;`
    vanno aggiunte in coda a `react-app-env.d.ts` (il prompt prevedeva questa
    eventualità: «o il file di dichiarazione globale TS equivalente già presente»).

- **`frontend/package.json` → `"version"`**: attualmente `"2.0"` (riga 3).
  - In Fase 2 diventa `"3.0.0-beta"`.

- **`frontend/src/version.ts`**: non esiste (nuovo file in Fase 2).

---

## 5. Collisioni e valori git effettivi

- **Collisione nomi globali**: `grep` per `__APP_VERSION__`, `__BUILD_COUNT__`,
  `__BUILD_SHA__` in `frontend/src/` e `vite.config.ts` → **0 occorrenze**. Nessun
  conflitto.

- **Valori git correnti** (cosa mostrerà il footer dopo la Fase 2, su HEAD attuale):
  - `git rev-list --count HEAD` → `2050`
  - `git rev-parse --short HEAD` → `b2dd853b2`
  - Footer compatto: **`v3.0.0-beta (2050)`**
  - Tooltip (`title`): **`3.0.0-beta · build 2050 · b2dd853b2`**
  - ⚠️ Nota: lo short SHA qui è di **9 caratteri** (`b2dd853b2`), non 7 come
    nell'esempio del prompt (`1a2b3c4`). È normale: git allunga lo short hash
    quanto basta a renderlo non ambiguo nel repo. Nessun problema, solo per evitare
    sorprese nel confronto col mockup.

---

## 6. Nota di impatto per la Fase 2.5 (footer) — conseguenza del §2

Poiché la sorgente reale è un `useSelector` (non un `.toFixed`/costante), la modifica
di Fase 2.5 in `StatusBarRightZone.tsx` sarà:

1. `import { VERSION_LABEL, VERSION_FULL } from '<path>/version';`
2. Riga 114: `{engineVersion}` → `{VERSION_LABEL}`, aggiungere `title={VERSION_FULL}`,
   mantenendo `className="sb-rz__version"` e il markup `<span>` invariati.
3. Il selettore `engineVersion` (righe 32–35) **diventa inutilizzato**. Essendo
   *esattamente* la sorgente che viene sostituita, la rimozione è il diff minimale
   pulito e in-scope (non è "dead code adiacente" ai sensi del §2: è il codice
   sostituito). Decisione finale da confermare al go-ahead.

Nessun cambio di layout, colori, dimensioni o classi CSS. Il `title` funziona in
entrambe le varianti (light/dark).

---

## 7. Nota CI (segnalazione, non da implementare ora)

`git rev-list --count HEAD` conta i commit raggiungibili da HEAD. In build locale o
su working tree completo è monotòno e corretto. Se in futuro il frontend verrà
buildato in GitHub Actions, lo step `actions/checkout` dovrà usare `fetch-depth: 0`,
altrimenti il clone shallow restituisce un count pari a `1`. Il `gitSafe` con
fallback evita comunque crash se git non è disponibile. Da annotare nel log a fine
task; nessuna azione sul CI in questo task.

---

## 8. Riepilogo file Fase 2 (confermati)

| # | File | Azione |
|---|------|--------|
| 1 | `frontend/package.json` | `"version"` → `"3.0.0-beta"` (solo questo campo) |
| 2 | `frontend/vite.config.ts` | costanti git a module-scope + **merge** 3 chiavi nel `define` esistente |
| 3 | `frontend/src/react-app-env.d.ts` | append 3 `declare const ... : string;` (NON `vite-env.d.ts`) |
| 4 | `frontend/src/version.ts` | **nuovo** — `APP_VERSION`, `BUILD_COUNT`, `BUILD_SHA`, `VERSION_LABEL`, `VERSION_FULL` |
| 5 | `frontend/src/components/StatusBarRightZone.tsx` | riga 114: sorgente testo → `VERSION_LABEL` + `title={VERSION_FULL}`; rimozione selettore `engineVersion` (32–35) |

**DO NOT TOUCH**: `frontend/src/redux/VersionFixer.tsx` e qualsiasi logica di
migrazione/schema. `highestVersion` resta `2.220`. `state.version.n` e `store.tsx`
non si toccano (continuano a tracciare la versione di schema, ora invisibile nel footer).

---

**HARD STOP.** In attesa di go-ahead per la Fase 2.
