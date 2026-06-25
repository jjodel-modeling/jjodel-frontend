# Discovery (read-only) — Toggle settings per l'autosave del layout

**Data:** 2026-06-17
**Branch:** `alfonso-frontend-jjtl`
**Tipo:** Fase 1 / discovery read-only — nessun file sorgente modificato.
**Prompt:** "Switch settings per abilitare/disabilitare l'autosave del layout" — Fase 1.

---

## TL;DR (leggere prima delle 6 risposte)

La premessa del prompt — *"il flag è una preferenza **utente globale**, vive sulla user/session class, si persiste via `UsersApi.setUserAutosaveLayout()`, lo switch va nel pannello preferenze **utente**"* — **non combacia con il read-path reale del gate**. Due scoperte bloccanti:

1. **Il gate del node-position autosave legge il flag del PROGETTO, non dell'utente.**
   `useLayoutAutosave.ts:35` → `LProject.getProject().autosaveLayout`. Il flag che governa l'autosave delle posizioni dei nodi è `DProject.autosaveLayout` (default `true`, costruttore `classes.ts:1283`), **non** `DUser.autosaveLayout` (default `true`, costruttore `classes.ts:829`). Esistono **due** campi `autosaveLayout` omonimi su due classi diverse.

2. **`UsersApi.setUserAutosaveLayout()` non è implementato: è uno stub che lancia.**
   `users.ts:73-75` → `throw new Error("Method not implemented.")`. Di conseguenza il setter L-proxy "naturale" (`LProject.set_autosaveLayout` / `LUser.set_autosaveLayout`) **lancia a runtime** perché chiama quello stub dentro la TRANSACTION.

→ Scrivere il flag tramite il setter L-proxy (`project.autosaveLayout = val`) **lancia**; scrivere il flag **dell'utente** sarebbe **cosmetico** per l'autosave dei nodi (il gate legge il progetto). Questo è esattamente il rischio "switch cosmetico" che il prompt voleva prevenire. **Vedi §6 — BLOCKER + opzioni. HARD STOP.**

---

## 1. Pannello preferenze utente

**Confermato:** `ProfileSection.tsx` è il pannello preferenze utente.
Path effettivo: `frontend/src/components/Settings/UnifiedSettingsModal/sections/ProfileSection.tsx`.

- È una sezione di `UnifiedSettingsModal` (le altre: `Appearance`, `Notifications`, `Security`, `Providers`, `Prompts`, `Advanced` — tutte **app/utente-level**; **non esiste** una sezione "settings di progetto" in questo modale).
- Ha già un blocco **"Preferences"** (`ProfileSection.tsx:342-392`) con **due toggle** esistenti:
  - **Newsletter** (`:347-360`) — toggle puro, pattern read+write minimale.
  - **Editor mode** (Basic/Advanced) (`:362-392`) — toggle con label laterale.
- **Punto d'inserimento coerente:** subito dopo il toggle "Editor mode" (`:392`), prima di `{/* Actions */}` (`:394`), dentro il blocco Preferences.

⚠️ Caveat di scope: `ProfileSection` è il pannello **utente**. Se il toggle deve controllare il flag **di progetto** (vedi §2/§6), questo pannello è semanticamente la sede sbagliata — vedi opzioni §6.

## 2. Read-path del gate (il canale di verità)

**File:** `frontend/src/components/editor-v2/hooks/useLayoutAutosave.ts`

```ts
31  const runSave = useCallback(async (): Promise<void> => {
32      const project = LProject.getProject();
35      if (!project || project.autosaveLayout === false) {   // ← IL GATE
36          pendingRef.current = false;
37          return;
38      }
```

- Riga esatta del check: **`useLayoutAutosave.ts:35`**.
- Provenienza del valore: **L-proxy `LProject`**, via `LProject.getProject()` (`:32`).
  `LProject.getProject()` = `LProject.wrap(U.getProjectID_URL())` (`classes.ts:3034-3036`).
  Il getter `LProject.get_autosaveLayout` (`classes.ts:3132`) restituisce `c.data.autosaveLayout` → cioè il **campo raw D-layer su `DProject`**.
