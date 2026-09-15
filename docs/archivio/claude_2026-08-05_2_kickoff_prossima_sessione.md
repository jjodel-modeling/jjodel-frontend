# Kickoff per la prossima sessione (Jjodel)

Incolla questo come primo messaggio in una chat nuova del progetto.

---

Riprendiamo il lavoro su Jjodel. Prima di rispondere qualunque cosa, leggi in quest'ordine:

1. `contesto_progetto.md`, che è l'indice ed è stato ricostruito il 2026-08-05 su due archi
   paralleli;
2. `claude/sessione_2026-08-05.md`, che è lo stato dell'**arco A** (partizione dei tab, strada
   B) ed è il filone vivo;
3. `claude/sessione_2026-08-05_2.md`, che è lo stato dell'**arco B** (legacy classic), chiuso.

Non ricostruire la storia più indietro di questi tre documenti se non serve al task.

## Dove siamo

Repo `jjodel-frontend`, branch `alfonso-frontend-jjtl`, HEAD `383170dc0`, allineato al remoto.
Gli ultimi due commit chiudono l'arco B: `1d5b55aed` ha riparato la classificazione delle view
legacy (`isKnownDefault` esteso, secchio legacy da 1315 a 86 view sui progetti reali),
`383170dc0` ha reso il tab Template di sola lettura sulle view senza `ir`.

**Il working tree non è pulito, e va guardato prima di toccare qualsiasi cosa.** Contiene:

- `CLAUDE.md` modificato e non committato, da 934 a 778 righe, con 156 righe spostate in
  `frontend/src/jjtl/CLAUDE.md`. Vedi la trappola qui sotto: **non committarlo così**;
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` e il suo test, WIP dell'arco A.
  Non stagearli da task che non li dichiarano.

## La prima cosa da fare

**Ratificare la riga su `canonicalize`** che esclude il pin di identità dal confronto di
`isMigratedDefaultView`. È proposta e argomentata in `claude/sessione_2026-08-05.md` e nelle
ratifiche del 2026-08-05, non è ratificata, e finché non lo è il task 1.3 non parte. È il solo
blocco dell'arco A.

Subito dopo, sempre sull'arco A: atterraggio congiunto di 2.1 allargata e del WIP con le
condizioni C-1..C-4 (prima l'estrazione, poi il WIP, due commit consecutivi), poi la misura
residua sul css di default sotto prefisso `body` che decide la taglia di 3.6, poi 3.6, poi 1.5.

## Le code dell'arco B, in ordine di rischio

1. **La trappola `.gitignore`, che è l'unica cosa che può fare danno restando ferma.**
   `.gitignore:61` contiene un `CLAUDE.md` nudo. Un pattern senza slash iniziale matcha a
   qualunque livello, quindi `frontend/src/jjtl/CLAUDE.md` è ignorato (verificato con
   `git check-ignore -v`). Il `CLAUDE.md` di root sopravvive solo perché tracciato prima della
   regola. Se qualcuno committa il diff pendente, dal repo spariscono 156 righe di convenzioni e
   la sostituzione non ci entra mai: su un clone pulito Claude Code perde quelle regole in
   silenzio. Fix probabile `/CLAUDE.md`, oppure una negazione esplicita. Decisione non presa.
2. **Rinominare i documenti del capitolo legacy da 2026-08-04 a 2026-08-05**, a partire da
   `docs/discovery/discovery_2026-08-04_legacy_view_census_real_projects.md`. Sono stati datati
   male in sessione, ed esiste già una famiglia `discovery_2026-08-04_*` dal lavoro vero del 4.
   Rilevante perché `check:docs` risolve i riferimenti sul prefisso timestamp.
3. **Sesta clausola in `isKnownDefault`**: 61 delle 86 view residue sono un solo template, la
   view di overlay degli errori di validazione, che termina con
   `<div className="error-message">{errors.separator(<br/>)}</div>`. Frammento marker proposto:
   `errors.separator(`. Porterebbe il residuo a 25 su 1550. Micro-slice, stesso file di costanti
   e stesso test di S1.
4. **Misura pulita di `async-lz-string`.** `U.decompressState` (`common/U.tsx:424`) usa una
   libreria che fa `setTimeout(resolve, 0)` per simbolo. Un progetto da 48 KB non ha terminato
   entro 45 secondi nel contesto della misura precedente, mentre un `lz-string` sincrono lo apre
   in 61 ms; il divario è però probabilmente amplificato da quel contesto isolato, quindi va
   rimisurato dentro la pagina prima di dichiarare qualcosa. Se conferma, è una sostituzione di
   dipendenza senza migration perché il formato è compatibile, su una funzione che sta sul
   percorso di caricamento di ogni progetto.
5. **Bonifica dei 60 progetti già flaggati per errore**: la guardia di idempotenza li salta e S1
   non bumpa `highestVersion`. Decisione non presa.
6. **Guardare le 25 view residue** e stabilire quante siano davvero notazione autorata.

## Cose da sapere per non rifare errori già fatti

- **`src/examples/` è codice morto**: nessun file del repo importa `stateExamples` o i singoli
  blob, Templates renderizza vuoto, Explore è "coming soon". Non usarlo come corpus di misura.
- **Prima di misurare un corpus, verificare che qualcuno lo carichi.** Il primo censimento è
  stato scoperto assumendo che i blob registrati in `index.ts` fossero esposti dal prodotto.
- **I progetti veri, in modalità offline, stanno in `localStorage['projects']`** con lo stato
  compresso UTF16. Il metodo di misura è descritto in `claude/sessione_2026-08-05_2.md`, sezione
  "Info strutturali scoperte": si esegue in sola lettura dalla console del browser, a batch di
  15-25 progetti.
- **Il dev server è sulla porta 3000**, non 3001.

## Come lavoriamo

Modello a tre attori invariato: Alfonso decide e verifica a schermo, questa chat progetta e
genera prompt autocontenuti in MD, Claude Code esegue con scope stretto. Two-phase con discovery
read-only e report obbligatorio in `docs/discovery/` col naming
`discovery_<data>_<descrizione>.md`. Critical zone (`useJjomSync.ts`, `portDistribution.ts`, e
per la persistenza `VersionFixer.tsx`) richiede go-ahead più Layer Impact Report. Mai `git add
.`, sempre i file del perimetro uno per uno. Hard stop prima di ogni commit, che esegue Alfonso.

Parti confermandomi che hai letto i tre documenti e dicendomi qual è, secondo te, il primo passo.
