import React, {Component, Dispatch, ReactElement, ReactNode, useRef, useState} from 'react';
import {connect} from 'react-redux';
import {
    Debug,
    Dictionary,
    GObject, Input,
    Pointer, RuntimeAccessible, Select, SetRootFieldAction, TextArea,
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
import {Tooltip} from "../forEndUser/Tooltip";
import {ProxyCache} from "../../joiner/ProxyCache";
import {setInterfaceMode} from "../../hooks/useInterfaceMode";

class ConfigEntry<T>{
    userValue: T;
    projectValue: T;
    defaultValue: T;
    activeMode: "user" | "project";
    activeValue!: T;
    constructor(v: T, mode: "user" | "project" = "user") {
        this.defaultValue = v;
        this.userValue = v;
        this.projectValue = v;
        this.activeMode = mode;
        this.activeValue = v;
    }
}
type CacheModes = "dependency" | "global" | "both" | "none"
const cacheLabels: Dictionary<CacheModes, string> = {
    global: "Global-change only",
    dependency: "Dependency-based only",
    both: "Both cache levels (recommended)",
    none: "Disabled completely",
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
    potatoMode = new ConfigEntry(false);
    exportMetaData = new ConfigEntry(true);
    exportNodeData = new ConfigEntry(true);
    cache = new ConfigEntry("both" as CacheModes);

    static get(): Config {
        if (Config.config) return Config.config;
        else return Config.load();
    }

    constructor(props: OwnProps = {} as any){ super(props); }

    updateFinalValues(): void { this.getFinalValues(); return }

    getFinalValues(): Dictionary<keyof Config, boolean> {
        const ret: Dictionary<keyof Config, boolean> = {} as any;
        TRANSACTION("update config", () => {

            // console.log("Config get final values", {t:this, delay:{...this.synchDelay}});
            for (let k0 in this) {
                const k: keyof Config = k0 as any;
                const e = this[k] as any as ConfigEntry<any>;
                if (!e || typeof e !== "object" || !("defaultValue" in e)) continue;
                const v = ret[k] = e.activeValue = (e.activeMode  === "project" ? e.projectValue : e.userValue);
                // console.log("Config get final values loop", {k, t:this, delay:{...this.synchDelay}});
                switch (k) {
                    case "liveStateChanges": U.liveStateChanges = v; break;
                    case "cache":
                        ProxyCache.enabled = true;
                        switch (v as CacheModes) {
                            case "both":       ProxyCache.globalEnabled = true;  ProxyCache.dependencyEnabled = true;  break;
                            case "global":     ProxyCache.globalEnabled = true;  ProxyCache.dependencyEnabled = false; break;
                            case "dependency": ProxyCache.globalEnabled = false; ProxyCache.dependencyEnabled = true;  break;
                            case "none":       ProxyCache.globalEnabled = false; ProxyCache.dependencyEnabled = false; ProxyCache.enabled = false; break;
                        }
                        break;
                    case "potatoMode": Debug.lightMode = true; break;
                    case "synchDelay": U.UpdatingTimer = v; break;
                    case "debugMode": SetRootFieldAction.new("debug", v); U.debug = v; break;
                    case "advancedMode": SetRootFieldAction.new("advanced", v); setInterfaceMode(v ? "advanced" : "basic"); break;
                    case "exportMetaData": U.storeMetadata = v; break;
                    case "exportNodeData": U.storeNodeData = v; break;
                    // case "placeholder": U.placeholder = v; break;
                }
            }
            SetRootFieldAction.new("forceRefresh", Date.now());
        })


        return ret;
    }

    apply(): void {
    }
    static load(): Config {
        // the timeout is required because:
        // 1) i need DUser.current to be load.
        // 2) afterwards, i need to wait all static fields to load:
        // if i call it on 2° static field and set the third, after function call the third will be re-initialized to undefined.
        /// could fix by placing it at last static member, but it would break if i add one more afterwards and forget this behavior.
        if (!DUser.current) setTimeout(Config.load, 100);
        else setTimeout(Config.load0, 100);
        return null as any;
    }
    static load0(): Config {
        Config.userStorageKey = "_jj_config_user_" + DUser.current;
        Config.projectStorageKey =  "_jj_config_project_" + U.getProjectID_URL();
        // console.warn("config load", {u:Config.userStorageKey, p:Config.projectStorageKey})


        const uConfig: Partial<Config> = JSON.parse(localStorage.getItem(Config.userStorageKey) || "{}");
        const pConfig: Partial<Config> = JSON.parse(localStorage.getItem(Config.projectStorageKey) || "{}");
        const ret = new Config();
        Config.config = ret;
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

        ret.updateFinalValues();
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
            delete v.activeValue;
        }
        // save user config: remove default non-changed properties first and strip project part
        for (k in userConfig) {
            const v: ConfigEntry<any> = userConfig[k] as any;
            if (typeof v !== "object" || !v || !("defaultValue" in v)) delete userConfig[k];
            // asymmetric by design: activeMode is stored only in projectConfig and only if !== "user" (default mode)
            if (v.userValue === v.defaultValue /*&& v.activeMode === "project"*/) delete userConfig[k];
            delete v.defaultValue;
            delete v.projectValue;
            delete v.activeValue;
        }

        // console.warn("save config", {userConfig, projectConfig});
        localStorage.setItem(Config.userStorageKey, JSON.stringify(userConfig));
        localStorage.setItem(Config.projectStorageKey, JSON.stringify(projectConfig));
    }


    // value undefined: not set and only change activeMode
    // value null: reset to default
    static set<K extends keyof Config>(k: K, v: any /*Config[K]["activeValue"] | undefined | null*/, mode?: "project" | "user"): void {
        const config = Config.get();
        let entry = config[k] as ConfigEntry<any>;
        // console.warn("set config", {k, v, mode, entry: {...entry}});
        if (mode) entry.activeMode = mode;
        else mode = entry.activeMode;
        if (v !== undefined) {
            if (v === null) v = entry.defaultValue;
            if (mode === "project") entry.projectValue = v as any;
            else entry.userValue = v as any;
        }
        if (k === "liveStateChanges") {
            let newSynch  = Config.get().synchDelay.activeValue;
            if (v) newSynch /= 2;
            else newSynch *= 2;
            // console.warn("set synch ", {newSynch, old:Config.get().synchDelay.activeValue, v, vv:!!v});
            // small bug here: occasionally the synchDelay is always doubling when i change liveSTateChanges, but it's not so important.
            Config.set("synchDelay", newSynch);
        }
        else config.updateFinalValues();
        Config.save(config);
    }

    // double-use as class & component to avoid similar naming duplication.
    // other mid-steps (ConfigComponent, ConfigConnected) should be "private" (not be exported) to keep external context clean
    render(){
        return <ConfigConnected {...this.props} />
    }
}

