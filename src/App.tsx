import React from 'react';
import './App.scss';
import './styles/view.scss';
import './styles/style.scss';
//import Dock from "./components/abstract/DockComponent";
import TopBar from "./components/topbar/Topbar";
import Dock from "./components/abstract/DockLayout";
import {statehistory} from "./joiner";

interface Props {}
function App(props: Props) {
    return(<div className={'d-flex flex-column h-100 p-1'} onClick={() => {statehistory.globalcanundostate = true;} } >
        <TopBar />
        <Dock />
    </div>);
}

export default App;
