/**
 * Framework Detection Engine
 *
 * This module analyzes code files and project structure to automatically detect
 * which frameworks are being used. It uses pattern matching and confidence scoring
 * to provide reliable framework identification.
 */

import type {
  FileAnalysis,
  FrameworkDetection,
  SupportedLanguage
} from '../types/index.js';

import {
  ALL_FRAMEWORK_SIGNATURES,
  type FrameworkSignature,
  type PatternDefinition
} from './pattern-definitions.js';

/**
 * Evidence for framework detection - tracks what patterns were matched
 */
interface DetectionEvidence {
  /** Files that provided evidence */
  files: string[];
  /** Patterns that were matched */
  matchedPatterns: Array<{
    patternId: string;
    filePath: string;
    weight: number;
    description: string;
  }>;
  /** Total confidence score */
  totalScore: number;
  /** Normalized confidence (0-1) */
  confidence: number;
}

/**
 * Framework detection engine
 *
 * Analyzes a collection of file analyses to detect which frameworks
 * are being used in the codebase with confidence scoring.
 */
export class FrameworkDetector {
  private debugMode: boolean;

  /**
   * Create a new framework detector
   *
   * @param debugMode - Enable debug logging for pattern matching
   */
  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Detect frameworks from analyzed files
   *
   * @param fileAnalyses - Map of file paths to their analysis results
   * @returns Array of detected frameworks with confidence scores
   */
  detectFrameworks(fileAnalyses: Map<string, FileAnalysis>): FrameworkDetection[] {
    if (this.debugMode) {
      console.log(`🔍 Starting framework detection on ${fileAnalyses.size} files`);
    }

    const frameworkEvidence = new Map<string, DetectionEvidence>();

    // Initialize evidence for all frameworks
    for (const signature of ALL_FRAMEWORK_SIGNATURES) {
      frameworkEvidence.set(signature.name, {
        files: [],
        matchedPatterns: [],
        totalScore: 0,
        confidence: 0
      });
    }

    // Analyze each file for framework patterns
    for (const [filePath, analysis] of fileAnalyses) {
      if (analysis.error) {
        continue; // Skip files with analysis errors
      }

      this.analyzeFileForFrameworks(filePath, analysis, frameworkEvidence);
    }

    // Calculate final confidence scores and filter results
    const detections: FrameworkDetection[] = [];

    for (const [frameworkName, evidence] of frameworkEvidence) {
      const signature = ALL_FRAMEWORK_SIGNATURES.find(sig => sig.name === frameworkName);
      if (!signature) continue;

      // Calculate normalized confidence score
      const maxPossibleScore = this.calculateMaxPossibleScore(signature, fileAnalyses);
      evidence.confidence = maxPossibleScore > 0 ? Math.min(evidence.totalScore / maxPossibleScore, 1.0) : 0;

      if (this.debugMode) {
        console.log(`📊 ${frameworkName}: ${evidence.totalScore}/${maxPossibleScore} = ${(evidence.confidence * 100).toFixed(1)}% (threshold: ${(signature.minConfidence * 100).toFixed(1)}%)`);
        if (evidence.matchedPatterns.length > 0) {
          console.log(`   Matched patterns: ${evidence.matchedPatterns.map(p => p.patternId).join(', ')}`);
        }
      }

      // Only include frameworks that meet minimum confidence threshold
      if (evidence.confidence >= signature.minConfidence) {
        detections.push({
          name: frameworkName,
          confidence: evidence.confidence,
          evidence_files: [...new Set(evidence.files)], // Remove duplicates
          patterns_matched: evidence.matchedPatterns.map(p => p.patternId)
        });
      }
    }

    // Sort by confidence (highest first)
    detections.sort((a, b) => b.confidence - a.confidence);

    if (this.debugMode) {
      console.log(`✅ Framework detection complete. Found ${detections.length} frameworks`);
    }

    return detections;
  }

