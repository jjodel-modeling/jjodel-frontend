# Classificazione del teal, e il limite della famiglia contenitori che ne emerge

**Data**: 2026-08-12, sessione autonoma.
**Base**: `alfonso-frontend-jjtl` a `f48cc299a`.
**Origine**: la voce di `docs/TECH-DEBT.md` «Il teal duplicato per copia indipendente in dodici file»
dice «prima si classifica uso per uso, poi si tokenizza solo ciò che è colore di entità». Questa è
la classificazione.

**Esito breve**: dei venticinque usi, **sette** sono colore di entità e andrebbero ai token. Ma
tokenizzarli non si può fare oggi, perché farebbe collassare la legenda del megamodel su tre
swatch identici su quattro. La voce non è pronta per l'esecuzione: prima serve una decisione che
R-RAIL-30 non copre.

---

## 1. La classificazione

### Vanno ai token entity: sette siti in cinque file

| sito | catena | entità | token di destinazione |
|---|---|---|---|
| `common/element-badge.scss:85-86` | `.element-badge--object` | **object** | `--color-entity-object-{bg,fg}` |
| `common/element-badge.scss:98-99` | `.element-badge--epsilon, .element-badge--transformation` | **transformation** | `--color-entity-transformation-{bg,fg}` |
| `project/project-editor.scss:695-696` | `.list-card__icon--transformation` | **transformation** | idem |
| `megamodel/MegamodelView.scss:261-262` | `.mm-card__badge--transformation` | **transformation** | idem |
| `megamodel/MegamodelView.scss:467` | `.mm-legend__swatch--transformation` | **transformation** | idem |
| `pages/components/navbar.scss:1819-1820` | `.appbar-tab__badge--viewpoint` | **viewpoint** | `--color-entity-viewpoint-{bg,fg}` |
| `pages/components/navbar.scss:1774` | `.appbar-tab--viewpoint.appbar-tab--active .appbar-tab__name` | **viewpoint**, in stato attivo | idem, più il fondo `rgba(13,148,136,.08)` che va derivato |

Più i due di `common/entityMeta.ts` (`:84-85` transformation, `:187-188` object), che il passo 6
rimuove insieme ai campi morti.

### Non sono colore di entità: sei siti

| sito | cosa colora davvero | perché resta fuori |
|---|---|---|
| `editor-v2/EditorV2.scss:481` | `.toolbar-syntax-pill--concrete` | è la **sintassi** concreta contro astratta, non un tipo di elemento. Vivo, consumato da `Toolbar.tsx:435` |
| `editor-v2/_color-schemes.scss:176,185` | `--enum-header-bg` e `--enum-accent` dello schema **Jade** | è uno degli schemi colore che l'utente sceglie per il canvas (`ColorSchemeSelector.tsx:38`); scala diversa e deliberatamente diversa. Consumati in `EditorV2.scss:1589,1597,1602` |
| `editors/views/nestedView.scss:2942` | `.icon.type.tree-EdgeInheritance` | è un tipo di **edge**, e la scala entity non ha coppie per gli edge |
| `Jodie/ActionSuggestion.css:87` | bordo della card di uno step dell'assistente | nessuna semantica di tipo |
| `constants/avatarConfig.ts:14` | ottava tinta di `AVATAR_COLORS` | palette di scelta dell'avatar utente, salvata in `localStorage`; nessuna relazione con i tipi |

### Codice morto, da accertare prima di toccare: due siti

| sito | perché sembra morto |
|---|---|
| `abstract/tabs/tab-title.scss:83-84` | `.tab-title[data-type="viewpoint"]::before` con `content: "V"`. `TabDataMaker.tsx` emette `data-type` solo per `metamodel` (`:19`), `model` (`:29`) e `documentation` (`:46`): nessun produttore di `viewpoint` trovato nei `.tsx` |
| `abstract/tabs/EditorSwitch.scss:52` | `.editor-split__pane-label--concrete`. Nessun `.tsx` emette `pane-label` |

Tokenizzare codice morto è lavoro che non si vede e non si verifica. Per questi due la mossa è
accertare il produttore con un controllo positivo, e se non c'è marcarli come morti nella voce di
debito invece di migrarli.

---

## 2. Il blocco: la legenda del megamodel

Tokenizzare i sette siti non è meccanico, perché **cambia colori a video**. La scala rigenerata
mette `transformation`, `viewpoint`, `metamodel` e `model` tutti sulla stessa coppia, quella della
famiglia contenitori, `#E2EAF5 / #45566F`.

Ecco cosa c'è oggi in `MegamodelView.scss`, misurato:

