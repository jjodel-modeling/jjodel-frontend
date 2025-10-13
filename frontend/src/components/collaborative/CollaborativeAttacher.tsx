import Collaborative from './Collaborative';
import type { Dictionary, GObject, Pointer} from '../../joiner';
import {DProject, TRANSACTION, U} from '../../joiner';
import {useEffect, useState} from "react";

interface Props {project: Pointer<DProject>}

let debugOldID: string = '';
function CollaborativeAttacher(props: Props) {
    useEffect(() => {
            Collaborative.connect(props.project);
            console.log('Collaborative connect', debugOldID, props.project, Object.is(debugOldID, props.project));
            debugOldID = props.project;
            return () => { Collaborative.disconnect(); }
        }
    , [props.project])

    return(<></>);
}

export default CollaborativeAttacher;
