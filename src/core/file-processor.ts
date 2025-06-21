/**
 * File Processing Module
 *
 * This module provides concurrent file reading capabilities with progress tracking,
 * cancellation support, and error handling. It's designed to efficiently process
 * large numbers of files while maintaining memory usage and providing user feedback.
 */

import { readFile } from 'node:fs/promises';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import pLimit from 'p-limit';
import type { FileAnalysis } from '../types/index.js';

/**
 * Configuration options for file processing
 */
export interface ProcessingOptions {
  /** Maximum number of files to process concurrently (default: 10) */
  concurrencyLimit: number;
  /** Maximum file size to process in bytes (default: 1MB) */
  maxFileSize: number;
  /** Text encoding for file reading (default: 'utf8') */
  encoding: BufferEncoding;
  /** Progress callback function */
  onProgress?: (completed: number, total: number, currentFile?: string) => void;
  /** AbortSignal for cancellation support */
  signal?: AbortSignal;
}

/**
 * Default processing options
 */
export const DEFAULT_PROCESSING_OPTIONS: ProcessingOptions = {
  concurrencyLimit: 10,
  maxFileSize: 1024 * 1024, // 1MB
  encoding: 'utf8',
};

/**
 * Result of processing a single file
 */
export interface FileProcessingResult {
  /** File path relative to repository root */
  filePath: string;
  /** File content (if successfully read) */
  content?: string;
  /** Error information (if processing failed) */
  error?: {
    type: 'file_too_large' | 'encoding_error' | 'permission_error' | 'not_found' | 'unknown';
    message: string;
  };
  /** File size in bytes */
  fileSize?: number;
}

/**
 * File processor with concurrent reading capabilities
 *
 * This class handles reading multiple files concurrently while respecting
 * system limits and providing progress feedback to the user.
 */
export class FileProcessor {
  private readonly repositoryPath: string;
  private completedCount = 0;
  private totalCount = 0;

  /**
   * Create a new FileProcessor
   *
   * @param repositoryPath - Absolute path to the repository root
   */
  constructor(repositoryPath: string) {
    this.repositoryPath = repositoryPath;
  }

  /**
   * Process multiple files concurrently with progress tracking
   *
   * @param filePaths - Array of file paths relative to repository root
   * @param processor - Function to process each file's content
   * @param options - Processing configuration options
   * @returns Map of file paths to their analysis results
   */
  async processFiles<T>(
    filePaths: string[],
    processor: (content: string, filePath: string) => Promise<T>,
    options: Partial<ProcessingOptions> = {}
  ): Promise<Map<string, T | Error>> {
    // Merge with default options
    const config: ProcessingOptions = {
      ...DEFAULT_PROCESSING_OPTIONS,
      ...options,
    };

    // Initialize progress tracking
    this.completedCount = 0;
    this.totalCount = filePaths.length;

    // Create concurrency limiter
    const limit = pLimit(config.concurrencyLimit);

    // Create results map
    const results = new Map<string, T | Error>();

    // Check for cancellation before starting
    this.checkCancellation(config.signal);

    // Process files concurrently
    const processingPromises = filePaths.map(filePath =>
      limit(async () => {
        try {
          // Check for cancellation
          this.checkCancellation(config.signal);

          // Read file content
          const fileResult = await this.readFile(filePath, config);

          if (fileResult.error) {
            // Store error in results
            const error = new Error(fileResult.error.message);
            error.name = fileResult.error.type;
            results.set(filePath, error);
          } else {
            // Process file content
            const analysisResult = await processor(fileResult.content!, filePath);
            results.set(filePath, analysisResult);
          }

          // Update progress
          this.updateProgress(config.onProgress, filePath);

        } catch (error) {
          // Handle unexpected errors
          const processError = error instanceof Error ? error : new Error(String(error));
          results.set(filePath, processError);

          // Still update progress on error
          this.updateProgress(config.onProgress, filePath);
        }
      })
    );

    // Wait for all processing to complete
    await Promise.all(processingPromises);

    return results;
  }

  /**
   * Read a single file with size and encoding validation
   *
   * @param filePath - Path to file relative to repository root
   * @param options - Processing options
   * @returns File processing result
   * @private
   */
  private async readFile(filePath: string, options: ProcessingOptions): Promise<FileProcessingResult> {
    const fullPath = join(this.repositoryPath, filePath);

    try {
      // Check file size first
      const stats = await stat(fullPath);

      if (stats.size > options.maxFileSize) {
        return {
          filePath,
          fileSize: stats.size,
          error: {
            type: 'file_too_large',
            message: `File size ${stats.size} bytes exceeds limit of ${options.maxFileSize} bytes`
          }
        };
      }

      // Read file content
      const content = await readFile(fullPath, { encoding: options.encoding });

      return {
        filePath,
        content,
        fileSize: stats.size,
      };

    } catch (error) {
      // Categorize the error
      let errorType: 'file_too_large' | 'encoding_error' | 'permission_error' | 'not_found' | 'unknown' = 'unknown';
      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;

        if (error.message.includes('ENOENT')) {
          errorType = 'not_found';
        } else if (error.message.includes('EACCES') || error.message.includes('EPERM')) {
          errorType = 'permission_error';
        } else if (error.message.includes('encoding')) {
          errorType = 'encoding_error';
        }
      }

      return {
        filePath,
        error: {
          type: errorType,
          message: errorMessage
        }
      };
    }
  }

  /**
   * Update progress and call progress callback
   *
   * @param onProgress - Progress callback function
   * @param currentFile - Currently processed file
   * @private
   */
  private updateProgress(
    onProgress?: ProcessingOptions['onProgress'],
    currentFile?: string
  ): void {
    this.completedCount++;

    if (onProgress) {
      onProgress(this.completedCount, this.totalCount, currentFile);
    }
  }

  /**
   * Check if operation should be cancelled
   *
   * @param signal - AbortSignal to check
   * @throws {Error} If operation is cancelled
   * @private
   */
  private checkCancellation(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw new Error('File processing was cancelled');
    }
  }

  /**
   * Get the repository path
   *
   * @returns Absolute path to repository
   */
  getRepositoryPath(): string {
    return this.repositoryPath;
  }
}
