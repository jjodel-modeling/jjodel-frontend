import React, {Dispatch, ReactElement, useState} from "react";
import {connect} from "react-redux";
import './style.scss';
import {
    DState,
    CreateElementAction,
    DEdgePoint,
    DViewElement,
    DVoidEdge,
    EdgeBendingMode, GObject,
    GraphSize, Input,
    Selectors, SetFieldAction, SetRootFieldAction,
    store
} from "../../joiner";
import {SaveManager} from "./SaveManager";
import {DamEdge} from "../../graph/damedges/damedge";
import toast from "react-hot-toast";
import RoomManager from "./RoomManager";
import Undoredocomponent from "./undoredocomponent";

function Topbar(props: AllProps) {
    const notify = (text: string) => toast((t: GObject) => (
        <div onClick={() => toast.dismiss(t.id)}>
            <label className={'ms-1'}>{text}</label>
        </div>
    ));
    const [edgetest, setEdgeTest] = useState(<div id={"edgetest-empty"}></div>);

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
        <label className={'item border round ms-1'} onClick={save}>Save</label>
        <label className={'item border round ms-1'} onClick={load}>Load</label>
        {props.debug && <Undoredocomponent /> }

        <label className={'item border round ms-1'} onClick={exportJson}>Export JSON</label>
        <label className={'item border round ms-1'} onClick={importJson}>Import JSON</label>

        {props.debug && <>
                <label className={'item border round ms-1'} onClick={exportXml}>Export XML</label>
                <label className={'item border round ms-1'} onClick={importXml}>Import XML</label>

                <div className={'ms-auto me-1 d-flex'}>
                    <label className={'item border round ms-1'} onClick={ () => SaveManager.exportLayout_click(false) }>Export Layout</label>
                    <label className={'item border round ms-1'} onClick={ () => SaveManager.importLayout_click(false) }>Import Layout</label>
                    <label className={'item border round ms-1'} onClick={ () => { let e = edgetestclick(); setTimeout(()=> setEdgeTest(e), 10); } }>Edge test</label>
                </div>
            </>
        }

        <label style={{display: "flex", cursor: "auto", margin:"auto"}}>
            <span style={{margin:"0 5px"}}>Debug mode</span>
            <input className={"my-auto input ms-auto"} type={"checkbox"} checked={props.debug} onChange={(e)=>{
            SetRootFieldAction.new("debug", e.target.checked);
            }
            } />
        </label>

        {props.debug && <RoomManager />}
        {props.debug && edgetest}

    </div>);
}
interface OwnProps {}
interface StateProps { debug: boolean; }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.debug = state.debug;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const TopBarConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(Topbar);

export const TopBar = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <TopBarConnected {...{...props, children}} />;
}





//             <ellipse stroke={"black"} fill={"red"} cx={this.props.node.end.x} cy={this.props.node.end.y}
//                         rx={this.props.node.end.w} ry={this.props.node.end.h} />
//             <ellipse stroke={"black"} fill={"red"} cx={this.props.node.start.x} cy={this.props.node.start.y}
//                         rx={this.props.node.start.w} ry={this.props.node.start.h} />
function edgetestclick(){
    let jsxmn_svg = `<ellipse stroke={"black"} fill={"red"} cx={this.props.node.x} cy={this.props.node.y} rx={this.props.node.w} ry={this.props.node.h} />`;
    let jsxmn_html = `<div style={{borderRadius:"999px", border: "2px solid black", background:"red", width:(this.props.node.w+50)+"px", height:(this.props.node.h+50)+"px"}} y={this.props.node.y}/>`;
    let jsxmn_html_nonodeaccess = `<div style={{borderRadius:"999px", border: "2px solid black", background:"red", width:"100%", height:"100%"}} />`;

    let jsxmn_html_manualpos = `<div style={{borderRadius:"999px", border: "2px solid black", position:"absolute", background:"red",
top:(this.props.node.y-this.props.node.h/2+50)+"px", left:(this.props.node.x-this.props.node.w/2+50)+"px",
width:(this.props.node.w+50)+"px", height:(this.props.node.h+50)+"px"}} y={this.props.node.y}/>`;
    let midnodeviewsvg = DViewElement.new2("edgepoint view svg", jsxmn_svg, (d)=>{d.defaultVSize=new GraphSize(0, 0, 5, 5);  d.adaptHeight=true; d.adaptWidth=true; });
    let midnodeview = DViewElement.new2("edgepoint view html", jsxmn_html_nonodeaccess, (d)=>{d.defaultVSize=new GraphSize(0, 0, 25, 25); /*d.adaptHeight=true; d.adaptWidth=true;*/ });
    let dataid = store.getState().models[0];
    // <g>{this.props.node.midnodes.map((mn) => <VoidVertex nodeid={mn.id+"_svg"} view={"`+midnodeviewsvg.id+`"} />)}</g>
    let jsx =
        `<svg>
            <path stroke={"black"} fill={"none"} d={this.props.path()}></path>
            {
                
                <foreignObject style={{overflow:"visible"}}>
                    <VoidVertex key={"midnode1"} view={"` + midnodeview.id + `"} />
                    <VoidVertex />
                </foreignObject>
            }
        </svg>`;

    let view = DViewElement.new2("edge view", jsx, (d)=> { d.bendingMode = EdgeBendingMode.Line; });
    // let node: DVoidEdge = DVoidEdge.new();
    /*function makeep(x:number, y:number, w=5, h=5) {
        // return new GraphSize(x, y, w, h);
        let e = DEdgePoint.new(undefined, node.id, undefined, undefined, new GraphSize(x, y, w, h));
        return e.id;
    }*/
    // let makeedgepoints = [makeep(50, 100), makeep(80, 100), makeep(120, 120), makeep(150,120), makeep(150, 80)];
    // SetFieldAction.new(node.id, "midnodes",  makeedgepoints, '', true);
    // node.midnodes = [makeep(50, 100), makeep(80, 100), makeep(120, 120), makeep(150,120), makeep(150, 80)];
    // CreateElementAction.new(view); CreateElementAction.new(midnodeview); CreateElementAction.new(node);
    let graphid = store.getState().graphs[0];
    return <div style={{position:"absolute", zIndex:1000, top:"50px", left:"50px", width:"500px", height:"500px", background:"white", border:"4px solid black"}}>
        <div style={{height:"100%", width:"100%", position:"relative"}}>
            {/*<DamEdge view={view.id} graphid={graphid} />*/}
        </div>
    </div>

}








export default TopBar;
