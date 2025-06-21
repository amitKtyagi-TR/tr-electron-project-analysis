/**
 * Unit tests for GitProcessor class
 *
 * These tests validate git repository operations including
 * repository detection, file discovery, and error handling.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdir, writeFile, rmdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { GitProcessor } from '../src/core/git-processor.js';

const execFileAsync = promisify(execFile);

describe('GitProcessor', () => {
  const testRepoPath = join(process.cwd(), 'test-temp-repo');
  let gitProcessor: GitProcessor;

  beforeAll(async () => {
    // Create a temporary git repository for testing
    await mkdir(testRepoPath, { recursive: true });

    // Initialize git repository
    await execFileAsync('git', ['init'], { cwd: testRepoPath });
    await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd: testRepoPath });
    await execFileAsync('git', ['config', 'user.name', 'Test User'], { cwd: testRepoPath });

    // Create some test files
    await writeFile(join(testRepoPath, 'test.js'), 'console.log("hello");');
    await writeFile(join(testRepoPath, 'README.md'), '# Test Repository');
    await writeFile(join(testRepoPath, 'package.json'), '{"name": "test"}');

    // Create a subdirectory with files
    await mkdir(join(testRepoPath, 'src'), { recursive: true });
    await writeFile(join(testRepoPath, 'src', 'index.ts'), 'export const test = true;');

    // Add and commit files
    await execFileAsync('git', ['add', '.'], { cwd: testRepoPath });
    await execFileAsync('git', ['commit', '-m', 'Initial commit'], { cwd: testRepoPath });

    gitProcessor = new GitProcessor(testRepoPath);
  });

  afterAll(async () => {
    // Clean up test repository
    try {
      await rmdir(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should create GitProcessor with valid path', () => {
      const processor = new GitProcessor('/some/path');
      expect(processor).toBeInstanceOf(GitProcessor);
    });

    it('should handle relative paths', () => {
      const processor = new GitProcessor('./relative/path');
      const absolutePath = processor.getRepositoryPath();

      // Should be an absolute path (starts with / on Unix or C:\ on Windows)
      expect(absolutePath).toMatch(/^(\/|[A-Za-z]:\\)/);

      // Should end with the relative path part
      expect(absolutePath).toMatch(/relative\/path$/);
    });
  });

  describe('isGitRepository', () => {
    it('should return true for valid git repository', async () => {
      const isValid = await gitProcessor.isGitRepository();
      expect(isValid).toBe(true);
    });

    it('should return false for non-git directory', async () => {
      const nonGitProcessor = new GitProcessor('/tmp');
      const isValid = await nonGitProcessor.isGitRepository();
      expect(isValid).toBe(false);
    });

    it('should return false for non-existent directory', async () => {
      const nonExistentProcessor = new GitProcessor('/non/existent/path');
      const isValid = await nonExistentProcessor.isGitRepository();
      expect(isValid).toBe(false);
    });
  });

  describe('getTrackedFiles', () => {
    it('should return array of tracked files', async () => {
      const files = await gitProcessor.getTrackedFiles();

      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);

      // Check that our test files are included
      expect(files).toContain('test.js');
      expect(files).toContain('README.md');
      expect(files).toContain('package.json');
      expect(files).toContain('src/index.ts');
    });

    it('should throw error for invalid git repository', async () => {
      const invalidProcessor = new GitProcessor('/tmp');

      await expect(invalidProcessor.getTrackedFiles()).rejects.toThrow(
        'Not a valid git repository'
      );
    });

    it('should handle repository with no commits', async () => {
      // Create empty git repository
      const emptyRepoPath = join(process.cwd(), 'test-empty-repo');
      await mkdir(emptyRepoPath, { recursive: true });
      await execFileAsync('git', ['init'], { cwd: emptyRepoPath });

      const emptyProcessor = new GitProcessor(emptyRepoPath);
      const files = await emptyProcessor.getTrackedFiles();

      expect(files).toEqual([]);

      // Cleanup
      await rmdir(emptyRepoPath, { recursive: true });
    });
  });

  describe('getRepositoryPath', () => {
    it('should return absolute path to repository', () => {
      const path = gitProcessor.getRepositoryPath();
      expect(path).toBe(testRepoPath);
    });
  });
});
