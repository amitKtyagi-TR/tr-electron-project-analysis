/**
 * Complete Repository Analysis - Save to JSON
 *
 * Simplified version that analyzes repositories and saves results to JSON,
 * excluding test files by default.
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { analyzeRepository } from '../src/index.js';
import type { AnalysisResult } from '../src/types/index.js';

/**
 * Format analysis results as human-readable text
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
    output.push(`- Test files excluded: Yes`);
  }

  return output.join('\n');
}

/**
 * Analyze and save results to file (excluding test files by default)
 */
async function saveAnalysis(
  repositoryPath: string = '.',
  outputFile: string = 'codebase_analysis.json',
  excludeTests: boolean = true
): Promise<void> {
  console.log(`\n💾 Analyzing and saving: ${resolve(repositoryPath)}`);
  if (excludeTests) {
    console.log('   🚫 Excluding test files from analysis');
  }
  console.log('='.repeat(60));

  const results = await analyzeRepository(repositoryPath, {
    exclude_test_files: excludeTests,
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

// Simple CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const repositoryPath = args[1] || '.';
  const outputFile = args[2] || 'codebase_analysis.json';

  try {
    if (command === 'save') {
      await saveAnalysis(repositoryPath, outputFile);
    } else {
      console.error('❌ Unknown command. Use: tsx complete-analysis.ts save [path] [output.json]');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Analysis failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Export for programmatic use
export { saveAnalysis, formatAsText };

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
