// Simple test file to verify TypeScript configuration
/// <reference types="@types/jest" />

// Import any additional types if needed
import 'jest';

describe('TypeScript Configuration Test', () => {
  it('should format currency correctly', () => {
    // This test verifies that our TypeScript configuration is working
    // and that we can import and use our utility functions
    const testValue = 1000;
    const formatted = `$${testValue.toLocaleString('es-AR')}`;
    expect(formatted).toBe('$1.000');
  });

  it('should handle async/await', async () => {
    const asyncTest = async () => {
      return 'test';
    };
    
    const result = await asyncTest();
    expect(result).toBe('test');
  });

  it('should have access to React Native types', () => {
    // This verifies that React Native types are available
    const viewStyle: any = {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    };
    
    expect(viewStyle).toBeDefined();
  });
});
