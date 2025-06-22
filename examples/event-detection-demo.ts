/**
 * Event Handler Detection Demo
 *
 * This example demonstrates the event handler detection capabilities
 * across DOM events, React events, Electron IPC, and custom event systems.
 */

import {
  EventDetector,
  AnalysisCoordinator,
  type DetailedEventHandler,
  type FileAnalysis
} from '../src/index.js';

/**
 * Sample file analyses representing different event handler patterns
 */
function createSampleEventAnalyses(): Map<string, FileAnalysis> {
  const analyses = new Map<string, FileAnalysis>();

  // DOM events example
  analyses.set('src/utils/dom-handlers.js', {
    path: 'src/utils/dom-handlers.js',
    language: 'javascript',
    imports: {},
    functions: {
      'handleButtonClick()': {
        docstring: 'Handle button click events',
        state_changes: [],
        event_handlers: ['addEventListener'],
        api_endpoints: [],
        line_number: 5
      },
      'setupEventListeners()': {
        docstring: 'Setup all DOM event listeners',
        state_changes: [],
        event_handlers: ['addEventListener', 'onclick'],
        api_endpoints: [],
        line_number: 15
      },
      'onFormSubmit(event)': {
        docstring: 'Handle form submission',
        state_changes: [],
        event_handlers: ['onsubmit'],
        api_endpoints: [],
        line_number: 25
      }
    },
    classes: {}
  });

  // React events example
  analyses.set('src/components/UserForm.tsx', {
    path: 'src/components/UserForm.tsx',
    language: 'typescript',
    imports: {
      'react': ['useState', 'useEffect']
    },
    functions: {
      'UserForm()': {
        docstring: 'User form component with event handlers',
        state_changes: ['useState'],
        event_handlers: ['onClick', 'onChange', 'onSubmit'],
        api_endpoints: [],
        is_component: true,
        line_number: 5
      },
      'handleInputChange(event)': {
        docstring: 'Handle input field changes',
        state_changes: ['useState'],
        event_handlers: [],
        api_endpoints: [],
        line_number: 20
      },
      'handleFormSubmit(event)': {
        docstring: 'Handle form submission',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        line_number: 30
      },
      'onButtonClick()': {
        docstring: 'Handle button clicks',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        line_number: 40
      }
    },
    classes: {}
  });

  // Electron IPC example
  analyses.set('src/main/ipc-handlers.ts', {
    path: 'src/main/ipc-handlers.ts',
    language: 'typescript',
    imports: {
      'electron': ['ipcMain', 'BrowserWindow']
    },
    functions: {
      'setupIPCHandlers()': {
        docstring: 'Setup all IPC handlers',
        state_changes: [],
        event_handlers: ['ipc_handle', 'ipc_on'],
        api_endpoints: [],
        line_number: 5
      },
      'handleUserData(event, data)': {
        docstring: 'Handle user data requests',
        state_changes: [],
        event_handlers: ['ipc_handle'],
        api_endpoints: [],
        line_number: 15
      },
      'onFileOperation(event, operation)': {
        docstring: 'Handle file operations',
        state_changes: [],
        event_handlers: ['ipc_on'],
        api_endpoints: [],
        line_number: 25
      }
    },
    classes: {}
  });

  // Django signals example
  analyses.set('myapp/signals.py', {
    path: 'myapp/signals.py',
    language: 'python',
    imports: {
      'django.db.models.signals': ['post_save', 'pre_delete'],
      'django.dispatch': ['receiver']
    },
    functions: {
      'user_post_save(sender, instance, created, **kwargs)': {
        docstring: 'Handle user model post save',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        decorators: [
          { name: 'receiver', arguments: ['post_save'], line_number: 10 }
        ],
        parameters: ['sender', 'instance', 'created', '**kwargs'],
        line_number: 11
      },
      'user_pre_delete(sender, instance, **kwargs)': {
        docstring: 'Handle user model pre delete',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        decorators: [
          { name: 'receiver', arguments: ['pre_delete'], line_number: 20 }
        ],
        parameters: ['sender', 'instance', '**kwargs'],
        line_number: 21
      }
    },
    classes: {}
  });

  // Custom events example
  analyses.set('src/events/event-manager.js', {
    path: 'src/events/event-manager.js',
    language: 'javascript',
    imports: {
      'events': ['EventEmitter']
    },
    functions: {
      'createEventManager()': {
        docstring: 'Create custom event manager',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        line_number: 5
      },
      'emitUserAction(action)': {
        docstring: 'Emit user action events',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        line_number: 15
      },
      'onDataListener(data)': {
        docstring: 'Listen for data events',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        line_number: 25
      },
      'handleCallback(result)': {
        docstring: 'Handle callback completion',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        line_number: 35
      }
    },
    classes: {}
  });

  return analyses;
}

