/**
 * API Endpoint Detection Demo
 *
 * This example demonstrates the API endpoint detection capabilities
 * across Express.js, NestJS, and Django frameworks.
 */

import {
  ApiDetector,
  AnalysisCoordinator,
  type DetailedApiEndpoint,
  type FileAnalysis
} from '../src/index.js';

/**
 * Sample file analyses representing different frameworks
 */
function createSampleAnalyses(): Map<string, FileAnalysis> {
  const analyses = new Map<string, FileAnalysis>();

  // Express.js example
  analyses.set('server/routes/users.js', {
    path: 'server/routes/users.js',
    language: 'javascript',
    imports: {
      'express': ['express', 'Router']
    },
    functions: {
      'getUsers()': {
        docstring: 'Get all users',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [
          {
            type: 'express_route',
            method: 'GET',
            route: '/users',
            line: 10
          }
        ],
        line_number: 10
      },
      'createUser(req, res)': {
        docstring: 'Create a new user',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [
          {
            type: 'express_route',
            method: 'POST',
            route: '/users',
            line: 20
          }
        ],
        line_number: 20
      },
      'getUserById(req, res)': {
        docstring: 'Get user by ID',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [
          {
            type: 'express_route',
            method: 'GET',
            route: '/users/:id',
            line: 30
          }
        ],
        line_number: 30
      }
    },
    classes: {}
  });

  // NestJS example
  analyses.set('src/controllers/products.controller.ts', {
    path: 'src/controllers/products.controller.ts',
    language: 'typescript',
    imports: {
      '@nestjs/common': ['Controller', 'Get', 'Post', 'Param', 'Body']
    },
    functions: {},
    classes: {
      'ProductsController': {
        docstring: 'Products API controller',
        methods: {
          'findAll()': {
            docstring: 'Get all products',
            state_changes: [],
            event_handlers: [],
            api_endpoints: [],
            decorators: [
              {
                name: 'Get',
                arguments: [],
                line_number: 15
              }
            ],
            line_number: 15
          },
          'findOne(id)': {
            docstring: 'Get product by ID',
            state_changes: [],
            event_handlers: [],
            api_endpoints: [],
            decorators: [
              {
                name: 'Get',
                arguments: [':id'],
                line_number: 25
              }
            ],
            line_number: 25
          },
          'create(createProductDto)': {
            docstring: 'Create a new product',
            state_changes: [],
            event_handlers: [],
            api_endpoints: [],
            decorators: [
              {
                name: 'Post',
                arguments: [],
                line_number: 35
              }
            ],
            line_number: 35
          }
        },
        decorators: [
          {
            name: 'Controller',
            arguments: ['products'],
            line_number: 5
          }
        ],
        line_number: 5
      }
    }
  });

  // Django example
  analyses.set('myapp/views.py', {
    path: 'myapp/views.py',
    language: 'python',
    imports: {
      'django.http': ['HttpResponse'],
      'django.shortcuts': ['render'],
      'rest_framework.decorators': ['api_view'],
      'rest_framework.response': ['Response']
    },
    functions: {
      'user_list(request)': {
        docstring: 'List all users',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [
          {
            type: 'django_api_view',
            methods: 'GET,POST',
            line: 10
          }
        ],
        decorators: [
          {
            name: 'api_view',
            arguments: ['[\'GET\', \'POST\']'],
            line_number: 9
          }
        ],
        parameters: ['request'],
        line_number: 10
      },
      'user_detail(request, pk)': {
        docstring: 'Get, update or delete a user',
        state_changes: [],
        event_handlers: [],
        api_endpoints: [],
        decorators: [
          {
            name: 'api_view',
            arguments: ['[\'GET\', \'PUT\', \'DELETE\']'],
            line_number: 25
          }
        ],
        parameters: ['request', 'pk'],
        line_number: 26
      }
    },
    classes: {
      'UserViewSet': {
        docstring: 'ViewSet for User model',
        methods: {
          'list(self, request)': {
            docstring: 'List users',
            state_changes: [],
            event_handlers: [],
            api_endpoints: [],
            line_number: 45
          },
          'create(self, request)': {
            docstring: 'Create user',
            state_changes: [],
            event_handlers: [],
            api_endpoints: [],
            line_number: 50
          },
          'retrieve(self, request, pk)': {
            docstring: 'Get user by ID',
            state_changes: [],
            event_handlers: [],
            api_endpoints: [],
            line_number: 55
          }
        },
        base_classes: ['ModelViewSet'],
        line_number: 40
      }
    }
  });

  return analyses;
}

