import React from 'react';
import { useNavigate } from 'react-router-dom';
import './project-loading-screen.scss';

interface ProjectLoadingScreenProps {
  projectName?: string;
  /** Set when the open failed: the screen shows why, in place of the spinner (P-2026-09-25-0030). */
  error?: { kind: 'unreadable' | 'not-found'; details?: string };
}

export const ProjectLoadingScreen: React.FC<ProjectLoadingScreenProps> = ({
  projectName,
  error
}) => {
  const navigate = useNavigate();
  const errorTitle = error?.kind === 'not-found' ? 'This project was not found.' : 'This project could not be opened';

  const handleBackClick = () => {
    navigate('/allProjects');
  };

  return (
    <div className="project-loading-screen">
      {/* Back Navigation - Positioned top-left, minimal */}
      <button
        className="btn-back"
        onClick={handleBackClick}
        aria-label="Back to Projects"
        title="Projects"
      >
        <i className="bi bi-arrow-left" />
      </button>

      <div className="loading-content">
        {/* Animated Spinner */}
        {!error && <div className="loading-spinner">
          <svg viewBox="0 0 50 50" className="spinner-svg">
            <circle
              className="spinner-circle"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="4"
            />
          </svg>
        </div>}

        {/* Loading Message */}
        <h2 className="loading-title">
          {error ? errorTitle : projectName ? `Loading "${projectName}"...` : 'Loading Project...'}
        </h2>

        {!error && <p className="loading-subtitle">
          This should only take a moment
        </p>}

        {error?.kind === 'unreadable' && <p className="loading-subtitle">
          Jjodel could not read the saved data of this project. Nothing was loaded and your saved copy was not changed.
        </p>}

        {error?.details && <details className="loading-subtitle">
          <summary>Details</summary>
          {error.details}
        </details>}
      </div>
    </div>
  );
};

export default ProjectLoadingScreen;
