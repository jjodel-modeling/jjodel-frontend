import type {LClass, LProject} from '../../../joiner';
import {DViewElement, DViewPoint, DObject, LModel} from '../../../joiner';
import {Dependencies} from './dependencies';

export class StateMachine_Views {
    static load(project: LProject, m1: LModel, state: LClass, command: LClass, event: LClass): void {
        const events = m1.addObject(undefined, 'Events');
        this.create(project, state, command, event, events);
    }

    private static create(project: LProject, state: LClass, command: LClass, event: LClass, events: DObject): void {
        /* Viewpoint */
        const viewpoint = DViewPoint.new('StateMachine', '');
        /* Model */
        const modelView = DViewElement.new('Model', this.model);
        modelView.viewpoint = viewpoint.id; modelView.oclCondition = 'context DModel inv: self.isMetamodel = false';
        /* State */
        const stateView = DViewElement.new('State', this.state(command));
        stateView.viewpoint = viewpoint.id; stateView.oclCondition = `context DObject inv: self.instanceof.id = '${state.id}'`;
        stateView.adaptWidth = true; stateView.adaptHeight = true;
        stateView.usageDeclarations = Dependencies.state;
        /* Command */
        const commandView = DViewElement.new('Command', this.command);
        commandView.viewpoint = viewpoint.id; commandView.oclCondition = `context DObject inv: self.instanceof.id = '${command.id}'`;
        commandView.draggable = false; commandView.resizable = false;
        commandView.usageDeclarations = Dependencies.command;
        /* Events */
        const eventsView = DViewElement.new('Events', this.events);
        eventsView.viewpoint = viewpoint.id; eventsView.oclCondition = `context DObject inv: not self.instanceof`;
        eventsView.adaptWidth = true; eventsView.adaptHeight = true;
        /* Event */
        const eventView = DViewElement.new('Event', this.event);
        eventView.viewpoint = viewpoint.id; eventView.oclCondition = `context DObject inv: self.instanceof.id = '${event.id}'`;
        eventView.draggable = false; eventView.resizable = false;
        eventView.usageDeclarations = Dependencies.event;
    }

    private static model = `<div className={'root'}>
        {!data && 'Model data missing.'}
        <div className='edges' style={{zIndex:101, position: 'absolute', height: 0, width: 0, overflow: 'visible'}}>
            {data.objects
                .filter(o => o.instanceof)
                .filter(o => o.instanceof.name === 'Transition')
                .map((t, i) => {
                    return(t.$source.value && t.$target.value && t.$trigger.value && 
                        <Edge key={i} label={t.$trigger.value.$name.value} 
                            data={t.id}
                            view={'Pointer_ViewEdgeAssociation'} 
                            start={t.$source.value.node} 
                            end={t.$target.value.node} 
                        />)
                })
            }
        </div>
        {data.objects
            .filter(o => o.instanceof) 
            .filter(o => 
                (o.instanceof.name !== 'Transition' && o.instanceof.name !== 'Command' && o.instanceof.name !== 'Event') || 
                (o.instanceof.name === 'Transition' && (!o.$source.value || !o.$target.value || !o.$trigger.value)) ||
                (o.instanceof.name === 'Command' && !o.$name.value))
            .map(object => <DefaultNode key={object.id} data={object} />)
        }
        {data.objects
            .filter(o => !o.instanceof)
            .map(o => <DefaultNode key={o.id} data={o} />)
        }
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
        {data.model.objects
            .filter(o => o.instanceof)
            .filter(o => o.instanceof.name === 'Event')
            .map(o => <Field key={o.id} data={o}></Field>)
        }
    </div>`;
    private static event = `<div className={'w-100 root text-center'}>
        <label className={'p-1'}>{data.name}: <b>{data.$name.value}</b></label>
    </div>`;
}
