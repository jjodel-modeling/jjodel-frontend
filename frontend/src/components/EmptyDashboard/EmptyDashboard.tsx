import React from 'react';
import './empty-dashboard.scss';
import { DevModeLabel } from '../DevModeLabel/DevModeLabel';

interface EmptyDashboardProps {
  onNewProject: () => void;
}

export const EmptyDashboard: React.FC<EmptyDashboardProps> = ({
  onNewProject
}) => {
  return (
    <div className="empty-projects">
      <DevModeLabel componentId="T2.1" />

      {/* Icon — three-node graph, domain-specific for Jjodel */}
      <div className="empty-projects__icon">
        <svg
          width="28" height="28"
          fill="none" stroke="currentColor" strokeWidth="1.3"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="5"  cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
          <line x1="12" y1="7"  x2="5"  y2="17" />
          <line x1="12" y1="7"  x2="19" y2="17" />
          <line x1="5"  y1="17" x2="19" y2="17" />
        </svg>
      </div>

      <h2 className="empty-projects__title">No projects yet</h2>

      <p className="empty-projects__sub">
        Create your first metamodel project and start building
        domain-specific languages in the browser.
      </p>

      <button
        className="empty-projects__cta"
        onClick={onNewProject}
      >
        <i className="bi bi-plus" />
        New project
      </button>

      <div className="empty-projects__links">
        <a
          className="empty-projects__link"
          href="https://www.jjodel.io/get-started/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Getting started guide
        </a>
        <span className="empty-projects__sep">&middot;</span>
        <a
          className="empty-projects__link"
          href="https://www.jjodel.io/tutorials/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Video tutorials
        </a>
        <span className="empty-projects__sep">&middot;</span>
        <a
          className="empty-projects__link"
          href="https://www.jjodel.io/documentation/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Documentation
        </a>
      </div>
    </div>
  );
};

export default EmptyDashboard;
