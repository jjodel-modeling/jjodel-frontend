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
    DPackage,
    MixOnlyFuncs,
    DGraph, DClassifier, DEnumerator, Input, DOperation,
} from "../joiner";
import React, {ChangeEvent} from "react";
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
        const outElemArray: DModelElement[] = [];
        const m3: DModel = this.makeM3Test(false, outElemArray);
        TRANSACTION( () => {
            for (let elem of outElemArray) {
                new CreateElementAction(elem);
            }
        });
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
    // let jsxstringtodo = todo itera i nodi o i children di un modello nel jsx;
    let thiss: {data: LModelElement} = null as any;
    let modeljsxstring = `<div class={"model root"}>
        <div className={"childrens"}>{this.data.childrens.map((p) => <Graph data={p.id} style={{minHeight: "100%", minWidth: "100%"}} />)}</div>
    </div>`;
    // let jsx2 = <><button onClick={ () => { console.log( "acfunc click:", {acfunc: this.data.addClass})}} Add </button><button onClick={this.data.addClass}> Add </button></>;
    // let jsxstring = <div><span>{JSON.stringify(thiss.data.__raw)}</span> <div className={"childrens"}>{thiss.data.childrens.map((p) => <VertexConnected data={p.id} />)}</div></div>;
    let pkgjsxstring = `<div className="pkgroot" style={{display: "flex", flexFlow: "wrap", width: '100%', height:'calc(100% - 102px)', position:'absolute'}}>
        <b style={{display: "block", width:"100%"}}>{this.data.__raw.className + (true ? "" : this.data.id)}</b>
        <b style={{display: "block"}}>{(window.thiss = this) && true}</b>
        {/*<b style={{display: "block"}}>{(this.node && this.node.className) + ": " + (this.node && this.node.id)}</b>*/}
        <b style={{display: "block", width: "100%"}}>Position: {(this.node && this.node.size.x) + ", " + (this.node && this.node.size.y)}</b><br/>
        {/*<b style={{display: "block"}}>Size: {(this.node && this.node.size && this.node.size.w) + " x " + (this.node && this.node.size && this.node.size.h)}</b>*/}
        {/*<b style={{display: "block"}}>Size: {"X "+(this.node && this.node && this.node.size && this.node.size.w)}</b><br />*/}
        <b style={{display: "none"}}>{"isGraph: " + (this.isGraph) + ", isVertex: " + (this.isVertex)}</b>
        <div style={{display: 'flex'}}>
            <span style={{margin: "auto 10px", maxHeight: "50px", display: "none", overflowY: "scroll"}}>{JSON.stringify({...this.data.__raw, childrens: this.data.childrens})}</span>
            <label style={{margin: "auto 10px"}}>
                <span style={{margin: "auto 5px"}}>Name: {this.data.name}</span>
                <Input className={'raw'} obj={this.data} field={"name"} style={{margin: "auto 5px", width: "100%"}}/>
            </label>
            <button className="btn btn-primary" onClick={ () => { console.log( "acfunc click:", {acfunc: this.data.addClass})}}> Add </button>
            <br/>
            <span style={{margin: "auto 10px"}}>package childrens({this.data.childrens.length}):</span>
        </div>
        <div className={"childrens"}> {this.data.childrens.map((p) => <DefaultNode data={p.id} />)}</div>
        
        {/*<button onClick={this.data.addClass} Add </button>*/}
    {/*<Field data={this.data.id} nodeid={this.nodeid + "2"} graphid={this.graphid} view = {Selectors.getByName(DViewElement, "EditView").id} />\n*/}
</div>`;
    // let jsxstring = '<div><DataOutputComponent data={this.data.__raw} /> <div className={"childrens"}>{this.data.childrens.map((p) => <Vertex data={p.id} />)}</div></div>';

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

    // styletodo = `<style>{"div {background-color: pink;}"}</style>`;
    let classdefaultjsx =
        `<div className='template Vertex Class' tabIndex={-1}
                       style={{
                           cursor: 'pointer',
                           position: 'relative',
                           borderRadius: '7px',
                           background: 'var(--color-1)',
                           color: 'var(--color-2)'
                       }}>
            <div className='Class'
                 style={{
                     background: 'inherit',
                     boxShadow: '0 0 3pt 0.5pt var(--color-3)',
                     height: 'auto',
                     width: '100%',
                     borderRadius: '7px',
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
                    <input value='$##name$' placeholder='Object name' pattern='[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*'
                    style={{display: 'none'}}
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
                    <button className='addFieldButton' onClick={() => this.data.addChildren(this.selected || 'Attribute')}>Go</button>
                </div>
            </div>` +
        styletodo +
        `</div> `;


    let classdefaultjsx2 =
        `<div className='template Vertex Class' tabIndex={-1}
                       style={{
                           cursor: 'pointer',
                           position: 'relative',
                           borderRadius: '7px',
                           background: 'blue',
                           color: 'var(--color-2)'
                       }}>
            <div className='Class'
                 style={{
                     background: 'inherit',
                     boxShadow: '0 0 3pt 0.5pt var(--color-3)',
                     height: 'auto',
                    
                     width: '100%',
                     borderRadius: '7px',
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
                    <input value='$##name$' placeholder='Object name' pattern='[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*'
                    style={{display: 'none'}}
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
                    <button className='addFieldButton' onClick={() => this.data.addChildren(this.selected || 'Attribute')}>Go</button>
                </div>
            </div>` +
        styletodo +
        `</div> `;
/*todo
    let a =
        <select className='AddFieldSelect' style={{
            background: 'transparent',
            display: 'flex',
            margin: 'auto',
        }} onChange={ (e:ChangeEvent) => { this.selected = e.target.value }} />;*/

    let attribdefaultjsx = `<div style={{display: 'flex', height: '18px'}}><Input className={'raw'} field={'name'} obj={this.data.id} placeholder='Attribute name' pattern='[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*'
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
    let refdefaultjsx = `<div style={{display: 'flex', height: '18px'}}><Input className={'raw'} field={'name'} obj={this.data.id} placeholder='Attribute name' pattern='[a-zA-Z_\u0024][0-9a-zA-Z\d_\u0024]*'
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
                            margin: 'auto'}}>: reference
                        </div></div>`;
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
    let cview: DViewElement = new DViewElement('ClassDefaultView', classdefaultjsx, undefined, '', '', '', [DClass.name]);
    let cview2: DViewElement = new DViewElement('Class View 2', classdefaultjsx2, undefined, '', '', '', [DClass.name]);
    let enumdefaultjsx = `<div class="Enumerator" style={{width: '100px', height: '50px', background: 'pink'}}>Enumerator placeholder</div>`;
    let eview: DViewElement = new DViewElement('EnumDefaultView', enumdefaultjsx, undefined, '', '', '', [DEnumerator.name]);
    let aview: DViewElement = new DViewElement('AttribDefaultView', attribdefaultjsx, undefined, '', '', '', [DAttribute.name]);
    let rview: DViewElement = new DViewElement('RefDefaultView', attribdefaultjsx, undefined, '', '', '', [DReference.name]);
    let oview: DViewElement = new DViewElement('OperationDefaultView', attribdefaultjsx, undefined, '', '', '', [DOperation.name]);

    pkgview.subViews = [cview.id, cview2.id]; // childrens can use this view too todo: this is temporary
    let alldefaultViews = [mview, pkgview, cview, cview2, eview, aview, rview, oview];
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
