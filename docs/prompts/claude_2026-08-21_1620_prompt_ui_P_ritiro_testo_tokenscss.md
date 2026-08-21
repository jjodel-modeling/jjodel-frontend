# Prompt Claude Code, 2026-08-21 16:20: ritiro della famiglia testo da `tokens.css`

**Fase**: 2, implementazione. **Un solo commit, un solo file.** Nessuna discovery.
**Zona critica**: no. **Branch**: `alfonso-frontend-jjtl`. **Base**: `66085dda2` o successivo.
**Decisioni che governano**: **D-UI-13 e i suoi sei emendamenti**, in particolare l'**Emendamento 6**
che da' il go-ahead e fissa l'asserzione. **Rileggilo prima di cominciare.**
**Evidenza**: la entry di log dell'arco 4 (`66085dda2`) e
`docs/discovery/discovery_2026-08-20_censimento_testo_e_bordi.md`.

---

## Inquadramento

L'arco 4 ha smistato i 162 siti, ma in **regime A** (nessun `data-theme` sull'elemento radice, che e'
lo stato al boot) le didascalie dipingono ancora `#94a3b8` a 2.56:1, perche' li'
`--color-text-tertiary` viene ancora da `tokens.css`, che nel bundle sta dopo. Questo commit toglie
quella dichiarazione e la gemella `--color-text-secondary`, e con loro il regime A per la famiglia del
testo.

**I due nomi si consegnano insieme, e non e' comodita'.** Togliere solo `tertiary` lascerebbe
`secondary` a `#475569` e porterebbe `tertiary` a `#475569`: **didascalia e corpo dello stesso identico
colore**. Insieme, `secondary` va a `#334155` (10.35:1) e `tertiary` a `#475569` (7.58:1), cioe' il
gradino che la scala chiara ha per disegno.

**Il ritiro non inventa un aspetto, propaga quello che il regime B ha gia'.** Chiunque abbia scelto
«Light» nelle impostazioni vede da sempre i valori che questo commit porta anche al default. Da qui
l'asserzione che governa: dopo il commit **regime A e regime B devono risolvere identici** per tutta
la famiglia del testo.

**Nessun consumatore perde il valore.** I due nomi restano dichiarati da `styles/tokens/`. Cambia il
valore in regime A, non l'esistenza del token: `components/ui/**`, che consuma il livello primitivo di
`tokens.css` con 212 riferimenti, non e' toccato.

---

## COSA

Un commit. Tutti gli edit in **`frontend/src/styles/tokens.css`**.

1. **Togliere le due dichiarazioni** (righe ~111-112):
   `--color-text-secondary: #475569;` e `--color-text-tertiary: #94a3b8;`.
2. **Togliere il commento di sezione che le sovrasta**, `SEMANTIC COLORS - Text`, che dopo la
   sottrazione resta a intestare **l'insieme vuoto**. Non e' pulizia opportunistica: e' un commento
   che dopo questo commit descrive niente. Il commento `Transition timing functions`, gia' senza
   dichiarazioni sotto dall'arco 1, **resta dov'e'**: non e' di questo commit.
3. **Aggiornare il commento di testa** del file, il blocco D-UI-13 alle righe 10-16. Oggi dice che i
   nomi ancora in collisione «sono gli archi 2 to 4», numerazione superata da due emendamenti.
   Sostituire quella frase con lo stato vero: arco 1 i sedici identici (2026-08-20), arco 4 lo
   smistamento del testo e questo ritiro (2026-08-21); restano in collisione sfondi, bordi, ombre,
   transizioni e la scala z, archi 5 a 8, vedi `docs/decisions.md`.

> **Da NON toccare.**
> **Nessun altro nome di `tokens.css`.** Gli altri collisi (sfondi, bordi, ombre, transizioni, z)
> sono gli archi 5 a 8 e ognuno ha il suo raggio.
> **`styles/forms.scss`**: 410 righe, 58 letterali di colore contro 4 `var(--)`, e su un'altra
> palette (rampa gray, non slate). E' registrato nell'Emendamento 6 come arco a se'. **Non e' questo.**
> **I 41 siti «altro»**, dove un token `text-*` dipinge sfondi o bordi: qui si **misurano**, non si
> correggono. La loro riclassificazione e' un arco suo.
> **Nessun blocco `[data-theme="dark"]`.** R-RAIL-44.

---

## COME, il gate

