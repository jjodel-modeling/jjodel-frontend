/**
 * 10c — la parita' del manager con la board.
 *
 * Due meta', e la divisione non e' di comodo.
 *
 * La PRIMA meta' e' vera unita': `instanceTable.ts` e' puro e importabile sotto
 * l'ambiente `node` di vitest, quindi il filtro sul nome, il segmented, le
 * colonne vuote, il CSV, la paginazione e la preselezione si ESEGUONO su input
 * reali e si confrontano con l'uscita. Il criterio di §5 («un sort si valida
 * eseguendolo, non leggendo il comparatore») vale per tutte e sei.
 *
 * La SECONDA meta' e' asserzione sul SORGENTE, e lo e' per necessita' misurata:
 * `InstanceManagerTab.tsx` importa il barrel di `editor-v2/`, che arriva a
 * monaco, che dereferenzia `window` all'import — il file muore prima del primo
 * `it` (cfr. il docstring di `instanceManagerFl6.test.ts`, e vitest.config.ts
 * dichiara `environment: 'node'`). Cio' che si prova li' e' cio' che il sorgente
 * AFFERMA: che il badge c'e', che i due cartelli in cascata non ci sono piu',
 * che il New emette lo stesso evento della create outline.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e
 * una lettura che non e' avvenuta danno lo stesso silenzio.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    PAGE_SIZE,
    discriminantEnum,
    emptyColumnKeys,
    filterBySegment,
    filterRowsByName,
    filterRows,
    mostPopulatedClassId,
    pageCount,
    pageOf,
    toCsv,
    visibleColumns,
    type TableCell,
    type TableColumn,
    type TableRow,
} from '../instanceTable';
import type { ClassShape, MetamodelShape } from '../../../../jjform';

const TSX = readFileSync(resolve(__dirname, '../InstanceManagerTab.tsx'), 'utf8');
const SCSS = readFileSync(resolve(__dirname, '../instanceManagerTab.scss'), 'utf8');

/**
 * Il sorgente SENZA i commenti.
 *
 * Misurato scrivendo questi test: quattro asserzioni di ASSENZA sono passate al
 * rosso su prosa, non su codice — «Pick a metaclass to list its instances»,
 * «Unsaved changes» e «Discard» comparivano nei commenti che spiegano perche'
 * sono stati tolti, e `expandedId` nel commento di FL6 che spiega perche' non
 * esiste. Un'asserzione «X non c'e' piu'» che legge anche i commenti non puo'
 * distinguere «X e' stato rimosso e documentato» da «X e' ancora li'»: e' la
 * versione di §5 per il testo, dove ad avere segnale sbagliato non e' il
 * silenzio ma il rumore.
 *
 * Le asserzioni POSITIVE restano su `TSX`: li' il rumore non falsifica, e
 * leggere il file intero e' la lettura piu' onesta.
 */
