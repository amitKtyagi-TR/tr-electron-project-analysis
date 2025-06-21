/**
 * Basic setup validation tests
 * These tests ensure the development environment is configured correctly
 */

import { describe, it, expect } from 'vitest';
import { hello, ANALYSIS_ENGINE_VERSION } from '../src/index.js';

describe('Development Setup Validation', () => {
  it('should export hello function that returns expected message', () => {
    const result = hello();
    expect(result).toBe("Code Analysis Engine - TypeScript setup working!");
  });

  it('should export version constant', () => {
    expect(ANALYSIS_ENGINE_VERSION).toBe("0.1.0");
  });

  it('should have Node.js version 20 or higher', () => {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    expect(majorVersion).toBeGreaterThanOrEqual(20);
  });
});
