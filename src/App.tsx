import React from 'react';
import './styles/view.scss';
import './styles/style.scss';
//import Dock from "./components/abstract/DockComponent";
import TopBar from "./components/topbar/Topbar";
import Dock from "./components/abstract/DockLayout";

interface Props {}
function App(props: Props) {
    return(<div className={'d-flex flex-column h-100 p-1'} >
        <TopBar />
        <Dock />
    </div>);
}

export default App;
