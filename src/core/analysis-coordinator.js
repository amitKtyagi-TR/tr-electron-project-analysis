"use strict";
/**
 * Multi-Language Analysis Coordinator
 *
 * This module coordinates the analysis of source code files across multiple
 * programming languages. It routes files to appropriate parsers based on
 * language detection and normalizes the output format.
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
exports.AnalysisCoordinator = void 0;
var tree_sitter_manager_js_1 = require("../parsers/tree-sitter-manager.js");
var babel_analyzer_js_1 = require("../parsers/babel-analyzer.js");
var python_analyzer_js_1 = require("../parsers/python-analyzer.js");
var language_detector_js_1 = require("./language-detector.js");
/**
 * Analysis coordinator that manages multiple parsers
 *
 * This class provides a unified interface for analyzing source code files
 * regardless of their programming language. It automatically detects languages
 * and routes files to the most appropriate parser.
 */
var AnalysisCoordinator = /** @class */ (function () {
    /**
     * Create a new AnalysisCoordinator
     */
    function AnalysisCoordinator() {
        this.initialized = false;
        this.treeSitterManager = new tree_sitter_manager_js_1.TreeSitterManager();
        this.babelAnalyzer = new babel_analyzer_js_1.BabelAnalyzer();
        this.pythonAnalyzer = new python_analyzer_js_1.PythonAnalyzer();
        this.languageDetector = new language_detector_js_1.LanguageDetector();
    }
    /**
     * Initialize all parsers and analyzers
     *
     * @returns Promise that resolves when initialization is complete
     */
    AnalysisCoordinator.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.initialized) {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // Initialize Tree-sitter (may fail in development mode)
                        return [4 /*yield*/, this.treeSitterManager.initialize()];
                    case 2:
                        // Initialize Tree-sitter (may fail in development mode)
                        _a.sent();
                        this.initialized = true;
                        console.log('🎯 AnalysisCoordinator initialized successfully with Python analyzer');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.warn('⚠️  AnalysisCoordinator initialization warning:', error_1);
                        // Continue without Tree-sitter in development mode
                        this.initialized = true;
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyze a single file with automatic parser routing
     *
     * @param filePath - Path to the file relative to repository root
     * @param content - File content
     * @param options - Analysis options
     * @returns Promise that resolves to analysis result with metadata
     */
    AnalysisCoordinator.prototype.analyzeFile = function (filePath_1, content_1) {
        return __awaiter(this, arguments, void 0, function (filePath, content, options) {
            var startTime, detectedLanguage, analysis, parser, usedFallback, error_2, error_3, error_4, processingTime, error_5, processingTime;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        if (!!this.initialized) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.initialize()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 24, , 25]);
                        return [4 /*yield*/, this.languageDetector.detectLanguage(filePath, content)];
                    case 3:
                        detectedLanguage = _a.sent();
                        analysis = void 0;
                        parser = void 0;
                        usedFallback = false;
                        if (!this.shouldUseBabelParser(detectedLanguage)) return [3 /*break*/, 9];
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 8]);
                        return [4 /*yield*/, this.analyzeWithBabel(content, detectedLanguage, filePath)];
                    case 5:
                        analysis = _a.sent();
                        parser = 'babel';
                        return [3 /*break*/, 8];
                    case 6:
                        error_2 = _a.sent();
                        console.warn("Babel parsing failed for ".concat(filePath, ", trying fallback:"), error_2);
                        return [4 /*yield*/, this.analyzeWithFallback(content, detectedLanguage, filePath)];
                    case 7:
                        analysis = _a.sent();
                        parser = 'basic';
                        usedFallback = true;
                        return [3 /*break*/, 8];
                    case 8: return [3 /*break*/, 23];
                    case 9:
                        if (!this.shouldUsePythonParser(detectedLanguage)) return [3 /*break*/, 15];
                        _a.label = 10;
                    case 10:
                        _a.trys.push([10, 12, , 14]);
                        return [4 /*yield*/, this.analyzeWithPython(content, filePath)];
                    case 11:
                        analysis = _a.sent();
                        parser = 'python';
                        return [3 /*break*/, 14];
                    case 12:
                        error_3 = _a.sent();
                        console.warn("Python parsing failed for ".concat(filePath, ", trying Tree-sitter fallback:"), error_3);
                        return [4 /*yield*/, this.analyzeWithTreeSitterFallback(content, detectedLanguage, filePath)];
                    case 13:
                        analysis = _a.sent();
                        parser = 'tree-sitter';
                        usedFallback = true;
                        return [3 /*break*/, 14];
                    case 14: return [3 /*break*/, 23];
                    case 15:
                        if (!this.shouldUseTreeSitter(detectedLanguage)) return [3 /*break*/, 21];
                        _a.label = 16;
                    case 16:
                        _a.trys.push([16, 18, , 20]);
                        return [4 /*yield*/, this.analyzeWithTreeSitter(content, detectedLanguage, filePath)];
                    case 17:
                        analysis = _a.sent();
                        parser = 'tree-sitter';
                        return [3 /*break*/, 20];
                    case 18:
                        error_4 = _a.sent();
                        console.warn("Tree-sitter parsing failed for ".concat(filePath, ", using basic analysis:"), error_4);
                        return [4 /*yield*/, this.analyzeBasic(content, filePath, detectedLanguage)];
                    case 19:
                        analysis = _a.sent();
                        parser = 'basic';
                        usedFallback = true;
                        return [3 /*break*/, 20];
                    case 20: return [3 /*break*/, 23];
                    case 21: return [4 /*yield*/, this.analyzeBasic(content, filePath, detectedLanguage)];
                    case 22:
                        // Use basic analysis for unsupported languages
                        analysis = _a.sent();
                        parser = 'basic';
                        _a.label = 23;
                    case 23:
                        processingTime = Date.now() - startTime;
                        return [2 /*return*/, {
                                analysis: analysis,
                                parser: parser,
                                detectedLanguage: detectedLanguage,
                                usedFallback: usedFallback,
                                processingTime: processingTime,
                            }];
                    case 24:
                        error_5 = _a.sent();
                        processingTime = Date.now() - startTime;
                        return [2 /*return*/, {
                                analysis: {
                                    path: filePath,
                                    language: 'unknown',
                                    imports: {},
                                    functions: {},
                                    classes: {},
                                    error: "Analysis failed: ".concat(error_5 instanceof Error ? error_5.message : String(error_5)),
                                },
                                parser: 'error',
                                detectedLanguage: 'unknown',
                                usedFallback: true,
                                processingTime: processingTime,
                            }];
                    case 25: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyze multiple files with progress tracking
     *
     * @param files - Map of file paths to content
     * @param options - Analysis options including progress callback
     * @returns Promise that resolves to map of results
     */
    AnalysisCoordinator.prototype.analyzeFiles = function (files_1) {
        return __awaiter(this, arguments, void 0, function (files, options) {
            var results, totalFiles, completedFiles, _i, files_2, _a, filePath, content, result, error_6;
            var _b;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        results = new Map();
                        totalFiles = files.size;
                        completedFiles = 0;
                        if (!!this.initialized) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.initialize()];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2:
                        _i = 0, files_2 = files;
                        _c.label = 3;
                    case 3:
                        if (!(_i < files_2.length)) return [3 /*break*/, 9];
                        _a = files_2[_i], filePath = _a[0], content = _a[1];
                        // Check for cancellation
                        if ((_b = options.signal) === null || _b === void 0 ? void 0 : _b.aborted) {
                            throw new Error('Analysis was cancelled');
                        }
                        _c.label = 4;
                    case 4:
                        _c.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this.analyzeFile(filePath, content, options)];
                    case 5:
                        result = _c.sent();
                        results.set(filePath, result);
                        return [3 /*break*/, 7];
                    case 6:
                        error_6 = _c.sent();
                        // Store error result
                        results.set(filePath, {
                            analysis: {
                                path: filePath,
                                language: 'unknown',
                                imports: {},
                                functions: {},
                                classes: {},
                                error: "Batch analysis failed: ".concat(error_6 instanceof Error ? error_6.message : String(error_6)),
                            },
                            parser: 'error',
                            detectedLanguage: 'unknown',
                            usedFallback: true,
                            processingTime: 0,
                        });
                        return [3 /*break*/, 7];
                    case 7:
                        // Update progress
                        completedFiles++;
                        if (options.on_progress) {
                            options.on_progress(completedFiles, totalFiles, filePath);
                        }
                        _c.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 3];
                    case 9: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Check if Babel parser should be used for a language
     *
     * @param language - Detected language
     * @returns True if Babel should be used
     * @private
     */
    AnalysisCoordinator.prototype.shouldUseBabelParser = function (language) {
        return language === 'javascript' || language === 'typescript';
    };
    /**
     * Check if Python parser should be used for a language
     *
     * @param language - Detected language
     * @returns True if Python parser should be used
     * @private
     */
    AnalysisCoordinator.prototype.shouldUsePythonParser = function (language) {
        return language === 'python';
    };
    /**
     * Check if Tree-sitter should be used for a language
     *
     * @param language - Detected language
     * @returns True if Tree-sitter should be used
     * @private
     */
    AnalysisCoordinator.prototype.shouldUseTreeSitter = function (language) {
        // Use Tree-sitter for languages that have parsers available (excluding Python which has dedicated parser)
        var treeSitterLanguages = ['dart', 'java', 'cpp', 'c'];
        return treeSitterLanguages.includes(language) && this.treeSitterManager.hasParser(language);
    };
    /**
       * Analyze file using Babel parser
       *
       * @param content - File content
       * @param language - JavaScript or TypeScript
       * @param filePath - File path for context
       * @returns Promise that resolves to file analysis
       * @private
       */
    AnalysisCoordinator.prototype.analyzeWithBabel = function (content, language, filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var analysis;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.babelAnalyzer.parseJavaScript(content, language, filePath)];
                    case 1:
                        analysis = _a.sent();
                        // Ensure required fields are present with defaults, then apply analysis results
                        return [2 /*return*/, __assign({ language: language, imports: {}, functions: {}, classes: {} }, analysis)];
                }
            });
        });
    };
    /**
     * Analyze file using Python parser
     *
     * @param content - File content
     * @param filePath - File path for context
     * @returns Promise that resolves to file analysis
     * @private
     */
    AnalysisCoordinator.prototype.analyzeWithPython = function (content, filePath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.pythonAnalyzer.analyzePython(content, filePath)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Analyze file using Tree-sitter parser
     *
     * @param content - File content
     * @param language - Programming language
     * @param filePath - File path for context
     * @returns Promise that resolves to file analysis
     * @private
     */
    AnalysisCoordinator.prototype.analyzeWithTreeSitter = function (content, language, filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var tree, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.treeSitterManager.parseFile(content, language)];
                    case 1:
                        tree = _a.sent();
                        // For now, return basic structure since Tree-sitter query implementation
                        // would require language-specific query development
                        return [2 /*return*/, {
                                path: filePath,
                                language: language,
                                imports: {},
                                functions: {},
                                classes: {},
                                // Could add Tree-sitter specific analysis here
                                lines: content.split('\n').length,
                                characters: content.length,
                            }];
                    case 2:
                        error_7 = _a.sent();
                        throw new Error("Tree-sitter parsing failed: ".concat(error_7));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fallback Tree-sitter analysis when Babel fails
     *
     * @param content - File content
     * @param language - Programming language
     * @param filePath - File path for context
     * @returns Promise that resolves to basic file analysis
     * @private
     */
    AnalysisCoordinator.prototype.analyzeWithTreeSitterFallback = function (content, language, filePath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.treeSitterManager.hasParser(language)) {
                    return [2 /*return*/, this.analyzeWithTreeSitter(content, language, filePath)];
                }
                else {
                    return [2 /*return*/, this.analyzeBasic(content, filePath, language)];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * General fallback analysis when primary parser fails
     *
     * @param content - File content
     * @param language - Programming language
     * @param filePath - File path for context
     * @returns Promise that resolves to basic file analysis
     * @private
     */
    AnalysisCoordinator.prototype.analyzeWithFallback = function (content, language, filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var error_8, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(language === 'python')) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.analyzeWithPython(content, filePath)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_8 = _a.sent();
                        console.warn("Python parser fallback failed for ".concat(filePath, ":"), error_8);
                        return [3 /*break*/, 4];
                    case 4:
                        if (!this.treeSitterManager.hasParser(language)) return [3 /*break*/, 8];
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.analyzeWithTreeSitter(content, language, filePath)];
                    case 6: return [2 /*return*/, _a.sent()];
                    case 7:
                        error_9 = _a.sent();
                        console.warn("Tree-sitter fallback failed for ".concat(filePath, ":"), error_9);
                        return [3 /*break*/, 8];
                    case 8: 
                    // Ultimate fallback to basic analysis
                    return [2 /*return*/, this.analyzeBasic(content, filePath, language)];
                }
            });
        });
    };
    /**
     * Basic analysis for unsupported languages or when parsers fail
     *
     * @param content - File content
     * @param filePath - File path for context
     * @param language - Detected language
     * @returns Promise that resolves to basic file metrics
     * @private
     */
    AnalysisCoordinator.prototype.analyzeBasic = function (content, filePath, language) {
        return __awaiter(this, void 0, void 0, function () {
            var lines, nonEmptyLines;
            return __generator(this, function (_a) {
                lines = content.split('\n');
                nonEmptyLines = lines.filter(function (line) { return line.trim().length > 0; });
                return [2 /*return*/, {
                        path: filePath,
                        language: language,
                        imports: {},
                        functions: {},
                        classes: {},
                        lines: lines.length,
                        characters: content.length,
                        non_empty_lines: nonEmptyLines.length,
                        avg_line_length: content.length / lines.length,
                    }];
            });
        });
    };
    /**
     * Get analysis statistics for debugging and monitoring
     *
     * @returns Object with coordinator statistics
     */
    AnalysisCoordinator.prototype.getStatistics = function () {
        var _this = this;
        return {
            initialized: this.initialized,
            treeSitterAvailable: this.treeSitterManager.getSupportedLanguages().length > 0,
            supportedLanguages: {
                babel: ['javascript', 'typescript'],
                python: ['python'],
                treeSitter: this.treeSitterManager.getSupportedLanguages(),
                deepAnalysis: this.languageDetector.getSupportedExtensions()
                    .map(function (ext) { return _this.languageDetector.detectByExtension("test".concat(ext)); })
                    .filter(function (lang, index, self) { return lang && _this.languageDetector.supportsDeepAnalysis(lang) && self.indexOf(lang) === index; }),
            },
        };
    };
    return AnalysisCoordinator;
}());
exports.AnalysisCoordinator = AnalysisCoordinator;
