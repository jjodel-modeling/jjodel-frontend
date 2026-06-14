
// 'describe' groups related tests together
import {Dictionary, GenericType, GObject, U} from "../joiner";

describe('test generic type api', () => {

    // A basic test case checking for an exact match
    test('should parse ecore structure to jom typing structure', () => {

    });
    test('should parse string to jpm typing structure', () => {
        let classes = U.toNamedArray([ {name: "List", id:"ListID"}, {name: "Human", id:"HumanID"}] as any)  as any;
        let enumerators = U.toNamedArray([] as any) as any;
        let obj = GenericType.parse("List<T>", classes, enumerators)
        let s2 = GenericType.serialize(obj);

        let s = "List<T>";
        expect(s2).toBe(s);
    });

    // Another test case checking negative numbers
    test('should correctly add negative numbers', () => {
        expect(-2).toBe(-2);
    });

});


// NB: cannot actually run the tests with vitest because it fails on the imports.
// so i'm making my run-time tests in browser

function describe(name: string, fn: ()=>any) { fn(); }
function test(name: string, fn: ()=>any): any {
    MyTest.all[name] = fn;
}

type TestFN = ()=>any;
export class MyTest{
    static all: Dictionary<string, TestFN> = {};
    static run(name: string) {
        if (name) {
            console.log("Testing: "+name);
            MyTest.all[name]();
            return;
        }
        for (let k in MyTest.all) {
            console.log("Testing all: "+k);
            MyTest.all[k]();
        }
    }
}

(window as any).MyTest = MyTest;
(window as any).T = MyTest;
(window as any).test = MyTest;