#!/usr/bin/env node
import { analyzeRepositoryToText } from './src/index.js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function runAnalysis() {
  try {
    // Get repo path from command line argument or environment
    const repoPath = process.argv[2] || process.env.REPO_PATH || process.cwd();
    const outputFile = process.argv[3] || process.env.OUTPUT_FILE || 'electron-test-output.txt';

    console.log(`🔍 Starting analysis of: ${repoPath}`);

    const options = {
      exclude_test_files: true,
      on_progress: (completed, total, current) => {
        console.log(`Progress: ${completed}/${total} - Analyzing ${current}`);
      }
    };

    // Call the function
    const flatText = await analyzeRepositoryToText(repoPath, options);

    // Save to file
    const outputPath = resolve(outputFile);
    writeFileSync(outputPath, flatText, 'utf8');

    console.log(`✅ Analysis completed successfully`);
    console.log(`📄 Output saved to: ${outputPath}`);
    console.log(`📏 Content length: ${flatText.length} characters`);

    // Also output to stdout for Electron to capture
    console.log('=== ANALYSIS_RESULT_START ===');
    console.log(flatText);
    console.log('=== ANALYSIS_RESULT_END ===');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

runAnalysis();
