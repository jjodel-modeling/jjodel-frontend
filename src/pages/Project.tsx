import {Dispatch, ReactElement, useEffect} from 'react';
import {connect} from 'react-redux';
import {
    Dictionary,
    DState,
    DUser,
    DViewElement,
    LProject,
    LUser,
    LViewElement,
    LViewPoint,
    Pointer,
    Try,
    U
} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import Dock from '../components/abstract/Dock';
import useQuery from "../hooks/useQuery";
import {ProjectsApi} from "../api/persistance";
import Navbar from "../components/navbar/Navbar";
import {SaveManager} from "../components/topbar/SaveManager";
import Loader from "../components/loader/Loader";


function ProjectComponent(props: AllProps): JSX.Element {
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
            const state = await U.decompressState(project.state);
            U.log(JSON.parse(state));
            SaveManager.load(state);
        })();
    }, [id]);
    let allViews = project?.viewpoints.flatMap((vp: LViewPoint) => vp && vp.allSubViews) || [];
    allViews = allViews.filter(v => v);
    const viewsDeDuplicator: Dictionary<Pointer<DViewElement>, LViewElement> = {};
    for (let v of allViews) viewsDeDuplicator[v.id] = v;
    if (user.project) return(<>
        <Try><Navbar /></Try>
        <Try><style id={"views-css-injector"}>
            {Object.values(viewsDeDuplicator).map(v => v.compiled_css).join('\n\n')}
        </style></Try>
        <Try><Dock /></Try>
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

export const ProjectConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ProjectComponent);

const ProjectPage = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ProjectConnected {...{...props, children}} />;
}

export {ProjectPage};

