import {OclEngine} from "@stekoe/ocl.js"
import {
    AbstractConstructor,
    bool,
    Constructor,
    DGraphElement,
    Dictionary,
    DModelElement,
    DViewElement,
    GObject,
    LGraphElement,
    LModelElement,
    LObject,
    LPointerTargetable,
    LValue,
    LViewElement,
    RuntimeAccessible,
    RuntimeAccessibleClass
} from "../joiner";
import {OclResult} from "@stekoe/ocl.js/dist/components/OclResult";
import {Utils} from "@stekoe/ocl.js/dist/components/Utils";
import {transientProperties, ViewEClassMatch} from "../joiner/classes";

let windoww = window as any;

export class Company {
    static all: Company[] = [];
    constructor(public name: string ='cname', public employee: Persona[]=[], public manager: Persona|null = null) { Company.all.push(this); }
}
export class Persona {
    static all: Persona[] = [];
    constructor(public name: string='pname', public age: number=18, public isUnemployed: boolean=true){ Persona.all.push(this) }
}

@RuntimeAccessible
export class OCL extends RuntimeAccessibleClass{
    public static evaluate<T extends GObject>(obj0: T, constructor: Constructor<T>, oclexp: string, typeused: Constructor[]=[], oclEngine?: OclEngine): OclResult {
        if (!oclEngine) {
            oclEngine = OclEngine.create();
            var oclResult = null;
            // let objexp = //"context Object inv: self.age > 0" +
            if (!oclexp) oclexp = "context Persona inv: self.age>0";


            const typeregister: GObject = {};
            typeregister[(constructor as any as typeof RuntimeAccessibleClass).cname || constructor.name] = constructor;
            for (let type of typeused) { typeregister[(type as any as typeof RuntimeAccessibleClass).cname || type.name] = type; }
            oclEngine.registerTypes(typeregister);
            oclEngine.addOclExpression(oclexp);
        }

        let obj: GObject = obj0;
        if (!obj) {
            obj = new Persona();
            obj.age = -55;
            obj.name = {notEmpty: () => { console.log('innerfunc'); return true} };
            obj.f = (a:any) => { console.error('called a', a); return a>0};
            obj.name0= '';
//obj.$$typeof = Persona;

            obj.__asArray = true;
        }
        // as you set classname in runtimeaccessible you must set this typeName
        // obj.typeName = constructor.name || constructor;
// obj = getPath;
// obj.constructor = Persona;
        oclResult = oclEngine.evaluate(obj);
        return oclResult;
    }

    public static filter<T extends GObject, M extends 'ocl' | 'bool' | 'src',
        R extends (M extends 'ocl' ? (OclResult | undefined) : (M extends 'src' ? T | undefined : boolean))
        >(keepIndex: boolean, returnType: M, obj0: T[], oclexp: string, typeused: Constructor[]=[]): R[] {
        return OCL.filter0(keepIndex, returnType, obj0, oclexp, typeused) as any;
    }

    public static init() {

        OCL.Util.getClassName;
        Utils.getClassName_original = Utils.getClassName;
        Utils.getClassName = (obj: any) => {
            let dobj = obj?.__raw || obj;
            switch (dobj?.className)
                default:  return Utils.getClassName_original(obj);
                case DValue.cname:
                case DObject.cname:
                    return (obj as LObject | LValue).instanceof?.name || dobj.className;
                    not good, i want DObjects to have both type DOBject and their obj.instanceof.name,.
                    so after this i need to make a prototype of fake constructor for each metaclass having m2class.__proto__ = DObject; ?
                    and every feature having fake constructor m2feature.__proto__ = DAttribute | DReference?
        }
    }
    private static getOCLScore(ocl: string): number { return ocl.length; }

    public static test(mp0: DModelElement | LModelElement | undefined, view0: LViewElement | DViewElement | undefined, node0?: LGraphElement | DGraphElement): number {
        if (!mp0 || !view0) return ViewEClassMatch.MISMATCH_OCL;
        let mp: DModelElement, lmp: LModelElement;
        let node: DGraphElement, lnode: LGraphElement;
        let view: DViewElement;
        // @ts-ignore
        if ((mp = mp0.__raw)) lmp = mp0; else { lmp = mp0; mp = (lmp as LModelElement).__raw; }
        // @ts-ignore
        if ((node = node0?.__raw)) lnode = node0; else { lnode = node0; node = lnode?.__raw; }
        // @ts-ignore
        if (!(view = view.__raw)) view = view0.__raw;
        let oclEngine: OclEngine;
        if (!transientProperties.view[view.id]) transientProperties.view[view.id] = {} as any;
        if (transientProperties.view[view.id].oclEngine) oclEngine = transientProperties.view[view.id].oclEngine;
        else {
            transientProperties.view[view.id].oclEngine = oclEngine = OclEngine.create();
            oclEngine.registerTypes(RuntimeAccessibleClass.classes);
            oclEngine.addOclExpression(view.oclCondition); todo: make it that setter of view.set_oclCondituion cancels the transient.oclEngine or updates his addOclExpression;
        }
        try {
            let oclResult: OclResult;
            if (!lmp) lmp = LPointerTargetable.fromD(mp);
            if (node) {
                // dangerous cheat, to make ocl be able to access current "node" if model have multiple nodes.
                const oldNode = transientProperties.modelElement[mp.id].node;
                transientProperties.modelElement[mp.id].node = lnode || LPointerTargetable.fromD(node);
                oclResult = oclEngine.evaluate(lmp)
                transientProperties.modelElement[mp.id].node = oldNode;
            }
            else oclResult = oclEngine.evaluate(lmp);

            return oclResult ? OCL.getOCLScore(view.oclCondition) : ViewEClassMatch.MISMATCH_OCL;
        } catch(e) {
            console.error('failed to evalute OCL expression:', {e, obj: mp, view: view.name, oclexp: view.oclCondition, node});
            return -1;
        }
        // oclEngine.setTypeDeterminer()
    }

