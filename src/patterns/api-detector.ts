/**
 * API Endpoint Detection Engine
 *
 * This module analyzes code files to detect REST API endpoints across different
 * frameworks including Express.js, NestJS, and Django. It extracts HTTP methods,
 * routes, parameters, and associates them with handler functions.
 */

import type {
  FileAnalysis,
  HttpMethod,
  ApiEndpoint,
  SupportedLanguage
} from '../types/index.js';

/**
 * Extended API endpoint information with additional metadata
 */
export interface DetailedApiEndpoint extends ApiEndpoint {
  /** Handler function name */
  handlerFunction?: string;
  /** Route parameters extracted from path */
  parameters?: Array<{
    name: string;
    type?: string;
    required?: boolean;
  }>;
  /** Framework that defines this endpoint */
  framework: string;
  /** Middleware or decorators applied */
  middleware?: string[];
  /** File where endpoint is defined */
  filePath: string;
}

/**
 * API detection statistics
 */
export interface ApiDetectionStats {
  /** Total endpoints found */
  totalEndpoints: number;
  /** Endpoints by HTTP method */
  methodDistribution: Record<HttpMethod, number>;
  /** Endpoints by framework */
  frameworkDistribution: Record<string, number>;
  /** Files containing endpoints */
  filesWithEndpoints: string[];
  /** Most common route patterns */
  commonPatterns: Array<{
    pattern: string;
    count: number;
  }>;
}

/**
 * API endpoint detection engine
 *
 * This class analyzes file analysis results to detect REST API endpoints
 * across multiple frameworks with detailed metadata extraction.
 */
export class ApiDetector {
  private debugMode: boolean;

  /**
   * Create a new API detector
   *
   * @param debugMode - Enable debug logging for endpoint detection
   */
  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Detect API endpoints from analyzed files
   *
   * @param fileAnalyses - Map of file paths to their analysis results
   * @returns Array of detected API endpoints with detailed information
   */
  detectEndpoints(fileAnalyses: Map<string, FileAnalysis>): DetailedApiEndpoint[] {
    if (this.debugMode) {
      console.log(`🔍 Starting API endpoint detection on ${fileAnalyses.size} files`);
    }

    const allEndpoints: DetailedApiEndpoint[] = [];

    for (const [filePath, analysis] of fileAnalyses) {
      if (analysis.error) {
        continue; // Skip files with analysis errors
      }

      const fileEndpoints = this.analyzeFileForEndpoints(filePath, analysis);
      allEndpoints.push(...fileEndpoints);

      if (this.debugMode && fileEndpoints.length > 0) {
        console.log(`  📄 ${filePath}: Found ${fileEndpoints.length} endpoints`);
      }
    }

    // Sort endpoints by file path and then by line number
    allEndpoints.sort((a, b) => {
      if (a.filePath !== b.filePath) {
        return a.filePath.localeCompare(b.filePath);
      }
      return a.line - b.line;
    });

    if (this.debugMode) {
      console.log(`✅ API detection complete. Found ${allEndpoints.length} total endpoints`);
    }

    return allEndpoints;
  }

