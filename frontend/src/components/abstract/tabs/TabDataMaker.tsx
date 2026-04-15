import {DModel, LModel} from '../../../model/logicWrapper';
import {TabData} from 'rc-dock';
import MetamodelTab from './MetamodelTab';
import ModelTab from './ModelTab';
import DocumentationTab from './DocumentationTab';
// Viewpoint editing is handled inline in the right-panel "Viewpoints" tab
// (NestedView + ViewData) — no dedicated dock tab is created.
// ViewpointEditorPanel files in src/components/panels/viewpoint-editor/ are
// intentionally kept in the codebase (post-release cleanup).
import { ConformanceIndicator } from '../../../model/conformance/ConformanceIndicator';
import './tab-title.scss';

// CSS-only approach: uses data attribute and ::before pseudo-element
// This avoids React re-rendering issues with rc-dock
class TabDataMaker {
    static metamodel (model: DModel|LModel): TabData {
        return {
            id: model.id,
            title: <div className="tab-title active-on-mouseenter" data-type="metamodel">{model.name}</div>,
            group: 'models',
            closable: true,
            content: <MetamodelTab modelid={model.id} key={model.id} />
        };
    }

    static model(model: DModel|LModel): TabData {
        return {
            id: model.id,
            title: <div className="tab-title active-on-mouseenter" data-type="model">{model.name}<ConformanceIndicator modelId={model.id} /></div>,
            group: 'models',
            closable: true,
            content: <ModelTab modelid={model.id} metamodelid={(model.instanceof as any)?.id || model.instanceof} />
        };
    }

    // NOTE: TabDataMaker.viewpoint() was removed — viewpoint editing lives in the
    // right-panel "Viewpoints" tab (NestedView + ViewData sub-tabs). See
    // DockManager.openViewpoint() which now activates that tab instead of creating
    // a dedicated dock tab.

    static documentation(model?: DModel|LModel): TabData {
        const tabId = model ? `doc_${model.id}` : 'documentation';
        const tabTitle = model ? `${model.name} Docs` : 'Documentation';
        return {
            id: tabId,
            title: <div className="tab-title active-on-mouseenter" data-type="documentation">{tabTitle}</div>,
            group: 'editors',
            closable: true,
            content: <DocumentationTab modelid={model?.id} key={tabId} />
        };
    }
}


export default TabDataMaker;