/**
 * Demonstrate API endpoint detection
 */
async function demonstrateApiDetection() {
  console.log('🔍 API Endpoint Detection Demo');
  console.log('==============================');

  try {
    // Create API detector
    const apiDetector = new ApiDetector(true); // Enable debug mode

    // Get sample analyses
    const fileAnalyses = createSampleAnalyses();

    console.log(`\n📁 Analyzing ${fileAnalyses.size} files for API endpoints...\n`);

    // Detect endpoints
    const endpoints = apiDetector.detectEndpoints(fileAnalyses);

    // Generate statistics
    const stats = apiDetector.getDetectionStats(endpoints);

    // Display results
    console.log('\n📊 Detection Results');
    console.log('===================');

    console.log(`\n🎯 Summary:`);
    console.log(`   Total endpoints found: ${stats.totalEndpoints}`);
    console.log(`   Files with endpoints: ${stats.filesWithEndpoints.length}`);

    console.log(`\n🔧 By Framework:`);
    Object.entries(stats.frameworkDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([framework, count]) => {
        console.log(`   ${framework}: ${count} endpoints`);
      });

    console.log(`\n📡 By HTTP Method:`);
    Object.entries(stats.methodDistribution)
      .filter(([, count]) => count > 0)
      .sort(([,a], [,b]) => b - a)
      .forEach(([method, count]) => {
        console.log(`   ${method}: ${count} endpoints`);
      });

    console.log(`\n🛣️  Common Route Patterns:`);
    stats.commonPatterns.slice(0, 5).forEach(({ pattern, count }) => {
      console.log(`   ${pattern}: ${count} occurrences`);
    });

    console.log(`\n📋 Detailed Endpoints:`);
    console.log('=====================');

    // Group endpoints by framework
    const endpointsByFramework = endpoints.reduce((groups, endpoint) => {
      const framework = endpoint.framework;
      if (!groups[framework]) {
        groups[framework] = [];
      }
      groups[framework].push(endpoint);
      return groups;
    }, {} as Record<string, DetailedApiEndpoint[]>);

    for (const [framework, frameworkEndpoints] of Object.entries(endpointsByFramework)) {
      console.log(`\n🚀 ${framework} Endpoints:`);

      frameworkEndpoints.forEach((endpoint, index) => {
        console.log(`   ${index + 1}. ${endpoint.method} ${endpoint.route}`);
        console.log(`      📄 File: ${endpoint.filePath}:${endpoint.line}`);
        console.log(`      🎯 Handler: ${endpoint.handlerFunction}`);

        if (endpoint.parameters && endpoint.parameters.length > 0) {
          console.log(`      📝 Parameters: ${endpoint.parameters.map(p => `${p.name}(${p.type})`).join(', ')}`);
        }

        if (endpoint.middleware && endpoint.middleware.length > 0) {
          console.log(`      🛡️  Middleware: ${endpoint.middleware.join(', ')}`);
        }

        console.log('');
      });
    }

    // Test integration with analysis coordinator
    console.log('\n🔗 Integration Test');
    console.log('==================');

    const coordinator = new AnalysisCoordinator();
    await coordinator.initialize();

    // Test analyzing a simple Express file
    const expressCode = `
import express from 'express';
const app = express();

app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.post('/api/users/:id', (req, res) => {
  res.json({ user: req.params.id });
});

export default app;
`;

    console.log('\n🧪 Testing live analysis with API detection...');
    const result = await coordinator.analyzeFile('test-server.js', expressCode);

    console.log(`✅ Analysis completed:`);
    console.log(`   Language: ${result.detectedLanguage}`);
    console.log(`   Parser: ${result.parser}`);
    console.log(`   Functions found: ${Object.keys(result.analysis.functions || {}).length}`);
    console.log(`   Imports found: ${Object.keys(result.analysis.imports || {}).length}`);

    // Try to detect endpoints from the analyzed file
    const liveAnalyses = new Map([['test-server.js', result.analysis]]);
    const liveEndpoints = apiDetector.detectEndpoints(liveAnalyses);

    console.log(`   API endpoints detected: ${liveEndpoints.length}`);
    liveEndpoints.forEach(endpoint => {
      console.log(`     ${endpoint.method} ${endpoint.route} (${endpoint.framework})`);
    });

    console.log('\n✨ API Detection Demo Complete!');
    console.log(`🎉 Successfully detected ${stats.totalEndpoints} endpoints across ${Object.keys(stats.frameworkDistribution).length} frameworks`);

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
demonstrateApiDetection();
