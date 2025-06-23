/**
 * JSON to Flat File-Based Format Converter
 *
 * This script takes analysis JSON output and converts it to a flat format
 * where file paths are keys and all file information is formatted as text.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Configuration for flat conversion
 */
interface FlatConfig {
  /** Whether to use abbreviated keys */
  useAbbreviations: boolean;
  /** Whether to skip empty values */
  skipEmpty: boolean;
  /** Whether to remove line numbers */
  removeLineNumbers: boolean;
  /** Separator between file entries */
  fileSeparator: string;
  /** Indent for file content */
  contentIndent: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: FlatConfig = {
  useAbbreviations: true,
  skipEmpty: true,
  removeLineNumbers: true,
  fileSeparator: '\n\n',
  contentIndent: '  '
};

/**
 * Key abbreviations map - universal across languages
 */
const KEY_ABBREVIATIONS: Record<string, string> = {
  'functions': 'fn',
  'classes': 'cls',
  'imports': 'imp',
  'methods': 'mth',
  'parameters': 'prm',
  'base_classes': 'bc',
  'decorators': 'dec',
  'is_async': 'async',
  'is_component': 'comp',
  'api_endpoints': 'api',
  'state_changes': 'states',
  'event_handlers': 'events',
  'language': 'lang',
  'docstring': 'doc',
  'variable': 'var',
  'handler': 'hdl',
  'mutation_type': 'mut',
  'frameworks': 'fw',
  'path': 'p',
  'type': 't'
};

/**
 * Keys to skip when removeLineNumbers is true
 */
const LINE_NUMBER_KEYS = [
  // Line numbers
  'line_number', 'line', 'ln', 'start_line', 'end_line',
  // File statistics (not code-related)
  'lines', 'characters', 'non_empty_lines', 'avg_line_length',
  'total_lines', 'blank_lines', 'comment_lines', 'code_lines',
  'file_size', 'bytes', 'word_count', 'char_count'
];
/**
 * Check if a value is empty
 */
function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * Format a value for output
 */
function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') {
    // Only quote if contains special characters
    if (value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    return value;
  }
  return JSON.stringify(value);
}

/**
 * Get abbreviated key if available
 */
function getKey(key: string, config: FlatConfig): string {
  if (config.useAbbreviations && KEY_ABBREVIATIONS[key]) {
    return KEY_ABBREVIATIONS[key];
  }
  return key;
}

/**
 * Should skip this key based on configuration
 */
function shouldSkipKey(key: string, config: FlatConfig): boolean {
  if (config.removeLineNumbers && LINE_NUMBER_KEYS.includes(key)) {
    return true;
  }
  return false;
}

/**
 * Format array values compactly
 */
function formatArray(arr: any[]): string {
  if (arr.length === 0) return '[]';

  // Check if all elements are simple
  const allSimple = arr.every(item =>
    typeof item === 'string' ||
    typeof item === 'number' ||
    typeof item === 'boolean' ||
    item === null
  );

  if (allSimple) {
    return `[${arr.map(formatValue).join(', ')}]`;
  }

  // For complex arrays, format each item on new line
  return arr.map((item, index) => {
    if (typeof item === 'object' && item !== null) {
      return `[${index}] ${formatObject(item, true)}`;
    }
    return `[${index}] ${formatValue(item)}`;
  }).join('\n    ');
}

/**
 * Format object as compact text
 */
function formatObject(obj: any, inline: boolean = false): string {
  if (obj === null || obj === undefined) return formatValue(obj);

  const parts: string[] = [];

  Object.entries(obj).forEach(([key, value]) => {
    if (shouldSkipKey(key, DEFAULT_CONFIG)) return;
    if (DEFAULT_CONFIG.skipEmpty && isEmpty(value)) return;

    const displayKey = getKey(key, DEFAULT_CONFIG);

    if (Array.isArray(value)) {
      if (value.length > 0) {
        parts.push(`${displayKey}:${formatArray(value)}`);
      }
    } else if (typeof value === 'object' && value !== null) {
      const objStr = formatObject(value, true);
      parts.push(`${displayKey}:{${objStr}}`);
    } else {
      parts.push(`${displayKey}:${formatValue(value)}`);
    }
  });

  return inline ? parts.join(', ') : parts.join('\n  ');
}

/**
 * Extract file information from the folder structure
 */
function extractFileInfo(data: any): Map<string, any> {
  const fileMap = new Map<string, any>();

  // Handle folder_structure format
  if (data.folder_structure) {
    const processFolder = (folderData: any, parentPath: string = '') => {
      Object.entries(folderData).forEach(([folderName, files]) => {
        if (Array.isArray(files)) {
          files.forEach((file: any) => {
            if (file.path) {
              fileMap.set(file.path, file);
            }
          });
        } else if (typeof files === 'object') {
          // Recursive folder
          processFolder(files, parentPath);
        }
      });
    };

    processFolder(data.folder_structure);
  }

  // Handle flat files format
  if (data.files) {
    Object.entries(data.files).forEach(([filePath, fileData]) => {
      fileMap.set(filePath, fileData);
    });
  }

  return fileMap;
}

