import { describe, it, expect, vi, beforeEach } from 'vitest';

// P-2026-10-31-1411: the XMI M1 importer never instantiates a class the metamodel lacks or an
// abstract one. These tests EXECUTE importM1FromXML against a fake D-layer: the joiner barrel is
// replaced by recorders for every constructor and action the importer calls, so each test reads
// what the import would have written. The suite runs on `environment: 'node'` without jsdom, so a
// minimal DOMParser below covers the XML subset these fixtures use (elements, attributes, text).

const fake = vi.hoisted(() => {
    const state = {
        ops: [] as any[],
        seq: 0,
        packages: [] as any[],
        classesById: new Map<string, any>(),
        pendingCreation: {} as Record<string, any>,
    };
    const nextId = (p: string) => `${p}_${++state.seq}`;
    class DModel {
        static new(name: string, metamodelId: string, isMetamodel: boolean, persist: boolean) {
            const d = { id: nextId('model'), className: 'DModel', name, objects: [] as string[] };
            state.ops.push(['DModel.new', d.id, name, metamodelId, isMetamodel, persist]);
            return d;
        }
    }
    class DValue {
        static new(_name: any, instanceofId: string, values: any[], fatherId: string, persist: boolean, isMirage: boolean) {
            const d = { id: nextId('value'), className: 'DValue', instanceof: instanceofId, father: fatherId, values };
            state.ops.push(['DValue.new', d.id, instanceofId, [...values], fatherId, persist, isMirage]);
            return d;
        }
    }
    class DObject {
        static new(classId: string, fatherId: string, fatherType: any, _name: any, persist: boolean) {
            const d = { id: nextId('object'), className: 'DObject', instanceof: classId, father: fatherId, features: [] as string[] };
            state.ops.push(['DObject.new', d.id, classId, fatherId, fatherType === DModel ? 'DModel' : 'DValue', persist]);
            // Conformity slots, as LObject._forceConformity mints them: one empty DValue per feature.
            const cls = state.classesById.get(classId);
            for (const f of [...(cls?.allAttributes ?? []), ...(cls?.allReferences ?? [])]) {
                const slot = { id: nextId('slot'), className: 'DValue', instanceof: f.id, father: d.id, values: [] };
                state.pendingCreation[slot.id] = slot;
            }
            return d;
        }
    }
    class DPackage {}
    const SetFieldAction = {
        new(id: string, field: string, value: any, op: string, isPointer: boolean) {
            state.ops.push(['SetFieldAction.new', id, field, value, op, isPointer]);
        },
    };
    const stubs: Record<string, any> = {
        DModel, DValue, DObject, DPackage, SetFieldAction,
        DPointerTargetable: { get pendingCreation() { return state.pendingCreation; } },
        LPointerTargetable: { fromD: (d: any) => ({ fromD: d.id }) },
        Selectors: { getAll: () => state.packages },
        store: { getState: () => ({ idlookup: {} }) },
    };
    return { state, stubs };
});

vi.mock('../../../joiner', () => new Proxy({}, {
    get: (_t, k) => (k === 'then' ? undefined
        : k in fake.stubs ? fake.stubs[k as string]
        : class Stub { static cname = String(k); }),
    has: () => true,
}));

// ---- Minimal DOMParser: elements, attributes, self-closing tags, text. No entities, no CDATA. ----
type El = { tagName: string; attributes: { name: string; value: string }[]; children: El[]; textContent: string };
function parseXml(xml: string): El {
    const body = xml.replace(/<\?[\s\S]*?\?>/g, '').replace(/<!--[\s\S]*?-->/g, '');
    const root: El = { tagName: '#doc', attributes: [], children: [], textContent: '' };
    const stack: El[] = [root];
    const tokens = body.match(/<[^>]+>|[^<]+/g) ?? [];
    for (const tok of tokens) {
        if (tok.startsWith('</')) { stack.pop(); continue; }
        if (tok.startsWith('<')) {
            const selfClosing = tok.endsWith('/>');
            const inner = tok.slice(1, selfClosing ? -2 : -1).trim();
            const tagName = inner.split(/\s+/)[0];
            const attributes: El['attributes'] = [];
            for (const m of inner.slice(tagName.length).matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) {
                attributes.push({ name: m[1], value: m[2] });
            }
            const el: El = { tagName, attributes, children: [], textContent: '' };
            stack[stack.length - 1].children.push(el);
            if (!selfClosing) stack.push(el);
            continue;
        }
        for (const el of stack) el.textContent += tok;
    }
    return root.children[0];
}
(globalThis as any).DOMParser = class {
    parseFromString(xml: string) {
        return { documentElement: parseXml(xml), querySelector: () => null };
    }
};

