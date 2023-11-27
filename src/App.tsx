import React, {Dispatch} from 'react';
import './App.scss';
import './styles/view.scss';
import './styles/style.scss';
import {DState, DUser, stateInitializer, LUser, statehistory, Json, SetRootFieldAction} from "./joiner";
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

let userHasInteracted = false;
function endPendingActions() {
    if (!userHasInteracted) firstInteraction();
}
function firstInteraction(){
    statehistory.globalcanundostate = true;
}

function App(props: AllProps) {
    const debug = props.debug;
    const isLoading = props.isLoading;
    const user = props.user;

    useEffectOnce(() => {
        if (DUser.offlineMode) {
            let du = DUser.new('adminOffline');
            DUser.current = du.id;
            stateInitializer();
            return;
        }
        if (!debug) return;
        (async function() {
            SetRootFieldAction.new('isLoading', true);
            const response = await PersistanceApi.login('admin@mail.it', 'admin');
            const user = response.body as Json;
            const id = user.id as string;
            const username = user.username as string;
            DUser.new(username, id); DUser.current = id;
            stateInitializer();
            SetRootFieldAction.new('isLoading', false);
        })();
    })

    if(DUser.current) {
        return(<div className={'d-flex flex-column h-100 p-1 REACT-ROOT' + (props.debug ? ' debug' : '')}
                    onClick={e => statehistory.globalcanundostate = true}>
            {isLoading && <Loader />}
            <Navbar />
            <Helper />
            {user.project ? <Editor /> : <Dashboard />}
        </div>);
    } else {
        return(<section>
            {isLoading && <Loader />}
            <Auth />
        </section>);
    }
}

interface OwnProps {room?: string}
interface StateProps {debug: boolean, isLoading: boolean, user: LUser}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.debug = state.debug;
    ret.isLoading = state.isLoading;
    ret.user = LUser.fromPointer(DUser.current);
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
