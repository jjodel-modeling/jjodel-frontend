import Collaborative from './Collaborative';
import {CompositeAction, Dictionary, GObject, LProject, Pointer, TRANSACTION, U} from '../../joiner';
import {Action, SetRootFieldAction} from '../../joiner';
import {useEffect, useState} from "react";

const actions: Dictionary<Pointer, boolean> = {};
interface Props {project: LProject}

function fire(receivedAction: Action, session: number): void {
    if (actions[receivedAction.id]) return;
    receivedAction.hasFired = 0;
    console.log('Collaborative received action ' + session, receivedAction);
    actions[receivedAction.id] = true;
    receivedAction.fire();
}

function CollaborativeAttacher(props: Props) {
    const project = props.project;

    useEffect(() => {
        TRANSACTION('start collaborative session', ()=> {
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
                let session: number = new Date().getUTCMilliseconds();
                const receivedAction: Action | CompositeAction = action; //Action.fromJson(action);
                let ca = receivedAction as CompositeAction;
                if (!ca.actions) { fire(Action.fromJson(ca as GObject), session); return; }
                for (let a of ca.actions) fire(Action.fromJson(a as GObject), session);
                ////
                // if (ca.actions) ca.actions = U.flattenObjectByKey((Action.fromJson(action) as CompositeAction).actions, 'actions', true);
                // fire(action, session);
            });
        }, [])
        })

    return(<></>);
}

export default CollaborativeAttacher;
