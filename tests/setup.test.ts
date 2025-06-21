/**
 * Setup validation tests for the Code Analysis Engine
 *
 * These tests ensure the development environment is configured correctly
 * and all type definitions compile without errors.
 */

import { describe, it, expect } from 'vitest';
import {
  hello,
  analyzeRepository,
  ANALYSIS_ENGINE_VERSION,
  type AnalysisResult,
  type AnalysisOptions
} from '../src/index.js';

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

  it('should export analyzeRepository function with correct signature', async () => {
    const result = await analyzeRepository('/fake/path');

    // Verify the result matches our AnalysisResult interface
    expect(result).toHaveProperty('folder_structure');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('dependencies');
    expect(result).toHaveProperty('metadata');

    // Verify metadata structure
    expect(result.metadata).toHaveProperty('timestamp');
    expect(result.metadata).toHaveProperty('duration_ms');
    expect(result.metadata).toHaveProperty('engine_version');
    expect(result.metadata?.engine_version).toBe(ANALYSIS_ENGINE_VERSION);
  });

  it('should handle analysis options parameter', async () => {
    const options: AnalysisOptions = {
      limit: 100,
      extensions: ['.ts', '.js'],
      max_file_size: 1024 * 1024,
      concurrency: 5
    };

    const result = await analyzeRepository('/fake/path', options);
    expect(result).toBeDefined();
  });
});
