/**
 * Babel AST Analyzer for JavaScript and TypeScript
 *
 * This module provides deep AST analysis for JavaScript and TypeScript files
 * using the Babel parser. It extracts comprehensive metadata including functions,
 * classes, imports, JSDoc comments, and framework-specific patterns.
 */
/**
 * Babel AST Analyzer for JavaScript and TypeScript
 *
 * This module provides deep AST analysis for JavaScript and TypeScript files
 * using the Babel parser. It extracts comprehensive metadata including functions,
 * classes, imports, JSDoc comments, and framework-specific patterns.
 */

import { parse, ParserOptions } from '@babel/parser';
import * as t from '@babel/types';
import type {
  FileAnalysis,
  FunctionInfo,
  ClassInfo,
  Decorator,
  SupportedLanguage
} from '../types/index.js';

/**
 * Babel parser configuration for different file types
 */
const PARSER_OPTIONS: Record<string, ParserOptions> = {
  javascript: {
    sourceType: 'module',
    allowImportExportEverywhere: true,
    plugins: [
      'jsx',
      'decorators-legacy',
      'classProperties',
      'functionBind',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'dynamicImport',
      'nullishCoalescingOperator',
      'optionalChaining',
    ],
  },
  typescript: {
    sourceType: 'module',
    allowImportExportEverywhere: true,
    plugins: [
      'typescript',
      'jsx',
      'decorators-legacy',
      'classProperties',
      'functionBind',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'dynamicImport',
      'nullishCoalescingOperator',
      'optionalChaining',
    ],
  },
};

/**
 * Babel-based analyzer for JavaScript and TypeScript files
 *
 * This class provides comprehensive AST analysis using Babel's robust parser,
 * extracting detailed information about code structure, patterns, and metadata.
 */
export class BabelAnalyzer {

