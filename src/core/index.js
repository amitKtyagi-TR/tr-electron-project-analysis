"use strict";
/**
 * Core module exports
 *
 * This module exports all core functionality including
 * git processing, file analysis coordination, and result aggregation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsAggregator = exports.AnalysisCoordinator = exports.LanguageDetector = exports.DEFAULT_PROCESSING_OPTIONS = exports.FileProcessor = exports.GitProcessor = void 0;
var git_processor_js_1 = require("./git-processor.js");
Object.defineProperty(exports, "GitProcessor", { enumerable: true, get: function () { return git_processor_js_1.GitProcessor; } });
var file_processor_js_1 = require("./file-processor.js");
Object.defineProperty(exports, "FileProcessor", { enumerable: true, get: function () { return file_processor_js_1.FileProcessor; } });
Object.defineProperty(exports, "DEFAULT_PROCESSING_OPTIONS", { enumerable: true, get: function () { return file_processor_js_1.DEFAULT_PROCESSING_OPTIONS; } });
var language_detector_js_1 = require("./language-detector.js");
Object.defineProperty(exports, "LanguageDetector", { enumerable: true, get: function () { return language_detector_js_1.LanguageDetector; } });
var analysis_coordinator_js_1 = require("./analysis-coordinator.js");
Object.defineProperty(exports, "AnalysisCoordinator", { enumerable: true, get: function () { return analysis_coordinator_js_1.AnalysisCoordinator; } });
var results_aggregator_js_1 = require("./results-aggregator.js");
Object.defineProperty(exports, "ResultsAggregator", { enumerable: true, get: function () { return results_aggregator_js_1.ResultsAggregator; } });
