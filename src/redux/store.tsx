import {createStore, PreloadedState, Reducer, Store, StoreEnhancer} from 'redux';
import type {
    LGraph,
    LVertex,
    LEdgePoint} from '../joiner';
import {
    GObject,
    GraphPoint,
    Point,
    DAttribute,
    DClass,
    DModel,
    DModelElement,
    DNamedElement,
    DReference,
    Pointer,
    DPointerTargetable,
    RuntimeAccessibleClass,
    SetRootFieldAction,
    TRANSACTION,
    Dictionary,
    DUser,
    DocString,
    DViewElement,
    windoww,
    CreateElementAction,
    DGraphElement,
    LGraphElement,
    RuntimeAccessible,
    LViewElement,
    LPointerTargetable,
    getPath,
    LModelElement,
    LPackage,
    DPackage,
    MixOnlyFuncs,
    DGraph,
    DClassifier,
    DEnumerator,
    Input,
    DOperation,
    SetFieldAction,
    DObject,
    LClassifier,
    DEnumLiteral,
    LEnumerator,
} from "../joiner";
import React, {ChangeEvent, CSSProperties} from "react";
import {LGraphVertex} from "../model/dataStructure/GraphDataElements";
console.warn('ts loading store');

// @RuntimeAccessible
// NB: le voci che iniziano con '_' sono personali e non condivise
export class IStore {
    models: Pointer<DModel, 0, 'N'> = []; // Pointer<DModel, 0, 'N'>[] = [];
    currentUser: DUserState;
    stackViews: Pointer<DViewElement>[] = [];

    // users: Dictionary<DocString<Pointer<DUser>>, UserState> = {};
    // collaborators: UserState[];
    idlookup: Record<Pointer<DPointerTargetable, 1, 1>, DPointerTargetable> = {};

    //// DClass section to fill
    graphs: Pointer<DGraph, 0, 'N', LGraph> = [];
    voidvertexs: Pointer<DGraph, 0, 'N', LGraphVertex> = [];
    vertexs: Pointer<DGraph, 0, 'N', LVertex> = [];
    graphvertexs: Pointer<DGraph, 0, 'N', LGraphVertex> = [];
    edgepoints: Pointer<DGraph, 0, 'N', LEdgePoint> = [];
    classifiers: Pointer<DClassifier, 0, 'N', LClassifier> = [];
    //classs: Pointer<DClass, 0, 'N', LCLass> = [];
    enumerators: Pointer<DEnumerator, 0, 'N', LEnumerator> = [];









    /// DClass section end

    // private, non-shared fields
    _lastSelected?: {
        node: Pointer<DGraphElement, 1, 1>,
        view: Pointer<DViewElement, 1, 1>,
        modelElement: Pointer<DModelElement, 0, 1> // if a node is clicked: a node and a view are present, a modelElement might be. a node can exist without a modelElement counterpart.
    };

    constructor(){
//        super();
        this.currentUser = new DUserState();
        this.models = [];
        // this.collaborators = [];
        // this.fakeinit();
    }

    static fakeinit(store?: IStore): void {
        const graphDefaultViews: DViewElement[] = makeDefaultGraphViews();
        for (let graphDefaultView of graphDefaultViews) {
            new CreateElementAction(graphDefaultView);
        }
        const dModel = new DModel("M3");
        new CreateElementAction(dModel);
        const dPackage = new DPackage("M3 package", "");
        new CreateElementAction(dPackage);
        new SetFieldAction(dModel.id, 'packages+=', dPackage.id);
        new CreateElementAction(DGraph.create(dModel.id));

        const dClassifiers: DClassifier[] = [];
        const dString = new DClassifier("string");
        dClassifiers.push(dString);
        const dInt = new DClassifier("integer");
        dClassifiers.push(dInt);
        const dBool = new DClassifier("boolean");
        dClassifiers.push(dBool);
        for(let dClassifier of dClassifiers) {
            new CreateElementAction(dClassifier);
        }

        //Giordano: delete this part
        /*
        const outElemArray: DModelElement[] = [];
        const m3: DModel = this.makeM3Test(false, outElemArray);
        TRANSACTION( () => {
            for (let elem of outElemArray) {
                new CreateElementAction(elem);
            }
        });
        */
    }

