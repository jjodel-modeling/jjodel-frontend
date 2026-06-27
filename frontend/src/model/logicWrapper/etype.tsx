import {
    Pointer,
    Dictionary,
    GObject,
    LogicContext,
    Info, DPointerTargetable, DOperation, ShortAttribETypes, DModelElement, DtoL, LTypeDeclaration, DTypeDeclaration,
    LOperation, NamedArr
} from "../../joiner";
import {
    DClassifier, LClassifier, Pointers, U, L, LModel, LClass, DClass, LEnumerator,
    LModelElement,
    DEnumerator, EcoreParser, LValue, AttribETypes, RuntimeAccessible, Uobj, TRANSACTION, SetFieldAction,
} from "../../joiner";
import {DictArr} from "../../joiner/types";

// ------------------------------------------------------------------
// Recursive descent parser
// Handles: T, Foo, Foo<A,B>, ?, ? extends A & B, ? super A,
//          A & B (intersection), T[], (Foo<A>)[]
// ------------------------------------------------------------------
class GenericTypeParser {
    private pos: number = 0;

    constructor(
        private input: string,
        private classes: NamedArr<LClass>,
        private enums: NamedArr<LEnumerator>,
        private typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>
        ) {}

    parseRef(): GenericType {
        this.skipWS();
        const ref = this.parseIntersectionOrSingle();
        this.skipWS();
        return ref;
    }
    getPos(): number {
        return this.pos;
    }

    // Intersection: A & B & C  (only when not inside a wildcard bound)
    private parseIntersectionOrSingle(): GenericType {
        const first = this.parseArraySuffix();
        this.skipWS();
        if (this.peek() === "&") {
            const operands: GenericType[] = [first];
            while (this.peek() === "&") {
                this.consume("&");
                this.skipWS();
                operands.push(this.parseArraySuffix());
                this.skipWS();
            }
            return new GenericType("intersection", undefined, undefined, [], [], [], operands);
        }
        return first;
    }

    // Array suffix:  T   →  T[]  or  T[][]  etc.
    private parseArraySuffix(): GenericType {
        let ref = this.parsePrimary();
        this.skipWS();
        while (this.input.startsWith("[]", this.pos)) {
            this.pos += 2;
            ref = new GenericType("array", undefined, undefined, [], [], [], [], ref);
            this.skipWS();
        }
        return ref;
    }

    // Primary: wildcard | parenthesised | named (raw/parameterized/typeParam)
    private parsePrimary(): GenericType {
        this.skipWS();

        // Parenthesised group — used before [] in serialization e.g. (Map<K,V>)[]
        if (this.peek() === "(") {
            this.consume("(");
            const inner = this.parseRef();
            this.skipWS();
            this.consume(")");
            return inner;
        }

        // Wildcard
        if (this.peek() === "?") {
            this.consume("?");
            this.skipWS();
            if (this.tryConsume("extends")) {
                this.skipWS();
                const bounds = this.parseBoundList();
                return new GenericType("wildcard", undefined, undefined, [], bounds, []);
            }
            if (this.tryConsume("super")) {
                this.skipWS();
                const bounds = this.parseBoundList();
                return new GenericType("wildcard", undefined, undefined, [], [], bounds);
            }
            // todo: can a wildcard appear alone "?" ?
            return new GenericType("wildcard");
        }

        // Named: identifier optionally followed by <...>
        const name = this.parseIdentifier();
        if (!name) throw new Error(`Unexpected token at pos ${this.pos}: "${this.input.slice(this.pos, this.pos + 10)}"`);

        this.skipWS();
        if (this.peek() === "<") {
            // Parameterized
            this.consume("<");
            const args: GenericType[] = [];
            this.skipWS();
            if (this.peek() !== ">") {
                args.push(this.parseRef());
                this.skipWS();
                while (this.peek() === ",") {
                    this.consume(",");
                    this.skipWS();
                    args.push(this.parseRef());
                    this.skipWS();
                }
            }
            this.consume(">");
            return new GenericType("parameterized", name, undefined, args);
        }

        // Heuristic: single uppercase letter (or common names) → typeParam, else raw
        let ltarget = this.classes[name] || this.enums[name] || this.typeDeclarations[name];
        const isTypeParam = !!ltarget;
        if (isTypeParam) {
            return new GenericType("typeParam", undefined, ltarget.id);
        }
        return new GenericType("raw", name);
    }

    // Parse a & b & c  — used for wildcard bounds (no nested intersection recursion)
    private parseBoundList(): GenericType[] {
        const bounds: GenericType[] = [this.parseArraySuffix()];
        this.skipWS();
        while (this.peek() === "&") {
            this.consume("&");
            this.skipWS();
            bounds.push(this.parseArraySuffix());
            this.skipWS();
        }
        return bounds;
    }

    // ---- low-level helpers ----

    private peek(): string {
        return this.input[this.pos] ?? "";
    }

    private consume(expected: string): void {
        if (!this.input.startsWith(expected, this.pos))
            throw new Error(`Expected "${expected}" at pos ${this.pos}, got "${this.input.slice(this.pos, this.pos + expected.length)}"`);
        this.pos += expected.length;
    }

    private tryConsume(word: string): boolean {
        const slice = this.input.slice(this.pos, this.pos + word.length);
        const after = this.input[this.pos + word.length];
        if (slice === word && (after === undefined || /\W/.test(after))) {
            this.pos += word.length;
            return true;
        }
        return false;
    }

