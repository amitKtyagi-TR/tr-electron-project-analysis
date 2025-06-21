/**
 * Core type definitions for the Code Analysis Engine
 *
 * This module defines all TypeScript interfaces and types used throughout the system.
 * The interfaces are designed to match the Python implementation's output format exactly
 * while providing strong typing for better developer experience and runtime safety.
 */

/**
 * Main result structure returned by the analysis engine
 * This matches the top-level structure from the Python implementation
 */
export interface AnalysisResult {
  /** Files organized by folder structure */
  folder_structure: Record<string, FileAnalysis[]>;
  /** Aggregate statistics about the analyzed project */
  summary: ProjectSummary;
  /** Dependency relationships between files */
  dependencies: DependencyGraph;
  /** Metadata about the analysis process */
  metadata?: AnalysisMetadata;
}

/**
 * Summary statistics for the entire project
 */
export interface ProjectSummary {
  /** Total number of files analyzed */
  total_files: number;
  /** Total lines of code across all files */
  total_lines: number;
  /** Distribution of programming languages */
  languages: Record<string, number>;
  /** Distribution of file extensions */
  extensions: Record<string, number>;
  /** Detected frameworks with confidence scores */
  frameworks?: Record<string, number>;
}

/**
 * Dependency graph showing relationships between files
 * Key is the file path, value is array of dependencies (internal files or external packages)
 */
export type DependencyGraph = Record<string, string[]>;

/**
 * Metadata about the analysis process
 */
export interface AnalysisMetadata {
  /** When the analysis was performed */
  timestamp: string;
  /** Time taken to complete analysis (in milliseconds) */
  duration_ms: number;
  /** Version of the analysis engine */
  engine_version: string;
  /** Repository path that was analyzed */
  repository_path: string;
}

/**
 * Analysis result for a single file
 * This matches the structure returned by both Python and enhanced analyzers
 */
export interface FileAnalysis {
  /** Relative path to the file from repository root */
  path: string;
  /** Detected programming language */
  language?: SupportedLanguage;
  /** File extension */
  extension?: string;
  /** Import statements organized by module */
  imports?: Record<string, string[]>;
  /** Function definitions with their metadata */
  functions?: Record<string, FunctionInfo>;
  /** Class definitions with their metadata */
  classes?: Record<string, ClassInfo>;
  /** Module-level docstring (for Python files) */
  module_docstring?: string;
  /** API endpoints found in this file */
  api_endpoints?: ApiEndpoint[];
  /** State management patterns detected */
  state_changes?: StateChange[];
  /** Event handlers found in this file */
  event_handlers?: EventHandler[];
  /** Basic file metrics for non-code files */
  lines?: number;
  characters?: number;
  non_empty_lines?: number;
  avg_line_length?: number;
  /** Error message if analysis failed */
  error?: string;
}

/**
 * Supported programming languages
 */
export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'dart'
  | 'java'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'ruby'
  | 'go'
  | 'rust'
  | 'php'
  | 'swift'
  | 'kotlin'
  | 'scala'
  | 'html'
  | 'css'
  | 'json'
  | 'yaml'
  | 'markdown'
  | 'unknown';


/**
 * Detailed information about a function or method
 */
export interface FunctionInfo {
  /** Function documentation (docstring/JSDoc) */
  docstring: string;
  /** State management patterns used within this function */
  state_changes: string[];
  /** Event handlers defined in this function */
  event_handlers: string[];
  /** API endpoints defined by this function */
  api_endpoints: ApiEndpoint[];
  /** Decorators applied to this function (NestJS, Python, etc.) */
  decorators?: Decorator[];
  /** Whether this is a React component (starts with capital letter) */
  is_component?: boolean;
  /** Whether this is a React hook (starts with 'use') */
  is_hook?: boolean;
  /** Whether this is an async function */
  is_async?: boolean;
  /** Function parameters */
  parameters?: string[];
  /** Line number where function is defined */
  line_number?: number;
}

/**
 * Detailed information about a class
 */
