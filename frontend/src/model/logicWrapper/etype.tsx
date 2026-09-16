import type {
    Pointer,
    Dictionary,
    GObject,
    LogicContext,
    orArr,
    DtoL,
    NamedArr,
} from "../../joiner";
import {
    DClassifier, LClassifier, Pointers, U, L, LModel, LClass, DClass, LEnumerator,
    LModelElement,
    DEnumerator, EcoreParser, LValue, AttribETypes, RuntimeAccessible, Uobj, TRANSACTION, SetFieldAction,
    Info, DPointerTargetable, DOperation, ShortAttribETypes, DModelElement, LTypeDeclaration, DTypeDeclaration,
    LOperation, DModel, LPointerTargetable, ECoreAnnotation,
    Uarr, Log,
    Alias,
    DState,
    T2M
} from "../../joiner";

const OPERATOR_MAP: Dictionary<string, keyof GenericType> = {
    "&": "operandsAnd",
    "|": "operandsOr",
    "\\": "operandsDifference",
    "~": "operandsComplement",
    // ",": "operandsTuple",
};
const OPERATORS: { symbol: string; field: keyof GenericType }[] = [
    // { symbol: ",",  field: "operandsTuple" },
    { symbol: "|",  field: "operandsOr" },          // lowest precedence
    { symbol: "&",  field: "operandsAnd" },
    { symbol: "\\", field: "operandsDifference" },
    { symbol: "~",  field: "operandsComplement" },   // highest precedence
];

// ------------------------------------------------------------------
// Recursive descent parser
// Handles: T, Foo, Foo<A,B>, ?, ? extends A & B, ? super A,
//          A & B (intersection), T[], (Foo<A>)[]
// ------------------------------------------------------------------
class GenericTypeParser {
    private pos: number = 0;

    // ------------------------------------------------------------------
    // Entry point: TypeDeclaration  e.g. "out T extends Shape super Base = Default"
    // ------------------------------------------------------------------
    parseTypeDeclaration(): TypeDeclaration | null {
        this.skipWS();
        const decl = new TypeDeclaration();

        // 1. optional direction keyword — must come before the name
        const direction = this.parseDirection();
        if (direction) decl.direction = direction;
        this.skipWS();

        // 2. name
        const name = this.parseIdentifier();
        if (!name) { Log.exx(`Expected type parameter name at pos ${this.pos}`, this); return null; }
        decl.name = name;

        // register name so bound expressions can self-reference
        // e.g. "T extends Comparable<T>"
        // we do this by injecting a temporary TypeDeclaration into scope
        // so parsePrimary resolves it as a typeParam rather than raw
        const tempDecl = new TypeDeclaration();
        tempDecl.name = name;
        const wasInScope = this.typeDeclarations[name];
        this.typeDeclarations[name] = tempDecl;

        this.skipWS();

        // 3. extends / super clauses in any order, each at most once
        for (let i = 0; i < 2; i++) {
            if (decl.upper.length === 0 && this.tryConsume("extends")) {
                this.skipWS();
                const bounds = this.parseBoundList();
                if (!bounds) return null;
                decl.upper = bounds;
                this.skipWS();
            } else if (decl.lower.length === 0 && this.tryConsume("super")) {
                this.skipWS();
                const bounds = this.parseBoundList();
                if (!bounds) return null;
                decl.lower = bounds;
                this.skipWS();
            } else {
                break;
            }
        }

        // 4. optional default type  "= SomeType"
        if (this.tryConsume("=")) {
            this.skipWS();
            decl.defaultType = this.parseArraySuffix() || undefined;
        }

        // restore scope — remove the temporary entry if it wasn't there before
        if (wasInScope !== undefined) {
            this.typeDeclarations[name] = wasInScope;
        } else {
            delete this.typeDeclarations[name];
        }

        return decl;
    }
    constructor(
        private input: string,
        private classes: NamedArr<LClass>,
        private enums: NamedArr<LEnumerator>,
        private typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>
    ) {
        this.input = typeof input as unknown === "string" ? input.trim() : "";
    }


    // Entry point: GenericType reference  e.g. "Map<String, T[]>"
    parseGenericType(): GenericType | null { return this.parseRef(); }
    protected parseRef(): GenericType | null {
        this.skipWS();
        const ref = this.parseOperatorOrSingle();
        this.skipWS();
        return ref;
    }


    public getPos(): number {
        return this.pos;
    }

    // for all operator parsing with priority and parenthesis handling.
    private parseOperatorOrSingle(): GenericType | null {
        return this.parseAtPrecedence(0);
    }

// Recursive precedence climbing.
// level 0 = loosest (|), level OPERATORS.length = tightest (delegates to unary/primary)
    private parseAtPrecedence(level: number): GenericType | null{
        if (level >= OPERATORS.length) {
            // parses lower priority association (array) and non-operators like wildcard, raw, parameterized.
            return this.parseArraySuffix();
        }

        const { symbol, field } = OPERATORS[level];

        // this recursively calls it at lower precedence associations, until parseArraySuffix is called.
        // which includes checks for non-array association and other kinds of GenericType such as wildcard, raw, parameterized.
        const first = this.parseAtPrecedence(level + 1);
        this.skipWS();
        if (!first) return null;
        if (!this.input.startsWith(symbol, this.pos)) return first;

        const operands: GenericType[] = [first];
        while (this.input.startsWith(symbol, this.pos)) {
            if (!this.consume(symbol)) return null;
            this.skipWS();
            const e = this.parseAtPrecedence(level + 1);
            if (!e) return null;
            operands.push(e);
            this.skipWS();
        }

        const upperLevel = new GenericType("operator");
        (upperLevel as any)[field] = operands;
        return upperLevel;
    }

    // Array suffix:  T   →  T[]  or  T[][]  etc.
    private parseArraySuffix(): GenericType | null {
        let ref = this.parsePrimary();
        if (!ref) return null;
        this.skipWS();
        while (this.input.startsWith("[]", this.pos)) {
            this.pos += 2;
            const upperLevel = new GenericType("array");
            upperLevel.operandsArray = ref;
            ref = upperLevel;
            this.skipWS();
        }
        return ref;
    }

    private parsePrimary(): GenericType | null {
        this.skipWS();

        // parenthesis group — resets to lowest precedence inside
        if (this.peek() === "(") {
            if (!this.consume("(")) return null;
            this.skipWS();
            const inner = this.parseAtPrecedence(0);
            this.skipWS();
            if (!this.consume(")")) return null;
            return inner;
        }

        // wildcard
        if (this.peek() === "?") {
            if (!this.consume("?")) return null;
            this.skipWS();
            // NB: extends and super in a wildcard are mutually exclusive in most languages,
            // so it doesn't need to loop to try consuming both one after another.
            if (this.tryConsume("extends")) {
                this.skipWS();
                const bounds = this.parseBoundList();
                if (!bounds) return null;
                const ret = new GenericType("wildcard");
                ret.upper = bounds;
                return ret;
            }
            if (this.tryConsume("super")) {
                this.skipWS();
                const bounds = this.parseBoundList();
                if (!bounds) return null;
                const ret = new GenericType("wildcard");
                ret.lower = bounds;
                return ret;
            }
            return new GenericType("wildcard");
        }

        // named: raw, parameterized
        const name = this.parseIdentifier();
        if (!name) {
            Log.exx(`GenericTypeParser: Unexpected token at pos ${this.pos}: "${this.input.slice(this.pos, this.pos + 20)}"`, this);
            return null;
        }

        this.skipWS();

        if (this.peek() === "<") {
            // Parameterized
            if (!this.consume("<")) return null;
            const args: GenericType[] = [];
            this.skipWS();
            if (this.peek() !== ">") {
                // type arguments use full precedence reset too
                const e = this.parseAtPrecedence(0);
                if (!e) return null;
                args.push(e);
                this.skipWS();
                while (this.peek() === ",") {
                    if (!this.consume(",")) return null;
                    this.skipWS();
                    const e = this.parseAtPrecedence(0)
                    if (!e) return null;
                    args.push(e);
                    this.skipWS();
                }
            }
            if (!this.consume(">")) return null;
            // eg: Shape<Geom2D>, List<?>
            const ret = new GenericType("parameterized");
            console.log("resolve param for GT", {name, ret});
            ret.classifier = this.resolveClassifierID(name);
            ret.typeArgs = args;
            return ret;
        }
        // eg: Shape, Map, T (target is LClass or LTypeParam)
        const ret = new GenericType("raw");
        console.log("resolve classifier for GT", {name, ret});
        ret.classifier = this.resolveClassifierID(name);
        return ret;
    }

