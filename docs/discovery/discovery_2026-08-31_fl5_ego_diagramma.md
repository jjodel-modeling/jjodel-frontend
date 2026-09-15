# Referto — FL5, l'ego-diagramma della riga espandibile

**Data**: 2026-08-31 · **Prompt**: `docs/prompts/PROMPT_FL5_ego_diagram.md`
**Corsia**: completa (5 file sorgente, interfacce esportate nuove — RC-3)
**Esito**: ⚠️ parziale. Il modulo, il componente, lo stile e i test sono in;
l'INNESTO nella riga espandibile no, per la ragione del §2.

---

## 1. Le tre cose che la discovery ha trovato prima del diff

| # | Ipotesi del prompt | Esito |
|---|--------------------|-------|
| H1 | La riga espandibile della tabella esiste, e va solo riempita. | **Falsificata**. §2. |
| H2 | `Manager Admin Form Bottom.dc.html` e' la referenza visiva. | **Falsificata**: il file non esiste nel repo. §3. |
| H3 | Il vicinato richiede un walk nuovo. | **Falsificata**: 13a lo ha gia' camminato, e questo modulo e' una proiezione su cio' che l'ospite ha in mano. §4. |
| H4 | I colori della specifica vanno introdotti come token. | **Falsificata**: esistono tutti, in chiaro E in scuro. §6. |

## 2. La riga espandibile non esiste — e perche' non l'ho costruita

`InstanceManagerTab.tsx:1747` rende un `<tbody>` piatto: un `<tr>` per istanza,
click = `selectOnly(row.id)`, nessuna riga di dettaglio. La form vive in un
`<section className="instance-manager__pane--detail">` alla DESTRA della tabella,
e il vicinato di 13a in un `<aside className="instance-manager__pane--graph">`
accanto a quella. Il layout che il prompt presuppone — form SOTTO la tabella,
vicinato dentro la riga espansa — non e' stato costruito da nessuna slice.

Quindi il punto d'innesto e' `InstanceManagerTab.tsx`, 2012 righe, che FL4 non
dichiara fra i suoi file contesi ma il cui contenuto («la form del draft di
create (2c) e la edit usano lo stesso layout») FL4 sta riordinando. Alla domanda
posta in chat prima di scrivere qualunque riga, la risposta e' stata: **non
innestare, dichiarare** — che e' anche cio' che il prompt prescrive per questo
caso («fermati e dichiaralo nel referto invece di committare»).

Il precedente e' FL3: i sei widget estesi sono stati committati scollegati, e
l'innesto e' rimasto a FL4. Qui vale lo stesso, con una differenza da registrare:
FL3 aspettava un innesto **pianificato**; questo aspetta una superficie che
**nessun prompt ha ancora ordinato**. Chi apre la riga espandibile monta
`EgoDiagram` con tre prop e nient'altro.

**Punto aperto 1** — il riassetto «form sotto la tabella + riga espandibile» non
ha un prompt. Finche' non ce l'ha, `EgoDiagram` e' codice corretto e non reso.

## 3. Il board dichiarato autoritativo non esiste (RC-10)

`Manager Admin Form Bottom.dc.html` non e' nel repo. Misurato:
`find . -name "*.dc.html" -not -path "*/node_modules/*"` restituisce nove file
(positivo di controllo: `Jjodel Form Views.dc.html` e `13a Diagramma
Embedded.dc.html` ci sono entrambi), e nessuno e' quello. E' lo **stesso reperto
di FL1 e FL2** per `Form Auto Layout.dc.html`: la famiglia dei board di questo
handoff e' citata dalla specifica e non depositata.

Non blocca, per due ragioni: il prompt si dichiara normativo («le regole qui sotto
sono normative»), e la specifica ratificata porta la decisione per esteso —
`form-autolayout-spec.md`, «Related manager decisions»:

> Neighborhood: not in the form (form = write only). It lives on the table row
> expansion as a **1-hop ego-diagram** — fixed layout, non-interactive (click =
> select), textual list where space is narrow. Anything beyond 1 hop belongs to
> the canvas ("open in canvas").