    private parseIdentifier(): string {
        const match = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(this.input.slice(this.pos));
        if (!match) return "";
        this.pos += match[0].length;
        return match[0];
    }

    private skipWS(): void {
        while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) this.pos++;
    }
}




type List = DClassifier;
type MMAP = DClassifier;
type String = DClassifier;


export type GenericTypeName = string;
export type TYPE =  Pointer<DClassifier> | Pointer<DTypeDeclaration>; // pointer or string like "T", because i can have stuff like K extends V
@RuntimeAccessible("GenericType")
export class GenericType {
    static cname = "GenericType";
    kind: "raw" | "parameterized" | "typeParam" | "wildcard" | "intersection" | "array" | "todo";
    name?: GenericTypeName;
    classifier?: TYPE;
    typeArgs: GenericType[];
    upper: (TYPE | GenericType)[];
    lower: (TYPE | GenericType)[];
    operands: GenericType[];
    componentType?: GenericType;



    static desc_feature: Info = {type: ShortAttribETypes.EString, txt: "Mutually exclusive with this.type, it specified a parametrized type.\n" +
            "The type must be declared in the class definition, and referenced here by name (string). example:" +
            "class Proxy<N>{" +
            "\tprivate originalData: N;\n;" +
            " ... }\n"};
    // validate and fix a tentative object received through API
    private static PointerOrName<T extends DPointerTargetable>(v: any, allowGenericType = false): string | Pointer<T> | undefined {
        if (!v) return undefined;
        let tv = typeof v;
        if (tv === "object") return Pointers.from(v) || (allowGenericType ? GenericType.getter(v) : undefined);
        if (tv === "string") return v;
        return undefined;
    }

    public static desc_class: Info = {type: "GenericType[]", txt: "Type parameters used to extend a superclass with generic typings.\n" +
            "like: class IntegerStack extends Array<Integer> { .. }"}
    public static desc_object: Info = {type: "GenericType", txt: "Type parameters used to create an object whose class have generic typings."}
    public static desc_value: Info = {type: "GenericType", txt: GenericType.desc_object.txt }
    public static descTypeParameters: Info = {type: "TypeDeclaration[]", txt: "Type parameters attached to the classifier, like in HashMap<K, V>"}

    public static getterArr(v?: Partial<GenericType>[]): GenericType[] {
        if (!v) return [];
        if (!Array.isArray(v)) v = [v];
        return v.map( e => GenericType.getter(e)).filter(e=>!!e);
    }
    public static setterArr<T extends DModelElement>(v: GenericType[] | undefined, c: LogicContext<T>, propkey: keyof T & string, thiss: DtoL<T>): boolean {
        v = GenericType.getterArr(v);
        let old  = GenericType.getterArr(c.data[propkey] as any);
        let delta = old && v && Uobj.objectDelta(old, v, true, false);
        if (delta && Object.keys(delta).length === 0) return true;
        TRANSACTION((thiss as any).get_name(c)+"."+propkey, ()=> {
            if (v) SetFieldAction.new(c.data, propkey, delta as any, "+=", false);
            else SetFieldAction.new(c.data, propkey, undefined, '', false);
        }, delta ? delta : old, delta ? undefined : (old ? v : null))
        return true;
    }

    public static getter(v?: Partial<GenericType>): GenericType | undefined{
        if (!v || !v.kind || typeof v.kind !== "string") return undefined;
        let ret = new GenericType(v.kind);
        ret.name = typeof v.name === "string" && v.name ? v.name : undefined;
        ret.classifier = this.PointerOrName<DClass>(v.classifier);
        ret.upper = (v.upper || []).map<GenericType | TYPE>(e=> GenericType.PointerOrName(e, true) as any).filter(e=>!!e);
        ret.lower = (v.lower || []).map<GenericType | TYPE>(e=> GenericType.PointerOrName(e, true) as any).filter(e=>!!e);
        ret.operands = (v.operands || []).map(e=> GenericType.getter(e)).filter(e=>!!e);
        ret.typeArgs = (v.typeArgs || []).map(e=> GenericType.getter(e)).filter(e=>!!e);
        ret.componentType = GenericType.getter(v.componentType);
        return ret;
    }

    public static setter(v: GenericType | undefined, c: LogicContext<any>, thiss: LModelElement): boolean {
        v = GenericType.getter(v);
        let old  = GenericType.getter(c.data.genericType);
        let delta = old && v && Uobj.objectDelta(old, v, true, false);
        if (delta && Object.keys(delta).length === 0) return true;
        TRANSACTION((thiss as any).get_name(c)+".genericType", ()=> {
            if (v) SetFieldAction.new(c.data, "genericType", delta, "+=", false);
            else SetFieldAction.new(c.data, "genericType", undefined, '', false);
        }, delta ? delta : old, delta ? undefined : (old ? v : null))
        return true;
    }

    public static getter_typeParametersArr(v?: Pointer<DTypeDeclaration>[]): DictArr<LTypeDeclaration> {
        return U.toNamedArray(L.fromArr(v || []).filter((e: L)=> !!e));
    }

