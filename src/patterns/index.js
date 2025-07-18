"use strict";
/**
 * Pattern Detection Module Exports
 *
 * This module exports all pattern detection functionality including
 * framework detection, pattern definitions, and related types.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupportedFrameworks = exports.getFrameworkSignature = exports.EXPRESS_PATTERNS = exports.FLUTTER_PATTERNS = exports.NESTJS_PATTERNS = exports.DJANGO_PATTERNS = exports.REACT_PATTERNS = exports.ALL_FRAMEWORK_SIGNATURES = exports.EventDetector = exports.StateDetector = exports.ApiDetector = exports.FrameworkDetector = void 0;
// Export the main framework detector
var framework_detector_js_1 = require("./framework-detector.js");
Object.defineProperty(exports, "FrameworkDetector", { enumerable: true, get: function () { return framework_detector_js_1.FrameworkDetector; } });
// Export the API endpoint detector
var api_detector_js_1 = require("./api-detector.js");
Object.defineProperty(exports, "ApiDetector", { enumerable: true, get: function () { return api_detector_js_1.ApiDetector; } });
// Export the state management detector
var state_detector_js_1 = require("./state-detector.js");
Object.defineProperty(exports, "StateDetector", { enumerable: true, get: function () { return state_detector_js_1.StateDetector; } });
// Export the event handler detector
var event_detector_js_1 = require("./event-detector.js");
Object.defineProperty(exports, "EventDetector", { enumerable: true, get: function () { return event_detector_js_1.EventDetector; } });
// Export pattern definitions and utilities
var pattern_definitions_js_1 = require("./pattern-definitions.js");
Object.defineProperty(exports, "ALL_FRAMEWORK_SIGNATURES", { enumerable: true, get: function () { return pattern_definitions_js_1.ALL_FRAMEWORK_SIGNATURES; } });
Object.defineProperty(exports, "REACT_PATTERNS", { enumerable: true, get: function () { return pattern_definitions_js_1.REACT_PATTERNS; } });
Object.defineProperty(exports, "DJANGO_PATTERNS", { enumerable: true, get: function () { return pattern_definitions_js_1.DJANGO_PATTERNS; } });
Object.defineProperty(exports, "NESTJS_PATTERNS", { enumerable: true, get: function () { return pattern_definitions_js_1.NESTJS_PATTERNS; } });
Object.defineProperty(exports, "FLUTTER_PATTERNS", { enumerable: true, get: function () { return pattern_definitions_js_1.FLUTTER_PATTERNS; } });
Object.defineProperty(exports, "EXPRESS_PATTERNS", { enumerable: true, get: function () { return pattern_definitions_js_1.EXPRESS_PATTERNS; } });
Object.defineProperty(exports, "getFrameworkSignature", { enumerable: true, get: function () { return pattern_definitions_js_1.getFrameworkSignature; } });
Object.defineProperty(exports, "getSupportedFrameworks", { enumerable: true, get: function () { return pattern_definitions_js_1.getSupportedFrameworks; } });
