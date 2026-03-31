/**
 * ResponsiveForm Component
 * Mobile-first responsive form with adaptive layout
 */

import React from 'react';
import { cn } from '../utils/cn';

interface ResponsiveFormProps {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
  layout?: 'vertical' | 'horizontal' | 'stacked';
  spacing?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  className,
  onSubmit,
  layout = 'vertical',
  spacing: _spacing = { mobile: '4', tablet: '6', desktop: '8' },
}) => {
  const layoutClasses = {
    vertical: 'space-y-4 mobile:space-y-3',
    horizontal: 'space-y-6 mobile:space-y-4',
    stacked: 'grid gap-4 mobile:gap-3 tablet:grid-cols-2 desktop:grid-cols-3',
  };

  const classes = cn(
    layoutClasses[layout],
    className
  );

  return (
    <form onSubmit={onSubmit} className={classes}>
      {children}
    </form>
  );
};

// Form sub-components
interface ResponsiveFormFieldProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export const ResponsiveFormField: React.FC<ResponsiveFormFieldProps> = ({
  children,
  className,
  label,
  error,
  required = false,
  helperText,
}) => {
  return (
    <div className={cn('space-y-2 mobile:space-y-1', className)}>
      {label && (
        <label className="block text-mobile-sm text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {helperText && !error && (
        <p className="text-mobile-xs text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
      {error && (
        <p className="text-mobile-xs text-xs text-error-500">
          {error}
        </p>
      )}
    </div>
  );
};

interface ResponsiveFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const ResponsiveFormInput: React.FC<ResponsiveFormInputProps> = ({
  label,
  error,
  helperText,
  required = false,
  leftIcon,
  rightIcon,
  className,
  ...props
}) => {
  const inputClasses = cn(
    'block w-full px-3 py-2 mobile:px-4 mobile:py-3 text-mobile-base text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-primary-400 dark:focus:border-primary-400',
    leftIcon && 'pl-10',
    rightIcon && 'pr-10',
    error && 'border-error-500 focus:ring-error-500 focus:border-error-500',
    className
  );

  return (
    <ResponsiveFormField
      label={label}
      error={error}
      helperText={helperText}
      required={required}
    >
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="w-5 h-5 text-gray-400">
              {leftIcon}
            </div>
          </div>
        )}
        <input
          className={inputClasses}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="w-5 h-5 text-gray-400">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
    </ResponsiveFormField>
  );
};

interface ResponsiveFormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  rows?: number;
}

export const ResponsiveFormTextarea: React.FC<ResponsiveFormTextareaProps> = ({
  label,
  error,
  helperText,
  required = false,
  rows = 4,
  className,
  ...props
}) => {
  const textareaClasses = cn(
    'block w-full px-3 py-2 mobile:px-4 mobile:py-3 text-mobile-base text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-primary-400 dark:focus:border-primary-400 resize-none',
    error && 'border-error-500 focus:ring-error-500 focus:border-error-500',
    className
  );

  return (
    <ResponsiveFormField
      label={label}
      error={error}
      helperText={helperText}
      required={required}
    >
      <textarea
        className={textareaClasses}
        rows={rows}
        {...props}
      />
    </ResponsiveFormField>
  );
};

interface ResponsiveFormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

export const ResponsiveFormSelect: React.FC<ResponsiveFormSelectProps> = ({
  label,
  error,
  helperText,
  required = false,
  options,
  className,
  ...props
}) => {
  const selectClasses = cn(
    'block w-full px-3 py-2 mobile:px-4 mobile:py-3 text-mobile-base text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-primary-400 dark:focus:border-primary-400',
    error && 'border-error-500 focus:ring-error-500 focus:border-error-500',
    className
  );

  return (
    <ResponsiveFormField
      label={label}
      error={error}
      helperText={helperText}
      required={required}
    >
      <select className={selectClasses} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </ResponsiveFormField>
  );
};

interface ResponsiveFormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const ResponsiveFormCheckbox: React.FC<ResponsiveFormCheckboxProps> = ({
  label,
  error,
  helperText,
  required = false,
  className,
  ...props
}) => {
  const checkboxClasses = cn(
    'w-4 h-4 mobile:w-5 mobile:h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-400 dark:bg-gray-800 dark:border-gray-600',
    error && 'border-error-500 focus:ring-error-500',
    className
  );

  return (
    <ResponsiveFormField
      label={undefined}
      error={error}
      helperText={helperText}
      required={required}
    >
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          className={checkboxClasses}
          {...props}
        />
        {label && (
          <span className="ml-2 text-mobile-sm text-sm text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </span>
        )}
      </label>
    </ResponsiveFormField>
  );
};

interface ResponsiveFormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

export const ResponsiveFormActions: React.FC<ResponsiveFormActionsProps> = ({
  children,
  className,
  align = 'right',
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div className={cn('flex flex-col-reverse mobile:flex-row gap-3 mobile:gap-4 mt-6 mobile:mt-8', alignClasses[align], className)}>
      {children}
    </div>
  );
};

export default ResponsiveForm;