/**
 * Format file content as text
 */
function formatFileContent(filePath: string, fileData: any, config: FlatConfig): string {
  const lines: string[] = [];
  const indent = config.contentIndent;

  // Skip the path key since it's redundant
  const skipKeys = ['path', 'p'];

  Object.entries(fileData).forEach(([key, value]) => {
    if (skipKeys.includes(key)) return;
    if (shouldSkipKey(key, config)) return;
    if (config.skipEmpty && isEmpty(value)) return;

    const displayKey = getKey(key, config);

    if (Array.isArray(value)) {
      if (value.length === 0) return;

      // Special handling for imports
      if (key === 'imports' || key === 'imp') {
        if (typeof value[0] === 'object') {
          // Format: {"django.db": ["models"], ...}
          const imports: string[] = [];
          Object.entries(value[0]).forEach(([module, items]) => {
            if (Array.isArray(items) && items.length > 0) {
              imports.push(`${module}:[${items.join(',')}]`);
            } else {
              imports.push(module);
            }
          });
          lines.push(`${indent}${displayKey}: ${imports.join(', ')}`);
        } else {
          // Simple array of imports
          lines.push(`${indent}${displayKey}: ${value.join(', ')}`);
        }
      } else {
        // Other arrays
        const formatted = formatArray(value);
        if (formatted.includes('\n')) {
          lines.push(`${indent}${displayKey}:`);
          lines.push(`${indent}  ${formatted.replace(/\n/g, '\n' + indent + '  ')}`);
        } else {
          lines.push(`${indent}${displayKey}: ${formatted}`);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      // Format objects more compactly
      const entries = Object.entries(value);
      if (entries.length === 0) return;

      // Special handling for different object types

      // Special handling for different object types
      if (key === 'classes' || key === 'cls') {
        lines.push(`${indent}${displayKey}:`);
        entries.forEach(([className, classData]: [string, any]) => {
          const baseClasses = classData.base_classes || classData.bc || [];
          const methods = classData.methods || classData.mth || [];
          const isComponent = classData.is_component || classData.comp;
          const docstring = classData.docstring || classData.doc;

          let classLine = `${indent}  ${className}`;
          if (baseClasses.length > 0) {
            classLine += `(${baseClasses.join(', ')})`;
          }
          if (isComponent) {
            classLine += ' [component]';
          }
          lines.push(classLine);

          // Add docstring if present
          if (docstring && !isEmpty(docstring)) {
            lines.push(`${indent}    doc: ${formatValue(docstring)}`);
          }

          if (methods.length > 0 || (typeof methods === 'object' && Object.keys(methods).length > 0)) {
            const methodNames = Array.isArray(methods) ? methods : Object.keys(methods);
            lines.push(`${indent}    mth: ${methodNames.join(', ')}`);
          }
        });
      } else if (key === 'functions' || key === 'fn') {
        lines.push(`${indent}${displayKey}:`);
        entries.forEach(([funcName, funcData]: [string, any]) => {
          const params = funcData.parameters || funcData.prm || [];
          const isAsync = funcData.is_async || funcData.async;
          const docstring = funcData.docstring || funcData.doc;

          let funcLine = `${indent}  ${isAsync ? 'async ' : ''}${funcName}`;
          if (params.length > 0) {
            const paramStr = Array.isArray(params) ? params.join(', ') : Object.keys(params).join(', ');
            funcLine += `(${paramStr})`;
          }
          lines.push(funcLine);

          // Add docstring if present
          if (docstring && !isEmpty(docstring)) {
            lines.push(`${indent}    doc: ${formatValue(docstring)}`);
          }
        });
      } else {
        // Generic object
        const objStr = formatObject(value);
        if (objStr.includes('\n')) {
          lines.push(`${indent}${displayKey}:`);
          lines.push(`${indent}  ${objStr.replace(/\n/g, '\n' + indent + '  ')}`);
        } else {
          lines.push(`${indent}${displayKey}: {${objStr}}`);
        }
      }
    } else {
      // Simple values
      lines.push(`${indent}${displayKey}: ${formatValue(value)}`);
    }
  });

  return lines.join('\n');
}

/**
 * Convert analysis JSON to flat file format
 */
function convertToFlatFormat(
  inputFile: string,
  outputFile: string,
  config: FlatConfig = DEFAULT_CONFIG
): void {
  try {
    console.log(`📊 Converting JSON to flat file format: ${inputFile}`);

    // Read input file
    const inputPath = resolve(inputFile);
    const rawData = readFileSync(inputPath, 'utf8');

    console.log(`📁 Input file size: ${(rawData.length / 1024).toFixed(1)} KB`);

    // Parse JSON
    const analysisData = JSON.parse(rawData);

    // Extract file information
    const fileMap = extractFileInfo(analysisData);

    // Build output
    const outputLines: string[] = [];

    // Sort files by path for consistent output
    const sortedPaths = Array.from(fileMap.keys()).sort();

    sortedPaths.forEach(filePath => {
      const fileData = fileMap.get(filePath);
      outputLines.push(`[${filePath}]`);
      const content = formatFileContent(filePath, fileData, config);
      if (content) {
        outputLines.push(content);
      }
    });

    // Add summary and metadata at the end
    if (analysisData.summary) {
      outputLines.push('\n[PROJECT_SUMMARY]');
      outputLines.push(formatFileContent('summary', analysisData.summary, config));
    }

    // if (analysisData.metadata) {
    //   outputLines.push('\n[PROJECT_METADATA]');
    //   outputLines.push(formatFileContent('metadata', analysisData.metadata, config));
    // }

    if (analysisData.dependencies) {
      outputLines.push('\n[FILE_DEPENDENCIES]');
      Object.entries(analysisData.dependencies).forEach(([file, deps]) => {
        if (Array.isArray(deps) && deps.length > 0) {
          outputLines.push(`  ${file}: ${deps.join(', ')}`);
        }
      });
    }

    const outputText = outputLines.join(config.fileSeparator);

    // Write output file
    const outputPath = resolve(outputFile);
    writeFileSync(outputPath, outputText, 'utf8');

    console.log(`✅ Flat format saved to: ${outputFile}`);
    console.log(`📁 Output file size: ${(outputText.length / 1024).toFixed(1)} KB`);
    console.log(`📉 Size reduction: ${(((rawData.length - outputText.length) / rawData.length) * 100).toFixed(1)}%`);
    console.log(`📄 Files processed: ${fileMap.size}`);

    // Show configuration used
    console.log(`\n⚙️  Configuration:`);
    console.log(`   Abbreviations: ${config.useAbbreviations ? 'enabled' : 'disabled'}`);
    console.log(`   Line numbers: ${config.removeLineNumbers ? 'removed' : 'kept'}`);
    console.log(`   Skip empty: ${config.skipEmpty ? 'enabled' : 'disabled'}`);

  } catch (error) {
    console.error('❌ Error converting to flat format:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Show conversion preview
 */
function showConversionPreview(inputFile: string, config: FlatConfig): void {
  try {
    const rawData = readFileSync(resolve(inputFile), 'utf8');
    const analysisData = JSON.parse(rawData);

    // Extract file information
    const fileMap = extractFileInfo(analysisData);
    const firstFiles = Array.from(fileMap.entries()).slice(0, 2);

    console.log(`📋 Conversion Preview for: ${inputFile}\n`);
    console.log(`Found ${fileMap.size} files\n`);

    firstFiles.forEach(([filePath, fileData]) => {
      console.log(`[${filePath}]`);
      const content = formatFileContent(filePath, fileData, config);
      console.log(content);
      console.log('');
    });

    console.log('... (showing first 2 files only)');

  } catch (error) {
    console.error('❌ Error creating preview:', error);
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
📊 JSON to Flat File Format Converter

Usage:
  tsx scripts/json-to-flat.ts <input.json> [output.txt]
  tsx scripts/json-to-flat.ts preview <input.json>

Examples:
  tsx scripts/json-to-flat.ts my_analysis.json project_flat.txt
  tsx scripts/json-to-flat.ts preview my_analysis.json

Features:
  - Converts nested JSON to flat file-based format
  - File paths as section headers
  - Reduces file size by 60-75%
  - Removes line numbers by default
  - Uses abbreviations for common keys
  - Preserves all essential information

Output Format:
  [path/to/file.py]
    lang: python
    imp: django.db:[models], rest_framework:[serializers]
    cls: UserModel(Model), ProfileSerializer(Serializer)
    fn: validate_user, create_profile
    api: GET:/users/, POST:/users/create/
    `);
    process.exit(1);
  }

  if (command === 'preview') {
    showConversionPreview(inputFile, DEFAULT_CONFIG);
  } else {
    const output = outputFile || inputFile.replace('.json', '_flat.txt');
    convertToFlatFormat(command === 'preview' ? args[1] : inputFile, output, DEFAULT_CONFIG);
  }
}

// Customizable configurations
export const VERBOSE_CONFIG: FlatConfig = {
  useAbbreviations: false,
  skipEmpty: false,
  removeLineNumbers: false,
  fileSeparator: '\n\n---\n\n',
  contentIndent: '    '
};

export const ULTRA_COMPACT_CONFIG: FlatConfig = {
  useAbbreviations: true,
  skipEmpty: true,
  removeLineNumbers: true,
  fileSeparator: '\n',
  contentIndent: ' '
};

// Export the main functions
export { convertToFlatFormat, showConversionPreview, FlatConfig, DEFAULT_CONFIG };

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