/**
 * Demonstrate event handler detection
 */
async function demonstrateEventDetection() {
  console.log('🔍 Event Handler Detection Demo');
  console.log('===============================');

  try {
    // Create event detector
    const eventDetector = new EventDetector(true); // Enable debug mode

    // Get sample analyses
    const fileAnalyses = createSampleEventAnalyses();

    console.log(`\n📁 Analyzing ${fileAnalyses.size} files for event handlers...\n`);

    // Detect event handlers
    const handlers = eventDetector.detectEventHandlers(fileAnalyses);

    // Generate statistics
    const stats = eventDetector.getDetectionStats(handlers);

    // Display results
    console.log('\n📊 Detection Results');
    console.log('===================');

    console.log(`\n🎯 Summary:`);
    console.log(`   Total handlers found: ${stats.totalHandlers}`);
    console.log(`   Files with handlers: ${stats.filesWithHandlers.length}`);

    console.log(`\n🔧 By Framework:`);
    Object.entries(stats.frameworkDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([framework, count]) => {
        console.log(`   ${framework}: ${count} handlers`);
      });

    console.log(`\n📝 By Handler Type:`);
    Object.entries(stats.handlerDistribution)
      .filter(([, count]) => count > 0)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count} occurrences`);
      });

    console.log(`\n🎪 Common Events:`);
    stats.commonEvents.slice(0, 10).forEach(({ event, count }) => {
      console.log(`   ${event}: ${count} handlers`);
    });

    console.log(`\n📋 Detailed Handlers:`);
    console.log('====================');

    // Group handlers by framework
    const handlersByFramework = handlers.reduce((groups, handler) => {
      const framework = handler.framework || 'Unknown';
      if (!groups[framework]) {
        groups[framework] = [];
      }
      groups[framework].push(handler);
      return groups;
    }, {} as Record<string, DetailedEventHandler[]>);

    for (const [framework, frameworkHandlers] of Object.entries(handlersByFramework)) {
      console.log(`\n🚀 ${framework} Event Handlers:`);

      frameworkHandlers.forEach((handler, index) => {
        console.log(`   ${index + 1}. ${handler.type} - ${handler.event}`);
        console.log(`      📄 File: ${handler.filePath}:${handler.line}`);
        console.log(`      📦 Container: ${handler.containerName}`);
        console.log(`      🎯 Handler: ${handler.handler || 'N/A'}`);
        console.log(`      📍 Context: ${handler.context}`);

        if (handler.metadata) {
          const metadata = Object.entries(handler.metadata)
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

    // Test analyzing a React component with events
    const reactCode = `
import React, { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Login attempt', { email, password });
  };

  const handleReset = () => {
    setEmail('');
    setPassword('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={handleEmailChange}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={handlePasswordChange}
        placeholder="Password"
      />
      <button type="submit">Login</button>
      <button type="button" onClick={handleReset}>Reset</button>
    </form>
  );
}

export default LoginForm;
`;

    console.log('\n🧪 Testing live analysis with event detection...');
    const result = await coordinator.analyzeFile('LoginForm.tsx', reactCode);

    console.log(`✅ Analysis completed:`);
    console.log(`   Language: ${result.detectedLanguage}`);
    console.log(`   Parser: ${result.parser}`);
    console.log(`   Functions found: ${Object.keys(result.analysis.functions || {}).length}`);
    console.log(`   Imports found: ${Object.keys(result.analysis.imports || {}).length}`);

    // Try to detect event handlers from the analyzed file
    const liveAnalyses = new Map([['LoginForm.tsx', result.analysis]]);
    const liveHandlers = eventDetector.detectEventHandlers(liveAnalyses);

    console.log(`   Event handlers detected: ${liveHandlers.length}`);
    liveHandlers.forEach(handler => {
      console.log(`     ${handler.type} - ${handler.event} (${handler.framework})`);
    });

    console.log('\n✨ Event Detection Demo Complete!');
    console.log(`🎉 Successfully detected ${stats.totalHandlers} event handlers across ${Object.keys(stats.frameworkDistribution).length} frameworks`);

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
demonstrateEventDetection();
