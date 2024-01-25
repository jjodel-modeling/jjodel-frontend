import type {LClass, LProject} from '../../../joiner';
import {DViewElement, DViewPoint, DObject, LModel, LObject, LViewPoint} from '../../../joiner';
import {Dependencies} from './dependencies';

export class StateMachine_Views {
    static load(project: LProject, state: LClass, command: LClass, event: LClass, transition: LClass): LViewPoint {
        return this.create(project, state, command, event, transition);
    }

    private static create(project: LProject, state: LClass, command: LClass, event: LClass, transition: LClass): LViewPoint {
        /* Viewpoint */
        const viewpoint = DViewPoint.new2('StateMachine', '');
        /* Model */
        const modelView = DViewElement.new('Model', this.model);
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
        const textView = DViewElement.new('Model', this.text(event, command, state));
        textView.viewpoint = textViewpoint.id; textView.explicitApplicationPriority = 10;
        textView.oclCondition = `context DModel inv: not self.isMetamodel`;
        // textView.oclCondition = `context DModel inv: self.id = '${m1.id}'`;


        viewpoint.subViews = [modelView, stateView, commandView, eventsView, transitionView].map(v => v.id);
        textViewpoint.subViews = [textView.id];
        return LViewPoint.fromD(viewpoint);
    }

    private static model = `<div className={'root'}>
        {!data && 'Model data missing.'}
        <div className='edges' style={{zIndex:101, position: 'absolute', height: 0, width: 0, overflow: 'visible'}}>
            {data.$transition.instances
                .map((t, i) => {
                    if(t.$source.value && t.$target.value && t.$trigger.value)
                        return(<Edge key={i} label={() => t.$trigger.value.$name.value} 
                                    data={t.id}
                                    view={'Pointer_ViewEdgeAssociation'} 
                                    start={t.$source.value.node} 
                                    end={t.$target.value.node} 
                           />)
                    return(<DefaultNode key={t.id} data={t} />)
                })
            }
            {data.$reset && data.$reset.instances
                .map((r, i) => {
                    if(!r.node || !r.$transition.value) return(<div></div>)
                    return(<Edge key={i}
                        view={'Pointer_ViewEdgeAssociation'} 
                        start={r.node} 
                        end={r.$transition.value.node} 
                    />)
            })}
        </div>
        {data.otherObjects()
            .map(object => <DefaultNode key={object.id} data={object} />)
        }
        <button style={{position: 'absolute', right: 10, top: 10}} className={'p-1 btn btn-danger'} onClick={e => {
            const objects = [];
            if(data.$state) objects.push(...data.$state.instances);
            if(data.$situation) objects.push(...data.$situation.instances);
            if(objects.length < 5) return;
            objects.sort((a, b) => a.name.localeCompare(b.name))
            objects[0].node.x = 670; objects[0].node.y = 60; // active
            objects[1].node.x = 670; objects[1].node.y = 400; // idle
            objects[2].node.x = 250; objects[2].node.y = 400; // unlockPanel 
            objects[3].node.x = 350; objects[3].node.y = 220; // waitingForDrawer
            objects[4].node.x = 50; objects[4].node.y = 220; // waitingForLight
        }}>
            Arrange
        </button>
    </div>`;

    private static state(command: LClass): string {
        const view = `<div className={'root bg-white'} style={{'border-radius':'8px', 'border':'black solid 1px'}}>
            <div style={{
                'text-align':'center',
                'border-bottom': (data.$actions.values.length > 0) ? 'black solid 1px' : 'none',
                'padding':'4px 2px 4px 2px'
            }}>
                {data.name}:<b className={'ms-1'}>{data.$name.value}</b>
                <button className={'ms-1 circle btn btn-primary p-0'} onClick={e => {
                    const dObject = data.model.addObject(command.id);
                    const lObject = LObject.fromD(dObject);
                    lObject.features[0].value = 'Unnamed';
                    lObject.features[1].value = '0000';
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

    private static text = (event: LClass, command: LClass, state: LClass) => `<div className={'root bg-white p-2'}>
        <h5 className={'p-1'}>Model to Text</h5>
        <hr className={'mt-2'} />
        {data.$event.instances.map(event => {
            return(<div>event: {event.$name.value}, "{event.$code.value}"</div>);
        })}
        <hr className={'my-2'} />
        {data.$command.instances.map(command => {
            return(<div>command: {command.$name.value}, "{command.$code.value}"</div>);
        })}
        <hr className={'my-2'} />
        {data.$state.instances.map(event => {
            return(<div>
                state: {event.$name.value} DO <br />
                <div className={'ms-4 d-flex'}>
                    actions: {event.$actions.values.map(action => {
                        return(<div className={'ms-2'}>{action.$name.value},</div>)
                    })}
                </div>
                END
            </div>);
        })}
    </div>`;
}
