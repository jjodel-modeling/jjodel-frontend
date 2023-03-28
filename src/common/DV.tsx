import {RuntimeAccessible} from '../joiner';
const beautify = require('js-beautify').html;

@RuntimeAccessible
export default class DV {
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
        return `<Select className={'feature-view'} obj={this.data} field={'type'} label={this.data.name} />`;
    }
    public static literal(): string {
        return `<label className={'d-block text-center literal-view'}>{this.data.name}</label>`
    }
    public static operation(): string {
        return `<Select className={'operation-view'} obj={this.data.parameters[0]} field={'type'} label={this.data.name} />`;
    }
    public static object(): string {
        return `<div className={'round bg-white object-view'}>
            <label className={'ms-1'}>
                <b className={'object-name me-1'}>{this.data.instanceof.name}:</b>{this.data.feature('name')}
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
        return `<div className={'d-flex value-view'} style={{paddingRight: "6px"}}>
            <label className={'d-block ms-1'}>{this.props.data.instanceof.name}</label>
            <label className={'d-block ms-auto'}>{this.props.data.valuestring()}</label>
        </div>`
    }
    public static defaultPackage() {
        return `{this.data.childrens.map((child, index) => {
            return <DefaultNode key={index} data={child.id}></DefaultNode>
        })}`;
    }



}

