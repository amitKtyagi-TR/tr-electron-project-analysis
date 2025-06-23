/**
 * Results Aggregation System
 *
 * This module aggregates individual file analyses and pattern detection results
 * into the final structured output that matches the Python implementation format.
 * It handles folder organization, summary statistics, dependency graph building,
 * and relative import resolution.
 */

import { resolve, dirname, join, relative, sep } from 'path';
import type {
  AnalysisResult,
  FileAnalysis,
  ProjectSummary,
  DependencyGraph,
  AnalysisMetadata,
  FrameworkDetection
} from '../types/index.js';
import { ANALYSIS_ENGINE_VERSION } from '../types/index.js'; // Regular import for value
import type { AnalysisResult as CoordinatorResult } from './analysis-coordinator.js';
import type { DetailedApiEndpoint } from '../patterns/api-detector.js';
import type { DetailedStatePattern } from '../patterns/state-detector.js';
import type { DetailedEventHandler } from '../patterns/event-detector.js';

/**
 * Configuration options for results aggregation
 */
export interface AggregationOptions {
  /** Repository path for resolving relative imports */
  repositoryPath: string;
  /** Whether to include framework detection in summary */
  includeFrameworks?: boolean;
  /** Whether to detect circular dependencies */
  detectCircularDependencies?: boolean;
  /** Maximum depth for circular dependency detection */
  maxCircularDepth?: number;
}

/**
 * Internal structure for tracking dependency resolution
 */
interface ImportResolutionContext {
  /** All analyzed files for reference */
  allFiles: Set<string>;
  /** Cache for resolved imports */
  resolvedCache: Map<string, string>;
  /** Repository absolute path */
  repoAbsPath: string;
}

/**
 * Circular dependency detection result
 */
export interface CircularDependency {
  /** Files involved in the circular dependency */
  files: string[];
  /** Import chain that creates the cycle */
  chain: string[];
}

/**
 * Results aggregator that combines individual file analyses into final output
 */
export class ResultsAggregator {
  private options: Required<AggregationOptions>;

  constructor(options: AggregationOptions) {
    this.options = {
      includeFrameworks: true,
      detectCircularDependencies: true,
      maxCircularDepth: 10,
      ...options
    };
  }

  /**
   * Aggregate all analysis results into final output format
   *
   * @param fileAnalyses - Individual file analysis results from coordinator
   * @param frameworkDetections - Framework detection results
   * @param apiEndpoints - API endpoint detection results
   * @param statePatterns - State management pattern results
   * @param eventHandlers - Event handler detection results
   * @param startTime - Analysis start time for duration calculation
   * @returns Complete analysis result matching Python format
   */
  aggregateResults(
    fileAnalyses: Map<string, CoordinatorResult>,
    frameworkDetections: FrameworkDetection[],
    apiEndpoints: DetailedApiEndpoint[],
    statePatterns: DetailedStatePattern[],
    eventHandlers: DetailedEventHandler[],
    startTime: number
  ): AnalysisResult {
    // Convert coordinator results to enriched file analyses
    const enrichedAnalyses = this.enrichFileAnalyses(
      fileAnalyses,
      apiEndpoints,
      statePatterns,
      eventHandlers
    );

    // Build folder structure
    const folderStructure = this.buildFolderStructure(enrichedAnalyses);

    // Calculate summary statistics
    const summary = this.calculateSummary(enrichedAnalyses, frameworkDetections);

    // Build dependency graph
    const dependencies = this.buildDependencyGraph(enrichedAnalyses);

    // Create metadata
    const metadata: AnalysisMetadata = {
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      engine_version: ANALYSIS_ENGINE_VERSION,
      repository_path: this.options.repositoryPath
    };

    return {
      folder_structure: folderStructure,
      summary,
      dependencies,
      metadata
    };
  }

