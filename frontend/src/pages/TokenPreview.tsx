/**
 * DESIGN TOKENS PREVIEW PAGE
 *
 * This page displays all design tokens visually.
 * Useful for:
 * - Verifying token values
 * - Testing dark/light themes
 * - Sharing design system with team
 * - Documentation reference
 *
 * TO USE:
 * Add a route in your router: /test-tokens
 */

import React, { useState } from 'react';
import './tokenPreview.scss';

export function TokenPreview() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="token-preview">
      {/* Header with theme toggle */}
      <header className="preview-header">
        <h1>Jjodel Design Tokens</h1>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </header>

      <div className="preview-content">

        {/* Colors Section */}
        <section className="preview-section">
          <h2>Colors</h2>

          <h3>Backgrounds</h3>
          <div className="color-grid">
            <ColorSwatch name="bg-primary" />
            <ColorSwatch name="bg-secondary" />
            <ColorSwatch name="bg-tertiary" />
            <ColorSwatch name="bg-elevated" />
            <ColorSwatch name="bg-hover" />
          </div>

          <h3>Borders</h3>
          <div className="color-grid">
            <ColorSwatch name="border-primary" />
            <ColorSwatch name="border-secondary" />
            <ColorSwatch name="border-hover" />
          </div>

          <h3>Text</h3>
          <div className="color-grid">
            <ColorSwatch name="text-primary" />
            <ColorSwatch name="text-secondary" />
            <ColorSwatch name="text-tertiary" />
            <ColorSwatch name="text-inverse" />
          </div>

          <h3>Accent (Brand)</h3>
          <div className="color-grid">
            <ColorSwatch name="accent" />
            <ColorSwatch name="accent-hover" />
            <ColorSwatch name="accent-active" />
            <ColorSwatch name="accent-muted" />
            <ColorSwatch name="accent-subtle" />
          </div>

          <h3>Semantic</h3>
          <div className="color-grid">
            <ColorSwatch name="success" />
            <ColorSwatch name="warning" />
            <ColorSwatch name="error" />
            <ColorSwatch name="info" />
          </div>
        </section>

        {/* Typography Section */}
        <section className="preview-section">
          <h2>Typography</h2>

          <div className="typography-samples">
            <div className="type-sample" style={{ fontSize: 'var(--text-xs)' }}>
              <span className="type-label">xs (11px)</span>
              <p>The quick brown fox jumps over the lazy dog</p>
            </div>
            <div className="type-sample" style={{ fontSize: 'var(--text-sm)' }}>
              <span className="type-label">sm (13px)</span>
              <p>The quick brown fox jumps over the lazy dog</p>
            </div>
            <div className="type-sample" style={{ fontSize: 'var(--text-base)' }}>
              <span className="type-label">base (15px)</span>
              <p>The quick brown fox jumps over the lazy dog</p>
            </div>
            <div className="type-sample" style={{ fontSize: 'var(--text-lg)' }}>
              <span className="type-label">lg (18px)</span>
              <p>The quick brown fox jumps over the lazy dog</p>
            </div>
            <div className="type-sample" style={{ fontSize: 'var(--text-xl)' }}>
              <span className="type-label">xl (24px)</span>
              <p>The quick brown fox jumps over the lazy dog</p>
            </div>
          </div>

          <h3>Font Families</h3>
          <div className="font-samples">
            <p style={{ fontFamily: 'var(--font-sans)' }}>
              <strong>Sans:</strong> Inter (UI text)
            </p>
            <p style={{ fontFamily: 'var(--font-mono)' }}>
              <strong>Mono:</strong> JetBrains Mono (code, console)
            </p>
          </div>
        </section>

        {/* Spacing Section */}
        <section className="preview-section">
          <h2>Spacing</h2>
          <div className="spacing-samples">
            {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map(size => (
              <div key={size} className="spacing-sample">
                <div
                  className="spacing-box"
                  style={{ width: `var(--space-${size})`, height: `var(--space-${size})` }}
                />
                <span>space-{size} ({size * 4}px)</span>
              </div>
            ))}
          </div>
        </section>

        {/* Shadows Section */}
        <section className="preview-section">
          <h2>Shadows</h2>
          <div className="shadow-samples">
            <ShadowBox level="sm" />
            <ShadowBox level="md" />
            <ShadowBox level="lg" />
            <ShadowBox level="xl" />
            <ShadowBox level="2xl" />
          </div>
        </section>

        {/* Radius Section */}
        <section className="preview-section">
          <h2>Border Radius</h2>
          <div className="radius-samples">
            <RadiusBox level="sm" />
            <RadiusBox level="md" />
            <RadiusBox level="lg" />
            <RadiusBox level="xl" />
            <RadiusBox level="2xl" />
            <RadiusBox level="full" />
          </div>
        </section>

        {/* Buttons Example */}
        <section className="preview-section">
          <h2>Button Examples (Using Tokens)</h2>
          <div className="button-examples">
            <button className="btn-preview btn-primary">Primary Button</button>
            <button className="btn-preview btn-secondary">Secondary Button</button>
            <button className="btn-preview btn-danger">Danger Button</button>
            <button className="btn-preview btn-ghost">Ghost Button</button>
          </div>
        </section>

      </div>
    </div>
  );
}

// Helper Components

function ColorSwatch({ name }: { name: string }) {
  const varName = `--color-${name}`;

  return (
    <div className="color-swatch">
      <div
        className="color-box"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <div className="color-info">
        <div className="color-name">{name}</div>
        <div className="color-var">{varName}</div>
      </div>
    </div>
  );
}

function ShadowBox({ level }: { level: string }) {
  return (
    <div className="shadow-box-container">
      <div
        className="shadow-box"
        style={{ boxShadow: `var(--shadow-${level})` }}
      >
        <span>shadow-{level}</span>
      </div>
    </div>
  );
}

function RadiusBox({ level }: { level: string }) {
  return (
    <div className="radius-box-container">
      <div
        className="radius-box"
        style={{ borderRadius: `var(--radius-${level})` }}
      >
        <span>radius-{level}</span>
      </div>
    </div>
  );
}

export default TokenPreview;
