/**
 * SecuritySection Component
 * Password change functionality (migrated from Account.tsx)
 */

import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { DState, DUser, LUser } from '../../../../joiner';
import { UsersApi } from '../../../../api/persistance';
import { ChangePasswordRequest } from '../../../../api/DTO/ChangePasswordRequest';
import { U } from '../../../../joiner';
import { FakeStateProps } from '../../../../joiner/types';

type PasswordStrength = 'weak' | 'medium' | 'strong';

interface ValidationErrors {
    [key: string]: string;
}

interface SecuritySectionProps {
    user: LUser;
}

function SecuritySectionComponent({ user }: SecuritySectionProps): JSX.Element {
    // Password state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI state
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [isSaving, setIsSaving] = useState(false);

    // Calculate password strength
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

    const handleFieldChange = (field: string) => {
        if (validationErrors[field]) {
            const newErrors = { ...validationErrors };
            delete newErrors[field];
            setValidationErrors(newErrors);
        }
    };

    const validateForm = (): boolean => {
        const errors: ValidationErrors = {};

        if (!oldPassword) {
            errors.oldPassword = 'Current password is required';
        }

        if (!newPassword) {
            errors.newPassword = 'New password is required';
        } else if (newPassword.length < 8) {
            errors.newPassword = 'Password must be at least 8 characters';
        }

        if (newPassword !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChangePassword = async () => {
        if (!validateForm()) return;

        setIsSaving(true);

        try {
            const changePasswordRequest = new ChangePasswordRequest();
            changePasswordRequest.UserName = user.nickname;
            changePasswordRequest.OldPassword = oldPassword;
            changePasswordRequest.Password = newPassword;
            changePasswordRequest.PasswordConfirm = confirmPassword;

            await UsersApi.updatePassword(changePasswordRequest);

            // Clear password fields on success
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            U.alert('i', 'Password changed successfully!', '');

        } catch (error) {
            U.alert('e', 'Could not change password.', 'Please check your current password and try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const hasContent = oldPassword || newPassword || confirmPassword;

    return (
        <div className="security-section">
            <div className="settings-section-header">
                <div className="settings-section-header-content">
                    <h3 className="settings-section-title">Security</h3>
                    <p className="settings-section-description">
                        Change your password to keep your account secure
                    </p>
                </div>
                {hasContent && (
                    <span className="settings-unsaved-badge">
                        <span className="settings-unsaved-badge__dot" />
                        Unsaved changes
                    </span>
                )}
            </div>

            <div className="settings-form-row single">
                {/* Current Password */}
                <div className="settings-field full-width">
                    <label className="settings-field-label">
                        Current Password <span className="required">*</span>
                    </label>
                    <div className="settings-password-input">
                        <input
                            type={showOldPassword ? 'text' : 'password'}
                            className={`settings-field-input ${validationErrors.oldPassword ? 'error' : ''}`}
                            value={oldPassword}
                            onChange={(e) => {
                                setOldPassword(e.target.value);
                                handleFieldChange('oldPassword');
                            }}
                            placeholder="Enter current password"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            aria-label="Toggle password visibility"
                        >
                            <i className={`bi ${showOldPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                    </div>
                    {validationErrors.oldPassword && (
                        <span className="settings-field-error">
                            <i className="bi bi-exclamation-circle" />
                            {validationErrors.oldPassword}
                        </span>
                    )}
                </div>

                {/* New Password */}
                <div className="settings-field full-width">
                    <label className="settings-field-label">
                        New Password <span className="required">*</span>
                    </label>
                    <div className="settings-password-input">
                        <input
                            type={showNewPassword ? 'text' : 'password'}
                            className={`settings-field-input ${validationErrors.newPassword ? 'error' : ''}`}
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                handleFieldChange('newPassword');
                            }}
                            placeholder="Enter new password"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            aria-label="Toggle password visibility"
                        >
                            <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                    </div>
                    {newPassword && (
                        <div className="settings-password-strength">
                            <div className="settings-password-strength-bar">
                                <div
                                    className={`settings-password-strength-fill ${passwordStrength}`}
                                />
                            </div>
                            <span className={`settings-password-strength-label ${passwordStrength}`}>
                                {passwordStrength === 'weak' && 'Weak password'}
                                {passwordStrength === 'medium' && 'Medium strength'}
                                {passwordStrength === 'strong' && 'Strong password'}
                            </span>
                        </div>
                    )}
                    {validationErrors.newPassword && (
                        <span className="settings-field-error">
                            <i className="bi bi-exclamation-circle" />
                            {validationErrors.newPassword}
                        </span>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="settings-field full-width">
                    <label className="settings-field-label">
                        Confirm Password <span className="required">*</span>
                    </label>
                    <div className="settings-password-input">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            className={`settings-field-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                handleFieldChange('confirmPassword');
                            }}
                            placeholder="Confirm new password"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label="Toggle password visibility"
                        >
                            <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                    </div>
                    {validationErrors.confirmPassword && (
                        <span className="settings-field-error">
                            <i className="bi bi-exclamation-circle" />
                            {validationErrors.confirmPassword}
                        </span>
                    )}
                </div>
            </div>

            {/* Password Requirements */}
            <div className="settings-info-box">
                <i className="bi bi-info-circle" />
                <div>
                    <strong style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
                        Password Requirements
                    </strong>
                    <span>
                        At least 8 characters, including one uppercase letter, one lowercase letter, and one number
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="settings-form-actions">
                <button
                    className="settings-btn-primary"
                    onClick={handleChangePassword}
                    disabled={!hasContent || isSaving}
                >
                    {isSaving ? (
                        <>
                            <i className="bi bi-arrow-clockwise spinning" />
                            Changing...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-shield-check" />
                            Change Password
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

export const SecuritySection = connect<StateProps, {}, {}, DState>(
    mapStateToProps
)(SecuritySectionComponent);

export default SecuritySection;
