import {DModel, LClass, LModel, LPackage, LProject, SetFieldAction} from '../../../joiner';

export class StateMachine_M2 {
    static load(project: LProject): [LModel, LPackage, LClass, LClass, LClass,LClass, LClass] {
        const elements = this.create(project);
        const m2 = elements[0];
        const pkg = elements[1];
        const abstractEvent = this.createAbstractEvent(pkg);
        const command = this.createCommand(pkg, abstractEvent);
        const event = this.createEvent(pkg, abstractEvent);
        const state = this.createState(pkg, command);
        const transition = this.createTransition(pkg, state, event);
        // const stateMachine = this.createStateMachine(pkg, state, transition);
        return [
            m2, pkg, state, transition, abstractEvent, command, event
        ];
    }
    private static create(project: LProject): [LModel, LPackage] {
        const dModel = DModel.new('metamodel_1', undefined, true);
        const lModel: LModel = LModel.fromD(dModel);
        SetFieldAction.new(project.id, 'metamodels', lModel.id, '+=', true);
        SetFieldAction.new(project.id, 'graphs', lModel.node?.id, '+=', true);
        // project.metamodels = [...project.metamodels, lModel];
        // project.graphs = [...project.graphs, lModel.node as LGraph];
        const dPackage = lModel.addChild('package');
        const lPackage: LPackage = LPackage.fromD(dPackage);
        lPackage.name = 'default';
        // const tab = TabDataMaker.metamodel(dModel);
        // await DockManager.open('models', tab);
        return [lModel, lPackage];
    }
    private static createStateMachine(pkg: LPackage, state: LClass, transition: LClass): LClass {
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
    private static createState(pkg: LPackage, command: LClass): LClass {
        const dClass = pkg.addClass('State');
        const lClass: LClass = LClass.fromD(dClass);
        const name = lClass.addAttribute('name', 'Pointer_ESTRING');
        name.lowerBound = 1;
        const actions = lClass.addReference('actions', command.id);
        actions.upperBound = -1;
        return lClass;
    }
    private static createTransition(pkg: LPackage, state: LClass, event: LClass): LClass {
        const dClass = pkg.addClass('Transition');
        const lClass: LClass = LClass.fromD(dClass);
        const source = lClass.addReference('source', state.id);
        const target = lClass.addReference('target', state.id);
        const trigger = lClass.addReference('trigger', event.id);
        return lClass;
    }
    private static createAbstractEvent(pkg: LPackage): LClass {
        const dClass = pkg.addClass('AbstractEvent');
        const lClass: LClass = LClass.fromD(dClass);
        lClass.abstract = true;
        const name = lClass.addAttribute('name', 'Pointer_ESTRING');
        name.lowerBound = 1;
        const code = lClass.addAttribute('code', 'Pointer_ESTRING');
        name.lowerBound = 1;
        return lClass;
    }
    private static createCommand(pkg: LPackage, abstractEvent: LClass): LClass {
        const dClass = pkg.addClass('Command');
        const lClass: LClass = LClass.fromD(dClass);
        lClass.extends = [abstractEvent];
        return lClass;
    }
    private static createEvent(pkg: LPackage, abstractEvent: LClass): LClass {
        const dClass = pkg.addClass('Event');
        const lClass: LClass = LClass.fromD(dClass);
        lClass.extends = [abstractEvent];
        return lClass;
    }
}
