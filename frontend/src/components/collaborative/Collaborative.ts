import {io, Socket} from 'socket.io-client';
import {
    Action,
    CompositeAction, Constructors, CreateElementAction,
    Dictionary, DProject,
    DState,
    DUser,
    type GObject,
    Log,
    Pointer,
    RuntimeAccessible, SetFieldAction, SetRootFieldAction, store, U
} from "../../joiner";
import {COMMIT} from "../../redux/action/action";
(window as any).io = io;

const ignoredRootFields: (keyof DState)[] = [
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
    static client: Socket;
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
        if (!id) id = U.getProjectID_URL() || '';
        Collaborative.client = io(U.env('JODEL_COLLABORATIVE'), {path: '/collaborative', autoConnect: false});
        Collaborative.client.io.opts.query = {'project': id};
        Collaborative.client.connect();
        // 20s timeout for server-side socket (server config) + 5s of extra transmission delay to client.
        // Collaborative.client.timeout(25000).emit("my-event", (err: any) => {   if (err) { Log.ee('Collaborative request timeout', {err}); } });
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
            if ((parsedAction as any).debugua) console.error("collab receive sending identification user treated as transaction", {parsedAction});
            parsedAction.actions = parsedAction.actions.filter(a => Collaborative.canSend(a));
            if (parsedAction.actions.length === 0) return false;
        }
        // console.error('Collaborative.send pre throttle', {parsedAction});
        // todo: need to batch emissions for > 300ms? so that model and node creation are paired?
        // or start with batchtimer 300*safety(1.2?), then each time it gets delayed,
        // batchtimer lowers by x% to prevent eternal retention in case of loop/frequent changes but still reduce spam
        U.throttle('collab_send', ()=> {
            // console.error('Collaborative.send POST throttle', {parsedAction});
            if ((parsedAction as any).debugua) console.error("collab receive sending identification user", {parsedAction});
            Collaborative.client.emit('pushAction', parsedAction)
        }, true, 300*1.1, 1/1.1);

        return true;
    }

    private static filterSender(action: GObject<Action & CompositeAction>): boolean{
        if (action.actions) {
            let old = action.actions;
            action.actions = action.actions.filter(a => a.sender !== DUser.current);
            console.log('collaborative received composite', {skip:!action.actions.length, actions:action.actions, old, diff: U.arrayDifference(action.actions, old)});
            if (!action.actions.length) return false;
        }
        else {
            console.log('collaborative received single', {skip: action.sender === DUser.current, f:action.field, v:action.value, action});
            if (action.sender === DUser.current) return false;
        }
        return true;
    }

    //static firstReceive: boolean = true;
    static receive(action: GObject<Action & CompositeAction>) {
        let session: number = new Date().getUTCMilliseconds();
        const receivedAction: Action | CompositeAction = action;
        let ca = receivedAction as CompositeAction;
        if (!Collaborative.filterSender(action)) return;
        console.log("collaborative receive root", {f:action.field, action});

        // the server sent a request to the client to identify himself replying with userid
        if (ca.field.includes("SET_SOCKET_ID")) {
            let project= U.getProjectID_URL() as Pointer<DProject>;
            let socketid = action.value as string;
            SetFieldAction.new(project, "collaboratorsMap."+socketid as any, DUser.current, '', true, false);
            // send on remote but don't execute locally
            let setuseraction = SetRootFieldAction.create("idlookup."+DUser.current, DUser.getUser(), "", true);
            (setuseraction as any).debugua = true;
            Collaborative.send(setuseraction);
            return;
        }
        ca.fromCollaborative = true;
        if (!ca.actions) {
            firedActionsNCA.push(ca);
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

        fire(ca, session);/*
        if (this.firstReceive) {
            this.firstReceive = false;
            let s = store.getState();
            // this one is only sent to collaborators.
            let action = SetRootFieldAction.create("idlookup."+DUser.current, DUser.getUser(), "", true);
            this.send(action);
            console.log("send action createuser", {action, canSend: this.canSend(action)} );
            // this one is executed both locally and sent to collaborators.
            // if (!s.collaborators.includes(DUser.current)) SetRootFieldAction.new("collaborators", DUser.current, "+=", true);
            // todo: make an action on collab server on user connect/disconnect which sets onlineCollaborators action (instead of the "static" list)
            // current online user is only available as number in project.onlineUsers
        }*/
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
