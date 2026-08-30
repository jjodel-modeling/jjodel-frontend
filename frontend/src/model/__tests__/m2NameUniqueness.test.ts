/**
 * L'unicita' dei nomi a M2 — il verdetto unico (S1-M2, R-M2U-1..6).
 *
 * Perche' un mock della sola `joiner`: `nameUniqueness.ts` non e' importabile sotto
 * vitest per via della barrel (`monaco` -> `window is not defined`, poi `jquery` ->
 * `document`), e l'ambiente di `vitest.config.ts` e' `node`. Cio' che la barrel fornisce
 * a QUESTO modulo a runtime sono tre stringhe `cname` e nient'altro — il resto degli
 * import e' di tipo, quindi cancellato. Il mock le sostituisce e lascia in esecuzione
 * **il modulo vero**: e' la dipendenza a essere finta, non il soggetto. Ricopiare qui
 * l'algoritmo misurerebbe la copia (precedente: `getByNameKey.test.ts`).
 *
 * I proxy L sono duck-typed: le funzioni M2 leggono solo `className`, `id`, `name`,
 * `father` e le collezioni, mai un metodo. Cio' che il test costruisce e' percio' la
 * stessa forma che il modulo vede sul campo, e non una sua semplificazione.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../joiner', () => ({
    DModel: { cname: 'DModel' },
    DObject: { cname: 'DObject' },
    DValue: { cname: 'DValue' },
}));

const NU = await import('../logicWrapper/nameUniqueness');
const { checkM2NameUniqueness, getM2NamespaceOf, m2KindOf, detectM2DuplicateNames } = NU;

// ── il fixture: due package in un metamodello, piu' un secondo metamodello ────
type Any = any;

function feature(className: string, id: string, name: string): Any {
    return { className, id, name, father: undefined };
}
function klass(id: string, name: string): Any {
    return {
        className: 'DClass', id, name, father: undefined,
        ownAttributes: [], ownReferences: [], ownOperations: [],
        allAttributes: [], allReferences: [], allOperations: [],
    };
}
function pkg(id: string, name: string): Any {
    return {
        className: 'DPackage', id, name, father: undefined,
        classes: [], enumerators: [], datatypes: [], subpackages: [], children: [],
    };
}
/** `children` e' la lista che il core confrontava, e che i generi non allargati usano ancora. */
function refreshChildren(p: Any): void {
    p.children = [...p.subpackages, ...p.classes, ...p.enumerators];
}
/** Il legame padre-figlio, nei due sensi che il modulo legge. */
function attach(child: Any, father: Any, collection: string): Any {
    child.father = father;
    father[collection].push(child);
    return child;
}
/** `allX` = proprie ++ ereditate lungo `extends`, come `LClass.get_allAttributes`. */
function wireInheritance(sub: Any, sup: Any): void {
    sub.allAttributes = [...sub.ownAttributes, ...sup.ownAttributes];
    sub.allReferences = [...sub.ownReferences, ...sup.ownReferences];
    sub.allOperations = [...sub.ownOperations, ...sup.ownOperations];
}
function ownIsAll(c: Any): void {
    c.allAttributes = [...c.ownAttributes];
    c.allReferences = [...c.ownReferences];
    c.allOperations = [...c.ownOperations];
}

let model: Any, other: Any, pkgA: Any, pkgB: Any, otherPkg: Any;
let dupA: Any, dupB: Any, freeCls: Any, sup: Any, sub: Any, color: Any;
let dtHomonym: Any;