Una clausola di quella frase NON e' implementata e va registrata: **«textual list
where space is narrow»**. Il nastro scorre orizzontalmente dentro la sua scatola
(`ego-diagram__scroll`), non degrada a lista. Il prompt non la chiede e non
descrive la lista; costruirla a naso sarebbe inventare un secondo disegno.

**Punto aperto 2** — il fallback testuale a larghezza stretta.

## 4. Niente e' camminato due volte

13a ha gia' il walk: `neighborhoodDraw.neighborhoodOf(idlookup, subjectId, shape)`
compone `ownerOf`, `filledSlotValues`, la risalita `pointedBy` di 2b e la ladder
di `detectValueRenderer`. `egoNeighborhood.ts` **non cammina niente**: riceve i
puntatori uscenti del soggetto (dato d'istanza, non di shape) e gli entranti nella
forma in cui `ShapeCtx.referencedBy` li consegna — `IncomingRef`, per puntatore e
col contenimento marcato — e da li' e' proiezione: dedup, precedenza, cap,
conteggi, posizioni.

Un import solo, di tipo, da `./shape`: come `layout.ts` e `outline.ts`.
L'invariante della directory regge.

### 4.1 Perche' e' un modulo NUOVO e non un campo di `neighborhood.ts`

Perche' sono due disegni. Il riquadro di 13a e' un pannello alto con una colonna
di **owner** sopra il soggetto; il nastro e' largo quanto una riga e non ha owner,
perche' il contenimento e' dell'outline (10b), che ha la profondita' per mostrarlo.
Fondere i due tipi darebbe a uno dei due un campo che l'altro non rende — che e'
la stessa ragione per cui le due `FormTheme` convivono (reperto FL2 §3).

### 4.2 Come tornano i numeri della fixture

Il prompt chiede: `Running` → 1 incoming (`start`), 2 outgoing
(`Transition_0`, `stop`), `referencedBy` 3. Sono tre numeri che a prima vista
litigano: se tre puntatori entrano, perche' la colonna entrante ne disegna uno?

Perche' `Running` (macchina `Heater`, campione 1b) e' puntato da `start.target`,
`stop.source` e `Transition_0.source` — tre puntatori — ma `stop` e `Transition_0`
sono gia' due dei suoi USCENTI, da `Running.outgoing`. La precedenza «un nodo per
id, e l'uscente vince» — la stessa di `neighborhoodDraw`, meno l'owner — lascia
nella colonna entrante il solo `start`. L'arco di ritorno non si perde: la chiave
`source` finisce fra le `featureKeys` dello stesso nodo, e il tooltip la stampa.

`counts.referencedBy` resta 3 perche' e' lo **stesso numero della colonna della
tabella** (`instanceTable.tableRow`: `referencedByAll.filter(r => !r.composition)`,
per puntatore). Una riga che dice 3 sopra un disegno che ne mostra 1 e' una
contraddizione a due centimetri di distanza: qui i due conteggi portano nomi
diversi — `incoming` sono le SCATOLE, `referencedBy` sono i PUNTATORI — e il
footer li tiene separati.

Il test `precedenza: l'uscente NON vince piu'` e' quello che dimostra che questa
non e' un'economia di pixel: senza la precedenza il modulo disegna `stop` due
volte, una per lato, e dichiara «3 incoming» sotto un disegno con due scatole di
troppo.

## 5. Il click, e perche' e' nel modulo

`vitest.config.ts` dichiara `environment: 'node'`, il glob raccoglie solo
`*.test.ts`, e in `package.json` non ci sono ne' jsdom ne' testing-library.
Aggiungerne uno sarebbe una dipendenza nuova (Regola 4). Quindi un `onClick`
scritto nel JSX **non e' verificabile** in questa suite.

Percio' l'instradamento vive in `egoNeighborhood.ts` come `egoAction` /
`egoDispatch` / `egoShowAll`, ed e' li' che i tre casi del prompt sono provati con
`vi.fn()`: il vicino chiama `onSelect` **con il suo id** e non tocca il canvas;
`+n more` e `show all` chiamano `onOpenInCanvas` e non toccano la selezione. Il
componente si limita a passare di li', e il suo test lo asserisce sul sorgente
(`egoDispatch(node, handlers, ego.subject.id)`, `egoShowAll(handlers)`, e
`onSelect(` che non compare mai scritto a mano).

E' una divisione, non un aggiramento: cio' che il test del componente afferma e'
metà dell'affermazione, e il referto lo dice invece di lasciarlo intendere.

## 6. I colori esistevano tutti

Nessun file di token e' stato toccato. Ogni valore della specifica ha gia' un
ruolo, in `_colors-light.scss` **e** in `_colors-dark.scss`:

| Specifica | Ruolo |
|---|---|
| card bianca | `--color-form-surface` |
| bordo `#e2e8f0` | `--color-form-border` |
| tipo slate-400 | `--color-form-muted` (`#94a3b8`) |
| hover shadow che sale | `--color-inode-shadow` → `--color-inode-shadow-hover` |
| soggetto bg `#ecfeff` | `--color-inode-ref-bg` (cyan-50) |
| soggetto bordo `#a5f3fc` | `--color-inode-ref-border` (cyan-200) |
| «this object» `#0e7490` | `--color-inode-selected-badge-fg` (cyan-700) |

**Una deviazione, dichiarata**: l'anello. La specifica chiede
`rgba(6,182,212,0.12)`; `--color-inode-selected-ring` vale `0.18` in chiaro
(`rgba(34,211,238,0.28)` in scuro). Si usa il ruolo. Introdurre un token per sei
centesimi di alfa vorrebbe dire toccare i due file di token — fuori dal perimetro,
e un ruolo in piu' che dice quasi la stessa cosa e' esattamente il modo in cui un
sistema di token si sfilaccia.

**Punto aperto 3** — se i sei centesimi contano, si allinea il ruolo esistente
(che ridipinge anche il nodo istanza sul canvas) o se ne apre uno nuovo. E' una
decisione di design, non di implementazione.

## 7. Il barrel, e l'istruzione che si contraddice

Il prompt dice due cose incompatibili: `jjform/index.ts` e' fra i **file contesi
da NON toccare**, e «l'export nel barrel (se serve) nello stesso passo in cui crei
il modulo». Sciolta in chat prima di scrivere: **non toccarlo**. `EgoDiagram.tsx`
e i test importano `jjform/egoNeighborhood` per path.

Il motivo e' misurato, non prudenziale: e' il difetto (e) di FL3 — `c98f47d3c`
(FL2) ha inglobato la modifica non committata di un'altra sessione a
`jjform/index.ts`, lasciando HEAD a esportare da un file non tracciato, e un
checkout pulito non compilava. Con FL4 in volo sullo stesso file, la stessa
collisione era disponibile una seconda volta.

**Punto aperto 4** — l'export nel barrel. Nove righe in coda a `index.ts`, quando
FL4 ha finito. Finche' non c'e', l'import per path e' l'unica forma che compila.

## 8. Le misure

| Gate | Valore | Note |
|---|---|---|
| `npm run typecheck` | **33** | baseline invariata; conteggio su output COMPLETO, non su `tail` |
| `npm run build` | exit **0** | solo il warning chunk-size preesistente |
| `npm run test` | **2456 passati / 0 falliti** | 9 file rossi = i noti `window is not defined`, nessuno di questa slice |
| unita' proprie | **39 / 39** | 25 sul modulo puro, 14 sul componente |
| `npx sass egoDiagram.scss` | exit 0, **32** regole | il foglio compila da solo |
| `npm run smoke` | **GREEN 12 / 0 / 3** | corsa quiescente, un boot per stato, albero fermo |

### 8.1 Le 39 verdi al primo colpo, messe alla prova

Cinque mutazioni sul modulo puro, cinque rossi:

| Mutazione | Rossi |
|---|---|
| la precedenza non vale piu': l'uscente non vince | 3 |
| cap a cinque invece che a quattro | 4 |
| il contenimento non e' filtrato dagli entranti | 4 |
| una colonna vuota occupa comunque spazio | 2 |
| il footer dichiara il numero disegnato, non quello vero | 2 |

### 8.2 Che cosa lo smoke NON prova, qui

Niente di questa slice. `EgoDiagram` non e' montato da nessuna superficie, quindi
non c'e' pixel da guardare: **misurato**, il CSS emesso da `npm run build`
contiene **0** occorrenze di `ego-diagram`, perche' nulla importa il componente e
Vite non emette il foglio di un modulo che nessuno tira dentro. E' lo stesso stato
misurato per FL3, e per la stessa causa. Lo smoke e' girato lo stesso, e vale come
prova che **nulla e' regredito**, non come prova che qualcosa e' apparso.

## 9. Un difetto di sessione, riportato (P8)

Due comandi hanno scritto in `frontend/frontend/`: la shell del tool conserva la
cwd fra invocazioni, e un `cd frontend` di un comando precedente ha reso relativo
al posto sbagliato un path che era stato scritto per la radice del repo. Un albero
`frontend/frontend/src/...` e' nato ed e' stato rimosso; il file finito li' e'
stato spostato al suo posto e la suite rigirata dalla radice giusta.

Registrato perche' e' una trappola dell'ambiente e non del codice: `git status`
non l'avrebbe mostrato in tempo utile (l'albero conteneva anche un
`node_modules/.vite` ignorato), e il primo verde della suite del modulo puro e'
stato ottenuto da una radice che non era quella del repo. Rifatto: 39/39 da
`/Users/alfonso/jjodel/frontend`, con `pwd` stampato nella stessa invocazione.
Nessun file di sessione resta fuori posto — verificato: `frontend/frontend` non
esiste piu'.

