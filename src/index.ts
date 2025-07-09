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

/**
 * Configuration for flat text format conversion
 */
interface FlatConfig {
  /** Whether to use abbreviated keys */
  useAbbreviations: boolean;
  /** Whether to skip empty values */
  skipEmpty: boolean;
  /** Whether to remove line numbers */
  removeLineNumbers: boolean;
  /** Separator between file entries */
  fileSeparator: string;
  /** Indent for file content */
  contentIndent: string;
}

/**
 * Default configuration for flat format conversion
 */
const DEFAULT_FLAT_CONFIG: FlatConfig = {
  useAbbreviations: true,
  skipEmpty: true,
  removeLineNumbers: true,
  fileSeparator: '\n\n',
  contentIndent: '  '
};

/**
 * Key abbreviations map - matches clean-analysis.ts
 */
const KEY_ABBREVIATIONS: Record<string, string> = {
  'functions': 'fn',
  'classes': 'cls',
  'imports': 'imp',
  'methods': 'mth',
  'parameters': 'prm',
  'base_classes': 'bc',
  'decorators': 'dec',
  'is_async': 'async',
  'is_component': 'comp',
  'api_endpoints': 'api',
  'state_changes': 'states',
  'event_handlers': 'events',
  'language': 'lang',
  'docstring': 'doc',
  'variable': 'var',
  'handler': 'hdl',
  'mutation_type': 'mut',
  'frameworks': 'fw',
  'path': 'p',
  'type': 't'
};

/**
 * Keys to skip when removeLineNumbers is true
 */
const LINE_NUMBER_KEYS = [
  'line_number', 'line', 'ln', 'start_line', 'end_line',
  'lines', 'characters', 'non_empty_lines', 'avg_line_length',
  'total_lines', 'blank_lines', 'comment_lines', 'code_lines',
  'file_size', 'bytes', 'word_count', 'char_count'
];

/**
 * Check if a value is empty
 */
function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * Format a value for output
 */
function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') {
    if (value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    return value;
  }
  return JSON.stringify(value);
}

/**
 * Get abbreviated key if available
 */
function getKey(key: string, config: FlatConfig): string {
  if (config.useAbbreviations && KEY_ABBREVIATIONS[key]) {
    return KEY_ABBREVIATIONS[key];
  }
  return key;
}

/**
 * Should skip this key based on configuration
 */
function shouldSkipKey(key: string, config: FlatConfig): boolean {
  if (config.removeLineNumbers && LINE_NUMBER_KEYS.includes(key)) {
    return true;
  }
  return false;
}

/**
 * Format array values compactly
 */
function formatArray(arr: any[]): string {
  if (arr.length === 0) return '[]';

  const allSimple = arr.every(item =>
    typeof item === 'string' ||
    typeof item === 'number' ||
    typeof item === 'boolean' ||
    item === null
  );

  if (allSimple) {
    return `[${arr.map(formatValue).join(', ')}]`;
  }

  return arr.map((item, index) => {
    if (typeof item === 'object' && item !== null) {
      return `[${index}] ${formatObject(item, true)}`;
    }
    return `[${index}] ${formatValue(item)}`;
  }).join('\n    ');
}

/**
 * Format object as compact text
 */
function formatObject(obj: any, inline: boolean = false): string {
  if (obj === null || obj === undefined) return formatValue(obj);

  const parts: string[] = [];

  Object.entries(obj).forEach(([key, value]) => {
    if (shouldSkipKey(key, DEFAULT_FLAT_CONFIG)) return;
    if (DEFAULT_FLAT_CONFIG.skipEmpty && isEmpty(value)) return;

    const displayKey = getKey(key, DEFAULT_FLAT_CONFIG);

    if (Array.isArray(value)) {
      if (value.length > 0) {
        parts.push(`${displayKey}:${formatArray(value)}`);
      }
    } else if (typeof value === 'object' && value !== null) {
      const objStr = formatObject(value, true);
      parts.push(`${displayKey}:{${objStr}}`);
    } else {
      parts.push(`${displayKey}:${formatValue(value)}`);
    }
  });

  return inline ? parts.join(', ') : parts.join('\n  ');
}

/**
 * Extract file information from the analysis result
 */
function extractFileInfo(data: AnalysisResult): Map<string, any> {
  const fileMap = new Map<string, any>();

  // Handle folder_structure format
  if (data.folder_structure) {
    Object.values(data.folder_structure).forEach(files => {
      files.forEach(file => {
        if (file.path) {
          fileMap.set(file.path, file);
        }
      });
    });
  }

  return fileMap;
}

/**
 * Format file content as text
 */