  /**
   * Analyze a single file for API endpoints
   *
   * @param filePath - Path to the file being analyzed
   * @param analysis - File analysis result
   * @returns Array of endpoints found in this file
   * @private
   */
  private analyzeFileForEndpoints(filePath: string, analysis: FileAnalysis): DetailedApiEndpoint[] {
    const endpoints: DetailedApiEndpoint[] = [];

    // Detect endpoints based on language and patterns
    if (analysis.language === 'javascript' || analysis.language === 'typescript') {
      // Check for Express.js patterns
      endpoints.push(...this.detectExpressEndpoints(filePath, analysis));

      // Check for NestJS patterns
      endpoints.push(...this.detectNestJSEndpoints(filePath, analysis));
    } else if (analysis.language === 'python') {
      // Check for Django patterns
      endpoints.push(...this.detectDjangoEndpoints(filePath, analysis));
    }

    return endpoints;
  }

/**
   * Detect Express.js API endpoints
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns Express endpoints found
   * @private
   */
  private detectExpressEndpoints(filePath: string, analysis: FileAnalysis): DetailedApiEndpoint[] {
    const endpoints: DetailedApiEndpoint[] = [];

    // Check if this file uses Express
    if (!this.hasExpressImport(analysis)) {
      return endpoints;
    }

    if (this.debugMode) {
      console.log(`  🚂 Analyzing ${filePath} for Express endpoints`);
    }

    // Look for Express route patterns in functions
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        // Extract function name from signature
        const functionNameParts = functionSignature.split('(');
        const functionName = functionNameParts.length > 0 ? functionNameParts[0] : undefined;
        // Check API endpoints already detected by the analyzer
        if (functionInfo.api_endpoints) {
          for (const apiEndpoint of functionInfo.api_endpoints) {
            const expressEndpoint = this.parseExpressEndpoint(
              apiEndpoint,
              filePath,
              functionName,
              functionInfo.line_number || 0
            );
            if (expressEndpoint) {
              endpoints.push(expressEndpoint);
            }
          }
        }
      }
    }

    // Also check for Express endpoints that might be detected at file level
    if (analysis.api_endpoints) {
      for (const apiEndpoint of analysis.api_endpoints) {
        const expressEndpoint = this.parseExpressEndpoint(
          apiEndpoint,
          filePath,
          undefined,
          apiEndpoint.line
        );
        if (expressEndpoint) {
          endpoints.push(expressEndpoint);
        }
      }
    }

    // Manual pattern detection for routes not caught by analyzers
    endpoints.push(...this.detectExpressRoutePatterns(filePath, analysis));

    if (this.debugMode && endpoints.length > 0) {
      console.log(`    ✓ Found ${endpoints.length} Express endpoints`);
    }

    return endpoints;
  }

  /**
   * Check if file imports Express
   * @private
   */
  private hasExpressImport(analysis: FileAnalysis): boolean {
    if (!analysis.imports) return false;

    return Object.keys(analysis.imports).some(moduleName =>
      moduleName === 'express' || moduleName.includes('express')
    );
  }

  /**
   * Parse an API endpoint detected by the analyzer into Express format
   * @private
   */
  private parseExpressEndpoint(
    apiEndpoint: any,
    filePath: string,
    handlerFunction?: string,
    lineNumber: number = 0
  ): DetailedApiEndpoint | null {
    // Check if this is an Express-style endpoint
    if (!this.isExpressEndpoint(apiEndpoint)) {
      return null;
    }

    const method = this.extractHttpMethod(apiEndpoint);
    const route = this.extractRoute(apiEndpoint);

    if (!method || !route) {
      return null;
    }

    const parameters = this.extractRouteParameters(route);

    return {
      type: apiEndpoint.type || 'express_route',
      method: method,
      route: route,
      line: lineNumber || apiEndpoint.line || 0,
      framework: 'Express',
      filePath: filePath,
      handlerFunction: handlerFunction,
      parameters: parameters
    };
  }

  /**
   * Check if an API endpoint is Express-style
   * @private
   */
  private isExpressEndpoint(apiEndpoint: any): boolean {
    if (!apiEndpoint.type) return false;

    const expressTypes = [
      'express_route',
      'router_route',
      'express_get',
      'express_post',
      'express_put',
      'express_delete',
      'express_patch'
    ];

    return expressTypes.some(type => apiEndpoint.type.includes(type));
  }

  /**
   * Extract HTTP method from API endpoint
   * @private
   */
  private extractHttpMethod(apiEndpoint: any): HttpMethod | undefined {
    // Check explicit method field
    if (apiEndpoint.method) {
      const method = apiEndpoint.method.toUpperCase();
      if (this.isValidHttpMethod(method)) {
        return method as HttpMethod;
      }
    }

    // Infer from endpoint type
    const type = apiEndpoint.type.toLowerCase();
    if (type.includes('get')) return 'GET';
    if (type.includes('post')) return 'POST';
    if (type.includes('put')) return 'PUT';
    if (type.includes('delete')) return 'DELETE';
    if (type.includes('patch')) return 'PATCH';
    if (type.includes('head')) return 'HEAD';
    if (type.includes('options')) return 'OPTIONS';

    return undefined;
  }

  /**
   * Extract route from API endpoint
   * @private
   */
  private extractRoute(apiEndpoint: any): string | undefined {
    return apiEndpoint.route || apiEndpoint.path || apiEndpoint.url;
  }

  /**
   * Extract route parameters from a route pattern
   * @private
   */
  private extractRouteParameters(route: string): Array<{ name: string; type?: string; required?: boolean }> {
    const parameters: Array<{ name: string; type?: string; required?: boolean }> = [];

    // Express-style parameters (:param)
    const expressParams = route.match(/:([a-zA-Z0-9_]+)/g);
    if (expressParams) {
      for (const param of expressParams) {
        const name = param.substring(1); // Remove the ':'
        parameters.push({
          name: name,
          type: 'string',
          required: true
        });
      }
    }

    // Express wildcard parameters (*)
    const wildcardCount = (route.match(/\*/g) || []).length;
    for (let i = 0; i < wildcardCount; i++) {
      parameters.push({
        name: `wildcard${i}`,
        type: 'string',
        required: false
      });
    }

    return parameters;
  }

  /**
   * Check if a string is a valid HTTP method
   * @private
   */
  private isValidHttpMethod(method: string): boolean {
    const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    return validMethods.includes(method as HttpMethod);
  }

  /**
   * Detect Express route patterns manually (fallback method)
   * @private
   */
  private detectExpressRoutePatterns(filePath: string, analysis: FileAnalysis): DetailedApiEndpoint[] {
    const endpoints: DetailedApiEndpoint[] = [];

    // Look for common Express patterns in function names/signatures
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        // Check for route handler patterns in function names
        const routeHandlers = this.findRouteHandlerPatterns(functionSignature, functionInfo);
        for (const handler of routeHandlers) {
          endpoints.push({
            type: 'express_handler',
            method: handler.method,
            route: handler.route,
            line: functionInfo.line_number || 0,
            framework: 'Express',
            filePath: filePath,
            handlerFunction: functionSignature.split('(')[0] || 'unknown',
            parameters: this.extractRouteParameters(handler.route)
          });
        }
      }
    }

    return endpoints;
  }

