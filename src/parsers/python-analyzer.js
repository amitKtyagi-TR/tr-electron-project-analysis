"use strict";
/**
 * Python Regex-Based Analyzer
 *
 * This module provides comprehensive Python code analysis using regex patterns.
 * It extracts functions, classes, imports, docstrings, and Django-specific patterns
 * including views, models, serializers, and decorators.
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
exports.PythonAnalyzer = void 0;
/**
 * Python regex patterns for code analysis
 */
var PYTHON_PATTERNS = {
    // Import patterns - improved to handle multi-line imports
    IMPORT: /^(?:\s*)import\s+(.+)$/gm,
    FROM_IMPORT: /^(?:\s*)from\s+(\S+)\s+import\s+((?:\s*\([^)]*\)|[^()]+))$/gms,
    // Function patterns
    FUNCTION_DEF: /^(\s*)def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*[^:]+)?\s*:(.*)$/gm,
    ASYNC_FUNCTION_DEF: /^(\s*)async\s+def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*[^:]+)?\s*:(.*)$/gm,
    // Class patterns
    CLASS_DEF: /^(\s*)class\s+(\w+)(?:\s*\(([^)]*)\))?\s*:(.*)$/gm,
    // Decorator patterns - improved to handle arguments
    DECORATOR: /^(\s*)@(\w+(?:\.\w+)?)(?:\s*\([^)]*\))?\s*$/gm,
    // Django specific patterns
    DJANGO_VIEW_CLASS: /class\s+(\w+)\s*\(\s*(?:.*(?:APIView|GenericAPIView|ListAPIView|CreateAPIView|RetrieveAPIView|UpdateAPIView|DestroyAPIView|ViewSet|ModelViewSet).*)\s*\)/g,
    DJANGO_MODEL_CLASS: /class\s+(\w+)\s*\(\s*(?:.*Model.*)\s*\)/g,
    DJANGO_SERIALIZER_CLASS: /class\s+(\w+)\s*\(\s*(?:.*Serializer.*)\s*\)/g,
    // API endpoint patterns
    API_VIEW_DECORATOR: /@api_view\s*\(\s*\[([^\]]+)\]\s*\)/g,
    EXTEND_SCHEMA: /@extend_schema\s*\(/g,
    // HTTP method patterns in classes
    HTTP_METHODS: /def\s+(get|post|put|patch|delete|head|options)\s*\(/gi,
};
/**
 * Python code analyzer using regex patterns
 *
 * This class provides comprehensive analysis of Python code, with special
 * support for Django patterns, REST API endpoints, and Python-specific constructs.
 */
var PythonAnalyzer = /** @class */ (function () {
    function PythonAnalyzer() {
    }
    /**
     * Analyze a Python file using regex patterns
     *
     * @param content - Python source code content
     * @param filePath - File path for context (used in error messages)
     * @returns Promise that resolves to detailed file analysis
     */
    PythonAnalyzer.prototype.analyzePython = function (content_1) {
        return __awaiter(this, arguments, void 0, function (content, filePath) {
            var analysis, lines;
            if (filePath === void 0) { filePath = 'unknown'; }
            return __generator(this, function (_a) {
                try {
                    analysis = {
                        path: filePath,
                        language: 'python',
                        imports: {},
                        functions: {},
                        classes: {},
                    };
                    lines = content.split('\n');
                    // Extract all components
                    this.extractImports(content, analysis);
                    this.extractFunctions(content, lines, analysis);
                    this.extractClasses(content, lines, analysis);
                    // Add basic metrics
                    analysis.lines = lines.length;
                    analysis.characters = content.length;
                    analysis.non_empty_lines = lines.filter(function (line) { return line.trim().length > 0; }).length;
                    analysis.avg_line_length = content.length / lines.length;
                    return [2 /*return*/, analysis];
                }
                catch (error) {
                    // Return error analysis if parsing fails
                    return [2 /*return*/, {
                            path: filePath,
                            language: 'python',
                            imports: {},
                            functions: {},
                            classes: {},
                            error: "Python analysis failed: ".concat(error instanceof Error ? error.message : String(error))
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
       * Extract import statements from Python code
       *
       * @param content - Source code content
       * @param analysis - Analysis result to update
       * @private
       */
    PythonAnalyzer.prototype.extractImports = function (content, analysis) {
        analysis.imports = {};
        // Clean content to handle multi-line imports properly
        var cleanContent = content.replace(/\\\n\s*/g, ' '); // Handle line continuations
        var lines = cleanContent.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var currentLine = lines[i];
            if (!currentLine)
                continue;
            var line = currentLine.trim();
            if (!line || line.startsWith('#'))
                continue;
            // Handle multi-line imports with parentheses
            if ((line.startsWith('from ') && line.includes('import')) || line.startsWith('import ')) {
                // Check if this import spans multiple lines
                if (line.includes('(') && !line.includes(')')) {
                    // Multi-line import - collect all lines until closing parenthesis
                    var fullImport = line;
                    var j = i + 1;
                    while (j < lines.length && !fullImport.includes(')')) {
                        var nextLine = lines[j];
                        if (nextLine) {
                            fullImport += ' ' + nextLine.trim();
                        }
                        j++;
                    }
                    line = fullImport;
                    i = j - 1; // Skip processed lines
                }
                this.parseImportLine(line, analysis);
            }
        }
    };
    /**
     * Parse a single import line (which may be multi-line)
     *
     * @param importLine - Complete import statement
     * @param analysis - Analysis result to update
     * @private
     */
    PythonAnalyzer.prototype.parseImportLine = function (importLine, analysis) {
        var _a;
        var _b;
        // Ensure imports object exists
        if (!analysis.imports) {
            analysis.imports = {};
        }
        // Remove extra whitespace and parentheses
        var cleanLine = importLine.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
        if (cleanLine.startsWith('from ')) {
            // from module import items
            var fromMatch = cleanLine.match(/from\s+(\S+)\s+import\s+(.+)/);
            if (fromMatch && fromMatch[1] && fromMatch[2]) {
                var module_1 = fromMatch[1];
                var importItems = fromMatch[2]
                    .split(',')
                    .map(function (item) { return item.trim(); })
                    .filter(function (item) { return item.length > 0 && item !== 'import'; }); // Filter out artifacts
                if (!analysis.imports[module_1]) {
                    analysis.imports[module_1] = [];
                }
                (_a = analysis.imports[module_1]).push.apply(_a, importItems);
            }
        }
        else if (cleanLine.startsWith('import ')) {
            // import module
            var importMatch = cleanLine.match(/import\s+(.+)/);
            if (importMatch && importMatch[1]) {
                var modules = importMatch[1]
                    .split(',')
                    .map(function (item) { return item.trim(); })
                    .filter(function (item) { return item.length > 0; });
                for (var _i = 0, modules_1 = modules; _i < modules_1.length; _i++) {
                    var module_2 = modules_1[_i];
                    var moduleName = (_b = module_2.split(' as ')[0]) === null || _b === void 0 ? void 0 : _b.trim();
                    if (moduleName) {
                        if (!analysis.imports[moduleName]) {
                            analysis.imports[moduleName] = [];
                        }
                        analysis.imports[moduleName].push(module_2);
                    }
                }
            }
        }
    };
    /**
       * Get accurate line number for a matched string in the source
       *
       * @param content - Full source content
       * @param matchedString - String that was matched
       * @returns Line number (1-based)
       * @private
       */
    PythonAnalyzer.prototype.getLineNumberAccurate = function (content, matchedString) {
        var beforeMatch = content.substring(0, content.indexOf(matchedString));
        return beforeMatch.split('\n').length;
    };
    /**
       * Extract function definitions from Python code
       *
       * @param content - Source code content
       * @param lines - Source code split into lines
       * @param analysis - Analysis result to update
       * @private
       */
    PythonAnalyzer.prototype.extractFunctions = function (content, lines, analysis) {
        analysis.functions = {};
        // Find all function definitions
        var functionMatches = __spreadArray(__spreadArray([], content.matchAll(PYTHON_PATTERNS.FUNCTION_DEF), true), content.matchAll(PYTHON_PATTERNS.ASYNC_FUNCTION_DEF), true);
        for (var _i = 0, functionMatches_1 = functionMatches; _i < functionMatches_1.length; _i++) {
            var match = functionMatches_1[_i];
            var fullMatch = match[0];
            var functionName = match[2];
            var params = match[3] || '';
            if (!fullMatch || !functionName)
                continue;
            var isAsync = fullMatch.includes('async def');
            // Calculate line number more accurately
            var lineNumber = this.getLineNumberAccurate(content, fullMatch);
            // Parse parameters
            var parameters = this.parseParameters(params);
            // Create function signature
            var funcSignature = "".concat(functionName, "(").concat(parameters.join(', '), ")");
            // Find decorators before this function using the accurate line number
            var decorators = this.findDecoratorsBeforeFunction(lines, lineNumber);
            // Find docstring after function definition
            var docstring = this.findFunctionDocstring(lines, lineNumber);
            // Create function info with proper typing
            var functionInfo = {
                docstring: docstring,
                state_changes: [],
                event_handlers: [],
                api_endpoints: [],
                is_async: isAsync,
                parameters: parameters,
                line_number: lineNumber,
            };
            // Add decorators if found
            if (decorators.length > 0) {
                functionInfo.decorators = decorators.map(function (name) { return ({ name: name }); });
            }
            // Check for Django patterns and add API endpoints
            var apiEndpoints = this.extractAPIEndpoints(decorators, functionName, lineNumber);
            if (apiEndpoints.length > 0) {
                functionInfo.api_endpoints = apiEndpoints;
            }
            analysis.functions[funcSignature] = functionInfo;
        }
    };
    /**
     * Extract class definitions from Python code
     *
     * @param content - Source code content
     * @param lines - Source code split into lines
     * @param analysis - Analysis result to update
     * @private
     */
    PythonAnalyzer.prototype.extractClasses = function (content, lines, analysis) {
        analysis.classes = {};
        var classMatches = content.matchAll(PYTHON_PATTERNS.CLASS_DEF);
        for (var _i = 0, classMatches_1 = classMatches; _i < classMatches_1.length; _i++) {
            var match = classMatches_1[_i];
            var fullMatch = match[0];
            var className = match[2];
            var inheritance = match[3] || '';
            if (!fullMatch || !className)
                continue;
            // Calculate line number
            var lineNumber = this.getLineNumber(lines, fullMatch);
            // Parse base classes
            var baseClasses = this.parseBaseClasses(inheritance);
            // Find class docstring
            var docstring = this.findClassDocstring(lines, lineNumber);
            // Find decorators before this class
            var decoratorNames = this.findDecoratorsBeforeClass(lines, lineNumber);
            // Extract class methods
            var methods = this.extractClassMethods(content, lines, className, lineNumber);
            var classInfo = {
                docstring: docstring,
                methods: methods,
                base_classes: baseClasses,
                line_number: lineNumber,
            };
            // Add decorators if found
            if (decoratorNames.length > 0) {
                classInfo.decorators = decoratorNames.map(function (name) { return ({ name: name }); });
            }
            // Check for Django patterns - using is_component as a general marker
            if (this.isDjangoModel(baseClasses) ||
                this.isDjangoSerializer(baseClasses) ||
                this.isDjangoViewClass(baseClasses)) {
                classInfo.is_component = true;
            }
            analysis.classes[className] = classInfo;
        }
    };
    /**
     * Parse function parameters from parameter string
     *
     * @param paramString - Function parameter string
     * @returns Array of parameter names
     * @private
     */
    PythonAnalyzer.prototype.parseParameters = function (paramString) {
        if (!paramString.trim()) {
            return [];
        }
        return paramString
            .split(',')
            .map(function (param) { return param.trim(); })
            .map(function (param) {
            // Handle default values
            var defaultMatch = param.match(/^([^=]+)/);
            return defaultMatch && defaultMatch[1] ? defaultMatch[1].trim() : param;
        })
            .filter(function (param) { return param.length > 0; });
    };
    /**
     * Parse base classes from inheritance string
     *
     * @param inheritanceString - Class inheritance string
     * @returns Array of base class names
     * @private
     */
    PythonAnalyzer.prototype.parseBaseClasses = function (inheritanceString) {
        if (!inheritanceString.trim()) {
            return [];
        }
        return inheritanceString
            .split(',')
            .map(function (cls) { return cls.trim(); })
            .filter(function (cls) { return cls.length > 0; });
    };
    /**
       * Find decorators before a function
       *
       * @param lines - Source code lines
       * @param functionLineNumber - Line number of the function
       * @returns Array of decorator names
       * @private
       */
    PythonAnalyzer.prototype.findDecoratorsBeforeFunction = function (lines, functionLineNumber) {
        var decorators = [];
        // Look backwards from function line to find decorators
        // Start from the line before the function definition
        for (var i = functionLineNumber - 2; i >= 0; i--) {
            var line = lines[i];
            if (!line)
                continue;
            var trimmedLine = line.trim();
            if (trimmedLine.startsWith('@')) {
                // Extract decorator name, handling both simple and complex forms
                var decoratorMatch = trimmedLine.match(/@(\w+(?:\.\w+)?)/);
                if (decoratorMatch && decoratorMatch[1]) {
                    decorators.unshift(decoratorMatch[1]); // Add to beginning to maintain order
                }
            }
            else if (trimmedLine) {
                // Check if this is a continuation of a multi-line decorator
                var isMultiLineDecorator = trimmedLine.endsWith(',') ||
                    trimmedLine.endsWith('(') ||
                    trimmedLine.includes('=') ||
                    trimmedLine.startsWith('(') ||
                    trimmedLine.startsWith(')') ||
                    trimmedLine.match(/^\s*[\w\[\]"',:=\s]+[,\)]?\s*$/);
                if (!isMultiLineDecorator && !trimmedLine.startsWith('#')) {
                    // Non-decorator, non-comment, non-continuation line - stop looking
                    break;
                }
            }
        }
        return decorators;
    };
    /**
     * Find decorators before a class
     *
     * @param lines - Source code lines
     * @param classLineNumber - Line number of the class
     * @returns Array of decorator names
     * @private
     */
    PythonAnalyzer.prototype.findDecoratorsBeforeClass = function (lines, classLineNumber) {
        var decorators = [];
        // Look backwards from class line to find decorators
        for (var i = classLineNumber - 2; i >= 0; i--) {
            var line = lines[i];
            if (!line)
                continue;
            var trimmedLine = line.trim();
            if (trimmedLine.startsWith('@')) {
                var decoratorMatch = trimmedLine.match(/@(\w+(?:\.\w+)?)/);
                if (decoratorMatch && decoratorMatch[1]) {
                    decorators.unshift(decoratorMatch[1]);
                }
            }
            else if (trimmedLine && !trimmedLine.startsWith('#')) {
                break;
            }
        }
        return decorators;
    };
    /**
     * Find docstring for a function
     *
     * @param lines - Source code lines
     * @param functionLineNumber - Line number of the function
     * @returns Docstring content or empty string
     * @private
     */
    PythonAnalyzer.prototype.findFunctionDocstring = function (lines, functionLineNumber) {
        // Look for docstring in the next few lines after function definition
        for (var i = functionLineNumber; i < Math.min(lines.length, functionLineNumber + 5); i++) {
            var line = lines[i];
            if (!line)
                continue;
            var trimmedLine = line.trim();
            if (trimmedLine.startsWith('"""') || trimmedLine.startsWith("'''")) {
                return this.extractDocstring(lines, i);
            }
        }
        return '';
    };
    /**
     * Find docstring for a class
     *
     * @param lines - Source code lines
     * @param classLineNumber - Line number of the class
     * @returns Docstring content or empty string
     * @private
     */
    PythonAnalyzer.prototype.findClassDocstring = function (lines, classLineNumber) {
        // Look for docstring in the next few lines after class definition
        for (var i = classLineNumber; i < Math.min(lines.length, classLineNumber + 5); i++) {
            var line = lines[i];
            if (!line)
                continue;
            var trimmedLine = line.trim();
            if (trimmedLine.startsWith('"""') || trimmedLine.startsWith("'''")) {
                return this.extractDocstring(lines, i);
            }
        }
        return '';
    };
    /**
     * Extract docstring content from lines
     *
     * @param lines - Source code lines
     * @param startLine - Line where docstring starts
     * @returns Docstring content
     * @private
     */
    PythonAnalyzer.prototype.extractDocstring = function (lines, startLine) {
        var line = lines[startLine];
        if (!line)
            return '';
        var startQuote = line.includes('"""') ? '"""' : "'''";
        var docstring = '';
        var inDocstring = true;
        // Handle single-line docstring
        var singleLineMatch = line.match(new RegExp("".concat(startQuote, "(.*)").concat(startQuote)));
        if (singleLineMatch && singleLineMatch[1] !== undefined) {
            return singleLineMatch[1].trim();
        }
        // Multi-line docstring
        var startIndex = line.indexOf(startQuote);
        if (startIndex !== -1) {
            var firstLineContent = line.substring(startIndex + 3);
            if (firstLineContent.trim()) {
                docstring = firstLineContent.trim() + '\n';
            }
        }
        for (var i = startLine + 1; i < lines.length && inDocstring; i++) {
            var currentLine = lines[i];
            if (!currentLine)
                continue;
            if (currentLine.includes(startQuote)) {
                // End of docstring
                var endIndex = currentLine.indexOf(startQuote);
                var endContent = currentLine.substring(0, endIndex);
                if (endContent.trim()) {
                    docstring += endContent.trim();
                }
                inDocstring = false;
            }
            else {
                docstring += currentLine.trim() + '\n';
            }
        }
        return docstring.trim();
    };
    /**
     * Extract methods from a class
     *
     * @param content - Source code content
     * @param lines - Source code lines
     * @param className - Name of the class
     * @param classLineNumber - Line number where class starts
     * @returns Object mapping method signatures to method info
     * @private
     */
    PythonAnalyzer.prototype.extractClassMethods = function (content, lines, className, classLineNumber) {
        var methods = {};
        var classEndLine = this.findClassEndLine(lines, classLineNumber);
        // Find all method definitions within the class
        var methodMatches = __spreadArray(__spreadArray([], content.matchAll(PYTHON_PATTERNS.FUNCTION_DEF), true), content.matchAll(PYTHON_PATTERNS.ASYNC_FUNCTION_DEF), true);
        for (var _i = 0, methodMatches_1 = methodMatches; _i < methodMatches_1.length; _i++) {
            var match = methodMatches_1[_i];
            var fullMatch = match[0];
            var methodName = match[2];
            var params = match[3] || '';
            if (!fullMatch || !methodName)
                continue;
            var methodLineNumber = this.getLineNumber(lines, fullMatch);
            // Check if this method is within our class bounds
            if (methodLineNumber > classLineNumber && methodLineNumber < classEndLine) {
                var isAsync = fullMatch.includes('async def');
                // Parse parameters
                var parameters = this.parseParameters(params);
                // Create method signature
                var methodSignature = "".concat(methodName, "(").concat(parameters.join(', '), ")");
                // Find decorators and docstring
                var decoratorNames = this.findDecoratorsBeforeFunction(lines, methodLineNumber);
                var docstring = this.findFunctionDocstring(lines, methodLineNumber);
                var methodInfo = {
                    docstring: docstring,
                    state_changes: [],
                    event_handlers: [],
                    api_endpoints: [],
                    is_async: isAsync,
                    parameters: parameters,
                    line_number: methodLineNumber,
                };
                // Add decorators if found
                if (decoratorNames.length > 0) {
                    methodInfo.decorators = decoratorNames.map(function (name) { return ({ name: name }); });
                }
                // Check for Django patterns and add API endpoints
                var apiEndpoints = this.extractAPIEndpoints(decoratorNames, methodName, methodLineNumber);
                if (apiEndpoints.length > 0) {
                    methodInfo.api_endpoints = apiEndpoints;
                }
                methods[methodSignature] = methodInfo;
            }
        }
        return methods;
    };
    /**
     * Find the end line of a class definition
     *
     * @param lines - Source code lines
     * @param classLineNumber - Line number where class starts
     * @returns Line number where class ends
     * @private
     */
    PythonAnalyzer.prototype.findClassEndLine = function (lines, classLineNumber) {
        var classLine = lines[classLineNumber - 1]; // Convert to 0-based index
        if (!classLine)
            return lines.length;
        var classIndentMatch = classLine.match(/^(\s*)/);
        var classIndent = classIndentMatch && classIndentMatch[1] ? classIndentMatch[1].length : 0;
        // Find the next line with same or less indentation (end of class)
        for (var i = classLineNumber; i < lines.length; i++) {
            var line = lines[i];
            if (!line)
                continue;
            if (line.trim()) { // Non-empty line
                var lineIndentMatch = line.match(/^(\s*)/);
                var lineIndent = lineIndentMatch && lineIndentMatch[1] ? lineIndentMatch[1].length : 0;
                if (lineIndent <= classIndent) {
                    return i + 1; // Convert back to 1-based line numbers
                }
            }
        }
        return lines.length;
    };
    /**
     * Get line number for a matched string in the source
     *
     * @param lines - Source code lines
     * @param matchedString - String that was matched
     * @returns Line number (1-based)
     * @private
     */
    PythonAnalyzer.prototype.getLineNumber = function (lines, matchedString) {
        var searchString = matchedString.trim();
        var firstLine = searchString.split('\n')[0];
        if (!firstLine)
            return 1;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line && (line.trim() === searchString || line.includes(firstLine))) {
                return i + 1; // Convert to 1-based line numbers
            }
        }
        return 1; // Default to line 1 if not found
    };
    /**
     * Check if class is a Django model
     *
     * @param baseClasses - Array of base class names
     * @returns True if this is a Django model
     * @private
     */
    PythonAnalyzer.prototype.isDjangoModel = function (baseClasses) {
        return baseClasses.some(function (cls) { return cls.includes('Model'); });
    };
    /**
     * Check if class is a Django serializer
     *
     * @param baseClasses - Array of base class names
     * @returns True if this is a Django serializer
     * @private
     */
    PythonAnalyzer.prototype.isDjangoSerializer = function (baseClasses) {
        return baseClasses.some(function (cls) { return cls.includes('Serializer'); });
    };
    /**
     * Check if class is a Django view class
     *
     * @param baseClasses - Array of base class names
     * @returns True if this is a Django view class
     * @private
     */
    PythonAnalyzer.prototype.isDjangoViewClass = function (baseClasses) {
        return baseClasses.some(function (cls) {
            return cls.includes('APIView') ||
                cls.includes('GenericAPIView') ||
                cls.includes('ListAPIView') ||
                cls.includes('CreateAPIView') ||
                cls.includes('ViewSet');
        });
    };
    /**
     * Check if function name is an HTTP method
     *
     * @param functionName - Name of the function
     * @returns True if this is an HTTP method handler
     * @private
     */
    PythonAnalyzer.prototype.isHTTPMethod = function (functionName) {
        var httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
        return httpMethods.includes(functionName.toLowerCase());
    };
    /**
     * Extract API endpoints from decorators and function context
     *
     * @param decorators - Array of decorator names
     * @param functionName - Name of the function
     * @param lineNumber - Line number of the function
     * @returns Array of API endpoint information
     * @private
     */
    PythonAnalyzer.prototype.extractAPIEndpoints = function (decorators, functionName, lineNumber) {
        var endpoints = [];
        // Check for @api_view decorator with HTTP methods
        for (var _i = 0, decorators_1 = decorators; _i < decorators_1.length; _i++) {
            var decorator = decorators_1[_i];
            if (decorator.includes('api_view')) {
                endpoints.push({
                    type: 'django_api_view',
                    methods: 'Multiple',
                    line: lineNumber
                });
            }
            if (decorator.includes('extend_schema')) {
                endpoints.push({
                    type: 'django_documented_api',
                    method: this.getHttpMethodFromFunction(functionName),
                    line: lineNumber
                });
            }
        }
        // Check if it's an HTTP method handler
        if (this.isHTTPMethod(functionName)) {
            endpoints.push({
                type: 'django_http_method',
                method: functionName.toUpperCase(),
                line: lineNumber
            });
        }
        return endpoints;
    };
    /**
     * Get HTTP method from function name
     *
     * @param functionName - Name of the function
     * @returns HTTP method or undefined
     * @private
     */
    PythonAnalyzer.prototype.getHttpMethodFromFunction = function (functionName) {
        var method = functionName.toLowerCase();
        var httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
        var upperMethod = method.toUpperCase();
        return httpMethods.includes(upperMethod) ? upperMethod : undefined;
    };
    return PythonAnalyzer;
}());
exports.PythonAnalyzer = PythonAnalyzer;
