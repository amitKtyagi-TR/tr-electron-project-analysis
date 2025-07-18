"use strict";
/**
 * Results Aggregation System
 *
 * This module aggregates individual file analyses and pattern detection results
 * into the final structured output that matches the Python implementation format.
 * It handles folder organization, summary statistics, dependency graph building,
 * and relative import resolution.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsAggregator = void 0;
var path_1 = require("path");
var index_js_1 = require("../types/index.js"); // Regular import for value
/**
 * Results aggregator that combines individual file analyses into final output
 */
var ResultsAggregator = /** @class */ (function () {
    function ResultsAggregator(options) {
        this.options = __assign({ includeFrameworks: true, detectCircularDependencies: true, maxCircularDepth: 10 }, options);
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
    ResultsAggregator.prototype.aggregateResults = function (fileAnalyses, frameworkDetections, apiEndpoints, statePatterns, eventHandlers, startTime) {
        // Convert coordinator results to enriched file analyses
        var enrichedAnalyses = this.enrichFileAnalyses(fileAnalyses, apiEndpoints, statePatterns, eventHandlers);
        // Build folder structure
        var folderStructure = this.buildFolderStructure(enrichedAnalyses);
        // Calculate summary statistics
        var summary = this.calculateSummary(enrichedAnalyses, frameworkDetections);
        // Build dependency graph
        var dependencies = this.buildDependencyGraph(enrichedAnalyses);
        // Create metadata
        var metadata = {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            engine_version: index_js_1.ANALYSIS_ENGINE_VERSION,
            repository_path: this.options.repositoryPath
        };
        return {
            folder_structure: folderStructure,
            summary: summary,
            dependencies: dependencies,
            metadata: metadata
        };
    };
    /**
     * Enrich file analyses with pattern detection results
     */
    ResultsAggregator.prototype.enrichFileAnalyses = function (fileAnalyses, apiEndpoints, statePatterns, eventHandlers) {
        var _a, _b;
        var enrichedAnalyses = new Map();
        // Create lookups for pattern results by file path
        var apiEndpointsByFile = this.groupByFile(apiEndpoints);
        var statePatternsByFile = this.groupByFile(statePatterns);
        var eventHandlersByFile = this.groupByFile(eventHandlers);
        for (var _i = 0, fileAnalyses_1 = fileAnalyses; _i < fileAnalyses_1.length; _i++) {
            var _c = fileAnalyses_1[_i], filePath = _c[0], coordinatorResult = _c[1];
            var baseAnalysis = coordinatorResult.analysis;
            // Convert detailed pattern results to the format expected by FileAnalysis
            //   const api_endpoints = apiEndpointsByFile.get(filePath)?.map(endpoint => ({
            //     type: endpoint.framework,
            //     method: endpoint.method,
            //     route: endpoint.route,
            //     line: endpoint.line,
            //     framework: endpoint.framework
            //   })) || [];
            var state_changes = ((_a = statePatternsByFile.get(filePath)) === null || _a === void 0 ? void 0 : _a.map(function (pattern) { return ({
                type: pattern.type,
                line: pattern.line,
                variable: pattern.variable,
                mutation_type: pattern.mutation_type
            }); })) || [];
            var event_handlers = ((_b = eventHandlersByFile.get(filePath)) === null || _b === void 0 ? void 0 : _b.map(function (handler) { return ({
                type: handler.type,
                event: handler.event,
                handler: handler.handler,
                line: handler.line,
                framework: handler.framework
            }); })) || [];
            // Create enriched file analysis
            var enrichedAnalysis = __assign(__assign({}, baseAnalysis), { 
                // api_endpoints: api_endpoints.length > 0 ? api_endpoints : undefined,
                state_changes: state_changes.length > 0 ? state_changes : undefined, event_handlers: event_handlers.length > 0 ? event_handlers : undefined });
            enrichedAnalyses.set(filePath, enrichedAnalysis);
        }
        return enrichedAnalyses;
    };
    /**
     * Group pattern results by file path
     */
    ResultsAggregator.prototype.groupByFile = function (items) {
        var groups = new Map();
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            var existing = groups.get(item.filePath) || [];
            existing.push(item);
            groups.set(item.filePath, existing);
        }
        return groups;
    };
    /**
     * Build folder structure organization
     */
    ResultsAggregator.prototype.buildFolderStructure = function (analyses) {
        var folderStructure = {};
        for (var _i = 0, analyses_1 = analyses; _i < analyses_1.length; _i++) {
            var _a = analyses_1[_i], filePath = _a[0], analysis = _a[1];
            // Get the directory path
            var dirPath = (0, path_1.dirname)(filePath);
            var folderKey = dirPath === '.' ? 'root' : dirPath;
            // Initialize folder if it doesn't exist
            if (!folderStructure[folderKey]) {
                folderStructure[folderKey] = [];
            }
            // Add file analysis to folder
            folderStructure[folderKey].push(analysis);
        }
        // Sort files within each folder by path
        for (var folderKey in folderStructure) {
            var folderFiles = folderStructure[folderKey];
            if (folderFiles) { // Add null check for TypeScript
                folderFiles.sort(function (a, b) { return a.path.localeCompare(b.path); });
            }
        }
        return folderStructure;
    };
    /**
     * Calculate summary statistics
     */
    ResultsAggregator.prototype.calculateSummary = function (analyses, frameworkDetections) {
        var totalLines = 0;
        var languages = {};
        var extensions = {};
        var frameworks = {};
        // Process each file analysis
        for (var _i = 0, _a = analyses.values(); _i < _a.length; _i++) {
            var analysis = _a[_i];
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
            for (var _b = 0, frameworkDetections_1 = frameworkDetections; _b < frameworkDetections_1.length; _b++) {
                var detection = frameworkDetections_1[_b];
                frameworks[detection.name] = detection.confidence;
            }
        }
        return __assign({ total_files: analyses.size, total_lines: totalLines, languages: languages, extensions: extensions }, (Object.keys(frameworks).length > 0 && { frameworks: frameworks }));
    };
    /**
     * Build dependency graph with relative import resolution
     */
    ResultsAggregator.prototype.buildDependencyGraph = function (analyses) {
        var dependencies = {};
        // Create resolution context
        var context = {
            allFiles: new Set(analyses.keys()),
            resolvedCache: new Map(),
            repoAbsPath: (0, path_1.resolve)(this.options.repositoryPath)
        };
        // Process each file's imports
        for (var _i = 0, analyses_2 = analyses; _i < analyses_2.length; _i++) {
            var _a = analyses_2[_i], filePath = _a[0], analysis = _a[1];
            var fileDependencies = [];
            if (analysis.imports) {
                for (var _b = 0, _c = Object.entries(analysis.imports); _b < _c.length; _b++) {
                    var _d = _c[_b], modulePath = _d[0], importedNames = _d[1];
                    // Skip empty imports
                    if (!modulePath || importedNames.length === 0) {
                        continue;
                    }
                    if (modulePath.startsWith('.')) {
                        // Relative import - resolve to internal file
                        var resolved = this.resolveRelativeImport(filePath, modulePath, context);
                        if (resolved) {
                            fileDependencies.push(resolved);
                        }
                    }
                    else {
                        // External dependency - include as-is
                        fileDependencies.push(modulePath);
                    }
                }
            }
            // Remove duplicates and sort
            var uniqueDependencies = __spreadArray([], new Set(fileDependencies), true).sort();
            if (uniqueDependencies.length > 0) {
                dependencies[filePath] = uniqueDependencies;
            }
        }
        return dependencies;
    };
    /**
     * Resolve relative import to absolute file path within the repository
     */
    ResultsAggregator.prototype.resolveRelativeImport = function (fromFile, importPath, context) {
        // Create cache key
        var cacheKey = "".concat(fromFile, ":").concat(importPath);
        if (context.resolvedCache.has(cacheKey)) {
            return context.resolvedCache.get(cacheKey) || null;
        }
        // Get the directory of the importing file
        var fromDir = (0, path_1.dirname)((0, path_1.join)(context.repoAbsPath, fromFile));
        // Resolve the import path
        var resolvedPath;
        try {
            resolvedPath = (0, path_1.resolve)(fromDir, importPath);
        }
        catch (error) {
            context.resolvedCache.set(cacheKey, '');
            return null;
        }
        // Convert back to relative path from repository root
        var relativePath;
        try {
            relativePath = (0, path_1.relative)(context.repoAbsPath, resolvedPath);
            // Normalize path separators for cross-platform compatibility
            relativePath = relativePath.split(path_1.sep).join('/');
        }
        catch (error) {
            context.resolvedCache.set(cacheKey, '');
            return null;
        }
        // Try different file extensions and index file patterns
        var candidatePaths = [
            relativePath,
            "".concat(relativePath, ".js"),
            "".concat(relativePath, ".ts"),
            "".concat(relativePath, ".jsx"),
            "".concat(relativePath, ".tsx"),
            "".concat(relativePath, ".py"),
            "".concat(relativePath, "/index.js"),
            "".concat(relativePath, "/index.ts"),
            "".concat(relativePath, "/index.jsx"),
            "".concat(relativePath, "/index.tsx"),
            "".concat(relativePath, "/__init__.py")
        ];
        // Find the first candidate that exists in our analyzed files
        for (var _i = 0, candidatePaths_1 = candidatePaths; _i < candidatePaths_1.length; _i++) {
            var candidatePath = candidatePaths_1[_i];
            if (context.allFiles.has(candidatePath)) {
                context.resolvedCache.set(cacheKey, candidatePath);
                return candidatePath;
            }
        }
        // Not found
        context.resolvedCache.set(cacheKey, '');
        return null;
    };
    /**
     * Detect circular dependencies in the dependency graph
     */
    ResultsAggregator.prototype.detectCircularDependencies = function (dependencies) {
        var _this = this;
        if (!this.options.detectCircularDependencies) {
            return [];
        }
        var cycles = [];
        var visited = new Set();
        var recursionStack = new Set();
        var dfs = function (file, path) {
            if (path.length > _this.options.maxCircularDepth) {
                return; // Prevent infinite recursion
            }
            if (recursionStack.has(file)) {
                // Found a cycle
                var cycleStart = path.indexOf(file);
                var cycleFiles = path.slice(cycleStart);
                cycleFiles.push(file); // Complete the cycle
                cycles.push({
                    files: __spreadArray([], new Set(cycleFiles), true),
                    chain: cycleFiles
                });
                return;
            }
            if (visited.has(file)) {
                return; // Already processed
            }
            visited.add(file);
            recursionStack.add(file);
            var fileDependencies = dependencies[file] || [];
            for (var _i = 0, fileDependencies_1 = fileDependencies; _i < fileDependencies_1.length; _i++) {
                var dependency = fileDependencies_1[_i];
                // Only check internal dependencies (files, not external packages)
                if (dependencies[dependency]) {
                    dfs(dependency, __spreadArray(__spreadArray([], path, true), [file], false));
                }
            }
            recursionStack.delete(file);
        };
        // Check each file for cycles
        for (var file in dependencies) {
            if (!visited.has(file)) {
                dfs(file, []);
            }
        }
        return cycles;
    };
    /**
     * Get detailed statistics about the aggregation process
     */
    ResultsAggregator.prototype.getAggregationStats = function (result) {
        var folderCount = Object.keys(result.folder_structure).length;
        var fileCount = result.summary.total_files;
        var languageCount = Object.keys(result.summary.languages).length;
        var dependencyCount = Object.keys(result.dependencies).length;
        var totalDependencies = Object.values(result.dependencies)
            .reduce(function (sum, deps) { return sum + deps.length; }, 0);
        // Count internal vs external dependencies
        var internalDeps = 0;
        var externalDeps = 0;
        for (var _i = 0, _a = Object.values(result.dependencies); _i < _a.length; _i++) {
            var deps = _a[_i];
            for (var _b = 0, deps_1 = deps; _b < deps_1.length; _b++) {
                var dep = deps_1[_b];
                if (result.dependencies[dep]) {
                    internalDeps++;
                }
                else {
                    externalDeps++;
                }
            }
        }
        return {
            aggregation: {
                folderCount: folderCount,
                fileCount: fileCount,
                languageCount: languageCount,
                dependencyCount: dependencyCount,
                totalDependencies: totalDependencies,
                internalDependencies: internalDeps,
                externalDependencies: externalDeps
            },
            summary: result.summary,
            metadata: result.metadata
        };
    };
    return ResultsAggregator;
}());
exports.ResultsAggregator = ResultsAggregator;
