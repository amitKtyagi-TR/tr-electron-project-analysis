"use strict";
/**
 * Language Detection System
 *
 * This module provides intelligent programming language detection based on
 * file extensions, shebang lines, and content analysis heuristics.
 * It supports the languages used by our parsing infrastructure.
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
exports.LanguageDetector = void 0;
var node_path_1 = require("node:path");
/**
 * File extension to language mapping
 * Covers the most common extensions for supported languages
 */
var EXTENSION_MAP = {
    // JavaScript family
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    // TypeScript family
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.mts': 'typescript',
    '.cts': 'typescript',
    // Python
    '.py': 'python',
    '.pyw': 'python',
    '.pyi': 'python',
    // Dart
    '.dart': 'dart',
    // Other supported languages
    '.java': 'java',
    '.cpp': 'cpp',
    '.cxx': 'cpp',
    '.cc': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.kts': 'kotlin',
    '.scala': 'scala',
    '.r': 'unknown', // R language - not supported for deep analysis
    '.R': 'unknown', // R language - not supported for deep analysis
    '.m': 'unknown', // Could be MATLAB or Objective-C - not supported for deep analysis
    '.sh': 'unknown', // Shell scripts - not deeply analyzed
    '.bash': 'unknown',
    '.zsh': 'unknown',
    '.sql': 'unknown', // SQL - not deeply analyzed
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'css',
    '.sass': 'css',
    '.less': 'css',
    '.xml': 'unknown',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.rst': 'markdown',
    '.tex': 'unknown',
    '.svg': 'unknown',
    '.png': 'unknown',
    '.jpg': 'unknown',
    '.jpeg': 'unknown',
    '.gif': 'unknown',
    '.ico': 'unknown',
    '.webp': 'unknown',
};
/**
 * Shebang patterns for language detection
 */
