import React, {Dispatch, useState} from 'react';
import './App.scss';
import './styles/view.scss';
import './styles/style.scss';
import {DState, DUser, LUser, statehistory, stateInitializer, U} from "./joiner";
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
function firstInteraction(){
    statehistory.globalcanundostate = true;
}

function App(props: AllProps): JSX.Element {
    const debug = props.debug;
    const [loading, setLoading] = useState(true);
    const isLoading = props.isLoading;
    const tooltip = props.tooltip;
    let user: LUser = props.user;

    useEffectOnce(() => {
        stateInitializer().then(() => setLoading(false));
        /* Offline by default */
        // if(!DUser.current) AuthApi.offline();
    });

    if(props.isLoading || loading) return(<Loader />);
    return(<HashRouter>
        <PathChecker />
        <Routes>
            {DUser.current && <>
                <Route path={'project'} element={<EditorPage />} />
                <Route path={'*'} element={<DashboardPage />} />
            </>}
            <Route path={'*'} element={<AuthPage />} />
            {/*<Route path={'*'} element={<Loader />} />*/}
        </Routes>
    </HashRouter>);

    /*
    if (user) {
        return(<div className={'d-flex flex-column h-100 p-1 REACT-ROOT' + (props.debug ? ' debug' : '')}
                    onClick={e => statehistory.globalcanundostate = true}>
            {isLoading && <Loader />}
            {tooltip && <ToolTip />}
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
    tooltip: string,
    user: LUser
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.debug = state.debug;
    ret.isLoading = state.isLoading;
    ret.user = LUser.fromPointer(DUser.current);
    // needed here as props, because apparently functional components are memoized by default.
    ret.offlineMode = DUser.offlineMode;
    ret.tooltip = state.tooltip;
    console.log("app re mapstate", {u:DUser.current, o:DUser.offlineMode});
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


/* SPLASH SCREEN
return(<div className={'w-100 h-100 text-center bg-smoke'}>
    <img style={{height: '60%', width: '80%'}} className={'mt-3 rounded shadow'} src={SplashImage}></img>
    <Oval height={80} width={80} wrapperStyle={{justifyContent: 'center'}} wrapperClass={'mt-3'}
          color={'#475e6c'} secondaryColor={'#ff8811'} />
</div>);
*/