    resolveClassifierID(name: string): Pointer<DClass | DTypeDeclaration> {
        const ltarget = this.classes[name] || this.enums[name] || this.typeDeclarations[name];
        if (ltarget) return ltarget?.id;
        const ptr = U.solveEcoreType(name, true);
        return ptr || name;
    }

    // Parse a & b & c  — used for wildcard bounds (no nested operator recursion)
    // NB: this only handles & because | and other operators are not supported in super or extend clause in most languages.
    private parseBoundList(): GenericType[] | null {
        const e = this.parseArraySuffix();
        if (!e) return null;
        const bounds: GenericType[] = [e];
        this.skipWS();
        while (this.peek() === "&") {
            if (!this.consume("&")) return null;
            this.skipWS();
            const e = this.parseArraySuffix();
            if (!e) return null;
            bounds.push(e);
            this.skipWS();
        }
        return bounds;
    }

    // Tries to consume "in" | "out" | "inout" as a direction keyword.
    // Checks that it is followed by whitespace and then a valid identifier
    // to avoid consuming a type parameter literally named "in" or "out".
    private parseDirection(): TypeDeclaration["direction"] | null | false {
        for (const candidate of ["inout", "in", "out"] as TypeDeclaration["direction"][]) {
            const slice = this.input.slice(this.pos, this.pos + candidate.length);
            const after = this.input[this.pos + candidate.length];
            if (slice === candidate && after !== undefined && /\s/.test(after)) {
                const rest = this.input.slice(this.pos + candidate.length).trimStart();
                if (rest && /[A-Za-z_$]/.test(rest[0])) {
                    this.pos += candidate.length;
                    return candidate;
                }
            }
        }
        return false;
    }

    private peek(): string {
        return this.input[this.pos] ?? "";
    }

