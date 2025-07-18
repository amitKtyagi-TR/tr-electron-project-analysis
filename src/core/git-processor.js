"use strict";
/**
 * Git Integration Module
 *
 * This module provides functionality to interact with git repositories,
 * discover tracked files, and validate repository structure.
 *
 * The GitProcessor class handles all git-related operations needed
 * for code analysis, including file discovery and repository validation.
 */
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
exports.GitProcessor = void 0;
var node_child_process_1 = require("node:child_process");
var node_util_1 = require("node:util");
var promises_1 = require("node:fs/promises");
var node_path_1 = require("node:path");
// Promisify execFile for async/await usage
var execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
/**
 * Git repository processor for file discovery and validation
 *
 * This class provides methods to interact with git repositories,
 * including validating repository structure and discovering tracked files.
 */
var GitProcessor = /** @class */ (function () {
    /**
     * Create a new GitProcessor instance
     *
     * @param repoPath - Path to the git repository (can be relative or absolute)
     * @throws {Error} If the repository path is invalid
     */
    function GitProcessor(repoPath) {
        // Convert to absolute path for consistency
        this.repoPath = (0, node_path_1.isAbsolute)(repoPath) ? repoPath : (0, node_path_1.resolve)(repoPath);
        this.gitDir = (0, node_path_1.join)(this.repoPath, '.git');
    }
    GitProcessor.prototype.findGitExecutable = function () {
        return __awaiter(this, void 0, void 0, function () {
            var possiblePaths, _i, possiblePaths_1, gitPath, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        possiblePaths = [
                            'git', // Try PATH first
                            '/usr/bin/git',
                            '/usr/local/bin/git',
                            '/opt/homebrew/bin/git', // macOS with Homebrew
                            'C:\\Program Files\\Git\\bin\\git.exe', // Windows
                        ];
                        _i = 0, possiblePaths_1 = possiblePaths;
                        _b.label = 1;
                    case 1:
                        if (!(_i < possiblePaths_1.length)) return [3 /*break*/, 6];
                        gitPath = possiblePaths_1[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, execFileAsync(gitPath, ['--version'], { timeout: 5000 })];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, gitPath];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: throw new Error('Git executable not found. Please ensure Git is installed.');
                }
            });
        });
    };
    /**
     * Check if the specified directory is a valid git repository
     *
     * @returns Promise that resolves to true if valid git repository
     */
    GitProcessor.prototype.isGitRepository = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, (0, promises_1.access)(this.gitDir)];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, (0, promises_1.stat)(this.gitDir)];
                    case 2:
                        stats = _b.sent();
                        return [2 /*return*/, stats.isDirectory()];
                    case 3:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
       * Get all files tracked by git in the repository
       *
       * @returns Promise that resolves to array of file paths relative to repo root
       * @throws {Error} If not a valid git repository or git command fails
       */
    GitProcessor.prototype.getTrackedFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var isValidRepo, output, allFiles, textFiles, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.isGitRepository()];
                    case 1:
                        isValidRepo = _a.sent();
                        if (!isValidRepo) {
                            throw new Error("Not a valid git repository: ".concat(this.repoPath));
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, this.runGitCommand(['ls-tree', '-r', 'HEAD', '--name-only'])];
                    case 3:
                        output = _a.sent();
                        allFiles = output
                            .split('\n')
                            .map(function (line) { return line.trim(); })
                            .filter(function (line) { return line.length > 0; });
                        return [4 /*yield*/, this.filterBinaryFiles(allFiles)];
                    case 4:
                        textFiles = _a.sent();
                        return [2 /*return*/, textFiles];
                    case 5:
                        error_1 = _a.sent();
                        // Handle case where repository has no commits yet
                        if (error_1 instanceof Error && error_1.message.includes('HEAD')) {
                            return [2 /*return*/, []];
                        }
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute a git command in the repository directory
     *
     * @param args - Arguments to pass to git command
     * @returns Promise that resolves to command stdout
     * @throws {Error} If git command fails
     * @private
     */
    GitProcessor.prototype.runGitCommand = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var gitExecutable, _a, stdout, stderr, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.findGitExecutable()];
                    case 1:
                        gitExecutable = _b.sent();
                        return [4 /*yield*/, execFileAsync(gitExecutable, args, {
                                cwd: this.repoPath,
                                timeout: 30000, // 30 second timeout
                                maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large repositories
                            })];
                    case 2:
                        _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                        // Check for errors in stderr (git sometimes writes warnings to stderr)
                        if (stderr && stderr.trim().length > 0) {
                            console.warn("Git warning: ".concat(stderr.trim()));
                        }
                        return [2 /*return*/, stdout.trim()];
                    case 3:
                        error_2 = _b.sent();
                        if (error_2 instanceof Error) {
                            throw new Error("Git command failed: git ".concat(args.join(' '), "\n").concat(error_2.message));
                        }
                        throw new Error("Git command failed: git ".concat(args.join(' ')));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
       * Check if files are binary using git attributes
       *
       * @param filePaths - Array of file paths to check
       * @returns Promise that resolves to array of non-binary file paths
       * @private
       */
    GitProcessor.prototype.filterBinaryFiles = function (filePaths) {
        return __awaiter(this, void 0, void 0, function () {
            var batchSize, nonBinaryFiles, i, batch, output, lines, _i, lines_1, line, parts, filename, binaryStatus, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (filePaths.length === 0) {
                            return [2 /*return*/, []];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 8, , 9]);
                        batchSize = 100;
                        nonBinaryFiles = [];
                        i = 0;
                        _c.label = 2;
                    case 2:
                        if (!(i < filePaths.length)) return [3 /*break*/, 7];
                        batch = filePaths.slice(i, i + batchSize);
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.runGitCommand(__spreadArray([
                                'check-attr', 'binary', '--'
                            ], batch, true))];
                    case 4:
                        output = _c.sent();
                        lines = output.split('\n').filter(function (line) { return line.trim(); });
                        for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                            line = lines_1[_i];
                            parts = line.split(': binary: ');
                            if (parts.length === 2) {
                                filename = parts[0];
                                binaryStatus = parts[1];
                                // Type guard: ensure filename is defined and not empty
                                if (filename && filename.trim().length > 0) {
                                    // Only include files that are not binary
                                    if (binaryStatus === 'unset' || binaryStatus === 'unspecified') {
                                        nonBinaryFiles.push(filename.trim());
                                    }
                                }
                            }
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        _a = _c.sent();
                        // If git check-attr fails for this batch, include all files
                        // (better to analyze a binary file than miss a text file)
                        nonBinaryFiles.push.apply(nonBinaryFiles, batch);
                        return [3 /*break*/, 6];
                    case 6:
                        i += batchSize;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, nonBinaryFiles];
                    case 8:
                        _b = _c.sent();
                        // If binary detection fails entirely, return all files
                        return [2 /*return*/, filePaths];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the absolute path to the repository
     *
     * @returns Absolute path to repository root
     */
    GitProcessor.prototype.getRepositoryPath = function () {
        return this.repoPath;
    };
    return GitProcessor;
}());
exports.GitProcessor = GitProcessor;
