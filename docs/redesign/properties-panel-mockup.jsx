import React from 'react';

/**
 * PROPERTIES PANEL MOCKUP - New Design
 *
 * Structure:
 * 1. Header - Large icon, name, type badge, description
 * 2. Overview - Stats grid 2x2 (Classes, Attributes, References, Operations)
 * 3. Details - Form fields (Name, Readonly, Dependencies, State)
 * 4. Info - Metadata (Created by, Last modified)
 * 5. Actions - Buttons (Edit, Duplicate, Delete)
 */

const PropertiesPanelMockup = () => {
  const styles = {
    // Container
    panel: {
      fontFamily: "'Inter', -apple-system, sans-serif",
      backgroundColor: '#f8f9fa',
      padding: '16px',
      height: '100%',
      overflow: 'auto',
    },

    // ========================================
    // HEADER SECTION
    // ========================================
    header: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e2e4e8',
    },
    headerIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      backgroundColor: 'rgba(13, 148, 136, 0.1)',
      color: '#0d9488',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      flexShrink: 0,
    },
    headerContent: {
      flex: 1,
      minWidth: 0,
    },
    headerTop: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px',
    },
    headerName: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#111418',
      margin: 0,
    },
    headerBadge: {
      fontSize: '11px',
      fontWeight: '500',
      padding: '2px 8px',
      borderRadius: '4px',
      backgroundColor: 'rgba(13, 148, 136, 0.1)',
      color: '#0d9488',
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
    },
    headerDescription: {
      fontSize: '13px',
      color: '#5c6370',
      margin: 0,
      lineHeight: '1.4',
    },

    // ========================================
    // SECTION CONTAINER
    // ========================================
    section: {
      marginBottom: '20px',
    },
    sectionTitle: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#5c6370',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    sectionTitleIcon: {
      fontSize: '14px',
      color: '#0d9488',
    },
    sectionContent: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e2e4e8',
      overflow: 'hidden',
    },

    // ========================================
    // OVERVIEW SECTION - Stats Grid
    // ========================================
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1px',
      backgroundColor: '#e2e4e8',
    },
    statItem: {
      backgroundColor: '#ffffff',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    statIcon: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
    },
    statIconClasses: {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      color: '#3b82f6',
    },
    statIconAttributes: {
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      color: '#a855f7',
    },
    statIconReferences: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      color: '#22c55e',
    },
    statIconOperations: {
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      color: '#f97316',
    },
    statContent: {
      flex: 1,
    },
    statValue: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#111418',
      lineHeight: 1,
    },
    statLabel: {
      fontSize: '12px',
      color: '#5c6370',
      marginTop: '2px',
    },

    // ========================================
    // DETAILS SECTION - Form Fields
    // ========================================
    formField: {
      padding: '12px 16px',
      borderBottom: '1px solid #f0f1f2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    formFieldLast: {
      borderBottom: 'none',
    },
    formLabel: {
      fontSize: '14px',
      color: '#111418',
      fontWeight: '500',
    },
    formInput: {
      fontSize: '14px',
      color: '#111418',
      backgroundColor: '#f8f9fa',
      border: '1px solid #e2e4e8',
      borderRadius: '6px',
      padding: '8px 12px',
      minWidth: '180px',
      outline: 'none',
      transition: 'border-color 0.15s ease',
    },
    formSelect: {
      fontSize: '14px',
      color: '#111418',
      backgroundColor: '#f8f9fa',
      border: '1px solid #e2e4e8',
      borderRadius: '6px',
      padding: '8px 12px',
      minWidth: '180px',
      outline: 'none',
      cursor: 'pointer',
    },

    // Custom checkbox (matches global style)
    checkbox: {
      width: '18px',
      height: '18px',
      borderRadius: '4px',
      border: '2px solid #d0d3d8',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    checkboxChecked: {
      border: 'none',
      backgroundColor: '#0d9488',
    },

    // ========================================
    // INFO SECTION - Metadata
    // ========================================
    infoRow: {
      padding: '10px 16px',
      borderBottom: '1px solid #f0f1f2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    infoLabel: {
      fontSize: '13px',
      color: '#5c6370',
    },
    infoValue: {
      fontSize: '13px',
      color: '#111418',
    },

    // ========================================
    // ACTIONS SECTION - Buttons
    // ========================================
    actionsContainer: {
      display: 'flex',
      gap: '8px',
      padding: '12px 16px',
    },
    btnPrimary: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '10px 16px',
      backgroundColor: '#0d9488',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.15s ease',
    },
    btnSecondary: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '10px 16px',
      backgroundColor: 'transparent',
      color: '#111418',
      border: '1px solid #e2e4e8',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    btnDanger: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '10px 16px',
      backgroundColor: 'transparent',
      color: '#dc2626',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
  };

  // SVG Icons
  const CheckIcon = () => (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div style={styles.panel}>
      {/* ========================================
          HEADER SECTION
          ======================================== */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <i className="bi bi-diagram-3" />
        </div>
        <div style={styles.headerContent}>
          <div style={styles.headerTop}>
            <h1 style={styles.headerName}>PersonMetamodel</h1>
            <span style={styles.headerBadge}>Metamodel</span>
          </div>
          <p style={styles.headerDescription}>
            A metamodel for managing person entities with attributes and relationships.
          </p>
        </div>
      </div>

      {/* ========================================
          OVERVIEW SECTION
          ======================================== */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <i className="bi bi-bar-chart" style={styles.sectionTitleIcon} />
          Overview
        </div>
        <div style={styles.sectionContent}>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <div style={{...styles.statIcon, ...styles.statIconClasses}}>
                <i className="bi bi-box" />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>4</div>
                <div style={styles.statLabel}>Classes</div>
              </div>
            </div>
            <div style={styles.statItem}>
              <div style={{...styles.statIcon, ...styles.statIconAttributes}}>
                <i className="bi bi-type" />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>12</div>
                <div style={styles.statLabel}>Attributes</div>
              </div>
            </div>
            <div style={styles.statItem}>
              <div style={{...styles.statIcon, ...styles.statIconReferences}}>
                <i className="bi bi-link-45deg" />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>6</div>
                <div style={styles.statLabel}>References</div>
              </div>
            </div>
            <div style={styles.statItem}>
              <div style={{...styles.statIcon, ...styles.statIconOperations}}>
                <i className="bi bi-gear" />
              </div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>2</div>
                <div style={styles.statLabel}>Operations</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          DETAILS SECTION
          ======================================== */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <i className="bi bi-sliders" style={styles.sectionTitleIcon} />
          Details
        </div>
        <div style={styles.sectionContent}>
          <div style={styles.formField}>
            <span style={styles.formLabel}>Name</span>
            <input
              type="text"
              style={styles.formInput}
              defaultValue="PersonMetamodel"
            />
          </div>
          <div style={styles.formField}>
            <span style={styles.formLabel}>Readonly</span>
            <div style={{...styles.checkbox, ...styles.checkboxChecked}}>
              <CheckIcon />
            </div>
          </div>
          <div style={styles.formField}>
            <span style={styles.formLabel}>Dependencies</span>
            <select style={styles.formSelect}>
              <option>None</option>
              <option>BaseTypes</option>
            </select>
          </div>
          <div style={{...styles.formField, ...styles.formFieldLast}}>
            <span style={styles.formLabel}>State</span>
            <select style={styles.formSelect}>
              <option>Active</option>
              <option>Draft</option>
              <option>Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================
          INFO SECTION
          ======================================== */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <i className="bi bi-info-circle" style={styles.sectionTitleIcon} />
          Info
        </div>
        <div style={styles.sectionContent}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Created by</span>
            <span style={styles.infoValue}>Alfonso de la Vega</span>
          </div>
          <div style={{...styles.infoRow, borderBottom: 'none'}}>
            <span style={styles.infoLabel}>Last modified</span>
            <span style={styles.infoValue}>2 hours ago</span>
          </div>
        </div>
      </div>

      {/* ========================================
          ACTIONS SECTION
          ======================================== */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          <i className="bi bi-lightning" style={styles.sectionTitleIcon} />
          Actions
        </div>
        <div style={styles.sectionContent}>
          <div style={styles.actionsContainer}>
            <button style={styles.btnPrimary}>
              <i className="bi bi-pencil" />
              Edit
            </button>
            <button style={styles.btnSecondary}>
              <i className="bi bi-copy" />
              Duplicate
            </button>
            <button style={styles.btnDanger}>
              <i className="bi bi-trash" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanelMockup;

/**
 * SCSS Classes to add to info.scss:
 *
 * .properties-panel { ... }
 * .properties-header { ... }
 * .properties-section { ... }
 * .properties-section-title { ... }
 * .properties-stats-grid { ... }
 * .properties-stat-item { ... }
 * .properties-form-field { ... }
 * .properties-info-row { ... }
 * .properties-actions { ... }
 * .btn-primary, .btn-secondary, .btn-danger { ... }
 */
