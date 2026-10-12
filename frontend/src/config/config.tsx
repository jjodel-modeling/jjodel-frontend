import {
    DState, LViewElement,
    Overlap,
    RuntimeAccessible
} from "../joiner";
import {connect} from "react-redux";
import React, {Component, Dispatch, ReactElement, ReactNode} from "react";

class RawConfig{

}


@RuntimeAccessible('ConfigComponent')
export class ConfigComponent extends Component<AllPropss, ConfigState>{
    private static singleton: ConfigComponent;
    static cname: string = "ConfigComponent";

    constructor(props: AllPropss){
        super(props);
        ConfigComponent.singleton = this;
        let config = localStorage.getItem("jjodel_config") || {};
        // @ts-ignore
        for (let k  in config) { this[k] = config[k]; }
    }
    static set<T extends keyof ConfigComponent>(key: T, val: ConfigComponent[T]) {
        ConfigComponent.singleton[key] = val;
        localStorage.setItem("jjodel_config", JSON.stringify(ConfigComponent.singleton));
        // todo: api for persistence
    }

    static get<T extends keyof ConfigComponent>(key: T): ConfigComponent[T] {
        return ConfigComponent.singleton[key];
    }

    render() {
        return null;
    }
}


class ConfigState {// react component state

}
class ConfigOwnProps{

}
class ConfigDispatchProps {}
class ConfigReduxStateProps {}
type AllPropss = Overlap<Overlap<ConfigOwnProps, ConfigDispatchProps>, ConfigReduxStateProps>;

function mapStateToProps(state: DState, ownProps: ConfigOwnProps): ConfigReduxStateProps {
    const ret: ConfigReduxStateProps = {} as any;
    // ret.data = LViewElement.wrap(ownProps.data);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): ConfigDispatchProps {
    const ret: ConfigDispatchProps = {};
    return ret;
}
const ConfigConnected = connect<ConfigReduxStateProps, ConfigDispatchProps, ConfigOwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ConfigComponent);

export const Configg = (props: ConfigOwnProps, children: ReactNode = []): ReactElement => {
    let props2: ConfigOwnProps = {...props, children: children||(props as any).children};
    // @ts-ignore
    delete props2.key;
    return <ConfigConnected {...props2} />;
}
// console.info('Config loaded');


ConfigComponent.cname = "ConfigComponent";
// @ts-ignore
ConfigConnected.cname = "ConfigConnected";
Configg.cname = "Config";
