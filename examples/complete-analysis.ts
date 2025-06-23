/**
 * Complete Repository Analysis - Replicates Python Jupyter Functionality
 *
 * This example provides the same functionality as the original Python implementation
 * with formatted text output and JSON export capabilities.
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { analyzeRepository } from '../src/index.js';
import type { AnalysisResult } from '../src/types/index.js';

/**
 * Format analysis results as human-readable text (matching Python output)
 */
function formatAsText(results: AnalysisResult, repositoryPath: string): string {
  const output: string[] = [];

  output.push(`# Repository Analysis: ${repositoryPath}`);
  output.push('');

  // Summary Statistics
  output.push('## Summary');
  output.push(`- Total Files: ${results.summary.total_files.toLocaleString()}`);
  output.push(`- Total Lines: ${results.summary.total_lines.toLocaleString()}`);
  output.push('');

  // Languages
  output.push('## Languages');
  const sortedLanguages = Object.entries(results.summary.languages)
    .sort(([,a], [,b]) => b - a);

  for (const [language, count] of sortedLanguages) {
    const percentage = ((count / results.summary.total_files) * 100).toFixed(1);
    output.push(`- ${language}: ${count} files (${percentage}%)`);
  }
  output.push('');

  // Frameworks (if detected)
  if (results.summary.frameworks && Object.keys(results.summary.frameworks).length > 0) {
    output.push('## Detected Frameworks');
    const sortedFrameworks = Object.entries(results.summary.frameworks)
      .sort(([,a], [,b]) => b - a);

    for (const [framework, confidence] of sortedFrameworks) {
      output.push(`- ${framework}: ${(confidence * 100).toFixed(1)}% confidence`);
    }
    output.push('');
  }

  // File Extensions
  output.push('## File Extensions');
  const sortedExtensions = Object.entries(results.summary.extensions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10); // Top 10 extensions

  for (const [extension, count] of sortedExtensions) {
    const ext = extension || '(no extension)';
    output.push(`- ${ext}: ${count} files`);
  }
  output.push('');

  // Folder Structure
  output.push('## Folder Structure');
  const folderCount = Object.keys(results.folder_structure).length;
  output.push(`- Total Folders: ${folderCount}`);

  const sortedFolders = Object.entries(results.folder_structure)
    .sort(([,a], [,b]) => b.length - a.length)
    .slice(0, 10); // Top 10 folders by file count

  for (const [folder, files] of sortedFolders) {
    const displayFolder = folder === 'root' ? '(root)' : folder;
    output.push(`- ${displayFolder}: ${files.length} files`);
  }
  output.push('');

  // Dependencies
  output.push('## Dependencies');
  const dependencyCount = Object.keys(results.dependencies).length;
  const totalDependencies = Object.values(results.dependencies)
    .reduce((sum, deps) => sum + deps.length, 0);

  output.push(`- Files with dependencies: ${dependencyCount}`);
  output.push(`- Total dependency relationships: ${totalDependencies}`);

  // External dependencies (packages)
  const externalDeps = new Map<string, number>();
  for (const deps of Object.values(results.dependencies)) {
    for (const dep of deps) {
      if (!results.dependencies[dep] && !dep.startsWith('.')) {
        externalDeps.set(dep, (externalDeps.get(dep) || 0) + 1);
      }
    }
  }

  if (externalDeps.size > 0) {
    output.push('');
    output.push('### Top External Dependencies');
    const sortedExternalDeps = Array.from(externalDeps.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20);

    for (const [dep, count] of sortedExternalDeps) {
      output.push(`- ${dep}: used in ${count} files`);
    }
  }

  // Pattern Detection Summary
  let patternCount = 0;
  let apiEndpointCount = 0;
  let statePatternCount = 0;
  let eventHandlerCount = 0;

  for (const files of Object.values(results.folder_structure)) {
    for (const file of files) {
      if (file.api_endpoints) {
        apiEndpointCount += file.api_endpoints.length;
        patternCount += file.api_endpoints.length;
      }
      if (file.state_changes) {
        statePatternCount += file.state_changes.length;
        patternCount += file.state_changes.length;
      }
      if (file.event_handlers) {
        eventHandlerCount += file.event_handlers.length;
        patternCount += file.event_handlers.length;
      }
    }
  }

  if (patternCount > 0) {
    output.push('');
    output.push('## Pattern Detection Summary');
    output.push(`- Total patterns detected: ${patternCount}`);
    if (apiEndpointCount > 0) {
      output.push(`- API endpoints: ${apiEndpointCount}`);
    }
    if (statePatternCount > 0) {
      output.push(`- State management patterns: ${statePatternCount}`);
    }
    if (eventHandlerCount > 0) {
      output.push(`- Event handlers: ${eventHandlerCount}`);
    }
  }

  // Analysis metadata
  output.push('');
  output.push('## Analysis Details');
  if (results.metadata) {
    output.push(`- Timestamp: ${results.metadata.timestamp}`);
    output.push(`- Duration: ${results.metadata.duration_ms.toLocaleString()}ms`);
    output.push(`- Engine Version: ${results.metadata.engine_version}`);
  }

  return output.join('\n');
}

