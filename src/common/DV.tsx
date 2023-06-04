import type {ShortAttribETypes as SAType} from '../joiner';
import {GObject, RuntimeAccessible} from '../joiner';
import React, {ReactElement} from "react";
const beautify = require('js-beautify').html;

let ShortAttribETypes: typeof SAType = (window as any).ShortAttribETypes;

@RuntimeAccessible
export class DV {
    public static modelView(): string { return beautify(DefaultView.model()); } // damiano: che fa beautify? magari potremmo settarlo in LView.set_jsx invece che solo qui, così viene formattato anche l'input utente?
    public static packageView(): string { return beautify(DefaultView.package()); }
    public static classView(): string { return beautify(DefaultView.class()); }
    public static attributeView(): string { return beautify(DefaultView.feature()); }
    public static referenceView(): string { return beautify(DefaultView.feature()); }
    public static enumeratorView(): string { return beautify(DefaultView.enum()); }
    public static literalView(): string { return beautify(DefaultView.literal()); }
    public static operationView(): string { return beautify(DefaultView.operation()); }
    public static operationViewm1(): string { return beautify(DefaultView.operationm1()); }
    public static objectView(): string { return beautify(DefaultView.object()); }
    public static valueView(): string { return beautify(DefaultView.value()); }
    public static defaultPackage(): string { return beautify(DefaultView.defaultPackage()); }
    public static errorView(publicmsg: string | JSX.Element, debughiddenmsg?:any): ReactElement { console.error("error in view:", {publicmsg, debuginfo:debughiddenmsg}); return DefaultView.error(publicmsg); }
}

let valuecolormap: GObject = {};
valuecolormap[ShortAttribETypes.EBoolean] = "orange";
valuecolormap[ShortAttribETypes.EByte] = "orange";
valuecolormap[ShortAttribETypes.EShort] = "orange";
valuecolormap[ShortAttribETypes.EInt] = "orange";
valuecolormap[ShortAttribETypes.ELong] = "orange";
valuecolormap[ShortAttribETypes.EFloat] = "orange";
valuecolormap[ShortAttribETypes.EDouble] = "orange";
valuecolormap[ShortAttribETypes.EDate] = "green";
valuecolormap[ShortAttribETypes.EString] = "green";
valuecolormap[ShortAttribETypes.EChar] = "green";
valuecolormap[ShortAttribETypes.void] = "gray";

let valuecolormap_str = JSON.stringify(valuecolormap);


class DefaultView {

    public static model(): string {
        return `<div className={'root model'}>
             {this.data.packages.map((child, index) => {
                return <DefaultNode key={index} data={child.id}></DefaultNode>
            })}
            {this.data.allSubObjects.map((child, index) => {
                return <DefaultNode key={index} data={child.id}></DefaultNode>
            })}
        </div>`;
    }

    public static package(): string {
        return `<div className={'round bg-white root package'}>
            <Input jsxLabel={<b className={'package-name'}>EPackage:</b>} field={'name'} hidden={true} />
            <hr />
            <div className={'package-children'}>
                {this.data.children.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }

    public static class(): string {
        return `<div className={'round bg-white root class'}>
            <Input jsxLabel={<b className={'class-name'}>EClass:</b>} 
                   data={this.data.id} field={'name'} hidden={true} autosize={true} />
            <hr/>
            <div className={'class-children'}>
                {this.data.children.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }

    public static enum(): string {
        return `<div className={'round bg-white root enumerator'}>
            <Input jsxLabel={<b className={'enumerator-name'}>EEnum:</b>} 
                   data={this.data.id} field={'name'} hidden={true} autosize={true} />
            <hr />
            <div className={'enumerator-children'}>
                {this.data.children.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }

    public static feature(): string {
        return `<Select className={'root feature'} data={this.data} field={'type'} label={this.data.name} />`;
    }

    public static literal(): string {
        return `<label className={'d-block text-center root literal'}>{this.data.name}</label>`
    }

    public static operation(): string {
        return `<Select className={'root operation'} data={this.data} field={'type'} label={this.data.name+this.data.signature} />`;
    }



    public static operationm1(): string {
        return `<div className={'d-flex root operationm1'} style={{paddingRight: "6px"}}>
             {<label className={'d-block ms-1'}>{this.props.data.instanceof.name}</label>}
            <label className={'d-block ms-auto hover-root'} style={{color:` + valuecolormap_str + `[this.props.data.values.type] || "gray"
            }}>→→→{
                <div className="hover-content">{
                    <ParameterForm operation = {this.props.data.id} vertical={true} />
                }
                }</label>
        </div>`
    }

    public static object(): string {
        return `<div className={'round bg-white root class'}>
            <label className={'ms-1'}>
                <Input jsxLabel={<b className={'class-name'}>{this.data.instanceof ? this.data.instanceof.name : "Object"}:</b>} 
                   data={this.data.id} field={'name'} hidden={true} autosize={true}/>
            </label>
            <hr />
            <div className={'object-children'}>
                {this.data.features.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }

    public static value() {
        return `<div className={'d-flex root value'} style={{paddingRight: "6px"}}>
             {this.props.data.instanceof && <label className={'d-block ms-1'}>{this.props.data.instanceof.name}</label>}
             {!this.props.data.instanceof && <Input asLabel={true} data={this.data.id} field={'name'} hidden={true} autosize={true} />}
            <label className={'d-block ms-auto'} style={{color:` + valuecolormap_str + `[this.props.data.values.type] || "gray"
            }}>: {this.props.data.valuestring()}</label>
        </div>`
    }

    public static defaultPackage() {
        return `<div style={{backgroundColor: 'transparent', position: 'fixed', width: '-webkit-fill-available', height: '-webkit-fill-available'}}>
            {this.data.children.map((child, index) => {
            return <DefaultNode key={index} data={child.id}></DefaultNode>
            })}
        </div>`;
    }

    public static error(msg: undefined | string | JSX.Element) {
        return <div className={'w-100 h-100'}>
            <div className={"h-100 round bg-white border border-danger"}>
                <div className={'text-center text-danger'}>
                    <b>SYNTAX ERROR</b>
                    <hr/>
                    <label className={'text-center mx-1'}>
                        The JSX you provide is NOT valid!
                    </label>
                    {msg && <label className={'text-center mx-1'}>{msg}</label>}
                </div>
            </div>
        </div>;
    }

}
