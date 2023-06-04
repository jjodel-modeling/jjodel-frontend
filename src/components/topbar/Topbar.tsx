import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import './style.scss';
import {
    CreateElementAction,
    DEdgePoint,
    DViewElement,
    DVoidEdge,
    EdgeBendingMode, GObject,
    GraphSize, Input,
    Selectors, SetRootFieldAction,
    store
} from "../../joiner";
import {SaveManager} from "./SaveManager";
import {DamEdge} from "../../graph/damedges/damedge";
import toast from "react-hot-toast";
import RoomManager from "./RoomManager";

function Topbar(props: AllProps) {

    const notify = (text: string) => toast((t: GObject) => (
        <div onClick={() => toast.dismiss(t.id)}>
            <label className={'ms-1'}>{text}</label>
        </div>
    ));

    const save = (evt: React.MouseEvent<HTMLLabelElement>) => {
        SaveManager.save();
        notify('Saved');
    }
    const load = (evt: React.MouseEvent<HTMLLabelElement>) => {
        SaveManager.load();
    }

    const importJson = (evt: React.MouseEvent<HTMLLabelElement>) => {
        SaveManager.importEcore_click(false, true);
    }
    const exportJson = (evt: React.MouseEvent<HTMLLabelElement>) => {
        SaveManager.exportEcore_click(false, true);
    }

    const importXml = (evt: React.MouseEvent<HTMLLabelElement>) => {
        SaveManager.importEcore_click(true, true);
    }
    const exportXml = (evt: React.MouseEvent<HTMLLabelElement>) => {
        SaveManager.exportEcore_click(true, true);
    }

    if (props.debug && !document.body.classList.contains("debug")) document.body.classList.add("debug");
    else document.body.classList.remove("debug")

    return(<div className={'topbar d-flex'}>
        {/*
        <Undoredocomponent />

        <label className={'item border round ms-1'} onClick={exportXml}>Export XML</label>
        <label className={'item border round ms-1'} onClick={importXml}>Import XML</label>

        <div className={'ms-auto me-1'}>
            <label className={'item border round ms-1'} onClick={ () => SaveManager.exportLayout_click(false) }>Export Layout</label>
            <label className={'item border round ms-1'} onClick={ () => SaveManager.importLayout_click(false) }>Import Layout</label>
            <label className={'item border round ms-1'} onClick={ () => edgetest() }>Edge test</label>
        </div>
        */}

        <label className={'item border round ms-1'} onClick={save}>Save</label>
        <label className={'item border round ms-1'} onClick={load}>Load</label>

        <label className={'item border round ms-1'} onClick={exportJson}>Export JSON</label>
        <label className={'item border round ms-1'} onClick={importJson}>Import JSON</label>


        <div hidden={true} className={"p-1 "} style={{display: "flex", cursor: "auto"}}>
            <label className={"my-auto"}>Debug mode</label>
            <input className={"my-auto input ms-auto"} type={"checkbox"} checked={props.debug}
                   onChange={(e)=>{SetRootFieldAction.new("debug", e.target.checked);}} />
        </div>

        {/*<RoomManager />*/}

    </div>);
}
interface OwnProps {}
interface StateProps { debug: boolean; }
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


export const TopBarConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(Topbar);

export const TopBar = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <TopBarConnected {...{...props, children}} />;
}





let edgetestvar: JSX.Element = <></>;
//             <ellipse stroke={"black"} fill={"red"} cx={this.props.node.end.x} cy={this.props.node.end.y}
//                         rx={this.props.node.end.w} ry={this.props.node.end.h} />
//             <ellipse stroke={"black"} fill={"red"} cx={this.props.node.start.x} cy={this.props.node.start.y}
//                         rx={this.props.node.start.w} ry={this.props.node.start.h} />
function edgetest(){
    let jsx =
        `<svg>
            <path stroke={"black"} fill={"none"} d={this.path()}></path>
            {this.props.node.midnodes.map(mn => <ellipse stroke={"black"} fill={"red"} cx={mn.x} cy={mn.y} rx={mn.w} ry={mn.h} />)}
        </svg>`
    let view = DViewElement.new2("edge view", jsx, (d)=> { d.bendingMode = EdgeBendingMode.Line});
    let midnodejsx = `<div style={{position:"absolute", top: this.data.x+"px", left: this.data.y+"px"}}>midnode</div>`;
    let midnodeview = DViewElement.new("edgepoint view", midnodejsx);
    let node: DVoidEdge = DVoidEdge.new();
    function makeep(x:number, y:number, w=5, h=5) {
        let e = DEdgePoint.new(undefined, node.id, undefined, undefined, new GraphSize(x, y, w, h));
        return e.id;
    }
    node.midnodes = [makeep(50, 100), makeep(80, 100), makeep(120, 120), makeep(150,120), makeep(150, 80)];
    CreateElementAction.new(view);
    CreateElementAction.new(midnodeview);
    CreateElementAction.new(node);
    let graphid = store.getState().graphs[0];
    edgetestvar = <div style={{position:"absolute", zIndex:1000, top:"50px", left:"50px", width:"500px", height:"500px", background:"white", border:"4px solid black"}}>
        <div style={{height:"100%", width:"100%", position:"relative"}}>
            <DamEdge view={view.id} graphid={graphid} nodeid={node.id}></DamEdge>
        </div>
    </div>

}








export default TopBar;
