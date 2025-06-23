/**
 * JSON Analysis Cleaner
 *
 * This script takes analysis JSON output and removes empty values and unwanted keys
 * to produce a cleaner, more readable output.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Configuration for cleaning the analysis JSON
 */
interface CleaningConfig {
  /** Keys to remove from all objects */
  removeKeys: string[];
  /** Whether to remove empty objects {} */
  removeEmptyObjects: boolean;
  /** Whether to remove empty arrays [] */
  removeEmptyArrays: boolean;
  /** Whether to remove empty strings "" */
  removeEmptyStrings: boolean;
  /** Whether to remove null values */
  removeNulls: boolean;
  /** Whether to remove undefined values */
  removeUndefined: boolean;
}

/**
 * Default cleaning configuration
 */
const DEFAULT_CONFIG: CleaningConfig = {
  // Keys to remove - add or remove items from this array as needed
  removeKeys: [
    'lines',
    'characters',
    'non_empty_lines',
    'avg_line_length',
    'extension',
    'error'  // Remove error keys unless they have actual errors
  ],
  removeEmptyObjects: true,
  removeEmptyArrays: true,
  removeEmptyStrings: true,
  removeNulls: true,
  removeUndefined: true
};

/**
 * Check if a value is considered "empty" based on configuration
 */
function isEmpty(value: any, config: CleaningConfig): boolean {
  if (value === null && config.removeNulls) return true;
  if (value === undefined && config.removeUndefined) return true;
  if (value === '' && config.removeEmptyStrings) return true;
  if (Array.isArray(value) && value.length === 0 && config.removeEmptyArrays) return true;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0 && config.removeEmptyObjects) return true;
  }
  return false;
}

/**
 * Recursively clean JSON object by removing empty values and unwanted keys
 */
function cleanJson(obj: any, config: CleaningConfig): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    // Clean array elements
    const cleanedArray = obj
      .map(item => cleanJson(item, config))
      .filter(item => !isEmpty(item, config));

    return cleanedArray.length === 0 && config.removeEmptyArrays ? undefined : cleanedArray;
  }

  if (typeof obj === 'object') {
    const cleanedObj: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Skip keys that are in the remove list
      if (config.removeKeys.includes(key)) {
        continue;
      }

      // Recursively clean the value
      const cleanedValue = cleanJson(value, config);

      // Only add if not empty
      if (!isEmpty(cleanedValue, config)) {
        cleanedObj[key] = cleanedValue;
      }
    }

    // Return undefined if object is empty after cleaning
    const keys = Object.keys(cleanedObj);
    if (keys.length === 0 && config.removeEmptyObjects) {
      return undefined;
    }

    return cleanedObj;
  }

  // Return primitive values as-is
  return obj;
}

/**
 * Clean analysis JSON file
 */
