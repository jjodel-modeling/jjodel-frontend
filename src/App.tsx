import React, {Dispatch, useState} from 'react';
import './App.scss';
import './styles/view.scss';
import './styles/style.scss';
import {DState, DUser, LocalStorage, LUser, SetRootFieldAction, statehistory, stateInitializer} from "./joiner";
import {connect} from "react-redux";
import Loader from "./components/loader/Loader";
import Navbar from "./components/navbar/Navbar";
import {FakeStateProps} from "./joiner/types";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Helper from "./components/helper/Helper";
import Auth from "./pages/Auth";
import {useEffectOnce} from "usehooks-ts";
import CollaborativeAttacher from './components/collaborative/CollaborativeAttacher';
import {HashRouter, Route, Routes, useNavigate} from 'react-router-dom';
import Storage from "./data/storage";
import AuthPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import {ProjectsApi} from "./api/persistance";
import EditorPage from "./pages/Editor";

let userHasInteracted = false;
function endPendingActions() {
    if (!userHasInteracted) firstInteraction();
}
function firstInteraction() {
    statehistory.globalcanundostate = true;
}

function App(props: AllProps): JSX.Element {
    const debug = props.debug;
    const isLoading = props.isLoading;
    const [user, setUser] = useState<DUser['id']|null>(null);

    useEffectOnce(() => {
        stateInitializer();
        (async function() {
            const user = Storage.read<DUser>('user');
            if(!user) return;
            DUser.new(user.username, user.id);
            DUser.current = user.id; setUser(user.id);
            await ProjectsApi.getAll();
        })();
    });

    if(isLoading) return(<Loader />);
    return(<HashRouter>
        <Routes>
            {(!user) ? <>
                <Route path={'*'} element={<AuthPage setUser={setUser} />} />
            </> : <>
                <Route path={'project'} element={<EditorPage />} />
                <Route path={'*'} element={<DashboardPage />} />
            </>}
        </Routes>
    </HashRouter>);

    /*
    if (user) {
        return(<div className={'d-flex flex-column h-100 p-1 REACT-ROOT' + (props.debug ? ' debug' : '')}
                    onClick={e => statehistory.globalcanundostate = true}>
            {isLoading && <Loader />}
            <Navbar />
            <Helper />
            {(project) ? (project.type === 'collaborative' && !DUser.offlineMode) ? <CollaborativeAttacher project={project} /> : <Editor /> : <Dashboard />}
        </div>);
    } else {
        return(<>
            {isLoading && <Loader />}
            <Auth />
        </>);
    }
    */
}

interface OwnProps {room?: string}
interface StateProps {
    offlineMode: boolean,
    debug: boolean,
    isLoading: boolean
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.debug = state.debug;
    ret.isLoading = state.isLoading;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const AppConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(App);

export default AppConnected;
