/**
 * Language Detection System
 *
 * This module provides intelligent programming language detection based on
 * file extensions, shebang lines, and content analysis heuristics.
 * It supports the languages used by our parsing infrastructure.
 */

import { readFile } from 'node:fs/promises';
import { extname, basename } from 'node:path';
import type { SupportedLanguage } from '../types/index.js';

/**
 * File extension to language mapping
 * Covers the most common extensions for supported languages
 */
const EXTENSION_MAP: Record<string, SupportedLanguage> = {
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
} as const;

/**
 * Shebang patterns for language detection
 */
const SHEBANG_PATTERNS: Array<{ pattern: RegExp; language: SupportedLanguage }> = [
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
const CONTENT_HEURISTICS: Array<{ patterns: RegExp[]; language: SupportedLanguage; weight: number }> = [
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
export class LanguageDetector {

  /**
   * Detect the programming language of a file
   *
   * @param filePath - Path to the file
   * @param content - Optional file content (if not provided, will try to read file)
   * @returns Detected language or 'unknown'
   */
  async detectLanguage(filePath: string, content?: string): Promise<SupportedLanguage> {
    // Strategy 1: Try extension-based detection first (fastest)
    const extensionResult = this.detectByExtension(filePath);
    if (extensionResult && extensionResult !== 'unknown') {
      // If we have a definitive match from extension, use it
      // But for ambiguous cases (like .m files), continue with content analysis
      if (this.isDefinitiveExtension(extname(filePath))) {
        return extensionResult;
      }
    }

    // Strategy 2: Content-based detection (requires file content)
    if (content !== undefined) {
      // Try shebang detection first
      const shebangResult = this.detectByShebang(content);
      if (shebangResult) {
        return shebangResult;
      }

      // Try content heuristics
      const contentResult = this.detectByContent(content);
      if (contentResult) {
        return contentResult;
      }
    }

    // Strategy 3: Fall back to extension result or unknown
    return extensionResult || 'unknown';
  }

  /**
   * Detect language by file extension
   *
   * @param filePath - File path or extension
   * @returns Detected language or null if not found
   */
  detectByExtension(filePath: string): SupportedLanguage | null {
    const extension = extname(filePath).toLowerCase();
    return EXTENSION_MAP[extension] || null;
  }

/**
   * Detect language by shebang line
   *
   * @param content - File content
   * @returns Detected language or null if no shebang match
   */
  detectByShebang(content: string): SupportedLanguage | null {
    const lines = content.split('\n');
    const firstLine = lines[0];

    if (!firstLine || !firstLine.startsWith('#!')) {
      return null;
    }

    for (const { pattern, language } of SHEBANG_PATTERNS) {
      if (pattern.test(firstLine)) {
        return language;
      }
    }

    return null;
  }

  /**
   * Detect language by content analysis using heuristics
   *
   * @param content - File content
   * @returns Detected language or null if no strong match
   */
  detectByContent(content: string): SupportedLanguage | null {
    const scores: Map<SupportedLanguage, number> = new Map();

    for (const { patterns, language, weight } of CONTENT_HEURISTICS) {
      let matches = 0;

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          matches++;
        }
      }

      if (matches > 0) {
        const score = matches * weight;
        scores.set(language, (scores.get(language) || 0) + score);
      }
    }

    if (scores.size === 0) {
      return null;
    }

    // Find the language with the highest score
    let bestLanguage: SupportedLanguage | null = null;
    let bestScore = 0;

    for (const [language, score] of scores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestLanguage = language;
      }
    }

    // Only return a result if we have a reasonable confidence
    return bestScore >= 2 ? bestLanguage : null;
  }

  /**
   * Check if a file extension provides definitive language identification
   *
   * @param extension - File extension
   * @returns True if extension is definitive (not ambiguous)
   * @private
   */
  private isDefinitiveExtension(extension: string): boolean {
    const definitiveExtensions = [
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
  }

  /**
   * Get all supported file extensions
   *
   * @returns Array of supported file extensions
   */
  getSupportedExtensions(): string[] {
    return Object.keys(EXTENSION_MAP);
  }

  /**
   * Check if a language is supported for deep analysis
   *
   * @param language - Language to check
   * @returns True if language supports deep analysis (has dedicated parser)
   */
  supportsDeepAnalysis(language: SupportedLanguage): boolean {
    const deepAnalysisLanguages: SupportedLanguage[] = [
      'javascript',
      'typescript',
      'python',
      'dart',
    ];

    return deepAnalysisLanguages.includes(language);
  }
}
