"use strict";
/**
 * API Endpoint Detection Engine
 *
 * This module analyzes code files to detect REST API endpoints across different
 * frameworks including Express.js, NestJS, and Django. It extracts HTTP methods,
 * routes, parameters, and associates them with handler functions.
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiDetector = void 0;
/**
 * API endpoint detection engine
 *
 * This class analyzes file analysis results to detect REST API endpoints
 * across multiple frameworks with detailed metadata extraction.
 */
var ApiDetector = /** @class */ (function () {
    /**
     * Create a new API detector
     *
     * @param debugMode - Enable debug logging for endpoint detection
     */
    function ApiDetector(debugMode) {
        if (debugMode === void 0) { debugMode = false; }
        this.debugMode = debugMode;
    }
    /**
     * Detect API endpoints from analyzed files
     *
     * @param fileAnalyses - Map of file paths to their analysis results
     * @returns Array of detected API endpoints with detailed information
     */
    ApiDetector.prototype.detectEndpoints = function (fileAnalyses) {
        if (this.debugMode) {
            console.log("\uD83D\uDD0D Starting API endpoint detection on ".concat(fileAnalyses.size, " files"));
        }
        var allEndpoints = [];
        for (var _i = 0, fileAnalyses_1 = fileAnalyses; _i < fileAnalyses_1.length; _i++) {
            var _a = fileAnalyses_1[_i], filePath = _a[0], analysis = _a[1];
            if (analysis.error) {
                continue; // Skip files with analysis errors
            }
            var fileEndpoints = this.analyzeFileForEndpoints(filePath, analysis);
            allEndpoints.push.apply(allEndpoints, fileEndpoints);
            if (this.debugMode && fileEndpoints.length > 0) {
                console.log("  \uD83D\uDCC4 ".concat(filePath, ": Found ").concat(fileEndpoints.length, " endpoints"));
            }
        }
        // Sort endpoints by file path and then by line number
        allEndpoints.sort(function (a, b) {
            if (a.filePath !== b.filePath) {
                return a.filePath.localeCompare(b.filePath);
            }
            return a.line - b.line;
        });
        if (this.debugMode) {
            console.log("\u2705 API detection complete. Found ".concat(allEndpoints.length, " total endpoints"));
        }
        return allEndpoints;
    };
    /**
     * Analyze a single file for API endpoints
     *
     * @param filePath - Path to the file being analyzed
     * @param analysis - File analysis result
     * @returns Array of endpoints found in this file
     * @private
     */
    ApiDetector.prototype.analyzeFileForEndpoints = function (filePath, analysis) {
        var endpoints = [];
        // Detect endpoints based on language and patterns
        if (analysis.language === 'javascript' || analysis.language === 'typescript') {
            // Check for Express.js patterns
            endpoints.push.apply(endpoints, this.detectExpressEndpoints(filePath, analysis));
            // Check for NestJS patterns
            endpoints.push.apply(endpoints, this.detectNestJSEndpoints(filePath, analysis));
        }
        else if (analysis.language === 'python') {
            // Check for Django patterns
            endpoints.push.apply(endpoints, this.detectDjangoEndpoints(filePath, analysis));
        }
        return endpoints;
    };
    /**
       * Detect Express.js API endpoints
       *
       * @param filePath - File path
       * @param analysis - File analysis
       * @returns Express endpoints found
       * @private
       */
    ApiDetector.prototype.detectExpressEndpoints = function (filePath, analysis) {
        var endpoints = [];
        // Check if this file uses Express
        if (!this.hasExpressImport(analysis)) {
            return endpoints;
        }
        if (this.debugMode) {
            console.log("  \uD83D\uDE82 Analyzing ".concat(filePath, " for Express endpoints"));
        }
        // Look for Express route patterns in functions
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                // Extract function name from signature
                var functionNameParts = functionSignature.split('(');
                var functionName = functionNameParts.length > 0 ? functionNameParts[0] : undefined;
                // Check API endpoints already detected by the analyzer
                if (functionInfo.api_endpoints) {
                    for (var _c = 0, _d = functionInfo.api_endpoints; _c < _d.length; _c++) {
                        var apiEndpoint = _d[_c];
                        var expressEndpoint = this.parseExpressEndpoint(apiEndpoint, filePath, functionName, functionInfo.line_number || 0);
                        if (expressEndpoint) {
                            endpoints.push(expressEndpoint);
                        }
                    }
                }
            }
        }
        // Also check for Express endpoints that might be detected at file level
        if (analysis.api_endpoints) {
            for (var _e = 0, _f = analysis.api_endpoints; _e < _f.length; _e++) {
                var apiEndpoint = _f[_e];
                var expressEndpoint = this.parseExpressEndpoint(apiEndpoint, filePath, undefined, apiEndpoint.line);
                if (expressEndpoint) {
                    endpoints.push(expressEndpoint);
                }
            }
        }
        // Manual pattern detection for routes not caught by analyzers
        endpoints.push.apply(endpoints, this.detectExpressRoutePatterns(filePath, analysis));
        if (this.debugMode && endpoints.length > 0) {
            console.log("    \u2713 Found ".concat(endpoints.length, " Express endpoints"));
        }
        return endpoints;
    };
    /**
     * Check if file imports Express
     * @private
     */
    ApiDetector.prototype.hasExpressImport = function (analysis) {
        if (!analysis.imports)
            return false;
        return Object.keys(analysis.imports).some(function (moduleName) {
            return moduleName === 'express' || moduleName.includes('express');
        });
    };
    /**
     * Parse an API endpoint detected by the analyzer into Express format
     * @private
     */
    ApiDetector.prototype.parseExpressEndpoint = function (apiEndpoint, filePath, handlerFunction, lineNumber) {
        if (lineNumber === void 0) { lineNumber = 0; }
        // Check if this is an Express-style endpoint
        if (!this.isExpressEndpoint(apiEndpoint)) {
            return null;
        }
        var method = this.extractHttpMethod(apiEndpoint);
        var route = this.extractRoute(apiEndpoint);
        if (!method || !route) {
            return null;
        }
        var parameters = this.extractRouteParameters(route);
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
    };
    /**
     * Check if an API endpoint is Express-style
     * @private
     */
    ApiDetector.prototype.isExpressEndpoint = function (apiEndpoint) {
        if (!apiEndpoint.type)
            return false;
        var expressTypes = [
            'express_route',
            'router_route',
            'express_get',
            'express_post',
            'express_put',
            'express_delete',
            'express_patch'
        ];
        return expressTypes.some(function (type) { return apiEndpoint.type.includes(type); });
    };
    /**
     * Extract HTTP method from API endpoint
     * @private
     */
    ApiDetector.prototype.extractHttpMethod = function (apiEndpoint) {
        // Check explicit method field
        if (apiEndpoint.method) {
            var method = apiEndpoint.method.toUpperCase();
            if (this.isValidHttpMethod(method)) {
                return method;
            }
        }
        // Infer from endpoint type
        var type = apiEndpoint.type.toLowerCase();
        if (type.includes('get'))
            return 'GET';
        if (type.includes('post'))
            return 'POST';
        if (type.includes('put'))
            return 'PUT';
        if (type.includes('delete'))
            return 'DELETE';
        if (type.includes('patch'))
            return 'PATCH';
        if (type.includes('head'))
            return 'HEAD';
        if (type.includes('options'))
            return 'OPTIONS';
        return undefined;
    };
    /**
     * Extract route from API endpoint
     * @private
     */
    ApiDetector.prototype.extractRoute = function (apiEndpoint) {
        return apiEndpoint.route || apiEndpoint.path || apiEndpoint.url;
    };
    /**
     * Extract route parameters from a route pattern
     * @private
     */
    ApiDetector.prototype.extractRouteParameters = function (route) {
        var parameters = [];
        // Express-style parameters (:param)
        var expressParams = route.match(/:([a-zA-Z0-9_]+)/g);
        if (expressParams) {
            for (var _i = 0, expressParams_1 = expressParams; _i < expressParams_1.length; _i++) {
                var param = expressParams_1[_i];
                var name_1 = param.substring(1); // Remove the ':'
                parameters.push({
                    name: name_1,
                    type: 'string',
                    required: true
                });
            }
        }
        // Express wildcard parameters (*)
        var wildcardCount = (route.match(/\*/g) || []).length;
        for (var i = 0; i < wildcardCount; i++) {
            parameters.push({
                name: "wildcard".concat(i),
                type: 'string',
                required: false
            });
        }
        return parameters;
    };
    /**
     * Check if a string is a valid HTTP method
     * @private
     */
    ApiDetector.prototype.isValidHttpMethod = function (method) {
        var validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
        return validMethods.includes(method);
    };
    /**
     * Detect Express route patterns manually (fallback method)
     * @private
     */
    ApiDetector.prototype.detectExpressRoutePatterns = function (filePath, analysis) {
        var endpoints = [];
        // Look for common Express patterns in function names/signatures
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                // Check for route handler patterns in function names
                var routeHandlers = this.findRouteHandlerPatterns(functionSignature, functionInfo);
                for (var _c = 0, routeHandlers_1 = routeHandlers; _c < routeHandlers_1.length; _c++) {
                    var handler = routeHandlers_1[_c];
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
    };
    /**
       * Find route handler patterns in function signatures
       * @private
       */
    ApiDetector.prototype.findRouteHandlerPatterns = function (functionSignature, functionInfo) {
        var patterns = [];
        // Extract function name safely
        var functionNameParts = functionSignature.split('(');
        if (functionNameParts.length === 0 || !functionNameParts[0] || functionNameParts[0].trim() === '') {
            return patterns; // No valid function name found
        }
        var functionName = functionNameParts[0].toLowerCase();
        // Additional safety check to ensure functionName is valid
        if (!functionName || functionName.trim() === '') {
            return patterns;
        }
        // Common RESTful patterns
        var restPatterns = [
            { pattern: /^get([A-Z][a-zA-Z]*)/i, method: 'GET' },
            { pattern: /^post([A-Z][a-zA-Z]*)/i, method: 'POST' },
            { pattern: /^put([A-Z][a-zA-Z]*)/i, method: 'PUT' },
            { pattern: /^delete([A-Z][a-zA-Z]*)/i, method: 'DELETE' },
            { pattern: /^patch([A-Z][a-zA-Z]*)/i, method: 'PATCH' },
            { pattern: /^create([A-Z][a-zA-Z]*)/i, method: 'POST' },
            { pattern: /^update([A-Z][a-zA-Z]*)/i, method: 'PUT' },
            { pattern: /^remove([A-Z][a-zA-Z]*)/i, method: 'DELETE' }
        ];
        for (var _i = 0, restPatterns_1 = restPatterns; _i < restPatterns_1.length; _i++) {
            var _a = restPatterns_1[_i], pattern = _a.pattern, method = _a.method;
            var match = functionName.match(pattern);
            if (match) {
                var resource = match[1] ? match[1].toLowerCase() : 'resource';
                var route = "/".concat(resource);
                patterns.push({ method: method, route: route });
            }
        }
        return patterns;
    };
    /**
       * Detect NestJS API endpoints
       *
       * @param filePath - File path
       * @param analysis - File analysis
       * @returns NestJS endpoints found
       * @private
       */
    ApiDetector.prototype.detectNestJSEndpoints = function (filePath, analysis) {
        var endpoints = [];
        // Check if this file uses NestJS
        if (!this.hasNestJSImport(analysis)) {
            return endpoints;
        }
        if (this.debugMode) {
            console.log("  \uD83C\uDFF0 Analyzing ".concat(filePath, " for NestJS endpoints"));
        }
        // Get controller prefix from class decorators
        var controllerPrefix = this.extractControllerPrefix(analysis);
        // Look for HTTP method decorators in functions
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                var functionName = functionSignature.split('(')[0];
                // Check for NestJS HTTP decorators
                if (functionInfo.decorators) {
                    for (var _c = 0, _d = functionInfo.decorators; _c < _d.length; _c++) {
                        var decorator = _d[_c];
                        var nestEndpoint = this.parseNestJSDecorator(decorator, filePath, functionName || 'anonymous', functionInfo.line_number || 0, controllerPrefix);
                        if (nestEndpoint) {
                            endpoints.push(nestEndpoint);
                        }
                    }
                }
                // Also check API endpoints detected by analyzer
                if (functionInfo.api_endpoints) {
                    for (var _e = 0, _f = functionInfo.api_endpoints; _e < _f.length; _e++) {
                        var apiEndpoint = _f[_e];
                        var nestEndpoint = this.parseNestJSEndpoint(apiEndpoint, filePath, functionName || 'anonymous', functionInfo.line_number || 0, controllerPrefix);
                        if (nestEndpoint) {
                            endpoints.push(nestEndpoint);
                        }
                    }
                }
            }
        }
        // Check class-level endpoints
        if (analysis.classes) {
            for (var _g = 0, _h = Object.entries(analysis.classes); _g < _h.length; _g++) {
                var _j = _h[_g], className = _j[0], classInfo = _j[1];
                // Process methods in classes
                if (classInfo.methods) {
                    for (var _k = 0, _l = Object.entries(classInfo.methods); _k < _l.length; _k++) {
                        var _m = _l[_k], methodSignature = _m[0], methodInfo = _m[1];
                        var methodName = methodSignature.split('(')[0];
                        // Check method decorators
                        if (methodInfo.decorators) {
                            for (var _o = 0, _p = methodInfo.decorators; _o < _p.length; _o++) {
                                var decorator = _p[_o];
                                var nestEndpoint = this.parseNestJSDecorator(decorator, filePath, "".concat(className, ".").concat(methodName), methodInfo.line_number || 0, controllerPrefix);
                                if (nestEndpoint) {
                                    endpoints.push(nestEndpoint);
                                }
                            }
                        }
                        // Check method API endpoints
                        if (methodInfo.api_endpoints) {
                            for (var _q = 0, _r = methodInfo.api_endpoints; _q < _r.length; _q++) {
                                var apiEndpoint = _r[_q];
                                var nestEndpoint = this.parseNestJSEndpoint(apiEndpoint, filePath, "".concat(className, ".").concat(methodName), methodInfo.line_number || 0, controllerPrefix);
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
            console.log("    \u2713 Found ".concat(endpoints.length, " NestJS endpoints"));
        }
        return endpoints;
    };
    /**
     * Check if file imports NestJS
     * @private
     */
    ApiDetector.prototype.hasNestJSImport = function (analysis) {
        if (!analysis.imports)
            return false;
        return Object.keys(analysis.imports).some(function (moduleName) {
            return moduleName.startsWith('@nestjs/') || moduleName.includes('nestjs');
        });
    };
    /**
     * Extract controller prefix from @Controller decorator
     * @private
     */
    ApiDetector.prototype.extractControllerPrefix = function (analysis) {
        if (!analysis.classes)
            return '';
        for (var _i = 0, _a = Object.values(analysis.classes); _i < _a.length; _i++) {
            var classInfo = _a[_i];
            if (classInfo.decorators) {
                for (var _b = 0, _c = classInfo.decorators; _b < _c.length; _b++) {
                    var decorator = _c[_b];
                    if (decorator.name === 'Controller' || decorator.name.includes('Controller')) {
                        // Extract the route prefix from decorator arguments
                        if (decorator.arguments && decorator.arguments.length > 0 && decorator.arguments[0]) {
                            // Remove quotes from the argument
                            var prefix = decorator.arguments[0].replace(/['"]/g, '');
                            return prefix.startsWith('/') ? prefix : "/".concat(prefix);
                        }
                        return ''; // Controller with no prefix
                    }
                }
            }
        }
        return '';
    };
    /**
     * Parse a NestJS decorator into an API endpoint
     * @private
     */
    ApiDetector.prototype.parseNestJSDecorator = function (decorator, filePath, handlerFunction, lineNumber, controllerPrefix) {
        var method = this.extractNestJSMethod(decorator);
        if (!method)
            return null;
        var route = this.extractNestJSRoute(decorator, controllerPrefix);
        var parameters = this.extractRouteParameters(route);
        return {
            type: "nestjs_".concat(method.toLowerCase()),
            method: method,
            route: route,
            line: lineNumber,
            framework: 'NestJS',
            filePath: filePath,
            handlerFunction: handlerFunction,
            parameters: parameters,
            middleware: ["@".concat(decorator.name)]
        };
    };
    /**
     * Parse a NestJS API endpoint detected by analyzer
     * @private
     */
    ApiDetector.prototype.parseNestJSEndpoint = function (apiEndpoint, filePath, handlerFunction, lineNumber, controllerPrefix) {
        if (!this.isNestJSEndpoint(apiEndpoint)) {
            return null;
        }
        var method = this.extractHttpMethod(apiEndpoint);
        var route = this.extractRoute(apiEndpoint) || '/';
        // Combine with controller prefix
        if (controllerPrefix && !route.startsWith(controllerPrefix)) {
            route = controllerPrefix + (route.startsWith('/') ? route : "/".concat(route));
        }
        var parameters = this.extractRouteParameters(route);
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
    };
    /**
     * Check if an API endpoint is NestJS-style
     * @private
     */
    ApiDetector.prototype.isNestJSEndpoint = function (apiEndpoint) {
        if (!apiEndpoint.type)
            return false;
        var nestTypes = [
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
        return nestTypes.some(function (type) { return apiEndpoint.type.includes(type); });
    };
    /**
     * Extract HTTP method from NestJS decorator
     * @private
     */
    ApiDetector.prototype.extractNestJSMethod = function (decorator) {
        var decoratorName = decorator.name.toLowerCase();
        // Map decorator names to HTTP methods
        var methodMap = {
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
        for (var _i = 0, _a = Object.entries(methodMap); _i < _a.length; _i++) {
            var _b = _a[_i], method = _b[0], httpMethod = _b[1];
            if (decoratorName.includes(method)) {
                return httpMethod;
            }
        }
        return undefined;
    };
    /**
     * Extract route from NestJS decorator
     * @private
     */
    ApiDetector.prototype.extractNestJSRoute = function (decorator, controllerPrefix) {
        var route = '/';
        // Extract route from decorator arguments
        if (decorator.arguments && decorator.arguments.length > 0 && decorator.arguments[0]) {
            var routeArg = decorator.arguments[0].replace(/['"]/g, '');
            if (routeArg) {
                route = routeArg.startsWith('/') ? routeArg : "/".concat(routeArg);
            }
        }
        // Combine with controller prefix
        if (controllerPrefix) {
            if (route === '/') {
                route = controllerPrefix;
            }
            else {
                route = controllerPrefix + (route.startsWith('/') ? route : "/".concat(route));
            }
        }
        return route;
    };
    /**
       * Detect Django API endpoints
       *
       * @param filePath - File path
       * @param analysis - File analysis
       * @returns Django endpoints found
       * @private
       */
    ApiDetector.prototype.detectDjangoEndpoints = function (filePath, analysis) {
        var endpoints = [];
        // Check if this file uses Django
        if (!this.hasDjangoImport(analysis)) {
            return endpoints;
        }
        if (this.debugMode) {
            console.log("  \uD83C\uDFAF Analyzing ".concat(filePath, " for Django endpoints"));
        }
        // Check if this is a views.py file or contains view functions
        var isViewsFile = filePath.includes('views.py') || filePath.includes('views/');
        var isUrlsFile = filePath.includes('urls.py') || filePath.includes('urls/');
        if (isViewsFile) {
            endpoints.push.apply(endpoints, this.detectDjangoViews(filePath, analysis));
        }
        if (isUrlsFile) {
            endpoints.push.apply(endpoints, this.detectDjangoUrlPatterns(filePath, analysis));
        }
        // Look for Django REST framework patterns
        endpoints.push.apply(endpoints, this.detectDjangoRestFramework(filePath, analysis));
        // Check functions for Django view decorators
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                var functionName = functionSignature.split('(')[0];
                // Check for Django view decorators
                if (functionInfo.decorators) {
                    for (var _c = 0, _d = functionInfo.decorators; _c < _d.length; _c++) {
                        var decorator = _d[_c];
                        var djangoEndpoint = this.parseDjangoDecorator(decorator, filePath, functionName || 'anonymous', functionInfo.line_number || 0);
                        if (djangoEndpoint) {
                            endpoints.push(djangoEndpoint);
                        }
                    }
                }
                // Check API endpoints detected by analyzer
                if (functionInfo.api_endpoints) {
                    for (var _e = 0, _f = functionInfo.api_endpoints; _e < _f.length; _e++) {
                        var apiEndpoint = _f[_e];
                        var djangoEndpoint = this.parseDjangoEndpoint(apiEndpoint, filePath, functionName || 'anonymous', functionInfo.line_number || 0);
                        if (djangoEndpoint) {
                            endpoints.push(djangoEndpoint);
                        }
                    }
                }
            }
        }
        if (this.debugMode && endpoints.length > 0) {
            console.log("    \u2713 Found ".concat(endpoints.length, " Django endpoints"));
        }
        return endpoints;
    };
    /**
     * Check if file imports Django
     * @private
     */
    ApiDetector.prototype.hasDjangoImport = function (analysis) {
        if (!analysis.imports)
            return false;
        return Object.keys(analysis.imports).some(function (moduleName) {
            return moduleName.startsWith('django') ||
                moduleName.includes('django') ||
                moduleName === 'rest_framework' ||
                moduleName.startsWith('rest_framework');
        });
    };
    /**
     * Detect Django view functions
     * @private
     */
    ApiDetector.prototype.detectDjangoViews = function (filePath, analysis) {
        var _a;
        var endpoints = [];
        if (!analysis.functions)
            return endpoints;
        // Look for function-based views
        for (var _i = 0, _b = Object.entries(analysis.functions); _i < _b.length; _i++) {
            var _c = _b[_i], functionSignature = _c[0], functionInfo = _c[1];
            var functionName = functionSignature.split('(')[0];
            // Check if function parameters suggest it's a view (request parameter)
            var hasRequestParam = (_a = functionInfo.parameters) === null || _a === void 0 ? void 0 : _a.some(function (param) {
                return param.toLowerCase().includes('request');
            });
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
            for (var _d = 0, _e = Object.entries(analysis.classes); _d < _e.length; _d++) {
                var _f = _e[_d], className = _f[0], classInfo = _f[1];
                // Check if class extends Django view classes
                if (this.isDjangoViewClass(classInfo)) {
                    var methods = this.extractDjangoViewMethods(classInfo);
                    for (var _g = 0, methods_1 = methods; _g < methods_1.length; _g++) {
                        var method = methods_1[_g];
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
    };
    /**
     * Check if a class is a Django view class
     * @private
     */
    ApiDetector.prototype.isDjangoViewClass = function (classInfo) {
        if (!classInfo.base_classes)
            return false;
        var djangoViewBaseClasses = [
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
        return classInfo.base_classes.some(function (baseClass) {
            return djangoViewBaseClasses.some(function (djangoClass) { return baseClass.includes(djangoClass); });
        });
    };
    /**
     * Extract HTTP methods from Django view class
     * @private
     */
    ApiDetector.prototype.extractDjangoViewMethods = function (classInfo) {
        var _a;
        var methods = [];
        if (!classInfo.methods)
            return ['GET']; // Default to GET
        var httpMethods = {
            'get': 'GET',
            'post': 'POST',
            'put': 'PUT',
            'patch': 'PATCH',
            'delete': 'DELETE',
            'head': 'HEAD',
            'options': 'OPTIONS'
        };
        for (var _i = 0, _b = Object.keys(classInfo.methods); _i < _b.length; _i++) {
            var methodSignature = _b[_i];
            var methodName = ((_a = methodSignature.split('(')[0]) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
            if (httpMethods[methodName]) {
                methods.push(httpMethods[methodName]);
            }
        }
        return methods.length > 0 ? methods : ['GET'];
    };
    /**
     * Detect Django URL patterns
     * @private
     */
    ApiDetector.prototype.detectDjangoUrlPatterns = function (filePath, analysis) {
        var endpoints = [];
        // Look for URL pattern functions in urls.py files
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
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
    };
    /**
     * Detect Django REST framework patterns
     * @private
     */
    ApiDetector.prototype.detectDjangoRestFramework = function (filePath, analysis) {
        var endpoints = [];
        // Check for DRF imports
        var hasDRFImport = analysis.imports && Object.keys(analysis.imports).some(function (moduleName) {
            return moduleName.includes('rest_framework') || moduleName.includes('serializers');
        });
        if (!hasDRFImport)
            return endpoints;
        // Look for DRF ViewSets and API Views
        if (analysis.classes) {
            for (var _i = 0, _a = Object.entries(analysis.classes); _i < _a.length; _i++) {
                var _b = _a[_i], className = _b[0], classInfo = _b[1];
                if (this.isDRFViewClass(classInfo)) {
                    var methods = this.extractDRFMethods(classInfo);
                    for (var _c = 0, methods_2 = methods; _c < methods_2.length; _c++) {
                        var method = methods_2[_c];
                        endpoints.push({
                            type: 'django_rest_framework',
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
    };
    /**
     * Check if a class is a Django REST Framework view class
     * @private
     */
    ApiDetector.prototype.isDRFViewClass = function (classInfo) {
        if (!classInfo.base_classes)
            return false;
        var drfViewBaseClasses = [
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
        return classInfo.base_classes.some(function (baseClass) {
            return drfViewBaseClasses.some(function (drfClass) { return baseClass.includes(drfClass); });
        });
    };
    /**
     * Extract HTTP methods from DRF view class
     * @private
     */
    ApiDetector.prototype.extractDRFMethods = function (classInfo) {
        var _a;
        var methods = [];
        if (!classInfo.methods)
            return ['GET']; // Default to GET
        // DRF action methods
        var drfMethods = {
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
        for (var _i = 0, _b = Object.keys(classInfo.methods); _i < _b.length; _i++) {
            var methodSignature = _b[_i];
            var methodName = ((_a = methodSignature.split('(')[0]) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
            if (drfMethods[methodName]) {
                methods.push.apply(methods, drfMethods[methodName]);
            }
        }
        return methods.length > 0 ? __spreadArray([], new Set(methods), true) : ['GET'];
    };
    /**
     * Parse a Django decorator into an API endpoint
     * @private
     */
    ApiDetector.prototype.parseDjangoDecorator = function (decorator, filePath, handlerFunction, lineNumber) {
        // Check for Django view decorators
        if (decorator.name === 'api_view' || decorator.name.includes('api_view')) {
            var methods = this.extractMethodsFromApiViewDecorator(decorator);
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
                    middleware: ["@".concat(decorator.name)]
                };
            }
        }
        return null;
    };
    /**
     * Extract HTTP methods from @api_view decorator
     * @private
     */
    ApiDetector.prototype.extractMethodsFromApiViewDecorator = function (decorator) {
        var methods = [];
        if (decorator.arguments && decorator.arguments.length > 0) {
            var methodArg = decorator.arguments[0];
            // Handle list format: ['GET', 'POST']
            if (methodArg.includes('[') && methodArg.includes(']')) {
                var methodList = methodArg.replace(/[\[\]'\"]/g, '').split(',');
                for (var _i = 0, methodList_1 = methodList; _i < methodList_1.length; _i++) {
                    var method = methodList_1[_i];
                    var cleanMethod = method.trim().toUpperCase();
                    if (this.isValidHttpMethod(cleanMethod)) {
                        methods.push(cleanMethod);
                    }
                }
            }
        }
        return methods.length > 0 ? methods : ['GET'];
    };
    /**
     * Parse a Django API endpoint detected by analyzer
     * @private
     */
    ApiDetector.prototype.parseDjangoEndpoint = function (apiEndpoint, filePath, handlerFunction, lineNumber) {
        if (!this.isDjangoEndpoint(apiEndpoint)) {
            return null;
        }
        var method = this.extractHttpMethod(apiEndpoint) || 'GET';
        var route = this.extractRoute(apiEndpoint) || this.inferDjangoRoute(handlerFunction);
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
    };
    /**
     * Check if an API endpoint is Django-style
     * @private
     */
    ApiDetector.prototype.isDjangoEndpoint = function (apiEndpoint) {
        if (!apiEndpoint.type)
            return false;
        var djangoTypes = [
            'django_api_view',
            'django_path',
            'django_url',
            'django_view'
        ];
        return djangoTypes.some(function (type) { return apiEndpoint.type.includes(type); });
    };
    /**
     * Infer Django route from function/class name
     * @private
     */
    ApiDetector.prototype.inferDjangoRoute = function (name) {
        // Convert CamelCase or function names to URL-friendly format
        var route = name
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .replace(/^-/, '')
            .replace(/view$/, '')
            .replace(/api$/, '')
            .replace(/_/g, '-');
        return "/".concat(route, "/");
    };
    /**
     * Generate API detection statistics
     *
     * @param endpoints - Array of detected endpoints
     * @returns Statistical summary of API detection
     */
    ApiDetector.prototype.getDetectionStats = function (endpoints) {
        var methodDistribution = {
            'GET': 0,
            'POST': 0,
            'PUT': 0,
            'DELETE': 0,
            'PATCH': 0,
            'HEAD': 0,
            'OPTIONS': 0
        };
        var frameworkDistribution = {};
        var filesWithEndpoints = new Set();
        var routePatterns = {};
        for (var _i = 0, endpoints_1 = endpoints; _i < endpoints_1.length; _i++) {
            var endpoint = endpoints_1[_i];
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
                var normalizedRoute = endpoint.route
                    .replace(/:[a-zA-Z0-9_]+/g, ':param') // Express parameters
                    .replace(/\{[a-zA-Z0-9_]+\}/g, '{param}') // NestJS/Django parameters
                    .replace(/<[^>]+>/g, '<param>'); // Django parameters
                routePatterns[normalizedRoute] = (routePatterns[normalizedRoute] || 0) + 1;
            }
        }
        // Get most common patterns
        var commonPatterns = Object.entries(routePatterns)
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        })
            .slice(0, 10)
            .map(function (_a) {
            var pattern = _a[0], count = _a[1];
            return ({ pattern: pattern, count: count });
        });
        return {
            totalEndpoints: endpoints.length,
            methodDistribution: methodDistribution,
            frameworkDistribution: frameworkDistribution,
            filesWithEndpoints: Array.from(filesWithEndpoints),
            commonPatterns: commonPatterns
        };
    };
    /**
     * Get detailed detection report for debugging
     *
     * @param fileAnalyses - Map of file analyses
     * @returns Detailed detection report
     */
    ApiDetector.prototype.getDetectionReport = function (fileAnalyses) {
        var oldDebugMode = this.debugMode;
        this.debugMode = true;
        var endpoints = this.detectEndpoints(fileAnalyses);
        var stats = this.getDetectionStats(endpoints);
        this.debugMode = oldDebugMode;
        return {
            summary: stats,
            endpoints: endpoints.map(function (ep) {
                var _a;
                return ({
                    framework: ep.framework,
                    method: ep.method,
                    route: ep.route,
                    file: ep.filePath,
                    line: ep.line,
                    handler: ep.handlerFunction,
                    parameterCount: ((_a = ep.parameters) === null || _a === void 0 ? void 0 : _a.length) || 0
                });
            }),
            fileAnalysis: {
                totalFiles: fileAnalyses.size,
                languageDistribution: this.getLanguageDistribution(fileAnalyses),
                filesAnalyzed: Array.from(fileAnalyses.keys())
            }
        };
    };
    /**
     * Get language distribution from file analyses
     * @private
     */
    ApiDetector.prototype.getLanguageDistribution = function (fileAnalyses) {
        var distribution = {};
        for (var _i = 0, _a = fileAnalyses.values(); _i < _a.length; _i++) {
            var analysis = _a[_i];
            if (analysis.language) {
                distribution[analysis.language] = (distribution[analysis.language] || 0) + 1;
            }
        }
        return distribution;
    };
    return ApiDetector;
}());
exports.ApiDetector = ApiDetector;
