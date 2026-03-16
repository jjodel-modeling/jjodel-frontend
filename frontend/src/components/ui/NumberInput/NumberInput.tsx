import React from 'react';
import styles from './NumberInput.module.css';

export interface NumberInputProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    className?: string;
}

export function NumberInput({
    value,
    onChange,
    min,
    max,
    step = 1,
    disabled = false,
    className = '',
}: NumberInputProps): JSX.Element {
    const decrement = () => {
        const newVal = value - step;
        if (min !== undefined && newVal < min) return;
        onChange(newVal);
    };

    const increment = () => {
        const newVal = value + step;
        if (max !== undefined && newVal > max) return;
        onChange(newVal);
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const parsed = parseInt(e.target.value, 10);
        if (!isNaN(parsed)) {
            if (min !== undefined && parsed < min) return;
            if (max !== undefined && parsed > max) return;
            onChange(parsed);
        }
    };

    const wrapperClasses = [
        styles.wrapper,
        disabled ? styles.disabled : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses}>
            <button
                type="button"
                className={styles.btn}
                onClick={decrement}
                disabled={disabled}
                tabIndex={-1}
            >
                &minus;
            </button>
            <input
                type="text"
                className={styles.value}
                value={value}
                onChange={handleInput}
                disabled={disabled}
            />
            <button
                type="button"
                className={styles.btn}
                onClick={increment}
                disabled={disabled}
                tabIndex={-1}
            >
                +
            </button>
        </div>
    );
}

export default NumberInput;
