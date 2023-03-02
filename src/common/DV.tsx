import {RuntimeAccessible} from '../joiner';
const beautify = require('js-beautify').html;

@RuntimeAccessible
export default class DV {
    public static modelView(): string { return beautify(`<div className={'root'}>` + DefaultView.model() +'</div>'); }
    public static packageView(): string { return beautify(`<div className={'root'}>` + DefaultView.package() + '</div>'); }
    public static classView(): string { return beautify(`<div className={'root'}>` + DefaultView.class()) + '</div>'; }
    public static attributeView(): string { return beautify(`<div className={'root'}>` + DefaultView.feature() + '</div>'); }
    public static referenceView(): string { return beautify(`<div className={'root'}>` + DefaultView.feature() + '</div>'); }
    public static enumeratorView(): string { return beautify(`<div className={'root'}>` + DefaultView.enum() + '</div>'); }
    public static literalView(): string { return beautify(`<div className={'root'}>` + DefaultView.literal() + '</div>'); }
    public static operationView(): string { return beautify(`<div className={'root'}>` + DefaultView.operation() + '</div>'); }
    public static objectView(): string { return beautify(`<div className={'root'}>` + DefaultView.object() + '</div>'); }
    public static valueView(): string { return beautify(`<div className={'root'}>` + DefaultView.value() + '</div>'); }
    public static defaultPackage(): string { return beautify(`<div className={'root'}>` + DefaultView.defaultPackage() + '</div>'); }
}

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
                   obj={this.data.id} field={'name'} hidden={true} />
            <hr />
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
                   obj={this.data.id} field={'name'} hidden={true} />
            <hr />
            <div className={'enumerator-children'}>
                {this.data.childrens.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }
    public static feature(): string {
        return `<Select obj={this.data} field={'type'} label={this.data.name} />`;
    }
    public static literal(): string {
        return `<label className={'d-block text-center'}>{this.data.name}</label>`
    }
    public static operation(): string {
        return `<Select obj={this.data.parameters[0]} field={'type'} label={this.data.name} />`;
    }
    public static object(): string {
        return `<div className={'round bg-white object-view'}>
            <label className={'ms-1'}>
                <b className={'object-name me-1'}>{this.data.instanceof.name}:</b>{this.data.feature('name')}
            </label>
            <hr />
            <div className={'object-children'}>
                {this.data.childrens.map((child, index) => {
                    return <DefaultNode key={index} data={child.id}></DefaultNode>
                })}
            </div>
        </div>`;
    }
    public static value() {
        return `<div className={'d-flex'}>
            <label className={'d-block ms-1'}>{this.data.name}</label>
            <label className={'d-block ms-auto'}>{this.data.stringValue}</label>
        </div>`
    }
    public static defaultPackage() {
        return `{this.data.childrens.map((child, index) => {
            return <DefaultNode key={index} data={child.id}></DefaultNode>
        })}`;
    }



}

