import {RuntimeAccessible} from "../joiner";

@RuntimeAccessible
export default class DV {

    public static nodeidprintable(nodeid: string ) {
        let arr = nodeid.replace("^", "_").split("_");
        return arr[1] + "_" + arr[3] + "_" + arr[4];
    }

    public static modelView(): string {
        return `<div className={"w-100 h-100"}>
            <div className={"default-model"}>
                <div className={"children"}>
                    {this.data.childrens.map((pkg, i) => {
                        return <DefaultNode key={i} data={pkg.id} />})
                    }
                </div>
            </div>
        </div>`;
    }
    public static packageView(): string {
        return (`<div className={"w-100 h-100"}>
            <div className={"default-pkg"}>
                {/*<button onClick={() => {this.node.__raw.minimized = !this.node.__raw.minimized} } >test</button>*/}
                {/* <button onClick={() => {alert(this.nodeid)}}>getNodeId</button> */}
                <div className={"children"}>
                    {this.data.childrens.map((classifier, i) => {
                            return <DefaultNode key={i} data={classifier.id} />
                        })
                    }
                </div>
            </div>
        </div>`);
    }

    /*
        {this.data.dummysubelements.filter((subElement) => 0
            subElement.model.className === "DReference").map((lNodeReference) => {
            return <Edges source={lNodeReference} />
        }
        )}
    */

    public static classView(): string {
        return (`<div className={"w-100 h-100"} style={{position: 'absolute'}}>
            {this.data.subNodes.filter((node) => node.model && node.model.className === "DReference").map((refNode) => {
                return <Edges source={refNode} />})}       
                
            {this.data.nodes.map((node) => {return <Edges source={node} />})}
             <div className={"default-class"}>
                <div className={"class-header"}>
                    <div className={"class-header-label"}> <b>Concept:</b>
                        <Input className={"mx-1 transparent-input"} field={"name"} obj={this.data.id} 
                            pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\\d_\u0024]*"} />
                    </div>
                </div>
                <div className={"children"}>
                    {(this.data.attributes.length > 0) && <div className={"children-attributes"}>
                        {this.data.attributes.map((attribute, i) => {
                            return <DefaultNode key={i} data={attribute} />
                         })}   
                    </div>}
                    {(this.data.references.length > 0) && <div className={"children-references"}>                    
                        {this.data.references.map((reference, i) => {
                            return <DefaultNode key={i} data={reference} />
                        })}
                    </div>}                    
                    {(this.data.operations.length > 0) && <div className={"children-operations"}>                    
                        {this.data.operations.map((operation, i) => {
                            return <DefaultNode key={i} data={operation} />
                        })}
                    </div>}
                </div>
            </div>
        </div>`);
    }

    public static enumeratorView(): string {
        return (`<div className={"w-100 h-100"}>
            <div className={"default-enum"}>
                <div className={"enum-header"}>
                    <div className={"enum-header-label"}>
                        <b>Enum:</b>
                        <Input className={"mx-1 transparent-input"} field={"name"} obj={this.data.id} 
                            pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\\d_\u0024]*"} />
                    </div>
                </div>
                <div className={"children"}>
                {(this.data.literals.length > 0) && <div className={"children-literals"}>
                        {this.data.literals.map((literal, i) => {
                            return <DefaultNode key={i} data={literal} />
                        })}                        
                    </div>}
                </div>
            </div>
        </div>`);
    }
    public static attributeView(): string {
        return `<div className={"h-100 w-100"}>
            <div className={"default-attrib"}>
                <div className={"default-attrib-name ms-1"}>
                    <Input className={"transparent-input"} field={"name"} obj={this.data.id} 
                        pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"} />
                </div>
                <div className={"default-attrib-type"}>
                    <Select className={"transparent-select"} style={{textAlign: "right"}} obj={this.data} field={"type"} />
                </div>
            </div>
        </div>`;
    }
    public static literalView(): string {
        return `<div className={"h-100 w-100"}>
            <div className={"default-literal"}>
                <div className={"default-literal-name ms-1"}>
                    <Input className={"transparent-input"} field={"name"} obj={this.data.id} 
                    pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"} />
                </div>
                <div className={"default-literal-type me-1"}>literal</div>
            </div>
        </div>`;
    }
    public static referenceView(): string {
        return `<div className={"h-100 w-100"}>
            <div className={"default-ref"}>
                <div className={"default-ref-name ms-1"}>
                    <Input className={"transparent-input"} field={"name"} obj={this.data.id} 
                    pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"} />
                </div>
                <div className={"default-ref-type"}>
                    <Select className={"transparent-select"} style={{textAlign: "right"}} obj={this.data} field={"type"} />
                </div>
            </div>
        </div>`;
    }

    public static operationView(): string {
        return `<div className={"h-100 w-100"}>
            <div className={"default-operation"}>
                <div className={"default-operation-sign ms-1"}>
                    <div>{this.data.name}</div>
                    <div>(&nbsp;</div><div className={"default-operation-parameters"}>
                        {this.data.childrens.filter((child) => child.className === "DParameter").map((child, index) => {
                            if(index > 0) {
                                if(index === (this.data.parameters.length - 1)) {
                                    return <div>{child.name}</div>;
                                }
                                else {
                                    return <div>{child.name},&nbsp;</div>;
                                }
                            }      })}
                    </div><div>&nbsp;)</div>
                </div>
                <div className={"default-operation-type"}>
                    <Select className={"transparent-select"} style={{textAlign: "right"}} obj={this.data.parameters[0]} field={"type"} />
                </div>
            </div>
        </div>`;
    }

    public static testView() {
        return `<div className={"object mx-1 border"}>
            <div className={"title"}>{this.data.name}</div>
            <div className={"features"}>
                {this.data.features.map((feature) => {
                    return <div className={"feature"}>
                        {feature.instanceof[0].name}: {feature.value}
                    </div>
                })}
            </div>
        </div>`
    }

}


// node -> DGraphElement
