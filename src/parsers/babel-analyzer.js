"use strict";
/**
 * Babel AST Analyzer for JavaScript and TypeScript
 *
 * This module provides deep AST analysis for JavaScript and TypeScript files
 * using the Babel parser. It extracts comprehensive metadata including functions,
 * classes, imports, JSDoc comments, and framework-specific patterns.
 */
/**
 * Babel AST Analyzer for JavaScript and TypeScript
 *
 * This module provides deep AST analysis for JavaScript and TypeScript files
 * using the Babel parser. It extracts comprehensive metadata including functions,
 * classes, imports, JSDoc comments, and framework-specific patterns.
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
exports.BabelAnalyzer = void 0;
var parser_1 = require("@babel/parser");
var t = require("@babel/types");
/**
 * Babel parser configuration for different file types
 */
var PARSER_OPTIONS = {
    javascript: {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        plugins: [
            'jsx',
            'decorators-legacy',
            'classProperties',
            'functionBind',
            'exportDefaultFrom',
            'exportNamespaceFrom',
            'dynamicImport',
            'nullishCoalescingOperator',
            'optionalChaining',
        ],
    },
    typescript: {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        plugins: [
            'typescript',
            'jsx',
            'decorators-legacy',
            'classProperties',
            'functionBind',
            'exportDefaultFrom',
            'exportNamespaceFrom',
            'dynamicImport',
            'nullishCoalescingOperator',
            'optionalChaining',
        ],
    },
};
/**
 * Babel-based analyzer for JavaScript and TypeScript files
 *
 * This class provides comprehensive AST analysis using Babel's robust parser,
 * extracting detailed information about code structure, patterns, and metadata.
 */
