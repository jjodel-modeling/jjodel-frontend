import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// W2 (BL2 + SI9): EDataType end-to-end. Round-trip via Redux/DOMParser non testabile in vitest
// node environment senza jsdom (non installato). EcoreService import scatena Monaco → window not
// defined. Coverage statica: (a) fixture well-formed; (b) presenza strutturale di parseDDataType
// e exportDataType nel sorgente. Round-trip funzionale verificato via dev server (smoke manuale).

const FIXTURE_DIR = path.resolve(__dirname, '../../../__tests__/fixtures/xmi-m1');
const DATATYPE_FIXTURE = path.join(FIXTURE_DIR, 'DataType_test.ecore');
const COLLISION_FIXTURE = path.join(FIXTURE_DIR, 'DataType_collision_test.ecore');
const ECORE_SERVICE = path.resolve(__dirname, '../EcoreService.ts');
const DATA_TS = path.resolve(__dirname, '../../../api/data.ts');

describe('Ecore I/O — DataType fixture (W2)', () => {
    it('fixture file esiste ed è leggibile', () => {
        expect(fs.existsSync(DATATYPE_FIXTURE)).toBe(true);
    });

    it('fixture dichiara 2 EDataType user-defined con attributi attesi', () => {
        const xml = fs.readFileSync(DATATYPE_FIXTURE, 'utf8');
        expect(xml).toContain('xsi:type="ecore:EDataType"');
        expect(xml).toContain('name="Date"');
        expect(xml).toContain('instanceClassName="java.util.Date"');
        expect(xml).toContain('name="URL"');
        expect(xml).toContain('instanceClassName="java.net.URL"');
        expect(xml).toContain('serializable="false"');
    });

    it('fixture dichiara 2 EClass con eType pointer ai due EDataType', () => {
        const xml = fs.readFileSync(DATATYPE_FIXTURE, 'utf8');
        expect(xml).toContain('name="Person"');
        expect(xml).toContain('name="birthDate"');
        expect(xml).toContain('eType="#//Date"');
        expect(xml).toContain('name="Resource"');
        expect(xml).toContain('name="homepage"');
        expect(xml).toContain('eType="#//URL"');
    });

    it('fixture è XML well-formed (matched tags)', () => {
        const xml = fs.readFileSync(DATATYPE_FIXTURE, 'utf8');
        const openPkg = (xml.match(/<ecore:EPackage\b/g) || []).length;
        const closePkg = (xml.match(/<\/ecore:EPackage>/g) || []).length;
        expect(openPkg).toBe(1);
        expect(closePkg).toBe(1);
        const openClassifiersOpenTag = (xml.match(/<eClassifiers\s[^/>]+>(?!\/)/g) || []).length;
        const closeClassifiers = (xml.match(/<\/eClassifiers>/g) || []).length;
        expect(openClassifiersOpenTag).toBe(closeClassifiers);
    });
});

