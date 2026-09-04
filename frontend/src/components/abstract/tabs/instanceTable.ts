/**
 * instanceTable — the collection table of the instance manager, as data.
 *
 * Turno 11a of the design handoff: «tabella = le righe del nodo in orizzontale
 * (colonne dai widget della precedenza — swatch, mono, toggle)». This module is
 * the "as data" half of that: it turns a `ClassShape` plus an `idlookup` into
 * columns and cells, each cell carrying the renderer the precedence chose. The
 * TSX that paints them decides nothing.
 *
 * ── The classification is NOT re-derived here ──────────────────────────────────
 *
 * `useFormWidgets.ts:9-15` records that its attribute / enum / reference /
 * composition classification is a COPY of `Info.value`'s, deliberate, and asks
 * that a third copy be extracted rather than written. This module is that
 * request obeyed: the classification comes in already made, from `ClassShape`
 * (`jjform/shape.ts`, produced by `shapeAdapter`), and the rendering comes from
 * `valueRenderer.detectValueRenderer`, which is pure and already owns the ladder.
 * Nothing between the two re-decides what a feature is.
 *
 * Pure: `idlookup` in, plain records out. The three modules it imports have zero
 * imports of their own (`irReadCtx`, `valueRenderer`, `rowViewAnnotations`), so
 * the whole chain stays loadable under the node test environment.
 */

import { findFeatureRaw, makeDrawReadCtx } from '../../editor-v2/viewpoint/ir/irReadCtx';
import { readRowViewAnnotations } from '../../editor-v2/nodes/rowViewAnnotations';
import type { TableSpec } from '../../editor-v2/viewpoint/ir/irTypes';
import { optionSlot } from '../../../jjform';
import {
    detectValueRenderer,
    type RendererDecision,
    type SlotShape,
} from '../../editor-v2/nodes/valueRenderer';
import type { AttrShape, ClassShape, IncomingRef, MetamodelShape, RefShape } from '../../../jjform';
import { multiplicity, tableFeatures } from '../../../jjform';

type Idlookup = Record<string, any>;

export interface TableColumn {
    key: string;
    /** What the header prints. The feature name; the metamodel's own word. */
    label: string;
    kind: 'attr' | 'ref';
    typeName: string;
    /** `0..1`, `1..*` — shown in the header tooltip, not as a second line. */
    multiplicity: string;
    required: boolean;
    derived: boolean;
    readOnly: boolean;
    many: boolean;
}

export interface TableCell {
    /** One line of text, whatever the renderer. A table cell is one line: the
     *  drawer (`IRForm`) is where a value gets room. */
    text: string;
    decision: RendererDecision;
    /** How many values the slot holds. `> 1` is what the `collection` renderer
     *  reports, and the count is kept separately so the cell can print `+2`
     *  beside the first value rather than only a bare count. */
    count: number;
    broken: boolean;
    /** A REQUIRED feature holding no value at all. Not the same fact as `broken`,
     *  which is a pointer that does not resolve: this is the other half of what
     *  contract section 2 calls a broken ref ("missing id or empty"), and it is
     *  the state a dirty delete leaves behind. Measured 2026-08-30: the core's
     *  delete removes each incoming pointer BY VALUE, so the referrer is left with
     *  an empty slot, and without this flag the cell would print a dash - the
     *  silent emptiness ratified rule 2 of 12d forbids. */
    missingRequired: boolean;
    /**
     * Colour slot of this value among the LITERALS of its own enumeration, 1-based, or
     * absent when the feature is not an enumeration (or the value is not one of its
     * literals — an imported model can hold one that was later removed).
     *
     * Alternatives, and only alternatives: `High` wears the same colour in every column
     * typed on the same enumeration, and a literal of a different enumeration may reuse
     * it, because the two are never a choice between each other. `jjform/optionColor.ts`
     * owns the assignment and the reason it cycles past the seventh.
     */
    slot?: number;
}

export interface TableRow {
    id: string;
    name: string;
    cells: Record<string, TableCell>;
    /** Non-containment incoming pointers only — an owner is not a referrer.
     *  This is the delete preflight of 12d, computed here so the column and the
     *  future dialogue read one number. */
    referencedBy: IncomingRef[];
    /** Everything the search matches against, lowercased once per row rather
     *  than per keystroke. */
    haystack: string;
}

