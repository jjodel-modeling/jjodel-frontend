import {io} from 'socket.io-client';
import {
    Action,
    CompositeAction, Constructors, CreateElementAction,
    Dictionary, DProject,
    DState,
    DUser,
    type GObject,
    Pointer,
    RuntimeAccessible, SetRootFieldAction, U
} from "../../joiner";
import {COMMIT} from "../../redux/action/action";

const ignoredRootFields: (keyof DState)[] = [
    'env',
    'debug',
    'logs',
    'isEdgePending',
    'contextMenu',
    '_lastSelected',
    'isLoading',
    'tooltip',
    'advanced',
    'alert',
    'dialog',
    'dialog_response',
    'action_description',
    'action_title',
];

@RuntimeAccessible('Collaborative')
export class Collaborative {
    static cname: string = 'Collaborative';
    // static client = io('/', {path: '/collaborative', autoConnect: false});
    static client = io(`${process.env['REACT_APP_COLLABORATIVE']}`, {path: '/collaborative', autoConnect: false});
    public static online: boolean = false;

    private static canSend(action: Action): boolean {
        console.log('Collaborative.canSend', {action,
            sender: action.sender !== DUser.current,
            skip: action.skipCollaborative,
            ignore: action.type === SetRootFieldAction.type && ignoredRootFields.includes(action.field as keyof DState),
        });

        if (action.sender !== DUser.current) return false;
        if (action.skipCollaborative) return false;
        if (action.type === SetRootFieldAction.type && ignoredRootFields.includes(action.field as keyof DState)) return false;
        // action.sender !== 'Collaborative Server'
        return true;
    }
    static async connect(id: Pointer<DProject>){
        Collaborative.client.io.opts.query = {'project': id};
        await Collaborative.client.connect();
        Collaborative.client.on('pullAction', Collaborative.receive);
        Collaborative.online = true;
        // SetRootFieldAction.new('collaborativeSession', true);
    }

    static async disconnect(){
        Collaborative.client.off('pullAction');
        await Collaborative.client.disconnect();
        Collaborative.online = false;
    }

    static send(action: Action): boolean {
        if (!Collaborative.canSend(action)) return false;
        const parsedAction: GObject<Action> = {...action} as any;
        if (Array.isArray(parsedAction.actions)) {
            parsedAction.actions = parsedAction.actions.filter(a => Collaborative.canSend(a));
            if (parsedAction.actions.length === 0) return false;
        }
        console.log('Collaborative.send pre throttle', {parsedAction});
        // todo: need to batch emissions for > 300ms? so that model and node creation are paired?
        // or start with batchtimer 300*safety(1.2?), then each time it gets delayed,
        // batchtimer lowers by x% to prevent eternal retention in case of loop/frequent changes but still reduce spam
        U.throttle('collab_send', ()=> {
            console.log('Collaborative.send POST throttle', {parsedAction});
            Collaborative.client.emit('pushAction', parsedAction)
        }, true, 300*1.1, 1/1.1);

        return true;
    }

    static receive(action: GObject<Action & CompositeAction>) {
        let session: number = new Date().getUTCMilliseconds();
        const receivedAction: Action | CompositeAction = action;
        let ca = receivedAction as CompositeAction;
        ca.fromCollaborative = true;
        if (!ca.actions) {
            firedActionsNCA.push(ca);
            //if (receivedAction.type === CreateElementAction && Constructors.pending[receivedAction.id])...
            if (receivedAction.type === CreateElementAction.type && !Constructors.pending[receivedAction.value.id]) {
                let a = receivedAction;
                console.log('set2 pending', {a, p:Constructors.pending[a.value.id], dict:{...Constructors.pending}});
                Constructors.pending[receivedAction.value.id] = receivedAction.value;
            }
            // problem: if i stop it here, before the reducer sets it in history, it cannot be rearranged in order in case of conflicts
            fire(ca, session);
            return;
        }
        firedActionsCA.push(ca);
        for (let a of ca.actions) if (a.type === CreateElementAction.type && !Constructors.pending[a.value.id]) {
            console.log('set2 pending', {a, p:Constructors.pending[a.value.id], dict:{...Constructors.pending}});
            Constructors.pending[a.value.id] = a.value;
        }

        fire(ca, session);
        /*
        for (let a of ca.actions) {
            firedActions.push(a);
            fire(a, session);
        }*/

        // if (ca.actions) ca.actions = U.flattenObjectByKey(action.actions, 'actions', true);
        // fire(ca, session);
    }
}

const actions: Dictionary<Pointer, boolean> = {};
function fire(receivedAction: Action, session: number): void {
    receivedAction = Action.fromJson(receivedAction as GObject);
    if (actions[receivedAction.id]) return;
    receivedAction.hasFired = 0;
    actions[receivedAction.id] = true;
    U.throttle('collab_receive', ()=> {
        console.log('Collaborative received action ' + session, receivedAction);
        COMMIT(receivedAction);
    }, true, 50, 0.5);
}

let firedActionsNCA: Action[] = [];
let firedActionsCA: Action[] = [];
let firedActions: Action[] = [];
(window as any).firedActionsNCA = firedActionsNCA; // just for tmp debug, delete this
(window as any).firedActionsCA = firedActionsCA; // just for tmp debug, delete this
(window as any).firedActions = firedActions; // just for tmp debug, delete this

export default Collaborative;
