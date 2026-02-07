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
import type { ConsoleLanguage } from './Console/LanguageToggle';

// Import JjEL for expression evaluation
import { jjelEval } from '../../jjel';

let ansiConvert = (window as any).ansiConvert;
if (!ansiConvert) (window as any).ansiconvert = ansiConvert = new Convert();

/**
 * Safe JSON.stringify that handles circular references and depth limits.
 * Prevents infinite loops when serializing Jjodel proxy objects.
 */
function safeStringify(obj: any, maxDepth: number = 20): string {
    const seen = new WeakSet();
    let iterationCount = 0;
    const maxIterations = 10000; // Safety limit

    function replacer(key: string, value: any, depth: number): any {
        iterationCount++;
        if (iterationCount > maxIterations) {
            console.error('[safeStringify] Max iterations exceeded at key:', key, 'depth:', depth);
            return '[Max iterations exceeded]';
        }

        // Log progress every 1000 iterations
        if (iterationCount % 1000 === 0) {
            console.log('[safeStringify DEBUG] iterations:', iterationCount, 'depth:', depth, 'key:', key);
        }

        // Handle primitives
        if (value === null || typeof value !== 'object') {
            return value;
        }

        // Depth limit check
        if (depth > maxDepth) {
            return '[Max depth exceeded]';
        }

        // Circular reference check
        if (seen.has(value)) {
            return '[Circular]';
        }

        // Skip proxy internals and hidden keys
        if (key.startsWith('__') || key === '_proxied') {
            return '[Internal]';
        }

        seen.add(value);

        // Handle arrays
        if (Array.isArray(value)) {
            if (value.length > 50) {
                // Truncate large arrays
                const truncated = value.slice(0, 50).map((item, i) =>
                    replacer(String(i), item, depth + 1)
                );
                truncated.push(`... and ${value.length - 50} more items`);
                return truncated;
            }
            return value.map((item, i) => replacer(String(i), item, depth + 1));
        }

        // Handle objects
        const result: Record<string, any> = {};
        let keys: string[];
        try {
            keys = Object.keys(value);
        } catch (e) {
            return '[Error getting keys]';
        }

        // Limit number of keys for very large objects
        const maxKeys = 50;
        const keysToProcess = keys.slice(0, maxKeys);

        for (const k of keysToProcess) {
            // Skip known problematic proxy keys
            if (k.startsWith('__') || k === '_proxied' || k === 'json' || k === '__raw') {
                result[k] = '[Skipped]';
                continue;
            }

            try {
                const propValue = value[k];
                // Skip functions and symbols
                if (typeof propValue === 'function' || typeof propValue === 'symbol') {
                    result[k] = `[${typeof propValue}]`;
                } else {
                    result[k] = replacer(k, propValue, depth + 1);
                }
            } catch (e) {
                result[k] = '[Error accessing property]';
            }
        }

        if (keys.length > maxKeys) {
            result['...'] = `${keys.length - maxKeys} more properties`;
        }

        return result;
    }

    try {
        console.log('[safeStringify DEBUG] Starting...');
        const processed = replacer('', obj, 0);
        console.log('[safeStringify DEBUG] Processing done, total iterations:', iterationCount);
        const jsonStr = JSON.stringify(processed, null, 2);
        console.log('[safeStringify DEBUG] JSON.stringify done');
        return jsonStr;
    } catch (e) {
        console.error('[safeStringify DEBUG] Error:', e);
        return `[Stringify error: ${e}]`;
    }
}

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
    // Language toggle state
    language: ConsoleLanguage = 'js';
}

// trasformato in class component così puoi usare il this nella console. e non usa accidentalmente window come contesto

