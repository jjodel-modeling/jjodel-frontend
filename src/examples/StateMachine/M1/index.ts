import {DModel, LClass, LGraph, LModel, LObject, LProject, U} from "../../../joiner";

export class StateMachine_M1 {
    static async load(project: LProject, m2: LModel, stateMachine: LClass, state: LClass, transition: LClass, command: LClass, event: LClass) {
        const m1 = await this.create(project, m2);
        /* Command */
        const command1 = await this.createCommand(m1, command, 'unlockDoor ud', '');
        const command2 = await this.createCommand(m1, command, 'lockPanel lp', '');
        const command3 = await this.createCommand(m1, command, 'unlockPanel up', '');
        const command4 = await this.createCommand(m1, command, 'lockDoor ld', '');
        /* Event */
        const event1 = await this.createEvent(m1, event, 'panelClosed pc', '');
        const event2 = await this.createEvent(m1, event, 'doorClosed dc', '');
        const event3 = await this.createEvent(m1, event, 'lightOn Io', '');
        const event4 = await this.createEvent(m1, event, 'drawerOpened do', '');
        /* State */
        const idle = await this.createState(m1, state, 'idle', [command1, command2]);
        const active = await this.createState(m1, state, 'active', []);
        const waitingForDrawer = await this.createState(m1, state, 'waitingForDrawer', []);
        const waitingForLight = await this.createState(m1, state, 'waitingForLight', []);
        const unlockPanel = await this.createState(m1, state, 'unlockPanel', [command3, command4]);
        /* Transition */
        const transition1 = await this.createTransition(m1, transition, unlockPanel, idle, event1);
        const transition2 = await this.createTransition(m1, transition, idle, active, event2);
        const transition3 = await this.createTransition(m1, transition, active, waitingForDrawer, event3);
        const transition4 = await this.createTransition(m1, transition, active, waitingForLight, event4);
        const transition5 = await this.createTransition(m1, transition, waitingForDrawer, unlockPanel, event4);
        const transition6 = await this.createTransition(m1, transition, waitingForLight, unlockPanel, event3);

        return m1;
    }
    private static async create(project: LProject, m2: LModel): Promise<LModel> {
        const dModel: DModel = DModel.new('M1', m2.id, false, true);
        const lModel: LModel = LModel.fromD(dModel);
        project.models = [...project.models, lModel];
        project.graphs = [...project.graphs, lModel.node as LGraph];
        // const tab = TabDataMaker.model(dModel);
        // await DockManager.open('models', tab);
        return lModel;
    }
    private static async createState(m1: LModel, state: LClass, name: string, actions: LObject[]): Promise<LObject> {
        const dObject = m1.addObject(state.id);
        const lObject = LObject.fromD(dObject);
        lObject.features[0].value = name;
        lObject.features[1].values = actions;
        return lObject;
    }
    private static async createCommand(m1: LModel, command: LClass, name: string, code: string): Promise<LObject> {
        const dObject = m1.addObject(command.id);
        const lObject = LObject.fromD(dObject);
        lObject.features[0].value = name;
        lObject.features[1].value = code;
        return lObject;
    }
    private static async createEvent(m1: LModel, event: LClass, name: string, code: string): Promise<LObject> {
        const dObject = m1.addObject(event.id);
        const lObject = LObject.fromD(dObject);
        lObject.features[0].value = name;
        lObject.features[1].value = code;
        return lObject;
    }
    private static async createTransition(m1: LModel, transition: LClass, source: LObject, target: LObject, event: LObject): Promise<LObject> {
        const dObject = m1.addObject(transition.id);
        const lObject = LObject.fromD(dObject);
        U.log(lObject)
        lObject.features[0].values = [source];
        lObject.features[1].values = [target];
        lObject.features[2].values = [event];
        return lObject;
    }
}
