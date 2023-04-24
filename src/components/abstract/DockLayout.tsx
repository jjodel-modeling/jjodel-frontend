import React, {Dispatch, PureComponent, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {IStore} from '../../redux/store';
import {
    CreateElementAction,
    DGraph,
    DModel,
    DModelElement,
    LModel,
    LModelElement,
    Pointer,
    Selectors,
    SetFieldAction,
    U
} from '../../joiner';
import './style.scss';
import {DockContext, DockLayout, PanelData} from "rc-dock";
import {LayoutData} from "rc-dock/lib/DockData";
import StructureEditor from "../rightbar/structureEditor/StructureEditor";
import TreeEditor from "../rightbar/treeEditor/treeEditor";
import ViewsEditor from "../rightbar/viewsEditor/ViewsEditor";
import StyleEditor from "../rightbar/styleEditor/StyleEditor";
import EdgeEditor from "../rightbar/edgeEditor/EdgeEditor";
import ViewpointEditor from "../rightbar/viewpointsEditor/ViewpointsEditor";
import Console from "../rightbar/console/Console";
import Swal from 'sweetalert2'
import MetamodelTab from "./tabs/MetamodelTab";
import ModelTab from "./tabs/ModelTab";
import InfoTab from "./tabs/InfoTab";
import PersistanceTab from "./tabs/PersistanceTab";


interface ThisState {}
class DockLayoutComponent extends PureComponent<AllProps, ThisState>{
    private dock: DockLayout | null;
    // private metamodel: AllProps["metamodel"];
    private groups = {
        'group1': {
            floatable: true,
            maximizable: true,
            panelExtra: (panelData: PanelData, context: DockContext) => {
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

    private persistance = { title: "Persistance", group: "2", closable: false, content: <PersistanceTab /> };
    private structureEditor = { id: '1', title: 'Structure', group: 'group2', closable: false, content: <StructureEditor /> };
    private treeEditor = { id: '2', title: 'Tree View', group: 'group2', closable: false, content: <TreeEditor /> };
    private viewsEditor = { id: '3', title: 'Views', group: 'group2', closable: false, content: <ViewsEditor /> };
    private styleEditor = { id: '4', title: 'Node', group: 'group2', closable: false, content: <StyleEditor /> };
    private edgeEditor = { id: '5', title: 'Edges', group: 'group2', closable: false, content: <EdgeEditor /> };
    private viewpointEditor = { id: '6', title: 'Viewpoints', group: 'group2', closable: false, content: <ViewpointEditor /> };
    private console = { id: '7', title: 'Console', group: 'group2', closable: false, content: <Console /> };

    private selected = this.props.selected;
    private views = this.props.views;
    private moveOnStructure = false;
    private moveOnViews = false;


    constructor(props: AllProps, context: any) {
        super(props, context);
        this.dock = null;
    }

    shouldComponentUpdate(newProps: Readonly<AllProps>, newState: Readonly<ThisState>, newContext: any): boolean {
        const oldProps = this.props;
        // if(oldProps.selected !== newProps.selected) { this.moveOnStructure = true; return true; }
        if(oldProps.views !== newProps.views) { this.moveOnViews = true; return true; }
        return false;
    }

    componentDidUpdate(prevProps: Readonly<AllProps>, prevState: Readonly<ThisState>, snapshot?: any) {
        if(this.dock) {
            if(this.moveOnViews) {
                this.dock.dockMove(this.viewsEditor, this.dock.find('3'), 'middle');
                this.moveOnViews = false;
            }
            if(this.moveOnStructure) {
                this.dock.dockMove(this.structureEditor, this.dock.find('1'), 'middle');
                this.moveOnStructure = false;
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
                if(model.isMetamodel) {
                    const tab = { id: model.id, title: model.name, group: 'group1', closable: true, content:
                            <MetamodelTab modelid={model.id} />
                    };
                    context.dockMove(tab, panelData, 'middle');
                } else {
                    const tab = { id: model.id, title: model.name, group: 'group1', closable: true, content:
                            <ModelTab modelid={model.id} metamodelid={model.father.id} />
                    };
                    context.dockMove(tab, panelData, 'middle');
                }

            }
        });
    }

    addMetamodel(evt: React.MouseEvent<HTMLButtonElement>, context: DockContext, panelData: PanelData) {
        let name = 'metamodel_' + 0;
        let names: (string)[] = Selectors.getAllMetamodels().map(m => m.name);
        name = U.increaseEndingNumber(name, false, false, (newName) => names.indexOf(newName) >= 0)
        const model: DModel = DModel.new(name);
        model.isMetamodel = true;
        CreateElementAction.new(model);
        CreateElementAction.new(DGraph.new(model.id));
        const metaModelTab = { id: model.id, title: model.name, group: 'group1', closable: true, content:
                <MetamodelTab modelid={model.id} />
        };
        context.dockMove(metaModelTab, panelData, 'middle');

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
                const model: HTMLElement|null = document.getElementById('select-add-model');
                return (model) ? (model as HTMLSelectElement).value : null;
            },
            backdrop: false
        });
        result.then((data) => {
            if(data.isConfirmed && data.value) {
                const metamodel: LModel = LModel.fromPointer(data.value);
                let name = 'model_' + 0;
                let modelNames: (string)[] = metamodel.models.map(m => m.name);
                name = U.increaseEndingNumber(name, false, false, (newName) => modelNames.indexOf(newName) >= 0)
                const model: DModel = DModel.new(name); todo set other pars
                model.isMetamodel = false; model.father = metamodel.id;
                CreateElementAction.new(model); remove this
                CreateElementAction.new(DGraph.new(model.id));
                SetFieldAction.new(metamodel.id, 'models', model.id, '+=', true);
                const modelTab = { id: model.id, title: model.name, group: 'group1', closable: true, content:
                        <ModelTab modelid={model.id} metamodelid={metamodel.id} />
                };
                context.dockMove(modelTab, panelData, 'middle');
            }
        });
    }

    render(): ReactNode {
        const layout: LayoutData = { dockbox: { mode: 'horizontal', children: [] }};
        const infoTab = { id: 'info', title: 'Info', group: 'group1', closable: false, content:
            <InfoTab />
        };
        layout.dockbox.children.push({tabs: [infoTab]});
        layout.dockbox.children.push({
            tabs: [
                this.persistance,
                this.structureEditor,
                this.treeEditor,
                this.viewsEditor,
                this.viewpointEditor,
                this.styleEditor,
                this.edgeEditor,
                this.console
            ]
        });

        return (<DockLayout ref={(dockRef) => { this.dock = dockRef }} defaultLayout={layout}
                            groups={this.groups} />);
    }
}

interface OwnProps { }
interface StateProps {selected: Pointer<DModelElement, 0, 1, LModelElement>, views: number }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const selected = state._lastSelected?.modelElement;
    if(selected) ret.selected = selected;
    ret.views = state.viewelements.length;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const DockLayoutConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(DockLayoutComponent);

export const Dock = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <DockLayoutConnected {...{...props, childrens}} />;
}
export default Dock;
