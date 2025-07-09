/**
 * Test File Detection and Filtering Utilities
 * 
 * Comprehensive patterns to identify and filter test files across multiple
 * programming languages and testing frameworks.
 */

const testPatterns = [
  // Test file extensions
  /\.(test|spec|tests|specs)\.(js|jsx|ts|tsx|mjs|cjs|vue|svelte)$/i,
  
  // Test directories
  /\/(tests?|specs?|__tests?__|__specs?__|e2e|integration|unit|functional|acceptance|testing|cypress|playwright|features)(\/|$)/i,
  
  // Mock directories and files
  /\/__mocks__\//i,
  /\/(mocks?|stubs?|fakes?|fixtures?|test[_-]?data)(\/|$)/i,
  /\.(mock|mocks|stub|stubs|fake|fakes)\./i,
  
  // Language-specific patterns
  /[_\-\.]test\.(py|go|rb|java|cs|rs|php|swift|kt|c|cpp|cc|cxx)$/i,
  /[_\-\.]spec\.(py|rb|php|swift)$/i,
  /_(test|spec)\.(go|py|rb|rs)$/i,
  /(Test|Tests|Spec|Specs)\.(java|cs|php|swift|kt)$/i,
  
  // Configuration files
  /(jest|vitest|karma|protractor|cypress|playwright|mocha|jasmine|qunit)\.config\./i,
  /\.(test|spec)rc(\..*)?$/i,
  /^(conf|)test\.(py|js|ts)$/i,
  
  // Coverage files
  /\/(coverage|\.nyc_output|test[_-]?results?|test[_-]?reports?|htmlcov|lcov[_-]?report)(\/|$)/i,
  /\.(gcov|lcov|coverage)$/i,
  /coverage.*\.(json|xml|html|txt)$/i,
  
  // Snapshot files
  /\.(snap|snapshot)s?$/i,
  
  // Setup files
  /(setup|teardown|global)[_-]?(test|spec)s?\./i,
  /test[_-]?(setup|helper|utils|bootstrap)\./i,
  
  // Storybook
  /\.stor(y|ies)\.(js|jsx|ts|tsx)$/i,
  /\/(\.)?storybook(\/|$)/i,
  
  // Benchmark files
  /\.(bench|benchmark)\./i,
  /\/(benchmarks?|perf[_-]?tests?)(\/|$)/i,
  
  // Test utilities
  /test[_-]?(utils?|helpers?|factories?|builders?)\//i,
  
  // Other test frameworks
  /\/(qunit|jasmine|mocha|chai|sinon|enzyme)(\/|$)/i,
  
  // Misc test patterns
  /\.(feature|features)$/i,  // Cucumber
  /\.tst$/i,  // Generic test extension
  /example[_-]?tests?\//i,
  /sample[_-]?tests?\//i,
  
  // Prevent false positives with word boundaries
  /\btest\b.*\.(js|ts|jsx|tsx)$/i,  // Files with 'test' in name
  /\bspec\b.*\.(js|ts|jsx|tsx)$/i,  // Files with 'spec' in name
];

/**
 * Check if a file should be excluded from analysis
 * 
 * @param filePath - The file path to check
 * @returns true if the file should be excluded, false otherwise
 */
export function shouldExcludeFile(filePath: string): boolean {
  // First, check if it's a non-programming file we should keep
  const nonProgrammingExtensions = /\.(md|txt|rst|adoc|org|tex|doc|docx|pdf|markdown|text|asciidoc|textile|rdoc|pod|man|info|me|1st|readme|license|copying|authors|contributors|changelog|history|news|thanks|todo|bugs|install)$/i;
  
  if (nonProgrammingExtensions.test(filePath)) {
    return false; // Don't exclude documentation/text files
  }
  
  // Then check against test patterns
  return testPatterns.some(pattern => pattern.test(filePath));
}

/**
 * Filter out test files from an array of file paths
 * 
 * @param filePaths - Array of file paths to filter
 * @returns Array of file paths with test files removed
 */
export function filterTestFiles(filePaths: string[]): string[] {
  return filePaths.filter(filePath => !shouldExcludeFile(filePath));
}

/**
 * Get statistics about filtered files
 * 
 * @param originalFiles - Original array of files
 * @param filteredFiles - Filtered array of files
 * @returns Statistics object
 */
export function getFilterStats(originalFiles: string[], filteredFiles: string[]) {
  const excluded = originalFiles.length - filteredFiles.length;
  const excludedFiles = originalFiles.filter(file => shouldExcludeFile(file));
  
  return {
    original_count: originalFiles.length,
    filtered_count: filteredFiles.length,
    excluded_count: excluded,
    excluded_percentage: originalFiles.length > 0 ? (excluded / originalFiles.length * 100).toFixed(1) : '0',
    excluded_files: excludedFiles
  };
} 