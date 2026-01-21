import React from 'react';
import './empty-dashboard.scss';

interface OnboardingCardProps {
  icon: string;
  step: number;
  title: string;
  description: string;
  buttonLabel: string;
  buttonIcon?: string;
  buttonVariant?: 'primary' | 'secondary';
  onClick: () => void;
}

const OnboardingCard: React.FC<OnboardingCardProps> = ({
  icon,
  step,
  title,
  description,
  buttonLabel,
  buttonIcon,
  buttonVariant = 'secondary',
  onClick
}) => (
  <div className="onboarding-card">
    <span className="card-step">Step {step}</span>
    <i className={`bi ${icon} card-icon`} />
    <h3 className="card-title">{title}</h3>
    <p className="card-description">{description}</p>
    <button
      className={`btn ${buttonVariant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
      onClick={onClick}
    >
      {buttonIcon && <i className={`bi ${buttonIcon}`} />}
      {buttonLabel}
    </button>
  </div>
);

interface ResourceLinkProps {
  href: string;
  icon: string;
  children: React.ReactNode;
}

const ResourceLink: React.FC<ResourceLinkProps> = ({ href, icon, children }) => (
  <li>
    <a href={href} target="_blank" rel="noopener noreferrer">
      <i className={`bi ${icon}`} />
      {children}
    </a>
  </li>
);

interface EmptyDashboardProps {
  onNewProject: () => void;
}

export const EmptyDashboard: React.FC<EmptyDashboardProps> = ({
  onNewProject
}) => {
  const handleGetStarted = () => {
    window.open('https://www.jjodel.io/get-started/', '_blank');
  };

  const handleUserManual = () => {
    window.open('https://www.jjodel.io/user-manual/', '_blank');
  };

  return (
    <div className="empty-dashboard">
      {/* Hero Section */}
      <div className="welcome-hero">
        <div className="hero-icon">
          <i className="bi bi-rocket-takeoff" />
        </div>
        <h1>Welcome to Jjodel!</h1>
        <p className="hero-description">
          Jjodel makes metamodeling accessible for research and education.
          Get started in 3 steps:
        </p>
      </div>

      {/* Onboarding Steps Grid */}
      <div className="onboarding-steps">
        <OnboardingCard
          icon="bi-plus-circle"
          step={1}
          title="Quick Start"
          description="Create your first project"
          buttonLabel="New Project"
          buttonIcon="bi-plus-lg"
          buttonVariant="primary"
          onClick={onNewProject}
        />
        <OnboardingCard
          icon="bi-book"
          step={2}
          title="Learn Basics"
          description="Read the Getting Started guide"
          buttonLabel="Get Started"
          buttonIcon="bi-book"
          onClick={handleGetStarted}
        />
        <OnboardingCard
          icon="bi-journal-text"
          step={3}
          title="Read Docs"
          description="User Manual & API Reference"
          buttonLabel="Manual"
          buttonIcon="bi-journal-text"
          onClick={handleUserManual}
        />
      </div>

      {/* Popular Resources */}
      <div className="popular-resources">
        <h3>
          <i className="bi bi-book" />
          Popular Resources
        </h3>
        <ul>
          <ResourceLink href="https://www.jjodel.io/get-started/" icon="bi-rocket-takeoff">
            Getting Started Guide
          </ResourceLink>
          <ResourceLink href="https://www.jjodel.io/user-manual/" icon="bi-journal-text">
            User Manual & API Reference
          </ResourceLink>
          <ResourceLink href="https://www.jjodel.io/tutorials/" icon="bi-play-btn">
            Video Tutorials
          </ResourceLink>
          <ResourceLink href="https://www.jjodel.io/documentation/" icon="bi-file-text">
            Documentation
          </ResourceLink>
        </ul>
      </div>

      {/* Help Footer */}
      <div className="help-footer">
        <i className="bi bi-chat-dots" />
        <span>Need help?</span>
        <a href="https://www.jjodel.io/community/" target="_blank" rel="noopener noreferrer">
          Join our community
        </a>
        <span className="separator">or</span>
        <a href="https://www.jjodel.io/documentation/" target="_blank" rel="noopener noreferrer">
          check the docs
        </a>
      </div>
    </div>
  );
};

export default EmptyDashboard;
