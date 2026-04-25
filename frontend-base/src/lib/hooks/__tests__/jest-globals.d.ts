/* eslint-disable @typescript-eslint/no-explicit-any */

declare namespace jest {
  type MockedFunction<T extends (...args: any[]) => any> = T & {
    mock: { calls: Parameters<T>[] };
    mockClear(): void;
    mockReset(): void;
    mockImplementation(fn: T): MockedFunction<T>;
    mockReturnValue(value: ReturnType<T>): MockedFunction<T>;
  };
}

declare const jest: {
  fn<T extends (...args: any[]) => any = (...args: any[]) => any>(implementation?: T): jest.MockedFunction<T>;
  mock(moduleName: string, factory: () => unknown): void;
  clearAllMocks(): void;
  restoreAllMocks(): void;
  runOnlyPendingTimers(): void;
  spyOn<T extends object, K extends keyof T>(
    object: T,
    methodName: K,
  ): T[K] extends (...args: any[]) => any
    ? {
        mockImplementation(fn: T[K]): unknown;
        mockReturnValue(value: ReturnType<T[K]>): unknown;
      }
    : never;
  useFakeTimers(): void;
  useRealTimers(): void;
  advanceTimersByTime(msToRun: number): void;
};

declare function describe(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void): void;
declare function afterEach(fn: () => void): void;
declare function it(name: string, fn: () => void): void;

declare const expect: {
  (actual: unknown): {
    toBe(expected: unknown): void;
    toBeNull(): void;
    toEqual(expected: unknown): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledTimes(expected: number): void;
    toHaveBeenCalledWith(...expected: unknown[]): void;
    toHaveBeenCalledWith(expected: unknown): void;
    toHaveBeenCalledWith(expected: unknown, ...rest: unknown[]): void;
    not: {
      toHaveBeenCalled(): void;
    };
  };
  any(constructor: unknown): unknown;
};
