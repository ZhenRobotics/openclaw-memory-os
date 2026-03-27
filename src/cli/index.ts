#!/usr/bin/env node

/**
 * Memory-OS CLI
 *
 * 命令行工具入口
 */

import { Command } from 'commander';
import { MemoryOS } from '../core/memory-os';
import { MemoryType } from '../core/types';

const program = new Command();

program
  .name('openclaw-memory-os')
  .description('数字永生服务 | 认知延续基础设施 - 对话记忆自动提取')
  .version('0.2.1');

// ============================================================================
// Init Command
// ============================================================================

program
  .command('init')
  .description('初始化 Memory-OS')
  .option('-p, --path <path>', '存储路径', '~/.memory-os')
  .action(async (options) => {
    console.log('Initializing Memory-OS...');
    console.log(`Storage path: ${options.path}`);

    // TODO: Create config file and directories
    console.log('✓ Memory-OS initialized successfully');
  });

// ============================================================================
// Config Commands
// ============================================================================

const config = program
  .command('config')
  .description('管理配置');

config
  .command('list')
  .description('列出所有配置')
  .action(() => {
    console.log('Current configuration:');
    // TODO: Load and display config
  });

config
  .command('set <key> <value>')
  .description('设置配置项')
  .action((key, value) => {
    console.log(`Setting ${key} = ${value}`);
    // TODO: Update config
  });

config
  .command('get <key>')
  .description('获取配置项')
  .action((key) => {
    console.log(`Getting ${key}`);
    // TODO: Get config value
  });

// ============================================================================
// Collect Commands
// ============================================================================

program
  .command('collect')
  .description('采集记忆')
  .option('-s, --source <path>', '源路径')
  .option('-r, --recursive', '递归扫描子目录', true)
  .option('--exclude <patterns...>', '排除模式')
  .action(async (options) => {
    if (!options.source) {
      console.error('❌ 错误: 必须指定 --source 参数');
      console.log('用法: openclaw-memory-os collect --source <path>');
      process.exit(1);
    }

    console.log('🚀 开始采集记忆...\n');

    const memory = new MemoryOS({ storePath: '~/.memory-os' });
    await memory.init();

    try {
      const { FileCollector } = await import('../collectors/file-collector');
      const collector = new FileCollector();

      // Collect files
      const result = await collector.collect(options.source, {
        recursive: options.recursive,
        exclude: options.exclude,
      });

      console.log('\n💾 开始导入到 Memory-OS...\n');

      let imported = 0;
      let failed = 0;

      for (let i = 0; i < result.memories.length; i++) {
        const mem = result.memories[i];
        try {
          await memory.collect({
            type: mem.type,
            content: mem.content,
            metadata: mem.metadata,
          });
          imported++;

          // Progress display
          const percent = ((i + 1) / result.memories.length * 100).toFixed(1);
          const fileName = mem.metadata?.filename || 'unknown';
          process.stdout.write(`\r  导入进度: ${i + 1}/${result.memories.length} (${percent}%) - ${fileName}`.padEnd(80));
        } catch (error) {
          failed++;
          console.error(`\n  ❌ 导入失败: ${mem.metadata?.filename}`);
        }
      }

      console.log('\n\n✅ 采集完成！');
      console.log(`   成功导入: ${imported}`);
      console.log(`   导入失败: ${failed}`);
      console.log(`   总计文件: ${result.collected}`);
    } catch (error) {
      console.error('❌ 采集失败:', (error as Error).message);
      process.exit(1);
    } finally {
      await memory.close();
    }
  });

// ============================================================================
// Remember Command (Conversation Memory)
// ============================================================================

program
  .command('remember <text>')
  .description('从对话中记住信息')
  .alias('rm')
  .action(async (text: string) => {
    console.log('💭 分析对话内容...\n');

    const memory = new MemoryOS({ storePath: '~/.memory-os' });
    await memory.init();

    try {
      const { MemoryExtractor } = await import('../conversation/memory-extractor');
      const extractor = new MemoryExtractor();

      // Extract memory from conversation
      const result = extractor.extract(text);

      if (!result.shouldRemember) {
        console.log('⚠️  未检测到记忆触发词');
        console.log('提示: 使用 "记住..." 或 "remember..." 来触发记忆存储');
        process.exit(0);
      }

      // Store the memory
      await memory.collect({
        type: result.memoryType,
        content: result.content,
        metadata: {
          source: 'conversation',
          trigger: result.metadata.trigger,
          language: result.metadata.language,
          confidence: result.metadata.confidence,
          entities: result.extractedEntities,
          tags: ['conversation', 'auto-extracted'],
        },
      });

      // Display confirmation
      console.log('✅ 记忆已保存！\n');
      console.log(extractor.formatConfirmation(result));
      console.log(`\n置信度: ${(result.metadata.confidence * 100).toFixed(0)}%`);
      console.log(`语言: ${result.metadata.language === 'zh' ? '中文' : 'English'}`);
      console.log(`类型: ${result.memoryType}`);
    } catch (error) {
      console.error('❌ 记忆存储失败:', (error as Error).message);
      process.exit(1);
    } finally {
      await memory.close();
    }
  });

