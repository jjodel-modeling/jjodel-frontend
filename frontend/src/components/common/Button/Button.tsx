import React from 'react';
import './Button.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /**
     * Visual variant of the button.
     *
     * - **primary**: Slate gradient, white text. Main CTA — max 1 per visual area.
     * - **secondary**: Transparent with border. Import, Analyze, Duplicate, etc.
     * - **ghost**: No border, subtle hover. Frequent low-impact actions (Edit, toolbar icons).
     * - **danger**: Red outline. Destructive actions (Delete, Remove). Add extra margin-left to separate from other buttons.
     * - **accent**: Cyan solid. Promotional/highlight actions (Enable advanced mode).
     *
     * @default 'secondary'
     */
    variant?: ButtonVariant;

    /**
     * Size of the button.
     * @default 'md'
     */
    size?: ButtonSize;

    /** Button content */
    children: React.ReactNode;
}

/**
 * Unified button component for Jjodel.
 *
 * Usage rules:
 * - Max 1 primary button per visual area
 * - Danger buttons should have extra margin-left separating them from other buttons
 * - Ghost buttons are for frequent, low-impact actions
 */
export const Button: React.FC<ButtonProps> = ({
    variant = 'secondary',
    size = 'md',
    children,
    className,
    type = 'button',
    ...props
}) => {
    const classes = [
        'jj-btn',
        `jj-btn--${variant}`,
        `jj-btn--${size}`,
        className,
    ].filter(Boolean).join(' ');

    return (
        <button type={type} className={classes} {...props}>
            {children}
        </button>
    );
};

export default Button;
