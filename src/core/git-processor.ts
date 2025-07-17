/**
 * Git Integration Module
 *
 * This module provides functionality to interact with git repositories,
 * discover tracked files, and validate repository structure.
 *
 * The GitProcessor class handles all git-related operations needed
 * for code analysis, including file discovery and repository validation.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, stat } from 'node:fs/promises';
import { join, resolve, isAbsolute } from 'node:path';

// Promisify execFile for async/await usage
const execFileAsync = promisify(execFile);

/**
 * Git repository processor for file discovery and validation
 *
 * This class provides methods to interact with git repositories,
 * including validating repository structure and discovering tracked files.
 */
export class GitProcessor {
  private readonly repoPath: string;
  private readonly gitDir: string;

  /**
   * Create a new GitProcessor instance
   *
   * @param repoPath - Path to the git repository (can be relative or absolute)
   * @throws {Error} If the repository path is invalid
   */
  constructor(repoPath: string) {
    // Convert to absolute path for consistency
    this.repoPath = isAbsolute(repoPath) ? repoPath : resolve(repoPath);
    this.gitDir = join(this.repoPath, '.git');
  }

  private async findGitExecutable(): Promise<string> {
    const possiblePaths = [
      'git', // Try PATH first
      '/usr/bin/git',
      '/usr/local/bin/git',
      '/opt/homebrew/bin/git', // macOS with Homebrew
      'C:\\Program Files\\Git\\bin\\git.exe', // Windows
    ];

    for (const gitPath of possiblePaths) {
      try {
        await execFileAsync(gitPath, ['--version'], { timeout: 5000 });
        return gitPath;
      } catch {
        continue;
      }
    }

    throw new Error('Git executable not found. Please ensure Git is installed.');
  }

  /**
   * Check if the specified directory is a valid git repository
   *
   * @returns Promise that resolves to true if valid git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await access(this.gitDir);
      const stats = await stat(this.gitDir);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

/**
   * Get all files tracked by git in the repository
   *
   * @returns Promise that resolves to array of file paths relative to repo root
   * @throws {Error} If not a valid git repository or git command fails
   */
  async getTrackedFiles(): Promise<string[]> {
    // First validate this is a git repository
    const isValidRepo = await this.isGitRepository();
    if (!isValidRepo) {
      throw new Error(`Not a valid git repository: ${this.repoPath}`);
    }

    try {
      // Use git ls-tree to get all tracked files
      const output = await this.runGitCommand(['ls-tree', '-r', 'HEAD', '--name-only']);

      // Filter out empty lines
      const allFiles = output
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Filter out binary files
      const textFiles = await this.filterBinaryFiles(allFiles);

      return textFiles;
    } catch (error) {
      // Handle case where repository has no commits yet
      if (error instanceof Error && error.message.includes('HEAD')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Execute a git command in the repository directory
   *
   * @param args - Arguments to pass to git command
   * @returns Promise that resolves to command stdout
   * @throws {Error} If git command fails
   * @private
   */
  private async runGitCommand(args: string[]): Promise<string> {
    try {
      const gitExecutable = await this.findGitExecutable();
      const { stdout, stderr } = await execFileAsync(gitExecutable, args, {
        cwd: this.repoPath,
        timeout: 30000, // 30 second timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large repositories
      });

      // Check for errors in stderr (git sometimes writes warnings to stderr)
      if (stderr && stderr.trim().length > 0) {
        console.warn(`Git warning: ${stderr.trim()}`);
      }

      return stdout.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Git command failed: git ${args.join(' ')}\n${error.message}`);
      }
      throw new Error(`Git command failed: git ${args.join(' ')}`);
    }
  }

/**
   * Check if files are binary using git attributes
   *
   * @param filePaths - Array of file paths to check
   * @returns Promise that resolves to array of non-binary file paths
   * @private
   */
  private async filterBinaryFiles(filePaths: string[]): Promise<string[]> {
    if (filePaths.length === 0) {
      return [];
    }

    try {
      // Use git check-attr to determine if files are binary
      // We'll check in batches to avoid command line length limits
      const batchSize = 100;
      const nonBinaryFiles: string[] = [];

      for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize);

        try {
          const output = await this.runGitCommand([
            'check-attr', 'binary', '--', ...batch
          ]);

          // Parse output: "filename: binary: set" or "filename: binary: unset"
          const lines = output.split('\n').filter(line => line.trim());

          for (const line of lines) {
            const parts = line.split(': binary: ');
            if (parts.length === 2) {
              const filename = parts[0];
              const binaryStatus = parts[1];

              // Type guard: ensure filename is defined and not empty
              if (filename && filename.trim().length > 0) {
                // Only include files that are not binary
                if (binaryStatus === 'unset' || binaryStatus === 'unspecified') {
                  nonBinaryFiles.push(filename.trim());
                }
              }
            }
          }
        } catch {
          // If git check-attr fails for this batch, include all files
          // (better to analyze a binary file than miss a text file)
          nonBinaryFiles.push(...batch);
        }
      }

      return nonBinaryFiles;
    } catch {
      // If binary detection fails entirely, return all files
      return filePaths;
    }
  }

  /**
   * Get the absolute path to the repository
   *
   * @returns Absolute path to repository root
   */
  getRepositoryPath(): string {
    return this.repoPath;
  }
}
