/**
 * Babel Analyzer Demo
 *
 * This example demonstrates using BabelAnalyzer to parse JavaScript and TypeScript
 * files, extract detailed metadata, and analyze React/modern JavaScript patterns.
 */

import { BabelAnalyzer } from '../src/index.js';

/**
 * Sample JavaScript/React code to analyze
 */
const SAMPLE_REACT_CODE = `
/**
 * A custom React hook for managing counter state
 * @param {number} initialValue - The initial counter value
 * @returns {Object} Counter state and control functions
 */
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(prev => prev - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
}

/**
 * A React component that displays a counter
 * @param {Object} props - Component props
 * @param {string} props.title - The counter title
 * @param {number} props.initialValue - Initial counter value
 */
const Counter = ({ title = "Counter", initialValue = 0 }) => {
  const { count, increment, decrement, reset } = useCounter(initialValue);

  useEffect(() => {
    document.title = \`\${title}: \${count}\`;
  }, [title, count]);

  return (
    <div className="counter">
      <h2>{title}</h2>
      <div className="count-display">{count}</div>
      <div className="controls">
        <button onClick={increment}>+</button>
        <button onClick={decrement}>-</button>
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  );
};

/**
 * Utility class for counter operations
 */
class CounterUtils {
  /**
   * Validates if a number is a valid counter value
   * @param {number} value - Value to validate
   * @returns {boolean} True if valid
   */
  static isValidCount(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * Formats a count for display
   * @param {number} count - Count to format
   * @returns {string} Formatted count
   */
  static formatCount(count) {
    if (!this.isValidCount(count)) return '0';
    return count.toLocaleString();
  }
}

export { useCounter, Counter, CounterUtils };
export default Counter;
`;

/**
 * Sample TypeScript code to analyze
 */
const SAMPLE_TYPESCRIPT_CODE = `
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

/**
 * Service class for user management
 */
class UserService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches a user by ID
   * @param id - User ID
   * @returns Promise resolving to user data
   */
  async getUser(id: number): Promise<ApiResponse<User>> {
    const response = await fetch(\`\${this.baseUrl}/users/\${id}\`);
    return response.json();
  }

  /**
   * Creates a new user
   * @param userData - User data without ID
   * @returns Promise resolving to created user
   */
  async createUser(userData: Omit<User, 'id'>): Promise<ApiResponse<User>> {
    const response = await fetch(\`\${this.baseUrl}/users\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }
}

/**
 * Generic API client
 */
export class ApiClient<T = any> {
  constructor(private endpoint: string) {}

  async get<R = T>(id?: string | number): Promise<ApiResponse<R>> {
    const url = id ? \`\${this.endpoint}/\${id}\` : this.endpoint;
    const response = await fetch(url);
    return response.json();
  }
}
`;

/**
 * Analyzes code samples and displays results
 */
