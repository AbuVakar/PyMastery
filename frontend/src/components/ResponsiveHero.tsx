/**
 * ResponsiveHero Component
 * Mobile-first responsive hero section
 */

import React from 'react';
import { cn } from '../utils/cn';
import Button from './ui/Button';

interface ResponsiveHeroProps {
  title: string;
  subtitle?: string;
  description: string;
  primaryAction?: {
    text: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    text: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  backgroundImage?: string;
  variant?: 'default' | 'center' | 'left' | 'right';
  className?: string;
}

const ResponsiveHero: React.FC<ResponsiveHeroProps> = ({
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
  backgroundImage,
  variant = 'default',
  className,
}) => {
  const variantClasses = {
    default: 'text-left',
    center: 'text-center',
    left: 'text-left',
    right: 'text-right',
  };

  const backgroundStyles = backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {};

  return (
    <section
      className={cn(
        'relative bg-gradient-to-br from-primary-600 to-secondary-600 text-white overflow-hidden',
        'py-12 mobile:py-16 tablet:py-20 desktop:py-24',
        className
      )}
      style={backgroundStyles}
    >
      <div className="container-responsive">
        <div className={cn(
          'max-w-4xl',
          variantClasses[variant]
        )}>
          {subtitle && (
            <div className="mb-4">
              <span className="text-mobile-sm text-sm uppercase tracking-wide text-yellow-300 font-medium">
                {subtitle}
              </span>
            </div>
          )}
          
          <h1 className={cn(
            'text-4xl mobile:text-5xl tablet:text-6xl desktop:text-7xl font-bold mb-6',
            'leading-tight mobile:leading-tight tablet:leading-tight',
            'text-white'
          )}>
            {title}
          </h1>
          
          <p className={cn(
            'text-responsive mb-8 text-gray-100',
            'max-w-2xl',
            variant === 'center' && 'mx-auto'
          )}>
            {description}
          </p>
          
          {(primaryAction || secondaryAction) && (
            <div className={cn(
              'flex flex-col mobile:flex-row gap-4 mobile:gap-6',
              variant === 'center' && 'justify-center',
              variant === 'right' && 'justify-end'
            )}>
              {primaryAction && (
                <Button
                  size="lg"
                  variant="primary"
                  icon={primaryAction.icon}
                  onClick={primaryAction.onClick}
                  className="bg-white text-primary-600 hover:bg-gray-100 shadow-lg"
                >
                  {primaryAction.text}
                </Button>
              )}
              
              {secondaryAction && (
                <Button
                  size="lg"
                  variant="outline"
                  icon={secondaryAction.icon}
                  onClick={secondaryAction.onClick}
                  className="border-white text-white hover:bg-white hover:text-primary-600"
                >
                  {secondaryAction.text}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400 rounded-full filter blur-3xl opacity-20 animate-bounce-gentle"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-20 animate-pulse-slow"></div>
    </section>
  );
};

export default ResponsiveHero;
