import type {Dictionary, DState, LViewPoint, DViewElement, LUser, LViewElement, Pointer} from '../joiner';
import type {FakeStateProps} from '../joiner/types';
import {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {LPointerTargetable, U, DUser} from '../joiner';
import Dock from '../components/abstract/Dock';


function EditorComponent(props: AllProps) {
    const user = props.user;
    const project = user.project;

    let allviews = project?.viewpoints.flatMap((vp: LViewPoint) => vp.allSubViews) || [];
    let views_deduplicator: Dictionary<Pointer<DViewElement>, LViewElement> = {};
    for (let v of allviews) views_deduplicator[v.id] = v;
    return(<>
        <Dock />
        <style id={"views-css-injector"}>
            {Object.values(views_deduplicator).map( v => v.compiled_css).join('\n\n')}
        </style>
    </>);
}
interface OwnProps {}
interface StateProps {user: LUser}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps { // todo: can this become a disconnected component from redux store?
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LPointerTargetable.fromPointer(DUser.current);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const EditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(EditorComponent);

const Editor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <EditorConnected {...{...props, children}} />;
}

export default Editor;

