"use strict";
/**
 * Tree-sitter WebAssembly Manager
 *
 * This module manages Tree-sitter parsers for multiple programming languages.
 * It handles loading WASM parsers, parsing source code, and executing queries
 * to extract specific patterns from the syntax trees.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeSitterManager = void 0;
var web_tree_sitter_1 = require("web-tree-sitter");
var promises_1 = require("node:fs/promises");
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
// Get current directory for WASM file paths
var __dirname = (0, node_url_1.fileURLToPath)(new URL('.', import.meta.url));
var wasmDir = (0, node_path_1.join)(__dirname, 'wasm');
/**
 * Tree-sitter language configurations
 */
var LANGUAGE_CONFIGS = {
    javascript: {
        wasmFile: 'tree-sitter-javascript.wasm',
        language: 'javascript',
        extensions: ['.js', '.jsx', '.mjs']
    },
    typescript: {
        wasmFile: 'tree-sitter-typescript.wasm',
        language: 'typescript',
        extensions: ['.ts', '.tsx']
    },
    python: {
        wasmFile: 'tree-sitter-python.wasm',
        language: 'python',
        extensions: ['.py', '.pyw']
    },
    dart: {
        wasmFile: 'tree-sitter-dart.wasm',
        language: 'dart',
        extensions: ['.dart']
    }
};
/**
 * Tree-sitter WebAssembly manager
 *
 * This class handles loading and managing Tree-sitter parsers for multiple languages.
 * It provides a unified interface for parsing code and executing queries.
 */
