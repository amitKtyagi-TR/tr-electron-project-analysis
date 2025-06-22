/**
 * Event Handler Detection Engine
 *
 * This module analyzes code to detect event handlers, listeners, and callback
 * patterns across different frameworks including DOM events, React events,
 * Electron IPC, and custom event systems.
 */

import type {
  FileAnalysis,
  EventHandler,
  EventHandlerType,
  SupportedLanguage
} from '../types/index.js';

/**
 * Extended event handler information with additional metadata
 */
export interface DetailedEventHandler extends EventHandler {
  /** Context where the event handler was found */
  context: 'function' | 'class' | 'global';
  /** Function or class name containing the handler */
  containerName: string;
  /** File where handler is defined */
  filePath: string;
  /** Additional metadata specific to the handler type */
  metadata?: Record<string, any>;
}

/**
 * Event handler statistics
 */
export interface EventDetectionStats {
  /** Total event handlers found */
  totalHandlers: number;
  /** Handlers by type */
  handlerDistribution: Record<EventHandlerType, number>;
  /** Handlers by framework */
  frameworkDistribution: Record<string, number>;
  /** Files containing event handlers */
  filesWithHandlers: string[];
  /** Most common event types */
  commonEvents: Array<{
    event: string;
    count: number;
  }>;
}

/**
 * Event pattern configuration for different frameworks
 */
interface EventPatternConfig {
  /** Event handler type identifier */
  type: EventHandlerType;
  /** Framework name */
  framework: string;
  /** Languages this pattern applies to */
  languages: SupportedLanguage[];
  /** Detection strategy */
  detection: 'content' | 'function_name' | 'decorator' | 'import';
  /** Pattern to match */
  pattern: string | RegExp;
  /** Required context (optional) */
  context?: string;
  /** Weight for confidence scoring */
  weight: number;
}

/**
 * Event handler detection engine
 *
 * This class analyzes file analysis results to detect event handlers
 * across multiple frameworks with detailed metadata extraction.
 */
export class EventDetector {
  private debugMode: boolean;
  private eventPatternConfigs: EventPatternConfig[];

  /**
   * Create a new event detector
   *
   * @param debugMode - Enable debug logging for event detection
   */
  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
    this.eventPatternConfigs = this.initializeEventPatterns();
  }

  /**
   * Detect event handlers from analyzed files
   *
   * @param fileAnalyses - Map of file paths to their analysis results
   * @returns Array of detected event handlers with detailed information
   */
  detectEventHandlers(fileAnalyses: Map<string, FileAnalysis>): DetailedEventHandler[] {
    if (this.debugMode) {
      console.log(`🔍 Starting event handler detection on ${fileAnalyses.size} files`);
    }

    const allHandlers: DetailedEventHandler[] = [];

    for (const [filePath, analysis] of fileAnalyses) {
      if (analysis.error) {
        continue; // Skip files with analysis errors
      }

      const fileHandlers = this.analyzeFileForEventHandlers(filePath, analysis);
      allHandlers.push(...fileHandlers);

      if (this.debugMode && fileHandlers.length > 0) {
        console.log(`  📄 ${filePath}: Found ${fileHandlers.length} event handlers`);
      }
    }

    // Sort handlers by file path and then by line number
    allHandlers.sort((a, b) => {
      if (a.filePath !== b.filePath) {
        return a.filePath.localeCompare(b.filePath);
      }
      return a.line - b.line;
    });

    if (this.debugMode) {
      console.log(`✅ Event detection complete. Found ${allHandlers.length} total handlers`);
    }

    return allHandlers;
  }

  /**
   * Analyze a single file for event handlers
   *
   * @param filePath - Path to the file being analyzed
   * @param analysis - File analysis result
   * @returns Array of event handlers found in this file
   * @private
   */
  private analyzeFileForEventHandlers(filePath: string, analysis: FileAnalysis): DetailedEventHandler[] {
    const handlers: DetailedEventHandler[] = [];

    // Detect handlers based on language and patterns
    if (analysis.language === 'javascript' || analysis.language === 'typescript') {
      // Check for DOM event handlers
      handlers.push(...this.detectDOMEventHandlers(filePath, analysis));

      // Check for React event handlers
      handlers.push(...this.detectReactEventHandlers(filePath, analysis));

      // Check for Electron IPC handlers
      handlers.push(...this.detectElectronIPCHandlers(filePath, analysis));

      // Check for custom event handlers
      handlers.push(...this.detectCustomEventHandlers(filePath, analysis));
    } else if (analysis.language === 'python') {
      // Check for Django event handlers (signals, etc.)
      handlers.push(...this.detectDjangoEventHandlers(filePath, analysis));
    }

    // Check for generic event patterns
    handlers.push(...this.detectGenericEventHandlers(filePath, analysis));

    return handlers;
  }