/** Columns of a metaclass: attributes then references, children excluded.
 *  A containment list is not a column — it is a sub-form (Turno 10a). */
export function tableColumns(cls: ClassShape): TableColumn[] {
    return tableFeatures(cls).map((f: AttrShape | RefShape) => ({
        key: f.key,
        label: f.key,
        kind: ('of' in f ? 'ref' : 'attr') as 'attr' | 'ref',
        typeName: 'of' in f ? f.of : f.typeName,
        multiplicity: multiplicity(f),
        required: f.required,
        derived: f.derived,
        readOnly: f.readOnly,
        many: f.many,
    }));
}

/**
 * Le colonne riordinate secondo la view della metaclasse (R-VP-3, R-VP-10).
 *
 * ORDINA, NON FILTRA. Le citate in `spec.columns` vengono in testa, nell'ordine dato; le
 * altre seguono nell'ordine di ingresso, e restano tutte nell'array. Chi toglie una
 * colonna e' la riduzione automatica (`emptyColumnKeys`, `duplicateNameColumnKeys`) con
 * sopra la scelta di sessione (`shownColumnsWith`), e deve restare l'unico canale: un
 * secondo posto in cui una colonna puo' sparire e' esattamente cio' che il commento di
 * `InstanceManagerTab` su `hiddenColumnKeys` esiste per rifiutare.
 *
 * Una PERMUTAZIONE, quindi: stesso insieme, ordine diverso. E' la ragione per cui questa
 * funzione puo' stare PRIMA della riduzione senza cambiarne l'esito — `emptyColumnKeys` e
 * `duplicateNameColumnKeys` misurano le righe, non le posizioni.
 *
 * Un nome che non corrisponde a nessuna colonna e' ignorato: una view resta salvata per
 * sempre e la metaclasse puo' perdere una feature dopo che la view e' stata scritta. Il
 * `console.warn` sta nel chiamante, non qui: questo modulo e' puro e girerebbe a ogni
 * render. Un nome ripetuto in `spec.columns` conta la prima volta, come per un `Set`.
 *
 * `spec` assente, `columns` assente o vuoto: l'input, per identita' di riferimento.
 */
export function orderColumns(columns: TableColumn[], spec?: TableSpec | null): TableColumn[] {
    const wanted = spec?.columns;
    if (!wanted || wanted.length === 0) return columns;
    const byKey = new Map(columns.map(col => [col.key, col]));
    const lead: TableColumn[] = [];
    const taken = new Set<string>();
    for (const key of wanted) {
        const col = byKey.get(key);
        if (!col || taken.has(key)) continue;
        taken.add(key);
        lead.push(col);
    }
    if (lead.length === 0) return columns;
    return [...lead, ...columns.filter(col => !taken.has(col.key))];
}

/** Display text of one raw slot value, for a table cell.
 *  A reference resolves to the target's NAME; an enum literal to its own name;
 *  anything else prints as it is stored. Returns null for a pointer that does
 *  not resolve — the caller turns that into brokenness, which is a different
 *  fact from an empty value. */
function displayValue(
    idlookup: Idlookup,
    raw: unknown,
    feature: AttrShape | RefShape,
    shape: MetamodelShape,
): string | null {
    if (raw == null || raw === '') return '';
    if ('of' in feature) {
        const target = idlookup[String(raw)];
        if (!target) return null;                      // dangling pointer
        return String(target.name ?? target.initialName ?? '');
    }
    if (feature.type === 'enum' && feature.enum) {
        const literals = shape.enums[feature.enum]?.literals ?? [];
        const byId = literals.find(l => l.id === raw);
        if (byId) return byId.name;
        // The XMI importer writes the literal NAME where the editors write its
        // pointer (`useFormWidgets.normalizeEnumValues` reconciles the same two
        // writers). A name that matches a literal passes through as itself; one
        // that matches nothing passes through too — it may be a literal removed
        // from the enum, which is a conformance problem to report, not one to
        // silently rewrite.
        return String(raw);
    }
    return String(raw);
}

/** The `SlotShape` `valueRenderer` reads, built for one (instance, feature).
 *  Exported for the tests, which drive it on plain dictionaries. */
