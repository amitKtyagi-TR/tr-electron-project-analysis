"use strict";
/**
 * Framework Pattern Definitions
 *
 * This module contains the pattern definitions used to detect different frameworks
 * in codebases. Each framework has specific signatures that help identify it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_FRAMEWORK_SIGNATURES = exports.EXPRESS_PATTERNS = exports.FLUTTER_PATTERNS = exports.NESTJS_PATTERNS = exports.DJANGO_PATTERNS = exports.REACT_NATIVE_PATTERNS = exports.REACT_PATTERNS = void 0;
exports.getFrameworkSignature = getFrameworkSignature;
exports.getSupportedFrameworks = getSupportedFrameworks;
/**
 * React Framework Patterns
 */
exports.REACT_PATTERNS = {
    name: 'React',
    minConfidence: 0.3,
    primaryLanguages: ['javascript', 'typescript'],
    patterns: [
        {
            id: 'react_import',
            description: 'React library import',
            weight: 8,
            type: 'import',
            pattern: /^react$/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_dom_import',
            description: 'ReactDOM import',
            weight: 7,
            type: 'import',
            pattern: /^react-dom$/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'jsx_component',
            description: 'JSX component function',
            weight: 9,
            type: 'function_call',
            pattern: /^[A-Z][a-zA-Z0-9]*$/, // Component naming convention
            context: 'has_jsx',
            languages: ['javascript', 'typescript']
        },
        {
            id: 'use_state_hook',
            description: 'useState React hook',
            weight: 8,
            type: 'function_call',
            pattern: /useState/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'use_effect_hook',
            description: 'useEffect React hook',
            weight: 7,
            type: 'function_call',
            pattern: /useEffect/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'jsx_extension',
            description: 'JSX file extension',
            weight: 6,
            type: 'file_name',
            pattern: /\.(jsx|tsx)$/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'jsx_syntax',
            description: 'JSX syntax in code',
            weight: 7,
            type: 'content',
            pattern: /<[A-Z][a-zA-Z0-9]*[^>]*>/, // JSX tags
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_component_class',
            description: 'React Component class',
            weight: 8,
            type: 'class_name',
            pattern: /Component$/,
            context: 'extends_react',
            languages: ['javascript', 'typescript']
        }
    ]
};
/**
 * React Native Framework Patterns
 */
exports.REACT_NATIVE_PATTERNS = {
    name: 'React Native',
    minConfidence: 0.25,
    primaryLanguages: ['javascript', 'typescript'],
    patterns: [
        {
            id: 'react_native_import',
            description: 'React Native core import',
            weight: 9,
            type: 'import',
            pattern: /^react-native$/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_native_community_import',
            description: 'React Native Community packages',
            weight: 7,
            type: 'import',
            pattern: /^@react-native-community\//,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_native_async_storage',
            description: 'React Native AsyncStorage import',
            weight: 6,
            type: 'import',
            pattern: /^@react-native-async-storage\/async-storage$/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_navigation_import',
            description: 'React Navigation import',
            weight: 7,
            type: 'import',
            pattern: /^@react-navigation\//,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'expo_import',
            description: 'Expo framework import',
            weight: 8,
            type: 'import',
            pattern: /^expo$/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_native_view_component',
            description: 'React Native View component usage',
            weight: 8,
            type: 'function_call',
            pattern: /View/,
            context: 'has_react_native_import',
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_native_text_component',
            description: 'React Native Text component usage',
            weight: 7,
            type: 'function_call',
            pattern: /Text/,
            context: 'has_react_native_import',
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_native_scrollview',
            description: 'React Native ScrollView component',
            weight: 6,
            type: 'function_call',
            pattern: /ScrollView/,
            context: 'has_react_native_import',
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_native_touchable',
            description: 'React Native Touchable components',
            weight: 6,
            type: 'function_call',
            pattern: /Touchable(Opacity|Highlight|WithoutFeedback)/,
            context: 'has_react_native_import',
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_native_flatlist',
            description: 'React Native FlatList component',
            weight: 6,
            type: 'function_call',
            pattern: /FlatList/,
            context: 'has_react_native_import',
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_native_platform_api',
            description: 'React Native Platform API usage',
            weight: 7,
            type: 'function_call',
            pattern: /Platform\.(OS|select)/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_native_dimensions_api',
            description: 'React Native Dimensions API',
            weight: 6,
            type: 'function_call',
            pattern: /Dimensions\.get/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_native_stylesheet',
            description: 'React Native StyleSheet usage',
            weight: 8,
            type: 'function_call',
            pattern: /StyleSheet\.(create|compose)/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_native_alert_api',
            description: 'React Native Alert API',
            weight: 5,
            type: 'function_call',
            pattern: /Alert\.(alert|prompt)/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'react_native_animated_api',
            description: 'React Native Animated API',
            weight: 6,
            type: 'function_call',
            pattern: /Animated\.(Value|timing|spring)/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'app_json_config',
            description: 'React Native app.json configuration',
            weight: 7,
            type: 'file_name',
            pattern: /app\.json$/
        },
        {
            id: 'metro_config',
            description: 'Metro bundler configuration',
            weight: 6,
            type: 'file_name',
            pattern: /metro\.config\.js$/
        },
        {
            id: 'react_native_config_js',
            description: 'React Native configuration files',
            weight: 5,
            type: 'file_name',
            pattern: /react-native\.config\.js$/
        },
        {
            id: 'expo_app_config',
            description: 'Expo app configuration',
            weight: 7,
            type: 'file_name',
            pattern: /app\.(json|config\.(js|ts))$/,
            context: 'has_expo_dependency'
        },
        {
            id: 'native_module_android',
            description: 'Android native module files',
            weight: 4,
            type: 'file_name',
            pattern: /android\/.*\.(java|kt)$/
        },
        {
            id: 'native_module_ios',
            description: 'iOS native module files',
            weight: 4,
            type: 'file_name',
            pattern: /ios\/.*\.(m|h|swift)$/
        }
    ]
};
/**
 * Django Framework Patterns
 */
