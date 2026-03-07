/**
 * Memory-OS Basic Usage Example
 *
 * 基础使用示例
 */

import { MemoryOS, MemoryType } from '../src/index';

async function main() {
  console.log('=== Memory-OS Basic Usage Example ===\n');

  // 1. Initialize Memory-OS
  console.log('1. Initializing Memory-OS...');
  const memory = new MemoryOS({
    storage: {
      path: './.memory-os-example',
      backend: 'local' as any,
    },
  });

  await memory.init();
  console.log('✓ Initialized\n');

  // 2. Collect some memories
  console.log('2. Collecting memories...');

  await memory.collect({
    type: MemoryType.TEXT,
    content: 'Today I learned about Memory-OS, a digital immortality service.',
    metadata: {
      tags: ['learning', 'memory-os'],
      context: 'Getting started',
    },
  });

  await memory.collect({
    type: MemoryType.TEXT,
    content: 'Memory-OS provides AI-powered semantic search for personal memories.',
    metadata: {
      tags: ['memory-os', 'features'],
      context: 'Feature exploration',
    },
  });

  await memory.collect({
    type: MemoryType.TEXT,
    content: 'I prefer using TypeScript for all my projects because of type safety.',
    metadata: {
      tags: ['preference', 'development', 'typescript'],
      context: 'Personal preferences',
    },
  });

  console.log('✓ Collected 3 memories\n');

  // 3. Search memories
  console.log('3. Searching for "Memory-OS"...');

  const results = await memory.search({
    query: 'Memory-OS',
    limit: 10,
  });

  console.log(`Found ${results.length} results:`);
  results.forEach((result, i) => {
    console.log(`  ${i + 1}. ${result.memory.content.substring(0, 60)}...`);
  });
  console.log('');

  // 4. Get statistics
  console.log('4. Getting statistics...');

  const stats = await memory.stats();
  console.log(`Total memories: ${stats.totalMemories}`);
  console.log(`By type:`, stats.byType);
  console.log('');

  // 5. Timeline query
  console.log('5. Querying timeline...');

  const timeline = await memory.timeline({
    date: new Date(),
    range: 'day',
  });

  console.log(`Memories today: ${timeline.stats.total}`);
  console.log('');

  // 6. Close
  console.log('6. Closing Memory-OS...');
  await memory.close();
  console.log('✓ Closed\n');

  console.log('=== Example Complete ===');
}

// Run example
main().catch(console.error);
