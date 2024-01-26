import {Dispatch, ReactElement, useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {DProject, DState, DUser, LoadAction, LProject, LUser} from '../joiner';
import {FakeStateProps} from '../joiner/types';
import Dock from '../components/abstract/Dock';
import useQuery from "../hooks/useQuery";
import {ProjectsApi} from "../api/persistance";
import Navbar from "../components/navbar/Navbar";
import {SaveManager} from "../components/topbar/SaveManager";


function EditorComponent(props: AllProps) {
    const user = props.user;
    const query = useQuery();
    const id = query.get('id') || '';

    useEffect(() => {
        (async function() {
            const project = await ProjectsApi.getOne(id);
            if(!project) return;
            user.project = LProject.fromPointer(project.id);
            if(!project.state) return;
            SaveManager.load(project.state);
        })();
    }, [id]);

    if(user.project) return(<>
        <Navbar />
        <Dock />
    </>);
    return(<div>Error</div>)

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

