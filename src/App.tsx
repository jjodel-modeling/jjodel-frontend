import React, {Dispatch} from 'react';
import './App.scss';
import './styles/view.scss';
import './styles/style.scss';
import Dock from "./components/abstract/DockLayout";
import {IStore, statehistory} from "./joiner";
import {useStateIfMounted} from "use-state-if-mounted";
import {useEffectOnce} from "usehooks-ts";
import SplashImage from './static/img/splash.png';
import {Oval} from "react-loader-spinner";
import TopBar from "./components/topbar/Topbar";
import {connect} from "react-redux";

function App(props: AllProps) {
    const debug = props.debug;
    const [splash, setSplash] = useStateIfMounted(false);

    useEffectOnce(() => {
        const promise = new Promise((resolve) => {setTimeout(resolve, 3 * 1000)});
        promise.then(() => {setSplash(false)});
    });

    if(splash) {
        return(<div className={'w-100 h-100 text-center bg-smoke'}>
            <img className={'mt-3 rounded shadow'} src={SplashImage}></img>
            <Oval height={80} width={80} wrapperStyle={{justifyContent: 'center'}} wrapperClass={'mt-3'}
                  color={'#475e6c'} secondaryColor={'#ff8811'} />
        </div>);
    } else {
        return(<div className={'d-flex flex-column h-100 p-1 REACT-ROOT' + (props.debug ? " debug" : "")} onClick={() => {statehistory.globalcanundostate = true;} } >
            <TopBar room={props.room} />
            <Dock />
        </div>);
    }

}

interface OwnProps {room?: string}
interface StateProps {debug: boolean}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.debug = state.debug;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const AppConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(App);


export default AppConnected;