export interface ClassInfo {
  /** Class documentation (docstring/JSDoc) */
  docstring: string;
  /** Methods defined in this class */
  methods: Record<string, FunctionInfo>;
  /** Classes this class extends */
  base_classes?: string[];
  /** Decorators applied to this class */
  decorators?: Decorator[];
  /** Whether this is a React component class */
  is_component?: boolean;
  /** Line number where class is defined */
  line_number?: number;
}

/**
 * Decorator information (for NestJS, Python, etc.)
 */
export interface Decorator {
  /** Name of the decorator */
  name: string;
  /** Arguments passed to the decorator */
  arguments?: string[];
  /** Line number where decorator appears */
  line_number?: number;
}

/**
 * API endpoint information
 */
export interface ApiEndpoint {
  /** Type of endpoint pattern detected */
  type: string;
  /** HTTP method (GET, POST, etc.) */
  method?: HttpMethod;
  /** Route pattern or URL path */
  route?: string;
  /** HTTP methods supported (for Django @api_view) */
  methods?: string;
  /** Line number where endpoint is defined */
  line: number;
  /** Framework that defines this endpoint */
  framework?: string;
}

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * State management pattern detection
 */
export interface StateChange {
  /** Type of state pattern (useState, redux, etc.) */
  type: StatePatternType;
  /** Line number where pattern occurs */
  line: number;
  /** Variable name being modified (if applicable) */
  variable?: string;
  /** Type of mutation (create, update, delete) */
  mutation_type?: MutationType;
}

/**
 * Types of state management patterns
 */
export type StatePatternType =
  | 'useState'
  | 'useReducer'
  | 'setState'
  | 'dispatch'
  | 'redux_action'
  | 'redux_reducer'
  | 'mobx_observable'
  | 'django_save'
  | 'django_create'
  | 'django_update'
  | 'django_delete';

/**
 * Types of state mutations
 */
export type MutationType = 'create' | 'read' | 'update' | 'delete';

/**
 * Event handler information
 */
export interface EventHandler {
  /** Type of event handler */
  type: EventHandlerType;
  /** Specific event name (click, change, etc.) */
  event?: string;
  /** Function name that handles the event */
  handler?: string;
  /** Line number where handler is defined */
  line: number;
  /** Framework or system that defines this handler */
  framework?: string;
}

/**
 * Types of event handlers
 */
export type EventHandlerType =
  | 'onClick'
  | 'onChange'
  | 'onSubmit'
  | 'addEventListener'
  | 'ipc_handle'
  | 'ipc_on'
  | 'dom_event'
  | 'react_event';


  /**
 * Configuration options for the analysis engine
 */
export interface AnalysisOptions {
  /** Maximum number of files to analyze (for testing) */
  limit?: number;
  /** File extensions to include (if not specified, includes all) */
  extensions?: string[];
  /** Maximum file size to analyze (in bytes) */
  max_file_size?: number;
  /** Number of files to process concurrently */
  concurrency?: number;
  /** Whether to include basic metrics for unknown file types */
  include_unknown_files?: boolean;
  /** Callback for progress updates */
  on_progress?: (completed: number, total: number, current_file?: string) => void;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * Framework detection result
 */
export interface FrameworkDetection {
  /** Framework name */
  name: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Files that contributed to detection */
  evidence_files: string[];
  /** Specific patterns that were matched */
  patterns_matched: string[];
}

/**
 * Source code location information
 */
export interface SourceLocation {
  /** File path */
  file: string;
  /** Line number (1-based) */
  line: number;
  /** Column number (1-based, optional) */
  column?: number;
}

/**
 * Error information for failed analysis
 */
export interface AnalysisError {
  /** Error message */
  message: string;
  /** File that caused the error */
  file?: string;
  /** Error type/category */
  type: 'parsing' | 'file_access' | 'timeout' | 'memory' | 'unknown';
  /** Underlying error details */
  details?: string;
}

// Export version constant
export const ANALYSIS_ENGINE_VERSION = "0.1.0";

