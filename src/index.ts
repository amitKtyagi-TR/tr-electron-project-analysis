/**
 * Code Analysis Engine - Main Entry Point
 *
 * This module provides the main API for analyzing git repositories.
 * It coordinates all the analysis components including git processing,
 * file analysis, pattern detection, and results aggregation.
 */

import { GitProcessor } from './core/git-processor.js';
import { FileProcessor } from './core/file-processor.js';
import { AnalysisCoordinator } from './core/analysis-coordinator.js';
import { ResultsAggregator } from './core/results-aggregator.js';
import { FrameworkDetector } from './patterns/framework-detector.js';
import { ApiDetector } from './patterns/api-detector.js';
import { StateDetector } from './patterns/state-detector.js';
import { EventDetector } from './patterns/event-detector.js';

import type {
  AnalysisResult,
  AnalysisOptions
} from './types/index.js';
import { ANALYSIS_ENGINE_VERSION } from './types/index.js'; // Regular import for value
import { shouldExcludeFile, filterTestFiles, getFilterStats } from './utils/test-file-filter.js';

// Re-export core types for convenience
export type {
  AnalysisResult,
  AnalysisOptions,
  FileAnalysis,
  ProjectSummary,
  DependencyGraph,
  FrameworkDetection,
  SupportedLanguage
} from './types/index.js';

// Re-export core classes for advanced usage
export {
  GitProcessor,
  FileProcessor,
  AnalysisCoordinator,
  ResultsAggregator
} from './core/index.js';

// Re-export pattern detection classes
export {
  FrameworkDetector,
  ApiDetector,
  StateDetector,
  EventDetector
} from './patterns/index.js';

export { ANALYSIS_ENGINE_VERSION } from './types/index.js';

/**
 * Analyze a git repository and return comprehensive analysis results
 *
 * This is the main entry point for the analysis engine. It performs a complete
 * analysis of a git repository including:
 * - Git-tracked file discovery
 * - Multi-language parsing (JavaScript/TypeScript via Babel, others via Tree-sitter)
 * - Framework detection (React, Django, NestJS, Flutter, Express)
 * - API endpoint extraction
 * - State management pattern detection
 * - Event handler identification
 * - Dependency graph construction
 * - Results aggregation and formatting
 *
 * @param repositoryPath - Absolute or relative path to the git repository
 * @param options - Configuration options for the analysis
 * @returns Promise that resolves to comprehensive analysis results
 *
 * @example
 * ```typescript
 * import { analyzeRepository } from '@ai-assistant/code-analysis-engine';
 *
 * const results = await analyzeRepository('./my-project', {
 *   extensions: ['.js', '.ts', '.py'],
 *   concurrency: 5,
 *   on_progress: (completed, total, current) => {
 *     console.log(`Progress: ${completed}/${total} - ${current}`);
 *   }
 * });
 *
 * console.log(`Found ${results.summary.total_files} files`);
 * console.log(`Detected frameworks:`, Object.keys(results.summary.frameworks || {}));
 * ```
 */
