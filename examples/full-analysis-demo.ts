/**
 * Full Analysis Pipeline Demo
 *
 * This example demonstrates the complete code analysis pipeline using all components:
 * GitProcessor, FileProcessor, LanguageDetector, and AnalysisCoordinator working together
 * to analyze a real git repository.
 */

import {
  GitProcessor,
  FileProcessor,
  AnalysisCoordinator,
  type CoordinatorAnalysisResult
} from '../src/index.js';

/**
 * Statistics collector for analysis results
 */
class AnalysisStats {
  private results: Map<string, CoordinatorAnalysisResult> = new Map();

  addResult(filePath: string, result: CoordinatorAnalysisResult) {
    this.results.set(filePath, result);
  }

  getLanguageDistribution() {
    const distribution: Record<string, number> = {};
    for (const result of this.results.values()) {
      const lang = result.detectedLanguage;
      distribution[lang] = (distribution[lang] || 0) + 1;
    }
    return distribution;
  }

  getParserUsage() {
    const usage: Record<string, number> = {};
    for (const result of this.results.values()) {
      const parser = result.parser;
      usage[parser] = (usage[parser] || 0) + 1;
    }
    return usage;
  }

  getPerformanceStats() {
    const times = Array.from(this.results.values()).map(r => r.processingTime);
    return {
      totalFiles: times.length,
      totalTime: times.reduce((sum, time) => sum + time, 0),
      averageTime: times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
    };
  }

  getFallbackStats() {
    let fallbackCount = 0;
    let errorCount = 0;

    for (const result of this.results.values()) {
      if (result.usedFallback) fallbackCount++;
      if (result.parser === 'error') errorCount++;
    }

    return {
      fallbackCount,
      errorCount,
      successRate: ((this.results.size - errorCount) / this.results.size) * 100,
    };
  }

  getDetailedResults() {
    const detailedResults: Record<string, any> = {};

    for (const [filePath, result] of this.results) {
      const analysis = result.analysis;
      detailedResults[filePath] = {
        language: result.detectedLanguage,
        parser: result.parser,
        usedFallback: result.usedFallback,
        processingTime: result.processingTime,
        hasDocstrings: this.hasDocstrings(analysis),
        functionCount: Object.keys(analysis.functions || {}).length,
        classCount: Object.keys(analysis.classes || {}).length,
        importCount: Object.keys(analysis.imports || {}).length,
        linesOfCode: analysis.lines || 0,
        hasError: !!analysis.error,
      };
    }

    return detailedResults;
  }

  private hasDocstrings(analysis: any): boolean {
    const functions = Object.values(analysis.functions || {}) as any[];
    const classes = Object.values(analysis.classes || {}) as any[];

    return functions.some(f => f.docstring && f.docstring.trim()) ||
           classes.some(c => c.docstring && c.docstring.trim()) ||
           !!analysis.module_docstring;
  }
}

/**
 * Main demo function that orchestrates the complete analysis pipeline
 */