Sonda `_tmp_` non committata, `http://localhost:3000` (**non 3001**), viewport 1440x900. `data-theme`
va riportato allo stato iniziale a fine misura.

### Asserzione 1, la convergenza, che e' il contratto

Su `document.documentElement`, leggere i sei nomi della famiglia (`--color-text-primary`,
`-secondary`, `-tertiary`, `-placeholder`, `-disabled`, `-inverse`) in **regime A** e **regime B**,
prima e dopo.

- **PRIMA**: A e B differiscono su `secondary` e `tertiary` (`#475569` contro `#334155`, `#94a3b8`
  contro `#475569`).
- **DOPO**: A e B **identici su tutti e sei**.

E' la prima volta che due dei tre regimi convergono su una famiglia. Se non convergono, il commit non
ha fatto quello per cui esiste.

### Asserzione 2, la non-collassata

**DOPO, in regime A**: `--color-text-secondary` e `--color-text-tertiary` devono essere **diversi**,
con `secondary` piu' scuro. E' l'asserzione che intercetta la mezza consegna, cioe' il ritiro di un
nome solo.

### Asserzione 3, in pagina, e nella forma forte

Almeno **sei siti vivi**, scelti e dichiarati, presi da tre famiglie diverse: due `caption` fra i 59
rimasti su `tertiary`, due siti che usano `--color-text-secondary`, e **due dei 41 «altro»**, dove il
token dipinge sfondo o bordo e dove il salto e' il piu' visibile (`forEndUser/control.scss` ne ha 11,
`editors/console.scss` 9).

Per ciascuno misurare tre volte: **regime A prima**, **regime B prima**, **regime A dopo**. La forma
forte dell'asserzione e' che **regime A dopo == regime B prima**, sito per sito. Se qualcosa non
combacia, quel sito ha una terza sorgente che nessuno ha censito, ed e' un risultato, non un ostacolo:
riportalo invece di aggiustare.

**Controllo negativo**: regime B prima == regime B dopo, su tutti i siti misurati. Il regime B **non
si muove**, perche' li' `tokens/` vinceva gia'.

### Asserzione 4, il controllo sul controllo

Come nell'arco 1: verificare che il CSS **servito** non dichiari piu' i due nomi e dichiari ancora
`--radius-base` e `--input-height-base`. Un DOPO stantio passerebbe l'asserzione 2 e falserebbe la 1.

---

## Verifica a vista di Alfonso

Il salto grosso non e' sulle didascalie, e' sui **41 siti «altro»**: sfondi e bordi che in regime A
passano da `#94a3b8` a `#475569`. In regime B sono gia' cosi' da sempre, quindi non c'e' niente di
nuovo da giudicare, ma e' li' che l'occhio va per primo. Superfici: `forEndUser/control.scss`,
`editors/console.scss`, `pages/dashboard.scss`.

---

## Gate di regressione

- `npm run build`, exit 0 (warning chunk-size e deprecation Sass noti e preesistenti).
- `npm run typecheck`: baseline **33** sull'output completo. Zero errori nuovi.
- `npm run smoke`: baseline **12 passed / 0 failed / 3 skipped**, A5 invariata.
- `npm run check:docs`, exit 0 senza warning.

---

## Vincoli

- **Un solo file.** Se ti accorgi che ne servirebbe un secondo, fermati e chiedi.
- **Zero refactoring opportunistico.** Le uniche righe preesistenti toccate sono le due
  dichiarazioni, il loro commento di sezione e la frase superata del commento di testa.
- Staging per file esplicito, `git commit -m "<messaggio>" -- <path>`, con il `--` dopo il messaggio.
- Messaggio proposto:
  `refactor(tokens): withdraw the two text names from tokens.css (D-UI-13)`

## Hard stop

Dopo il commit, **fermarsi**. Il prossimo arco (5, i bordi) non parte senza go-ahead, e prima c'e' da
decidere che cosa fare di `styles/forms.scss`.

## Log

Entry in `docs/claude-code-log.md` a fine task, tipo `refactor`, con nelle note: la tabella dei sei
nomi nei due regimi prima e dopo (asserzione 1), l'esito della forma forte dell'asserzione 3 sito per
sito, e l'elenco dei siti dichiarati non raggiungibili.
Nome del documento prompt: `2026-08-21 16:20 claude_2026-08-21_1620_prompt_ui_P_ritiro_testo_tokenscss.md`.
