export default class DV {
    public static _modelView(): string {
        return `<div className={"w-100 h-100"}>
            <div className={"model-root"}>
                <div className={"p-1"}>
                    <button type={"button"} className={"btn btn-dark btn-sm"} onClick={() => {
                        this.data.addChild("package");
                    }}>
                        <i className={"bi bi-plus"}></i> package
                    </button>     
                </div>
                <div className={"childrens"}>
                    {this.data.childrens.map((pkg, i) => { 
                        return <DefaultNode key={i} data={pkg.id} />})
                    }
                </div>
            </div>
        </div>`;
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
    public static _packageView(): string {
        return `<div>
            <div className={"pkg-root"}>
                <div className={"p-1"}>
                    <button type={"button"} className={"btn btn-dark btn-sm"} onClick={() => {
                        this.data.addChild("class");
                    }}>
                        <i className={"bi bi-plus"}></i> concept
                    </button>            
                    <button type={"button"} className={"ms-1 btn btn-dark btn-sm"} onClick={() => {
                        this.data.addChild("enumerator");
                    }}>
                        <i className={"bi bi-plus"}></i> enum
                    </button>                         
                    <button type={"button"} className={"ms-1 btn btn-dark btn-sm"} onClick={() => {
                        this.data.addChild("package");
                    }}>
                        <i className={"bi bi-plus"}></i> subpackage
                    </button>           
               </div>
                <div className={"childrens"}>
                    {this.data.childrens.map((classifier, i) => {
                            return <DefaultNode key={i} data={classifier.id} />
                        })
                    }
                </div>
            </div>
        </div>`;
    }
    public static packageView(): string {
        return (`<div className={"w-100 h-100"}>
            <div className={"default-pkg"}>
                {/*<button onClick={() => {this.node.__raw.minimized = !this.node.__raw.minimized} } >test</button>*/}
                <div className={"children"}>
                    {this.data.childrens.map((classifier, i) => {
                            return <DefaultNode key={i} data={classifier.id} />
                        })
                    }
                </div>
            </div>
        </div>`);
    }
    public static _classView(): string {
        return `<div className={""}>
            <div className={"vertex-root"}>
                <div className={"vertex-header"}>
                    <div className={"row w-100 mx-auto"}>
                        <Input className={"name-edit col mx-2"} field={"name"} obj={this.data.id} pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"}
                               style={{textAlign: "right"}}/>
                        <b className={"col text-primary"} style={{textAlign: "left"}}>&nbsp;: Concept</b>
                    </div>
                </div>
                {this.data.childrens.length > 0 ? 
                    <div className={"childrens childrens-container"}>
                        {this.data.childrens.map((child, i) => {
                                return <DefaultNode key={i} style={{position: "relative"}} data={child.id} />
                            })
                        }
                    </div> : <div></div>
                }
                <div className={"vertex-footer"}>
                    <form action={""} method={"GET"} className={"vertex-footer-hide"} onSubmit={(e) => {
                        e.preventDefault();
                        const featureType = e.target[0].value; // this can be "Attribute" or "Reference"
                        this.data.addChild(featureType);
                     }}>
                        <div className={"d-flex mx-2 my-auto"}>
                            <p className={"my-auto"}>Add</p>
                            <select className={"ms-2"}>
                                <optgroup label={"Feature Types"}>
                                {["Attribute", "Reference"].map((featureType, i) => {
                                        return <option key={i} value={featureType}>
                                            {featureType}
                                        </option>
                                    })
                                }
                                </optgroup>
                            </select>
                        </div>
                         <button type={"submit"} className={"h-100 ms-auto btn btn-light add-attribute"}>
                            <i className={"bi bi-arrow-right"}></i>
                         </button>
                    </form>
                </div>
            </div>
        </div>`
    }
    public static classView(): string {
        return (`<div className={"w-100 h-100"}>
            <div className={"default-class"}>
                <div className={"class-header"}>
                    <div className={"class-header-label"}>
                        {this.data.name} : <b>Concept</b>
                    </div>
                </div>
                <div className={"children"}>
                    <div className={""}>
                        {this.data.attributes.map((attribute, i) => {
                            return <DefaultNode key={i} data={attribute} />
                        })}                        
                        {this.data.references.map((reference, i) => {
                            return <DefaultNode key={i} data={reference} />
                        })}
                    </div>
                </div>
            </div>
        </div>`);
    }
    public static _enumeratorView(): string {
        return `<div>
            <div className={"vertex-root"}>
                <div className={"vertex-header"}>
                    <div className={"row w-100 mx-auto"}>
                        <Input className={"name-edit col mx-2"} field={"name"} obj={this.data.id} pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"}
                               style={{textAlign: "right"}}/>
                        <b className={"col text-success"} style={{textAlign: "left"}}>&nbsp;: Enum</b>
                    </div>
                </div>
                {this.data.childrens.length > 0 ?
                    <div className={"childrens childrens-container"}>
                        {this.data.childrens.map((literal, i) => {
                            return <DefaultNode key={i} style={{position: "relative"}} data={literal.id} />
                        })
                        }
                    </div> : <div></div>
                }
                <div className={"vertex-footer"}>
                    <form action={""} method={"GET"} className={"vertex-footer-hide"} onSubmit={(e) => {
                        e.preventDefault(); this.data.addChild("literal");
                    }}>
                        <div className={"d-flex mx-2 my-auto"}>
                            <p className={"my-auto"}>Add</p>
                            <select className={"ms-2"}>
                                <optgroup label={"Feature Types"}>
                                    {["Literal"].map((featureType, i) => {
                                        return <option key={i} value={featureType}>
                                            {featureType}
                                        </option>
                                    })
                                    }
                                </optgroup>
                            </select>
                        </div>
                        <button type={"submit"} className={"h-100 ms-auto btn btn-light add-attribute"}>
                            <i className={"bi bi-arrow-right"}></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>`;
    }
    public static enumeratorView(): string {
        return (`<div className={"w-100 h-100"}>
            <div className={"default-enum"}>
                <div className={"enum-header"}>
                    <div className={"enum-header-label"}>
                        {this.data.name} : <b>Enum</b>
                    </div>
                </div>
                <div className={"children"}>
                    <div className={""}>
                        {this.data.literals.map((literal, i) => {
                            return <DefaultNode key={i} data={literal} />
                        })}                        
                    </div>
                </div>
            </div>
        </div>`);
    }
    public static attributeView(): string {
        return `<div className={""}>
            <div className={"attrib-root"}>
                <div className={"row w-100 mx-auto"}>
                    <Input className={"name-edit col-lg mx-1"} field={"name"} obj={this.data.id} pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"}
                           style={{textAlign: "left"}}/>
                    <div className={"col"} style={{textAlign: "right"}}>
                          <select defaultValue={this.data.type} className={"attrib-type-select"} onChange={(e) => {
                              this.data.changeType(e.target.value);
                          }}>
                            <optgroup label={"Primitive Types"}>
                            {Selectors.getAllPrimitiveTypes().map((dClassifier, i) => {
                                    return <option key={i} value={dClassifier.id}>
                                        {dClassifier.name}
                                    </option>
                                })
                            }
                            </optgroup>                 
                            <optgroup label={"Enumerative Types"} style={{display: U.getAllPackageEnumerators(this.data).length <= 0 ? "none" : "block"}} >
                            {U.getAllPackageEnumerators(this.data).map((dEnumeration, i) => {
                                    return <option key={i} value={dEnumeration.id}>
                                        {dEnumeration.name}
                                    </option>
                                })
                            }
                            </optgroup>
                          </select>
                    </div>
                </div>
            </div>
        </div>`;
    }
    public static literalView(): string {
        return `<div className={""}>
            <div className={"attrib-root"}>
                <div className={"row w-100 mx-auto"}>
                    <Input className={"name-edit col-lg mx-1"} field={"name"} obj={this.data.id} pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"}
                           style={{textAlign: "left"}}/>
                    <div className={"col mx-1"} style={{textAlign: "right"}}>
                        literal
                    </div>
                </div>
            </div>
        </div>`;
    }
    public static referenceView(): string {
        return `<div className={""}>
            <div className={"attrib-root"}>
                <div className={"row w-100 mx-auto"}>
                    <Input className={"name-edit col-lg mx-1"} field={"name"} obj={this.data.id} pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"}
                           style={{textAlign: "left"}}/>
                    <div className={"col"} style={{textAlign: "right"}}>
                          <select defaultValue={this.data.type} className={"attrib-type-select"} onChange={(e) => {
                              this.data.changeType(e.target.value);
                          }}>
                            <optgroup label={"ClassReference Types"}>
                            {U.getAllPackageClasses(this.data).map((dClass, i) => {
                                    return <option key={i} value={dClass.id}>
                                        {dClass.name}
                                    </option>
                                })
                            }
                            </optgroup>
                          </select>
                    </div>
                </div>
            </div>
        </div>`;
    }
}


// node -> DGraphElement
