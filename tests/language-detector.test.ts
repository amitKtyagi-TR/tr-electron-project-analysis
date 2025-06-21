/**
 * Unit tests for LanguageDetector
 *
 * These tests validate language detection capabilities including
 * extension-based detection, shebang parsing, and content analysis.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LanguageDetector } from '../src/core/language-detector.js';
import type { SupportedLanguage } from '../src/types/index.js';

describe('LanguageDetector', () => {
  let detector: LanguageDetector;

  beforeEach(() => {
    detector = new LanguageDetector();
  });

  describe('extension-based detection', () => {
    it('should detect JavaScript files', () => {
      expect(detector.detectByExtension('app.js')).toBe('javascript');
      expect(detector.detectByExtension('component.jsx')).toBe('javascript');
      expect(detector.detectByExtension('module.mjs')).toBe('javascript');
      expect(detector.detectByExtension('legacy.cjs')).toBe('javascript');
    });

    it('should detect TypeScript files', () => {
      expect(detector.detectByExtension('app.ts')).toBe('typescript');
      expect(detector.detectByExtension('component.tsx')).toBe('typescript');
      expect(detector.detectByExtension('module.mts')).toBe('typescript');
      expect(detector.detectByExtension('config.cts')).toBe('typescript');
    });

    it('should detect Python files', () => {
      expect(detector.detectByExtension('script.py')).toBe('python');
      expect(detector.detectByExtension('gui.pyw')).toBe('python');
      expect(detector.detectByExtension('types.pyi')).toBe('python');
    });

    it('should detect Dart files', () => {
      expect(detector.detectByExtension('main.dart')).toBe('dart');
      expect(detector.detectByExtension('widget.dart')).toBe('dart');
    });

    it('should detect other supported languages', () => {
      expect(detector.detectByExtension('Main.java')).toBe('java');
      expect(detector.detectByExtension('main.cpp')).toBe('cpp');
      expect(detector.detectByExtension('app.c')).toBe('c');
      expect(detector.detectByExtension('Program.cs')).toBe('csharp');
      expect(detector.detectByExtension('script.rb')).toBe('ruby');
      expect(detector.detectByExtension('main.go')).toBe('go');
      expect(detector.detectByExtension('lib.rs')).toBe('rust');
      expect(detector.detectByExtension('index.php')).toBe('php');
      expect(detector.detectByExtension('ViewController.swift')).toBe('swift');
      expect(detector.detectByExtension('Main.kt')).toBe('kotlin');
      expect(detector.detectByExtension('App.scala')).toBe('scala');
    });

    it('should detect markup and data languages', () => {
      expect(detector.detectByExtension('index.html')).toBe('html');
      expect(detector.detectByExtension('styles.css')).toBe('css');
      expect(detector.detectByExtension('config.json')).toBe('json');
      expect(detector.detectByExtension('docker-compose.yaml')).toBe('yaml');
      expect(detector.detectByExtension('README.md')).toBe('markdown');
    });

    it('should handle case insensitive extensions', () => {
      expect(detector.detectByExtension('Script.PY')).toBe('python');
      expect(detector.detectByExtension('Component.JSX')).toBe('javascript');
      expect(detector.detectByExtension('Types.TS')).toBe('typescript');
    });

    it('should return null for unknown extensions', () => {
      expect(detector.detectByExtension('file.xyz')).toBeNull();
      expect(detector.detectByExtension('document.docx')).toBeNull();
      expect(detector.detectByExtension('archive.zip')).toBeNull();
    });

    it('should handle files without extensions', () => {
      expect(detector.detectByExtension('Makefile')).toBeNull();
      expect(detector.detectByExtension('README')).toBeNull();
      expect(detector.detectByExtension('dockerfile')).toBeNull();
    });

    it('should handle edge cases', () => {
      expect(detector.detectByExtension('')).toBeNull();
      expect(detector.detectByExtension('.')).toBeNull();
      expect(detector.detectByExtension('.hidden')).toBeNull();
    });
  });

  describe('shebang-based detection', () => {
    it('should detect Node.js scripts', () => {
      const nodeScript = '#!/usr/bin/env node\nconsole.log("hello");';
      expect(detector.detectByShebang(nodeScript)).toBe('javascript');

      const nodeScript2 = '#!/usr/local/bin/node\nprocess.exit(0);';
      expect(detector.detectByShebang(nodeScript2)).toBe('javascript');
    });

    it('should detect Python scripts', () => {
      const pythonScript = '#!/usr/bin/env python3\nprint("hello")';
      expect(detector.detectByShebang(pythonScript)).toBe('python');

      const pythonScript2 = '#!/usr/bin/python\nimport sys';
      expect(detector.detectByShebang(pythonScript2)).toBe('python');

      const pythonScript3 = '#!/usr/bin/env python3.9\nprint("version specific")';
      expect(detector.detectByShebang(pythonScript3)).toBe('python');
    });

    it('should detect Ruby scripts', () => {
      const rubyScript = '#!/usr/bin/env ruby\nputs "hello"';
      expect(detector.detectByShebang(rubyScript)).toBe('ruby');
    });

    it('should detect PHP scripts', () => {
      const phpScript = '#!/usr/bin/env php\n<?php echo "hello"; ?>';
      expect(detector.detectByShebang(phpScript)).toBe('php');
    });

    it('should detect Dart scripts', () => {
      const dartScript = '#!/usr/bin/env dart\nvoid main() { print("hello"); }';
      expect(detector.detectByShebang(dartScript)).toBe('dart');
    });

    it('should return null for non-shebang content', () => {
      expect(detector.detectByShebang('console.log("no shebang");')).toBeNull();
      expect(detector.detectByShebang('# This is a comment\nprint("hello")')).toBeNull();
      expect(detector.detectByShebang('')).toBeNull();
    });

    it('should return null for unrecognized shebangs', () => {
      expect(detector.detectByShebang('#!/bin/bash\necho "shell script"')).toBeNull();
      expect(detector.detectByShebang('#!/usr/bin/env unknown\ncode here')).toBeNull();
    });
  });

  describe('content-based detection', () => {
    it('should detect Python by import patterns', () => {
      const pythonCode = `
import os
import sys
from collections import defaultdict

def main():
    print("Hello Python")

if __name__ == "__main__":
    main()
      `;
      expect(detector.detectByContent(pythonCode)).toBe('python');
    });

    it('should detect Python by class and function patterns', () => {
      const pythonCode = `
class MyClass:
    def __init__(self):
        self.value = 42

    def get_value(self):
        return self.value

def standalone_function():
    return "test"
      `;
      expect(detector.detectByContent(pythonCode)).toBe('python');
    });

    it('should detect JavaScript by module patterns', () => {
      const jsCode = `
import React from 'react';
import { useState, useEffect } from 'react';

const MyComponent = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('Effect ran');
  }, []);

  return <div>{count}</div>;
};
      `;
      expect(detector.detectByContent(jsCode)).toBe('javascript');
    });

    it('should detect JavaScript by function patterns', () => {
      const jsCode = `
function calculateSum(a, b) {
  return a + b;
}

const multiply = (x, y) => {
  console.log('Multiplying', x, 'and', y);
  return x * y;
};

let result = multiply(5, 3);
      `;
      expect(detector.detectByContent(jsCode)).toBe('javascript');
    });

    it('should detect TypeScript by type annotations', () => {
      const tsCode = `
interface User {
  id: number;
  name: string;
  email?: string;
}

type Status = 'active' | 'inactive';

export class UserService {
  async getUser(id: number): Promise<User> {
    return fetch(\`/api/users/\${id}\`).then(res => res.json());
  }
}
      `;
      expect(detector.detectByContent(tsCode)).toBe('typescript');
    });

    it('should detect Java by package and class patterns', () => {
      const javaCode = `
package com.example.app;

import java.util.List;
import java.util.ArrayList;

public class HelloWorld {
    private String message;

    public HelloWorld(String message) {
        this.message = message;
    }

    public void printMessage() {
        System.out.println(this.message);
    }
}
      `;
      expect(detector.detectByContent(javaCode)).toBe('java');
    });

    it('should detect C++ by include patterns', () => {
      const cppCode = `
#include <iostream>
#include <vector>
#include "custom_header.h"

#define MAX_SIZE 100

int main() {
    std::vector<int> numbers;
    printf("Hello C++\\n");
    return 0;
}
      `;
      expect(detector.detectByContent(cppCode)).toBe('cpp');
    });

    it('should detect Dart by Flutter patterns', () => {
      const dartCode = `
import 'dart:core';
import 'package:flutter/material.dart';

class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      child: Text('Hello Flutter'),
    );
  }
}
      `;
      expect(detector.detectByContent(dartCode)).toBe('dart');
    });

    it('should detect Ruby by syntax patterns', () => {
      const rubyCode = `
require 'json'
require_relative './helper'

class Calculator
  def initialize
    @result = 0
  end

  def add(number)
    @result += number
    puts "Added #{number}, result: #{@result}"
  end
end

module MathUtils
  def self.square(n)
    n * n
  end
end
      `;
      expect(detector.detectByContent(rubyCode)).toBe('ruby');
    });

    it('should return null for ambiguous content', () => {
      const ambiguousCode = `
// This could be many languages
var x = 10;
var y = 20;
var result = x + y;
      `;
      expect(detector.detectByContent(ambiguousCode)).toBeNull();
    });

    it('should return null for minimal content', () => {
      expect(detector.detectByContent('')).toBeNull();
      expect(detector.detectByContent('// Just a comment')).toBeNull();
      expect(detector.detectByContent('x = 1')).toBeNull();
    });
  });

  describe('integrated detection', () => {
    it('should prioritize definitive extensions', async () => {
      const ambiguousContent = 'var x = 1;'; // Could be JS or other languages

      const result = await detector.detectLanguage('test.py', ambiguousContent);
      expect(result).toBe('python'); // Extension wins over weak content signals
    });

    it('should use shebang when extension is missing', async () => {
      const nodeScript = '#!/usr/bin/env node\nconsole.log("hello");';

      const result = await detector.detectLanguage('script', nodeScript);
      expect(result).toBe('javascript');
    });

    it('should use content analysis for extensionless files', async () => {
      const pythonCode = `
import os
def main():
    print("This is clearly Python")
if __name__ == "__main__":
    main()
      `;

      const result = await detector.detectLanguage('Makefile', pythonCode);
      expect(result).toBe('python');
    });

    it('should handle files without content', async () => {
      const result = await detector.detectLanguage('script.unknown');
      expect(result).toBe('unknown');
    });

    it('should prefer TypeScript over JavaScript for TypeScript content', async () => {
      const tsContent = `
interface Config {
  port: number;
  host: string;
}

export const config: Config = {
  port: 3000,
  host: 'localhost'
};
      `;

      // Even with .js extension, TypeScript content should be detected
      const result = await detector.detectLanguage('config.js', tsContent);
      expect(result).toBe('javascript'); // Extension is definitive for .js

      // But for unknown extension, content analysis should work
      const result2 = await detector.detectLanguage('config', tsContent);
      expect(result2).toBe('typescript');
    });
  });

  describe('utility methods', () => {
    it('should return supported extensions', () => {
      const extensions = detector.getSupportedExtensions();

      expect(extensions).toContain('.js');
      expect(extensions).toContain('.ts');
      expect(extensions).toContain('.py');
      expect(extensions).toContain('.dart');
      expect(extensions).toContain('.java');
      expect(extensions.length).toBeGreaterThan(20);
    });

    it('should identify languages with deep analysis support', () => {
      expect(detector.supportsDeepAnalysis('javascript')).toBe(true);
      expect(detector.supportsDeepAnalysis('typescript')).toBe(true);
      expect(detector.supportsDeepAnalysis('python')).toBe(true);
      expect(detector.supportsDeepAnalysis('dart')).toBe(true);

      expect(detector.supportsDeepAnalysis('java')).toBe(false);
      expect(detector.supportsDeepAnalysis('cpp')).toBe(false);
      expect(detector.supportsDeepAnalysis('html')).toBe(false);
      expect(detector.supportsDeepAnalysis('unknown')).toBe(false);
    });
  });
});
