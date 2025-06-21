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
