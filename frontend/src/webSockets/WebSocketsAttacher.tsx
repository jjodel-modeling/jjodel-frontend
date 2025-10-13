import {Action, DProject, Pointer, SetRootFieldAction, store} from '../joiner';
import type {CompositeAction, GObject, LProject} from '../joiner';
import WebSockets from './WebSockets';
import {useEffect} from "react";

/* OLD Component for collaborative, todo: replace it */
interface Props {projectID: Pointer<DProject, 1, 1, LProject>}
function WebSocketsAttacher(props: Props) {
    const {projectID} = props;

    useEffect(() => {
        WebSockets.iot.io.opts.query = {'project': projectID};
        WebSockets.iot.connect();
    }, []);

    WebSockets.iot.on('pullAction', (receivedAction: GObject<Action & CompositeAction>) => {
        const action = Action.fromJson(receivedAction);
        if(!(action.field in store.getState()['topics']))
            SetRootFieldAction.new(action.field.replaceAll('+=', ''), [], '', false);
        action.hasFired = 0;
        console.log('Received Action from server.', action);
        action.fire();
    });

    return(<></>);
}

export default WebSocketsAttacher;