| kind | badge della card, oggi | swatch della legenda, oggi | dopo la tokenizzazione |
|---|---|---|---|
| metamodel | `#EEEDFE / #534AB7` viola | `#EEEDFE`, bordo `#AFA9EC` | `#E2EAF5 / #45566F` |
| model | `#FAEEDA / #854F0B` ambra | `#FAEEDA`, bordo `#FAC775` | `#E2EAF5 / #45566F` |
| transformation | `#E1F5EE / #0F6E56` teal | `#E1F5EE`, bordo `#5DCAA5` | `#E2EAF5 / #45566F` |
| viewpoint | `#FAEEDA / #854F0B` ambra | (non in legenda) | `#E2EAF5 / #45566F` |
| generated | `#FAECE7 / #993C1D` corallo | `#FAECE7`, bordo `#F0997B` | invariato: non è un kind, è uno stato |

**La legenda ha quattro swatch e ne resterebbero due distinti**: tre identici più `generated`.

Una legenda è il posto in cui il colore non è un canale ridondante: è **l'unico** canale. Lo swatch
è un quadrato di 10×10 accanto a un'etichetta, e il suo mestiere è far corrispondere il badge di
una card alla riga giusta della legenda. Tre swatch uguali rendono la corrispondenza impossibile,
e l'etichetta accanto non aiuta: è proprio quello che si sta cercando di trovare.

### Cosa dice questo di R-RAIL-30

La giustificazione della famiglia contenitori è che «il badge porta sempre testo, verificato su tre
siti su tre, più un glifo Bootstrap in `PropertiesHeader`». È vera, e verificata, **sui tre siti del
rail**. Fuori dal rail non regge: la legenda del megamodel è un consumatore della scala entity che
di testo non ne porta.

R-RAIL-32 dice che una regola di famiglia vale finché i membri non compaiono come fratelli
simultanei, e che le superfici che li affiancano vanno cercate prima. Ne aveva trovate due, il menu
«New document» e le icone del tree. **Sono tre.** La terza è la peggiore delle tre, perché è l'unica
in cui il colore non ha un canale di riserva.

### Un difetto preesistente, mai registrato

`viewpoint` e `model` hanno **già oggi** la stessa coppia nel badge della card megamodel,
`#FAEEDA / #854F0B` (`:265-270` contro `:257-259`). Non è una conseguenza della scala nuova: c'era
prima. Va scritto, perché altrimenti la prima persona che guarda la megamodel view dopo la
tokenizzazione attribuirà alla scala una collisione che la precede.

---

## 3. Posizione

**La voce di debito sul teal non si esegue in questo arco.** Non perché sia difficile, ma perché
metà del lavoro consiste in una decisione che non è stata presa: se la famiglia contenitori valga
anche dove il colore è l'unico canale.

**Proposta, in tre punti.**

1. **Spezzare la voce in due.** La parte che è vera igiene, cioè i sei usi che non sono colore di
   entità, si chiude con una riga di documentazione: restano letterali perché non appartengono alla
   scala, e la voce smette di contarli come debito. Il conteggio scende da dodici file a cinque.
2. **Iscrivere il limite della famiglia**, come sotto-punto di R-RAIL-30 o come regola nuova: la
   coppia unica dei contenitori vale sulle superfici in cui il tipo è portato anche da lettera,
   etichetta o glifo. Dove il colore è l'unico canale, la famiglia non si applica e serve una
   distinzione. La legenda del megamodel è il caso di prova.
3. **Decidere il canale sostitutivo**, che è la stessa decisione già aperta dalla voce sul menu
   «New document». Lì la risposta proposta era un'icona per tipo. In una legenda l'icona funziona
   meglio che altrove, perché la legenda ha spazio ed è statica. Se la risposta è la stessa in
   entrambe le superfici, le due voci si chiudono insieme e diventano un passo solo.

Finché non è presa, tokenizzare quei sette siti peggiora il prodotto in modo misurabile, e lo fa in
esecuzione di una regola che per quelle superfici non era stata verificata.

---

## 4. Aggiornamenti da fare alla voce di `TECH-DEBT.md`

- Il conteggio passa da **dodici file a undici** dopo il passo 6, che rimuove i due usi di
  `entityMeta.ts`. Verificato: `grep -rl -iE '#CCFBF1|#0D9488|#E1F5EE|#0F6E56' frontend/src | wc -l`
  dà 11 sul clone patchato.
- Manca dall'elenco `MegamodelView.scss:467`, la terza occorrenza in quel file.
- L'elenco chiama in causa `tab-title.scss` ed `EditorSwitch.scss` senza dire che le loro regole non
  hanno produttore.
- La classificazione richiesta dalla voce («prima si classifica uso per uso») è questo documento e
  va referenziata invece di rifarla.
