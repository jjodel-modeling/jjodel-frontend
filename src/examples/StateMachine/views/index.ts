import type {LClass, LProject} from '../../../joiner';
import {DViewElement, DViewPoint, DObject, LModel, LObject, LViewPoint, LViewElement} from '../../../joiner';
import {Dependencies} from './dependencies';
import ModelViews from "./model";
import TextView from "./text";

export class StateMachine_Views {
    static load(project: LProject, state: LClass, command: LClass, event: LClass, transition: LClass): [LViewPoint, LViewElement, LViewElement] {
        return this.create(project, state, command, event, transition);
    }

    private static create(project: LProject, state: LClass, command: LClass, event: LClass, transition: LClass): [LViewPoint, LViewElement, LViewElement] {
        /* Viewpoint */
        const viewpoint = DViewPoint.new2('StateMachine', '');
        /* Model */
        const modelView = DViewElement.new('Model', ModelViews.zero);
        modelView.viewpoint = viewpoint.id; modelView.explicitApplicationPriority = 10;
        modelView.oclCondition = 'context DModel inv: self.isMetamodel = false';
        /* State */
        const stateView = DViewElement.new('State', this.state(command));
        stateView.viewpoint = viewpoint.id; stateView.explicitApplicationPriority = 10;
        stateView.oclCondition = `context DObject inv: self.instanceof.id = '${state.id}'`;
        stateView.adaptWidth = true; stateView.adaptHeight = true;
        stateView.usageDeclarations = Dependencies.state;
        /* Command */
        const commandView = DViewElement.new('Command', this.command);
        commandView.viewpoint = viewpoint.id; commandView.explicitApplicationPriority = 10;
        commandView.oclCondition = `context DObject inv: self.instanceof.id = '${command.id}'`;
        commandView.draggable = false; commandView.resizable = false;
        commandView.usageDeclarations = Dependencies.command;
        /* Events */
        const eventsView = DViewElement.new('Events', this.events);
        eventsView.viewpoint = viewpoint.id; eventsView.explicitApplicationPriority = 10;
        eventsView.oclCondition = `context DObject inv: self.name = 'obj_1'`;
        eventsView.adaptWidth = true; eventsView.adaptHeight = true;
        eventsView.usageDeclarations = Dependencies.events(event);
        /* Event */
        const eventView = DViewElement.new('Event', this.event);
        eventView.viewpoint = viewpoint.id; eventView.explicitApplicationPriority = 10;
        eventView.oclCondition = `context DObject inv: self.instanceof.id = '${event.id}'`;
        eventView.draggable = false; eventView.resizable = false;
        eventView.usageDeclarations = Dependencies.event;
        /* Transition */
        const transitionView = DViewElement.new('Transition', this.transition);
        transitionView.viewpoint = viewpoint.id; transitionView.explicitApplicationPriority = 2;
        transitionView.oclCondition = `context DObject inv: self.instanceof.id = '${transition.id}'`;
        transitionView.adaptWidth = true; transitionView.adaptHeight = true;
        transitionView.usageDeclarations = Dependencies.transition;

        /* Model to Text */
        const textViewpoint = DViewPoint.new('Text', '');
        const textView = DViewElement.new('Model', TextView.zero);
        textView.viewpoint = textViewpoint.id; textView.explicitApplicationPriority = 10;
        textView.oclCondition = `context DModel inv: not self.isMetamodel`;
        // textView.oclCondition = `context DModel inv: self.id = '${m1.id}'`;

        // @ts-ignore
        viewpoint.subViews = [modelView, stateView, commandView, eventsView, transitionView].map(v => v.id);
        // @ts-ignore
        textViewpoint.subViews = [textView.id];
        return [LViewPoint.fromD(viewpoint), LViewElement.fromD(modelView), LViewElement.fromD(textView)];
    }

    private static state(command: LClass): string {
        const view = `<div className={'root bg-white'} style={{'border-radius':'8px', 'border':'black solid 1px'}}>
            <div style={{
                'text-align':'center',
                'border-bottom': (data.$actions.values.length > 0) ? 'black solid 1px' : 'none',
                'padding':'4px 2px 4px 2px'
            }}>
                {data.instanceof.name}:<b className={'ms-1'}>{data.$name.value}</b>
                <button className={'ms-1 circle btn btn-primary p-0'} onClick={e => {
                    const dObject = data.model.addObject({}, command.id);
                    const lObject = LObject.fromD(dObject);
                    lObject.features[0].value = 'Unnamed';
                    lObject.features[1].value = U.getRandomString(2);
                    data.features[1].values = [lObject, ...data.features[1].values];
                }}><i class="p-1 bi bi-plus"></i></button>
            </div>
            <div className={'children px-2'}>
                {data.$actions.values.map(a => <Field key={a.id} data={a} />)}
            </div>
        </div>`;
        return view.replace('command.id', `'${command.id}'`);
    }

    private static command = `<div className={'w-100 root text-center'}>
        <label className={'p-1'}>{data.$name.value}</label>
    </div>`;

    private static events = `<div className={'root bg-white rounded'}>
        <label className={'d-block text-center bg-success text-white p-1'}>
            <b>Events</b>
        </label>
        {data.model.$event.instances
            .map(o => <Field key={o.id} data={o}></Field>)
        }
    </div>`;
    private static event = `<div className={'w-100 root text-center'}>
        <label className={'p-1'}>{data.name}</label>
    </div>`;

    private static transition = `<div className={'root bg-white'}>
        <label style={{color: data.$source.value ? 'green' : 'red'}} className={'p-1'}>Source</label>
        <label style={{color: data.$target.value ? 'green' : 'red'}} className={'p-1'}>Target</label>
        <label style={{color: data.$trigger.value ? 'green' : 'red'}} className={'p-1'}>Trigger</label>
    </div>`;


}