/**
 * Analyze repository with progress display (matching Python quick_analyze)
 */
async function quickAnalyze(repositoryPath: string = '.', limit?: number): Promise<void> {
  console.log(`\n🔍 Quick Analysis: ${resolve(repositoryPath)}`);
  console.log('='.repeat(60));

  const results = await analyzeRepository(repositoryPath, {
    limit,
    on_progress: (completed, total, current) => {
      const percent = Math.round((completed / total) * 100);
      const bar = '█'.repeat(Math.round(percent / 5)) + '░'.repeat(20 - Math.round(percent / 5));
      process.stdout.write(`\r[${bar}] ${percent}% (${completed}/${total}) ${current || ''}`);
    }
  });

  console.log('\n'); // New line after progress bar
  const textOutput = formatAsText(results, repositoryPath);
  console.log(textOutput);
}

/**
 * Full analysis returning structured data (matching Python full_analyze)
 */
async function fullAnalyze(repositoryPath: string = '.'): Promise<AnalysisResult> {
  console.log(`\n📊 Full Analysis: ${resolve(repositoryPath)}`);
  console.log('='.repeat(60));

  const results = await analyzeRepository(repositoryPath, {
    on_progress: (completed, total, current) => {
      if (completed % 10 === 0 || completed === total) {
        console.log(`   Progress: ${completed}/${total} files processed`);
      }
    }
  });

  console.log(`✅ Analysis complete: ${results.summary.total_files} files analyzed`);
  return results;
}

/**
 * Analyze and save results to file (matching Python save_analysis)
 */
async function saveAnalysis(
  repositoryPath: string = '.',
  outputFile: string = 'codebase_analysis.json'
): Promise<void> {
  console.log(`\n💾 Analyzing and saving: ${resolve(repositoryPath)}`);
  console.log('='.repeat(60));

  const results = await analyzeRepository(repositoryPath, {
    on_progress: (completed, total, current) => {
      if (completed % 10 === 0 || completed === total) {
        console.log(`   Progress: ${completed}/${total} files processed`);
      }
    }
  });

  // Save JSON results
  const jsonOutput = JSON.stringify(results, null, 2);
  writeFileSync(outputFile, jsonOutput, 'utf8');

  // Also save formatted text report
  const textFile = outputFile.replace('.json', '_report.txt');
  const textOutput = formatAsText(results, repositoryPath);
  writeFileSync(textFile, textOutput, 'utf8');

  console.log(`✅ Analysis saved:`);
  console.log(`   JSON: ${resolve(outputFile)} (${(jsonOutput.length / 1024).toFixed(1)} KB)`);
  console.log(`   Report: ${resolve(textFile)} (${(textOutput.length / 1024).toFixed(1)} KB)`);
  console.log(`   Files analyzed: ${results.summary.total_files}`);
  console.log(`   Lines of code: ${results.summary.total_lines.toLocaleString()}`);
}

/**
 * Enhanced analysis with detailed pattern breakdown
 */
