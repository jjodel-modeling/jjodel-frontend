import React, {PureComponent, ReactNode} from "react";
import './logger.scss';
import {DataOutputComponent, DDate, Dictionary, GObject, Log, U, UnixTimestamp} from "../../joiner";
import type {LoggerType} from "../../common/U";
import {LoggerCategoryState} from "../../common/U";

// private
class ThisState {
    categoriesActive: Dictionary<LoggerType, boolean> = {l: true, i: true, w: true, e: true, ex: true, eDev: true, exDev: true};
    searchTag: string = '';
    searchTagAsRegExp: boolean = false;
    searchTagIsDeep: boolean = false;
    regexpIsInvalid: boolean = false; // to mark the input as invalid without triggering a Log.e message loop

    // counters to force update. (data source is in Log.messageMapping
    l_counter: number = 0;
    i_counter: number = 0;
    w_counter: number = 0;
    e_counter: number = 0;
    ex_counter: number = 0;
    eDev_counter: number = 0;
    exDev_counter: number = 0;
}
/*interface ThisState
    messages: Dictionary<string, Dictionary<string, any[]>>
    filters: {category: ((cat: string) => boolean) | null, tag: ((tag: string) => boolean) | null, datafilter: ((data: any[]) => boolean) | null};
    id: number;
    minDate: UnixTimestamp;
    maxDate: UnixTimestamp;
}*/

export class LoggerComponent extends PureComponent<AllProps, ThisState>{
    public static cname: string = "LoggerComponent";
    public static loggers: LoggerComponent[] = [];
    private static max_id: number = 0;
    id: number;
    categoryAliases: Partial<Dictionary<LoggerType, LoggerType>>;
    /*public static Log(category: string, key: string, data: any[]): void{
        for (let logger of LoggerComponent.loggers) { logger.log(category, key, data); }
    }*/

    constructor(props: AllProps, context: any) {
        super(props, context);
        this.id =  LoggerComponent.max_id++;
        this.state = new ThisState();
            // minDate: DDate.addYear(new Date(), -1, true).getTime(),
            // maxDate: DDate.addYear(new Date(), +1, true).getTime()};
        LoggerComponent.loggers.push(this);
        Log._loggerComponent = this;

        this.categoryAliases = {l: null as any, ex:"e", exDev:"eDev"};
        // Log.registerLogger(this, Log.e);
    }

    private isCatActive(cat: LoggerType): boolean {
        if (this.categoryAliases[cat] !== undefined/* null must pass! */) cat = this.categoryAliases[cat] as LoggerType;
        return !!this.state.categoriesActive[cat];
    }

