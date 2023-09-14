import React, {Dispatch} from 'react';
import './App.scss';
import './styles/view.scss';
import './styles/style.scss';
import Dock from "./components/abstract/DockLayout";
import {DState, statehistory, U} from "./joiner";
import {useStateIfMounted} from "use-state-if-mounted";
import {useEffectOnce} from "usehooks-ts";
import SplashImage from './static/img/splash.png';
import {Oval} from "react-loader-spinner";
import TopBar from "./components/topbar/Topbar";
import {connect} from "react-redux";
import Cleaning from "./popup/Cleaning";

function App(props: AllProps) {
    const debug = props.debug;
    const isCleaning = props.isCleaning;
    const [splash, setSplash] = useStateIfMounted(!debug);

    useEffectOnce(() => {
        if(debug) setSplash(false);
        else U.sleep(3).then(() => {setSplash(false)});
    });

    if(splash) {
        return(<div className={'w-100 h-100 text-center bg-smoke'}>
            <img style={{height: '60%', width: '80%'}} className={'mt-3 rounded shadow'} src={SplashImage}></img>
            <Oval height={80} width={80} wrapperStyle={{justifyContent: 'center'}} wrapperClass={'mt-3'}
                  color={'#475e6c'} secondaryColor={'#ff8811'} />
        </div>);
    } else {
        return(<div className={'d-flex flex-column h-100 p-1 REACT-ROOT' + (props.debug ? " debug" : "")} onClick={() => {statehistory.globalcanundostate = true;} } >
            {<TopBar room={props.room} />}
            {<Dock />}
            {isCleaning && <Cleaning />}
        </div>);
    }

}

interface OwnProps {room?: string}
interface StateProps {debug: boolean, isCleaning: boolean}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.debug = state.debug;
    ret.isCleaning = state.isCleaning;
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
