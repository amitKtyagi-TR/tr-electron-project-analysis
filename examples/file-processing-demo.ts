/**
 * File Processing Demo
 *
 * This example demonstrates using GitProcessor and FileProcessor together
 * to discover and read all files in a git repository with progress tracking.
 */

import { GitProcessor, FileProcessor } from '../src/index.js';

/**
 * Simple file analyzer that counts lines and characters
 */
async function analyzeFileContent(content: string, filePath: string) {
  const lines = content.split('\n');

  return {
    path: filePath,
    lines: lines.length,
    characters: content.length,
    nonEmptyLines: lines.filter(line => line.trim().length > 0).length,
    extension: filePath.split('.').pop() || 'none'
  };
}

/**
 * Demo function that processes current repository
 */
async function demonstrateFileProcessing() {
  console.log('🔍 File Processing Demo');
  console.log('=====================');

  try {
    // Step 1: Discover files with GitProcessor
    console.log('\n📁 Discovering git-tracked files...');
    const gitProcessor = new GitProcessor('.');

    const isRepo = await gitProcessor.isGitRepository();
    if (!isRepo) {
      console.log('❌ Current directory is not a git repository');
      return;
    }

    const trackedFiles = await gitProcessor.getTrackedFiles();
    console.log(`✅ Found ${trackedFiles.length} tracked files`);

    // Step 2: Process files with FileProcessor
    console.log('\n📖 Processing files with progress tracking...');
    const fileProcessor = new FileProcessor('.');

    let lastProgress = 0;
    const results = await fileProcessor.processFiles(
      trackedFiles.slice(0, 20), // Limit to first 20 files for demo
      analyzeFileContent,
      {
        concurrencyLimit: 5,
        maxFileSize: 500 * 1024, // 500KB limit for demo
        onProgress: (completed, total, currentFile) => {
          const progress = Math.round((completed / total) * 100);
          if (progress > lastProgress + 10) { // Show every 10%
            console.log(`  📊 Progress: ${progress}% (${completed}/${total}) - ${currentFile}`);
            lastProgress = progress;
          }
        }
      }
    );

    // Step 3: Analyze results
    console.log(`\n📈 Processing Results:`);
    console.log(`   Total files processed: ${results.size}`);

    let successCount = 0;
    let errorCount = 0;
    let totalLines = 0;
    let totalChars = 0;
    const extensionStats: Record<string, number> = {};

    for (const [filePath, result] of results) {
      if (result instanceof Error) {
        errorCount++;
        console.log(`   ❌ Error in ${filePath}: ${result.message}`);
      } else {
        successCount++;
        totalLines += result.lines;
        totalChars += result.characters;

        const ext = result.extension;
        extensionStats[ext] = (extensionStats[ext] || 0) + 1;
      }
    }

    console.log(`   ✅ Successfully processed: ${successCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    console.log(`   📄 Total lines: ${totalLines.toLocaleString()}`);
    console.log(`   🔤 Total characters: ${totalChars.toLocaleString()}`);

    console.log('\n📊 File Extensions:');
    Object.entries(extensionStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([ext, count]) => {
        console.log(`   .${ext}: ${count} files`);
      });

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
demonstrateFileProcessing();
