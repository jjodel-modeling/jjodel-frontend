import React, {PureComponent} from 'react';
import './App.scss';
import Dock from "./components/abstract/DockComponent";
import Draggable2 from "./graph/draggable/Draggable2";
import SaveManager from "./components/SaveManager/SaveManager.lazy";


interface AllProps{}
interface MPState{}

export default class App extends PureComponent<AllProps, MPState>{
    constructor(props: Readonly<AllProps> | AllProps) {
        super(props);
    }
    render() {
        return (<>
            <SaveManager />
            <Dock />
        </>);
    }
}
