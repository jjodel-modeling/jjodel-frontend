import {Dispatch, ReactElement, useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {
    Dictionary,
    DProject,
    DState,
    DUser,
    DViewElement,
    LoadAction,
    LProject,
    LUser,
    LViewPoint,
    Pointer,
    U
} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import Dock from '../components/abstract/Dock';
import useQuery from "../hooks/useQuery";
import {ProjectsApi} from "../api/persistance";
import Navbar from "../components/navbar/Navbar";
import {SaveManager} from "../components/topbar/SaveManager";
import Loader from "../components/loader/Loader";


function EditorComponent(props: AllProps) {
    const user = props.user;
    const query = useQuery();
    const id = query.get('id') || '';
    const project: LProject = LProject.fromPointer(id);

    useEffect(() => {
        (async function() {
            const project = await ProjectsApi.getOne(id);
            if(!project) return;
            user.project = LProject.fromPointer(project.id);
            if(!project.state) return;
            SaveManager.load(await U.decompressState(project.state));
        })();
    }, [id]);
    let allviews = project?.viewpoints.flatMap((vp: LViewPoint) => vp.allSubViews) || [];
    let views_deduplicator: Dictionary<Pointer<DViewElement>, LViewElement> = {};
    for (let v of allviews) views_deduplicator[v.id] = v;
    if(user.project) return(<>
        <Navbar />
        <Dock />
        <style id={"views-css-injector"}>
            {Object.values(views_deduplicator).map( v => v.compiled_css).join('\n\n')}
        </style>
    </>);
    return(<Loader />);
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

export const EditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(EditorComponent);

const EditorPage = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <EditorConnected {...{...props, children}} />;
}

export default EditorPage;

