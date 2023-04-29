import type {ShortAttribETypes as SAType} from '../joiner';
import {GObject, RuntimeAccessible} from '../joiner';
import React, {ReactElement} from "react";
const beautify = require('js-beautify').html;

let ShortAttribETypes: typeof SAType = (window as any).ShortAttribETypes;

@RuntimeAccessible
export class DV {
    public static modelView(): string { return beautify(`<div className={'root model'}>` + DefaultView.model() +'</div>'); }
    public static packageView(): string { return beautify(`<div className={'root package'}>` + DefaultView.package() + '</div>'); }
    public static classView(): string { return beautify(`<div className={'root class'}>` + DefaultView.class()) + '</div>'; }
    public static attributeView(): string { return beautify(`<div className={'root attribute'}>` + DefaultView.feature() + '</div>'); }
    public static referenceView(): string { return beautify(`<div className={'root reference'}>` + DefaultView.feature() + '</div>'); }
    public static enumeratorView(): string { return beautify(`<div className={'root enumerator'}>` + DefaultView.enum() + '</div>'); }
    public static literalView(): string { return beautify(`<div className={'root literal'}>` + DefaultView.literal() + '</div>'); }
    public static operationView(): string { return beautify(`<div className={'root operation'}>` + DefaultView.operation() + '</div>'); }
    public static objectView(): string { return beautify(`<div className={'root object'}>` + DefaultView.object() + '</div>'); }
    public static valueView(): string { return (`<div className={'root value'}>` + DefaultView.value() + '</div>'); }
    public static defaultPackage(): string { return beautify(`<div className={'root package'}>` + DefaultView.defaultPackage() + '</div>'); }
    public static errorView(msg?:string | JSX.Element): ReactElement { return DefaultView.error(); }
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
        return `<div className={'model-view'}>
            {this.data.childrens.map((child, index) => {
                return <DefaultNode key={index} data={child.id}></DefaultNode>
            })}
        </div>`;
    }

    public static package(): string {
        return `<div className={'round bg-white package-view'}>
            <Input jsxLabel={<b className={'package-name'}>EPackage:</b>} 
                   obj={this.data.id} field={'name'} hidden={true} />
            <hr />
            <div className={'package-children'}>
                {this.data.childrens.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }

    public static class(): string {
        return `<div className={'round bg-white class-view'}>
            <Input jsxLabel={<b className={'class-name'}>EClass:</b>} 
                   obj={this.data.id} field={'name'} hidden={true} autosize={true} />
            <hr/>
            <div className={'class-children'}>
                {this.data.childrens.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }

    public static enum(): string {
        return `<div className={'round bg-white enumerator-view'}>
            <Input jsxLabel={<b className={'enumerator-name'}>EEnum:</b>} 
                   obj={this.data.id} field={'name'} hidden={true} autosize={true} />
            <hr />
            <div className={'enumerator-children'}>
                {this.data.childrens.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }

    public static feature(): string {
        return `<Select className={'feature-view'} obj={this.data} field={'type'} label={this.data.name} />`;
    }

    public static literal(): string {
        return `<label className={'d-block text-center literal-view'}>{this.data.name}</label>`
    }

    public static operation(): string {
        return `<Select className={'operation-view'} obj={this.data.parameters[0]} field={'type'} label={this.data.name} />`;
    }

    public static object(): string {
        return `<div className={'round bg-white class-view'}>
            <label className={'ms-1'}>
                <Input jsxLabel={<b className={'class-name'}>{this.data.instanceof ? this.data.instanceof.name : "Object"}:</b>} 
                   obj={this.data.id} field={'name'} hidden={true} autosize={true}/>
            </label>
            <hr />
            <div className={'object-children'}>
                {this.data.features.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
            {/*
                !this.data.partial ? null : <div className={"add features"}><button className="w-100 p-0 d-block" onClick={()=>{this.data.addValue()}}>+feature</button></div> 
            */}
        </div>`;
    }

    public static value() {
        // todo: testa quado c' solo un valore booleano
        return `<div className={'d-flex value-view'} style={{paddingRight: "6px"}}>
             {this.props.data.instanceof && <label className={'d-block ms-1'}>{this.props.data.instanceof.name}</label>}
             {!this.props.data.instanceof && <Input obj={this.data.id} field={'name'} hidden={true} autosize={true} />}
            <label className={'d-block ms-auto'} style={{color:` + valuecolormap_str + `[this.props.data.value.type] || "gray"
            }}>: {this.props.data.valuestring()}</label>
        </div>`
    }

    public static defaultPackage() {
        return `{this.data.childrens.map((child, index) => {
            return <DefaultNode key={index} data={child.id}></DefaultNode>
        })}`;
    }

    public static error(msg?:string | JSX.Element) {
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