beforeEach(() => {
    model = { className: 'DModel', id: 'mm', name: 'MM', isMetamodel: true, allSubPackages: [] };
    pkgA = pkg('pA', 'A'); pkgA.father = model; model.allSubPackages.push(pkgA);
    pkgB = pkg('pB', 'B'); attach(pkgB, pkgA, 'subpackages'); model.allSubPackages.push(pkgB);

    dupA = attach(klass('cA', 'DupProbe'), pkgA, 'classes');
    freeCls = attach(klass('cFree', 'FreeProbe'), pkgA, 'classes');
    color = attach({ className: 'DEnumerator', id: 'eColor', name: 'Color', literals: [] }, pkgA, 'enumerators');
    // omonimo di una classe, ma DDataType: namespace separato (R-M2U-3)
    dtHomonym = attach({ className: 'DDataType', id: 'dt1', name: 'DupProbe' }, pkgA, 'datatypes');
    // la seconda `DupProbe`, in un ALTRO package dello stesso metamodello (R-M2U-2)
    dupB = attach(klass('cB', 'DupProbe'), pkgB, 'classes');

    sup = attach(klass('cSup', 'Sup'), pkgA, 'classes');
    sub = attach(klass('cSub', 'Sub'), pkgA, 'classes');
    sup.ownAttributes.push(feature('DAttribute', 'aSupName', 'label'));
    sup.ownAttributes[0].father = sup;
    ownIsAll(sup); ownIsAll(dupA); ownIsAll(dupB); ownIsAll(freeCls);
    wireInheritance(sub, sup);

    // un secondo metamodello, con lo stesso nome di classe
    other = { className: 'DModel', id: 'mm2', name: 'MM2', isMetamodel: true, allSubPackages: [] };
    otherPkg = pkg('pO', 'O'); otherPkg.father = other; other.allSubPackages.push(otherPkg);
    attach(klass('cO', 'DupProbe'), otherPkg, 'classes');

    [pkgA, pkgB, otherPkg].forEach(refreshChildren);
});

// ─────────────────────────────────────────────────────────────────────────────
describe('m2KindOf — i generi, e cosa NON e\' M2', () => {
    it('mappa ogni elemento nominato M2 sul suo namespace', () => {
        expect(m2KindOf('DClass')).toBe('classifier');
        expect(m2KindOf('DEnumerator')).toBe('classifier');
        expect(m2KindOf('DDataType')).toBe('datatype');
        expect(m2KindOf('DAttribute')).toBe('feature');
        expect(m2KindOf('DReference')).toBe('feature');
        expect(m2KindOf('DOperation')).toBe('feature');
        expect(m2KindOf('DPackage')).toBe('package');
        expect(m2KindOf('DEnumLiteral')).toBe('literal');
        expect(m2KindOf('DParameter')).toBe('parameter');
    });
    it('ritorna null per cio\' che M2 non e\' — il segnale del fallback', () => {
        for (const cn of ['DModel', 'DObject', 'DValue', 'DVertex', 'DGraph', undefined, null, ''])
            expect(m2KindOf(cn as any), `${cn}`).toBeNull();
        // controllo positivo: la stessa chiamata su un className vero risponde
        expect(m2KindOf('DClass')).not.toBeNull();
    });
});

describe('i tre contro-esempi del referto — verdetto IDENTICO su create e rename', () => {
    it('CE1 — due classi omonime: la create e il rename rifiutano entrambi', () => {
        // create: una terza `DupProbe` in pkgA (nessun excludeId)
        const onCreate = checkM2NameUniqueness({ father: pkgA, kind: 'classifier', name: 'DupProbe' });
        // rename: `FreeProbe` -> `DupProbe` (excludeId = se stessa)
        const onRename = checkM2NameUniqueness({ father: pkgA, kind: 'classifier', name: 'DupProbe', excludeId: freeCls.id });
        expect(onCreate.ok).toBe(false);
        expect(onRename.ok).toBe(false);
        expect(onRename.reason).toBe(onCreate.reason);
        expect(onCreate.reason).toBe('Name "DupProbe" already used by Class "DupProbe"');
    });

    it('CE2 — attributo e reference omonimi nella stessa classe: entrambi rifiutati', () => {
        const attr = feature('DAttribute', 'a1', 'dupfeat'); attr.father = dupA;
        dupA.ownAttributes.push(attr); ownIsAll(dupA);
        const free = feature('DReference', 'r0', 'freefeat'); free.father = dupA;
        dupA.ownReferences.push(free); ownIsAll(dupA);

        const onCreate = checkM2NameUniqueness({ father: dupA, kind: 'feature', name: 'dupfeat' });
        const onRename = checkM2NameUniqueness({ father: dupA, kind: 'feature', name: 'dupfeat', excludeId: free.id });
        expect(onCreate.ok).toBe(false);
        expect(onRename.ok).toBe(false);
        expect(onRename.reason).toBe(onCreate.reason);
        expect(onCreate.reason).toBe('Name "dupfeat" already used by Attribute "dupfeat"');
    });

    it('CE3 — classe e datatype omonimi: entrambi ACCETTATI, ed e\' il comportamento inteso', () => {
        // il datatype `DupProbe` esiste gia' (fixture) e non ostacola la classe...
        expect(checkM2NameUniqueness({ father: pkgA, kind: 'classifier', name: 'NuovaCosa' }).ok).toBe(true);
        // ...e una classe omonima non ostacola un datatype nuovo con quel nome
        expect(checkM2NameUniqueness({ father: pkgA, kind: 'datatype', name: 'FreeProbe' }).ok).toBe(true);
        // rename di una classe verso il nome di un DDataType: accettato (R-M2U-3)
        expect(checkM2NameUniqueness({ father: pkgA, kind: 'classifier', name: dtHomonym.name, excludeId: freeCls.id }).ok)
            .toBe(false); // <- perche' esiste ANCHE la classe DupProbe: il rifiuto viene da quella
        // per contrasto, senza la classe omonima in campo il datatype non blocca
        pkgA.classes = pkgA.classes.filter((c: Any) => c.id !== dupA.id);
        pkgB.classes = pkgB.classes.filter((c: Any) => c.id !== dupB.id);
        expect(checkM2NameUniqueness({ father: pkgA, kind: 'classifier', name: 'DupProbe', excludeId: freeCls.id }).ok).toBe(true);
        // e due datatype omonimi restano un conflitto nel LORO namespace
        expect(checkM2NameUniqueness({ father: pkgA, kind: 'datatype', name: 'DupProbe' }).ok).toBe(false);
    });
});