  /**
   * Enrich file analyses with pattern detection results
   */
  private enrichFileAnalyses(
    fileAnalyses: Map<string, CoordinatorResult>,
    apiEndpoints: DetailedApiEndpoint[],
    statePatterns: DetailedStatePattern[],
    eventHandlers: DetailedEventHandler[]
  ): Map<string, FileAnalysis> {
    const enrichedAnalyses = new Map<string, FileAnalysis>();

    // Create lookups for pattern results by file path
    const apiEndpointsByFile = this.groupByFile(apiEndpoints);
    const statePatternsByFile = this.groupByFile(statePatterns);
    const eventHandlersByFile = this.groupByFile(eventHandlers);

    for (const [filePath, coordinatorResult] of fileAnalyses) {
      const baseAnalysis = coordinatorResult.analysis;

      // Convert detailed pattern results to the format expected by FileAnalysis
    //   const api_endpoints = apiEndpointsByFile.get(filePath)?.map(endpoint => ({
    //     type: endpoint.framework,
    //     method: endpoint.method,
    //     route: endpoint.route,
    //     line: endpoint.line,
    //     framework: endpoint.framework
    //   })) || [];

      const state_changes = statePatternsByFile.get(filePath)?.map(pattern => ({
        type: pattern.type,
        line: pattern.line,
        variable: pattern.variable,
        mutation_type: pattern.mutation_type
      })) || [];

      const event_handlers = eventHandlersByFile.get(filePath)?.map(handler => ({
        type: handler.type,
        event: handler.event,
        handler: handler.handler,
        line: handler.line,
        framework: handler.framework
      })) || [];

      // Create enriched file analysis
      const enrichedAnalysis: FileAnalysis = {
        ...baseAnalysis,
        // api_endpoints: api_endpoints.length > 0 ? api_endpoints : undefined,
        state_changes: state_changes.length > 0 ? state_changes : undefined,
        event_handlers: event_handlers.length > 0 ? event_handlers : undefined
      };

      enrichedAnalyses.set(filePath, enrichedAnalysis);
    }

    return enrichedAnalyses;
  }

  /**
   * Group pattern results by file path
   */
  private groupByFile<T extends { filePath: string }>(items: T[]): Map<string, T[]> {
    const groups = new Map<string, T[]>();

    for (const item of items) {
      const existing = groups.get(item.filePath) || [];
      existing.push(item);
      groups.set(item.filePath, existing);
    }

    return groups;
  }

  /**
   * Build folder structure organization
   */
  private buildFolderStructure(analyses: Map<string, FileAnalysis>): Record<string, FileAnalysis[]> {
    const folderStructure: Record<string, FileAnalysis[]> = {};

    for (const [filePath, analysis] of analyses) {
      // Get the directory path
      const dirPath = dirname(filePath);
      const folderKey = dirPath === '.' ? 'root' : dirPath;

      // Initialize folder if it doesn't exist
      if (!folderStructure[folderKey]) {
        folderStructure[folderKey] = [];
      }

      // Add file analysis to folder
      folderStructure[folderKey].push(analysis);
    }

    // Sort files within each folder by path
    for (const folderKey in folderStructure) {
      const folderFiles = folderStructure[folderKey];
      if (folderFiles) { // Add null check for TypeScript
        folderFiles.sort((a, b) => a.path.localeCompare(b.path));
      }
    }

    return folderStructure;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    analyses: Map<string, FileAnalysis>,
    frameworkDetections: FrameworkDetection[]
  ): ProjectSummary {
    let totalLines = 0;
    const languages: Record<string, number> = {};
    const extensions: Record<string, number> = {};
    const frameworks: Record<string, number> = {};

    // Process each file analysis
    for (const analysis of analyses.values()) {
      // Count lines
      if (analysis.lines) {
        totalLines += analysis.lines;
      }

      // Count languages
      if (analysis.language) {
        languages[analysis.language] = (languages[analysis.language] || 0) + 1;
      }

      // Count extensions
      if (analysis.extension) {
        extensions[analysis.extension] = (extensions[analysis.extension] || 0) + 1;
      }
    }

    // Add framework detections if enabled
    if (this.options.includeFrameworks) {
      for (const detection of frameworkDetections) {
        frameworks[detection.name] = detection.confidence;
      }
    }

    return {
      total_files: analyses.size,
      total_lines: totalLines,
      languages,
      extensions,
      ...(Object.keys(frameworks).length > 0 && { frameworks })
    };
  }

  /**
   * Build dependency graph with relative import resolution
   */
  private buildDependencyGraph(analyses: Map<string, FileAnalysis>): DependencyGraph {
    const dependencies: DependencyGraph = {};

    // Create resolution context
    const context: ImportResolutionContext = {
      allFiles: new Set(analyses.keys()),
      resolvedCache: new Map(),
      repoAbsPath: resolve(this.options.repositoryPath)
    };

    // Process each file's imports
    for (const [filePath, analysis] of analyses) {
      const fileDependencies: string[] = [];

      if (analysis.imports) {
        for (const [modulePath, importedNames] of Object.entries(analysis.imports)) {
          // Skip empty imports
          if (!modulePath || importedNames.length === 0) {
            continue;
          }

          if (modulePath.startsWith('.')) {
            // Relative import - resolve to internal file
            const resolved = this.resolveRelativeImport(filePath, modulePath, context);
            if (resolved) {
              fileDependencies.push(resolved);
            }
          } else {
            // External dependency - include as-is
            fileDependencies.push(modulePath);
          }
        }
      }

      // Remove duplicates and sort
      const uniqueDependencies = [...new Set(fileDependencies)].sort();
      if (uniqueDependencies.length > 0) {
        dependencies[filePath] = uniqueDependencies;
      }
    }

    return dependencies;
  }