    static makeM3Test(fireAction: boolean = true, outElemArray: DPointerTargetable[] = []): DModel {
        const me: DModelElement = new DClass('ModelElement', true);
        const annotation: DClass = new DClass('Annotation');
        annotation.implements = [me.id];
        const namedElement: DClass = new DClass('NamedElement');
        const attribname: DAttribute = new DAttribute('name');
        namedElement.implements = [me.id]; // , classifier.id, namedelement.id, modelelement.id]
        namedElement.attributes = [attribname.id];

        // todo: uncomment const pkg: DClass = new DClass('M3Package');
        const pkg: DPackage = new DPackage('M3Package');
        const attriburi: DAttribute = new DAttribute('uri');
        // todo: uncomment pkg.implements = [namedElement.id];
        // todo: uncomment pkg.attributes = [attriburi.id];
        const classifierref: DReference = new DReference('classifiers');
        // todo: uncomment pkg.references = [classifierref.id];

        const model: DClass = new DClass('M3');
        const pkgref: DReference = new DReference('package');
        model.implements = [namedElement.id];
        pkgref.type = pkg.id;
        const classe: DClass = new DClass('Class', false, true);
        classifierref.type = classe.id;
        classe.implements = [namedElement.id]; // , classifier.id, namedelement.id, modelelement.id]
        /// model itself outside of ecore
        const m3: DModel = new DModel('M3');
        m3.packages = [pkg.id];
        // const m3graph: DGraph = DGraph.create(m3.id);
        const m3graph: DGraph = new DGraph(undefined, undefined, undefined, m3.id);
        // m3.modellingElements = [me.id, annotation.id, namedElement.id, attribname.id, pkg.id, attriburi.id, classifierref.id, pkgref.id, classe.id];
        // dispatching actions


        const editinput = "<Input className={''} field={'name'} />";
        // let m3view: DViewElement = new DViewElement('m3View', '<p style={{display: "flex", flexFlow: "wrap"}}><h1>m3view {this.data.name + (this.data.id)}</h1><i>{JSON.stringify(Object.keys(this))}</i>' + editinput + '</p>');
        // let editView: DViewElement = makeEditView();
        let graphDefaultViews: DViewElement[] = makeDefaultGraphViews();
/*
        let test: DViewElement = new DViewElement('testView', '');
        test.addSubview(view.id);
        // test.addSubview(editView.id);
        test.addSubview(graphView.id);*/

        outElemArray.push.call(outElemArray, m3, m3graph, me, annotation, namedElement, attribname, pkg, attriburi, classifierref, pkgref, classe, ...graphDefaultViews);
        // outElemArray.push(m3view);
        // outElemArray.push(editView);
        // outElemArray.push(test);
        // m3._transient.currentView = view.id;
        /*
        if (fireAction)
            TRANSACTION( () => {
                // new SetRootFieldAction('models[]', m3);
                // for (let elem of outElemArray) { DModelElement.persist(elem); }
            });*/
        return m3;
    }
}
function makeDefaultGraphViews(): DViewElement[] {
    let modeljsxstring = `<div>
        <div className={"model-root"}>
            <div className={"childrens"}>
                {this.data.childrens.map((package, i) => { return <Graph key={i} data={package.id} />})}
            </div>
        </div>
    </div>`;


    let pkgjsxstring = `<div>
        <div className={"pkg-root"}>
            <div style={{position: "absolute", zIndex: 1}} className={"p-1"}>
                <button type={"button"} className={"btn btn-dark btn-sm"} onClick={() => {
                    this.data.addChildren("class");
                }}>
                    <i className={"bi bi-plus"}></i> class
                </button>            
                <button type={"button"} className={"ms-1 btn btn-dark btn-sm"} onClick={() => {
                    this.data.addChildren("enumeration");
                }}>
                    <i className={"bi bi-plus"}></i> enum
                </button>
            </div>
            <div className={"childrens"}>
                {this.data.childrens.map((classifier, i) => {
                    return <DefaultNode key={i} data={classifier.id} />})
                }
            </div>
        </div>
    </div>`;
    let mview: DViewElement = new DViewElement('ModelDefaultView', modeljsxstring, undefined, '', '', '',
        [DModel.name]);
    let pkgview: DViewElement = new DViewElement('PackageDefaultView', pkgjsxstring, undefined, '', '', '',
        [DPackage.name]);

    let styletodo = `<style data-correcttag={"is <style> "} id='default-class-css'>{\`
            .Vertex.Attribute{
                position: relative !important
            }
            .addFieldButtonContainer{ width: 100%; text-align: center; display: flex; max-height: 20px; min-height: 20px; opacity: 0; padding: 0 5px;}
            .Vertex .childcontainer{ display: flex; flex-direction: column; border-bottom: 0.5px solid #77777777; background: #00000013; }
            .Vertex:hover .addFieldButtonContainer{
                background: var(--color-1);
                border-radius: 7px 0 7px 7px;
                opacity: 1; }
            .addFieldButton{
                height: 100%;
                background:rgba(127, 127, 127, 0.2);
                border-bottom: none;
                border-right: none;
                padding: 0 0.5rem; }
            .open-options.active{
            border - bottom - right - radius: 0 !important;
            opacity: 1;
            visibility: visible; }
            .Feature { margin: 2px 0; }
            .open-options{
            position: absolute;
            right: 0;
            border: 2px solid var(--color-2);
            background: var(--color-1);
            width: 25px;
            height: 25px;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0.5;}
            /* for M1 */
            /*
            EChar = 'EChar',
            EString = 'EString',
            EDate = 'EDate',
            EFloat = 'EFloat',
            EDouble = 'EDouble',
            EBoolean = 'EBoolean',
            EByte = 'EByte',
            EShort = 'EShort',
            EInt = 'EInt',
            ELong = 'ELong',*/
            .Vertex [data-type='EDouble'] input:not([type='number']):not([type='range']),
            .Vertex [data-type='EFloat'] input:not([type='number']):not([type='range']),
            .Vertex [data-type='ELong'] input:not([type='number']):not([type='range']),
            .Vertex [data-type='EInt'] input:not([type='number']):not([type='range']),
            .Vertex [data-type='EShort'] input:not([type='number']):not([type='range']),
            .Vertex [data-type='EByte'] input:not([type='number']):not([type='range']),
            .Vertex [data-type='EDouble'] textarea,
            .Vertex [data-type='EFloat'] textarea,
            .Vertex [data-type='ELong'] textarea,
            .Vertex [data-type='EInt'] textarea,
            .Vertex [data-type='EShort'] textarea,
            .Vertex [data-type='EByte'] textarea,
            .Vertex [data-type='EDouble'] select:not([number]),
            .Vertex [data-type='EFloat'] select:not([number]),
            .Vertex [data-type='ELong'] select:not([number]),
            .Vertex [data-type='EInt'] select:not([number]),
            .Vertex [data-type='EShort'] select:not([number]),
            .Vertex [data-type='EByte'] select:not([number]) { display: none; }
    
            .Vertex [data-type='EBoolean'] input:not([type='radio']):not([type='checkbox']),
            .Vertex [data-type='EBoolean'] select:not([bool]),
            .Vertex [data-type='EBoolean'] textarea:not([bool]){display: none;}
            .Vertex [data-type='EDate']
            input:not([type='date']):not([type='time']):not([type='datetime-local']):not([type='month']):not([type='week']),
            .Vertex [data-type='EDate'] select:not([date]),
            .Vertex [data-type='EDate'] textarea:not([date]){display: none;}
    
            .Vertex [data-type='EString'] input[type='number'],
            .Vertex [data-type='EString'] input[type='range'],
            .Vertex [data-type='EString'] input[type='radio'],
            .Vertex [data-type='EString'] input[type='checkbox'],
            .Vertex [data-type='EString'] input[type='date'],
            .Vertex [data-type='EString'] input[type='time'],
            .Vertex [data-type='EString'] input[type='datetime-local'],
            .Vertex [data-type='EString'] input[type='month'],
            .Vertex [data-type='EString'] input[type='week'],
            .Vertex [data-type='EString'] select[enum],
            .Vertex [data-type='EString'] select[date],
            .Vertex [data-type='EString'] select[bool],
            .Vertex [data-type='EString'] select[number],
            .Vertex [data-type='EString'] textarea[enum],
            .Vertex [data-type='EString'] textarea[date],
            .Vertex [data-type='EString'] textarea[bool],
            .Vertex [data-type='EString'] textarea[number],
            .Vertex [data-type='EChar'] input[type='number'],
            .Vertex [data-type='EChar'] input[type='range'],
            .Vertex [data-type='EChar'] input[type='radio'],
            .Vertex [data-type='EChar'] input[type='checkbox'],
            .Vertex [data-type='EChar'] input[type='date'],
            .Vertex [data-type='EChar'] input[type='time'],
            .Vertex [data-type='EChar'] input[type='datetime-local'],
            .Vertex [data-type='EChar'] input[type='month'],
            .Vertex [data-type='EChar'] input[type='week'],
            .Vertex [data-type='EChar'] select[enum],
            .Vertex [data-type='EChar'] select[date],
            .Vertex [data-type='EChar'] select[bool],
            .Vertex [data-type='EChar'] select[number],
            .Vertex [data-type='EChar'] textarea[enum],
            .Vertex [data-type='EChar'] textarea[date],
            .Vertex [data-type='EChar'] textarea[bool],
            .Vertex [data-type='EChar'] textarea[number] {display: none;}
    
            .Vertex [enum-type='EEnum']/*in m1 style i set only 2 possible values, this or template error*/
            select:not([enum]),
            .Vertex [enum-type='EEnum'] input:not([enum]),
            .Vertex [enum-type='EEnum'] textarea:not([enum]){display: none;}
            \`}</style>`;

    let classdefaultjsx = `<div>
        <div className={"vertex-root"}>
            <div className={"vertex-header"}>
                <div className={"row w-100 mx-auto"}>
                    <Input className={"name-edit col mx-2"} field={"name"} obj={this.data.id} pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"}
                           style={{textAlign: "right"}}/>
                    <b className={"col text-primary"} style={{textAlign: "left"}}>&nbsp;: Class</b>
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
                    this.data.addChildren(featureType);
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
    </div>`;
    let enumdefaultjsx = `<div>
        <div className={"vertex-root"}>
            <div className={"vertex-header"}>
                <div className={"row w-100 mx-auto"}>
                    <Input className={"name-edit col mx-2"} field={"name"} obj={this.data.id} pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"}
                           style={{textAlign: "right"}}/>
                    <b className={"col text-primary"} style={{textAlign: "left"}}>&nbsp;: Enum</b>
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
                    const featureType = e.target[0].value; // this can be only "Literal"
                    this.data.addChildren(featureType);
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
    let attribdefaultjsx = `<div className={""}>
        <div className={"attrib-root"}>
            <div className={"row w-100 mx-auto"}>
                <Input className={"name-edit col-lg mx-1"} field={"name"} obj={this.data.id} pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"}
                       style={{textAlign: "left"}}/>
                <div className={"col"} style={{textAlign: "right"}}>
                      <select defaultValue={this.data.type} className={"attrib-type-select"} onChange={(e) => {this.data.type = e.target.value}}>
                        <optgroup label={"Primitive Types"}>
                        {Selectors.getAllClassifiers().map((dClassifier, i) => {
                                return <option key={i} value={dClassifier.id}>
                                    {dClassifier.name}
                                </option>
                            })
                        }
                        </optgroup>                 
                        <optgroup label={"Enumerative Types"} style={{display: Selectors.getAllEnumerations().length <= 0 ? "none" : "block"}} >
                        {Selectors.getAllEnumerations().map((dEnumeration, i) => {
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
    let literalDefaultJsx = `<div className={""}>
        <div className={"attrib-root"}>
            <div className={"row w-100 mx-auto"}>
                <Input className={"name-edit col-lg mx-1"} field={"name"} obj={this.data.id} pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"}
                       style={{textAlign: "left"}}/>
                <div className={"col"} style={{textAlign: "right"}}>
                    literal
                </div>
            </div>
        </div>
    </div>`;
    let refdefaultjsx = `<div className={""}>
        <div className={"attrib-root"}>
            <div className={"row w-100 mx-auto"}>
                <Input className={"name-edit col-lg mx-1"} field={"name"} obj={this.data.id} pattern={"[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*"}
                       style={{textAlign: "left"}}/>
                <div className={"col"} style={{textAlign: "right"}}>
                      <select defaultValue={this.data.type} className={"attrib-type-select"} onChange={(e) => {this.data.type = e.target.value}}>
                        <optgroup label={"ClassReference Types"}>
                        {Selectors.getAllClasses().map((dClass, i) => {
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
    let opdefaultjsx = `<div style={{display: 'flex', height: '18px'}}><Input className={'raw'} field={'name'} obj={this.data.id} placeholder='Attribute name' pattern='[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*'
                           style={{
                               background: 'transparent',
                               border: 'none',
                               textAlign: 'right',
                               order: 1,
                               flexBasis: '50%',
                               minWidth:'10px'}}/>
                        <div style={{
                            textAlign: 'left',
                            order: 2,
                            flexGrow: 1,
                            color: 'orange',
                            margin: 'auto'}}>: operation
                        </div></div>`;

    let OLD_classdefaultjsx = `<div className={'template Vertex Class'} tabIndex={-1}>
            <div className='Class'
                 style={{
                     boxShadow: '0 0 3pt 0.5pt var(--color-3)',
                     height: 'auto',
                     width: '100%',
                     borderRadius: '10px',
                     display: 'inline-flex',
                     flexFlow: 'column'
                 }}
                 data-autosizey='1'>
                <div className='VertexHeader'
                     style={{
                         textAlign: 'center',
                         display: 'flex',
                         padding: '8px 5px',
                         width: '100%',
                         fontSize: '1rem',
                         borderBottom: '0.5px solid #77777777'}}>
                    <input value='$##name$' placeholder='Object name' pattern='[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*' style={{display: 'none'}}
                           data-style='background:transparent; border:none; text-align:right; order:1; flex-basis: 50%; min-width:10px;' />
                    <Input className={'raw'} field={'name'} obj={this.data.id} placeholder='Class name' pattern='[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*'
                           style={{
                               background: 'transparent',
                               border: 'none',
                               textAlign: 'right',
                               order: 1,
                               flexBasis: '50%',
                               minWidth:'10px'}}/>
                        <div style={{
                            textAlign: 'left',
                            order: 2,
                            flexGrow: 1,
                            color: 'var(--color-4)',
                            margin: 'auto'}}>: Concept
                        </div>
                        <div hover-display='v1' className='hover-unfade open-options' tabIndex={-1}
                             style={{
                                 top: '-25px',
                                 right: '7px',
                                 borderTopRightRadius: '999px',
                                 borderTopLeftRadius: '999px'
                             }}>
                            <span>...</span>
                        </div>
                </div>
                <div className='specialjs hideempty childcontainer AttributeContainer hover-exclude' />
                <div className='specialjs hideempty childcontainer ReferenceContainer hover-exclude' />
                <div className='specialjs hideempty childcontainer OperationContainer hover-exclude' />
                
                <div className='specialjs hideempty childcontainer AttributeContainer hover-exclude' style ={ {height: (this.data.childrens.length && (15+this.data.childrens.length * 18)) + 'px' }}>
                    {this.data.childrens.length > 0 ? ('attributes(' +this.data.childrens.length +')') : null}
                    {this.data.childrens.map((p) => <DefaultNode data={p.id} clasName={"Attribute"}/>)}
                </div>
                
                <div className='addFieldButtonContainer'>
                    <span style={{display: 'flex', margin: 'auto'}}>Add&nbsp;</span>
                    <select className='AddFieldSelect' style={{
                        background: 'transparent',
                        display: 'flex',
                        margin: 'auto',
                    }} onChange={(e) => this.selected = event.target.value }>
                        <optgroup label='FeatureType'>
                            <option value='Attribute' selected>Attribute</option>
                            <option value='Reference'>Reference</option>
                            <option value='Operation'>Operation</option>
                        </optgroup>
                    </select>
                    <span style={{display: 'flex', margin: 'auto'}}>&nbsp;field&nbsp;</span>
                    <button className={"addFieldButton btn"} onClick={() => this.data.addChildren(this.selected || 'Attribute')}>Go</button>
                </div>
            </div>` + styletodo + `</div>`;
    let OLD_attribdefaultjsx = `<div style={{display: 'flex', height: '18px'}}><Input className={'raw'} field={'name'} obj={this.data.id} placeholder='Attribute name' pattern='[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*'
                           style={{
                               background: 'transparent',
                               border: 'none',
                               textAlign: 'right',
                               order: 1,
                               flexBasis: '50%',
                               minWidth:'10px'}}/>
                        <div style={{
                            textAlign: 'left',
                            order: 2,
                            flexGrow: 1,
                            color: 'orange',
                            paddingRight: '5px',
                            margin: 'auto'}}>: attribute
                        </div></div>`;
    let OLD_enumdefaultjsx = `<div className={"Enumerator"} style={{width: '200px', height: '200px', background: 'green'}}>
        {this.data.name}
    </div>`;

    let cview: DViewElement = new DViewElement('ClassDefaultView', classdefaultjsx, undefined, '', '', '', [DClass.name]);
    let eview: DViewElement = new DViewElement('EnumDefaultView', enumdefaultjsx, undefined, '', '', '', [DEnumerator.name]);
    let aview: DViewElement = new DViewElement('AttribDefaultView', attribdefaultjsx, undefined, '', '', '', [DAttribute.name]);
    let rview: DViewElement = new DViewElement('RefDefaultView', refdefaultjsx, undefined, '', '', '', [DReference.name]);
    let oview: DViewElement = new DViewElement('OperationDefaultView', attribdefaultjsx, undefined, '', '', '', [DOperation.name]);
    let literalDefaultView: DViewElement = new DViewElement('LiteralDefaultView', literalDefaultJsx, undefined, '', '', '', [DEnumLiteral.name]);

    pkgview.subViews = [cview.id]; // childrens can use this view too todo: this is temporary

    let defaultJsx = `<div className={"render-test"}></div>`;
    let defaultView: DViewElement = new DViewElement("DefaultView", defaultJsx, undefined, "",
        "", "", []);

    let alldefaultViews = [mview, pkgview, cview, eview, aview, rview, oview, literalDefaultView, defaultView];
    mview.subViews = [mview.id, ...alldefaultViews.slice(1).map(e => e.id)]// childrens can use this view too todo: this is temporary, should just be the sliced map of everything else.
    return alldefaultViews;
}

function makeEditView(): DViewElement{
    // let jsx = <p><h1>edit view of {this.data.name}</h1><Input className={'raw'} obj={this.view.id} field={((getPath as DViewElement).jsxString as any).$}/></p>;
    let jsxstring = '<p style={{display: "flex", flexFlow: "wrap"}}><h1>edit view of {this.data.name}</h1><Textarea obj={this.views[1].id} field={((getPath).jsxString).$}/></p>;';
    let view: DViewElement = new DViewElement('EditView', jsxstring);
    view.subViews = [view.id]; // childrens can use this view too, this is indented and likely definitive.
    return view;
}
/*
class SynchStore{// shared on session

}
class AsynchStore{ // user private
    pendingUserAction: UserPendingAction[];
}*/

@RuntimeAccessible
export class DUserState extends DPointerTargetable {
    pointerPosition?: GraphPoint;
    // nope, la selezione è vertex-wise, e il vertex è graph-dependent. la view è graph-indipendent. selection: Dictionary<Pointer<User, 1, 1>, Pointer<DGraphElement, 0, 'N'>[]> = {};
    constructor() {
        super(true);
        this.className = this.constructor.name;
    }
}

@RuntimeAccessible
export class LUserState extends MixOnlyFuncs(DUserState, LPointerTargetable) {
    pointerPosition?: GraphPoint;
    defaultView!: LViewElement;
    // nope, la selezione è vertex-wise, e il vertex è graph-dependent. la view è graph-indipendent. selection: Dictionary<Pointer<User, 1, 1>, Pointer<DGraphElement, 0, 'N'>[]> = {};

}

@RuntimeAccessible
export class ViewPointState extends DPointerTargetable{
    name: string = '';
}

// todo: ogni entità ha: dati (store), logica con operazioni, dati di presentazione, ...?

@RuntimeAccessible
export class ModelStore {
    private _meta!: ModelStore | string; // todo: credo sia un Pointer? roba vecchia. oldcomment: // string memorizzata nello store, logicamente si comporta come una reference perchè usi la stringa per recuperare un modelstore (il tipo modelstore è di documentazione)
    instances!: (ModelStore | string)[];

    // todo: figata! getter e setter senza proxy??
    get meta(): ModelStore | string {
        return this._meta;
    }

    set meta(value: ModelStore | string) {
        this._meta = value;
    }
}
/*
type Cconnect = <TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, State = DefaultState>(
    mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
    mapDispatchToProps: MapDispatchToPropsNonObject<TDispatchProps, TOwnProps>
): InferableComponentEnhancerWithProps<TStateProps & TDispatchProps, TOwnProps>;
*/
// export const initialState: IStore = new IStore();
console.error('ts loaded store');
