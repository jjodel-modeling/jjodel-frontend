import React, {Component, Dispatch, ReactElement, ReactNode, useRef, useState} from 'react';
import {connect} from 'react-redux';
import {
    Dictionary,
    GObject, Input,
    Pointer, RuntimeAccessible, TextArea,
} from '../../joiner';
import {
    TRANSACTION,
    Log,
    D,
    L,
    transientProperties,
    U,
    windoww,
    DState,
    DProject,
    DUser,
} from '../../joiner';
import './config.scss';

class ConfigEntry<T>{
    userValue: T;
    projectValue: T;
    defaultValue: T;
    activeMode: "user" | "project";
    constructor(v: T, mode: "user" | "project" = "user") {
        this.defaultValue = v;
        this.userValue = v;
        this.projectValue = v;
        this.activeMode = mode;
    }
}

@RuntimeAccessible("Config")
export class Config extends Component{
    private static config: Config = Config.load();
    private static userStorageKey: string;
    private static projectStorageKey: string;
    synchDelay = new ConfigEntry(300);
    liveStateChanges = new ConfigEntry(true);
    debugMode = new ConfigEntry(false);
    advancedMode = new ConfigEntry(false);

    static get(): Config {
        if (Config.config) return Config.config;
        else return Config.load();
    }

    constructor(props: OwnProps = {} as any){ super(props); }

    static load(): Config {
        Config.userStorageKey = "_jj_config_user_" + DUser.current;
        Config.projectStorageKey =  "_jj_config_project_" + U.getProjectID_URL();

        const uConfig: Partial<Config> = JSON.parse(localStorage.getItem(Config.userStorageKey) || "{}");
        const pConfig: Partial<Config> = JSON.parse(localStorage.getItem(Config.projectStorageKey) || "{}");
        const ret = new Config();
        let k: keyof Config;
        for (k in uConfig) {
            const v: ConfigEntry<any> = uConfig[k] as any;
            const defv = ret[k] as ConfigEntry<any>;
            if (typeof v !== "object" || !v) continue;
            if (typeof defv !== "object" || !defv) continue;
            defv.userValue = v.userValue;
        }
        for (k in pConfig) {
            const v: ConfigEntry<any> = pConfig[k] as any;
            const defv = ret[k] as ConfigEntry<any>;
            if (typeof v !== "object" || !v) continue;
            if (typeof defv !== "object" || !defv) continue;
            defv.projectValue = v.projectValue;
            defv.activeMode = v.activeMode;
        }

        return ret;
    }

    static save(config?: Config) {
        const projectConfig: Partial<Config> = U.jsonCopy(config || Config.get());
        const userConfig: Partial<Config> = U.jsonCopy(config || Config.get());

        let k: keyof Config;
        // save project config: remove default non-changed properties first and strip user part
        for (k in projectConfig) {
            const v: ConfigEntry<any> = projectConfig[k] as any;
            if (typeof v !== "object" || !v || !("defaultValue" in v)) delete projectConfig[k];
            if (v.projectValue === v.defaultValue && v.activeMode === "user") delete projectConfig[k];
            delete v.defaultValue;
            delete v.userValue;
        }
        // save user config: remove default non-changed properties first and strip project part
        for (k in userConfig) {
            const v: ConfigEntry<any> = userConfig[k] as any;
            if (typeof v !== "object" || !v || !("defaultValue" in v)) delete userConfig[k];
            // asymmetric by design: activeMode is stored only in projectConfig and only if !== "user" (default mode)
            if (v.userValue === v.defaultValue /*&& v.activeMode === "project"*/) delete userConfig[k];
            delete v.defaultValue;
            delete v.projectValue;
        }
        localStorage.setItem(Config.userStorageKey, JSON.stringify(userConfig));
        localStorage.setItem(Config.projectStorageKey, JSON.stringify(projectConfig));
    }


    // value undefined: not set and only change activeMode
    // value null: reset to default
    static set<K extends keyof Config>(k: K, v: Config[K] | undefined | null, mode?: "project" | "user"): void {
        const config = Config.get();
        let entry = config[k] as ConfigEntry<any>;
        if (mode) entry.activeMode = mode;
        else mode = entry.activeMode;
        if (v === undefined) return;
        if (v === null) v = entry.defaultValue;
        if (mode === "user") entry.projectValue = v as any;
        else entry.userValue = v as any;
        Config.save(config);
    }

    // double-use as class & component to avoid similar naming duplication.
    // other mid-steps (ConfigComponent, ConfigConnected) should be "private" (not be exported) to keep external context clean
    render(){
        return <ConfigConnected {...this.props} />
    }
}

class Desc{
    constructor(public k: keyof Config, public type: string = "text", public label: ReactNode = null, public tooltip: ReactNode = null) {}
}
function getActiveModeIco(mode: "user" | "project" = "user") {
    return <span className="switch-mode" data-mode={mode}>{mode[0].toUpperCase()}</span>
}

function ConfigComponent(props: AllProps) {
    // const [modes, setModes] = useState("user" as "user" | "project"); // make it option-wide instead of a global switch so i can override just 1
    // const ucMode = U.camelCase(mode);
    const config: Config = Config.get();
    const descriptions: Desc[] = [
        new Desc("synchDelay", "number", <span>Synchronization delay</span>, <div>Interval between collaborative synchronization emission (reception has no delay).<br/>
        Also used to compact multiple temporally close actions in a single undo-able step, similar to a TRANSACTION, to avoid cluttering the history.</div>),
        new Desc("advancedMode", "switch", <span>Advanced mode</span>, <div>Whether to show or hide some advanced features. Disabling it keeps the interface cleaner.</div>),
        new Desc("debugMode", "switch", <span>Debug mode</span>, <div>Meant to be used only be developers or by users under developer guidance for finer control and debug.\n High performance impact..</div>),
        // new Desc("placeholder", "placeholder", <span>name_placeholder</span>, <div>tooltip_placeholder</div>),
    ];
    return <div className={'config-pupup'}>
        <section className={"config"}>
            <h3>Config</h3>
            {descriptions.map((desc) => {
                const k = desc.k;
                const e = config[k] as ConfigEntry<any>;

                if (!e || typeof e !== "object" || !("defaultValue" in e)) return null;
                let input: ReactNode = null;
                const getter = ()=> { return e.activeMode === "user" ? e.userValue : e.projectValue; };
                const setter = (v: any)=> { Config.set(k, v); };
                switch (desc.type) {
                    case "textarea": input = <TextArea getter={getter} setter={setter} tooltip = {desc.tooltip}/>; break;
                    default: input = <Input type={"number"} getter={getter} setter={setter} tooltip={desc.tooltip} />; break;
                }
                return <div className="config-entry" data-name={k}>
                    {desc.label || k}
                    {input}
                    {getActiveModeIco(e.activeMode)}
                </div>;
            })}
        </section>
    </div>
}

/*************** component registration *****************/

interface OwnProps {
    /* project: Pointer<DProject>;
    user: Pointer<DUser>;*/
}
interface StateProps {
    /*user: LUser,
    display: boolean,
    position: {x: number, y: number},
    node: LGraphElement|null*/
}

interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;



function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    // ret.user = LUser.fromPointer(DUser.current);
    // ret.display = state.Config.display;
    // ret.position = {x: state.Config.x, y: state.Config.y};
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const ConfigConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ConfigComponent);

/*export const Config = (props: OwnProps, childrens: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <ConfigConnected {...{...props, childrens}} />;
}*/
// export const Config = ConfigComponent;
// export default Config;
