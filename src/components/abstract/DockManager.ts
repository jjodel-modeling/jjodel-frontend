import {DockLayout, TabData} from 'rc-dock';
import {U} from '../../joiner';

class DockManager {
    static dock: DockLayout|null;

    static async open(group: 'models'|'editors', tab: TabData): Promise<void> {
        if(!DockManager.dock) return;
        const index = (group === 'models') ? 0 : 1;
        await U.sleep(1);
        DockManager.dock.dockMove(tab, DockManager.dock.getLayout().dockbox.children[index], 'middle');
    }
}

export default DockManager;
