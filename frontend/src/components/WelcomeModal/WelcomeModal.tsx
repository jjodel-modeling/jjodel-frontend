import React, { useEffect, useState } from 'react';
import './WelcomeModal.scss';

// 3.1 screen: a new key, so a user who dismissed the 3.0 screen sees this one.
// The 3.0 key (jjodel_welcome_3_seen) is neither read nor deleted.
const STORAGE_KEY = 'jjodel_welcome_3_1_seen';

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
            <div className="wm-hero-title" id="wm-title">Jjodel 3.1</div>
            <div className="wm-hero-sub">
              Simulation, derived viewpoints, containers and validation.
            </div>
          </div>
        </div>

        <div className="wm-body">

          <div className="wm-featured wm-featured--static">
            <div className="wm-featured-top">
              <div className="wm-tags">
                <span className="wm-tag wm-tag--sim">Simulation</span>
                <span className="wm-tag wm-tag--new">New</span>
              </div>
            </div>
            <div className="wm-featured-title">Run your models</div>
            <div className="wm-featured-desc">
              Automata, Petri nets, Moore and Mealy machines and statecharts run step by step, with events, guards and actions. Step back, replay a run as a scenario, see coverage on the canvas, and drive the model from an I/O board with buttons, LEDs and a clock.
            </div>
            <div className="wm-code-wrap">
              <div className="wm-code-body">
                <div
                  className="wm-petri"
                  role="img"
                  aria-label="A Petri net at step 2 of a run: place ready holds two tokens, busy none, done one; transition start is enabled."
                >
                  {PETRI_NODES.map((n, i) => (
                    <React.Fragment key={n.label}>
                      {i > 0 && <span className="wm-petri-arc" />}
                      {n.kind === 'place' ? (
                        <span className="wm-petri-place">
                          {Array.from({ length: n.tokens ?? 0 }, (_, k) => <span key={k} className="wm-petri-token" />)}
                          <span className="wm-petri-label">{n.label}</span>
                        </span>
                      ) : (
                        <span className={`wm-petri-trans${n.enabled ? ' wm-petri-trans--enabled' : ''}`}>
                          <span className="wm-petri-label">{n.label}</span>
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                  <span className="wm-petri-state">Running · step 2</span>
                </div>
              </div>
            </div>
            <div className="wm-pills">
              {['Step / Play', 'Scenarios', 'Coverage', 'I/O board'].map(p => (
                <span key={p} className="wm-pill">{p}</span>
              ))}
            </div>
          </div>

          <div className="wm-section-label">Also new</div>
          <div className="wm-grid wm-grid--three">

            <div className="wm-card wm-card--static">
              <div className="wm-card-top">
                <span className="wm-card-tag wm-card-tag--sky">Viewpoints</span>
              </div>
              <div className="wm-card-title">Derive viewpoint</div>
              <div className="wm-card-desc">
                A full viewpoint from a metamodel in one click, in your notation: statechart, Petri net, flowchart, UML activity, ER (Chen) and more.
              </div>
            </div>

            <div className="wm-card wm-card--static">
              <div className="wm-card-top">
                <span className="wm-card-tag wm-card-tag--rose">Canvas</span>
              </div>
              <div className="wm-card-title">Containers and Auto layout</div>
              <div className="wm-card-desc">
                Containers drawn as frames and partitions. Auto layout in the toolbar arranges the whole graph.
              </div>
            </div>

            <div className="wm-card wm-card--static">
              <div className="wm-card-top">
                <span className="wm-card-tag wm-card-tag--amber">Rules</span>
              </div>
              <div className="wm-card-title">Validation</div>
              <div className="wm-card-desc">
                Your own rules, the Validate command, and violation dots on the instances.
              </div>
            </div>

          </div>

          <div className="wm-recall">
            <div className="wm-recall-label">New in 3.0</div>
            <div className="wm-recall-items">
              {[
                'JjTL model-to-model transformations',
                'Transformation Editor',
                'Jj-languages: JjTL, JjEL, JjScript, JjModal',
                'Documentation generation',
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
