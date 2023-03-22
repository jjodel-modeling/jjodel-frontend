import React, {ChangeEvent, Dispatch, FC, PureComponent, ReactNode} from 'react';
import {
    Dictionary, DUser,
    EcoreParser, GObject, IStore,
    Json,
    LModel,
    LoadAction,
    Log, U,
    LPointerTargetable, prjson2xml, prxml2json, RedoAction,
    Selectors,
    statehistory,
    store,
    UndoAction, UnixTimestamp
} from '../../joiner';
import './SaveManager.scss';
import {connect} from "react-redux";

interface SaveManagerProps {}
const style = {
    position: "absolute",
    right: "5%",
    top: "5%",
    // border: "1px solid black",
    display: "inline-block",
    zIndex: 10
} as any;
/*const SaveManagerfc: FC<SaveManagerProps> = () => (
  <>
      <div style={ style }>
          <button onClick={(e)=> { save() }}>Save</button>
          <button onClick={(e)=> { load() }}>Load</button>
          <br />
          <button onClick={(e)=> { undo() }}>Undo</button>
          <button onClick={(e)=> { redo() }}>Redo</button>
          <br />
          <button onClick={(e)=> { exportEcore() }}>Export JSON</button>
          <button onClick={(e)=> { importEcore() }}>Import JSON</button>
          <button onClick={(e)=> { exportEcore(true) }}>Export XML</button>
          <button onClick={(e)=> { importEcore(true) }}>Import XML</button>
    </div>
    <span id={"export-tmp"} style={{position: "absolute", width: "25vw", bottom:0, overflowY: "scroll", zIndex:10, right:0, background: "white"}}></span>
    </>
);
*/
class UndoRedoState{
    hover: boolean = false;
    jsx: any | null;
    constructor(jsx: any) {
        this.jsx = jsx;
    }/*
    styleon!: React.CSSProperties;
    styleoff!: React.CSSProperties;
    style!: React.CSSProperties;
    */

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
}

// private
interface DispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}

type R = {str: string, path:string[], fullpath:string[], val: string, fullvalue: string, pathlength?: number};

// private
type AllProps = OwnProps & StateProps & DispatchProps;
export class SaveManagerComponent extends PureComponent<AllProps, ThisState>{
    do_undo = (index: number) => {
        console.error("undo(" + index + ")");
        UndoAction.new(index+1);
        this.undoenter(); // updates list
    }
    do_redo = (index: number) => {
        console.error("redo(" + index + ")");
        RedoAction.new(index+1);
        this.redoenter();
    }
    undoredoenter = (key: string = "undo") => {
        console.log("statemanager undo update", {thiss:this, undo:this.props.undo, redo: this.props.redo, props: this.props, state:this.state});
        let jsx = <>
            {
                [...(this.props as GObject)[key]].reverse().slice(0, this.props.maxlistsize).map((delta, index) => {
                    let out: {best: R}&R[] = [] as GObject as R[] & {best:R};
                    let retuseless = U.ObjectToAssignementStrings(delta, 10, 6, 20, "…", out);
                    return <li onClick={() => ((this as GObject)["do_"+key](index))} className="hoverable" key={index} style={{overflow: "visible", height: "24px"}}>
                        <div className={"preview"}>{out.best.str}</div>
                        <div className={"content"} style={{overflow: "visible", height:"100%"}}>{
                            out.map(row => <div style={{background: "#ddd", marginLeft: "-20px", height:"fit-content", pointerEvents:"none"}}>{row.fullpath.join(".") + " = " + row.fullvalue}</div>)
                        }</div>
                    </li>
            })}</>;
        let obj: GObject = {};
        obj[key] = {...(this.state as GObject)[key], hover: true, jsx};
        // {undo: {...this.state.undo, hover: true, jsx}}
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
        // this.setState({undo, redo});
    }
    render(): ReactNode {
        // {this.props.redo.length ? <div style={(this.state.redo.style)}>{this.state.undo.jsx}</div> : null}
        console.log("statemanager", {thiss:this, undo:this.props.undo, props: this.props, state:this.state});
        return <>
            <div style={ style }>
                <button onClick={(e)=> { save() }}>Save</button>
                <button onClick={(e)=> { load() }}>Load</button>
                <br />
                <button onClick={(e)=> { exportEcore(e, false, false) }}>Export JSON</button>
                <button onClick={(e)=> { importEcore(e, false, false) }}>Import JSON</button>
                <button onClick={(e)=> { exportEcore(e, true, true) }}>Export XML</button>
                <button onClick={(e)=> { importEcore(e, true, true) }}>Import XML</button>
                <br />
                <span className={"hoverable"} style={{position: "relative", background: "white"}} onMouseEnter={this.undoenter} onMouseLeave={this.undoleave}>
                    <button onClick={(e)=> { this.do_undo(1) }}>Undo ({this.props.undo.length})</button>
                    {this.props.undo.length ? <ul style={{background: "inherit", width: "max-content"}} className={"content"}>{this.state.undo.jsx}</ul> : null}
                </span>

                <span className={"hoverable"} style={{position: "relative", background: "white"}} onMouseEnter={this.redoenter} onMouseLeave={this.redoleave}>
                    <button onClick={(e)=> { this.do_redo(1) }}>Redo ({this.props.redo.length})</button>
                    {this.props.redo.length ? <ul style={{background: "inherit", width: "max-content"}} className={"content"}>{this.state.redo.jsx}</ul> : null}
                </span>
            </div>
            <span id={"export-tmp"} style={{position: "absolute", width: "25vw", bottom:0, overflow: "scroll", zIndex:10, right:0,
                background: "white", whiteSpace: "pre", maxHeight: "100%"}}></span>
        </>;
    }
}


