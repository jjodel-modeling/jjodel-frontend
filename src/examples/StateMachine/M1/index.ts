import {DModel, DValue, LClass, LModel, LObject, LProject, SetFieldAction, U} from '../../../joiner';

export class StateMachine_M1 {
    static load1(project: LProject, m2: LModel, state: LClass, transition: LClass, command: LClass, event: LClass): [LModel, LObject] {
        const m1 = this.create(project, m2);
        /* Command */
        const command1 = this.createCommand(m1, command, 'unlockDoor ud', '');
        const command2 = this.createCommand(m1, command, 'lockPanel lp', '');
        const command3 = this.createCommand(m1, command, 'unlockPanel up', '');
        const command4 = this.createCommand(m1, command, 'lockDoor ld', '');
        /* Event */
        const event1 = this.createEvent(m1, event, 'panelClosed pc', '');
        const event2 = this.createEvent(m1, event, 'doorClosed dc', '');
        const event3 = this.createEvent(m1, event, 'lightOn Io', '');
        const event4 = this.createEvent(m1, event, 'drawerOpened do', '');
        /* Events */
        const events = m1.addObject({name: 'Events'}, undefined);
        /* State */
        const idle = this.createState(m1, state, 'idle', [command1, command2]);
        const active = this.createState(m1, state, 'active', []);
        const waitingForDrawer = this.createState(m1, state, 'waitingForDrawer', []);
        const waitingForLight = this.createState(m1, state, 'waitingForLight', []);
        const unlockPanel = this.createState(m1, state, 'unlockPanel', [command3, command4]);
        /* Transition */
        const transition1 = this.createTransition(m1, transition, unlockPanel, idle, event1);
        const transition2 = this.createTransition(m1, transition, idle, active, event2);
        const transition3 = this.createTransition(m1, transition, active, waitingForDrawer, event3);
        const transition4 = this.createTransition(m1, transition, active, waitingForLight, event4);
        const transition5 = this.createTransition(m1, transition, waitingForDrawer, unlockPanel, event4);
        const transition6 = this.createTransition(m1, transition, waitingForLight, unlockPanel, event3);

        return [m1, idle];
    }
    static load2(project: LProject, m2: LModel, state: LClass, transition: LClass, command: LClass, event: LClass) {
        const m1 = this.create(project, m2);
        /* 168 Properties (84 commands & 84 events), 40 states and 48 transitions */
        const commandsLength = 84; const eventsLength = 84; const statesLength = 40; const transitionsLength = 48;
        const commands: LObject[] = []; const events: LObject[] = []; const states: LObject[] = []; const transitions: LObject[] = [];
        for(let i = 0; i < commandsLength; i++)
            commands.push(this.createCommand(m1, command, 'C' + i, U.getRandomString(5)));
        for(let i = 0; i < eventsLength; i++)
            events.push(this.createEvent(m1, event, 'E' + i, U.getRandomString(5)));
        const object = m1.addObject({name: 'Events'}, undefined);
        for(let i = 0; i < statesLength; i++)
            states.push(this.createState(m1, state, 'S' + i, [commands[i]]))
        for(let i = 0; i < transitionsLength; i++)
            transitions.push(this.createTransition(m1, transition, states[i % statesLength], states[(i + 1) % statesLength], events[i]));
        return [m1];
    }

    private static create(project: LProject, m2: LModel): LModel {
        const dModel: DModel = DModel.new(undefined, m2.id, false, true);
        const lModel: LModel = LModel.fromD(dModel);
        SetFieldAction.new(project.id, 'models', lModel.id, '+=', true);
        SetFieldAction.new(project.id, 'graphs', lModel.node?.id, '+=', true);
        return lModel;
    }
    private static createState(m1: LModel, state: LClass, name: string, actions: LObject[]): LObject {
        const dObject = m1.addObject({$name: name, $actions: actions.map(o => o.id)}, state.id);
        const lObject: LObject = LObject.fromD(dObject);
        // const feature0 = DValue.new(undefined, state.attributes[0].id, [name]);
        // const feature1 = DValue.new(undefined, state.references[0].id, actions.map(o => o.id));
        // SetFieldAction.new(dObject.id, 'features', feature0.id, '+=', true);
        // SetFieldAction.new(dObject.id, 'features', feature1.id, '+=', true);
        // lObject.features[0].value = name;
        // lObject.features[1].values = actions;
        return lObject;
    }
    private static createCommand(m1: LModel, command: LClass, name: string, code: string): LObject {
        const dObject = m1.addObject({$name: name, $code: code}, command.id);
        const lObject: LObject = LObject.fromD(dObject);
        // const feature0 = DValue.new(undefined, command.extends[0].attributes[0].id, [name]);
        // const feature1 = DValue.new(undefined, command.extends[0].attributes[1].id, [code]);
        // SetFieldAction.new(dObject.id, 'features', feature0.id, '+=', true);
        // SetFieldAction.new(dObject.id, 'features', feature1.id, '+=', true);
        // lObject.features[0].value = name;
        // lObject.features[1].value = code;
        return lObject;
    }
    public static createEvent(m1: LModel, event: LClass, name: string, code: string): LObject {
        const dObject = m1.addObject({$name: name, $code: code}, event.id);
        const lObject: LObject = LObject.fromD(dObject);
        // const feature0 = DValue.new(undefined, event.extends[0].attributes[0].id, [name]);
        // const feature1 = DValue.new(undefined, event.extends[0].attributes[1].id, [code]);
        // SetFieldAction.new(dObject.id, 'features', feature0.id, '+=', true);
        // SetFieldAction.new(dObject.id, 'features', feature1.id, '+=', true);
        // lObject.features[0].value = name;
        // lObject.features[1].value = code;
        return lObject;
    }
    public static createTransition(m1: LModel, transition: LClass, source: LObject, target: LObject, event: LObject): LObject {
        const dObject = m1.addObject({$source: source.id, $target: target.id, $trigger: event.id}, transition.id);
        const lObject: LObject = LObject.fromD(dObject);
        // const feature0 = DValue.new(undefined, transition.references[0].id, [source.id]);
        // const feature1 = DValue.new(undefined, transition.references[1].id, [target.id]);
        // const feature2 = DValue.new(undefined, transition.references[2].id, [event.id]);
        // SetFieldAction.new(dObject.id, 'features', feature0.id, '+=', true);
        // SetFieldAction.new(dObject.id, 'features', feature1.id, '+=', true);
        // SetFieldAction.new(dObject.id, 'features', feature2.id, '+=', true);
        // lObject.features[0].values = [source];
        // lObject.features[1].values = [target];
        // lObject.features[2].values = [event];
        return lObject;
    }
}
