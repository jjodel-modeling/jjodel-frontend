import React from 'react';
import './empty-dashboard.scss';
import { DevModeLabel } from '../DevModeLabel/DevModeLabel';

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

interface ResourceCardProps {
  href: string;
  icon: string;
  title: string;
  ariaLabel: string;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ href, icon, title, ariaLabel }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="resource-card"
    aria-label={ariaLabel}
  >
    <span className="resource-icon">{icon}</span>
    <span className="resource-title">{title}</span>
    <span className="resource-arrow">
      <i className="bi bi-arrow-right" />
    </span>
  </a>
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
      {/* Dev Mode Label */}
      <DevModeLabel componentId="T2.1" />

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
        <h3>Popular Resources</h3>
        <div className="resources-grid">
          <ResourceCard
            href="https://www.jjodel.io/get-started/"
            icon="🚀"
            title="Getting Started Guide"
            ariaLabel="Getting Started Guide - opens in new tab"
          />
          <ResourceCard
            href="https://www.jjodel.io/user-manual/"
            icon="📖"
            title="User Manual & API Reference"
            ariaLabel="User Manual & API Reference - opens in new tab"
          />
          <ResourceCard
            href="https://www.jjodel.io/tutorials/"
            icon="▶️"
            title="Video Tutorials"
            ariaLabel="Video Tutorials - opens in new tab"
          />
          <ResourceCard
            href="https://www.jjodel.io/documentation/"
            icon="📄"
            title="Documentation"
            ariaLabel="Documentation - opens in new tab"
          />
        </div>
      </div>

      {/* Help Footer */}
      <div className="help-footer">
        <i className="bi bi-chat-dots" />
        <span>Need help?</span>
        <a href="https://discord.gg/qxy7rjDd" target="_blank" rel="noopener noreferrer">
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