describe('Ecore I/O — EcoreService exporter (W2 structural)', () => {
    const source = fs.readFileSync(ECORE_SERVICE, 'utf8');

    it('exportDataType helper esiste', () => {
        expect(source).toMatch(/private static exportDataType\s*\(\s*dt\s*:\s*LDataType/);
    });

    it('exportDataType emette xsi:type="ecore:EDataType"', () => {
        expect(source).toMatch(/xsi:type="ecore:EDataType"/);
    });

    it('exportDataType skippa serializable=true (default EMF)', () => {
        expect(source).toMatch(/dt\.serializable\s*===\s*false/);
    });

    it('exportDataType emette instanceClassName solo se truthy', () => {
        expect(source).toMatch(/if\s*\(\s*dt\.instanceClassName\s*\)/);
    });

    it('renderEPackageBody chiama exportDataType nel loop datatypes', () => {
        expect(source).toMatch(/pkg\.datatypes\s*\|\|\s*\[\]/);
        expect(source).toMatch(/this\.exportDataType\(/);
    });

    it('exportSubPackage chiama exportDataType ricorsivamente', () => {
        const subPkgMatch = source.match(/private static exportSubPackage[\s\S]+?\n    \}/);
        expect(subPkgMatch).not.toBeNull();
        expect(subPkgMatch![0]).toMatch(/datatypes/);
        expect(subPkgMatch![0]).toMatch(/exportDataType/);
    });

    it('LDataType importato dal joiner', () => {
        expect(source).toMatch(/^\s*LDataType,?\s*$/m);
    });
});

describe('Ecore I/O — EcoreParser importer (W2 structural)', () => {
    const source = fs.readFileSync(DATA_TS, 'utf8');

    it('parseDDataType helper esiste', () => {
        expect(source).toMatch(/static parseDDataType\s*\(\s*parent\s*:\s*DPackage/);
    });

    it('parsePackageBody dispatch include ecore:EDataType case (root + sub)', () => {
        const matches = source.match(/case 'ecore:EDataType': this\.parseDDataType\(/g) || [];
        expect(matches.length).toBe(2);
    });

    it('ECoreDataType class declaration esiste', () => {
        expect(source).toMatch(/export class ECoreDataType\b/);
    });

    it('ECoreDataType.instanceClassName e .serializable assegnati con XMLinlineMarker', () => {
        expect(source).toMatch(/ECoreDataType\.instanceClassName\s*=\s*EcoreParser\.XMLinlineMarker\s*\+\s*'instanceClassName'/);
        expect(source).toMatch(/ECoreDataType\.serializable\s*=\s*EcoreParser\.XMLinlineMarker\s*\+\s*'serializable'/);
    });

    it('parseDDataType setta dObject.instanceClassName con default \'\' e dObject.serializable default true', () => {
        expect(source).toMatch(/dObject\.instanceClassName\s*=\s*this\.read\(json,\s*ECoreDataType\.instanceClassName,\s*''\)/);
        expect(source).toMatch(/dObject\.serializable\s*=\s*this\.read\(json,\s*ECoreDataType\.serializable,\s*'true'\)\s*===\s*'true'/);
    });
});

describe('Ecore I/O — D-layer extensions (W2 structural)', () => {
    const lme = fs.readFileSync(
        path.resolve(__dirname, '../../../model/logicWrapper/LModelElement.tsx'),
        'utf8'
    );
    const classes = fs.readFileSync(
        path.resolve(__dirname, '../../../joiner/classes.ts'),
        'utf8'
    );

    it('DPackage.datatypes campo dichiarato', () => {
        expect(lme).toMatch(/datatypes:\s*Pointer<DDataType>\[\]\s*=\s*\[\]/);
    });

    it('LPackage.datatypes campo dichiarato', () => {
        expect(lme).toMatch(/datatypes!:\s*LDataType\[\]\s*&\s*Dictionary/);
    });

    it('LPackage._set_classifiers signature estesa con kind \'datatypes\'', () => {
        expect(lme).toMatch(/kind:\s*'classes'\s*\|\s*'enumerators'\s*\|\s*'datatypes'/);
    });

    it('LPackage.set_datatypes dispatch a _set_classifiers', () => {
        expect(lme).toMatch(/set_datatypes\([^)]*\)[^{]*\{\s*return this\._set_classifiers\(val,\s*c,\s*'datatypes'\)/);
    });

    it('get_classifiers include data.datatypes nel merge', () => {
        expect(lme).toMatch(/context\.data\.datatypes\s*\|\|\s*\[\]\)\.map/);
    });

    it('DDataType.new() factory attivo (Log.exx rimosso)', () => {
        const factoryBlock = lme.match(/public static new\([^)]*\):\s*DDataType\s*\{[\s\S]+?\n    \}/);
        expect(factoryBlock).not.toBeNull();
        expect(factoryBlock![0]).not.toMatch(/Log\.exx.*"DDataType is abstract/);
        expect(factoryBlock![0]).toMatch(/Constructors.+\.DDataType\(\)\.end\(\)/);
    });

    it('Constructors.DDataType() registra in parent.datatypes', () => {
        expect(classes).toMatch(/DDataType\(\):\s*this\s*\{[\s\S]+?setExternalPtr\(thiss\.father,\s*"datatypes",\s*"\+="\)/);
    });
});

describe('Ecore I/O — DataType_collision_test.ecore (W2 fix)', () => {
    it('fixture file esiste ed è leggibile', () => {
        expect(fs.existsSync(COLLISION_FIXTURE)).toBe(true);
    });

    it('fixture XML well-formed e dichiara package collision', () => {
        const xml = fs.readFileSync(COLLISION_FIXTURE, 'utf8');
        expect(xml).toContain('<ecore:EPackage');
        expect(xml).toContain('name="collision"');
        const openPkg = (xml.match(/<ecore:EPackage\b/g) || []).length;
        const closePkg = (xml.match(/<\/ecore:EPackage>/g) || []).length;
        expect(openPkg).toBe(1);
        expect(closePkg).toBe(1);
    });

    it('fixture dichiara 2 user-defined EDataType con nomi collidenti (String, Date)', () => {
        const xml = fs.readFileSync(COLLISION_FIXTURE, 'utf8');
        expect(xml).toMatch(/xsi:type="ecore:EDataType"\s+name="String"/);
        expect(xml).toMatch(/xsi:type="ecore:EDataType"\s+name="Date"\s+instanceClassName="java\.util\.Date"/);
    });

    it('fixture dichiara EAttribute customString con local ref a user-defined String', () => {
        const xml = fs.readFileSync(COLLISION_FIXTURE, 'utf8');
        expect(xml).toMatch(/name="customString"\s+eType="#\/\/String"/);
    });

    it('fixture dichiara EAttribute customDate con local ref a user-defined Date', () => {
        const xml = fs.readFileSync(COLLISION_FIXTURE, 'utf8');
        expect(xml).toMatch(/name="customDate"\s+eType="#\/\/Date"/);
    });

    it('fixture dichiara EAttribute age con canonical EInt URI (regression)', () => {
        const xml = fs.readFileSync(COLLISION_FIXTURE, 'utf8');
        expect(xml).toMatch(/name="age"\s+eType="ecore:EDataType\s+http:\/\/www\.eclipse\.org\/emf\/2002\/Ecore#\/\/EInt"/);
    });

    it('fixture dichiara EAttribute canonicalLabel con canonical EString URI (regression)', () => {
        const xml = fs.readFileSync(COLLISION_FIXTURE, 'utf8');
        expect(xml).toMatch(/name="canonicalLabel"\s+eType="ecore:EDataType\s+http:\/\/www\.eclipse\.org\/emf\/2002\/Ecore#\/\/EString"/);
    });
});

describe('Ecore I/O — mapToEcoreType canonical guard (W2 collision fix)', () => {
    const source = fs.readFileSync(ECORE_SERVICE, 'utf8');

    it('mapToEcoreType emette guard isCanonical basato su id Pointer_E', () => {
        expect(source).toContain('isCanonical');
        expect(source).toMatch(/type\.id\.startsWith\(['"]Pointer_E['"]\)/);
    });

    it('mapToEcoreType conserva il path canonical per input stringa (isString)', () => {
        expect(source).toMatch(/const\s+isString\s*=\s*typeof\s+type\s*===\s*['"]string['"]/);
        expect(source).toMatch(/if\s*\(\s*isCanonical\s*&&\s*typeMap\[typeName\]\s*\)/);
    });
});

// FIX 2026-07-20 — riuso slot conformity nell'import XMI M1 (no righe attributo duplicate).
// Come per W2, il round-trip runtime non è testabile in vitest node env (Monaco → window not
// defined): coverage strutturale sui tre siti di popolamento + helper. Verifica funzionale
// eseguita via preview build + Playwright (uno slot per feature, valori corretti).
describe('XMI M1 import — riuso conformity slot (fix duplicati DValue)', () => {
    const XMI_SERVICE = path.resolve(__dirname, '../XMIService.ts');
    const source = fs.readFileSync(XMI_SERVICE, 'utf8');

    it('helper getConformitySlot esiste e legge pendingCreation con fallback store', () => {
        expect(source).toMatch(/private static getConformitySlot\(/);
        expect(source).toContain('DPointerTargetable.pendingCreation');
        expect(source).toContain('ctx.conformitySlots');
    });

    it('processAttribute riusa lo slot (values replace + clear isMirage) prima di DValue.new', () => {
        const m = source.match(/private static processAttribute[\s\S]+?\n    \}/);
        expect(m).not.toBeNull();
        expect(m![0]).toMatch(/getConformitySlot\(dObject,\s*metaFeature\.id/);
        expect(m![0]).toMatch(/SetFieldAction\.new\(conformitySlot\.id,\s*'values',\s*values as any,\s*'',\s*false\)/);
        expect(m![0]).toMatch(/SetFieldAction\.new\(conformitySlot\.id,\s*'isMirage',\s*false/);
    });

    it('processContainment riusa lo slot come containment DValue e non pusha in values', () => {
        const m = source.match(/private static processContainment[\s\S]+?\n    \}/);
        expect(m).not.toBeNull();
        expect(m![0]).toMatch(/getConformitySlot\(parentDObject,\s*containmentMeta\.id/);
        // il push diretto post-persist duplicava ogni child pointer (CreateElementAction by
        // reference + SetFieldAction '+=' del Constructors.DObject)
        expect(m![0]).not.toContain('(containmentDValue.values as Pointer<DObject>[]).push');
    });

    it('populateReferenceValue riusa lo slot con append per-target (Format B multi-entry)', () => {
        const m = source.match(/private static populateReferenceValue[\s\S]+?\n    \}/);
        expect(m).not.toBeNull();
        expect(m![0]).toMatch(/getConformitySlot\(sourceDObject,\s*feature\.id/);
        expect(m![0]).toMatch(/SetFieldAction\.new\(conformitySlot\.id,\s*'values',\s*target,\s*'\+=',\s*true\)/);
    });
});


/**
 * StateMachine fixture (form views, slice 1b).
 *
 * Structural only, on the files themselves: no end-to-end import runs here, because the
 * importer needs the store and the L layer, which this suite is deliberately free of. The
 * import is verified on the browser (criterion V1 of the slice).
 *
 * What is worth pinning is that the fixture keeps DECLARING the shapes the form needs. Each
 * assertion below stands for a widget or a diagnostic, and if someone simplifies the fixture
 * the form silently loses coverage instead of failing — which is exactly how V3 of slice 1a
 * ended up unexercised for want of a model with a number in it.
 */
describe('Ecore I/O — StateMachine fixture (form views 1b)', () => {
    const ECORE = path.join(FIXTURE_DIR, 'StateMachine.ecore');
    const XMI = path.join(FIXTURE_DIR, 'sample-StateMachine.xmi');

    it('both files exist and are well-formed enough to parse as XML', () => {
        for (const f of [ECORE, XMI]) {
            expect(fs.existsSync(f)).toBe(true);
            const xml = fs.readFileSync(f, 'utf8');
            expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
            // Tags balance: every '<' that opens an element has a matching close or is
            // self-closing. A cheap check, but it catches the hand-edit that breaks the file.
            const opens = (xml.match(/<[A-Za-z][^!?>]*[^/?]>/g) ?? []).length;
            const closes = (xml.match(/<\/[A-Za-z][^>]*>/g) ?? []).length;
            expect(opens).toBe(closes);
        }
    });

    it('declares one widget-bearing type per form control', () => {
        const xml = fs.readFileSync(ECORE, 'utf8');
        expect(xml).toContain('nsURI="http://jjodel.io/fixtures/statemachine"');
        // select
        expect(xml).toMatch(/xsi:type="ecore:EEnum"\s+name="StateKind"/);
        expect((xml.match(/<eLiterals /g) ?? []).length).toBe(3);
        // number stepper, checkbox
        expect(xml).toContain('Ecore#//EInt');
        expect(xml).toContain('Ecore#//EBoolean');
        // read-only field with the lock glyph
        expect(xml).toMatch(/name="depth"[\s\S]*?derived="true"/);
        expect(xml).toMatch(/name="depth"[\s\S]*?changeable="false"/);
        // a REACHABLE upper bound, so the disabled Add and its tooltip can be reached
        expect(xml).toMatch(/name="outgoing"[\s\S]*?upperBound="5"/);
        // chips
        expect(xml).toMatch(/name="tags"[\s\S]*?upperBound="-1"/);
        // the required marker
        expect(xml).toMatch(/name="kind"[\s\S]*?lowerBound="1"/);
    });

    it('the model instance omits Broken.kind, which is what produces the diagnostic', () => {
        const xml = fs.readFileSync(XMI, 'utf8');
        const broken = xml.match(/<states[^>]*name="Broken"[^>]*\/>/);
        expect(broken).not.toBeNull();
        // The whole point of that instance: `kind` is [1..1] and absent, so the validator
        // raises on it and the form has a real message to project onto a real field.
        expect(broken![0]).not.toContain('kind=');
        // Every other state does declare it, so exactly one violation is expected.
        expect((xml.match(/kind="/g) ?? []).length).toBe(5);
    });

    it('the rich instance carries a value for every widget kind', () => {
        const xml = fs.readFileSync(XMI, 'utf8');
        const running = xml.match(/<states[^>]*name="Running"[\s\S]*?<\/states>/);
        expect(running).not.toBeNull();
        expect(running![0]).toContain('isHistory="true"');
        expect(running![0]).toContain('timeout="30"');
        expect(running![0]).toContain('tags="hot monitored"');
        expect(running![0]).toContain('entryAction="heater.on()"');
        expect(running![0]).toMatch(/outgoing="t_stop t_fault"/);
        expect((running![0].match(/<substates /g) ?? []).length).toBe(2);
    });
});


/**
 * R-FRM-3 — the XMI importer resolves enum literal NAMES into POINTERS.
 *
 * The spec (2026-08-28 addendum, §10) makes the pointer to the DEnumLiteral the canonical enum
 * value and keeps the name as a legacy form accepted on read. Commit 1 made CHECK 10 tolerant of
 * both; this is the writer side.
 *
 * Structural, like every other importer test in this file, and for the same reason stated at the
 * top of the `conformity slot` block: XMIService imports the `joiner` barrel, which pulls Monaco,
 * which needs `window`, and this suite runs on `environment: 'node'` (vitest.config.ts:14). No
 * end-to-end import can run here, so what the assertions pin is the SHAPE of the transformation —
 * where it sits, what it keys on, what it leaves alone. The observable claims (the D layer holds
 * the id; a renamed literal makes the value follow the rename on screen) belong to the browser
 * verification of this commit.
 */
describe('XMI M1 import — enum literal names resolved to pointers (R-FRM-3)', () => {
    const XMI_SERVICE = path.resolve(__dirname, '../XMIService.ts');
    const source = fs.readFileSync(XMI_SERVICE, 'utf8');
    const processAttribute = source.match(/private static processAttribute[\s\S]+?\n    \}/)?.[0] ?? '';

    it('processAttribute is still one method, and the resolution lives inside it', () => {
        // Guards every assertion below: an empty match would make `toContain` on '' fail loudly
        // rather than silently, but a match that grabbed the WRONG method would not.
        expect(processAttribute).not.toBe('');
        expect(processAttribute).toContain('const featName = attrKey.substring(1)');
        expect(processAttribute).toContain('nameToId');
    });

    it('detects the enum through type.isEnum, the same predicate CHECK 10 uses', () => {
        expect(processAttribute).toMatch(/const featType: any = \(metaFeature as any\)\.type/);
        expect(processAttribute).toMatch(/if \(featType && featType\.isEnum\)/);
        // The check on the other side of the ratification reads the same field, so the writer and
        // the validator cannot disagree on what counts as an enum.
        const validator = fs.readFileSync(
            path.resolve(__dirname, '../../../model/conformance/ConformanceValidator.ts'), 'utf8');
        expect(validator).toContain('attrType.isEnum');
    });

    it('builds the name→id map from type.literals, skipping literals without an id', () => {
        expect(processAttribute).toMatch(/Array\.isArray\(featType\.literals\) \? featType\.literals : \[\]/);
        expect(processAttribute).toMatch(/const nameToId = new Map<string, string>\(\)/);
        // A literal with no id must not enter the map: it would map a name onto `undefined` and
        // write an undefined pointer, which is strictly worse than keeping the name.
        expect(processAttribute).toMatch(/if \(lid === null \|\| lid === undefined\) continue;/);
        expect(processAttribute).toMatch(/if \(lname === null \|\| lname === undefined\) continue;/);
        // Duplicate name: first occurrence wins, matching normalizeEnumValues on the form side.
        expect(processAttribute).toMatch(/if \(!nameToId\.has\(lname\)\) nameToId\.set\(lname, lid\)/);
    });

    it('resolves per element, so a multi-valued attribute mixes resolved and kept values', () => {
        // `.map` and not a whole-array replacement: with `tags="hot ZZZ monitored"` the two names
        // that resolve become pointers and the third stays a name, independently.
        expect(processAttribute).toMatch(/values = values\.map\(\(v\) => \{/);
        expect(processAttribute).toMatch(/const resolved = nameToId\.get\(v\);/);
        expect(processAttribute).toMatch(/if \(resolved !== undefined\) return resolved;/);
    });

    it('keeps an unresolved value verbatim and warns, instead of rejecting the file', () => {
        expect(processAttribute).toContain('does not match any literal of enum');
        expect(processAttribute).toContain('kept as-is');
        expect(processAttribute).toMatch(/ctx\.warnings\.push\(msg\);[\s\S]{0,40}ctx\.summary\.warnings\+\+/);
        // The value is returned unchanged: the import loads, and CHECK 10 raises
        // invalid_enum_literal on exactly that value. No throw, no drop.
        expect(processAttribute).not.toMatch(/throw new Error\([^)]*literal/);
    });

    it('lets a value that is already a pointer through, and silently', () => {
        // Unreachable through nameToId (keyed by name), so without this it would be reported as
        // unresolved — a warning on the canonical form itself.
        expect(processAttribute).toMatch(/const literalIds = new Set<string>\(\)/);
        expect(processAttribute).toMatch(/if \(literalIds\.has\(v\)\) return v;/);
    });

    it('maps before the branch, so both write paths get the resolved array', () => {
        const mapAt = processAttribute.indexOf('values = values.map((v) => {');
        const slotAt = processAttribute.indexOf('const conformitySlot = XMIService.getConformitySlot');
        const fallbackAt = processAttribute.indexOf('const dValue: DValue = DValue.new(');
        expect(mapAt).toBeGreaterThan(-1);
        expect(slotAt).toBeGreaterThan(mapAt);
        expect(fallbackAt).toBeGreaterThan(mapAt);
        // Neither branch was touched: they still hand `values` over as they did before.
        expect(processAttribute).toMatch(/SetFieldAction\.new\(conformitySlot\.id,\s*'values',\s*values as any,\s*'',\s*false\)/);
        expect(processAttribute).toMatch(/DValue\.new\(undefined,\s*metaFeature\.id as any,\s*values,\s*dObject\.id,\s*true,\s*false\)/);
    });

    it('leaves non-enum attributes alone', () => {
        // The whole transformation is inside the `featType.isEnum` guard, and the guard opens
        // after `values` is built and closes before the write. A string, an int or a boolean
        // attribute reaches the write with the array the split produced.
        const guardAt = processAttribute.indexOf('if (featType && featType.isEnum) {');
        const splitAt = processAttribute.indexOf("values = rawValue.split(/\\s+/)");
        expect(splitAt).toBeGreaterThan(-1);
        expect(guardAt).toBeGreaterThan(splitAt);
        const guarded = processAttribute.slice(guardAt);
        expect(guarded.indexOf('nameToId')).toBeLessThan(guarded.indexOf('const conformitySlot'));
    });

    it('the export is unchanged and round-trips both forms to the same XML', () => {
        // C11 of the discovery: serializeFeatures reads __raw.values and resolves a string that
        // is a DEnumLiteral id to `target.name`; anything else falls through to String(v), which
        // for a legacy name is the name itself. So the file this commit produces on export is
        // byte-identical to the one it produced before, whichever form the D layer holds. This
        // test exists to make a change to that resolution fail here rather than in a round-trip.
        const serialize = source.match(/private static serializeFeatures[\s\S]+?\n    \}/)?.[0] ?? '';
        expect(serialize).not.toBe('');
        expect(serialize).toMatch(/const rawValues: any\[\] = \(feature\.__raw\?\.values \|\| \[\]\) as any\[\]/);
        expect(serialize).toMatch(/target\.className === 'DEnumLiteral'\) return this\.escapeXml\(target\.name \|\| ''\)/);
        expect(serialize).toMatch(/return this\.escapeXml\(String\(v\)\)/);
    });
});
