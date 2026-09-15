# Gate visivo: fix binding JjTL P0 + P1 (commit 03469a895, 425f0b6e3)

Procedura passo passo su http://localhost:3001/ con hard refresh. Console del browser APERTA: alcuni esiti attesi sono warning, non effetti visivi. Tempo stimato: 15-20 minuti incluso il setup.

Copre F1 (attributi ereditati), F2 (trasformazioni solo-reference), F3 (enum), F5 (nomi duplicati), F7 (attributi multi-valore), F8 (reference parzialmente risolte). Riferimento: `docs/discovery/2026-07-05_jjtl_binding_audit.md`.

---

## Fase 0: setup fixture (una tantum)

### Metamodello sorgente `SRC`

- Enum `Color` con literals `RED`, `GREEN`.
- Classe `Person` con:
  - attributo `name: EString`
  - attributo `age: EInt`
  - attributo `favorite: Color`
  - reference `friends: Person [0..*]`

### Metamodello target `TGT`

- Classe `Base` con attributo `label: EString`.
- Classe `Human` che ESTENDE `Base`, con:
  - attributo `age: EInt`
  - attributo `favorite: Color` (ridefinisci l'enum `Color` in TGT con gli STESSI nomi di literal `RED`, `GREEN`)
  - attributo `nicknames: EString [0..*]` (upper bound N)
  - reference `friends: Human [0..*]`

Il punto critico del setup: `label` deve stare SOLO su `Base`, mai su `Human`. È l'attributo ereditato che verifica F1.

### Modello M1 su `SRC` (3 oggetti)

| Oggetto | name | age | favorite | friends |
|---|---|---|---|---|
| P1 | Mario | 30 | RED (scelto dal DROPDOWN dei Properties) | P2, P3 |
| P2 | Mario (stesso nome, intenzionale) | 40 | (vuoto) | |
| P3 | Luigi | 10 | (vuoto) | |

Nota su P1.favorite: va impostato col dropdown del pannello Properties, non via script o import. Il dropdown salva il Pointer al literal nel D-layer, che è esattamente il caso che F3 ripara. Nome duplicato di P2: intenzionale, serve per F5.

---

## Fase A: trasformazione T1 (F1, F3, F5, F7, F8)

```jjtl
transformation T1
from SRC
to TGT

Person where age > 18 -> Human {
    label := name
    age := age
    favorite := favorite
    nicknames := [name, name + "_alias"]
    friends := friends
}
```

Esegui su M1. Verifiche, in ordine:

1. **Conteggio**: creati esattamente 2 Human (Luigi ha age 10, filtrato dalla guard).
2. **F5**: in console compare `[ProjectEditor] Duplicate object name "Mario" ... using "Mario_2"`. Nel modello generato esistono due oggetti distinti (D-layer: `Mario` e `Mario_2`).
3. **F1**: ENTRAMBI gli Human hanno `label` valorizzato (`Mario` sul primo, `Mario` sul secondo, dal binding `label := name`). Prima del fix `label` era sempre vuoto perché ereditato da `Base`.
4. **F5 di nuovo**: gli `age` sono quelli giusti per ciascun oggetto: 30 sul primo, 40 sul secondo. Prima del fix il secondo Mario restava vuoto o sovrascriveva il primo.
5. **F3**: `favorite` del primo Human vale `RED`. Prima del fix era vuoto (il Pointer al literal falliva open a null).
6. **F7**: `nicknames` del primo Human contiene DUE valori separati: `Mario` e `Mario_alias`. Prima del fix compariva un unico valore contenente l'array annidato. Se il parser rifiuta l'array literal `[a, b]` in posizione di binding, segnalalo: è un finding nuovo, non un fallimento di F7.
7. **F8**: `friends` del primo Human contiene UNA reference (verso Mario_2). Luigi era nei friends sorgente ma è stato filtrato dalla guard: nel risultato dell'esecuzione (pannello warnings) deve comparire `Partially resolved reference array: kept 1 resolved target(s), dropped 1 unresolved element(s)`. Prima del fix la reference spariva per intero, senza warning.

## Fase B: trasformazione T2 (F2)

```jjtl
transformation T2
from SRC
to TGT

Person -> Human {
    friends := friends
}
```

Nessun binding di attributi, solo reference. Esegui su M1. Verifiche:

1. Creati 3 Human con nomi auto-generati (`Human_0`, `Human_1`, `Human_2`).
2. Le edge `friends` sono presenti nel canvas del modello generato (P1 aveva 2 friends: attese 2 edge dal primo Human). Prima del fix: zero edge, zero warning, perché STEP 8b non partiva mai senza attributi pendenti.

## Fase C: regressione e persistenza

1. Riesegui una trasformazione pre-esistente che già funzionava prima dei fix: output identico a prima.
2. Salva il progetto, ricaricalo (hard refresh): il modello generato in Fase A è ancora lì, con attributi, enum e reference intatti.
3. Console: nessun errore nuovo tipo `Invalid action path` o eccezioni React durante le esecuzioni.

---

## Esiti

- Tutto verde: aggiorna le due entry in `docs/claude-code-log.md` (commit 03469a895 e 425f0b6e3) portando `Regressions` da `unknown` a `no`.
- Un punto fallisce: annota QUALE numero di verifica e i warning in console, e riportalo in chat. Non committare altro sul path della trasformazione prima della diagnosi.

## Limiti noti (non sono fallimenti del gate)

- Navigazione attraverso reference nei binding (`address.city`): ancora null, è F4, fix non ancora implementato.
- Modelli molto grandi: STEP 8 parte dopo 1 secondo fisso; possibili attributi mancanti per race (F6, fix in arrivo). Il gate usa 3 oggetti apposta.
- Enum in forma ordinale (numerica) nel D-layer: fuori scope di F3, documentato nell'audit.
