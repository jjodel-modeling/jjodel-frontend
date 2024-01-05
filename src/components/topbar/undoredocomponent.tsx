import React, {Dispatch, PureComponent, ReactNode} from 'react';
import {
    Dictionary, DUser,
    GObject, DState,
    Log, U, RedoAction,
    statehistory,
    UndoAction, store, DPointerTargetable,
} from '../../joiner';
import {connect} from "react-redux";

interface SaveManagerProps {}

class UndoRedoState{
    hover: boolean = false;
    jsx: any | null;
    constructor(jsx: any) {  this.jsx = jsx; }
}

// private
interface ThisState {
    undo: UndoRedoState;
    redo: UndoRedoState;
}

// private
interface OwnProps {
    // propsRequestedFromHtmlAsAttributes: string;
}
// private
interface StateProps {
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
    maxlistsize: number;
    undo: GObject<"delta">[],
    redo: GObject<"delta">[],
    debug: boolean
}

// private
interface DispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}

type R = {str: string, fullstr: string, path:string[], fullpath:string[], val: string, fullvalue: string, pathlength?: number};

// private
type AllProps = OwnProps & StateProps & DispatchProps;
export class SaveManagerComponent extends PureComponent<AllProps, ThisState>{
    public static cname: string = "SaveManagerComponent";
    private undoredolistoutdated: boolean;
    do_undo = (index: number) => {
        UndoAction.new(index+1);
        this.undoenter(); // updates list
    }
    do_redo = (index: number) => {
        console.log("redo(" + index + ")");
        RedoAction.new(index+1);
        this.redoenter();
    }
    printablePointer(pathsegment: string, state: DState){
        let obj = DPointerTargetable.from(pathsegment, state) as GObject;
        if (!obj) return pathsegment;
        if (obj.name) return "$"+obj.name;
        if (obj.className) return "#"+obj.className;
        return pathsegment;
    }
    // redo list is updated only when the user mouse-enters it. for efficiency.
    undoredoenter = (key: string = "undo") => {
        console.log("statemanager undo update", {thiss:this, undo:this.props.undo, redo: this.props.redo, props: this.props, state:this.state});
        if (!this.undoredolistoutdated) return;
        let s: DState = store.getState();
        let jsx = <>
            {
                [...(this.props as GObject)[key]].reverse().slice(0, this.props.maxlistsize).map((delta, index) => {
                    let out: {best: R}&R[] = [] as GObject as R[] & {best:R};
                    let retuseless = U.ObjectToAssignementStrings(delta, 10, 6, 20, "…", out, true);
                    console.log("undoredo update", out);
                    if (out.best.fullstr.includes("Pointer")) {
                        let editedfullpath = out.best.fullpath.map( (pathsegment) => {
                            //  console.log("undoredo replace attempt", {pathsegment, idlookup:s.idlookup, dobj:s.idlookup[pathsegment], replacement: this.printablePointer(pathsegment, s)});
                            return this.printablePointer(pathsegment, s); });
                        out.best.str = editedfullpath.join(".") + " = " + out.best.val;
                        console.log("undoredo replace attempt", {editedfullpath, beststr:out.best.str, best: out.best});

                    }

                    if (out.best.path[0] === "idlookup") out.best.str = "" + out.best.str.substring("idlookup.".length);
                    if (out.best.fullvalue.includes("Pointer")) {
                        out.best.val = this.printablePointer(out.best.fullvalue.substring(1, out.best.fullvalue.length-1), s); // 1, -1 because string values have quotes ""
                        out.best.str = out.best.str.substring(0, out.best.str.lastIndexOf("=")) + "= " + out.best.val;
                    }
                    return <li onClick={() => ((this as GObject)["do_"+key](index))} className="hoverable" key={index} style={{overflow: "visible", height: "24px"}}>
                        <div className={"preview"}>{out.best.str}</div>
                        <div className={"content"} style={{overflow: "visible", height:"100%",
                            width: "max-content", maxWidth: "75vw"}}>{
                            out.map(row => <div style={{background: "#ddd", marginLeft: "-20px", paddingLeft:"20px", height:"fit-content", pointerEvents:"none"}}>{row.fullpath.join(".") + " = " + row.fullvalue}</div>)
                        }</div>
                    </li>
                })}</>;
        let obj: GObject = {};
        obj[key] = {...(this.state as GObject)[key], hover: true, jsx};
        // {undo: {...this.state.undo, hover: true, jsx}}
        this.undoredolistoutdated = false;
        this.setState(obj as ThisState);
    }

    undoenter = ()=>{ return this.undoredoenter("undo"); }
    redoenter = ()=>{ return this.undoredoenter("redo"); }
    undoleave = ()=>{ this.setState({undo: {...this.state.undo, hover: false}}); }
    redoleave = ()=>{ this.setState({redo: {...this.state.redo, hover: false}}); }

    constructor(props: AllProps, context: any) {
        super(props, context);
        let undo = new UndoRedoState(<div>undolist example</div>);
        let redo = new UndoRedoState(<div>redolist example</div>);
        this.state = {undo, redo};
        this.undoredolistoutdated = true;
        // this.setState({undo, redo});
    }
    render(): ReactNode {
        this.undoredolistoutdated = true; // if render is called it means redux state props he's watching (redux-state) changed, so the preview list in component-state is outdated.
        // console.log("undoredomanager", {thiss:this, undo:this.props.undo, props: this.props, state:this.state});
        return(<>
            <div style={{display: "inline-block"}}>
                <span className={"hoverable"} style={{position: "relative", background: "white"}} onMouseEnter={this.undoenter} onMouseLeave={this.undoleave}>
                    <button className={'item border round ms-1'} onClick={(e)=> { this.do_undo(0) }}>Undo ({this.props.undo.length})</button>
                    {this.props.debug && this.props.undo.length ? <ul style={{background: "inherit", width: "max-content", zIndex:10000}} className={"content"}>{this.state.undo.jsx}</ul> : null}
                </span>
                <span className={"hoverable"} style={{position: "relative", background: "white"}} onMouseEnter={this.redoenter} onMouseLeave={this.redoleave}>
                    <button className={'item border round ms-1'} onClick={(e)=> { this.do_redo(0) }}>Redo ({this.props.redo.length})</button>
                    {this.props.debug && this.props.redo.length ? <ul style={{background: "inherit", width: "max-content", zIndex:10000}} className={"content"}>{this.state.redo.jsx}</ul> : null}
                </span>
            </div>
        </>);
    }
}


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.undo = statehistory[DUser.current].undoable;
    ret.redo = statehistory[DUser.current].redoable;
    ret.maxlistsize = 10;
    ret.debug = state.debug;
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }

export const SaveManagerConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(SaveManagerComponent);

export default SaveManagerConnected;
