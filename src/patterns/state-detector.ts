/**
 * State Management Pattern Detection Engine
 *
 * This module analyzes code to detect state management patterns across different
 * frameworks including React hooks, Redux, MobX, Django models, and other state
 * management solutions.
 */

import type {
  FileAnalysis,
  StateChange,
  StatePatternType,
  MutationType,
  SupportedLanguage
} from '../types/index.js';

/**
 * Extended state pattern information with additional metadata
 */
export interface DetailedStatePattern extends StateChange {
  /** Context where the state pattern was found */
  context: 'function' | 'class' | 'global';
  /** Function or class name containing the pattern */
  containerName: string;
  /** Framework that defines this state pattern */
  framework: string;
  /** File where pattern is defined */
  filePath: string;
  /** Additional metadata specific to the pattern type */
  metadata?: Record<string, any>;
}

/**
 * State pattern statistics
 */
export interface StateDetectionStats {
  /** Total state patterns found */
  totalPatterns: number;
  /** Patterns by type */
  patternDistribution: Record<StatePatternType, number>;
  /** Patterns by framework */
  frameworkDistribution: Record<string, number>;
  /** Files containing state patterns */
  filesWithState: string[];
  /** Most common mutation types */
  mutationDistribution: Record<MutationType, number>;
}

/**
 * State pattern configuration for different frameworks
 */
interface StatePatternConfig {
  /** Pattern type identifier */
  type: StatePatternType;
  /** Framework name */
  framework: string;
  /** Languages this pattern applies to */
  languages: SupportedLanguage[];
  /** Detection strategy */
  detection: 'import' | 'function_call' | 'decorator' | 'content';
  /** Pattern to match */
  pattern: string | RegExp;
  /** Required context (optional) */
  context?: string;
  /** Weight for confidence scoring */
  weight: number;
}

/**
 * State management pattern detection engine
 *
 * This class analyzes file analysis results to detect state management patterns
 * across multiple frameworks with detailed metadata extraction.
 */
export class StateDetector {
  private debugMode: boolean;
  private statePatternConfigs: StatePatternConfig[];

  /**
   * Create a new state detector
   *
   * @param debugMode - Enable debug logging for state detection
   */
  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
    this.statePatternConfigs = this.initializeStatePatterns();
  }

  /**
   * Detect state management patterns from analyzed files
   *
   * @param fileAnalyses - Map of file paths to their analysis results
   * @returns Array of detected state patterns with detailed information
   */
  detectStatePatterns(fileAnalyses: Map<string, FileAnalysis>): DetailedStatePattern[] {
    if (this.debugMode) {
      console.log(`🔍 Starting state pattern detection on ${fileAnalyses.size} files`);
    }

    const allPatterns: DetailedStatePattern[] = [];

    for (const [filePath, analysis] of fileAnalyses) {
      if (analysis.error) {
        continue; // Skip files with analysis errors
      }

      const filePatterns = this.analyzeFileForStatePatterns(filePath, analysis);
      allPatterns.push(...filePatterns);

      if (this.debugMode && filePatterns.length > 0) {
        console.log(`  📄 ${filePath}: Found ${filePatterns.length} state patterns`);
      }
    }

    // Sort patterns by file path and then by line number
    allPatterns.sort((a, b) => {
      if (a.filePath !== b.filePath) {
        return a.filePath.localeCompare(b.filePath);
      }
      return a.line - b.line;
    });

    if (this.debugMode) {
      console.log(`✅ State detection complete. Found ${allPatterns.length} total patterns`);
    }

    return allPatterns;
  }

  /**
   * Analyze a single file for state management patterns
   *
   * @param filePath - Path to the file being analyzed
   * @param analysis - File analysis result
   * @returns Array of state patterns found in this file
   * @private
   */
  private analyzeFileForStatePatterns(filePath: string, analysis: FileAnalysis): DetailedStatePattern[] {
    const patterns: DetailedStatePattern[] = [];

    // Detect patterns based on language and framework
    if (analysis.language === 'javascript' || analysis.language === 'typescript') {
      // React patterns
      patterns.push(...this.detectReactStatePatterns(filePath, analysis));

      // Redux patterns
      patterns.push(...this.detectReduxPatterns(filePath, analysis));

      // MobX patterns (if imports present)
      patterns.push(...this.detectMobXPatterns(filePath, analysis));
    } else if (analysis.language === 'python') {
      // Django patterns
      patterns.push(...this.detectDjangoStatePatterns(filePath, analysis));
    }

    // Generic state patterns (cross-framework)
    patterns.push(...this.detectGenericStatePatterns(filePath, analysis));

    return patterns;
  }