- Wiring nell'editor: `EditorV2.tsx:360` `const { scheduleLayoutSave } = useLayoutAutosave();` (commento `:359` "gated by autosaveLayout").
- Semantica del gate: default-on. Autosave **disattivo solo se** `project.autosaveLayout === false`; `undefined`/`true` → autosave attivo.

**Conclusione:** il canale di verità è `DProject.autosaveLayout` (campo raw D-layer del progetto attivo), letto via L-proxy. **Non** è un flag utente, **non** è localStorage, **non** è una root Redux dedicata.

## 3. Write-path / setter

**Il setter atteso dal prompto NON esiste come implementazione.**
`frontend/src/api/persistance/users.ts:72-78`:

```ts
72  // todo: implement and move them to appropriate place?
73  static setUserAutosaveLayout(val: boolean) {
74      throw new Error("Method not implemented.");
75  }
```

- Firma: `static setUserAutosaveLayout(val: boolean)` — **sincrono**, **non** ritorna Promise, **non** aggiorna Redux. È un **tombstone che lancia**. Nessun override altrove (grep su `setUserAutosaveLayout`: solo questa definizione + i due callsite L-setter sotto).

**I setter L-proxy che lo chiamano (e quindi lanciano):**
- `LUser.set_autosaveLayout` — `classes.ts:2810-2817`
- `LProject.set_autosaveLayout` — `classes.ts:3133-3140`

```ts
3133  set_autosaveLayout(val: this['autosaveLayout'], c: Context): true {
3134      val = !!val;
3135      TRANSACTION('autosave user layout', ()=> {
3136          SetFieldAction.new(c.data.id, 'autosaveLayout', val, '', false);
3137          (windoww.UsersApi as typeof UsersApi).setUserAutosaveLayout(val);  // ← LANCIA
3138      });
3139      return true;
3140  }
```

`windoww.UsersApi` = la classe `@RuntimeAccessible('UsersApi')` → `.setUserAutosaveLayout` = lo stub che lancia. Quindi un assegnamento `lproject.autosaveLayout = val` **propaga l'eccezione** (la `SetFieldAction` precede la chiamata, ma l'intera TRANSACTION fallisce/non-committa per il throw). Nessun callsite invoca oggi questi setter (vedi §5), perciò il throw non è mai emerso in produzione.

**Callsite esistente del write (l'unico):** `MyRcDock.tsx:702-715` `PinnableDock.toggleAutosave()` fa `luser.autosaveLayout = setAutosave` (`:708`) / `project.autosaveLayout = setAutosave` (`:712`) — ma **`toggleAutosave` non è chiamato da nessuna UI** (§5). È codice morto, e se eseguito lancerebbe.

**Write-path raccomandato (bypassa lo stub, combacia col read della §2):**
`SetFieldAction.new(projectId, 'autosaveLayout', !!val, '', true)` direttamente dall'handler del toggle (pattern §8.4 CLAUDE.md), dove `projectId = LProject.getProject()?.id`. Scrive `data.autosaveLayout` sul `DProject` → letto dal getter del gate. **Non** passa per il setter L-proxy che lancia, **non** tocca `useLayoutAutosave.ts`, **non** tocca lo schema. (Il 5° arg lazy va allineato all'esistente `'', false`/`'', true` — da fissare in Fase 2.)

## 4. Componente toggle riusabile

**Non esiste un componente `<Switch>`/`<Toggle>` riusabile** nel design system. Il pattern in uso è **markup inline** con classi SCSS `settings-toggle`:

- Definizione SCSS: `UnifiedSettingsModal.scss` → `.settings-toggle` / `.settings-toggle-switch` (36×20, attivo `#334155` slate, inattivo `#cbd5e1`, `.active` trasla il thumb di 16px) / `.settings-toggle-thumb` / `.settings-toggle-content` / `.settings-toggle-title` / `.settings-toggle-description`. **Conforme al design system §7.1** (slate, non cyan; 36×20).
- **Pattern read+write da mirrorare (toggle Newsletter, `ProfileSection.tsx:347-360`):**

