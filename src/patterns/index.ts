/**
 * Pattern Detection Module Exports
 *
 * This module exports all pattern detection functionality including
 * framework detection, pattern definitions, and related types.
 */

// Export the main framework detector
export { FrameworkDetector } from './framework-detector.js';

// Export the API endpoint detector
export { ApiDetector } from './api-detector.js';
export type { DetailedApiEndpoint, ApiDetectionStats } from './api-detector.js';

// Export the state management detector
export { StateDetector } from './state-detector.js';
export type { DetailedStatePattern, StateDetectionStats } from './state-detector.js';

// Export pattern definitions and utilities
export {
  ALL_FRAMEWORK_SIGNATURES,
  REACT_PATTERNS,
  DJANGO_PATTERNS,
  NESTJS_PATTERNS,
  FLUTTER_PATTERNS,
  EXPRESS_PATTERNS,
  getFrameworkSignature,
  getSupportedFrameworks,
  type FrameworkSignature,
  type PatternDefinition
} from './pattern-definitions.js';
