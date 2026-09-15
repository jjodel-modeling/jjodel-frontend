# Prompt Claude Code — arco 2, passo 6: i campi colore morti di `entityMeta.ts` e i tre commenti che mentono

**Data**: 2026-08-12 01:15
**Tipo**: refactor
**Perimetro**: cinque file, tutti fuori dalla critical zone.
**Diff verificata allegata**: `patch_2026-08-12_entitymeta_e_commenti.diff`. È stata prodotta e
provata su un clone Linux del branch a `f48cc299a`: `npm run typecheck` **14 errori, identici per
file ai 14 di partenza** (il baseline del Mac è 33, che sono questi 14 più i 19 di casing, invisibili
su filesystem case-sensitive), `npm run build` exit 0. Applicala o riproducila, non reinventarla.

---

## COSA

Cinque file, un commit solo, perché sono un'unica proposizione: `entityMeta.ts` non è più una
sorgente di colore, e i commenti che dicono il contrario vanno con essa.

### 1. `frontend/src/common/entityMeta.ts` — via i cinque campi di colore

**Rimuovere** dall'interfaccia `EntityMeta` e da tutte e **quindici** le voci di `ENTITY_META`:
`color`, `badgeBg`, `badgeText`, `badgeBgDark`, `badgeTextDark`.

**Rimuovere** la funzione `entityColor`: legge `ENTITY_META[type].color`, che non esiste più, quindi
non è una scelta ma una conseguenza.

**Riscrivere** il docblock di testata e il commento `SYNC` sopra `EntityType`, che dichiarano una
replica verso i due file di token: dopo la rigenerazione OKLCH di R-RAIL-30 non è più vera.

**Riscrivere** il docblock sopra `ENTITY_META`, che cita `DESIGN-SYSTEM.md §2.2` e
`tree-view-sidebar.scss` come sorgenti dei colori.

Il file passa da 270 a 175 righe e da 30 letterali esadecimali a **zero**.

### 2. Cosa NON rimuovere, e perché è una deviazione dichiarata

`docs/TECH-DEBT.md` autorizza la rimozione di **tre** helper: `entityColor`, `entityIcon`,
`entityIsAbstract`. Qui se ne rimuove **uno solo**.

Ragione: `entityIcon` e `entityIsAbstract` leggono `icon` e `abstract`, che non sono campi di
colore, e il design del rail li dà per consumati dall'arco 2.
`docs/redesign/rail/README.md` §Assets dice «Entity glyphs and letters come from `entityMeta.ts`»,
e §7 mette un glifo entity dentro l'identity block. Rimuoverli ora e rimetterli fra due commit è
lavoro netto negativo, e la regola 9 delle NON-NEGOTIABLE vieta comunque di togliere codice
«apparentemente inutilizzato» senza una ragione più forte di «oggi nessuno lo chiama».

Restano quindi senza chiamanti `entityIcon` e `entityIsAbstract`. **Va scritto nel log**, non
nascosto: se l'arco 2 chiude senza averli usati, la loro rimozione torna a backlog.

### 3. `frontend/src/styles/tokens/_colors-light.scss` — il commento del blocco entity

Oggi dice «Allineata a `frontend/src/common/entityMeta.ts` / NON modificare senza aggiornare anche
`entityMeta.ts`». Falso su entrambe le righe. Sostituire con la dichiarazione di sorgente unica.

### 4. `frontend/src/styles/tokens/_colors-dark.scss` — idem

Il commento descrive una derivazione («bg rgba 0.18 del fg light», «copiano `badgeBgDark`/
`badgeTextDark` di `entityMeta.ts` verbatim») che la rigenerazione OKLCH ha superato.

**Ordine obbligatorio**: i due commenti vanno riscritti **prima** o **nello stesso commit** della
cancellazione dei campi, mai dopo. Sono l'unico posto in cui quei valori erano ancora leggibili;
cancellare prima e documentare poi lascia una finestra in cui la storia è persa.

### 5. `frontend/src/constants/documentTypes.ts` — la prima riga del commento a `:44`

Cancellare **solo** la riga
`// Pink from common/entityMeta.ts viewpoint entry (badgeBg: #FCE7F3, badgeText: #DB2777).`
Le righe seguenti sono la nota TODO sul wiring di `onCreate` verso
`JjodelEvents.OPEN_NEW_VIEWPOINT_DIALOG`: **vive, si tiene**.