// ---- Metamodel ZooMM: Zoo (root) contains Animal (abstract) <- Dog; Animal contains Part. ----
function cls(id: string, name: string, abstract = false): any {
    return { id, name, abstract, interface: false, superclasses: [], allAttributes: [], allReferences: [] };
}
function attr(id: string, name: string): any {
    return { id, name, className: 'DAttribute', type: { isEnum: false }, upperBound: 1 };
}
function ref(id: string, name: string, type: any, containment: boolean, upperBound: number): any {
    return { id, name, className: 'DReference', containment, composition: containment, type, upperBound };
}
function installMetamodel() {
    const Zoo = cls('C_Zoo', 'Zoo');
    const Animal = cls('C_Animal', 'Animal', true);
    const Dog = cls('C_Dog', 'Dog');
    const Part = cls('C_Part', 'Part');
    const aName = attr('A_name', 'name');
    const aBreed = attr('A_breed', 'breed');
    const aLabel = attr('A_label', 'label');
    const rParts = ref('R_parts', 'parts', Part, true, -1);
    const rAnimals = ref('R_animals', 'animals', Animal, true, -1);
    const rStar = ref('R_star', 'star', Animal, false, 1);
    Zoo.allAttributes = [aName];
    Zoo.allReferences = [rAnimals, rStar];
    Animal.allAttributes = [aName];
    Animal.allReferences = [rParts];
    Dog.superclasses = [Animal];
    Dog.allAttributes = [aName, aBreed];
    Dog.allReferences = [rParts];
    Part.allAttributes = [aLabel];
    const metamodel = { id: 'MM', name: 'ZooMM', classes: [Zoo, Animal, Dog, Part] };
    fake.state.packages = [{ __raw: { uri: 'http://test/zoo', name: 'zoo' }, model: metamodel }];
    for (const c of metamodel.classes) fake.state.classesById.set(c.id, c);
}

const HEAD = '<?xml version="1.0" encoding="UTF-8"?>';
const NS = 'xmlns="http://test/zoo" xmlns:zoo="http://test/zoo" xmlns:xmi="http://www.omg.org/XMI" '
    + 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmi:version="2.0"';

async function importXml(xml: string) {
    const { XMIService } = await import('../XMIService');
    return (XMIService as any).importM1FromXML(xml, 'zoo1');
}
const created = (classId: string) => fake.state.ops.filter(o => o[0] === 'DObject.new' && o[2] === classId).length;
const writes = () => fake.state.ops.filter(o => o[0] === 'DModel.new' || o[0] === 'DObject.new' || o[0] === 'DValue.new' || o[0] === 'SetFieldAction.new');

beforeEach(() => {
    fake.state.ops = [];
    fake.state.seq = 0;
    fake.state.pendingCreation = {};
    fake.state.classesById = new Map();
    installMetamodel();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
});

