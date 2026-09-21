/**
 * L'ancoraggio doppio delle violazioni di validazione (R-VAL-18, fetta 1).
 *
 * Il soggetto e' `publishValidationProblems`, che e' una funzione e non un componente:
 * il produttore della validazione scrive solo quando l'utente lancia il comando, quindi
 * una chiamata qui e' esattamente un giro di Validate. Nessun mock del barrel serve —
 * il modulo importa il registro, che non ha dipendenze, e i tipi del valutatore, che
 * sono erasi.
 *
 * Il registro e' stato module-level: `vi.resetModules()` a ogni test, o si misurerebbe
 * l'ordine del file. `markResolved` programma la rimozione a 5 s, quindi timer finti,
 * come nel test del produttore dei duplicati.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type Any = any;

let SUT: typeof import('../validationToProblems');
let REG: typeof import('../registry');

beforeEach(async () => {
    vi.resetModules();
    REG = await import('../registry');
    SUT = await import('../validationToProblems');
    vi.useFakeTimers();
});
afterEach(() => { vi.useRealTimers(); });

const violation = (instanceId: string, ruleId: string, over: Any = {}): Any => ({
    instanceId, ruleId, ruleName: `rule_${ruleId}`, message: `msg_${ruleId}`, ...over,
});

/** Le voci di validazione su un nodo, in ordine di registrazione. */
const on = (nodeId: string): Any[] =>
    REG.getNodeProblemsSnapshot(nodeId).filter(p => p.kind === 'validation') as Any[];
const active = (nodeId: string): Any[] => on(nodeId).filter(p => p.resolvedAt === undefined);

/** Il grafo aperto: `o1` e `o2` sono disegnati, `o3` no. */
const resolver = (objectId: string): string | null =>
    ({ o1: 'v1', o2: 'v2' } as Record<string, string>)[objectId] ?? null;

describe('publishValidationProblems — ancoraggio', () => {
    it('senza risolutore registra la sola voce dell\'elemento', () => {
        SUT.publishValidationProblems('m1', [violation('o1', 'r1')]);
        expect(active('o1')).toHaveLength(1);
        expect(active('v1')).toHaveLength(0);
    });

    // Il cuore della fetta: e' la voce sotto l'id del VERTICE che accende il pallino,
    // perche' `NodeProblemIndicator` e' montato con l'id del nodo React Flow.
    it('col risolutore registra DUE voci: elemento e vertice', () => {
        SUT.publishValidationProblems('m1', [violation('o1', 'r1')], resolver);
        expect(active('o1')).toHaveLength(1);
        expect(active('v1')).toHaveLength(1);
        expect(active('v1')[0].nodeId).toBe('v1');
        expect(active('v1')[0].description).toBe('msg_r1');
        expect(active('v1')[0].title).toBe('rule_r1');
    });

    it('l\'istanza non disegnata resta con la sola voce dell\'elemento', () => {
        SUT.publishValidationProblems('m1', [violation('o3', 'r1')], resolver);
        expect(active('o3')).toHaveLength(1);
        // Nessuna voce fantasma da nessuna parte: il risolutore ha detto null e basta.
        expect(REG.getProblemIdsOwnedBy('validation', 'm1')).toHaveLength(1);
    });

    it('non raddoppia se il risolutore restituisce lo stesso id', () => {
        SUT.publishValidationProblems('m1', [violation('o1', 'r1')], () => 'o1');
        expect(REG.getProblemIdsOwnedBy('validation', 'm1')).toHaveLength(1);
    });

    it('entrambe le voci portano ownerModelId, che e\' quello che le rende ritirabili', () => {
        SUT.publishValidationProblems('m1', [violation('o1', 'r1')], resolver);
        expect(active('o1')[0].ownerModelId).toBe('m1');
        expect(active('v1')[0].ownerModelId).toBe('m1');
    });
});