    public static getter_typeParameters(v?: Partial<TypeDeclaration>): TypeDeclaration | undefined {
        if (!v) return undefined;
        let ret = new TypeDeclaration();
        if (v.name && typeof v.name === "string") ret.name = v.name;
        else return undefined;
        ret.defaultType = GenericType.PointerOrName(v?.defaultType);
        ret.upper = (v.upper || []).map<GenericType | TYPE>(e=> GenericType.PointerOrName(e, true) as any).filter(e=>!!e);
        ret.lower = (v.lower || []).map<GenericType | TYPE>(e=> GenericType.PointerOrName(e, true) as any).filter(e=>!!e);
        let dir = typeof v.direction === "string" ? v.direction.toLowerCase() : undefined;
        switch (dir) {
            case "in":
            case "out":
            case "inout": ret.direction = dir; break;
            default: break;
        }
        return ret;
    }

    public static setter_typeParameters(v: Pointer<DTypeDeclaration>[] | undefined, c: LogicContext<DClass | DOperation>, thiss: LClass | LOperation): boolean {
        let old = c.data.typeParameters;
        v = v ? Pointers.fromArr(v) : undefined;
        let delta = old && v?.length && Uobj.objectDelta(old, v, true, false);
        if (delta && Object.keys(delta).length === 0) return true;
        TRANSACTION((thiss as any).get_name(c)+".typeParameters", ()=> {
            if (v) SetFieldAction.new(c.data, "typeParameters", delta as any, "{}", false);
            else SetFieldAction.new(c.data, "typeParameters", [], '', false);
        }, delta ? delta : old, delta ? undefined : (old ? v : null))
        return true;
    }

/*
    public static setter_typeParameters(v: Partial<TypeDeclaration>[] | undefined, c: LogicContext<DClass | DOperation>, thiss: LModelElement): boolean {
        let old = GenericType.getter_typeParametersArr(c.data.typeParameters);
        v = GenericType.getter_typeParametersArr(v);
        let delta = old && v?.length && Uobj.objectDelta(old, v, true, false);
        if (delta && Object.keys(delta).length === 0) return true;
        TRANSACTION((thiss as any).get_name(c)+".typeParameters", ()=> {
            if (v) SetFieldAction.new(c.data, "typeParameters", delta as any, "+=", false);
            else SetFieldAction.new(c.data, "typeParameters", undefined, '', false);
        }, delta ? delta : old, delta ? undefined : (old ? v : null))
        return true;
    }
*/

    constructor(
        kind: GenericType["kind"],
        classifier?: TYPE,
        name?: GenericTypeName,
        typeArgs?: GenericType[],
        upper?: GenericType["upper"], lower?: GenericType["lower"],
        operands?: GenericType[],
        componentType?: GenericType
    ) {
        this.kind = kind;
        this.classifier = classifier;
        this.name = name;
        this.typeArgs = typeArgs ?? [];
        this.upper = upper ?? [];
        this.lower = lower ?? [];
        this.operands = operands ?? [];
        this.componentType = componentType;
    }

    // ------------------------------------------------------------------
    // Helper: extract a display name from a TYPE (Pointer or plain string)
    // ------------------------------------------------------------------
    private static classifierName(t: TYPE, defaultRet: string = ""): string {
        let tt = typeof t;
        if (tt === "object") return (t as any as LClassifier)?.name || defaultRet;
        if (tt === "string") {
            if (Pointers.isPointer(t)) return L.from(t)?.name || defaultRet;
            else return t || defaultRet;
        }
        return defaultRet;
    }
    // ------------------------------------------------------------------
    // SERIALIZE
    // Produces a human-readable string like:
    //   raw:           "Shape"
    //   parameterized: "Map<String, List<T>>"
    //   typeParam:     "T"
    //   wildcard:      "?", "? extends Foo & Bar", "? super Baz"
    //   intersection:  "A & B & C"
    //   array:         "T[]", "List<T>[]"
    // ------------------------------------------------------------------
    static serializeDict(o: Dictionary<TYPE, GenericType>): string {
        return Object.values(o).map( e => GenericType.serializeJOM(e)).join(", ");
    }

    public static serializeEcore(type: EGenericType, m: LModel, asID = true){ return serializeGenericType(type, m, asID); }
    public static serializeJOM(o0: GenericType | TYPE | LClass): string {
        let to = typeof o0;
        if (to === "string") {
            if (Pointers.isPointer(o0)) return L.from(o0)?.name || "";
            return o0 as any;
        }
        if (to === "object") {
            if ((o0 as any)?.className) return L.from(o0 as LClass)?.name || "";
        }


        let o = o0 as GenericType;
        switch (o.kind) {
            case "raw": {
                if (!o.classifier) throw new Error("raw GenericType missing classifier");
                return GenericType.classifierName(o.classifier);
            }

            case "parameterized": {
                if (!o.classifier) throw new Error("parameterized GenericType missing classifier");
                const base = GenericType.classifierName(o.classifier);
                if (o.typeArgs.length === 0) return base;
                const args = o.typeArgs.map(GenericType.serializeJOM).join(", ");
                return `${base}<${args}>`;
            }

            case "typeParam": {
                if (!o.name) throw new Error("typeParam GenericType missing name");
                return o.name;
            }

            case "wildcard": {
                // upper and lower are mutually exclusive in practice
                if (o.upper.length > 0) {
                    const bounds = o.upper.map(GenericType.serializeJOM).join(" & ");
                    return `? extends ${bounds}`;
                }
                if (o.lower.length > 0) {
                    // Java only allows a single lower bound but we stay general
                    const bounds = o.lower.map(GenericType.serializeJOM).join(" & ");
                    return `? super ${bounds}`;
                }
                return "?";
            }

            case "intersection": {
                if (o.operands.length === 0) throw new Error("intersection GenericType has no operands");
                return o.operands.map(GenericType.serializeJOM).join(" & ");
            }

            case "array": {
                if (!o.componentType) throw new Error("array GenericType missing componentType");
                const inner = GenericType.serializeJOM(o.componentType);
                // Wrap parameterized/intersection in parens for clarity, e.g. (Map<K,V>)[]
                const needsParens = o.componentType.kind === "parameterized"
                    || o.componentType.kind === "intersection";
                return needsParens ? `(${inner})[]` : `${inner}[]`;
            }

            default:
                throw new Error(`Unknown GenericType kind: ${(o as any).kind}`);
        }
    }

