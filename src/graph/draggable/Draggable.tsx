import React, {CSSProperties, PureComponent} from 'react';
import "./Draggable.css";

interface AllProps{}
interface MPState{diffX: number, diffY: number, dragging: boolean, styles: CSSProperties}

export default class Draggable extends PureComponent<AllProps, MPState>{
    constructor(props: Readonly<AllProps> | AllProps) {
        super(props);
        this.state = {
            diffX: 0,
            diffY: 0,
            dragging: false,
            styles: {}
        }
        this._dragStart = this._dragStart.bind(this);
        this._dragging = this._dragging.bind(this);
        this._dragEnd = this._dragEnd.bind(this);
    }
    _dragStart(e: any) {
        this.setState({
            diffX: e.screenX - e.currentTarget.getBoundingClientRect().left,
            diffY: e.screenY - e.currentTarget.getBoundingClientRect().top,
            dragging: true
        });
    }
    _dragging(e: any) {
        if(this.state.dragging) {
            const left = e.screenX - this.state.diffX;
            const top = e.screenY - this.state.diffY;
            this.setState({
                styles: {
                    left: left,
                    top: top
                }
            });
        }
    }
    _dragEnd() {
        this.setState({
            dragging: false
        });
    }

    render() {
        return (<div className={"draggable-container"}>
            <div className={"draggable"} style={this.state.styles}
                 onMouseDown={this._dragStart} onMouseMove={this._dragging} onMouseUp={this._dragEnd}>
            </div>
        </div>);
    }
}