async function analyzeRepositoryEnhanced(repositoryPath: string, saveToFile: boolean = true): Promise<AnalysisResult> {
  console.log(`\n🚀 Enhanced Repository Analysis`);
  console.log('='.repeat(60));
  console.log(`Repository: ${resolve(repositoryPath)}`);

  const startTime = Date.now();

  const results = await analyzeRepository(repositoryPath, {
    on_progress: (completed, total, current) => {
      const percent = Math.round((completed / total) * 100);
      if (percent % 5 === 0 || completed === total) {
        console.log(`   [${percent.toString().padStart(3)}%] ${completed}/${total} - ${current || ''}`);
      }
    }
  });

  const analysisTime = Date.now() - startTime;

  // Display comprehensive results
  console.log('\n📈 Analysis Results:');
  console.log('='.repeat(40));

  console.log(`📁 Files: ${results.summary.total_files.toLocaleString()}`);
  console.log(`📏 Lines: ${results.summary.total_lines.toLocaleString()}`);
  console.log(`⏱️  Time: ${analysisTime.toLocaleString()}ms`);
  console.log(`🗂️  Folders: ${Object.keys(results.folder_structure).length}`);
  console.log(`🔗 Dependencies: ${Object.keys(results.dependencies).length} files`);

  // Language breakdown
  console.log('\n🌐 Languages:');
  Object.entries(results.summary.languages)
    .sort(([,a], [,b]) => b - a)
    .forEach(([lang, count]) => {
      const percent = ((count / results.summary.total_files) * 100).toFixed(1);
      console.log(`   ${lang}: ${count} files (${percent}%)`);
    });

  // Framework detection
  if (results.summary.frameworks && Object.keys(results.summary.frameworks).length > 0) {
    console.log('\n🏗️  Frameworks:');
    Object.entries(results.summary.frameworks)
      .sort(([,a], [,b]) => b - a)
      .forEach(([framework, confidence]) => {
        console.log(`   ${framework}: ${(confidence * 100).toFixed(1)}% confidence`);
      });
  }

  // Pattern summary
  let totalPatterns = 0;
  const patternTypes: Record<string, number> = {};

  for (const files of Object.values(results.folder_structure)) {
    for (const file of files) {
      if (file.api_endpoints) {
        totalPatterns += file.api_endpoints.length;
        patternTypes['API Endpoints'] = (patternTypes['API Endpoints'] || 0) + file.api_endpoints.length;
      }
      if (file.state_changes) {
        totalPatterns += file.state_changes.length;
        patternTypes['State Patterns'] = (patternTypes['State Patterns'] || 0) + file.state_changes.length;
      }
      if (file.event_handlers) {
        totalPatterns += file.event_handlers.length;
        patternTypes['Event Handlers'] = (patternTypes['Event Handlers'] || 0) + file.event_handlers.length;
      }
    }
  }

  if (totalPatterns > 0) {
    console.log('\n🎯 Patterns Detected:');
    console.log(`   Total: ${totalPatterns}`);
    Object.entries(patternTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  }

  if (saveToFile) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    await saveAnalysis(repositoryPath, `analysis_${timestamp}.json`);
  }

  return results;
}

// CLI Interface - Check command line arguments
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const repositoryPath = args[1] || '.';

  try {
    switch (command) {
      case 'quick':
        const limit = args[2] ? parseInt(args[2]) : undefined;
        await quickAnalyze(repositoryPath, limit);
        break;

      case 'full':
        const results = await fullAnalyze(repositoryPath);
        console.log('\n📋 Analysis Summary:');
        console.log(JSON.stringify({
          total_files: results.summary.total_files,
          total_lines: results.summary.total_lines,
          languages: results.summary.languages,
          frameworks: results.summary.frameworks
        }, null, 2));
        break;

      case 'save':
        const outputFile = args[2] || 'codebase_analysis.json';
        await saveAnalysis(repositoryPath, outputFile);
        break;

      case 'enhanced':
      default:
        await analyzeRepositoryEnhanced(repositoryPath, true);
        break;
    }
  } catch (error) {
    console.error('❌ Analysis failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Export functions for programmatic use
export {
  quickAnalyze,
  fullAnalyze,
  saveAnalysis,
  analyzeRepositoryEnhanced,
  formatAsText
};

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
