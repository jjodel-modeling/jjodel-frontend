# Discovery 2026-08-30 — Micro S1b: i candidati nominati, e chi puo' nominarli

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`. Misure prese a HEAD `9daf74def`; durante la slice la
sessione parallela ha depositato S1b Fase 2 (`8b4abecbf`, `e85b9ac0d`, `f952bee05`, `f7a1a3234`,
`dd25b59ce`). Le righe citate sono state **rimisurate** a valle: `eval.ts:329-344` e' identica —
quella slice non ha toccato `eval.ts`, quindi il vuoto del §1 e' ora un fatto su codice
committato, non una condizione temporanea.
**Prompt**: «Micro: i candidati nominati nell'ambiguita' JjEL», dato in chat, non depositato in
`docs/prompts/`. Perimetro dichiarato: `jjel/evaluator/context.ts:152-175`,
`jjel/evaluator/evaluator.ts:236-245`, `types/jodie.ts:932-937`.

**Ipotesi che questa discovery falsifica**: «i tre file del perimetro bastano a far arrivare i
candidati fino a chi legge».

**Esito**: **falsificata su due lati opposti, e in modo asimmetrico.** A monte manca il
produttore, che sta fuori perimetro *e fuori da questa slice per costruzione*; a valle manca il
sito della copy, che sta fuori perimetro ma dentro questa slice, perche' il prompt lo chiede
esplicitamente («la copy li elenca, primi 5 + and N more»).

**Strumento**: `command grep` (BSD grep 2.6.0-FreeBSD), mai il wrapper `ugrep --ignore-files`.
Ogni asserzione di assenza porta il proprio controllo positivo.

---

## 1. A monte: l'unico produttore della mappa non e' in `jjel/`

```
command grep -rn "AMBIGUOUS_INSTANCES_KEY\|ambiguousInstances" src --include="*.ts" --include="*.tsx"
```
17 righe. Una sola **scrive** nella mappa:

```
jjscript/executor/commands/eval.ts:329,339,344
    const ambiguousInstances = new Map<string, { count: number; sampleClass: string | null }>();
    …
            ambiguousInstances.set(nm, { count: a.length, sampleClass });
    …
    (variables as Record<string, any>)[AMBIGUOUS_INSTANCES_KEY] = ambiguousInstances;
```

Tutte le altre leggono (`context.ts` la solleva, `evaluator.ts` la consulta, i test la
costruiscono a mano). Controllo positivo della ricerca: la stessa riga di comando ritorna le 7
occorrenze note in `context.ts`, quindi aveva segnale.

**Conseguenza sul diff**: `buildEvalContext` e' l'unico posto dove `candidates` potrebbe essere
riempito, ed e' `jjscript/` — il perimetro della slice parallela S1b Fase 2, che il prompt esclude
in modo esplicito («jjscript, NON jjel — Regola 20 era il motivo dello scorporo»). Questa slice
consegna quindi **la forma, il threading e la copy**; il riempimento resta da fare.
Finche' non atterra, `candidates` e' `undefined` in produzione e la copy resta identica a quella
di prima. Non e' un effetto collaterale: e' il criterio di accettazione del ramo negativo.

**Da non perdere**: S1b Fase 2 e' atterrata (cinque commit sopra) e **non** ha riempito il campo —
i suoi quattro file sono `instance.ts`, `elementWaiter.ts` e i due test, piu' `ProjectEditor.tsx`.
`buildEvalContext:329-341` resta l'unico posto dove scriverlo, e nessuna slice lo ha in carico.

**Forma da rispettare, perche' le due meta' combacino** (esportata da
`jjel/evaluator/context.ts`, importabile come gia' `AMBIGUOUS_INSTANCES_KEY` a `eval.ts:15`):

```typescript
export interface AmbiguousInstanceCandidate {
    id: string;                  // pointer intero, mai troncato
    className: string | null;    // metaclasse, null se il proxy non la risolve
    path: string | null;         // path di containment, null se non costruibile
}
```

`AmbiguousInstanceInfo.candidates` e' **opzionale**: il produttore che conta soltanto resta
valido, e `count` rimane l'autorita' su quanti sono (puo' superare `candidates.length`).
`Map<string, {count, sampleClass}>` di `eval.ts:329` resta assegnabile senza modifiche —
verificato: `npm run typecheck` 33 = baseline.

## 1.1 Il nome del tipo non collide con la meta' jjscript

La sessione parallela ha gia' in albero (non committato) `InstanceCandidate` con `{id, className}`
e **senza** `path`, e lo documenta come deliberato: il suo pool sono le radici di un solo modello,
dove il path non distingue (§5 del referto di Fase 1). Nomi distinti, tipi distinti, scopi
distinti. Nessuna riconciliazione richiesta da questa slice.

## 2. A valle: la copy ha un solo sito, e non e' nei tre file

`CodeWarning` (`types/jodie.ts:932`) ha **un** consumatore che ne stampa il testo:

```
components/Jodie/ChatMessages.tsx:277 (pre-diff :261)
    ? <>Ambiguous instance name <code>{w.identifier}</code> ({w.count} matches). Use the qualified
      form <code>{(w.sampleClass ?? 'ClassName')}.{w.identifier}</code>.</>