// ============================================================================
// Search Commands
// ============================================================================

program
  .command('search <query>')
  .description('搜索记忆')
  .option('-t, --type <type>', '记忆类型')
  .option('-l, --limit <number>', '结果数量', '10')
  .option('--semantic', '语义搜索', false)
  .option('--filter <filter>', '过滤条件')
  .action(async (query, options) => {
    console.log(`Searching for: ${query}`);

    const memory = new MemoryOS({ storePath: '~/.memory-os' });
    await memory.init();

    const results = await memory.search({
      query,
      type: options.type as MemoryType,
      limit: parseInt(options.limit),
      semantic: options.semantic,
    });

    console.log(`\nFound ${results.length} results:\n`);

    results.forEach((result, index) => {
      console.log(`${index + 1}. [${result.memory.type}] ${result.memory.metadata.source}`);
      console.log(`   Score: ${result.score.toFixed(2)}`);
      console.log(`   Date: ${result.memory.metadata.timestamp}`);
      console.log(`   Content: ${JSON.stringify(result.memory.content).substring(0, 100)}...`);
      console.log('');
    });

    await memory.close();
  });

// ============================================================================
// Timeline Commands
// ============================================================================

program
  .command('timeline')
  .description('查看时间线')
  .option('-d, --date <date>', '指定日期')
  .option('-r, --range <range>', '时间范围 (e.g., "last 7 days")')
  .option('-t, --type <type>', '记忆类型')
  .action(async (options) => {
    console.log('Loading timeline...');

    const memory = new MemoryOS({});
    await memory.init();

    const result = await memory.timeline({
      date: options.date ? new Date(options.date) : new Date(),
      range: options.range || 'day',
      type: options.type as MemoryType,
    });

    console.log(`\nTimeline for ${result.date.toDateString()}:\n`);
    console.log(`Total memories: ${result.stats.total}`);
    console.log('\nBy type:');
    Object.entries(result.stats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('\nMemories:');
    result.memories.forEach((mem, index) => {
      console.log(`${index + 1}. [${mem.type}] ${mem.metadata.timestamp.toLocaleTimeString()}`);
      console.log(`   ${JSON.stringify(mem.content).substring(0, 80)}...`);
    });

    await memory.close();
  });

// ============================================================================
// Graph Commands
// ============================================================================

const graph = program
  .command('graph')
  .description('知识图谱操作');

graph
  .command('explore')
  .description('探索知识图谱')
  .option('-t, --topic <topic>', '主题')
  .option('-d, --depth <depth>', '深度', '2')
  .action((options) => {
    console.log('Exploring knowledge graph...');
    // TODO: Implement graph exploration
  });

graph
  .command('export')
  .description('导出知识图谱')
  .option('-o, --output <file>', '输出文件')
  .action((options) => {
    console.log('Exporting graph...');
    // TODO: Export graph
  });

graph
  .command('stats')
  .description('图谱统计')
  .action(() => {
    console.log('Graph statistics:');
    // TODO: Show graph stats
  });

// ============================================================================
// Chat Command
// ============================================================================

program
  .command('chat [question]')
  .description('与记忆对话')
  .action(async (question) => {
    if (question) {
      console.log(`Q: ${question}`);
      console.log('A: [Memory-OS chat feature coming soon]');
    } else {
      console.log('Starting interactive chat mode...');
      console.log('Type "exit" to quit\n');
      // TODO: Implement interactive chat
    }
  });

// ============================================================================
// Maintenance Commands
// ============================================================================

program
  .command('status')
  .description('查看状态')
  .action(async () => {
    const memory = new MemoryOS({ storePath: '~/.memory-os' });
    await memory.init();

    const stats = await memory.stats();

    console.log('Memory-OS Status:\n');
    console.log(`Total memories: ${stats.totalMemories}`);
    if (stats.diskUsage !== undefined) {
      console.log(`Disk usage: ${(stats.diskUsage / 1024 / 1024).toFixed(2)} MB`);
    }
    if (stats.lastUpdate) {
      console.log(`Last update: ${stats.lastUpdate.toLocaleString()}`);
    }
    console.log('\nBy type:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    await memory.close();
  });

program
  .command('rebuild')
  .description('重建索引')
  .action(async () => {
    const memory = new MemoryOS({});
    await memory.init();
    await memory.rebuild();
    await memory.close();
    console.log('✓ Rebuild complete');
  });

program
  .command('optimize')
  .description('优化存储')
  .action(async () => {
    const memory = new MemoryOS({});
    await memory.init();
    await memory.optimize();
    await memory.close();
    console.log('✓ Optimization complete');
  });

program
  .command('export <path>')
  .description('导出数据')
  .action(async (path) => {
    const memory = new MemoryOS({});
    await memory.init();
    await memory.export(path);
    await memory.close();
    console.log('✓ Export complete');
  });

program
  .command('import <path>')
  .description('导入数据')
  .action(async (path) => {
    const memory = new MemoryOS({});
    await memory.init();
    await memory.import(path);
    await memory.close();
    console.log('✓ Import complete');
  });

// ============================================================================
// Parse and Execute
// ============================================================================

program.parse();
