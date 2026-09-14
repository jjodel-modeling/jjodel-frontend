/**
 * Jjodie RAG documents — class names are emitted as `Metamodel::Name`.
 *
 * The index is project-wide, so a retrieved snippet can show the model a class of a metamodel
 * other than the one in focus. Bare, `A.Person` and `B.Person` read the same, and the model
 * writes a bare name that the scoped run then refuses or, worse, resolves elsewhere. Qualified,
 * the snippet carries the spelling the JjScript resolvers accept. See
 * `docs/discovery/discovery_2026-09-14_jjodie_scope_fix_targets.md` §3 Q4.
 *
 * `projectToDocuments` and `calculateProjectHash` are private; they are reached through the
 * singleton on purpose, since they are the whole behaviour under test and take plain objects.
 */

import { describe, it, expect } from 'vitest';
import { JjodieRagService } from '../JjodieRagService';

const svc = JjodieRagService as any;

function fixture() {
    const mmA: any = { name: 'A', id: 'mm-a' };
    const mmB: any = { name: 'B', id: 'mm-b' };
    const eint = { name: 'EInt' };                              // m3 primitive: no owning model
    const mood = { name: 'Mood', id: 'en-mood', model: mmA, literals: [{ name: 'HAPPY' }] };
    const named = { name: 'Named', id: 'cls-named', model: mmA, attributes: [{ name: 'label', type: { name: 'EString' } }] };
    const bPerson: any = { name: 'Person', id: 'b-person', model: mmB, attributes: [{ name: 'code', type: eint }] };
    const aPerson: any = {
        name: 'Person', id: 'a-person', model: mmA, abstract: false,
        extends: [named],
        attributes: [{ name: 'age', type: eint }, { name: 'mood', type: mood }],
        references: [{ name: 'twin', type: bPerson, containment: false }],
    };
    const project: any = { id: 'p', name: 'P', classes: [named, aPerson, bPerson], enumerators: [mood] };
    return { mmA, mmB, aPerson, bPerson, mood, project };
}

const docById = (docs: any[], id: string) => docs.find((d) => d.id === id);

describe('JjodieRagService documents — qualified names', () => {
    it('the overview lists every class and enum as Metamodel::Name', () => {
        const { project } = fixture();
        const overview = docById(svc.projectToDocuments(project), 'project_p_overview').content as string;
        expect(overview).toContain('- **A::Person**');
        expect(overview).toContain('- **B::Person**');
        expect(overview).toContain('- **A::Named**');
        expect(overview).toContain('- **A::Mood**');
        expect(overview).not.toMatch(/- \*\*Person\*\*/);
    });

    it('a class document qualifies its own name, its superclass, its reference target and a classifier type', () => {
        const { project } = fixture();
        const doc = docById(svc.projectToDocuments(project), 'class_p_a-person');
        expect(doc.title).toBe('Class: A::Person');
        expect(doc.content).toContain('# Class: A::Person');
        expect(doc.content).toContain('**Extends:** A::Named');
        expect(doc.content).toContain('- **twin** → B::Person (association)');
        expect(doc.content).toContain('- **mood**: A::Mood');
    });

    it('a primitive type has no metamodel and stays bare', () => {
        const { project } = fixture();
        const doc = docById(svc.projectToDocuments(project), 'class_p_a-person');
        expect(doc.content).toContain('- **age**: EInt');
        expect(doc.content).not.toContain('::EInt');
    });

    it('the two homonyms get distinct headers; ids and search tags are unchanged', () => {
        const { project } = fixture();
        const docs = svc.projectToDocuments(project);
        expect(docById(docs, 'class_p_b-person').content).toContain('# Class: B::Person');
        expect(docById(docs, 'class_p_a-person').metadata.tags).toEqual(['class', 'person']);
    });

    it('an enumeration document is qualified too', () => {
        const { project } = fixture();
        const doc = docById(svc.projectToDocuments(project), 'enum_p_en-mood');
        expect(doc.title).toBe('Enumeration: A::Mood');
        expect(doc.content).toContain('# Enumeration: A::Mood');
    });
});

describe('JjodieRagService change hash — homonyms are told apart', () => {
    const one = (owner: any) => ({ id: 'p', name: 'P', classes: [{ name: 'Person', model: owner, attributes: [], references: [] }], enumerators: [] });

    it('moving Person from A to B changes the hash, so the index is rebuilt', () => {
        const { mmA, mmB } = fixture();
        expect(svc.calculateProjectHash(one(mmA))).not.toBe(svc.calculateProjectHash(one(mmB)));
    });

    it('CONTROL: the same owner gives the same hash', () => {
        const { mmA } = fixture();
        expect(svc.calculateProjectHash(one(mmA))).toBe(svc.calculateProjectHash(one({ name: 'A' })));
    });
});
