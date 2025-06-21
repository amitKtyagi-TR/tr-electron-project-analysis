/**
 * Language Detection Demo
 *
 * This example demonstrates the LanguageDetector capabilities including
 * extension-based detection, shebang parsing, and content analysis.
 */

import { LanguageDetector, GitProcessor } from '../src/index.js';

/**
 * Sample code snippets for testing content-based detection
 */
const CODE_SAMPLES = {
  python: `#!/usr/bin/env python3
import os
import sys
from typing import List, Dict

class DataProcessor:
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.results: List[Dict] = []

    def process_data(self) -> None:
        """Process the data and store results"""
        with open(self.data_path, 'r') as file:
            for line in file:
                processed = self._process_line(line.strip())
                self.results.append(processed)

    def _process_line(self, line: str) -> Dict:
        return {"original": line, "length": len(line)}

if __name__ == "__main__":
    processor = DataProcessor(sys.argv[1])
    processor.process_data()
    print(f"Processed {len(processor.results)} lines")
`,

  javascript: `#!/usr/bin/env node
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    console.log('TodoApp mounted');
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  };

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos(prev => [...prev, {
        id: Date.now(),
        text: inputValue,
        completed: false
      }]);
      setInputValue('');
    }
  };

  return (
    <div className="todo-app">
      <h1>Todo List</h1>
      <div className="input-section">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<TodoApp />);
`,

  typescript: `interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  errors?: string[];
}

type UserCreateInput = Omit<User, 'id' | 'createdAt'>;

class UserService {
  private readonly apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async getUser(id: number): Promise<ApiResponse<User>> {
    const response = await fetch(\`\${this.apiUrl}/users/\${id}\`);
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    return response.json();
  }

  async createUser(userData: UserCreateInput): Promise<ApiResponse<User>> {
    const response = await fetch(\`\${this.apiUrl}/users\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...userData,
        createdAt: new Date().toISOString(),
      }),
    });
    return response.json();
  }

  async updateUser(id: number, updates: Partial<UserCreateInput>): Promise<ApiResponse<User>> {
    const response = await fetch(\`\${this.apiUrl}/users/\${id}\`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.json();
  }
}

export { UserService, type User, type ApiResponse, type UserCreateInput };
`,

  dart: `import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class CounterApp extends StatelessWidget {
  const CounterApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Counter',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: const CounterPage(),
    );
  }
}

class CounterPage extends StatefulWidget {
  const CounterPage({Key? key}) : super(key: key);

  @override
  State<CounterPage> createState() => _CounterPageState();
}

class _CounterPageState extends State<CounterPage>
    with SingleTickerProviderStateMixin {
  int _counter = 0;
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _animation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.elasticOut),
    );
  }

  void _incrementCounter() async {
    await HapticFeedback.lightImpact();
    setState(() {
      _counter++;
    });
    _animationController.forward().then((_) {
      _animationController.reverse();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flutter Counter'),
        backgroundColor: Theme.of(context).primaryColor,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text(
              'You have pushed the button this many times:',
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 20),
            AnimatedBuilder(
              animation: _animation,
              builder: (context, child) {
                return Transform.scale(
                  scale: _animation.value,
                  child: Text(
                    '$_counter',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).primaryColor,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
}

void main() {
  runApp(const CounterApp());
}
`,

  java: `package com.example.calculator;

import java.util.Scanner;
import java.util.Stack;
import java.util.HashMap;
import java.util.Map;

/**
 * A simple calculator that evaluates mathematical expressions
 * Supporting basic arithmetic operations and parentheses
 */
public class Calculator {
    private static final Map<Character, Integer> PRECEDENCE = new HashMap<>();

    static {
        PRECEDENCE.put('+', 1);
        PRECEDENCE.put('-', 1);
        PRECEDENCE.put('*', 2);
        PRECEDENCE.put('/', 2);
    }

    private Stack<Double> operands;
    private Stack<Character> operators;

    public Calculator() {
        this.operands = new Stack<>();
        this.operators = new Stack<>();
    }

    public double evaluate(String expression) throws IllegalArgumentException {
        if (expression == null || expression.trim().isEmpty()) {
            throw new IllegalArgumentException("Expression cannot be null or empty");
        }

        expression = expression.replaceAll("\\s+", "");
        operands.clear();
        operators.clear();

        for (int i = 0; i < expression.length(); i++) {
            char ch = expression.charAt(i);

            if (Character.isDigit(ch) || ch == '.') {
                StringBuilder number = new StringBuilder();
                while (i < expression.length() &&
                       (Character.isDigit(expression.charAt(i)) || expression.charAt(i) == '.')) {
                    number.append(expression.charAt(i++));
                }
                i--; // Adjust for the extra increment
                operands.push(Double.parseDouble(number.toString()));
            } else if (ch == '(') {
                operators.push(ch);
            } else if (ch == ')') {
                while (!operators.isEmpty() && operators.peek() != '(') {
                    applyOperation();
                }
                operators.pop(); // Remove the '('
            } else if (PRECEDENCE.containsKey(ch)) {
                while (!operators.isEmpty() &&
                       operators.peek() != '(' &&
                       PRECEDENCE.get(operators.peek()) >= PRECEDENCE.get(ch)) {
                    applyOperation();
                }
                operators.push(ch);
            }
        }

        while (!operators.isEmpty()) {
            applyOperation();
        }

        return operands.pop();
    }

    private void applyOperation() {
        if (operands.size() < 2 || operators.isEmpty()) {
            throw new IllegalArgumentException("Invalid expression");
        }

        double b = operands.pop();
        double a = operands.pop();
        char op = operators.pop();

        switch (op) {
            case '+':
                operands.push(a + b);
                break;
            case '-':
                operands.push(a - b);
                break;
            case '*':
                operands.push(a * b);
                break;
            case '/':
                if (b == 0) {
                    throw new IllegalArgumentException("Division by zero");
                }
                operands.push(a / b);
                break;
            default:
                throw new IllegalArgumentException("Unknown operator: " + op);
        }
    }

    public static void main(String[] args) {
        Calculator calc = new Calculator();
        Scanner scanner = new Scanner(System.in);

        System.out.println("Simple Calculator - Enter expressions (type 'quit' to exit):");

        while (true) {
            System.out.print("> ");
            String input = scanner.nextLine().trim();

            if ("quit".equalsIgnoreCase(input)) {
                break;
            }

            try {
                double result = calc.evaluate(input);
                System.out.println("Result: " + result);
            } catch (Exception e) {
                System.err.println("Error: " + e.getMessage());
            }
        }

        scanner.close();
        System.out.println("Calculator closed.");
    }
}
`,
};

