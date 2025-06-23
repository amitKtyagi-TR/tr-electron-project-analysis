/**
 * Python Regex-Based Analyzer
 *
 * This module provides comprehensive Python code analysis using regex patterns.
 * It extracts functions, classes, imports, docstrings, and Django-specific patterns
 * including views, models, serializers, and decorators.
 */

import type {
  FileAnalysis,
  FunctionInfo,
  ClassInfo,
  SupportedLanguage,
  ApiEndpoint,
  Decorator,
  HttpMethod
} from '../types/index.js';

/**
 * Python regex patterns for code analysis
 */
const PYTHON_PATTERNS = {
  // Import patterns - improved to handle multi-line imports
  IMPORT: /^(?:\s*)import\s+(.+)$/gm,
  FROM_IMPORT: /^(?:\s*)from\s+(\S+)\s+import\s+((?:\s*\([^)]*\)|[^()]+))$/gms,

  // Function patterns
  FUNCTION_DEF: /^(\s*)def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*[^:]+)?\s*:(.*)$/gm,
  ASYNC_FUNCTION_DEF: /^(\s*)async\s+def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*[^:]+)?\s*:(.*)$/gm,

  // Class patterns
  CLASS_DEF: /^(\s*)class\s+(\w+)(?:\s*\(([^)]*)\))?\s*:(.*)$/gm,

  // Decorator patterns - improved to handle arguments
  DECORATOR: /^(\s*)@(\w+(?:\.\w+)?)(?:\s*\([^)]*\))?\s*$/gm,

  // Django specific patterns
  DJANGO_VIEW_CLASS: /class\s+(\w+)\s*\(\s*(?:.*(?:APIView|GenericAPIView|ListAPIView|CreateAPIView|RetrieveAPIView|UpdateAPIView|DestroyAPIView|ViewSet|ModelViewSet).*)\s*\)/g,
  DJANGO_MODEL_CLASS: /class\s+(\w+)\s*\(\s*(?:.*Model.*)\s*\)/g,
  DJANGO_SERIALIZER_CLASS: /class\s+(\w+)\s*\(\s*(?:.*Serializer.*)\s*\)/g,

  // API endpoint patterns
  API_VIEW_DECORATOR: /@api_view\s*\(\s*\[([^\]]+)\]\s*\)/g,
  EXTEND_SCHEMA: /@extend_schema\s*\(/g,

  // HTTP method patterns in classes
  HTTP_METHODS: /def\s+(get|post|put|patch|delete|head|options)\s*\(/gi,
};

/**
 * Python code analyzer using regex patterns
 *
 * This class provides comprehensive analysis of Python code, with special
 * support for Django patterns, REST API endpoints, and Python-specific constructs.
 */
export class PythonAnalyzer {

  /**
   * Analyze a Python file using regex patterns
   *
   * @param content - Python source code content
   * @param filePath - File path for context (used in error messages)
   * @returns Promise that resolves to detailed file analysis
   */
  async analyzePython(
    content: string,
    filePath: string = 'unknown'
  ): Promise<FileAnalysis> {
    try {
      // Initialize analysis result
      const analysis: FileAnalysis = {
        path: filePath,
        language: 'python' as SupportedLanguage,
        imports: {},
        functions: {},
        classes: {},
      };

      // Split content into lines for line-by-line analysis
      const lines = content.split('\n');

      // Extract all components
      this.extractImports(content, analysis);
      this.extractFunctions(content, lines, analysis);
      this.extractClasses(content, lines, analysis);

      // Add basic metrics
      analysis.lines = lines.length;
      analysis.characters = content.length;
      analysis.non_empty_lines = lines.filter(line => line.trim().length > 0).length;
      analysis.avg_line_length = content.length / lines.length;

      return analysis;

    } catch (error) {
      // Return error analysis if parsing fails
      return {
        path: filePath,
        language: 'python' as SupportedLanguage,
        imports: {},
        functions: {},
        classes: {},
        error: `Python analysis failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

/**
   * Extract import statements from Python code
   *
   * @param content - Source code content
   * @param analysis - Analysis result to update
   * @private
   */
  private extractImports(content: string, analysis: FileAnalysis): void {
    analysis.imports = {};

    // Clean content to handle multi-line imports properly
    const cleanContent = content.replace(/\\\n\s*/g, ' '); // Handle line continuations
    const lines = cleanContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i];
      if (!currentLine) continue;

      let line = currentLine.trim();
      if (!line || line.startsWith('#')) continue;

      // Handle multi-line imports with parentheses
      if ((line.startsWith('from ') && line.includes('import')) || line.startsWith('import ')) {
        // Check if this import spans multiple lines
        if (line.includes('(') && !line.includes(')')) {
          // Multi-line import - collect all lines until closing parenthesis
          let fullImport = line;
          let j = i + 1;
          while (j < lines.length && !fullImport.includes(')')) {
            const nextLine = lines[j];
            if (nextLine) {
              fullImport += ' ' + nextLine.trim();
            }
            j++;
          }
          line = fullImport;
          i = j - 1; // Skip processed lines
        }

        this.parseImportLine(line, analysis);
      }
    }
  }

  /**
   * Parse a single import line (which may be multi-line)
   *
   * @param importLine - Complete import statement
   * @param analysis - Analysis result to update
   * @private
   */
  private parseImportLine(importLine: string, analysis: FileAnalysis): void {
    // Ensure imports object exists
    if (!analysis.imports) {
      analysis.imports = {};
    }

    // Remove extra whitespace and parentheses
    const cleanLine = importLine.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();

    if (cleanLine.startsWith('from ')) {
      // from module import items
      const fromMatch = cleanLine.match(/from\s+(\S+)\s+import\s+(.+)/);
      if (fromMatch && fromMatch[1] && fromMatch[2]) {
        const module = fromMatch[1];
        const importItems = fromMatch[2]
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0 && item !== 'import'); // Filter out artifacts

        if (!analysis.imports[module]) {
          analysis.imports[module] = [];
        }
        analysis.imports[module].push(...importItems);
      }
    } else if (cleanLine.startsWith('import ')) {
      // import module
      const importMatch = cleanLine.match(/import\s+(.+)/);
      if (importMatch && importMatch[1]) {
        const modules = importMatch[1]
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);

        for (const module of modules) {
          const moduleName = module.split(' as ')[0]?.trim();
          if (moduleName) {
            if (!analysis.imports[moduleName]) {
              analysis.imports[moduleName] = [];
            }
            analysis.imports[moduleName].push(module);
          }
        }
      }
    }
  }

/**
   * Get accurate line number for a matched string in the source
   *
   * @param content - Full source content
   * @param matchedString - String that was matched
   * @returns Line number (1-based)
   * @private
   */
  private getLineNumberAccurate(content: string, matchedString: string): number {
    const beforeMatch = content.substring(0, content.indexOf(matchedString));
    return beforeMatch.split('\n').length;
  }

/**
   * Extract function definitions from Python code
   *
   * @param content - Source code content
   * @param lines - Source code split into lines
   * @param analysis - Analysis result to update
   * @private
   */
  private extractFunctions(content: string, lines: string[], analysis: FileAnalysis): void {
    analysis.functions = {};

    // Find all function definitions
    const functionMatches = [
      ...content.matchAll(PYTHON_PATTERNS.FUNCTION_DEF),
      ...content.matchAll(PYTHON_PATTERNS.ASYNC_FUNCTION_DEF)
    ];

    for (const match of functionMatches) {
      const fullMatch = match[0];
      const functionName = match[2];
      const params = match[3] || '';

      if (!fullMatch || !functionName) continue;

      const isAsync = fullMatch.includes('async def');

      // Calculate line number more accurately
      const lineNumber = this.getLineNumberAccurate(content, fullMatch);

      // Parse parameters
      const parameters = this.parseParameters(params);

      // Create function signature
      const funcSignature = `${functionName}(${parameters.join(', ')})`;

      // Find decorators before this function using the accurate line number
      const decorators = this.findDecoratorsBeforeFunction(lines, lineNumber);

      // Find docstring after function definition
      const docstring = this.findFunctionDocstring(lines, lineNumber);

      // Create function info with proper typing
      const functionInfo: FunctionInfo = {
        docstring: docstring,
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        is_async: isAsync,
        parameters: parameters,
        line_number: lineNumber,
      };

      // Add decorators if found
      if (decorators.length > 0) {
        functionInfo.decorators = decorators.map(name => ({ name }));
      }

      // Check for Django patterns and add API endpoints
      const apiEndpoints = this.extractAPIEndpoints(decorators, functionName, lineNumber);
      if (apiEndpoints.length > 0) {
        functionInfo.api_endpoints = apiEndpoints;
      }

      analysis.functions[funcSignature] = functionInfo;
    }
  }

  /**
   * Extract class definitions from Python code
   *
   * @param content - Source code content
   * @param lines - Source code split into lines
   * @param analysis - Analysis result to update
   * @private
   */
  private extractClasses(content: string, lines: string[], analysis: FileAnalysis): void {
    analysis.classes = {};

    const classMatches = content.matchAll(PYTHON_PATTERNS.CLASS_DEF);

    for (const match of classMatches) {
      const fullMatch = match[0];
      const className = match[2];
      const inheritance = match[3] || '';

      if (!fullMatch || !className) continue;

      // Calculate line number
      const lineNumber = this.getLineNumber(lines, fullMatch);

      // Parse base classes
      const baseClasses = this.parseBaseClasses(inheritance);

      // Find class docstring
      const docstring = this.findClassDocstring(lines, lineNumber);

      // Find decorators before this class
      const decoratorNames = this.findDecoratorsBeforeClass(lines, lineNumber);

      // Extract class methods
      const methods = this.extractClassMethods(content, lines, className, lineNumber);

      const classInfo: ClassInfo = {
        docstring: docstring,
        methods: methods,
        base_classes: baseClasses,
        line_number: lineNumber,
      };

      // Add decorators if found
      if (decoratorNames.length > 0) {
        classInfo.decorators = decoratorNames.map(name => ({ name }));
      }

      // Check for Django patterns - using is_component as a general marker
      if (this.isDjangoModel(baseClasses) ||
          this.isDjangoSerializer(baseClasses) ||
          this.isDjangoViewClass(baseClasses)) {
        classInfo.is_component = true;
      }

      analysis.classes[className] = classInfo;
    }
  }

  /**
   * Parse function parameters from parameter string
   *
   * @param paramString - Function parameter string
   * @returns Array of parameter names
   * @private
   */
  private parseParameters(paramString: string): string[] {
    if (!paramString.trim()) {
      return [];
    }

    return paramString
      .split(',')
      .map(param => param.trim())
      .map(param => {
        // Handle default values
        const defaultMatch = param.match(/^([^=]+)/);
        return defaultMatch && defaultMatch[1] ? defaultMatch[1].trim() : param;
      })
      .filter(param => param.length > 0);
  }

  /**
   * Parse base classes from inheritance string
   *
   * @param inheritanceString - Class inheritance string
   * @returns Array of base class names
   * @private
   */
  private parseBaseClasses(inheritanceString: string): string[] {
    if (!inheritanceString.trim()) {
      return [];
    }

    return inheritanceString
      .split(',')
      .map(cls => cls.trim())
      .filter(cls => cls.length > 0);
  }

/**
   * Find decorators before a function
   *
   * @param lines - Source code lines
   * @param functionLineNumber - Line number of the function
   * @returns Array of decorator names
   * @private
   */
  private findDecoratorsBeforeFunction(lines: string[], functionLineNumber: number): string[] {
    const decorators: string[] = [];

    // Look backwards from function line to find decorators
    // Start from the line before the function definition
    for (let i = functionLineNumber - 2; i >= 0; i--) {
      const line = lines[i];
      if (!line) continue;

      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('@')) {
        // Extract decorator name, handling both simple and complex forms
        const decoratorMatch = trimmedLine.match(/@(\w+(?:\.\w+)?)/);
        if (decoratorMatch && decoratorMatch[1]) {
          decorators.unshift(decoratorMatch[1]); // Add to beginning to maintain order
        }
      } else if (trimmedLine) {
        // Check if this is a continuation of a multi-line decorator
        const isMultiLineDecorator = trimmedLine.endsWith(',') ||
                                   trimmedLine.endsWith('(') ||
                                   trimmedLine.includes('=') ||
                                   trimmedLine.startsWith('(') ||
                                   trimmedLine.startsWith(')') ||
                                   trimmedLine.match(/^\s*[\w\[\]"',:=\s]+[,\)]?\s*$/);

        if (!isMultiLineDecorator && !trimmedLine.startsWith('#')) {
          // Non-decorator, non-comment, non-continuation line - stop looking
          break;
        }
      }
    }

    return decorators;
  }

  /**
   * Find decorators before a class
   *
   * @param lines - Source code lines
   * @param classLineNumber - Line number of the class
   * @returns Array of decorator names
   * @private
   */
  private findDecoratorsBeforeClass(lines: string[], classLineNumber: number): string[] {
    const decorators: string[] = [];

    // Look backwards from class line to find decorators
    for (let i = classLineNumber - 2; i >= 0; i--) {
      const line = lines[i];
      if (!line) continue;

      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('@')) {
        const decoratorMatch = trimmedLine.match(/@(\w+(?:\.\w+)?)/);
        if (decoratorMatch && decoratorMatch[1]) {
          decorators.unshift(decoratorMatch[1]);
        }
      } else if (trimmedLine && !trimmedLine.startsWith('#')) {
        break;
      }
    }

    return decorators;
  }

  /**
   * Find docstring for a function
   *
   * @param lines - Source code lines
   * @param functionLineNumber - Line number of the function
   * @returns Docstring content or empty string
   * @private
   */
  private findFunctionDocstring(lines: string[], functionLineNumber: number): string {
    // Look for docstring in the next few lines after function definition
    for (let i = functionLineNumber; i < Math.min(lines.length, functionLineNumber + 5); i++) {
      const line = lines[i];
      if (!line) continue;

      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('"""') || trimmedLine.startsWith("'''")) {
        return this.extractDocstring(lines, i);
      }
    }

    return '';
  }

  /**
   * Find docstring for a class
   *
   * @param lines - Source code lines
   * @param classLineNumber - Line number of the class
   * @returns Docstring content or empty string
   * @private
   */
  private findClassDocstring(lines: string[], classLineNumber: number): string {
    // Look for docstring in the next few lines after class definition
    for (let i = classLineNumber; i < Math.min(lines.length, classLineNumber + 5); i++) {
      const line = lines[i];
      if (!line) continue;

      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('"""') || trimmedLine.startsWith("'''")) {
        return this.extractDocstring(lines, i);
      }
    }

    return '';
  }

  /**
   * Extract docstring content from lines
   *
   * @param lines - Source code lines
   * @param startLine - Line where docstring starts
   * @returns Docstring content
   * @private
   */
  private extractDocstring(lines: string[], startLine: number): string {
    const line = lines[startLine];
    if (!line) return '';

    const startQuote = line.includes('"""') ? '"""' : "'''";
    let docstring = '';
    let inDocstring = true;

    // Handle single-line docstring
    const singleLineMatch = line.match(new RegExp(`${startQuote}(.*)${startQuote}`));
    if (singleLineMatch && singleLineMatch[1] !== undefined) {
      return singleLineMatch[1].trim();
    }

    // Multi-line docstring
    const startIndex = line.indexOf(startQuote);
    if (startIndex !== -1) {
      const firstLineContent = line.substring(startIndex + 3);
      if (firstLineContent.trim()) {
        docstring = firstLineContent.trim() + '\n';
      }
    }

    for (let i = startLine + 1; i < lines.length && inDocstring; i++) {
      const currentLine = lines[i];
      if (!currentLine) continue;

      if (currentLine.includes(startQuote)) {
        // End of docstring
        const endIndex = currentLine.indexOf(startQuote);
        const endContent = currentLine.substring(0, endIndex);
        if (endContent.trim()) {
          docstring += endContent.trim();
        }
        inDocstring = false;
      } else {
        docstring += currentLine.trim() + '\n';
      }
    }

    return docstring.trim();
  }

  /**
   * Extract methods from a class
   *
   * @param content - Source code content
   * @param lines - Source code lines
   * @param className - Name of the class
   * @param classLineNumber - Line number where class starts
   * @returns Object mapping method signatures to method info
   * @private
   */
  private extractClassMethods(
    content: string,
    lines: string[],
    className: string,
    classLineNumber: number
  ): Record<string, FunctionInfo> {
    const methods: Record<string, FunctionInfo> = {};
    const classEndLine = this.findClassEndLine(lines, classLineNumber);

    // Find all method definitions within the class
    const methodMatches = [
      ...content.matchAll(PYTHON_PATTERNS.FUNCTION_DEF),
      ...content.matchAll(PYTHON_PATTERNS.ASYNC_FUNCTION_DEF)
    ];

    for (const match of methodMatches) {
      const fullMatch = match[0];
      const methodName = match[2];
      const params = match[3] || '';

      if (!fullMatch || !methodName) continue;

      const methodLineNumber = this.getLineNumber(lines, fullMatch);

      // Check if this method is within our class bounds
      if (methodLineNumber > classLineNumber && methodLineNumber < classEndLine) {
        const isAsync = fullMatch.includes('async def');

        // Parse parameters
        const parameters = this.parseParameters(params);

        // Create method signature
        const methodSignature = `${methodName}(${parameters.join(', ')})`;

        // Find decorators and docstring
        const decoratorNames = this.findDecoratorsBeforeFunction(lines, methodLineNumber);
        const docstring = this.findFunctionDocstring(lines, methodLineNumber);

        const methodInfo: FunctionInfo = {
          docstring: docstring,
          state_changes: [],
          event_handlers: [],
          api_endpoints: [],
          is_async: isAsync,
          parameters: parameters,
          line_number: methodLineNumber,
        };

        // Add decorators if found
        if (decoratorNames.length > 0) {
          methodInfo.decorators = decoratorNames.map(name => ({ name }));
        }

        // Check for Django patterns and add API endpoints
        const apiEndpoints = this.extractAPIEndpoints(decoratorNames, methodName, methodLineNumber);
        if (apiEndpoints.length > 0) {
          methodInfo.api_endpoints = apiEndpoints;
        }

        methods[methodSignature] = methodInfo;
      }
    }

    return methods;
  }

  /**
   * Find the end line of a class definition
   *
   * @param lines - Source code lines
   * @param classLineNumber - Line number where class starts
   * @returns Line number where class ends
   * @private
   */
  private findClassEndLine(lines: string[], classLineNumber: number): number {
    const classLine = lines[classLineNumber - 1]; // Convert to 0-based index
    if (!classLine) return lines.length;

    const classIndentMatch = classLine.match(/^(\s*)/);
    const classIndent = classIndentMatch && classIndentMatch[1] ? classIndentMatch[1].length : 0;

    // Find the next line with same or less indentation (end of class)
    for (let i = classLineNumber; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      if (line.trim()) { // Non-empty line
        const lineIndentMatch = line.match(/^(\s*)/);
        const lineIndent = lineIndentMatch && lineIndentMatch[1] ? lineIndentMatch[1].length : 0;

        if (lineIndent <= classIndent) {
          return i + 1; // Convert back to 1-based line numbers
        }
      }
    }

    return lines.length;
  }

  /**
   * Get line number for a matched string in the source
   *
   * @param lines - Source code lines
   * @param matchedString - String that was matched
   * @returns Line number (1-based)
   * @private
   */
  private getLineNumber(lines: string[], matchedString: string): number {
    const searchString = matchedString.trim();
    const firstLine = searchString.split('\n')[0];
    if (!firstLine) return 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && (line.trim() === searchString || line.includes(firstLine))) {
        return i + 1; // Convert to 1-based line numbers
      }
    }

    return 1; // Default to line 1 if not found
  }

  /**
   * Check if class is a Django model
   *
   * @param baseClasses - Array of base class names
   * @returns True if this is a Django model
   * @private
   */
  private isDjangoModel(baseClasses: string[]): boolean {
    return baseClasses.some(cls => cls.includes('Model'));
  }

  /**
   * Check if class is a Django serializer
   *
   * @param baseClasses - Array of base class names
   * @returns True if this is a Django serializer
   * @private
   */
  private isDjangoSerializer(baseClasses: string[]): boolean {
    return baseClasses.some(cls => cls.includes('Serializer'));
  }

  /**
   * Check if class is a Django view class
   *
   * @param baseClasses - Array of base class names
   * @returns True if this is a Django view class
   * @private
   */
  private isDjangoViewClass(baseClasses: string[]): boolean {
    return baseClasses.some(cls =>
      cls.includes('APIView') ||
      cls.includes('GenericAPIView') ||
      cls.includes('ListAPIView') ||
      cls.includes('CreateAPIView') ||
      cls.includes('ViewSet')
    );
  }

  /**
   * Check if function name is an HTTP method
   *
   * @param functionName - Name of the function
   * @returns True if this is an HTTP method handler
   * @private
   */
  private isHTTPMethod(functionName: string): boolean {
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
    return httpMethods.includes(functionName.toLowerCase());
  }

  /**
   * Extract API endpoints from decorators and function context
   *
   * @param decorators - Array of decorator names
   * @param functionName - Name of the function
   * @param lineNumber - Line number of the function
   * @returns Array of API endpoint information
   * @private
   */
  private extractAPIEndpoints(decorators: string[], functionName: string, lineNumber: number): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];

    // Check for @api_view decorator with HTTP methods
    for (const decorator of decorators) {
      if (decorator.includes('api_view')) {
        endpoints.push({
          type: 'django_api_view',
          methods: 'Multiple',
          line: lineNumber
        });
      }

      if (decorator.includes('extend_schema')) {
        endpoints.push({
          type: 'django_documented_api',
          method: this.getHttpMethodFromFunction(functionName),
          line: lineNumber
        });
      }
    }

    // Check if it's an HTTP method handler
    if (this.isHTTPMethod(functionName)) {
      endpoints.push({
        type: 'django_http_method',
        method: functionName.toUpperCase() as HttpMethod,
        line: lineNumber
      });
    }

    return endpoints;
  }

  /**
   * Get HTTP method from function name
   *
   * @param functionName - Name of the function
   * @returns HTTP method or undefined
   * @private
   */
  private getHttpMethodFromFunction(functionName: string): HttpMethod | undefined {
    const method = functionName.toLowerCase();
    const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    const upperMethod = method.toUpperCase() as HttpMethod;

    return httpMethods.includes(upperMethod) ? upperMethod : undefined;
  }
}