  /**
   * Parse and analyze a JavaScript or TypeScript file
   *
   * @param content - Source code content
   * @param language - Programming language ('javascript' or 'typescript')
   * @param filePath - File path for context (used in error messages)
   * @returns Promise that resolves to detailed file analysis
   */
  async parseJavaScript(
      content: string,
      language: 'javascript' | 'typescript',
      filePath: string = 'unknown'
    ): Promise<FileAnalysis> {
      try {
        // Dynamically import traverse to handle ES module compatibility
        const traverseModule = await import('@babel/traverse') as any;
        const traverse = traverseModule.default || traverseModule;

        // Parse the code into an AST
        const parserOptions = PARSER_OPTIONS[language];
        const ast = parse(content, parserOptions);

        // Initialize analysis result
        const analysis: FileAnalysis = {
          path: filePath,
          language: language,
          imports: {},
          functions: {},
          classes: {},
        };

        // Extract JSDoc comments first (for later association)
        const jsdocComments = this.extractJSDocComments(ast, content);

        // Use Babel traverse to walk the AST
        traverse(ast, {
          // Import declarations
          ImportDeclaration: (path: any) => {
            this.processImportDeclaration(path, analysis);
          },

          // Function declarations
          FunctionDeclaration: (path: any) => {
            this.processFunctionDeclaration(path, analysis, jsdocComments);
          },

          // Arrow function expressions (assigned to variables)
          VariableDeclarator: (path: any) => {
            this.processVariableDeclarator(path, analysis, jsdocComments);
          },

          // Class declarations
          ClassDeclaration: (path: any) => {
            this.processClassDeclaration(path, analysis, jsdocComments);
          },

          // Method definitions (inside classes)
          ClassMethod: (path: any) => {
            this.processClassMethod(path, analysis, jsdocComments);
          },

          // Export declarations
          ExportNamedDeclaration: (path: any) => {
            this.processExportDeclaration(path, analysis);
          },

          ExportDefaultDeclaration: (path: any) => {
            this.processExportDeclaration(path, analysis);
          },
        });

        return analysis;

      } catch (error) {
        // Return error analysis if parsing fails
        return {
          path: filePath,
          language: language,
          imports: {},
          functions: {},
          classes: {},
          error: `Babel parsing failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }

/**
   * Extract JSDoc comments from the AST
   *
   * @param ast - Babel AST
   * @param content - Original source content
   * @returns Map of line numbers to JSDoc content
   * @private
   */
  private extractJSDocComments(ast: t.File, content: string): Map<number, string> {
    const jsdocMap = new Map<number, string>();

    if (!ast.comments) {
      return jsdocMap;
    }

    for (const comment of ast.comments) {
      if (comment.type === 'CommentBlock' && comment.value.startsWith('*')) {
        // This is a JSDoc comment
        const lines = comment.value.split('\n');
        const cleanedLines: string[] = [];

        for (let line of lines) {
          // Remove leading whitespace and asterisks
          line = line.replace(/^\s*\*\s?/, '').trim();
          if (line.length > 0) {
            cleanedLines.push(line);
          }
        }

        const cleanComment = cleanedLines.join('\n').trim();

        if (cleanComment) {
          // Store by the line where the comment ends (closer to the function)
          const commentEndLine = comment.loc?.end.line || 0;
          jsdocMap.set(commentEndLine, cleanComment);
        }
      }
    }

    return jsdocMap;
  }

  /**
   * Process import declarations
   *
   * @param path - Babel node path for import
   * @param analysis - Analysis result to update
   * @private
   */
  private processImportDeclaration(path: any, analysis: FileAnalysis): void {
    const importNode = path.node;
    const source = importNode.source.value;

    if (!analysis.imports) {
      analysis.imports = {};
    }

    if (!analysis.imports[source]) {
      analysis.imports[source] = [];
    }

    // Extract imported names
    for (const specifier of importNode.specifiers) {
      if (t.isImportDefaultSpecifier(specifier)) {
        analysis.imports[source].push(specifier.local.name);
      } else if (t.isImportSpecifier(specifier)) {
        const importedName = t.isIdentifier(specifier.imported)
          ? specifier.imported.name
          : specifier.imported.value;
        analysis.imports[source].push(importedName);
      } else if (t.isImportNamespaceSpecifier(specifier)) {
        analysis.imports[source].push(`* as ${specifier.local.name}`);
      }
    }
  }

  /**
   * Process function declarations
   *
   * @param path - Babel node path for function
   * @param analysis - Analysis result to update
   * @param jsdocComments - Map of JSDoc comments
   * @private
   */
  private processFunctionDeclaration(
    path: any,
    analysis: FileAnalysis,
    jsdocComments: Map<number, string>
  ): void {
    const funcNode = path.node;
    if (!funcNode.id) return; // Skip anonymous functions

    const funcName = funcNode.id.name;
    const params = funcNode.params.map((param: any) => this.getParamName(param));

    const funcSignature = `${funcName}(${params.join(', ')})`;

    // Find associated JSDoc comment
    const funcLine = funcNode.loc?.start.line || 0;
    const docstring = this.findNearestJSDoc(funcLine, jsdocComments);

    // Check if it's a React component (starts with uppercase)
    const isComponent = funcName[0] === funcName[0].toUpperCase();

    // Check if it's a React hook (starts with 'use')
    const isHook = funcName.startsWith('use');

    const functionInfo: FunctionInfo = {
      docstring: docstring,
      state_changes: [],
      event_handlers: [],
      api_endpoints: [],
      is_async: funcNode.async || false,
      parameters: params,
      line_number: funcLine,
    };

    if (isComponent) {
      functionInfo.is_component = true;
    }

    if (isHook) {
      functionInfo.is_hook = true;
    }

    if (!analysis.functions) {
      analysis.functions = {};
    }

    analysis.functions[funcSignature] = functionInfo;
  }

  /**
   * Process variable declarators (for arrow functions)
   *
   * @param path - Babel node path for variable declarator
   * @param analysis - Analysis result to update
   * @param jsdocComments - Map of JSDoc comments
   * @private
   */
  private processVariableDeclarator(
    path: any,
    analysis: FileAnalysis,
    jsdocComments: Map<number, string>
  ): void {
    const declarator = path.node;

    // Check if this is an arrow function
    if (!t.isArrowFunctionExpression(declarator.init) && !t.isFunctionExpression(declarator.init)) {
      return;
    }

    if (!t.isIdentifier(declarator.id)) {
      return;
    }

    const funcName = declarator.id.name;
    const funcNode = declarator.init;
    const params = funcNode.params.map((param: any) => this.getParamName(param));

    const funcSignature = `${funcName}(${params.join(', ')})`;

    // Find associated JSDoc comment
    const funcLine = declarator.loc?.start.line || 0;
    const docstring = this.findNearestJSDoc(funcLine, jsdocComments);

    // Check React patterns
    const isComponent = funcName[0] === funcName[0].toUpperCase();
    const isHook = funcName.startsWith('use');

    const functionInfo: FunctionInfo = {
      docstring: docstring,
      state_changes: [],
      event_handlers: [],
      api_endpoints: [],
      is_async: t.isArrowFunctionExpression(funcNode) ? funcNode.async : funcNode.async,
      parameters: params,
      line_number: funcLine,
    };

    if (isComponent) {
      functionInfo.is_component = true;
    }

    if (isHook) {
      functionInfo.is_hook = true;
    }

    if (!analysis.functions) {
      analysis.functions = {};
    }

    analysis.functions[funcSignature] = functionInfo;
  }

/**
   * Get parameter name from various parameter types
   *
   * @param param - Function parameter node
   * @returns Parameter name as string
   * @private
   */
  private getParamName(param: any): string {
    if (t.isIdentifier(param)) {
      return param.name;
    } else if (t.isObjectPattern(param)) {
      return '{ ... }'; // Simplified destructuring representation
    } else if (t.isArrayPattern(param)) {
      return '[ ... ]'; // Simplified array destructuring
    } else if (t.isRestElement(param)) {
      return `...${t.isIdentifier(param.argument) ? param.argument.name : 'rest'}`;
    } else if (t.isAssignmentPattern(param)) {
      return t.isIdentifier(param.left) ? param.left.name : 'param';
    }
    return 'param';
  }

/**
   * Find the nearest JSDoc comment before a given line
   *
   * @param line - Line number to search near
   * @param jsdocComments - Map of available JSDoc comments
   * @returns JSDoc content or empty string
   * @private
   */
  private findNearestJSDoc(line: number, jsdocComments: Map<number, string>): string {
    // Look for JSDoc comment within 3 lines before the function
    for (let i = line - 1; i >= Math.max(1, line - 3); i--) {
      if (jsdocComments.has(i)) {
        return jsdocComments.get(i) || '';
      }
    }

    // Also check the exact line (sometimes comments end on the same line)
    if (jsdocComments.has(line)) {
      return jsdocComments.get(line) || '';
    }

    return '';
  }

  /**
   * Process class declarations
   *
   * @param path - Babel node path for class
   * @param analysis - Analysis result to update
   * @param jsdocComments - Map of JSDoc comments
   * @private
   */
  private processClassDeclaration(
    path: any,
    analysis: FileAnalysis,
    jsdocComments: Map<number, string>
  ): void {
    const classNode = path.node;
    if (!classNode.id) return;

    const className = classNode.id.name;
    const classLine = classNode.loc?.start.line || 0;
    const docstring = this.findNearestJSDoc(classLine, jsdocComments);

    // Get base classes
    const baseClasses: string[] = [];
    if (classNode.superClass && t.isIdentifier(classNode.superClass)) {
      baseClasses.push(classNode.superClass.name);
    }

    const classInfo: ClassInfo = {
      docstring: docstring,
      methods: {},
      base_classes: baseClasses,
      line_number: classLine,
    };

    // Check if it's a React component
    const isComponent = baseClasses.some(base =>
      base.includes('Component') || base.includes('PureComponent')
    ) || className.endsWith('Component');

    if (isComponent) {
      classInfo.is_component = true;
    }

    if (!analysis.classes) {
      analysis.classes = {};
    }

    analysis.classes[className] = classInfo;
  }

  /**
   * Process class methods
   *
   * @param path - Babel node path for class method
   * @param analysis - Analysis result to update
   * @param jsdocComments - Map of JSDoc comments
   * @private
   */
  private processClassMethod(
    path: any,
    analysis: FileAnalysis,
    jsdocComments: Map<number, string>
  ): void {
    const methodNode = path.node;

    // Find the parent class
    const classPath = path.findParent((p: any) => t.isClassDeclaration(p.node));
    if (!classPath || !t.isClassDeclaration(classPath.node) || !classPath.node.id) {
      return;
    }

    const className = classPath.node.id.name;
    const methodName = t.isIdentifier(methodNode.key) ? methodNode.key.name : 'method';
    const params = methodNode.params.map((param: any) => this.getParamName(param));
    const methodSignature = `${methodName}(${params.join(', ')})`;

    const methodLine = methodNode.loc?.start.line || 0;
    const docstring = this.findNearestJSDoc(methodLine, jsdocComments);

    const methodInfo: FunctionInfo = {
      docstring: docstring,
      state_changes: [],
      event_handlers: [],
      api_endpoints: [],
      is_async: methodNode.async || false,
      parameters: params,
      line_number: methodLine,
    };

    // Initialize class if not exists
    if (!analysis.classes) {
      analysis.classes = {};
    }
    if (!analysis.classes[className]) {
      analysis.classes[className] = {
        docstring: '',
        methods: {},
      };
    }

    analysis.classes[className].methods[methodSignature] = methodInfo;
  }

  /**
   * Process export declarations
   *
   * @param path - Babel node path for export
   * @param analysis - Analysis result to update
   * @private
   */
  private processExportDeclaration(
    path: any,
    analysis: FileAnalysis
  ): void {
    // For now, we'll just track that exports exist
    // Could be expanded to track specific export information
    if (!analysis.imports) {
      analysis.imports = {};
    }

    // Mark that this file has exports
    if (!analysis.imports['__exports__']) {
      analysis.imports['__exports__'] = ['default'];
    }
  }
}
