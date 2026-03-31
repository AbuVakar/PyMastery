// Jest setup file
import '@testing-library/jest-dom';

// Mock timers
beforeEach(() => {
  // @ts-expect-error - Jest globals are provided in the test environment
  global.jest?.useFakeTimers();
});

afterEach(() => {
  // @ts-expect-error - Jest globals are provided in the test environment
  global.jest?.useRealTimers();
});
