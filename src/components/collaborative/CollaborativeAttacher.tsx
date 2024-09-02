import Collaborative from './Collaborative';
import type {CompositeAction, GObject, LProject} from '../../joiner';
import {Action, DUser, SetRootFieldAction} from '../../joiner';
import {useEffectOnce} from 'usehooks-ts';

interface Props {project: LProject}
function CollaborativeAttacher(props: Props) {
    const project = props.project;

    useEffectOnce(() => {
        SetRootFieldAction.new('collaborativeSession', true);
        Collaborative.client.io.opts.query = {'project': project.id};
        Collaborative.client.connect();
        return () => {
            Collaborative.client.disconnect();
            SetRootFieldAction.new('collaborativeSession', false);
        }
    });

    Collaborative.client.on('pullAction', (action: GObject<Action & CompositeAction>) => {
        const receivedAction = Action.fromJson(action);
        console.log('Received Action from server.', action);
        receivedAction.hasFired = 0;
        if(receivedAction.sender !== DUser.current) receivedAction.fire();
    });

    return(<></>);
}

export default CollaborativeAttacher;
