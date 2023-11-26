import React from 'react';
import Collaborative from './Collaborative';
import App from '../../App';
import {Action, CompositeAction, GObject, SetRootFieldAction, U} from '../../joiner';
import {useParams} from 'react-router-dom';
import {useEffectOnce} from 'usehooks-ts';

interface Props{}
function CollaborativeAttacher(props: Props) {
    const {id} = useParams();
    const code = id ? id : '';

    useEffectOnce(() => {
        Collaborative.init(code).then(async(actions) => {
            for(let action of actions) {
                if(action.type === 'COMPOSITE_ACTION') for(let subAction of action.actions) delete subAction['_id'];
                delete action['_id'];
                const receivedAction = Action.fromJson(action);
                receivedAction.hasFired = receivedAction.hasFired - 1;
                await U.sleep(0);
                receivedAction.fire();
            }
            Collaborative.client.io.opts.query = {code};
            Collaborative.client.connect();
            SetRootFieldAction.new('room', code, '', false);
        })
    });

    Collaborative.client.on('pullAction', (action: GObject<Action & CompositeAction>) => {
        if(action.type === 'COMPOSITE_ACTION') for(let subAction of action.actions) delete (subAction as GObject)['_id'];
        delete action['_id'];
        const receivedAction = Action.fromJson(action);
        receivedAction.hasFired = receivedAction.hasFired - 1;
        receivedAction.fire();
    });

    return(<App />);
}

export default CollaborativeAttacher;
