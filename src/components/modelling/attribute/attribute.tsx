import React, {Component} from "react";
import './attribute.css';
import logo from "../../logo.svg";
import {RuntimeAccessible} from "../../../joiner";


@RuntimeAccessible
export class Attribute extends Component<any, any> {
    public static cname: string = "Attribute";
    render() {
        window[('' + 'attrib') as any] = this as any;
        const dynamic = "@@@@@";
        const daa = "<h1>\n" +
            "<span>static</span><span>{dynamic}</span>\n" +
            "<img src={logo} className=\"App-logo\" alt=\"logo\"/> </h1>\n";
        return (
        <div className="attribute">
            <h3>attribute</h3>
            <span>attrib proptest1! {this.props.prop1}</span>
            <span>attrib proptest2! {this.props.prop2}</span>
            <div>daa html as var:{daa}</div>
            <div dangerouslySetInnerHTML={{__html: daa}} />
            <div>children {this.props.children}</div>
        </div>
    );
    }
    /*
    r2() {
            const dynamic = "@@@@@";
            const daa = "<h1>\n" + "<span>static</span><span>{dynamic}</span>\n" + "<img src={logo} className=\"App-logo\" alt=\"logo\"/> </h1>\n";
            return /*#__PURE__* /Object(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_3__["jsxDEV"])("div", {
                className: "modelpiece",
                children: [/*#__PURE__ * /Object(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_3__["jsxDEV"])("h3", {
                    children: "modelpiece"
                }, void 0, false, {
                    fileName: _jsxFileName,
                    lineNumber: 16,
                    columnNumber: 13
                }, this), /*#__PURE__* /Object(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_3__["jsxDEV"])("div", {
                    children: daa
                }, void 0, false, {
                    fileName: _jsxFileName,
                    lineNumber: 17,
                    columnNumber: 13
                }, this), /*#__PURE__* /Object(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_3__["jsxDEV"])("div", {
                    dangerouslySetInnerHTML: {
                        __html: daa
                    }
                }, void 0, false, {
                    fileName: _jsxFileName,
                    lineNumber: 18,
                    columnNumber: 13
                }, this), /*#__PURE__* /Object(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_3__["jsxDEV"])(_attribute_attribute__WEBPACK_IMPORTED_MODULE_2__["default"], {
                    props1: "prop1",
                    props2: "prop2",
                    children: /*#__PURE__* /Object(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_3__["jsxDEV"])("span", {
                        children: "contentPassedtoChild"
                    }, void 0, false, {
                        fileName: _jsxFileName,
                        lineNumber: 19,
                        columnNumber: 56
                    }, this)
                }, void 0, false, {
                    fileName: _jsxFileName,
                    lineNumber: 19,
                    columnNumber: 13
                }, this)]
            }, void 0, true, {
                fileName: _jsxFileName,
                lineNumber: 15,
                columnNumber: 9
            }, this);
    }
    */
}


export default Attribute;
