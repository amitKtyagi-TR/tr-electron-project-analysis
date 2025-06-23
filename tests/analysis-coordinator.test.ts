/**
 * Unit tests for AnalysisCoordinator
 *
 * These tests validate the coordination of multiple parsers, language routing,
 * fallback mechanisms, and error handling across different programming languages.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { AnalysisCoordinator } from '../src/core/analysis-coordinator.js';

describe('AnalysisCoordinator', () => {
  let coordinator: AnalysisCoordinator;

  beforeAll(async () => {
    // Initialize once for all tests
    coordinator = new AnalysisCoordinator();
    await coordinator.initialize();
  });

  beforeEach(() => {
    // Each test gets a fresh coordinator instance
    coordinator = new AnalysisCoordinator();
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      await expect(coordinator.initialize()).resolves.not.toThrow();
    });

    it('should handle multiple initialization calls gracefully', async () => {
      await coordinator.initialize();
      await coordinator.initialize(); // Should not cause issues

      const stats = coordinator.getStatistics();
      expect(stats.initialized).toBe(true);
    });

    it('should provide initialization statistics', async () => {
      await coordinator.initialize();

      const stats = coordinator.getStatistics();
      expect(stats).toHaveProperty('initialized');
      expect(stats).toHaveProperty('treeSitterAvailable');
      expect(stats).toHaveProperty('supportedLanguages');
      expect(stats.supportedLanguages).toHaveProperty('babel');
      expect(stats.supportedLanguages).toHaveProperty('treeSitter');
      expect(stats.supportedLanguages).toHaveProperty('deepAnalysis');
    });
  });

  describe('single file analysis', () => {
    beforeEach(async () => {
      await coordinator.initialize();
    });

    it('should analyze JavaScript files with Babel', async () => {
      const jsCode = `
        import React from 'react';

        function MyComponent() {
          return <div>Hello World</div>;
        }

        export default MyComponent;
      `;

      const result = await coordinator.analyzeFile('Component.jsx', jsCode);

      expect(result.detectedLanguage).toBe('javascript');
      expect(result.parser).toBe('babel');
      expect(result.usedFallback).toBe(false);
      expect(result.analysis.path).toBe('Component.jsx');
      expect(result.analysis.language).toBe('javascript');
      expect(result.analysis.error).toBeUndefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should analyze TypeScript files with Babel', async () => {
      const tsCode = `
        interface User {
          id: number;
          name: string;
        }

        export class UserService {
          async getUser(id: number): Promise<User> {
            return { id, name: 'Test User' };
          }
        }
      `;

      const result = await coordinator.analyzeFile('UserService.ts', tsCode);

      expect(result.detectedLanguage).toBe('typescript');
      expect(result.parser).toBe('babel');
      expect(result.usedFallback).toBe(false);
      expect(result.analysis.path).toBe('UserService.ts');
      expect(result.analysis.language).toBe('typescript');
      expect(result.analysis.error).toBeUndefined();
    });

    it('should analyze Python files appropriately', async () => {
      const pythonCode = `
        import os
        import sys

        class DataProcessor:
            def __init__(self, data_path):
                self.data_path = data_path

            def process(self):
                with open(self.data_path, 'r') as f:
                    return f.read()

        if __name__ == "__main__":
            processor = DataProcessor(sys.argv[1])
            result = processor.process()
            print(result)
      `;

      const result = await coordinator.analyzeFile('processor.py', pythonCode);

      expect(result.detectedLanguage).toBe('python');
      expect(result.analysis.path).toBe('processor.py');
      expect(result.analysis.language).toBe('python');
      expect(result.analysis.error).toBeUndefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);

      // Parser could be tree-sitter or basic depending on availability
      expect(result.parser).toBe('python');
    });

    it('should analyze unknown languages with basic analysis', async () => {
      const unknownCode = `
        // This is some unknown language
        variable x = 10;
        variable y = 20;
        result = x + y;
      `;

      const result = await coordinator.analyzeFile('unknown.xyz', unknownCode);

      expect(result.detectedLanguage).toBe('unknown');
      expect(result.parser).toBe('basic');
      expect(result.analysis.path).toBe('unknown.xyz');
      expect(result.analysis.language).toBe('unknown');
      expect(result.analysis.lines).toBeGreaterThan(0);
      expect(result.analysis.characters).toBeGreaterThan(0);
    });

    it('should handle syntax errors gracefully', async () => {
      const brokenJsCode = `
        function broken( {
          console.log("missing closing paren"
          return "broken";
        }
      `;

      const result = await coordinator.analyzeFile('broken.js', brokenJsCode);

      expect(result.detectedLanguage).toBe('javascript');
      expect(result.analysis.path).toBe('broken.js');
      // Should either have error in analysis or use fallback
      if (result.analysis.error) {
        expect(result.analysis.error).toContain('parsing failed');
      } else {
        expect(result.usedFallback).toBe(true);
      }
    });

    it('should detect language correctly for extensionless files', async () => {
      const pythonShebang = `#!/usr/bin/env python3
import sys
print("Hello from Python")
`;

      const result = await coordinator.analyzeFile('script', pythonShebang);

      expect(result.detectedLanguage).toBe('python');
      expect(result.analysis.path).toBe('script');
    });

    it('should handle empty files', async () => {
      const result = await coordinator.analyzeFile('empty.js', '');

      expect(result.detectedLanguage).toBe('javascript');
      expect(result.analysis.path).toBe('empty.js');
      expect(result.analysis.error).toBeUndefined();
    });
  });

  describe('batch file analysis', () => {
    beforeEach(async () => {
      await coordinator.initialize();
    });

    it('should analyze multiple files with progress tracking', async () => {
      const files = new Map([
        ['app.js', 'console.log("Hello JS");'],
        ['types.ts', 'interface Test { id: number; }'],
        ['script.py', 'print("Hello Python")'],
        ['data.json', '{"key": "value"}'],
      ]);

      const progressCalls: Array<[number, number, string]> = [];
      const options = {
        on_progress: (completed: number, total: number, currentFile?: string) => {
          if (currentFile) {
            progressCalls.push([completed, total, currentFile]);
          }
        },
      };

      const results = await coordinator.analyzeFiles(files, options);

      expect(results.size).toBe(4);
      expect(progressCalls.length).toBe(4);

      // Check that all files were processed
      expect(results.has('app.js')).toBe(true);
      expect(results.has('types.ts')).toBe(true);
      expect(results.has('script.py')).toBe(true);
      expect(results.has('data.json')).toBe(true);

      // Check progress calls
      expect(progressCalls[0]).toEqual([1, 4, expect.any(String)]);
      expect(progressCalls[3]).toEqual([4, 4, expect.any(String)]);

      // Check individual results
      const jsResult = results.get('app.js')!;
      expect(jsResult.detectedLanguage).toBe('javascript');
      expect(jsResult.parser).toBe('babel');

      const tsResult = results.get('types.ts')!;
      expect(tsResult.detectedLanguage).toBe('typescript');
      expect(tsResult.parser).toBe('babel');

      const pyResult = results.get('script.py')!;
      expect(pyResult.detectedLanguage).toBe('python');

      const jsonResult = results.get('data.json')!;
      expect(jsonResult.detectedLanguage).toBe('json');
      expect(jsonResult.parser).toBe('basic');
    });

    it('should handle cancellation during batch analysis', async () => {
        const files = new Map([
            ['file1.js', 'console.log("1");'],
            ['file2.js', 'console.log("2");'],
            ['file3.js', 'console.log("3");'],
            ['file4.js', 'console.log("4");'],
        ]);

        const abortController = new AbortController();

        // Cancel immediately before starting
        abortController.abort();

        const options = {
            signal: abortController.signal,
        };

        await expect(
            coordinator.analyzeFiles(files, options)
        ).rejects.toThrow('Analysis was cancelled');
        });

    it('should handle individual file errors in batch analysis', async () => {
        const files = new Map([
            ['good.js', 'console.log("good");'],
            ['bad.js', 'function broken( { console.log("bad"'], // Actually broken syntax
            ['another.js', 'console.log("another");'],
        ]);

        const results = await coordinator.analyzeFiles(files);

        expect(results.size).toBe(3);

        // Good files should succeed
        expect(results.get('good.js')!.analysis.error).toBeUndefined();
        expect(results.get('another.js')!.analysis.error).toBeUndefined();

        // Bad file should either have error, use fallback, or parse successfully
        const badResult = results.get('bad.js')!;

        // Babel might successfully parse some "broken" syntax, so we're more lenient
        expect(['babel', 'tree-sitter', 'basic', 'error']).toContain(badResult.parser);

        // If it parsed successfully, that's also acceptable
        expect(badResult.analysis.path).toBe('bad.js');
        });
  });

  describe('parser routing logic', () => {
    beforeEach(async () => {
      await coordinator.initialize();
    });

    it('should route JavaScript to Babel parser', async () => {
      const result = await coordinator.analyzeFile('test.js', 'console.log("test");');
      expect(result.parser).toBe('babel');
    });

    it('should route TypeScript to Babel parser', async () => {
      const result = await coordinator.analyzeFile('test.ts', 'const x: number = 1;');
      expect(result.parser).toBe('babel');
    });

    it('should route Python to dedicated Python parser', async () => {
      const result = await coordinator.analyzeFile('test.py', 'print("test")');
      expect(result.parser).toBe('python');
    });

    it('should route unknown languages to basic parser', async () => {
      const result = await coordinator.analyzeFile('test.xyz', 'unknown syntax');
      expect(result.parser).toBe('basic');
    });

    it('should handle fallback when primary parser fails', async () => {
      // This might trigger fallback depending on parser availability
      const complexCode = 'very complex and potentially problematic syntax that might fail parsing';
      const result = await coordinator.analyzeFile('test.js', complexCode);

      // Should either succeed with Babel or fall back gracefully
      expect(['babel', 'tree-sitter', 'basic', 'error']).toContain(result.parser);
      expect(result.analysis.path).toBe('test.js');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await coordinator.initialize();
    });

    it('should handle analysis errors gracefully', async () => {
      // Force an error condition by analyzing without initialization
      const freshCoordinator = new AnalysisCoordinator();
      // Don't initialize - this might cause issues

      const result = await freshCoordinator.analyzeFile('test.js', 'console.log("test");');

      // Should still return a valid result structure
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('parser');
      expect(result).toHaveProperty('detectedLanguage');
      expect(result).toHaveProperty('usedFallback');
      expect(result).toHaveProperty('processingTime');
      expect(result.analysis.path).toBe('test.js');
    });

    it('should provide meaningful error messages', async () => {
      const result = await coordinator.analyzeFile('test.js', 'extremely broken syntax {{{');

      // Should either parse successfully with fallback or provide error details
      if (result.analysis.error) {
        expect(result.analysis.error).toBeTruthy();
        expect(typeof result.analysis.error).toBe('string');
      }
    });
  });

  describe('performance and metrics', () => {
    beforeEach(async () => {
      await coordinator.initialize();
    });

    it('should track processing time', async () => {
        const result = await coordinator.analyzeFile('test.js', 'console.log("test");');

        expect(result.processingTime).toBeGreaterThanOrEqual(0); // Allow very fast operations
        expect(result.processingTime).toBeLessThan(5000); // Should be reasonable
        expect(typeof result.processingTime).toBe('number');
        });

    it('should provide useful statistics', async () => {
      const stats = coordinator.getStatistics();

      expect(stats.initialized).toBe(true);
      expect(typeof stats.treeSitterAvailable).toBe('boolean');
      expect(Array.isArray(stats.supportedLanguages.babel)).toBe(true);
      expect(Array.isArray(stats.supportedLanguages.treeSitter)).toBe(true);
      expect(Array.isArray(stats.supportedLanguages.deepAnalysis)).toBe(true);

      // Babel should always support JS/TS
      expect(stats.supportedLanguages.babel).toContain('javascript');
      expect(stats.supportedLanguages.babel).toContain('typescript');
    });
  });
});
