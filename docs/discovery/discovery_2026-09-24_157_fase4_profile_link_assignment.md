# Discovery — #157 Fase 4: link stand-alone + assegnazione profilo→utente

**Data**: 2026-09-24
**Branch**: `feat/157-environment-config`
**Fase**: F4 (dal handoff: «assegnazione profilo→utente + generazione «Copy stand-alone link» per
profilo»).
**Ipotesi che questa discovery falsifica**: che F4 sia un unico blocco omogeneo. In realtà si
divide in due parti a rischio molto diverso — il link (riuso di util esistenti, solo view) e
l'assegnazione (campo nuovo su entità D/L + semantica da decidere).

---

## 1. Obiettivo

Dare al language developer, per ogni profilo, (a) un **link stand-alone** copiabile
(`#/project?id=X&profile=Y`) da consegnare al fruitore, e (b) una forma di **assegnazione
profilo→utente**. Enforcement soft (D1).

## 2. File letti (path completi)

- `frontend/src/components/envgen/steps/ProfilesStep.tsx` — UI di gestione profili (add/rename/
  delete/permessi). Ha già `projectId = U.getProjectID_URL()` e mostra il formato URL in descrizione.
- `frontend/src/utils/shareUtils.ts` — `getPublicProjectUrl(projectId)`, `copyToClipboard(text)`,
  `canShareProject`, `extractProjectIdFromUrl`.
- `frontend/src/joiner/classes.ts` — `DProfile`/`LProfile` (`:3758`/`:3776`), `DUser`/`LUser`
  (`:2759`/`:2868`, campo `email`).
- `frontend/src/common/U.tsx:2043` — `U.clipboardCopy` (alternativa a `copyToClipboard`).

## 3. Findings (file:riga, verbatim)

### 3.1 Il link riusa infrastruttura esistente

`shareUtils.ts:10 export function getPublicProjectUrl(projectId): string { const baseUrl =
'https://app.jjodel.io'; return \`${baseUrl}/#/project?id=${projectId}\`; }` e
`:37 export async function copyToClipboard(text): Promise<boolean>` (con fallback execCommand).
Il link stand-alone è `getPublicProjectUrl(projectId) + '&profile=' + profileId`, oppure — per
funzionare anche in locale durante lo smoke — `window.location.origin + '/#/project?id=…&profile=…'`.

### 3.2 ProfilesStep è già il posto giusto

`ProfilesStep.tsx:126-152` (`envgen-profile-detail`) mostra nome + permessi del profilo
selezionato. Il bottone «Copy stand-alone link» va lì, sotto il campo Name. Classi CSS già
presenti: `envgen-btn`/`envgen-btn--secondary` (`EnvGenWizardModal.scss:331/:934`),
`envgen-profile-detail` (`:1014`).

### 3.3 DProfile NON ha campo di assegnazione

`DProfile` (`classes.ts:3758`) ha solo `id`, `father`, `name`, `typePermissions`. Assegnare un
utente richiede un campo nuovo (es. `assignedEmails: string[]`) su **DProfile e LProfile**, più il
builder `Constructors.DProfile` e `set_extend`. È una modifica **D/L layer** → Rule 20 (pausa +
Layer Impact Report) e va confermata a parte.

### 3.4 Il consumo dell'assegnazione (rischio dead write, §5)

`isConsumerMode()` (`consumerMode.ts:15`) e il gate del Configurator (`ConfiguratorTab.tsx:43`)
oggi dipendono **solo** da `?profile=` nell'URL. Un campo `assignedEmails` che nessuno legge è un
**dead write** (§5). Perché conti servirebbe un **consumer**: alla navigazione senza `?profile=`,
risolvere il profilo dall'email dell'utente loggato (`LUser.getUser().email`, `classes.ts:2880`) e
applicarlo — il che cambia il *trigger* della consumer shell (oggi puro `?profile=`) e tocca
consumerMode/LeftBar/Navbar/DockManager/ConfiguratorTab. Scope ampio.

## 4. Scope proposto

### F4a — «Copy stand-alone link» (procedo ora)
- `frontend/src/utils/shareUtils.ts`: nuova `getStandaloneEnvironmentUrl(projectId, profileId)`
  (basata su `window.location.origin`, così il link funziona anche in locale per lo smoke).
- `frontend/src/components/envgen/steps/ProfilesStep.tsx`: bottone «Copy stand-alone link» nel
  detail del profilo, con feedback «Copied!» (useState locale). Riusa `copyToClipboard`.
- (eventuale) `EnvGenWizardModal.scss`: micro-stile per la riga del link, se serve.

Solo view + una util pura. **Nessun file §3.1, nessun D/L layer.** Layer Impact Report non richiesto.

### F4b — assegnazione profilo→utente (fase separata, DA CONFERMARE)
Tocca D/L (Rule 20). Due semantiche possibili:
1. **Auto-risoluzione** (consumer reale, no dead write): `assignedEmails` su DProfile; alla
   navigazione senza `?profile=`, se l'email dell'utente loggato è assegnata a un profilo, lo si
   applica. Cambia il trigger della consumer shell → scope ampio (5+ file, Layer Impact Report).
2. **Solo metadata** (rischio dead write): lista email per profilo, visibile al developer per sapere
   a chi mandare quale link; il link `&profile=` resta il meccanismo. Piccola, ma il campo va letto
   almeno dalla stessa UI (round-trip) per non essere morto.

## 5. Rischi / note

- Il baseUrl di `getPublicProjectUrl` è hardcoded a prod; per F4a uso `window.location.origin` in
  una funzione NUOVA, senza toccare quella esistente (preservazione).
- F4b è la parte che dà senso all'«assegnazione»; va decisa la semantica prima di toccare le entità.
