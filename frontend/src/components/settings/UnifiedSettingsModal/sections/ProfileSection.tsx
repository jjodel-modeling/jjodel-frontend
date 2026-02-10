/**
 * ProfileSection Component
 * Personal information settings (migrated from Account.tsx)
 */

import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { DState, DUser, LUser } from '../../../../joiner';
import { UsersApi } from '../../../../api/persistance';
import { UpdateUserRequest } from '../../../../api/DTO/UpdateUserRequest';
import Storage from '../../../../data/storage';
import { U } from '../../../../joiner';
import { FakeStateProps } from '../../../../joiner/types';

// Country options
const COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia",
    "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belgium", "Bolivia",
    "Bosnia and Herzegovina", "Brazil", "Bulgaria", "Cambodia", "Canada",
    "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus",
    "Czech Republic", "Denmark", "Dominican Republic", "Ecuador", "Egypt",
    "El Salvador", "Estonia", "Ethiopia", "Finland", "France", "Georgia",
    "Germany", "Ghana", "Greece", "Guatemala", "Honduras", "Hong Kong",
    "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
    "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
    "Korea, Republic of", "Kuwait", "Latvia", "Lebanon", "Libya", "Lithuania",
    "Luxembourg", "Malaysia", "Malta", "Mexico", "Morocco", "Netherlands",
    "New Zealand", "Nigeria", "Norway", "Pakistan", "Panama", "Paraguay",
    "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
    "Russian Federation", "Saudi Arabia", "Serbia", "Singapore", "Slovakia",
    "Slovenia", "South Africa", "Spain", "Sri Lanka", "Sweden", "Switzerland",
    "Taiwan", "Thailand", "Tunisia", "Turkey", "Ukraine", "United Arab Emirates",
    "United Kingdom", "United States", "Uruguay", "Venezuela", "Viet Nam", "Zimbabwe"
];

interface ValidationErrors {
    [key: string]: string;
}

interface ProfileSectionProps {
    user: LUser;
}

