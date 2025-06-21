/**
 * State Management Pattern Detection Demo
 *
 * This example demonstrates the state management pattern detection capabilities
 * across React, Redux, MobX, and Django frameworks.
 */

import {
  StateDetector,
  AnalysisCoordinator,
  type DetailedStatePattern,
  type FileAnalysis
} from '../src/index.js';

/**
 * Sample file analyses representing different state management patterns
 */
function createSampleStateAnalyses(): Map<string, FileAnalysis> {
  const analyses = new Map<string, FileAnalysis>();

  // React hooks example
  analyses.set('src/components/UserProfile.tsx', {
    path: 'src/components/UserProfile.tsx',
    language: 'typescript',
    imports: {
      'react': ['useState', 'useEffect', 'useContext']
    },
    functions: {
      'UserProfile()': {
        docstring: 'User profile component with state management',
        state_changes: ['useState', 'useEffect'],
        event_handlers: [],
        api_endpoints: [],
        is_component: true,
        line_number: 5
      },
      'useUserData(userId)': {
        docstring: 'Custom hook for user data management',
        state_changes: ['useState', 'useReducer'],
        event_handlers: [],
        api_endpoints: [],
        is_hook: true,
        line_number: 25
      }
    },
    classes: {}
  });

  // React class component example
  analyses.set('src/components/Dashboard.jsx', {
    path: 'src/components/Dashboard.jsx',
    language: 'javascript',
    imports: {
      'react': ['Component']
    },
    functions: {},
    classes: {
      'Dashboard': {
        docstring: 'Dashboard class component',
        methods: {
          'constructor(props)': {
            docstring: 'Initialize component state',
            state_changes: [],
            event_handlers: [],
            api_endpoints: [],
            line_number: 8
          },
          'componentDidMount()': {
            docstring: 'Lifecycle method',
            state_changes: ['setState'],
            event_handlers: [],
            api_endpoints: [],
            line_number: 15
          },
          'updateUserData(data)': {
            docstring: 'Update user data in state',
            state_changes: ['setState'],
            event_handlers: [],
            api_endpoints: [],
            line_number: 25
          }
        },
        base_classes: ['Component'],
        line_number: 5
      }
    }
  });

  // Redux example
  analyses.set('src/store/userSlice.ts', {
    path: 'src/store/userSlice.ts',
    language: 'typescript',
    imports: {
      '@reduxjs/toolkit': ['createSlice', 'createAsyncThunk'],
      'redux': ['Dispatch']
    },
    functions: {
      'fetchUserData(userId)': {
        docstring: 'Async thunk for fetching user data',
        state_changes: ['dispatch'],
        event_handlers: [],
        api_endpoints: [],
        line_number: 5
      },
      'userSlice()': {
        docstring: 'User slice with reducers',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        line_number: 15
      },
      'setUserName(name)': {
        docstring: 'Action creator for setting user name',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        line_number: 35
      },
      'userReducer(state, action)': {
        docstring: 'User state reducer',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        parameters: ['state', 'action'],
        line_number: 45
      }
    },
    classes: {}
  });

  // Django models example
  analyses.set('myapp/models.py', {
    path: 'myapp/models.py',
    language: 'python',
    imports: {
      'django.db': ['models'],
      'django.contrib.auth': ['User']
    },
    functions: {
      'create_user_profile(user_data)': {
        docstring: 'Create a new user profile',
        state_changes: ['django_create', 'django_save'],
        event_handlers: [],
        api_endpoints: [],
        parameters: ['user_data'],
        line_number: 25
      }
    },
    classes: {
      'UserProfile': {
        docstring: 'User profile model',
        methods: {
          'save(self)': {
            docstring: 'Custom save method',
            state_changes: ['django_save'],
            event_handlers: [],
            api_endpoints: [],
            line_number: 15
          },
          'update_settings(self, settings)': {
            docstring: 'Update user settings',
            state_changes: ['django_update'],
            event_handlers: [],
            api_endpoints: [],
            line_number: 20
          }
        },
        base_classes: ['models.Model'],
        line_number: 5
      }
    }
  });

  // MobX store example
  analyses.set('src/stores/AppStore.ts', {
    path: 'src/stores/AppStore.ts',
    language: 'typescript',
    imports: {
      'mobx': ['observable', 'action', 'computed', 'makeObservable']
    },
    functions: {
      'createAppStore()': {
        docstring: 'Create application store',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        line_number: 5
      }
    },
    classes: {
      'AppStore': {
        docstring: 'Main application store',
        methods: {
          'constructor()': {
            docstring: 'Initialize store',
            state_changes: [],
            event_handlers: [],
            api_endpoints: [],
            line_number: 15
          },
          'setUser(user)': {
            docstring: 'Set current user',
            state_changes: [],
            event_handlers: [],
            api_endpoints: [],
            decorators: [
              { name: 'action', arguments: [], line_number: 25 }
            ],
            line_number: 26
          },
          'fetchUserData()': {
            docstring: 'Fetch user data',
            state_changes: [],
            event_handlers: [],
            api_endpoints: [],
            decorators: [
              { name: 'action', arguments: [], line_number: 35 }
            ],
            line_number: 36
          }
        },
        decorators: [
          { name: 'observable', arguments: [], line_number: 10 }
        ],
        line_number: 10
      }
    }
  });

  return analyses;
}

