import {
    DEdge,
    DGraphElement,
    Dictionary,
    DState,
    GObject, Info,
    LGraphElement,
    LModelElement,
    Log,
    LPointerTargetable,
    LViewElement,
    Pointer,
    RuntimeAccessibleClass,
    transientProperties,
    U,
    windoww
} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import React, {Component, Dispatch, JSX, PureComponent, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';

import './style.scss'; // <-- tenuto per retro-compatibilità ma dovrebbe sparire
import './editors.scss'; // <-- stile comune a tutte le tab editor (idealmente da tenere leggero)
import './console.scss'; // <-- stile di questa tab (old styles, kept for compatibility)
import './Console/console-tab.scss'; // <-- new Console v2 styles
import ReactDOM from "react-dom";
import {Empty} from "./Empty";
import {Tooltip} from "../forEndUser/Tooltip";

import { createRoot } from "react-dom/client";
import {hiddenkeys} from "../../joiner/proxy";
import Convert from 'ansi-to-html';
import { UpgradePrompt } from '../ModeSystem';

// Import new Console components
import { ConsoleInput } from './Console/ConsoleInput';
import { ConsoleHistory } from './Console/ConsoleHistory';
import { ConsoleToolbar } from './Console/ConsoleToolbar';
import { CollapsibleContextKeys } from './Console/CollapsibleContextKeys';
import { CollapsibleShortcuts } from './Console/CollapsibleShortcuts';
import type { ConsoleEntryData } from './Console/ConsoleEntry';
import { SimpleFooterResizeHandle } from '../SimpleFooterResizeHandle';

let ansiConvert = (window as any).ansiConvert;
if (!ansiConvert) (window as any).ansiconvert = ansiConvert = new Convert();

class ThisState{
    expression: string = '';
    output: any = null;
    expressionIndex: number = 0;
    expressionHistory: string[] = [''];
    initialState: boolean = true;
    time: number = 0;
    // New state for improved console
    entries: ConsoleEntryData[] = [];
    // Footer resize state
    footerHeight: number = 200; // Default footer height
}

// trasformato in class component così puoi usare il this nella console. e non usa accidentalmente window come contesto

function fixproxy(output: any/*but not array*/, addDKeys: boolean = true, addLKeys: boolean = true):
    { output: any, shortcuts?: GObject<'L singleton'>, comments?: Dictionary<string, string | {type:string, txt:string}>} {

    let ret: ReturnType<typeof fixproxy> = {output};
    if (!output) return ret;

    let proxy: LPointerTargetable | undefined;
    if (output?.__isProxy) {
        proxy = output;
        output = output.json; //.__raw; Object.fromEntries(Object.getOwnPropertyNames(p).map(k => [k, p[k]]));
    } else proxy = undefined;

    console.log('console short in 1', {output, proxy, ret, addLKeys, iff:addLKeys && proxy});

    switch (typeof output) {
        case "function": {
            let fdata =  U.buildFunctionDocumentation(output);
            return {output: fdata};
        }
        default: return ret;
        case "object":
            // if (Array.isArray(output)) { ret.output = output; break; /* no need to go inside, it is already done at render phase */ }
            ret.output = output = {...output};
            // if (ret.output.anchors) ret.output.anchors = JSON.stringify(ret.output.anchors);
            if (addLKeys && proxy) {
                let Lsingleton: GObject<'L singleton'> = (RuntimeAccessibleClass.get(output?.className)?.logic?.singleton) || {};
                let comments: Dictionary<string, string | {type:string, txt:string}> = {};
                ret.shortcuts = {...Lsingleton};
                console.log('console short in 2', {output, rett:{...ret, shortt:{...(ret.shortcuts||{})}}, Lsingleton, DClass:RuntimeAccessibleClass.get(output?.className), LClass:RuntimeAccessibleClass.get(output?.className)?.logic});
                ret.comments = comments;
                for (let key in output) {
                    if (Lsingleton["__info_of__" + key]) comments[key] = Lsingleton["__info_of__" + key];
                }
                for (let key in Lsingleton) {
                    if ((key in output) || (key.indexOf("__info_of__") === 0)) {
                        delete ret.shortcuts[key];
                        continue;
                    } else { if (ret.shortcuts[key] === undefined) ret.shortcuts[key] = ''; }
                    if (key.indexOf("info") >=0 && key.indexOf("of") >=0){
                        Log.eDevv('Possible error on __info_of__ misnamed as '+key+', if the name was intentional' +
                            ' and not an Info object add an allowal rule here.');
                        continue;
                    }
                    if (Lsingleton["__info_of__" + key]) comments[key] = Lsingleton["__info_of__" + key];
                    if (comments[key]) continue; // if explicitly commented, i will not attempt to generate documentation.
                    let entryvalue = Lsingleton[key];
                    switch (typeof entryvalue) {
                        default:
                        case "object":
                            ret.shortcuts[key] = entryvalue;
                            break;
                        case "function":
                            ret.shortcuts[key] = U.buildFunctionDocumentation(entryvalue);
                            break;
                    }
                }
                console.log('console short in 3', {ret});

            }
            break;
    }

    return ret;
}


class ConsoleComponent extends PureComponent<AllProps, ThisState>{
    public static cname: string = "ConsoleComponent";
    lastNode?: Pointer<DGraphElement>;
    constructor(props: AllProps) {
        super(props);
        // Load footer height from localStorage
        const storedHeight = localStorage.getItem('jjodel_console_footer_height');
        const footerHeight = storedHeight ? parseInt(storedHeight, 10) : 200;

        const state = new ThisState();
        state.footerHeight = !isNaN(footerHeight) && footerHeight >= 100 && footerHeight <= 400 ? footerHeight : 200;

        this.state = state;
        this.handleExecute = this.handleExecute.bind(this);
        this.handleClearConsole = this.handleClearConsole.bind(this);
        this.handleInsertContextKey = this.handleInsertContextKey.bind(this);
        this.handleInsertCode = this.handleInsertCode.bind(this);
        this.handleFooterHeightChange = this.handleFooterHeightChange.bind(this);
    }
    private _context: GObject = {};

    // Footer resize handlers
    // Footer resize handler - called by SimpleFooterResizeHandle
    private handleFooterHeightChange(height: number): void {
        this.setState({ footerHeight: height });
        localStorage.setItem('jjodel_console_footer_height', height.toString());
    }

    // Generate unique ID for console entries
    private generateEntryId(): string {
        return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Handle special commands
    private handleCommand(command: string): { output: string; isError: boolean; isHelp?: boolean } | null {
        const cmd = command.toLowerCase().trim();

        // /clear - Clear console
        if (cmd === '/clear' || cmd === '/cls') {
            this.handleClearConsole();
            return null; // Don't add to history
        }

        // /help - Show available commands (with clickable commands)
        if (cmd === '/help' || cmd === '/commands') {
            return { output: '', isError: false, isHelp: true };
        }

        // /history - Show command history
        if (cmd === '/history') {
            const history = this.state.expressionHistory.filter(h => h.trim() !== '');
            if (history.length === 0) {
                return { output: 'No command history yet.', isError: false };
            }
            const historyText = history.map((h, i) => `${i + 1}. ${h}`).join('\n');
            return { output: `Command History:\n${historyText}`, isError: false };
        }

        // /context - Show available context keys
        if (cmd === '/context') {
            const contextKeysInfo = `Available Context Keys:

Model Data:
  data            - Current metamodel/model data
  packages        - All packages in the model
  classes         - All classes in the model
  enumerations    - All enumerations in the model

Selection:
  node            - Currently selected node
  selection       - Array of selected elements
  selectedId      - ID of selected element

View & UI:
  view            - Current view configuration
  zoom            - Current zoom level
  canvas          - Canvas dimensions and state

Component:
  component       - React component instance
  state           - Component state
  props           - Component props

Utilities:
  _               - Lodash utility library
  U               - Jjodel utility functions

Tip: Click any key in the "Context Keys" section below to insert it into the console.`;
            return { output: contextKeysInfo, isError: false };
        }

        // /examples - Show usage examples
        if (cmd === '/examples') {
            const examples = `Usage Examples:

Basic Queries:
  data.classes              - Get all classes
  data.packages             - Get all packages
  node                      - Current selected node

Finding Elements:
  data.classes.find(c => c.name === "MyClass")
  data.classes.filter(c => c.abstract)

Counting & Aggregation:
  data.classes.length
  data.classes.reduce((sum, c) => sum + c.attributes.length, 0)

Transformation:
  data.classes.map(c => c.name)
  JSON.stringify(data, null, 2)`;
            return { output: examples, isError: false };
        }

        // /shortcuts - Show keyboard shortcuts
        if (cmd === '/shortcuts') {
            const shortcuts = `Keyboard Shortcuts:

Command Execution:
  Enter                  - Execute current command
  Shift+Enter            - Insert new line (multi-line mode)
  Ctrl/Cmd+Enter         - Execute (alternative)

History Navigation:
  ↑ (Arrow Up)           - Previous command in history
  ↓ (Arrow Down)         - Next command in history

Autocomplete:
  Tab                    - Accept suggestion
  Esc                    - Dismiss suggestions

Editing:
  Ctrl/Cmd+A             - Select all text
  Ctrl/Cmd+C             - Copy selected text
  Ctrl/Cmd+V             - Paste text
  Ctrl/Cmd+Z             - Undo

Console Management:
  Ctrl/Cmd+L             - Clear console
  Esc (when empty)       - Clear input field

Tip: Click the keyboard icon in the toolbar for quick reference.`;
            return { output: shortcuts, isError: false };
        }

        // Unknown command
        if (cmd.startsWith('/')) {
            return { output: `Unknown command: ${cmd}\nType /help to see available commands.`, isError: true };
        }

        return null; // Not a command, execute as JavaScript
    }

    // Handle code execution
    private handleExecute(code: string): void {
        if (!code.trim()) return;

        // Check if it's a special command
        if (code.trim().startsWith('/')) {
            const commandResult = this.handleCommand(code.trim());

            if (commandResult === null) return; // Command handled without output (like /clear)

            // Add command entry
            const commandEntry: ConsoleEntryData = {
                id: this.generateEntryId(),
                type: 'command',
                timestamp: new Date(),
                content: code,
                input: code
            };

            // Add result entry
            let resultEntry: ConsoleEntryData;

            if (commandResult.isHelp) {
                // Help command with clickable commands
                resultEntry = {
                    id: this.generateEntryId(),
                    type: 'help',
                    timestamp: new Date(),
                    content: '',
                    input: code,
                    collapsed: false,
                    onCommandClick: (cmd: string) => this.handleExecute(cmd)
                };
            } else {
                // Regular command output
                resultEntry = {
                    id: this.generateEntryId(),
                    type: commandResult.isError ? 'error' : 'info',
                    timestamp: new Date(),
                    content: commandResult.output,
                    input: code,
                    collapsed: false
                };
            }

            this.setState(prevState => ({
                entries: [commandEntry, resultEntry, ...prevState.entries], // Prepend for reverse chronological order
                expression: '',
                expressionHistory: [...prevState.expressionHistory, code],
                expressionIndex: prevState.expressionHistory.length
            }));

            return;
        }

        // Add command entry
        const commandEntry: ConsoleEntryData = {
            id: this.generateEntryId(),
            type: 'command',
            timestamp: new Date(),
            content: code,
            input: code
        };

        // Execute JavaScript code
        let output: any;
        let hasError = false;

        try {
            const expression = code.trim() === 'this' ? 'data' : code;
            if (expression === 'this') output = this._context;
            else output = U.evalInContextAndScope(expression, this._context, this._context);
        } catch (e: any) {
            console.error("console error", e);
            output = e.toString();
            hasError = true;
        }

        // Process output
        let contentStr: string;
        try {
            const processed = fixproxy(output);
            const finalOutput = processed.output;

            if (typeof finalOutput === 'object' && finalOutput !== null) {
                contentStr = JSON.stringify(finalOutput, null, 2);
            } else {
                contentStr = String(finalOutput);
            }
        } catch (e: any) {
            contentStr = '[Error formatting output]: ' + e.toString();
            hasError = true;
        }

        // Add result entry
        const resultEntry: ConsoleEntryData = {
            id: this.generateEntryId(),
            type: hasError ? 'error' : 'result',
            timestamp: new Date(),
            content: contentStr,
            input: code,
            collapsed: false
        };

        // Update state - prepend for reverse chronological order (newest at top)
        this.setState(prevState => ({
            entries: [commandEntry, resultEntry, ...prevState.entries],
            expression: '',
            expressionHistory: [...prevState.expressionHistory, code],
            expressionIndex: prevState.expressionHistory.length
        }));

        // Set native console variables for debugging
        this.setNativeConsoleVariables();
        windoww.output = output;
    }

    // Clear all console entries
    private handleClearConsole(): void {
        this.setState({
            entries: [],
            expression: '',
            expressionHistory: [''],
            expressionIndex: 0
        });
    }

    // Toggle collapse state of an entry
    private handleToggleCollapse(id: string): void {
        this.setState(prevState => ({
            entries: prevState.entries.map(entry =>
                entry.id === id ? { ...entry, collapsed: !entry.collapsed } : entry
            )
        }));
    }

    // Delete a specific entry
    private handleDeleteEntry(id: string): void {
        this.setState(prevState => ({
            entries: prevState.entries.filter(entry => entry.id !== id)
        }));
    }

    // Insert context key into input
    private handleInsertContextKey(key: string): void {
        this.setState(prevState => ({
            expression: prevState.expression ? `${prevState.expression}.${key}` : key
        }));
    }

    // Insert code snippet into input
    private handleInsertCode(code: string): void {
        this.setState({ expression: code });
    }
    // Update eval context when node changes
    private updateContext(): void {
        const nid = this.props.node?.id;
        const tn = transientProperties.node[nid as string];
        if (nid && tn) {
            this._context = {...tn.viewScores[tn.mainView.id].evalContext};
            this._context.fromcomponent = true;
        } else {
            this._context = {...this.props, props: this.props};
        }
    }

    // Add keyboard shortcut handler
    componentDidMount(): void {
        document.addEventListener('keydown', this.handleKeyboardShortcuts);
    }

    componentWillUnmount(): void {
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
    }

    private handleKeyboardShortcuts = (e: KeyboardEvent): void => {
        // Ctrl/Cmd + L to clear console
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            this.handleClearConsole();
        }
    };

    render(){
        if (!this.props.node) return <Empty msg={"Select a node."} />;

        const data = this.props.data;
        const advanced = this.props.advanced;

        // Update context when node changes
        if (this.lastNode !== this.props.node.id) {
            this.updateContext();
            this.lastNode = this.props.node.id;
        }

        // Update context on every render to ensure it's fresh
        this.updateContext();

        // Get context keys for autocomplete and collapsible section
        const objraw = this._context.data || {};
        let contextkeysarr: string[] = [];

        if (this.state.expression.trim() === "") {
            contextkeysarr = ["data", "node", "view", "component"];
        } else if (typeof objraw === "string") {
            contextkeysarr = Object.keys(String.prototype);
        } else if (Array.isArray(objraw)) {
            contextkeysarr = [
                ...(Object.keys(objraw) as any as number[])
                    .filter(k => k <= 10)
                    .map(k => k === 10 ? '...' : '' + k),
                ...Object.keys(Array.prototype)
            ];
        } else {
            contextkeysarr = Object.getOwnPropertyNames(objraw) || [];
        }

        // Set native console variables for debugging
        this.setNativeConsoleVariables();

        return (
            <div className="console-tab-v2">
                {/* Header */}
                <div className="console-header">
                    <h2 className="console-header__title">
                        <i className="bi bi-terminal" />
                        <span>Console</span>
                    </h2>
                    <span className="console-header__subtitle">
                        On {((data as GObject)?.name || "model-less node (" + this.props.node?.className + ")") + " - " + this.props.node?.className}
                    </span>
                </div>

                {/* Toolbar */}
                <ConsoleToolbar
                    onClear={this.handleClearConsole}
                    onCopyAll={(entries) => {
                        const allOutput = entries
                            .filter(e => e.type === 'result' || e.type === 'error')
                            .map(e => e.content)
                            .join('\n\n---\n\n');
                        U.clipboardCopy(allOutput, () => {
                            Tooltip.show('All output copied to clipboard', undefined, undefined, 2);
                        });
                    }}
                    entries={this.state.entries}
                    historyCount={this.state.expressionHistory.length - 1}
                />

                {/* Console Body */}
                <div className="console-body">
              <ConsoleHistory
    entries={this.state.entries}
    onToggleCollapse={(id) => this.handleToggleCollapse(id)}
    onDeleteEntry={(id) => this.handleDeleteEntry(id)}
    onExecuteCode={this.handleExecute}
/>
                </div>

                {/* Footer Resize Handle - SimpleFooterResizeHandle */}
                <SimpleFooterResizeHandle
                    onHeightChange={this.handleFooterHeightChange}
                    currentHeight={this.state.footerHeight}
                    minHeight={100}
                    maxHeight={400}
                    containerSelector=".console-tab-v2"
                />

                {/* Input Area */}
                <div className="console-input-wrapper">
                    <ConsoleInput
                        value={this.state.expression}
                        onChange={(value) => this.setState({ expression: value })}
                        onExecute={this.handleExecute}
                        history={this.state.expressionHistory.filter(h => h.trim() !== '')}
                        contextKeys={contextkeysarr}
                    />
                </div>

                {/* Footer - Collapsible Sections */}
                <div className="console-footer" style={{ maxHeight: `${this.state.footerHeight}px` }}>
                    <CollapsibleContextKeys
                        contextKeys={contextkeysarr.sort()}
                        onInsertKey={this.handleInsertContextKey}
                    />

                    <CollapsibleShortcuts
                        onInsertCode={this.handleInsertCode}
                        advanced={advanced}
                    />

                    {/* Upgrade prompt for Basic mode users */}
                    {!advanced && (
                        <UpgradePrompt
                            features={[
                                'Access code shortcuts for common operations',
                                'View advanced debugging tools',
                                'Export console history'
                            ]}
                        />
                    )}
                </div>
            </div>
        )
    }

    private setNativeConsoleVariables(): void { // just fordebugging
        let context = this._context;
        windoww.context = context;
        windoww.data = context.data;
        windoww.node = context.node;
        windoww.edge = context.edge;
        windoww.output = this.state.output;
        if (context.data?.model) windoww.model = context.data?.model;
    }
}

interface OwnProps {}
interface StateProps {
    data: LModelElement|null;
    node: LGraphElement|null;
    view: LViewElement|null;
    advanced: boolean;
}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const nodeid = state._lastSelected?.node;
    const node: LGraphElement|null = (nodeid) ? LGraphElement.fromPointer(nodeid) : null;
    ret.node = node;
    ret.data = (node?.model) ? node.model : null;
    ret.view = (node?.view) ? node.view : null;
    ret.advanced = state.advanced;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const ConsoleConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ConsoleComponent);

export const Console = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <ConsoleConnected {...{...props, children}} />;
}
export default Console;
