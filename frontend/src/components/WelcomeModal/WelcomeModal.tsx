import React, { useEffect, useState } from 'react';
import './WelcomeModal.scss';

// 3.2 screen: a new key, so a user who dismissed the 3.1.1 screen sees this one.
// The older keys (jjodel_welcome_3_seen, jjodel_welcome_3_1_seen, jjodel_welcome_3_1_1_seen) are neither read nor deleted.
const STORAGE_KEY = 'jjodel_welcome_3_2_seen';

// The featured block of 3.2: a model as text, in the default style of the textual syntax
// (src/codegen/textual/printer.ts). Each line is a list of [token class, text]; '' is plain text.
const TEXT_LINES: [string, string][][] = [
  [['wm-cls', 'Family'], ['', ' march '], ['wm-op', '{']],
  [['', '  '], ['wm-kw', 'lastName'], ['', ' '], ['wm-lit', '"March"']],
  [['', '  '], ['wm-kw', 'father'], ['', ' '], ['wm-op', '{'], ['', ' '], ['wm-cls', 'Member'], ['', ' jim '], ['wm-op', '{'], ['', ' '], ['wm-kw', 'firstName'], ['', ' '], ['wm-lit', '"Jim"'], ['', ' '], ['wm-op', '} }']],
  [['', '  '], ['wm-kw', 'daughters'], ['', ' '], ['wm-op', '{'], ['', ' '], ['wm-cls', 'Member'], ['', ' brenda '], ['wm-op', '{'], ['', ' '], ['wm-kw', 'firstName'], ['', ' '], ['wm-lit', '"Brenda"'], ['', ' '], ['wm-op', '} }']],
  [['wm-op', '}']],
];

// TODO: cleanup. The 3.1 featured illustration, no longer rendered since the 3.2 screen.
// Static illustration of the featured block: a three-place Petri net at step 2
// of a run (3 tokens in `ready` at start; one `start` and one `finish` fired).
const PETRI_NODES: { kind: 'place' | 'trans'; label: string; tokens?: number; enabled?: boolean }[] = [
  { kind: 'place', label: 'ready', tokens: 2 },
  { kind: 'trans', label: 'start', enabled: true },
  { kind: 'place', label: 'busy', tokens: 0 },
  { kind: 'trans', label: 'finish', enabled: false },
  { kind: 'place', label: 'done', tokens: 1 },
];

const WelcomeModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;   // dismissed forever
    if (sessionStorage.getItem(STORAGE_KEY)) return; // already shown this session
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  function close() {
    sessionStorage.setItem(STORAGE_KEY, '1');          // block for this session
    if (dontShow) localStorage.setItem(STORAGE_KEY, '1'); // block forever
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="wm-backdrop"
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="wm-modal" role="dialog" aria-modal="true" aria-labelledby="wm-title">

        <div className="wm-hero">
          <div className="wm-circles">
            <div className="wm-circle wm-circle-1" />
            <div className="wm-circle wm-circle-2" />
            <div className="wm-circle wm-circle-3" />
          </div>
          <button className="wm-close-btn" onClick={close} aria-label="Close">✕</button>
          <div className="wm-hero-content">
            <div className="wm-hero-label">What's new</div>
            <div className="wm-hero-title" id="wm-title">Jjodel 3.2</div>
            <div className="wm-hero-sub">
              Models as text, code generation, side-by-side panes and transformations over several models.
            </div>
          </div>
        </div>

        <div className="wm-body">
          <div className="wm-featured wm-featured--static">
            <div className="wm-featured-top">
              <div className="wm-tags">
                <span className="wm-tag wm-tag--jjtl">Textual syntax</span>
                <span className="wm-tag wm-tag--new">Advanced</span>
              </div>
            </div>
            <div className="wm-featured-title">Edit a model as text</div>
            <div className="wm-featured-desc">
              In Advanced mode a model also opens as text, in a syntax derived from its metamodel. Edit the text and the model follows. Completion, hover and an outline come from the same grammar, and the syntax can take a C-like or a Pascal style, or your own block keywords.
            </div>
            <div className="wm-code-wrap">
              <div className="wm-code-titlebar">
                <span className="wm-code-filename">sample-Families · Text</span>
              </div>
              <div className="wm-code-body">
                <div className="wm-line-numbers">
                  {TEXT_LINES.map((_, i) => <span key={i}>{i + 1}</span>)}
                </div>
                <div className="wm-code-scroll">
                  <div className="wm-code-lines">
                    {TEXT_LINES.map((line, i) => (
                      <div key={i}>
                        {line.map(([cls, text], j) => (cls ? <span key={j} className={cls}>{text}</span> : <React.Fragment key={j}>{text}</React.Fragment>))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="wm-pills">
              {['Edit as text', 'Completion', 'Outline', 'Syntax styles'].map(p => (
                <span key={p} className="wm-pill">{p}</span>
              ))}
            </div>
          </div>

          <div className="wm-section-label">Also new</div>
          <div className="wm-grid wm-grid--three">
            <div className="wm-card wm-card--static">
              <div className="wm-card-top">
                <span className="wm-card-tag wm-card-tag--rose">Canvas</span>
              </div>
              <div className="wm-card-title">Side by side</div>
              <div className="wm-card-desc">
                Open a model beside another from the tree, each pane with its own viewpoint. One palette serves the active pane.
              </div>
            </div>
            <div className="wm-card wm-card--static">
              <div className="wm-card-top">
                <span className="wm-card-tag wm-card-tag--sky">Code</span>
              </div>
              <div className="wm-card-title">Code generation</div>
              <div className="wm-card-desc">
                Templates over a metamodel and generators in the left bar. Run the generated JavaScript and check it against the simulator. Advanced mode.
              </div>
            </div>
            <div className="wm-card wm-card--static">
              <div className="wm-card-top">
                <span className="wm-card-tag wm-card-tag--amber">JjTL</span>
              </div>
              <div className="wm-card-title">Several sources</div>
              <div className="wm-card-desc">
                A transformation reads several models of the same metamodel in one run.
              </div>
            </div>
          </div>

          <div className="wm-grid wm-grid--three">
            <div className="wm-card wm-card--static">
              <div className="wm-card-top">
                <span className="wm-card-tag wm-card-tag--sky">Viewpoints</span>
              </div>
              <div className="wm-card-title">View panel</div>
              <div className="wm-card-desc">
                Vertex, edge and container views: the properties once reachable only from the Source tab now have a control.
              </div>
            </div>
            <div className="wm-card wm-card--static">
              <div className="wm-card-top">
                <span className="wm-card-tag wm-card-tag--rose">JjEL</span>
              </div>
              <div className="wm-card-title">Expressions</div>
              <div className="wm-card-desc">
                <code>is</code> follows the class hierarchy, <code>==</code> compares model objects by identity, and <code>forall</code> walks multi-valued features.
              </div>
            </div>
            <div className="wm-card wm-card--static">
              <div className="wm-card-top">
                <span className="wm-card-tag wm-card-tag--amber">Performance</span>
              </div>
              <div className="wm-card-title">Large models</div>
              <div className="wm-card-desc">
                Reference lists are built when opened, and the canvas redraws only the nodes that changed.
              </div>
            </div>
          </div>

          <div className="wm-recall">
            <div className="wm-recall-label">New in 3.1</div>
            <div className="wm-recall-items">
              {[
                'Simulation',
                'Derive viewpoint',
                'Containers and Auto layout',
                'Validation',
                'Jjodie panel',
                'Templates',
              ].map(item => (
                <span key={item} className="wm-recall-item">{item}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="wm-footer">
          <label className="wm-checkbox-label">
            <div
              className={`wm-checkbox${dontShow ? ' wm-checkbox--checked' : ''}`}
              onClick={() => setDontShow(v => !v)}
            >
              {dontShow && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path
                    d="M1 3L3 5L7 1"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="wm-checkbox-text">Don't show again</span>
          </label>
          <div className="wm-footer-btns">
            <button className="wm-btn wm-btn--outline" onClick={close}>Close</button>
            <button
              className="wm-btn wm-btn--primary"
              onClick={() => { window.open('https://jjodel.io/whats-new/', '_blank'); close(); }}
            >
              Explore what's new →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WelcomeModal;
