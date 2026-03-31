import React from 'react';
import { cn } from '../../utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props
}) => {
  const baseClasses = 'button-touch inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus:ring-blue-500',
    secondary: 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm focus:ring-purple-500',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:text-gray-200 dark:hover:bg-gray-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'mobile:px-3 mobile:py-2 px-3 py-1.5 text-sm rounded-md',
    md: 'mobile:px-4 mobile:py-3 px-4 py-2 text-base rounded-lg',
    lg: 'mobile:px-6 mobile:py-4 px-6 py-3 text-lg rounded-xl',
    xl: 'mobile:px-8 mobile:py-5 px-8 py-4 text-xl rounded-2xl',
  };

  const disabledClasses = disabled || isLoading 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer active:scale-95';

  const widthClasses = fullWidth ? 'w-full' : '';

  const renderIcon = () => {
    if (!icon) return null;
    
    return (
      <span className={cn(
        'flex-shrink-0',
        iconPosition === 'left' ? 'mr-2' : 'ml-2',
        size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : size === 'xl' ? 'w-7 h-7' : 'w-5 h-5'
      )}>
        {icon}
      </span>
    );
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabledClasses,
        widthClasses,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-2 w-5 h-5" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {iconPosition === 'left' && renderIcon()}
          <span className="mobile-truncate">{children}</span>
          {iconPosition === 'right' && renderIcon()}
        </>
      )}
    </button>
  );
};

export default Button;
