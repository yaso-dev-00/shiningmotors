// Type definitions for Jest test globals
declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function expect(value: unknown): {
    toThrow(): void;
    not: {
      toThrow(): void;
    };
  };
}

export {};






