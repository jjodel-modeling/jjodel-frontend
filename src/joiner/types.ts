// export type Class = { new(...args: any[]): any; };
import type {Pointer, RuntimeAccessibleClass, ShortAttribETypes} from "../joiner";
import {
    DGraphElement,
    DPointerTargetable,
    DState,
    DUser,
    LAttribute,
    LClass,
    LEdge,
    LEdgePoint,
    LEnumerator,
    LEnumLiteral,
    LGraph,
    LGraphElement,
    LGraphVertex,
    LModel,
    LObject,
    LOperation,
    LPackage,
    LParameter,
    LReference,
    LValue,
    LVertex,
    LVoidEdge,
    LVoidVertex
} from "../joiner";
import type React from "react";
import {ReactNode} from 'react';

export type double = number;
export type float = number;
export type int = number;
export type byte = number;
export type uint = number;
export type ubyte = number;
export type ratio = number; // [0, 1]
export type percent = number; // [0, 1]
export type degree = number;
export type radian = number;

export declare type Class<CtorArgs extends any[] = any[], InstanceType = {}, StaticType = {}, IsAbstract = false> = (abstract new (...args: any[]) => InstanceType) & StaticType;
export declare type CClass<CtorArgs extends any[] = any[], InstanceType = {}, StaticType = {}, IsAbstract = false> = (new (...args: any[]) => InstanceType) & StaticType;
interface Caller { caller: any; }
interface Bind { bind: any; }
interface Apply { apply: any; }
interface Call { call: any; }
export type Function =  Caller | Bind | Apply | Call;
export type Function2 =  (...a: any) => any;
export type Constructor<InstanceType = any> = (new (...a: any) => InstanceType) & {__proto__?: Constructor<InstanceType> & GObject};
export type AbstractConstructor<InstanceType = any> = (GObject | (new (...a: any) => InstanceType)) & {__proto__?: Constructor<InstanceType> & GObject};
export type Temporary = any;
export type Nullable<T> = T | null
export type UnixTimestamp = number;
interface NoCaller { caller?: never; }
interface NoBind { bind?: never; }
interface NoApply { apply?: never; }
interface NoCall { call?: never; }


export type orArr<T> = T | T[];
export type unArr<T extends any[] | any> = T extends any[] ? T[0] : T;

// type primitiveType = string | number | boolean | symbol | null | undefined;
export type PrimitiveType = string | number | boolean | null | undefined;
type NotAFunction = NoCaller | NoBind | NoApply | NoCall;
type NotFunction = GObject & NotAFunction | PrimitiveType;
export type Info = {
    txt: ReactNode,
    label?: ReactNode,
    type?: ShortAttribETypes | string; //| GObject<"Enum">,
    readType?: ShortAttribETypes | string | typeof RuntimeAccessibleClass,
    writeType?: ShortAttribETypes | string | typeof RuntimeAccessibleClass,
    obsolete?: boolean, // hidden because is about to be removed
    hidden?: boolean, // hidden for other reason (like autogeneration is faulty and is manually generated)
    todo?: boolean, // features that should not be listed yet in the view editor
    isGlobal?: boolean, // for things that are common to all graph elements like jsx
    isNode?: boolean,
    isEdge?: boolean,
    isEdgePoint?: boolean,
    enum?: GObject, // todo: remove or use it
    pattern?: string // regexp validation
    min?: number; // for numeric types
    max?: number; // for numeric types
    positive?: boolean; // for numeric types
    digits?: number; // for decimal types validation
    step?: number// for decimal types numeric spinner increase

};


export type Empty = any;
export type UObject = { [key: string]: unknown; }
export type GObject<DocSubType = ''> = DocSubType extends object ? { [key: string]: any; } & DocSubType : { [key: string]: any; };
export type RawObject = { [key: string]: NotFunction; };
// Json<T> = oggetto con le chiavi di T senza le funzioni (post deserializzazione)
export type Json<T extends GObject = RawObject> =
        {[key in keyof T]: T[key] extends Function ? never : (T[key] extends symbol ? "symbol" :
            Exclude<T[key], symbol>); }
        ;

