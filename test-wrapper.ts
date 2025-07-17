import { analyzeRepositoryToText } from './src/index.js';

async function testWrapper() {
  console.log('🧪 Testing analyzeRepositoryToText...');

  try {
    // Test on current project
    const result = await analyzeRepositoryToText('.', {
      limit: 5, // Just test with 5 files
      on_progress: (completed, total, current) => {
        console.log(`Progress: ${completed}/${total} - ${current}`);
      }
    });

    console.log('\n✅ Result:');
    console.log(result.substring(0, 500) + '...\n'); // Show first 500 chars
    console.log(`📊 Total length: ${result.length} characters`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWrapper();
