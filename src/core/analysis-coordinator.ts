/**
 * Multi-Language Analysis Coordinator
 *
 * This module coordinates the analysis of source code files across multiple
 * programming languages. It routes files to appropriate parsers based on
 * language detection and normalizes the output format.
 */

import { TreeSitterManager } from '../parsers/tree-sitter-manager.js';
import { BabelAnalyzer } from '../parsers/babel-analyzer.js';
import { PythonAnalyzer } from '../parsers/python-analyzer.js';
import { LanguageDetector } from './language-detector.js';
import type {
  FileAnalysis,
  SupportedLanguage,
  AnalysisOptions
} from '../types/index.js';

/**
 * Result of analyzing a single file with routing information
 */
export interface AnalysisResult {
  /** The file analysis result */
  analysis: FileAnalysis;
  /** Which parser was used */
  parser: 'babel' | 'tree-sitter' | 'python' | 'basic' | 'error';
  /** Language that was detected */
  detectedLanguage: SupportedLanguage;
  /** Whether fallback parsing was used */
  usedFallback: boolean;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Analysis coordinator that manages multiple parsers
 *
 * This class provides a unified interface for analyzing source code files
 * regardless of their programming language. It automatically detects languages
 * and routes files to the most appropriate parser.
 */
export class AnalysisCoordinator {
  private treeSitterManager: TreeSitterManager;
  private babelAnalyzer: BabelAnalyzer;
  private pythonAnalyzer: PythonAnalyzer;
  private languageDetector: LanguageDetector;
  private initialized = false;

  /**
   * Create a new AnalysisCoordinator
   */
  constructor() {
    this.treeSitterManager = new TreeSitterManager();
    this.babelAnalyzer = new BabelAnalyzer();
    this.pythonAnalyzer = new PythonAnalyzer();
    this.languageDetector = new LanguageDetector();
  }

  /**
   * Initialize all parsers and analyzers
   *
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize Tree-sitter (may fail in development mode)
      await this.treeSitterManager.initialize();

      this.initialized = true;
      console.log('🎯 AnalysisCoordinator initialized successfully with Python analyzer');
    } catch (error) {
      console.warn('⚠️  AnalysisCoordinator initialization warning:', error);
      // Continue without Tree-sitter in development mode
      this.initialized = true;
    }
  }

  /**
   * Analyze a single file with automatic parser routing
   *
   * @param filePath - Path to the file relative to repository root
   * @param content - File content
   * @param options - Analysis options
   * @returns Promise that resolves to analysis result with metadata
   */
  async analyzeFile(
    filePath: string,
    content: string,
    options: AnalysisOptions = {}
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Ensure coordinator is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Step 1: Detect the programming language
      const detectedLanguage = await this.languageDetector.detectLanguage(filePath, content);

      // Step 2: Route to appropriate parser based on language and capabilities
      let analysis: FileAnalysis;
      let parser: AnalysisResult['parser'];
      let usedFallback = false;

      if (this.shouldUseBabelParser(detectedLanguage)) {
        // Use Babel for JavaScript/TypeScript (primary choice)
        try {
          analysis = await this.analyzeWithBabel(content, detectedLanguage as 'javascript' | 'typescript', filePath);
          parser = 'babel';
        } catch (error) {
          console.warn(`Babel parsing failed for ${filePath}, trying fallback:`, error);
          analysis = await this.analyzeWithFallback(content, detectedLanguage, filePath);
          parser = 'basic';
          usedFallback = true;
        }
      } else if (this.shouldUsePythonParser(detectedLanguage)) {
        // Use Python analyzer for Python files
        try {
          analysis = await this.analyzeWithPython(content, filePath);
          parser = 'python';
        } catch (error) {
          console.warn(`Python parsing failed for ${filePath}, trying Tree-sitter fallback:`, error);
          analysis = await this.analyzeWithTreeSitterFallback(content, detectedLanguage, filePath);
          parser = 'tree-sitter';
          usedFallback = true;
        }
      } else if (this.shouldUseTreeSitter(detectedLanguage)) {
        // Use Tree-sitter for other supported languages
        try {
          analysis = await this.analyzeWithTreeSitter(content, detectedLanguage, filePath);
          parser = 'tree-sitter';
        } catch (error) {
          console.warn(`Tree-sitter parsing failed for ${filePath}, using basic analysis:`, error);
          analysis = await this.analyzeBasic(content, filePath, detectedLanguage);
          parser = 'basic';
          usedFallback = true;
        }
      } else {
        // Use basic analysis for unsupported languages
        analysis = await this.analyzeBasic(content, filePath, detectedLanguage);
        parser = 'basic';
      }

      const processingTime = Date.now() - startTime;

      return {
        analysis,
        parser,
        detectedLanguage,
        usedFallback,
        processingTime,
      };

    } catch (error) {
      // Ultimate fallback - return error analysis
      const processingTime = Date.now() - startTime;

      return {
        analysis: {
          path: filePath,
          language: 'unknown',
          imports: {},
          functions: {},
          classes: {},
          error: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
        },
        parser: 'error',
        detectedLanguage: 'unknown',
        usedFallback: true,
        processingTime,
      };
    }
  }

