import React, {Dispatch, ReactElement, ReactNode, useEffect} from 'react';
import {connect} from 'react-redux';
import {IStore} from '../../redux/store';
import {DockLayout} from 'rc-dock';
import {LModel} from '../../joiner';
import Console from '../rightbar/console/Console';
import './style.scss';
import {LayoutData} from 'rc-dock/lib/DockData';
import StructureEditor from '../rightbar/structureEditor/StructureEditor';
import TreeEditor from '../rightbar/treeEditor/treeEditor';
import ViewsEditor from '../rightbar/viewsEditor/ViewsEditor';
import StyleEditor from '../rightbar/styleEditor/StyleEditor';
import EdgeEditor from '../rightbar/edgeEditor/EdgeEditor';
import ViewpointEditor from '../rightbar/viewpointsEditor/ViewpointsEditor';
import MetamodelTab from "./tabs/MetamodelTab";
import {useStateIfMounted} from "use-state-if-mounted";


function DockLayoutComponent(props: AllProps) {
    const metamodel = props.metamodel;
    //const [layout, setLayout] = useStateIfMounted<LayoutData>({ dockbox: { mode: 'horizontal', children: [] }});
    const [dock, setDock] = useStateIfMounted<ReactNode>(<></>);


    // rightbar
    const structureEditor = { title: 'Structure', group: '2', closable: false, content: <StructureEditor /> };
    const treeEditor = { title: 'Tree View', group: '2', closable: false, content: <TreeEditor /> };
    const viewsEditor = { title: 'Views', group: '2', closable: false, content: <ViewsEditor /> };
    const styleEditor = { title: 'Node', group: '2', closable: false, content: <StyleEditor /> };
    const edgeEditor = { title: 'Edges', group: '2', closable: false, content: <EdgeEditor /> };
    const viewpointEditor = { title: 'Viewpoints', group: '2', closable: false, content: <ViewpointEditor /> };
    const console = { title: 'Console', group: '2', closable: false, content: <Console /> };

    useEffect(() => {
        alert('oo')
        const layout: LayoutData = { dockbox: { mode: 'horizontal', children: [] }};
        if(metamodel) {
            const metamodelTab = { title: metamodel.name, group: '1', closable: false, content:
                    <MetamodelTab modelid={metamodel.id} />
            };
            layout.dockbox.children.push({tabs: [{ ...metamodelTab, id: '1' }]});
            for(let index in metamodel.models) {
                const modelTab = { title: 'Model', group: '1', closable: false, content:
                        <div>Hello</div>
                };
                layout.dockbox.children.push({tabs: [{ ...modelTab, id: String(index) }]});
            }
            layout.dockbox.children.push({
                tabs: [
                    { ...structureEditor, id: '1' },
                    { ...treeEditor, id: '2' },
                    { ...viewsEditor, id: '3' },
                    { ...viewpointEditor, id: '4' },
                    { ...styleEditor, id: '5' },
                    { ...edgeEditor, id: '6' },
                    { ...console, id: '7' },
                ]
            });
            setDock(<DockLayout defaultLayout={layout} />);
        }
    }, [metamodel?.name, metamodel?.models.length])

    return(<>{dock}</>);

}
interface OwnProps { }
interface StateProps { metamodel?: LModel }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer = state.models[0];
    if(pointer) ret.metamodel = LModel.fromPointer(pointer);
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

