import React from 'react';
import { cn } from '../../utils';

interface PythonSnakeIconProps {
  className?: string;
}

const PythonSnakeIcon: React.FC<PythonSnakeIconProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-6 w-6', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pythonSnakeBlue" x1="4" y1="4" x2="14" y2="15" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93C5FD" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="pythonSnakeYellow" x1="10" y1="9" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      <path
        d="M8 3.5C5.5 3.5 4 5 4 7.4V11h7c1.1 0 2 .9 2 2v1.6c0 2.4-1.5 3.9-4 3.9H7.8"
        stroke="url(#pythonSnakeBlue)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 20.5c2.5 0 4-1.5 4-3.9V13h-7c-1.1 0-2-.9-2-2V9.4c0-2.4 1.5-3.9 4-3.9h1.2"
        stroke="url(#pythonSnakeYellow)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="8.2" cy="7.2" r="1" fill="#DBEAFE" />
      <circle cx="15.8" cy="16.8" r="1" fill="#FEF3C7" />
      <circle cx="8.2" cy="7.2" r="0.35" fill="#1E3A8A" />
      <circle cx="15.8" cy="16.8" r="0.35" fill="#7C2D12" />
    </svg>
  );
};

export default PythonSnakeIcon;