    private static filter0<T extends GObject>(keepIndex: boolean, returnType: 'ocl' | 'bool' | 'src', obj0: T[], oclexp: string, typeused: Constructor[]=[]) {
        var oclEngine = OclEngine.create();
        var oclResult = null;
        const typeregister: GObject = {}; cache this glovally
        for (let type of typeused) { typeregister[(type as any as typeof RuntimeAccessibleClass).cname || type.name] = type; }
        oclEngine.registerTypes(typeregister);
        oclEngine.addOclExpression(oclexp); cache this oclEngine vy view

        let obj: T[] = obj0;
        let ret: ((OclResult | boolean) | (GObject | undefined))[] = [];

        for (let i = 0; i < obj.length; i++) { do imsteasd simgle dumciom ocl.test(obj)
            let res: OclResult | undefined;
            try { res = oclEngine.evaluate(obj[i]); }
            catch(e) { console.error('failed to evalute OCL expression:', {e, obj, oclexp}); res = undefined; }
            if (returnType === 'ocl') {
                ret[i] = res;
                continue; }
            let bool = res && res.getEvaluatedContexts().length > 0 && res.getResult();
            if (returnType === 'bool') ret[i] = bool;
            else ret[i] = bool ? obj[i] : undefined;
        }

        if (!keepIndex) {
            ret = (ret).filter((r:any) => !!r) as any;
        }

        return ret;
    }
}
windoww.OCL = OCL;
const oclEngine = OclEngine.create();


/*

let p = new Persona();
p.age = 0;
let p2 = new Persona();
p2.age = 1;
let p3 = new Persona();
p3.age = -5;
let pp = [p, p2, p3];
OCL.filter(true, 'ocl', pp, undefined, "context Persona inv: self.age>0")


///

OCL.filter(true, 'src', Selectors.getAll(DClass, undefined, undefined, true), "context DClass inv: self.abstract")
/// works
let pp = Selectors.getAll(DClass, undefined, undefined, true);
OCL.filter(true, 'src', Selectors.getAll(DClass, undefined, undefined, true), "context DClass inv: self.name = \"class_2\"")

* */

oclEngine.addOclExpression(`
    -- No one should work that long...
    context Company inv:
        self.employee->forAll(p : Person | p.age <= 65 )

    -- If a company has a manager, 
    -- the company has at least one employee.
    context Company
        inv: self.manager.isUnemployed = false
        inv: self.employee->notEmpty()
`);

let company = new Company();
company.employee.push(new Persona());

const oclResult = oclEngine.evaluate(company);



windoww.Person = Persona;
windoww.Company = Company;
windoww.oclEngine = oclEngine;

console.log('tests:', '\n' +
    'oclEngine.addOclExpression(`\n' +
    '    -- No one should work that long...\n' +
    '    context Company inv:\n' +
    '        self.employee->forAll(p : Person | p.age <= 65 )\n' +
    '\n' +
    '    -- If a company has a manager, \n' +
    '    -- the company has at least one employee.\n' +
    '    context Company\n' +
    '        inv: self.manager.isUnemployed = false\n' +
    '        inv: self.employee->notEmpty()\n' +
    '`);\n' +
    '\n' +
    'const customTypes = {\n' +
    '  "Person": Person, "Company": Company \n' +
    '}\n' +
    '\n' +
    'oclEngine.registerTypes(customTypes);' +
    'let company = new Company();\n' +
    'let employee = new Person();\n' +
    'let parent = new Person();\n' +
    'let child = new Person();\n' +
    'child.parents = [parent];\n' +
    'parent.parents = [parent];\n' +
    'employee.age = 70;\n' +
    'company.employee.push(employee);\n' +
    '\n' +
    'console.log(\'evaluate company\', oclEngine.evaluate(company));\n' +
    '\n' +
    '\n' +
    '// parentchild test\n' +
    'let oclEnginep = OclEngine.create();\n' +
    'oclEnginep.addOclExpression(`\n' +
    '    context Person\n' +
    '        inv: self.parents->forAll(p | p <> self)\n' +
    '`)\n' +
    'console.log(\'evaluate parent\', oclEnginep.evaluate(parent));\n' +
    'console.log(\'evaluate child\', oclEnginep.evaluate(child));\n');
