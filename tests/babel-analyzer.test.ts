/**
 * Unit tests for BabelAnalyzer
 *
 * These tests validate JavaScript and TypeScript parsing capabilities,
 * AST analysis, and metadata extraction using Babel parser.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BabelAnalyzer } from '../src/parsers/babel-analyzer.js';

describe('BabelAnalyzer', () => {
  let analyzer: BabelAnalyzer;

  beforeEach(() => {
    analyzer = new BabelAnalyzer();
  });

  describe('JavaScript parsing', () => {
    it('should parse simple function declarations', async () => {
      const jsCode = `
        function hello(name) {
          console.log("Hello, " + name);
          return true;
        }
      `;

      const result = await analyzer.parseJavaScript(jsCode, 'javascript', 'test.js');

      expect(result.error).toBeUndefined();
      expect(result.functions).toBeDefined();
      expect(Object.keys(result.functions!)).toContain('hello(name)');

      const helloFunc = result.functions!['hello(name)'];
      expect(helloFunc.parameters).toEqual(['name']);
      expect(helloFunc.is_async).toBe(false);
    });

    it('should parse arrow functions', async () => {
      const jsCode = `
        const greet = (name, age) => {
          return \`Hello \${name}, you are \${age} years old\`;
        };

        const add = (a, b) => a + b;
      `;

      const result = await analyzer.parseJavaScript(jsCode, 'javascript', 'test.js');

      expect(result.error).toBeUndefined();
      expect(result.functions).toBeDefined();
      expect(Object.keys(result.functions!)).toContain('greet(name, age)');
      expect(Object.keys(result.functions!)).toContain('add(a, b)');

      const greetFunc = result.functions!['greet(name, age)'];
      expect(greetFunc.parameters).toEqual(['name', 'age']);
    });

    it('should parse class declarations', async () => {
      const jsCode = `
        class TestClass extends BaseClass {
          constructor(value) {
            super();
            this.value = value;
          }

          getValue() {
            return this.value;
          }

          async fetchData() {
            return await fetch('/api/data');
          }
        }
      `;

      const result = await analyzer.parseJavaScript(jsCode, 'javascript', 'test.js');

      expect(result.error).toBeUndefined();
      expect(result.classes).toBeDefined();
      expect(Object.keys(result.classes!)).toContain('TestClass');

      const testClass = result.classes!['TestClass'];
      expect(testClass.base_classes).toEqual(['BaseClass']);
      expect(testClass.methods).toBeDefined();
      expect(Object.keys(testClass.methods)).toContain('constructor(value)');
      expect(Object.keys(testClass.methods)).toContain('getValue()');
      expect(Object.keys(testClass.methods)).toContain('fetchData()');

      const fetchMethod = testClass.methods['fetchData()'];
      expect(fetchMethod.is_async).toBe(true);
    });

    it('should parse import statements', async () => {
      const jsCode = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as utils from './utils';
        import { Button } from '@/components/Button';
      `;

      const result = await analyzer.parseJavaScript(jsCode, 'javascript', 'test.js');

      expect(result.error).toBeUndefined();
      expect(result.imports).toBeDefined();

      const imports = result.imports!;
      expect(imports['react']).toContain('React');
      expect(imports['react']).toContain('useState');
      expect(imports['react']).toContain('useEffect');
      expect(imports['./utils']).toContain('* as utils');
      expect(imports['@/components/Button']).toContain('Button');
    });

    it('should detect React components', async () => {
      const jsCode = `
        function MyComponent(props) {
          return <div>Hello {props.name}</div>;
        }

        const AnotherComponent = ({ title }) => {
          return <h1>{title}</h1>;
        };

        function regularFunction() {
          return "not a component";
        }
      `;

      const result = await analyzer.parseJavaScript(jsCode, 'javascript', 'test.js');

      expect(result.error).toBeUndefined();
      expect(result.functions).toBeDefined();

      const myComponent = result.functions!['MyComponent(props)'];
      expect(myComponent.is_component).toBe(true);

      const anotherComponent = result.functions!['AnotherComponent({ ... })'];
      expect(anotherComponent.is_component).toBe(true);

      const regularFunc = result.functions!['regularFunction()'];
      expect(regularFunc.is_component).toBeUndefined();
    });

    it('should detect React hooks', async () => {
      const jsCode = `
        function useCounter(initialValue = 0) {
          const [count, setCount] = useState(initialValue);

          const increment = () => setCount(count + 1);
          const decrement = () => setCount(count - 1);

          return { count, increment, decrement };
        }

        const useLocalStorage = (key, defaultValue) => {
          const [value, setValue] = useState(defaultValue);
          return [value, setValue];
        };
      `;

      const result = await analyzer.parseJavaScript(jsCode, 'javascript', 'test.js');

      expect(result.error).toBeUndefined();
      expect(result.functions).toBeDefined();

      const useCounter = result.functions!['useCounter(initialValue)'];
      expect(useCounter.is_hook).toBe(true);

      const useLocalStorage = result.functions!['useLocalStorage(key, defaultValue)'];
      expect(useLocalStorage.is_hook).toBe(true);
    });

    it('should handle JSDoc comments', async () => {
      const jsCode = `
        /**
         * Calculates the sum of two numbers
         * @param {number} a - First number
         * @param {number} b - Second number
         * @returns {number} The sum of a and b
         */
        function add(a, b) {
          return a + b;
        }

        /**
         * A sample React component
         * @param {Object} props - Component props
         * @param {string} props.title - The title to display
         */
        function Header({ title }) {
          return <h1>{title}</h1>;
        }
      `;

      const result = await analyzer.parseJavaScript(jsCode, 'javascript', 'test.js');

      expect(result.error).toBeUndefined();
      expect(result.functions).toBeDefined();

      const addFunc = result.functions!['add(a, b)'];
      expect(addFunc.docstring).toContain('Calculates the sum of two numbers');
      expect(addFunc.docstring).toContain('@param {number} a');

      const headerFunc = result.functions!['Header({ ... })'];
      expect(headerFunc.docstring).toContain('A sample React component');
      expect(headerFunc.docstring).toContain('@param {Object} props');
    });

    it('should handle parameter destructuring', async () => {
        const jsCode = `
            function processUser({ name, age, email }) {
            console.log(name, age, email);
            }

            const handleArray = ([first, second, ...rest]) => {
            return { first, second, rest };
            };

            const withDefaults = (a, b = 10, ...args) => {
            return a + b + args.length;
            };
        `;

        const result = await analyzer.parseJavaScript(jsCode, 'javascript', 'test.js');

        expect(result.error).toBeUndefined();
        expect(result.functions).toBeDefined();

        // Check the actual function signatures that should be generated
        expect(Object.keys(result.functions!)).toContain('processUser({ ... })');
        expect(Object.keys(result.functions!)).toContain('handleArray([ ... ])');
        expect(Object.keys(result.functions!)).toContain('withDefaults(a, b, ...args)');

        // Verify the parameter arrays are correct
        const processUserFunc = result.functions!['processUser({ ... })'];
        expect(processUserFunc.parameters).toEqual(['{ ... }']);

        const withDefaultsFunc = result.functions!['withDefaults(a, b, ...args)'];
        expect(withDefaultsFunc.parameters).toEqual(['a', 'b', '...args']);
        });

  });

  describe('TypeScript parsing', () => {
    it('should parse TypeScript interfaces and types', async () => {
      const tsCode = `
        interface User {
          id: number;
          name: string;
          email?: string;
        }

        type Status = 'active' | 'inactive' | 'pending';

        function getUser(id: number): Promise<User> {
          return fetch(\`/api/users/\${id}\`).then(res => res.json());
        }

        class UserService {
          async createUser(user: Omit<User, 'id'>): Promise<User> {
            return this.api.post('/users', user);
          }
        }
      `;

      const result = await analyzer.parseJavaScript(tsCode, 'typescript', 'test.ts');

      expect(result.error).toBeUndefined();
      expect(result.functions).toBeDefined();
      expect(result.classes).toBeDefined();

      expect(Object.keys(result.functions!)).toContain('getUser(id)');
      expect(Object.keys(result.classes!)).toContain('UserService');

      const userService = result.classes!['UserService'];
      expect(Object.keys(userService.methods)).toContain('createUser(user)');
    });

    it('should handle generic types', async () => {
      const tsCode = `
        function identity<T>(arg: T): T {
          return arg;
        }

        class Container<T> {
          private value: T;

          constructor(value: T) {
            this.value = value;
          }

          getValue(): T {
            return this.value;
          }
        }
      `;

      const result = await analyzer.parseJavaScript(tsCode, 'typescript', 'test.ts');

      expect(result.error).toBeUndefined();
      expect(result.functions).toBeDefined();
      expect(result.classes).toBeDefined();

      expect(Object.keys(result.functions!)).toContain('identity(arg)');
      expect(Object.keys(result.classes!)).toContain('Container');
    });
  });

  describe('error handling', () => {
    it('should handle syntax errors gracefully', async () => {
      const invalidCode = `
        function broken( {
          console.log("missing closing parenthesis"
          return "broken";
        }
      `;

      const result = await analyzer.parseJavaScript(invalidCode, 'javascript', 'broken.js');

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Babel parsing failed');
    });

    it('should handle empty files', async () => {
      const emptyCode = '';

      const result = await analyzer.parseJavaScript(emptyCode, 'javascript', 'empty.js');

      expect(result.error).toBeUndefined();
      expect(result.functions).toEqual({});
      expect(result.classes).toEqual({});
      expect(result.imports).toEqual({});
    });

    it('should handle files with only comments', async () => {
      const commentOnlyCode = `
        // This is a comment
        /* This is a block comment */
        /**
         * This is a JSDoc comment
         */
      `;

      const result = await analyzer.parseJavaScript(commentOnlyCode, 'javascript', 'comments.js');

      expect(result.error).toBeUndefined();
      expect(result.functions).toEqual({});
      expect(result.classes).toEqual({});
      expect(result.imports).toEqual({});
    });
  });

  describe('complex scenarios', () => {
    it('should handle nested classes and functions', async () => {
      const complexCode = `
        class OuterClass {
          constructor() {
            this.inner = class InnerClass {
              method() {
                return function nestedFunction() {
                  return "deeply nested";
                };
              }
            };
          }

          createInner() {
            return new this.inner();
          }
        }
      `;

      const result = await analyzer.parseJavaScript(complexCode, 'javascript', 'complex.js');

      expect(result.error).toBeUndefined();
      expect(result.classes).toBeDefined();
      expect(Object.keys(result.classes!)).toContain('OuterClass');
    });

    it('should handle mixed imports and exports', async () => {
      const moduleCode = `
        import { Component } from 'react';
        import defaultExport from './other';

        export class MyComponent extends Component {
          render() {
            return null;
          }
        }

        export const utilities = {
          helper: () => 'help'
        };

        export default MyComponent;
      `;

      const result = await analyzer.parseJavaScript(moduleCode, 'javascript', 'module.js');

      expect(result.error).toBeUndefined();
      expect(result.imports).toBeDefined();
      expect(result.classes).toBeDefined();

      const imports = result.imports!;
      expect(imports['react']).toContain('Component');
      expect(imports['./other']).toContain('defaultExport');
      expect(imports['__exports__']).toContain('default');
    });
  });
});
