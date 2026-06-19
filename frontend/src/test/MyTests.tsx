
// 'describe' groups related tests together
import {Dictionary, GenericType, GObject, U} from "../joiner";



// NB: cannot actually run the tests with vitest because it fails on the imports.
// so i'm making my run-time tests in browser

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

function describe(name: string, fn: ()=>any) { fn(); }
function test(name: string, fn: ()=>any): any {
    MyTest.all[name] = fn;
}

type TestFN = ()=>any;
(window as any).MyTest = MyTest;
(window as any).T = MyTest;
(window as any).test = MyTest;
(window as any).jjsonn = {
    "type": "ecore:EGenericType",
    "eClassifier": "#//Map",
    "eTypeArguments": [
        {
            "comment": "Argument 1: The key type parameter 'T'",
            "type": "ecore:EGenericType",
            "eTypeParameter": "#//MyClass/T"
        },
        {
            "comment": "Argument 2: The value wildcard '? extends List<...>'",
            "type": "ecore:EGenericType",
            "eUpperBound": {
                "type": "ecore:EGenericType",
                "eClassifier": "#//List",
                "eTypeArguments": [
                    {
                        "comment": "Nested Argument: Wildcard '? super Map<...>'",
                        "type": "ecore:EGenericType",
                        "eLowerBound": {
                            "type": "ecore:EGenericType",
                            "eClassifier": "#//Map",
                            "eTypeArguments": [
                                {
                                    "comment": "Deep Argument 1: Concrete class 'String'",
                                    "type": "ecore:EGenericType",
                                    "eClassifier": "#//String"
                                },
                                {
                                    "comment": "Deep Argument 2: Type parameter reference 'B'",
                                    "type": "ecore:EGenericType",
                                    "eTypeParameter": "#//MyClass/B"
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ]
};





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