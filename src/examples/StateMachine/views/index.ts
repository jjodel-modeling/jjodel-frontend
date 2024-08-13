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
        let name: string;
        let ptr: string = 'Pointer_';
        /* Viewpoint */
        name = "StateMachine";
        const viewpoint = DViewPoint.newVP(name, undefined, true, ptr+name);
        /* Model */
        name = "Model";
        const modelView = DViewElement.new2(name, ModelViews.zero, viewpoint, (d)=>{
            d.appliableToClasses = ['DModel'];
            modelView.explicitApplicationPriority = 10;
            modelView.oclCondition = 'context DModel inv: self.isMetamodel = false';
        }, true, ptr+name);
        /* State */
        name = 'state';
        const stateView = DViewElement.new2(name, this.state(command), viewpoint, (d)=>{
            d.explicitApplicationPriority = 10;
            d.appliableToClasses = ['DObject'];
            d.oclCondition = `context DObject inv: self.instanceof.id = '${ptr+name}'`;
            d.adaptWidth = true;
            d.adaptHeight = true;
            d.usageDeclarations = Dependencies.state;
        }, true, ptr+name);
        /* Command */
        name = "Command";
        const commandView = DViewElement.new2(name, this.command, viewpoint, (d)=>{
            d.explicitApplicationPriority = 10;
            d.appliableToClasses = ['DObject'];
            d.oclCondition = `context DObject inv: self.instanceof.id = '${ptr+name}'`;
            d.draggable = false;
            d.resizable = false;
            d.usageDeclarations = Dependencies.command;
        }, true, ptr+name);
        /* Events */
        name = 'Events';
        const eventsView = DViewElement.new2(name, this.events, viewpoint, (d)=>{
            d.explicitApplicationPriority = 10;
            d.appliableToClasses = ['DObject'];
            d.oclCondition = `context DObject inv: self.name = 'obj_1'`;
            d.adaptWidth = true;
            d.adaptHeight = true;
            d.usageDeclarations = Dependencies.events(event);
        }, true, ptr+name);
        /* Event */
        name = 'Event';
        const eventView = DViewElement.new2(name, this.event, viewpoint, (d)=>{
            d.explicitApplicationPriority = 10;
            d.appliableToClasses = ['DObject'];
            d.oclCondition = `context DObject inv: self.instanceof.id = '${ptr+name}'`;
            d.draggable = false;
            d.resizable = false;
            d.usageDeclarations = Dependencies.event;
        }, true, ptr+name);
        /* Transition */
        name = 'Transition'
        const transitionView = DViewElement.new2(name, this.transition, viewpoint, (d)=>{
            d.explicitApplicationPriority = 2;
            d.oclCondition = `context DObject inv: self.instanceof.id = '${ptr+name}'`;
            d.adaptWidth = true;
            d.adaptHeight = true;
            d.usageDeclarations = Dependencies.transition;
        }, true, ptr+name);

        /* Model to Text */
        name = 'Text';
        const textViewpoint = DViewPoint.newVP(name, undefined, true, ptr+name);
        name = 'Model Text';
        const textView = DViewElement.new2(name, TextView.zero, viewpoint, (d)=>{
            textView.explicitApplicationPriority = 10;
            textView.oclCondition = `context DModel inv: not self.isMetamodel`;
        }, true, ptr+name);
        // textView.oclCondition = `context DModel inv: self.id = '${m1.id}'`;

        // by damiano: pointers should not be set like this, they are missing the "pointedBy" and might cause issues later.
        // if you remove those assignments they will immediately be without subviews/parent, but updated as soon the first action batch fires.
        // i kept it because if you use them right away it might break by removing them without further corrections.

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