export function slotShapeFor(
    idlookup: Idlookup,
    instanceId: string,
    feature: AttrShape | RefShape,
    shape: MetamodelShape,
): { slot: SlotShape; count: number; broken: boolean } {
    const dValue = findFeatureRaw(idlookup, instanceId, feature.key);
    const rawValues: unknown[] = Array.isArray(dValue?.values) ? dValue.values : [];
    // Holes are values that were cleared in place (`formWrite.clearSlotValue`
    // leaves one rather than shortening the array), and they are not values.
    const filled = rawValues.filter(v => v != null && String(v).trim() !== '');

    const texts: string[] = [];
    let broken = false;
    for (const raw of filled) {
        const t = displayValue(idlookup, raw, feature, shape);
        if (t === null) broken = true;
        else texts.push(t);
    }

    const isRef = 'of' in feature;
    const ann = readRowViewAnnotations(idlookup, feature.id);
    const enumLiteralNames = !isRef && feature.type === 'enum' && feature.enum
        ? (shape.enums[feature.enum]?.literals ?? []).map(l => l.name)
        : undefined;

    const slot: SlotShape = {
        value: texts[0] ?? '',
        values: texts,
        isReference: isRef,
        isMany: feature.many,
        typeName: isRef ? feature.of : feature.typeName,
        enumLiteralNames,
        featureName: feature.key,
        rendererOverride: ann.renderer ?? undefined,
        unit: ann.unit ?? undefined,
        min: ann.min ?? undefined,
        max: ann.max ?? undefined,
        // Brokenness is per SLOT, not per value: one dangling pointer among three
        // still makes the cell say so, because the row's job is to flag that the
        // model needs attention, not to hide it behind two good values.
        isBroken: broken,
        // `lower >= 1`, and not derived: a derived feature is computed rather than
        // held, so an empty one is not a model the user has to repair and flagging
        // it would put a warning on every row of a metamodel that declares one.
        //
        // Handed to the ladder rather than decided here: since R-FORM-15 the
        // `missingRequired` verdict is the ENGINE's, so this table and the canvas
        // node cannot classify the same empty slot differently.
        required: feature.required && !feature.derived,
    };
    return { slot, count: filled.length, broken };
}

/**
 * One row: every cell of one instance, plus what points at it.
 *
 * `referencedByAll` is passed in rather than computed, because the walk needs the
 * impure adapter (`shapeAdapter.referencedBy`) and this module is pure. Callers
 * that do not care pass `[]`.
 */
export function tableRow(
    idlookup: Idlookup,
    instanceId: string,
    cls: ClassShape,
    shape: MetamodelShape,
    referencedByAll: IncomingRef[] = [],
): TableRow {
    const ctx = makeDrawReadCtx(idlookup);
    const name = ctx.getName(instanceId) ?? '';
    const cells: Record<string, TableCell> = {};
    const bits: string[] = [name];

    for (const feature of tableFeatures(cls)) {
        const { slot, count, broken } = slotShapeFor(idlookup, instanceId, feature, shape);
        const decision = detectValueRenderer(slot);
        const text = slot.values?.join(', ') ?? '';
        cells[feature.key] = {
            text, decision, count, broken,
            // Read off the decision, not recomputed: the ladder already answered,
            // and a second copy of the rule here is exactly the divergence
            // R-FORM-15 exists to close. Kept as a field because the cell reads it
            // as a state, the way `broken` is read.
            missingRequired: decision.kind === 'missingRequired',
            // The colour of the alternative, for a chip that shows ONE literal. A
            // multivalued enum prints a join (`A, B`) and colouring that by its first
            // literal would say something false about the rest, so it keeps the neutral
            // chip. `optionSlot` answers `null` for a value that is not among the
            // literals — an imported model can hold one that was later removed — and a
            // value with no slot wears the chip the table drew before there were slots.
            slot: slot.values?.length === 1
                ? optionSlot([{ options: (slot.enumLiteralNames ?? []).map(value => ({ value })) }],
                             slot.values[0]) ?? undefined
                : undefined,
        };
        if (text) bits.push(text);
    }

    return {
        id: instanceId,
        name,
        cells,
        // An owner is not a referrer: counting containment here would put a 1 on
        // every contained instance in the model and make the column meaningless.
        referencedBy: referencedByAll.filter(r => !r.composition),
        haystack: bits.join('  ').toLowerCase(),
    };
}

/**
 * Filter rows by a free-text query.
 *
 * Matches the instance NAME and every string a cell prints — which is what
 * «Search…» in Turno 11a offers over a collection. Multi-word queries are ANDed
 * across the row, not matched as a phrase: typing two words the user saw in two
 * different columns should find the row.
 */
