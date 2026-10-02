# Triage + piano di rimedio — #157, feedback di test di @tmaog

**Data**: 2026-09-28
**Branch**: `feat/157-environment-config`
**Fonte**: commento di @tmaog del 2026-09-25 sulla issue #157
(`https://github.com/jjodel-modeling/jjodel-frontend/issues/157#issuecomment-5833166798`),
test eseguito su **https://beta.jjodel.io**.
**Stato**: analisi read-only. **Nessun fix scritto.** Il piano apre con una fase di diagnosi
obbligatoria (§5: riprodurre sul codice corrente prima di costruire sopra un'ipotesi).

---

## 1. Cosa ha funzionato (non toccare)

- «Copy stand-alone link» → URL con `&profile=`: **DONE**.
- Trim di LeftBar + Navbar in consumer mode: **la UI appare effettivamente ristretta**.
- Toggle di ritorno: togliendo `&profile=` + reload torna il developer completo: **DONE**.
- Wizard (marcare metaclassi, creare profilo con permessi misti): usabile, «UI diretta e intuitiva».

## 2. Inventario dei problemi (normalizzato)

| ID | Sev. | Sintomo riportato |
|----|------|-------------------|
| **P-A** | MAGGIORE | **Cluster**: (a) «Open Configurator» dal link stand-alone apre una **schermata bianca** nonostante elementi selezionati; (b) «hidden» **non nasconde**; (c) su tipi **read only** il **New è comunque presente/attivo**; (d) **riaprendo il progetto i profili non si vedono**, come se non fossero salvati. |
| **P-B** | MAGGIORE | **New non funziona** per alcuni tipi marcati **editable** (pulsante inerte su certe metaclassi). |
| **P-C** | UX rilevante | Il **corpo centrale** della pagina in consumer mostra ancora **Metamodels e Models**: «non utile per un'interfaccia che dovrebbe permettere la sola creazione dei modelli selezionati». Mostra anche «parti non selezionate». |
| **P-D** | MINOR | Per i tipi read only il **New va nascosto**, non solo disabilitato (è fuorviante). |
| **P-E** | MINOR UX | **Elenco metaclassi caotico**: raggrupparlo per metamodello (`Competencies:*` insieme, poi `CertificationDesign:*`, ecc.). |

## 3. Analisi della causa — P-A è UN solo guasto, non quattro

I quattro sintomi di **P-A** sono coerenti con **una sola causa**: nel tab stand-alone il
**profilo/config non viene risolto**, quindi i permessi non si applicano mai.

Catena: `findEnvironmentConfig(idlookup, projectId)` → null/vuota ⇒
- `visibleTopLevelTypes(config, profile)` = `[]` ⇒ top-bar vuota ⇒ **schermata bianca** (a);
- `findProfile(idlookup, profileId)` → null ⇒ `resolveTypePermission(null, …)` ritorna il default
  **`'edit'`** (`environmentConfig.ts:79-84`) ⇒ **niente è hidden** (b) e **New resta abilitato** (c);
- nel wizard la stessa scan vuota ⇒ **nessun profilo elencato** al riapri (d).

Il trim di LeftBar/Navbar invece **funziona** perché dipende solo dalla presenza di `?profile=`
(`isConsumerMode()`), non dal config: ecco perché la shell è ristretta ma i permessi no. Questa
asimmetria è la firma della diagnosi.

### 3.1 Ipotesi FALSIFICATA (non rifarla)

«Il config non è salvato perché `DProject` non ha un forward-link e l'entità è raggiungibile solo
via `father`». **Falsa.** `U.compressedState` (`common/U.tsx:428-442`) serializza **l'intero
`idlookup`**, escludendo solo gli altri `DProject`:

```
for (const [pointer, object] of Object.entries(state.idlookup) …) {
    if (object.className === DProject.name && pointer !== id) continue;
    idlookup[pointer] = object;
}
```

Quindi `DEnvironmentConfig`/`DProfile`, essendo in `idlookup`, **entrano nello stato salvato**. La
raggiungibilità non è il problema.

### 3.2 I due meccanismi candidati (da discriminare in R0)

- **M1 — il progetto non è stato salvato.** Il wizard scrive in Redux (`SetFieldAction`, live), ma la
  persistenza sul backend richiede un **save esplicito** del progetto. Senza save, un tab nuovo
  ricarica dal backend uno stato **senza** config ⇒ tutti i sintomi P-A. Coerente al 100% col fatto
  che il Configurator **funziona** nel tab developer (stato Redux vivo) e **no** nel tab stand-alone
  (fresh load).
  *Aggravante nostra*: la guida di test che ho pubblicato dichiarava «La config è salvata nello stato
  del progetto (persistente: puoi riaprire e ritrovarla)» — **ambiguo/errato**: va corretto (§5).
- **M2 — config duplicata.** `DEnvironmentConfig.getOrCreate` è
  `getForProject(pid) || DEnvironmentConfig.new(pid)` (`classes.ts`). È invocata in `useEffect` da
  **più step del wizard** (`ProfilesStep.tsx:41-43`, e analogamente in `MetaclassesStep`). Se la
  seconda chiamata parte prima che la `.new()` della prima sia visibile in `idlookup` (batching
  Redux, ID temporanei `'dwc'` — P5), nascono **due** config con lo stesso `father`.
  `findEnvironmentConfig` ritorna **la prima** in ordine di iterazione: se è quella vuota, i sintomi
  P-A compaiono **anche dopo un save corretto**.

I due non si escludono. R0 li discrimina con una misura, non per inferenza.

## 4. Piano di rimedio (corsie ordinate)

### R0 — Diagnosi (read-only, obbligatoria, sblocca tutto)
Riprodurre su beta/locale e **misurare**, non dedurre:
1. Configurare un ambiente, **salvare esplicitamente**, ricaricare: i profili tornano? (discrimina M1)
2. Scansionare `idlookup` per `className === 'DEnvironmentConfig' && father === projectId` e
   **contare**: >1 ⇒ M2 confermato. (Controllo positivo: contare anche i `DProfile`.)
3. Nel tab stand-alone, verificare che `findProfile` ritorni non-null e che
   `visibleTopLevelTypes` sia non vuota.
**Deliverable**: referto con la causa confermata e il conteggio. Nessun fix prima.

### R1 — Persistenza e unicità della config (chiude P-A) — MAGGIORE
- Se **M1**: rendere la persistenza non-opzionale nel flusso — su «Done» del wizard salvare il
  progetto (o garantire dirty + prompt inequivocabile), così configurare ⇒ persistere.
- Se **M2**: rendere `getOrCreate` **idempotente** (una sola sede di creazione, non per-step; e
  tolleranza al caso «più di una trovata», scegliendo deterministicamente la config popolata).
- **Acceptance**: configuro → salvo → riapro il progetto: **i profili ci sono**; apro il link
  stand-alone in un tab nuovo: i tipi configurati compaiono con i permessi corretti (hidden assente,
  read only bloccato).

### R2 — Il Configurator non deve mai essere una schermata bianca
Empty-state esplicito quando config/profilo mancano («nessun ambiente configurato per questo
progetto» / «profilo non trovato»), invece del vuoto muto. È la rete che rende **leggibile** un
guasto futuro invece di farlo sembrare una pagina rotta.
- **Acceptance**: senza config → messaggio con la ragione; con config → i tipi.

### R3 — New inerte su tipi «editable» (chiude P-B) — MAGGIORE
Ipotesi da verificare: `applyCreate` ritorna `null` per metaclassi **non creabili stand-alone**
(astratte, o solo-containment — esattamente il caso `phase` dentro `scenario` che @tmaog aveva
segnalato il 23/09). Interventi:
- filtrare i candidati top-level in `MetaclassesStep` alle sole metaclassi **istanziabili alla radice**
  (con hint sul perché le altre sono escluse) — implementa la sua osservazione semantica originale;
- e comunque **non lasciare un bottone muto**: se `applyCreate` fallisce, feedback esplicito.
- **Acceptance**: ogni tipo marcabile come top-level crea davvero; i non-creabili non sono marcabili.

### R4 — Read only: nascondere «New» (chiude P-D) — MINOR
Per i tipi `read`, **non rendere** il bottone invece di disabilitarlo.

### R5 — Corpo centrale in consumer (chiude P-C)
Trim del corpo centrale in consumer mode: via la sezione **Metamodels**; e portare il **Configurator**
a essere la superficie di atterraggio del fruitore invece di una overlay da aprire a mano (si
ricongiunge a **F1b**: Configurator come tab/rotta vera). Da concordare con te se il consumer deve
atterrare direttamente sul Configurator.
- **Acceptance**: il fruitore, aperto il link, vede solo ciò che può creare/editare.

### R6 — Raggruppamento metaclassi per metamodello (chiude P-E) — MINOR UX
In `MetaclassesStep` e nella lista permessi di `ProfilesStep`, raggruppare per metamodello con
intestazione di gruppo, invece della lista piatta `metamodello:metaclasse`.

### R7 — Correggere la guida di test
La guida pubblicata implica che la config persista senza save esplicito. Va corretta (e detto a
@tmaog che parte dei bug osservati può derivare da lì), altrimenti il prossimo test ripete l'errore.

## 5. Sequenza raccomandata

`R0` → `R1` (+`R2` insieme: sono la stessa area e R2 protegge da regressioni future) → `R3` →
`R4`+`R6` (rifiniture rapide) → `R5` (decisione UX) → `R7` in parallelo (docs, nessun codice).

**F4b (auto-risoluzione del profilo da email) va rinviata** dopo R1: costruire l'assegnazione
automatica sopra un config che non si risolve a runtime moltiplicherebbe il guasto invece di
aggiungere valore.

## 6. Note di rischio

- R1 può toccare il flusso di **save** del progetto: area sensibile, niente scorciatoie: il salvataggio
  esplicito resta dell'utente, si interviene sul fatto che la config *partecipi* al salvataggio e che
  non esistano config duplicate.
- R3 tocca la semantica di «top-level»: è una **decisione di modellazione** (quali metaclassi sono
  creabili), da validare con @tmaog perché è lui ad averla posta.
- Nessuna delle corsie tocca file di critical zone §3.1 per come è pianificata; R1/R3 vanno
  ri-valutate in Fase 1 di corsia (R3 sfiora `applyCreate`/`createAdapter`).