function ProfileSectionComponent({ user }: ProfileSectionProps): JSX.Element {
    // Form state
    const [name, setName] = useState(user.name || '');
    const [surname, setSurname] = useState(user.surname || '');
    const [nickname, setNickname] = useState(user.nickname || '');
    const [email, setEmail] = useState(user.email || '');
    const [affiliation, setAffiliation] = useState(user.affiliation || '');
    const [country, setCountry] = useState(user.country || '');
    const [newsletter, setNewsletter] = useState(user.newsletter || false);

    // UI state
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Reset form when user changes
    useEffect(() => {
        setName(user.name || '');
        setSurname(user.surname || '');
        setNickname(user.nickname || '');
        setEmail(user.email || '');
        setAffiliation(user.affiliation || '');
        setCountry(user.country || '');
        setNewsletter(user.newsletter || false);
        setIsDirty(false);
    }, [user]);

    const handleChange = (field: string, value: string | boolean) => {
        setIsDirty(true);
        // Clear validation error for this field
        if (validationErrors[field]) {
            const newErrors = { ...validationErrors };
            delete newErrors[field];
            setValidationErrors(newErrors);
        }

        switch (field) {
            case 'name': setName(value as string); break;
            case 'surname': setSurname(value as string); break;
            case 'nickname': setNickname(value as string); break;
            case 'email': setEmail(value as string); break;
            case 'affiliation': setAffiliation(value as string); break;
            case 'country': setCountry(value as string); break;
            case 'newsletter': setNewsletter(value as boolean); break;
        }
    };

    const validateForm = (): boolean => {
        const errors: ValidationErrors = {};

        if (!name.trim()) {
            errors.name = 'Name is required';
        }

        if (!surname.trim()) {
            errors.surname = 'Surname is required';
        }

        if (!nickname.trim()) {
            errors.nickname = 'Nickname is required';
        }

        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Invalid email format';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setIsSaving(true);

        try {
            const readUser = Storage.read<DUser>('user');

            const updateUserRequest = new UpdateUserRequest();
            updateUserRequest.id = readUser.id;
            updateUserRequest._Id = readUser._Id;
            updateUserRequest.name = name;
            updateUserRequest.surname = surname;
            updateUserRequest.nickname = nickname;
            updateUserRequest.country = country;
            updateUserRequest.email = email;
            updateUserRequest.affiliation = affiliation;
            updateUserRequest.newsletter = newsletter;

            const response = await UsersApi.updateUserById(updateUserRequest);

            if (!response) {
                U.alert('e', 'Could not update your profile.', 'Something went wrong...');
                return;
            }

            const updatedUser = DUser.new(
                name, surname, nickname, affiliation, country, newsletter, email,
                readUser.token, readUser.id, readUser._Id
            );
            Storage.write('user', updatedUser);
            setIsDirty(false);
            U.alert('i', 'Profile updated successfully!', '');

        } catch (error) {
            U.alert('e', 'Could not update your profile.', 'Something went wrong...');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="profile-section">
            <div className="settings-section-header">
                <div className="settings-section-header-content">
                    <h3 className="settings-section-title">Personal Information</h3>
                    <p className="settings-section-description">
                        Update your personal details and preferences
                    </p>
                </div>
                {isDirty && (
                    <span className="settings-unsaved-badge">
                        <span className="settings-unsaved-badge__dot" />
                        Unsaved changes
                    </span>
                )}
            </div>

            <div className="settings-form-row">
                {/* Name */}
                <div className="settings-field">
                    <label className="settings-field-label">
                        Name <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        className={`settings-field-input ${validationErrors.name ? 'error' : ''}`}
                        value={name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Enter your name"
                    />
                    {validationErrors.name && (
                        <span className="settings-field-error">
                            <i className="bi bi-exclamation-circle" />
                            {validationErrors.name}
                        </span>
                    )}
                </div>

                {/* Surname */}
                <div className="settings-field">
                    <label className="settings-field-label">
                        Surname <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        className={`settings-field-input ${validationErrors.surname ? 'error' : ''}`}
                        value={surname}
                        onChange={(e) => handleChange('surname', e.target.value)}
                        placeholder="Enter your surname"
                    />
                    {validationErrors.surname && (
                        <span className="settings-field-error">
                            <i className="bi bi-exclamation-circle" />
                            {validationErrors.surname}
                        </span>
                    )}
                </div>
            </div>

            <div className="settings-form-row">
                {/* Nickname */}
                <div className="settings-field">
                    <label className="settings-field-label">
                        Nickname <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        className={`settings-field-input ${validationErrors.nickname ? 'error' : ''}`}
                        value={nickname}
                        onChange={(e) => handleChange('nickname', e.target.value)}
                        placeholder="Enter your nickname"
                    />
                    {validationErrors.nickname && (
                        <span className="settings-field-error">
                            <i className="bi bi-exclamation-circle" />
                            {validationErrors.nickname}
                        </span>
                    )}
                </div>

                {/* Email */}
                <div className="settings-field">
                    <label className="settings-field-label">
                        Email <span className="required">*</span>
                    </label>
                    <input
                        type="email"
                        className={`settings-field-input ${validationErrors.email ? 'error' : ''}`}
                        value={email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="your@email.com"
                    />
                    {validationErrors.email && (
                        <span className="settings-field-error">
                            <i className="bi bi-exclamation-circle" />
                            {validationErrors.email}
                        </span>
                    )}
                </div>
            </div>

            <div className="settings-form-row">
                {/* Affiliation */}
                <div className="settings-field">
                    <label className="settings-field-label">Affiliation</label>
                    <input
                        type="text"
                        className="settings-field-input"
                        value={affiliation}
                        onChange={(e) => handleChange('affiliation', e.target.value)}
                        placeholder="University, Company, etc."
                    />
                </div>

                {/* Country */}
                <div className="settings-field">
                    <label className="settings-field-label">Country</label>
                    <select
                        className="settings-field-select"
                        value={country}
                        onChange={(e) => handleChange('country', e.target.value)}
                    >
                        <option value="">Select a country...</option>
                        {COUNTRIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="settings-divider" />

            {/* Preferences */}
            <h4 className="settings-section-title" style={{ fontSize: '14px', marginBottom: '12px' }}>
                Preferences
            </h4>

            <div
                className="settings-toggle"
                onClick={() => handleChange('newsletter', !newsletter)}
            >
                <div className="settings-toggle-content">
                    <div className="settings-toggle-title">Newsletter</div>
                    <div className="settings-toggle-description">
                        Stay updated with Jjodel news, tips, and feature announcements
                    </div>
                </div>
                <div className={`settings-toggle-switch ${newsletter ? 'active' : ''}`}>
                    <div className="settings-toggle-thumb" />
                </div>
            </div>

            {/* Actions */}
            <div className="settings-form-actions">
                <button
                    className="settings-btn-primary"
                    onClick={handleSave}
                    disabled={!isDirty || isSaving}
                >
                    {isSaving ? (
                        <>
                            <i className="bi bi-arrow-clockwise spinning" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-check-lg" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// Redux connection
interface StateProps {
    user: LUser;
}

function mapStateToProps(state: DState): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    return ret;
}

export const ProfileSection = connect<StateProps, {}, {}, DState>(
    mapStateToProps
)(ProfileSectionComponent);

export default ProfileSection;
