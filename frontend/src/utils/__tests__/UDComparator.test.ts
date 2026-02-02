/**
 * Tests for UDComparator
 *
 * Run these tests in the browser console or with Jest if configured.
 * To run in console:
 *   window.runUDComparatorTests()
 */

import { compareUsageDeclarations, quickUDCheck, CompareResult } from '../UDComparator';

// Mock L-Proxy objects
function createMockProxy(id: string, name: string, clonedCounter: number = 1): any {
    return {
        id,
        __raw: { id, name, className: 'DClass', clonedCounter },
        name,
        className: 'DClass',
    };
}

// Test utilities
function assertEqual(actual: any, expected: any, testName: string): boolean {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr === expectedStr) {
        console.log(`✅ ${testName}`);
        return true;
    } else {
        console.error(`❌ ${testName}`);
        console.error(`   Expected: ${expectedStr}`);
        console.error(`   Actual: ${actualStr}`);
        return false;
    }
}

function assertTrue(value: boolean, testName: string): boolean {
    if (value) {
        console.log(`✅ ${testName}`);
        return true;
    } else {
        console.error(`❌ ${testName}`);
        return false;
    }
}

function assertFalse(value: boolean, testName: string): boolean {
    return assertTrue(!value, testName);
}

// Test cases
export function runTests(): { passed: number; failed: number } {
    console.group('🧪 UDComparator Tests');
    let passed = 0;
    let failed = 0;

    const count = (result: boolean) => result ? passed++ : failed++;

    // Test 1: Both undefined/null
    count(assertTrue(
        compareUsageDeclarations(undefined, undefined).equal,
        'Both undefined should be equal'
    ));

    count(assertTrue(
        compareUsageDeclarations(null as any, null as any).equal,
        'Both null should be equal'
    ));

    // Test 2: One null, one defined
    count(assertFalse(
        compareUsageDeclarations(undefined, {}).equal,
        'undefined vs {} should not be equal'
    ));

    count(assertFalse(
        compareUsageDeclarations({}, undefined).equal,
        '{} vs undefined should not be equal'
    ));

    // Test 3: Same reference
    const same = { data: createMockProxy('1', 'Test') };
    count(assertTrue(
        compareUsageDeclarations(same, same).equal,
        'Same reference should be equal'
    ));

    // Test 4: Identical primitives
    const ud1 = { name: 'Test', count: 5, active: true };
    const ud2 = { name: 'Test', count: 5, active: true };
    count(assertTrue(
        compareUsageDeclarations(ud1, ud2).equal,
        'Identical primitives should be equal'
    ));

    // Test 5: Different primitive value
    const ud3 = { name: 'Test', count: 5 };
    const ud4 = { name: 'Test', count: 6 };
    const result5 = compareUsageDeclarations(ud3, ud4);
    count(assertFalse(result5.equal, 'Different primitive values should not be equal'));
    count(assertTrue(
        result5.changedKeys?.includes('count') ?? false,
        'Should identify "count" as changed key'
    ));

    // Test 6: L-Proxy with same id and version
    const proxy1a = createMockProxy('abc', 'Class1', 1);
    const proxy1b = createMockProxy('abc', 'Class1', 1);
    const ud6a = { data: proxy1a };
    const ud6b = { data: proxy1b };
    count(assertTrue(
        compareUsageDeclarations(ud6a, ud6b).equal,
        'L-Proxy with same id and version should be equal'
    ));

    // Test 7: L-Proxy with same id but different version (clonedCounter)
    const proxy2a = createMockProxy('abc', 'Class1', 1);
    const proxy2b = createMockProxy('abc', 'Class1', 2);
    const ud7a = { data: proxy2a };
    const ud7b = { data: proxy2b };
    count(assertFalse(
        compareUsageDeclarations(ud7a, ud7b).equal,
        'L-Proxy with different version should not be equal'
    ));

    // Test 8: L-Proxy with different id
    const proxy3a = createMockProxy('abc', 'Class1', 1);
    const proxy3b = createMockProxy('xyz', 'Class2', 1);
    const ud8a = { data: proxy3a };
    const ud8b = { data: proxy3b };
    count(assertFalse(
        compareUsageDeclarations(ud8a, ud8b).equal,
        'L-Proxy with different id should not be equal'
    ));

    // Test 9: Arrays of same length with same content
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 3];
    count(assertTrue(
        compareUsageDeclarations({ items: arr1 }, { items: arr2 }).equal,
        'Arrays with same content should be equal'
    ));

    // Test 10: Arrays of different length
    const arr3 = [1, 2, 3];
    const arr4 = [1, 2, 3, 4];
    count(assertFalse(
        compareUsageDeclarations({ items: arr3 }, { items: arr4 }).equal,
        'Arrays with different length should not be equal'
    ));

    // Test 11: Nested objects
    const nested1 = { outer: { inner: { value: 'test' } } };
    const nested2 = { outer: { inner: { value: 'test' } } };
    count(assertTrue(
        compareUsageDeclarations(nested1, nested2).equal,
        'Nested objects with same values should be equal'
    ));

    // Test 12: Nested objects with different values
    const nested3 = { outer: { inner: { value: 'test1' } } };
    const nested4 = { outer: { inner: { value: 'test2' } } };
    count(assertFalse(
        compareUsageDeclarations(nested3, nested4).equal,
        'Nested objects with different values should not be equal'
    ));

    // Test 13: Skip internal keys (starting with _)
    const withInternal1 = { name: 'Test', _internal: 'a', __raw: {} };
    const withInternal2 = { name: 'Test', _internal: 'b', __raw: {} };
    count(assertTrue(
        compareUsageDeclarations(withInternal1, withInternal2).equal,
        'Should skip keys starting with _'
    ));

    // Test 14: Large arrays use signature comparison
    const largeArr1 = Array.from({ length: 100 }, (_, i) => i);
    const largeArr2 = Array.from({ length: 100 }, (_, i) => i);
    count(assertTrue(
        compareUsageDeclarations({ items: largeArr1 }, { items: largeArr2 }).equal,
        'Large arrays with same signature should be equal'
    ));

    // Test 15: Large arrays with different content
    const largeArr3 = Array.from({ length: 100 }, (_, i) => i);
    const largeArr4 = Array.from({ length: 100 }, (_, i) => i === 50 ? 999 : i);
    // This might pass or fail depending on where the change is (middle vs first/last)
    // Since we sample first, middle, last - changing middle should be detected
    const result15 = compareUsageDeclarations({ items: largeArr3 }, { items: largeArr4 });
    count(assertFalse(
        result15.equal,
        'Large arrays with different middle element should not be equal'
    ));

    // Test 16: quickUDCheck - same proxies
    const quickProxy1 = createMockProxy('test', 'Test', 1);
    const quickProxy2 = createMockProxy('test', 'Test', 1);
    count(assertTrue(
        quickUDCheck({ data: quickProxy1 }, { data: quickProxy2 }),
        'quickUDCheck: same proxies should return true'
    ));

    // Test 17: quickUDCheck - different versions
    const quickProxy3 = createMockProxy('test', 'Test', 1);
    const quickProxy4 = createMockProxy('test', 'Test', 2);
    count(assertFalse(
        quickUDCheck({ data: quickProxy3 }, { data: quickProxy4 }),
        'quickUDCheck: different versions should return false'
    ));

    console.groupEnd();
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

    return { passed, failed };
}