```

La catena e' `jodieJjelContext.evaluateJjelInJodie` -> `jjelProvider.run` (`warnings:
outcome.warnings`) -> `CodeEntry.warnings` -> `ChatMessages`. `JjelWarning[]` finisce in
`CodeWarning[]` per compatibilita' strutturale, mai per conversione: aggiungere un campo
opzionale a entrambe le dichiarazioni basta a farlo scorrere.

Aggiungere `candidates` a `CodeWarning` senza toccare `ChatMessages.tsx` produrrebbe un campo che
nessuno legge — cioe' esattamente la «dead write» contro cui mette in guardia CLAUDE.md §5. Il
quarto file entra percio' nel diff, ed e' **dichiarato qui invece di scivolarci dentro**
(Regola 1, Regola 20: e' layer view).

## 3. Perche' il troncamento vive in `jjel/` e non nel componente

`formatAmbiguousCandidates` e' una funzione pura in `context.ts`, accanto al tipo. Due ragioni
misurate, non stilistiche:

- **non c'e' infrastruttura di render-test**: `find src -name "*ChatMessages*"` ritorna il solo
  `.tsx`, e `package.json` non ha `@testing-library/*` (ha `@playwright/test`). La regola «primi 5
  + and N more» dentro il componente sarebbe non testabile senza una nuova dipendenza (Regola 4).
- **`null` e `''` non sono la stessa risposta**: `null` significa «il produttore non ha nominato
  nessuno», e il chiamante deve poter tenere la copy che aveva. Il componente si limita a
  `named ? \`: ${named}\` : ''`.

`ChatMessages.tsx` importa la funzione da `../../jjel/evaluator/context`, per il precedente di
`eval.ts:15` che importa `AMBIGUOUS_INSTANCES_KEY` dallo stesso path. Il **tipo** resta ridichiarato
in `types/jodie.ts` e non importato, come il commento in quel file impone da prima di questa slice.

---

## 4. Limiti di questa misura — cosa NON e' stato provato

- **Il ramo con candidati non e' verificabile a schermo in questa slice.** Non esiste un punto di
  iniezione: la mappa nasce dentro `buildEvalContext`, che non e' su `window`. Il ramo vero di
  `named ? … : ''` e' coperto dai test unitari (`formatAmbiguousCandidates`: due candidati, il
  taglio a 5 con «and 3 more», i fallback path -> metaclasse -> id) e diventera' raggiungibile a
  schermo quando la meta' jjscript riempira' la mappa. Dichiarato, non aggirato.
- **Gli omonimi della sonda stanno in UN modello, non due.** Il prompt parla di omonimi
  cross-modello, e il test unitario li costruisce cosi'; la sonda no, perche' fabbricare un secondo
  modello M1 a runtime e' piu' costoso di cio' che prova. Per il render la differenza e' nulla: il
  ramo acceso e' lo stesso.
- **La sonda scrive lo slot d'identita', non il nome.** Dopo S1a il rename rifiuta il duplicato:
  misurato in `_tmp_s1b_recon2.ts`, `lo.name = 'Red'` lascia `data.name` a `allNine_broken`. La via
  usata e' `lo['$name'].value = …`, che per CLAUDE.md §3.12 propaga con una `SetFieldAction` diretta
  su `'name'` senza passare da `set_name` — l'unico modo di fabbricare il duplicato **preesistente**
  che questa feature esiste per descrivere. Reperto collaterale: solo le classi con un attributo
  `name` hanno lo slot (`AllNine` non ce l'ha, `Config` si').
- **`Class.Name` non e' toccato.** Il punto 4 del perimetro di Fase 1 (registrare anche l'ambiguita'
  sull'asse owner) sta in `eval.ts` e resta alla slice parallela.