function formatFileContent(filePath: string, fileData: any, config: FlatConfig): string {
  const lines: string[] = [];
  const indent = config.contentIndent;
  const skipKeys = ['path', 'p', 'language', 'lang', 'error'];

  Object.entries(fileData).forEach(([key, value]) => {
    if (skipKeys.includes(key)) return;
    if (shouldSkipKey(key, config)) return;
    if (config.skipEmpty && isEmpty(value)) return;

    const displayKey = getKey(key, config);

    if (Array.isArray(value)) {
      if (value.length === 0) return;

      if (key === 'imports' || key === 'imp') {
        if (typeof value[0] === 'object') {
          const imports: string[] = [];
          Object.entries(value[0]).forEach(([module, items]) => {
            if (Array.isArray(items) && items.length > 0) {
              imports.push(`${module}:[${items.join(',')}]`);
            } else {
              imports.push(module);
            }
          });
          lines.push(`${indent}${displayKey}: ${imports.join(', ')}`);
        } else {
          lines.push(`${indent}${displayKey}: ${value.join(', ')}`);
        }
      } else {
        const formatted = formatArray(value);
        if (formatted.includes('\n')) {
          lines.push(`${indent}${displayKey}:`);
          lines.push(`${indent}  ${formatted.replace(/\n/g, '\n' + indent + '  ')}`);
        } else {
          lines.push(`${indent}${displayKey}: ${formatted}`);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value);
      if (entries.length === 0) return;

      if (key === 'classes' || key === 'cls') {
        lines.push(`${indent}${displayKey}:`);
        entries.forEach(([className, classData]: [string, any]) => {
          const baseClasses = classData.base_classes || classData.bc || [];
          const methods = classData.methods || classData.mth || [];
          const isComponent = classData.is_component || classData.comp;
          const docstring = classData.docstring || classData.doc;

          let classLine = `${indent}  ${className}`;
          if (baseClasses.length > 0) {
            classLine += `(${baseClasses.join(', ')})`;
          }
          if (isComponent) {
            classLine += ' [component]';
          }
          lines.push(classLine);

          if (docstring && !isEmpty(docstring)) {
            lines.push(`${indent}    doc: ${formatValue(docstring)}`);
          }

          if (methods.length > 0 || (typeof methods === 'object' && Object.keys(methods).length > 0)) {
            const methodNames = Array.isArray(methods) ? methods : Object.keys(methods);
            lines.push(`${indent}    mth: ${methodNames.join(', ')}`);
          }
        });
      } else if (key === 'functions' || key === 'fn') {
        lines.push(`${indent}${displayKey}:`);
        entries.forEach(([funcName, funcData]: [string, any]) => {
          const params = funcData.parameters || funcData.prm || [];
          const isAsync = funcData.is_async || funcData.async;
          const docstring = funcData.docstring || funcData.doc;

          let funcLine = `${indent}  ${isAsync ? 'async ' : ''}${funcName}`;
          if (params.length > 0) {
            const paramStr = Array.isArray(params) ? params.join(', ') : Object.keys(params).join(', ');
            funcLine += `(${paramStr})`;
          }
          lines.push(funcLine);

          if (docstring && !isEmpty(docstring)) {
            lines.push(`${indent}    doc: ${formatValue(docstring)}`);
          }
        });
      } else {
        const objStr = formatObject(value);
        if (objStr.includes('\n')) {
          lines.push(`${indent}${displayKey}:`);
          lines.push(`${indent}  ${objStr.replace(/\n/g, '\n' + indent + '  ')}`);
        } else {
          lines.push(`${indent}${displayKey}: {${objStr}}`);
        }
      }
    } else {
      lines.push(`${indent}${displayKey}: ${formatValue(value)}`);
    }
  });

  return lines.join('\n');
}

/**
 * Convert analysis result to flat text format
 */
function convertAnalysisToFlatText(analysisResult: AnalysisResult, config: FlatConfig = DEFAULT_FLAT_CONFIG): string {
  const fileMap = extractFileInfo(analysisResult);
  const outputLines: string[] = [];

  // Sort files by path for consistent output
  const sortedPaths = Array.from(fileMap.keys()).sort();

  sortedPaths.forEach(filePath => {
    const fileData = fileMap.get(filePath);
    const content = formatFileContent(filePath, fileData, config);
    
    if (content && content.trim().length > 0) {
      outputLines.push(`<file path="${filePath}"/>`);
      outputLines.push(content);
    }
  });

  // Add dependencies if present
  if (analysisResult.dependencies && Object.keys(analysisResult.dependencies).length > 0) {
    outputLines.push('\n<dependencies>');
    Object.entries(analysisResult.dependencies).forEach(([file, deps]) => {
      if (Array.isArray(deps) && deps.length > 0) {
        outputLines.push(`  ${file}: ${deps.join(', ')}`);
      }
    });
    outputLines.push('</dependencies>');
  }

  return outputLines.join(config.fileSeparator);
}

/**
 * Analyze a git repository and return the result as flat text format
 * 
 * This is a wrapper function that combines both analysis and flat text conversion.
 * It performs the equivalent of running these two commands in sequence:
 * 1. npm run analyze:save "/path/to/repo" temp.json
 * 2. npm run clean-json temp.json output.txt
 * 
 * @param repositoryPath - Path to the git repository
 * @param options - Analysis options (optional)
 * @returns Promise that resolves to the flat text format
 * 
 * @example
 * ```typescript
 * import { analyzeRepositoryToText } from '@ai-assistant/code-analysis-engine';
 * 
 * const flatText = await analyzeRepositoryToText('/path/to/repo', {
 *   on_progress: (completed, total, current) => {
 *     console.log(`Progress: ${completed}/${total} - ${current}`);
 *   }
 * });
 * 
 * console.log(flatText);
 * ```
 */
export async function analyzeRepositoryToText(
  repositoryPath: string,
  options: AnalysisOptions = {}
): Promise<string> {
  // Perform the analysis first (excluding test files by default like analyze:save)
  const analysisResult = await analyzeRepository(repositoryPath, {
    exclude_test_files: true,
    ...options
  });

  // Convert to flat text format
  return convertAnalysisToFlatText(analysisResult);
}
