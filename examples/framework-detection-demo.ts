/**
 * Framework Detection Demo
 *
 * This example demonstrates how to use the framework detection system
 * with sample file analyses representing different frameworks.
 */

import { FrameworkDetector } from '../src/patterns/framework-detector.js';
import { getSupportedFrameworks } from '../src/patterns/pattern-definitions.js';
import type { FileAnalysis } from '../src/types/index.js';

/**
 * Create sample file analyses for different frameworks
 */
function createSampleProject(): Map<string, FileAnalysis> {
  const files = new Map<string, FileAnalysis>();

  // React Frontend Files
  files.set('src/App.jsx', {
    path: 'src/App.jsx',
    language: 'javascript',
    imports: {
      'react': ['default', 'useState', 'useEffect'],
      'react-dom': ['render'],
      './components/Header': ['Header'],
      './components/UserList': ['UserList']
    },
    functions: {
      'App()': {
        docstring: 'Main application component with user management',
        state_changes: ['useState'],
        event_handlers: [],
        api_endpoints: [],
        is_component: true,
        is_hook: false
      }
    },
    classes: {}
  });

  files.set('src/components/Header.tsx', {
    path: 'src/components/Header.tsx',
    language: 'typescript',
    imports: {
      'react': ['FC'],
      '../hooks/useAuth': ['useAuth']
    },
    functions: {
      'Header(props)': {
        docstring: 'Application header with navigation',
        state_changes: [],
        event_handlers: ['onClick'],
        api_endpoints: [],
        is_component: true
      }
    },
    classes: {}
  });

  files.set('src/hooks/useAuth.ts', {
    path: 'src/hooks/useAuth.ts',
    language: 'typescript',
    imports: {
      'react': ['useState', 'useEffect'],
      'axios': ['default']
    },
    functions: {
      'useAuth()': {
        docstring: 'Custom hook for authentication management',
        state_changes: ['useState'],
        event_handlers: [],
        api_endpoints: [],
        is_hook: true
      }
    },
    classes: {}
  });

  // Express Backend Files
  files.set('server/app.js', {
    path: 'server/app.js',
    language: 'javascript',
    imports: {
      'express': ['default'],
      'cors': ['default'],
      './routes/users': ['userRoutes'],
      './middleware/auth': ['authMiddleware']
    },
    functions: {
      'createApp()': {
        docstring: 'Create and configure Express application',
        state_changes: [],
        event_handlers: [],
        api_endpoints: []
      },
      'startServer()': {
        docstring: 'Start the Express server',
        state_changes: [],
        event_handlers: [],
        api_endpoints: []
      }
    },
    classes: {}
  });

  files.set('server/routes/users.js', {
    path: 'server/routes/users.js',
    language: 'javascript',
    imports: {
      'express': ['Router'],
      '../models/User': ['User']
    },
    functions: {
      'getUsers(req, res)': {
        docstring: 'Get all users endpoint',
        state_changes: [],
        event_handlers: [],
        api_endpoints: []
      },
      'createUser(req, res)': {
        docstring: 'Create new user endpoint',
        state_changes: [],
        event_handlers: [],
        api_endpoints: []
      }
    },
    classes: {}
  });

  // Django Backend Alternative
  files.set('django_app/models.py', {
    path: 'django_app/models.py',
    language: 'python',
    imports: {
      'django.db.models': ['Model', 'CharField', 'EmailField', 'DateTimeField'],
      'django.contrib.auth.models': ['AbstractUser']
    },
    functions: {},
    classes: {
      'CustomUser': {
        docstring: 'Extended user model with additional fields',
        methods: {
          'get_full_name(self)': {
            docstring: 'Return the full name of the user',
            state_changes: [],
            event_handlers: [],
            api_endpoints: []
          }
        },
        base_classes: ['AbstractUser']
      }
    }
  });

  files.set('django_app/views.py', {
    path: 'django_app/views.py',
    language: 'python',
    imports: {
      'django.views.generic': ['ListView', 'CreateView'],
      'django.contrib.auth.mixins': ['LoginRequiredMixin'],
      '.models': ['CustomUser']
    },
    functions: {},
    classes: {
      'UserListView': {
        docstring: 'View to display list of users',
        methods: {},
        base_classes: ['LoginRequiredMixin', 'ListView']
      }
    }
  });

  files.set('manage.py', {
    path: 'manage.py',
    language: 'python',
    imports: {
      'django.core.management': ['execute_from_command_line'],
      'os': ['default']
    },
    functions: {},
    classes: {}
  });

  // NestJS Backend Alternative
  files.set('src/app.controller.ts', {
    path: 'src/app.controller.ts',
    language: 'typescript',
    imports: {
      '@nestjs/common': ['Controller', 'Get', 'Post', 'Body'],
      './app.service': ['AppService']
    },
    functions: {
      'getUsers()': {
        docstring: 'Get all users endpoint',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        decorators: [{ name: 'Get', arguments: ['/users'], line_number: 8 }]
      },
      'createUser(userData)': {
        docstring: 'Create new user endpoint',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        decorators: [{ name: 'Post', arguments: ['/users'], line_number: 12 }]
      }
    },
    classes: {
      'AppController': {
        docstring: 'Main application controller',
        methods: {},
        decorators: [{ name: 'Controller', arguments: [], line_number: 5 }]
      }
    }
  });

  files.set('src/app.service.ts', {
    path: 'src/app.service.ts',
    language: 'typescript',
    imports: {
      '@nestjs/common': ['Injectable'],
      '@nestjs/typeorm': ['InjectRepository'],
      'typeorm': ['Repository']
    },
    functions: {
      'findAllUsers()': {
        docstring: 'Find all users in database',
        state_changes: [],
        event_handlers: [],
        api_endpoints: []
      }
    },
    classes: {
      'AppService': {
        docstring: 'Main application service',
        methods: {},
        decorators: [{ name: 'Injectable', arguments: [], line_number: 4 }]
      }
    }
  });

  // Flutter Mobile App
  files.set('lib/main.dart', {
    path: 'lib/main.dart',
    language: 'dart',
    imports: {
      'package:flutter/material.dart': ['*'],
      'screens/home_screen.dart': ['HomeScreen']
    },
    functions: {
      'main()': {
        docstring: 'Application entry point',
        state_changes: [],
        event_handlers: [],
        api_endpoints: []
      }
    },
    classes: {
      'MyApp': {
        docstring: 'Main application widget',
        methods: {
          'build(context)': {
            docstring: 'Build the widget tree',
            state_changes: [],
            event_handlers: [],
            api_endpoints: []
          }
        },
        base_classes: ['StatelessWidget']
      }
    }
  });

  files.set('lib/screens/home_screen.dart', {
    path: 'lib/screens/home_screen.dart',
    language: 'dart',
    imports: {
      'package:flutter/material.dart': ['*'],
      '../widgets/user_list.dart': ['UserList']
    },
    functions: {},
    classes: {
      'HomeScreen': {
        docstring: 'Home screen widget',
        methods: {
          'build(context)': {
            docstring: 'Build the home screen',
            state_changes: [],
            event_handlers: [],
            api_endpoints: []
          }
        },
        base_classes: ['StatelessWidget']
      }
    }
  });

  return files;
}

