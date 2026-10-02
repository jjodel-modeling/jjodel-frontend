# Discovery + piano — #157 Fase 4b: auto-risoluzione profilo da email

**Data**: 2026-09-24
**Branch**: `feat/157-environment-config`
**Fase**: F4b (assegnazione profilo→utente, semantica **auto-risoluzione** scelta dall'utente).
**Ipotesi che questa discovery falsifica**: che l'assegnazione si possa fare senza toccare le
entità D/L e senza cambiare il trigger della consumer shell. Falsa: serve un campo su
`DProfile`/`LProfile` e un consumer che lo legga, altrimenti è un dead write (§5).

---

## 1. Obiettivo e semantica scelta

Assegnare email→profilo su ogni `DProfile`. Alla navigazione **senza** `?profile=`, se l'email
dell'utente loggato è assegnata a un profilo del progetto, **applicarlo automaticamente** (la shell
entra in consumer mode con quel profilo). Con `?profile=` esplicito nell'URL, l'URL **vince**
(comportamento attuale invariato). Enforcement soft (D1).

## 2. Findings (file:riga)

- **Punto unico esistente**: `consumerMode.ts:13 activeProfileId()` (oggi solo `U.getHashParam('profile')`)
  e `:22 isConsumerMode() = !!activeProfileId()`. Estendere `activeProfileId()` propaga a tutti i
  consumer di `isConsumerMode()` (LeftBar, Navbar, DockManager) senza toccarli.
- **Owner disponibile**: `DProject.author: Pointer<DUser> = DUser.current` (`classes.ts:3060`+13).
  Permette l'**owner-bypass**: il developer che apre il proprio progetto NON viene ristretto anche
  se la sua email fosse assegnata (mitiga il footgun).
- **Email utente**: `LUser.getUser()` (`classes.ts:2892`), campo `email` (`:2880`).
- **store**: esportato dal joiner — `index.ts:214 export {store} from "../redux/createStore"`. Un
  modulo può fare `import { store } from '../../joiner'` e `store.getState().idlookup`.
- **DProfile**: `classes.ts:3758` (`name`, `typePermissions`); builder `Constructors.DProfile`
  (`:1336-1341`, inizializza `typePermissions = {}`). `LProfile` (`:3776`). Aggiungere
  `assignedEmails: string[]` segue esattamente il pattern di `typePermissions` (scrittura via
  `SetFieldAction`, lettura dal D raw in idlookup — nessun accessor L custom).
- **environmentConfig.ts**: modulo **puro** (zero import, 21 test). Sede giusta per le helper di
  matching email→profilo (testabili).
- **ConfiguratorTab**: ha un `profileIdFromUrl()` locale (`:41`, solo URL) tenuto in state. Va
  instradato su `activeProfileId()` perché un consumer email-assegnato (senza `?profile=`) riceva i
  permessi anche nel Configurator.
- **VersionFixer**: NON serve. `assignedEmails` è additivo con default `[]`; i profili salvati prima
  del campo si leggono come `[]` (reader tollerante). Rule 14 (jsxString default-view) non pertinente.

## 3. Rischio dead write (§5) — come è evitato

Il campo `assignedEmails` NON è metadata inerte: il **consumer reale** è `activeProfileId()`, che lo
legge alla navigazione e determina la consumer shell + i permessi del Configurator. La verifica
d'accettazione (§6) esegue il percorso utente end-to-end, non ispeziona il campo.

## 4. LAYER IMPACT REPORT