// export type Dictionary<K extends keyof any, T> = { [P in K]: T; };
export type Dictionary<K extends keyof GObject = any, V = any> = { [P in K]: V; } & { _subMaps?: V};
// _subMaps type *actually just Dict<str, boolean> but if i set it as bool and access a random element of the map it will be typed as boolean | V*/
export type DocString<T, COMMENT = ''> = string;
export type NotFound = null;
export const NotFoundv = null as NotFound;
export type nstring = null | string;
export type nnumber = null | number;
export type nbool = null | boolean;
export type bool = boolean;
export type TODO<T = any> = any;
export type NonEmptyString = Exclude<string, ''>;
export enum EdgeBendingMode {
    "Line"="L", // end
    "Bezier_quadratic"="Q", // bending1, end
    "Bezier_cubic"="C", // bending1, bending2, end
    "Bezier_cubic_mirrored"="S", // bending1, end // when there are multiple bezier curves on a row, this takes a bendingpoint1 from the last bezier curves mirrored https://css-tricks.com/svg-path-syntax-illustrated-guide/
    "Bezier_quadratic_mirrored"="T", // end // when there are multiple bezier curves on a row, this takes a bendingpoint1 from the last bezier curves mirrored https://css-tricks.com/svg-path-syntax-illustrated-guide/
    "Elliptical_arc" = "A",// x y, rot, arc sweep, x y.  x,y are coords. rot is angle [0, 360), arc & sweep are {0,1}
    // can do elliptical arc with a single EP. rotation i take it from rotating the actual EP. arc & sweep i take it from node state (maybe rotation too)
    "Bezier_QT"="QT", // first a Quadratic, then N quadratic mirrored
    "Bezier_CS"="CS", // first a Quadratic, then N quadratic mirrored
}
export enum EdgeGapMode {
    "gap" = "gap",
    "autoFill" = "autoFill",
    "lineFill" = "lineFill",
    "arcFill" = "arcFill",
    "center" = "center",
    "average" = "average",
}
export enum EMeasurableEvents {
    // data
    onDataUpdate = "onDataUpdate",
    // drag
    onDragStart = "onDragStart",
    onDragEnd = "onDragEnd",
    whileDragging = "whileDragging",
    // resize
    onResizeStart = "onResizeStart",
    onResizeEnd = "onResizeEnd",
    whileResizing = "whileResizing",
    // rotate
    onRotationStart = "onRotationStart",
    onRotationEnd = "onRotationEnd",
    whileRotating = "whileRotating",
}
// export type Subtract<T, K> = {  [L in Exclude<keyof T, K>]: T[L] };
// Or alternatively, and more concisely, as:

// export type Subtract<T, K> = Pick<T, Exclude<keyof T, K>>;
export type Subtract<T, K> = Omit<T, keyof K>;
export type Overlap<T1, T2> =  Omit<T1, keyof T2> & T2;





// tipo puramente documentazionale, è solo una stringa o array di stringhe
/*export type Pointer<T extends DPointerTargetable = DPointerTargetable, lowerbound = number, upperbound = number | string, RET = LPointerTargetable> =
    upperbound extends 'N' ? string[] : (
    upperbound extends 0 ? never : (
    lowerbound extends 0 ? (string | undefined | null) : string)); // & {[Symbol.iterator]: () => IterableIterator<string>};
*/
declare global  {
    interface ProxyConstructor {
        new <TS extends object, TT extends object = TS>(target: TS, handler: ProxyHandler<TS>): TT;
        // official flawed definition: new <T extends object>(target: T, handler: ProxyHandler<T>): T;
    }

}


// export type Proxyfied<T extends object> = T | GObject;// | T;

export type Proxyfied<T extends object> = UObject & T;
export const windoww: typeof window & GObject= window;
export type InOutParam<T> = T;

export type IsActually<T> = any; // for some reason typescript complains about circular type references? this is a workaround

type KeysnotOfType<T, TT> = { [P in keyof T as (T[P] extends TT ? never : P)]: T[P] };
type ObjectWithoutStrings<T> = {
    [P in keyof T as (T[P] extends string ? never : (T[P] extends string[] ? never : P))]: T[P] // working on arr, keeps single ptrs
};
type pureStringsNoPointers<T> = {
    [P in keyof T as ( T[P] extends Pointer ? (Pointer extends T[P] ? P : (never)): never)]: T[P]
};
export type ObjectWithoutPointers<T> = Omit<ObjectWithoutStrings<T> & pureStringsNoPointers<T>, 'pointedBy' | '_storePath'>

type refkeys = "parent" | "father" | "classifiers" | "children" | "classes" | "packages" | "subpackages" | "annotations" | ""
    | "type" | "attributes" | "references" | "operations" | "parameters" | "..... much more"

export type InitialSizeField = number ;// | ((segment: EdgeSegment) => number);
export type InitialVertexSizeObj = Partial<{
    id?: DocString<"Just something to be used as a react key. doesn't need to be a proper Pointer id">,
    index?: number, // where the EdgePoint should be inserted
    w: InitialSizeField, h: InitialSizeField, x: InitialSizeField, y: InitialSizeField}>;
export type InitialVertexSizeFunc = ((parent: LVoidEdge|LGraphElement, thiss: LVoidVertex|LEdgePoint)=>InitialVertexSizeObj);
export type InitialVertexSize =  undefined | InitialVertexSizeObj | InitialVertexSizeFunc; // | ((segment: EdgeSegment) => privateTempIVS);
export type Dependency = {
    root: keyof DState,
    obj: Pointer<DPointerTargetable, 0, 1>,
    field: keyof DPointerTargetable|'',
    op: ''|'-='
};
export type Selected = Dictionary<Pointer<DUser>, Pointer<DGraphElement, 0, 1>>;
export type FakeStateProps = any;
export type ApiResponse = {code: number, body: Json|string}
export type DataTypes = LModel|LPackage|LClass|LEnumerator|LAttribute|LReference|LOperation|LParameter|LEnumLiteral|LObject|LValue
export type NodeTypes = LGraph|LGraphVertex|LVoidVertex|LVertex|LGraphElement|LEdge|LEdgePoint;
export interface DefaultProps {key?: string|number, children?: ReactNode}
