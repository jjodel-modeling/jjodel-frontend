import {RuntimeAccessible} from '../joiner';
const beautify = require('js-beautify').html;

@RuntimeAccessible
export default class DV {
    public static modelView(): string { return beautify(`<div className={'root'}>` + DefaultView.modelView() +'</div>'); }
    public static packageView(): string { return beautify(`<div className={'root'}>` +DefaultView.packageView() + '</div>'); }
    public static classView(): string { return beautify(`<div className={'root'}>` + DefaultView.classView()) + '</div>'; }
    public static attributeView(): string { return beautify(`<div className={'root'}>` + DefaultView.attributeView() + '</div>'); }
    public static referenceView(): string { return beautify(`<div className={'root'}>` + DefaultView.referenceView() + '</div>'); }
    public static enumeratorView(): string { return beautify(`<div className={'root'}>` + DefaultView.enumeratorView() + '</div>'); }
    public static literalView(): string { return beautify(`<div className={'root'}>` + DefaultView.literalView() + '</div>'); }
    public static operationView(): string { return beautify(`<div className={'root'}>` + DefaultView.operationView() + '</div>'); }
    public static objectView(): string { return beautify(`<div className={'root'}>` + DefaultView.objectView() + '</div>'); }
    public static valueView(): string { return beautify(`<div className={'root'}>` + DefaultView.valueView() + '</div>'); }
}

class DefaultView {

    public static modelView(): string {
        return `<div className={'default-model'}>
            <div className={'children'}>
                {this.data.childrens.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }

    public static packageView(): string {
        return `<div className={'default-package round bg-white'}>
            <Input jsxLabel={<b className={'name-package'}>EPackage:</b>} 
                   obj={this.data.id} field={'name'} hidden={true} />
            <hr />
            <div className={'children'}>
                {this.data.childrens.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }

    public static classView(): string {
        return `<div className={'default-class round bg-white'}>
            <Input jsxLabel={<b className={'name-class'}>EClass:</b>} 
                   obj={this.data.id} field={'name'} hidden={true} />
            <hr />
            <div className={'children'}>
                {this.data.childrens.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }
    public static enumeratorView(): string {
        return `<div className={'default-enum round bg-white'}>
            <Input jsxLabel={<b className={'name-enum'}>EClass:</b>} 
                   obj={this.data.id} field={'name'} hidden={true} />
            <hr />
            <div className={'children'}>
                {this.data.childrens.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }
    public static attributeView(): string {
        return `<Select obj={this.data} field={'type'} label={this.data.name} />`;
    }
    public static literalView(): string {
        return `<label className={'d-block text-center'}>{this.data.name}</label>`;
    }
    public static referenceView(): string {
        return `<Select obj={this.data} field={'type'} label={this.data.name} />`;
    }
    public static operationView(): string {
        return `<Select obj={this.data.parameters[0]} field={'type'} label={this.data.name} />`;
    }
    public static objectView() {
        return `<div className={'default-object round bg-white'}>
            <label className={'ms-1'}>
                <b className={'name-object me-1'}>EObject:</b>{this.data.feature('name')}
            </label>
            <hr />
            <div className={'children'}>
                {this.data.childrens.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }
    public static valueView() {
        return `<div className={'h-100 d-flex bg-smoke'}>
            <label className={'ms-1'}>{this.data.instanceof[0].name}</label>
            <label className={'ms-auto me-1'}>
                {this.data.value.map((value, i) => {
                    return <label>
                        {(i + 1) === this.data.value.length && <div className={'ms-1'}>{value}</div> }
                        {(i + 1) !== this.data.value.length && <div className={'ms-1'}>{value},</div> }
                    </label>
                })}
            </label>
        </div>`;
    }

}


// node -> DGraphElement