    // ------------------------------------------------------------------
    // Parses the same format produced by serialize().
    // Entry point: parse("Map<String, List<? extends Foo>>")
    // ------------------------------------------------------------------
    public static parse(s: string,
                        classes: NamedArr<LClass>,
                        enums: NamedArr<LEnumerator>,
                        typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>
    ): GenericType {
        const trimmed = s.trim();
        const parser = new GenericTypeParser(trimmed, classes, enums, typeDeclarations);
        return parser.parseRef();
    }
    public static parseDeclaration(s: string,
                                   classes: NamedArr<LClass>,
                                   enums: NamedArr<LEnumerator>,
                                   typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>): TypeDeclaration {
        const trimmed = s.trim();
        const parser = new TypeParamDeclParser(trimmed, classes, enums, typeDeclarations);
        return parser.parse();
    }
}




// ------------------------------------------------------------------
// Syntax assumed:
//   [direction] name [extends A] [super B] [= DefaultType]
// e.g.
//   "T"
//   "in T"
//   "out T extends Shape"
//   "inout T extends Shape super Base = DefaultShape"
//   "T = Shape"
// ------------------------------------------------------------------

class TypeParamDeclParser {
    private pos: number = 0;

    constructor(
        private input: string,
        private classes: NamedArr<LClass>,
        private enums: NamedArr<LEnumerator>,
        private typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>
    ) {}

    parse(): TypeDeclaration {
        let ret = new TypeDeclaration();
        this.skipWS();

        // 1. optional direction keyword — must come before the name
        ret.direction = this.parseDirection() as any;
        this.skipWS();

        // 2. type parameter name
        ret.name = this.parseIdentifier();
        if (!ret.name) throw new Error(
            `Expected type parameter name at pos ${this.pos}`
        );

        if (!this.typeDeclarations[ret.name]) {
            this.typeDeclarations.push(ret);
            this.typeDeclarations[ret.name] = ret;
        }
        this.skipWS();

        // 3. extends / super clauses in any order, each at most once

        for (let i = 0; i < 2; i++) {
            if (ret.upper.length === 0 && this.tryConsume("extends")) {
                this.skipWS();
                ret.upper = this.parseBoundList();
                this.skipWS();
            } else if (ret.lower.length === 0 && this.tryConsume("super")) {
                this.skipWS();
                ret.lower = this.parseBoundList();
                this.skipWS();
            } else {
                break;
            }
        }

        // 4. optional default type  "= SomeType"
        if (this.tryConsume("=")) {
            this.skipWS();
            ret.defaultType = this.parseSingleBound();
        }

        return ret;
    }

    // Tries to consume "in" | "out" | "inout" as a direction keyword.
    // Must be followed by whitespace and a valid identifier to avoid
    // consuming a type parameter literally named "in" or "out".
    private parseDirection(): TypeDeclaration["direction"] | undefined {
        for (const candidate of ["inout", "in", "out"] as const) {
            const slice = this.input.slice(this.pos, this.pos + candidate.length);
            const after = this.input[this.pos + candidate.length];
            if (slice === candidate && after !== undefined && /\s/.test(after)) {
                // peek ahead: next non-whitespace must be a valid identifier start
                // (the type parameter name) to confirm this is a direction keyword
                const rest = this.input.slice(this.pos + candidate.length).trimStart();
                if (/^[A-Za-z_$]/.test(rest)) {
                    this.pos += candidate.length;
                    return candidate;
                }
            }
        }
        return undefined;
    }

    private parseBoundList(): GenericType[] {
        const bounds: GenericType[] = [this.parseSingleBound()];
        this.skipWS();
        while (this.tryConsume("&")) {
            this.skipWS();
            bounds.push(this.parseSingleBound());
            this.skipWS();
        }
        return bounds;
    }

    private parseSingleBound(): GenericType {
        const slice = this.input.slice(this.pos);
        const inner = new GenericTypeParser(slice, this.classes, this.enums, this.typeDeclarations);
        const ref   = inner.parseRef();
        this.pos += inner.getPos();
        return ref;
    }

    private tryConsume(word: string): boolean {
        const slice = this.input.slice(this.pos, this.pos + word.length);
        const after = this.input[this.pos + word.length];
        if (slice === word && (after === undefined || /\W/.test(after))) {
            this.pos += word.length;
            return true;
        }
        return false;
    }

    private parseIdentifier(): string {
        const match = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(this.input.slice(this.pos));
        if (!match) return "";
        this.pos += match[0].length;
        return match[0];
    }