/**
 * Test scenarios for language detection
 */
const TEST_SCENARIOS = [
  // Extension-based detection
  { file: 'app.js', content: undefined, expected: 'javascript' },
  { file: 'component.tsx', content: undefined, expected: 'typescript' },
  { file: 'script.py', content: undefined, expected: 'python' },
  { file: 'widget.dart', content: undefined, expected: 'dart' },
  { file: 'Main.java', content: undefined, expected: 'java' },

  // Shebang detection
  { file: 'script', content: '#!/usr/bin/env python3\nprint("hello")', expected: 'python' },
  { file: 'runner', content: '#!/usr/bin/env node\nconsole.log("hello")', expected: 'javascript' },

  // Content-based detection
  { file: 'unknown_python', content: CODE_SAMPLES.python, expected: 'python' },
  { file: 'unknown_js', content: CODE_SAMPLES.javascript, expected: 'javascript' },
  { file: 'unknown_ts', content: CODE_SAMPLES.typescript, expected: 'typescript' },
  { file: 'unknown_dart', content: CODE_SAMPLES.dart, expected: 'dart' },
  { file: 'unknown_java', content: CODE_SAMPLES.java, expected: 'java' },
];

/**
 * Demonstrates language detection capabilities
 */
async function demonstrateLanguageDetection() {
  console.log('🔍 Language Detection Demo');
  console.log('=========================');

  const detector = new LanguageDetector();

  // Show supported extensions
  console.log('\n📁 Supported File Extensions:');
  const extensions = detector.getSupportedExtensions();
  const groupedExtensions = {
    'JavaScript/TypeScript': extensions.filter(ext => ext.match(/\.(js|jsx|ts|tsx|mjs|cjs|mts|cts)$/)),
    'Python': extensions.filter(ext => ext.match(/\.py[wi]?$/)),
    'Dart': extensions.filter(ext => ext.match(/\.dart$/)),
    'Java/JVM': extensions.filter(ext => ext.match(/\.(java|kt|kts|scala)$/)),
    'System Languages': extensions.filter(ext => ext.match(/\.(c|cpp|cxx|cc|h|hpp|rs|go)$/)),
    'Other Languages': extensions.filter(ext => ext.match(/\.(rb|php|swift|cs)$/)),
    'Web/Data': extensions.filter(ext => ext.match(/\.(html|htm|css|scss|sass|less|json|yaml|yml|md|markdown)$/)),
  };

  Object.entries(groupedExtensions).forEach(([category, exts]) => {
    if (exts.length > 0) {
      console.log(`  ${category}: ${exts.join(', ')}`);
    }
  });

  // Show deep analysis support
  console.log('\n🔬 Languages with Deep Analysis Support:');
  const deepAnalysisLanguages = extensions
    .map(ext => detector.detectByExtension(`test${ext}`))
    .filter((lang, index, self) => lang && detector.supportsDeepAnalysis(lang) && self.indexOf(lang) === index);

  deepAnalysisLanguages.forEach(lang => {
    console.log(`  ✅ ${lang}`);
  });

  // Test detection scenarios
  console.log('\n🧪 Testing Detection Scenarios:');
  console.log('================================');

  for (const scenario of TEST_SCENARIOS) {
    try {
      const detected = await detector.detectLanguage(scenario.file, scenario.content);
      const status = detected === scenario.expected ? '✅' : '❌';
      const method = scenario.content === undefined ? 'extension'
                   : scenario.file.includes('script') || scenario.file.includes('runner') ? 'shebang'
                   : 'content';

      console.log(`${status} ${scenario.file} → ${detected} (${method})`);

      if (detected !== scenario.expected) {
        console.log(`   Expected: ${scenario.expected}, Got: ${detected}`);
      }
    } catch (error) {
      console.log(`❌ ${scenario.file} → Error: ${error}`);
    }
  }

  // Analyze current repository if it's a git repo
  console.log('\n📊 Analyzing Current Repository:');
  console.log('================================');

  try {
    const gitProcessor = new GitProcessor('.');
    const isRepo = await gitProcessor.isGitRepository();

    if (isRepo) {
      const files = await gitProcessor.getTrackedFiles();
      console.log(`Found ${files.length} tracked files`);

      const languageStats: Record<string, number> = {};
      const extensionStats: Record<string, number> = {};
      let deepAnalysisCount = 0;

      // Analyze a sample of files (limit to first 50 for demo)
      const sampleFiles = files.slice(0, 50);

      for (const file of sampleFiles) {
        const language = await detector.detectLanguage(file);
        const extension = file.split('.').pop() || 'no-ext';

        languageStats[language] = (languageStats[language] || 0) + 1;
        extensionStats[extension] = (extensionStats[extension] || 0) + 1;

        if (detector.supportsDeepAnalysis(language)) {
          deepAnalysisCount++;
        }
      }

      console.log('\n📈 Language Distribution:');
      Object.entries(languageStats)
        .sort(([,a], [,b]) => b - a)
        .forEach(([lang, count]) => {
          const percentage = ((count / sampleFiles.length) * 100).toFixed(1);
          const deepSupport = detector.supportsDeepAnalysis(lang as any) ? ' 🔬' : '';
          console.log(`  ${lang}: ${count} files (${percentage}%)${deepSupport}`);
        });

      console.log('\n📋 Extension Distribution:');
      Object.entries(extensionStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10) // Top 10
        .forEach(([ext, count]) => {
          const percentage = ((count / sampleFiles.length) * 100).toFixed(1);
          console.log(`  .${ext}: ${count} files (${percentage}%)`);
        });

      console.log(`\n🔬 Files supporting deep analysis: ${deepAnalysisCount}/${sampleFiles.length} (${((deepAnalysisCount/sampleFiles.length)*100).toFixed(1)}%)`);

    } else {
      console.log('Current directory is not a git repository');
    }

  } catch (error) {
    console.log(`Error analyzing repository: ${error}`);
  }

  console.log('\n✨ Language Detection Demo Complete!');
}

// Run the demo
demonstrateLanguageDetection();