var SHEBANG_PATTERNS = [
    { pattern: /^#!.*\bnode\b/, language: 'javascript' },
    { pattern: /^#!.*\bpython[0-9.]*\b/, language: 'python' },
    { pattern: /^#!.*\bruby\b/, language: 'ruby' },
    { pattern: /^#!.*\bphp\b/, language: 'php' },
    { pattern: /^#!.*\bdart\b/, language: 'dart' },
];
/**
 * Content-based heuristics for language detection
 * These patterns help identify languages when extensions are missing or ambiguous
 */
var CONTENT_HEURISTICS = [
    // Python
    {
        patterns: [
            /^\s*import\s+\w+/m,
            /^\s*from\s+\w+\s+import/m,
            /^\s*def\s+\w+\s*\(/m,
            /^\s*class\s+\w+.*:/m,
            /^\s*if\s+__name__\s*==\s*['"]\s*__main__\s*['"]:/m,
        ],
        language: 'python',
        weight: 3,
    },
    // JavaScript/TypeScript
    {
        patterns: [
            /^\s*import\s+.*\s+from\s+['"`]/m,
            /^\s*const\s+\w+\s*=/m,
            /^\s*let\s+\w+\s*=/m,
            /^\s*function\s+\w+\s*\(/m,
            /=>\s*{/,
            /console\.(log|error|warn)/,
        ],
        language: 'javascript',
        weight: 2,
    },
    // TypeScript specific
    {
        patterns: [
            /^\s*interface\s+\w+/m,
            /^\s*type\s+\w+\s*=/m,
            /:\s*\w+(\[\]|\<.*\>)?\s*[=;]/,
            /^\s*export\s+type\s+/m,
            /as\s+\w+(\[\]|\<.*\>)?/,
        ],
        language: 'typescript',
        weight: 4,
    },
    // Java
    {
        patterns: [
            /^\s*package\s+[\w.]+;/m,
            /^\s*import\s+[\w.]+;/m,
            /^\s*public\s+class\s+\w+/m,
            /^\s*private\s+\w+\s+\w+/m,
            /System\.out\.println/,
        ],
        language: 'java',
        weight: 3,
    },
    // C/C++
    {
        patterns: [
            /^\s*#include\s*<.*>/m,
            /^\s*#include\s*".*"/m,
            /^\s*int\s+main\s*\(/m,
            /^\s*#define\s+\w+/m,
            /printf\s*\(/,
        ],
        language: 'cpp',
        weight: 2,
    },
    // Dart
    {
        patterns: [
            /^\s*import\s+['"]dart:/m,
            /^\s*import\s+['"]package:/m,
            /^\s*class\s+\w+\s+extends\s+StatelessWidget/m,
            /^\s*class\s+\w+\s+extends\s+StatefulWidget/m,
            /Widget\s+build\s*\(/,
        ],
        language: 'dart',
        weight: 4,
    },
    // Ruby
    {
        patterns: [
            /^\s*require\s+['"].*['"]/m,
            /^\s*class\s+\w+.*$/m,
            /^\s*def\s+\w+.*$/m,
            /^\s*module\s+\w+/m,
            /puts\s+/,
        ],
        language: 'ruby',
        weight: 2,
    },
];
/**
 * Language detection service
 *
 * This class provides comprehensive language detection using multiple strategies:
 * file extensions, shebang lines, and content analysis.
 */
var LanguageDetector = /** @class */ (function () {
    function LanguageDetector() {
    }
    /**
     * Detect the programming language of a file
     *
     * @param filePath - Path to the file
     * @param content - Optional file content (if not provided, will try to read file)
     * @returns Detected language or 'unknown'
     */
    LanguageDetector.prototype.detectLanguage = function (filePath, content) {
        return __awaiter(this, void 0, void 0, function () {
            var extensionResult, shebangResult, contentResult;
            return __generator(this, function (_a) {
                extensionResult = this.detectByExtension(filePath);
                if (extensionResult && extensionResult !== 'unknown') {
                    // If we have a definitive match from extension, use it
                    // But for ambiguous cases (like .m files), continue with content analysis
                    if (this.isDefinitiveExtension((0, node_path_1.extname)(filePath))) {
                        return [2 /*return*/, extensionResult];
                    }
                }
                // Strategy 2: Content-based detection (requires file content)
                if (content !== undefined) {
                    shebangResult = this.detectByShebang(content);
                    if (shebangResult) {
                        return [2 /*return*/, shebangResult];
                    }
                    contentResult = this.detectByContent(content);
                    if (contentResult) {
                        return [2 /*return*/, contentResult];
                    }
                }
                // Strategy 3: Fall back to extension result or unknown
                return [2 /*return*/, extensionResult || 'unknown'];
            });
        });
    };
    /**
     * Detect language by file extension
     *
     * @param filePath - File path or extension
     * @returns Detected language or null if not found
     */
    LanguageDetector.prototype.detectByExtension = function (filePath) {
        var extension = (0, node_path_1.extname)(filePath).toLowerCase();
        return EXTENSION_MAP[extension] || null;
    };
    /**
       * Detect language by shebang line
       *
       * @param content - File content
       * @returns Detected language or null if no shebang match
       */
    LanguageDetector.prototype.detectByShebang = function (content) {
        var lines = content.split('\n');
        var firstLine = lines[0];
        if (!firstLine || !firstLine.startsWith('#!')) {
            return null;
        }
        for (var _i = 0, SHEBANG_PATTERNS_1 = SHEBANG_PATTERNS; _i < SHEBANG_PATTERNS_1.length; _i++) {
            var _a = SHEBANG_PATTERNS_1[_i], pattern = _a.pattern, language = _a.language;
            if (pattern.test(firstLine)) {
                return language;
            }
        }
        return null;
    };
    /**
     * Detect language by content analysis using heuristics
     *
     * @param content - File content
     * @returns Detected language or null if no strong match
     */
    LanguageDetector.prototype.detectByContent = function (content) {
        var scores = new Map();
        for (var _i = 0, CONTENT_HEURISTICS_1 = CONTENT_HEURISTICS; _i < CONTENT_HEURISTICS_1.length; _i++) {
            var _a = CONTENT_HEURISTICS_1[_i], patterns = _a.patterns, language = _a.language, weight = _a.weight;
            var matches = 0;
            for (var _b = 0, patterns_1 = patterns; _b < patterns_1.length; _b++) {
                var pattern = patterns_1[_b];
                if (pattern.test(content)) {
                    matches++;
                }
            }
            if (matches > 0) {
                var score = matches * weight;
                scores.set(language, (scores.get(language) || 0) + score);
            }
        }
        if (scores.size === 0) {
            return null;
        }
        // Find the language with the highest score
        var bestLanguage = null;
        var bestScore = 0;
        for (var _c = 0, _d = scores.entries(); _c < _d.length; _c++) {
            var _e = _d[_c], language = _e[0], score = _e[1];
            if (score > bestScore) {
                bestScore = score;
                bestLanguage = language;
            }
        }
        // Only return a result if we have a reasonable confidence
        return bestScore >= 2 ? bestLanguage : null;
    };
    /**
     * Check if a file extension provides definitive language identification
     *
     * @param extension - File extension
     * @returns True if extension is definitive (not ambiguous)
     * @private
     */
    LanguageDetector.prototype.isDefinitiveExtension = function (extension) {
        var definitiveExtensions = [
            '.js', '.jsx', '.mjs', '.cjs',
            '.ts', '.tsx', '.mts', '.cts',
            '.py', '.pyw', '.pyi',
            '.dart',
            '.java',
            '.go',
            '.rs',
            '.rb',
            '.php',
            '.swift',
            '.kt', '.kts',
            '.scala',
        ];
        return definitiveExtensions.includes(extension.toLowerCase());
    };
    /**
     * Get all supported file extensions
     *
     * @returns Array of supported file extensions
     */
    LanguageDetector.prototype.getSupportedExtensions = function () {
        return Object.keys(EXTENSION_MAP);
    };
    /**
     * Check if a language is supported for deep analysis
     *
     * @param language - Language to check
     * @returns True if language supports deep analysis (has dedicated parser)
     */
    LanguageDetector.prototype.supportsDeepAnalysis = function (language) {
        var deepAnalysisLanguages = [
            'javascript',
            'typescript',
            'python',
            'dart',
        ];
        return deepAnalysisLanguages.includes(language);
    };
    return LanguageDetector;
}());
exports.LanguageDetector = LanguageDetector;