    private skipWS(): void {
        while (this.pos < this.input.length && /\s/.test(this.input[this.pos]))
            this.pos++;
    }
}
// A type parameter declaration (the <T extends ...> part in a class or function header)


/*| { kind: "raw";        classifier: TYPE }
// e.g. List (no type args — raw/non-generic use)

| { kind: "parameterized"; classifier: TYPE; typeArgs: GenericType[] }
// e.g. Map<String, List<T>>

| { kind: "typeParam";  name: GenericTypeName }
// e.g. T, K, V — reference to a declared type parameter

| { kind: "wildcard";   upper: TYPE[]; lower: TYPE[] }* /
// e.g. ?, ? extends Foo, ? super Bar
// upper: [] + lower: [] = unbounded ?
// upper: ["Foo"]        = ? extends Foo
// lower: ["Bar"]        = ? super Bar

| { kind: "intersection"; operands: GenericType[] }
// e.g. T extends A & B used as a standalone type (rare but valid in some languages)

| { kind: "array";      componentType: GenericType }
// e.g. T[], List<T>[] — if your platform targets Java-like languages
*/

let type: any;






// T                      simple generic
let simpleT = new GenericType("typeParam", undefined, "T");

// List                         no type args — raw/non-generic use
type = new GenericType("raw", "" as Pointer<List>); // raw keyword can be removed and replaced with "parameterized" with empty parameter array

// List<T>                      simple parameterized
let listType = new GenericType("parameterized", "" as Pointer<List>, undefined, [simpleT]);

// Map<String, List<T>>         nested parameterized
type = new GenericType("parameterized", "" as Pointer<MMAP>, undefined, [
    new GenericType("typeParam", "" as Pointer<String>),
    listType
]);

// Map<K, List<T>>              nested parameterized 2
type = new GenericType("parameterized", "" as Pointer<MMAP>, undefined, [
    new GenericType("typeParam", undefined, "K"),
    listType
]);
// ? extends Foo        upper wildcard
type = new GenericType("wildcard", undefined, undefined, undefined, [
    listType
]);









// Resolver: turns an ecore classifier reference string like
//   "#//Foo"  or  "ecore:EDataType http://...#//EString"
// into your internal TYPE (Pointer or plain name string).
// You must supply this from your model-loading context.
type ClassifierResolver = (ecoreRef: string) => TYPE;

// ------------------------------------------------------------------
// Raw JSON shapes produced by XMI parsing
// ------------------------------------------------------------------

class ECoreGenericType {
    static "eClassifier" =   "eClassifier" as const;
    static "eTypeParameter" = "eTypeParameter" as const;
    static "eTypeArguments" =  "eTypeArguments" as const;
    static "eBounds" =  "eBounds" as const;

    static "eclassifier" =   "eclassifier" as const;
    static "etypeparameter" = "etypeparameter" as const;
    static "etypearguments" =  "etypearguments" as const;
    static "ebounds" =  "ebounds" as const;

    // A wildcard has neither eClassifier nor eTypeParameter
}
function normalizeEcoreKeys<T extends GObject>(go: T, deep = true): T{
    go = {...go};
    for (let k0 in go) {
        if (typeof k0 !== "string") continue;
        let v = go[k0];
        delete go[k0];
        let ks = k0 as string & keyof T;
        ks = ks.toLowerCase();
        if (ks[0] === EcoreParser.XMLinlineMarker) ks = ks.substring(1);
        if (deep && v && typeof v === "object") {
            if (Array.isArray(v)) v = v.map((e: unknown)=> {
                if (!e || typeof e !== "object") return e;
                return normalizeEcoreKeys(e);
            });
            else v = normalizeEcoreKeys(v);
        }
        go[ks] = v;
    }
    return go;
}


// ------------------------------------------------------------------
// Raw JSON shapes produced by XMI parsing
// ------------------------------------------------------------------

interface XmiGenericTypeJson {
    "eclassifier"?:   string;   // present for raw / parameterized / wildcard-bound
    "etypeparameter"?: string;  // present for typeParam references
    "etypearguments"?:  XmiGenericTypeJson | XmiGenericTypeJson[];
    "ebounds"?:         XmiGenericTypeJson | XmiGenericTypeJson[];
    // A wildcard has neither eClassifier nor eTypeParameter
}

//////    parser start




let test = [
    {
        "type": "ecore:EClass",
        "name": "Composite",
        "etypeparameters": [
            {
                "name": "A",
                "ebounds": {
                    "type": "ecore:EGenericType",
                    "eclassifier": "#//List",
                    "etypearguments": [
                        {
                            "type": "ecore:EGenericType",
                            "etypeparameter": "#//Composite/B"
                        }
                    ]
                }
            },
            {
                "name": "B",
                "ebounds": {
                    "type": "ecore:EGenericType",
                    "eclassifier": "#//Dictionary",
                    "etypearguments": [
                        {
                            "type": "ecore:EGenericType",
                            "etypeparameter": "#//Composite/K"
                        },
                        {
                            "type": "ecore:EGenericType",
                            "etypeparameter": "#//Composite/V"
                        }
                    ]
                }
            },
            {
                "name": "K",
                "ebounds": {
                    "type": "ecore:EGenericType",
                    "eclassifier": "ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"
                }
            },
            {
                "name": "V",
                "ebounds": {
                    "type": "ecore:EGenericType",
                    "eclassifier": "#//Number"
                }
            }
        ]
    },
    {
        "type": "ecore:EClass",
        "name": "Dictionary",
        "etypeparameters": [
            {
                "name": "Key"
            },
            {
                "name": "Value"
            }
        ]
    },
];
// g

