import React, {Dispatch, ReactElement} from 'react';
import {DState} from '../../../redux/store';
import {connect} from 'react-redux';
import {LoadAction, TRANSACTION} from '../../../redux/action/action';
import stateExamples from '../../../examples';
import { statechartplus } from '../../../examples/statechartplus';
import { viewAsEdge } from '../../../examples/viewAsEdge';
import { sequence } from '../../../examples/sequence';
import { conflictsimulation } from '../../../examples/conflictsimulation';
import {DProject, DUser, GObject, LPointerTargetable, LProject, LUser} from '../../../joiner';

// only for states before User and Project management
function loadOldState(obj: GObject, name: string = "oldSave"): void {
    let project: LProject;
    let dproject: DProject;
    let user: LUser;
    TRANSACTION(()=>{
        LoadAction.new(obj);
        let duser = DUser.new('adminOffline', "Pointer_adminOffline");
        DUser.current = duser.id;
        // user = LPointerTargetable.fromPointer(DUser.current);
        user = LPointerTargetable.fromD(duser);
        dproject = DProject.new('private', name);
        project = LPointerTargetable.fromD(dproject);
        // user.projects = [...user.projects, project];
        user.project = project;
    })
    setTimeout(()=> TRANSACTION(()=>{
        if (!project) return // only if first transaction failed
        console.log("loadOldState", {g: obj.graphs, m: obj.models, v: obj.viewelements, project, dproject, user});
        project.graphs = obj.graphs;
        project.models = obj.models;
        project.views = obj.viewelements;
        project.viewpoints = obj.viewpoints;
        // project.activeViewpoint = obj.viewpoints[0];
        project.activeViewpoint = 'Pointer_DefaultViewPoint' as any;
    }), 1);
    // NB: might also be needed to add "context DModel inv: true" or DClass... to all default views got back from old state.
}
// for new saves
function loadState(obj: GObject, name: string = "oldSave"): void { LoadAction.new(obj); }

function ExamplesComponent(props: AllProps) {

    const load = (state: string) => {
        return LoadAction.new(JSON.parse(state));
    }
    const setExample = (example: number) => {
        switch(example) {
            case 1:
                return load(stateExamples.first);
            case 2:
                return load(stateExamples.second);
            default:
                return;
        }

    }

    return (
        <li tabIndex={-1} className={'dropdown-item'}>Examples
            <i className={'ms-auto bi bi-caret-right-fill'} />
            <ul className={'submenu dropdown-menu'}>
                <li tabIndex={-1} onClick={e => setExample(1)} className={'dropdown-item'}>Simplified Class Diagram</li>
                <li tabIndex={-1} onClick={e => setExample(2)} className={'dropdown-item'}>Nodes & Edges</li>
                <li tabIndex={-1} onClick={e => loadOldState(statechartplus, "Statechart+")} className={'dropdown-item'}>Student statechart++</li>
                <li tabIndex={-1} onClick={e => loadState(viewAsEdge, "View as edge")} className={'dropdown-item'}>View Object as Edge</li>
                <li tabIndex={-1} onClick={e => loadState(conflictsimulation, "Conflict simulation")} className={'dropdown-item'}>Conflict simulation</li>
                {false && <li tabIndex={-1} onClick={e => loadOldState(sequence, "Sequence diagram")} className={'dropdown-item'}>Sequence</li>}
            </ul>
        </li>)
}

interface OwnProps {}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    return {};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ExamplesConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ExamplesComponent);

export const Examples = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ExamplesConnected {...{...props, children}} />;
}

export default Examples;