  /**
   * Analyze a single file for framework patterns
   *
   * @param filePath - Path to the file being analyzed
   * @param analysis - File analysis result
   * @param frameworkEvidence - Evidence collection for all frameworks
   * @private
   */
  private analyzeFileForFrameworks(
    filePath: string,
    analysis: FileAnalysis,
    frameworkEvidence: Map<string, DetectionEvidence>
  ): void {
    for (const signature of ALL_FRAMEWORK_SIGNATURES) {
      const evidence = frameworkEvidence.get(signature.name);
      if (!evidence) continue;

      for (const pattern of signature.patterns) {
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
            console.log(`  ✓ ${signature.name}: ${pattern.id} in ${filePath} (+${pattern.weight})`);
          }
        }
      }
    }
  }

  /**
   * Check if a pattern matches against a file analysis
   *
   * @param filePath - Path to the file
   * @param analysis - File analysis result
   * @param pattern - Pattern to match
   * @returns True if pattern matches
   * @private
   */
  private matchesPattern(filePath: string, analysis: FileAnalysis, pattern: PatternDefinition): boolean {
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
          console.warn(`Unknown pattern type: ${pattern.type}`);
        }
        return false;
    }
  }

  /**
   * Match file name patterns
   * @private
   */
  private matchFileNamePattern(filePath: string, pattern: PatternDefinition): boolean {
    const regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern);
    return regex.test(filePath);
  }

  /**
   * Match import patterns
   * @private
   */
  private matchImportPattern(analysis: FileAnalysis, pattern: PatternDefinition): boolean {
    if (!analysis.imports) return false;

    const regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern);

    for (const moduleName of Object.keys(analysis.imports)) {
      if (regex.test(moduleName)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Match function call patterns
   * @private
   */
  private matchFunctionCallPattern(analysis: FileAnalysis, pattern: PatternDefinition): boolean {
    if (!analysis.functions) return false;

    const regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern);

    // Special handling for React hooks - check imports and state_changes
    if (pattern.id === 'use_state_hook' || pattern.id === 'use_effect_hook') {
      // Check if the hook is imported
      if (analysis.imports && analysis.imports['react']) {
        const reactImports = analysis.imports['react'];
        if (reactImports.includes('useState') && pattern.id === 'use_state_hook') {
          return true;
        }
        if (reactImports.includes('useEffect') && pattern.id === 'use_effect_hook') {
          return true;
        }
      }

      // Check if any function uses the hook in state_changes
      for (const functionInfo of Object.values(analysis.functions)) {
        if (functionInfo.state_changes) {
          for (const stateChange of functionInfo.state_changes) {
            if (regex.test(stateChange)) {
              return true;
            }
          }
        }
      }
    }

    // Check function names and signatures
    for (const functionSignature of Object.keys(analysis.functions)) {
      if (regex.test(functionSignature)) {
        return true;
      }
    }

    // Check if pattern relates to React components (capital letter functions)
    if (pattern.context === 'has_jsx' && (analysis.language === 'javascript' || analysis.language === 'typescript')) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        if (functionInfo.is_component && functionSignature.includes('(')) {
          const functionName = functionSignature.split('(')[0];
          if (functionName && regex.test(functionName)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Match class name patterns
   * @private
   */
  private matchClassNamePattern(analysis: FileAnalysis, pattern: PatternDefinition): boolean {
    if (!analysis.classes) return false;

    const regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern);

    for (const className of Object.keys(analysis.classes)) {
      if (regex.test(className)) {
        return true;
      }

      // Check base classes if context requires it
      if (pattern.context === 'extends' || pattern.context === 'extends_react' || pattern.context === 'django_models') {
        const classInfo = analysis.classes[className];
        if (classInfo && classInfo.base_classes) {
          for (const baseClass of classInfo.base_classes) {
            if (regex.test(baseClass)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Match decorator patterns
   * @private
   */
  private matchDecoratorPattern(analysis: FileAnalysis, pattern: PatternDefinition): boolean {
    const regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern);

    // Check function decorators
    if (analysis.functions) {
      for (const functionInfo of Object.values(analysis.functions)) {
        if (functionInfo.decorators) {
          for (const decorator of functionInfo.decorators) {
            if (regex.test(decorator.name)) {
              return true;
            }
          }
        }
      }
    }

    // Check class decorators
    if (analysis.classes) {
      for (const classInfo of Object.values(analysis.classes)) {
        if (classInfo.decorators) {
          for (const decorator of classInfo.decorators) {
            if (regex.test(decorator.name)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Match content patterns (requires reading file content)
   * @private
   */
  private matchContentPattern(analysis: FileAnalysis, pattern: PatternDefinition): boolean {
    // For now, we'll use a simplified approach since we don't have raw content
    // In a full implementation, this would analyze the raw file content

    // For JSX syntax, we can infer from the presence of React components
    if (pattern.id === 'jsx_syntax') {
      return analysis.language === 'javascript' || analysis.language === 'typescript';
    }

    return false;
  }

  /**
   * Calculate the maximum possible score for a framework given the available files
   * @private
   */
  private calculateMaxPossibleScore(signature: FrameworkSignature, fileAnalyses: Map<string, FileAnalysis>): number {
    let maxScore = 0;

    // Count files by language
    const languageCounts = new Map<SupportedLanguage, number>();
    for (const analysis of fileAnalyses.values()) {
      if (analysis.language && analysis.language !== 'unknown') {
        languageCounts.set(analysis.language, (languageCounts.get(analysis.language) || 0) + 1);
      }
    }

    // For each pattern, calculate if it could potentially match
    for (const pattern of signature.patterns) {
      let couldMatch = false;

      if (pattern.languages) {
        // Pattern applies to specific languages
        for (const lang of pattern.languages) {
          const fileCount = languageCounts.get(lang) || 0;
          if (fileCount > 0) {
            couldMatch = true;
            break;
          }
        }
      } else {
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
  }

  /**
   * Get detailed detection report for debugging
   *
   * @param fileAnalyses - Map of file analyses
   * @returns Detailed detection report
   */
  getDetectionReport(fileAnalyses: Map<string, FileAnalysis>): Record<string, any> {
    const oldDebugMode = this.debugMode;
    this.debugMode = true;

    const detections = this.detectFrameworks(fileAnalyses);

    this.debugMode = oldDebugMode;

    return {
      totalFiles: fileAnalyses.size,
      detectedFrameworks: detections,
      languageDistribution: this.getLanguageDistribution(fileAnalyses),
      supportedFrameworks: ALL_FRAMEWORK_SIGNATURES.map(sig => ({
        name: sig.name,
        minConfidence: sig.minConfidence,
        patternCount: sig.patterns.length,
        primaryLanguages: sig.primaryLanguages
      }))
    };
  }

  /**
   * Get language distribution from file analyses
   * @private
   */
  private getLanguageDistribution(fileAnalyses: Map<string, FileAnalysis>): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const analysis of fileAnalyses.values()) {
      if (analysis.language) {
        distribution[analysis.language] = (distribution[analysis.language] || 0) + 1;
      }
    }

    return distribution;
  }
}