function fixproxy(output: any/*but not array*/, addDKeys: boolean = true, addLKeys: boolean = true):
    { output: any, shortcuts?: GObject<'L singleton'>, comments?: Dictionary<string, string | {type:string, txt:string}>} {

    console.log('[fixproxy DEBUG] Starting, type:', typeof output, 'isArray:', Array.isArray(output));

    let ret: ReturnType<typeof fixproxy> = {output};
    if (!output) return ret;

    // Handle arrays of proxies
    if (Array.isArray(output)) {
        console.log('[fixproxy DEBUG] Processing array of', output.length, 'items');
        // Don't try to convert each proxy in the array - just return simplified info
        const simplified = output.slice(0, 50).map((item, i) => {
            if (item?.__isProxy) {
                try {
                    // Just get basic info, don't call .json which might loop
                    return {
                        _index: i,
                        _type: item.className || 'unknown',
                        id: item.id,
                        name: item.name
                    };
                } catch (e) {
                    return { _index: i, _error: 'Could not read proxy' };
                }
            }
            return item;
        });
        if (output.length > 50) {
            simplified.push({ _truncated: true, _totalItems: output.length });
        }
        console.log('[fixproxy DEBUG] Array simplified');
        return { output: simplified };
    }

    let proxy: LPointerTargetable | undefined;
    if (output?.__isProxy) {
        console.log('[fixproxy DEBUG] Found proxy, accessing .json...');
        proxy = output;
        output = output.json; //.__raw; Object.fromEntries(Object.getOwnPropertyNames(p).map(k => [k, p[k]]));
        console.log('[fixproxy DEBUG] .json accessed');
    } else proxy = undefined;

    console.log('[fixproxy DEBUG] Checkpoint 1', {output: typeof output, proxy: !!proxy, addLKeys});

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

        // Load language preference from localStorage
        const storedLanguage = localStorage.getItem('jjodel_console_language') as ConsoleLanguage | null;
        const language: ConsoleLanguage = storedLanguage === 'jjel' ? 'jjel' : 'js';

        const state = new ThisState();
        state.footerHeight = !isNaN(footerHeight) && footerHeight >= 100 && footerHeight <= 400 ? footerHeight : 200;
        state.language = language;

        this.state = state;
        this.handleExecute = this.handleExecute.bind(this);
        this.handleClearConsole = this.handleClearConsole.bind(this);
        this.handleInsertContextKey = this.handleInsertContextKey.bind(this);
        this.handleInsertCode = this.handleInsertCode.bind(this);
        this.handleFooterHeightChange = this.handleFooterHeightChange.bind(this);
        this.handleLanguageChange = this.handleLanguageChange.bind(this);
    }
    private _context: GObject = {};

    // Footer resize handlers
    // Footer resize handler - called by SimpleFooterResizeHandle
    private handleFooterHeightChange(height: number): void {
        this.setState({ footerHeight: height });
        localStorage.setItem('jjodel_console_footer_height', height.toString());
    }

    // Language toggle handler
    private handleLanguageChange(language: ConsoleLanguage): void {
        this.setState({ language });
        localStorage.setItem('jjodel_console_language', language);
    }

    // Generate unique ID for console entries
    private generateEntryId(): string {
        return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Handle special commands
    private handleCommand(command: string): { output: string; isError: boolean; isHelp?: boolean } | null {
        const cmd = command.toLowerCase().trim();
        const { language } = this.state;

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

        // /examples - Show usage examples (language-aware)
        if (cmd === '/examples') {
            const examples = language === 'jjel'
                ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JjEL Examples (Jjodel Expression Language)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Navigation:
  data.classes                    - All classes
  data.classes.first.attributes   - First class's attributes
  node.parent                     - Parent element

Filtering (lambda with colon):
  data.classes.filter(c: c.abstract)
  data.classes.filter(c: c.name.startsWith("My"))
  data.classes.filter(c: c.attributes.size > 0)

Mapping:
  data.classes.map(c: c.name)
  data.classes.map(c: c.name + " (" + c.attributes.size + " attrs)")

Chaining:
  data.classes.filter(c: c.abstract).map(c: c.name)
  data.classes.filter(c: not c.abstract and c.attributes.size > 0).map(c: c.name)

Aggregation:
  data.classes.size
  data.classes.filter(c: c.abstract).size
  data.classes.map(c: c.attributes.size).sum()

Conditionals (if-then-else):
  if data.classes.size > 0 then "has classes" else "empty"
  if node.abstract then "abstract" else "concrete"
  data.classes.map(c: if c.abstract then c.name.toUpper else c.name)

Logical (and, or, not):
  data.classes.filter(c: c.abstract and c.attributes.size > 0)
  data.classes.filter(c: not c.abstract or c.name == "Base")

Null-safe:
  node.parent?.name
  node.parent?.name ?? "no parent"
  node.parent?.parent?.name ?? "root"

Type Check:
  data.classes.filter(c: c is DClass)
  node is DClass

Inheritance:
  data.classes.filter(c: c.superclass != null).map(c: c.name)
  data.classes.map(c: c.name + " → " + (c.superclass?.name ?? "root"))
  data.classes.filter(c: c.allSuperclasses.size > 1)

String Operations:
  node.name.toUpper
  node.name.toLower
  data.classes.map(c: c.name.substring(0, 3))

Collection Operations:
  data.classes.first
  data.classes.last
  data.classes.take(3).map(c: c.name)
  data.classes.sortBy(c: c.name).map(c: c.name)
  data.classes.map(c: c.name).distinct`
                : `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JavaScript Examples
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Navigation:
  data.classes                    - All classes
  data.classes[0].attributes      - First class's attributes
  node.parent                     - Parent element

Filtering:
  data.classes.filter(c => c.abstract)
  data.classes.filter(c => c.name.startsWith("My"))
  data.classes.filter(c => c.attributes.length > 0)

Mapping:
  data.classes.map(c => c.name)
  data.classes.map(c => ({ name: c.name, attrs: c.attributes.length }))

Chaining:
  data.classes.filter(c => c.abstract).map(c => c.name)
  data.classes.flatMap(c => c.attributes).map(a => a.name)

Aggregation:
  data.classes.length
  data.classes.reduce((sum, c) => sum + c.attributes.length, 0)

Conditional (ternary):
  data.classes.length > 0 ? "has classes" : "empty"
  node.abstract ? "abstract" : "concrete"

Logical (&&, ||, !):
  data.classes.filter(c => c.abstract && c.attributes.length > 0)
  data.classes.filter(c => !c.abstract || c.name === "Base")

Null-safe:
  node?.parent?.name
  node?.parent?.name ?? "no parent"

Finding:
  data.classes.find(c => c.name === "MyClass")
  data.classes.some(c => c.abstract)
  data.classes.every(c => c.attributes.length > 0)

Sorting:
  data.classes.sort((a, b) => a.name.localeCompare(b.name))
  [...data.classes].sort((a, b) => b.attributes.length - a.attributes.length)

Debugging:
  console.log(data)
  JSON.stringify(node, null, 2)`;
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
                    onCommandClick: (cmd: string) => this.handleExecute(cmd),
                    language: this.state.language
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
                entries: [...prevState.entries, commandEntry, resultEntry], // Append for chronological order (newest at bottom)
                expression: '',
                expressionHistory: [...prevState.expressionHistory, code],
                expressionIndex: prevState.expressionHistory.length
            }), () => {
                // Auto-scroll to show new result (wait for DOM update)
                setTimeout(() => {
                    const lastEntry = document.querySelector('.console-history .console-entry:last-child');
                    if (lastEntry) {
                        lastEntry.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }
                }, 50);
            });

            return;
        }

        // Add command entry with language indicator
        const commandEntry: ConsoleEntryData = {
            id: this.generateEntryId(),
            type: 'command',
            timestamp: new Date(),
            content: code,
            input: code,
            language: this.state.language
        };

        // Execute code based on selected language
        let output: any;
        let hasError = false;

        if (this.state.language === 'jjel') {
            // Execute as JjEL expression
            try {
                console.log('[JjEL DEBUG] 1. Starting parse for:', code);
                // jjelEval throws on parse/evaluation errors, returns the value directly on success
                output = jjelEval(code, this._context);
                console.log('[JjEL DEBUG] 2. jjelEval completed, output type:', typeof output);
                console.log('[JjEL DEBUG] 2b. output isProxy:', output?.__isProxy);
                console.log('[JjEL DEBUG] 2c. output isArray:', Array.isArray(output));
            } catch (e: any) {
                console.error("[JjEL DEBUG] ERROR in jjelEval:", e);
                // Extract JjEL-specific error message
                const errorMessage = e.message || e.toString();
                output = errorMessage.replace(/^JjEL (parse |evaluation )?error: /, '');
                hasError = true;
            }
        } else {
            // Execute as JavaScript (existing behavior)
            try {
                const expression = code.trim() === 'this' ? 'data' : code;
                if (expression === 'this') output = this._context;
                else output = U.evalInContextAndScope(expression, this._context, this._context);
            } catch (e: any) {
                console.error("console error", e);
                output = e.toString();
                hasError = true;
            }
        }

        // Process output
        let contentStr: string;
        try {
            console.log('[JjEL DEBUG] 3. Starting fixproxy...');
            const processed = fixproxy(output);
            console.log('[JjEL DEBUG] 4. fixproxy completed');
            const finalOutput = processed.output;
            console.log('[JjEL DEBUG] 5. finalOutput type:', typeof finalOutput);

            if (typeof finalOutput === 'object' && finalOutput !== null) {
                console.log('[JjEL DEBUG] 6. Starting safeStringify...');
                contentStr = safeStringify(finalOutput);
                console.log('[JjEL DEBUG] 7. safeStringify completed, length:', contentStr.length);
            } else if (finalOutput === undefined) {
                contentStr = 'undefined';
            } else if (finalOutput === null) {
                contentStr = 'null';
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
            collapsed: false,
            language: this.state.language
        };

        // Update state - append for chronological order (newest at bottom)
        this.setState(prevState => ({
            entries: [...prevState.entries, commandEntry, resultEntry],
            expression: '',
            expressionHistory: [...prevState.expressionHistory, code],
            expressionIndex: prevState.expressionHistory.length
        }), () => {
            // Auto-scroll to show new result (wait for DOM update)
            setTimeout(() => {
                const lastEntry = document.querySelector('.console-history .console-entry:last-child');
                if (lastEntry) {
                    lastEntry.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }, 50);
        });

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
                    language={this.state.language}
                    onLanguageChange={this.handleLanguageChange}
                />

                {/* Console Body - flex to fill remaining space */}
                <div className="console-body" style={{ flex: 1, overflow: 'auto', minHeight: '100px' }}>
                    <ConsoleHistory
                        entries={this.state.entries}
                        onToggleCollapse={(id) => this.handleToggleCollapse(id)}
                        onDeleteEntry={(id) => this.handleDeleteEntry(id)}
                        onExecuteCode={this.handleExecute}
                    />
                </div>

                {/* Bottom Section - Input + Footer with controlled height */}
                <div
                    className="console-bottom-section"
                    style={{
                        height: `${this.state.footerHeight}px`
                    }}
                >
                    {/* Resize Handle - at the TOP of bottom section */}
                    <SimpleFooterResizeHandle
                        onHeightChange={this.handleFooterHeightChange}
                        currentHeight={this.state.footerHeight}
                        minHeight={150}
                        maxHeightPercent={0.4}
                        containerSelector=".console-tab-v2"
                    />

                    {/* Input Area */}
                    <div className="console-input-wrapper" style={{ flexShrink: 0 }}>
                        <ConsoleInput
                            value={this.state.expression}
                            onChange={(value) => this.setState({ expression: value })}
                            onExecute={this.handleExecute}
                            history={this.state.expressionHistory.filter(h => h.trim() !== '')}
                            contextKeys={contextkeysarr}
                            language={this.state.language}
                        />
                    </div>

                    {/* Footer - Collapsible Sections */}
                    <div className="console-footer" style={{ flex: 1, overflow: 'auto' }}>
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
