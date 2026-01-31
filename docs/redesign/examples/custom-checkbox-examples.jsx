import React, { useState } from 'react';

const CustomCheckboxExamples = () => {
  const [checks, setChecks] = useState({
    option1: true,
    option2: false,
    option3: true,
    option4: false,
    option5: true,
    option6: false,
  });

  const toggle = (key) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const styles = {
    container: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '40px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
    },
    title: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#111418',
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '14px',
      color: '#5c6370',
      marginBottom: '32px',
    },
    section: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      border: '1px solid #e2e4e8',
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#111418',
      marginBottom: '16px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
    },
    label: {
      fontSize: '14px',
      color: '#111418',
      cursor: 'pointer',
      userSelect: 'none',
    },
    labelSecondary: {
      fontSize: '13px',
      color: '#5c6370',
    },

    // Style 1: Minimal Teal
    checkbox1: (checked) => ({
      width: '18px',
      height: '18px',
      borderRadius: '4px',
      border: checked ? 'none' : '2px solid #d0d3d8',
      backgroundColor: checked ? '#0d9488' : '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      flexShrink: 0,
    }),

    // Style 2: Rounded with shadow
    checkbox2: (checked) => ({
      width: '20px',
      height: '20px',
      borderRadius: '6px',
      border: checked ? 'none' : '1px solid #e2e4e8',
      backgroundColor: checked ? '#0d9488' : '#ffffff',
      boxShadow: checked 
        ? '0 2px 4px rgba(13, 148, 136, 0.3)' 
        : 'inset 0 1px 2px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      flexShrink: 0,
    }),

    // Style 3: Toggle/Switch
    toggle: (checked) => ({
      width: '40px',
      height: '22px',
      borderRadius: '11px',
      backgroundColor: checked ? '#0d9488' : '#e2e4e8',
      padding: '2px',
      cursor: 'pointer',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      flexShrink: 0,
    }),
    toggleThumb: (checked) => ({
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transform: checked ? 'translateX(18px)' : 'translateX(0)',
      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    }),

    // Style 4: Framer-style (subtle)
    checkbox4: (checked) => ({
      width: '16px',
      height: '16px',
      borderRadius: '4px',
      border: `1.5px solid ${checked ? '#0d9488' : '#c0c4cc'}`,
      backgroundColor: checked ? '#0d9488' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      flexShrink: 0,
    }),

    // Checkmark icon
    checkmark: {
      width: '10px',
      height: '10px',
      color: '#ffffff',
    },

    // Comparison section
    comparison: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
    },
    comparisonBox: {
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
    },
    comparisonLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#5c6370',
      marginBottom: '16px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },

    // Form-like context
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    formRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid #f0f1f2',
    },
    formLabel: {
      fontSize: '14px',
      color: '#111418',
    },
  };

  const CheckIcon = () => (
    <svg style={styles.checkmark} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Custom Checkbox Examples</h1>
      <p style={styles.subtitle}>Stili proposti per Jjodel — coerenti con il design system</p>

      {/* Style 1: Minimal */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Style 1: Minimal Teal (Consigliato)</div>
        <div style={styles.row} onClick={() => toggle('option1')}>
          <div style={styles.checkbox1(checks.option1)}>
            {checks.option1 && <CheckIcon />}
          </div>
          <span style={styles.label}>Adapt Width</span>
        </div>
        <div style={styles.row} onClick={() => toggle('option2')}>
          <div style={styles.checkbox1(checks.option2)}>
            {checks.option2 && <CheckIcon />}
          </div>
          <span style={styles.label}>Adapt Height</span>
        </div>
      </div>

      {/* Style 2: With shadow */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Style 2: Elevated</div>
        <div style={styles.row} onClick={() => toggle('option3')}>
          <div style={styles.checkbox2(checks.option3)}>
            {checks.option3 && <CheckIcon />}
          </div>
          <span style={styles.label}>Draggable</span>
        </div>
        <div style={styles.row} onClick={() => toggle('option4')}>
          <div style={styles.checkbox2(checks.option4)}>
            {checks.option4 && <CheckIcon />}
          </div>
          <span style={styles.label}>Resizable</span>
        </div>
      </div>

      {/* Style 3: Toggle */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Style 3: Toggle Switch (per on/off settings)</div>
        <div style={styles.row} onClick={() => toggle('option5')}>
          <div style={styles.toggle(checks.option5)}>
            <div style={styles.toggleThumb(checks.option5)} />
          </div>
          <span style={styles.label}>Lazy Update</span>
        </div>
        <div style={styles.row} onClick={() => toggle('option6')}>
          <div style={styles.toggle(checks.option6)}>
            <div style={styles.toggleThumb(checks.option6)} />
          </div>
          <span style={styles.label}>Store Size in View</span>
        </div>
      </div>

      {/* Context: Options Panel Mockup */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Come apparirebbe nel pannello Options</div>
        <div style={styles.formGroup}>
          <div style={styles.formRow}>
            <span style={styles.formLabel}>Store Size in View:</span>
            <div style={styles.checkbox1(false)} onClick={() => {}}>
            </div>
          </div>
          <div style={styles.formRow}>
            <span style={styles.formLabel}>Lazy Update:</span>
            <div style={styles.checkbox1(false)} onClick={() => {}}>
            </div>
          </div>
          <div style={styles.formRow}>
            <span style={styles.formLabel}>Adapt Width:</span>
            <div style={styles.checkbox1(true)} onClick={() => {}}>
              <CheckIcon />
            </div>
          </div>
          <div style={styles.formRow}>
            <span style={styles.formLabel}>Adapt Height:</span>
            <div style={styles.checkbox1(true)} onClick={() => {}}>
              <CheckIcon />
            </div>
          </div>
          <div style={styles.formRow}>
            <span style={styles.formLabel}>Draggable:</span>
            <div style={styles.checkbox1(true)} onClick={() => {}}>
              <CheckIcon />
            </div>
          </div>
          <div style={styles.formRow}>
            <span style={styles.formLabel}>Resizable:</span>
            <div style={styles.checkbox1(true)} onClick={() => {}}>
              <CheckIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Confronto: Browser Native vs Custom</div>
        <div style={styles.comparison}>
          <div style={styles.comparisonBox}>
            <div style={styles.comparisonLabel}>❌ Browser Native</div>
            <div style={styles.row}>
              <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
              <span style={styles.label}>Opzione attiva</span>
            </div>
            <div style={styles.row}>
              <input type="checkbox" style={{ width: '16px', height: '16px' }} />
              <span style={styles.label}>Opzione inattiva</span>
            </div>
          </div>
          <div style={styles.comparisonBox}>
            <div style={styles.comparisonLabel}>✅ Custom Teal</div>
            <div style={styles.row} onClick={() => toggle('option1')}>
              <div style={styles.checkbox1(true)}>
                <CheckIcon />
              </div>
              <span style={styles.label}>Opzione attiva</span>
            </div>
            <div style={styles.row}>
              <div style={styles.checkbox1(false)}>
              </div>
              <span style={styles.label}>Opzione inattiva</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Code */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>SCSS da usare</div>
        <pre style={{ 
          backgroundColor: '#1e1e1e', 
          color: '#d4d4d4', 
          padding: '16px', 
          borderRadius: '8px',
          fontSize: '13px',
          overflow: 'auto',
        }}>
{`.custom-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #d0d3d8;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    border-color: #0d9488;
  }
  
  &.checked {
    border: none;
    background-color: #0d9488;
    
    .checkmark {
      display: block;
    }
  }
  
  .checkmark {
    display: none;
    width: 10px;
    height: 10px;
    color: #ffffff;
  }
}`}
        </pre>
      </div>
    </div>
  );
};

export default CustomCheckboxExamples;
