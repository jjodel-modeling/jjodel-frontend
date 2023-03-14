import React, { FC } from 'react';
import {
    EcoreParser,
    Json,
    LModel,
    LoadAction,
    Log,
    LPointerTargetable, RedoAction,
    Selectors,
    statehistory,
    store,
    UndoAction
} from '../../joiner';
import './SaveManager.scss';

interface SaveManagerProps {}
const style = {
    position: "absolute",
    right: "5%",
    top: "5%",
    // border: "1px solid black",
    display: "inline-block",
    zIndex: 10
} as any;
const SaveManager: FC<SaveManagerProps> = () => (
  <>
      <div style={ style }>
          <button onClick={(e)=> { save() }}>Save</button>
          <button onClick={(e)=> { load() }}>Load</button>
          <br />
          <button onClick={(e)=> { undo() }}>Undo</button>
          <button onClick={(e)=> { redo() }}>Redo</button>
          <br />
          <button onClick={(e)=> { exportEcore() }}>Export</button>
          <button onClick={(e)=> { importEcore() }}>Import</button>
    </div>
    <span id={"export-tmp"} style={{position: "absolute", width: "25vw", bottom:0, overflowY: "scroll", zIndex:10, right:0, background: "white"}}></span>
    </>
);

let tmpsave: any = null;
function save(){ tmpsave = store.getState(); localStorage.setItem("tmpsave", JSON.stringify(tmpsave)); }
function load(){ if (!tmpsave) tmpsave = JSON.parse(localStorage.getItem("tmpsave") || 'null'); return LoadAction.new(tmpsave); }
function undo(){ UndoAction.new(); }
function redo(){ RedoAction.new(); }
function exportEcore(): void{ let json = exportEcore0(); let str = JSON.stringify(json); (document.querySelector("#export-tmp") as any).innerText = str; localStorage.setItem("import", str); }
function exportEcore0(): Json { let loopobj = {}; try { return (LPointerTargetable.wrap(store.getState().models[0]) as LModel).generateEcoreJson(loopobj); } catch(e) { Log.exx("loop in model:", loopobj); } return {"eror": true, loopobj}; }
function importEcore(){ let str = localStorage.getItem("import") || 'null'; importEcore0(str); }
function importEcore0(str: string | null): void {
    console.warn("pre-parse", str);
    console.warn("parsed: ", EcoreParser.parse(str, false));
}
export default SaveManager;

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