describe('XMI M1 import — unknown xsi:type and abstract classes are skipped and counted', () => {
    it('skips an unknown xsi:type child with its subtree, keeps its siblings, one warning per class', async () => {
        const xml = `${HEAD}<zoo:Zoo ${NS} xmi:id="z1" name="City">
  <animals xsi:type="zoo:Dog" xmi:id="d1" name="Rex" breed="Lab"/>
  <animals xsi:type="zoo:Cat" xmi:id="c1" name="Tom" whiskers="12">
    <parts xmi:id="p1" label="tail"/>
    <parts xmi:id="p2" label="ear"/>
  </animals>
  <animals xsi:type="zoo:Cat" xmi:id="c2" name="Kit"/>
  <animals xsi:type="zoo:Dog" xmi:id="d2" name="Fido"/>
</zoo:Zoo>`;
        const r = await importXml(xml);
        expect(r.success).toBe(true);
        expect(created('C_Zoo')).toBe(1);
        expect(created('C_Dog')).toBe(2);
        expect(created('C_Animal')).toBe(0);
        expect(created('C_Part')).toBe(0);
        const catWarnings = r.warnings.filter((w: string) => w.includes('zoo:Cat'));
        expect(catWarnings).toHaveLength(1);
        expect(catWarnings[0]).toContain('2 objects not created');
        expect(catWarnings[0]).toContain('2 nested objects');
        expect(r.warnings.some((w: string) => w.startsWith('Unknown attribute') || w.startsWith('No feature'))).toBe(false);
        expect(r.warnings).toHaveLength(1);
    });

    it('skips an xsi:type resolving to an abstract class, and a child whose declared type is abstract', async () => {
        const xml = `${HEAD}<zoo:Zoo ${NS} xmi:id="z1" name="City">
  <animals xsi:type="zoo:Animal" xmi:id="a1" name="Generic"><parts xmi:id="p1" label="x"/></animals>
  <animals xmi:id="a2" name="Untyped"/>
  <animals xsi:type="zoo:Dog" xmi:id="d1" name="Rex"/>
</zoo:Zoo>`;
        const r = await importXml(xml);
        expect(r.success).toBe(true);
        expect(created('C_Animal')).toBe(0);
        expect(created('C_Part')).toBe(0);
        expect(created('C_Dog')).toBe(1);
        const abstractWarnings = r.warnings.filter((w: string) => w.includes("'Animal' is abstract"));
        expect(abstractWarnings).toHaveLength(1);
        expect(abstractWarnings[0]).toContain('2 objects not created');
        expect(abstractWarnings[0]).toContain('1 nested object');
    });

    it('drops a reference to a skipped object and counts it in the summary', async () => {
        const xml = `${HEAD}<zoo:Zoo ${NS} xmi:id="z1" name="City" star="c1">
  <animals xsi:type="zoo:Cat" xmi:id="c1" name="Tom"/>
</zoo:Zoo>`;
        const r = await importXml(xml);
        expect(r.success).toBe(true);
        const refWrites = fake.state.ops.filter(o =>
            (o[0] === 'SetFieldAction.new' && o[3] === 'c1') || (o[0] === 'DValue.new' && o[2] === 'R_star'));
        expect(refWrites).toHaveLength(0);
        expect(r.warnings.some((w: string) => w.includes('not found'))).toBe(false);
        expect(r.warnings.some((w: string) => w.includes('1 reference to skipped objects dropped'))).toBe(true);
    });

    it('fails and writes nothing when every root object of a wrapper is unknown', async () => {
        const xml = `${HEAD}<xmi:XMI ${NS}>
  <zoo:Cat xmi:id="c1" name="Tom"><parts xmi:id="p1" label="tail"/></zoo:Cat>
  <zoo:Bird xmi:id="b1" name="Tweety"/>
</xmi:XMI>`;
        const r = await importXml(xml);
        expect(r.success).toBe(false);
        expect(r.model).toBeUndefined();
        expect(r.errors.some((e: string) => e.includes("'Cat'"))).toBe(true);
        expect(r.errors.some((e: string) => e.includes("'Bird'"))).toBe(true);
        expect(writes()).toHaveLength(0);
    });

    it('fails and writes nothing when the single root is abstract', async () => {
        const xml = `${HEAD}<zoo:Animal ${NS} xmi:id="a1" name="Generic"/>`;
        const r = await importXml(xml);
        expect(r.success).toBe(false);
        expect(r.errors.some((e: string) => e.includes("'Animal' is abstract"))).toBe(true);
        expect(writes()).toHaveLength(0);
    });

    it('keeps the known roots of a wrapper and skips the unknown ones', async () => {
        const xml = `${HEAD}<xmi:XMI ${NS}>
  <zoo:Zoo xmi:id="z1" name="City"/>
  <zoo:Cat xmi:id="c1" name="Tom"/>
</xmi:XMI>`;
        const r = await importXml(xml);
        expect(r.success).toBe(true);
        expect(created('C_Zoo')).toBe(1);
        expect(r.warnings.filter((w: string) => w.includes("'Cat'"))).toHaveLength(1);
    });

    it('imports an XMI with only known classes exactly as before the change', async () => {
        const xml = `${HEAD}<zoo:Zoo ${NS} xmi:id="z1" name="City" star="d2">
  <animals xsi:type="zoo:Dog" xmi:id="d1" name="Rex" breed="Lab">
    <parts xmi:id="p1" label="tail"/>
  </animals>
  <animals xsi:type="zoo:Dog" xmi:id="d2" name="Fido"/>
</zoo:Zoo>`;
        const r = await importXml(xml);
        expect(r.success).toBe(true);
        expect(r.warnings).toEqual([]);
        expect(JSON.stringify(fake.state.ops)).toMatchInlineSnapshot(`"[["DModel.new","model_1","zoo1","MM",false,true],["DObject.new","object_2","C_Zoo","model_1","DModel",true],["SetFieldAction.new","slot_3","values",["City"],"",false],["SetFieldAction.new","slot_3","isMirage",false,"",false],["SetFieldAction.new","slot_4","isMirage",false,"",false],["DObject.new","object_6","C_Dog","slot_4","DValue",true],["SetFieldAction.new","slot_7","values",["Rex"],"",false],["SetFieldAction.new","slot_7","isMirage",false,"",false],["SetFieldAction.new","slot_8","values",["Lab"],"",false],["SetFieldAction.new","slot_8","isMirage",false,"",false],["SetFieldAction.new","slot_9","isMirage",false,"",false],["DObject.new","object_10","C_Part","slot_9","DValue",true],["SetFieldAction.new","slot_11","values",["tail"],"",false],["SetFieldAction.new","slot_11","isMirage",false,"",false],["DObject.new","object_12","C_Dog","slot_4","DValue",true],["SetFieldAction.new","slot_13","values",["Fido"],"",false],["SetFieldAction.new","slot_13","isMirage",false,"",false],["SetFieldAction.new","slot_5","values","object_12","+=",true],["SetFieldAction.new","slot_5","isMirage",false,"",false],["SetFieldAction.new","model_1","metadata",{"xmiIdMap":{"object_2":"z1","object_6":"d1","object_10":"p1","object_12":"d2"}},"",false]]"`);
    });
});