export function filterRows(rows: TableRow[], query: string): TableRow[] {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return rows;
    return rows.filter(r => terms.every(t => r.haystack.includes(t)));
}

// ─────────────────────────────────────────────────────────────────────────────
// 10c — la testata, il footer e le due riduzioni della tabella.
//
// Tutto quel che segue e' PURO, e sta qui e non nel TSX per una ragione misurata:
// `InstanceManagerTab.tsx` non e' importabile sotto l'ambiente `node` di vitest
// (arriva a monaco per il barrel di `editor-v2/`, e muore all'import prima del
// primo `it`, cfr. il docstring di `__tests__/instanceManagerFl6.test.ts`). Una
// regola scritta dentro il componente e' una regola che nessun test puo' eseguire:
// resterebbe provata solo per lettura del sorgente, che e' esattamente cio' che
// CLAUDE.md §5 vieta di chiamare verifica.
// ─────────────────────────────────────────────────────────────────────────────

/** Soglia della paginazione. Sotto questo numero di righe la paginazione non
 *  appare affatto — non «appare disabilitata»: un controllo inerte su una tabella
 *  di sei righe e' arredamento. */
export const PAGE_SIZE = 50;

/**
 * Filtro sul NOME, che non e' `filterRows`.
 *
 * `filterRows` cerca nell'intera riga (`haystack`), ed e' la «Search…» di 11a.
 * La board chiede «Filter by name…», che e' un'altra promessa: chi la legge si
 * aspetta che digitare `on` non gli restituisca ogni istanza che ha `on` in un
 * attributo qualunque. Due segnaposti diversi vogliono due predicati diversi.
 *
 * I termini sono in AND, come in `filterRows`: la differenza e' il CAMPO su cui
 * cercano, non il modo di comporre.
 */
export function filterRowsByName(rows: TableRow[], query: string): TableRow[] {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return rows;
    return rows.filter(r => {
        const name = r.name.toLowerCase();
        return terms.every(t => name.includes(t));
    });
}

/** L'enum discriminante di una metaclasse, se ne ha uno. */
export interface Discriminant {
    /** Nome della feature — la chiave della cella su cui il segmented filtra. */
    key: string;
    /** Nome dell'enumerazione, per il tooltip. */
    enumName: string;
    /** I literal, NELL'ORDINE DELLA SHAPE. Nomi, non pointer: e' cio' che la
     *  cella stampa (`displayValue` risolve il pointer al nome del literal), e
     *  quindi cio' contro cui il segmented puo' confrontare senza una seconda
     *  risoluzione. */
    literals: string[];
}

/**
 * L'enum discriminante: il PRIMO attributo a valore singolo di tipo `enum` con
 * almeno due literal, nell'ordine in cui la shape li elenca.
 *
 * Letto dalla shape, mai cablato: il prompt di 10c nomina `All | normal | initial
 * | final` per `State` come ESEMPIO, e cablare quei quattro literal avrebbe reso
 * la barra muta su ogni altro metamodello.
 *
 * Perche' «a valore singolo»: un enum `many` puo' avere piu' literal per riga, e
 * un segmented a scelta unica su un valore multiplo e' una domanda a cui la riga
 * risponde piu' volte. Perche' «almeno due»: un enum di un literal partiziona
 * niente, e la barra direbbe `All | x` con le due voci sempre uguali.
 *
 * Restituisce `null` quando non ce n'e' — e allora il segmented non si rende.
 */
export function discriminantEnum(cls: ClassShape, shape: MetamodelShape): Discriminant | null {
    for (const a of cls.attrs) {
        if (a.type !== 'enum' || a.many || !a.enum) continue;
        const literals = (shape.enums[a.enum]?.literals ?? []).map(l => l.name);
        if (literals.length < 2) continue;
        return { key: a.key, enumName: a.enum, literals };
    }
    return null;
}

/**
 * Il segmented, applicato. `literal === ''` e' «All» e non filtra.
 *
 * Confronta sul TESTO della cella, che e' gia' il nome del literal: la
 * risoluzione pointer -> nome l'ha fatta `displayValue` una volta sola, in
 * `tableRow`. Rifarla qui sarebbe la seconda lettura della stessa convenzione,
 * e le due divergerebbero il giorno in cui l'importatore XMI ne scrive una terza.
 */
