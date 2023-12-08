import {DModel, LClass, LGraph, LModel, LPackage, LProject} from "../../../joiner";
import TabDataMaker from "../../../components/abstract/tabs/TabDataMaker";
import DockManager from "../../../components/abstract/DockManager";

export class StateMachine_M2 {
    static async load(project: LProject): Promise<[LModel, LPackage, LClass, LClass, LClass, LClass,LClass, LClass]> {
        const elements = await this.create(project);
        const m2 = elements[0];
        const pkg = elements[1];
        const abstractEvent = await this.createAbstractEvent(pkg);
        const command = await this.createCommand(pkg, abstractEvent);
        const event = await this.createEvent(pkg, abstractEvent);
        const state = await this.createState(pkg, command);
        const transition = await this.createTransition(pkg, state, event);
        const stateMachine = await this.createStateMachine(pkg, state, transition);
        return [
            m2, pkg, stateMachine, state, transition, abstractEvent, command, event
        ];
    }
    private static async create(project: LProject): Promise<[LModel, LPackage]> {
        const dModel = DModel.new('M2', undefined, true);
        const lModel: LModel = LModel.fromD(dModel);
        project.metamodels = [...project.metamodels, lModel];
        project.graphs = [...project.graphs, lModel.node as LGraph];
        const dPackage = lModel.addChild('package');
        const lPackage: LPackage = LPackage.fromD(dPackage);
        lPackage.name = 'default';
        // const tab = TabDataMaker.metamodel(dModel);
        // await DockManager.open('models', tab);
        return [lModel, lPackage];
    }
    private static async createStateMachine(pkg: LPackage, state: LClass, transition: LClass): Promise<LClass> {
        const dClass = pkg.addClass('StateMachine');
        const lClass: LClass = LClass.fromD(dClass);
        const name = lClass.addAttribute('name', 'Pointer_ESTRING');
        name.lowerBound = 1;
        const states = lClass.addReference('states', state.id);
        states.upperBound = -1;
        const transitions = lClass.addReference('transitions', transition.id);
        transitions.upperBound = -1;
        return lClass;
    }
    private static async createState(pkg: LPackage, command: LClass): Promise<LClass> {
        const dClass = pkg.addClass('State');
        const lClass: LClass = LClass.fromD(dClass);
        const name = lClass.addAttribute('name', 'Pointer_ESTRING');
        name.lowerBound = 1;
        const actions = lClass.addReference('actions', command.id);
        actions.upperBound = -1;
        return lClass;
    }
    private static async createTransition(pkg: LPackage, state: LClass, event: LClass): Promise<LClass> {
        const dClass = pkg.addClass('Transition');
        const lClass: LClass = LClass.fromD(dClass);
        const source = lClass.addReference('source', state.id);
        const target = lClass.addReference('target', state.id);
        const trigger = lClass.addReference('trigger', event.id);
        return lClass;
    }
    private static async createAbstractEvent(pkg: LPackage): Promise<LClass> {
        const dClass = pkg.addClass('AbstractEvent');
        const lClass: LClass = LClass.fromD(dClass);
        lClass.abstract = true;
        const name = lClass.addAttribute('name', 'Pointer_ESTRING');
        name.lowerBound = 1;
        const code = lClass.addAttribute('code', 'Pointer_ESTRING');
        name.lowerBound = 1;
        return lClass;
    }
    private static async createCommand(pkg: LPackage, abstractEvent: LClass): Promise<LClass> {
        const dClass = pkg.addClass('Command');
        const lClass: LClass = LClass.fromD(dClass);
        lClass.extends = [abstractEvent];
        return lClass;
    }
    private static async createEvent(pkg: LPackage, abstractEvent: LClass): Promise<LClass> {
        const dClass = pkg.addClass('Event');
        const lClass: LClass = LClass.fromD(dClass);
        lClass.extends = [abstractEvent];
        return lClass;
    }
}