describe('il pool: metamodello intero, non package, non globale (R-M2U-2)', () => {
    it('cross-package nello STESSO metamodello: rifiutato', () => {
        // `DupProbe` vive in pkgB; il verdetto e' chiesto con padre pkgA
        expect(pkgA.classes.some((c: Any) => c.name === 'DupProbe')).toBe(true);
        pkgA.classes = pkgA.classes.filter((c: Any) => c.id !== dupA.id); // lo lascio SOLO in pkgB
        refreshChildren(pkgA);
        const v = checkM2NameUniqueness({ father: pkgA, kind: 'classifier', name: 'DupProbe' });
        expect(v.ok).toBe(false);
        expect(v.collidingWith?.[0]).toMatchObject({ id: 'cB' });
        // controllo per contrasto: `children` di pkgA non lo contiene — e' il pool
        // vecchio a non vederlo, non il nome a essere assente
        expect(pkgA.children.some((c: Any) => c.name === 'DupProbe')).toBe(false);
    });

    it('cross-METAMODELLO: lecito', () => {
        expect(checkM2NameUniqueness({ father: otherPkg, kind: 'classifier', name: 'FreeProbe' }).ok).toBe(true);
        // controllo positivo: nello stesso metamodello quel nome collide
        expect(checkM2NameUniqueness({ father: pkgA, kind: 'classifier', name: 'FreeProbe' }).ok).toBe(false);
    });

    it('classi ed enum condividono il namespace, come nel core', () => {
        expect(checkM2NameUniqueness({ father: pkgB, kind: 'classifier', name: 'Color' }).ok).toBe(false);
    });

    it('package, literal e parameter restano sui `children` di oggi', () => {
        // stesso contenuto di `children` (la funzione filtra, quindi e' un array nuovo)
        expect(getM2NamespaceOf(pkgA, 'package').map((e: Any) => e.id)).toEqual(pkgA.children.map((e: Any) => e.id));
        // un package omonimo di una classe collide, esattamente come prima di S1-M2
        expect(checkM2NameUniqueness({ father: pkgA, kind: 'package', name: 'FreeProbe' }).ok).toBe(false);
    });
});

describe('quasi-omonimi: leciti, e dichiarati (R-M2U-1)', () => {
    it('`dupprobe` accanto a `DupProbe` passa, col warning', () => {
        const v = checkM2NameUniqueness({ father: pkgA, kind: 'classifier', name: 'dupprobe' });
        expect(v.ok).toBe(true);
        expect(v.reason).toBeUndefined();
        expect(v.warning).toBe('Name "dupprobe" differs only by case from "DupProbe" in the same scope');
    });
    it('un nome senza quasi-omonimi passa MUTO — il controllo negativo', () => {
        const v = checkM2NameUniqueness({ father: pkgA, kind: 'classifier', name: 'Zebra' });
        expect(v.ok).toBe(true);
        expect(v.warning).toBeUndefined();
    });
    it('un rifiuto non porta mai un warning', () => {
        const v = checkM2NameUniqueness({ father: pkgA, kind: 'classifier', name: 'DupProbe' });
        expect(v.ok).toBe(false);
        expect(v.warning).toBeUndefined();
    });
});