  /**
   * Resolve relative import to absolute file path within the repository
   */
  private resolveRelativeImport(
    fromFile: string,
    importPath: string,
    context: ImportResolutionContext
  ): string | null {
    // Create cache key
    const cacheKey = `${fromFile}:${importPath}`;
    if (context.resolvedCache.has(cacheKey)) {
      return context.resolvedCache.get(cacheKey) || null;
    }

    // Get the directory of the importing file
    const fromDir = dirname(join(context.repoAbsPath, fromFile));

    // Resolve the import path
    let resolvedPath: string;
    try {
      resolvedPath = resolve(fromDir, importPath);
    } catch (error) {
      context.resolvedCache.set(cacheKey, '');
      return null;
    }

    // Convert back to relative path from repository root
    let relativePath: string;
    try {
      relativePath = relative(context.repoAbsPath, resolvedPath);
      // Normalize path separators for cross-platform compatibility
      relativePath = relativePath.split(sep).join('/');
    } catch (error) {
      context.resolvedCache.set(cacheKey, '');
      return null;
    }

    // Try different file extensions and index file patterns
    const candidatePaths = [
      relativePath,
      `${relativePath}.js`,
      `${relativePath}.ts`,
      `${relativePath}.jsx`,
      `${relativePath}.tsx`,
      `${relativePath}.py`,
      `${relativePath}/index.js`,
      `${relativePath}/index.ts`,
      `${relativePath}/index.jsx`,
      `${relativePath}/index.tsx`,
      `${relativePath}/__init__.py`
    ];

    // Find the first candidate that exists in our analyzed files
    for (const candidatePath of candidatePaths) {
      if (context.allFiles.has(candidatePath)) {
        context.resolvedCache.set(cacheKey, candidatePath);
        return candidatePath;
      }
    }

    // Not found
    context.resolvedCache.set(cacheKey, '');
    return null;
  }

  /**
   * Detect circular dependencies in the dependency graph
   */
  detectCircularDependencies(dependencies: DependencyGraph): CircularDependency[] {
    if (!this.options.detectCircularDependencies) {
      return [];
    }

    const cycles: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (file: string, path: string[]): void => {
      if (path.length > this.options.maxCircularDepth) {
        return; // Prevent infinite recursion
      }

      if (recursionStack.has(file)) {
        // Found a cycle
        const cycleStart = path.indexOf(file);
        const cycleFiles = path.slice(cycleStart);
        cycleFiles.push(file); // Complete the cycle

        cycles.push({
          files: [...new Set(cycleFiles)],
          chain: cycleFiles
        });
        return;
      }

      if (visited.has(file)) {
        return; // Already processed
      }

      visited.add(file);
      recursionStack.add(file);

      const fileDependencies = dependencies[file] || [];
      for (const dependency of fileDependencies) {
        // Only check internal dependencies (files, not external packages)
        if (dependencies[dependency]) {
          dfs(dependency, [...path, file]);
        }
      }

      recursionStack.delete(file);
    };

    // Check each file for cycles
    for (const file in dependencies) {
      if (!visited.has(file)) {
        dfs(file, []);
      }
    }

    return cycles;
  }

  /**
   * Get detailed statistics about the aggregation process
   */
  getAggregationStats(result: AnalysisResult): Record<string, any> {
    const folderCount = Object.keys(result.folder_structure).length;
    const fileCount = result.summary.total_files;
    const languageCount = Object.keys(result.summary.languages).length;
    const dependencyCount = Object.keys(result.dependencies).length;
    const totalDependencies = Object.values(result.dependencies)
      .reduce((sum, deps) => sum + deps.length, 0);

    // Count internal vs external dependencies
    let internalDeps = 0;
    let externalDeps = 0;

    for (const deps of Object.values(result.dependencies)) {
      for (const dep of deps) {
        if (result.dependencies[dep]) {
          internalDeps++;
        } else {
          externalDeps++;
        }
      }
    }

    return {
      aggregation: {
        folderCount,
        fileCount,
        languageCount,
        dependencyCount,
        totalDependencies,
        internalDependencies: internalDeps,
        externalDependencies: externalDeps
      },
      summary: result.summary,
      metadata: result.metadata
    };
  }
}
