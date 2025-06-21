/**
 * Manual test for GitProcessor
 * This script tests GitProcessor against the current repository
 */

import { GitProcessor } from '../src/index.js';

async function testCurrentRepository() {
  console.log('Testing GitProcessor with current repository...');

  const processor = new GitProcessor('.');

  try {
    // Check if current directory is a git repository
    const isRepo = await processor.isGitRepository();
    console.log(`Is git repository: ${isRepo}`);

    if (isRepo) {
      // Get tracked files
      const files = await processor.getTrackedFiles();
      console.log(`Found ${files.length} tracked files:`);

      // Show first 10 files
      files.slice(0, 10).forEach(file => {
        console.log(`  - ${file}`);
      });

      if (files.length > 10) {
        console.log(`  ... and ${files.length - 10} more files`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testCurrentRepository();
