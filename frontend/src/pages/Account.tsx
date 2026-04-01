import {DState, DUser, LUser, Try} from '../joiner';
import {Dashboard} from './components';
import {FakeStateProps, windoww} from '../joiner/types';
import React, {Dispatch, JSX, ReactElement, ReactNode, useEffect, useState} from "react";
import {connect} from "react-redux";
import {UsersApi} from '../api/persistance';
import {useStateIfMounted} from 'use-state-if-mounted';
import Storage from '../data/storage';
import {UpdateUserRequest} from "../api/DTO/UpdateUserRequest";
import {ChangePasswordRequest} from "../api/DTO/ChangePasswordRequest";
import {U} from '../joiner';
import { Button } from '../components/common/Button';
import './account.scss';

// Country options extracted for reuse
const COUNTRIES = [
    "Afghanistan", "Åland Islands", "Albania", "Algeria", "American Samoa", "Andorra",
    "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina", "Armenia",
    "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh",
    "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia",
    "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei Darussalam", "Bulgaria",
    "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde",
    "Cayman Islands", "Central African Republic", "Chad", "Chile", "China", "Colombia",
    "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
    "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
    "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji",
    "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece",
    "Greenland", "Grenada", "Guatemala", "Guinea", "Guyana", "Haiti", "Honduras",
    "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran, Islamic Republic of",
    "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan",
    "Kenya", "Korea, Republic of", "Kuwait", "Kyrgyzstan", "Latvia", "Lebanon",
    "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macao",
    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritania",
    "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
    "Mozambique", "Myanmar", "Namibia", "Nepal", "Netherlands", "New Zealand",
    "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan", "Panama",
    "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar", "Romania", "Russian Federation", "Rwanda", "Saudi Arabia", "Senegal",
    "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
    "Somalia", "South Africa", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
    "Switzerland", "Syrian Arab Republic", "Taiwan", "Tajikistan", "Tanzania",
    "Thailand", "Togo", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
    "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Viet Nam", "Yemen", "Zambia",
    "Zimbabwe"
];

type PasswordStrength = 'weak' | 'medium' | 'strong';

interface ValidationErrors {
    [key: string]: string;
}