exports.DJANGO_PATTERNS = {
    name: 'Django',
    minConfidence: 0.4,
    primaryLanguages: ['python'],
    patterns: [
        {
            id: 'django_import',
            description: 'Django framework import',
            weight: 9,
            type: 'import',
            pattern: /^django/,
            languages: ['python']
        },
        {
            id: 'django_models_import',
            description: 'Django models import',
            weight: 8,
            type: 'import',
            pattern: /^django\.db\.models$/,
            languages: ['python']
        },
        {
            id: 'django_views_import',
            description: 'Django views import',
            weight: 7,
            type: 'import',
            pattern: /^django\.views/,
            languages: ['python']
        },
        {
            id: 'models_py_file',
            description: 'Django models.py file',
            weight: 8,
            type: 'file_name',
            pattern: /models\.py$/,
            languages: ['python']
        },
        {
            id: 'views_py_file',
            description: 'Django views.py file',
            weight: 7,
            type: 'file_name',
            pattern: /views\.py$/,
            languages: ['python']
        },
        {
            id: 'urls_py_file',
            description: 'Django urls.py file',
            weight: 7,
            type: 'file_name',
            pattern: /urls\.py$/,
            languages: ['python']
        },
        {
            id: 'django_model_class',
            description: 'Django Model class',
            weight: 8,
            type: 'class_name',
            pattern: /Model$/,
            context: 'django_models',
            languages: ['python']
        },
        {
            id: 'django_admin_register',
            description: 'Django admin register',
            weight: 6,
            type: 'function_call',
            pattern: /admin\.register/,
            languages: ['python']
        },
        {
            id: 'django_settings',
            description: 'Django settings file',
            weight: 7,
            type: 'file_name',
            pattern: /settings\.py$/,
            languages: ['python']
        },
        {
            id: 'django_manage_py',
            description: 'Django manage.py file',
            weight: 9,
            type: 'file_name',
            pattern: /^manage\.py$/,
            languages: ['python']
        }
    ]
};
/**
 * NestJS Framework Patterns
 */
exports.NESTJS_PATTERNS = {
    name: 'NestJS',
    minConfidence: 0.4,
    primaryLanguages: ['typescript', 'javascript'],
    patterns: [
        {
            id: 'nestjs_import',
            description: 'NestJS framework import',
            weight: 9,
            type: 'import',
            pattern: /^@nestjs\//,
            languages: ['typescript', 'javascript']
        },
        {
            id: 'controller_decorator',
            description: '@Controller decorator',
            weight: 8,
            type: 'decorator',
            pattern: /Controller/, // Removed @ symbol
            languages: ['typescript', 'javascript']
        },
        {
            id: 'injectable_decorator',
            description: '@Injectable decorator',
            weight: 7,
            type: 'decorator',
            pattern: /Injectable/, // Removed @ symbol
            languages: ['typescript', 'javascript']
        },
        {
            id: 'module_decorator',
            description: '@Module decorator',
            weight: 8,
            type: 'decorator',
            pattern: /Module/, // Removed @ symbol
            languages: ['typescript', 'javascript']
        },
        {
            id: 'get_decorator',
            description: '@Get HTTP decorator',
            weight: 7,
            type: 'decorator',
            pattern: /Get/, // Removed @ symbol
            languages: ['typescript', 'javascript']
        },
        {
            id: 'post_decorator',
            description: '@Post HTTP decorator',
            weight: 7,
            type: 'decorator',
            pattern: /Post/, // Removed @ symbol
            languages: ['typescript', 'javascript']
        },
        {
            id: 'nest_factory',
            description: 'NestFactory usage',
            weight: 8,
            type: 'function_call',
            pattern: /NestFactory\.create/,
            languages: ['typescript', 'javascript']
        },
        {
            id: 'nestjs_main_file',
            description: 'NestJS main.ts file',
            weight: 6,
            type: 'file_name',
            pattern: /main\.ts$/,
            languages: ['typescript']
        }
    ]
};
/**
 * Flutter Framework Patterns
 */
