import Collaborative from './Collaborative';
import {Action, SetRootFieldAction, U} from '../../joiner';
import type {CompositeAction, GObject, LProject} from '../../joiner';
import {useEffectOnce} from 'usehooks-ts';
import Editor from '../../pages/Editor';

interface Props {project: LProject}
function CollaborativeAttacher(props: Props) {
    const project = props.project;

    useEffectOnce(() => {
        Collaborative.client.io.opts.query = {'project': project.id};
        Collaborative.client.connect();
        SetRootFieldAction.new('collaborative', true);
        /*
        Collaborative.init(project.id).then(async(actions) => {
            for(let action of actions) {
                const receivedAction = Action.fromJson(action);
                receivedAction.hasFired = receivedAction.hasFired - 1;
                // await U.sleep(1);
                receivedAction.fire();
            }
        })
        */
    });

    Collaborative.client.on('pullAction', (action: GObject<Action & CompositeAction>) => {
        const receivedAction = Action.fromJson(action);
        console.log('Received Action from server.', action);
        receivedAction.hasFired = receivedAction.hasFired - 1;
        receivedAction.fire();
    });

    return(<Editor />);
}

export default CollaborativeAttacher;
