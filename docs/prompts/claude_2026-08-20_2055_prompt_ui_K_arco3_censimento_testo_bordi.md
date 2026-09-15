# Prompt Claude Code, 2026-08-20 20:55: arco 3 di D-UI-13, censimento di testo e bordi

**Fase**: 1 di 2. **Read-only.** Nessuna modifica al codice, nessun commit che non sia il report.
**Zona critica**: no. **Branch**: `alfonso-frontend-jjtl`. **Base**: `29101f536` o successivo.
**Decisione che governa**: **D-UI-13 e il suo Emendamento 1** in `docs/decisions.md`.
**Rileggili prima di cominciare**, non fidarti di questo riassunto.
**Report obbligatorio**: `docs/discovery/discovery_2026-08-20_censimento_testo_e_bordi.md`.
La Fase 1 **non e' chiusa finche' il report non e' scritto**: l'analisi in chat parte dal file
salvato, non dalla memoria di sessione.

---

## Inquadramento

L'arco 1 ha ritirato da `tokens.css` i 16 nomi che i due sistemi dichiaravano identici, e la misura
ha confermato che non cambia nulla a schermo. Restano 17 nomi divergenti. L'Emendamento 1 ha
stabilito che **due di questi gruppi non si consegnano meccanicamente**, e questo censimento e' la
misura che precede la decisione.

Il primo gruppo e' il testo. `tokens.css` e `tokens/` non hanno la stessa scala con valori diversi:
hanno **due scale di lunghezza diversa**. `tokens/` dichiara cinque gradi (`--color-text-primary`
`$slate-900`, `-secondary` `$slate-700`, `-tertiary` `$slate-600` con il commento «Labels,
captions», `-placeholder` `$slate-500`, `-disabled` `$slate-400`); `tokens.css` ne dichiara tre
(`#0f172a`, `#475569`, `#94a3b8`). Il suo `--color-text-tertiary` a `#94a3b8` corrisponde per valore
al **`--color-text-disabled`** di `tokens/`. Quindi i 162 siti che oggi lo usano non sono una
popolazione omogenea, e vanno smistati.

Il secondo gruppo sono i bordi. Oggi `--color-border-primary` risolve `#e2e8f0`, **lo stesso valore
di `--color-panel-border`**, che e' dichiarato solo in `tokens/` e non cambia fra i regimi. La
consegna porta il primo a `#cbd5e1` e separa le due famiglie di un gradino visibile. I due fogli
dove coesistono sono quelli del rail destro, cioe' l'area che D-UI-11 ha appena unificato.

---

## COSA: tre censimenti, un report

### Censimento A: i 162 usi di `--color-text-tertiary`

Elencarli **tutti**, uno per riga. Un conteggio non e' un censimento.

Per ciascun sito: `path:riga`, il selettore o il componente che lo contiene, e soprattutto **la
proprieta' CSS a cui il token e' assegnato**. La proprieta' e' il discriminante meccanico, il nome
del token non lo e': un token chiamato `text-*` usato come `border-color` o come `fill` e' un
difetto suo, indipendente da questo arco, e va segnalato come tale invece di essere classificato.

Poi la classificazione, in **tre** secchi:

- **`caption`**: testo che l'utente e' inteso leggere, etichetta o didascalia o testo di aiuto.
  Resta su `--color-text-tertiary` e si scurisce a `#475569`.
- **`subtle`**: testo attenuato perche' disabilitato, segnaposto, o cromo secondario che l'utente non
  deve leggere adesso. Passa a `--color-text-disabled` e resta `#94a3b8`.
- **`altro`**: il token non colora testo. Riportare la proprieta' e fermarsi li', senza proporre una
  destinazione.

**Il criterio va dichiarato in testa alla sezione e applicato uniformemente**, non deciso sito per
sito. Se un sito e' ambiguo, metterlo in una lista `dubbi` separata con una riga di motivazione:
meglio venti dubbi espliciti che venti scelte silenziose.

Aggiungere due tagli trasversali, perche' servono ad Alfonso per decidere da dove guardare:

1. la distribuzione per file, ordinata per numero di usi;
2. **quali dei 162 siti stanno nei due fogli del rail destro**
   (`components/editors/properties-with-tree-view.scss` e `components/editors/info-improvements.scss`),
   che sono l'area gia' verificata a occhio e quindi la piu' facile da falsificare.

