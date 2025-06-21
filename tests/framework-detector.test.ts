/**
 * Framework Detection Tests
 *
 * Comprehensive tests for the framework detection system including
 * pattern matching, confidence scoring, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FrameworkDetector } from '../src/patterns/framework-detector.js';
import {
  REACT_PATTERNS,
  DJANGO_PATTERNS,
  NESTJS_PATTERNS,
  getSupportedFrameworks
} from '../src/patterns/pattern-definitions.js';
import type { FileAnalysis } from '../src/types/index.js';

describe('FrameworkDetector', () => {
  let detector: FrameworkDetector;

  beforeEach(() => {
    detector = new FrameworkDetector(false); // No debug mode for tests
  });

  describe('React Detection', () => {
    it('should detect React from imports and JSX components', () => {
      const files = new Map<string, FileAnalysis>([
        ['App.jsx', {
          path: 'App.jsx',
          language: 'javascript',
          imports: {
            'react': ['default'],
            'react-dom': ['render']
          },
          functions: {
            'App()': {
              docstring: 'Main app component',
              state_changes: ['useState'],
              event_handlers: [],
              api_endpoints: [],
              is_component: true
            }
          },
          classes: {}
        }],
        ['components/Button.tsx', {
          path: 'components/Button.tsx',
          language: 'typescript',
          imports: {
            'react': ['FC']
          },
          functions: {
            'Button(props)': {
              docstring: 'Reusable button component',
              state_changes: [],
              event_handlers: ['onClick'],
              api_endpoints: [],
              is_component: true
            }
          },
          classes: {}
        }]
      ]);

      const detections = detector.detectFrameworks(files);
      const reactDetection = detections.find(d => d.name === 'React');

      expect(reactDetection).toBeDefined();
      expect(reactDetection!.confidence).toBeGreaterThan(0.3);
      expect(reactDetection!.evidence_files).toContain('App.jsx');
      expect(reactDetection!.evidence_files).toContain('components/Button.tsx');
      expect(reactDetection!.patterns_matched).toContain('react_import');
    });

    it('should detect React hooks usage', () => {
      const files = new Map<string, FileAnalysis>([
        ['hooks/useAuth.ts', {
          path: 'hooks/useAuth.ts',
          language: 'typescript',
          imports: {
            'react': ['useState', 'useEffect']
          },
          functions: {
            'useAuth()': {
              docstring: 'Authentication hook',
              state_changes: ['useState'],
              event_handlers: [],
              api_endpoints: [],
              is_hook: true
            }
          },
          classes: {}
        }]
      ]);

      const detections = detector.detectFrameworks(files);
      const reactDetection = detections.find(d => d.name === 'React');

      expect(reactDetection).toBeDefined();
      expect(reactDetection!.patterns_matched).toContain('use_state_hook');
    });
  });

  describe('Django Detection', () => {
    it('should detect Django from models and views', () => {
      const files = new Map<string, FileAnalysis>([
        ['models.py', {
          path: 'models.py',
          language: 'python',
          imports: {
            'django.db.models': ['Model', 'CharField']
          },
          functions: {},
          classes: {
            'User': {
              docstring: 'User model',
              methods: {},
              base_classes: ['Model']
            }
          }
        }],
        ['views.py', {
          path: 'views.py',
          language: 'python',
          imports: {
            'django.views.generic': ['ListView']
          },
          functions: {},
          classes: {
            'UserListView': {
              docstring: 'List all users',
              methods: {},
              base_classes: ['ListView']
            }
          }
        }],
        ['manage.py', {
          path: 'manage.py',
          language: 'python',
          imports: {
            'django.core.management': ['execute_from_command_line']
          },
          functions: {},
          classes: {}
        }]
      ]);

      const detections = detector.detectFrameworks(files);
      const djangoDetection = detections.find(d => d.name === 'Django');

      expect(djangoDetection).toBeDefined();
      expect(djangoDetection!.confidence).toBeGreaterThan(0.4);
      expect(djangoDetection!.evidence_files).toContain('models.py');
      expect(djangoDetection!.evidence_files).toContain('manage.py');
      expect(djangoDetection!.patterns_matched).toContain('django_import');
      expect(djangoDetection!.patterns_matched).toContain('django_manage_py');
    });
  });

  describe('NestJS Detection', () => {
    it('should detect NestJS from decorators and imports', () => {
      const files = new Map<string, FileAnalysis>([
        ['app.controller.ts', {
          path: 'app.controller.ts',
          language: 'typescript',
          imports: {
            '@nestjs/common': ['Controller', 'Get']
          },
          functions: {
            'getHello()': {
              docstring: 'Get hello message',
              state_changes: [],
              event_handlers: [],
              api_endpoints: [],
              decorators: [{ name: 'Get', arguments: [], line_number: 5 }]
            }
          },
          classes: {
            'AppController': {
              docstring: 'Main app controller',
              methods: {},
              decorators: [{ name: 'Controller', arguments: [], line_number: 3 }]
            }
          }
        }],
        ['app.service.ts', {
          path: 'app.service.ts',
          language: 'typescript',
          imports: {
            '@nestjs/common': ['Injectable']
          },
          functions: {},
          classes: {
            'AppService': {
              docstring: 'App service',
              methods: {},
              decorators: [{ name: 'Injectable', arguments: [], line_number: 1 }]
            }
          }
        }]
      ]);

      const detections = detector.detectFrameworks(files);
      const nestDetection = detections.find(d => d.name === 'NestJS');

      expect(nestDetection).toBeDefined();
      expect(nestDetection!.confidence).toBeGreaterThan(0.4);
      expect(nestDetection!.patterns_matched).toContain('nestjs_import');
      expect(nestDetection!.patterns_matched).toContain('controller_decorator');
      expect(nestDetection!.patterns_matched).toContain('injectable_decorator');
    });
  });

  describe('Multiple Framework Detection', () => {
    it('should detect multiple frameworks in the same project', () => {
      const files = new Map<string, FileAnalysis>([
        // React frontend
        ['frontend/App.jsx', {
          path: 'frontend/App.jsx',
          language: 'javascript',
          imports: { 'react': ['default'] },
          functions: { 'App()': { docstring: '', state_changes: [], event_handlers: [], api_endpoints: [], is_component: true } },
          classes: {}
        }],
        // Express backend
        ['backend/server.js', {
          path: 'backend/server.js',
          language: 'javascript',
          imports: { 'express': ['default'] },
          functions: {
            'startServer()': {
              docstring: 'Start the server',
              state_changes: [],
              event_handlers: [],
              api_endpoints: []
            }
          },
          classes: {}
        }]
      ]);

      const detections = detector.detectFrameworks(files);

      expect(detections.length).toBeGreaterThanOrEqual(2);
      expect(detections.find(d => d.name === 'React')).toBeDefined();
      expect(detections.find(d => d.name === 'Express')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file set', () => {
      const files = new Map<string, FileAnalysis>();
      const detections = detector.detectFrameworks(files);
      expect(detections).toEqual([]);
    });

    it('should handle files with errors', () => {
      const files = new Map<string, FileAnalysis>([
        ['broken.js', {
          path: 'broken.js',
          language: 'javascript',
          imports: {},
          functions: {},
          classes: {},
          error: 'Parsing failed'
        }]
      ]);

      const detections = detector.detectFrameworks(files);
      // Should not crash and should not detect anything from error files
      expect(Array.isArray(detections)).toBe(true);
    });

    it('should not detect frameworks below confidence threshold', () => {
      const files = new Map<string, FileAnalysis>([
        ['minimal.js', {
          path: 'minimal.js',
          language: 'javascript',
          imports: {}, // No framework imports
          functions: {},
          classes: {}
        }]
      ]);

      const detections = detector.detectFrameworks(files);
      // Should not detect any frameworks without clear evidence
      expect(detections.length).toBe(0);
    });
  });

  describe('Confidence Scoring', () => {
    it('should provide higher confidence for more evidence', () => {
      const minimalReact = new Map<string, FileAnalysis>([
        ['App.js', {
          path: 'App.js',
          language: 'javascript',
          imports: { 'react': ['default'] },
          functions: {},
          classes: {}
        }]
      ]);

      const fullReact = new Map<string, FileAnalysis>([
        ['App.jsx', {
          path: 'App.jsx',
          language: 'javascript',
          imports: { 'react': ['default'], 'react-dom': ['render'] },
          functions: {
            'App()': {
              docstring: '',
              state_changes: ['useState'],
              event_handlers: [],
              api_endpoints: [],
              is_component: true
            }
          },
          classes: {}
        }],
        ['components/Button.jsx', {
          path: 'components/Button.jsx',
          language: 'javascript',
          imports: { 'react': ['default'] },
          functions: {
            'Button()': {
              docstring: '',
              state_changes: [],
              event_handlers: ['onClick'],
              api_endpoints: [],
              is_component: true
            }
          },
          classes: {}
        }]
      ]);

      const minimalDetection = detector.detectFrameworks(minimalReact).find(d => d.name === 'React');
      const fullDetection = detector.detectFrameworks(fullReact).find(d => d.name === 'React');

      expect(minimalDetection).toBeDefined();
      expect(fullDetection).toBeDefined();
      expect(fullDetection!.confidence).toBeGreaterThan(minimalDetection!.confidence);
    });
  });

  describe('Detection Report', () => {
    it('should provide detailed detection report', () => {
      const files = new Map<string, FileAnalysis>([
        ['App.jsx', {
          path: 'App.jsx',
          language: 'javascript',
          imports: { 'react': ['default'] },
          functions: { 'App()': { docstring: '', state_changes: [], event_handlers: [], api_endpoints: [], is_component: true } },
          classes: {}
        }]
      ]);

      const report = detector.getDetectionReport(files);

      expect(report).toHaveProperty('totalFiles');
      expect(report).toHaveProperty('detectedFrameworks');
      expect(report).toHaveProperty('languageDistribution');
      expect(report).toHaveProperty('supportedFrameworks');
      expect(report.totalFiles).toBe(1);
      expect(Array.isArray(report.detectedFrameworks)).toBe(true);
      expect(report.languageDistribution).toHaveProperty('javascript');
    });
  });
});
