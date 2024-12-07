import React, {Dispatch, PureComponent, ReactNode} from 'react';
import {
    Dictionary, DUser,
    GObject, DState,
    Log, U, RedoAction,
    statehistory,
    UndoAction, store, DPointerTargetable, Pointer, LProject,
} from '../../joiner';
import {connect} from "react-redux";
import "./undoredo.scss"

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
    user: Pointer<DUser>|'all';
}

// private
interface OwnProps {
    // propsRequestedFromHtmlAsAttributes: string;
    project: LProject;
}
// private
interface StateProps {
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
    maxlistsize: number;
    maxDetailSize: number;
    //undo: GObject<"delta">[],
    // redo: GObject<"delta">[],
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
        UndoAction.new(index+1, this.state.user);
        this.undoenter(); // updates list
    }
    do_redo = (index: number) => {
        console.log("redo(" + index + ")");
        RedoAction.new(index+1, this.state.user);
        this.redoenter();
    }
    printablePointer(pathsegment: string, state: DState){
        let obj = DPointerTargetable.from(pathsegment, state) as GObject;
        if (!obj) return pathsegment;
        if (obj.name) return "$"+obj.name;
        if (obj.className) return "#"+obj.className;
        return pathsegment;
    }
    improveText(e: R, s: DState) {
        if (e.fullstr.includes("Pointer")) {
            let editedfullpath = e.fullpath.map( (pathsegment) => {
                //  console.log("undoredo replace attempt", {pathsegment, idlookup:s.idlookup, dobj:s.idlookup[pathsegment], replacement: this.printablePointer(pathsegment, s)});
                return this.printablePointer(pathsegment, s); });
            e.str = editedfullpath.join(".") + " = " + e.val;
            console.log("undoredo replace attempt", {editedfullpath, beststr:e.str, best: e});
        }
        if (e.path[0] === "idlookup") e.str = "" + e.str.substring("idlookup.".length);
        if (e.fullvalue.includes("Pointer")) {
            e.val = this.printablePointer(e.fullvalue.substring(1, e.fullvalue.length-1), s); // 1, -1 because string values have quotes ""
            e.str = e.str.substring(0, e.str.lastIndexOf("=")) + "= " + e.val;
        }
    }
    // redo list is updated only when the user mouse-enters it. for efficiency.
    undoredoenter = (key: "undo"|"redo" = "undo") => {
        let history = this.get_history(this.state.user);
        let undoarr = history.undoable;
        let redoarr = history.redoable;
        console.log("statemanager undo update", {thiss:this, undoarr, redoarr, user: this.state.user, props: this.props, state:this.state});
        if (!this.undoredolistoutdated) return;
        let s: DState = store.getState();
        // let arr = [...(this.props as GObject)[key]].reverse().slice(0, this.props.maxlistsize);
        let arr = [...(key === 'undo' ? undoarr : redoarr)].reverse().slice(0, this.props.maxlistsize);
        let list = arr.map((delta, index) => {
            let prevDelta = arr[index + 1]; //[index + (key === 'undo' ? -1 : +1)]
            let out: {best: R}&R[] = [] as GObject as R[] & {best:R};
            U.ObjectToAssignementStrings(delta, 10, 6, 20, "…", out, true);
            if (!index) console.log('debug undoredo', {out, delta, arr});
            console.log("undoredo update", out);
            if ((prevDelta||s).action_title) out.best.str = (prevDelta||s).action_title;
            if ((prevDelta||s).action_description) out.best.fullstr = (prevDelta||s).action_description;
            //this.improveText(out.best, s);
            let other = out.slice(0, this.props.maxDetailSize); //.map(e=>this.improveText(e));
            return <li onClick={() => ((this as GObject)["do_"+key](index))} className="hoverable" key={index} style={{overflow: "visible", height: "24px"}}>
                <div className={"preview"}>{out.best.str}</div>
                <div className={"content detail-list"}>{
                    other.map(row => (
                        <div className={'detail-entry'}>{row.fullpath.join(".") + " = " + row.fullvalue}</div>
                    ))
                }
                {out.length !== other.length ? <div></div> : null}</div>
            </li>
        });
        let jsx = <>{list}</>;
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
        let undo = new UndoRedoState(<div>undo list example</div>);
        let redo = new UndoRedoState(<div>redo list example</div>);
        this.state = {undo, redo, user: DUser.current};
        this.undoredolistoutdated = true;
        // this.setState({undo, redo});
    }
    get_history(user: Pointer<DUser> | 'all'): {redoable: GObject[], undoable: GObject[]}{
        // let ret = {redoable: [] as GObject[], undoable: [] as GObject[]};
            return statehistory[user];
    }
    erase_history(user: Pointer<DUser> | 'all', project: LProject){
        if (user === 'all'){/*
            for (let user of project.collaborators){
                this.erase_history(user.id, project);
            }
            this.erase_history(DUser.current, project);*/
            for (let user in statehistory){
                statehistory[user].undoable = [];
                statehistory[user].redoable = [];
            }
        } else {
            statehistory[user].undoable = [];
            statehistory[user].redoable = [];
        }
    }
    render(): ReactNode {
        let user = this.state.user;
        this.undoredolistoutdated = true; // if render is called it means redux state props he's watching (redux-state) changed, so the preview list in component-state is outdated.
        // console.log("undoredomanager", {thiss:this, undo:this.props.undo, props: this.props, state:this.state});
        let history = this.get_history(user);
        let undo = history.undoable;
        let redo = history.redoable;
        return(<>
            <div className='undoredo'>
                <span className={"hoverable"} style={{position: "relative", background: "white"}} onMouseEnter={this.undoenter} onMouseLeave={this.undoleave}>
                    <button className={'item border round ms-1'} onClick={(e)=> { this.do_undo(0) }}>Undo ({undo.length})</button>
                    {this.props.debug && undo.length ?
                        <ul style={{background: "inherit", width: "max-content", zIndex:10000}} className={"content"}>{this.state.undo.jsx}</ul>
                        : null}
                </span>
                <span className={"hoverable"} style={{position: "relative", background: "white"}} onMouseEnter={this.redoenter} onMouseLeave={this.redoleave}>
                    <button className={'item border round ms-1'} onClick={(e)=> { this.do_redo(0) }}>Redo ({redo.length})</button>
                    {this.props.debug && redo.length ? <ul style={{background: "inherit", width: "max-content", zIndex:10000}} className={"content"}>{this.state.redo.jsx}</ul> : null}
                </span>
                <button onClick={()=>{this.erase_history(user, this.props.project)}}>x</button>
            </div>
        </>);
    }
}


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    //ret.undo = statehistory[DUser.current].undoable;
    //ret.redo = statehistory[DUser.current].redoable;
    ret.maxlistsize = 10;
    ret.maxDetailSize = 20;
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
export const Undoredocomponent = SaveManagerConnected;