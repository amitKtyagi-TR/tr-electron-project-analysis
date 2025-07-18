"use strict";
/**
 * Code Analysis Engine - Main Entry Point
 *
 * This module provides the main API for analyzing git repositories.
 * It coordinates all the analysis components including git processing,
 * file analysis, pattern detection, and results aggregation.
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYSIS_ENGINE_VERSION = exports.EventDetector = exports.StateDetector = exports.ApiDetector = exports.FrameworkDetector = exports.ResultsAggregator = exports.AnalysisCoordinator = exports.FileProcessor = exports.GitProcessor = void 0;
exports.analyzeRepository = analyzeRepository;
exports.quickAnalyze = quickAnalyze;
exports.analyzeRepositoryToText = analyzeRepositoryToText;
var git_processor_js_1 = require("./core/git-processor.js");
var file_processor_js_1 = require("./core/file-processor.js");
var analysis_coordinator_js_1 = require("./core/analysis-coordinator.js");
var results_aggregator_js_1 = require("./core/results-aggregator.js");
var framework_detector_js_1 = require("./patterns/framework-detector.js");
var api_detector_js_1 = require("./patterns/api-detector.js");
var state_detector_js_1 = require("./patterns/state-detector.js");
var event_detector_js_1 = require("./patterns/event-detector.js");
var index_js_1 = require("./types/index.js"); // Regular import for value
var test_file_filter_js_1 = require("./utils/test-file-filter.js");
// Re-export core classes for advanced usage
var index_js_2 = require("./core/index.js");
Object.defineProperty(exports, "GitProcessor", { enumerable: true, get: function () { return index_js_2.GitProcessor; } });
Object.defineProperty(exports, "FileProcessor", { enumerable: true, get: function () { return index_js_2.FileProcessor; } });
Object.defineProperty(exports, "AnalysisCoordinator", { enumerable: true, get: function () { return index_js_2.AnalysisCoordinator; } });
Object.defineProperty(exports, "ResultsAggregator", { enumerable: true, get: function () { return index_js_2.ResultsAggregator; } });
// Re-export pattern detection classes
var index_js_3 = require("./patterns/index.js");
Object.defineProperty(exports, "FrameworkDetector", { enumerable: true, get: function () { return index_js_3.FrameworkDetector; } });
Object.defineProperty(exports, "ApiDetector", { enumerable: true, get: function () { return index_js_3.ApiDetector; } });
Object.defineProperty(exports, "StateDetector", { enumerable: true, get: function () { return index_js_3.StateDetector; } });
Object.defineProperty(exports, "EventDetector", { enumerable: true, get: function () { return index_js_3.EventDetector; } });
var index_js_4 = require("./types/index.js");
Object.defineProperty(exports, "ANALYSIS_ENGINE_VERSION", { enumerable: true, get: function () { return index_js_4.ANALYSIS_ENGINE_VERSION; } });
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
function analyzeRepository(repositoryPath_1) {
    return __awaiter(this, arguments, void 0, function (repositoryPath, options) {
        var startTime, gitProcessor, fileProcessor, analysisCoordinator, frameworkDetector, apiDetector, stateDetector, eventDetector, resultsAggregator, trackedFiles, filesToAnalyze, beforeTestFilter, afterTestFilter, excludedCount, fileContents, filesForAnalysis, _i, fileContents_1, _a, filePath, contentOrError, fileAnalyses, analysisMap, _b, fileAnalyses_1, _c, filePath, result, _d, frameworkDetections, apiEndpoints, statePatterns, eventHandlers, finalResult, error_1, errorMessage;
        var _this = this;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    startTime = Date.now();
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 6, , 7]);
                    gitProcessor = new git_processor_js_1.GitProcessor(repositoryPath);
                    fileProcessor = new file_processor_js_1.FileProcessor(repositoryPath);
                    analysisCoordinator = new analysis_coordinator_js_1.AnalysisCoordinator();
                    frameworkDetector = new framework_detector_js_1.FrameworkDetector();
                    apiDetector = new api_detector_js_1.ApiDetector();
                    stateDetector = new state_detector_js_1.StateDetector();
                    eventDetector = new event_detector_js_1.EventDetector();
                    resultsAggregator = new results_aggregator_js_1.ResultsAggregator({
                        repositoryPath: repositoryPath,
                        includeFrameworks: true,
                        detectCircularDependencies: true
                    });
                    // Phase 1: Discover git-tracked files
                    if (options.on_progress) {
                        options.on_progress(0, 100, 'Discovering files...');
                    }
                    return [4 /*yield*/, gitProcessor.getTrackedFiles()];
                case 2:
                    trackedFiles = _e.sent();
                    filesToAnalyze = trackedFiles;
                    // Filter by extensions first
                    if (options.extensions) {
                        filesToAnalyze = filesToAnalyze.filter(function (file) {
                            return options.extensions.some(function (ext) { return file.endsWith(ext); });
                        });
                    }
                    // Filter out test files if requested
                    if (options.exclude_test_files) {
                        beforeTestFilter = filesToAnalyze.length;
                        filesToAnalyze = (0, test_file_filter_js_1.filterTestFiles)(filesToAnalyze);
                        afterTestFilter = filesToAnalyze.length;
                        excludedCount = beforeTestFilter - afterTestFilter;
                        if (options.on_progress && excludedCount > 0) {
                            console.log("   Excluded ".concat(excludedCount, " test files from analysis"));
                        }
                    }
                    // Apply limit if specified
                    if (options.limit) {
                        filesToAnalyze = filesToAnalyze.slice(0, options.limit);
                    }
                    if (filesToAnalyze.length === 0) {
                        // Return empty result if no files to analyze
                        return [2 /*return*/, {
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
                                    engine_version: index_js_1.ANALYSIS_ENGINE_VERSION,
                                    repository_path: repositoryPath
                                }
                            }];
                    }
                    return [4 /*yield*/, fileProcessor.processFiles(filesToAnalyze, function (content, filePath) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, content];
                        }); }); }, // Just return content, coordinator will analyze
                        {
                            concurrencyLimit: options.concurrency || 10,
                            maxFileSize: options.max_file_size || 1024 * 1024, // 1MB default
                            onProgress: options.on_progress ? function (completed, total, current) {
                                var phase2Progress = Math.floor((completed / total) * 30) + 10; // 10-40%
                                options.on_progress(phase2Progress, 100, "Reading ".concat(current));
                            } : undefined,
                            signal: options.signal
                        })];
                case 3:
                    fileContents = _e.sent();
                    filesForAnalysis = new Map();
                    for (_i = 0, fileContents_1 = fileContents; _i < fileContents_1.length; _i++) {
                        _a = fileContents_1[_i], filePath = _a[0], contentOrError = _a[1];
                        if (contentOrError instanceof Error) {
                            // Skip files that couldn't be read, but include empty content to track the error
                            filesForAnalysis.set(filePath, '');
                        }
                        else {
                            filesForAnalysis.set(filePath, contentOrError);
                        }
                    }
                    return [4 /*yield*/, analysisCoordinator.analyzeFiles(filesForAnalysis, {
                            signal: options.signal,
                            on_progress: options.on_progress ? function (completed, total, current) {
                                var phase3Progress = Math.floor((completed / total) * 30) + 40; // 40-70%
                                options.on_progress(phase3Progress, 100, "Analyzing ".concat(current));
                            } : undefined
                        })];
                case 4:
                    fileAnalyses = _e.sent();
                    // Phase 4: Run pattern detection
                    if (options.on_progress) {
                        options.on_progress(70, 100, 'Detecting patterns...');
                    }
                    analysisMap = new Map();
                    for (_b = 0, fileAnalyses_1 = fileAnalyses; _b < fileAnalyses_1.length; _b++) {
                        _c = fileAnalyses_1[_b], filePath = _c[0], result = _c[1];
                        analysisMap.set(filePath, result.analysis);
                    }
                    return [4 /*yield*/, Promise.all([
                            Promise.resolve(frameworkDetector.detectFrameworks(analysisMap)),
                            Promise.resolve(apiDetector.detectEndpoints(analysisMap)),
                            Promise.resolve(stateDetector.detectStatePatterns(analysisMap)),
                            Promise.resolve(eventDetector.detectEventHandlers(analysisMap))
                        ])];
                case 5:
                    _d = _e.sent(), frameworkDetections = _d[0], apiEndpoints = _d[1], statePatterns = _d[2], eventHandlers = _d[3];
                    // Phase 5: Aggregate results
                    if (options.on_progress) {
                        options.on_progress(90, 100, 'Aggregating results...');
                    }
                    finalResult = resultsAggregator.aggregateResults(fileAnalyses, frameworkDetections, apiEndpoints, statePatterns, eventHandlers, startTime);
                    if (options.on_progress) {
                        options.on_progress(100, 100, 'Analysis complete');
                    }
                    return [2 /*return*/, finalResult];
                case 6:
                    error_1 = _e.sent();
                    errorMessage = error_1 instanceof Error ? error_1.message : String(error_1);
                    return [2 /*return*/, {
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
                                engine_version: index_js_1.ANALYSIS_ENGINE_VERSION,
                                repository_path: repositoryPath,
                                error: errorMessage
                            } // Allow error in metadata
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * Quick analysis function for testing and development
 *
 * @param repositoryPath - Path to repository
 * @param limit - Maximum number of files to analyze
 * @returns Analysis results with limited scope
 */
function quickAnalyze() {
    return __awaiter(this, arguments, void 0, function (repositoryPath, limit) {
        if (repositoryPath === void 0) { repositoryPath = '.'; }
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            return [2 /*return*/, analyzeRepository(repositoryPath, {
                    limit: limit,
                    extensions: ['.js', '.jsx', '.ts', '.tsx', '.py', '.dart'],
                    concurrency: 5
                })];
        });
    });
}
/**
 * Default configuration for flat format conversion
 */