```tsx
<div className="settings-toggle" onClick={() => handleChange('newsletter', !newsletter)}>
    <div className="settings-toggle-content">
        <div className="settings-toggle-title">Newsletter</div>
        <div className="settings-toggle-description">…</div>
    </div>
    <div className={`settings-toggle-switch ${newsletter ? 'active' : ''}`}>
        <div className="settings-toggle-thumb" />
    </div>
</div>
```

→ In Fase 2 il nuovo toggle **riusa esattamente** questo markup (nessun nuovo componente, nessuna nuova classe CSS). Read = stato corrente del flag; write = handler dedicato (§3).

## 5. UI preesistente per il flag

**Nessuna UI espone oggi `autosaveLayout`.** `grep -rn "autosaveLayout"` su `frontend/src` (esclusi `classes.ts` e l'hook):

| Path:line | Cosa | Vivo? |
|---|---|---|
| `EditorV2.tsx:359` | commento ("gated by autosaveLayout") | n/a |
| `MyRcDock.tsx:694` | `duser.autosaveLayout` (read, ramo 'user') | dentro `isAutosave()` |
| `MyRcDock.tsx:698` | `project.autosaveLayout` (read, ramo 'project') | dentro `isAutosave()` |
| `MyRcDock.tsx:708` | `luser.autosaveLayout = …` (write, ramo 'user') | dentro `toggleAutosave()` |
| `MyRcDock.tsx:712` | `project.autosaveLayout = …` (write, ramo 'project') | dentro `toggleAutosave()` |

`PinnableDock.isAutosave()` (`MyRcDock.tsx:689`) e `toggleAutosave()` (`:702`) **non hanno alcun chiamante** (grep `-rE "toggleAutosave|isAutosave"` su tutto `src/`: 0 callsite esterni a MyRcDock). Sono codice morto e riguardano l'autosave del **layout dei pannelli rc-dock**, una feature **diversa** dall'autosave delle posizioni dei nodi v2-flow. **Nessun doppione da temere; nessuna UI esistente da riusare o evitare.**

## 6. Coerenza read/write — **BLOCKER**

**Domanda 3 (write) vs domanda 2 (read): non combaciano con la premessa del prompt.**

- Il gate (§2) legge **`DProject.autosaveLayout`** (flag di progetto).
- Il setter previsto dal prompt (§3) scrive un flag **utente** via `UsersApi` — e per giunta **lancia** (stub non implementato).

Esistono **due flag distinti**:

| | `DUser.autosaveLayout` | `DProject.autosaveLayout` |
|---|---|---|
| Default | `true` (`classes.ts:829`) | `true` (`classes.ts:1283`) ← riga citata dal prompt |
| Letto da | `PinnableDock.isAutosave()` ramo 'user' (**morto**) = autosave **layout pannelli rc-dock** | `useLayoutAutosave.ts:35` = autosave **posizioni nodi v2-flow** + `PinnableDock` ramo 'project' (morto) |
| Scope | preferenza globale utente | per-progetto, serializzato col progetto |

⚠️ Nota: la riga citata dal prompt (`classes.ts:1283`) è in realtà il costruttore di **`DProject`**, non della user/session class. La **riga è giusta** (è il flag che l'hook legge), ma l'etichetta "user/session class / preferenza globale" è errata.

### Conseguenze per l'implementazione
- Mettere il toggle in `ProfileSection` (pannello utente) che scrive `DUser.autosaveLayout` → **cosmetico** per l'autosave dei nodi (il gate legge il progetto). Switch non funzionante. ❌
- Per controllare **davvero** l'autosave dei nodi, il toggle deve scrivere **`DProject.autosaveLayout`** del progetto attivo — flag **per-progetto**, che:
  - vive nello stato del progetto e viaggia col file di progetto (contraddice "non viaggia col progetto" del prompt);
  - è scrivibile solo con un progetto aperto (`LProject.getProject()` può essere null dal dashboard);
  - **non** è una "preferenza utente globale".
- In entrambi i casi, il setter L-proxy **lancia** → serve write diretto via `SetFieldAction` (§3).

### Allineamento SENZA toccare `useLayoutAutosave.ts` né lo schema
Tutte le opzioni qui sotto rispettano il vincolo (nessuna modifica all'hook, nessuna nuova proprietà di schema):

- **Opzione A — flag di progetto, sede coerente (raccomandata se l'intento è "autosave nodi").**
  Toggle che legge/scrive **`DProject.autosaveLayout`** del progetto attivo via `SetFieldAction.new(projectId, 'autosaveLayout', !!val, '', true)`. Read al render da `LProject.getProject()?.autosaveLayout`. **Sede**: idealmente un punto progetto-scoped (Toolbar/menu progetto o un futuro pannello "Project settings"), **non** `ProfileSection`. Gestire `projectId == null` (nessun progetto aperto → toggle disabilitato/nascosto). Persistenza: il valore vive nello stato progetto; per sopravvivere al reload serve un save del progetto (l'autosave stesso lo fa quando ON+drag; per il caso OFF valutare un save esplicito in Fase 2). ✅ funzionale, ❌ non "user-global".

- **Opzione B — flag utente, ma serve sintonizzare il read del gate.**
  Per rendere l'autosave dei nodi una vera preferenza **utente** servirebbe che `useLayoutAutosave.ts:35` leggesse `DUser.autosaveLayout` invece di `project.autosaveLayout` → **tocca l'hook** → **fuori scope / hard-stop** per definizione del prompt. ❌ (richiede toccare l'hook).

- **Opzione C — fix dello stub `UsersApi.setUserAutosaveLayout` + uso del setter L-proxy.**
  Implementare `users.ts:73` (oggi lancia) così il setter L-proxy smette di lanciare, poi scrivere `user.autosaveLayout = val`. Ma resta il mismatch della §6 (il gate legge il progetto, non l'utente) → da solo **non** rende lo switch funzionante per i nodi, e tocca `users.ts` (file fuori dalla lista attesa). ❌ (non risolve il mismatch + tocca file extra).

**Raccomandazione netta:** **Opzione A** se l'obiettivo è controllare l'autosave delle posizioni dei nodi (ciò che la sezione "Contesto" del prompt descrive: drag-end, `useLayoutAutosave`). Comporta però due deviazioni dalla premessa del prompt che **richiedono una decisione di Alfonso**:
1. il flag è **per-progetto**, non utente-globale;
2. la **sede** coerente non è `ProfileSection` ma un punto progetto-scoped (oppure si accetta consapevolmente di metterlo in `ProfileSection` sapendo che agisce sul progetto attivo).

→ **HARD STOP.** Serve la scelta di Alfonso su flag (progetto vs utente) e sede prima di scrivere qualsiasi diff.

---

## Raccomandazione operativa per la Fase 2 (in attesa di go-ahead)

- **File da toccare (Opzione A, sede `ProfileSection` se accettata):** `ProfileSection.tsx` (+ eventuale import di `SetFieldAction`/`LProject` da `joiner`). Nessun altro file. **Niente** `useLayoutAutosave.ts`, **niente** schema, **niente** `VersionFixer` (campo già esistente, nessuna sorgente default-view toccata → §3.9 non si applica), **niente** `users.ts`.
- **Componente:** riusare il markup `settings-toggle` (mirroring del toggle Newsletter, §4). Nessun nuovo componente, nessuna nuova classe CSS.
- **Read:** al render, `LProject.getProject()?.autosaveLayout !== false`.
- **Write:** `SetFieldAction.new(projectId, 'autosaveLayout', !!val, '', true)` (bypassa lo stub che lancia, §3).
- **Etichetta:** testo che esplicita "layout / posizioni dei nodi" e — se si sceglie il flag di progetto — che è una preferenza **del progetto** (sottotesto `settings-toggle-description`).
- **Edge case:** nessun progetto aperto → toggle disabilitato o nascosto.
- **Verifica nomi:** prima di introdurre l'handler (es. `handleAutosaveLayout`/classe), `grep -rE` per collisioni.

## Flag aperti / da confermare in Fase 2
- 5° argomento lazy di `SetFieldAction` per `autosaveLayout`: l'esistente usa `'', false`; allineare consapevolmente.
- Persistenza del valore OFF al reload (l'OFF non innesca save): valutare se serve un save esplicito o se è accettabile che persista solo al prossimo save.
- Se Alfonso conferma "deve essere utente-globale", l'unica via realmente funzionante (Opzione B) richiede di toccare l'hook → ridiscutere lo scope.