export async function analyzeRepository(
  repositoryPath: string,
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  const startTime = Date.now();

  try {
    // Initialize core components
    const gitProcessor = new GitProcessor(repositoryPath);
    const fileProcessor = new FileProcessor(repositoryPath);
    const analysisCoordinator = new AnalysisCoordinator();

    // Initialize pattern detectors
    const frameworkDetector = new FrameworkDetector();
    const apiDetector = new ApiDetector();
    const stateDetector = new StateDetector();
    const eventDetector = new EventDetector();

    // Initialize results aggregator
    const resultsAggregator = new ResultsAggregator({
      repositoryPath,
      includeFrameworks: true,
      detectCircularDependencies: true
    });

    // Phase 1: Discover git-tracked files
    if (options.on_progress) {
      options.on_progress(0, 100, 'Discovering files...');
    }

    const trackedFiles = await gitProcessor.getTrackedFiles();

    // Apply file filters if specified
    let filesToAnalyze = trackedFiles;
    
    // Filter by extensions first
    if (options.extensions) {
      filesToAnalyze = filesToAnalyze.filter(file =>
        options.extensions!.some(ext => file.endsWith(ext))
      );
    }

    // Filter out test files if requested
    if (options.exclude_test_files) {
      const beforeTestFilter = filesToAnalyze.length;
      filesToAnalyze = filterTestFiles(filesToAnalyze);
      const afterTestFilter = filesToAnalyze.length;
      const excludedCount = beforeTestFilter - afterTestFilter;
      
      if (options.on_progress && excludedCount > 0) {
        console.log(`   Excluded ${excludedCount} test files from analysis`);
      }
    }

    // Apply limit if specified
    if (options.limit) {
      filesToAnalyze = filesToAnalyze.slice(0, options.limit);
    }

    if (filesToAnalyze.length === 0) {
      // Return empty result if no files to analyze
      return {
        folder_structure: {},
        summary: {
          total_files: 0,
          total_lines: 0,
          languages: {},
          extensions: {}
        },
        dependencies: {},
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          engine_version: ANALYSIS_ENGINE_VERSION,
          repository_path: repositoryPath
        }
      };
    }

    // Phase 2: Read and process files
    const fileContents = await fileProcessor.processFiles(
      filesToAnalyze,
      async (content, filePath) => content, // Just return content, coordinator will analyze
      {
        concurrencyLimit: options.concurrency || 10,
        maxFileSize: options.max_file_size || 1024 * 1024, // 1MB default
        onProgress: options.on_progress ? (completed, total, current) => {
          const phase2Progress = Math.floor((completed / total) * 30) + 10; // 10-40%
          options.on_progress!(phase2Progress, 100, `Reading ${current}`);
        } : undefined,
        signal: options.signal
      }
    );

    // Convert file contents to analysis input format
    const filesForAnalysis = new Map<string, string>();
    for (const [filePath, contentOrError] of fileContents) {
      if (contentOrError instanceof Error) {
        // Skip files that couldn't be read, but include empty content to track the error
        filesForAnalysis.set(filePath, '');
      } else {
        filesForAnalysis.set(filePath, contentOrError);
      }
    }

    // Phase 3: Analyze files with coordinator
    const fileAnalyses = await analysisCoordinator.analyzeFiles(filesForAnalysis, {
      signal: options.signal,
      on_progress: options.on_progress ? (completed, total, current) => {
        const phase3Progress = Math.floor((completed / total) * 30) + 40; // 40-70%
        options.on_progress!(phase3Progress, 100, `Analyzing ${current}`);
      } : undefined
    });

    // Phase 4: Run pattern detection
    if (options.on_progress) {
      options.on_progress(70, 100, 'Detecting patterns...');
    }

    // Extract just the FileAnalysis objects for pattern detection
    const analysisMap = new Map<string, any>();
    for (const [filePath, result] of fileAnalyses) {
      analysisMap.set(filePath, result.analysis);
    }

    const [frameworkDetections, apiEndpoints, statePatterns, eventHandlers] = await Promise.all([
      Promise.resolve(frameworkDetector.detectFrameworks(analysisMap)),
      Promise.resolve(apiDetector.detectEndpoints(analysisMap)),
      Promise.resolve(stateDetector.detectStatePatterns(analysisMap)),
      Promise.resolve(eventDetector.detectEventHandlers(analysisMap))
    ]);

    // Phase 5: Aggregate results
    if (options.on_progress) {
      options.on_progress(90, 100, 'Aggregating results...');
    }

    const finalResult = resultsAggregator.aggregateResults(
      fileAnalyses,
      frameworkDetections,
      apiEndpoints,
      statePatterns,
      eventHandlers,
      startTime
    );

    if (options.on_progress) {
      options.on_progress(100, 100, 'Analysis complete');
    }

    return finalResult;

  } catch (error) {
    // Ensure we always return a valid result structure, even on error
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      folder_structure: {},
      summary: {
        total_files: 0,
        total_lines: 0,
        languages: {},
        extensions: {}
      },
      dependencies: {},
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        engine_version: ANALYSIS_ENGINE_VERSION,
        repository_path: repositoryPath,
        error: errorMessage
      } as any // Allow error in metadata
    };
  }
}

/**
 * Quick analysis function for testing and development
 *
 * @param repositoryPath - Path to repository
 * @param limit - Maximum number of files to analyze
 * @returns Analysis results with limited scope
 */
export async function quickAnalyze(
  repositoryPath: string = '.',
  limit: number = 50
): Promise<AnalysisResult> {
  return analyzeRepository(repositoryPath, {
    limit,
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.py', '.dart'],
    concurrency: 5
  });
}
