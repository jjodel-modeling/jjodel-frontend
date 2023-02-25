import {RuntimeAccessible} from '../joiner';
const beautify = require('js-beautify').html;

@RuntimeAccessible
export default class DV {
    public static modelView(): string { return beautify(`<div className={'w-100 h-100'}>` + DefaultView.modelView() +'</div>'); }
    public static packageView(): string { return beautify(`<div className={'w-100 h-100'}>` +DefaultView.packageView() + '</div>'); }
    public static classView(): string { return beautify(`<div className={'w-100 h-100'}>` + DefaultView.classView()) + '</div>'; }
    public static attributeView(): string { return beautify(`<div className={'w-100 h-100'}>` + DefaultView.attributeView() + '</div>'); }
    public static referenceView(): string { return beautify(`<div className={'w-100 h-100'}>` + DefaultView.referenceView() + '</div>'); }
    public static enumeratorView(): string { return beautify(`<div className={'w-100 h-100'}>` + DefaultView.enumeratorView() + '</div>'); }
    public static literalView(): string { return beautify(`<div className={'w-100 h-100'}>` + DefaultView.literalView() + '</div>'); }
    public static operationView(): string { return beautify(`<div className={'w-100 h-100'}>` + DefaultView.operationView() + '</div>'); }
    public static objectView(): string { return beautify(`<div className={'w-100 h-100'}>` + DefaultView.objectView() + '</div>'); }
    public static valueView(): string { return beautify(`<div className={'w-100 h-100'}>` + DefaultView.valueView() + '</div>'); }
}

class DefaultView {

    public static modelView(): string {
        return `<div className={'w-100 h-100 position-absolute model-background'}>
            {this.data.childrens.map((child, index) => {
                return <DefaultNode key={index} data={child.id}></DefaultNode>
            })}
        </div>`;
    }

    public static packageView(): string {
        return `<div className={'h-100 round border-package bg-white'}>
            <label className={'w-100'}>
                <Input jsxLabel={<b className={'name-package'}>EPackage:</b>} 
                       obj={this.data.id} field={'name'} hidden={true} />
            </label>
            <hr />
            {this.data.childrens.map((child, index) => {
                return <DefaultNode key={index} data={child.id}></DefaultNode>
            })}
        </div>`;
    }

    public static classView(): string {
        return `<div className={'h-100 round border-class bg-white'}>
            <label className={'w-100'}>
                <Input jsxLabel={<b className={'name-class'}>EClass:</b>} 
                       obj={this.data.id} field={'name'} hidden={true} />
            </label>
            <hr />
            {this.data.childrens.map((child, index) => {
                return <DefaultNode key={index} data={child.id}></DefaultNode>
            })}
            {(this.data.childrens.length) > 0 && <hr />}
        </div>`;
    }
    public static enumeratorView(): string {
        return `<div className={'h-100 round border-enum bg-white'}>
            <label className={'ms-1'}>
                <b className={'name-enum me-1'}>EEnum:</b>{this.data.name}
            </label>
            <hr />
            {this.data.childrens.map((child, index) => {
                return <DefaultNode key={index} data={child.id}></DefaultNode>
            })}
            {(this.data.childrens.length) > 0 && <hr />}
        </div>`;
    }
    public static attributeView(): string {
        return `<div className={'h-100 d-flex bg-smoke'}>
            <label className={'ms-1'}>{this.data.name}</label>
            <label className={'ms-auto me-1'}>{this.data.type.name}</label>
        </div>`;
    }
    public static literalView(): string {
        return `<div className={'h-100 d-flex bg-smoke'}>
            <label className={'mx-auto'}>{this.data.name}</label>
        </div>`;
    }
    public static referenceView(): string {
        return `<div className={'h-100 d-flex bg-smoke'}>
            <label className={'ms-1'}>{this.data.name}</label>
            <label className={'ms-auto me-1'}>{this.data.type.name}</label>
        </div>`;
    }
    public static operationView(): string {
        return `<div className={'h-100 d-flex bg-smoke'}>
            <label className={'ms-1'}>{this.data.name}( )</label>
        </div>`;
    }
    public static objectView() {
        return `<div className={'h-100 round border-object bg-white'}>
            <label className={'ms-1'}>
                <b className={'name-object me-1'}>EObject:</b>{this.data.feature('name')}
            </label>
            <hr />
            {this.data.features.map((child, index) => {
                return <DefaultNode key={index} data={child.id}></DefaultNode>
            })}
            {(this.data.features.length) > 0 && <hr />}
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
