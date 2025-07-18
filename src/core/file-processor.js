"use strict";
/**
 * File Processing Module
 *
 * This module provides concurrent file reading capabilities with progress tracking,
 * cancellation support, and error handling. It's designed to efficiently process
 * large numbers of files while maintaining memory usage and providing user feedback.
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
exports.FileProcessor = exports.DEFAULT_PROCESSING_OPTIONS = void 0;
var promises_1 = require("node:fs/promises");
var promises_2 = require("node:fs/promises");
var node_path_1 = require("node:path");
var p_limit_1 = require("p-limit");
/**
 * Default processing options
 */
exports.DEFAULT_PROCESSING_OPTIONS = {
    concurrencyLimit: 10,
    maxFileSize: 1024 * 1024, // 1MB
    encoding: 'utf8',
};
/**
 * File processor with concurrent reading capabilities
 *
 * This class handles reading multiple files concurrently while respecting
 * system limits and providing progress feedback to the user.
 */
var FileProcessor = /** @class */ (function () {
    /**
     * Create a new FileProcessor
     *
     * @param repositoryPath - Absolute path to the repository root
     */
    function FileProcessor(repositoryPath) {
        this.completedCount = 0;
        this.totalCount = 0;
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
    FileProcessor.prototype.processFiles = function (filePaths_1, processor_1) {
        return __awaiter(this, arguments, void 0, function (filePaths, processor, options) {
            var config, limit, results, processingPromises;
            var _this = this;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = __assign(__assign({}, exports.DEFAULT_PROCESSING_OPTIONS), options);
                        // Initialize progress tracking
                        this.completedCount = 0;
                        this.totalCount = filePaths.length;
                        limit = (0, p_limit_1.default)(config.concurrencyLimit);
                        results = new Map();
                        // Check for cancellation before starting
                        this.checkCancellation(config.signal);
                        processingPromises = filePaths.map(function (filePath) {
                            return limit(function () { return __awaiter(_this, void 0, void 0, function () {
                                var fileResult, error, analysisResult, error_1, processError;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 5, , 6]);
                                            // Check for cancellation
                                            this.checkCancellation(config.signal);
                                            return [4 /*yield*/, this.readFile(filePath, config)];
                                        case 1:
                                            fileResult = _a.sent();
                                            if (!fileResult.error) return [3 /*break*/, 2];
                                            error = new Error(fileResult.error.message);
                                            error.name = fileResult.error.type;
                                            results.set(filePath, error);
                                            return [3 /*break*/, 4];
                                        case 2: return [4 /*yield*/, processor(fileResult.content, filePath)];
                                        case 3:
                                            analysisResult = _a.sent();
                                            results.set(filePath, analysisResult);
                                            _a.label = 4;
                                        case 4:
                                            // Update progress
                                            this.updateProgress(config.onProgress, filePath);
                                            return [3 /*break*/, 6];
                                        case 5:
                                            error_1 = _a.sent();
                                            processError = error_1 instanceof Error ? error_1 : new Error(String(error_1));
                                            results.set(filePath, processError);
                                            // Still update progress on error
                                            this.updateProgress(config.onProgress, filePath);
                                            return [3 /*break*/, 6];
                                        case 6: return [2 /*return*/];
                                    }
                                });
                            }); });
                        });
                        // Wait for all processing to complete
                        return [4 /*yield*/, Promise.all(processingPromises)];
                    case 1:
                        // Wait for all processing to complete
                        _a.sent();
                        return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Read a single file with size and encoding validation
     *
     * @param filePath - Path to file relative to repository root
     * @param options - Processing options
     * @returns File processing result
     * @private
     */
    FileProcessor.prototype.readFile = function (filePath, options) {
        return __awaiter(this, void 0, void 0, function () {
            var fullPath, stats, content, error_2, errorType, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fullPath = (0, node_path_1.join)(this.repositoryPath, filePath);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, (0, promises_2.stat)(fullPath)];
                    case 2:
                        stats = _a.sent();
                        if (stats.size > options.maxFileSize) {
                            return [2 /*return*/, {
                                    filePath: filePath,
                                    fileSize: stats.size,
                                    error: {
                                        type: 'file_too_large',
                                        message: "File size ".concat(stats.size, " bytes exceeds limit of ").concat(options.maxFileSize, " bytes")
                                    }
                                }];
                        }
                        return [4 /*yield*/, (0, promises_1.readFile)(fullPath, { encoding: options.encoding })];
                    case 3:
                        content = _a.sent();
                        return [2 /*return*/, {
                                filePath: filePath,
                                content: content,
                                fileSize: stats.size,
                            }];
                    case 4:
                        error_2 = _a.sent();
                        errorType = 'unknown';
                        errorMessage = 'Unknown error occurred';
                        if (error_2 instanceof Error) {
                            errorMessage = error_2.message;
                            if (error_2.message.includes('ENOENT')) {
                                errorType = 'not_found';
                            }
                            else if (error_2.message.includes('EACCES') || error_2.message.includes('EPERM')) {
                                errorType = 'permission_error';
                            }
                            else if (error_2.message.includes('encoding')) {
                                errorType = 'encoding_error';
                            }
                        }
                        return [2 /*return*/, {
                                filePath: filePath,
                                error: {
                                    type: errorType,
                                    message: errorMessage
                                }
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update progress and call progress callback
     *
     * @param onProgress - Progress callback function
     * @param currentFile - Currently processed file
     * @private
     */
    FileProcessor.prototype.updateProgress = function (onProgress, currentFile) {
        this.completedCount++;
        if (onProgress) {
            onProgress(this.completedCount, this.totalCount, currentFile);
        }
    };
    /**
     * Check if operation should be cancelled
     *
     * @param signal - AbortSignal to check
     * @throws {Error} If operation is cancelled
     * @private
     */
    FileProcessor.prototype.checkCancellation = function (signal) {
        if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
            throw new Error('File processing was cancelled');
        }
    };
    /**
     * Get the repository path
     *
     * @returns Absolute path to repository
     */
    FileProcessor.prototype.getRepositoryPath = function () {
        return this.repositoryPath;
    };
    return FileProcessor;
}());
exports.FileProcessor = FileProcessor;