const CODE = TSX
    .replace(/\/\*[\s\S]*?\*\//g, '')          // blocchi, JSX `{/* */}` inclusi
    .replace(/^\s*\/\/.*$/gm, '');              // righe di commento

// ── Costruttori di fixture ───────────────────────────────────────────────────

function cell(text: string, over: Partial<TableCell> = {}): TableCell {
    return {
        text,
        decision: { kind: text ? 'text' : 'dash', reason: 'fixture' } as any,
        count: text ? 1 : 0,
        broken: false,
        missingRequired: false,
        ...over,
    };
}

function row(id: string, name: string, cells: Record<string, TableCell>): TableRow {
    return {
        id,
        name,
        cells,
        referencedBy: [],
        haystack: [name, ...Object.values(cells).map(c => c.text)].join('  ').toLowerCase(),
    };
}

function col(key: string, over: Partial<TableColumn> = {}): TableColumn {
    return {
        key,
        label: key,
        kind: 'attr',
        typeName: 'EString',
        multiplicity: '0..1',
        required: false,
        derived: false,
        readOnly: false,
        many: false,
        ...over,
    };
}

/** Tre stati, come la fixture Heater: `kind` e' l'enum discriminante, `note` e'
 *  vuota su tutte e tre — la colonna che la tabella deve nascondere. */
const ROWS: TableRow[] = [
    row('s1', 'Off',     { kind: cell('initial'), note: cell(''), power: cell('0') }),
    row('s2', 'Heating', { kind: cell('normal'),  note: cell(''), power: cell('900') }),
    row('s3', 'Failed',  { kind: cell('final'),   note: cell(''), power: cell('0') }),
];
const COLS = [col('kind'), col('note'), col('power')];

const SHAPE: MetamodelShape = {
    enums: {
        StateKind: {
            id: 'e1', name: 'StateKind',
            literals: [
                { id: 'l1', name: 'normal' },
                { id: 'l2', name: 'initial' },
                { id: 'l3', name: 'final' },
            ],
        },
        Solo: { id: 'e2', name: 'Solo', literals: [{ id: 'l9', name: 'only' }] },
    },
    classes: {},
} as MetamodelShape;

function attr(key: string, over: any = {}) {
    return {
        key, id: 'a-' + key, lower: 0, upper: 1, many: false, required: false,
        derived: false, readOnly: false, type: 'string', typeName: 'EString', ...over,
    };
}

function cls(attrs: any[]): ClassShape {
    return {
        key: 'State', id: 'c1', root: false, abstract: false, singleton: false,
        containedIn: ['StateMachine'], attrs, refs: [], children: [],
    } as ClassShape;
}

// ─────────────────────────────────────────────────────────────────────────────
// Meta' eseguita
// ─────────────────────────────────────────────────────────────────────────────

describe('10c — il filtro sul NOME non e\' la ricerca su tutta la riga', () => {
    it('positivo di controllo: la fixture ha tre righe e la ricerca larga le trova', () => {
        expect(ROWS).toHaveLength(3);
        expect(filterRows(ROWS, 'initial')).toHaveLength(1);
    });

    it('«Filter by name…» cerca SOLO nel nome', () => {
        // `initial` sta in una cella, non in un nome: la ricerca larga la trova,
        // il filtro sul nome no. E' la differenza che il segnaposto promette.
        expect(filterRowsByName(ROWS, 'initial')).toHaveLength(0);
        expect(filterRowsByName(ROWS, 'off').map(r => r.id)).toEqual(['s1']);
    });

    it('e\' insensibile al caso, e una query vuota non filtra', () => {
        expect(filterRowsByName(ROWS, 'HEAT').map(r => r.id)).toEqual(['s2']);
        expect(filterRowsByName(ROWS, '   ')).toHaveLength(3);
    });

    it('i termini sono in AND sul nome', () => {
        expect(filterRowsByName([row('x', 'Cold Start', {})], 'cold start')).toHaveLength(1);
        expect(filterRowsByName([row('x', 'Cold Start', {})], 'cold stop')).toHaveLength(0);
    });
});

describe('10c — l\'enum discriminante si LEGGE dalla shape', () => {
    it('positivo di controllo: la shape ha l\'enum e ha tre literal', () => {
        expect(SHAPE.enums.StateKind.literals.map(l => l.name))
            .toEqual(['normal', 'initial', 'final']);
    });

    it('lo trova, e ne riporta i literal nell\'ordine della shape', () => {
        const d = discriminantEnum(cls([attr('power', { type: 'number' }), attr('kind', { type: 'enum', enum: 'StateKind' })]), SHAPE);
        expect(d).toEqual({ key: 'kind', enumName: 'StateKind', literals: ['normal', 'initial', 'final'] });
    });

    it('null quando non c\'e\' nessun enum', () => {
        expect(discriminantEnum(cls([attr('power', { type: 'number' })]), SHAPE)).toBeNull();
    });

    it('salta un enum MULTIPLO: un segmented a scelta unica su un valore multiplo e\' una domanda a cui la riga risponde piu\' volte', () => {
        expect(discriminantEnum(cls([attr('tags', { type: 'enum', enum: 'StateKind', many: true, upper: -1 })]), SHAPE)).toBeNull();
    });

    it('salta un enum di UN solo literal: non partiziona niente', () => {
        expect(discriminantEnum(cls([attr('only', { type: 'enum', enum: 'Solo' })]), SHAPE)).toBeNull();
    });

    it('vince il PRIMO nell\'ordine della shape, non uno a caso', () => {
        const d = discriminantEnum(cls([
            attr('only', { type: 'enum', enum: 'Solo' }),           // scartato: un literal
            attr('kind', { type: 'enum', enum: 'StateKind' }),      // questo
            attr('other', { type: 'enum', enum: 'StateKind' }),
        ]), SHAPE);
        expect(d?.key).toBe('kind');
    });
});

describe('10c — segmented e filtro nome COMPONGONO in AND', () => {
    it('positivo di controllo: senza filtri restano tre righe', () => {
        expect(filterBySegment(filterRowsByName(ROWS, ''), 'kind', '')).toHaveLength(3);
    });

    it('«All» e\' la stringa vuota e non filtra', () => {
        expect(filterBySegment(ROWS, 'kind', '')).toHaveLength(3);
    });

    it('un literal restringe alla sua partizione', () => {
        expect(filterBySegment(ROWS, 'kind', 'final').map(r => r.id)).toEqual(['s3']);
    });

    it('i due composti danno l\'INTERSEZIONE, non l\'unione', () => {
        // «Off» e' initial: nome+segmento concordi -> una riga.
        expect(filterBySegment(filterRowsByName(ROWS, 'off'), 'kind', 'initial').map(r => r.id))
            .toEqual(['s1']);
        // «Off» e' initial, non final: nome+segmento discordi -> zero.
        // Un OR ne avrebbe restituite due, ed e' il modo in cui questo test
        // distingue la composizione giusta da quella sbagliata.
        expect(filterBySegment(filterRowsByName(ROWS, 'off'), 'kind', 'final')).toHaveLength(0);
    });
});

describe('10c — le colonne interamente vuote', () => {
    it('positivo di controllo: la fixture ha tre colonne, una vuota', () => {
        expect(COLS.map(c => c.key)).toEqual(['kind', 'note', 'power']);
    });

    it('nasconde solo quella vuota su TUTTE le righe', () => {
        expect(emptyColumnKeys(ROWS, COLS)).toEqual(['note']);
        expect(visibleColumns(COLS, ['note']).map(c => c.key)).toEqual(['kind', 'power']);
    });

    it('una sola riga con un valore basta a tenere la colonna', () => {
        const rows = [...ROWS.slice(0, 2), row('s3', 'Failed', { kind: cell('final'), note: cell('x'), power: cell('0') })];
        expect(emptyColumnKeys(rows, COLS)).toEqual([]);
    });

    it('una cella BROKEN non e\' vuota: e\' un puntatore da vedere, non un\'assenza da nascondere', () => {
        const rows = ROWS.map((r, i) => i === 0
            ? row(r.id, r.name, { ...r.cells, note: cell('', { broken: true }) })
            : r);
        expect(emptyColumnKeys(rows, COLS)).toEqual([]);
    });

    it('una cella missingRequired non e\' vuota: nasconderla ripristinerebbe il silenzio che 12d vieta', () => {
        const rows = ROWS.map((r, i) => i === 0
            ? row(r.id, r.name, { ...r.cells, note: cell('', { missingRequired: true }) })
            : r);
        expect(emptyColumnKeys(rows, COLS)).toEqual([]);
    });

    it('su zero righe non nasconde NIENTE: una tabella vuota non e\' una tabella di colonne vuote', () => {
        expect(emptyColumnKeys([], COLS)).toEqual([]);
    });

    it('l\'indicatore riflette il conteggio reale', () => {
        expect(emptyColumnKeys(ROWS, COLS)).toHaveLength(1);
        expect(COLS.length - visibleColumns(COLS, emptyColumnKeys(ROWS, COLS)).length).toBe(1);
    });
});

describe('10c — l\'Export produce le righe FILTRATE', () => {
    it('positivo di controllo: il CSV ha una riga di testata piu\' una per istanza', () => {
        expect(toCsv(COLS, ROWS).split('\r\n')).toHaveLength(4);
    });

    it('la testata e\' `name` piu\' le colonne DATE', () => {
        expect(toCsv(visibleColumns(COLS, ['note']), ROWS).split('\r\n')[0]).toBe('name,kind,power');
    });

    it('esporta cio\' che i filtri hanno lasciato, non la collezione', () => {
        const filtered = filterBySegment(ROWS, 'kind', 'final');
        const lines = toCsv(COLS, filtered).split('\r\n');
        expect(lines).toHaveLength(2);
        expect(lines[1]).toBe('Failed,final,,0');
    });

    it('quota virgole, virgolette e a capo (RFC 4180)', () => {
        const r = row('x', 'a,b', { kind: cell('he said "hi"'), note: cell('one\ntwo'), power: cell('1') });
        const line = toCsv(COLS, [r]).split('\r\n')[1];
        expect(line).toBe('"a,b","he said ""hi""","one\ntwo",1');
    });
});

describe('10c — la paginazione', () => {
    const many = Array.from({ length: 120 }, (_, i) => row('r' + i, 'n' + i, {}));

    it('positivo di controllo: la soglia e\' 50 e la fixture la supera', () => {
        expect(PAGE_SIZE).toBe(50);
        expect(many).toHaveLength(120);
    });

    it('sotto soglia restituisce l\'array STESSO: e\' la condizione con cui il footer decide di non rendersi', () => {
        const few = many.slice(0, 50);
        expect(pageOf(few, 1)).toBe(few);
        expect(pageCount(50)).toBe(1);
    });

    it('sopra soglia taglia in pagine da 50, l\'ultima corta', () => {
        expect(pageCount(120)).toBe(3);
        expect(pageOf(many, 1).map(r => r.id)[0]).toBe('r0');
        expect(pageOf(many, 2).map(r => r.id)[0]).toBe('r50');
        expect(pageOf(many, 3)).toHaveLength(20);
    });

    it('pinza fuori intervallo invece di restituire il vuoto', () => {
        expect(pageOf(many, 99)).toHaveLength(20);   // l'ultima
        expect(pageOf(many, 0).map(r => r.id)[0]).toBe('r0');
    });

    it('almeno una pagina anche a zero righe: «pagina 1 di 0» non e\' una posizione', () => {
        expect(pageCount(0)).toBe(1);
    });
});

describe('10c — la preselezione', () => {
    const classes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];

    it('positivo di controllo: tre metaclassi', () => {
        expect(classes).toHaveLength(3);
    });

    it('vince la piu\' popolata', () => {
        expect(mostPopulatedClassId(classes, { A: 2, B: 9, C: 4 })).toBe('B');
    });

    it('a parita\' vince la PRIMA dell\'ordine dato, che nel tab e\' quello alfabetico del rail', () => {
        expect(mostPopulatedClassId(classes, { A: 5, B: 5, C: 5 })).toBe('A');
    });

    it('modello vuoto -> null, e il chiamante rende l\'UNICO empty state', () => {
        expect(mostPopulatedClassId(classes, { A: 0, B: 0, C: 0 })).toBeNull();
        expect(mostPopulatedClassId(classes, {})).toBeNull();
    });

    it('una metaclasse a zero non vince mai su una a zero: nessuna collezione vuota preselezionata', () => {
        expect(mostPopulatedClassId(classes, { C: 1 })).toBe('C');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Meta' asserita sul sorgente
// ─────────────────────────────────────────────────────────────────────────────

describe('10c — il rail', () => {
    it('positivo di controllo: il file letto e\' quello giusto', () => {
        expect(TSX).toContain('export function InstanceManagerTab');
        expect(SCSS).toContain('.instance-manager {');
    });

    it('la metaclasse ha il badge quadrato «C», col vocabolario del DS', () => {
        expect(TSX).toContain('instance-manager__glyph jj-type-badge--class');
        // La lettera viene dal registro delle entita', non da una costante locale.
        expect(TSX).toContain("const CLASS_LETTER = entityLetter('class');");
        expect(TSX).toContain('{CLASS_LETTER}');
    });

    it('il badge dichiara la sola GEOMETRIA: nessuna seconda palette', () => {
        const block = SCSS.slice(SCSS.indexOf('&__glyph {'), SCSS.indexOf('&__glyph {') + 400);
        expect(block).toContain('width: 18px');
        expect(block).toContain('height: 18px');
        // Ridichiarare background/color qui vincerebbe sulla coppia di token e
        // perderebbe il tema scuro senza nessun errore di compilazione.
        expect(block).not.toMatch(/\n\s*background:/);
        expect(block).not.toMatch(/\n\s*color:/);
    });

    it('la riga attiva e\' la campitura di selezione, e lo era gia\'', () => {
        expect(SCSS).toContain('background: var(--color-selection-bg)');
        expect(SCSS).toContain('background: var(--color-selection-bar)');
    });

    it('sotto le metaclassi c\'e\' la sezione VIEWS, con Outline e Canvas', () => {
        const views = TSX.indexOf('instance-manager__eyebrow--views');
        const list = TSX.indexOf('Metaclasses');
        expect(views).toBeGreaterThan(list);
        expect(TSX).toContain('bi bi-list-nested');
        expect(TSX).toContain('bi bi-diagram-3');
    });

    it('Outline apre e chiude il pannello di 10b, che smette di essere incondizionato', () => {
        expect(TSX).toContain('const [showOutline, setShowOutline] = useState(true);');
        expect(TSX).toContain('{showOutline && <OutlinePanel');
    });

    it('Canvas e\' l\'innesto esistente, non una seconda resa', () => {
        expect(TSX).toContain('openSubjectInCanvas()');
        expect(TSX).toContain('void openInCanvas(modelid, subjectId)');
    });

    it('nessuna vista Diagram: 13a/1b e\' rimandata', () => {
        expect(CODE.indexOf('instance-manager__eyebrow--views')).toBeGreaterThan(-1);
        expect(CODE.slice(CODE.indexOf('instance-manager__eyebrow--views'), CODE.indexOf('</aside>', CODE.indexOf('instance-manager__eyebrow--views')))).not.toContain('Diagram');
    });
});

describe('10c — la testata della tabella', () => {
    it('positivo di controllo: la sezione tabella esiste', () => {
        expect(TSX).toContain('instance-manager__pane--table');
    });

    it('titolo = nome metaclasse, 24px, sentence case', () => {
        expect(TSX).toContain('<h2 className="instance-manager__title">{selectedClass.name}</h2>');
        expect(SCSS).toMatch(/&__title\s*\{[^}]*font-size:\s*24px/);
        // Nessun text-transform: il nome e' quello che il metamodello scrive.
        expect(SCSS.slice(SCSS.indexOf('&__title {'), SCSS.indexOf('&__title {') + 260))
            .not.toContain('text-transform');
    });

    // 10d ha arbitrato il punto aperto del referto 10c: la provenienza cade,
    // resta il modello. L'AFFERMAZIONE e' la stessa — il sottotitolo porta il
    // nome del modello — e la copy e' nuova.
    it('sottotitolo col nome del modello', () => {
        expect(TSX).toContain('{modelName} · {rows.length} instance');
        expect(CODE).not.toContain("Created from the container's form");
    });

    it('il segnaposto e\' «Filter by name…», e il predicato e\' quello sul nome', () => {
        expect(TSX).toContain('placeholder="Filter by name…"');
        expect(TSX).toContain('filterRowsByName(rows, query)');
        // Il vecchio «Search…» non e' rimasto accanto.
        expect(CODE).not.toContain('placeholder="Search…"');
    });

    it('il segmented esce dalla shape: nessun literal cablato', () => {
        expect(TSX).toContain('discriminantEnum(classShape, shapeCtx.shape())');
        expect(TSX).toContain("{['', ...discriminant.literals].map(lit => (");
        for (const lit of ["'normal'", "'initial'", "'final'"]) {
            expect(CODE).not.toContain(`>${lit}<`);
        }
    });

    it('l\'indicatore delle colonne nascoste dice il conteggio reale', () => {
        // 10i ha spostato il conteggio da `hiddenColumnKeys` alle sole colonne
        // vuote NON-overridate: con il pannello Columns una vuota puo' essere
        // sullo schermo per scelta, e contarla direbbe «nascosta» di una
        // colonna che si vede. La misura di partenza resta la stessa, ed e'
        // quella che le due righe qui sotto continuano a fissare.
        expect(TSX).toContain('{autoHiddenKeys.length} empty column');
        expect(TSX).toContain('emptyColumnKeys(rows, columns)');
        // Misurate su TUTTE le righe, non sulle filtrate: altrimenti la tabella
        // cambierebbe forma a ogni battuta nel filtro.
        expect(CODE).not.toContain('emptyColumnKeys(visible');
    });

    it('la tabella rende le colonne SUPERSTITI', () => {
        // 10i: `visibleColumns` e' rimasta esportata e provata in
        // `instanceTable.test.ts`; il tab ci passa attraverso `shownColumnsWith`,
        // che e' la stessa riduzione con sopra la scelta esplicita.
        expect(TSX).toContain('shownColumnsWith(columns, hiddenColumnKeys, overrides)');
        expect(TSX).toContain('{shownColumns.map(col => (');
        expect(TSX).toContain('colSpan={shownColumns.length + 5}');
    });

    it('Export c\'e\', ed esporta le righe filtrate e le colonne visibili', () => {
        expect(TSX).toContain('toCsv(shownColumns, visible)');
        expect(TSX).toContain('a.download =');
    });

    it('«+ New» emette LO STESSO evento della create outline', () => {
        // Una sola forma di chiamata, condivisa: `openCreate(cls, owner, childKey)`.
        expect(TSX).toContain('onClick={() => openCreate(classShape.key, null, null)}');
        expect(TSX).toContain("openCreate(entry.cls, node.kind === 'model' ? null : node.id, entry.childKey);");
        // e un solo emettitore, che e' cio' che «stesso evento» significa
        expect(CODE.match(/setDraft\(newDraft\(/g) ?? []).toHaveLength(1);
    });
});

describe('10c — il footer', () => {
    it('positivo di controllo: il footer esiste', () => {
        expect(TSX).toContain('instance-manager__foot');
    });

    it('«N instances · M selected» a sinistra', () => {
        expect(TSX).toContain('{visible.length} instance');
        expect(TSX).toContain('{selectedIds.length} selected');
    });

    it('la paginazione a destra, e SOLO sopra soglia', () => {
        expect(TSX).toContain('{pages > 1 && (');
        expect(TSX).toContain('pageCount(visible.length, PAGE_SIZE)');
        expect(TSX).toContain('pageOf(visible, page, PAGE_SIZE)');
    });

    it('il footer non si comprime via sotto una tabella lunga', () => {
        expect(SCSS).toMatch(/&__foot\s*\{[^}]*flex-shrink:\s*0/);
    });
});

describe('10c — lo stato di riposo', () => {
    it('positivo di controllo: il componente ha i suoi effetti', () => {
        expect(TSX).toContain('useEffect(');
    });

    it('preselezione della metaclasse piu\' popolata al mount', () => {
        expect(TSX).toContain('const best = mostPopulatedClassId(classes, counts);');
        // Condizionata a «nessuna scelta ancora»: una volta scelto, resta la
        // scelta dell'utente, anche se e' una collezione vuota.
        expect(TSX).toContain('if (selectedClassId !== null) return;');
    });

    it('UN solo empty state, e il doppio cartello e\' sparito', () => {
        expect(CODE).not.toContain('Pick a metaclass to list its instances');
        expect(CODE).not.toContain('title="No instance selected"');
        expect(TSX).toContain('title="This model has no instances yet"');
        // 10j — due `EmptyState` nel SORGENTE, mai due a SCHERMO: sono i due
        // rami alternativi della stessa catena ternaria (prima la collezione
        // vuota, poi il modello vuoto). L'invariante di 10c e' «un cartello
        // solo, niente cascata», e il conteggio del sorgente ne era il
        // surrogato finche' il ramo era uno. Il surrogato nuovo e' l'ALTERNANZA,
        // che dice la stessa cosa e la dice di piu': due `<EmptyState>` in due
        // rami che si escludono non possono comparire insieme, mentre due
        // conteggiati a uno non escludevano nulla.
        expect(CODE.match(/<EmptyState/g) ?? []).toHaveLength(2);
        expect(CODE).toMatch(
            /\{collectionIsEmpty && selectedClass \? \([\s\S]*?<EmptyState[\s\S]*?\) : modelIsEmpty \|\| !selectedClass \? \([\s\S]*?<EmptyState[\s\S]*?\) : visible\.length === 0 \? \(/,
        );
    });

    it('senza selezione il pannello form COLLASSA a una barra', () => {
        expect(TSX).toContain('instance-manager__pane--form-collapsed');
        expect(TSX).toContain('Select an instance to edit it');
        // Il tetto del 55% di FL6 e' un tetto per una form aperta: su una barra
        // non ha niente da limitare.
        expect(SCSS).toMatch(/&__pane--form-collapsed\s*\{[^}]*max-height:\s*none/);
    });

    it('si riespande alla selezione: la classe segue `subjectId`', () => {
        expect(TSX).toContain("+ (isMulti || subjectId ? '' : ' instance-manager__pane--form-collapsed')");
    });
});

describe('10c — deviazione A3: niente Save/Discard/«Unsaved changes»', () => {
    it('positivo di controllo: la form e la sua testata ci sono', () => {
        expect(TSX).toContain('instance-manager__form-head');
        expect(TSX).toContain('<IRForm objectId={formSubjectId ?? subjectId} host="manager" />');
    });

    it('il badge «Unsaved changes» e\' andato via, e con lui l\'import del flag', () => {
        expect(CODE).not.toContain('Unsaved changes');
        expect(CODE).not.toContain("from '../../../common/libraries/projectModified'");
    });

    it('nessun Save, nessun Discard nella testata della form a UNA istanza', () => {
        // L'asserzione e' SCOPED, e la prima stesura non lo era: cercando
        // «Discard» su tutto il file trovava il bottone del multi-form (12b),
        // che e' un'altra cosa e resta. Li' un draft ESISTE davvero — le battute
        // stanno in `bulkTouched` finche' «Apply to N» non le scrive — quindi
        // annullarlo e' un'azione con un oggetto. A3 parla della form a una
        // istanza, che scrive diritto e non ha niente da annullare.
        const head = CODE.indexOf('instance-manager__form-head');
        const end = CODE.indexOf('</header>', head);
        expect(head).toBeGreaterThan(-1);
        expect(end).toBeGreaterThan(head);
        const region = CODE.slice(head, end);
        // positivo di controllo sulla FINESTRA, non solo sul file: la finestra
        // contiene qualcosa, altrimenti le due negative sotto sono vuote.
        expect(region).toContain('instance-manager__form-delete');
        expect(region).not.toMatch(/>\s*Save\s*</);
        expect(region).not.toMatch(/>\s*Discard\s*</);
        expect(region).not.toContain('Unsaved changes');
    });
});

describe('10c — zero regressioni sulle superfici FL6 / 10b / FL7', () => {
    it('positivo di controllo: le tre superfici sono nel file', () => {
        expect(TSX).toContain('<OutlinePanel');
        expect(TSX).toContain('<EgoDiagram');
    });

    it('FL6: la form resta SOTTO la tabella, dentro __main', () => {
        const main = TSX.indexOf('className="instance-manager__main"');
        const table = TSX.indexOf('instance-manager__pane--table');
        const form = TSX.indexOf('instance-manager__pane--form');
        expect(table).toBeGreaterThan(main);
        expect(form).toBeGreaterThan(table);
    });

    it('FL6: la riga espandibile segue ancora la selezione, e non e\' un secondo stato', () => {
        expect(TSX).toContain('const isExpanded = row.id === subjectId;');
        expect(CODE).not.toContain('expandedId');
    });

    it('10b: la selezione e\' condivisa — tre emettitori, stesso soggetto', () => {
        for (const fn of ['const selectOnly =', 'const selectFromOutline =', 'const selectFromEgo =']) {
            expect(TSX).toContain(fn);
        }
    });

    it('FL7: l\'ego-diagramma e\' montato con le sue prop, invariato', () => {
        expect(TSX).toContain('ego={ego}');
        expect(TSX).toContain('hostWidth={hostWidth}');
        expect(TSX).toContain('onOpenInCanvas={openSubjectInCanvas}');
    });
});
