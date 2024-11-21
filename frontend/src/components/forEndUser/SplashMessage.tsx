import React, {Dispatch, isValidElement, KeyboardEvent, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {
    Defaults,
    DPointerTargetable,
    DV,
    GObject,
    Keystrokes,
    Log,
    LPointerTargetable,
    Overlap,
    Pointer, store,
    U, LoggerCategoryState, RuntimeAccessible, RuntimeAccessibleClass
} from '../../joiner';
import './splash-message.scss';
class MessageType{
    public static s = 's';
    public static l = 'l';
    public static i = 'i';
    public static w = 'w';
    public static e = 'e';
    public static ex = 'ex';
}

class MessageData{
    public static animationTime: number = 1000;
    public static idMax: number = 1;
    msg: ReactNode;
    type: MessageType;
    id: number;
    publishingTime: number; // unix timestamp start
    lastingTime: number; // unix timestamp end
    requireInteraction: boolean;

    constructor(msg: ReactNode, lastingTime?: number, requireInteraction: boolean = false, type: MessageType = MessageType.l) {
        this.msg = msg;
        this.type = type;
        this.requireInteraction = requireInteraction;
        if (this.requireInteraction) lastingTime = Number.POSITIVE_INFINITY;
        else if (lastingTime === undefined){
            // todo: how to get text from ReactNode?
            let msgStr = (msg as any)?.innerText || msg;
            lastingTime = typeof msgStr == "string" ? msgStr.length * 3/30 : 4000;
        } else if (lastingTime < 0) lastingTime = Number.POSITIVE_INFINITY;

        this.publishingTime = new Date().getTime();
        this.lastingTime = lastingTime*1000 + MessageData.animationTime;
        this.id = MessageData.idMax++;
    }
}

class MessageVisualizerState{
    msg: MessageData[];
    constructor() { this.msg = []; }
}
export class MessageVisualizer extends React.Component<{}, MessageVisualizerState> {
    public static component: MessageVisualizer;
    private requireInteraction: boolean = false;

    constructor(){
        super({});
        this.state = new MessageVisualizerState();
        MessageVisualizer.component = this;
    }
    render(){
        if (!this.state.msg.length) return null;
        this.requireInteraction = false;
        let msgs = this.state.msg.map( (m, i) => this.renderMessage(m, i));
        return <div className={"splash-message-container"+ (this.requireInteraction && " blocking")}>{msgs}</div>
    }
    private renderMessage(msg: MessageData, i: number){
        if (!msg) return null;
        if (msg.requireInteraction) this.requireInteraction = true;
        let wrapper = <div key={msg.id} className={"splash-message " + msg.type} onClick={(e)=>this.onClick(e, i)}>{this.state.msg}</div>
        return wrapper;
    }

    private onClick(e: React.MouseEvent<HTMLDivElement>, i: number) {
        if (e.button === 2){ // MouseRightButton
            this.setState({msg:[]});
            return;
        }
        const msg = [...this.state.msg];
        msg.splice(i, 1);
        this.setState({msg})
    }
}

@RuntimeAccessible('Message')
export class Message extends RuntimeAccessibleClass {
    static cname: string = "Message";

    // requireInteraction = true makes a black background and non-clickthrough
    public static show(msg: ReactNode, time: number, type: MessageType = MessageType.i, requireInteraction: boolean = false): void{
        const msgo = new MessageData(msg, time, requireInteraction, type);
        MessageVisualizer.component.setState({msg:[...MessageVisualizer.component.state.msg, msgo]});
        if (msgo.lastingTime < Number.POSITIVE_INFINITY) setTimeout( ()=>Message.hide(msg), msgo.lastingTime);
    }

    public static hide(msg?: ReactNode): void {
        if (!msg) {
            MessageVisualizer.component.setState({msg: []});
            return;
        }
        let msgs = [...MessageVisualizer.component.state.msg];
        U.arrayRemoveAll(msgs, msg);
        if (msgs.length === MessageVisualizer.component.state.msg.length) return;
        MessageVisualizer.component.setState({msg:msgs});
    }
}
Message.cname = "Message";