    private consume(expected: string): boolean {
        if (!this.input.startsWith(expected, this.pos)) {
            Log.exx(`Expected "${expected}" at pos ${this.pos}, got "${this.input.slice(this.pos, this.pos + expected.length)}"`, this);
            return false;
        }
        this.pos += expected.length;
        return true;
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

export function getClassifiers(c: LogicContext<any> | LModelElement) {
    let l: LModelElement = c as any;
    if (!l.__isProxy) l = (c as LogicContext).proxyObject;

    const model = l.model;
    const classes = model.classes;
    const enums = model.enumerators;
    const typeDecls = (l as LClass | LOperation | LModel).allTypeDeclarations; // not model.typeDeclarations, because it needs to get all typedecls in this element and his ancestors.

    return {model, classes, enums, typeDecls,
        m: model, typeDeclarations: typeDecls, enumerators: enums};
}

// NB: i need all keys to be present for U.closerTo, even if they are undefined. so i cannot use property?: optionals.  or !. They need to exist.
@RuntimeAccessible("GenericType")
export class GenericType {
    static cname = "GenericType";
    kind: "raw" | "parameterized" | "wildcard" | "operator" | "array" | "todo" = "todo";
    // name?: GenericTypeName | Pointer<DTypeDeclaration>;
    classifier: Pointer<DClassifier> | Pointer<DTypeDeclaration> | GenericTypeName | undefined = undefined;
    typeArgs: GenericType[] | undefined = undefined;
    upper: (Pointer<DClassifier> | Pointer<DTypeDeclaration> | GenericType)[] | undefined = undefined;
    lower: (Pointer<DClassifier> | Pointer<DTypeDeclaration> | GenericType)[] | undefined = undefined;
    operandsOr: GenericType[] | undefined = undefined;
    operandsAnd: GenericType[] | undefined = undefined;
    operandsDifference: GenericType[] | undefined = undefined;
    operandsComplement: GenericType[] | undefined = undefined;
    operandsTuple: GenericType[] | undefined = undefined;
    operandsArray: GenericType | undefined = undefined;
    // annotations?: LAnnotation; // removed because i cannot have GenericType contain L-elements

    static test() {
        T2M(L.from(DState.getState().models[0]), "eCore/XMI", `
<?xml version="1.0" ?>
<ecore:EPackage xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" xmi:version="2.0" name="comprehensiveUniverse" nsURI="http://www.example.org/comprehensiveUniverse" nsPrefix="universe">
  <eAnnotations source="http://www.example.org/documentation" references="#//">
    <details key="description" value="This package contains exactly one of each major Ecore structural model element with all properties populated."/>
  </eAnnotations>
  <eClassifiers xsi:type="ecore:EDataType" name="CustomString" instanceClassName="java.lang.String" serializable="true"/>
  <eClassifiers xsi:type="ecore:EEnum" name="AccessLevel">
    <eLiterals name="ADMIN" value="1" literal="ADMINISTRATOR"/>
  </eClassifiers>
  <eClassifiers xsi:type="ecore:EClass" name="IdentifiableElement" abstract="true" interface="false">
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="id" eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//ELong" changeable="true" volatile="false" transient="false" unsettable="false" derived="false" iD="true"/>
  </eClassifiers>
  <eClassifiers xsi:type="ecore:EClass" name="UserAccount" abstract="false" interface="false" eSuperTypes="#//IdentifiableElement">
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="username" eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString" ordered="true" unique="true" lowerBound="1" upperBound="1" changeable="true" volatile="false" transient="false" defaultValueLiteral="anonymous_user" unsettable="false" derived="false" iD="false"/>
    <eStructuralFeatures xsi:type="ecore:EReference" name="profile" eType="#//SecurityProfile" ordered="true" unique="true" lowerBound="0" upperBound="1" changeable="true" volatile="false" transient="false" unsettable="false" derived="false" containment="true" resolveProxies="true"/>
    <eOperations name="changePassword" eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EBoolean" ordered="true" unique="true" lowerBound="1" upperBound="1">
      <eParameters name="newPassword" eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString" ordered="true" unique="true" lowerBound="1" upperBound="1"/>
    </eOperations>
  </eClassifiers>
  <eClassifiers xsi:type="ecore:EClass" name="SecurityProfile"/>
  <eClassifiers xsi:type="ecore:EClass" name="DataRepository" abstract="false" interface="false">
    <eTypeParameters name="T"/>
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="storedData">
 can structuralfeature have nested stuff inside?? 
      <eGenericType eTypeParameter="#//DataRepository/T"/>
    </eStructuralFeatures>
  </eClassifiers>
</ecore:EPackage>

`)
    }
    static documentation() {
        const testt: Dictionary<string, Dictionary<string, Dictionary<string, (...a:any)=>any>>> = {
            GenericType: {
                serialize: {
                    universal: GenericType.serializeGenericType, // string
                    jodel: GenericType.serializeJOM, // string
                    ecore: GenericType.serializeEcore, // string
                },
                parse: {
                    universal: "cannot exist" as any,
                    jodel: GenericType.parse, // GenericType (jom struct)
                    ecore: GenericType.parseToEcore, // EGenericType (ecore struct)
                }
            },

            typeParameters: {
                serialize: {
                    universal: GenericType.serializeTypeDeclaration, // string
                    jodel: GenericType.serializeTypeDeclarationJOM, // string, same as l.toString()
                    jodel2: GenericType.serializeTypeDeclarationJOM_Arr,
                    ecore: GenericType.serializeETypeParameter, // string
                },
                parse: {
                    universal: "cannot exist" as any,
                    "jodel old": GenericType.parseDeclaration_old,
                    jodel: GenericType.parseDeclaration,
                    ecore: GenericType.parseToEcoreDeclaration,
                },
                toL: {
                    from_J: GenericType.parseLDeclaration,
                    from_E: GenericType.parseLDeclaration,
                }
            }
        }
        type Source = "s" | "l" | "e" | "j"; // l = jom logic. j = jom pojo (GenericType, TypeDeclaration), e = ecore xmi/json
        type Target = Source;
        const converterGT: Dictionary<Source, Dictionary<Target, ((...a:any)=>any) | "missing" | "never" | "indirect">> = {} as any;
        const converterTD: Dictionary<Source, Dictionary<Target, ((...a:any)=>any) | "missing" | "never" | "indirect">> = {} as any;

        // NB: all combinations with L for GenericType are invalid / not even listed because LGenericType does not exist. j = GenericType.
        converterGT["s"]["j"] = GenericType.parse;
        converterGT["e"]["j"] = "indirect"; // converterGT["e"]["s"] + converterGT["s"]["j"];

        converterGT["s"]["e"] = GenericType.parseToEcore;
        converterGT["j"]["e"] = "indirect"; // converterGT["j"]["s"] + converterGT["s"]["e"];

        converterGT["j"]["s"] = GenericType.serializeGenericType; // <-- universal serializer. For ad-hoc serializer (not wrapped) use GenericType.serializeJOM
        converterGT["e"]["s"] = GenericType.serializeGenericType; // <-- universal serializer. For ad-hoc serializer (not wrapped) use GenericType.serializeEcore;

        // TD
        converterTD["s"]["l"] = "indirect"; // converterTD["s"]["j"] + [j][l] = GenericType.parseDeclaration + TypeDeclaration.toL
        converterTD["j"]["l"] = TypeDeclaration.toL;
        converterTD["e"]["l"] = GenericType.parseLDeclaration;            // SEMI-universal!

        converterTD["s"]["e"] = GenericType.parseToEcoreDeclaration;      // universal!
        converterTD["l"]["e"] = GenericType.parseToEcoreDeclaration;      // universal!
        converterTD["j"]["e"] = GenericType.parseToEcoreDeclaration;      // universal!

        converterTD["j"]["s"] = GenericType.serializeTypeDeclaration;     // universal!
        converterTD["l"]["s"] = GenericType.serializeTypeDeclarationJOM;  // or serializeTypeDeclarationJOM_Arr or l.toString()
        converterTD["e"]["s"] = GenericType.serializeETypeParameter;

        converterTD["l"]["j"] = "never";
        converterTD["s"]["j"] = GenericType.parseDeclaration;
        converterTD["e"]["j"] = GenericType.parseDeclarationFromEcore;

        // aliases list
        converterTD["s"]["j"] = TypeDeclaration.parse;                    // !! ALIAS !! of GenericType.parseDeclaration
        converterTD["j"]["e"] = TypeDeclaration.toEcore;                  // !! ALIAS !! of GenericType.parseToEcoreDeclaration
    }

    static desc_feature: Info = {type: ShortAttribETypes.EString, txt: "Mutually exclusive with this.type, it specified a parametrized type.\n" +
            "The type must be declared in the class definition, and referenced here by name (string). example:" +
            "class Proxy<N>{" +
            "\tprivate originalData: N;\n;" +
            " ... }\n"};

    // validates and fix a tentative object received through API
    private static PointerOrName<T extends DPointerTargetable>(v: any, allowGenericType = false, c: LogicContext): string | Pointer<T> | undefined {
        if (!v) return undefined;
        let tv = typeof v;
        if (tv === "object") return Pointers.from(v) || (allowGenericType ? GenericType.getter(v, c) : undefined);
        if (tv === "string") return v;
        return undefined;
    }

    public static desc_class: Info = {type: "GenericType[]", txt: "Type parameters used to extend a superclass with generic typings.\n" +
            "like: class IntegerStack extends Array<Integer> { .. }"}
    public static desc_object: Info = {type: "GenericType", txt: "Type parameters used to create an object whose class have generic typings."}
    public static desc_value: Info = {type: "GenericType", txt: GenericType.desc_object.txt }
    public static descTypeParameters: Info = {type: "TypeDeclaration[]", txt: "Type parameters attached to the classifier or function definition, like in HashMap<K, V>"}
    public static descAllTypeParameters: Info = Info.typeDeclarations;

    public static serializeETypeParameter(...a: Parameters<typeof serializeETypeParameter>): ReturnType<typeof serializeETypeParameter> {
        return serializeETypeParameter(...a);
    }

    /*
    private static serializeECoreGenericType(...a: Parameters<typeof serializeECoreGenericType>): ReturnType<typeof serializeECoreGenericType> {
        return serializeECoreGenericType(...a);
    }*/

    // wrapper for GenericType.serializeTypeDeclarationJOM
    private static serializeTypeDeclarationJOM_Arr(arr: LTypeDeclaration[], m: LModel, asID: boolean = true ): string | null {
        return arr
            .map(e=> GenericType.serializeTypeDeclarationJOM(e))
            .filter(e=> !!e)
            .join(", ");
    }

    public static getterArr(v: Partial<GenericType>[] | undefined | null, c: LogicContext): GenericType[] {
        if (!v) return [];
        if (!Array.isArray(v)) v = [v];
        return v.map( e => GenericType.getter(e, c)).filter(e=>!!e);
    }
    public static setterArr<T extends DModelElement>(v: GenericType[] | undefined, c: LogicContext<T>, propkey: keyof T & string, thiss: DtoL<T>): boolean {
        v = GenericType.getterArr(v, c as LogicContext);
        let old  = GenericType.getterArr(c.data[propkey] as any , c as LogicContext);
        let delta = old && v && Uobj.objectDelta(old, v, true, false);
        if (delta && Object.keys(delta).length === 0) return true;
        TRANSACTION((thiss as any).get_name(c)+"."+propkey, ()=> {
            if (v) SetFieldAction.new(c.data, propkey, delta as any, "+=", false);
            else SetFieldAction.new(c.data, propkey, undefined, '', false);
        }, delta ? delta : old, delta ? undefined : (old ? v : null))
        return true;
    }

    public static getter(v: Partial<GenericType> | undefined | null, c: LogicContext): GenericType | null {
        if (typeof v === "string") {
            const {model, classes, enums, typeDeclarations} = getClassifiers(c);
            return GenericType.parse(v, classes, enums, typeDeclarations);
        }
        if (!v || !v.kind || typeof v.kind !== "string") return null;
        let ret = new GenericType(v.kind);
        // ret.name = typeof v.name === "string" && v.name ? v.name : undefined;
        ret.classifier = this.PointerOrName<DClass>(v.classifier, false, c);
        ret.upper = (v.upper || []).map<GenericType | TYPE>(e => GenericType.PointerOrName(e, true, c) as any).filter(e=>!!e);
        ret.lower = (v.lower || []).map<GenericType | TYPE>(e => GenericType.PointerOrName(e, true, c) as any).filter(e=>!!e);

        ret.operandsTuple =      (v.operandsTuple      || []).map(e => GenericType.getter(e, c)).filter(e=>!!e);
        ret.operandsAnd =        (v.operandsAnd        || []).map(e => GenericType.getter(e, c)).filter(e=>!!e);
        ret.operandsOr =         (v.operandsOr         || []).map(e => GenericType.getter(e, c)).filter(e=>!!e);
        ret.operandsDifference = (v.operandsDifference || []).map(e => GenericType.getter(e, c)).filter(e=>!!e);
        ret.operandsComplement = (v.operandsComplement || []).map(e => GenericType.getter(e, c)).filter(e=>!!e);
        ret.typeArgs =           (v.typeArgs           || []).map(e => GenericType.getter(e, c)).filter(e=>!!e);
        ret.operandsArray = GenericType.getter(v.operandsArray, c) || undefined;
        return ret;
    }

    public static setter(v: GenericType | null | undefined, c: LogicContext<any>, thiss: LModelElement): boolean {
        v = GenericType.getter(v, c as LogicContext<DModelElement>);
        let old = GenericType.getter(c.data.genericType, c as LogicContext<DModelElement>);
        let delta = old && v && Uobj.objectDelta(old, v, true, false);
        if (delta && Object.keys(delta).length === 0) return true;
        TRANSACTION((thiss as any).get_name(c)+".genericType", ()=> {
            if (v) SetFieldAction.new(c.data, "genericType", delta, "+=", false);
            else SetFieldAction.new(c.data, "genericType", undefined, '', false);
        }, delta ? delta : old, delta ? undefined : (old ? v : null))
        return true;
    }

    public static getter_typeParametersArr(v?: Pointer<DTypeDeclaration>[]): NamedArr<LTypeDeclaration> {
        return U.toNamedArray(L.fromArr(v || []).filter((e: L)=> !!e));
    }

    // autocorrects TypeDeclaration objects, currently not used but should be. so keep it.
    public static getter_typeParameters_unused_(v: Partial<TypeDeclaration> | undefined | null, c: LogicContext): TypeDeclaration | undefined {
        if (!v) return undefined;
        let ret = new TypeDeclaration();
        if (v.name && typeof v.name === "string") ret.name = v.name;
        else return undefined;
        ret.defaultType = GenericType.PointerOrName(v?.defaultType, true, c);
        ret.upper = (v.upper || []).map<GenericType | TYPE>(e=> GenericType.PointerOrName(e, true, c) as any).filter(e => !!e);
        ret.lower = (v.lower || []).map<GenericType | TYPE>(e=> GenericType.PointerOrName(e, true, c) as any).filter(e => !!e);
        let dir = typeof v.direction === "string" ? v.direction.toLowerCase() : undefined;
        switch (dir) {
            case "in":
            case "out":
            case "inout": ret.direction = dir; break;
            default: break;
        }
        return ret;
    }

    // type declarations on operation.eTypeParameters and class.eTypeParameters
    public static setter_typeParameters(v0: (Pointer<DTypeDeclaration> | TypeDeclaration | LTypeDeclaration | DTypeDeclaration)[] | undefined,
                                        c: LogicContext<DClass | DOperation | DModel>, thiss: LClass | LOperation | LModel): boolean {
        let old = (c.data as DClass | DOperation | DModel).typeParameters;
        console.log("0x1 set typeParameters", {v0, c, thiss});
        const m = c.proxyObject.model;
        const {classes, enums, typeDecls} = getClassifiers(c);

        if (!v0 || typeof v0 !== "object" || U.isEmptyObject(v0)) v0 = [];
        if (!Array.isArray(v0)) { v0 = [v0 as any]; }

        // let finalArr: Pointer<DTypeDeclaration>[] = [];
        const finalArr: Pointer<DTypeDeclaration>[] = v0.map(v => {
            let tv = typeof v;
            if (tv !== "string" && tv !== "object") return null;

            let ptr = Pointers.from(v as any as DPointerTargetable);
            let serialized: string | null = null;
            if (tv === "string") {
                if (Pointers.isPointer(ptr)) { finalArr.push(ptr as Pointer<any>); return v; }
                else serialized = v as string;
            }
            if (tv === "object") {
                // NB: TypeDeclarations (not L) can also have id, so check if has classname instead of id.
                if ((v as L).className) return (v as L).id;
                // if not P or D, it's a xmi/ecore/json structure.
                const model = c.proxyObject.model;
                serialized = GenericType.serializeETypeParameter([v as TypeDeclaration | TypeDeclarationXMIU], model, true);
            }
            if (!serialized) return null;
            let obj = GenericType.parseDeclaration(serialized, classes, enums, typeDecls);
            if (!obj) return null as any;
            return LPointerTargetable.fromD(DTypeDeclaration.new2({...obj, father:c.data.id} as any, (d) => {
                if (!obj || typeof obj !== "object") return;
                for (let k in obj) {
                    const v = (obj as any)[k];
                    if (v === undefined) continue;
                    (d as any)[k] = (obj as any)[k];
                }
            }, true));
            // or already serialized version
        }).filter(e=>!!e)


        /*
        let delta = old && v?.length && Uobj.objectDelta(old, v, true, false);
        if (delta && Object.keys(delta).length === 0) return true;
        // delta = Uobj.fixDeltaArrays(delta);
        TRANSACTION((thiss as any).get_name(c)+".typeParameters", ()=> {
            if (v) SetFieldAction.new(c.data, "typeParameters", delta as any, "{}", false);
            else SetFieldAction.new(c.data, "typeParameters", [], '', false);
        }, delta ? delta : old, delta ? undefined : (old ? v : null))*/
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
        setter?:(d: GenericType)=>void/*
        classifier?: TYPE,
        typeArgs?: GenericType[],
        upper?: GenericType["upper"], lower?: GenericType["lower"],
        operandsAnd?: GenericType[],
        operandsArray?: GenericType,
        operandsOr?: GenericType[],
        operandsDifference?: GenericType[],
        operandsComplement?: GenericType[],
        operandsTuple?: GenericType[],*/
    ) {
        this.kind = kind;
        if (setter) setter(this);
        /*
        this.classifier = classifier;
        this.typeArgs = typeArgs;
        this.upper = upper;
        this.lower = lower;
        this.operandsAnd = operandsAnd;
        this.operandsOr = operandsOr;
        this.operandsDifference = operandsDifference;
        this.operandsTuple = operandsTuple;
        this.operandsComplement = operandsComplement;
        this.operandsArray = operandsArray;*/
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

    // l.toString() calls this internally.
    static serializeTypeDeclarationJOM(l: LTypeDeclaration, asID = true): string {
        if (!l) return "";
        let def = l.defaultType; // thiss.get_defaultType(c);
        let upper = l.upper; // thiss.get_upper(c);
        let lower = l.lower; // thiss.get_lower(c);
        let direction: string = l.direction; // thiss.get_direction(c);
        const m: LModel = l.model;
        let name = l.name; // (thiss as any).get_name(c);
        console.error("input getter GT serialize", {l, d:U.jsonCopy(l.__raw), name});
        if (direction === "inout" || !direction) direction = "";
        else direction += " ";
        if (!name && !def && !upper.length && !lower.length) return "";

        let extendsStr = upper.map(e=>GenericType.serializeJOM(e, m, asID)).filter(e=>!!e).join("&");
        let superStr = lower.map(e=>GenericType.serializeJOM(e, m, asID)).filter(e=>!!e).join("&");
        console.log("serialize tp", {upper, lower,
            umap:upper.map(e=>GenericType.serializeJOM(e, m, asID)),
            lmap: lower.map(e=>GenericType.serializeJOM(e, m, asID))
        });
        if (superStr) superStr = " super " + superStr;
        if (extendsStr) extendsStr = " extends "+extendsStr;
        return `${direction}${name}${extendsStr}${superStr}`;
    }

    static serializeTypeDeclaration(l0: LTypeDeclaration | TypeDeclaration | TypeDeclarationXMIU, m?: LModel, asID = true): string {
        const fallback: string = "";
        const tl = typeof l0;
        const l: LTypeDeclaration = l0 as any;
        if (l?.__isProxy) return GenericType.serializeTypeDeclarationJOM(l);
        console.log("serialize TD", l0);
        if (l?.className === "DTypeDeclaration") return GenericType.serializeTypeDeclarationJOM(L.fromD(l as any)) || fallback;
        if (Pointers.isPointer(l0)) return GenericType.serializeTypeDeclarationJOM(L.fromPointer(l0 as any)) || fallback;
        if (tl === "object") {
            if (!m) { windoww.Log.eDevv("Cannot serialize a TypeParameter without a reference to the model."); return fallback; }
            return serializeETypeParameter([l] as (TypeDeclarationXMIU | TypeDeclaration)[], m, asID) || fallback;
        }
        if (tl === "string") return l as any || fallback;
        return fallback;
    }

    // ------------------------------------------------------------------
    // SERIALIZE
    // Produces a human-readable string like:
    //   raw:           "Shape", T
    //   parameterized: "Map<String, List<T>>"
    //   wildcard:      "?", "? extends Foo & Bar", "? super Baz"
    //   operator    :  "A & B & C"
    //   array:         "T[]", "List<T>[]"
    // ------------------------------------------------------------------
    public static serializeGenericType(gType0: XmiGenericTypeJsonU | XmiGenericTypeJson | GenericType | TYPE |  LClass, m: LModel, asID = true): string {
        let to = typeof gType0;
        if (!m) { windoww.Log.eDevv("Cannot serialize a GenericType without a reference to the model."); return ""; }
        if (to === "string") {
            if (Pointers.isPointer(gType0)) return L.from(gType0)?.name || ""; // should never be possible, this is not a LTypeDeclaration
            return gType0 as any;
        }
        if (to === "object") {
            // return (gType as any).name ?? (gType as any).toString() ?? null;
            let cnamePrefix = (gType0 as any)?.className?.[0];
            if (cnamePrefix === "D") return L.from(gType0 as LClass)?.name || "";
        }

        const gType = normalizeEcoreKeys(gType0);
        const closer = U.closerTo(gType, GTKeys_J, GTKeys_E, GTKeys_EU);
        console.error("closerr", {gType, closer, GTKeys_J, GTKeys_E, GTKeys_EU});
        if (closer.closestKeys == GTKeys_J) return GenericType.serializeJOM(gType0 as any, m, asID);
        else return GenericType.serializeEcore(gType as any, m, asID);
    }
    private static serializeEcore(type: XmiGenericTypeJson | XmiGenericTypeJsonU, m: LModel, asID = true): string {
        return serializeECoreGenericType(type, m, asID);
    }
    private static serializeJOM(o0: GenericType | TYPE | LClass, m: LModel, asID = true): string {

        function joinOperands(arr: GenericType[], operator: string, autoParenthesis: boolean = true) {
            let types = arr.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e);
            let s = types.join(operator);
            if (!types.length) return "";
            if (types.length === 1 || !autoParenthesis) { return s; }
            else return "(" + s + ")";
        }

        let o = o0 as GenericType;
        o = normalizeEcoreKeys(o);

        /*
        field	        raw	        parameterized   wildcard	intersection	array
        classifier	    �required	�required       ✗	        ✗	            ✗
        typeArgs	    ✗	        �required       ✗	        ✗	            ✗
        upper	        ✗	        ✗               �optional	✗	            ✗
        lower	        ✗	        ✗               �optional	✗	            ✗
        operands	    ✗	        ✗               ✗	        �required	    ✗
        componentType   ✗          	✗	            ✗	        ✗	            �required

        */
        switch (o.kind) {
            default: // Log.exx(`Unknown GenericType kind: ${(o as any).kind}`, {o, o0}); return null;
                let isDefault = !!o.kind;
                console.log("serialize gt", {o, cl:o.classifier, args:o.typeArgs});
                if (o.operandsArray) { // array mode
                    const inner = GenericType.serializeJOM(o.operandsArray, m, asID);
                    // Wrap parameterized/intersection in parens for clarity, e.g. (Map<K,V>)[]
                    const needsParens = true; // o.operandsArray.kind === "parameterized" || o.operandsArray.kind === "intersection" || o.typeArgs?.length > 0;
                    return needsParens ? `(${inner})[]` : `${inner}[]`;
                }
                // NB: mixed operators can be realized with nesting {operandsOr:[ a1, {operandsAND: [b1, b2]}]}  --> a1 | (b1 & b2)
                if (o.operandsTuple?.length)  return "[" + joinOperands(o.operandsTuple,        ", ", false) + "]";
                if (o.operandsOr?.length)           return joinOperands(o.operandsOr,           " | ", false);
                if (o.operandsAnd?.length)          return joinOperands(o.operandsAnd,          " & ", false);
                if (o.operandsDifference?.length)   return joinOperands(o.operandsDifference,   " \ ", false);
                if (o.operandsComplement?.length)   return joinOperands(o.operandsComplement,   " ~ ", false);

                o.classifier
                let base: string;
                let isWildcard: boolean = false;
                if (!o.classifier) {
                    if (!isDefault) { Log.exx("SerializeJom: parameterized GenericType missing classifier", {o, o0}); return ""; }
                    isWildcard = true;
                    base = "?";
                } else base = GenericType.classifierName(o.classifier);
                let bounds = "";

                if (o.upper?.length) {
                    const arr = o.upper.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e);
                    if (arr.length) bounds += ` extends ${arr.join(" & ")}`;
                }
                if (o.lower?.length) {
                    // Java only allows a single lower bound but we stay general
                    const arr = o.lower.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e);
                    if (arr.length) bounds += ` super ${arr.join(" & ")}`;
                }

                if (o.typeArgs?.length) {
                    const args = o.typeArgs.map(e=> GenericType.serializeGenericType(e, m, asID)).join(", ");
                    return `${base}<${args}>${bounds}`;
                }
                return base + bounds;
            break;
            case "raw": {
                if (!o.classifier) { Log.exx("raw GenericType missing classifier", {o, o0}); return ""; }
                return GenericType.classifierName(o.classifier);
            }

            case "parameterized": {
                let isDefault = !!o.kind;
                console.log("serialize gt", {o, cl:o.classifier, args:o.typeArgs});
                if (!o.classifier) { Log.exx("parameterized GenericType missing classifier", {o, o0}); return ""; }
                const base = GenericType.classifierName(o.classifier);
                if (o.typeArgs?.length) {
                    const args = o.typeArgs.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e).join(", ");
                    return `${base}<${args}>`;
                }
                return base;
            }

            case "wildcard": {
                // upper and lower are mutually exclusive in practice
                if (o.upper?.length) {
                    const bounds = o.upper.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e).join(", ");
                    return `? extends ${bounds}`;
                }
                if (o.lower?.length) {
                    // Java only allows a single lower bound but we stay general
                    const bounds = o.lower.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e).join(", ");
                    return `? super ${bounds}`;
                }
                return "?";
            }

            case "operator": {
                let collection: keyof GenericType;
                if (o.operandsTuple?.length) {
                    return "["+o.operandsTuple.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e).join(", ")+"]";
                }

                if (o.operandsAnd?.length) collection = "operandsAnd";
                if (o.operandsOr?.length) collection = "operandsOr";
                if (o.operandsComplement?.length) collection = "operandsComplement";
                if (o.operandsDifference?.length) collection = "operandsDifference";
                else collection = "" as any;

                let arr: GenericType["operandsAnd"] = o[collection] as GenericType["operandsAnd"] || [];
                let symbol = OPERATOR_MAP[collection];
                if (arr.length === 0) windoww.Log.exx("GenericType operation("+collection+") has no operands", {arr, o});
                return "("+arr.map(e=> GenericType.serializeGenericType(e, m, asID)).filter(e=>!!e).join(symbol)+")";
            }

            case "array": {
                if (!o.operandsArray) { Log.exx("array GenericType missing componentType", {o, o0}); return ""; }
                const inner = GenericType.serializeJOM(o.operandsArray, m, asID);
                // Wrap parameterized/intersection in parens for clarity, e.g. (Map<K,V>)[]
                const needsParens = o.operandsArray.kind === "parameterized" || o.operandsArray.kind === "operator";
                return needsParens ? `(${inner})[]` : `${inner}[]`;
            }
        }
    }

    public static parseToEcoreDeclaration(s: string | TypeDeclaration | LTypeDeclaration,
                               classes: NamedArr<LClass>,
                               enums: NamedArr<LEnumerator>,
                               typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>, asID = false): TypeDeclarationXMIU | null {
        let gt: TypeDeclaration | null;
        if (typeof s === "string") gt = GenericType.parseDeclaration(s, classes, enums, typeDeclarations);
        else gt = s as any;
        if (!gt) return null;
        if ((gt as LTypeDeclaration).__isProxy) return (gt as LTypeDeclaration).ecore as any;

        const ret = new TypeDeclarationXMIU();
        ret.eBounds         = gt.upper?.map(g=> GenericType.parseToEcore(g, classes, enums, typeDeclarations))
            .filter(e=>!!e);
        ret.name = gt.name;
        if (Pointers.isPointer(ret.name) && !asID) {
            ret.name = (L.fromPointer(ret.name) as LClass | LTypeDeclaration)?.name || "T";
        }

        // annotations are allowed only if "s" parameter is LTYpeDeclaration, and in that case i use s.ecore before.
        // ret.eAnnotations = (gt as LModelElement).annotations.map((a: LAnnotation): Json => (L.from(a) as LTypeDeclaration)?.eCore).filter((e: Json)=>!!e);
        // if (ret.eAnnotations?.length === 1) ret.eAnnotations = ret.eAnnotations[0];
        // if (!ret.eAnnotations || !(ret.eAnnotations as any).length) delete ret.eAnnotations;

        if (ret.eBounds?.length === 1) ret.eBounds = ret.eBounds[0];
        if (!ret.eBounds || !(ret.eBounds as any).length) delete ret.eBounds;
        return ret;
    }

    public static parseToEcore(s: string | GenericType,
                               classes: NamedArr<LClass>,
                               enums: NamedArr<LEnumerator>,
                               typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>, asID = false): XmiGenericTypeJsonU | null {
        let gt: GenericType | null;
        if (typeof s === "string") gt = GenericType.parse(s, classes, enums, typeDeclarations);
        else gt = s as any;
        if (!gt) return null;
        const ret = new XmiGenericTypeJsonU();
        ret.eBounds         = gt.upper?.map(g=> GenericType.parseToEcore(g, classes, enums, typeDeclarations))
            .filter(e=>!!e);
        ret.eTypeArguments  = gt.typeArgs?.map(g=> GenericType.parseToEcore(g, classes, enums, typeDeclarations))
            .filter(e=>!!e);
        // block: set eTypeParameter or eClassifier (mutually exclusive
        {
            let l = L.fromPointer(gt.classifier) as LClass | LTypeDeclaration;
            if (gt.classifier && !l) ret.eTypeParameter = gt.classifier; // treating unknown target as a missing type declaration like K, V, T
            else {
                let val: string = l?.ecorePointer?.() || gt.classifier || ""; // target's name or ecore-based pointer string
                if (l.className === "LClass") ret.eClassifier = val;
                else ret.eTypeParameter = val;

            }
            if (!asID) {
                if (Pointers.isPointer(ret.eClassifier))
                    ret.eClassifier = (L.fromPointer(ret.eClassifier) as LClass)?.name || "";
                if (Pointers.isPointer(ret.eTypeParameter))
                    ret.eTypeParameter = (L.fromPointer(ret.eTypeParameter) as LTypeDeclaration)?.name || "";
            }
        }
        // NB: ANNOTATIONS in GenericType are not supported yet
        // ret.eAnnotations = gt.annotations.map((a: LAnnotation)=> a.eCore);
        if (ret.eBounds?.length === 1) ret.eBounds = ret.eBounds[0];
        if (ret.eTypeArguments?.length === 1) ret.eTypeArguments = ret.eTypeArguments[0];
        // if (ret.eAnnotations?.length === 1) ret.eAnnotations = ret.eAnnotations[0];

        if (!ret.eClassifier || !(ret.eClassifier as any).length) delete ret.eClassifier;
        if (!ret.eTypeArguments || !(ret.eTypeArguments as any).length) delete ret.eTypeArguments;
        if (!ret.eAnnotations || !(ret.eAnnotations as any).length) delete ret.eAnnotations;
        if (!ret.eBounds || !(ret.eBounds as any).length) delete ret.eBounds;
        return ret;
    }
    //  parse("Map<String, List<? extends Foo>>") --> JOM object
    public static parse(s: string,
                        classes: NamedArr<LClass>,
                        enums: NamedArr<LEnumerator>,
                        typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>): GenericType | null
    {
        const parser = new GenericTypeParser(s, classes, enums, typeDeclarations);
        return parser.parseGenericType();
    }
    public static parseDeclarationFromEcore(json: TypeDeclarationXMI | TypeDeclarationXMIU | TypeDeclaration, c: LogicContext, out?:{generated: DModelElement[]}): TypeDeclaration | null{
        const {model, classes, enums, typeDecls} = getClassifiers(c);
        const str = GenericType.serializeETypeParameter([json], model, true);
        const typeDecl = str ? GenericType.parseDeclaration(str, classes, enums, typeDecls) : null;
        if (!typeDecl) { Log.exx("Failed to parse typeDeclaration", json, c); return null; }
        return typeDecl;
    }
    public static parseLDeclaration(json0: TypeDeclarationXMI | TypeDeclarationXMIU | TypeDeclaration, c: LogicContext,
                                    out?:{generated: DModelElement[]}): LTypeDeclaration | null{
        let typeDecl: TypeDeclaration | null;
        if (!json0) return null;
        let json = normalizeEcoreKeys(json0);
        if (U.closerTo(json, TDKeys_J, TDKeys_E, TDKeys_EU).closestKeys === TDKeys_J) typeDecl = json0 as TypeDeclaration;
        else typeDecl = GenericType.parseDeclarationFromEcore(json as TypeDeclarationXMIU, c, out);
        if (!typeDecl) return null;

        const ret = TypeDeclaration.toD(typeDecl);
        if (out) out.generated.push(ret);
        for (let v of Uarr.normalizeArray((json as TypeDeclarationXMIU).eAnnotations || (json as TypeDeclarationXMI).annotations)) {
            if (typeof v !== "object") { continue; }
            // NB: annotations are added to collection in parseDannotation using parent.annotations = this;
            // NB2: this is an old api, might be wrong/obsolete, but annotations in typedeclaration are a thing so obscure
            // and unlikely that i'm leaving it as is unless a trouble appear and just call them unsupported if wrong.
            try { EcoreParser.parseDAnnotation(ret, v as any, out?.generated || [] as any); } catch (e) {}
        }
        return L.fromD(ret);
    }

    public static parseDeclaration(s: string,
                                    classes: NamedArr<LClass>,
                                    enums: NamedArr<LEnumerator>,
                                    typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>): TypeDeclaration | null
    {
        if (!s) return null;
        const parser = new GenericTypeParser(s, classes, enums, typeDeclarations);
        return parser.parseTypeDeclaration();
    }

    public static parseDeclaration_old(s: string,
                                   classes: NamedArr<LClass>,
                                   enums: NamedArr<LEnumerator>,
                                   typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>,
                                   base?: LTypeDeclaration): TypeDeclaration | null
    {
        const trimmed = s.trim();
        const parser = new TypeParamDeclParser_old(trimmed, classes, enums, typeDeclarations);
        return parser.parse(base);
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

class TypeParamDeclParser_old{
    private pos: number = 0;

    constructor(
        private input: string,
        private classes: NamedArr<LClass>,
        private enums: NamedArr<LEnumerator>,
        private typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>
    ) {}

    parse(base?: LTypeDeclaration): TypeDeclaration {
        let ret = new TypeDeclaration();
        // baseobj or at least id is required for making pointers of subelements recursively pointing to this declaration.
        if (base) { ret.id = base.id; }
        this.skipWS();

        // 1. optional direction keyword — must come before the name
        ret.direction = this.parseDirection() as any;
        this.skipWS();

        // 2. type parameter name
        ret.name = this.parseIdentifier();
        if (!ret.name) { Log.exx(`Expected type parameter name at pos ${this.pos}`, this); return null as any; }

        if (!this.typeDeclarations[ret.name]) {
            this.typeDeclarations.push(ret);
            this.typeDeclarations[ret.name] = ret;
            // save old name so references can still point to it with old name?
            if (base && !this.typeDeclarations[base.name]) this.typeDeclarations[base.name] = ret;
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
        console.log("parse single bound", {slice, input:this.input, this:this, cl:this.classes, e:this.enums, td: this.typeDeclarations});
        const inner = new GenericTypeParser(slice, this.classes, this.enums, this.typeDeclarations);
        const ref = inner.parseGenericType();
        this.pos += inner.getPos();
        return ref as any;
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

| { kind: "raw";  name: GenericTypeName }
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
let simpleT = new GenericType("raw");
simpleT.classifier = "T";

// List                         no type args — raw/non-generic use
type = new GenericType("raw"); // raw keyword can be removed and replaced with "parameterized" with empty parameter array

// List<T>                      simple parameterized
let listType = new GenericType("parameterized");
listType.typeArgs = [simpleT];

// Map<String, List<T>>         nested parameterized
type = new GenericType("parameterized");
type.typeArgs = [
    new GenericType("raw"),
    listType
];

// Map<K, List<T>>              nested parameterized 2
type = new GenericType("parameterized");
type.typeArgs = [
    {...new GenericType("raw"), classifier: "K"},
    listType
];
// ? extends Foo        upper wildcard
type = new GenericType("wildcard");
type.upper = [listType];









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

// removes XMI inline marker and transforms all keys to lowercase.
function normalizeEcoreKeys<T extends GObject>(go: T, deep = true, lowercase = true): T{
    go = {...go};
    for (let k0 in go) {
        if (typeof k0 !== "string") continue;
        let v = go[k0];
        delete go[k0];
        let ks = k0 as string & keyof T;
        if (lowercase) ks = (ks as string).toLowerCase();
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

// NB: i need all keys to be present for U.closerTo, even if they are undefined. so i cannot use property?: optionals.  or !. They need to exist.
class XmiGenericTypeJson {
    eannotations:     orArr<ECoreAnnotation> | undefined = undefined;
    "eclassifier":    string | undefined = undefined;  // present for raw / parameterized / wildcard-bound
    "etypeparameter": string | undefined = undefined;  // present for typeParam references. mutually exclusive with eclassifier but same meaning for different target types
    "etypearguments": orArr<XmiGenericTypeJson> | undefined = undefined;
    "ebounds":        orArr<XmiGenericTypeJson> | undefined = undefined;
    // A wildcard has neither eClassifier nor eTypeParameter
}
// NB: i need all keys to be present for U.closerTo, even if they are undefined. so i cannot use property?: optionals.  or !. They need to exist.

class XmiGenericTypeJsonU { // case sensitive version
    eAnnotations:     orArr<ECoreAnnotation> | undefined = undefined;
    "eClassifier":    string | undefined = undefined;  // present for raw / parameterized / wildcard-bound
    "eTypeParameter": string | undefined = undefined;  // present for typeParam references. mutually exclusive with eclassifier but same meaning for different target types
    "eTypeArguments": orArr<XmiGenericTypeJsonU> | undefined = undefined;
    "eBounds":        orArr<XmiGenericTypeJsonU> | undefined = undefined;
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
type EGenericType = XmiGenericTypeJsonU;
type EBound = EGenericType; // eBounds can appear as XMI tag, but the name only comes from the container property, they are actually EGenericType as of contents.
type ETypeArgument = EGenericType;
type EGenericSuperTypes = EGenericType;
type EUpperBound = EGenericType;
type ELowerBound = EGenericType;

// NB: i need all keys to be present for U.closerTo, even if they are undefined. so i cannot use property?: optionals. or !. They need to exist.
export class TypeDeclarationXMIU {
    eAnnotations: orArr<ECoreAnnotation> | undefined = undefined;
    name!: string;
    eBounds: orArr<XmiGenericTypeJsonU> | undefined = undefined;
}

// NB: i need all keys to be present for U.closerTo, even if they are undefined. so i cannot use property?: optionals. or !. They need to exist.
export class TypeDeclarationXMI { // K extends ...
    annotations: orArr<ECoreAnnotation> | undefined = undefined;
    name: string = ""; // plain string as name, never a ecore pointer like "//@some.path"
    ebounds: orArr<XmiGenericTypeJson> | undefined = undefined; // equivalent to TypeDeclaration.upper. lower is not supported by ecore.
    // direction?: "in" | "out" | "inout"; ecore doesn't support it.
    // defaultType?: GenericType | TYPE;
}
@Alias export class ETypeParameter extends TypeDeclarationXMI { }

// NB: i need all keys to be present for U.closerTo, even if they are undefined. so i cannot use property?: optionals.  or !. They need to exist.
export class TypeDeclaration {
    id: Pointer<DTypeDeclaration> | undefined = undefined;
    name: string;
    upper: (GenericType | TYPE)[];
    lower: (GenericType | TYPE)[];
    direction: "in" | "out" | "inout"; // also called variance: Input (contravariant) or an Output (covariant).
    defaultType: GenericType | TYPE | undefined;
    constructor() {
        this.upper = [];
        this.lower = [];
        this.direction = "inout";
        this.defaultType = undefined;
        this.name = "T";
    }

    @Alias public static parse(s: string,
                        classes: NamedArr<LClass>,
                        enums: NamedArr<LEnumerator>,
                        typeDeclarations: NamedArr<(LTypeDeclaration | TypeDeclaration)>
    ): TypeDeclaration | null{
        return GenericType.parseDeclaration(s, classes, enums, typeDeclarations);
    }

    static toD(td: TypeDeclaration): DTypeDeclaration {
        const pointers = {id: td.id};
        let ret: DTypeDeclaration = DTypeDeclaration.new2(pointers, (d)=> {
            d.defaultType = td.defaultType;
            // d.defaultValue = td.defaultType
            // d.isReified = td.isReified;
            d.direction = td.direction;
            d.lower = td.lower;
            d.upper = td.upper;
        })
        return ret;
    }
    static toL(typeDecl: TypeDeclaration): LTypeDeclaration {
        return LPointerTargetable.fromD(TypeDeclaration.toD(typeDecl));
    }

    @Alias static toEcore(j: TypeDeclaration, c: LogicContext): TypeDeclarationXMIU | null {
        const {m, classes, enums, typeDeclarations} = getClassifiers(c);
        /*
        const classes = m.classes;
        const enums = m.enums;
        const typeDeclarations = m.typeDeclarations;*/
        return GenericType.parseToEcoreDeclaration(j, classes, enums, typeDeclarations, false);
        /*
        const ret = new TypeDeclarationXMIU();

        ret.name = (L.fromPointer(j.name) as LTypeDeclaration)?.name || j.name;
        ret.eAnnotations = (j as any).annotations
            .map((a: LTypeDeclaration | Pointer<DTypeDeclaration>)=> (L.from(a) as LAnnotation).ecore)
            .filter((e: Json)=> !!e);
        ret.eBounds = j.upper
            .map(e=> GenericType.parseToEcore(e, classes, enums, typeDeclarations))
            .filter(e=>!!e);

        if (Array.isArray(ret.eAnnotations)) {
            if (ret.eAnnotations?.length === 1) ret.eAnnotations = ret.eAnnotations[0];
            else if (!ret.eAnnotations.length) delete ret.eAnnotations;
        }
        if (Array.isArray(ret.eBounds)) {
            if (ret.eBounds?.length === 1) ret.eBounds = ret.eBounds[0];
            else if (!ret.eBounds.length) delete ret.eBounds;
        }

        if (!ret.eAnnotations) delete ret.eAnnotations;
        if (!ret.eBounds) delete ret.eBounds;
        return ret;*/
    }
}

// ? type TypeDecl = EGenericType;
// ? type TypeFill = ETypeParameter;


/*deleter;
class EGenericType { // todo: not ecore's structure, when i'm using this? use instead XmiGenericTypeJson
    elowerbound?: ELowerBound;
    eupperbound?: EUpperBound;
    etypearguments?: ETypeArgument[]; // containment, assign a value to a generic type, can only appear to fill slots in extending a egenericsupertype
    // non-containment:
    // erawtype!: string | Pointer<DClassifier>; // derived attribute, strips away all type arguments and returns the bare underlying classifier.
    eclassifier?: string | Pointer<DClassifier>; // mutually exclusive with etypeparameter
    // SINGLE type used for typing features with a generic type, like: class Tree<T>{ public node:T }
    // etypeparameter is mutually exclusive with eclassifier
    etypeparameter?: Pointer<DTypeDeclaration | DClass> | string; // <Date> actually a string (name) or ecore style pointer to ETypeParameter. cannot have type parameter instantiations (etypearguments)
}*/
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

    etypeparameters?: TypeDeclarationXMIU[];
    // non contain?
    egenericsupertypes?: EGenericSuperTypes[]; // only references, assign a value to a eTypeParameter.
    // class can only do it when extending, like: class C extends List<String>{}
}

function resolveClassifier(s: string, m: LModel): LClassifier | null{
    // as ecore primitive
    let ptr = U.solveEcoreType(s, true);
    if (ptr) return L.from(ptr) || null;
    if (Pointers.isPointer(s)) return L.from(s) || null;
    const primitivePtr: Pointer<DClass> = U.solveEcoreType(s, true, true, '', '');
    if (primitivePtr) { return L.from(primitivePtr) as LClass; }

    return LValue.resolveReference(s, m) as any || null;
}

export function serializeETypeParameter_old(arr: TypeDeclarationXMI[], m: LModel, asID: boolean = true ): string | null {
    const fallback = null;
    arr = Uarr.normalizeArray(arr);
    if (!arr?.length) return fallback;
    return arr.map((param) => {
        let paramStr = param.name || fallback;

        // Checks if the parameter has an upper bound (extends clause)
        if (param.ebounds) {
            const boundStr = Uarr.normalizeArray(param.ebounds)
                .map(b=> GenericType.serializeGenericType(b, m, asID) || fallback)
                .join( " & ");
            if (boundStr) paramStr += ` extends ${boundStr}`;
        }
        return paramStr;
    }).join(", ")
}

function resolveClassifierName(s: string, m: LModel, asID: boolean = true): string | null {
    // as class eid
    let lc =  resolveClassifier(s, m);
    let fallbackRet = null;
    if (lc && typeof lc === "object") return lc[asID ? "id" : "name"] || fallbackRet;
    if (typeof lc === "string") s = lc;
    // string fallback for ecore-style pointers pointing to a generic type (not in jom model)

    const fragment = s; //s.includes("#") ? s.split("#")[1] : s;
    return fragment.split("/").pop() || fallbackRet;
}

// used in GenericType.serializeETypeParameter
function serializeETypeParameter(arr: (ETypeParameter | TypeDeclaration | TypeDeclarationXMI | TypeDeclarationXMIU)[], m: LModel, asID: boolean = true): string | null {
    const fallback = null;
    arr = Uarr.normalizeArray(arr);
    console.log("serialize TD ecore", arr);
    if (!arr?.length) return fallback;
    return arr.map((param0) => {
        let param: Partial<ETypeParameter & TypeDeclaration & TypeDeclarationXMIU> = param0 as any;
        param = normalizeEcoreKeys(param, false, false);
        let paramStr = "";
        // const closer = U.closerTo(param0, )

        // 1. direction / variance prefix
        if (param.direction) paramStr += param.direction + " ";

        // 2. name
        paramStr += param.name || '';
        const upper = U.arrayMergeInPlace([],
            Uarr.normalizeArray(param.upper),
            Uarr.normalizeArray(param.ebounds as any),
            Uarr.normalizeArray(param.eBounds as any)
        )
            .filter(e=> !!e);
        // 3. upper bounds — extends clause
        if (upper?.length) {
            const upperStr = upper
                .map(b =>  GenericType.serializeGenericType(b, m, asID) || fallback)
                .filter(e => !!e)
                .join(" & ");
            if (upperStr) paramStr += ` extends ${upperStr}`;
        }

        // 4. lower bounds — super clause
        const lower =  Uarr.normalizeArray(param.lower);
        if (lower?.length) {
            const lowerStr = lower
                .map(b => GenericType.serializeGenericType(b, m, asID) || fallback)
                .filter(e => !!e)
                .join(" & ");
            if (lowerStr) paramStr += ` super ${lowerStr}`;
        }

        // 5. default type
        if (param.defaultType !== undefined) {
            const defaultStr = GenericType.serializeGenericType(param.defaultType, m, asID);
            if (defaultStr) paramStr += ` = ${defaultStr}`;
        }

        return paramStr;
    }).filter(e=>!!e).join(", ");
}
/*
// dispatcher — routes to the correct serializer depending on whether
// the value is a GenericType node or a plain TYPE (Pointer / string)
function serializeGenericTypeOrType(value: GenericType | TYPE, m: LModel, asID: boolean): string | null {
    if (value instanceof GenericType) {
        return GenericType.serializeGenericType(value, m, asID);
    }
    // plain TYPE: either a Pointer<DClassifier> or a raw string name
    if (typeof value === "string") return value;
    return (value as any).name ?? (value as any).toString() ?? null;
}*/

/**
 * recursively serialize (eBounds / eTypeArguments / eGenericType / eGenericSuperTypes / eGenericExceptions) GObjects.
 */
// const GTKeys = ["classifier" || "operandsTuple" || "operandsOr" || "operandsAnd" || "operandsDifference" || "operandsComplement" || "operandsArray" || "typeArgs" || ".upper" || "lower" || "kind"] as keyof GenericType
const GTKeys_J  = Object.keys(new GenericType("raw")) as (keyof GenericType)[];
const GTKeys_E  = Object.keys(new XmiGenericTypeJson()) as (keyof XmiGenericTypeJson)[];
const GTKeys_EU = Object.keys(new XmiGenericTypeJsonU()) as (keyof XmiGenericTypeJsonU)[];

const TDKeys_J  = Object.keys(new TypeDeclaration()) as (keyof TypeDeclaration)[];
const TDKeys_E  = Object.keys(new TypeDeclarationXMI()) as (keyof TypeDeclarationXMI)[];
const TDKeys_EU = Object.keys(new TypeDeclarationXMIU()) as (keyof TypeDeclarationXMIU)[];


// used in GenericType.serializeEcoreGenericType
export function serializeECoreGenericType(gType0: EBound | XmiGenericTypeJson | XmiGenericTypeJsonU, m: LModel, asID: boolean = true): string {
    const fallback = "";
    // if (!gType) return fallback;
    // if (typeof gType === "string") return gType;
    const g: XmiGenericTypeJson = (gType0 = normalizeEcoreKeys(gType0)) as any;
    
    // NB: eclassifier and etypeparameter are mutually exclusive: (public next: List) vs (public next: T)
    // Case 1: The generic type points to a concrete classifier (e.g., #//List)
    if (g.eclassifier) {
        const baseName = resolveClassifierName(g.eclassifier, m, asID) || fallback;
        // if (!baseName) return fallback;
        // If it has nested type arguments (e.g., List<B>), process them recursively
        let args: string = "";
        let arr = Uarr.normalizeArray(g.etypearguments);
        if (arr && arr.length > 0) {
            args = arr.map((arg) => serializeECoreGenericType(arg, m, asID) || fallback)
                .join(", ");
        }
        return baseName + (args.length ? `<${args}>` : "");
    }

    // Case 2: The generic type points to a local type parameter reference (e.g., #//Composite/B), cannot have type parameter instantiations
    if (g.etypeparameter) {
        return resolveClassifierName(g.etypeparameter, m, asID) || fallback;
    }

    // Case 3: Wildcards (? / ? extends T / ? super T)
    // Neither eclassifier nor etypeparameter is set here
    const a: any = g;
    const upper = U.arrayMergeInPlace([],
        Uarr.normalizeArray(a.eupperbound),
        Uarr.normalizeArray(a.upperbound),
        Uarr.normalizeArray(a.ebounds));

    const lower = U.arrayMergeInPlace([],
        Uarr.normalizeArray(a.elowerbound),
        Uarr.normalizeArray(a.lowerbound));

    let paramStr: string = '?';
    if (upper?.length) {
        const upperStr = upper
            .map(b => serializeECoreGenericType(b, m, asID) || fallback)
            .filter(e => !!e)
            .join(" & ");
        if (upperStr) paramStr += ` extends ${upperStr}`;
    }
    if (lower?.length) {
        const lowerStr = lower
            .map(b =>  GenericType.serializeGenericType(b, m, asID) || fallback)
            .filter(e => !!e)
            .join(" & ");
        if (lowerStr) paramStr += ` super ${lowerStr}`;
    }

    return paramStr;
}

let windoww = window as any;
windoww.serializeECoreGenericType = GenericType.serializeGenericType;
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
    const typeArgs   = Uarr.normalizeArray(node[ECoreGenericType.etypearguments]);
    const bounds     = Uarr.normalizeArray(node[ECoreGenericType.ebounds]);
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
    const bounds = Uarr.normalizeArray(node["eBounds"]);

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
        if (!name) { Log.exx(`Unexpected token at pos ${this.pos}: "${this.input.slice(this.pos, this.pos + 10)}"`, this); return null; }

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
            return new GenericTypeRef("typeParam" --> became "raw", undefined, name);
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
        if (!this.input.startsWith(expected, this.pos)) {
             Log.exx(`Expected "${expected}" at pos ${this.pos}, got "${this.input.slice(this.pos, this.pos + expected.length)}"`, this);
             return null;
        }
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





























