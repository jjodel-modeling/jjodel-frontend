import React, { useEffect, useRef, useState } from 'react';
import './WelcomeModal.scss';

const STORAGE_KEY = 'jjodel_welcome_3_seen';

const WelcomeModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const codeScrollRef = useRef<HTMLDivElement>(null);
  const lineNumsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;   // dismissed forever
    if (sessionStorage.getItem(STORAGE_KEY)) return; // already shown this session
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const scroll = codeScrollRef.current;
    const lines = lineNumsRef.current;
    if (!scroll || !lines) return;
    const handler = () => { lines.scrollTop = scroll.scrollTop; };
    scroll.addEventListener('scroll', handler);
    return () => scroll.removeEventListener('scroll', handler);
  }, [visible]);

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
            <div className="wm-hero-title" id="wm-title">Jjodel 3.0</div>
            <div className="wm-hero-sub">
              A completely redesigned metamodeling experience. New transformation engine, new expression language, new UI.
            </div>
          </div>
        </div>

        <div className="wm-body">

          <a
            className="wm-featured"
            href="https://docs.jjodel.io/languages/jjtl"
            target="_blank"
            rel="noreferrer"
          >
            <div className="wm-featured-top">
              <div className="wm-tags">
                <span className="wm-tag wm-tag--jjtl">JjTL</span>
                <span className="wm-tag wm-tag--new">New language</span>
              </div>
              <span className="wm-featured-arrow">→</span>
            </div>
            <div className="wm-featured-title">Model-to-Model Transformation Language</div>
            <div className="wm-featured-desc">
              Write declarative transformations between metamodels. The AI suggests mappings, arrows visualize them live on the canvas, and two-pass execution handles cross-type references correctly.
            </div>
            <div className="wm-code-wrap">
              <div className="wm-code-titlebar">
                <span className="wm-code-filename">state_machines_to_petri_nets.jjtl</span>
              </div>
              <div className="wm-code-body">
                <div className="wm-line-numbers" ref={lineNumsRef}>
                  {Array.from({ length: 13 }, (_, i) => <span key={i}>{i + 1}</span>)}
                </div>
                <div className="wm-code-scroll" ref={codeScrollRef}>
                  <div className="wm-code-lines">
                    <span className="wm-kw">transformation</span>{' '}
                    <span className="wm-cls">StateMachines_to_PetriNets</span>{'\n'}
                    <span className="wm-kw">from</span>{' statemachines '}
                    <span className="wm-kw">to</span>{' petrinets\n\n'}
                    <span className="wm-cls">State</span>{' → '}
                    <span className="wm-cls">Place</span>{' '}
                    <span className="wm-op">{'{'}</span>{'\n'}
                    {'    name   '}<span className="wm-op">:=</span>{' name\n'}
                    {'    tokens '}<span className="wm-op">:=</span>{' '}
                    <span className="wm-kw">if</span>{' isInitial '}
                    <span className="wm-kw">then</span>{' '}
                    <span className="wm-lit">1</span>{' '}
                    <span className="wm-kw">else</span>{' '}
                    <span className="wm-lit">0</span>{'\n'}
                    <span className="wm-op">{'}'}</span>{'\n\n'}
                    <span className="wm-cls">Transition</span>{' → '}
                    <span className="wm-cls">Transition</span>{' '}
                    <span className="wm-op">{'{'}</span>{'\n'}
                    {'    name        '}<span className="wm-op">:=</span>{' name\n'}
                    {'    inputPlace  '}<span className="wm-op">:=</span>{' parent\n'}
                    {'    outputPlace '}<span className="wm-op">:=</span>{' nextState\n'}
                    <span className="wm-op">{'}'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="wm-pills">
              {['AI-suggested mappings', 'match arrows', 'two-pass execution', 'cross-type resolve'].map(p => (
                <span key={p} className="wm-pill">{p}</span>
              ))}
            </div>
          </a>

          <div className="wm-section-label">Also new</div>
          <div className="wm-grid">

            <a
              className="wm-card"
              href="https://docs.jjodel.io/user-guide/transformation-editor"
              target="_blank"
              rel="noreferrer"
            >
              <div className="wm-card-top">
                <span className="wm-card-tag wm-card-tag--sky">Editor</span>
                <span className="wm-card-arrow">→</span>
              </div>
              <div className="wm-card-title">Transformation Editor</div>
              <div className="wm-card-desc">
                Dual-canvas environment with source and target metamodels side by side, AI mapping panel, and live match arrows on the canvas.
              </div>
            </a>

            <div className="wm-card wm-card--static">
              <div className="wm-card-top">
                <span className="wm-card-tag wm-card-tag--slate">Languages</span>
              </div>
              <div className="wm-card-title">A family of Jj-languages</div>
              <div className="wm-lang-list">
                {[
                  { tag: 'JjTL', mod: 'blue', desc: 'Model-to-model transformations' },
                  { tag: 'JjEL', mod: 'cyan', desc: 'Expressions, guards & bindings' },
                  { tag: 'JjScript', mod: 'violet', desc: 'Slash-driven metamodel scripting' },
                  { tag: 'JjModal', mod: 'indigo', desc: 'Inline dialogs for JjTL & JjScript' },
                ].map(({ tag, mod, desc }) => (
                  <div key={tag} className="wm-lang-row">
                    <span className={`wm-lang-tag wm-lang-tag--${mod}`}>{tag}</span>
                    <span className="wm-lang-desc">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              className="wm-card"
              href="https://docs.jjodel.io/user-guide/documentation"
              target="_blank"
              rel="noreferrer"
            >
              <div className="wm-card-top">
                <span className="wm-card-tag wm-card-tag--amber">Docs</span>
                <span className="wm-card-arrow">→</span>
              </div>
              <div className="wm-card-title">Documentation Generation</div>
              <div className="wm-card-desc">
                Generate structured documentation from your metamodels and models automatically.
              </div>
            </a>

            <a
              className="wm-card"
              href="https://docs.jjodel.io/user-guide/metamodel-editor"
              target="_blank"
              rel="noreferrer"
            >
              <div className="wm-card-top">
                <span className="wm-card-tag wm-card-tag--rose">Editor</span>
                <span className="wm-card-arrow">→</span>
              </div>
              <div className="wm-card-title">Canvas Editor v2</div>
              <div className="wm-card-desc">
                React Flow canvas with edge jump markers and A*-grid obstacle-aware path routing.
              </div>
            </a>

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
