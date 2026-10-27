/**
 * The figures of the Run summary (R-JS-6).
 *
 * Read from the model before and after a run, never from the commands, so a delete, a copy or
 * a command that failed counts for what it did. The accessors are the ones the status bar
 * reads for `7 classes · 3 attributes · 7 references` (`components/StatusBar.tsx`: `classes`,
 * `enumerators`, and per class `attributes`, `operations`, `references`), plus `literals` per
 * enum, `abstract` per class and `packages` with their `subpackages`.
 *
 * Every model of the project is read, not one target: `ScriptBlock` cannot name the metamodel
 * a Jjodie reply is bound to (the scope lives in the message's closure), and a qualified name
 * may write into another metamodel anyway. The summary shows the models whose figures changed.
 *
 * Pure over plain objects, so it runs under the bench's `environment: 'node'`; the caller
 * hands in the L-layer project, whose proxies expose the same names.
 */

export interface MetamodelFigures {
    classes: number;
    /** Included in `classes`. */
    abstractClasses: number;
    attributes: number;
    references: number;
    operations: number;
    enumerations: number;
    literals: number;
    packages: number;
}

export interface ModelFigures {
    id: string;
    name: string;
    isMetamodel: boolean;
    /** For a metamodel. */
    metamodel?: MetamodelFigures;
    /** For an M1 model: its instances, as the status bar counts them. */
    instances?: number;
}

export type ProjectFigures = ModelFigures[];

export interface FigureRow {
    label: string;
    before: number;
    after: number;
    delta: number;
    /** On the classes row: the abstract classes inside the count. */
    abstract?: { before: number; after: number };
}

export interface ModelChange {
    id: string;
    name: string;
    isMetamodel: boolean;
    rows: FigureRow[];
}

const list = (value: any): any[] => (Array.isArray(value) ? value.filter(Boolean) : []);
const sum = (items: any[], count: (item: any) => number): number =>
    items.reduce((total, item) => total + count(item), 0);

function countPackages(packages: any[], seen: Set<any>): number {
    let count = 0;
    for (const pkg of packages) {
        const key = pkg?.id ?? pkg;
        if (seen.has(key)) continue;
        seen.add(key);
        count += 1 + countPackages(list(pkg.subpackages ?? pkg.subPackages), seen);
    }
    return count;
}

export function metamodelFigures(metamodel: any): MetamodelFigures {
    const classes = list(metamodel?.classes);
    const enums = list(metamodel?.enumerators);
    return {
        classes: classes.length,
        abstractClasses: classes.filter(c => !!c.abstract).length,
        attributes: sum(classes, c => list(c.attributes).length),
        references: sum(classes, c => list(c.references).length),
        operations: sum(classes, c => list(c.operations).length),
        enumerations: enums.length,
        literals: sum(enums, e => list(e.literals).length),
        packages: countPackages(list(metamodel?.packages), new Set()),
    };
}

/** Every metamodel, then every M1 model, each once. */
export function projectFigures(project: any): ProjectFigures {
    const out: ProjectFigures = [];
    const seen = new Set<string>();
    for (const mm of list(project?.metamodels)) {
        if (seen.has(mm.id)) continue;
        seen.add(mm.id);
        out.push({ id: mm.id, name: mm.name ?? '', isMetamodel: true, metamodel: metamodelFigures(mm) });
    }
    for (const model of list(project?.models)) {
        if (model.isMetamodel || seen.has(model.id)) continue;
        seen.add(model.id);
        out.push({ id: model.id, name: model.name ?? '', isMetamodel: false, instances: list(model.objects).length });
    }
    return out;
}

const METAMODEL_ROWS: Array<[keyof MetamodelFigures, string]> = [
    ['classes', 'classes'],
    ['attributes', 'attributes'],
    ['references', 'references'],
    ['operations', 'operations'],
    ['enumerations', 'enumerations'],
    ['literals', 'literals'],
    ['packages', 'packages'],
];

const ZERO: MetamodelFigures = {
    classes: 0, abstractClasses: 0, attributes: 0, references: 0, operations: 0,
    enumerations: 0, literals: 0, packages: 0,
};

function rowsOf(before: ModelFigures | undefined, after: ModelFigures): FigureRow[] {
    if (!after.isMetamodel) {
        const b = before?.instances ?? 0;
        const a = after.instances ?? 0;
        return [{ label: 'instances', before: b, after: a, delta: a - b }];
    }
    const b = before?.metamodel ?? ZERO;
    const a = after.metamodel ?? ZERO;
    return METAMODEL_ROWS.map(([key, label]) => {
        const row: FigureRow = { label, before: b[key], after: a[key], delta: a[key] - b[key] };
        if (key === 'classes') row.abstract = { before: b.abstractClasses, after: a.abstractClasses };
        return row;
    });
}

function sameFigures(a: ModelFigures, b: ModelFigures): boolean {
    if (a.id !== b.id || a.name !== b.name || a.isMetamodel !== b.isMetamodel || a.instances !== b.instances) return false;
    if (!a.metamodel || !b.metamodel) return a.metamodel === b.metamodel;
    return (Object.keys(ZERO) as Array<keyof MetamodelFigures>).every(k => a.metamodel![k] === b.metamodel![k]);
}

/**
 * The models whose figures differ between the two snapshots, in the order of `after`, every
 * row shown with its before, after and delta. A model absent before starts from zero; a model
 * gone after is not listed. Either side unknown: nothing to compare.
 */
export function changedModels(before: ProjectFigures | null, after: ProjectFigures | null): ModelChange[] {
    if (!before || !after) return [];
    const byId = new Map(before.map(m => [m.id, m]));
    const out: ModelChange[] = [];
    for (const model of after) {
        const previous = byId.get(model.id);
        if (previous && sameFigures(previous, model)) continue;
        const rows = rowsOf(previous, model);
        if (!previous && rows.every(r => r.after === 0)) continue;
        out.push({ id: model.id, name: model.name, isMetamodel: model.isMetamodel, rows });
    }
    return out;
}

/** Value equality, for `useSelector`: an unchanged re-read must not re-render the dialog. */
export function figuresEqual(a: ProjectFigures | null, b: ProjectFigures | null): boolean {
    if (a === b) return true;
    if (!a || !b || a.length !== b.length) return false;
    return a.every((m, i) => sameFigures(m, b[i]));
}