describe('feature: niente shadowing, col padre nella reason (R-M2U-4)', () => {
    it('un attributo che ombreggia una feature del padre e\' rifiutato, e nomina il padre', () => {
        const v = checkM2NameUniqueness({ father: sub, kind: 'feature', name: 'label' });
        expect(v.ok).toBe(false);
        expect(v.reason).toBe('Name "label" already used by Attribute "label" inherited from Class "Sup"');
    });
    it('la stessa feature sulla classe che la DICHIARA non nomina nessun padre', () => {
        const v = checkM2NameUniqueness({ father: sup, kind: 'feature', name: 'label' });
        expect(v.ok).toBe(false);
        expect(v.reason).toBe('Name "label" already used by Attribute "label"');
    });
    it('una feature propria che non collide e\' lecita — il controllo negativo', () => {
        expect(checkM2NameUniqueness({ father: sub, kind: 'feature', name: 'altroNome' }).ok).toBe(true);
        expect(checkM2NameUniqueness({ father: sup, kind: 'feature', name: 'altroNome' }).ok).toBe(true);
    });
});

describe('il nome assente non e\' un nome', () => {
    it('undefined e null non collidono mai (e\' il ramo dell\'auto-nome)', () => {
        expect(checkM2NameUniqueness({ father: pkgA, kind: 'classifier', name: undefined as any }).ok).toBe(true);
        expect(checkM2NameUniqueness({ father: pkgA, kind: 'classifier', name: null as any }).ok).toBe(true);
    });
    it('senza padre il namespace e\' vuoto e nulla collide', () => {
        expect(getM2NamespaceOf(null, 'classifier')).toEqual([]);
        expect(checkM2NameUniqueness({ father: null, kind: 'classifier', name: 'DupProbe' }).ok).toBe(true);
    });
    it('una catena di father rotta non fa girare a vuoto il walker', () => {
        const loop: Any = pkg('loop', 'Loop');
        loop.father = loop;
        expect(getM2NamespaceOf(loop, 'classifier')).toEqual([]);
    });
});

describe('il badge: detectM2DuplicateNames (R-M2U-6)', () => {
    it('quattro `Concept_0` accendono quattro voci', () => {
        const clean = pkg('pC', 'C'); clean.father = model; model.allSubPackages.push(clean);
        for (let i = 0; i < 4; i++) { const k = klass('k' + i, 'Concept_0'); ownIsAll(k); attach(k, clean, 'classes'); }
        refreshChildren(clean);
        const map = detectM2DuplicateNames(model as any);
        const concepts = [...map.keys()].filter(k => k.startsWith('k'));
        expect(concepts).toHaveLength(4);
        expect(map.get('k0')).toHaveLength(3);
    });

    it('un metamodello pulito lascia il registro spento', () => {
        const cleanModel: Any = { className: 'DModel', id: 'mmC', name: 'C', isMetamodel: true, allSubPackages: [] };
        const p = pkg('pp', 'P'); p.father = cleanModel; cleanModel.allSubPackages.push(p);
        ['Uno', 'Due', 'Tre'].forEach((n, i) => { const k = klass('u' + i, n); ownIsAll(k); attach(k, p, 'classes'); });
        refreshChildren(p);
        expect(detectM2DuplicateNames(cleanModel as any).size).toBe(0);
        // controllo positivo: lo stesso scanner sul fixture sporco trova qualcosa
        expect(detectM2DuplicateNames(model as any).size).toBeGreaterThan(0);
    });

    it('lo shadowing finisce nel registro, e su UNA sola classe: la sottoclasse', () => {
        const shadow = feature('DAttribute', 'aShadow', 'label'); shadow.father = sub;
        sub.ownAttributes.push(shadow); wireInheritance(sub, sup);
        const map = detectM2DuplicateNames(model as any);
        expect(map.has('aShadow')).toBe(true);
        expect(map.has('aSupName')).toBe(false);
    });

    it('un quasi-omonimo NON accende il registro', () => {
        const near = attach(klass('kNear', 'dupprobe'), pkgA, 'classes'); ownIsAll(near);
        refreshChildren(pkgA);
        expect(detectM2DuplicateNames(model as any).has('kNear')).toBe(false);
    });
});