/**
   * Find route handler patterns in function signatures
   * @private
   */
  private findRouteHandlerPatterns(functionSignature: string, functionInfo: any): Array<{ method: HttpMethod; route: string }> {
    const patterns: Array<{ method: HttpMethod; route: string }> = [];

    // Extract function name safely
    const functionNameParts = functionSignature.split('(');
    if (functionNameParts.length === 0 || !functionNameParts[0] || functionNameParts[0].trim() === '') {
      return patterns; // No valid function name found
    }

    const functionName = functionNameParts[0].toLowerCase();

    // Additional safety check to ensure functionName is valid
    if (!functionName || functionName.trim() === '') {
      return patterns;
    }

    // Common RESTful patterns
    const restPatterns = [
      { pattern: /^get([A-Z][a-zA-Z]*)/i, method: 'GET' as HttpMethod },
      { pattern: /^post([A-Z][a-zA-Z]*)/i, method: 'POST' as HttpMethod },
      { pattern: /^put([A-Z][a-zA-Z]*)/i, method: 'PUT' as HttpMethod },
      { pattern: /^delete([A-Z][a-zA-Z]*)/i, method: 'DELETE' as HttpMethod },
      { pattern: /^patch([A-Z][a-zA-Z]*)/i, method: 'PATCH' as HttpMethod },
      { pattern: /^create([A-Z][a-zA-Z]*)/i, method: 'POST' as HttpMethod },
      { pattern: /^update([A-Z][a-zA-Z]*)/i, method: 'PUT' as HttpMethod },
      { pattern: /^remove([A-Z][a-zA-Z]*)/i, method: 'DELETE' as HttpMethod }
    ];

    for (const { pattern, method } of restPatterns) {
            const match = functionName.match(pattern);
      if (match) {
        const resource = match[1] ? match[1].toLowerCase() : 'resource';
        const route = `/${resource}`;
        patterns.push({ method, route });
      }
    }

    return patterns;
  }