export function filterBySegment(rows: TableRow[], key: string, literal: string): TableRow[] {
    if (!literal) return rows;
    return rows.filter(r => r.cells[key]?.text === literal);
}

/**
 * Le colonne interamente vuote: quelle in cui NESSUNA riga tiene un valore.
 *
 * «Vuota» e' `count === 0` e nient'altro. Una cella `broken` non e' vuota — tiene
 * un puntatore che non risolve, che e' un problema da vedere, non un'assenza da
 * nascondere; e una `missingRequired` e' l'assenza che il modello DEVE mostrare
 * (regola 2 ratificata di 12d). Nascondere la colonna che le contiene sarebbe
 * ripristinare per via di layout il silenzio che quella regola vieta.
 *
 * Misurate su TUTTE le righe della metaclasse, mai sulle filtrate: se dipendessero
 * dal filtro, le colonne apparirebbero e sparirebbero a ogni battuta, e la tabella
 * cambierebbe forma mentre la si legge.
 */
export function emptyColumnKeys(rows: TableRow[], columns: TableColumn[]): string[] {
    if (rows.length === 0) return [];
    return columns
        .filter(col => rows.every(r => {
            const c = r.cells[col.key];
            return !!c && c.count === 0 && !c.broken && !c.missingRequired;
        }))
        .map(col => col.key);
}

/**
 * La colonna che RIPETE la colonna fissa dei nomi — 10k punto 4.
 *
 * `tableFeatures` restituisce ogni attributo, `name` compreso, e in un metamodello
 * che dichiara `name : EString` la tabella lo stampa DUE volte: la colonna fissa,
 * che nessuno puo' spegnere, e la feature accanto. Fino a 10i il doppione era un
 * difetto noto e dichiarato fuori perimetro (vedi il commento di `columnToggles`);
 * qui si chiude, e si chiude PER COINCIDENZA e non per nome — la colonna sparisce
 * quando dice davvero la stessa cosa, e resta quando non la dice.
 *
 * La coincidenza e' verificata su OGNI riga, come `emptyColumnKeys` verifica la
 * vuotezza, e per la stessa ragione: una riduzione che dipendesse da qualche riga
 * cambierebbe forma al variare del filtro. Basta una riga in cui i due valori
 * divergono — uno slot `name` mai scritto, un rename applicato a meta' — e la
 * colonna resta, perche' li' porta un'informazione che la fissa non ha.
 *
 * `count === 1` e' parte del confronto: uno slot multivalore che PER CASO ha come
 * primo valore il nome non e' un doppione, e' una collezione.
 *
 * Il canale e' quello di `emptyColumnKeys` — le chiavi finiscono in `hiddenKeys`
 * insieme alle vuote — perche' il gesto che le governa dev'essere lo stesso:
 * l'override del pannello Columns vince su entrambe le riduzioni, e
 * `autoHiddenColumnKeys` conta entrambe finche' l'utente non si esprime. Due
 * canali avrebbero voluto dire due posti in cui una colonna puo' essere nascosta.
 */
export function duplicateNameColumnKeys(rows: TableRow[], columns: TableColumn[]): string[] {
    if (rows.length === 0) return [];
    if (!columns.some(col => col.key === NAME_COLUMN_KEY)) return [];
    const same = rows.every(r => {
        const c = r.cells[NAME_COLUMN_KEY];
        return !!c && c.count === 1 && !c.broken && !c.missingRequired && c.text === r.name;
    });
    return same ? [NAME_COLUMN_KEY] : [];
}

/** Le colonne che restano, nell'ordine originale. */
export function visibleColumns(columns: TableColumn[], hiddenKeys: string[]): TableColumn[] {
    if (hiddenKeys.length === 0) return columns;
    const hidden = new Set(hiddenKeys);
    return columns.filter(col => !hidden.has(col.key));
}

/* ── 10i: la scelta esplicita sopra la riduzione automatica ────────────────────
 *
 * `emptyColumnKeys` decide da se', e fino a 10i quella decisione era definitiva:
 * una colonna vuota spariva e non c'era gesto per riaverla. Le tre funzioni qui
 * sotto aggiungono UNO strato, non un secondo meccanismo — la riduzione resta
 * quella, e l'override dice soltanto quando NON vale.
 *
 * L'assenza di una chiave e' l'assenza di scelta, e non `true`: se «nessuna
 * scelta» valesse «visibile», il primo render di una metaclasse con colonne
 * vuote le mostrerebbe tutte e la riduzione automatica sarebbe morta. E' per
 * questo che il tipo e' un record parziale e non un `Set` di chiavi accese.
 */

