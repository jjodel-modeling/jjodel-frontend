import type {Pointer} from "./classes";

import {DPointerTargetable, LPointerTargetable, NotAString} from "./classes";
import {DClass, DPackage, LClass} from "../model/logicWrapper";

type GenericType<A1, A2, A3> = { something: 'that does not use A1, A2, A3' };

class T{
    class01!: GenericType<string, Date, 1>;
    boolea!: boolean;
}
// type ReplaceKeyTypes<CLASS> = ...?
// replaced is expected to be {class01: }

type UnknownGenericType = Pointer<
    DPointerTargetable, 0|1, 0|1|'N', LPointerTargetable
    >

type ParamsFromGenericType<
    T extends UnknownGenericType
    > = T extends Pointer<infer A1, infer A2, infer A3, infer A4>
    ? [A1, A2, A3, A4]
    : never




class Tlonger{
    attr1!: GenericType<string, Date, 1>;
    attr2!: GenericType<any, 'second generic subtype', null>;
    attr3!: GenericType<'whathever', boolean, 'whathever'>
}
class ExpectedResultFromT{
    attr1!: Date;
    attr2!: 'second generic subtype';
    attr3!: boolean;
}

// type ReplaceKeyTypes0<T> = ({[P in keyof T]: (T[P] extends UnknownGenericType ? ParamsFromGenericType<T[P]>[1] : T[P]) });
// type ReplaceKeyTypes<T> = ({[P in keyof T]: (T[P] extends GenericType<infer A1, infer A2, infer A3> ? A3 : T[P]) });
type ReplacePointers<T> = ({[P in keyof T]:
    (T[P] extends Pointer<infer D, any, any, infer L> ?
        // (UPP extends 0 ? never : (UPP extends 'N' ? L[] : ( LOW extends 0 ? null | L : L)))
        'matched' | L
        : 'failed')
    // | {_og: T[P]}
});
type ReplacePointersid<T extends DPointerTargetable> =
    T["id"] extends Pointer<infer D, any, any, infer L> ? L : 'failed';
    // | {_og: T[P]}
;
// function fromPointer0<T extends {id: Pointer<infer D, any, any, infer L>}>(){}
function fromPointer<T extends Pointer<DPointerTargetable, 1, 1, LPointerTargetable>, LL extends (T extends Pointer<infer D, any, any, infer L> ? L : 'undefined')>(ptr: T): LL{
return null as any;
}

let a: DPackage = null as any;
let aa = fromPointer(a.id as Pointer<DClass, 1, 1, LClass>);
let ptr: Pointer<DClass, 1, 1, LClass> = null as any;
// NB: questo credo sia impossibile ottenerlo a meno di fare l'id che non estende più stringa. l'extend risulta true per qualsiasi cosa metti al posto di <DClass, 1, 1, LClass>, anche se è un puntatore a package
let p2: typeof a.id extends Pointer<DClass, 1, 1, LClass> ? DClass : 'err' = null as any;



type ReplacePointers0<T> = ({[P in keyof T]: (T[P] extends UnknownGenericType ?
    ParamsFromGenericType<T[P]> : T[P]
    // (UPP extends 0 ? never : (UPP extends 'N' ? L[] : ( LOW extends 0 ? null | L : L)))
    //'matched': 'failed'
    )});
/*
let result: ReplacePointers<DClass> = null as any;
type lclass2 = ReplacePointers0<DClass>;

let ll: lclass2 = null  as any;
let d: DClass = null as any;
let aaaaaaaaaaaaa = result.operations;
let b = aaaaaaaaaaaaa;
// let t = result.operations=null;
let wrong = {_surelywrong: true};
ll.defaultValue = wrong;
*/
