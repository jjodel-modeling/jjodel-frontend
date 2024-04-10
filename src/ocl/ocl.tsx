import {OclEngine} from "@stekoe/ocl.js"
import {
    Constructor, DGraphElement,
    DModelElement, DViewElement,
    GObject, LGraphElement,
    LModelElement,
    LViewElement,
    RuntimeAccessible,
    RuntimeAccessibleClass, ViewEClassMatch
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

    public static test(me: DModelElement | LModelElement | undefined, view: LViewElement | DViewElement | undefined, node?: LGraphElement | DGraphElement): boolean | (typeof ViewEClassMatch)["MISMATCH_OCL"] {
        try {
            const types = RuntimeAccessibleClass.getAllClasses();
            if(!me || !view) return false;
            return !!OCL.filter(true, 'src', [me], view.oclCondition, types as any)[0];
        } catch (e) {
            return false
        }

    }


    public static filter<T extends GObject>(keepIndex: boolean, returnType: 'ocl' | 'bool' | 'src', obj0: T[], oclexp: string, typeused: Constructor[]=[]) {
        windoww.OclEngine = OclEngine;
        var oclEngine = OclEngine.create();
        var oclResult = null;
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
