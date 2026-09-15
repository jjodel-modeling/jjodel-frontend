import React from 'react';
import { useNavigate } from 'react-router-dom';
import './project-loading-screen.scss';

interface ProjectLoadingScreenProps {
  projectName?: string;
}

export const ProjectLoadingScreen: React.FC<ProjectLoadingScreenProps> = ({
  projectName
}) => {
  const navigate = useNavigate();

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
        <div className="loading-spinner">
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
        </div>

        {/* Loading Message */}
        <h2 className="loading-title">
          {projectName ? `Loading "${projectName}"...` : 'Loading Project...'}
        </h2>

        <p className="loading-subtitle">
          This should only take a moment
        </p>
      </div>
    </div>
  );
};

export default ProjectLoadingScreen;
