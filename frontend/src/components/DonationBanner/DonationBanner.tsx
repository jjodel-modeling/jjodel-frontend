import React from 'react';
import { useDonationBanner } from './useDonationBanner';
import openCollectiveLogo from '../../assets/opencollective-logo.svg';
import './DonationBanner.scss';

const DONATE_URL = 'https://opencollective.com/jjodel';

export const DonationBanner: React.FC = () => {
    const { isVisible, dismiss } = useDonationBanner();

    if (!isVisible) return null;

    return (
        <div className="donation-banner" role="complementary" aria-label="Support Jjodel">
            <button
                className="donation-banner__close"
                onClick={dismiss}
                aria-label="Chiudi"
            >
                <i className="bi bi-x" />
            </button>

            <div className="donation-banner__header">
                <a href={'https://opencollective.com/'}><img
                    src={openCollectiveLogo}
                    alt="Open Collective"
                    className="donation-banner__logo"
                />
                </a>
            </div>
            <div className="donation-banner__header">
            <span className="donation-banner__title">Support Jjodel</span>
            </div>

            <p className="donation-banner__body">
                Jjodel è gratuito e open source. Se lo usi nella tua ricerca o didattica,
                considera una donazione per mantenere viva la piattaforma cloud.
            </p>

            <a
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="donation-banner__cta"
                onClick={dismiss}
            >
                Dona su Open Collective →
            </a>
        </div>
    );
};

export default DonationBanner;