async function demonstrateBabelAnalyzer() {
  console.log('🔬 Babel Analyzer Demo');
  console.log('====================');

  const analyzer = new BabelAnalyzer();

  try {
    // Analyze React/JavaScript code
    console.log('\n📄 Analyzing React/JavaScript Code...');
    const jsResult = await analyzer.parseJavaScript(SAMPLE_REACT_CODE, 'javascript', 'Counter.jsx');

    if (jsResult.error) {
      console.error('❌ JavaScript analysis failed:', jsResult.error);
    } else {
      console.log('✅ JavaScript analysis successful!');

      // Display imports
      if (jsResult.imports && Object.keys(jsResult.imports).length > 0) {
        console.log('\n📦 Imports found:');
        Object.entries(jsResult.imports).forEach(([module, imports]) => {
          console.log(`  ${module}: [${imports.join(', ')}]`);
        });
      }

      // Display functions
      if (jsResult.functions && Object.keys(jsResult.functions).length > 0) {
        console.log('\n🔧 Functions found:');
        Object.entries(jsResult.functions).forEach(([signature, info]) => {
          const badges = [];
          if (info.is_component) badges.push('COMPONENT');
          if (info.is_hook) badges.push('HOOK');
          if (info.is_async) badges.push('ASYNC');

          console.log(`  📋 ${signature}`);
          if (badges.length > 0) {
            console.log(`     🏷️  [${badges.join(', ')}]`);
          }
          if (info.docstring) {
            console.log(`     📝 ${info.docstring.split('\n')[0]}...`);
          }
          if (info.parameters && info.parameters.length > 0) {
            console.log(`     🔧 Parameters: [${info.parameters.join(', ')}]`);
          }
        });
      }

      // Display classes
      if (jsResult.classes && Object.keys(jsResult.classes).length > 0) {
        console.log('\n🏛️  Classes found:');
        Object.entries(jsResult.classes).forEach(([className, info]) => {
          console.log(`  📋 ${className}`);
          if (info.docstring) {
            console.log(`     📝 ${info.docstring.split('\n')[0]}...`);
          }
          if (info.base_classes && info.base_classes.length > 0) {
            console.log(`     🔗 Extends: [${info.base_classes.join(', ')}]`);
          }
          if (info.methods && Object.keys(info.methods).length > 0) {
            console.log(`     🔧 Methods: [${Object.keys(info.methods).join(', ')}]`);
          }
        });
      }
    }

    // Analyze TypeScript code
    console.log('\n\n📄 Analyzing TypeScript Code...');
    const tsResult = await analyzer.parseJavaScript(SAMPLE_TYPESCRIPT_CODE, 'typescript', 'UserService.ts');

    if (tsResult.error) {
      console.error('❌ TypeScript analysis failed:', tsResult.error);
    } else {
      console.log('✅ TypeScript analysis successful!');

      // Display classes with methods
      if (tsResult.classes && Object.keys(tsResult.classes).length > 0) {
        console.log('\n🏛️  Classes found:');
        Object.entries(tsResult.classes).forEach(([className, info]) => {
          console.log(`  📋 ${className}`);
          if (info.docstring) {
            console.log(`     📝 ${info.docstring}`);
          }

          if (info.methods && Object.keys(info.methods).length > 0) {
            console.log('     🔧 Methods:');
            Object.entries(info.methods).forEach(([methodSig, methodInfo]) => {
              const asyncBadge = methodInfo.is_async ? ' [ASYNC]' : '';
              console.log(`       • ${methodSig}${asyncBadge}`);
              if (methodInfo.docstring) {
                console.log(`         📝 ${methodInfo.docstring.split('\n')[0]}`);
              }
            });
          }
        });
      }

      // Display functions
      if (tsResult.functions && Object.keys(tsResult.functions).length > 0) {
        console.log('\n🔧 Functions found:');
        Object.entries(tsResult.functions).forEach(([signature, info]) => {
          const asyncBadge = info.is_async ? ' [ASYNC]' : '';
          console.log(`  📋 ${signature}${asyncBadge}`);
          if (info.docstring) {
            console.log(`     📝 ${info.docstring.split('\n')[0]}`);
          }
        });
      }
    }

    // Summary
    console.log('\n📊 Analysis Summary:');
    console.log(`   JavaScript/React: ${Object.keys(jsResult.functions || {}).length} functions, ${Object.keys(jsResult.classes || {}).length} classes`);
    console.log(`   TypeScript: ${Object.keys(tsResult.functions || {}).length} functions, ${Object.keys(tsResult.classes || {}).length} classes`);

    const reactComponents = Object.values(jsResult.functions || {}).filter(f => f.is_component).length;
    const reactHooks = Object.values(jsResult.functions || {}).filter(f => f.is_hook).length;
    const asyncFunctions = [...Object.values(jsResult.functions || {}), ...Object.values(tsResult.functions || {})].filter(f => f.is_async).length;

    console.log(`   React Components: ${reactComponents}`);
    console.log(`   React Hooks: ${reactHooks}`);
    console.log(`   Async Functions: ${asyncFunctions}`);

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
demonstrateBabelAnalyzer();
