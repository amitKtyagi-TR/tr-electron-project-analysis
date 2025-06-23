/**
 * Core module exports
 *
 * This module exports all core functionality including
 * git processing, file analysis coordination, and result aggregation.
 */

export { GitProcessor } from './git-processor.js';
export {
  FileProcessor,
  DEFAULT_PROCESSING_OPTIONS,
  type ProcessingOptions,
  type FileProcessingResult
} from './file-processor.js';
export { LanguageDetector } from './language-detector.js';
export {
  AnalysisCoordinator,
  type AnalysisResult as CoordinatorAnalysisResult
} from './analysis-coordinator.js';
export {
  ResultsAggregator,
  type AggregationOptions,
  type CircularDependency
} from './results-aggregator.js';
