import React, {Dispatch, PureComponent, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {DockContext, DockLayout, PanelData, TabData} from "rc-dock";
import {LayoutData} from "rc-dock/lib/DockData";
import Swal from 'sweetalert2'
import './style.scss';
import {
    DState,
    BEGIN,
    DGraph,
    DModel,
    DModelElement,
    END,
    LModel,
    LModelElement,
    Pointer,
    Selectors,
    U,
    LPackage, SetRootFieldAction
} from '../../joiner';
import StructureEditor from "../rightbar/structureEditor/StructureEditor";
import TreeEditor from "../rightbar/treeEditor/treeEditor";
import ViewsEditor from "../rightbar/viewsEditor/ViewsEditor";
import StyleEditor from "../rightbar/styleEditor/StyleEditor";
import ViewpointEditor from "../rightbar/viewpointsEditor/ViewpointsEditor";
import Console from "../rightbar/console/Console";
import MetamodelTab from "./tabs/MetamodelTab";
import ModelTab from "./tabs/ModelTab";
import InfoTab from "./tabs/InfoTab";
import TestTab from "./tabs/TestTab";
import IotTab from "./tabs/IotTab";

export class TabDataMaker {
    static metamodel (model: LModel | DModel): TabData {
        if (model.isMetamodel) return { id: model.id, title: model.name, group: 'group1', closable: true, content: <MetamodelTab modelid={model.id} /> };
        return {} as any;
    }
    static model(model: LModel | DModel): TabData {
        return { id: model.id, title: model.name, group: 'group1', closable: true, content:
            <ModelTab modelid={model.id} metamodelid={(model.instanceof as any)?.id || model.instanceof} />
        };
    }

}


interface ThisState {}
class DockLayoutComponent extends PureComponent<AllProps, ThisState>{
    private dock: DockLayout|null;
    private dockPanel!: PanelData;
    private dockContext!: DockContext;

    private groups = {
        'group1': {
            floatable: true,
            maximizable: true,
            panelExtra: (panelData: PanelData, context: DockContext) => {
                this.dockPanel = panelData;
                this.dockContext = context;
                return (<div className={'my-auto'}>
                    <button className={'btn btn-primary me-1'}
                                onClick={(evt) => this.open(evt, context, panelData)}>
                        <i className={'p-1 bi bi-search'}></i>
                    </button>
                    <button className={'btn btn-primary me-1'}
                            onClick={(evt) => this.addMetamodel(evt, context, panelData)}>
                        <i className={'p-1 bi bi-chevron-double-up'}></i>
                    </button>
                    <button className={'btn btn-primary me-1'}
                            onClick={(evt) => this.addModel(evt, context, panelData)}>
                        <i className={'p-1 bi bi-chevron-up'}></i>
                    </button>
                </div>);
            }
        },
        'group2': {
            floatable: true,
            maximizable: true,
        }
    };

    private test = { id: '999', title: "Test", group: "2", closable: false, content: <TestTab /> };
    private iotEditor = { id: '0', title: 'Config', group: 'group2', closable: false, content: <IotTab /> };
    private structureEditor = { id: '1', title: 'Structure', group: 'group2', closable: false, content: <StructureEditor /> };
    private treeEditor = { id: '2', title: 'Tree View', group: 'group2', closable: false, content: <TreeEditor /> };
    private viewsEditor = { id: '3', title: 'Views', group: 'group2', closable: false, content: <ViewsEditor /> };
    private styleEditor = { id: '4', title: 'Node', group: 'group2', closable: false, content: <StyleEditor /> };
    private viewpointEditor = { id: '6', title: 'Viewpoints', group: 'group2', closable: false, content: <ViewpointEditor /> };
    private console = { id: '7', title: 'Console', group: 'group2', closable: false, content: <Console /> };

    private selected = this.props.selected;
    private views = this.props.views;
    private moveOnStructure = false;
    private moveOnViews = false;
    private iotLoaded = false;

    constructor(props: AllProps, context: any) {
        super(props, context);
        this.dock = null;
    }

    OPEN(model: DModel|LModel): void {
        new Promise(resolve => setTimeout(resolve, 100)).then(() => {
            let tab: TabData;
            if(model.isMetamodel) tab = TabDataMaker.metamodel(model);
            else tab = TabDataMaker.model(model);
            this.dockContext.dockMove(tab, this.dockPanel, 'middle');
        });
    }

    CLOSE(pointer: Pointer<DModel, 1, 1, LModel>): void {
        new Promise(resolve => setTimeout(resolve, 50)).then(() => {
            this.dockPanel.tabs = this.dockPanel.tabs.filter(tab => tab.id !== pointer);
        });
    }

    // todo: performance optimize important
    shouldComponentUpdate(newProps: Readonly<AllProps>, newState: Readonly<ThisState>, newContext: any): boolean {
        const oldProps = this.props;
        // if(oldProps.selected !== newProps.selected) { this.moveOnStructure = true; return true; }
        if (oldProps.views !== newProps.views) { this.moveOnViews = true; return true; }

        const deltaM2 = U.arrayDifference(oldProps.m2, newProps.m2);
        const addedM2: LModel[] = LModel.wrapAll(deltaM2.added);
        const removedM2: Pointer<DModel, 0, 'N', LModel> = deltaM2.removed;
        for(let model of addedM2) this.OPEN(model);
        for(let pointer of removedM2) this.CLOSE(pointer);

        const deltaM1 = U.arrayDifference(oldProps.m1, newProps.m1);
        const addedM1: LModel[] = LModel.wrapAll(deltaM1.added);
        const removedM1: Pointer<DModel, 0, 'N', LModel> = deltaM1.removed;
        for(let model of addedM1) this.OPEN(model);
        for(let pointer of removedM1) this.CLOSE(pointer);

        return !!(deltaM2.added.length || deltaM1.added.length || this.props.iot);

    }

    componentDidUpdate(prevProps: Readonly<AllProps>, prevState: Readonly<ThisState>, snapshot?: any) {
        if(this.dock) {
            if(this.moveOnViews) {
                this.dock.dockMove(this.viewsEditor, this.dock.find('3'), 'middle');
                this.moveOnViews = false;
                return;
            }
            if(this.moveOnStructure) {
                this.dock.dockMove(this.structureEditor, this.dock.find('1'), 'middle');
                this.moveOnStructure = false;
                return;
            }
            if(this.props.iot && !this.iotLoaded) {
                const layout = this.dock.getLayout();
                const tabs = [
                    this.iotEditor,
                    this.structureEditor,
                    this.treeEditor,
                    this.viewsEditor,
                    this.viewpointEditor,
                    this.console,
                ];
                layout.dockbox.children[1] = {tabs};
                this.dock.setLayout(layout);
                this.iotLoaded = true;
            }
        }
    }

    open(evt: React.MouseEvent<HTMLButtonElement>, context: DockContext, panelData: PanelData) {
        let html = '<style>body.swal2-no-backdrop .swal2-container {background-color: rgb(0 0 0 / 60%) !important}</style>';
        html += `<div><b><label class='text-primary'>OPEN AN EXISTING MODEL</label></b><br/>`;
        html += `<select class='mt-2 select' id='select-open-model'>`;
        html += `<optgroup label='Metamodels'>`;
        for(let metamodel of Selectors.getAllMetamodels()) {
            html += `<option value=${metamodel.id}>${metamodel.name}</option>`;
        }
        html += '</optgroup>';
        html += `<optgroup label='Models'>`;
        for(let model of Selectors.getAllModels()) {
            html += `<option value=${model.id}>${model.name}</option>`;
        }
        html += '</optgroup>';
        html += '</select></div>';
        const result = Swal.fire({
            html: html, showCloseButton: true, confirmButtonText: 'OPEN',
            preConfirm: () => {
                const model: HTMLElement|null = document.getElementById('select-open-model');
                return (model) ? (model as HTMLSelectElement).value : null;
            },
            backdrop: false
        });
        result.then((data) => {
            if(data.isConfirmed && data.value) {
                const model: LModel = LModel.fromPointer(data.value);
                this.OPEN(model);
            }
        });
    }

    async addMetamodel(evt: undefined|React.MouseEvent<HTMLButtonElement>, context: DockContext, panelData: PanelData, model?: DModel) {
        let name = 'metamodel_' + 0;
        let names: (string)[] = Selectors.getAllMetamodels().map(m => m.name);
        name = U.increaseEndingNumber(name, false, false, (newName) => names.indexOf(newName) >= 0);
        BEGIN()
        const dModel = model || DModel.new(name, undefined, true);
        const lModel: LModel = LModel.fromD(dModel);
        const dPackage = lModel.addChild('package');
        const lPackage: LPackage = LPackage.fromD(dPackage);
        lPackage.name = name;
        SetRootFieldAction.new('selected', dModel.id, '', true);//? rewove?*/
        SetRootFieldAction.new('_lastSelected', {modelElement: dModel.id});
        END()
        this.OPEN(dModel);
    }
    addModel(evt: React.MouseEvent<HTMLButtonElement>, context: DockContext, panelData: PanelData) {
        let html = '<style>body.swal2-no-backdrop .swal2-container {background-color: rgb(0 0 0 / 60%) !important}</style>';
        html += `<div><b><label class='text-primary'>CREATE A MODEL</label></b><br/>`;
        html += `<label>The model will be conform to:</label><br/>`;
        html += `<select class='mt-2 select' id='select-add-model'>`;
        html += `<optgroup label='Metamodels'>`;
        for(let metamodel of Selectors.getAllMetamodels()) {
            html += `<option value=${metamodel.id}>${metamodel.name}</option>`;
        }
        html += '</optgroup>';
        html += '</select></div>';
        const result = Swal.fire({
            html: html, showCloseButton: true, confirmButtonText: 'CREATE',
            preConfirm: () => {
                const metamodel: HTMLElement|null = document.getElementById('select-add-model');
                return (metamodel) ? (metamodel as HTMLSelectElement).value : null;
            },
            backdrop: false
        });
        result.then((data) => {
            if(data.isConfirmed && data.value) {
                let mmid: Pointer<DModel> = data.value;
                const metamodel: LModel = LModel.fromPointer(mmid);
                let name = 'model_' + 0;
                let modelNames: (string)[] = metamodel.models.map(m => m.name);
                name = U.increaseEndingNumber(name, false, false, (newName) => modelNames.indexOf(newName) >= 0)
                BEGIN()
                const model: DModel = DModel.new(name, mmid, false, true);
                // DGraph.new(0, model.id);
                END()
                this.OPEN(model);
            }
        });
    }

    render(): ReactNode {
        const layout: LayoutData = { dockbox: { mode: 'horizontal', children: [] }};
        const infoTab = { id: 'info', title: 'Info', group: 'group1', closable: false, content:
            <InfoTab />
        };
        layout.dockbox.children.push({tabs: [infoTab]});
        const tabs = [
            // this.test,
            // this.iotEditor,
            this.structureEditor,
            // this.styleEditor,
            this.treeEditor,
            this.viewsEditor,
            this.viewpointEditor,
            this.console
        ];
        layout.dockbox.children.push({tabs});

        return (<DockLayout ref={(dockRef) => { this.dock = dockRef }} defaultLayout={layout}
                            groups={this.groups} />);
    }
}

interface OwnProps { }
interface StateProps {
    selected: Pointer<DModelElement, 0, 1, LModelElement>;
    views: number;
    m2: Pointer<DModel, 0, 'N', LModel>;
    m1: Pointer<DModel, 0, 'N', LModel>;
    iot: null|boolean;
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const selected = state._lastSelected?.modelElement;
    if(selected) ret.selected = selected;
    ret.views = state.viewelements.length;
    ret.m2 = state.m2models;
    ret.m1 = state.m1models;
    ret.iot = state.iot;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const DockLayoutConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(DockLayoutComponent);

export const Dock = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <DockLayoutConnected {...{...props, children}} />;
}
export default Dock;
