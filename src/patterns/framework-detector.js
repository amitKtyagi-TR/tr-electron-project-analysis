"use strict";
/**
 * Framework Detection Engine
 *
 * This module analyzes code files and project structure to automatically detect
 * which frameworks are being used. It uses pattern matching and confidence scoring
 * to provide reliable framework identification.
 */
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
exports.FrameworkDetector = void 0;
var pattern_definitions_js_1 = require("./pattern-definitions.js");
/**
 * Framework detection engine
 *
 * Analyzes a collection of file analyses to detect which frameworks
 * are being used in the codebase with confidence scoring.
 */
var FrameworkDetector = /** @class */ (function () {
    /**
     * Create a new framework detector
     *
     * @param debugMode - Enable debug logging for pattern matching
     */
    function FrameworkDetector(debugMode) {
        if (debugMode === void 0) { debugMode = false; }
        this.debugMode = debugMode;
    }
    /**
     * Detect frameworks from analyzed files
     *
     * @param fileAnalyses - Map of file paths to their analysis results
     * @returns Array of detected frameworks with confidence scores
     */
    FrameworkDetector.prototype.detectFrameworks = function (fileAnalyses) {
        if (this.debugMode) {
            console.log("\uD83D\uDD0D Starting framework detection on ".concat(fileAnalyses.size, " files"));
        }
        var frameworkEvidence = new Map();
        // Initialize evidence for all frameworks
        for (var _i = 0, ALL_FRAMEWORK_SIGNATURES_1 = pattern_definitions_js_1.ALL_FRAMEWORK_SIGNATURES; _i < ALL_FRAMEWORK_SIGNATURES_1.length; _i++) {
            var signature = ALL_FRAMEWORK_SIGNATURES_1[_i];
            frameworkEvidence.set(signature.name, {
                files: [],
                matchedPatterns: [],
                totalScore: 0,
                confidence: 0
            });
        }
        // Analyze each file for framework patterns
        for (var _a = 0, fileAnalyses_1 = fileAnalyses; _a < fileAnalyses_1.length; _a++) {
            var _b = fileAnalyses_1[_a], filePath = _b[0], analysis = _b[1];
            if (analysis.error) {
                continue; // Skip files with analysis errors
            }
            this.analyzeFileForFrameworks(filePath, analysis, frameworkEvidence);
        }
        // Calculate final confidence scores and filter results
        var detections = [];
        var _loop_1 = function (frameworkName, evidence) {
            var signature = pattern_definitions_js_1.ALL_FRAMEWORK_SIGNATURES.find(function (sig) { return sig.name === frameworkName; });
            if (!signature)
                return "continue";
            // Calculate normalized confidence score
            var maxPossibleScore = this_1.calculateMaxPossibleScore(signature, fileAnalyses);
            evidence.confidence = maxPossibleScore > 0 ? Math.min(evidence.totalScore / maxPossibleScore, 1.0) : 0;
            if (this_1.debugMode) {
                console.log("\uD83D\uDCCA ".concat(frameworkName, ": ").concat(evidence.totalScore, "/").concat(maxPossibleScore, " = ").concat((evidence.confidence * 100).toFixed(1), "% (threshold: ").concat((signature.minConfidence * 100).toFixed(1), "%)"));
                if (evidence.matchedPatterns.length > 0) {
                    console.log("   Matched patterns: ".concat(evidence.matchedPatterns.map(function (p) { return p.patternId; }).join(', ')));
                }
            }
            // Only include frameworks that meet minimum confidence threshold
            if (evidence.confidence >= signature.minConfidence) {
                detections.push({
                    name: frameworkName,
                    confidence: evidence.confidence,
                    evidence_files: __spreadArray([], new Set(evidence.files), true), // Remove duplicates
                    patterns_matched: evidence.matchedPatterns.map(function (p) { return p.patternId; })
                });
            }
        };
        var this_1 = this;
        for (var _c = 0, frameworkEvidence_1 = frameworkEvidence; _c < frameworkEvidence_1.length; _c++) {
            var _d = frameworkEvidence_1[_c], frameworkName = _d[0], evidence = _d[1];
            _loop_1(frameworkName, evidence);
        }
        // Sort by confidence (highest first)
        detections.sort(function (a, b) { return b.confidence - a.confidence; });
        if (this.debugMode) {
            console.log("\u2705 Framework detection complete. Found ".concat(detections.length, " frameworks"));
        }
        return detections;
    };
    /**
     * Analyze a single file for framework patterns
     *
     * @param filePath - Path to the file being analyzed
     * @param analysis - File analysis result
     * @param frameworkEvidence - Evidence collection for all frameworks
     * @private
     */
    FrameworkDetector.prototype.analyzeFileForFrameworks = function (filePath, analysis, frameworkEvidence) {
        for (var _i = 0, ALL_FRAMEWORK_SIGNATURES_2 = pattern_definitions_js_1.ALL_FRAMEWORK_SIGNATURES; _i < ALL_FRAMEWORK_SIGNATURES_2.length; _i++) {
            var signature = ALL_FRAMEWORK_SIGNATURES_2[_i];
            var evidence = frameworkEvidence.get(signature.name);
            if (!evidence)
                continue;
            for (var _a = 0, _b = signature.patterns; _a < _b.length; _a++) {
                var pattern = _b[_a];
                if (this.matchesPattern(filePath, analysis, pattern)) {
                    evidence.files.push(filePath);
                    evidence.matchedPatterns.push({
                        patternId: pattern.id,
                        filePath: filePath,
                        weight: pattern.weight,
                        description: pattern.description
                    });
                    evidence.totalScore += pattern.weight;
                    if (this.debugMode) {
                        console.log("  \u2713 ".concat(signature.name, ": ").concat(pattern.id, " in ").concat(filePath, " (+").concat(pattern.weight, ")"));
                    }
                }
            }
        }
    };
    /**
     * Check if a pattern matches against a file analysis
     *
     * @param filePath - Path to the file
     * @param analysis - File analysis result
     * @param pattern - Pattern to match
     * @returns True if pattern matches
     * @private
     */
    FrameworkDetector.prototype.matchesPattern = function (filePath, analysis, pattern) {
        // Skip if language doesn't match (if specified)
        if (pattern.languages && analysis.language) {
            if (!pattern.languages.includes(analysis.language)) {
                return false;
            }
        }
        switch (pattern.type) {
            case 'file_name':
                return this.matchFileNamePattern(filePath, pattern);
            case 'import':
                return this.matchImportPattern(analysis, pattern);
            case 'function_call':
                return this.matchFunctionCallPattern(analysis, pattern);
            case 'class_name':
                return this.matchClassNamePattern(analysis, pattern);
            case 'decorator':
                return this.matchDecoratorPattern(analysis, pattern);
            case 'content':
                return this.matchContentPattern(analysis, pattern);
            default:
                if (this.debugMode) {
                    console.warn("Unknown pattern type: ".concat(pattern.type));
                }
                return false;
        }
    };
    /**
     * Match file name patterns
     * @private
     */
    FrameworkDetector.prototype.matchFileNamePattern = function (filePath, pattern) {
        var regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern);
        return regex.test(filePath);
    };
    /**
     * Match import patterns
     * @private
     */
    FrameworkDetector.prototype.matchImportPattern = function (analysis, pattern) {
        if (!analysis.imports)
            return false;
        var regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern);
        for (var _i = 0, _a = Object.keys(analysis.imports); _i < _a.length; _i++) {
            var moduleName = _a[_i];
            if (regex.test(moduleName)) {
                return true;
            }
        }
        return false;
    };
    /**
     * Match function call patterns
     * @private
     */
    FrameworkDetector.prototype.matchFunctionCallPattern = function (analysis, pattern) {
        if (!analysis.functions)
            return false;
        var regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern);
        // Special handling for React hooks - check imports and state_changes
        if (pattern.id === 'use_state_hook' || pattern.id === 'use_effect_hook') {
            // Check if the hook is imported
            if (analysis.imports && analysis.imports['react']) {
                var reactImports = analysis.imports['react'];
                if (reactImports.includes('useState') && pattern.id === 'use_state_hook') {
                    return true;
                }
                if (reactImports.includes('useEffect') && pattern.id === 'use_effect_hook') {
                    return true;
                }
            }
            // Check if any function uses the hook in state_changes
            for (var _i = 0, _a = Object.values(analysis.functions); _i < _a.length; _i++) {
                var functionInfo = _a[_i];
                if (functionInfo.state_changes) {
                    for (var _b = 0, _c = functionInfo.state_changes; _b < _c.length; _b++) {
                        var stateChange = _c[_b];
                        if (regex.test(stateChange)) {
                            return true;
                        }
                    }
                }
            }
        }
        // Check function names and signatures
        for (var _d = 0, _e = Object.keys(analysis.functions); _d < _e.length; _d++) {
            var functionSignature = _e[_d];
            if (regex.test(functionSignature)) {
                return true;
            }
        }
        // Check if pattern relates to React components (capital letter functions)
        if (pattern.context === 'has_jsx' && (analysis.language === 'javascript' || analysis.language === 'typescript')) {
            for (var _f = 0, _g = Object.entries(analysis.functions); _f < _g.length; _f++) {
                var _h = _g[_f], functionSignature = _h[0], functionInfo = _h[1];
                if (functionInfo.is_component && functionSignature.includes('(')) {
                    var functionName = functionSignature.split('(')[0];
                    if (functionName && regex.test(functionName)) {
                        return true;
                    }
                }
            }
        }
        return false;
    };
    /**
     * Match class name patterns
     * @private
     */
    FrameworkDetector.prototype.matchClassNamePattern = function (analysis, pattern) {
        if (!analysis.classes)
            return false;
        var regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern);
        for (var _i = 0, _a = Object.keys(analysis.classes); _i < _a.length; _i++) {
            var className = _a[_i];
            if (regex.test(className)) {
                return true;
            }
            // Check base classes if context requires it
            if (pattern.context === 'extends' || pattern.context === 'extends_react' || pattern.context === 'django_models') {
                var classInfo = analysis.classes[className];
                if (classInfo && classInfo.base_classes) {
                    for (var _b = 0, _c = classInfo.base_classes; _b < _c.length; _b++) {
                        var baseClass = _c[_b];
                        if (regex.test(baseClass)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };
    /**
     * Match decorator patterns
     * @private
     */
    FrameworkDetector.prototype.matchDecoratorPattern = function (analysis, pattern) {
        var regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern);
        // Check function decorators
        if (analysis.functions) {
            for (var _i = 0, _a = Object.values(analysis.functions); _i < _a.length; _i++) {
                var functionInfo = _a[_i];
                if (functionInfo.decorators) {
                    for (var _b = 0, _c = functionInfo.decorators; _b < _c.length; _b++) {
                        var decorator = _c[_b];
                        if (regex.test(decorator.name)) {
                            return true;
                        }
                    }
                }
            }
        }
        // Check class decorators
        if (analysis.classes) {
            for (var _d = 0, _e = Object.values(analysis.classes); _d < _e.length; _d++) {
                var classInfo = _e[_d];
                if (classInfo.decorators) {
                    for (var _f = 0, _g = classInfo.decorators; _f < _g.length; _f++) {
                        var decorator = _g[_f];
                        if (regex.test(decorator.name)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };
    /**
     * Match content patterns (requires reading file content)
     * @private
     */
    FrameworkDetector.prototype.matchContentPattern = function (analysis, pattern) {
        // For now, we'll use a simplified approach since we don't have raw content
        // In a full implementation, this would analyze the raw file content
        // For JSX syntax, we can infer from the presence of React components
        if (pattern.id === 'jsx_syntax') {
            return analysis.language === 'javascript' || analysis.language === 'typescript';
        }
        return false;
    };
    /**
     * Calculate the maximum possible score for a framework given the available files
     * @private
     */
    FrameworkDetector.prototype.calculateMaxPossibleScore = function (signature, fileAnalyses) {
        var maxScore = 0;
        // Count files by language
        var languageCounts = new Map();
        for (var _i = 0, _a = fileAnalyses.values(); _i < _a.length; _i++) {
            var analysis = _a[_i];
            if (analysis.language && analysis.language !== 'unknown') {
                languageCounts.set(analysis.language, (languageCounts.get(analysis.language) || 0) + 1);
            }
        }
        // For each pattern, calculate if it could potentially match
        for (var _b = 0, _c = signature.patterns; _b < _c.length; _b++) {
            var pattern = _c[_b];
            var couldMatch = false;
            if (pattern.languages) {
                // Pattern applies to specific languages
                for (var _d = 0, _e = pattern.languages; _d < _e.length; _d++) {
                    var lang = _e[_d];
                    var fileCount = languageCounts.get(lang) || 0;
                    if (fileCount > 0) {
                        couldMatch = true;
                        break;
                    }
                }
            }
            else {
                // Pattern applies to any file
                couldMatch = fileAnalyses.size > 0;
            }
            if (couldMatch) {
                maxScore += pattern.weight;
            }
        }
        // Ensure we have a reasonable max score that's achievable
        // If we have very few patterns matching, lower the bar
        return Math.max(maxScore * 0.6, 10); // At least 10 points possible, and only need 60% of total
    };
    /**
     * Get detailed detection report for debugging
     *
     * @param fileAnalyses - Map of file analyses
     * @returns Detailed detection report
     */
    FrameworkDetector.prototype.getDetectionReport = function (fileAnalyses) {
        var oldDebugMode = this.debugMode;
        this.debugMode = true;
        var detections = this.detectFrameworks(fileAnalyses);
        this.debugMode = oldDebugMode;
        return {
            totalFiles: fileAnalyses.size,
            detectedFrameworks: detections,
            languageDistribution: this.getLanguageDistribution(fileAnalyses),
            supportedFrameworks: pattern_definitions_js_1.ALL_FRAMEWORK_SIGNATURES.map(function (sig) { return ({
                name: sig.name,
                minConfidence: sig.minConfidence,
                patternCount: sig.patterns.length,
                primaryLanguages: sig.primaryLanguages
            }); })
        };
    };
    /**
     * Get language distribution from file analyses
     * @private
     */
    FrameworkDetector.prototype.getLanguageDistribution = function (fileAnalyses) {
        var distribution = {};
        for (var _i = 0, _a = fileAnalyses.values(); _i < _a.length; _i++) {
            var analysis = _a[_i];
            if (analysis.language) {
                distribution[analysis.language] = (distribution[analysis.language] || 0) + 1;
            }
        }
        return distribution;
    };
    return FrameworkDetector;
}());
exports.FrameworkDetector = FrameworkDetector;