/**
   * Detect NestJS API endpoints
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns NestJS endpoints found
   * @private
   */
  private detectNestJSEndpoints(filePath: string, analysis: FileAnalysis): DetailedApiEndpoint[] {
    const endpoints: DetailedApiEndpoint[] = [];

    // Check if this file uses NestJS
    if (!this.hasNestJSImport(analysis)) {
      return endpoints;
    }

    if (this.debugMode) {
      console.log(`  🏰 Analyzing ${filePath} for NestJS endpoints`);
    }

    // Get controller prefix from class decorators
    const controllerPrefix = this.extractControllerPrefix(analysis);

    // Look for HTTP method decorators in functions
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0];

        // Check for NestJS HTTP decorators
        if (functionInfo.decorators) {
          for (const decorator of functionInfo.decorators) {
            const nestEndpoint = this.parseNestJSDecorator(
                        decorator,
                        filePath,
                        functionName || 'anonymous',
                        functionInfo.line_number || 0,
                        controllerPrefix
                        );
            if (nestEndpoint) {
              endpoints.push(nestEndpoint);
            }
          }
        }

        // Also check API endpoints detected by analyzer
        if (functionInfo.api_endpoints) {
          for (const apiEndpoint of functionInfo.api_endpoints) {
            const nestEndpoint = this.parseNestJSEndpoint(
                        apiEndpoint,
                        filePath,
                        functionName || 'anonymous',
                        functionInfo.line_number || 0,
                        controllerPrefix
                        );
            if (nestEndpoint) {
              endpoints.push(nestEndpoint);
            }
          }
        }
      }
    }

    // Check class-level endpoints
    if (analysis.classes) {
      for (const [className, classInfo] of Object.entries(analysis.classes)) {
        // Process methods in classes
        if (classInfo.methods) {
          for (const [methodSignature, methodInfo] of Object.entries(classInfo.methods)) {
            const methodName = methodSignature.split('(')[0];

            // Check method decorators
            if (methodInfo.decorators) {
              for (const decorator of methodInfo.decorators) {
                const nestEndpoint = this.parseNestJSDecorator(
                  decorator,
                  filePath,
                  `${className}.${methodName}`,
                  methodInfo.line_number || 0,
                  controllerPrefix
                );
                if (nestEndpoint) {
                  endpoints.push(nestEndpoint);
                }
              }
            }

            // Check method API endpoints
            if (methodInfo.api_endpoints) {
              for (const apiEndpoint of methodInfo.api_endpoints) {
                const nestEndpoint = this.parseNestJSEndpoint(
                  apiEndpoint,
                  filePath,
                  `${className}.${methodName}`,
                  methodInfo.line_number || 0,
                  controllerPrefix
                );
                if (nestEndpoint) {
                  endpoints.push(nestEndpoint);
                }
              }
            }
          }
        }
      }
    }

    if (this.debugMode && endpoints.length > 0) {
      console.log(`    ✓ Found ${endpoints.length} NestJS endpoints`);
    }

    return endpoints;
  }

  /**
   * Check if file imports NestJS
   * @private
   */
  private hasNestJSImport(analysis: FileAnalysis): boolean {
    if (!analysis.imports) return false;

    return Object.keys(analysis.imports).some(moduleName =>
      moduleName.startsWith('@nestjs/') || moduleName.includes('nestjs')
    );
  }

  /**
   * Extract controller prefix from @Controller decorator
   * @private
   */
  private extractControllerPrefix(analysis: FileAnalysis): string {
    if (!analysis.classes) return '';

    for (const classInfo of Object.values(analysis.classes)) {
      if (classInfo.decorators) {
        for (const decorator of classInfo.decorators) {
          if (decorator.name === 'Controller' || decorator.name.includes('Controller')) {
            // Extract the route prefix from decorator arguments
            if (decorator.arguments && decorator.arguments.length > 0 && decorator.arguments[0]) {
                        // Remove quotes from the argument
                        const prefix = decorator.arguments[0].replace(/['"]/g, '');
                        return prefix.startsWith('/') ? prefix : `/${prefix}`;
                        }
            return ''; // Controller with no prefix
          }
        }
      }
    }

    return '';
  }

  /**
   * Parse a NestJS decorator into an API endpoint
   * @private
   */
  private parseNestJSDecorator(
    decorator: any,
    filePath: string,
    handlerFunction: string,
    lineNumber: number,
    controllerPrefix: string
  ): DetailedApiEndpoint | null {
    const method = this.extractNestJSMethod(decorator);
    if (!method) return null;

    const route = this.extractNestJSRoute(decorator, controllerPrefix);
    const parameters = this.extractRouteParameters(route);

    return {
      type: `nestjs_${method.toLowerCase()}`,
      method: method,
      route: route,
      line: lineNumber,
      framework: 'NestJS',
      filePath: filePath,
      handlerFunction: handlerFunction,
      parameters: parameters,
      middleware: [`@${decorator.name}`]
    };
  }

  /**
   * Parse a NestJS API endpoint detected by analyzer
   * @private
   */
  private parseNestJSEndpoint(
    apiEndpoint: any,
    filePath: string,
    handlerFunction: string,
    lineNumber: number,
    controllerPrefix: string
  ): DetailedApiEndpoint | null {
    if (!this.isNestJSEndpoint(apiEndpoint)) {
      return null;
    }

    const method = this.extractHttpMethod(apiEndpoint);
    let route = this.extractRoute(apiEndpoint) || '/';

    // Combine with controller prefix
    if (controllerPrefix && !route.startsWith(controllerPrefix)) {
      route = controllerPrefix + (route.startsWith('/') ? route : `/${route}`);
    }

    const parameters = this.extractRouteParameters(route);

    return {
      type: apiEndpoint.type || 'nestjs_endpoint',
      method: method,
      route: route,
      line: lineNumber || apiEndpoint.line || 0,
      framework: 'NestJS',
      filePath: filePath,
      handlerFunction: handlerFunction,
      parameters: parameters
    };
  }

  /**
   * Check if an API endpoint is NestJS-style
   * @private
   */
  private isNestJSEndpoint(apiEndpoint: any): boolean {
    if (!apiEndpoint.type) return false;

    const nestTypes = [
      'nest_get',
      'nest_post',
      'nest_put',
      'nest_delete',
      'nest_patch',
      'get_endpoint',
      'post_endpoint',
      'put_endpoint',
      'delete_endpoint',
      'patch_endpoint'
    ];

    return nestTypes.some(type => apiEndpoint.type.includes(type));
  }

  /**
   * Extract HTTP method from NestJS decorator
   * @private
   */
  private extractNestJSMethod(decorator: any): HttpMethod | undefined {
    const decoratorName = decorator.name.toLowerCase();

    // Map decorator names to HTTP methods
    const methodMap: Record<string, HttpMethod> = {
      'get': 'GET',
      'post': 'POST',
      'put': 'PUT',
      'delete': 'DELETE',
      'patch': 'PATCH',
      'head': 'HEAD',
      'options': 'OPTIONS'
    };

    // Check exact decorator name
    if (methodMap[decoratorName]) {
      return methodMap[decoratorName];
    }

    // Check if decorator name contains method
    for (const [method, httpMethod] of Object.entries(methodMap)) {
      if (decoratorName.includes(method)) {
        return httpMethod;
      }
    }

    return undefined;
  }

  /**
   * Extract route from NestJS decorator
   * @private
   */
  private extractNestJSRoute(decorator: any, controllerPrefix: string): string {
    let route = '/';

    // Extract route from decorator arguments
    if (decorator.arguments && decorator.arguments.length > 0 && decorator.arguments[0]) {
        const routeArg = decorator.arguments[0].replace(/['"]/g, '');
        if (routeArg) {
        route = routeArg.startsWith('/') ? routeArg : `/${routeArg}`;
        }
    }

    // Combine with controller prefix
    if (controllerPrefix) {
      if (route === '/') {
        route = controllerPrefix;
      } else {
        route = controllerPrefix + (route.startsWith('/') ? route : `/${route}`);
      }
    }

    return route;
  }

/**
   * Detect Django API endpoints
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns Django endpoints found
   * @private
   */
  private detectDjangoEndpoints(filePath: string, analysis: FileAnalysis): DetailedApiEndpoint[] {
    const endpoints: DetailedApiEndpoint[] = [];

    // Check if this file uses Django
    if (!this.hasDjangoImport(analysis)) {
      return endpoints;
    }

    if (this.debugMode) {
      console.log(`  🎯 Analyzing ${filePath} for Django endpoints`);
    }

    // Check if this is a views.py file or contains view functions
    const isViewsFile = filePath.includes('views.py') || filePath.includes('views/');
    const isUrlsFile = filePath.includes('urls.py') || filePath.includes('urls/');

    if (isViewsFile) {
      endpoints.push(...this.detectDjangoViews(filePath, analysis));
    }

    if (isUrlsFile) {
      endpoints.push(...this.detectDjangoUrlPatterns(filePath, analysis));
    }

    // Look for Django REST framework patterns
    endpoints.push(...this.detectDjangoRestFramework(filePath, analysis));

    // Check functions for Django view decorators
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0];

        // Check for Django view decorators
        if (functionInfo.decorators) {
          for (const decorator of functionInfo.decorators) {
            const djangoEndpoint = this.parseDjangoDecorator(
              decorator,
              filePath,
              functionName || 'anonymous',
              functionInfo.line_number || 0
            );
            if (djangoEndpoint) {
              endpoints.push(djangoEndpoint);
            }
          }
        }

        // Check API endpoints detected by analyzer
        if (functionInfo.api_endpoints) {
          for (const apiEndpoint of functionInfo.api_endpoints) {
            const djangoEndpoint = this.parseDjangoEndpoint(
              apiEndpoint,
              filePath,
              functionName || 'anonymous',
              functionInfo.line_number || 0
            );
            if (djangoEndpoint) {
              endpoints.push(djangoEndpoint);
            }
          }
        }
      }
    }

    if (this.debugMode && endpoints.length > 0) {
      console.log(`    ✓ Found ${endpoints.length} Django endpoints`);
    }

    return endpoints;
  }

  /**
   * Check if file imports Django
   * @private
   */
  private hasDjangoImport(analysis: FileAnalysis): boolean {
    if (!analysis.imports) return false;

    return Object.keys(analysis.imports).some(moduleName =>
      moduleName.startsWith('django') ||
      moduleName.includes('django') ||
      moduleName === 'rest_framework' ||
      moduleName.startsWith('rest_framework')
    );
  }

  /**
   * Detect Django view functions
   * @private
   */
  private detectDjangoViews(filePath: string, analysis: FileAnalysis): DetailedApiEndpoint[] {
    const endpoints: DetailedApiEndpoint[] = [];

    if (!analysis.functions) return endpoints;

    // Look for function-based views
    for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
      const functionName = functionSignature.split('(')[0];

      // Check if function parameters suggest it's a view (request parameter)
      const hasRequestParam = functionInfo.parameters?.some(param =>
        param.toLowerCase().includes('request')
      );

      if (hasRequestParam) {
        // This looks like a Django view function
        endpoints.push({
          type: 'django_view',
          method: 'GET', // Default to GET, could be multiple methods
          route: this.inferDjangoRoute(functionName || 'unknown'),
          line: functionInfo.line_number || 0,
          framework: 'Django',
          filePath: filePath,
          handlerFunction: functionName || 'anonymous',
          parameters: []
        });
      }
    }

    // Look for class-based views
    if (analysis.classes) {
      for (const [className, classInfo] of Object.entries(analysis.classes)) {
        // Check if class extends Django view classes
        if (this.isDjangoViewClass(classInfo)) {
          const methods = this.extractDjangoViewMethods(classInfo);

          for (const method of methods) {
            endpoints.push({
              type: 'django_class_view',
              method: method,
              route: this.inferDjangoRoute(className),
              line: classInfo.line_number || 0,
              framework: 'Django',
              filePath: filePath,
              handlerFunction: className,
              parameters: []
            });
          }
        }
      }
    }

    return endpoints;
  }

  /**
   * Check if a class is a Django view class
   * @private
   */
  private isDjangoViewClass(classInfo: any): boolean {
    if (!classInfo.base_classes) return false;

    const djangoViewBaseClasses = [
      'View',
      'TemplateView',
      'ListView',
      'DetailView',
      'CreateView',
      'UpdateView',
      'DeleteView',
      'APIView',
      'GenericAPIView',
      'ListAPIView',
      'CreateAPIView',
      'RetrieveAPIView',
      'UpdateAPIView',
      'DestroyAPIView',
      'ListCreateAPIView',
      'RetrieveUpdateAPIView',
      'RetrieveDestroyAPIView',
      'RetrieveUpdateDestroyAPIView'
    ];

    return classInfo.base_classes.some((baseClass: string) =>
      djangoViewBaseClasses.some(djangoClass => baseClass.includes(djangoClass))
    );
  }

  /**
   * Extract HTTP methods from Django view class
   * @private
   */
  private extractDjangoViewMethods(classInfo: any): HttpMethod[] {
    const methods: HttpMethod[] = [];

    if (!classInfo.methods) return ['GET']; // Default to GET

    const httpMethods: Record<string, HttpMethod> = {
      'get': 'GET',
      'post': 'POST',
      'put': 'PUT',
      'patch': 'PATCH',
      'delete': 'DELETE',
      'head': 'HEAD',
      'options': 'OPTIONS'
    };

    for (const methodSignature of Object.keys(classInfo.methods)) {
        const methodName = methodSignature.split('(')[0]?.toLowerCase() || '';


      if (httpMethods[methodName]) {
        methods.push(httpMethods[methodName]);
      }
    }

    return methods.length > 0 ? methods : ['GET'];
  }

  /**
   * Detect Django URL patterns
   * @private
   */
  private detectDjangoUrlPatterns(filePath: string, analysis: FileAnalysis): DetailedApiEndpoint[] {
    const endpoints: DetailedApiEndpoint[] = [];

    // Look for URL pattern functions in urls.py files
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        // Look for functions that might define URL patterns
        if (functionSignature.includes('path') || functionSignature.includes('url')) {
          endpoints.push({
            type: 'django_url_pattern',
            method: 'GET', // URLs can handle multiple methods
            route: '/unknown/', // Would need content analysis to extract actual route
            line: functionInfo.line_number || 0,
            framework: 'Django',
            filePath: filePath,
            handlerFunction: functionSignature.split('(')[0] || 'anonymous',
            parameters: []
          });
        }
      }
    }

    return endpoints;
  }

  /**
   * Detect Django REST framework patterns
   * @private
   */
  private detectDjangoRestFramework(filePath: string, analysis: FileAnalysis): DetailedApiEndpoint[] {
    const endpoints: DetailedApiEndpoint[] = [];

    // Check for DRF imports
    const hasDRFImport = analysis.imports && Object.keys(analysis.imports).some(moduleName =>
      moduleName.includes('rest_framework') || moduleName.includes('serializers')
    );

    if (!hasDRFImport) return endpoints;

    // Look for DRF ViewSets and API Views
    if (analysis.classes) {
      for (const [className, classInfo] of Object.entries(analysis.classes)) {
        if (this.isDRFViewClass(classInfo)) {
          const methods = this.extractDRFMethods(classInfo);

          for (const method of methods) {
            endpoints.push({
              type: 'django_rest_framework',
              method: method,
              route: this.inferDjangoRoute(className),
              line: classInfo.line_number || 0,
              framework: 'Django REST Framework',
              filePath: filePath,
              handlerFunction: className,
              parameters: []
            });
          }
        }
      }
    }

    return endpoints;
  }

  /**
   * Check if a class is a Django REST Framework view class
   * @private
   */
  private isDRFViewClass(classInfo: any): boolean {
    if (!classInfo.base_classes) return false;

    const drfViewBaseClasses = [
      'APIView',
      'GenericAPIView',
      'ViewSet',
      'ModelViewSet',
      'ReadOnlyModelViewSet',
      'ListAPIView',
      'CreateAPIView',
      'RetrieveAPIView',
      'UpdateAPIView',
      'DestroyAPIView'
    ];

    return classInfo.base_classes.some((baseClass: string) =>
      drfViewBaseClasses.some(drfClass => baseClass.includes(drfClass))
    );
  }

  /**
   * Extract HTTP methods from DRF view class
   * @private
   */
  private extractDRFMethods(classInfo: any): HttpMethod[] {
    const methods: HttpMethod[] = [];

    if (!classInfo.methods) return ['GET']; // Default to GET

    // DRF action methods
    const drfMethods: Record<string, HttpMethod[]> = {
      'list': ['GET'],
      'create': ['POST'],
      'retrieve': ['GET'],
      'update': ['PUT'],
      'partial_update': ['PATCH'],
      'destroy': ['DELETE'],
      'get': ['GET'],
      'post': ['POST'],
      'put': ['PUT'],
      'patch': ['PATCH'],
      'delete': ['DELETE']
    };

    for (const methodSignature of Object.keys(classInfo.methods)) {
        const methodName = methodSignature.split('(')[0]?.toLowerCase() || '';

      if (drfMethods[methodName]) {
        methods.push(...drfMethods[methodName]);
      }
    }

    return methods.length > 0 ? [...new Set(methods)] : ['GET'];
  }

  /**
   * Parse a Django decorator into an API endpoint
   * @private
   */
  private parseDjangoDecorator(
    decorator: any,
    filePath: string,
    handlerFunction: string,
    lineNumber: number
  ): DetailedApiEndpoint | null {
    // Check for Django view decorators
    if (decorator.name === 'api_view' || decorator.name.includes('api_view')) {
      const methods = this.extractMethodsFromApiViewDecorator(decorator);

      // Return the first method found (in a full implementation, we'd return multiple endpoints)
      if (methods.length > 0) {
        return {
          type: 'django_api_view',
          method: methods[0],
          route: this.inferDjangoRoute(handlerFunction),
          line: lineNumber,
          framework: 'Django',
          filePath: filePath,
          handlerFunction: handlerFunction,
          parameters: [],
          middleware: [`@${decorator.name}`]
        };
      }
    }

    return null;
  }

  /**
   * Extract HTTP methods from @api_view decorator
   * @private
   */
  private extractMethodsFromApiViewDecorator(decorator: any): HttpMethod[] {
    const methods: HttpMethod[] = [];

    if (decorator.arguments && decorator.arguments.length > 0) {
      const methodArg = decorator.arguments[0];

      // Handle list format: ['GET', 'POST']
      if (methodArg.includes('[') && methodArg.includes(']')) {
        const methodList = methodArg.replace(/[\[\]'\"]/g, '').split(',');
        for (const method of methodList) {
          const cleanMethod = method.trim().toUpperCase();
          if (this.isValidHttpMethod(cleanMethod)) {
            methods.push(cleanMethod as HttpMethod);
          }
        }
      }
    }

    return methods.length > 0 ? methods : ['GET'];
  }

  /**
   * Parse a Django API endpoint detected by analyzer
   * @private
   */
  private parseDjangoEndpoint(
    apiEndpoint: any,
    filePath: string,
    handlerFunction: string,
    lineNumber: number
  ): DetailedApiEndpoint | null {
    if (!this.isDjangoEndpoint(apiEndpoint)) {
      return null;
    }

    const method = this.extractHttpMethod(apiEndpoint) || 'GET';
    const route = this.extractRoute(apiEndpoint) || this.inferDjangoRoute(handlerFunction);

    return {
      type: apiEndpoint.type || 'django_endpoint',
      method: method,
      route: route,
      line: lineNumber || apiEndpoint.line || 0,
      framework: 'Django',
      filePath: filePath,
      handlerFunction: handlerFunction,
      parameters: this.extractRouteParameters(route)
    };
  }

  /**
   * Check if an API endpoint is Django-style
   * @private
   */
  private isDjangoEndpoint(apiEndpoint: any): boolean {
    if (!apiEndpoint.type) return false;

    const djangoTypes = [
      'django_api_view',
      'django_path',
      'django_url',
      'django_view'
    ];

    return djangoTypes.some(type => apiEndpoint.type.includes(type));
  }

  /**
   * Infer Django route from function/class name
   * @private
   */
  private inferDjangoRoute(name: string): string {
    // Convert CamelCase or function names to URL-friendly format
    const route = name
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
      .replace(/view$/, '')
      .replace(/api$/, '')
      .replace(/_/g, '-');

    return `/${route}/`;
  }

  /**
   * Generate API detection statistics
   *
   * @param endpoints - Array of detected endpoints
   * @returns Statistical summary of API detection
   */
  getDetectionStats(endpoints: DetailedApiEndpoint[]): ApiDetectionStats {
    const methodDistribution: Record<HttpMethod, number> = {
      'GET': 0,
      'POST': 0,
      'PUT': 0,
      'DELETE': 0,
      'PATCH': 0,
      'HEAD': 0,
      'OPTIONS': 0
    };

    const frameworkDistribution: Record<string, number> = {};
    const filesWithEndpoints = new Set<string>();
    const routePatterns: Record<string, number> = {};

    for (const endpoint of endpoints) {
      // Count by HTTP method
      if (endpoint.method) {
        methodDistribution[endpoint.method]++;
      }

      // Count by framework
      frameworkDistribution[endpoint.framework] =
        (frameworkDistribution[endpoint.framework] || 0) + 1;

      // Track files with endpoints
      filesWithEndpoints.add(endpoint.filePath);

      // Count route patterns
      if (endpoint.route) {
        // Normalize route pattern (replace parameters with placeholder)
        const normalizedRoute = endpoint.route
          .replace(/:[a-zA-Z0-9_]+/g, ':param')  // Express parameters
          .replace(/\{[a-zA-Z0-9_]+\}/g, '{param}')  // NestJS/Django parameters
          .replace(/<[^>]+>/g, '<param>');  // Django parameters

        routePatterns[normalizedRoute] = (routePatterns[normalizedRoute] || 0) + 1;
      }
    }

    // Get most common patterns
    const commonPatterns = Object.entries(routePatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }));

    return {
      totalEndpoints: endpoints.length,
      methodDistribution,
      frameworkDistribution,
      filesWithEndpoints: Array.from(filesWithEndpoints),
      commonPatterns
    };
  }

  /**
   * Get detailed detection report for debugging
   *
   * @param fileAnalyses - Map of file analyses
   * @returns Detailed detection report
   */
  getDetectionReport(fileAnalyses: Map<string, FileAnalysis>): Record<string, any> {
    const oldDebugMode = this.debugMode;
    this.debugMode = true;

    const endpoints = this.detectEndpoints(fileAnalyses);
    const stats = this.getDetectionStats(endpoints);

    this.debugMode = oldDebugMode;

    return {
      summary: stats,
      endpoints: endpoints.map(ep => ({
        framework: ep.framework,
        method: ep.method,
        route: ep.route,
        file: ep.filePath,
        line: ep.line,
        handler: ep.handlerFunction,
        parameterCount: ep.parameters?.length || 0
      })),
      fileAnalysis: {
        totalFiles: fileAnalyses.size,
        languageDistribution: this.getLanguageDistribution(fileAnalyses),
        filesAnalyzed: Array.from(fileAnalyses.keys())
      }
    };
  }

  /**
   * Get language distribution from file analyses
   * @private
   */
  private getLanguageDistribution(fileAnalyses: Map<string, FileAnalysis>): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const analysis of fileAnalyses.values()) {
      if (analysis.language) {
        distribution[analysis.language] = (distribution[analysis.language] || 0) + 1;
      }
    }

    return distribution;
  }
}