/** La scelta esplicita dell'utente, per chiave di colonna: `true` visibile,
 *  `false` nascosta, chiave assente = nessuna scelta (vale l'automatico). */
export type ColumnOverrides = Record<string, boolean>;

/** La chiave della colonna `name`, che non e' una feature del metamodello e non
 *  compare in `tableColumns`: la tabella la stampa a parte, e il pannello la
 *  offre come voce bloccata perche' una riga senza il proprio nome non e' una
 *  vista ridotta, e' una tabella illeggibile. */
export const NAME_COLUMN_KEY = 'name';

/** Visibile o no, per una chiave sola. L'override, quando c'e', VINCE. */
export function isColumnVisible(
    key: string,
    hiddenKeys: string[],
    overrides: ColumnOverrides,
): boolean {
    const choice = overrides[key];
    if (choice !== undefined) return choice;
    return !hiddenKeys.includes(key);
}

/** Le colonne che la tabella stampa, nell'ordine originale, con gli override
 *  applicati sopra la riduzione automatica. */
export function shownColumnsWith(
    columns: TableColumn[],
    hiddenKeys: string[],
    overrides: ColumnOverrides,
): TableColumn[] {
    return columns.filter(col => isColumnVisible(col.key, hiddenKeys, overrides));
}

/**
 * Le colonne che l'INDICATORE conta: le vuote su cui l'utente non si e' ancora
 * espresso.
 *
 * Una vuota che l'utente ha spuntato e' sullo schermo, e contarla direbbe
 * «nascosta» di una colonna visibile. Una vuota che ha tolto di suo e' una sua
 * scelta, non una riduzione fatta dalla tabella: l'indicatore dichiara cio' che
 * la tabella ha deciso DA SE', ed e' quello il suo unico mestiere.
 */
export function autoHiddenColumnKeys(
    hiddenKeys: string[],
    overrides: ColumnOverrides,
): string[] {
    return hiddenKeys.filter(key => overrides[key] === undefined);
}

/** Una voce del pannello Columns. */
export interface ColumnToggle {
    key: string;
    label: string;
    /** Spuntata = la colonna e' sullo schermo. */
    checked: boolean;
    /** Vuota su ogni istanza: e' la nota «empty» accanto all'etichetta. Resta
     *  vera anche quando l'utente l'ha forzata visibile — il fatto sul modello
     *  non cambia perche' la si guarda. */
    empty: boolean;
    /** Ripete la colonna fissa dei nomi su ogni istanza (10k punto 4). Opzionale
     *  perche' l'interfaccia e' esportata e le proprieta' si aggiungono, non si
     *  cambiano (Regola 11); assente vale `false`. Distinta da `empty` perche'
     *  sono due ragioni diverse per la stessa riduzione, e la nota accanto
     *  all'etichetta deve dire QUALE delle due. */
    duplicate?: boolean;
    /** Non disattivabile (`name`). */
    locked: boolean;
}

/**
 * Le voci del pannello, `name` in testa e poi le colonne nell'ordine della
 * tabella. Una lista sola: la spunta E' la visibilita', e non c'e' un secondo
 * posto in cui la stessa cosa puo' essere vera.
 */
