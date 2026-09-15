# 2026-08-28 19:20 — Fixture di smoke della libreria Row view, e i due follow-up

Due prompt consecutivi, stessa sessione.

## Primo: costruire la fixture

Un entry point dev-only che crea un progetto con un metamodello e un modello e apre il canvas: la
classe `AllNine` con un attributo per renderer, cosi' che un solo nodo istanza mostri tutta la
libreria. Piu' `Color` astratta con sottoclassi singleton `Red`/`Green`/`Blue`, e un secondo `Config`
che la fixture cancella dopo la creazione, cosi' che una istanza parta con `cfg` gia' rotta.

Requisiti: idempotente, niente codice di fixture nel bundle di produzione, e **lo stesso percorso di
creazione dei modelli veri** — «se il persist callback di `DModel` non riesce a crearle per via della
lag §3.6, quella lag e' essa stessa un risultato e voglio che sia riportata, non aggirata».

## Secondo: i due follow-up

1. Le righe duplicate sono bloccanti per lo smoke: risolverle per prime. Candidato indicato: un
   mismatch di forma degli id fra `coveredAttrIds` e `DAttribute.id`. **Misurare direttamente**, un id
   coperto e un id di attributo affiancati carattere per carattere, prima di teorizzare oltre. «Il fix
   appartiene al matching di `ObjectNode`, non alla fixture.»
2. La reference rotta: una misura prima di qualsiasi codice. Leggere il `DValue` grezzo dello slot
   `cfg` dopo la delete — il puntatore morto c'e' ancora o e' stato ripulito? Se ripulito, non
   combattere: far scrivere alla fixture un puntatore penzolante verso un id mai esistito, e
   registrare nel log una domanda di design (fornita verbatim) sulle semantiche di delete. Se
   sopravvive, il bug e' nel path di risoluzione ed e' di questa slice.
3. La lag §3.6: registrarla come voce di debito a se' stante, coi numeri. Non risolverla qui.

## Esito, e due ipotesi smentite

Entrambe le ipotesi del prompt sono state **smentite dalla misura**, ed e' il motivo per cui il prompt
chiedeva di misurare.

- Le righe doppie non erano un mismatch di id: `identical: true` carattere per carattere, `missing: 0`.
  Erano 25 slot per 13 feature, creati due volte **dalla fixture**. Il fix e' quindi andato nella
  fixture e non in `ObjectNode`, il cui matching era corretto.
- Il puntatore morto **sopravvive** alla delete, quindi il ramo "se ripulito" non si applica e la
  domanda di design verbatim non e' stata registrata: non c'e' nulla da decidere. Il bug era in
  `jjomTransformers`, che leggeva `fv.values` mentre il proxy L scarta le voci non risolvibili.

Misure, numeri e il terzo difetto trovato per conseguenza (la delete va legata al rendering del canvas,
non a un timer) in `docs/sessioni/sessione_2026-08-28_row_view_library.md`.
