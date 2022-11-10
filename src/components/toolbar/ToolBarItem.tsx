import {ReactNode} from "react";
import {LModelElement} from "../../model/logicWrapper";

export class ToolBarItem {
    public static getItems(data: LModelElement, items: string[]): ReactNode[] {
        const reactNodes: ReactNode[] = [];
        for(let item of items) {
            reactNodes.push(<div className={"toolbar-item " + item} key={items.indexOf(item)} onClick={() => data.addChild(item)}>+{item}</div>);
        }
        return reactNodes;
    }
}
