import {
    BEGIN,
    DProject,
    DUser, DViewElement,
    END,
    LClass,
    LModel, LObject,
    LPackage,
    LProject,
    LUser, LViewElement,
    LViewPoint,
    SetFieldAction
} from '../../joiner';
import {StateMachine_M2} from './M2';
import {StateMachine_M1} from './M1';
import {StateMachine_Views} from './views';

export class StateMachine {
    private static user: LUser;
    private static project: LProject;
    private static M2: LModel;
    private static pkg: LPackage;
    private static state: LClass
    private static transition: LClass;
    private static command: LClass;
    private static event: LClass;
    private static M1: LModel;
    private static idle: LObject;
    private static viewpoint: LViewPoint;

    /* S1 */
    private static reset: LClass;

    /* S2 */
    private static resetInstance: LObject;

    /* S3 */
    private static view: LViewElement;

    /* S11 */
    private static start: LClass;

    static load0(name: string) {
        this.user = LUser.fromPointer(DUser.current);
        /* Metamodel */
        BEGIN()
        const dProject = DProject.new('private', name);
        this.project = LProject.fromD(dProject);
        this.user.project = this.project;
        const elementsM2 = StateMachine_M2.load(this.project);
        this.M2 = elementsM2[0];
        this.pkg = elementsM2[1];
        this.state = elementsM2[2];
        this.transition = elementsM2[3];
        const abstractEvent = elementsM2[4];
        this.command = elementsM2[5];
        this.event = elementsM2[6];
        END()

        /* Model */
        const elementsM1 = StateMachine_M1.load1(this.project, this.M2, this.state, this.transition, this.command, this.event);
        this.M1 = elementsM1[0];
        this.idle = elementsM1[1];

        /* Views */
        BEGIN()
        this.viewpoint = StateMachine_Views.load(this.project, this.M1, this.state, this.command, this.event, this.transition);
        END()
    }
    static load1(name: string) {
        this.load0(name);
        this.reset = LClass.fromD(this.pkg.addClass('Reset'));
        const triggers = this.reset.addReference('triggers', this.event.id);
        triggers.upperBound = -1;
    }
    static load2(name: string) {
        this.load1(name);
        const transition = this.reset.addReference('transition', this.state.id);
        transition.upperBound = 1;
        this.resetInstance = LObject.fromD(this.M1.addObject(this.reset.id));
    }
    static load3(name: string) {
        this.load2(name);
        this.view = LViewElement.fromD(DViewElement.new('Reset', `<div className={'root bg-white p-2'}>RESET</div>`));
        SetFieldAction.new(this.view.id, 'viewpoint', this.viewpoint.id, '', true);
        this.view.oclCondition = `context DObject inv: self.instanceof.id = '${this.reset.id}'`;
    }
    static load4(name: string) {
        this.load3(name);
        this.state.name = 'Situation';
    }
    static load5(name: string) {
        this.load4(name);
    }
    static load6(name: string) {
        this.load5(name);
    }
    static load7(name: string) {
        this.load6(name);
        this.reset.delete();
    }
    static load8(name: string) {
        this.load7(name);
    }
    static load9(name: string) {
        this.load8(name);
        this.view.viewpoint = undefined;
    }
    static load10(name: string) {
        this.load9(name);
        const transitions = this.state.addReference('transitions', this.transition.id);
        transitions.upperBound = -1;
    }
    static load11(name: string) {
        this.load10(name);
        this.start = LClass.fromD(this.pkg.addClass('Start'));
        this.start.extends = [this.state];
        this.resetInstance.instanceof = this.start;
    }
    static load12(name: string) {
        this.load11(name);
        const eventInstance = StateMachine_M1.createEvent(this.M1, this.event, 'Reset', '');
        const transitionInstance = StateMachine_M1.createTransition(this.M1, this.transition, this.resetInstance, this.idle, eventInstance);
        this.view.name = 'Start';
        SetFieldAction.new(this.view.id, 'viewpoint', this.viewpoint.id, '', true);
        this.view.oclCondition = `context DObject inv: self.instanceof.id = '${this.start.id}'`;
        this.view.jsxString = `<div style={{borderRadius: '999px'}} className={'root bg-dark'}></div>`;
    }
}