type ResolveClassifierFn = (ref: Pointer | string) => LClassifier | null;

// --- Serialization Functions ---


// Expressive semantic aliases mapping to XMI structural roles
type EBound = EGenericType; // eBounds can appear as XMI tag, but the name only comes from the container property, they are actually EGenericType as of contents.
type ETypeArgument = EGenericType;
type EGenericSuperTypes = EGenericType;
type EUpperBound = EGenericType;
type ELowerBound = EGenericType;

// Structural application
export class ETypeParameter { // K extends ...
    name!: string;
    ebounds!: EBound[];
}
export class TypeDeclaration {
    name!: string;
    upper!: (GenericType | TYPE)[];
    lower!: (GenericType | TYPE)[];
    direction!: "in" | "out" | "inout"; // also called variance: Input (contravariant) or an Output (covariant).
    defaultType?: GenericType | TYPE;
    constructor() {
        this.upper = [];
        this.lower = [];
        this.direction = "inout";
        this.defaultType = undefined;
        this.name = "T";
    }
}

// ? type TypeDecl = EGenericType;
// ? type TypeFill = ETypeParameter;


class EGenericType {
    elowerbound?: ELowerBound;
    eupperbound?: EUpperBound;
    etypearguments?: ETypeArgument[]; // containment, assign a value to a generic type, can only appear to fill slots in extending a egenericsupertype
    // non-containment:
    erawtype!: string | Pointer<DClassifier>;
    eclassifier?: string | Pointer<DClassifier>; // mutually exclusive with etypeparameter
    // SINGLE type used for typing features with a generic type, like: class Tree<T>{ public node:T }
    // etypeparameter is mutually exclusive with eclassifier
    etypeparameter?: Pointer<any/*ETypeParameter*/>; // actually a string, ecore style pointer to ETypeParameter!
}
// public class Repository<T extends Number> extends AbstractData<T, String> { }
//                         T = ETypeParameter declaration,
//                                                  AbstractData<T, String> = EGenericSuperTypes(EGenericType)
//                                                                T, String = 2 different eTypeParameter
// class -> eGenericSuperTypes eIDAttribute (todo add this)


// (class | operation) --> eTypeParameter --> eBounds
// eGenericType --> eTypeArguments

// (ETypeParameter, ETypedElement) --> eGenericType

/**
 * Serializes a GObject structure back into a Java-like generic declaration string.
 */
interface EcoreClassJSON {
    type?: string;
    name?: string;
    version?: string;
    nsprefix?: string;
    nsuri?: string;
    abstract?: string;
    eclassifiers?: GObject[];
    ebounds?: GObject;
    eclassifier?: Pointer;

    etypeparameters?: ETypeParameter[];
    // non contain?
    egenericsupertypes?: EGenericSuperTypes[]; // only references, assign a value to a eTypeParameter.
    // class can only do it when extending, like: class C extends List<String>{}
}

function resolveClassifier(s: string, m: LModel): LClassifier | null{
    // as ecore primitive
    let ptr = U.solveEcoreType(s, true);
    if (ptr) return L.from(ptr) || null;
    if (Pointers.isPointer(s)) return L.from(s) || null;
    else return LValue.resolveReference(s, m) as any || null;
}

function resolveClassifierName(s: string, m: LModel, asID: boolean = true): string | null {
    // as class eid
    let lc =  resolveClassifier(s, m);
    let fallbackRet = null;
    if (lc && typeof lc === "object") return lc[asID ? "id" : "name"] || fallbackRet;
    if (typeof lc === "string") s = lc;
    // string fallback for ecore-style pointers pointing to a generic type (not in jom model)
    const fragment = s.includes("#") ? s.split("#")[1] : s;
    return fragment.split("/").pop() || fallbackRet;
}

export function serializeETypeParameter(arr: ETypeParameter[], m: LModel, asID: boolean = true ): string | null {
    const fallback = null;
    arr = normalizeArray(arr);
    if (!arr?.length) return fallback;
    return arr.map((param) => {
        let paramStr = param.name || fallback;

        // Check if the parameter has an upper bound (extends clause)
        if (param.ebounds) {
            const boundStr = normalizeArray(param.ebounds).map(b=>serializeGenericType(b, m, asID) || fallback).join( " & ");
            if (boundStr) paramStr += ` extends ${boundStr}`;
        }
        return paramStr;
    }).join(", ")
}

/**
 * Helper function to recursively serialize ebounds / etypearguments GObjects.
 */