function cleanAnalysisFile(
  inputFile: string,
  outputFile: string,
  config: CleaningConfig = DEFAULT_CONFIG
): void {
  try {
    console.log(`🧹 Cleaning analysis file: ${inputFile}`);

    // Read input file
    const inputPath = resolve(inputFile);
    const rawData = readFileSync(inputPath, 'utf8');

    console.log(`📁 Input file size: ${(rawData.length / 1024).toFixed(1)} KB`);

    // Parse JSON
    const analysisData = JSON.parse(rawData);

    // Clean the JSON
    const cleanedData = cleanJson(analysisData, config);

    // Convert back to JSON string
    const cleanedJson = JSON.stringify(cleanedData, null, 2);

    // Write output file
    const outputPath = resolve(outputFile);
    writeFileSync(outputPath, cleanedJson, 'utf8');

    console.log(`✅ Cleaned analysis saved to: ${outputFile}`);
    console.log(`📁 Output file size: ${(cleanedJson.length / 1024).toFixed(1)} KB`);
    console.log(`📉 Size reduction: ${(((rawData.length - cleanedJson.length) / rawData.length) * 100).toFixed(1)}%`);

    // Show what was removed
    console.log(`\n🗑️  Removed keys: ${config.removeKeys.join(', ')}`);
    console.log(`🧽 Removed empty values: objects=${config.removeEmptyObjects}, arrays=${config.removeEmptyArrays}, strings=${config.removeEmptyStrings}`);

  } catch (error) {
    console.error('❌ Error cleaning analysis file:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Show statistics about what would be cleaned
 */
function showCleaningStats(inputFile: string, config: CleaningConfig): void {
  try {
    const rawData = readFileSync(resolve(inputFile), 'utf8');
    const analysisData = JSON.parse(rawData);

    let removedKeys = 0;
    let emptyObjects = 0;
    let emptyArrays = 0;
    let emptyStrings = 0;

    function countRemovals(obj: any): void {
      if (Array.isArray(obj)) {
        obj.forEach(item => countRemovals(item));
        if (obj.length === 0) emptyArrays++;
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          if (config.removeKeys.includes(key)) {
            removedKeys++;
          } else {
            countRemovals(value);
          }
        }
        if (Object.keys(obj).length === 0) emptyObjects++;
      } else if (obj === '') {
        emptyStrings++;
      }
    }

    countRemovals(analysisData);

    console.log(`📊 Cleaning Statistics for: ${inputFile}`);
    console.log(`   Keys to remove: ${removedKeys} instances`);
    console.log(`   Empty objects: ${emptyObjects}`);
    console.log(`   Empty arrays: ${emptyArrays}`);
    console.log(`   Empty strings: ${emptyStrings}`);

  } catch (error) {
    console.error('❌ Error analyzing file:', error);
  }
}

/**
 * Main CLI function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const inputFile = args[1];
  const outputFile = args[2];

  if (!inputFile) {
    console.log(`
🧹 JSON Analysis Cleaner

Usage:
  tsx scripts/clean-analysis.ts <input.json> [output.json]
  tsx scripts/clean-analysis.ts stats <input.json>

Examples:
  tsx scripts/clean-analysis.ts my_analysis.json project_analysis.txt
  tsx scripts/clean-analysis.ts stats my_analysis.json

Default removed keys: ${DEFAULT_CONFIG.removeKeys.join(', ')}
Edit the DEFAULT_CONFIG in this file to customize what gets removed.
    `);
    process.exit(1);
  }

  if (command === 'stats') {
    showCleaningStats(inputFile, DEFAULT_CONFIG);
  } else {
    const output = outputFile || inputFile.replace('.json', '_cleaned.json');
    cleanAnalysisFile(command === 'stats' ? args[1] : inputFile, output, DEFAULT_CONFIG);
  }
}

// Customizable configurations - modify these as needed
export const MINIMAL_CONFIG: CleaningConfig = {
  removeKeys: ['lines', 'characters', 'non_empty_lines', 'avg_line_length'],
  removeEmptyObjects: true,
  removeEmptyArrays: true,
  removeEmptyStrings: true,
  removeNulls: true,
  removeUndefined: true
};

export const AGGRESSIVE_CONFIG: CleaningConfig = {
  removeKeys: [
    'lines', 'characters', 'non_empty_lines', 'avg_line_length',
    'extension', 'error', 'language', 'line_number', 'processingTime'
  ],
  removeEmptyObjects: true,
  removeEmptyArrays: true,
  removeEmptyStrings: true,
  removeNulls: true,
  removeUndefined: true
};

export const CONSERVATIVE_CONFIG: CleaningConfig = {
  removeKeys: ['lines', 'characters', 'non_empty_lines', 'avg_line_length'],
  removeEmptyObjects: true,
  removeEmptyArrays: false,  // Keep empty arrays
  removeEmptyStrings: false, // Keep empty strings
  removeNulls: false,        // Keep nulls
  removeUndefined: true
};

// Export the main functions
export { cleanAnalysisFile, showCleaningStats, CleaningConfig, DEFAULT_CONFIG };

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
