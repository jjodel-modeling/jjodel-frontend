import React, {PureComponent} from 'react';
import './App.scss';
import Dock from "./components/abstract/DockComponent";


interface AllProps{}
interface MPState{}

export default class App extends PureComponent<AllProps, MPState>{
    constructor(props: Readonly<AllProps> | AllProps) {
        super(props);
    }
    render() {
        return (<>
            <Dock />
        </>);
    }
}
