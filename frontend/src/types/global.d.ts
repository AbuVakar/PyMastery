import type * as React from 'react';

// Declaration file for .jsx modules
declare module '*.jsx' {
  const content: React.ComponentType<Record<string, unknown>>;
  export default content;
}

// Declaration file for .js modules
declare module '*.js' {
  const content: unknown;
  export default content;
}

// Declaration file for assets
declare module '*.svg' {
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

declare module '*.bmp' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.scss' {
  const content: string;
  export default content;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.json' {
  const content: unknown;
  export default content;
}

// Environment variables
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GITHUB_CLIENT_ID: string;
  readonly VITE_STRIPE_PUBLIC_KEY: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_ENVIRONMENT: 'development' | 'production' | 'test';
  /** Google AI Studio / Gemini API key for AI Mentor (optional) */
  readonly VITE_GEMINI_API_KEY?: string;
  /** Optional Groq fallback for AI Mentor */
  readonly VITE_GROQ_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_HUGGINGFACE_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Jest global types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toBeVisible(): R;
    }
  }
  
  const jest: {
    fn(): jest.Mock;
    fn<T extends (...args: unknown[]) => unknown>(implementation: T): jest.Mock<T>;
    useFakeTimers(): void;
    useRealTimers(): void;
    advanceTimersByTime(msToRun: number): void;
    spyOn<T extends object, K extends keyof T>(object: T, method: K): jest.Spied<T[K]>;
    mock(moduleName: string, factory: () => unknown): void;
    clearAllMocks(): void;
    advanceTimersByTime(msToRun: number): void;
  };
  
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function test(name: string, fn: () => void): void;
  function expect(value: unknown): jest.Matchers<unknown>;
}