/**
   * Detect DOM event handlers
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns DOM event handlers found
   * @private
   */
  private detectDOMEventHandlers(filePath: string, analysis: FileAnalysis): DetailedEventHandler[] {
    const handlers: DetailedEventHandler[] = [];

    if (this.debugMode) {
      console.log(`  🌐 Analyzing ${filePath} for DOM event handlers`);
    }

    // Check functions for addEventListener patterns
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0] || 'anonymous';

        // Check existing event_handlers detected by analyzers
        if (functionInfo.event_handlers && functionInfo.event_handlers.length > 0) {
          for (const eventHandler of functionInfo.event_handlers) {
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
        handlers.push(...this.detectDOMPatternsInFunction(
          filePath,
          functionName,
          functionInfo
        ));
      }
    }

    return handlers;
  }

  /**
   * Detect React event handlers
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns React event handlers found
   * @private
   */
  private detectReactEventHandlers(filePath: string, analysis: FileAnalysis): DetailedEventHandler[] {
    const handlers: DetailedEventHandler[] = [];

    // Check if this file uses React
    if (!this.hasReactImport(analysis)) {
      return handlers;
    }

    if (this.debugMode) {
      console.log(`  ⚛️  Analyzing ${filePath} for React event handlers`);
    }

    // Check functions for React event patterns
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0] || 'anonymous';

        // Check existing event_handlers
        if (functionInfo.event_handlers && functionInfo.event_handlers.length > 0) {
          for (const eventHandler of functionInfo.event_handlers) {
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
        const firstChar = functionName[0];

        if (functionInfo.is_component || (firstChar && firstChar === firstChar.toUpperCase())) {
          handlers.push(...this.detectReactEventsByNaming(
            filePath,
            functionName,
            functionInfo
          ));
        }
      }
    }

    return handlers;
  }

  /**
   * Detect Electron IPC handlers
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns Electron IPC handlers found
   * @private
   */
  private detectElectronIPCHandlers(filePath: string, analysis: FileAnalysis): DetailedEventHandler[] {
    const handlers: DetailedEventHandler[] = [];

    // Check if this file uses Electron
    if (!this.hasElectronImport(analysis)) {
      return handlers;
    }

    if (this.debugMode) {
      console.log(`  ⚡ Analyzing ${filePath} for Electron IPC handlers`);
    }

    // Check functions for IPC patterns
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0] || 'anonymous';

        // Check existing event_handlers for IPC patterns
        if (functionInfo.event_handlers && functionInfo.event_handlers.length > 0) {
          for (const eventHandler of functionInfo.event_handlers) {
            if (this.isElectronIPCHandler(eventHandler)) {
              const ipcType = this.getElectronIPCType(eventHandler);
              const channel = this.extractIPCChannel(eventHandler);

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
  }

  /**
   * Detect custom event handlers
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns Custom event handlers found
   * @private
   */
  private detectCustomEventHandlers(filePath: string, analysis: FileAnalysis): DetailedEventHandler[] {
    const handlers: DetailedEventHandler[] = [];

    if (this.debugMode) {
      console.log(`  🔧 Analyzing ${filePath} for custom event handlers`);
    }

    // Check for custom event emitter patterns
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0] || 'anonymous';

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
  }

  /**
   * Detect Django event handlers
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns Django event handlers found
   * @private
   */
  private detectDjangoEventHandlers(filePath: string, analysis: FileAnalysis): DetailedEventHandler[] {
    const handlers: DetailedEventHandler[] = [];

    // Check if this file uses Django
    if (!this.hasDjangoImport(analysis)) {
      return handlers;
    }

    if (this.debugMode) {
      console.log(`  🎯 Analyzing ${filePath} for Django event handlers`);
    }

    // Check for Django signals
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0] || 'anonymous';

        // Check for signal handler decorators
        if (functionInfo.decorators && Array.isArray(functionInfo.decorators)) {
          for (const decorator of functionInfo.decorators) {
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
  }

  /**
   * Detect generic event handlers
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns Generic event handlers found
   * @private
   */
  private detectGenericEventHandlers(filePath: string, analysis: FileAnalysis): DetailedEventHandler[] {
    const handlers: DetailedEventHandler[] = [];

    if (this.debugMode) {
      console.log(`  🔧 Analyzing ${filePath} for generic event handlers`);
    }

    // Check for generic event handler naming patterns
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0] || 'anonymous';

        // Check for handler naming conventions
        if (this.hasEventHandlerNaming(functionName)) {
          const eventType = this.inferEventTypeFromName(functionName);

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
  }

  // Helper methods for event detection

  /**
   * Check if file imports React
   * @private
   */
  private hasReactImport(analysis: FileAnalysis): boolean {
    if (!analysis.imports) return false;

    return Object.keys(analysis.imports).some(moduleName =>
      moduleName === 'react' ||
      moduleName.startsWith('react/')
    );
  }

  /**
   * Check if file imports Electron
   * @private
   */
  private hasElectronImport(analysis: FileAnalysis): boolean {
    if (!analysis.imports) return false;

    return Object.keys(analysis.imports).some(moduleName =>
      moduleName === 'electron' ||
      moduleName.includes('electron')
    );
  }

  /**
   * Check if file imports Django
   * @private
   */
  private hasDjangoImport(analysis: FileAnalysis): boolean {
    if (!analysis.imports) return false;

    return Object.keys(analysis.imports).some(moduleName =>
      moduleName.startsWith('django') ||
      moduleName.includes('django')
    );
  }

  /**
   * Check if event handler is DOM-related
   * @private
   */
  private isDOMEventHandler(eventHandler: string): boolean {
    const domPatterns = [
      'addEventListener',
      'onclick', 'onchange', 'onsubmit', 'onload',
      'onclick=', 'onchange=', 'onsubmit='
    ];

    return domPatterns.some(pattern => eventHandler.toLowerCase().includes(pattern));
  }

  /**
   * Check if event handler is React-related
   * @private
   */
  private isReactEventHandler(eventHandler: string): boolean {
    const reactPatterns = [
      'onClick', 'onChange', 'onSubmit', 'onFocus', 'onBlur',
      'onMouseOver', 'onMouseOut', 'onKeyDown', 'onKeyUp'
    ];

    return reactPatterns.some(pattern => eventHandler.includes(pattern));
  }

  /**
   * Check if event handler is Electron IPC-related
   * @private
   */
  private isElectronIPCHandler(eventHandler: string): boolean {
    const ipcPatterns = [
      'ipc_handle', 'ipc_on', 'ipcMain.handle', 'ipcMain.on',
      'ipcRenderer.on', 'ipcRenderer.send'
    ];

    return ipcPatterns.some(pattern => eventHandler.includes(pattern));
  }

  /**
   * Get DOM event type from handler string
   * @private
   */
  private getDOMEventType(eventHandler: string): EventHandlerType {
    if (eventHandler.includes('addEventListener')) return 'addEventListener';
    return 'dom_event';
  }

  /**
   * Get React event type from handler string
   * @private
   */
  private getReactEventType(eventHandler: string): EventHandlerType {
    if (eventHandler.includes('onClick')) return 'onClick';
    if (eventHandler.includes('onChange')) return 'onChange';
    if (eventHandler.includes('onSubmit')) return 'onSubmit';
    return 'react_event';
  }

  /**
   * Get Electron IPC type from handler string
   * @private
   */
  private getElectronIPCType(eventHandler: string): EventHandlerType {
    if (eventHandler.includes('handle')) return 'ipc_handle';
    if (eventHandler.includes('on')) return 'ipc_on';
    return 'ipc_handle';
  }

  /**
   * Extract event name from handler string
   * @private
   */
  private extractEventName(eventHandler: string): string {
    // Try to extract event name from addEventListener('event', handler)
    const match = eventHandler.match(/addEventListener\s*\(\s*['"]([^'"]+)['"]/);
    if (match && match[1]) {
      return match[1];
    }

    // Extract from onclick, onchange, etc.
    const onMatch = eventHandler.match(/on([a-zA-Z]+)/i);
    if (onMatch && onMatch[1]) {
      return onMatch[1].toLowerCase();
    }

    return 'unknown';
  }

  /**
   * Extract React event name from handler string
   * @private
   */
  private extractReactEventName(eventHandler: string): string {
    const match = eventHandler.match(/on([A-Z][a-zA-Z]*)/);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
    return 'click';
  }

  /**
   * Extract IPC channel from handler string
   * @private
   */
  private extractIPCChannel(eventHandler: string): string {
    const match = eventHandler.match(/['"]([^'"]*)['"]/);
    if (match && match[1]) {
      return match[1];
    }
    return 'unknown-channel';
  }

  /**
   * Detect DOM patterns in a function
   * @private
   */
  private detectDOMPatternsInFunction(
    filePath: string,
    functionName: string,
    functionInfo: any
  ): DetailedEventHandler[] {
    const handlers: DetailedEventHandler[] = [];

    // Check function naming patterns for event handlers
    const domEventNames = [
      'click', 'change', 'submit', 'load', 'focus', 'blur',
      'mouseOver', 'mouseOut', 'keyDown', 'keyUp'
    ];

    for (const eventName of domEventNames) {
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
  }

  /**
   * Detect React events by naming conventions
   * @private
   */
  private detectReactEventsByNaming(
    filePath: string,
    functionName: string,
    functionInfo: any
  ): DetailedEventHandler[] {
    const handlers: DetailedEventHandler[] = [];

    // Check for handle* function patterns in React components
    const handlePatterns = [
      { pattern: /handle.*click/i, event: 'click', type: 'onClick' as EventHandlerType },
      { pattern: /handle.*change/i, event: 'change', type: 'onChange' as EventHandlerType },
      { pattern: /handle.*submit/i, event: 'submit', type: 'onSubmit' as EventHandlerType },
      { pattern: /on.*click/i, event: 'click', type: 'onClick' as EventHandlerType },
      { pattern: /on.*change/i, event: 'change', type: 'onChange' as EventHandlerType }
    ];

    for (const { pattern, event, type } of handlePatterns) {
      if (pattern.test(functionName)) {
        handlers.push({
          type: type,
          event: event,
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
  }

  /**
   * Check if function is an IPC setup function
   * @private
   */
  private isIPCSetupFunction(functionName: string, functionInfo: any): boolean {
    const ipcPatterns = [
      /setup.*ipc/i,
      /init.*ipc/i,
      /register.*handler/i,
      /.*handler.*setup/i
    ];

    return ipcPatterns.some(pattern => pattern.test(functionName));
  }

  /**
   * Infer IPC channel from function name
   * @private
   */
  private inferIPCChannel(functionName: string): string {
    return functionName
      .replace(/setup|init|register|handler/gi, '')
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
      .replace(/--+/g, '-') || 'unknown-channel';
  }

  /**
   * Check if function follows EventEmitter pattern
   * @private
   */
  private isEventEmitterPattern(functionName: string, functionInfo: any, analysis: FileAnalysis): boolean {
    // Check for EventEmitter imports
    const hasEventEmitterImport = analysis.imports && (
      analysis.imports['events']?.includes('EventEmitter') ||
      Object.keys(analysis.imports).some(module => module.includes('eventemitter'))
    );

    // Check function naming patterns
    const emitterPatterns = [
      /emit/i,
      /.*listener/i,
      /.*observer/i,
      /notify/i
    ];

    return hasEventEmitterImport || emitterPatterns.some(pattern => pattern.test(functionName));
  }

  /**
   * Check if function is a callback pattern
   * @private
   */
  private isCallbackPattern(functionName: string, functionInfo: any): boolean {
    const callbackPatterns = [
      /callback/i,
      /.*cb$/i,
      /on[A-Z]/,
      /.*done$/i,
      /.*complete$/i
    ];

    return callbackPatterns.some(pattern => pattern.test(functionName));
  }

  /**
   * Extract custom event name from function name
   * @private
   */
  private extractCustomEventName(functionName: string): string {
    return functionName
      .replace(/emit|listener|observer|notify/gi, '')
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '') || 'custom-event';
  }

  /**
   * Check if decorator is Django signal decorator
   * @private
   */
  private isDjangoSignalDecorator(decorator: any): boolean {
    const signalDecorators = [
      'receiver',
      'post_save',
      'pre_save',
      'post_delete',
      'pre_delete',
      'signal'
    ];

    return signalDecorators.some(signal =>
      decorator.name.toLowerCase().includes(signal)
    );
  }

  /**
   * Extract signal name from decorator
   * @private
   */
  private extractSignalName(decorator: any): string {
    return decorator.name.toLowerCase().replace('_', '-');
  }

  /**
   * Check if function is Django form handler
   * @private
   */
  private isDjangoFormHandler(functionName: string, functionInfo: any, analysis: FileAnalysis): boolean {
    // Check for form-related imports
    const hasFormImports = analysis.imports && Object.keys(analysis.imports).some(module =>
      module.includes('django.forms') || module.includes('forms')
    );

    // Check function patterns
    const formPatterns = [
      /.*form.*valid/i,
      /.*form.*submit/i,
      /post/i,
      /.*form.*save/i
    ];

    // Check if function has request parameter
    const hasRequestParam = functionInfo.parameters?.some((param: string) =>
      param.toLowerCase().includes('request')
    );

    return (hasFormImports || hasRequestParam) &&
           formPatterns.some(pattern => pattern.test(functionName));
  }

  /**
   * Check if function name suggests event handling
   * @private
   */
  private hasEventHandlerNaming(functionName: string): boolean {
    const handlerPatterns = [
      /handle/i,
      /on[A-Z]/,
      /.*click/i,
      /.*change/i,
      /.*submit/i,
      /.*handler/i,
      /.*listener/i,
      /.*callback/i
    ];

    return handlerPatterns.some(pattern => pattern.test(functionName));
  }

  /**
   * Infer event type from function name
   * @private
   */
  private inferEventTypeFromName(functionName: string): EventHandlerType {
    const name = functionName.toLowerCase();

    if (name.includes('click')) return 'onClick';
    if (name.includes('change')) return 'onChange';
    if (name.includes('submit')) return 'onSubmit';
    if (name.includes('listener') || name.includes('addEventListener')) return 'addEventListener';

    return 'dom_event';
  }

  /**
   * Extract event name from function name
   * @private
   */
  private extractEventFromName(functionName: string): string {
    const name = functionName.toLowerCase();

    if (name.includes('click')) return 'click';
    if (name.includes('change')) return 'change';
    if (name.includes('submit')) return 'submit';
    if (name.includes('focus')) return 'focus';
    if (name.includes('blur')) return 'blur';
    if (name.includes('load')) return 'load';

    return 'unknown';
  }


  /**
   * Initialize event pattern configurations
   *
   * @returns Array of event pattern configurations
   * @private
   */
  private initializeEventPatterns(): EventPatternConfig[] {
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
  }

  /**
   * Generate event detection statistics
   *
   * @param handlers - Array of detected event handlers
   * @returns Statistical summary of event detection
   */
  getDetectionStats(handlers: DetailedEventHandler[]): EventDetectionStats {
    const handlerDistribution: Record<EventHandlerType, number> = {
      'onClick': 0,
      'onChange': 0,
      'onSubmit': 0,
      'addEventListener': 0,
      'ipc_handle': 0,
      'ipc_on': 0,
      'dom_event': 0,
      'react_event': 0
    };

    const frameworkDistribution: Record<string, number> = {};
    const filesWithHandlers = new Set<string>();
    const eventCounts: Record<string, number> = {};

    for (const handler of handlers) {
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
    const commonEvents = Object.entries(eventCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }));

    return {
      totalHandlers: handlers.length,
      handlerDistribution,
      frameworkDistribution,
      filesWithHandlers: Array.from(filesWithHandlers),
      commonEvents
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

    const handlers = this.detectEventHandlers(fileAnalyses);
    const stats = this.getDetectionStats(handlers);

    this.debugMode = oldDebugMode;

    return {
      summary: stats,
      handlers: handlers.map(handler => ({
        type: handler.type,
        event: handler.event,
        handler: handler.handler,
        framework: handler.framework,
        context: handler.context,
        container: handler.containerName,
        file: handler.filePath,
        line: handler.line
      })),
      fileAnalysis: {
        totalFiles: fileAnalyses.size,
        languageDistribution: this.getLanguageDistribution(fileAnalyses),
        supportedPatterns: this.eventPatternConfigs.map(config => ({
          type: config.type,
          framework: config.framework,
          languages: config.languages,
          weight: config.weight
        }))
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
