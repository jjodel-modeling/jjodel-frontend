import React from 'react';
import './App.scss';
import './styles/view.scss';
import './styles/style.scss';
//import Dock from "./components/abstract/DockComponent";
import Dock from "./components/abstract/DockLayout";
import {statehistory} from "./joiner";
import {useStateIfMounted} from "use-state-if-mounted";
import {useEffectOnce} from "usehooks-ts";
import SplashImage from './static/img/splash.png';
import {Oval} from "react-loader-spinner";
import TopBar from "./components/topbar/Topbar";
import Auth from "./auth/Auth";
import Popup from "./memorec/Popup";

interface Props {}
function App(props: Props) {
    const [splash, setSplash] = useStateIfMounted(false);

    useEffectOnce(() => {
        const promise = new Promise((resolve) => {setTimeout(resolve, 4 * 1000)});
        promise.then(() => {setSplash(false)});
    });

    if(splash) {
        return(<div className={'w-100 h-100 text-center bg-smoke'}>
            <img className={'mt-3 rounded shadow'} src={SplashImage}></img>
            <Oval height={80} width={80} wrapperStyle={{justifyContent: 'center'}} wrapperClass={'mt-3'}
                  color={'#475e6c'} secondaryColor={'#ff8811'} />
        </div>);
    } else {
        return(<div className={'d-flex flex-column h-100 p-1'} onClick={() => {statehistory.globalcanundostate = true;} } >
            <Popup />
            <TopBar />
            <Dock />
        </div>);
    }
}

export default App;
