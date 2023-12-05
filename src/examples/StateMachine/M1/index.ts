import {DModel, LGraph, LModel, LProject, LClass, GObject, LObject, DViewPoint, DViewElement, U} from "../../../joiner";
import TabDataMaker from "../../../components/abstract/tabs/TabDataMaker";
import DockManager from "../../../components/abstract/DockManager";
import {Views} from './Views';

export class StateMachine_M1 {
    static async load(project: LProject, m2: LModel, stateMachine: LClass, state: LClass, transition: LClass, command: LClass, event: LClass) {
        const m1 = await this.create(project, m2);
        /* Command */
        const command1 = await this.createCommand(m1, command, 'unlockDoor ud', '');
        const command2 = await this.createCommand(m1, command, 'lockPanel lp', '');
        const command3 = await this.createCommand(m1, command, 'unlockPanel up', '');
        const command4 = await this.createCommand(m1, command, 'lockDoor ld', '');

        const command5 = await this.createCommand(m1, command, 'panelClosed pc', '');
        const command6 = await this.createCommand(m1, command, 'doorClosed dc', '');
        const command7 = await this.createCommand(m1, command, 'lightOn Io', '');
        const command8 = await this.createCommand(m1, command, 'drawerOpened do', '');
        /* State */
        const idle = await this.createState(m1, state, 'idle', [command1, command2]);
        const active = await this.createState(m1, state, 'active', []);
        const waitingForDrawer = await this.createState(m1, state, 'waitingForDrawer', []);
        const waitingForLight = await this.createState(m1, state, 'waitingForLight', []);
        const unlockPanel = await this.createState(m1, state, 'unlockPanel', [command3, command4]);
        /* Transition */
        const transition1 = await this.createTransition(m1, transition, unlockPanel, idle, command5);
        const transition2 = await this.createTransition(m1, transition, idle, active, command6);
        const transition3 = await this.createTransition(m1, transition, active, waitingForDrawer, command7);
        const transition4 = await this.createTransition(m1, transition, active, waitingForLight, command8);
        const transition5 = await this.createTransition(m1, transition, waitingForDrawer, unlockPanel, command8);
        const transition6 = await this.createTransition(m1, transition, waitingForLight, unlockPanel, command7);
        /* Nodes Management */
        if(idle.node) {idle.node.x = 433; idle.node.y = 69;}
        if(active.node) {active.node.x = 503; active.node.y = 362;}
        if(waitingForLight.node) {waitingForLight.node.x = 72; waitingForLight.node.y = 363;}
        if(unlockPanel.node) {unlockPanel.node.x = 13; unlockPanel.node.y = 32;}
        if(waitingForDrawer.node) {waitingForDrawer.node.x = 293; waitingForDrawer.node.y = 207;}
        await this.createViews(state);
    }
    private static async create(project: LProject, m2: LModel): Promise<LModel> {
        const dModel: DModel = DModel.new('M1', m2.id, false, true);
        const lModel: LModel = LModel.fromD(dModel);
        project.models = [...project.models, lModel];
        project.graphs = [...project.graphs, lModel.node as LGraph];
        const tab = TabDataMaker.model(dModel);
        await DockManager.open('models', tab);
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
    private static async createViews(state: LClass): Promise<void> {
        const viewpoint = DViewPoint.new('StateMachine', '');
        const modelView = DViewElement.new('Model', Views.model);
        modelView.viewpoint = viewpoint.id; modelView.oclCondition = 'context DModel inv: self.isMetamodel = false';
        const stateView = DViewElement.new('State', Views.state);
        stateView.viewpoint = viewpoint.id; stateView.oclCondition = `context DObject inv: self.instanceof.id = '${state.id}'`;
    }
    private static async createTransition(m1: LModel, transition: LClass, source: LObject, target: LObject, command: LObject): Promise<LObject> {
        const dObject = m1.addObject(transition.id);
        const lObject = LObject.fromD(dObject);
        U.log(lObject)
        lObject.features[0].values = [source];
        lObject.features[1].values = [target];
        lObject.features[2].values = [command];
        return lObject;
    }

}