### Censimento B: i due fogli dove le famiglie di bordo coesistono

Solo `components/editors/info-improvements.scss` e
`components/editors/properties-with-tree-view.scss`. Sono gli unici due file dove
`var(--color-border-primary)` e `var(--color-panel-border)` compaiono entrambi.

Per ogni uso di uno dei due, in quei due file: `path:riga`, selettore, proprieta' CSS.

Poi la domanda che il grep non risponde e per cui bisogna **leggere il componente**: quali coppie di
regole possono dipingere elementi **visibili contemporaneamente sullo stesso schermo**? Se due bordi
non si incontrano mai, il gradino di differenza non si vede e la consegna e' innocua li'; se si
incontrano, si vedra' esattamente come si vedevano i quattro grigi di D-UI-11. Riportare le coppie,
non una conclusione generale.

Nella stessa sezione, censire i **letterali** `#e2e8f0` e `#cbd5e1` ancora presenti in quei due
fogli: sono la stessa famiglia di difetto e vanno visti insieme, anche se non si toccano qui.

### Censimento C: i sedici nomi solo-light

Sono `--color-bg-active`, `--color-border-focus`, `--color-error-bg`, `--color-info-bg`,
`--color-interactive-active`, `--color-interactive-default`, `--color-interactive-disabled`,
`--color-interactive-hover`, `--color-success-bg`, `--color-text-disabled`,
`--color-text-placeholder`, `--color-warning-bg`, `--gradient-card`, `--gradient-hover`,
`--gradient-panel`, `--gradient-sidebar`. Dichiarati in `styles/tokens/_colors-light.scss`, assenti
da `_colors-dark.scss`. **Verifica l'elenco invece di fidartene**: ricavalo, e se non torna sedici
di' cosa hai trovato.

Per ciascuno: numero di usi e file. Piu' due domande:

- quali di questi sono usati in componenti che **si renderizzano anche in dark**;
- che cosa risolvono oggi in regime `data-theme="dark"`, misurato in pagina e non dedotto. Attenzione
  che l'assenza di dichiarazione **non** significa stringa vuota se un altro sistema di token
  dichiara lo stesso nome: `components/editor-v2/_themes.scss` e `styles/variables.scss` sono il
  terzo e il quarto sistema, e su `body` battono `:root` per ereditarieta'. Misura, non dedurre.

---

## COME

- Misura in pagina su `http://localhost:3000` (**non 3001**), pagina `#/allProjects`, **senza aprire
  progetti**: aprirne uno innesca `useLayoutAutosave` e la lettura smette di essere tale.
- Se ti serve leggere il rail destro, che vive solo con un progetto aperto, dichiaralo nel report e
  usa un progetto `model_*` e non un metamodello: la banda `Conforms to` esiste solo li'
  (`Info.tsx:467`). Ma **non salvare**.
- Sonde `_tmp_` non committate, come per l'arco 1.
- Ancora tutto al **testo del codice**, non al numero di riga: i numeri si spostano fra gli archi e i
  documenti non li seguono.

---

## Vincoli

- **Nessuna modifica a file di codice o di stile.** Nessun edit, nemmeno «tanto e' un commento».
- **Non proporre l'implementazione.** Questo prompt produce evidenza, non una patch. Le
  destinazioni proposte nel censimento A sono una classificazione, non un piano di edit.
- L'unico file che si crea e' il report, in `docs/discovery/` con il naming standard. Commit a
  parte, tipo `docs:`, con staging per file esplicito e `git commit -m "<messaggio>" -- <path>`.

## Hard stop

Dopo il commit del report, **fermarsi**. Le decisioni sul criterio di smistamento e sulla scala dei
bordi le prende Alfonso a partire dal report, e l'arco 4 non parte senza il suo go-ahead. In coda al
report, una sezione **«domande aperte per Alfonso»** con le scelte che il censimento ha fatto
emergere e che tu non devi risolvere.

## Log

Entry in `docs/claude-code-log.md` a fine task, tipo `docs`, con il numero di siti censiti per
sezione e i dubbi lasciati aperti.
Nome del documento prompt: `2026-08-20 20:55 claude_2026-08-20_2055_prompt_ui_K_arco3_censimento_testo_bordi.md`.