    private changeSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.setState({...this.state, searchTag: e.target.value, regexpIsInvalid: false});
    }
    private changeRegexpSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({...this.state, searchTagAsRegExp: e.target.checked});
    }
    private changeDeepSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({...this.state, searchTagIsDeep: e.target.checked});
    }
    /*
    private changeMinDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({...this.state, minDate: new Date(e.target.value).getTime() });

    }
    private changeMaxDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({...this.state, maxDate: new Date(e.target.value).getTime() });
    }*/
    filter(msg: LoggerCategoryState): boolean{
        let s = this.state.searchTagIsDeep ?  msg.long_string : msg.short_string;
        if (this.state.searchTagAsRegExp) {
            try {
                let regexp = new RegExp(this.state.searchTag);
                return regexp.test(s);
            } catch (e: any) {

                // this is to avoid a loop of render-error
                if (!this.state.regexpIsInvalid){
                    this.setState({regexpIsInvalid: true});
                    Log.ee("invalid regular expression in Logger.filter", (e.message || '').split('\n')[0]);
                }
            }
        }
        return s.indexOf(this.state.searchTag) >= 0;
    }

    toggleCat(cat: LoggerType): void{
        this.setState({categoriesActive:{...this.state.categoriesActive, [cat]: !this.state.categoriesActive[cat]}} )
    }
    displayArgs(args: any[], category: LoggerType): ReactNode{
        if (!args) return undefined;
        if (!Array.isArray(args)) args = [args];
        let objs: GObject[] = [];
        let primitives: any[] = [];
        for (let a of args){
            switch(typeof a){
                case "object": case "function": objs.push(a); primitives.push("["+(typeof a)+"_"+(objs.length)+"]"); break;
                case "symbol": primitives.push(a.toString()); break;
                default: primitives.push(a);
            }
        }
        return <div className={"cat cat_"+category}>
            <div className={"text"}>{primitives.join(" ")}</div>
            { objs.map((o,i) => <DataOutputComponent data={o} rootName={""+(typeof o)+"_"+(i+1)+""} />) }
        </div>;
    }

    clearLogs() {
        for (let key in Log.messageMapping) Log.messageMapping[key] = [];
        this.forceUpdate();
        // just need to modify any counter in a way that is different from both curr val and the next counter update
        // this.setState({e_counter: -1});
    }
    render(): ReactNode {
        let key: LoggerType;
        const categoryAliases = this.categoryAliases;
        const labelAliases: Dictionary<string, string> = {i:"Info", w:"Warning", e:"Errors", eDev:"Exceptions"};
        const categories: LoggerType[] = (Object.keys(Log.messageMapping) as LoggerType[]).filter(c => categoryAliases[c] !== null);
        let allMessages: LoggerCategoryState[] = [];
        for (key of categories) {
            if (!this.isCatActive(key)) continue; // U.arrayMergeInPlace(allMessages, Log.messageMapping[key])
            for (let msg of Log.messageMapping[key]) {
                if (this.filter(msg)) allMessages.push(msg);
            }
        }
        allMessages = allMessages.sort((a, b) => a.time - b.time);

        return (<>
            <div>
                <div className={"d-flex search-row p-1"}>
                    <input placeholder={"filter"} className={"form-control search " + (this.state.regexpIsInvalid && "invalid")} type={"search"} value={this.state.searchTag} onChange={ this.changeSearch } />
                    <label className={"checkbox"}>
                        <input className="input" type="checkbox" checked={this.state.searchTagAsRegExp} onChange={this.changeRegexpSearch} />
                        <label>RegExp</label>
                    </label>
                    <label className={"checkbox"}>
                        <input className="input" type="checkbox" checked={this.state.searchTagIsDeep} onChange={this.changeDeepSearch} />
                        <label>Deep</label>
                    </label>
                    <button onClick={e => this.clearLogs()} className={'btn btn-danger ms-1'}>
                        <i className={'p-1 bi bi-trash3-fill'}>Clear</i>
                    </button>
                </div>
                {/*<input label={"from"} type="datetime-local" value={ new Date(this.state.minDate).toString()} onChange={this.changeMinDate} />
                <input label={"to"} type="datetime-local" value={ new Date(this.state.maxDate).toString()} onChange={this.changeMaxDate} /> */}
            </div>
            <div className={"categories"}>
                { categories.filter(cat => !(cat in categoryAliases)).map((cat) => <button className={"btn btn"+(this.isCatActive(cat) && "-outline")+"-danger cat cat_" + cat + (this.isCatActive(cat) ? " active" : " inactive")}
                                                  key={cat} onClick={e=>this.toggleCat(cat)}>{labelAliases[cat] || cat}</button>) }
            </div>
            <ul className={"entries"}>
                { allMessages.map( (msg) => (
                        <li className={"hoverable cat cat_"+msg.category}>
                            {false && <span className={"preview"}>{msg.short_string}</span>}
                            {false && <span className={"content"}>{msg.long_string}</span>}
                            {this.displayArgs(msg.raw_args, msg.category)}
                        </li>))
                }
            </ul>
        </>); }


/*
    public log = (category: string, key: string, data: any[], fullconcat?: string): void => {
        if (!this.state.categoriesActive.hasOwnProperty(category)) {
            this.setState({categoriesActive: { ...this.state.categoriesActive, category: true}});
            const category: GObject = {};
            category[key] = data;
            this.setState({messages: { ...this.state.messages, category} });
        }

        const messages: GObject = { ...this.state.messages};
        messages[category] = messages[category] ? { ...messages[category]} : {};
        messages[category][key] = messages[category][key] ? [ ...messages[category][key], data] : [data];
        this.setState( {messages});
    }// .bind(this);
*/
    componentWillUnmount(): void {
        Log._loggerComponent = null;
        // U.arrayRemoveAll(LoggerComponent.loggers, this);
    }
    componentDidMount() {
        Log._loggerComponent = this;
    }
}

// private
interface OwnProps {
    // propsRequestedFromHtmlAsAttributes: string;
}
// private
interface StateProps {
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
interface DispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type AllProps = OwnProps & StateProps & DispatchProps;

////// mapper func

/*
function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    /// to fill
    return ret; }

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    /// to fill
    return ret; }

export const LoggerComponentConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(LoggerComponent);*/
