import {DockLayout, TabData} from 'rc-dock';
import {LModel, U} from '../../joiner';
import TabDataMaker from "./tabs/TabDataMaker";

class DockManager {
    static dock: DockLayout|null;

    static async open(group: 'models'|'editors', tab: TabData): Promise<void> {
        if(!DockManager.dock) return;
        const index = (group === 'models') ? 0 : 1;
        await U.sleep(1); // damiano why?
        DockManager.dock.dockMove(tab, DockManager.dock.getLayout().dockbox.children[index], 'middle');
    }

    static async open2(me: LModel): Promise<void> {
        const tab = (me.isMetamodel) ? TabDataMaker.metamodel(me) : TabDataMaker.model(me);
        await DockManager.open('models', tab);
    }

}

export default DockManager;
