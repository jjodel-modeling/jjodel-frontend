import React, {Dispatch, JSX, PureComponent, ReactNode} from 'react';
import {
    Dictionary, DUser,
    GObject, DState,
    Log, U, RedoAction,
    statehistory,
    UndoAction, store, DPointerTargetable, Pointer, LProject, UserHistory,
} from '../../joiner';
import {connect} from "react-redux";
import "./undoredo.scss"
import {icon} from "../../pages/components/icons/Icons";
import {COMMIT} from "../../redux/action/action";

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

type R = {
    str: string,
    fullstr: string,
    path:string[],
    fullpath:string[],
    fullpath_str?:string, // fullpath.join('.') only saved temporarly in render phase
    val: string,
    fullvalue: string,
    pathlength?: number
};

// private
type AllProps = OwnProps & StateProps & DispatchProps;
export class SaveManagerComponent extends PureComponent<AllProps, ThisState>{
    public static cname: string = "SaveManagerComponent";
    private undoredolistoutdated: boolean;
    do_undo = (index: number) => {
        UndoAction.new(index+1, this.state.user, false).commit();
        this.undoenter(); // updates list
    }
    do_redo = (index: number) => {
        console.log("redo(" + index + ")");
        RedoAction.new(index+1, this.state.user, false).commit();
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
    undoredoenter2 = (key: "undo"|"redo" = "undo") => {
        let history = this.get_history(this.state.user);
        let undoarr = history.undoable;
        let redoarr = history.redoable;
        // console.log("statemanager undo update", {thiss:this, undoarr, redoarr, user: this.state.user, props: this.props, state:this.state});
        if (!this.undoredolistoutdated) return;
        let s: DState = store.getState();
        let arr = [...(key === 'undo' ? undoarr : redoarr)].reverse().slice(0, this.props.maxlistsize);
        let out: {best: R, obj: GObject}&R[] = [] as any;
        let strings = arr.map( delta => U.ObjectToAssignementStrings(delta, 10, 6, 20, "…", out, true));
        //todo: make it just for current index, then get the next val from index+1 or current state, using R.path and replacing just the value. on mouseover switch it val of the delta vs next val
            let list = arr.map((delta, index) => {})

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
    undoredoenter = (key: "undo"|"redo" = "undo??" as any) => {
        let debug = this.props.debug;
        let history = this.get_history(this.state.user);
        let undoarr = history.undoable;
        let redoarr = history.redoable;
        // console.log("statemanager undo update", {thiss:this, undoarr, redoarr, user: this.state.user, props: this.props, state:this.state});
        if (!this.undoredolistoutdated) return;
        let s: DState = store.getState();
        // let arr = [...(this.props as GObject)[key]].reverse().slice(0, this.props.maxlistsize);
        let fullarr = [...(key === 'undo' ? undoarr : redoarr)].reverse()
        let arr = fullarr.slice(0, this.props.maxlistsize);

        function getLatestDelta(i: number, searchPath: string[], direction: -1 | 1 = 1): GObject {
            outer: for (; i < fullarr.length+1 && i >= -1; i+=direction) {
                let rootdelta = fullarr[i] || s;
                let currDelta = rootdelta;
                for (let pathSeg of searchPath){
                    if (!(pathSeg in currDelta)) continue outer;
                    else currDelta = currDelta[pathSeg];
                }
                return rootdelta;
            }
            return s;
        }
        let list = arr.map((delta, index) => {
            let out: {best: R, obj: GObject}&R[] = [] as GObject as any;
            let out_otherdelta: {best: R, obj: GObject}&R[] = [] as any;
            let titleindex = index + (key === 'undo' ? -1 : 0);
            let titleDelta = arr[titleindex]
            let otherDelta = arr[index + 1]; //[index + (key === 'undo' ? -1 : +1)]
            // let actiodesc = key ==='undo' ? arr[index + 1] : ) || s;

            let excludedPaths: Dictionary<string, boolean> = {'action.title': true, 'action.description': true};
            let filterrow = (e:R)=> {
                //console.log('filterrow', {debug, e});
                return debug || !excludedPaths[key] && !e.fullpath.includes("clonedCounter")
                    && !e.fullpath.includes("timestamp")
                    && !e.fullpath.includes("timestampdiff")
                    && !e.fullpath.includes("pointedBy")
                    && !e.fullpath.includes("pointedBy")
                    && !e.fullpath.includes('__jjObjDiffIsArr');
            }
            U.ObjectToAssignementStrings(delta, 10, 6, 20, "…", out, true, filterrow);
            if (otherDelta) U.ObjectToAssignementStrings(otherDelta, 10, 6, 20, "…", out_otherdelta, true, filterrow);
            // if (!index) console.log('debug undoredo', {out, delta, arr});
            // if out.best is undef, then get most recent titles until you find a delta with a title or the current(state)
            let latestTitleDelta = getLatestDelta(titleindex, ['action_title'], (key === 'undo' ? -1 : +1));
            let debugTitle = (titleDelta||s).action_title;
            // console.log('getLatestDelta', {delta, latestTitleDelta, best:out.best?.str, titleDelta, dt:(titleDelta||s).action_title, titleindex, out})
            if (!out.best?.str) {
                console.error('generated wrong delta??', {out, best:out?.best});
                return <><div>errored</div></>;
            }
            if (latestTitleDelta.action_title) out.best.str = latestTitleDelta.action_title;
            if (latestTitleDelta.action_description) out.best.fullstr = latestTitleDelta.action_description;
            else out.best.fullstr = out.length + ' subchanges';
            if (latestTitleDelta.action_title !== debugTitle) out.best.str = '* ' + out.best.str;
            if ((otherDelta)?.action_title) out_otherdelta.best.str = (otherDelta||s).action_title;
            if ((otherDelta)?.action_description) out_otherdelta.best.fullstr = (otherDelta||s).action_description;
            out.best.str = U.cropStr(out.best.str, 1, 0, 13, 12);
            out.best.fullstr = U.cropStr(out.best.fullstr, 1, 0, 250, 250);
            //out_otherdelta.best.str = U.cropStr(out_otherdelta.best.str, 1, 0, 13, 12);
            //out_otherdelta.best.fullstr = U.cropStr(out_otherdelta.best.fullstr, 1, 0, 250, 250);
            //this.improveText(out.best, s);
            let other = out.slice(0, this.props.maxDetailSize); //.map(e=>this.improveText(e));
            let other2 = out_otherdelta.slice(0, this.props.maxDetailSize); //.map(e=>this.improveText(e));

            let newstyle: boolean = true as any;

            let entry = (): JSX.Element => {
                return (
                    <li onClick={() => ((this as GObject)["do_" + key](index))} className="hoverable" key={index} tabIndex={0}>
                        <label className="highlight undefined">
                            <span><i className="bi bi-app hidden"/> i</span>
                        </label>
                    </li>)
            }
            // if (newstyle) return entry();


            for (let e of other2){ e.fullpath_str = e.fullpath.join(".")}
            for (let e of other){ e.fullpath_str = e.fullpath.join(".")}
            return <li onClick={() => ((this as GObject)["do_" + key](index))} className="" key={index}
                       tabIndex={0}
                       style={{/*overflow: "visible", height: "24px"*/}}>
                <label className="highlight undefined hoverable">
                    <div className={"my-auto preview"}>{out.best.str}</div>
                    <div className={"my-auto content inline"}>{out.best.fullstr}</div>
                    <div className={"content right detail-list"}>
                        <ul className="context-menu right">{
                            other.map((row, ii) => {
                                let row2 = other2.filter(e=>e.fullpath_str === row.fullpath_str)[0];//other2[ii];
                                return <li className={'detail-entry hoverable'} onClick={(e=> {
                                    e.stopPropagation()
                                })}>
                                    <label className={`highlight disabled hoverable`}>
                                    <span
                                        className='preview inline'>{row.fullpath_str + " = " + row.fullvalue}</span>
                                        <span className='content inline'>{row2 && (row2.fullpath_str + " = " + row2.fullvalue)}</span>
                                    </label>
                                </li>
                            })}
                            {out.length !== other.length ? <div className={'detail-entry'}>...</div> : null}
                        </ul>
                    </div>
                </label>
            </li>
        });
        let jsx =
            <>{list}</>;
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

    constructor(props: AllProps, context?: any) {
        super(props);
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
        let history: UserHistory = this.get_history(user);
        let undo: GObject<"delta">[] = history?.undoable || [];
        let redo: GObject<"delta">[] = history?.redoable || [];

        let contextmenustyle = (undoStr: 'Undo'|'Redo', undoarr: GObject<"delta">[]): JSX.Element => {
            let undostr = undoStr.toLowerCase() as 'undo'|'redo';
            let isUndo = undoarr === undo;
            return (
            <li className={"undoredo hoverable " +(!undoarr.length?'disabled':'')} tabIndex={0}
                onMouseEnter={isUndo?this.undoenter:this.redoenter}
                onMouseLeave={isUndo?this.undoleave:this.redoleave}>

                <label className="highlight undefined" onClick={(e) => {
                    isUndo ? this.do_undo(0) : this.do_redo(0)
                }}>
                    <span>{icon[undostr]} <span>{undoStr + ' ' + ((undoarr).length || '')}</span></span>
                    {<div className="keystrokes">
                        <i className="text-icon ctrl" title="Control" data-val="ctrl" data-content="Control"/>
                        <span>{isUndo ? 'Z' : 'Y'}</span>
                    </div>}
                    {undoarr.length ? <i className="bi bi-chevron-right icon-expand-submenu"/> : null}
                </label>
                <div className="content right">
                    {undoarr.length ? <ul className="context-menu right">{this.state[undostr].jsx}</ul> : null}
                </div>
            </li>)
        }

        let testnew: boolean = true as any;
        if (testnew) return <>
            {contextmenustyle('Undo', undo)}
            {contextmenustyle('Redo', redo)}
        </>

        return (<>
            <div className='undoredo' key={'undo'}>
                <span className={"hoverable"} style={{position: "relative", background: "white"}}
                      onMouseEnter={this.undoenter} onMouseLeave={this.undoleave}>
                    <button className={'item border round ms-1'} onClick={(e) => {
                        this.do_undo(0)
                    }}>Undo ({undo.length})</button>
                    {undo.length ?
                        <ul style={{background: "inherit", width: "max-content", zIndex:10000}} className={"content"}>
                            {this.state.undo.jsx}
                        </ul>
                        : null}
                </span>
                <span className={"hoverable"} style={{position: "relative", background: "white"}} onMouseEnter={this.redoenter} onMouseLeave={this.redoleave}>
                    <button className={'item border round ms-1'} onClick={(e)=> { this.do_redo(0) }}>Redo ({redo.length})</button>
                    { redo.length ? <ul style={{background: "inherit", width: "max-content", zIndex:10000}} className={"content"}>{this.state.redo.jsx}</ul> : null}
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
    ret.maxlistsize = 20;
    ret.maxDetailSize = 30;
    ret.debug = state.debug;
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