/**
   * Detect React state management patterns
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns React state patterns found
   * @private
   */
  private detectReactStatePatterns(filePath: string, analysis: FileAnalysis): DetailedStatePattern[] {
    const patterns: DetailedStatePattern[] = [];

    // Check if this file uses React
    if (!this.hasReactImport(analysis)) {
      return patterns;
    }

    if (this.debugMode) {
      console.log(`  ⚛️  Analyzing ${filePath} for React state patterns`);
    }

    // Detect patterns in functions (functional components and hooks)
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0] || 'anonymous';

        // Check existing state_changes detected by analyzers
        if (functionInfo.state_changes && functionInfo.state_changes.length > 0) {
          for (const stateChange of functionInfo.state_changes) {
            const reactPattern = this.parseReactStateChange(
              stateChange,
              filePath,
              functionName,
              functionInfo.line_number || 0,
              'function'
            );
            if (reactPattern) {
              patterns.push(reactPattern);
            }
          }
        }

        // Manual detection for React hooks and patterns
        patterns.push(...this.detectReactHooksInFunction(
          filePath,
          functionName,
          functionInfo,
          analysis
        ));
      }
    }

    // Detect patterns in classes (class components)
    if (analysis.classes) {
      for (const [className, classInfo] of Object.entries(analysis.classes)) {
        // Check if this is a React component class
        if (this.isReactComponentClass(classInfo)) {
          patterns.push(...this.detectReactClassState(
            filePath,
            className,
            classInfo
          ));
        }
      }
    }

    if (this.debugMode && patterns.length > 0) {
      console.log(`    ✓ Found ${patterns.length} React state patterns`);
    }

    return patterns;
  }

  /**
   * Check if file imports React
   * @private
   */
  private hasReactImport(analysis: FileAnalysis): boolean {
    if (!analysis.imports) return false;

    return Object.keys(analysis.imports).some(moduleName =>
      moduleName === 'react' ||
      moduleName.startsWith('react/') ||
      moduleName === '@types/react'
    );
  }

  /**
   * Parse a React state change from analyzer results
   * @private
   */
  private parseReactStateChange(
    stateChange: string,
    filePath: string,
    containerName: string,
    lineNumber: number,
    context: 'function' | 'class' | 'global'
  ): DetailedStatePattern | null {
    // Map state change strings to our state pattern types
    const stateChangeMap: Record<string, { type: StatePatternType; mutation: MutationType }> = {
      'useState': { type: 'useState', mutation: 'update' },
      'useReducer': { type: 'useReducer', mutation: 'update' },
      'setState': { type: 'setState', mutation: 'update' },
      'dispatch': { type: 'dispatch', mutation: 'update' }
    };

    for (const [pattern, config] of Object.entries(stateChangeMap)) {
      if (stateChange.includes(pattern)) {
        return {
          type: config.type,
          line: lineNumber,
          mutation_type: config.mutation,
          context: context,
          containerName: containerName,
          framework: 'React',
          filePath: filePath,
          variable: this.extractVariableName(stateChange, pattern),
          metadata: {
            originalPattern: stateChange,
            detectedVia: 'analyzer_state_changes'
          }
        };
      }
    }

    return null;
  }

  /**
   * Detect React hooks in a function
   * @private
   */
  private detectReactHooksInFunction(
    filePath: string,
    functionName: string,
    functionInfo: any,
    analysis: FileAnalysis
  ): DetailedStatePattern[] {
    const patterns: DetailedStatePattern[] = [];

    // Check if React hooks are imported
    const reactImports = analysis.imports?.['react'] || [];
    const hasUseStateImport = reactImports.includes('useState');
    const hasUseReducerImport = reactImports.includes('useReducer');
    const hasUseContextImport = reactImports.includes('useContext');
    const hasUseEffectImport = reactImports.includes('useEffect');

    // Detect useState patterns
    if (hasUseStateImport || functionInfo.is_hook) {
      patterns.push({
        type: 'useState',
        line: functionInfo.line_number || 0,
        mutation_type: 'update',
        context: 'function',
        containerName: functionName,
        framework: 'React',
        filePath: filePath,
        variable: this.inferStateVariableName(functionName, 'useState'),
        metadata: {
          isCustomHook: functionName.startsWith('use'),
          isComponent: functionInfo.is_component || false,
          detectedVia: 'import_analysis'
        }
      });
    }

    // Detect useReducer patterns
    if (hasUseReducerImport) {
      patterns.push({
        type: 'useReducer',
        line: functionInfo.line_number || 0,
        mutation_type: 'update',
        context: 'function',
        containerName: functionName,
        framework: 'React',
        filePath: filePath,
        variable: this.inferStateVariableName(functionName, 'useReducer'),
        metadata: {
          isCustomHook: functionName.startsWith('use'),
          isComponent: functionInfo.is_component || false,
          detectedVia: 'import_analysis'
        }
      });
    }

    // Detect useContext patterns (for Context API state)
    if (hasUseContextImport) {
      patterns.push({
        type: 'useState', // Context can be considered a state pattern
        line: functionInfo.line_number || 0,
        mutation_type: 'read',
        context: 'function',
        containerName: functionName,
        framework: 'React',
        filePath: filePath,
        variable: 'context',
        metadata: {
          patternType: 'useContext',
          isCustomHook: functionName.startsWith('use'),
          isComponent: functionInfo.is_component || false,
          detectedVia: 'context_api'
        }
      });
    }

    return patterns;
  }

  /**
   * Check if a class is a React component
   * @private
   */
  private isReactComponentClass(classInfo: any): boolean {
    if (!classInfo.base_classes) return false;

    const reactBaseClasses = [
      'Component',
      'PureComponent',
      'React.Component',
      'React.PureComponent'
    ];

    return classInfo.base_classes.some((baseClass: string) =>
      reactBaseClasses.some(reactClass => baseClass.includes(reactClass))
    );
  }

  /**
   * Detect React class component state patterns
   * @private
   */
  private detectReactClassState(
    filePath: string,
    className: string,
    classInfo: any
  ): DetailedStatePattern[] {
    const patterns: DetailedStatePattern[] = [];

    // Check for constructor with state initialization
    if (classInfo.methods && classInfo.methods['constructor']) {
      patterns.push({
        type: 'setState',
        line: classInfo.methods['constructor'].line_number || classInfo.line_number || 0,
        mutation_type: 'create',
        context: 'class',
        containerName: className,
        framework: 'React',
        filePath: filePath,
        variable: 'state',
        metadata: {
          patternType: 'state_initialization',
          detectedVia: 'constructor_analysis'
        }
      });
    }

    // Check for setState calls in methods
    if (classInfo.methods) {
      for (const [methodSignature, methodInfo] of Object.entries(classInfo.methods)) {
        const methodName = methodSignature.split('(')[0] || 'method';

        // Type guard for methodInfo
        if (!methodInfo || typeof methodInfo !== 'object') {
          continue;
        }

        const typedMethodInfo = methodInfo as any; // Cast to avoid TypeScript issues

        // Check if method has state changes
        if (typedMethodInfo.state_changes && Array.isArray(typedMethodInfo.state_changes) && typedMethodInfo.state_changes.length > 0) {
          for (const stateChange of typedMethodInfo.state_changes) {
            if (typeof stateChange === 'string' && stateChange.includes('setState')) {
              patterns.push({
                type: 'setState',
                line: typedMethodInfo.line_number || 0,
                mutation_type: 'update',
                context: 'class',
                containerName: `${className}.${methodName}`,
                framework: 'React',
                filePath: filePath,
                variable: this.extractVariableName(stateChange, 'setState'),
                metadata: {
                  method: methodName,
                  detectedVia: 'method_analysis'
                }
              });
            }
          }
        }

        // Look for lifecycle methods that typically manage state
        const lifecycleMethods = [
          'componentDidMount',
          'componentDidUpdate',
          'componentWillUnmount',
          'getDerivedStateFromProps'
        ];

        if (lifecycleMethods.includes(methodName)) {
          patterns.push({
            type: 'setState',
            line: typedMethodInfo.line_number || 0,
            mutation_type: 'update',
            context: 'class',
            containerName: `${className}.${methodName}`,
            framework: 'React',
            filePath: filePath,
            variable: 'lifecycle_state',
            metadata: {
              lifecycleMethod: methodName,
              detectedVia: 'lifecycle_analysis'
            }
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Extract variable name from state change pattern
   * @private
   */
  private extractVariableName(stateChange: string, pattern: string): string {
    // Try to extract variable name from common patterns

    // For useState: const [count, setCount] = useState(0)
    if (pattern === 'useState') {
      const match = stateChange.match(/\[([^,\]]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // For setState: this.setState({count: value})
    if (pattern === 'setState') {
      const match = stateChange.match(/setState\s*\(\s*\{([^:}]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // For dispatch: dispatch({type: 'INCREMENT', payload: value})
    if (pattern === 'dispatch') {
      const match = stateChange.match(/type:\s*['"]([^'"]+)['"]/);
      if (match && match[1]) {
        return match[1];
      }
    }

    return 'unknown';
  }

  /**
   * Infer state variable name from function name and pattern
   * @private
   */
  private inferStateVariableName(functionName: string, pattern: string): string {
    // For components and hooks, try to infer the state variable name
    if (pattern === 'useState') {
      // Remove common prefixes/suffixes and convert to state variable
      const cleanName = functionName
        .replace(/^use/, '')
        .replace(/Component$/, '')
        .replace(/Hook$/, '');

      return cleanName.toLowerCase() || 'state';
    }

    if (pattern === 'useReducer') {
      return functionName.replace(/^use/, '').toLowerCase() || 'state';
    }

    return 'state';
  }

/**
   * Detect Redux state management patterns
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns Redux state patterns found
   * @private
   */
  private detectReduxPatterns(filePath: string, analysis: FileAnalysis): DetailedStatePattern[] {
    const patterns: DetailedStatePattern[] = [];

    // Check if this file uses Redux
    if (!this.hasReduxImport(analysis)) {
      return patterns;
    }

    if (this.debugMode) {
      console.log(`  🔴 Analyzing ${filePath} for Redux patterns`);
    }

    // Detect Redux patterns in functions
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0] || 'anonymous';

        // Check for Redux action creators
        if (this.isReduxActionCreator(functionName, functionInfo)) {
          patterns.push({
            type: 'redux_action',
            line: functionInfo.line_number || 0,
            mutation_type: 'create',
            context: 'function',
            containerName: functionName,
            framework: 'Redux',
            filePath: filePath,
            variable: this.extractActionType(functionName),
            metadata: {
              actionCreator: functionName,
              detectedVia: 'function_analysis'
            }
          });
        }

        // Check for Redux reducers
        if (this.isReduxReducer(functionName, functionInfo)) {
          patterns.push({
            type: 'redux_reducer',
            line: functionInfo.line_number || 0,
            mutation_type: 'update',
            context: 'function',
            containerName: functionName,
            framework: 'Redux',
            filePath: filePath,
            variable: this.extractReducerStateType(functionName),
            metadata: {
              reducer: functionName,
              detectedVia: 'function_analysis'
            }
          });
        }

        // Check for dispatch calls in functions
        if (functionInfo.state_changes && functionInfo.state_changes.length > 0) {
          for (const stateChange of functionInfo.state_changes) {
            if (stateChange.includes('dispatch')) {
              patterns.push({
                type: 'dispatch',
                line: functionInfo.line_number || 0,
                mutation_type: 'update',
                context: 'function',
                containerName: functionName,
                framework: 'Redux',
                filePath: filePath,
                variable: this.extractDispatchAction(stateChange),
                metadata: {
                  originalCall: stateChange,
                  detectedVia: 'state_changes_analysis'
                }
              });
            }
          }
        }

        // Check for store creation
        if (this.isStoreCreation(functionName, functionInfo, analysis)) {
          patterns.push({
            type: 'redux_action', // Store creation is a type of action
            line: functionInfo.line_number || 0,
            mutation_type: 'create',
            context: 'function',
            containerName: functionName,
            framework: 'Redux',
            filePath: filePath,
            variable: 'store',
            metadata: {
              patternType: 'store_creation',
              detectedVia: 'store_analysis'
            }
          });
        }
      }
    }

    // Check for Redux Toolkit patterns (if using modern Redux)
    patterns.push(...this.detectReduxToolkitPatterns(filePath, analysis));

    if (this.debugMode && patterns.length > 0) {
      console.log(`    ✓ Found ${patterns.length} Redux patterns`);
    }

    return patterns;
  }

  /**
   * Check if file imports Redux
   * @private
   */
  private hasReduxImport(analysis: FileAnalysis): boolean {
    if (!analysis.imports) return false;

    return Object.keys(analysis.imports).some(moduleName =>
      moduleName === 'redux' ||
      moduleName === 'react-redux' ||
      moduleName === '@reduxjs/toolkit' ||
      moduleName.includes('redux')
    );
  }

  /**
   * Check if a function is a Redux action creator
   * @private
   */
  private isReduxActionCreator(functionName: string, functionInfo: any): boolean {
    // Common action creator naming patterns
    const actionCreatorPatterns = [
      /^(set|update|add|remove|delete|create|fetch|load|save).*/i,
      /.*Action$/i,
      /.*Creator$/i
    ];

    // Check naming patterns
    const matchesNaming = actionCreatorPatterns.some(pattern =>
      pattern.test(functionName)
    );

    // Check if function returns an object with 'type' property (common Redux action pattern)
    const hasActionStructure = functionInfo.docstring &&
      (functionInfo.docstring.includes('action') || functionInfo.docstring.includes('type'));

    // Check if it's a simple function that likely returns an action
    const isSimpleFunction = functionInfo.parameters &&
      functionInfo.parameters.length <= 3; // Action creators typically have few parameters

    return matchesNaming || hasActionStructure || (isSimpleFunction && functionName.length > 3);
  }

  /**
   * Check if a function is a Redux reducer
   * @private
   */
  private isReduxReducer(functionName: string, functionInfo: any): boolean {
    // Common reducer naming patterns
    const reducerPatterns = [
      /.*Reducer$/i,
      /^(state|app|root|main|user|auth|data).*/i
    ];

    // Check naming patterns
    const matchesNaming = reducerPatterns.some(pattern =>
      pattern.test(functionName)
    );

    // Check if function has typical reducer signature (state, action)
    const hasReducerSignature = functionInfo.parameters &&
      functionInfo.parameters.length === 2 &&
      (functionInfo.parameters.includes('state') || functionInfo.parameters.includes('action'));

    // Check if function is documented as a reducer
    const hasReducerDocumentation = functionInfo.docstring &&
      (functionInfo.docstring.includes('reducer') ||
       functionInfo.docstring.includes('state') && functionInfo.docstring.includes('action'));

    return matchesNaming || hasReducerSignature || hasReducerDocumentation;
  }

  /**
   * Check if a function creates a Redux store
   * @private
   */
  private isStoreCreation(functionName: string, functionInfo: any, analysis: FileAnalysis): boolean {
    // Check if Redux store creation functions are imported
    const hasStoreImports = analysis.imports && (
      analysis.imports['redux']?.includes('createStore') ||
      analysis.imports['redux']?.includes('configureStore') ||
      analysis.imports['@reduxjs/toolkit']?.includes('configureStore')
    );

    // Check function names that suggest store creation
    const storeCreationPatterns = [
      /createStore/i,
      /configureStore/i,
      /setupStore/i,
      /initStore/i
    ];

    const matchesStorePattern = storeCreationPatterns.some(pattern =>
      pattern.test(functionName)
    );

    return hasStoreImports || matchesStorePattern;
  }

  /**
   * Detect Redux Toolkit patterns (modern Redux)
   * @private
   */
  private detectReduxToolkitPatterns(filePath: string, analysis: FileAnalysis): DetailedStatePattern[] {
    const patterns: DetailedStatePattern[] = [];

    // Check for Redux Toolkit imports
    const hasRTKImports = analysis.imports &&
      Object.keys(analysis.imports).some(moduleName =>
        moduleName === '@reduxjs/toolkit'
      );

    if (!hasRTKImports) return patterns;

    // Look for createSlice usage
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0] || 'anonymous';

        // Check for slice creation
        if (functionName.includes('Slice') || functionName.includes('slice')) {
          patterns.push({
            type: 'redux_reducer',
            line: functionInfo.line_number || 0,
            mutation_type: 'create',
            context: 'function',
            containerName: functionName,
            framework: 'Redux Toolkit',
            filePath: filePath,
            variable: functionName.replace(/Slice$/, '').toLowerCase(),
            metadata: {
              toolkit: true,
              sliceName: functionName,
              detectedVia: 'rtk_slice_analysis'
            }
          });
        }

        // Check for async thunks
        if (functionName.includes('Thunk') || functionName.includes('thunk')) {
          patterns.push({
            type: 'redux_action',
            line: functionInfo.line_number || 0,
            mutation_type: 'create',
            context: 'function',
            containerName: functionName,
            framework: 'Redux Toolkit',
            filePath: filePath,
            variable: functionName.replace(/Thunk$/, '').toLowerCase(),
            metadata: {
              toolkit: true,
              thunkName: functionName,
              async: true,
              detectedVia: 'rtk_thunk_analysis'
            }
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Extract action type from action creator name
   * @private
   */
  private extractActionType(functionName: string): string {
    // Convert camelCase function names to ACTION_TYPE format
    return functionName
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '');
  }

  /**
   * Extract state type from reducer name
   * @private
   */
  private extractReducerStateType(functionName: string): string {
    // Remove 'Reducer' suffix and convert to lowercase
    return functionName
      .replace(/Reducer$/i, '')
      .toLowerCase();
  }

  /**
   * Extract action from dispatch call
   * @private
   */
  private extractDispatchAction(dispatchCall: string): string {
    // Try to extract action type from dispatch calls
    // dispatch(actionCreator()) or dispatch({type: 'ACTION_TYPE'})

    // Look for type property
    const typeMatch = dispatchCall.match(/type:\s*['"]([^'"]+)['"]/);
    if (typeMatch && typeMatch[1]) {
      return typeMatch[1];
    }

    // Look for function call pattern
    const functionMatch = dispatchCall.match(/dispatch\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
    if (functionMatch && functionMatch[1]) {
      return this.extractActionType(functionMatch[1]);
    }

    return 'unknown_action';
  }

/**
   * Detect MobX state management patterns
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns MobX state patterns found
   * @private
   */
  private detectMobXPatterns(filePath: string, analysis: FileAnalysis): DetailedStatePattern[] {
    const patterns: DetailedStatePattern[] = [];

    // Check if this file uses MobX
    if (!this.hasMobXImport(analysis)) {
      return patterns;
    }

    if (this.debugMode) {
      console.log(`  📦 Analyzing ${filePath} for MobX patterns`);
    }

    // Detect MobX observables and actions in classes
    if (analysis.classes) {
      for (const [className, classInfo] of Object.entries(analysis.classes)) {
        // Check for MobX decorators on class
        if (this.hasMobXDecorators(classInfo)) {
          patterns.push({
            type: 'mobx_observable',
            line: classInfo.line_number || 0,
            mutation_type: 'create',
            context: 'class',
            containerName: className,
            framework: 'MobX',
            filePath: filePath,
            variable: className.toLowerCase(),
            metadata: {
              storeClass: className,
              detectedVia: 'class_decorator_analysis'
            }
          });

          // Check methods for MobX actions
          if (classInfo.methods) {
            for (const [methodSignature, methodInfo] of Object.entries(classInfo.methods)) {
              const methodName = methodSignature.split('(')[0] || 'method';

              if (!methodInfo || typeof methodInfo !== 'object') {
                continue;
              }

              const typedMethodInfo = methodInfo as any;

              // Check for action decorators
              if (typedMethodInfo.decorators && Array.isArray(typedMethodInfo.decorators)) {
                for (const decorator of typedMethodInfo.decorators) {
                  if (decorator.name === 'action' || decorator.name.includes('action')) {
                    patterns.push({
                      type: 'mobx_observable',
                      line: typedMethodInfo.line_number || 0,
                      mutation_type: 'update',
                      context: 'class',
                      containerName: `${className}.${methodName}`,
                      framework: 'MobX',
                      filePath: filePath,
                      variable: methodName,
                      metadata: {
                        actionMethod: methodName,
                        storeClass: className,
                        detectedVia: 'action_decorator_analysis'
                      }
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    // Detect MobX patterns in functions
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0] || 'anonymous';

        // Check for observable creation functions
        if (this.isMobXObservableCreation(functionName, functionInfo)) {
          patterns.push({
            type: 'mobx_observable',
            line: functionInfo.line_number || 0,
            mutation_type: 'create',
            context: 'function',
            containerName: functionName,
            framework: 'MobX',
            filePath: filePath,
            variable: this.extractObservableName(functionName),
            metadata: {
              observableCreator: functionName,
              detectedVia: 'function_analysis'
            }
          });
        }
      }
    }

    if (this.debugMode && patterns.length > 0) {
      console.log(`    ✓ Found ${patterns.length} MobX patterns`);
    }

    return patterns;
  }

  /**
   * Detect Django state management patterns
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns Django state patterns found
   * @private
   */
  private detectDjangoStatePatterns(filePath: string, analysis: FileAnalysis): DetailedStatePattern[] {
    const patterns: DetailedStatePattern[] = [];

    // Check if this file uses Django
    if (!this.hasDjangoImport(analysis)) {
      return patterns;
    }

    if (this.debugMode) {
      console.log(`  🎯 Analyzing ${filePath} for Django state patterns`);
    }

    // Check if this is a models.py file
    const isModelsFile = filePath.includes('models.py') || filePath.includes('models/');

    // Detect Django model operations in functions
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0] || 'anonymous';

        // Check for Django ORM operations in function state changes
        if (functionInfo.state_changes && functionInfo.state_changes.length > 0) {
          for (const stateChange of functionInfo.state_changes) {
            const djangoPattern = this.parseDjangoStateChange(
              stateChange,
              filePath,
              functionName,
              functionInfo.line_number || 0
            );
            if (djangoPattern) {
              patterns.push(djangoPattern);
            }
          }
        }

        // Check for Django view functions that typically modify state
        if (this.isDjangoViewFunction(functionName, functionInfo, analysis)) {
          patterns.push({
            type: 'django_save', // Generic Django state operation
            line: functionInfo.line_number || 0,
            mutation_type: 'update',
            context: 'function',
            containerName: functionName,
            framework: 'Django',
            filePath: filePath,
            variable: this.extractModelNameFromView(functionName),
            metadata: {
              viewFunction: functionName,
              detectedVia: 'view_analysis'
            }
          });
        }
      }
    }

    // Detect Django model classes
    if (analysis.classes && isModelsFile) {
      for (const [className, classInfo] of Object.entries(analysis.classes)) {
        // Check if class extends Django Model
        if (this.isDjangoModelClass(classInfo)) {
          patterns.push({
            type: 'django_create',
            line: classInfo.line_number || 0,
            mutation_type: 'create',
            context: 'class',
            containerName: className,
            framework: 'Django',
            filePath: filePath,
            variable: className.toLowerCase(),
            metadata: {
              modelClass: className,
              detectedVia: 'model_class_analysis'
            }
          });

          // Check for model methods that modify state
          if (classInfo.methods) {
            for (const [methodSignature, methodInfo] of Object.entries(classInfo.methods)) {
              const methodName = methodSignature.split('(')[0] || 'method';

              if (!methodInfo || typeof methodInfo !== 'object') {
                continue;
              }

              if (this.isDjangoModelMethod(methodName)) {
                patterns.push({
                  type: 'django_save',
                  line: (methodInfo as any).line_number || 0,
                  mutation_type: this.getDjangoMethodMutationType(methodName),
                  context: 'class',
                  containerName: `${className}.${methodName}`,
                  framework: 'Django',
                  filePath: filePath,
                  variable: className.toLowerCase(),
                  metadata: {
                    modelMethod: methodName,
                    modelClass: className,
                    detectedVia: 'model_method_analysis'
                  }
                });
              }
            }
          }
        }
      }
    }

    if (this.debugMode && patterns.length > 0) {
      console.log(`    ✓ Found ${patterns.length} Django patterns`);
    }

    return patterns;
  }

  /**
   * Detect generic state patterns that work across frameworks
   *
   * @param filePath - File path
   * @param analysis - File analysis
   * @returns Generic state patterns found
   * @private
   */
  private detectGenericStatePatterns(filePath: string, analysis: FileAnalysis): DetailedStatePattern[] {
    const patterns: DetailedStatePattern[] = [];

    if (this.debugMode) {
      console.log(`  🔧 Analyzing ${filePath} for generic state patterns`);
    }

    // Detect state patterns already identified by analyzers but not framework-specific
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0] || 'anonymous';

        if (functionInfo.state_changes && functionInfo.state_changes.length > 0) {
          for (const stateChange of functionInfo.state_changes) {
            // Skip patterns already handled by specific framework detectors
            if (this.isFrameworkSpecificPattern(stateChange)) {
              continue;
            }

            // Detect generic state mutation patterns
            const genericPattern = this.parseGenericStatePattern(
              stateChange,
              filePath,
              functionName,
              functionInfo.line_number || 0,
              analysis.language || 'unknown'
            );

            if (genericPattern) {
              patterns.push(genericPattern);
            }
          }
        }
      }
    }

    // Look for common state-related variable names and patterns
    patterns.push(...this.detectStateVariablePatterns(filePath, analysis));

    if (this.debugMode && patterns.length > 0) {
      console.log(`    ✓ Found ${patterns.length} generic patterns`);
    }

    return patterns;
  }

  // Helper methods for the detection functions

  /**
   * Check if file imports MobX
   * @private
   */
  private hasMobXImport(analysis: FileAnalysis): boolean {
    if (!analysis.imports) return false;

    return Object.keys(analysis.imports).some(moduleName =>
      moduleName === 'mobx' ||
      moduleName === 'mobx-react' ||
      moduleName === 'mobx-state-tree' ||
      moduleName.includes('mobx')
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
   * Check if class has MobX decorators
   * @private
   */
  private hasMobXDecorators(classInfo: any): boolean {
    if (!classInfo.decorators) return false;

    const mobxDecorators = ['observable', 'observer', 'computed', 'action'];

    return classInfo.decorators.some((decorator: any) =>
      mobxDecorators.some(mobxDec => decorator.name.includes(mobxDec))
    );
  }

  /**
   * Check if function creates MobX observables
   * @private
   */
  private isMobXObservableCreation(functionName: string, functionInfo: any): boolean {
    const observablePatterns = [
      /createStore/i,
      /makeObservable/i,
      /observable/i,
      /Store$/i
    ];

    return observablePatterns.some(pattern => pattern.test(functionName)) ||
           (functionInfo.docstring && functionInfo.docstring.includes('observable'));
  }

  /**
   * Extract observable name from function name
   * @private
   */
  private extractObservableName(functionName: string): string {
    return functionName
      .replace(/^create/, '')
      .replace(/Store$/, '')
      .toLowerCase() || 'observable';
  }

  /**
   * Parse Django state change patterns
   * @private
   */
  private parseDjangoStateChange(
    stateChange: string,
    filePath: string,
    containerName: string,
    lineNumber: number
  ): DetailedStatePattern | null {
    const djangoPatterns = [
      { pattern: 'django_save', type: 'django_save' as StatePatternType, mutation: 'update' as MutationType },
      { pattern: 'django_create', type: 'django_create' as StatePatternType, mutation: 'create' as MutationType },
      { pattern: 'django_update', type: 'django_update' as StatePatternType, mutation: 'update' as MutationType },
      { pattern: 'django_delete', type: 'django_delete' as StatePatternType, mutation: 'delete' as MutationType },
      { pattern: '.save(', type: 'django_save' as StatePatternType, mutation: 'update' as MutationType },
      { pattern: '.create(', type: 'django_create' as StatePatternType, mutation: 'create' as MutationType },
      { pattern: '.update(', type: 'django_update' as StatePatternType, mutation: 'update' as MutationType },
      { pattern: '.delete(', type: 'django_delete' as StatePatternType, mutation: 'delete' as MutationType }
    ];

    for (const { pattern, type, mutation } of djangoPatterns) {
      if (stateChange.includes(pattern)) {
        return {
          type: type,
          line: lineNumber,
          mutation_type: mutation,
          context: 'function',
          containerName: containerName,
          framework: 'Django',
          filePath: filePath,
          variable: this.extractDjangoModelName(stateChange),
          metadata: {
            originalPattern: stateChange,
            detectedVia: 'state_change_analysis'
          }
        };
      }
    }

    return null;
  }

  /**
   * Check if function is a Django view
   * @private
   */
  private isDjangoViewFunction(functionName: string, functionInfo: any, analysis: FileAnalysis): boolean {
    // Check if function has request parameter (typical Django view signature)
    const hasRequestParam = functionInfo.parameters?.some((param: string) =>
      param.toLowerCase().includes('request')
    );

    // Check if file imports Django views
    const hasViewImports = analysis.imports && Object.keys(analysis.imports).some(moduleName =>
      moduleName.includes('django.views') || moduleName.includes('django.shortcuts')
    );

    // Check naming patterns
    const viewPatterns = [
      /.*View$/i,
      /.*List$/i,
      /.*Detail$/i,
      /.*Create$/i,
      /.*Update$/i,
      /.*Delete$/i
    ];

    const matchesViewPattern = viewPatterns.some(pattern => pattern.test(functionName));

    return hasRequestParam || (hasViewImports && matchesViewPattern);
  }

  /**
   * Check if class is Django model
   * @private
   */
  private isDjangoModelClass(classInfo: any): boolean {
    if (!classInfo.base_classes) return false;

    const modelBaseClasses = [
      'Model',
      'models.Model',
      'django.db.models.Model'
    ];

    return classInfo.base_classes.some((baseClass: string) =>
      modelBaseClasses.some(modelClass => baseClass.includes(modelClass))
    );
  }

  /**
   * Check if method is Django model method
   * @private
   */
  private isDjangoModelMethod(methodName: string): boolean {
    const modelMethods = [
      'save',
      'delete',
      'create',
      'update',
      'get_or_create',
      'update_or_create'
    ];

    return modelMethods.includes(methodName);
  }

  /**
   * Get mutation type for Django method
   * @private
   */
  private getDjangoMethodMutationType(methodName: string): MutationType {
    const mutationMap: Record<string, MutationType> = {
      'save': 'update',
      'create': 'create',
      'update': 'update',
      'delete': 'delete',
      'get_or_create': 'create',
      'update_or_create': 'update'
    };

    return mutationMap[methodName] || 'update';
  }

  /**
   * Extract model name from Django state change
   * @private
   */
  private extractDjangoModelName(stateChange: string): string {
    // Try to extract model name from patterns like User.objects.create()
    const modelMatch = stateChange.match(/(\w+)\.objects\./);
    if (modelMatch && modelMatch[1]) {
      return modelMatch[1].toLowerCase();
    }

    // Try to extract from variable.save() patterns
    const saveMatch = stateChange.match(/(\w+)\.save\(/);
    if (saveMatch && saveMatch[1]) {
      return saveMatch[1].toLowerCase();
    }

    return 'model';
  }

  /**
   * Extract model name from view function name
   * @private
   */
  private extractModelNameFromView(functionName: string): string {
    return functionName
      .replace(/View$/, '')
      .replace(/List$/, '')
      .replace(/Detail$/, '')
      .replace(/Create$/, '')
      .replace(/Update$/, '')
      .replace(/Delete$/, '')
      .toLowerCase() || 'model';
  }

  /**
   * Check if pattern is framework-specific
   * @private
   */
  private isFrameworkSpecificPattern(stateChange: string): boolean {
    const frameworkPatterns = [
      'useState', 'useReducer', 'setState', 'dispatch', // React/Redux
      'observable', 'action', 'computed', // MobX
      'django_save', 'django_create', 'django_update', 'django_delete' // Django
    ];

    return frameworkPatterns.some(pattern => stateChange.includes(pattern));
  }

  /**
   * Parse generic state patterns
   * @private
   */
  private parseGenericStatePattern(
    stateChange: string,
    filePath: string,
    containerName: string,
    lineNumber: number,
    language: string
  ): DetailedStatePattern | null {
    // Generic state mutation patterns
    const genericPatterns = [
      { pattern: /set\w+/i, type: 'useState' as StatePatternType, mutation: 'update' as MutationType },
      { pattern: /update\w+/i, type: 'useState' as StatePatternType, mutation: 'update' as MutationType },
      { pattern: /create\w+/i, type: 'useState' as StatePatternType, mutation: 'create' as MutationType },
      { pattern: /delete\w+/i, type: 'useState' as StatePatternType, mutation: 'delete' as MutationType },
      { pattern: /add\w+/i, type: 'useState' as StatePatternType, mutation: 'create' as MutationType },
      { pattern: /remove\w+/i, type: 'useState' as StatePatternType, mutation: 'delete' as MutationType }
    ];

    for (const { pattern, type, mutation } of genericPatterns) {
      if (pattern.test(stateChange)) {
        return {
          type: type,
          line: lineNumber,
          mutation_type: mutation,
          context: 'function',
          containerName: containerName,
          framework: 'Generic',
          filePath: filePath,
          variable: this.extractGenericVariableName(stateChange),
          metadata: {
            originalPattern: stateChange,
            language: language,
            detectedVia: 'generic_pattern_analysis'
          }
        };
      }
    }

    return null;
  }

  /**
   * Detect state variable patterns
   * @private
   */
  private detectStateVariablePatterns(filePath: string, analysis: FileAnalysis): DetailedStatePattern[] {
    const patterns: DetailedStatePattern[] = [];

    // Look for common state variable names in functions
    if (analysis.functions) {
      for (const [functionSignature, functionInfo] of Object.entries(analysis.functions)) {
        const functionName = functionSignature.split('(')[0] || 'anonymous';

        // Check if function name suggests state management
        const stateRelatedNames = [
          /.*State$/i,
          /.*Store$/i,
          /.*Manager$/i,
          /.*Handler$/i,
          /manage.*/i,
          /handle.*/i
        ];

        const isStateRelated = stateRelatedNames.some(pattern => pattern.test(functionName));

        if (isStateRelated) {
          patterns.push({
            type: 'useState',
            line: functionInfo.line_number || 0,
            mutation_type: 'update',
            context: 'function',
            containerName: functionName,
            framework: 'Generic',
            filePath: filePath,
            variable: functionName.toLowerCase(),
            metadata: {
              detectedVia: 'naming_convention_analysis'
            }
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Extract variable name from generic pattern
   * @private
   */
  private extractGenericVariableName(stateChange: string): string {
    // Try to extract variable name from common patterns
    const match = stateChange.match(/(\w+)\s*[=\(]/);
    if (match && match[1]) {
      return match[1];
    }

    return 'state';
  }

  /**
   * Initialize state pattern configurations
   *
   * @returns Array of state pattern configurations
   * @private
   */
  private initializeStatePatterns(): StatePatternConfig[] {
    return [
      // React patterns
      {
        type: 'useState',
        framework: 'React',
        languages: ['javascript', 'typescript'],
        detection: 'function_call',
        pattern: /useState\s*\(/,
        weight: 8
      },
      {
        type: 'useReducer',
        framework: 'React',
        languages: ['javascript', 'typescript'],
        detection: 'function_call',
        pattern: /useReducer\s*\(/,
        weight: 7
      },
      {
        type: 'setState',
        framework: 'React',
        languages: ['javascript', 'typescript'],
        detection: 'function_call',
        pattern: /\.setState\s*\(/,
        weight: 8
      },

      // Redux patterns
      {
        type: 'dispatch',
        framework: 'Redux',
        languages: ['javascript', 'typescript'],
        detection: 'function_call',
        pattern: /dispatch\s*\(/,
        weight: 7
      },

      // Django patterns
      {
        type: 'django_save',
        framework: 'Django',
        languages: ['python'],
        detection: 'function_call',
        pattern: /\.save\s*\(/,
        weight: 6
      },
      {
        type: 'django_create',
        framework: 'Django',
        languages: ['python'],
        detection: 'function_call',
        pattern: /\.objects\.create\s*\(/,
        weight: 8
      },
      {
        type: 'django_update',
        framework: 'Django',
        languages: ['python'],
        detection: 'function_call',
        pattern: /\.objects\.update\s*\(/,
        weight: 7
      },
      {
        type: 'django_delete',
        framework: 'Django',
        languages: ['python'],
        detection: 'function_call',
        pattern: /\.objects\.delete\s*\(/,
        weight: 7
      }
    ];
  }

  /**
   * Generate state detection statistics
   *
   * @param patterns - Array of detected state patterns
   * @returns Statistical summary of state detection
   */
  getDetectionStats(patterns: DetailedStatePattern[]): StateDetectionStats {
    const patternDistribution: Record<StatePatternType, number> = {
      'useState': 0,
      'useReducer': 0,
      'setState': 0,
      'dispatch': 0,
      'redux_action': 0,
      'redux_reducer': 0,
      'mobx_observable': 0,
      'django_save': 0,
      'django_create': 0,
      'django_update': 0,
      'django_delete': 0
    };

    const frameworkDistribution: Record<string, number> = {};
    const mutationDistribution: Record<MutationType, number> = {
      'create': 0,
      'read': 0,
      'update': 0,
      'delete': 0
    };
    const filesWithState = new Set<string>();

    for (const pattern of patterns) {
      // Count by pattern type
      if (pattern.type in patternDistribution) {
        patternDistribution[pattern.type]++;
      }

      // Count by framework
      frameworkDistribution[pattern.framework] =
        (frameworkDistribution[pattern.framework] || 0) + 1;

      // Count by mutation type
      if (pattern.mutation_type) {
        mutationDistribution[pattern.mutation_type]++;
      }

      // Track files with state patterns
      filesWithState.add(pattern.filePath);
    }

    return {
      totalPatterns: patterns.length,
      patternDistribution,
      frameworkDistribution,
      filesWithState: Array.from(filesWithState),
      mutationDistribution
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

    const patterns = this.detectStatePatterns(fileAnalyses);
    const stats = this.getDetectionStats(patterns);

    this.debugMode = oldDebugMode;

    return {
      summary: stats,
      patterns: patterns.map(pattern => ({
        type: pattern.type,
        framework: pattern.framework,
        context: pattern.context,
        container: pattern.containerName,
        file: pattern.filePath,
        line: pattern.line,
        variable: pattern.variable,
        mutationType: pattern.mutation_type
      })),
      fileAnalysis: {
        totalFiles: fileAnalyses.size,
        languageDistribution: this.getLanguageDistribution(fileAnalyses),
        supportedPatterns: this.statePatternConfigs.map(config => ({
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