class Desc{
    constructor(public k: keyof Config, public type: string | ReactNode = "text", public label: ReactNode = null, public tooltip: ReactNode = null) {}
}
function getActiveModeIco(k: keyof Config, mode: "user" | "project" = "user", header: boolean = false) {
    const tooltip = "Switch between User and Project configuration";
    const label = U.camelCase(mode);
    // if (k === "synchDelay") console.warn("active mode ico update", {k, mode, header});
    const reverseMode = mode === "user" ? "project" : "user";
    // return <span className={"switch-mode data-" + mode} data-mode={mode}>{mode[0].toUpperCase()}</span>;
    return <Tooltip tooltip={tooltip} inline={true} position={"top"}><button type="button" key={(header? "_h" : k)+Date.now()}
        onClick={()=> { if (header) return; Config.set(k, undefined, reverseMode); }}
        className={"switch-mode data-"+mode + (header ? " header" : "")} aria-label={tooltip} style={header ? {cursor:"pointer"} : undefined}>
        {header ? "Scope" : <span className="switch-mode__track">
            <span className={"switch-mode__option switch-mode__option--"+mode}>{label}</span>
            <span className="switch-mode__thumb"></span>
            <svg className="switch-mode__icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path fill="currentColor"
                      d="M7 7h11l-2.5-2.5L17 3l5 5-5 5-1.5-1.5L18 9H7zm10 10H6l2.5 2.5L7 21l-5-5 5-5 1.5 1.5L6 15h11z"/>
            </svg>
        </span>}
    </button></Tooltip>
}