export function serializeGenericType(gType: EBound, m: LModel, asID: boolean = true): string | null {
    const fallback = null;
    if (!gType) return fallback;
    gType = normalizeEcoreKeys(gType);

    // NB: eclassifier and etypeparameter are mutually exclusive: (public next: List) vs (public next: T)
    // Case 1: The generic type points to a concrete classifier (e.g., #//List)
    if (gType.eclassifier) {
        const baseName = resolveClassifierName(gType.eclassifier, m, asID) || fallback;
        // if (!baseName) return fallback;
        // If it has nested type arguments (e.g., List<B>), process them recursively
        let args: string = "";
        let arr = normalizeArray(gType.etypearguments);
        if (arr && arr.length > 0) {
            args = arr.map((arg) => serializeGenericType(arg, m, asID) || fallback)
                .join(", ");
        }
        return baseName + (args.length ? `<${args}>` : "");
    }

    // Case 2: The generic type points to a local type parameter reference (e.g., #//Composite/B)
    if (gType.etypeparameter) {
        return resolveClassifierName(gType.etypeparameter, m, asID) || fallback;
    }

    // Case 3: Wildcards (? / ? extends T / ? super T)
    // Neither eclassifier nor etypeparameter is set here
    if (gType.eupperbound) return `? extends ${serializeGenericType(gType.eupperbound, m, asID) || fallback}`;
    if (gType.elowerbound) return `? super ${serializeGenericType(gType.elowerbound, m, asID) || fallback}`;
    // Pure wildcard: List<?>
    return "?";
}