/**
 * Demonstrate framework detection capabilities
 */
async function demonstrateFrameworkDetection() {
  console.log('🎯 Framework Detection Demo');
  console.log('============================');

  // Create sample project
  console.log('\n📁 Creating sample multi-framework project...');
  const sampleFiles = createSampleProject();
  console.log(`✅ Created ${sampleFiles.size} sample files`);

  // Show supported frameworks
  console.log('\n🛠️  Supported Frameworks:');
  const supportedFrameworks = getSupportedFrameworks();
  supportedFrameworks.forEach(framework => {
    console.log(`   • ${framework}`);
  });

  // Detect frameworks
  console.log('\n🔍 Detecting frameworks...');
  const detector = new FrameworkDetector(false);
  const detections = detector.detectFrameworks(sampleFiles);

  console.log(`\n📊 Detection Results (${detections.length} frameworks found):`);
  console.log('=' .repeat(50));

  detections.forEach(detection => {
    const confidencePercent = (detection.confidence * 100).toFixed(1);
    const barLength = Math.floor(detection.confidence * 20);
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

    console.log(`\n🎯 ${detection.name}`);
    console.log(`   Confidence: ${confidencePercent}% ${bar}`);
    console.log(`   Evidence Files: ${detection.evidence_files.length}`);
    console.log(`   Matched Patterns: ${detection.patterns_matched.length}`);

    // Show some evidence files
    const maxFiles = 3;
    const evidenceFiles = detection.evidence_files.slice(0, maxFiles);
    evidenceFiles.forEach(file => {
      console.log(`     📄 ${file}`);
    });

    if (detection.evidence_files.length > maxFiles) {
      console.log(`     ... and ${detection.evidence_files.length - maxFiles} more files`);
    }
  });

  // Get detailed report
  console.log('\n📈 Detailed Detection Report:');
  console.log('=' .repeat(30));
  const report = detector.getDetectionReport(sampleFiles);

  console.log(`\nProject Overview:`);
  console.log(`   Total Files: ${report.totalFiles}`);
  console.log(`   Detected Frameworks: ${report.detectedFrameworks.length}`);

  console.log(`\nLanguage Distribution:`);
  Object.entries(report.languageDistribution)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .forEach(([lang, count]) => {
      const percentage = ((count as number / report.totalFiles) * 100).toFixed(1);
      console.log(`   ${lang}: ${count} files (${percentage}%)`);
    });

  console.log(`\nFramework Capabilities:`);
  report.supportedFrameworks.forEach((framework: any) => {
    console.log(`   ${framework.name}:`);
    console.log(`     Min Confidence: ${(framework.minConfidence * 100).toFixed(0)}%`);
    console.log(`     Pattern Count: ${framework.patternCount}`);
    console.log(`     Languages: ${framework.primaryLanguages.join(', ')}`);
  });

  console.log('\n✨ Framework Detection Demo Complete!');
}

// Run the demo
demonstrateFrameworkDetection().catch(console.error);
