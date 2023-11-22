import React, {Dispatch, ReactElement} from 'react';
import {DState} from '../../../redux/store';
import {connect} from 'react-redux';
import {FakeStateProps} from '../../../joiner/types';
import {DUser, LUser, U} from '../../../joiner';

function DebugComponent(props: AllProps) {
    const user = props.user;
    const p = user.project;
    if(!p) return(<></>);
    return(<li className={'dropdown-item'}>Debug
        <i className={'ms-auto bi bi-caret-right-fill'} />
        <ul className={'submenu dropdown-menu'}>
            <li tabIndex={-1} onClick={() => U.log(p.metamodels, 'Metamodels')} className={'dropdown-item'}>Metamodels</li>
            <li tabIndex={-1} onClick={() => U.log(p.packages, 'Packages')} className={'dropdown-item'}>Packages</li>
            <li tabIndex={-1} onClick={() => U.log(p.classes, 'Classes')} className={'dropdown-item'}>Classes</li>
            <li tabIndex={-1} onClick={() => U.log(p.attributes, 'Attributes')} className={'dropdown-item'}>Attributes</li>
            <li tabIndex={-1} onClick={() => U.log(p.references, 'References')} className={'dropdown-item'}>References</li>
            <li tabIndex={-1} onClick={() => U.log(p.operations, 'Operations')} className={'dropdown-item'}>Operations</li>
            <li tabIndex={-1} onClick={() => U.log(p.parameters, 'Parameters')} className={'dropdown-item'}>Parameters</li>
            <li tabIndex={-1} onClick={() => U.log(p.enumerators, 'Enumerators')} className={'dropdown-item'}>Enumerators</li>
            <li tabIndex={-1} onClick={() => U.log(p.literals, 'Literals')} className={'dropdown-item'}>Literals</li>
            <li tabIndex={-1} onClick={() => U.log(p.models, 'Models')} className={'dropdown-item'}>Models</li>
            <li tabIndex={-1} onClick={() => U.log(p.objects, 'Objects')} className={'dropdown-item'}>Objects</li>
            <li tabIndex={-1} onClick={() => U.log(p.values, 'Values')} className={'dropdown-item'}>Values</li>
            <hr />
            <li tabIndex={-1} onClick={() => U.log(p.views, 'Views')} className={'dropdown-item'}>Views</li>
            <hr />
            <li tabIndex={-1} onClick={() => U.log(p.graphs, 'Graphs')} className={'dropdown-item'}>Graphs</li>
            <li tabIndex={-1} onClick={() => U.log(p.graphVertexes, 'GraphVertexes')} className={'dropdown-item'}>GraphVertexes</li>
            <li tabIndex={-1} onClick={() => U.log(p.voidVertexes, 'VoidVertexes')} className={'dropdown-item'}>VoidVertexes</li>
            <li tabIndex={-1} onClick={() => U.log(p.vertexes, 'Vertexes')} className={'dropdown-item'}>Vertexes</li>
            <li tabIndex={-1} onClick={() => U.log(p.fields, 'Fields')} className={'dropdown-item'}>Fields</li>
            <li tabIndex={-1} onClick={() => U.log(p.edges, 'Edges')} className={'dropdown-item'}>Edges</li>
            <li tabIndex={-1} onClick={() => U.log(p.edgePoints, 'EdgesPoints')} className={'dropdown-item'}>EdgesPoints</li>
        </ul>
    </li>);
}

interface OwnProps {}
interface StateProps {user: LUser}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const DebugConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(DebugComponent);

export const Debug = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <DebugConnected {...{...props, children}} />;
}
export default Debug;