  /**
   * Analyze multiple files with progress tracking
   *
   * @param files - Map of file paths to content
   * @param options - Analysis options including progress callback
   * @returns Promise that resolves to map of results
   */
  async analyzeFiles(
    files: Map<string, string>,
    options: AnalysisOptions = {}
  ): Promise<Map<string, AnalysisResult>> {
    const results = new Map<string, AnalysisResult>();
    const totalFiles = files.size;
    let completedFiles = 0;

    // Ensure coordinator is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    for (const [filePath, content] of files) {
      // Check for cancellation
      if (options.signal?.aborted) {
        throw new Error('Analysis was cancelled');
      }

      try {
        const result = await this.analyzeFile(filePath, content, options);
        results.set(filePath, result);
      } catch (error) {
        // Store error result
        results.set(filePath, {
          analysis: {
            path: filePath,
            language: 'unknown',
            imports: {},
            functions: {},
            classes: {},
            error: `Batch analysis failed: ${error instanceof Error ? error.message : String(error)}`,
          },
          parser: 'error',
          detectedLanguage: 'unknown',
          usedFallback: true,
          processingTime: 0,
        });
      }

      // Update progress
      completedFiles++;
      if (options.on_progress) {
        options.on_progress(completedFiles, totalFiles, filePath);
      }
    }

    return results;
  }

  /**
   * Check if Babel parser should be used for a language
   *
   * @param language - Detected language
   * @returns True if Babel should be used
   * @private
   */
  private shouldUseBabelParser(language: SupportedLanguage): boolean {
    return language === 'javascript' || language === 'typescript';
  }

  /**
   * Check if Python parser should be used for a language
   *
   * @param language - Detected language
   * @returns True if Python parser should be used
   * @private
   */
  private shouldUsePythonParser(language: SupportedLanguage): boolean {
    return language === 'python';
  }

  /**
   * Check if Tree-sitter should be used for a language
   *
   * @param language - Detected language
   * @returns True if Tree-sitter should be used
   * @private
   */
  private shouldUseTreeSitter(language: SupportedLanguage): boolean {
    // Use Tree-sitter for languages that have parsers available (excluding Python which has dedicated parser)
    const treeSitterLanguages: SupportedLanguage[] = ['dart', 'java', 'cpp', 'c'];
    return treeSitterLanguages.includes(language) && this.treeSitterManager.hasParser(language);
  }

