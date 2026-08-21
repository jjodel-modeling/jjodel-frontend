# Prompt Claude Code, 2026-08-21 15:45: arco 4 di D-UI-13, smistamento del testo

**Fase**: 2, implementazione. **Un solo commit.** Nessuna discovery: il censimento e' `e35132977` e
la lista di lavoro si ricava da li'.
**Zona critica**: no. **Branch**: `alfonso-frontend-jjtl`. **Base**: il commit che porta D-UI-13
Emendamento 4 e 5, o successivo.
**Decisioni che governano**: **D-UI-13 con i suoi cinque emendamenti**, e **R-RAIL-44** che sospende
il tema scuro. **Rileggile prima di cominciare.**
**Evidenza**: `docs/discovery/discovery_2026-08-20_censimento_testo_e_bordi.md`, censimento A, in
particolare §3.1 (il criterio), §3.4 (i contrasti) e **§3.8 (l'enumerazione completa dei 162 siti)**.

---

## Inquadramento

`--color-text-tertiary` ha **162 usi** e li ha ereditati facendo da discarica: `tokens/` dichiara
cinque gradi di testo, `tokens.css` tre, e il `--color-text-tertiary` di `tokens.css` (`#94a3b8`) e'
in realta' il `--color-text-disabled` di `tokens/`. Il risultato e' che didascalie, segnaposto,
icone e testo disabilitato dipingono tutti dello stesso grigio.

**Il criterio non e' il gusto, e' il contrasto misurato.** `#94a3b8` sta a **2.56:1** su bianco, sotto
qualunque soglia. Le didascalie sono testo e vogliono 4.5:1; le icone sono non testo e vogliono 3:1,
che a `#94a3b8` non passano; solo il disabilitato e' esentato dalle soglie, ed e' l'unico che a quel
valore ci puo' restare.

**Il tema scuro non entra in questo arco.** R-RAIL-44 lo sospende: la definition of done si misura in
**un tema**, e nessun blocco `[data-theme="dark"]` si aggiunge o si verifica.

---

## COSA

Un commit. La lista di lavoro **si ricava da §3.8 del censimento**, che enumera tutti e 162 i siti
con file, riga, proprieta' e selettore. Non ricontare: leggi il secchio di ogni sito e applica la
tabella qui sotto. Ancorare al testo, non ai numeri di riga.

| secchio nel censimento | quanti | destinazione | edit |
|---|---:|---|---|
| `caption` | 55 | resta `--color-text-tertiary` | **nessuno** |
| `subtle`, sotto-etichetta `disabled` | 16 | `var(--color-text-disabled)` | si' |
| `subtle`, sotto-etichetta `placeholder` | 8 | `var(--color-text-placeholder)` | si' |
| `subtle`, sotto-etichetta `icona` | 19 | `var(--color-text-placeholder)` | si' |
| `dubbi`, i quattro «dato dipinto del grigio del cromo» | 4 | resta `--color-text-tertiary` | **nessuno** |
| `dubbi`, i tre «cromo che pero' e' testo che si legge» | 3 | `var(--color-text-placeholder)` | si' |
| `altro` | 41 | **fuori perimetro** | nessuno |
| `alias` | 12 | fuori perimetro **tranne uno**, vedi sotto | uno solo |
| `morto` | 2 | resta `--color-text-tertiary` | **nessuno** |
| `commentato` | 2 | **fuori perimetro** | nessuno |

**I sette dubbi sono decisi in D-UI-13 Emendamento 5** e non si ridiscutono qui: i primi quattro
(`dashboard.scss:909`, `RightPanel.scss:753`, `pages/components/style.scss:228`,
`JodieWindow.css:2584`) sono dati e restano leggibili a livello didascalia, quindi **non si toccano**;
gli ultimi tre (`tree-view-sidebar.scss:1803`, `menu.scss:100`, `GlobalSearch.scss:97`) sono testo che
si legge e vanno a **placeholder**.

**L'unico alias in perimetro** e' `styles/variables.scss:46`, `--color-disabled`, che oggi si risorsa
da `--color-text-tertiary`. Il suo unico consumatore vivo e' `forEndUser/color.scss:663`,
`input.prefix:disabled`, che per il criterio e' **disabled**: la dichiarazione passa a
`var(--color-text-disabled)`. Gli altri undici alias non si toccano, compresi i tre morti
(`--accent-50`, `--bg-4`, `--disabled`) e `--neutral` con i suoi tre dichiaranti.

**I due fogli gemelli si toccano tutti e due.** `components/abstract/style.scss` e
`components/abstract/style_ap.scss` hanno le stesse sette occorrenze e nessuno sa quale dei due sia
vivo (todo a registro). Si modificano **identicamente**: lasciarne indietro uno fabbrica la
divergenza che poi qualcuno debuggera' per ore.

### Correzione documentale, nello stesso commit

`frontend/src/styles/tokens/README.md`, riga ~77, dice `--color-text-tertiary - Placeholders,
disabled`, che e' **falso** e contraddice `_colors-light.scss:100` («Labels, captions»). Quel
disaccordo e' l'origine documentale di tutta la confusione che questo arco chiude. Sostituire quella
riga e aggiungere le due che mancano, cosi' che il README descriva la scala vera a cinque gradi:

```
- `--color-text-tertiary` - Labels, captions
- `--color-text-placeholder` - Placeholder text
- `--color-text-disabled` - Disabled text
```

> **Da NON toccare, dichiarato qui perche' l'istinto dice il contrario.**
> **`frontend/src/styles/tokens.css`: nemmeno una riga.** Dichiara ancora `--color-text-secondary`
> (`#475569`) e `--color-text-tertiary` (`#94a3b8`) e in regime A vince lui: il ritiro di quei due
> nomi e' **l'arco successivo**, ha 148 siti di raggio sul solo `secondary` e vuole un gate suo.
> **I 41 siti `altro`**, dove il token dipinge sfondi o bordi invece che testo: arco a se', censito.
> **I 29 fallback letterali** dentro le `var()`: sono tutti morti e tutti diversi fra loro, e
> correggerli qui mescola due difetti. Se una riga che tocchi ha un fallback, **lascialo com'e'**,
> anche se ora e' palesemente incoerente col token nuovo: e' censito e viene dopo.
> **`--color-text-tertiary-dark`** (`EditorToolbar.scss:166`): nome mai dichiarato da nessuno, non e'
> questo arco.
> **Nessun blocco `[data-theme="dark"]`**, ne' nuovo ne' esistente. R-RAIL-44.

---

## COME, il gate

### Asserzione 1, il conteggio, che e' il contratto

Il censimento fissa i numeri **prima** che tu editi, quindi qui il conteggio e' verifica, non stima.
Dopo il commit, sull'albero:

- `var(--color-text-tertiary` : **115** occorrenze (162 meno i 47 che si spostano).
- `var(--color-text-placeholder` : **31** (1 preesistente piu' 30).
- `var(--color-text-disabled` : **21** (4 preesistenti piu' 16, piu' l'alias `--color-disabled`).

Se un conteggio non torna, **fermati e riporta la differenza** invece di aggiustare fino a farla
tornare: un numero che non torna dice che il secchio di qualche sito e' stato letto male, ed e'
un'informazione, non un ostacolo.

### Asserzione 2, la lista prima degli edit

Piu' di tre file: **stampa prima la lista completa** dei siti che intendi toccare, file per file,
con secchio di partenza e destinazione, e solo dopo edita. La lista va nelle note del log.

### Asserzione 3, in pagina, relazionale

Sonda `_tmp_` non committata, `http://localhost:3000` (**non 3001**), viewport 1440x900, **solo in
regime B** (`data-theme="light"`), ripristinando l'attributo a fine misura. Scegli **almeno sei siti
raggiungibili** fra quelli che si spostano, dichiarando quali e in quale stato, e per ciascuno leggi
il colore calcolato prima e dopo. Le superfici a densita' maggiore fra i siti che si muovono sono
`pages/components/navbar.scss` (4), `components/abstract/style.scss` e `style_ap.scss` (4 ciascuno),
`pages/dashboard.scss` (3), `components/TreeViewSidebar/tree-view-sidebar.scss` (3),
`components/GlobalSearch/GlobalSearch.scss` (3), `components/ui/Input/Input.module.css` (3).

L'asserzione **non e'** sul valore assoluto: e' che ogni sito misurato dipinga **lo stesso colore del
token a cui lo hai assegnato**, risolto sull'elemento stesso. E che i siti `caption` vicini, che non
hai toccato, **non si siano mossi**.

**Se un sito non e' raggiungibile, dillo.** Una copertura dichiarata mancante e' un risultato; una
taciuta e' un errore.

### Che cosa deve cambiare a schermo, e che cosa no

In **regime B**, dopo il commit: i 30 siti a placeholder passano da `#475569` a `#64748b`, i 16 a
disabled da `#475569` a `#94a3b8`, i 59 caption restano `#475569`.

In **regime A**, dopo il commit: i 30 passano da `#94a3b8` a `#64748b`, cioe' da 2.56:1 a 4.76:1, ed
e' l'unico guadagno di leggibilita' di questo arco; i 16 disabled restano `#94a3b8`; **i 59 caption
restano `#94a3b8`**, perche' in regime A `--color-text-tertiary` viene ancora da `tokens.css`. Non e'
un fallimento dell'arco: e' il pezzo che chiude l'arco successivo, ed e' scritto qui perche' chi
guarda lo schermo senza saperlo pensera' che il commit non abbia funzionato.

---

## Gate di regressione

- `npm run build`, exit 0 (il warning chunk-size e le deprecation Sass sono noti e preesistenti).
- `npm run typecheck`: baseline **33** sull'output completo. Zero errori nuovi.
- `npm run smoke`: baseline **12 passed / 0 failed / 3 skipped**, A5 invariata.
- `npm run check:docs`, exit 0 senza warning.

---

## Vincoli

- **Solo i file che il censimento elenca nei secchi in perimetro**, piu' `styles/variables.scss` e
  `styles/tokens/README.md`. Nessun altro. Se ti accorgi che ne servirebbe un altro, fermati e chiedi.
- **Zero refactoring opportunistico.** Nessun riordino, nessun rename, nessuna correzione di fallback
  o di commenti adiacenti.
- **Mai rinominare identificatori esistenti**: qui si scambia il nome del token **dentro** la `var()`,
  non si toccano classi, variabili o selettori.
- Staging per file esplicito, `git commit -m "<messaggio>" -- <path...>`, con il `--` dopo il
  messaggio.
- Messaggio proposto:
  `refactor(tokens): split the 162 tertiary text sites onto three roles (D-UI-13 arc 4)`

## Hard stop

Dopo il commit, **fermarsi** per la verifica a vista di Alfonso. Il passo successivo, il ritiro di
`--color-text-secondary` e `--color-text-tertiary` da `tokens.css`, non parte senza go-ahead: ha 148
siti di raggio sul solo `secondary` ed e' la mossa che spegne il regime A per la famiglia del testo.

## Log

Entry in `docs/claude-code-log.md` a fine task, tipo `refactor`, con nelle note: la lista completa dei
siti toccati con secchio e destinazione, i tre conteggi dell'asserzione 1, la tabella prima/dopo dei
siti misurati in pagina e l'elenco di quelli dichiarati non raggiungibili.
**Rotazione del log se supera le 20 entry.**
Nome del documento prompt: `2026-08-21 15:45 claude_2026-08-21_1545_prompt_ui_O_arco4_smistamento_testo.md`.
