import {DProject, DUser, LProject, LUser} from '../../joiner';
import {StateMachine_M2} from './M2';
import {StateMachine_M1} from './M1';

export class StateMachine {
    static async load() {
        const user = LUser.fromPointer(DUser.current);
        const dProject = DProject.new('private', 'State Machine');
        const lProject: LProject = LProject.fromD(dProject);
        user.project = lProject;
        const elements = await StateMachine_M2.load(lProject);
        const m2 = elements[0];
        const pkg = elements[1];
        const stateMachine = elements[2];
        const state = elements[3];
        const transition = elements[4];
        const abstractEvent = elements[5];
        const command = elements[6];
        const event = elements[7];
        await StateMachine_M1.load(lProject, m2, stateMachine, state, transition, command, event);
    }

}
