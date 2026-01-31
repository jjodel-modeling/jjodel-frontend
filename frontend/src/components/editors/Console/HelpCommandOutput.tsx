import React from 'react';

interface ClickableCommand {
  command: string;
  description: string;
  aliases?: string[];
}

interface HelpCommandOutputProps {
  onCommandClick: (command: string) => void;
}

const AVAILABLE_COMMANDS: ClickableCommand[] = [
  { command: '/help', aliases: ['/commands'], description: 'Show this help message' },
  { command: '/clear', aliases: ['/cls'], description: 'Clear console' },
  { command: '/history', description: 'Show command history' },
  { command: '/context', description: 'Show available context keys' },
  { command: '/examples', description: 'Show usage examples' },
  { command: '/shortcuts', description: 'Show keyboard shortcuts' }
];

export const HelpCommandOutput: React.FC<HelpCommandOutputProps> = ({ onCommandClick }) => {
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

      <h3>JavaScript Tips:</h3>
      <ul className="tips-list">
        <li>Use <code className="inline-code">data</code> to access current model</li>
        <li>Use <code className="inline-code">node</code> to access selected node</li>
        <li>Use <code className="inline-code">view</code> to access current view</li>
        <li>Press <kbd>↑↓</kbd> to navigate history</li>
        <li>Press <kbd>Tab</kbd> for autocomplete</li>
      </ul>
    </div>
  );
};

export default HelpCommandOutput;
