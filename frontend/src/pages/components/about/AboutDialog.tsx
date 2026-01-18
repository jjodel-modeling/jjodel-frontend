import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import logo from '../../../static/img/logo-light-150.png';
import "./about-dialog.scss";

// Global state for opening the dialog
let openDialogFn: (() => void) | null = null;

export class AboutDialogController {
    static open() {
        openDialogFn?.();
    }
}

type AboutDialogProps = {
    isOpen: boolean;
    onClose: () => void;
};

const AboutDialogContent = ({ isOpen, onClose }: AboutDialogProps) => {
    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return ReactDOM.createPortal(
        <div className="about-dialog-overlay" onClick={handleBackdropClick}>
            <div className="about-dialog" role="dialog" aria-modal="true" aria-label="About Jjodel">
                {/* Close Button */}
                <button
                    className="about-dialog__close"
                    onClick={onClose}
                    aria-label="Close dialog"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Logo */}
                <div className="about-dialog__logo">
                    <img src={logo} alt="Jjodel Logo" width="80" height="80" />
                </div>

                {/* Description */}
                <p className="about-dialog__description">
                    Jjodel is an open-source metamodeling infrastructure that supports research
                    and education through a sustainable, cloud-based infrastructure. It enables
                    collaborative modeling, reduces accidental complexity, and fosters long-term
                    co-evolution of languages, models, and tools.
                </p>

                {/* Version & License */}
                <div className="about-dialog__meta">
                    <span className="about-dialog__version">v2.0.6</span>
                    <a
                        href="https://opensource.org/licenses/MIT"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="about-dialog__license"
                    >
                        MIT License
                    </a>
                </div>

                {/* Links */}
                <div className="about-dialog__links">
                    <a
                        href="https://www.jjodel.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="about-dialog__link"
                    >
                        <i className="bi bi-globe" />
                        Website
                    </a>
                    <a
                        href="https://github.com/jjodel-modeling"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="about-dialog__link"
                    >
                        <i className="bi bi-github" />
                        GitHub
                    </a>
                    <a
                        href="https://www.jjodel.io/releases/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="about-dialog__link"
                    >
                        <i className="bi bi-journal-text" />
                        Changelog
                    </a>
                </div>

                {/* Credits */}
                <div className="about-dialog__credits">
                    <p className="about-dialog__credits-group">SWEN Research Group</p>
                    <p className="about-dialog__credits-institution">Università degli Studi dell'Aquila</p>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Main exported component that manages state
export const AboutDialog = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Register the open function
    useEffect(() => {
        openDialogFn = () => setIsOpen(true);
        return () => {
            openDialogFn = null;
        };
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    return <AboutDialogContent isOpen={isOpen} onClose={handleClose} />;
};

export default AboutDialog;