exports.FLUTTER_PATTERNS = {
    name: 'Flutter',
    minConfidence: 0.4,
    primaryLanguages: ['dart'],
    patterns: [
        {
            id: 'flutter_import',
            description: 'Flutter framework import',
            weight: 9,
            type: 'import',
            pattern: /^package:flutter\//,
            languages: ['dart']
        },
        {
            id: 'material_import',
            description: 'Flutter Material import',
            weight: 7,
            type: 'import',
            pattern: /^package:flutter\/material\.dart$/,
            languages: ['dart']
        },
        {
            id: 'cupertino_import',
            description: 'Flutter Cupertino import',
            weight: 6,
            type: 'import',
            pattern: /^package:flutter\/cupertino\.dart$/,
            languages: ['dart']
        },
        {
            id: 'stateless_widget',
            description: 'StatelessWidget class',
            weight: 8,
            type: 'class_name',
            pattern: /StatelessWidget$/,
            context: 'extends',
            languages: ['dart']
        },
        {
            id: 'stateful_widget',
            description: 'StatefulWidget class',
            weight: 8,
            type: 'class_name',
            pattern: /StatefulWidget$/,
            context: 'extends',
            languages: ['dart']
        },
        {
            id: 'widget_build_method',
            description: 'Widget build method',
            weight: 7,
            type: 'function_call',
            pattern: /build.*Widget/,
            languages: ['dart']
        },
        {
            id: 'flutter_pubspec',
            description: 'Flutter pubspec.yaml',
            weight: 8,
            type: 'file_name',
            pattern: /pubspec\.yaml$/,
            context: 'has_flutter_dependency'
        },
        {
            id: 'flutter_main_dart',
            description: 'Flutter main.dart file',
            weight: 6,
            type: 'file_name',
            pattern: /main\.dart$/,
            languages: ['dart']
        }
    ]
};
/**
 * Express.js Framework Patterns
 */
exports.EXPRESS_PATTERNS = {
    name: 'Express',
    minConfidence: 0.3,
    primaryLanguages: ['javascript', 'typescript'],
    patterns: [
        {
            id: 'express_import',
            description: 'Express framework import',
            weight: 9,
            type: 'import',
            pattern: /^express$/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'express_app_creation',
            description: 'Express app creation',
            weight: 8,
            type: 'function_call',
            pattern: /express\(\)/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'express_get_route',
            description: 'Express GET route',
            weight: 7,
            type: 'function_call',
            pattern: /\.get\(/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'express_post_route',
            description: 'Express POST route',
            weight: 7,
            type: 'function_call',
            pattern: /\.post\(/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'express_listen',
            description: 'Express app.listen',
            weight: 8,
            type: 'function_call',
            pattern: /\.listen\(/,
            languages: ['javascript', 'typescript']
        },
        {
            id: 'express_router',
            description: 'Express Router usage',
            weight: 6,
            type: 'import',
            pattern: /^express$/,
            context: 'router_import',
            languages: ['javascript', 'typescript']
        },
        {
            id: 'express_middleware',
            description: 'Express middleware usage',
            weight: 5,
            type: 'function_call',
            pattern: /\.use\(/,
            languages: ['javascript', 'typescript']
        }
    ]
};
/**
 * All framework signatures for detection
 */
exports.ALL_FRAMEWORK_SIGNATURES = [
    exports.REACT_PATTERNS,
    exports.REACT_NATIVE_PATTERNS,
    exports.DJANGO_PATTERNS,
    exports.NESTJS_PATTERNS,
    exports.FLUTTER_PATTERNS,
    exports.EXPRESS_PATTERNS
];
/**
 * Get framework signature by name
 */
function getFrameworkSignature(name) {
    return exports.ALL_FRAMEWORK_SIGNATURES.find(function (sig) { return sig.name.toLowerCase() === name.toLowerCase(); });
}
/**
 * Get all supported framework names
 */
function getSupportedFrameworks() {
    return exports.ALL_FRAMEWORK_SIGNATURES.map(function (sig) { return sig.name; });
}