async function demonstrateFullAnalysis() {
  console.log('🚀 Full Code Analysis Pipeline Demo');
  console.log('===================================');

  try {
    // Step 1: Initialize all components
    console.log('\n🔧 Initializing Analysis Pipeline...');
    const gitProcessor = new GitProcessor('.');
    const fileProcessor = new FileProcessor('.');
    const coordinator = new AnalysisCoordinator();

    await coordinator.initialize();

    // Get coordinator statistics
    const coordinatorStats = coordinator.getStatistics();
    console.log('✅ AnalysisCoordinator initialized');
    console.log(`   📊 Babel support: ${coordinatorStats.supportedLanguages.babel.join(', ')}`);
    console.log(`   📊 Tree-sitter support: ${coordinatorStats.supportedLanguages.treeSitter.length} languages`);
    console.log(`   📊 Deep analysis support: ${coordinatorStats.supportedLanguages.deepAnalysis.join(', ')}`);

    // Step 2: Discover git-tracked files
    console.log('\n📁 Discovering Repository Files...');
    const isRepo = await gitProcessor.isGitRepository();
    if (!isRepo) {
      console.log('❌ Current directory is not a git repository');
      return;
    }

    const trackedFiles = await gitProcessor.getTrackedFiles();
    console.log(`✅ Found ${trackedFiles.length} git-tracked files`);

    // Filter to a reasonable subset for demo (focus on code files)
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.dart', '.java', '.cpp', '.c', '.rb', '.go', '.rs'];
    const codeFiles = trackedFiles.filter(file =>
      codeExtensions.some(ext => file.endsWith(ext))
    ).slice(0, 20); // Limit to first 20 code files for demo

    console.log(`📋 Analyzing ${codeFiles.length} code files (${codeExtensions.join(', ')})`);

    if (codeFiles.length === 0) {
      console.log('ℹ️  No code files found with supported extensions');
      console.log('   Analyzing first 10 files of any type...');
      const anyFiles = trackedFiles.slice(0, 10);
      codeFiles.push(...anyFiles);
    }

    // Step 3: Read files concurrently
    console.log('\n📖 Reading Files...');
    const stats = new AnalysisStats();
    let processedCount = 0;

    const fileContents = await fileProcessor.processFiles(
      codeFiles,
      async (content: string, filePath: string) => content, // Just return content
      {
        concurrencyLimit: 5,
        maxFileSize: 500 * 1024, // 500KB limit for demo
        onProgress: (completed, total, currentFile) => {
          if (completed % 5 === 0 || completed === total) {
            console.log(`   📊 Read ${completed}/${total} files${currentFile ? ` (${currentFile})` : ''}`);
          }
        }
      }
    );

    console.log(`✅ Successfully read ${fileContents.size} files`);

    // Step 4: Analyze files with the coordinator
    console.log('\n🔬 Analyzing Code Structure...');

    for (const [filePath, contentOrError] of fileContents) {
      if (contentOrError instanceof Error) {
        console.log(`   ⚠️  Skipping ${filePath}: ${contentOrError.message}`);
        continue;
      }

      try {
        const result = await coordinator.analyzeFile(filePath, contentOrError);
        stats.addResult(filePath, result);
        processedCount++;

        if (processedCount % 5 === 0) {
          console.log(`   🔍 Analyzed ${processedCount} files...`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to analyze ${filePath}: ${error}`);
      }
    }

    // Step 5: Generate comprehensive report
    console.log('\n📊 Analysis Results');
    console.log('==================');

    const languageDistribution = stats.getLanguageDistribution();
    const parserUsage = stats.getParserUsage();
    const performanceStats = stats.getPerformanceStats();
    const fallbackStats = stats.getFallbackStats();
    const detailedResults = stats.getDetailedResults();

    // Language distribution
    console.log('\n🗣️  Language Distribution:');
    Object.entries(languageDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([lang, count]) => {
        const percentage = ((count / performanceStats.totalFiles) * 100).toFixed(1);
        console.log(`   ${lang}: ${count} files (${percentage}%)`);
      });

    // Parser usage
    console.log('\n🔧 Parser Usage:');
    Object.entries(parserUsage)
      .sort(([,a], [,b]) => b - a)
      .forEach(([parser, count]) => {
        const percentage = ((count / performanceStats.totalFiles) * 100).toFixed(1);
        const icon = parser === 'babel' ? '⚛️' : parser === 'tree-sitter' ? '🌳' : parser === 'basic' ? '📄' : '❌';
        console.log(`   ${icon} ${parser}: ${count} files (${percentage}%)`);
      });

    // Performance metrics
    console.log('\n⚡ Performance Metrics:');
    console.log(`   Total files analyzed: ${performanceStats.totalFiles}`);
    console.log(`   Total processing time: ${performanceStats.totalTime}ms`);
    console.log(`   Average time per file: ${performanceStats.averageTime.toFixed(2)}ms`);
    console.log(`   Fastest file: ${performanceStats.minTime}ms`);
    console.log(`   Slowest file: ${performanceStats.maxTime}ms`);

    // Reliability metrics
    console.log('\n🎯 Reliability Metrics:');
    console.log(`   Success rate: ${fallbackStats.successRate.toFixed(1)}%`);
    console.log(`   Fallback usage: ${fallbackStats.fallbackCount} files`);
    console.log(`   Errors: ${fallbackStats.errorCount} files`);

    // Code quality insights
    console.log('\n📈 Code Quality Insights:');
    const filesWithDocstrings = Object.values(detailedResults).filter(f => f.hasDocstrings).length;
    const totalFunctions = Object.values(detailedResults).reduce((sum, f) => sum + f.functionCount, 0);
    const totalClasses = Object.values(detailedResults).reduce((sum, f) => sum + f.classCount, 0);
    const totalImports = Object.values(detailedResults).reduce((sum, f) => sum + f.importCount, 0);
    const totalLinesOfCode = Object.values(detailedResults).reduce((sum, f) => sum + f.linesOfCode, 0);

    console.log(`   Files with documentation: ${filesWithDocstrings}/${performanceStats.totalFiles} (${((filesWithDocstrings/performanceStats.totalFiles)*100).toFixed(1)}%)`);
    console.log(`   Total functions found: ${totalFunctions}`);
    console.log(`   Total classes found: ${totalClasses}`);
    console.log(`   Total import statements: ${totalImports}`);
    console.log(`   Total lines of code: ${totalLinesOfCode.toLocaleString()}`);

    // Show some example detailed results
    console.log('\n🔍 Sample File Analysis:');
    const interestingFiles = Object.entries(detailedResults)
      .filter(([, data]) => data.functionCount > 0 || data.classCount > 0)
      .slice(0, 3);

    if (interestingFiles.length > 0) {
      interestingFiles.forEach(([filePath, data]) => {
        console.log(`   📄 ${filePath}:`);
        console.log(`      Language: ${data.language} | Parser: ${data.parser}`);
        console.log(`      Functions: ${data.functionCount} | Classes: ${data.classCount} | Imports: ${data.importCount}`);
        console.log(`      Lines: ${data.linesOfCode} | Has docs: ${data.hasDocstrings ? 'Yes' : 'No'}`);
        console.log(`      Processing: ${data.processingTime}ms${data.usedFallback ? ' (fallback)' : ''}`);
      });
    } else {
      console.log('   No files with functions or classes found in sample');
    }

    console.log('\n✨ Full Analysis Pipeline Demo Complete!');
    console.log(`📋 Successfully analyzed ${performanceStats.totalFiles} files in ${performanceStats.totalTime}ms`);

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
demonstrateFullAnalysis();
