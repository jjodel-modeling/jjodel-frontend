import {Action, DProject, Pointer, SetRootFieldAction, store} from '../joiner';
import type {CompositeAction, GObject, LProject} from '../joiner';
import {useEffectOnce} from 'usehooks-ts';
import WebSockets from './WebSockets';

/* OLD Component for collaborative, todo: replace it */
interface Props {projectID: Pointer<DProject, 1, 1, LProject>}
function WebSocketsAttacher(props: Props) {
    const {projectID} = props;

    useEffectOnce(() => {
        // SetRootFieldAction.new('collaborativeSession', true);
        WebSockets.iot.io.opts.query = {'project': projectID};
        WebSockets.iot.connect();
    });

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
