import React, {CSSProperties, PureComponent} from 'react';
import "./Draggable.css";
import Draggable from 'react-draggable';

interface AllProps{}
interface MPState{}

export default class Draggable2 extends PureComponent<AllProps, MPState>{
    constructor(props: Readonly<AllProps> | AllProps) {
        super(props);
    }


    render() {
        return (<Draggable>
            <div className={"draggable"}></div>
        </Draggable>);
    }
}
