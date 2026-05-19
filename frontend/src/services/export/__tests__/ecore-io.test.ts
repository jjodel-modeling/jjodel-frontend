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