describe('publishValidationProblems — piu\' regole su una stessa istanza (R-VAL-12)', () => {
    // Le regole si accumulano e non si sovrascrivono: la chiave lunga
    // `kind:nodeId:ruleId` esiste per questo, e va verificata su ENTRAMBI gli ancoraggi.
    it('due regole violate dalla stessa istanza danno due voci per ancoraggio', () => {
        SUT.publishValidationProblems('m1', [
            violation('o1', 'r1'), violation('o1', 'r2'),
        ], resolver);
        expect(active('o1')).toHaveLength(2);
        expect(active('v1')).toHaveLength(2);
        expect(active('v1').map((p: Any) => p.title).sort()).toEqual(['rule_r1', 'rule_r2']);
    });

    // Il numero sul pallino e' la somma delle voci attive del nodo, una per voce che non
    // porta una lista di conformance: due regole violate devono valere 2, non 1.
    it('il conteggio che il badge fa sul vertice vale 2', () => {
        SUT.publishValidationProblems('m1', [
            violation('o1', 'r1'), violation('o1', 'r2'),
        ], resolver);
        const count = active('v1').reduce((n: number, p: Any) => n + (p.conformance?.length ?? 1), 0);
        expect(count).toBe(2);
    });
});

describe('publishValidationProblems — il ritiro del giro precedente', () => {
    it('un secondo giro senza quella violazione ritira ENTRAMBE le voci', () => {
        SUT.publishValidationProblems('m1', [violation('o1', 'r1')], resolver);
        SUT.publishValidationProblems('m1', [], resolver);
        expect(active('o1')).toHaveLength(0);
        expect(active('v1')).toHaveLength(0);
        // Ritirate col transitorio, non cancellate: `markResolved` le lascia leggibili.
        expect(on('o1')[0].resolvedAt).toBeDefined();
        expect(on('v1')[0].resolvedAt).toBeDefined();
    });

    it('un secondo giro con la stessa violazione la lascia attiva', () => {
        SUT.publishValidationProblems('m1', [violation('o1', 'r1')], resolver);
        SUT.publishValidationProblems('m1', [violation('o1', 'r1')], resolver);
        expect(active('o1')).toHaveLength(1);
        expect(active('v1')).toHaveLength(1);
    });

    // Il registro e' UNO per sessione: il ritiro filtra su kind E ownerModelId, quindi un
    // altro modello aperto non perde i suoi pallini. E' il difetto UNQ1 C5, in un altro
    // produttore.
    it('non tocca le voci di un altro modello', () => {
        SUT.publishValidationProblems('m1', [violation('o1', 'r1')], resolver);
        SUT.publishValidationProblems('m2', [violation('o2', 'r9')], resolver);
        SUT.publishValidationProblems('m2', [], resolver);
        expect(active('o1')).toHaveLength(1);
        expect(active('v1')).toHaveLength(1);
        expect(active('o2')).toHaveLength(0);
    });
});

describe('clearValidationProblems', () => {
    it('toglie senza transitorio entrambe le voci del modello, e solo le sue', () => {
        SUT.publishValidationProblems('m1', [violation('o1', 'r1')], resolver);
        SUT.publishValidationProblems('m2', [violation('o2', 'r9')], resolver);
        SUT.clearValidationProblems('m1');
        // Cancellate, non risolte: nessuna voce resta da leggere.
        expect(on('o1')).toHaveLength(0);
        expect(on('v1')).toHaveLength(0);
        expect(active('o2')).toHaveLength(1);
        expect(active('v2')).toHaveLength(1);
    });

    it('non tocca le voci degli altri produttori sullo stesso nodo', () => {
        REG.registerProblem({
            id: 'conformance:v1', nodeId: 'v1', kind: 'conformance', severity: 'error',
            title: 'Conformance', description: 'x', relatedNodeIds: [],
            ownerModelId: 'm1', createdAt: 0,
        });
        SUT.publishValidationProblems('m1', [violation('o1', 'r1')], resolver);
        SUT.clearValidationProblems('m1');
        expect(REG.getNodeProblemsSnapshot('v1').map(p => p.kind)).toEqual(['conformance']);
    });
});
