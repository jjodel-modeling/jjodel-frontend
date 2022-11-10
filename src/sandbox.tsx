export const fakeexport = {};

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
