// Jest type declarations for test files
declare const jest: {
  fn(): jest.Mock;
  fn<T extends (...args: unknown[]) => unknown>(implementation: T): jest.Mock<T>;
  useFakeTimers(): void;
  useRealTimers(): void;
  advanceTimersByTime(msToRun: number): void;
  spyOn<T extends object, K extends keyof T>(object: T, method: K): jest.Spied<T[K]>;
  mock(moduleName: string, factory: () => unknown): void;
  clearAllMocks(): void;
};

declare function beforeEach(fn: () => void): void;
declare function afterEach(fn: () => void): void;
declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;
declare function expect(value: unknown): jest.Matchers<unknown>;

declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveClass(className: string): R;
    toBeVisible(): R;
  }
  
  interface Mock<T = unknown> {
    (...args: unknown[]): T;
    mock: {
      calls: unknown[][];
      results: unknown[];
    };
    mockReturnValue(value: T): jest.Mock<T>;
    mockResolvedValue(value: T): jest.Mock<T>;
    mockRejectedValue(error: unknown): jest.Mock<T>;
  }
  
  interface Spied<T> {
    (...args: unknown[]): T;
  }
}