function onClose(){
    TRANSACTION("close Config popup", () => SetRootFieldAction.new("showConfig", false));
}
function ConfigComponent(props: AllProps) {
    if (!props.show) return null;
    // console.warn("config component refresh", props);
    // const [modes, setModes] = useState("user" as "user" | "project"); // make it option-wide instead of a global switch so i can override just 1
    // const ucMode = U.camelCase(mode);
    const config: Config = Config.get();
    const descriptions: Desc[] = [
        new Desc("synchDelay", "number", <span>Synchronization delay</span>, <div>Interval between collaborative
            synchronization emission (reception has no delay).
            <br/>Also used to compact multiple temporally close actions in a single undo-able step, similar to a TRANSACTION, to avoid cluttering the history.
            <br/>User-defined event chains or simulation loops can trigger multiple actions at once and easily clutter the history with low values of synchDelay.</div>),
        new Desc("advancedMode", "switch", <span>Advanced mode</span>, <div>Whether to show or hide some advanced features. Disabling it keeps the interface cleaner.</div>),
        new Desc("liveStateChanges", "switch", <span>Live state changes</span>, <span>The actual state is always updated only after an interval of "synchDelay",
            <br/>Any change will be invisible until the next tick. If an exception occur it will discard pending changes, rolling back at the previous "synchDelay" checkpoint state.
            <br/>If this option is on, queries on the model will reply with the pending value instead of the persistent value.
            <br/>Recommended on, it improves for UI/API responsiveness while keeping a transaction-based operation style.
            <br/>Read the documentation for finer behavioural details.</span>),
        new Desc("debugMode", "switch", <span>Debug mode</span>,
            <div>Meant to be used only be developers or by users under developer guidance for finer control and debug.<br/>High performance impact.</div>),
        new Desc("potatoMode", "switch", <span>Potato mode</span>, <div>Disables some features and nested views to drastically improve performances.
             <br/>Useful in very large models or old pc's.</div>),

        new Desc("cache", <optgroup label = "cache status">{
            (Object.keys(cacheLabels) as CacheModes[]).map((k)=> <option value={k}>{cacheLabels[k]}</option>)}
        </optgroup>,
            <span>Cache levels</span>, <div>jJodel has 2 level of caches:
            <br/>One invalidated when a dependency of a property changes. eg: obj.name invalidated if the object is renamed.
            <br/>The second ("global") is faster, but invalidated at every edit in the project.</div>),
        new Desc("exportMetaData", "switch", <span>Export metadata in annotations</span>, <div>When exporting to ecore, include jJodel-only properties of the model in annotations.</div>),
        new Desc("exportNodeData", "switch", <span>Export layout data in annotations</span>, <div>When exporting to ecore, include graph layout properties in annotations.</div>),
        // new Desc("placeholder", "placeholder", <span>name_placeholder</span>, <div>tooltip_placeholder</div>),
        // new Desc("placeholder", "placeholder", <span>name_placeholder</span>, <div>tooltip_placeholder</div>),
        // new Desc("placeholder", "placeholder", <span>name_placeholder</span>, <div>tooltip_placeholder</div>),
    ];

    for (let k0 in config) {
        const k: keyof Config = k0 as any;
        const v = config[k] as ConfigEntry<any>;
        if (!v || typeof v !== "object" || !("defaultValue" in v)) continue;
        switch (k) {
            // @ts-ignore
            case "stuff i want to explicitly ignore and not list in GUI": break;
            default:
                if (!descriptions.find(e=> e.k === k)) Log.eDevv("Missing a configuration entry in GUI.", k);
                break;
        }
    }
    return <div className={'config-popup'} id={"config-popup"}>
        <section className={"config"}>
            <h3>Configuration
                <button
                    type="button"
                    className="config-popup-close"
                    onClick={onClose}
                    title="Close (ESC)"
                >
                    <i className="bi bi-x-lg" />
                </button>
            </h3>
            {descriptions.map((desc, i) => {
                const k = desc.k;
                const e = config[k] as ConfigEntry<any>;
                // if (k === "synchDelay") console.warn("update description", {e, k, i, desc});

                if (!e || typeof e !== "object" || !("defaultValue" in e)) return null;
                let input: ReactNode = null;
                const getter = ()=> { return e.activeMode === "user" ? e.userValue : e.projectValue; };
                const setter = (v: any)=> {
                    const v0 = v;
                    const type = desc.type;
                    if (typeof type === "string") switch (type) {
                        case "string": break;
                        case "number": v = +v; break;
                        case "bool": case "boolean": case "switch": case "checkbox": case "toggle": v = !!v; break;
                        default: Log.eDevv("Config setter found unexpected type:", {type, k, v}); return;
                    }
                    // console.log("Config setter", {k, v, v0, type});
                    Config.set(k, v);
                };
                if (desc.type && typeof desc.type === "object") input = <Select getter={getter} setter={setter} options={desc.type}/>
                else switch (desc.type) {
                    case "textarea": input = <TextArea getter={getter} setter={setter} />; break;
                    default:
                        input = <Input type={desc.type as any}
                                       getter={getter}
                                       setter={setter} />; break;
                }
                const first = i !== 0 ? null : <div className="config-entry header" data-name={k} key={"header"}>
                    <div className="config-entry-inner">
                        <span className={"header label"}>Property</span>
                        <span className={"header"}>Value</span>
                    </div>
                    {getActiveModeIco(k, "user", true)}
                </div>;
                const entry = <div className="config-entry" data-name={k} key={k}>
                    <Tooltip tooltip={desc.tooltip} inline={true} position={"bottom"}><div className="config-entry-inner">
                        <span className={"label"}>{desc.label || k}</span>
                        <label className={"config-input-wrap"}>{input}</label>
                    </div></Tooltip>
                    {getActiveModeIco(k, e.activeMode)}
                </div>;
                if (first) return [first, entry];
                return [entry];
            }).flat()}
        </section>
    </div>
}

/*************** component registration *****************/

interface OwnProps {
    /* project: Pointer<DProject>;
    user: Pointer<DUser>;*/
}
interface StateProps {
    show: boolean;
    updateCount?: number;
    /*user: LUser,
    display: boolean,
    position: {x: number, y: number},
    node: LGraphElement|null*/
}

interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;



function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.show = state.showConfig;
    ret.updateCount = state.clonedCounter;
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
