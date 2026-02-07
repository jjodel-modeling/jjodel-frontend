import React from 'react';
import type { ConsoleLanguage } from './LanguageToggle';

// Inline style to force disable ligatures
const noLigatureStyle: React.CSSProperties = {
  fontVariantLigatures: 'none',
  fontFeatureSettings: "'liga' 0, 'calt' 0, 'clig' 0, 'dlig' 0",
};

// Code component with ligatures disabled
const Code: React.FC<{ children: React.ReactNode; strikethrough?: boolean }> = ({ children, strikethrough }) => (
  <code className={`inline-code${strikethrough ? ' strikethrough' : ''}`} style={noLigatureStyle}>
    {children}
  </code>
);

interface ClickableCommand {
  command: string;
  description: string;
  aliases?: string[];
}

interface HelpCommandOutputProps {
  onCommandClick: (command: string) => void;
  language?: ConsoleLanguage;
}

const AVAILABLE_COMMANDS: ClickableCommand[] = [
  { command: '/help', aliases: ['/commands'], description: 'Show this help message' },
  { command: '/clear', aliases: ['/cls'], description: 'Clear console' },
  { command: '/history', description: 'Show command history' },
  { command: '/context', description: 'Show available context keys' },
  { command: '/examples', description: 'Show usage examples' },
  { command: '/shortcuts', description: 'Show keyboard shortcuts' }
];

export const HelpCommandOutput: React.FC<HelpCommandOutputProps> = ({ onCommandClick, language = 'js' }) => {
  return (
    <div className="help-output" style={noLigatureStyle}>
      <h3>Available Commands:</h3>
      <div className="commands-list">
        {AVAILABLE_COMMANDS.map((cmd, i) => (
          <div key={i} className="command-row">
            <div className="command-names">
              <button
                className="command-link"
                onClick={() => onCommandClick(cmd.command)}
                title={`Click to run ${cmd.command}`}
                type="button"
              >
                {cmd.command}
              </button>
              {cmd.aliases && cmd.aliases.map((alias, j) => (
                <React.Fragment key={j}>
                  <span className="command-separator">, </span>
                  <button
                    className="command-link"
                    onClick={() => onCommandClick(alias)}
                    title={`Click to run ${alias}`}
                    type="button"
                  >
                    {alias}
                  </button>
                </React.Fragment>
              ))}
            </div>
            <span className="command-separator"> - </span>
            <span className="command-description">{cmd.description}</span>
          </div>
        ))}
      </div>

      <div className="language-mode-banner">
        Current Mode: <strong>{language === 'jjel' ? 'JjEL' : 'JavaScript'}</strong>
      </div>

      {language === 'jjel' ? (
        <>
          <h3>JjEL Syntax:</h3>
          <ul className="tips-list">
            <li>Logical: <Code>and</Code>, <Code>or</Code>, <Code>not</Code> (NOT <Code>&amp;&amp;</Code>, <Code>||</Code>, <Code>!</Code>)</li>
            <li>Conditional: <Code>if cond then a else b</Code> (NOT ternary)</li>
            <li>Lambda: <Code>x: x.name</Code> (NOT <Code>x =&gt; x.name</Code>)</li>
            <li>Null-safe: <Code>obj?.prop</Code>, <Code>value ?? default</Code></li>
          </ul>
          <h3>Quick Examples:</h3>
          <ul className="tips-list">
            <li><Code>data.classes</Code> - all classes</li>
            <li><Code>data.classes.filter(c: c.abstract)</Code> - filter</li>
            <li><Code>data.classes.map(c: c.name)</Code> - map to names</li>
            <li><Code>if node.abstract then "abs" else "conc"</Code></li>
          </ul>
        </>
      ) : (
        <>
          <h3>JavaScript Syntax:</h3>
          <ul className="tips-list">
            <li>Logical: <Code>&amp;&amp;</Code>, <Code>||</Code>, <Code>!</Code></li>
            <li>Conditional: <Code>condition ? a : b</Code></li>
            <li>Arrow: <Code>x =&gt; x.name</Code></li>
            <li>Null-safe: <Code>obj?.prop</Code>, <Code>value ?? default</Code></li>
          </ul>
          <h3>Quick Examples:</h3>
          <ul className="tips-list">
            <li><Code>data.classes</Code> - all classes</li>
            <li><Code>data.classes.filter(c =&gt; c.abstract)</Code> - filter</li>
            <li><Code>data.classes.map(c =&gt; c.name)</Code> - map to names</li>
            <li><Code>node.abstract ? "abs" : "conc"</Code></li>
          </ul>
        </>
      )}

      <h3>Context Variables:</h3>
      <ul className="tips-list">
        <li><Code>data</Code> - current model/metamodel</li>
        <li><Code>node</Code> - selected element</li>
        <li><Code>view</Code> - active view/viewpoint</li>
      </ul>

      <h3>Keyboard:</h3>
      <ul className="tips-list">
        <li><kbd>↑↓</kbd> navigate history</li>
        <li><kbd>Tab</kbd> autocomplete</li>
        <li><kbd>Ctrl+L</kbd> clear console</li>
      </ul>
    </div>
  );
};

export default HelpCommandOutput;
