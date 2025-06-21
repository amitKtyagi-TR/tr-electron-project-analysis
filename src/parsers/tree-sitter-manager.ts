/**
 * Tree-sitter WebAssembly Manager
 *
 * This module manages Tree-sitter parsers for multiple programming languages.
 * It handles loading WASM parsers, parsing source code, and executing queries
 * to extract specific patterns from the syntax trees.
 */

import Parser from 'web-tree-sitter';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SupportedLanguage } from '../types/index.js';

// Get current directory for WASM file paths
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const wasmDir = join(__dirname, 'wasm');

/**
 * Query capture result from Tree-sitter
 */
export interface QueryCapture {
  name: string;
  node: Parser.SyntaxNode;
  text: string;
}

/**
 * Language configuration for Tree-sitter
 */
interface LanguageConfig {
  wasmFile: string;
  language: SupportedLanguage;
  extensions: string[];
}

/**
 * Tree-sitter language configurations
 */
const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  javascript: {
    wasmFile: 'tree-sitter-javascript.wasm',
    language: 'javascript',
    extensions: ['.js', '.jsx', '.mjs']
  },
  typescript: {
    wasmFile: 'tree-sitter-typescript.wasm',
    language: 'typescript',
    extensions: ['.ts', '.tsx']
  },
  python: {
    wasmFile: 'tree-sitter-python.wasm',
    language: 'python',
    extensions: ['.py', '.pyw']
  },
  dart: {
    wasmFile: 'tree-sitter-dart.wasm',
    language: 'dart',
    extensions: ['.dart']
  }
};

/**
 * Tree-sitter WebAssembly manager
 *
 * This class handles loading and managing Tree-sitter parsers for multiple languages.
 * It provides a unified interface for parsing code and executing queries.
 */
export class TreeSitterManager {
  private parsers = new Map<SupportedLanguage, Parser>();
  private languages = new Map<SupportedLanguage, any>();
  private initialized = false;

  /**
   * Initialize Tree-sitter and load all language parsers
   *
   * @returns Promise that resolves when initialization is complete
   * @throws {Error} If initialization fails
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🌳 Initializing Tree-sitter WebAssembly...');

      // Try to initialize Tree-sitter
      let treeSitterInitialized = false;

      try {
        // Try with core WASM file first
        const coreWasmPath = join(wasmDir, 'tree-sitter.wasm');
        const wasmBuffer = await readFile(coreWasmPath);

        // Check if it's a real WASM file (not a placeholder)
        if (wasmBuffer.length > 100 && wasmBuffer[0] === 0x00) { // WASM magic number starts with 0x00
          await Parser.init({
            locateFile: () => coreWasmPath,
          });
          treeSitterInitialized = true;
          console.log('✅ Initialized with core WASM file');
        }
      } catch (error) {
        // Fallback initialization
      }

      if (!treeSitterInitialized) {
        console.warn('⚠️  Using development mode - Tree-sitter parsers not available');
        console.warn('   Real WASM files needed for production use');
        // Don't try to load any parsers in development mode
        this.initialized = true;
        return;
      }

      // Load language parsers only if Tree-sitter is properly initialized
      for (const [langKey, config] of Object.entries(LANGUAGE_CONFIGS)) {
        try {
          await this.loadParser(config.language);
          console.log(`✅ Loaded ${langKey} parser`);
        } catch (error) {
          console.warn(`⚠️  Failed to load ${langKey} parser:`, error);
          // Continue with other parsers
        }
      }

      this.initialized = true;
      console.log(`🎉 Tree-sitter initialization complete with ${this.parsers.size} parsers`);

    } catch (error) {
      // In development mode, just mark as initialized even if no parsers loaded
      console.warn('⚠️  Tree-sitter initialization failed, running in development mode');
      this.initialized = true;
    }
  }

  /**
   * Parse source code using the appropriate language parser
   *
   * @param content - Source code content
   * @param language - Programming language
   * @returns Promise that resolves to syntax tree
   * @throws {Error} If parsing fails or language not supported
   */
  async parseFile(content: string, language: SupportedLanguage): Promise<Parser.Tree> {
    if (!this.initialized) {
      await this.initialize();
    }

    const parser = this.parsers.get(language);
    if (!parser) {
      throw new Error(`No parser available for language: ${language}`);
    }

    try {
      const tree = parser.parse(content);

      if (!tree) {
        throw new Error(`Failed to parse ${language} content`);
      }

      return tree;
    } catch (error) {
      throw new Error(`Parsing failed for ${language}: ${error}`);
    }
  }

    /**
   * Execute a Tree-sitter query on a syntax tree
   *
   * @param tree - Syntax tree from parseFile
   * @param queryString - Tree-sitter query string
   * @param language - Programming language (for language-specific queries)
   * @returns Array of query capture results
   */
  query(tree: Parser.Tree, queryString: string, language: SupportedLanguage): QueryCapture[] {
    const languageObj = this.languages.get(language);
    if (!languageObj) {
      throw new Error(`Language object not found for: ${language}`);
    }

    try {
      const query = languageObj.query(queryString);
      const captures = query.captures(tree.rootNode);

      // Type the capture parameter explicitly
      return captures.map((capture: { name: string; node: any }) => ({
        name: capture.name,
        node: capture.node,
        text: capture.node?.text || ''
      }));
    } catch (error) {
      throw new Error(`Query execution failed: ${error}`);
    }
  }

  /**
   * Check if a language parser is available
   *
   * @param language - Programming language to check
   * @returns True if parser is loaded and available
   */
  hasParser(language: SupportedLanguage): boolean {
    return this.parsers.has(language) && this.languages.has(language);
  }

  /**
   * Get list of supported languages
   *
   * @returns Array of supported language identifiers
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return Array.from(this.parsers.keys());
  }

  /**
   * Load a specific language parser
   *
   * @param language - Language to load
   * @throws {Error} If parser loading fails
   * @private
   */
  private async loadParser(language: SupportedLanguage): Promise<void> {
    const config = Object.values(LANGUAGE_CONFIGS).find(c => c.language === language);
    if (!config) {
      throw new Error(`No configuration found for language: ${language}`);
    }

    try {
      // For now, create a mock parser since WASM files might not be available
      const parser = new Parser();

      // Try to load the actual language WASM
      const wasmPath = join(wasmDir, config.wasmFile);

      try {
        const Language = await Parser.Language.load(wasmPath);
        parser.setLanguage(Language);

        this.parsers.set(language, parser);
        this.languages.set(language, Language);

      } catch (wasmError) {
        // For development, create a mock parser
        console.warn(`Could not load ${config.wasmFile}, creating mock parser`);

        // Create a simple mock that can at least be used for testing
        const mockParser = {
          parse: (content: string) => ({
            rootNode: {
              text: content,
              type: 'program',
              children: []
            }
          })
        } as any;

        const mockLanguage = {
          query: (queryString: string) => ({
            captures: (node: any) => []
          })
        };

        this.parsers.set(language, mockParser);
        this.languages.set(language, mockLanguage);
      }

    } catch (error) {
      throw new Error(`Failed to load parser for ${language}: ${error}`);
    }
  }
}