let windoww = window as any;
windoww.serializeGenericType = serializeGenericType;
windoww.serializeETypeParameter = serializeETypeParameter;
windoww.test = test;
setTimeout(()=>{

windoww.jsonn = windoww.XMI.toJSON(`<?xml version="1.0" encoding="UTF-8"?>
<ecore:EPackage xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" name="generics_example" nsURI="http://www.example.org/generics_example"
    nsPrefix="generics_example">
  
  <!-- Example of ETypeParameter definition on an EClass -->
  <eClassifiers xsi:type="ecore:EClass" name="Repository">
    <eTypeParameters name="T"/>
    <eStructuralFeatures xsi:type="ecore:EReference" name="elements" upperBound="-1">
      <!-- Example of EGenericType referencing an ETypeParameter -->
      <eGenericType eTypeParameter="#//Repository/T"/>
    </eStructuralFeatures>
  </eClassifiers>

  <!-- Example of EClass that binds a specific type to a generic class using EGenericType -->
  <eClassifiers xsi:type="ecore:EClass" name="StringRepository" eSuperTypes="#//Repository">
    <eGenericSuperTypes eClassifier="#//Repository">
      <!-- Example of EGenericType specifying the type argument for the super type -->
      <eTypeArguments eClassifier="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"/>
    </eGenericSuperTypes>

  </eClassifiers>

  <!-- Example of ETypeParameter definition on an EOperation -->
  <eClassifiers xsi:type="ecore:EClass" name="UtilityContainer">
    <eOperations name="transform" upperBound="-1">
      <eTypeParameters name="E"/>
      <!-- The operation returns a list of E generic types -->
      <eGenericType eTypeParameter="#//UtilityContainer/transform/E"/>
      <eParameters name="input" upperBound="-1">
        <!-- The operation accepts a list of E generic types -->
        <eGenericType eTypeParameter="#//UtilityContainer/transform/E"/>
      </eParameters>
    </eOperations>
  </eClassifiers>

</ecore:EPackage>
`);
}, 1000);
// c
/*
function xmiToJavaString(
    node: XmiGenericTypeJson,
    resolveClassifier: ClassifierResolver,
    resolveTypeParam: (path: string) => string,  // resolves "../0/Container/0" → "T"
    mode:"name" | "id" | "jsx" = "name"
): string | null{
    const classifierRef  = node[ECoreGenericType.eclassifier];
    const typeParamRef   = node[ECoreGenericType.etypeparameter];
    const typeArgs   = normalizeArray(node[ECoreGenericType.etypearguments]);
    const bounds     = normalizeArray(node[ECoreGenericType.ebounds]);
    let useID = mode === "id";
    let useJSX = mode === "jsx";

    // 1. type parameter reference  →  T
    if (typeParamRef !== undefined) {
        return resolveTypeParam(typeParamRef);
    }

    // 2. wildcard
    if (classifierRef === undefined) {
        if (bounds.length === 0) return "?";
        const boundStr = bounds
            .map(b => xmiToJavaString(b, resolveClassifier, resolveTypeParam))
            .join(" & ");
        return `? extends ${boundStr}`;
        // note: Ecore has no lower bound / super, so we never emit "? super ..."
    }

    // 3. raw or parameterized
    let lclassifier: LClassifier | null = resolveClassifier(classifierRef);
    const name = (useID ? lclassifier?.id : lclassifier?.name) || classifierRef;

    if (typeArgs.length === 0) return name;

    const argsStr = typeArgs
        .map(a => xmiToJavaString(a, resolveClassifier, resolveTypeParam))
        .join(", ");
    return `${name}<${argsStr}>`;
}

function xmiTypeParamToJavaString(
    node: XmiTypeParameterJson,
    resolveClassifier: ClassifierResolver,
    resolveTypeParam: (path: string) => string
): string {
    const name   = node["@_name"];
    const bounds = normalizeArray(node["eBounds"]);

    if (bounds.length === 0) return name;
    // e.g.  T extends Shape & Bidimensional
    const boundsStr = bounds
        .map(b => xmiToJavaString(b, resolveClassifier, resolveTypeParam))
        .join(" & ");
    return `${name} extends ${boundsStr}`;
}
// ------------------------------------------------------------------
// STEP 2 — Java string → GenericTypeRef
//          reuses the GenericTypeParser from previous discussion
// ------------------------------------------------------------------

function javaStringToGenericTypeRef(
    javaStr: string,
    scopeTypeParams: Set<string> = new Set()
): GenericTypeRef {
    // Swap the heuristic single-uppercase-letter detection for an explicit
    // scope set so callers control exactly which names are type parameters.
    const parser = new ScopedGenericTypeParser(javaStr, scopeTypeParams);
    return parser.parseRef();
}

// ------------------------------------------------------------------
// COMPOSED — XMI JSON → GenericTypeRef
// ------------------------------------------------------------------

function xmiToGenericTypeRef(
    node: XmiGenericTypeJson,
    resolveClassifier: ClassifierResolver,
    resolveTypeParam: (path: string) => string,
    scopeTypeParams: Set<string> = new Set()
): GenericTypeRef {
    const javaStr = xmiToJavaString(node, resolveClassifier, resolveTypeParam);
    return javaStringToGenericTypeRef(javaStr, scopeTypeParams);
}

// ------------------------------------------------------------------
// ScopedGenericTypeParser
// Replaces the heuristic uppercase-letter detection with an explicit
// set of in-scope type parameter names supplied by the caller.
// Everything else is identical to GenericTypeParser.
// ------------------------------------------------------------------

class ScopedGenericTypeParser {
    private pos: number = 0;

    constructor(
        private input: string,
        private scopeTypeParams: Set<string>
    ) {}

    parseRef(): GenericTypeRef {
        this.skipWS();
        const ref = this.parseIntersectionOrSingle();
        this.skipWS();
        return ref;
    }

    private parseIntersectionOrSingle(): GenericTypeRef {
        const first = this.parseArraySuffix();
        this.skipWS();
        if (this.peek() === "&") {
            const operands: GenericTypeRef[] = [first];
            while (this.peek() === "&") {
                this.consume("&");
                this.skipWS();
                operands.push(this.parseArraySuffix());
                this.skipWS();
            }
            return new GenericTypeRef("intersection", undefined, undefined, [], [], [], operands);
        }
        return first;
    }

    private parseArraySuffix(): GenericTypeRef {
        let ref = this.parsePrimary();
        this.skipWS();
        while (this.input.startsWith("[]", this.pos)) {
            this.pos += 2;
            ref = new GenericTypeRef("array", undefined, undefined, [], [], [], [], ref);
            this.skipWS();
        }
        return ref;
    }

    private parsePrimary(): GenericTypeRef {
        this.skipWS();

        if (this.peek() === "(") {
            this.consume("(");
            const inner = this.parseRef();
            this.skipWS();
            this.consume(")");
            return inner;
        }

        if (this.peek() === "?") {
            this.consume("?");
            this.skipWS();
            if (this.tryConsume("extends")) {
                this.skipWS();
                const bounds = this.parseBoundList();
                return new GenericTypeRef("wildcard", undefined, undefined, [], bounds, []);
            }
            if (this.tryConsume("super")) {
                this.skipWS();
                const bounds = this.parseBoundList();
                return new GenericTypeRef("wildcard", undefined, undefined, [], [], bounds);
            }
            return new GenericTypeRef("wildcard");
        }

        const name = this.parseIdentifier();
        if (!name) throw new Error(
            `Unexpected token at pos ${this.pos}: "${this.input.slice(this.pos, this.pos + 10)}"`
        );

        this.skipWS();

        if (this.peek() === "<") {
            this.consume("<");
            const args: GenericTypeRef[] = [];
            this.skipWS();
            if (this.peek() !== ">") {
                args.push(this.parseRef());
                this.skipWS();
                while (this.peek() === ",") {
                    this.consume(",");
                    this.skipWS();
                    args.push(this.parseRef());
                    this.skipWS();
                }
            }
            this.consume(">");
            return new GenericTypeRef("parameterized", name, undefined, args);
        }

        // explicit scope check replaces the heuristic
        if (this.scopeTypeParams.has(name)) {
            return new GenericTypeRef("typeParam", undefined, name);
        }
        return new GenericTypeRef("raw", name);
    }

    private parseBoundList(): GenericTypeRef[] {
        const bounds: GenericTypeRef[] = [this.parseArraySuffix()];
        this.skipWS();
        while (this.peek() === "&") {
            this.consume("&");
            this.skipWS();
            bounds.push(this.parseArraySuffix());
            this.skipWS();
        }
        return bounds;
    }

    private peek(): string { return this.input[this.pos] ?? ""; }

    private consume(expected: string): void {
        if (!this.input.startsWith(expected, this.pos))
            throw new Error(
                `Expected "${expected}" at pos ${this.pos}, got "${this.input.slice(this.pos, this.pos + expected.length)}"`
            );
        this.pos += expected.length;
    }

    private tryConsume(word: string): boolean {
        const slice = this.input.slice(this.pos, this.pos + word.length);
        const after = this.input[this.pos + word.length];
        if (slice === word && (after === undefined || /\W/.test(after))) {
            this.pos += word.length;
            return true;
        }
        return false;
    }

    private parseIdentifier(): string {
        const match = /^[A-Za-z_$][A-Za-z0-9_$]*/
/*.exec(this.input.slice(this.pos));
        if (!match) return "";
        this.pos += match[0].length;
        return match[0];
    }

    private skipWS(): void {
        while (this.pos < this.input.length && /\s/.test(this.input[this.pos]))
            this.pos++;
    }
}




*/



























// XMI parsers emit a single object when there is one child,
// and an array when there are multiple. Normalise to always array.
function normalizeArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
}