export function columnToggles(
    columns: TableColumn[],
    hiddenKeys: string[],
    overrides: ColumnOverrides,
    duplicateKeys: string[] = [],
): ColumnToggle[] {
    const hidden = new Set(hiddenKeys);
    // Le doppione sono un SOTTOINSIEME delle nascoste, non un secondo elenco: il
    // chiamante le ha gia' unite in `hiddenKeys`. Qui servono solo a dire quale
    // delle due ragioni vale, per la nota accanto all'etichetta.
    const dup = new Set(duplicateKeys);
    /* La voce bloccata rappresenta la colonna FISSA dei nomi, quella che la
     * tabella stampa fuori da `shownColumns` e che nessuno puo' spegnere: e'
     * li' per dire che c'e', non per offrire un gesto.
     *
     * Ma `tableFeatures` restituisce ogni attributo, `name` compreso, e in un
     * metamodello che dichiara `name : EString` la tabella lo stampa DUE volte
     * — la fissa e la feature. Quel doppione era un difetto noto e fuori dal
     * perimetro di 10i; lo chiude 10k con `duplicateNameColumnKeys`, che porta
     * la chiave nello stesso `hiddenKeys` delle vuote. Qui la voce sintetica si
     * tira indietro quando la feature c'e', per non aggiungere al pannello una
     * seconda riga che dice «name»: quella che resta governa il doppione — ed e'
     * il gesto con cui lo si rimette a schermo — e la colonna fissa, che e' cio'
     * che «name non disattivabile» protegge, resta comunque, perche' non passa
     * da `shownColumns`. */
    const declared = columns.some(col => col.key === NAME_COLUMN_KEY);
    const synthetic: ColumnToggle[] = declared ? [] : [
        { key: NAME_COLUMN_KEY, label: NAME_COLUMN_KEY, checked: true, empty: false, locked: true },
    ];
    return [
        ...synthetic,
        ...columns.map(col => ({
            key: col.key,
            label: col.label,
            checked: isColumnVisible(col.key, hiddenKeys, overrides),
            // `empty` resta cio' che era: vuota su ogni istanza. Una doppione non
            // e' vuota — dire «empty» di una colonna piena di valori sarebbe la
            // nota che mente al posto della colonna che spariva in silenzio.
            empty: hidden.has(col.key) && !dup.has(col.key),
            duplicate: dup.has(col.key),
            locked: false,
        })),
    ];
}

/** Quante pagine servono. Almeno una, anche a zero righe: «pagina 1 di 0» non e'
 *  una posizione. */
export function pageCount(total: number, size: number = PAGE_SIZE): number {
    return Math.max(1, Math.ceil(total / Math.max(1, size)));
}

/** La finestra di una pagina. `page` e' 1-based, e viene pinzata: una pagina 7 su
 *  una tabella che ne ha 3 restituisce la 3, non un vuoto. */
export function pageOf(rows: TableRow[], page: number, size: number = PAGE_SIZE): TableRow[] {
    if (rows.length <= size) return rows;
    const last = pageCount(rows.length, size);
    const p = Math.min(Math.max(1, Math.floor(page)), last);
    return rows.slice((p - 1) * size, p * size);
}

/** Un campo CSV, con le virgolette raddoppiate secondo RFC 4180. */
function csvField(raw: string): string {
    const s = raw ?? '';
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Export CSV delle righe DATE — cioe' delle righe filtrate, perche' e' quello che
 * il chiamante passa. Un export che riesportasse la collezione intera mentre lo
 * schermo ne mostra sei sarebbe un bottone che fa un'altra cosa da quella che
 * l'utente ha appena composto.
 *
 * Le colonne sono quelle DATE, cioe' anche qui quelle visibili: una colonna
 * nascosta perche' vuota esporterebbe una colonna di stringhe vuote.
 *
 * Il testo e' quello che la cella stampa, non lo stato grezzo: un CSV di pointer
 * non lo apre nessuno.
 */
export function toCsv(columns: TableColumn[], rows: TableRow[]): string {
    const head = ['name', ...columns.map(c => c.key)].map(csvField).join(',');
    const body = rows.map(r =>
        [r.name, ...columns.map(c => r.cells[c.key]?.text ?? '')].map(csvField).join(','));
    return [head, ...body].join('\r\n');
}

/**
 * La metaclasse piu' popolata, per la preselezione allo stato di riposo.
 *
 * A parita' di conteggio vince la PRIMA nell'ordine dato — che nel tab e' l'ordine
 * alfabetico del rail, quindi la scelta e' stabile fra un render e l'altro invece
 * di dipendere dall'ordine in cui la `idlookup` e' stata percorsa.
 *
 * Le metaclassi a zero istanze non vincono mai: se nessuna ne ha, il ritorno e'
 * `null` e il chiamante rende l'unico empty state («modello vuoto») invece di
 * preselezionare una collezione vuota e mostrarne un secondo.
 */
export function mostPopulatedClassId(
    classes: Array<{ id: string }>,
    counts: Record<string, number>,
): string | null {
    let bestId: string | null = null;
    let best = 0;
    for (const cls of classes) {
        const n = counts[cls.id] ?? 0;
        if (n > best) { best = n; bestId = cls.id; }
    }
    return bestId;
}
