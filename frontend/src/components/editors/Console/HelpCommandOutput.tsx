import React from 'react';
import type { ConsoleLanguage } from './LanguageToggle';

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
    <div className="help-output">
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
            <li>Logical: <code className="inline-code">and</code>, <code className="inline-code">or</code>, <code className="inline-code">not</code> (NOT <code className="inline-code strikethrough">&&</code>, <code className="inline-code strikethrough">||</code>, <code className="inline-code strikethrough">!</code>)</li>
            <li>Conditional: <code className="inline-code">if cond then a else b</code> (NOT ternary)</li>
            <li>Lambda: <code className="inline-code">x: x.name</code> (NOT <code className="inline-code strikethrough">x =&gt; x.name</code>)</li>
            <li>Null-safe: <code className="inline-code">obj?.prop</code>, <code className="inline-code">value ?? default</code></li>
          </ul>
          <h3>Quick Examples:</h3>
          <ul className="tips-list">
            <li><code className="inline-code">data.classes</code> - all classes</li>
            <li><code className="inline-code">data.classes.filter(c: c.abstract)</code> - filter</li>
            <li><code className="inline-code">data.classes.map(c: c.name)</code> - map to names</li>
            <li><code className="inline-code">if node.abstract then "abs" else "conc"</code></li>
          </ul>
        </>
      ) : (
        <>
          <h3>JavaScript Syntax:</h3>
          <ul className="tips-list">
            <li>Logical: <code className="inline-code">&&</code>, <code className="inline-code">||</code>, <code className="inline-code">!</code></li>
            <li>Conditional: <code className="inline-code">condition ? a : b</code></li>
            <li>Arrow: <code className="inline-code">x =&gt; x.name</code></li>
            <li>Null-safe: <code className="inline-code">obj?.prop</code>, <code className="inline-code">value ?? default</code></li>
          </ul>
          <h3>Quick Examples:</h3>
          <ul className="tips-list">
            <li><code className="inline-code">data.classes</code> - all classes</li>
            <li><code className="inline-code">data.classes.filter(c =&gt; c.abstract)</code> - filter</li>
            <li><code className="inline-code">data.classes.map(c =&gt; c.name)</code> - map to names</li>
            <li><code className="inline-code">node.abstract ? "abs" : "conc"</code></li>
          </ul>
        </>
      )}

      <h3>Context Variables:</h3>
      <ul className="tips-list">
        <li><code className="inline-code">data</code> - current model/metamodel</li>
        <li><code className="inline-code">node</code> - selected element</li>
        <li><code className="inline-code">view</code> - active view/viewpoint</li>
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