/**
 * Demonstrate state management pattern detection
 */
async function demonstrateStateDetection() {
  console.log('🔍 State Management Pattern Detection Demo');
  console.log('==========================================');

  try {
    // Create state detector
    const stateDetector = new StateDetector(true); // Enable debug mode

    // Get sample analyses
    const fileAnalyses = createSampleStateAnalyses();

    console.log(`\n📁 Analyzing ${fileAnalyses.size} files for state patterns...\n`);

    // Detect state patterns
    const patterns = stateDetector.detectStatePatterns(fileAnalyses);

    // Generate statistics
    const stats = stateDetector.getDetectionStats(patterns);

    // Display results
    console.log('\n📊 Detection Results');
    console.log('===================');

    console.log(`\n🎯 Summary:`);
    console.log(`   Total patterns found: ${stats.totalPatterns}`);
    console.log(`   Files with state: ${stats.filesWithState.length}`);

    console.log(`\n🔧 By Framework:`);
    Object.entries(stats.frameworkDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([framework, count]) => {
        console.log(`   ${framework}: ${count} patterns`);
      });

    console.log(`\n📝 By Pattern Type:`);
    Object.entries(stats.patternDistribution)
      .filter(([, count]) => count > 0)
      .sort(([,a], [,b]) => b - a)
      .forEach(([pattern, count]) => {
        console.log(`   ${pattern}: ${count} occurrences`);
      });

    console.log(`\n🔄 By Mutation Type:`);
    Object.entries(stats.mutationDistribution)
      .filter(([, count]) => count > 0)
      .sort(([,a], [,b]) => b - a)
      .forEach(([mutation, count]) => {
        console.log(`   ${mutation}: ${count} operations`);
      });

    console.log(`\n📋 Detailed Patterns:`);
    console.log('====================');

    // Group patterns by framework
    const patternsByFramework = patterns.reduce((groups, pattern) => {
      const framework = pattern.framework;
      if (!groups[framework]) {
        groups[framework] = [];
      }
      groups[framework].push(pattern);
      return groups;
    }, {} as Record<string, DetailedStatePattern[]>);

    for (const [framework, frameworkPatterns] of Object.entries(patternsByFramework)) {
      console.log(`\n🚀 ${framework} Patterns:`);

      frameworkPatterns.forEach((pattern, index) => {
        console.log(`   ${index + 1}. ${pattern.type} (${pattern.mutation_type})`);
        console.log(`      📄 File: ${pattern.filePath}:${pattern.line}`);
        console.log(`      📦 Container: ${pattern.containerName}`);
        console.log(`      🎯 Variable: ${pattern.variable}`);
        console.log(`      📍 Context: ${pattern.context}`);

        if (pattern.metadata) {
          const metadata = Object.entries(pattern.metadata)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          console.log(`      ℹ️  Metadata: ${metadata}`);
        }

        console.log('');
      });
    }

    // Test integration with analysis coordinator
    console.log('\n🔗 Integration Test');
    console.log('==================');

    const coordinator = new AnalysisCoordinator();
    await coordinator.initialize();

    // Test analyzing a React component with state
    const reactCode = `
import React, { useState, useEffect } from 'react';

function UserCounter() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser().then(setUser);
  }, []);

  const incrementCount = () => {
    setCount(prev => prev + 1);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={incrementCount}>Increment</button>
    </div>
  );
}

export default UserCounter;
`;

    console.log('\n🧪 Testing live analysis with state detection...');
    const result = await coordinator.analyzeFile('UserCounter.tsx', reactCode);

    console.log(`✅ Analysis completed:`);
    console.log(`   Language: ${result.detectedLanguage}`);
    console.log(`   Parser: ${result.parser}`);
    console.log(`   Functions found: ${Object.keys(result.analysis.functions || {}).length}`);
    console.log(`   Imports found: ${Object.keys(result.analysis.imports || {}).length}`);

    // Try to detect state patterns from the analyzed file
    const liveAnalyses = new Map([['UserCounter.tsx', result.analysis]]);
    const livePatterns = stateDetector.detectStatePatterns(liveAnalyses);

    console.log(`   State patterns detected: ${livePatterns.length}`);
    livePatterns.forEach(pattern => {
      console.log(`     ${pattern.type} - ${pattern.variable} (${pattern.framework})`);
    });

    console.log('\n✨ State Detection Demo Complete!');
    console.log(`🎉 Successfully detected ${stats.totalPatterns} state patterns across ${Object.keys(stats.frameworkDistribution).length} frameworks`);

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
demonstrateStateDetection();