/**
   * Analyze file using Babel parser
   *
   * @param content - File content
   * @param language - JavaScript or TypeScript
   * @param filePath - File path for context
   * @returns Promise that resolves to file analysis
   * @private
   */
  private async analyzeWithBabel(
    content: string,
    language: 'javascript' | 'typescript',
    filePath: string
  ): Promise<FileAnalysis> {
    const analysis = await this.babelAnalyzer.parseJavaScript(content, language, filePath);

    // Ensure required fields are present with defaults, then apply analysis results
    return {
      language: language,
      imports: {},
      functions: {},
      classes: {},
      ...analysis, // This will override the defaults above and set the correct path
    };
  }

  /**
   * Analyze file using Python parser
   *
   * @param content - File content
   * @param filePath - File path for context
   * @returns Promise that resolves to file analysis
   * @private
   */
  private async analyzeWithPython(
    content: string,
    filePath: string
  ): Promise<FileAnalysis> {
    return await this.pythonAnalyzer.analyzePython(content, filePath);
  }

  /**
   * Analyze file using Tree-sitter parser
   *
   * @param content - File content
   * @param language - Programming language
   * @param filePath - File path for context
   * @returns Promise that resolves to file analysis
   * @private
   */
  private async analyzeWithTreeSitter(
    content: string,
    language: SupportedLanguage,
    filePath: string
  ): Promise<FileAnalysis> {
    try {
      const tree = await this.treeSitterManager.parseFile(content, language);

      // For now, return basic structure since Tree-sitter query implementation
      // would require language-specific query development
      return {
        path: filePath,
        language: language,
        imports: {},
        functions: {},
        classes: {},
        // Could add Tree-sitter specific analysis here
        lines: content.split('\n').length,
        characters: content.length,
      };
    } catch (error) {
      throw new Error(`Tree-sitter parsing failed: ${error}`);
    }
  }

  /**
   * Fallback Tree-sitter analysis when Babel fails
   *
   * @param content - File content
   * @param language - Programming language
   * @param filePath - File path for context
   * @returns Promise that resolves to basic file analysis
   * @private
   */
  private async analyzeWithTreeSitterFallback(
    content: string,
    language: SupportedLanguage,
    filePath: string
  ): Promise<FileAnalysis> {
    if (this.treeSitterManager.hasParser(language)) {
      return this.analyzeWithTreeSitter(content, language, filePath);
    } else {
      return this.analyzeBasic(content, filePath, language);
    }
  }

  /**
   * General fallback analysis when primary parser fails
   *
   * @param content - File content
   * @param language - Programming language
   * @param filePath - File path for context
   * @returns Promise that resolves to basic file analysis
   * @private
   */
  private async analyzeWithFallback(
    content: string,
    language: SupportedLanguage,
    filePath: string
  ): Promise<FileAnalysis> {
    // Try Python parser if it's a Python file
    if (language === 'python') {
      try {
        return await this.analyzeWithPython(content, filePath);
      } catch (error) {
        console.warn(`Python parser fallback failed for ${filePath}:`, error);
      }
    }

    // Try Tree-sitter fallback
    if (this.treeSitterManager.hasParser(language)) {
      try {
        return await this.analyzeWithTreeSitter(content, language, filePath);
      } catch (error) {
        console.warn(`Tree-sitter fallback failed for ${filePath}:`, error);
      }
    }

    // Ultimate fallback to basic analysis
    return this.analyzeBasic(content, filePath, language);
  }

  /**
   * Basic analysis for unsupported languages or when parsers fail
   *
   * @param content - File content
   * @param filePath - File path for context
   * @param language - Detected language
   * @returns Promise that resolves to basic file metrics
   * @private
   */
  private async analyzeBasic(
    content: string,
    filePath: string,
    language: SupportedLanguage
  ): Promise<FileAnalysis> {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);

    return {
      path: filePath,
      language: language,
      imports: {},
      functions: {},
      classes: {},
      lines: lines.length,
      characters: content.length,
      non_empty_lines: nonEmptyLines.length,
      avg_line_length: content.length / lines.length,
    };
  }

  /**
   * Get analysis statistics for debugging and monitoring
   *
   * @returns Object with coordinator statistics
   */
  getStatistics() {
    return {
      initialized: this.initialized,
      treeSitterAvailable: this.treeSitterManager.getSupportedLanguages().length > 0,
      supportedLanguages: {
        babel: ['javascript', 'typescript'],
        python: ['python'],
        treeSitter: this.treeSitterManager.getSupportedLanguages(),
        deepAnalysis: this.languageDetector.getSupportedExtensions()
          .map(ext => this.languageDetector.detectByExtension(`test${ext}`))
          .filter((lang, index, self) => lang && this.languageDetector.supportsDeepAnalysis(lang) && self.indexOf(lang) === index),
      },
    };
  }
}
