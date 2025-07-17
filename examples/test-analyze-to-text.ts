
import { analyzeRepositoryToText } from '../src/index.js'; // Import the function from index.ts
import { writeFileSync } from 'fs'; // For saving output to a file
import { resolve } from 'path'; // For handling file paths

async function testAnalysis() {
  try {
    // Define the repository path (change this to your test repo if needed)
    const repoPath = '/Users/amitk/Development/GitHub/SOLARIUM-CPAPP'; // Example: your current project

    // Optional: Analysis options (matches your script's behavior, e.g., exclude tests)
    const options = {
      exclude_test_files: true, // Exclude test files, like in your scripts
      on_progress: (completed, total, current) => {
        console.log(`Progress: ${completed}/${total} - Analyzing ${current}`);
      }
    };

    console.log(`Starting analysis of: ${repoPath}`);

    // Call the function (this analyzes and converts to flat text in one step)
    const flatText = await analyzeRepositoryToText(repoPath, options);

    // Option 1: Log the flat text to console for quick check
    console.log('--- Flat Text Output ---');
    console.log(flatText);
    console.log('--- End of Output ---');

    // Option 2: Save to a file (like your scripts do)
    const outputFile = resolve('test_output.txt'); // Saves in project root as test_output.txt
    writeFileSync(outputFile, flatText, 'utf8');
    console.log(`
Saved flat text to: ${outputFile}`);

  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

// Run the test
testAnalysis();
