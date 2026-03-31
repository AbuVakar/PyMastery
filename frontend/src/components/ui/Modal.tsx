import React from 'react';
import { cn } from '../../utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  position = 'center',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm mobile:max-w-xs',
    md: 'max-w-md mobile:max-w-sm',
    lg: 'max-w-lg mobile:max-w-md',
    xl: 'max-w-xl mobile:max-w-lg',
    full: 'max-w-full mobile:max-w-full mx-4 mobile:mx-2',
  };

  const positionClasses = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-8 mobile:pt-4',
    bottom: 'items-end justify-center pb-8 mobile:pb-4',
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm',
        positionClasses[position]
      )}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={cn(
          'relative w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl',
          'max-h-[90vh] overflow-y-auto',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {title && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
        )}
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
