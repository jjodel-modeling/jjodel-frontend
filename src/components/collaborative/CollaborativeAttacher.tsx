import Collaborative from './Collaborative';
import type {CompositeAction, GObject, LProject, Pointer} from '../../joiner';
import {Action, DUser, SetRootFieldAction} from '../../joiner';
import {useEffectOnce} from 'usehooks-ts';
import {useEffect, useState} from "react";

interface Props {project: LProject}
function CollaborativeAttacher(props: Props) {
    const project = props.project;
    const [actions, setActions] = useState<Pointer[]>([]);

    useEffectOnce(() => {
        SetRootFieldAction.new('collaborativeSession', true);
        Collaborative.client.io.opts.query = {'project': project.id};
        Collaborative.client.connect();
        /*
        return () => {
            Collaborative.client.off('pullAction');
            Collaborative.client.disconnect();
            SetRootFieldAction.new('collaborativeSession', false);
        }
        */
        Collaborative.client.on('pullAction', (action: GObject<Action & CompositeAction>) => {
            const receivedAction = Action.fromJson(action);
            console.log('Received Action from server.', action);
            receivedAction.hasFired = 0;
            if(!actions.includes(receivedAction.id)) {
                console.log('Received actions', actions)
                setActions([...actions, action.id]);
                receivedAction.fire();
            }
        });
    });



    return(<></>);
}

export default CollaborativeAttacher;
