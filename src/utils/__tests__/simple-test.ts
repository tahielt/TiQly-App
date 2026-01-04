// Simple test to verify TypeScript configuration
function add(a: number, b: number): number {
  return a + b;
}

describe('TypeScript Test', () => {
  it('should add two numbers correctly', () => {
    const result = add(2, 3);
    expect(result).toBe(5);
  });
});