```
Layers touched:
  [x] D-layer (Redux raw data)      — nuovo campo DProfile.assignedEmails
  [x] L-layer (computed proxies)    — LProfile.assignedEmails (dichiarazione tipo)
  [ ] JjOM
  [ ] Canvas v2-flow
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync)      — NON toccato
  [ ] Persistence (VersionFixer)    — NON serve (campo additivo, default [])
  [x] View/shell                    — consumerMode, ProfilesStep, ConfiguratorTab

Per layer:
- D-layer: +campo assignedEmails (string[], default []) su DProfile + init nel builder.
  NON cambia: entità esistenti, altri campi, sync, canvas. Scrittura via SetFieldAction (self-tx),
  nessun creator dentro TRANSACTION esterna (§3.3/§3.4 fuori portata).
- L-layer: +dichiarazione LProfile.assignedEmails; nessun get_/set_ custom (proxy generico).
- View/shell: activeProfileId() aggiunge il fallback email (owner-bypass); ProfilesStep aggiunge
  l'editor delle email; ConfiguratorTab legge activeProfileId() invece del solo URL.
- Interazione cross-layer: activeProfileId() legge lo store (idlookup: config/profili/project.author)
  + LUser; robusto su store/config/utente assenti (try/catch → null = developer).
- Side-effect safety: con ?profile= esplicito il comportamento è identico ad oggi (URL vince). Senza,
  solo gli utenti la cui email è assegnata cambiano stato; l'owner è sempre escluso.

Smoke-test scenarios:
  - owner apre id=X senza profile → full developer (owner-bypass).
  - utente con email assegnata apre id=X senza profile → consumer shell + permessi del profilo.
  - chiunque apre id=X&profile=Y → consumer con Y (URL vince, invariato).
  - progetto salvato prima del campo → nessun assignedEmails → tutti developer (nessun crash).
```

## 5. Scope proposto — 6 file (Rule 19: conferma; Rule 20: report sopra)

1. `frontend/src/joiner/classes.ts` — `DProfile.assignedEmails: string[] = []` (campo + init nel
   builder `Constructors.DProfile`); `LProfile.assignedEmails!: string[]`. **[D/L]**
2. `frontend/src/joiner/environmentConfig.ts` — helper puri: `assignedEmailsOf(profile)`,
   `findProfileIdByAssignedEmail(idlookup, config, email)` (match trim+lowercase, primo in ordine).
3. `frontend/src/joiner/__tests__/environmentConfig.test.ts` — test per i nuovi helper (assente,
   legacy, match/no-match, case-insensitive).
4. `frontend/src/components/environment/consumerMode.ts` — `activeProfileId()`: URL vince, altrimenti
   fallback email con owner-bypass (usa store + LUser + helper puro).
5. `frontend/src/components/envgen/steps/ProfilesStep.tsx` — editor «Assigned users (emails)» nel
   detail del profilo (input, parsing per virgola/newline → `SetFieldAction` su `assignedEmails`).
6. `frontend/src/components/environment/ConfiguratorTab.tsx` — instrada la lettura del profilo su
   `activeProfileId()` (refresh su hashchange + open + idlookup); rimuove il `profileIdFromUrl` locale
   ora orfano.

## 6. Verifica d'accettazione (§5: end-to-end, non ispezione)

1. Developer (owner) marca metaclassi + crea profilo P, assegna l'email di un fruitore, salva.
2. Il fruitore (loggato con quell'email) apre `#/project?id=X` **senza** `&profile=` → LeftBar/Navbar
   ristretti, Configurator applica i permessi di P.
3. L'owner apre `#/project?id=X` senza profile → developer pieno (bypass).
4. `#/project?id=X&profile=P` continua a funzionare identico (URL vince).

## 7. Rischi / note

- **Footgun**: assegnare l'email dell'owner non lo blocca (owner-bypass). Per un collaboratore non
  owner con email assegnata, invece, la restrizione si applica (atteso).
- **Perf**: `activeProfileId()` scansiona idlookup a ogni chiamata (già così `findEnvironmentConfig`).
  Chiamato nel chrome (LeftBar/Navbar), non per-nodo. Accettabile v1; memo eventuale = raffinamento.
- **Reattività**: alla prima apertura, i componenti si ri-renderizzano quando idlookup si popola
  (project/config) → la risoluzione scatta su quel render. Da confermare nello smoke.