var TreeSitterManager = /** @class */ (function () {
    function TreeSitterManager() {
        this.parsers = new Map();
        this.languages = new Map();
        this.initialized = false;
    }
    /**
     * Initialize Tree-sitter and load all language parsers
     *
     * @returns Promise that resolves when initialization is complete
     * @throws {Error} If initialization fails
     */
    TreeSitterManager.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var treeSitterInitialized, coreWasmPath_1, wasmBuffer, error_1, _i, _a, _b, langKey, config, error_2, error_3;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (this.initialized) {
                            return [2 /*return*/];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 14, , 15]);
                        console.log('🌳 Initializing Tree-sitter WebAssembly...');
                        treeSitterInitialized = false;
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 6, , 7]);
                        coreWasmPath_1 = (0, node_path_1.join)(wasmDir, 'tree-sitter.wasm');
                        return [4 /*yield*/, (0, promises_1.readFile)(coreWasmPath_1)];
                    case 3:
                        wasmBuffer = _c.sent();
                        if (!(wasmBuffer.length > 100 && wasmBuffer[0] === 0x00)) return [3 /*break*/, 5];
                        return [4 /*yield*/, web_tree_sitter_1.default.init({
                                locateFile: function () { return coreWasmPath_1; },
                            })];
                    case 4:
                        _c.sent();
                        treeSitterInitialized = true;
                        console.log('✅ Initialized with core WASM file');
                        _c.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_1 = _c.sent();
                        return [3 /*break*/, 7];
                    case 7:
                        if (!treeSitterInitialized) {
                            console.warn('⚠️  Using development mode - Tree-sitter parsers not available');
                            console.warn('   Real WASM files needed for production use');
                            // Don't try to load any parsers in development mode
                            this.initialized = true;
                            return [2 /*return*/];
                        }
                        _i = 0, _a = Object.entries(LANGUAGE_CONFIGS);
                        _c.label = 8;
                    case 8:
                        if (!(_i < _a.length)) return [3 /*break*/, 13];
                        _b = _a[_i], langKey = _b[0], config = _b[1];
                        _c.label = 9;
                    case 9:
                        _c.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, this.loadParser(config.language)];
                    case 10:
                        _c.sent();
                        console.log("\u2705 Loaded ".concat(langKey, " parser"));
                        return [3 /*break*/, 12];
                    case 11:
                        error_2 = _c.sent();
                        console.warn("\u26A0\uFE0F  Failed to load ".concat(langKey, " parser:"), error_2);
                        return [3 /*break*/, 12];
                    case 12:
                        _i++;
                        return [3 /*break*/, 8];
                    case 13:
                        this.initialized = true;
                        console.log("\uD83C\uDF89 Tree-sitter initialization complete with ".concat(this.parsers.size, " parsers"));
                        return [3 /*break*/, 15];
                    case 14:
                        error_3 = _c.sent();
                        // In development mode, just mark as initialized even if no parsers loaded
                        console.warn('⚠️  Tree-sitter initialization failed, running in development mode');
                        this.initialized = true;
                        return [3 /*break*/, 15];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Parse source code using the appropriate language parser
     *
     * @param content - Source code content
     * @param language - Programming language
     * @returns Promise that resolves to syntax tree
     * @throws {Error} If parsing fails or language not supported
     */
    TreeSitterManager.prototype.parseFile = function (content, language) {
        return __awaiter(this, void 0, void 0, function () {
            var parser, tree;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.initialized) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.initialize()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        parser = this.parsers.get(language);
                        if (!parser) {
                            throw new Error("No parser available for language: ".concat(language));
                        }
                        try {
                            tree = parser.parse(content);
                            if (!tree) {
                                throw new Error("Failed to parse ".concat(language, " content"));
                            }
                            return [2 /*return*/, tree];
                        }
                        catch (error) {
                            throw new Error("Parsing failed for ".concat(language, ": ").concat(error));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
   * Execute a Tree-sitter query on a syntax tree
   *
   * @param tree - Syntax tree from parseFile
   * @param queryString - Tree-sitter query string
   * @param language - Programming language (for language-specific queries)
   * @returns Array of query capture results
   */
    TreeSitterManager.prototype.query = function (tree, queryString, language) {
        var languageObj = this.languages.get(language);
        if (!languageObj) {
            throw new Error("Language object not found for: ".concat(language));
        }
        try {
            var query = languageObj.query(queryString);
            var captures = query.captures(tree.rootNode);
            // Type the capture parameter explicitly
            return captures.map(function (capture) {
                var _a;
                return ({
                    name: capture.name,
                    node: capture.node,
                    text: ((_a = capture.node) === null || _a === void 0 ? void 0 : _a.text) || ''
                });
            });
        }
        catch (error) {
            throw new Error("Query execution failed: ".concat(error));
        }
    };
    /**
     * Check if a language parser is available
     *
     * @param language - Programming language to check
     * @returns True if parser is loaded and available
     */
    TreeSitterManager.prototype.hasParser = function (language) {
        return this.parsers.has(language) && this.languages.has(language);
    };
    /**
     * Get list of supported languages
     *
     * @returns Array of supported language identifiers
     */
    TreeSitterManager.prototype.getSupportedLanguages = function () {
        return Array.from(this.parsers.keys());
    };
    /**
     * Load a specific language parser
     *
     * @param language - Language to load
     * @throws {Error} If parser loading fails
     * @private
     */
    TreeSitterManager.prototype.loadParser = function (language) {
        return __awaiter(this, void 0, void 0, function () {
            var config, ParserClass, parser, wasmPath, Language, wasmError_1, mockParser, mockLanguage, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = Object.values(LANGUAGE_CONFIGS).find(function (c) { return c.language === language; });
                        if (!config) {
                            throw new Error("No configuration found for language: ".concat(language));
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        ParserClass = web_tree_sitter_1.default.default || web_tree_sitter_1.default;
                        parser = new ParserClass();
                        wasmPath = (0, node_path_1.join)(wasmDir, config.wasmFile);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, web_tree_sitter_1.default.Language.load(wasmPath)];
                    case 3:
                        Language = _a.sent();
                        parser.setLanguage(Language);
                        this.parsers.set(language, parser);
                        this.languages.set(language, Language);
                        return [3 /*break*/, 5];
                    case 4:
                        wasmError_1 = _a.sent();
                        // For development, create a mock parser
                        console.warn("Could not load ".concat(config.wasmFile, ", creating mock parser"));
                        mockParser = {
                            parse: function (content) { return ({
                                rootNode: {
                                    text: content,
                                    type: 'program',
                                    children: []
                                }
                            }); }
                        };
                        mockLanguage = {
                            query: function (queryString) { return ({
                                captures: function (node) { return []; }
                            }); }
                        };
                        this.parsers.set(language, mockParser);
                        this.languages.set(language, mockLanguage);
                        return [3 /*break*/, 5];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_4 = _a.sent();
                        throw new Error("Failed to load parser for ".concat(language, ": ").concat(error_4));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return TreeSitterManager;
}());
exports.TreeSitterManager = TreeSitterManager;