var DEFAULT_FLAT_CONFIG = {
    useAbbreviations: true,
    skipEmpty: true,
    removeLineNumbers: true,
    fileSeparator: '\n\n',
    contentIndent: '  '
};
/**
 * Key abbreviations map - matches clean-analysis.ts
 */
var KEY_ABBREVIATIONS = {
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
var LINE_NUMBER_KEYS = [
    'line_number', 'line', 'ln', 'start_line', 'end_line',
    'lines', 'characters', 'non_empty_lines', 'avg_line_length',
    'total_lines', 'blank_lines', 'comment_lines', 'code_lines',
    'file_size', 'bytes', 'word_count', 'char_count'
];
/**
 * Check if a value is empty
 */
function isEmpty(value) {
    if (value === null || value === undefined)
        return true;
    if (value === '')
        return true;
    if (Array.isArray(value) && value.length === 0)
        return true;
    if (typeof value === 'object' && Object.keys(value).length === 0)
        return true;
    return false;
}
/**
 * Format a value for output
 */
function formatValue(value) {
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'undefined';
    if (typeof value === 'boolean')
        return value ? '1' : '0';
    if (typeof value === 'number')
        return value.toString();
    if (typeof value === 'string') {
        if (value.includes('\n') || value.includes('"')) {
            return "\"".concat(value.replace(/"/g, '\\"').replace(/\n/g, '\\n'), "\"");
        }
        return value;
    }
    return JSON.stringify(value);
}
/**
 * Get abbreviated key if available
 */
function getKey(key, config) {
    if (config.useAbbreviations && KEY_ABBREVIATIONS[key]) {
        return KEY_ABBREVIATIONS[key];
    }
    return key;
}
/**
 * Should skip this key based on configuration
 */
function shouldSkipKey(key, config) {
    if (config.removeLineNumbers && LINE_NUMBER_KEYS.includes(key)) {
        return true;
    }
    return false;
}
/**
 * Format array values compactly
 */
function formatArray(arr) {
    if (arr.length === 0)
        return '[]';
    var allSimple = arr.every(function (item) {
        return typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean' ||
            item === null;
    });
    if (allSimple) {
        return "[".concat(arr.map(formatValue).join(', '), "]");
    }
    return arr.map(function (item, index) {
        if (typeof item === 'object' && item !== null) {
            return "[".concat(index, "] ").concat(formatObject(item, true));
        }
        return "[".concat(index, "] ").concat(formatValue(item));
    }).join('\n    ');
}
/**
 * Format object as compact text
 */
function formatObject(obj, inline) {
    if (inline === void 0) { inline = false; }
    if (obj === null || obj === undefined)
        return formatValue(obj);
    var parts = [];
    Object.entries(obj).forEach(function (_a) {
        var key = _a[0], value = _a[1];
        if (shouldSkipKey(key, DEFAULT_FLAT_CONFIG))
            return;
        if (DEFAULT_FLAT_CONFIG.skipEmpty && isEmpty(value))
            return;
        var displayKey = getKey(key, DEFAULT_FLAT_CONFIG);
        if (Array.isArray(value)) {
            if (value.length > 0) {
                parts.push("".concat(displayKey, ":").concat(formatArray(value)));
            }
        }
        else if (typeof value === 'object' && value !== null) {
            var objStr = formatObject(value, true);
            parts.push("".concat(displayKey, ":{").concat(objStr, "}"));
        }
        else {
            parts.push("".concat(displayKey, ":").concat(formatValue(value)));
        }
    });
    return inline ? parts.join(', ') : parts.join('\n  ');
}
/**
 * Extract file information from the analysis result
 */
function extractFileInfo(data) {
    var fileMap = new Map();
    // Handle folder_structure format
    if (data.folder_structure) {
        Object.values(data.folder_structure).forEach(function (files) {
            files.forEach(function (file) {
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
function formatFileContent(filePath, fileData, config) {
    var lines = [];
    var indent = config.contentIndent;
    var skipKeys = ['path', 'p', 'language', 'lang', 'error'];
    Object.entries(fileData).forEach(function (_a) {
        var key = _a[0], value = _a[1];
        if (skipKeys.includes(key))
            return;
        if (shouldSkipKey(key, config))
            return;
        if (config.skipEmpty && isEmpty(value))
            return;
        var displayKey = getKey(key, config);
        if (Array.isArray(value)) {
            if (value.length === 0)
                return;
            if (key === 'imports' || key === 'imp') {
                if (typeof value[0] === 'object') {
                    var imports_1 = [];
                    Object.entries(value[0]).forEach(function (_a) {
                        var module = _a[0], items = _a[1];
                        if (Array.isArray(items) && items.length > 0) {
                            imports_1.push("".concat(module, ":[").concat(items.join(','), "]"));
                        }
                        else {
                            imports_1.push(module);
                        }
                    });
                    lines.push("".concat(indent).concat(displayKey, ": ").concat(imports_1.join(', ')));
                }
                else {
                    lines.push("".concat(indent).concat(displayKey, ": ").concat(value.join(', ')));
                }
            }
            else {
                var formatted = formatArray(value);
                if (formatted.includes('\n')) {
                    lines.push("".concat(indent).concat(displayKey, ":"));
                    lines.push("".concat(indent, "  ").concat(formatted.replace(/\n/g, '\n' + indent + '  ')));
                }
                else {
                    lines.push("".concat(indent).concat(displayKey, ": ").concat(formatted));
                }
            }
        }
        else if (typeof value === 'object' && value !== null) {
            var entries = Object.entries(value);
            if (entries.length === 0)
                return;
            if (key === 'classes' || key === 'cls') {
                lines.push("".concat(indent).concat(displayKey, ":"));
                entries.forEach(function (_a) {
                    var className = _a[0], classData = _a[1];
                    var baseClasses = classData.base_classes || classData.bc || [];
                    var methods = classData.methods || classData.mth || [];
                    var isComponent = classData.is_component || classData.comp;
                    var docstring = classData.docstring || classData.doc;
                    var classLine = "".concat(indent, "  ").concat(className);
                    if (baseClasses.length > 0) {
                        classLine += "(".concat(baseClasses.join(', '), ")");
                    }
                    if (isComponent) {
                        classLine += ' [component]';
                    }
                    lines.push(classLine);
                    if (docstring && !isEmpty(docstring)) {
                        lines.push("".concat(indent, "    doc: ").concat(formatValue(docstring)));
                    }
                    if (methods.length > 0 || (typeof methods === 'object' && Object.keys(methods).length > 0)) {
                        var methodNames = Array.isArray(methods) ? methods : Object.keys(methods);
                        lines.push("".concat(indent, "    mth: ").concat(methodNames.join(', ')));
                    }
                });
            }
            else if (key === 'functions' || key === 'fn') {
                lines.push("".concat(indent).concat(displayKey, ":"));
                entries.forEach(function (_a) {
                    var funcName = _a[0], funcData = _a[1];
                    var params = funcData.parameters || funcData.prm || [];
                    var isAsync = funcData.is_async || funcData.async;
                    var docstring = funcData.docstring || funcData.doc;
                    var funcLine = "".concat(indent, "  ").concat(isAsync ? 'async ' : '').concat(funcName);
                    if (params.length > 0) {
                        var paramStr = Array.isArray(params) ? params.join(', ') : Object.keys(params).join(', ');
                        funcLine += "(".concat(paramStr, ")");
                    }
                    lines.push(funcLine);
                    if (docstring && !isEmpty(docstring)) {
                        lines.push("".concat(indent, "    doc: ").concat(formatValue(docstring)));
                    }
                });
            }
            else {
                var objStr = formatObject(value);
                if (objStr.includes('\n')) {
                    lines.push("".concat(indent).concat(displayKey, ":"));
                    lines.push("".concat(indent, "  ").concat(objStr.replace(/\n/g, '\n' + indent + '  ')));
                }
                else {
                    lines.push("".concat(indent).concat(displayKey, ": {").concat(objStr, "}"));
                }
            }
        }
        else {
            lines.push("".concat(indent).concat(displayKey, ": ").concat(formatValue(value)));
        }
    });
    return lines.join('\n');
}
/**
 * Convert analysis result to flat text format
 */
function convertAnalysisToFlatText(analysisResult, config) {
    if (config === void 0) { config = DEFAULT_FLAT_CONFIG; }
    var fileMap = extractFileInfo(analysisResult);
    var outputLines = [];
    // Sort files by path for consistent output
    var sortedPaths = Array.from(fileMap.keys()).sort();
    sortedPaths.forEach(function (filePath) {
        var fileData = fileMap.get(filePath);
        var content = formatFileContent(filePath, fileData, config);
        if (content && content.trim().length > 0) {
            outputLines.push("<file path=\"".concat(filePath, "\"/>"));
            outputLines.push(content);
        }
    });
    // Add dependencies if present
    if (analysisResult.dependencies && Object.keys(analysisResult.dependencies).length > 0) {
        outputLines.push('\n<dependencies>');
        Object.entries(analysisResult.dependencies).forEach(function (_a) {
            var file = _a[0], deps = _a[1];
            if (Array.isArray(deps) && deps.length > 0) {
                outputLines.push("  ".concat(file, ": ").concat(deps.join(', ')));
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
function analyzeRepositoryToText(repositoryPath_1) {
    return __awaiter(this, arguments, void 0, function (repositoryPath, options) {
        var analysisResult;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, analyzeRepository(repositoryPath, __assign({ exclude_test_files: true }, options))];
                case 1:
                    analysisResult = _a.sent();
                    // Convert to flat text format
                    return [2 /*return*/, convertAnalysisToFlatText(analysisResult)];
            }
        });
    });
}
