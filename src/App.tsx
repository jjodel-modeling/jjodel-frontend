import React, {Dispatch} from 'react';
import './App.scss';
import './styles/view.scss';
import './styles/style.scss';
import {
    DState,
    DUser,
    stateInitializer,
    LUser,
    statehistory,
    Json,
    SetRootFieldAction,
    LPointerTargetable
} from "./joiner";
import {connect} from "react-redux";
import Loader from "./components/loader/Loader";
import Navbar from "./components/navbar/Navbar";
import {FakeStateProps} from "./joiner/types";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Helper from "./components/helper/Helper";
import Auth from "./pages/Auth";
import {useEffectOnce} from "usehooks-ts";
import PersistanceApi from "./api/persistance";
import CollaborativeAttacher from './components/collaborative/CollaborativeAttacher';
import {StateMachine} from './examples/StateMachine';

let userHasInteracted = false;
function endPendingActions() {
    if (!userHasInteracted) firstInteraction();
}
function firstInteraction(){
    statehistory.globalcanundostate = true;
}

// todo: memoization which also checks for DUser.current and DUser.offlineMode changes other than prop changes
function App(props: AllProps): JSX.Element {
    const debug = props.debug;
    const isLoading = props.isLoading;
    let user: LUser = props.user;

    console.log("app render", {u:DUser.current, o:DUser.offlineMode})
    if (DUser.offlineMode && !DUser.current) {
        stateInitializer();
        let du = DUser.new('adminOffline', "Pointer_adminOffline");
        DUser.current = du.id;
        user = LPointerTargetable.from(du);
    }
    useEffectOnce(() => {
        if (!debug || DUser.offlineMode) return;
        (async function() {
            SetRootFieldAction.new('isLoading', true);
            const response = await PersistanceApi.login('admin@mail.it', 'admin');
            const user = response.body as Json;
            const id = user.id as string;
            const username = user.username as string;
            DUser.new(username, id);
            DUser.current = id;
            stateInitializer();
            SetRootFieldAction.new('isLoading', false);
        })();
    })

    const project = user?.project;
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
}

interface OwnProps {room?: string}
interface StateProps {
    offlineMode: boolean,
    debug: boolean,
    isLoading: boolean,
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
