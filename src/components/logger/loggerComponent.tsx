import React, {PureComponent, ReactNode} from "react";
import './logger.scss';
import {DataOutputComponent, DDate, Dictionary, GObject, Log, U, UnixTimestamp} from "../../joiner";

// private
interface ThisState {
    messages: Dictionary<string, Dictionary<string, any[]>>
    filters: {category: ((cat: string) => boolean) | null, tag: ((tag: string) => boolean) | null, datafilter: ((data: any[]) => boolean) | null};
    categoriesActive: Dictionary<string, boolean>;
    searchTag: string;
    searchTagAsRegExp: boolean;
    id: number;
    minDate: UnixTimestamp;
    maxDate: UnixTimestamp;
}

export class LoggerComponent extends PureComponent<AllProps, ThisState>{
    public static loggers: LoggerComponent[] = [];
    private static max_id: number = 0;
    public static Log(category: string, key: string, data: any[]): void{
        for (let logger of LoggerComponent.loggers) { logger.log(category, key, data); }
    }

    constructor(props: AllProps, context: any) {
        super(props, context);
        this.state = {
            id: LoggerComponent.max_id++,
            messages: {},
            searchTag: '',
            searchTagAsRegExp: false,
            categoriesActive: {},
            minDate: DDate.addYear(new Date(), -1, true).getTime(),
            maxDate: DDate.addYear(new Date(), +1, true).getTime(),
            filters: {category: null, tag: null, datafilter: null}};
        LoggerComponent.loggers.push(this);
        Log.registerLogger(this, Log.e);
    }

    private isCatActive(cat: string): boolean {
        return !!(this.state.categoriesActive[cat] && this.state.filters.category?.(cat));
    }

    private changeSearchTag = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.setState({...this.state, searchTag: e.target.value});
    }
    private changeRegexpTag = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({...this.state, searchTagAsRegExp: e.target.checked});

    }
    private changeMinDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({...this.state, minDate: new Date(e.target.value).getTime() });

    }
    private changeMaxDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({...this.state, maxDate: new Date(e.target.value).getTime() });
    }

    render(): ReactNode {
        const allCategories: string[] = Object.keys(this.state.messages);
        const activeCategories: string[] = allCategories.filter( cat => this.isCatActive(cat));
        const allTags: string[] = U.arrayUnique(activeCategories.flatMap( (cat) => Object.keys(this.state.messages[cat])))
        const activeTags: string[] = allTags.filter( (tag: string) => (this.state.searchTagAsRegExp ? tag.match(this.state.searchTag) : tag === this.state.searchTag));
        return (<>
            <div>
                <h1>Search by tag</h1>
                <datalist>
                    { allTags.map(tag => <option key={tag} value={tag}>{tag}</option>) }
                </datalist>
                <input list={"#logger_" + this.state.id + "_keylist"} value={this.state.searchTag} onChange={ this.changeSearchTag } />
                {/*<Input label={"as RegExp"} type="checkbox" checked={this.state.searchTagAsRegExp} onChange={this.changeRegexpTag} />
                <input label={"from"} type="datetime-local" value={ new Date(this.state.minDate).toString()} onChange={this.changeMinDate} />
                <input label={"to"} type="datetime-local" value={ new Date(this.state.maxDate).toString()} onChange={this.changeMaxDate} /> */}
            </div>
            <ul className={"categories"}>
                { allCategories.map((cat, i) => <li className={"category cat_"+ i + " " + cat} key={cat} data-active={this.isCatActive(cat)}>{cat}</li>) }
            </ul>
            <ul className={"entries"}>
                {
                    activeCategories.flatMap( (cat) => {
                        return Object.keys(this.state.messages[cat]).map( (tag) => {
                            let entries = this.state.messages[cat][tag]
                            return <li><span className={"tag"}>{tag}</span>{
                                entries.map( (parameter) => <span className="parameter">
                                    <DataOutputComponent data={parameter} rootName={tag} />
                                </span>)
                            }</li>;
                        });
                    })
                }
            </ul>
        </>); }



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

    componentWillUnmount(): void {
        U.arrayRemoveAll(LoggerComponent.loggers, this);
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