function AccountComponent(props: AllProps): JSX.Element {
    const {user} = props;

    // Profile state
    const [name, setName] = useStateIfMounted(user.name);
    const [surname, setSurname] = useStateIfMounted(user.surname);
    const [nickname, setNickname] = useStateIfMounted(user.nickname);
    const [country, setCountry] = useStateIfMounted(user.country);
    const [affiliation, setAffiliation] = useStateIfMounted(user.affiliation);
    const [newsletter, setNewsletter] = useStateIfMounted(user.newsletter);
    const [email, setEmail] = useStateIfMounted(user.email);
    const [emailNotifications, setEmailNotifications] = useStateIfMounted(true);
    const [productAnnouncements, setProductAnnouncements] = useStateIfMounted(false);

    // Password state
    const [oldPassword, setOldPassword] = useStateIfMounted('');
    const [newPassword, setNewPassword] = useStateIfMounted('');
    const [checkPassword, setCheckPassword] = useStateIfMounted('');

    // UI state
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');
    const [isProfileDirty, setIsProfileDirty] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    // Calculate password strength when new password changes
    useEffect(() => {
        if (newPassword) {
            setPasswordStrength(calculatePasswordStrength(newPassword));
        }
    }, [newPassword]);

    const calculatePasswordStrength = (password: string): PasswordStrength => {
        if (password.length < 6) return 'weak';

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength >= 4) return 'strong';
        if (strength >= 2) return 'medium';
        return 'weak';
    };

    const validateProfile = (): boolean => {
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

    const validatePassword = (): boolean => {
        const errors: ValidationErrors = {};

        if (!oldPassword) {
            errors.oldPassword = 'Current password is required';
        }

        if (!newPassword) {
            errors.newPassword = 'New password is required';
        } else if (newPassword.length < 8) {
            errors.newPassword = 'Password must be at least 8 characters';
        }

        if (newPassword !== checkPassword) {
            errors.checkPassword = 'Passwords do not match';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleProfileChange = (field: string) => {
        setIsProfileDirty(true);
        // Clear validation error for this field
        if (validationErrors[field]) {
            const newErrors = {...validationErrors};
            delete newErrors[field];
            setValidationErrors(newErrors);
        }
    };

    const handlePasswordFieldChange = (field: string) => {
        // Clear validation error for this field
        if (validationErrors[field]) {
            const newErrors = {...validationErrors};
            delete newErrors[field];
            setValidationErrors(newErrors);
        }
    };

    async function updatePassword(): Promise<void> {
        if (!validatePassword()) return;

        setIsSavingPassword(true);

        try {
            const changePasswordRequest = new ChangePasswordRequest();
            changePasswordRequest.UserName = nickname;
            changePasswordRequest.OldPassword = oldPassword;
            changePasswordRequest.Password = newPassword;
            changePasswordRequest.PasswordConfirm = checkPassword;

            await UsersApi.updatePassword(changePasswordRequest);

            // Clear password fields on success
            setOldPassword('');
            setNewPassword('');
            setCheckPassword('');
            U.alert('i', 'Password changed successfully!', '');

        } catch (error) {
            U.alert('e', 'Could not change password.', 'Please check your current password and try again.');
        } finally {
            setIsSavingPassword(false);
        }
    }

    async function updateProfile(): Promise<void> {
        if (!validateProfile()) return;

        setIsSavingProfile(true);

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

        try {
            const response = await UsersApi.updateUserById(updateUserRequest);

            if (!response) {
                U.alert('e', 'Could not update your profile.', 'Something went wrong...');
                return;
            }

            const updatedUser = DUser.new(
                name, surname, nickname, affiliation, country, newsletter, email, readUser.token, readUser.id, readUser._Id
            );
            Storage.write('user', updatedUser);
            setIsProfileDirty(false);
            U.alert('i', 'Your profile has been updated!', '');

        } catch (error) {
            U.alert('e', 'Could not update your profile.', 'Something went wrong...');
        } finally {
            setIsSavingProfile(false);
        }
    }

    return (
        <Try>
            <Dashboard active={'Account'} version={props.version}>
                <div className="account-page">
                    {/* Page Header */}
                    <div className="account-header">
                        <h1 className="account-header__title">
                            <i className="bi bi-person-circle"/>
                            Account Settings
                        </h1>
                        <p className="account-header__subtitle">
                            Manage your personal information and security settings
                        </p>
                    </div>

                    {/* Content */}
                    <div className="account-content">
                        {/* Personal Information Card */}
                        <div className="account-card">
                            <div className="account-card__header">
                                <div className="account-card__header-content">
                                    <i className="bi bi-person"/>
                                    <h2>Personal Information</h2>
                                </div>
                                {isProfileDirty && (
                                    <span className="account-card__status">
                                        <i className="bi bi-dot"/>
                                        Unsaved changes
                                    </span>
                                )}
                            </div>

                            <div className="account-card__body">
                                <div className="account-form">
                                    {/* Name */}
                                    <div className="form-field">
                                        <label className="form-label">
                                            Name <span className="form-label__required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-input ${validationErrors.name ? 'form-input--error' : ''}`}
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value);
                                                handleProfileChange('name');
                                            }}
                                            placeholder="Enter your name"
                                        />
                                        {validationErrors.name && (
                                            <span className="form-error">
                                                <i className="bi bi-exclamation-circle"/>
                                                {validationErrors.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Surname */}
                                    <div className="form-field">
                                        <label className="form-label">
                                            Surname <span className="form-label__required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-input ${validationErrors.surname ? 'form-input--error' : ''}`}
                                            value={surname}
                                            onChange={(e) => {
                                                setSurname(e.target.value);
                                                handleProfileChange('surname');
                                            }}
                                            placeholder="Enter your surname"
                                        />
                                        {validationErrors.surname && (
                                            <span className="form-error">
                                                <i className="bi bi-exclamation-circle"/>
                                                {validationErrors.surname}
                                            </span>
                                        )}
                                    </div>

                                    {/* Nickname */}
                                    <div className="form-field">
                                        <label className="form-label">
                                            Nickname <span className="form-label__required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-input ${validationErrors.nickname ? 'form-input--error' : ''}`}
                                            value={nickname}
                                            onChange={(e) => {
                                                setNickname(e.target.value);
                                                handleProfileChange('nickname');
                                            }}
                                            placeholder="Enter your nickname"
                                        />
                                        {validationErrors.nickname && (
                                            <span className="form-error">
                                                <i className="bi bi-exclamation-circle"/>
                                                {validationErrors.nickname}
                                            </span>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="form-field">
                                        <label className="form-label">
                                            Email <span className="form-label__required">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            className={`form-input ${validationErrors.email ? 'form-input--error' : ''}`}
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                handleProfileChange('email');
                                            }}
                                            placeholder="your@email.com"
                                        />
                                        {validationErrors.email && (
                                            <span className="form-error">
                                                <i className="bi bi-exclamation-circle"/>
                                                {validationErrors.email}
                                            </span>
                                        )}
                                    </div>

                                    {/* Affiliation */}
                                    <div className="form-field">
                                        <label className="form-label">Affiliation</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={affiliation}
                                            onChange={(e) => {
                                                setAffiliation(e.target.value);
                                                handleProfileChange('affiliation');
                                            }}
                                            placeholder="University, Company, etc."
                                        />
                                    </div>

                                    {/* Country */}
                                    <div className="form-field">
                                        <label className="form-label">Country</label>
                                        <select
                                            className="form-select"
                                            value={country}
                                            onChange={(e) => {
                                                setCountry(e.target.value);
                                                handleProfileChange('country');
                                            }}
                                        >
                                            {COUNTRIES.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="account-card__footer">
                                <Button
                                    variant="primary"
                                    onClick={updateProfile}
                                    disabled={!isProfileDirty || isSavingProfile}
                                >
                                    {isSavingProfile ? (
                                        <>
                                            <i className="bi bi-arrow-clockwise spin"/>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg"/>
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Security Card */}
                        <div className="account-card">
                            <div className="account-card__header">
                                <div className="account-card__header-content">
                                    <i className="bi bi-shield-lock"/>
                                    <h2>Security</h2>
                                </div>
                            </div>

                            <div className="account-card__body">
                                <div className="account-form account-form--single">
                                    {/* Current Password */}
                                    <div className="form-field form-field--full">
                                        <label className="form-label">
                                            Current Password <span className="form-label__required">*</span>
                                        </label>
                                        <div className="password-input">
                                            <input
                                                type={showOldPassword ? 'text' : 'password'}
                                                className={`form-input ${validationErrors.oldPassword ? 'form-input--error' : ''}`}
                                                value={oldPassword}
                                                onChange={(e) => {
                                                    setOldPassword(e.target.value);
                                                    handlePasswordFieldChange('oldPassword');
                                                }}
                                                placeholder="Enter current password"
                                            />
                                            <button
                                                type="button"
                                                className="password-input__toggle"
                                                onClick={() => setShowOldPassword(!showOldPassword)}
                                                aria-label="Toggle password visibility"
                                            >
                                                <i className={`bi ${showOldPassword ? 'bi-eye-slash' : 'bi-eye'}`}/>
                                            </button>
                                        </div>
                                        {validationErrors.oldPassword && (
                                            <span className="form-error">
                                                <i className="bi bi-exclamation-circle"/>
                                                {validationErrors.oldPassword}
                                            </span>
                                        )}
                                    </div>

                                    {/* New Password */}
                                    <div className="form-field form-field--full">
                                        <label className="form-label">
                                            New Password <span className="form-label__required">*</span>
                                        </label>
                                        <div className="password-input">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                className={`form-input ${validationErrors.newPassword ? 'form-input--error' : ''}`}
                                                value={newPassword}
                                                onChange={(e) => {
                                                    setNewPassword(e.target.value);
                                                    handlePasswordFieldChange('newPassword');
                                                }}
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                className="password-input__toggle"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                aria-label="Toggle password visibility"
                                            >
                                                <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}/>
                                            </button>
                                        </div>
                                        {newPassword && (
                                            <div className="password-strength">
                                                <div className="password-strength__bar">
                                                    <div
                                                        className={`password-strength__fill password-strength__fill--${passwordStrength}`}
                                                        style={{
                                                            width: passwordStrength === 'weak' ? '33%' :
                                                                passwordStrength === 'medium' ? '66%' : '100%'
                                                        }}
                                                    />
                                                </div>
                                                <span
                                                    className={`password-strength__label password-strength__label--${passwordStrength}`}>
                                                    {passwordStrength === 'weak' && 'Weak password'}
                                                    {passwordStrength === 'medium' && 'Medium strength'}
                                                    {passwordStrength === 'strong' && 'Strong password'}
                                                </span>
                                            </div>
                                        )}
                                        {validationErrors.newPassword && (
                                            <span className="form-error">
                                                <i className="bi bi-exclamation-circle"/>
                                                {validationErrors.newPassword}
                                            </span>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="form-field form-field--full">
                                        <label className="form-label">
                                            Confirm Password <span className="form-label__required">*</span>
                                        </label>
                                        <div className="password-input">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                className={`form-input ${validationErrors.checkPassword ? 'form-input--error' : ''}`}
                                                value={checkPassword}
                                                onChange={(e) => {
                                                    setCheckPassword(e.target.value);
                                                    handlePasswordFieldChange('checkPassword');
                                                }}
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                className="password-input__toggle"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                aria-label="Toggle password visibility"
                                            >
                                                <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}/>
                                            </button>
                                        </div>
                                        {validationErrors.checkPassword && (
                                            <span className="form-error">
                                                <i className="bi bi-exclamation-circle"/>
                                                {validationErrors.checkPassword}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="account-card__footer">
                                <Button
                                    variant="primary"
                                    onClick={updatePassword}
                                    disabled={isSavingPassword}
                                >
                                    {isSavingPassword ? (
                                        <>
                                            <i className="bi bi-arrow-clockwise spin"/>
                                            Changing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-shield-check"/>
                                            Change Password
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Preferences Card */}
                        <div className="account-card">
                            <div className="account-card__header">
                                <div className="account-card__header-content">
                                    <i className="bi bi-sliders"/>
                                    <h2>Preferences</h2>
                                </div>
                            </div>

                            <div className="account-card__body">
                                <div className="preferences-list">
                                    <label className="preference-item">
                                        <div className="preference-item__content">
                                            <div className="preference-item__title">Email Notifications</div>
                                            <div className="preference-item__description">
                                                Receive email notifications about project updates and activity
                                            </div>
                                        </div>
                                        <div
                                            className={`preference-toggle ${emailNotifications ? 'preference-toggle--active' : ''}`}
                                            onClick={() => {
                                                setEmailNotifications(!emailNotifications);
                                                setIsProfileDirty(true);
                                            }}
                                        >
                                            <div className="preference-toggle__thumb"/>
                                        </div>
                                    </label>

                                    <label className="preference-item">
                                        <div className="preference-item__content">
                                            <div className="preference-item__title">Newsletter</div>
                                            <div className="preference-item__description">
                                                Stay updated with Jjodel news, tips, and feature announcements
                                            </div>
                                        </div>
                                        <div
                                            className={`preference-toggle ${newsletter ? 'preference-toggle--active' : ''}`}
                                            onClick={() => {
                                                setNewsletter(!newsletter);
                                                setIsProfileDirty(true);
                                            }}
                                        >
                                            <div className="preference-toggle__thumb"/>
                                        </div>
                                    </label>

                                    <label className="preference-item">
                                        <div className="preference-item__content">
                                            <div className="preference-item__title">Product Announcements</div>
                                            <div className="preference-item__description">
                                                Get notified about new features, updates, and improvements
                                            </div>
                                        </div>
                                        <div
                                            className={`preference-toggle ${productAnnouncements ? 'preference-toggle--active' : ''}`}
                                            onClick={() => {
                                                setProductAnnouncements(!productAnnouncements);
                                                setIsProfileDirty(true);
                                            }}
                                        >
                                            <div className="preference-toggle__thumb"/>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="account-card__footer">
                                <Button
                                    variant="primary"
                                    onClick={updateProfile}
                                    disabled={!isProfileDirty || isSavingProfile}
                                >
                                    <i className="bi bi-check-lg"/>
                                    Save Preferences
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Dashboard>
        </Try>
    );
}

interface OwnProps {
}

interface StateProps {
    user: LUser;
    version: DState["version"];
}

interface DispatchProps {
}

type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.getUser();
    ret.version = state.version;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

const AllProjectsConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(AccountComponent);

const AccountPage = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <AllProjectsConnected {...{...props, children}} />;
}

export {AccountPage};
