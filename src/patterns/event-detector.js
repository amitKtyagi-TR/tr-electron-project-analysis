"use strict";
/**
 * Event Handler Detection Engine
 *
 * This module analyzes code to detect event handlers, listeners, and callback
 * patterns across different frameworks including DOM events, React events,
 * Electron IPC, and custom event systems.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDetector = void 0;
/**
 * Event handler detection engine
 *
 * This class analyzes file analysis results to detect event handlers
 * across multiple frameworks with detailed metadata extraction.
 */
var EventDetector = /** @class */ (function () {
    /**
     * Create a new event detector
     *
     * @param debugMode - Enable debug logging for event detection
     */
    function EventDetector(debugMode) {
        if (debugMode === void 0) { debugMode = false; }
        this.debugMode = debugMode;
        this.eventPatternConfigs = this.initializeEventPatterns();
    }
    /**
     * Detect event handlers from analyzed files
     *
     * @param fileAnalyses - Map of file paths to their analysis results
     * @returns Array of detected event handlers with detailed information
     */
    EventDetector.prototype.detectEventHandlers = function (fileAnalyses) {
        if (this.debugMode) {
            console.log("\uD83D\uDD0D Starting event handler detection on ".concat(fileAnalyses.size, " files"));
        }
        var allHandlers = [];
        for (var _i = 0, fileAnalyses_1 = fileAnalyses; _i < fileAnalyses_1.length; _i++) {
            var _a = fileAnalyses_1[_i], filePath = _a[0], analysis = _a[1];
            if (analysis.error) {
                continue; // Skip files with analysis errors
            }
            var fileHandlers = this.analyzeFileForEventHandlers(filePath, analysis);
            allHandlers.push.apply(allHandlers, fileHandlers);
            if (this.debugMode && fileHandlers.length > 0) {
                console.log("  \uD83D\uDCC4 ".concat(filePath, ": Found ").concat(fileHandlers.length, " event handlers"));
            }
        }
        // Sort handlers by file path and then by line number
        allHandlers.sort(function (a, b) {
            if (a.filePath !== b.filePath) {
                return a.filePath.localeCompare(b.filePath);
            }
            return a.line - b.line;
        });
        if (this.debugMode) {
            console.log("\u2705 Event detection complete. Found ".concat(allHandlers.length, " total handlers"));
        }
        return allHandlers;
    };
    /**
     * Analyze a single file for event handlers
     *
     * @param filePath - Path to the file being analyzed
     * @param analysis - File analysis result
     * @returns Array of event handlers found in this file
     * @private
     */
    EventDetector.prototype.analyzeFileForEventHandlers = function (filePath, analysis) {
        var handlers = [];
        // Detect handlers based on language and patterns
        if (analysis.language === 'javascript' || analysis.language === 'typescript') {
            // Check for DOM event handlers
            handlers.push.apply(handlers, this.detectDOMEventHandlers(filePath, analysis));
            // Check for React event handlers
            handlers.push.apply(handlers, this.detectReactEventHandlers(filePath, analysis));
            // Check for Electron IPC handlers
            handlers.push.apply(handlers, this.detectElectronIPCHandlers(filePath, analysis));
            // Check for custom event handlers
            handlers.push.apply(handlers, this.detectCustomEventHandlers(filePath, analysis));
        }
        else if (analysis.language === 'python') {
            // Check for Django event handlers (signals, etc.)
            handlers.push.apply(handlers, this.detectDjangoEventHandlers(filePath, analysis));
        }
        // Check for generic event patterns
        handlers.push.apply(handlers, this.detectGenericEventHandlers(filePath, analysis));
        return handlers;
    };
    /**
       * Detect DOM event handlers
       *
       * @param filePath - File path
       * @param analysis - File analysis
       * @returns DOM event handlers found
       * @private
       */
    EventDetector.prototype.detectDOMEventHandlers = function (filePath, analysis) {
        var handlers = [];
        if (this.debugMode) {
            console.log("  \uD83C\uDF10 Analyzing ".concat(filePath, " for DOM event handlers"));
        }
        // Check functions for addEventListener patterns
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                var functionName = functionSignature.split('(')[0] || 'anonymous';
                // Check existing event_handlers detected by analyzers
                if (functionInfo.event_handlers && functionInfo.event_handlers.length > 0) {
                    for (var _c = 0, _d = functionInfo.event_handlers; _c < _d.length; _c++) {
                        var eventHandler = _d[_c];
                        if (this.isDOMEventHandler(eventHandler)) {
                            handlers.push({
                                type: this.getDOMEventType(eventHandler),
                                event: this.extractEventName(eventHandler),
                                handler: functionName,
                                line: functionInfo.line_number || 0,
                                framework: 'DOM',
                                context: 'function',
                                containerName: functionName,
                                filePath: filePath,
                                metadata: {
                                    originalHandler: eventHandler,
                                    detectedVia: 'analyzer_event_handlers'
                                }
                            });
                        }
                    }
                }
                // Manual detection for common DOM patterns
                handlers.push.apply(handlers, this.detectDOMPatternsInFunction(filePath, functionName, functionInfo));
            }
        }
        return handlers;
    };
    /**
     * Detect React event handlers
     *
     * @param filePath - File path
     * @param analysis - File analysis
     * @returns React event handlers found
     * @private
     */
    EventDetector.prototype.detectReactEventHandlers = function (filePath, analysis) {
        var handlers = [];
        // Check if this file uses React
        if (!this.hasReactImport(analysis)) {
            return handlers;
        }
        if (this.debugMode) {
            console.log("  \u269B\uFE0F  Analyzing ".concat(filePath, " for React event handlers"));
        }
        // Check functions for React event patterns
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                var functionName = functionSignature.split('(')[0] || 'anonymous';
                // Check existing event_handlers
                if (functionInfo.event_handlers && functionInfo.event_handlers.length > 0) {
                    for (var _c = 0, _d = functionInfo.event_handlers; _c < _d.length; _c++) {
                        var eventHandler = _d[_c];
                        if (this.isReactEventHandler(eventHandler)) {
                            handlers.push({
                                type: this.getReactEventType(eventHandler),
                                event: this.extractReactEventName(eventHandler),
                                handler: functionName,
                                line: functionInfo.line_number || 0,
                                framework: 'React',
                                context: 'function',
                                containerName: functionName,
                                filePath: filePath,
                                metadata: {
                                    originalHandler: eventHandler,
                                    isComponent: functionInfo.is_component || false,
                                    detectedVia: 'analyzer_event_handlers'
                                }
                            });
                        }
                    }
                }
                // Detect React event handlers by function naming conventions
                var firstChar = functionName[0];
                if (functionInfo.is_component || (firstChar && firstChar === firstChar.toUpperCase())) {
                    handlers.push.apply(handlers, this.detectReactEventsByNaming(filePath, functionName, functionInfo));
                }
            }
        }
        return handlers;
    };
    /**
     * Detect Electron IPC handlers
     *
     * @param filePath - File path
     * @param analysis - File analysis
     * @returns Electron IPC handlers found
     * @private
     */
    EventDetector.prototype.detectElectronIPCHandlers = function (filePath, analysis) {
        var handlers = [];
        // Check if this file uses Electron
        if (!this.hasElectronImport(analysis)) {
            return handlers;
        }
        if (this.debugMode) {
            console.log("  \u26A1 Analyzing ".concat(filePath, " for Electron IPC handlers"));
        }
        // Check functions for IPC patterns
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                var functionName = functionSignature.split('(')[0] || 'anonymous';
                // Check existing event_handlers for IPC patterns
                if (functionInfo.event_handlers && functionInfo.event_handlers.length > 0) {
                    for (var _c = 0, _d = functionInfo.event_handlers; _c < _d.length; _c++) {
                        var eventHandler = _d[_c];
                        if (this.isElectronIPCHandler(eventHandler)) {
                            var ipcType = this.getElectronIPCType(eventHandler);
                            var channel = this.extractIPCChannel(eventHandler);
                            handlers.push({
                                type: ipcType,
                                event: channel,
                                handler: functionName,
                                line: functionInfo.line_number || 0,
                                framework: 'Electron',
                                context: 'function',
                                containerName: functionName,
                                filePath: filePath,
                                metadata: {
                                    originalHandler: eventHandler,
                                    channel: channel,
                                    ipcType: ipcType === 'ipc_handle' ? 'handle' : 'on',
                                    detectedVia: 'analyzer_event_handlers'
                                }
                            });
                        }
                    }
                }
                // Manual detection for IPC setup functions
                if (this.isIPCSetupFunction(functionName, functionInfo)) {
                    handlers.push({
                        type: 'ipc_handle',
                        event: this.inferIPCChannel(functionName),
                        handler: functionName,
                        line: functionInfo.line_number || 0,
                        framework: 'Electron',
                        context: 'function',
                        containerName: functionName,
                        filePath: filePath,
                        metadata: {
                            setupFunction: true,
                            detectedVia: 'function_naming_analysis'
                        }
                    });
                }
            }
        }
        return handlers;
    };
    /**
     * Detect custom event handlers
     *
     * @param filePath - File path
     * @param analysis - File analysis
     * @returns Custom event handlers found
     * @private
     */
    EventDetector.prototype.detectCustomEventHandlers = function (filePath, analysis) {
        var handlers = [];
        if (this.debugMode) {
            console.log("  \uD83D\uDD27 Analyzing ".concat(filePath, " for custom event handlers"));
        }
        // Check for custom event emitter patterns
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                var functionName = functionSignature.split('(')[0] || 'anonymous';
                // Check for EventEmitter-style patterns
                if (this.isEventEmitterPattern(functionName, functionInfo, analysis)) {
                    handlers.push({
                        type: 'addEventListener',
                        event: this.extractCustomEventName(functionName),
                        handler: functionName,
                        line: functionInfo.line_number || 0,
                        framework: 'Custom',
                        context: 'function',
                        containerName: functionName,
                        filePath: filePath,
                        metadata: {
                            eventEmitterPattern: true,
                            detectedVia: 'custom_pattern_analysis'
                        }
                    });
                }
                // Check for callback patterns
                if (this.isCallbackPattern(functionName, functionInfo)) {
                    handlers.push({
                        type: 'dom_event',
                        event: 'callback',
                        handler: functionName,
                        line: functionInfo.line_number || 0,
                        framework: 'Custom',
                        context: 'function',
                        containerName: functionName,
                        filePath: filePath,
                        metadata: {
                            callbackPattern: true,
                            detectedVia: 'callback_analysis'
                        }
                    });
                }
            }
        }
        return handlers;
    };
    /**
     * Detect Django event handlers
     *
     * @param filePath - File path
     * @param analysis - File analysis
     * @returns Django event handlers found
     * @private
     */
    EventDetector.prototype.detectDjangoEventHandlers = function (filePath, analysis) {
        var handlers = [];
        // Check if this file uses Django
        if (!this.hasDjangoImport(analysis)) {
            return handlers;
        }
        if (this.debugMode) {
            console.log("  \uD83C\uDFAF Analyzing ".concat(filePath, " for Django event handlers"));
        }
        // Check for Django signals
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                var functionName = functionSignature.split('(')[0] || 'anonymous';
                // Check for signal handler decorators
                if (functionInfo.decorators && Array.isArray(functionInfo.decorators)) {
                    for (var _c = 0, _d = functionInfo.decorators; _c < _d.length; _c++) {
                        var decorator = _d[_c];
                        if (this.isDjangoSignalDecorator(decorator)) {
                            handlers.push({
                                type: 'dom_event', // Using dom_event as generic handler type
                                event: this.extractSignalName(decorator),
                                handler: functionName,
                                line: functionInfo.line_number || 0,
                                framework: 'Django',
                                context: 'function',
                                containerName: functionName,
                                filePath: filePath,
                                metadata: {
                                    signalDecorator: decorator.name,
                                    detectedVia: 'django_signal_analysis'
                                }
                            });
                        }
                    }
                }
                // Check for Django form handling
                if (this.isDjangoFormHandler(functionName, functionInfo, analysis)) {
                    handlers.push({
                        type: 'onSubmit',
                        event: 'form_submit',
                        handler: functionName,
                        line: functionInfo.line_number || 0,
                        framework: 'Django',
                        context: 'function',
                        containerName: functionName,
                        filePath: filePath,
                        metadata: {
                            formHandler: true,
                            detectedVia: 'django_form_analysis'
                        }
                    });
                }
            }
        }
        return handlers;
    };
    /**
     * Detect generic event handlers
     *
     * @param filePath - File path
     * @param analysis - File analysis
     * @returns Generic event handlers found
     * @private
     */
    EventDetector.prototype.detectGenericEventHandlers = function (filePath, analysis) {
        var handlers = [];
        if (this.debugMode) {
            console.log("  \uD83D\uDD27 Analyzing ".concat(filePath, " for generic event handlers"));
        }
        // Check for generic event handler naming patterns
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                var functionName = functionSignature.split('(')[0] || 'anonymous';
                // Check for handler naming conventions
                if (this.hasEventHandlerNaming(functionName)) {
                    var eventType = this.inferEventTypeFromName(functionName);
                    handlers.push({
                        type: eventType,
                        event: this.extractEventFromName(functionName),
                        handler: functionName,
                        line: functionInfo.line_number || 0,
                        framework: 'Generic',
                        context: 'function',
                        containerName: functionName,
                        filePath: filePath,
                        metadata: {
                            namingConvention: true,
                            detectedVia: 'naming_pattern_analysis'
                        }
                    });
                }
            }
        }
        return handlers;
    };
    // Helper methods for event detection
    /**
     * Check if file imports React
     * @private
     */
    EventDetector.prototype.hasReactImport = function (analysis) {
        if (!analysis.imports)
            return false;
        return Object.keys(analysis.imports).some(function (moduleName) {
            return moduleName === 'react' ||
                moduleName.startsWith('react/');
        });
    };
    /**
     * Check if file imports Electron
     * @private
     */
    EventDetector.prototype.hasElectronImport = function (analysis) {
        if (!analysis.imports)
            return false;
        return Object.keys(analysis.imports).some(function (moduleName) {
            return moduleName === 'electron' ||
                moduleName.includes('electron');
        });
    };
    /**
     * Check if file imports Django
     * @private
     */
    EventDetector.prototype.hasDjangoImport = function (analysis) {
        if (!analysis.imports)
            return false;
        return Object.keys(analysis.imports).some(function (moduleName) {
            return moduleName.startsWith('django') ||
                moduleName.includes('django');
        });
    };
    /**
     * Check if event handler is DOM-related
     * @private
     */
    EventDetector.prototype.isDOMEventHandler = function (eventHandler) {
        var domPatterns = [
            'addEventListener',
            'onclick', 'onchange', 'onsubmit', 'onload',
            'onclick=', 'onchange=', 'onsubmit='
        ];
        return domPatterns.some(function (pattern) { return eventHandler.toLowerCase().includes(pattern); });
    };
    /**
     * Check if event handler is React-related
     * @private
     */
    EventDetector.prototype.isReactEventHandler = function (eventHandler) {
        var reactPatterns = [
            'onClick', 'onChange', 'onSubmit', 'onFocus', 'onBlur',
            'onMouseOver', 'onMouseOut', 'onKeyDown', 'onKeyUp'
        ];
        return reactPatterns.some(function (pattern) { return eventHandler.includes(pattern); });
    };
    /**
     * Check if event handler is Electron IPC-related
     * @private
     */
    EventDetector.prototype.isElectronIPCHandler = function (eventHandler) {
        var ipcPatterns = [
            'ipc_handle', 'ipc_on', 'ipcMain.handle', 'ipcMain.on',
            'ipcRenderer.on', 'ipcRenderer.send'
        ];
        return ipcPatterns.some(function (pattern) { return eventHandler.includes(pattern); });
    };
    /**
     * Get DOM event type from handler string
     * @private
     */
    EventDetector.prototype.getDOMEventType = function (eventHandler) {
        if (eventHandler.includes('addEventListener'))
            return 'addEventListener';
        return 'dom_event';
    };
    /**
     * Get React event type from handler string
     * @private
     */
    EventDetector.prototype.getReactEventType = function (eventHandler) {
        if (eventHandler.includes('onClick'))
            return 'onClick';
        if (eventHandler.includes('onChange'))
            return 'onChange';
        if (eventHandler.includes('onSubmit'))
            return 'onSubmit';
        return 'react_event';
    };
    /**
     * Get Electron IPC type from handler string
     * @private
     */
    EventDetector.prototype.getElectronIPCType = function (eventHandler) {
        if (eventHandler.includes('handle'))
            return 'ipc_handle';
        if (eventHandler.includes('on'))
            return 'ipc_on';
        return 'ipc_handle';
    };
    /**
     * Extract event name from handler string
     * @private
     */
    EventDetector.prototype.extractEventName = function (eventHandler) {
        // Try to extract event name from addEventListener('event', handler)
        var match = eventHandler.match(/addEventListener\s*\(\s*['"]([^'"]+)['"]/);
        if (match && match[1]) {
            return match[1];
        }
        // Extract from onclick, onchange, etc.
        var onMatch = eventHandler.match(/on([a-zA-Z]+)/i);
        if (onMatch && onMatch[1]) {
            return onMatch[1].toLowerCase();
        }
        return 'unknown';
    };
    /**
     * Extract React event name from handler string
     * @private
     */
    EventDetector.prototype.extractReactEventName = function (eventHandler) {
        var match = eventHandler.match(/on([A-Z][a-zA-Z]*)/);
        if (match && match[1]) {
            return match[1].toLowerCase();
        }
        return 'click';
    };
    /**
     * Extract IPC channel from handler string
     * @private
     */
    EventDetector.prototype.extractIPCChannel = function (eventHandler) {
        var match = eventHandler.match(/['"]([^'"]*)['"]/);
        if (match && match[1]) {
            return match[1];
        }
        return 'unknown-channel';
    };
    /**
     * Detect DOM patterns in a function
     * @private
     */
    EventDetector.prototype.detectDOMPatternsInFunction = function (filePath, functionName, functionInfo) {
        var handlers = [];
        // Check function naming patterns for event handlers
        var domEventNames = [
            'click', 'change', 'submit', 'load', 'focus', 'blur',
            'mouseOver', 'mouseOut', 'keyDown', 'keyUp'
        ];
        for (var _i = 0, domEventNames_1 = domEventNames; _i < domEventNames_1.length; _i++) {
            var eventName = domEventNames_1[_i];
            if (functionName.toLowerCase().includes(eventName.toLowerCase())) {
                handlers.push({
                    type: 'dom_event',
                    event: eventName.toLowerCase(),
                    handler: functionName,
                    line: functionInfo.line_number || 0,
                    framework: 'DOM',
                    context: 'function',
                    containerName: functionName,
                    filePath: filePath,
                    metadata: {
                        inferredFromName: true,
                        detectedVia: 'function_naming_pattern'
                    }
                });
            }
        }
        return handlers;
    };
    /**
     * Detect React events by naming conventions
     * @private
     */
    EventDetector.prototype.detectReactEventsByNaming = function (filePath, functionName, functionInfo) {
        var handlers = [];
        // Check for handle* function patterns in React components
        var handlePatterns = [
            { pattern: /handle.*click/i, event: 'click', type: 'onClick' },
            { pattern: /handle.*change/i, event: 'change', type: 'onChange' },
            { pattern: /handle.*submit/i, event: 'submit', type: 'onSubmit' },
            { pattern: /on.*click/i, event: 'click', type: 'onClick' },
            { pattern: /on.*change/i, event: 'change', type: 'onChange' }
        ];
        for (var _i = 0, handlePatterns_1 = handlePatterns; _i < handlePatterns_1.length; _i++) {
            var _a = handlePatterns_1[_i], pattern = _a.pattern, event_1 = _a.event, type = _a.type;
            if (pattern.test(functionName)) {
                handlers.push({
                    type: type,
                    event: event_1,
                    handler: functionName,
                    line: functionInfo.line_number || 0,
                    framework: 'React',
                    context: 'function',
                    containerName: functionName,
                    filePath: filePath,
                    metadata: {
                        reactEventHandler: true,
                        namingPattern: pattern.source,
                        detectedVia: 'react_naming_convention'
                    }
                });
            }
        }
        return handlers;
    };
    /**
     * Check if function is an IPC setup function
     * @private
     */
    EventDetector.prototype.isIPCSetupFunction = function (functionName, functionInfo) {
        var ipcPatterns = [
            /setup.*ipc/i,
            /init.*ipc/i,
            /register.*handler/i,
            /.*handler.*setup/i
        ];
        return ipcPatterns.some(function (pattern) { return pattern.test(functionName); });
    };
    /**
     * Infer IPC channel from function name
     * @private
     */
    EventDetector.prototype.inferIPCChannel = function (functionName) {
        return functionName
            .replace(/setup|init|register|handler/gi, '')
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .replace(/^-/, '')
            .replace(/--+/g, '-') || 'unknown-channel';
    };
    /**
     * Check if function follows EventEmitter pattern
     * @private
     */
    EventDetector.prototype.isEventEmitterPattern = function (functionName, functionInfo, analysis) {
        var _a;
        // Check for EventEmitter imports
        var hasEventEmitterImport = analysis.imports && (((_a = analysis.imports['events']) === null || _a === void 0 ? void 0 : _a.includes('EventEmitter')) ||
            Object.keys(analysis.imports).some(function (module) { return module.includes('eventemitter'); }));
        // Check function naming patterns
        var emitterPatterns = [
            /emit/i,
            /.*listener/i,
            /.*observer/i,
            /notify/i
        ];
        return hasEventEmitterImport || emitterPatterns.some(function (pattern) { return pattern.test(functionName); });
    };
    /**
     * Check if function is a callback pattern
     * @private
     */
    EventDetector.prototype.isCallbackPattern = function (functionName, functionInfo) {
        var callbackPatterns = [
            /callback/i,
            /.*cb$/i,
            /on[A-Z]/,
            /.*done$/i,
            /.*complete$/i
        ];
        return callbackPatterns.some(function (pattern) { return pattern.test(functionName); });
    };
    /**
     * Extract custom event name from function name
     * @private
     */
    EventDetector.prototype.extractCustomEventName = function (functionName) {
        return functionName
            .replace(/emit|listener|observer|notify/gi, '')
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .replace(/^-/, '') || 'custom-event';
    };
    /**
     * Check if decorator is Django signal decorator
     * @private
     */
    EventDetector.prototype.isDjangoSignalDecorator = function (decorator) {
        var signalDecorators = [
            'receiver',
            'post_save',
            'pre_save',
            'post_delete',
            'pre_delete',
            'signal'
        ];
        return signalDecorators.some(function (signal) {
            return decorator.name.toLowerCase().includes(signal);
        });
    };
    /**
     * Extract signal name from decorator
     * @private
     */
    EventDetector.prototype.extractSignalName = function (decorator) {
        return decorator.name.toLowerCase().replace('_', '-');
    };
    /**
     * Check if function is Django form handler
     * @private
     */
    EventDetector.prototype.isDjangoFormHandler = function (functionName, functionInfo, analysis) {
        var _a;
        // Check for form-related imports
        var hasFormImports = analysis.imports && Object.keys(analysis.imports).some(function (module) {
            return module.includes('django.forms') || module.includes('forms');
        });
        // Check function patterns
        var formPatterns = [
            /.*form.*valid/i,
            /.*form.*submit/i,
            /post/i,
            /.*form.*save/i
        ];
        // Check if function has request parameter
        var hasRequestParam = (_a = functionInfo.parameters) === null || _a === void 0 ? void 0 : _a.some(function (param) {
            return param.toLowerCase().includes('request');
        });
        return (hasFormImports || hasRequestParam) &&
            formPatterns.some(function (pattern) { return pattern.test(functionName); });
    };
    /**
     * Check if function name suggests event handling
     * @private
     */
    EventDetector.prototype.hasEventHandlerNaming = function (functionName) {
        var handlerPatterns = [
            /handle/i,
            /on[A-Z]/,
            /.*click/i,
            /.*change/i,
            /.*submit/i,
            /.*handler/i,
            /.*listener/i,
            /.*callback/i
        ];
        return handlerPatterns.some(function (pattern) { return pattern.test(functionName); });
    };
    /**
     * Infer event type from function name
     * @private
     */
    EventDetector.prototype.inferEventTypeFromName = function (functionName) {
        var name = functionName.toLowerCase();
        if (name.includes('click'))
            return 'onClick';
        if (name.includes('change'))
            return 'onChange';
        if (name.includes('submit'))
            return 'onSubmit';
        if (name.includes('listener') || name.includes('addEventListener'))
            return 'addEventListener';
        return 'dom_event';
    };
    /**
     * Extract event name from function name
     * @private
     */
    EventDetector.prototype.extractEventFromName = function (functionName) {
        var name = functionName.toLowerCase();
        if (name.includes('click'))
            return 'click';
        if (name.includes('change'))
            return 'change';
        if (name.includes('submit'))
            return 'submit';
        if (name.includes('focus'))
            return 'focus';
        if (name.includes('blur'))
            return 'blur';
        if (name.includes('load'))
            return 'load';
        return 'unknown';
    };
    /**
     * Initialize event pattern configurations
     *
     * @returns Array of event pattern configurations
     * @private
     */
    EventDetector.prototype.initializeEventPatterns = function () {
        return [
            // DOM Events
            {
                type: 'addEventListener',
                framework: 'DOM',
                languages: ['javascript', 'typescript'],
                detection: 'content',
                pattern: /addEventListener\s*\(\s*['"]([^'"]+)['"]/,
                weight: 8
            },
            {
                type: 'dom_event',
                framework: 'DOM',
                languages: ['javascript', 'typescript'],
                detection: 'content',
                pattern: /\.on\w+\s*=/,
                weight: 6
            },
            // React Events
            {
                type: 'onClick',
                framework: 'React',
                languages: ['javascript', 'typescript'],
                detection: 'content',
                pattern: /onClick\s*=\s*{/,
                weight: 8
            },
            {
                type: 'onChange',
                framework: 'React',
                languages: ['javascript', 'typescript'],
                detection: 'content',
                pattern: /onChange\s*=\s*{/,
                weight: 8
            },
            {
                type: 'onSubmit',
                framework: 'React',
                languages: ['javascript', 'typescript'],
                detection: 'content',
                pattern: /onSubmit\s*=\s*{/,
                weight: 8
            },
            {
                type: 'react_event',
                framework: 'React',
                languages: ['javascript', 'typescript'],
                detection: 'content',
                pattern: /on[A-Z]\w+\s*=\s*{/,
                weight: 7
            },
            // Electron IPC
            {
                type: 'ipc_handle',
                framework: 'Electron',
                languages: ['javascript', 'typescript'],
                detection: 'content',
                pattern: /ipcMain\.handle\s*\(\s*['"]([^'"]*)['"]/,
                weight: 9
            },
            {
                type: 'ipc_on',
                framework: 'Electron',
                languages: ['javascript', 'typescript'],
                detection: 'content',
                pattern: /ipcMain\.on\s*\(\s*['"]([^'"]*)['"]/,
                weight: 9
            }
        ];
    };
    /**
     * Generate event detection statistics
     *
     * @param handlers - Array of detected event handlers
     * @returns Statistical summary of event detection
     */
    EventDetector.prototype.getDetectionStats = function (handlers) {
        var handlerDistribution = {
            'onClick': 0,
            'onChange': 0,
            'onSubmit': 0,
            'addEventListener': 0,
            'ipc_handle': 0,
            'ipc_on': 0,
            'dom_event': 0,
            'react_event': 0
        };
        var frameworkDistribution = {};
        var filesWithHandlers = new Set();
        var eventCounts = {};
        for (var _i = 0, handlers_1 = handlers; _i < handlers_1.length; _i++) {
            var handler = handlers_1[_i];
            // Count by handler type
            if (handler.type in handlerDistribution) {
                handlerDistribution[handler.type]++;
            }
            // Count by framework
            frameworkDistribution[handler.framework || 'Unknown'] =
                (frameworkDistribution[handler.framework || 'Unknown'] || 0) + 1;
            // Track files with handlers
            filesWithHandlers.add(handler.filePath);
            // Count event types
            if (handler.event) {
                eventCounts[handler.event] = (eventCounts[handler.event] || 0) + 1;
            }
        }
        // Get most common events
        var commonEvents = Object.entries(eventCounts)
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        })
            .slice(0, 10)
            .map(function (_a) {
            var event = _a[0], count = _a[1];
            return ({ event: event, count: count });
        });
        return {
            totalHandlers: handlers.length,
            handlerDistribution: handlerDistribution,
            frameworkDistribution: frameworkDistribution,
            filesWithHandlers: Array.from(filesWithHandlers),
            commonEvents: commonEvents
        };
    };
    /**
     * Get detailed detection report for debugging
     *
     * @param fileAnalyses - Map of file analyses
     * @returns Detailed detection report
     */
    EventDetector.prototype.getDetectionReport = function (fileAnalyses) {
        var oldDebugMode = this.debugMode;
        this.debugMode = true;
        var handlers = this.detectEventHandlers(fileAnalyses);
        var stats = this.getDetectionStats(handlers);
        this.debugMode = oldDebugMode;
        return {
            summary: stats,
            handlers: handlers.map(function (handler) { return ({
                type: handler.type,
                event: handler.event,
                handler: handler.handler,
                framework: handler.framework,
                context: handler.context,
                container: handler.containerName,
                file: handler.filePath,
                line: handler.line
            }); }),
            fileAnalysis: {
                totalFiles: fileAnalyses.size,
                languageDistribution: this.getLanguageDistribution(fileAnalyses),
                supportedPatterns: this.eventPatternConfigs.map(function (config) { return ({
                    type: config.type,
                    framework: config.framework,
                    languages: config.languages,
                    weight: config.weight
                }); })
            }
        };
    };
    /**
     * Get language distribution from file analyses
     * @private
     */
    EventDetector.prototype.getLanguageDistribution = function (fileAnalyses) {
        var distribution = {};
        for (var _i = 0, _a = fileAnalyses.values(); _i < _a.length; _i++) {
            var analysis = _a[_i];
            if (analysis.language) {
                distribution[analysis.language] = (distribution[analysis.language] || 0) + 1;
            }
        }
        return distribution;
    };
    return EventDetector;
}());
exports.EventDetector = EventDetector;