let tmpsave: IStore;
function save(){ tmpsave = store.getState(); localStorage.setItem("tmpsave", JSON.stringify(tmpsave)); }
function load(fullstatestr?: string){
    if (!fullstatestr && tmpsave) return LoadAction.new(tmpsave);
    fullstatestr = fullstatestr || localStorage.getItem("tmpsave") || 'null'; // priorities: 1) argument from file 2) state variable cached 3) localstorage 4) null prevent crash
    tmpsave = JSON.parse(fullstatestr);
    return LoadAction.new(tmpsave); }

function exportEcore(e: React.MouseEvent, toXML: boolean = false, toFile: boolean = true): void {
    let lmodel: LModel = (LPointerTargetable.wrap(store.getState().models[0]) as LModel)
    let json = exportEcore0(lmodel);
    let str = JSON.stringify(json, null, 4);
    if (toXML) {
        str = prjson2xml.json2xml(json, '\t');
        str = U.formatXml(str);
    }

    if (!toFile) {
        (document.querySelector("#export-tmp") as any).innerText = str;
        localStorage.setItem("import", str);
        return;
    }
    U.download((lmodel.name || ((lmodel as any).isMetaModel ? 'M2' : 'M1') + '_unnamed')  + (toXML ? ".xml.ecore" : '.json.ecore'), str);
}

function exportEcore0(model: LModel): Json { let loopobj = {}; try { return model.generateEcoreJson(loopobj); } catch(e) { Log.exx("loop in model:", loopobj); } return {"eror": true, loopobj}; }
function importEcore(e: React.MouseEvent, fromXML: boolean = false, fromfile: boolean = true){
    const extension = ".ecore"; // Selectors.getActiveModel().isM1() ? '.' + Selectors.getActiveModel().metamodel.fullname() : '.ecore';
    let filestring: string, jsonstring: string;
    console.log("importEcore: prefromfile");
    if (!fromfile) {
        filestring = localStorage.getItem("import") || 'null';
        if (fromXML) {
            const xmlDoc = new DOMParser().parseFromString(filestring,"text/xml");
            filestring = prxml2json.xml2json(xmlDoc, '\t');
        }
        return importEcore0( filestring); }

    console.log("importEcore: pre file read");
    U.fileRead((e: Event, files?: FileList | null, fileContents?: string[]) => {
        Log.ex(!fileContents || !files || fileContents.length !== files.length, 'Failed to get file contents:', files, fileContents);
        Log.ex(fileContents && fileContents.length > 1, 'Should not be possible to input multiple files.');
        if (!fileContents) return;
        if (fileContents.length == 0) return;
        filestring = fileContents[0];
        console.log('importEcore filestring input: ', filestring);
        if (fromXML) {
            const xmlDoc = new DOMParser().parseFromString(filestring,"text/xml");
            console.log('importEcore xml:', xmlDoc);
            jsonstring = prxml2json.xml2json(xmlDoc, '\t');
            console.log('importEcore jsonstr input: ', jsonstring);
        }
        else jsonstring = filestring;
        importEcore0(jsonstring || 'null');
    }, [extension], true);
}

function importEcore0(str: string | null): void {
    console.warn("pre-parse", str);
    console.warn("parsed: ", EcoreParser.parse(str, false));
}

let tmp = {
    "ecore:EPackage": [{
        "@xmi:version": "2.0",
        "@xmlns:xmi": "http://www.omg.org/XMI",
        "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "@xmlns:ecore": "http://www.eclipse.org/emf/2002/Ecore",
        "@name": "package_1",
        "@nsURI": "org.jodel-react.username",
        "@nsPrefix": "",
        "eClassifiers": [{
            "@xsi:type": "ecore:EEnum",
            "@name": "enum_1",
            "serializable": "true",
            "eLiterals": [{"value": 1, "literal": "literal_1", "@name": "literal_1"}, {
                "value": 1,
                "literal": "literal_2",
                "@name": "literal_2"
            }]
        }]
    }]
};


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.undo = statehistory[DUser.current].undoable;
    ret.redo = statehistory[DUser.current].redoable;
    ret.maxlistsize = 10;
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }

export const SaveManagerConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(SaveManagerComponent);

export default SaveManagerConnected;
