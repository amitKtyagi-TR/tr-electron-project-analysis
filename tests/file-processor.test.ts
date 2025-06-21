/**
 * Unit tests for FileProcessor class
 *
 * These tests validate concurrent file processing, progress tracking,
 * error handling, and cancellation functionality.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { mkdir, writeFile, rmdir, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { FileProcessor, DEFAULT_PROCESSING_OPTIONS } from '../src/core/file-processor.js';

describe('FileProcessor', () => {
  const testDir = join(process.cwd(), 'test-file-processor');
  let fileProcessor: FileProcessor;

  beforeAll(async () => {
    // Create test directory with various files
    await mkdir(testDir, { recursive: true });

    // Small text files
    await writeFile(join(testDir, 'small.txt'), 'Hello World');
    await writeFile(join(testDir, 'medium.js'), 'console.log("test");\n'.repeat(100));

    // Large file (for size limit testing)
    const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
    await writeFile(join(testDir, 'large.txt'), largeContent);

    // UTF-8 file with special characters
    await writeFile(join(testDir, 'unicode.txt'), '👋 Hello 世界! 🌟');

    // Create subdirectory
    await mkdir(join(testDir, 'subdir'), { recursive: true });
    await writeFile(join(testDir, 'subdir', 'nested.md'), '# Nested File\n\nContent here.');

    fileProcessor = new FileProcessor(testDir);
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await rmdir(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should create FileProcessor with repository path', () => {
      const processor = new FileProcessor('/some/path');
      expect(processor).toBeInstanceOf(FileProcessor);
      expect(processor.getRepositoryPath()).toBe('/some/path');
    });
  });

  describe('processFiles', () => {
    it('should process multiple files successfully', async () => {
      const filePaths = ['small.txt', 'medium.js', 'unicode.txt'];

      const mockProcessor = vi.fn(async (content: string, filePath: string) => {
        return {
          path: filePath,
          content: content.substring(0, 50), // First 50 chars
          length: content.length
        };
      });

      const results = await fileProcessor.processFiles(filePaths, mockProcessor);

      expect(results.size).toBe(3);
      expect(mockProcessor).toHaveBeenCalledTimes(3);

      // Check small.txt result
      const smallResult = results.get('small.txt');
      expect(smallResult).toEqual({
        path: 'small.txt',
        content: 'Hello World',
        length: 11
      });

      // Check unicode.txt result
      const unicodeResult = results.get('unicode.txt');
      expect(unicodeResult).toBeDefined();
      expect((unicodeResult as any).content).toContain('👋');
    });

    it('should handle file size limits', async () => {
      const filePaths = ['large.txt'];

      const mockProcessor = vi.fn(async (content: string) => ({ processed: true }));

      const results = await fileProcessor.processFiles(filePaths, mockProcessor, {
        maxFileSize: 1024 * 1024 // 1MB limit
      });

      expect(results.size).toBe(1);
      const result = results.get('large.txt');
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).name).toBe('file_too_large');

      // Processor should not be called for oversized files
      expect(mockProcessor).not.toHaveBeenCalled();
    });

    it('should handle non-existent files', async () => {
      const filePaths = ['nonexistent.txt'];

      const mockProcessor = vi.fn(async (content: string) => ({ processed: true }));

      const results = await fileProcessor.processFiles(filePaths, mockProcessor);

      expect(results.size).toBe(1);
      const result = results.get('nonexistent.txt');
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).name).toBe('not_found');
    });

    it('should call progress callback', async () => {
        const filePaths = ['small.txt', 'medium.js'];
        const progressCallback = vi.fn();

        const mockProcessor = vi.fn(async (content: string) => ({ processed: true }));

        await fileProcessor.processFiles(filePaths, mockProcessor, {
            onProgress: progressCallback
        });

        expect(progressCallback).toHaveBeenCalledTimes(2);

        // Check progress calls - order may vary due to concurrency
        const calls = progressCallback.mock.calls;

        // First call should be (1, 2, filename)
        expect(calls[0][0]).toBe(1); // completed count
        expect(calls[0][1]).toBe(2); // total count
        expect(filePaths).toContain(calls[0][2]); // filename should be one of our files

        // Second call should be (2, 2, filename)
        expect(calls[1][0]).toBe(2); // completed count
        expect(calls[1][1]).toBe(2); // total count
        expect(filePaths).toContain(calls[1][2]); // filename should be one of our files

        // Both files should have been reported (order doesn't matter)
        const reportedFiles = [calls[0][2], calls[1][2]];
        expect(reportedFiles).toContain('small.txt');
        expect(reportedFiles).toContain('medium.js');
        });

    it('should respect concurrency limits', async () => {
      const filePaths = ['small.txt', 'medium.js', 'unicode.txt'];
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const mockProcessor = vi.fn(async (content: string) => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);

        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 10));

        concurrentCount--;
        return { processed: true };
      });

      await fileProcessor.processFiles(filePaths, mockProcessor, {
        concurrencyLimit: 2
      });

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should handle processor errors', async () => {
      const filePaths = ['small.txt'];

      const errorProcessor = vi.fn(async () => {
        throw new Error('Processing failed');
      });

      const results = await fileProcessor.processFiles(filePaths, errorProcessor);

      expect(results.size).toBe(1);
      const result = results.get('small.txt');
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Processing failed');
    });

    it('should support cancellation with AbortController', async () => {
        const filePaths = ['small.txt', 'medium.js', 'unicode.txt'];
        const abortController = new AbortController();

        // Abort immediately before processing starts
        abortController.abort();

        const mockProcessor = vi.fn(async (content: string) => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return { processed: true };
        });

        await expect(
            fileProcessor.processFiles(filePaths, mockProcessor, {
            signal: abortController.signal
            })
        ).rejects.toThrow('File processing was cancelled');

        // Processor should not be called at all
        expect(mockProcessor).not.toHaveBeenCalled();
        });

    it('should handle cancellation during processing gracefully', async () => {
      const filePaths = ['small.txt', 'medium.js'];
      const abortController = new AbortController();

      const mockProcessor = vi.fn(async (content: string) => {
        // Cancel after first file starts processing
        if (mockProcessor.mock.calls.length === 1) {
          // Add small delay then abort
          setTimeout(() => abortController.abort(), 10);
        }

        // Simulate longer processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        return { processed: true };
      });

      const results = await fileProcessor.processFiles(filePaths, mockProcessor, {
        signal: abortController.signal,
        concurrencyLimit: 1 // Process one at a time to ensure predictable behavior
      });

      // Should complete processing of at least one file
      expect(results.size).toBeGreaterThan(0);

      // At least one call should have been made
      expect(mockProcessor).toHaveBeenCalled();
    });


  });

  describe('default options', () => {
    it('should have sensible default options', () => {
      expect(DEFAULT_PROCESSING_OPTIONS.concurrencyLimit).toBe(10);
      expect(DEFAULT_PROCESSING_OPTIONS.maxFileSize).toBe(1024 * 1024); // 1MB
      expect(DEFAULT_PROCESSING_OPTIONS.encoding).toBe('utf8');
    });
  });
});