var BabelAnalyzer = /** @class */ (function () {
    function BabelAnalyzer() {
    }
    /**
     * Parse and analyze a JavaScript or TypeScript file
     *
     * @param content - Source code content
     * @param language - Programming language ('javascript' or 'typescript')
     * @param filePath - File path for context (used in error messages)
     * @returns Promise that resolves to detailed file analysis
     */
    BabelAnalyzer.prototype.parseJavaScript = function (content_1, language_1) {
        return __awaiter(this, arguments, void 0, function (content, language, filePath) {
            var traverseModule, traverse, parserOptions, ast, analysis_1, jsdocComments_1, error_1;
            var _this = this;
            if (filePath === void 0) { filePath = 'unknown'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('@babel/traverse'); })];
                    case 1:
                        traverseModule = _a.sent();
                        traverse = traverseModule.default || traverseModule;
                        parserOptions = PARSER_OPTIONS[language];
                        ast = (0, parser_1.parse)(content, parserOptions);
                        analysis_1 = {
                            path: filePath,
                            language: language,
                            imports: {},
                            functions: {},
                            classes: {},
                        };
                        jsdocComments_1 = this.extractJSDocComments(ast, content);
                        // Use Babel traverse to walk the AST
                        traverse(ast, {
                            // Import declarations
                            ImportDeclaration: function (path) {
                                _this.processImportDeclaration(path, analysis_1);
                            },
                            // Function declarations
                            FunctionDeclaration: function (path) {
                                _this.processFunctionDeclaration(path, analysis_1, jsdocComments_1);
                            },
                            // Arrow function expressions (assigned to variables)
                            VariableDeclarator: function (path) {
                                _this.processVariableDeclarator(path, analysis_1, jsdocComments_1);
                            },
                            // Class declarations
                            ClassDeclaration: function (path) {
                                _this.processClassDeclaration(path, analysis_1, jsdocComments_1);
                            },
                            // Method definitions (inside classes)
                            ClassMethod: function (path) {
                                _this.processClassMethod(path, analysis_1, jsdocComments_1);
                            },
                            // Export declarations
                            ExportNamedDeclaration: function (path) {
                                _this.processExportDeclaration(path, analysis_1);
                            },
                            ExportDefaultDeclaration: function (path) {
                                _this.processExportDeclaration(path, analysis_1);
                            },
                        });
                        return [2 /*return*/, analysis_1];
                    case 2:
                        error_1 = _a.sent();
                        // Return error analysis if parsing fails
                        return [2 /*return*/, {
                                path: filePath,
                                language: language,
                                imports: {},
                                functions: {},
                                classes: {},
                                error: "Babel parsing failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1))
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
       * Extract JSDoc comments from the AST
       *
       * @param ast - Babel AST
       * @param content - Original source content
       * @returns Map of line numbers to JSDoc content
       * @private
       */
    BabelAnalyzer.prototype.extractJSDocComments = function (ast, content) {
        var _a;
        var jsdocMap = new Map();
        if (!ast.comments) {
            return jsdocMap;
        }
        for (var _i = 0, _b = ast.comments; _i < _b.length; _i++) {
            var comment = _b[_i];
            if (comment.type === 'CommentBlock' && comment.value.startsWith('*')) {
                // This is a JSDoc comment
                var lines = comment.value.split('\n');
                var cleanedLines = [];
                for (var _c = 0, lines_1 = lines; _c < lines_1.length; _c++) {
                    var line = lines_1[_c];
                    // Remove leading whitespace and asterisks
                    line = line.replace(/^\s*\*\s?/, '').trim();
                    if (line.length > 0) {
                        cleanedLines.push(line);
                    }
                }
                var cleanComment = cleanedLines.join('\n').trim();
                if (cleanComment) {
                    // Store by the line where the comment ends (closer to the function)
                    var commentEndLine = ((_a = comment.loc) === null || _a === void 0 ? void 0 : _a.end.line) || 0;
                    jsdocMap.set(commentEndLine, cleanComment);
                }
            }
        }
        return jsdocMap;
    };
    /**
     * Process import declarations
     *
     * @param path - Babel node path for import
     * @param analysis - Analysis result to update
     * @private
     */
    BabelAnalyzer.prototype.processImportDeclaration = function (path, analysis) {
        var importNode = path.node;
        var source = importNode.source.value;
        if (!analysis.imports) {
            analysis.imports = {};
        }
        if (!analysis.imports[source]) {
            analysis.imports[source] = [];
        }
        // Extract imported names
        for (var _i = 0, _a = importNode.specifiers; _i < _a.length; _i++) {
            var specifier = _a[_i];
            if (t.isImportDefaultSpecifier(specifier)) {
                analysis.imports[source].push(specifier.local.name);
            }
            else if (t.isImportSpecifier(specifier)) {
                var importedName = t.isIdentifier(specifier.imported)
                    ? specifier.imported.name
                    : specifier.imported.value;
                analysis.imports[source].push(importedName);
            }
            else if (t.isImportNamespaceSpecifier(specifier)) {
                analysis.imports[source].push("* as ".concat(specifier.local.name));
            }
        }
    };
    /**
     * Process function declarations
     *
     * @param path - Babel node path for function
     * @param analysis - Analysis result to update
     * @param jsdocComments - Map of JSDoc comments
     * @private
     */
    BabelAnalyzer.prototype.processFunctionDeclaration = function (path, analysis, jsdocComments) {
        var _this = this;
        var _a;
        var funcNode = path.node;
        if (!funcNode.id)
            return; // Skip anonymous functions
        var funcName = funcNode.id.name;
        var params = funcNode.params.map(function (param) { return _this.getParamName(param); });
        var funcSignature = "".concat(funcName, "(").concat(params.join(', '), ")");
        // Find associated JSDoc comment
        var funcLine = ((_a = funcNode.loc) === null || _a === void 0 ? void 0 : _a.start.line) || 0;
        var docstring = this.findNearestJSDoc(funcLine, jsdocComments);
        // Check if it's a React component (starts with uppercase)
        var isComponent = funcName[0] === funcName[0].toUpperCase();
        // Check if it's a React hook (starts with 'use')
        var isHook = funcName.startsWith('use');
        var functionInfo = {
            docstring: docstring,
            state_changes: [],
            event_handlers: [],
            api_endpoints: [],
            is_async: funcNode.async || false,
            parameters: params,
            line_number: funcLine,
        };
        if (isComponent) {
            functionInfo.is_component = true;
        }
        if (isHook) {
            functionInfo.is_hook = true;
        }
        if (!analysis.functions) {
            analysis.functions = {};
        }
        analysis.functions[funcSignature] = functionInfo;
    };
    /**
     * Process variable declarators (for arrow functions)
     *
     * @param path - Babel node path for variable declarator
     * @param analysis - Analysis result to update
     * @param jsdocComments - Map of JSDoc comments
     * @private
     */
    BabelAnalyzer.prototype.processVariableDeclarator = function (path, analysis, jsdocComments) {
        var _this = this;
        var _a;
        var declarator = path.node;
        // Check if this is an arrow function
        if (!t.isArrowFunctionExpression(declarator.init) && !t.isFunctionExpression(declarator.init)) {
            return;
        }
        if (!t.isIdentifier(declarator.id)) {
            return;
        }
        var funcName = declarator.id.name;
        var funcNode = declarator.init;
        var params = funcNode.params.map(function (param) { return _this.getParamName(param); });
        var funcSignature = "".concat(funcName, "(").concat(params.join(', '), ")");
        // Find associated JSDoc comment
        var funcLine = ((_a = declarator.loc) === null || _a === void 0 ? void 0 : _a.start.line) || 0;
        var docstring = this.findNearestJSDoc(funcLine, jsdocComments);
        // Check React patterns
        var isComponent = funcName[0] === funcName[0].toUpperCase();
        var isHook = funcName.startsWith('use');
        var functionInfo = {
            docstring: docstring,
            state_changes: [],
            event_handlers: [],
            api_endpoints: [],
            is_async: t.isArrowFunctionExpression(funcNode) ? funcNode.async : funcNode.async,
            parameters: params,
            line_number: funcLine,
        };
        if (isComponent) {
            functionInfo.is_component = true;
        }
        if (isHook) {
            functionInfo.is_hook = true;
        }
        if (!analysis.functions) {
            analysis.functions = {};
        }
        analysis.functions[funcSignature] = functionInfo;
    };
    /**
       * Get parameter name from various parameter types
       *
       * @param param - Function parameter node
       * @returns Parameter name as string
       * @private
       */
    BabelAnalyzer.prototype.getParamName = function (param) {
        if (t.isIdentifier(param)) {
            return param.name;
        }
        else if (t.isObjectPattern(param)) {
            return '{ ... }'; // Simplified destructuring representation
        }
        else if (t.isArrayPattern(param)) {
            return '[ ... ]'; // Simplified array destructuring
        }
        else if (t.isRestElement(param)) {
            return "...".concat(t.isIdentifier(param.argument) ? param.argument.name : 'rest');
        }
        else if (t.isAssignmentPattern(param)) {
            return t.isIdentifier(param.left) ? param.left.name : 'param';
        }
        return 'param';
    };
    /**
       * Find the nearest JSDoc comment before a given line
       *
       * @param line - Line number to search near
       * @param jsdocComments - Map of available JSDoc comments
       * @returns JSDoc content or empty string
       * @private
       */
    BabelAnalyzer.prototype.findNearestJSDoc = function (line, jsdocComments) {
        // Look for JSDoc comment within 3 lines before the function
        for (var i = line - 1; i >= Math.max(1, line - 3); i--) {
            if (jsdocComments.has(i)) {
                return jsdocComments.get(i) || '';
            }
        }
        // Also check the exact line (sometimes comments end on the same line)
        if (jsdocComments.has(line)) {
            return jsdocComments.get(line) || '';
        }
        return '';
    };
    /**
     * Process class declarations
     *
     * @param path - Babel node path for class
     * @param analysis - Analysis result to update
     * @param jsdocComments - Map of JSDoc comments
     * @private
     */
    BabelAnalyzer.prototype.processClassDeclaration = function (path, analysis, jsdocComments) {
        var _a;
        var classNode = path.node;
        if (!classNode.id)
            return;
        var className = classNode.id.name;
        var classLine = ((_a = classNode.loc) === null || _a === void 0 ? void 0 : _a.start.line) || 0;
        var docstring = this.findNearestJSDoc(classLine, jsdocComments);
        // Get base classes
        var baseClasses = [];
        if (classNode.superClass && t.isIdentifier(classNode.superClass)) {
            baseClasses.push(classNode.superClass.name);
        }
        var classInfo = {
            docstring: docstring,
            methods: {},
            base_classes: baseClasses,
            line_number: classLine,
        };
        // Check if it's a React component
        var isComponent = baseClasses.some(function (base) {
            return base.includes('Component') || base.includes('PureComponent');
        }) || className.endsWith('Component');
        if (isComponent) {
            classInfo.is_component = true;
        }
        if (!analysis.classes) {
            analysis.classes = {};
        }
        analysis.classes[className] = classInfo;
    };
    /**
     * Process class methods
     *
     * @param path - Babel node path for class method
     * @param analysis - Analysis result to update
     * @param jsdocComments - Map of JSDoc comments
     * @private
     */
    BabelAnalyzer.prototype.processClassMethod = function (path, analysis, jsdocComments) {
        var _this = this;
        var _a;
        var methodNode = path.node;
        // Find the parent class
        var classPath = path.findParent(function (p) { return t.isClassDeclaration(p.node); });
        if (!classPath || !t.isClassDeclaration(classPath.node) || !classPath.node.id) {
            return;
        }
        var className = classPath.node.id.name;
        var methodName = t.isIdentifier(methodNode.key) ? methodNode.key.name : 'method';
        var params = methodNode.params.map(function (param) { return _this.getParamName(param); });
        var methodSignature = "".concat(methodName, "(").concat(params.join(', '), ")");
        var methodLine = ((_a = methodNode.loc) === null || _a === void 0 ? void 0 : _a.start.line) || 0;
        var docstring = this.findNearestJSDoc(methodLine, jsdocComments);
        var methodInfo = {
            docstring: docstring,
            state_changes: [],
            event_handlers: [],
            api_endpoints: [],
            is_async: methodNode.async || false,
            parameters: params,
            line_number: methodLine,
        };
        // Initialize class if not exists
        if (!analysis.classes) {
            analysis.classes = {};
        }
        if (!analysis.classes[className]) {
            analysis.classes[className] = {
                docstring: '',
                methods: {},
            };
        }
        analysis.classes[className].methods[methodSignature] = methodInfo;
    };
    /**
     * Process export declarations
     *
     * @param path - Babel node path for export
     * @param analysis - Analysis result to update
     * @private
     */
    BabelAnalyzer.prototype.processExportDeclaration = function (path, analysis) {
        // For now, we'll just track that exports exist
        // Could be expanded to track specific export information
        if (!analysis.imports) {
            analysis.imports = {};
        }
        // Mark that this file has exports
        if (!analysis.imports['__exports__']) {
            analysis.imports['__exports__'] = ['default'];
        }
    };
    return BabelAnalyzer;
}());
exports.BabelAnalyzer = BabelAnalyzer;
