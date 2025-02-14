import {OclEngine} from "@stekoe/ocl.js"
import {
    Constructor, DGraphElement,
    DModel,
    DModelElement, DPointerTargetable, DState, DViewElement,
    GObject, LGraphElement,
    LModelElement,
    Log,
    LPointerTargetable,
    LViewElement,
    RuntimeAccessible,
    RuntimeAccessibleClass, store, transientProperties, ViewEClassMatch
} from "../joiner";
import {OclResult} from "@stekoe/ocl.js/dist/components/OclResult";

let windoww = window as any;

export class Company {
    static all: Company[] = [];
    constructor(public name: string ='cname', public employee: Persona[]=[], public manager: Persona|null = null) { Company.all.push(this); }
}
export class Persona {
    static all: Persona[] = [];
    constructor(public name: string='pname', public age: number=18, public isUnemployed: boolean=true){ Persona.all.push(this) }
}

export class OCL{
    public static evaluate<T extends GObject>(obj0: T, constructor: Constructor<T>, oclexp: string, typeused: Constructor[]=[], oclEngine?: OclEngine): OclResult {
        windoww.OclEngine = OclEngine;
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

    public static test_bugged_new(mp0: DModelElement | LModelElement | undefined, view0: LViewElement | DViewElement | undefined, node0?: LGraphElement | DGraphElement): boolean | (typeof ViewEClassMatch)["MISMATCH_OCL"] {
        if (!mp0 || !view0) return ViewEClassMatch.MISMATCH_OCL;
        let mp: DModelElement, lmp: LModelElement;
        let node: DGraphElement, lnode: LGraphElement;
        let view: DViewElement;
        // @ts-ignore
        if ((mp = mp0.__raw)) lmp = mp0; else { lmp = mp0; mp = (lmp as LModelElement)?.__raw; }
        // @ts-ignore
        if ((node = node0?.__raw)) lnode = node0; else { lnode = node0; node = lnode?.__raw; }
        // @ts-ignore
        view = view0?.__raw || view0;
        let oclCondition = view.oclCondition;
        let tv = transientProperties.view[view.id];
        console.log("Evaluating ocl: "+view.oclCondition, {view, ocl:view.oclCondition});
        if (!view.oclCondition) { return true; }
        let oclEngine: OclEngine;
        if (!tv) transientProperties.view[view.id] = tv = {} as any;
        if (tv.oclEngine) oclEngine = tv.oclEngine;
        else {
            windoww.OclEngine = OclEngine;
            tv.oclEngine = oclEngine = OclEngine.create();
            let state: DState = store.getState();
            let rootModel: DModel = mp as any;
            windoww.rootModel = rootModel;
            while (rootModel && rootModel.className !== "DModel") rootModel = DPointerTargetable.fromPointer(rootModel.father, state);
            oclEngine.registerTypes(RuntimeAccessibleClass.getOCLClasses(rootModel.id));
            oclEngine.addOclExpression(oclCondition);
            console.log("4 Evaluating ocl: "+view.oclCondition, {view, ocl:view.oclCondition, mp, lmp, oclEngine});
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
            windoww.oclDebug={oclResult, oclEngine, lmp, oclCondition};
            console.log("5 Evaluating ocl: "+view.oclCondition, {view, ocl:view.oclCondition, mp, lmp, oclResult, oclEngine});
            // return oclResult ? OCL.getOCLScore(oclCondition) : ViewEClassMatch.MISMATCH_OCL;
            let matches: boolean = oclResult && oclResult.getEvaluatedContexts().length > 0 && oclResult.getResult();
            return matches || ViewEClassMatch.MISMATCH_OCL;
        } catch(e) {
            Log.ee('failed to evalute OCL expression:', {e, obj: mp, view: view.name, oclexp: view.oclCondition, node});
            return ViewEClassMatch.MISMATCH_OCL;
        }
        // oclEngine.setTypeDeterminer()
    }
    public static test(me: DModelElement | LModelElement | undefined, view: LViewElement | DViewElement | undefined, node?: LGraphElement | DGraphElement): boolean | (typeof ViewEClassMatch)["MISMATCH_OCL"] {
        if (!me || !view) return false;
        const condition = view.oclCondition;
        if (!condition) return true;
        try {
            const types = RuntimeAccessibleClass.getAllClasses();
            return !!OCL.filter(true, 'src', [me], condition, types as any)[0];
        } catch (e) {
            return false
        }

    }


    // warning: do not read ret.result with returntype='ocl'
    // it neeeds to be evaluated both with  ret.getEvaluatedContexts().length > 0 && ret.getResult();
    public static filter<T extends GObject>(keepIndex: boolean, returnType: 'ocl' | 'bool' | 'src', obj0: T[], oclexp: string, typeused: Constructor[]=[]) {
        windoww.OclEngine = OclEngine;
        var oclEngine = OclEngine.create();
        var oclResult = null;
        windoww.oclEngine = oclEngine;
        const typeregister: GObject = {};
        for (let type of typeused) { typeregister[(type as any as typeof RuntimeAccessibleClass).cname || type.name] = type; }
        oclEngine.registerTypes(typeregister);
        if (!oclexp) oclexp = "context Persona inv: self.age>0";
        oclEngine.addOclExpression(oclexp);

        let obj: GObject[] = obj0;
        let ret: ((OclResult | boolean) | (GObject | null))[] = [];

        for (let i = 0; i < obj.length; i++) {
            let res: OclResult | null;
            try { res = oclEngine.evaluate(obj[i]); }
            catch(e) { console.error('failed to evalute object:', {e}); res = null; }
            if (returnType === 'ocl') {
                ret[i] = res;
                continue; }
            let bool = res && res.getEvaluatedContexts().length > 0 && res.getResult();
            if (returnType === 'bool') ret[i] = bool;
            else ret[i] = bool ? obj[i] : null;
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

if (false as any) console.log('tests:', '\n' +
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
