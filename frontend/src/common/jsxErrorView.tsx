import React from "react";
import type {DGraphElement, DModelElement, DViewElement, GObject} from "../joiner";
import {DV, Log} from "../joiner";

// Master copy of the jsxString compile-error view; GraphElementComponent.displayError delegates here.
export function displayError(e: Error, where: string, view: DViewElement, data?: DModelElement, node?: DGraphElement, asString:boolean = false, printData?: GObject): React.ReactNode {
    // const view: LViewElement = this.props.view; //data._transient.currentView;
    let errormsg = (where === "preRenderFunc" ? "Pre-Render " : "") +(e.message||"\n").split("\n")[0];
    if (e.message.indexOf("Unexpected token .") >= 0 || view.jsxString.indexOf('?.') >= 0 || view.jsxString.indexOf('??') >= 0) {
        errormsg += '\n\nReminder: nullish operators ".?" and "??" are not supported.'; }
    else if (view.jsxString.indexOf('?.') >= 0) { errormsg += '\n\nReminder: ?. operator and empty tags <></> are not supported.'; }
    else if (e.message.indexOf("Unexpected token '<'") !== -1) { errormsg += '\n\nDid you forgot to close a html </tag>?'; }
    try {
        let ee = e.stack || "";
        let stackerrorlast = ee.split("\n")[1];

        let icol = stackerrorlast.lastIndexOf(":");
        let jsxString = view.jsxString;
        // let col = stackerrorlast.substring(icol+1);
        let irow = stackerrorlast.lastIndexOf(":", icol-1);
        const offset = {row:-2, col:1};
        let stackerrorlinenum: GObject = {
            row: Number.parseInt(stackerrorlast.substring(irow+1, icol)) + offset.row,
            col: Number.parseInt(stackerrorlast.substring(icol+1)) + offset.col };
        let linesPre = 1;
        let linesPost = 1;
        let jsxlines = jsxString.split("\n");
        let culpritlinesPre: string[] = jsxlines.slice(stackerrorlinenum.row-linesPre-1, stackerrorlinenum.row - 1);
        let culpritline: string = jsxlines[stackerrorlinenum.row - 1]; // stack start counting lines from 1
        let culpritlinesPost: string[] = jsxlines.slice(stackerrorlinenum.row, stackerrorlinenum.row + linesPost);
        console.debug("[JSX Parse Error]", {e, node, jsxlines, culpritlinesPre, culpritline, culpritlinesPost, stackerrorlinenum, icol, irow, stackerrorlast});

        if (stackerrorlinenum.col - offset.col > culpritline?.length && stackerrorlinenum.row === 1) stackerrorlinenum.col = 0;
        let caretCursor = "▓" // ⵊ ꕯ 𝙸 Ꮖ
        if (culpritline && stackerrorlinenum.col - offset.col <= culpritline?.length && stackerrorlast.indexOf("main.chunk.js") === -1) {
            let rowPre = culpritline.substring(0, stackerrorlinenum.col);
            let rowPost = culpritline.substring(stackerrorlinenum.col);
            let jsxcode =
                <div style={{fontFamily: "monospaced sans-serif", color:"#444"}}>
                    { culpritlinesPre.map(l => <div>{l}</div>) }
                    <div>{rowPre} <b style={{color:"red"}}> {caretCursor} </b> {rowPost}</div>
                    { culpritlinesPost.map(l => <div>{l}</div>) }
                </div>;
            errormsg += " @ line " + stackerrorlinenum.row + ", col:" + stackerrorlinenum.col;
            if (asString) return DV.errorView_string('<div>'+errormsg+'\n'+jsxcode+'</div>', {where:"in "+where+"()", e, template:view.jsxString, view: view}, where, data, node, view);
            return DV.errorView(<div>{errormsg}{jsxcode}</div>, {where:"in "+where+"()", e, template:view.jsxString, view: view}, where, data, node, view);
        } else {
            // it means it is likely accessing a minified.js src code, sending generic error without source mapping
        }
    } catch(e2) {
        Log.eDevv("internal error in error view", {e, e2, where} );
        return null;
    }
    if (asString) return DV.errorView_string('<div>'+errormsg+'</div>', {where:"in "+where+"()", e, template: view.jsxString, view: view}, where, data, node, view);
    return DV.errorView(<div>{errormsg}</div>, {where:"in "+where+"()", e, template: view.jsxString, view: view, ...(printData || {})}, where, data, node, view);
}
