/**
 * Results Aggregation Demo
 *
 * This example demonstrates the results aggregation system and shows
 * how individual file analyses are combined into the final output format.
 */

import { analyzeRepository } from '../src/index.js';
import { ResultsAggregator } from '../src/core/results-aggregator.js';

async function runAggregationDemo() {
  console.log('🔧 Results Aggregation Demo');
  console.log('================================\n');

  try {
    // Run complete analysis
    console.log('📊 Running complete repository analysis...');
    const startTime = Date.now();

    const results = await analyzeRepository('.', {
      limit: 20,
      extensions: ['.js', '.ts', '.jsx', '.tsx', '.py'],
      on_progress: (completed, total, current) => {
        if (completed % 5 === 0 || completed === total) {
          console.log(`   Progress: ${completed}/${total} ${current ? `- ${current}` : ''}`);
        }
      }
    });

    const analysisTime = Date.now() - startTime;
    console.log(`✅ Analysis completed in ${analysisTime}ms\n`);

    // Display aggregation statistics
    console.log('📈 Aggregation Results:');
    console.log('========================');

    console.log(`📁 Folder Structure: ${Object.keys(results.folder_structure).length} folders`);
    Object.entries(results.folder_structure).forEach(([folder, files]) => {
      console.log(`   ${folder}: ${files.length} files`);
    });

    console.log(`\n📊 Summary Statistics:`);
    console.log(`   Total Files: ${results.summary.total_files}`);
    console.log(`   Total Lines: ${results.summary.total_lines.toLocaleString()}`);
    console.log(`   Languages: ${Object.keys(results.summary.languages).length}`);
    Object.entries(results.summary.languages).forEach(([lang, count]) => {
      console.log(`     ${lang}: ${count} files`);
    });

    if (results.summary.frameworks) {
      console.log(`   Frameworks Detected: ${Object.keys(results.summary.frameworks).length}`);
      Object.entries(results.summary.frameworks).forEach(([framework, confidence]) => {
        console.log(`     ${framework}: ${(confidence * 100).toFixed(1)}% confidence`);
      });
    }

    console.log(`\n🔗 Dependency Graph:`);
    const depCount = Object.keys(results.dependencies).length;
    const totalDeps = Object.values(results.dependencies).reduce((sum, deps) => sum + deps.length, 0);
    console.log(`   Files with dependencies: ${depCount}`);
    console.log(`   Total dependencies: ${totalDeps}`);

    // Show sample dependencies
    const sampleDeps = Object.entries(results.dependencies).slice(0, 3);
    sampleDeps.forEach(([file, deps]) => {
      console.log(`     ${file}:`);
      deps.slice(0, 3).forEach(dep => {
        const isInternal = results.dependencies[dep] ? '(internal)' : '(external)';
        console.log(`       → ${dep} ${isInternal}`);
      });
      if (deps.length > 3) {
        console.log(`       ... and ${deps.length - 3} more`);
      }
    });

    // Check for circular dependencies if aggregator was used
    console.log(`\n🔄 Circular Dependencies:`);
    const aggregator = new ResultsAggregator({ repositoryPath: '.' });
    const circularDeps = aggregator.detectCircularDependencies(results.dependencies);

    if (circularDeps.length > 0) {
      console.log(`   Found ${circularDeps.length} circular dependencies:`);
      circularDeps.forEach((cycle, index) => {
        console.log(`     ${index + 1}. ${cycle.chain.join(' → ')}`);
      });
    } else {
      console.log(`   No circular dependencies detected ✅`);
    }

    // Display metadata
    console.log(`\n⚙️  Analysis Metadata:`);
    console.log(`   Timestamp: ${results.metadata?.timestamp}`);
    console.log(`   Duration: ${results.metadata?.duration_ms}ms`);
    console.log(`   Engine Version: ${results.metadata?.engine_version}`);
    console.log(`   Repository: ${results.metadata?.repository_path}`);

    // Show aggregation statistics
    console.log(`\n📋 Detailed Statistics:`);
    const stats = aggregator.getAggregationStats(results);
    console.log(JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
runAggregationDemo().catch(console.error);