## 10. Perimetro (Regola 19: 5 sorgenti + 3 docs, elencati in chat, go-ahead ricevuto)

| File | Che cosa |
|---|---|
| `frontend/src/jjform/egoNeighborhood.ts` | nuovo — proiezione, cap, conteggi, click, posizioni |
| `frontend/src/jjform/__tests__/egoNeighborhood.test.ts` | nuovo — 25 unita' |
| `frontend/src/components/abstract/tabs/EgoDiagram.tsx` | nuovo — tre colonne, frecce SVG, header, footer |
| `frontend/src/components/abstract/tabs/egoDiagram.scss` | nuovo — foglio proprio, soli ruoli esistenti |
| `frontend/src/components/abstract/tabs/__tests__/egoDiagram.test.ts` | nuovo — 14 unita' |
| `docs/prompts/PROMPT_FL5_ego_diagram.md` | nuovo — deposito del prompt (RC-9) |
| `docs/discovery/discovery_2026-08-31_fl5_ego_diagramma.md` | questo |
| `docs/claude-code-log.md` | la sola entry di questa sessione |

Zero file esistenti modificati. `jjform/index.ts`, `IRForm.tsx` e
`irFormStyle.scss` — i tre contesi — non sono toccati. `InstanceManagerTab.tsx` e
`instanceManagerTab.scss` non sono toccati: e' il §2.

Layer Impact Report: **non richiesto**. Nessun file di §3.1 nel perimetro, zero
creatori D, zero `TRANSACTION`, zero `SetFieldAction`. Il componente riceve due
callback e non sa che cosa facciano; il modulo non importa niente fuori da
`./shape`.

## 11. I quattro punti aperti, in una riga ciascuno

1. Il riassetto «form sotto la tabella + riga espandibile» non ha un prompt; senza, `EgoDiagram` non e' reso.
2. «Textual list where space is narrow» della specifica non e' implementato.
3. L'anello del soggetto usa `--color-inode-selected-ring` (0.18) invece di rgba(6,182,212,0.12).
4. L'export nel barrel `jjform/index.ts` aspetta che FL4 lasci il file.