### 6. `frontend/src/styles/tokens/_typography.scss` — il commento a `:72`

Dice «Load Inter and JetBrains Mono from Google Fonts»; l'import a `:84` è di IBM Plex Mono.
Correggere il nome e aggiungere una riga che dice da dove arriva davvero JetBrains Mono
(`frontend/index.html`, per gli editor Monaco).

---

## Effetti collaterali misurati, da riportare nel log

1. **Il debito del teal scende da dodici file a undici.** `entityMeta.ts:84-85` e `:187-188`
   portavano `#E1F5EE`/`#0F6E56` e `#CCFBF1`/`#0D9488`, e spariscono con i campi. Verificato dopo
   la modifica: `grep -rl -iE '#CCFBF1|#0D9488|#E1F5EE|#0F6E56' frontend/src | wc -l` dà **11**.
   La voce di `docs/TECH-DEBT.md` sul teal va aggiornata nel conteggio e nell'elenco, togliendo
   `common/entityMeta.ts` (che quella voce marcava già come morto).
2. **Nessun consumatore rotto.** L'unico importatore è
   `frontend/src/components/common/ElementBadge.tsx:9`, che prende `resolveEntityType` ed
   `entityLetter`, entrambi intatti.
3. **`--color-entity-abstract-class-*` resta un alias di `class`** in entrambi i file di token
   (`_colors-light.scss:367-368`, `_colors-dark.scss:274-275`). Non si tocca qui: se l'astrattezza
   dovrà arrivare al badge, il canale non potrà essere il colore, ed è una decisione dell'arco.

---

## Verifiche prima del commit

- `npm run typecheck`: **33 errori sul Mac, invariati**. Se sale, STOP.
- `npm run build`: exit 0, solo il warning di chunk-size preesistente.
- Grep di conformità R-RAIL-19 sul diff staged, quintetto: lista nera 0, `var(--shadow-` 0,
  esadecimali attesi **negativi soltanto** (si rimuovono letterali, non se ne aggiungono: sul
  `grep '^+'` il conteggio deve essere 0), `z-index` 0, `font-family:` 0.
  Forma: `git diff --cached -U0 -- <file> | grep '^+' | grep -v '^+++' | grep -E '#[0-9a-fA-F]{3,8}'`
- **Smoke visivo**: aprire un metamodello, guardare i badge del pannello e del tree e la navbar.
  Attesa: **nessun cambiamento di colore da nessuna parte**, perché i campi rimossi non erano letti
  da nessuno. Se qualcosa cambia colore, la misura di partenza era sbagliata: STOP e riporta.

  **Gia' misurato sul percorso automatico**, non solo previsto: la build patchata e' stata servita
  e confrontata con la baseline sullo stesso scenario, tema light, classe selezionata. Identici la
  coppia del badge (`rgb(252,225,234)` / `rgb(122,64,86)`), il testo dell'identity block, i segmenti
  del breadcrumb e il colore computato di tutte le icone del tree. Resta da fare la tua verifica sul
  dev server, che copre il tema dark e le superfici che l'harness non attraversa (navbar, menu New
  document, MegamodelView).

## Hard stop

1. **Se `grep -rn "entityColor\|ENTITY_META" frontend/src` trova qualcosa fuori da
   `entityMeta.ts`**, STOP: un consumatore è comparso dopo la misura dell'11 agosto. Usa
   `command grep` e non l'`grep` interattivo (R-RAIL-29), e fai un controllo positivo su
   `entityLetter`, che deve dare almeno `ElementBadge.tsx:9` e `:21`.
2. **Se `typecheck` supera 33**, STOP.
3. **Se il diff tocca un file non elencato qui**, STOP.

## Log

Entry in `docs/claude-code-log.md`, formato §21.2.
`Corregge`: `—`. `Causa`: `—`. `Regressions`: `no` se lo smoke visivo dà nessun cambiamento,
`unknown` se non lo hai eseguito: non scrivere `no` senza aver guardato lo schermo, è l'emendamento
a R-RAIL-28. `Out-of-scope changes`: `no`. `Layer Impact Report`: `not-required`.

Nelle note vanno, come minimo: la deviazione dichiarata sui due helper tenuti e la sua ragione; il
teal che scende a undici file; il fatto che `icon` e `abstract` restano con zero lettori.
