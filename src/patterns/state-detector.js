"use strict";
/**
 * State Management Pattern Detection Engine
 *
 * This module analyzes code to detect state management patterns across different
 * frameworks including React hooks, Redux, MobX, Django models, and other state
 * management solutions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateDetector = void 0;
/**
 * State management pattern detection engine
 *
 * This class analyzes file analysis results to detect state management patterns
 * across multiple frameworks with detailed metadata extraction.
 */
var StateDetector = /** @class */ (function () {
    /**
     * Create a new state detector
     *
     * @param debugMode - Enable debug logging for state detection
     */
    function StateDetector(debugMode) {
        if (debugMode === void 0) { debugMode = false; }
        this.debugMode = debugMode;
        this.statePatternConfigs = this.initializeStatePatterns();
    }
    /**
     * Detect state management patterns from analyzed files
     *
     * @param fileAnalyses - Map of file paths to their analysis results
     * @returns Array of detected state patterns with detailed information
     */
    StateDetector.prototype.detectStatePatterns = function (fileAnalyses) {
        if (this.debugMode) {
            console.log("\uD83D\uDD0D Starting state pattern detection on ".concat(fileAnalyses.size, " files"));
        }
        var allPatterns = [];
        for (var _i = 0, fileAnalyses_1 = fileAnalyses; _i < fileAnalyses_1.length; _i++) {
            var _a = fileAnalyses_1[_i], filePath = _a[0], analysis = _a[1];
            if (analysis.error) {
                continue; // Skip files with analysis errors
            }
            var filePatterns = this.analyzeFileForStatePatterns(filePath, analysis);
            allPatterns.push.apply(allPatterns, filePatterns);
            if (this.debugMode && filePatterns.length > 0) {
                console.log("  \uD83D\uDCC4 ".concat(filePath, ": Found ").concat(filePatterns.length, " state patterns"));
            }
        }
        // Sort patterns by file path and then by line number
        allPatterns.sort(function (a, b) {
            if (a.filePath !== b.filePath) {
                return a.filePath.localeCompare(b.filePath);
            }
            return a.line - b.line;
        });
        if (this.debugMode) {
            console.log("\u2705 State detection complete. Found ".concat(allPatterns.length, " total patterns"));
        }
        return allPatterns;
    };
    /**
     * Analyze a single file for state management patterns
     *
     * @param filePath - Path to the file being analyzed
     * @param analysis - File analysis result
     * @returns Array of state patterns found in this file
     * @private
     */
    StateDetector.prototype.analyzeFileForStatePatterns = function (filePath, analysis) {
        var patterns = [];
        // Detect patterns based on language and framework
        if (analysis.language === 'javascript' || analysis.language === 'typescript') {
            // React patterns
            patterns.push.apply(patterns, this.detectReactStatePatterns(filePath, analysis));
            // Redux patterns
            patterns.push.apply(patterns, this.detectReduxPatterns(filePath, analysis));
            // MobX patterns (if imports present)
            patterns.push.apply(patterns, this.detectMobXPatterns(filePath, analysis));
        }
        else if (analysis.language === 'python') {
            // Django patterns
            patterns.push.apply(patterns, this.detectDjangoStatePatterns(filePath, analysis));
        }
        // Generic state patterns (cross-framework)
        patterns.push.apply(patterns, this.detectGenericStatePatterns(filePath, analysis));
        return patterns;
    };
    /**
       * Detect React state management patterns
       *
       * @param filePath - File path
       * @param analysis - File analysis
       * @returns React state patterns found
       * @private
       */
    StateDetector.prototype.detectReactStatePatterns = function (filePath, analysis) {
        var patterns = [];
        // Check if this file uses React
        if (!this.hasReactImport(analysis)) {
            return patterns;
        }
        if (this.debugMode) {
            console.log("  \u269B\uFE0F  Analyzing ".concat(filePath, " for React state patterns"));
        }
        // Detect patterns in functions (functional components and hooks)
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                var functionName = functionSignature.split('(')[0] || 'anonymous';
                // Check existing state_changes detected by analyzers
                if (functionInfo.state_changes && functionInfo.state_changes.length > 0) {
                    for (var _c = 0, _d = functionInfo.state_changes; _c < _d.length; _c++) {
                        var stateChange = _d[_c];
                        var reactPattern = this.parseReactStateChange(stateChange, filePath, functionName, functionInfo.line_number || 0, 'function');
                        if (reactPattern) {
                            patterns.push(reactPattern);
                        }
                    }
                }
                // Manual detection for React hooks and patterns
                patterns.push.apply(patterns, this.detectReactHooksInFunction(filePath, functionName, functionInfo, analysis));
            }
        }
        // Detect patterns in classes (class components)
        if (analysis.classes) {
            for (var _e = 0, _f = Object.entries(analysis.classes); _e < _f.length; _e++) {
                var _g = _f[_e], className = _g[0], classInfo = _g[1];
                // Check if this is a React component class
                if (this.isReactComponentClass(classInfo)) {
                    patterns.push.apply(patterns, this.detectReactClassState(filePath, className, classInfo));
                }
            }
        }
        if (this.debugMode && patterns.length > 0) {
            console.log("    \u2713 Found ".concat(patterns.length, " React state patterns"));
        }
        return patterns;
    };
    /**
     * Check if file imports React
     * @private
     */
    StateDetector.prototype.hasReactImport = function (analysis) {
        if (!analysis.imports)
            return false;
        return Object.keys(analysis.imports).some(function (moduleName) {
            return moduleName === 'react' ||
                moduleName.startsWith('react/') ||
                moduleName === '@types/react';
        });
    };
    /**
     * Parse a React state change from analyzer results
     * @private
     */
    StateDetector.prototype.parseReactStateChange = function (stateChange, filePath, containerName, lineNumber, context) {
        // Map state change strings to our state pattern types
        var stateChangeMap = {
            'useState': { type: 'useState', mutation: 'update' },
            'useReducer': { type: 'useReducer', mutation: 'update' },
            'setState': { type: 'setState', mutation: 'update' },
            'dispatch': { type: 'dispatch', mutation: 'update' }
        };
        for (var _i = 0, _a = Object.entries(stateChangeMap); _i < _a.length; _i++) {
            var _b = _a[_i], pattern = _b[0], config = _b[1];
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
    };
    /**
     * Detect React hooks in a function
     * @private
     */
    StateDetector.prototype.detectReactHooksInFunction = function (filePath, functionName, functionInfo, analysis) {
        var _a;
        var patterns = [];
        // Check if React hooks are imported
        var reactImports = ((_a = analysis.imports) === null || _a === void 0 ? void 0 : _a['react']) || [];
        var hasUseStateImport = reactImports.includes('useState');
        var hasUseReducerImport = reactImports.includes('useReducer');
        var hasUseContextImport = reactImports.includes('useContext');
        var hasUseEffectImport = reactImports.includes('useEffect');
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
    };
    /**
     * Check if a class is a React component
     * @private
     */
    StateDetector.prototype.isReactComponentClass = function (classInfo) {
        if (!classInfo.base_classes)
            return false;
        var reactBaseClasses = [
            'Component',
            'PureComponent',
            'React.Component',
            'React.PureComponent'
        ];
        return classInfo.base_classes.some(function (baseClass) {
            return reactBaseClasses.some(function (reactClass) { return baseClass.includes(reactClass); });
        });
    };
    /**
     * Detect React class component state patterns
     * @private
     */
    StateDetector.prototype.detectReactClassState = function (filePath, className, classInfo) {
        var patterns = [];
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
            for (var _i = 0, _a = Object.entries(classInfo.methods); _i < _a.length; _i++) {
                var _b = _a[_i], methodSignature = _b[0], methodInfo = _b[1];
                var methodName = methodSignature.split('(')[0] || 'method';
                // Type guard for methodInfo
                if (!methodInfo || typeof methodInfo !== 'object') {
                    continue;
                }
                var typedMethodInfo = methodInfo; // Cast to avoid TypeScript issues
                // Check if method has state changes
                if (typedMethodInfo.state_changes && Array.isArray(typedMethodInfo.state_changes) && typedMethodInfo.state_changes.length > 0) {
                    for (var _c = 0, _d = typedMethodInfo.state_changes; _c < _d.length; _c++) {
                        var stateChange = _d[_c];
                        if (typeof stateChange === 'string' && stateChange.includes('setState')) {
                            patterns.push({
                                type: 'setState',
                                line: typedMethodInfo.line_number || 0,
                                mutation_type: 'update',
                                context: 'class',
                                containerName: "".concat(className, ".").concat(methodName),
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
                var lifecycleMethods = [
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
                        containerName: "".concat(className, ".").concat(methodName),
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
    };
    /**
     * Extract variable name from state change pattern
     * @private
     */
    StateDetector.prototype.extractVariableName = function (stateChange, pattern) {
        // Try to extract variable name from common patterns
        // For useState: const [count, setCount] = useState(0)
        if (pattern === 'useState') {
            var match = stateChange.match(/\[([^,\]]+)/);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        // For setState: this.setState({count: value})
        if (pattern === 'setState') {
            var match = stateChange.match(/setState\s*\(\s*\{([^:}]+)/);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        // For dispatch: dispatch({type: 'INCREMENT', payload: value})
        if (pattern === 'dispatch') {
            var match = stateChange.match(/type:\s*['"]([^'"]+)['"]/);
            if (match && match[1]) {
                return match[1];
            }
        }
        return 'unknown';
    };
    /**
     * Infer state variable name from function name and pattern
     * @private
     */
    StateDetector.prototype.inferStateVariableName = function (functionName, pattern) {
        // For components and hooks, try to infer the state variable name
        if (pattern === 'useState') {
            // Remove common prefixes/suffixes and convert to state variable
            var cleanName = functionName
                .replace(/^use/, '')
                .replace(/Component$/, '')
                .replace(/Hook$/, '');
            return cleanName.toLowerCase() || 'state';
        }
        if (pattern === 'useReducer') {
            return functionName.replace(/^use/, '').toLowerCase() || 'state';
        }
        return 'state';
    };
    /**
       * Detect Redux state management patterns
       *
       * @param filePath - File path
       * @param analysis - File analysis
       * @returns Redux state patterns found
       * @private
       */
    StateDetector.prototype.detectReduxPatterns = function (filePath, analysis) {
        var patterns = [];
        // Check if this file uses Redux
        if (!this.hasReduxImport(analysis)) {
            return patterns;
        }
        if (this.debugMode) {
            console.log("  \uD83D\uDD34 Analyzing ".concat(filePath, " for Redux patterns"));
        }
        // Detect Redux patterns in functions
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                var functionName = functionSignature.split('(')[0] || 'anonymous';
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
                    for (var _c = 0, _d = functionInfo.state_changes; _c < _d.length; _c++) {
                        var stateChange = _d[_c];
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
        patterns.push.apply(patterns, this.detectReduxToolkitPatterns(filePath, analysis));
        if (this.debugMode && patterns.length > 0) {
            console.log("    \u2713 Found ".concat(patterns.length, " Redux patterns"));
        }
        return patterns;
    };
    /**
     * Check if file imports Redux
     * @private
     */
    StateDetector.prototype.hasReduxImport = function (analysis) {
        if (!analysis.imports)
            return false;
        return Object.keys(analysis.imports).some(function (moduleName) {
            return moduleName === 'redux' ||
                moduleName === 'react-redux' ||
                moduleName === '@reduxjs/toolkit' ||
                moduleName.includes('redux');
        });
    };
    /**
     * Check if a function is a Redux action creator
     * @private
     */
    StateDetector.prototype.isReduxActionCreator = function (functionName, functionInfo) {
        // Common action creator naming patterns
        var actionCreatorPatterns = [
            /^(set|update|add|remove|delete|create|fetch|load|save).*/i,
            /.*Action$/i,
            /.*Creator$/i
        ];
        // Check naming patterns
        var matchesNaming = actionCreatorPatterns.some(function (pattern) {
            return pattern.test(functionName);
        });
        // Check if function returns an object with 'type' property (common Redux action pattern)
        var hasActionStructure = functionInfo.docstring &&
            (functionInfo.docstring.includes('action') || functionInfo.docstring.includes('type'));
        // Check if it's a simple function that likely returns an action
        var isSimpleFunction = functionInfo.parameters &&
            functionInfo.parameters.length <= 3; // Action creators typically have few parameters
        return matchesNaming || hasActionStructure || (isSimpleFunction && functionName.length > 3);
    };
    /**
     * Check if a function is a Redux reducer
     * @private
     */
    StateDetector.prototype.isReduxReducer = function (functionName, functionInfo) {
        // Common reducer naming patterns
        var reducerPatterns = [
            /.*Reducer$/i,
            /^(state|app|root|main|user|auth|data).*/i
        ];
        // Check naming patterns
        var matchesNaming = reducerPatterns.some(function (pattern) {
            return pattern.test(functionName);
        });
        // Check if function has typical reducer signature (state, action)
        var hasReducerSignature = functionInfo.parameters &&
            functionInfo.parameters.length === 2 &&
            (functionInfo.parameters.includes('state') || functionInfo.parameters.includes('action'));
        // Check if function is documented as a reducer
        var hasReducerDocumentation = functionInfo.docstring &&
            (functionInfo.docstring.includes('reducer') ||
                functionInfo.docstring.includes('state') && functionInfo.docstring.includes('action'));
        return matchesNaming || hasReducerSignature || hasReducerDocumentation;
    };
    /**
     * Check if a function creates a Redux store
     * @private
     */
    StateDetector.prototype.isStoreCreation = function (functionName, functionInfo, analysis) {
        var _a, _b, _c;
        // Check if Redux store creation functions are imported
        var hasStoreImports = analysis.imports && (((_a = analysis.imports['redux']) === null || _a === void 0 ? void 0 : _a.includes('createStore')) ||
            ((_b = analysis.imports['redux']) === null || _b === void 0 ? void 0 : _b.includes('configureStore')) ||
            ((_c = analysis.imports['@reduxjs/toolkit']) === null || _c === void 0 ? void 0 : _c.includes('configureStore')));
        // Check function names that suggest store creation
        var storeCreationPatterns = [
            /createStore/i,
            /configureStore/i,
            /setupStore/i,
            /initStore/i
        ];
        var matchesStorePattern = storeCreationPatterns.some(function (pattern) {
            return pattern.test(functionName);
        });
        return hasStoreImports || matchesStorePattern;
    };
    /**
     * Detect Redux Toolkit patterns (modern Redux)
     * @private
     */
    StateDetector.prototype.detectReduxToolkitPatterns = function (filePath, analysis) {
        var patterns = [];
        // Check for Redux Toolkit imports
        var hasRTKImports = analysis.imports &&
            Object.keys(analysis.imports).some(function (moduleName) {
                return moduleName === '@reduxjs/toolkit';
            });
        if (!hasRTKImports)
            return patterns;
        // Look for createSlice usage
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                var functionName = functionSignature.split('(')[0] || 'anonymous';
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
    };
    /**
     * Extract action type from action creator name
     * @private
     */
    StateDetector.prototype.extractActionType = function (functionName) {
        // Convert camelCase function names to ACTION_TYPE format
        return functionName
            .replace(/([A-Z])/g, '_$1')
            .toUpperCase()
            .replace(/^_/, '');
    };
    /**
     * Extract state type from reducer name
     * @private
     */
    StateDetector.prototype.extractReducerStateType = function (functionName) {
        // Remove 'Reducer' suffix and convert to lowercase
        return functionName
            .replace(/Reducer$/i, '')
            .toLowerCase();
    };
    /**
     * Extract action from dispatch call
     * @private
     */
    StateDetector.prototype.extractDispatchAction = function (dispatchCall) {
        // Try to extract action type from dispatch calls
        // dispatch(actionCreator()) or dispatch({type: 'ACTION_TYPE'})
        // Look for type property
        var typeMatch = dispatchCall.match(/type:\s*['"]([^'"]+)['"]/);
        if (typeMatch && typeMatch[1]) {
            return typeMatch[1];
        }
        // Look for function call pattern
        var functionMatch = dispatchCall.match(/dispatch\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
        if (functionMatch && functionMatch[1]) {
            return this.extractActionType(functionMatch[1]);
        }
        return 'unknown_action';
    };
    /**
       * Detect MobX state management patterns
       *
       * @param filePath - File path
       * @param analysis - File analysis
       * @returns MobX state patterns found
       * @private
       */
    StateDetector.prototype.detectMobXPatterns = function (filePath, analysis) {
        var patterns = [];
        // Check if this file uses MobX
        if (!this.hasMobXImport(analysis)) {
            return patterns;
        }
        if (this.debugMode) {
            console.log("  \uD83D\uDCE6 Analyzing ".concat(filePath, " for MobX patterns"));
        }
        // Detect MobX observables and actions in classes
        if (analysis.classes) {
            for (var _i = 0, _a = Object.entries(analysis.classes); _i < _a.length; _i++) {
                var _b = _a[_i], className = _b[0], classInfo = _b[1];
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
                        for (var _c = 0, _d = Object.entries(classInfo.methods); _c < _d.length; _c++) {
                            var _e = _d[_c], methodSignature = _e[0], methodInfo = _e[1];
                            var methodName = methodSignature.split('(')[0] || 'method';
                            if (!methodInfo || typeof methodInfo !== 'object') {
                                continue;
                            }
                            var typedMethodInfo = methodInfo;
                            // Check for action decorators
                            if (typedMethodInfo.decorators && Array.isArray(typedMethodInfo.decorators)) {
                                for (var _f = 0, _g = typedMethodInfo.decorators; _f < _g.length; _f++) {
                                    var decorator = _g[_f];
                                    if (decorator.name === 'action' || decorator.name.includes('action')) {
                                        patterns.push({
                                            type: 'mobx_observable',
                                            line: typedMethodInfo.line_number || 0,
                                            mutation_type: 'update',
                                            context: 'class',
                                            containerName: "".concat(className, ".").concat(methodName),
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
            for (var _h = 0, _j = Object.entries(analysis.functions); _h < _j.length; _h++) {
                var _k = _j[_h], functionSignature = _k[0], functionInfo = _k[1];
                var functionName = functionSignature.split('(')[0] || 'anonymous';
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
            console.log("    \u2713 Found ".concat(patterns.length, " MobX patterns"));
        }
        return patterns;
    };
    /**
     * Detect Django state management patterns
     *
     * @param filePath - File path
     * @param analysis - File analysis
     * @returns Django state patterns found
     * @private
     */
    StateDetector.prototype.detectDjangoStatePatterns = function (filePath, analysis) {
        var patterns = [];
        // Check if this file uses Django
        if (!this.hasDjangoImport(analysis)) {
            return patterns;
        }
        if (this.debugMode) {
            console.log("  \uD83C\uDFAF Analyzing ".concat(filePath, " for Django state patterns"));
        }
        // Check if this is a models.py file
        var isModelsFile = filePath.includes('models.py') || filePath.includes('models/');
        // Detect Django model operations in functions
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                var functionName = functionSignature.split('(')[0] || 'anonymous';
                // Check for Django ORM operations in function state changes
                if (functionInfo.state_changes && functionInfo.state_changes.length > 0) {
                    for (var _c = 0, _d = functionInfo.state_changes; _c < _d.length; _c++) {
                        var stateChange = _d[_c];
                        var djangoPattern = this.parseDjangoStateChange(stateChange, filePath, functionName, functionInfo.line_number || 0);
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
            for (var _e = 0, _f = Object.entries(analysis.classes); _e < _f.length; _e++) {
                var _g = _f[_e], className = _g[0], classInfo = _g[1];
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
                        for (var _h = 0, _j = Object.entries(classInfo.methods); _h < _j.length; _h++) {
                            var _k = _j[_h], methodSignature = _k[0], methodInfo = _k[1];
                            var methodName = methodSignature.split('(')[0] || 'method';
                            if (!methodInfo || typeof methodInfo !== 'object') {
                                continue;
                            }
                            if (this.isDjangoModelMethod(methodName)) {
                                patterns.push({
                                    type: 'django_save',
                                    line: methodInfo.line_number || 0,
                                    mutation_type: this.getDjangoMethodMutationType(methodName),
                                    context: 'class',
                                    containerName: "".concat(className, ".").concat(methodName),
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
            console.log("    \u2713 Found ".concat(patterns.length, " Django patterns"));
        }
        return patterns;
    };
    /**
     * Detect generic state patterns that work across frameworks
     *
     * @param filePath - File path
     * @param analysis - File analysis
     * @returns Generic state patterns found
     * @private
     */
    StateDetector.prototype.detectGenericStatePatterns = function (filePath, analysis) {
        var patterns = [];
        if (this.debugMode) {
            console.log("  \uD83D\uDD27 Analyzing ".concat(filePath, " for generic state patterns"));
        }
        // Detect state patterns already identified by analyzers but not framework-specific
        if (analysis.functions) {
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                var functionName = functionSignature.split('(')[0] || 'anonymous';
                if (functionInfo.state_changes && functionInfo.state_changes.length > 0) {
                    for (var _c = 0, _d = functionInfo.state_changes; _c < _d.length; _c++) {
                        var stateChange = _d[_c];
                        // Skip patterns already handled by specific framework detectors
                        if (this.isFrameworkSpecificPattern(stateChange)) {
                            continue;
                        }
                        // Detect generic state mutation patterns
                        var genericPattern = this.parseGenericStatePattern(stateChange, filePath, functionName, functionInfo.line_number || 0, analysis.language || 'unknown');
                        if (genericPattern) {
                            patterns.push(genericPattern);
                        }
                    }
                }
            }
        }
        // Look for common state-related variable names and patterns
        patterns.push.apply(patterns, this.detectStateVariablePatterns(filePath, analysis));
        if (this.debugMode && patterns.length > 0) {
            console.log("    \u2713 Found ".concat(patterns.length, " generic patterns"));
        }
        return patterns;
    };
    // Helper methods for the detection functions
    /**
     * Check if file imports MobX
     * @private
     */
    StateDetector.prototype.hasMobXImport = function (analysis) {
        if (!analysis.imports)
            return false;
        return Object.keys(analysis.imports).some(function (moduleName) {
            return moduleName === 'mobx' ||
                moduleName === 'mobx-react' ||
                moduleName === 'mobx-state-tree' ||
                moduleName.includes('mobx');
        });
    };
    /**
     * Check if file imports Django
     * @private
     */
    StateDetector.prototype.hasDjangoImport = function (analysis) {
        if (!analysis.imports)
            return false;
        return Object.keys(analysis.imports).some(function (moduleName) {
            return moduleName.startsWith('django') ||
                moduleName.includes('django');
        });
    };
    /**
     * Check if class has MobX decorators
     * @private
     */
    StateDetector.prototype.hasMobXDecorators = function (classInfo) {
        if (!classInfo.decorators)
            return false;
        var mobxDecorators = ['observable', 'observer', 'computed', 'action'];
        return classInfo.decorators.some(function (decorator) {
            return mobxDecorators.some(function (mobxDec) { return decorator.name.includes(mobxDec); });
        });
    };
    /**
     * Check if function creates MobX observables
     * @private
     */
    StateDetector.prototype.isMobXObservableCreation = function (functionName, functionInfo) {
        var observablePatterns = [
            /createStore/i,
            /makeObservable/i,
            /observable/i,
            /Store$/i
        ];
        return observablePatterns.some(function (pattern) { return pattern.test(functionName); }) ||
            (functionInfo.docstring && functionInfo.docstring.includes('observable'));
    };
    /**
     * Extract observable name from function name
     * @private
     */
    StateDetector.prototype.extractObservableName = function (functionName) {
        return functionName
            .replace(/^create/, '')
            .replace(/Store$/, '')
            .toLowerCase() || 'observable';
    };
    /**
     * Parse Django state change patterns
     * @private
     */
    StateDetector.prototype.parseDjangoStateChange = function (stateChange, filePath, containerName, lineNumber) {
        var djangoPatterns = [
            { pattern: 'django_save', type: 'django_save', mutation: 'update' },
            { pattern: 'django_create', type: 'django_create', mutation: 'create' },
            { pattern: 'django_update', type: 'django_update', mutation: 'update' },
            { pattern: 'django_delete', type: 'django_delete', mutation: 'delete' },
            { pattern: '.save(', type: 'django_save', mutation: 'update' },
            { pattern: '.create(', type: 'django_create', mutation: 'create' },
            { pattern: '.update(', type: 'django_update', mutation: 'update' },
            { pattern: '.delete(', type: 'django_delete', mutation: 'delete' }
        ];
        for (var _i = 0, djangoPatterns_1 = djangoPatterns; _i < djangoPatterns_1.length; _i++) {
            var _a = djangoPatterns_1[_i], pattern = _a.pattern, type = _a.type, mutation = _a.mutation;
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
    };
    /**
     * Check if function is a Django view
     * @private
     */
    StateDetector.prototype.isDjangoViewFunction = function (functionName, functionInfo, analysis) {
        var _a, _b;
        // Only consider it a state change if it's a view function AND has actual state operations
        var hasRequestParam = (_a = functionInfo.parameters) === null || _a === void 0 ? void 0 : _a.some(function (param) {
            return param.toLowerCase().includes('request');
        });
        var hasViewImports = analysis.imports && Object.keys(analysis.imports).some(function (moduleName) {
            return moduleName.includes('django.views') || moduleName.includes('django.shortcuts');
        });
        // NEW: Only return true if it's a view AND has clear state-changing indicators
        if (hasRequestParam && hasViewImports) {
            // Check function name for state-changing operations
            var stateChangingNames = [
                'create', 'save', 'update', 'delete', 'remove', 'destroy',
                'register', 'signup', 'activate', 'sync', 'assign', 'map'
            ];
            var hasStateChangingName = stateChangingNames.some(function (operation) {
                return functionName.toLowerCase().includes(operation);
            });
            // Check if function has API endpoints that suggest state changes (POST, PUT, PATCH, DELETE)
            var hasStateChangingEndpoint = (_b = functionInfo.api_endpoints) === null || _b === void 0 ? void 0 : _b.some(function (endpoint) {
                return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(endpoint.method);
            });
            return hasStateChangingName || hasStateChangingEndpoint;
        }
        return false;
    };
    /**
     * Check if class is Django model
     * @private
     */
    StateDetector.prototype.isDjangoModelClass = function (classInfo) {
        if (!classInfo.base_classes)
            return false;
        var modelBaseClasses = [
            'Model',
            'models.Model',
            'django.db.models.Model'
        ];
        return classInfo.base_classes.some(function (baseClass) {
            return modelBaseClasses.some(function (modelClass) { return baseClass.includes(modelClass); });
        });
    };
    /**
     * Check if method is Django model method
     * @private
     */
    StateDetector.prototype.isDjangoModelMethod = function (methodName) {
        var modelMethods = [
            'save',
            'delete',
            'create',
            'update',
            'get_or_create',
            'update_or_create'
        ];
        return modelMethods.includes(methodName);
    };
    /**
     * Get mutation type for Django method
     * @private
     */
    StateDetector.prototype.getDjangoMethodMutationType = function (methodName) {
        var mutationMap = {
            'save': 'update',
            'create': 'create',
            'update': 'update',
            'delete': 'delete',
            'get_or_create': 'create',
            'update_or_create': 'update'
        };
        return mutationMap[methodName] || 'update';
    };
    /**
     * Extract model name from Django state change
     * @private
     */
    StateDetector.prototype.extractDjangoModelName = function (stateChange) {
        // Try to extract model name from patterns like User.objects.create()
        var modelMatch = stateChange.match(/(\w+)\.objects\./);
        if (modelMatch && modelMatch[1]) {
            return modelMatch[1].toLowerCase();
        }
        // Try to extract from variable.save() patterns
        var saveMatch = stateChange.match(/(\w+)\.save\(/);
        if (saveMatch && saveMatch[1]) {
            return saveMatch[1].toLowerCase();
        }
        return 'model';
    };
    /**
     * Extract model name from view function name
     * @private
     */
    StateDetector.prototype.extractModelNameFromView = function (functionName) {
        return functionName
            .replace(/View$/, '')
            .replace(/List$/, '')
            .replace(/Detail$/, '')
            .replace(/Create$/, '')
            .replace(/Update$/, '')
            .replace(/Delete$/, '')
            .toLowerCase() || 'model';
    };
    /**
     * Check if pattern is framework-specific
     * @private
     */
    StateDetector.prototype.isFrameworkSpecificPattern = function (stateChange) {
        var frameworkPatterns = [
            'useState', 'useReducer', 'setState', 'dispatch', // React/Redux
            'observable', 'action', 'computed', // MobX
            'django_save', 'django_create', 'django_update', 'django_delete' // Django
        ];
        return frameworkPatterns.some(function (pattern) { return stateChange.includes(pattern); });
    };
    /**
     * Parse generic state patterns
     * @private
     */
    StateDetector.prototype.parseGenericStatePattern = function (stateChange, filePath, containerName, lineNumber, language) {
        // Generic state mutation patterns
        var genericPatterns = [
            { pattern: /set\w+/i, type: 'useState', mutation: 'update' },
            { pattern: /update\w+/i, type: 'useState', mutation: 'update' },
            { pattern: /create\w+/i, type: 'useState', mutation: 'create' },
            { pattern: /delete\w+/i, type: 'useState', mutation: 'delete' },
            { pattern: /add\w+/i, type: 'useState', mutation: 'create' },
            { pattern: /remove\w+/i, type: 'useState', mutation: 'delete' }
        ];
        for (var _i = 0, genericPatterns_1 = genericPatterns; _i < genericPatterns_1.length; _i++) {
            var _a = genericPatterns_1[_i], pattern = _a.pattern, type = _a.type, mutation = _a.mutation;
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
    };
    /**
     * Detect state variable patterns
     * @private
     */
    StateDetector.prototype.detectStateVariablePatterns = function (filePath, analysis) {
        var patterns = [];
        // Look for common state variable names in functions
        if (analysis.functions) {
            var _loop_1 = function (functionSignature, functionInfo) {
                var functionName = functionSignature.split('(')[0] || 'anonymous';
                // Check if function name suggests state management
                var stateRelatedNames = [
                    /.*State$/i,
                    /.*Store$/i,
                    /.*Manager$/i,
                    /.*Handler$/i,
                    /manage.*/i,
                    /handle.*/i
                ];
                var isStateRelated = stateRelatedNames.some(function (pattern) { return pattern.test(functionName); });
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
            };
            for (var _i = 0, _a = Object.entries(analysis.functions); _i < _a.length; _i++) {
                var _b = _a[_i], functionSignature = _b[0], functionInfo = _b[1];
                _loop_1(functionSignature, functionInfo);
            }
        }
        return patterns;
    };
    /**
     * Extract variable name from generic pattern
     * @private
     */
    StateDetector.prototype.extractGenericVariableName = function (stateChange) {
        // Try to extract variable name from common patterns
        var match = stateChange.match(/(\w+)\s*[=\(]/);
        if (match && match[1]) {
            return match[1];
        }
        return 'state';
    };
    /**
     * Initialize state pattern configurations
     *
     * @returns Array of state pattern configurations
     * @private
     */
    StateDetector.prototype.initializeStatePatterns = function () {
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
    };
    /**
     * Generate state detection statistics
     *
     * @param patterns - Array of detected state patterns
     * @returns Statistical summary of state detection
     */
    StateDetector.prototype.getDetectionStats = function (patterns) {
        var patternDistribution = {
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
        var frameworkDistribution = {};
        var mutationDistribution = {
            'create': 0,
            'read': 0,
            'update': 0,
            'delete': 0
        };
        var filesWithState = new Set();
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
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
            patternDistribution: patternDistribution,
            frameworkDistribution: frameworkDistribution,
            filesWithState: Array.from(filesWithState),
            mutationDistribution: mutationDistribution
        };
    };
    /**
     * Get detailed detection report for debugging
     *
     * @param fileAnalyses - Map of file analyses
     * @returns Detailed detection report
     */
    StateDetector.prototype.getDetectionReport = function (fileAnalyses) {
        var oldDebugMode = this.debugMode;
        this.debugMode = true;
        var patterns = this.detectStatePatterns(fileAnalyses);
        var stats = this.getDetectionStats(patterns);
        this.debugMode = oldDebugMode;
        return {
            summary: stats,
            patterns: patterns.map(function (pattern) { return ({
                type: pattern.type,
                framework: pattern.framework,
                context: pattern.context,
                container: pattern.containerName,
                file: pattern.filePath,
                line: pattern.line,
                variable: pattern.variable,
                mutationType: pattern.mutation_type
            }); }),
            fileAnalysis: {
                totalFiles: fileAnalyses.size,
                languageDistribution: this.getLanguageDistribution(fileAnalyses),
                supportedPatterns: this.statePatternConfigs.map(function (config) { return ({
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
    StateDetector.prototype.getLanguageDistribution = function (fileAnalyses) {
        var distribution = {};
        for (var _i = 0, _a = fileAnalyses.values(); _i < _a.length; _i++) {
            var analysis = _a[_i];
            if (analysis.language) {
                distribution[analysis.language] = (distribution[analysis.language] || 0) + 1;
            }
        }
        return distribution;
    };
    return StateDetector;
}());
exports.StateDetector = StateDetector;
