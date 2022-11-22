import {DClassifier, DPointerTargetable, LClassifier, LPackage, LPointerTargetable, Pointer, unArr} from "./joiner";

export const fakeexport = {};

type arrayFieldNameTypes<D> = keyof D | `${string & keyof D}[]` | `${string & keyof D}+=` | `${string & keyof D}-=` | `${string & keyof D}.${number}` | `${string & keyof D}[${number}]`;
type AccessModifier = '[]' | '+=' | '-=' | `.${number}` | `[${number}]` | undefined;
class Action{
    isPointer!: boolean;
/*    static new<
        D extends DPointerTargetable,
        T extends (keyof D),
        VAL extends (AM extends undefined ? D[T] : (AM extends '-=' ? number[] : (AM extends '+=' | '[]' | `[${number}]` | `.${number}` ? unArr<D[T]> | D[T] | D[T][] : '_error_'))),
        AM extends AccessModifier = AccessModifier,
        ISPOINTER = "todo: ISPOINTER type = boolean but required only if val is UnArr< string > = string | string[], maybe do with override"
        // T extends arrayFieldNameTypes<D> = any
        >(me: D | Pointer<D>, field: T, val: VAL, subtype?: string | undefined, accessModifier?: AM | undefined, isPointer?: ISPOINTER): boolean;
    static new<
        D extends DPointerTargetable,
        T extends (keyof D),
        AM extends AccessModifier = AccessModifier,
        // T extends arrayFieldNameTypes<D> = any
        >(me: D | Pointer<D>, field: T, val: string | string[], subtype: string | undefined, accessModifier: AM | undefined, isPointer: boolean): boolean;*/
}

/*
function pushactionpointdby() {}

function reducer(a: Action) {
    if (a.isPointer) { pushactionpointdby()}
}


let ptr: Pointer<DClassifier, 0, 1, LClassifier> = null as any;
let ptrarr: Pointer<DClassifier>[] = null as any;
let ptrarr2: Pointer<DClassifier, 1, 'N'> = null as any;
let d: DClassifier = null as any;
let darr: DClassifier[] = null as any;

let Lptr = LPointerTargetable.from(ptr);
let Lptrarr = LPointerTargetable.from(ptrarr);
let Lptrarr2 = LPointerTargetable.from(ptrarr2);
let Ld = LPointerTargetable.from(d);
let Ldarr = LPointerTargetable.from(darr);
*/



/***



Definition of W-interfaces
Proxies are a reflection-based feature of javascript that allows an object to customize the usual behaviour, and the object could have different typing interfaces when read or written.
for example a numeric field inside a proxy could be read as number but accept assigments from strings, while still being a number when read afterward.
L-object are proxies, where the L-classes are defining their read-interface (what they return when they are accessed) and W-classes are defining their writeable interface (what kind of data they accept to modify their internal status)





 i need to make a static function that accepts a class constructor as argument, and mimics the typing of a non-static function in the first argument.
 the following example works except for  _"TS2538: Type 'func\_in\_${any}' cannot be used as an index type."_ which can be suppressed with a //@ts-ignore building a working solution
 ```ts
 class MyClassName{
    static staticcc<T extends typeof MyClassName>(classs: T, ...params: Parameters<T[`func_in_MyClassName`]>): ReturnType<T[`func_in_MyClassName`]> { }
    func_in_MyClassName(a: string, b: boolean, i: number): void { }
}
 ```ts
 but there is an additional step, since the function contain the name of the class, i want to transform
 ```ts
 ...params: Parameters<T[`func_in_MyClassName`]>
 ```ts
 in:

 ```ts
 ...params: Parameters<T[`func_in_${T["name"]}`]>
 ```ts
 but it's not working, because T["name"] gets evaluated generically as "string"

*
*/

class MyClassName {
    thename!: "MyClassName"
}
// @ts-ignore
type GetNameOf<T> = T['thename'];

let a: GetNameOf<MyClassName> = 'MyClassName'; // ok, and accepts only this string.