// Performance benchmark
export function runBenchmark(iterations: number = 1000): void {
    console.group('⚡ UDComparator Benchmark');

    const proxy1 = createMockProxy('abc123', 'TestClass', 5);
    const proxy2 = createMockProxy('abc123', 'TestClass', 5);

    const simpleUD1 = { data: proxy1, name: 'test', count: 42 };
    const simpleUD2 = { data: proxy2, name: 'test', count: 42 };

    const complexUD1 = {
        data: proxy1,
        node: createMockProxy('node1', 'Node', 1),
        view: createMockProxy('view1', 'View', 1),
        items: Array.from({ length: 50 }, (_, i) => createMockProxy(`item${i}`, `Item${i}`, 1)),
        nested: { deep: { value: 'test', array: [1, 2, 3] } },
    };
    const complexUD2 = {
        data: proxy2,
        node: createMockProxy('node1', 'Node', 1),
        view: createMockProxy('view1', 'View', 1),
        items: Array.from({ length: 50 }, (_, i) => createMockProxy(`item${i}`, `Item${i}`, 1)),
        nested: { deep: { value: 'test', array: [1, 2, 3] } },
    };

    // Benchmark simple UD
    const startSimple = performance.now();
    for (let i = 0; i < iterations; i++) {
        compareUsageDeclarations(simpleUD1, simpleUD2);
    }
    const simpleTime = performance.now() - startSimple;

    // Benchmark complex UD
    const startComplex = performance.now();
    for (let i = 0; i < iterations; i++) {
        compareUsageDeclarations(complexUD1, complexUD2);
    }
    const complexTime = performance.now() - startComplex;

    // Benchmark quickUDCheck
    const startQuick = performance.now();
    for (let i = 0; i < iterations; i++) {
        quickUDCheck(simpleUD1, simpleUD2);
    }
    const quickTime = performance.now() - startQuick;

    console.log(`Simple UD (${iterations}x): ${simpleTime.toFixed(2)}ms (${(simpleTime/iterations).toFixed(4)}ms/op)`);
    console.log(`Complex UD (${iterations}x): ${complexTime.toFixed(2)}ms (${(complexTime/iterations).toFixed(4)}ms/op)`);
    console.log(`quickUDCheck (${iterations}x): ${quickTime.toFixed(2)}ms (${(quickTime/iterations).toFixed(4)}ms/op)`);

    console.groupEnd();
}

// Expose to window for browser console testing
if (typeof window !== 'undefined') {
    (window as any).runUDComparatorTests = runTests;
    (window as any).runUDComparatorBenchmark = runBenchmark;
}

export default runTests;
