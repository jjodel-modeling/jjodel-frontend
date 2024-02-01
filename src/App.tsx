import React, {Dispatch, useState} from 'react';
import './App.scss';
import './styles/view.scss';
import './styles/style.scss';
import {DState, DUser, statehistory, stateInitializer, U} from "./joiner";
import {connect} from "react-redux";
import Loader from "./components/loader/Loader";
import {FakeStateProps} from "./joiner/types";
import DashboardPage from "./pages/Dashboard";
import EditorPage from "./pages/Editor";
import AuthPage from "./pages/Auth";
import {useEffectOnce} from "usehooks-ts";
import {HashRouter, Route, Routes} from 'react-router-dom';
import PathChecker from "./components/pathChecker/PathChecker";
import {AuthApi} from "./api/persistance";

let userHasInteracted = false;
function endPendingActions() {
    if (!userHasInteracted) firstInteraction();
}
function firstInteraction() {
    statehistory.globalcanundostate = true;
}

function App(props: AllProps): JSX.Element {
    const debug = props.debug;
    const [loading, setLoading] = useState(true);

    useEffectOnce(() => {
        stateInitializer().then(() => setLoading(false));
        /* Offline by default */
        if(!DUser.current) AuthApi.offline();
    });

    if(props.isLoading || loading) return(<Loader />);
    return(<HashRouter>
        <PathChecker />
        <Routes>
            {DUser.current && <>
                <Route path={'project'} element={<EditorPage />} />
                <Route path={'*'} element={<DashboardPage />} />
            </>}
            <Route path={'auth'} element={<AuthPage />} />
            {/*<Route path={'*'} element={<Loader />} />*/}
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
