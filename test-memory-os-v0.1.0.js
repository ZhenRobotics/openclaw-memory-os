/**
 * Memory-OS v0.1.0 完整功能测试
 *
 * 测试范围：
 * 1. 初始化
 * 2. 记忆采集（多种类型）
 * 3. 持久化存储
 * 4. 搜索功能（关键词、标签）
 * 5. 数据检索
 * 6. 更新和删除
 * 7. 统计功能
 * 8. 跨会话持久化
 */

import('./dist/index.js').then(async ({ MemoryOS, MemoryType }) => {
  const TEST_PATH = '/tmp/memory-os-full-test';
  let testsPassed = 0;
  let testsFailed = 0;

  function log(emoji, message) {
    console.log(`${emoji} ${message}`);
  }

  function success(message) {
    testsPassed++;
    log('✅', message);
  }

  function fail(message, error) {
    testsFailed++;
    log('❌', message);
    if (error) console.error('   Error:', error.message);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('  Memory-OS v0.1.0 完整功能测试');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // ============================================================================
    // Test 1: 初始化
    // ============================================================================
    log('📦', '\n【测试 1】初始化 Memory-OS');
    console.log('─────────────────────────────────────────────────────');

    const memory = new MemoryOS({ storePath: TEST_PATH });
    await memory.init();
    success('Memory-OS 初始化成功');

    // ============================================================================
    // Test 2: 记忆采集 - 多种类型
    // ============================================================================
    log('💾', '\n【测试 2】记忆采集 - 不同类型');
    console.log('─────────────────────────────────────────────────────');

    // 2.1 文本记忆
    const textMemory = await memory.collect({
      type: MemoryType.TEXT,
      content: '我的选股规则：PE < 15, ROE > 15%, 营收增长 > 20%',
      metadata: {
        tags: ['investment', 'stock-rules'],
        source: 'user-input'
      }
    });
    success(`文本记忆采集成功 (ID: ${textMemory.id.substring(0, 8)}...)`);

    // 2.2 代码记忆
    const codeMemory = await memory.collect({
      type: MemoryType.CODE,
      content: 'function analyzeStock(pe, roe) { return pe < 15 && roe > 15; }',
      metadata: {
        tags: ['code', 'stock-analysis'],
        source: 'project',
        language: 'javascript'
      }
    });
    success(`代码记忆采集成功 (ID: ${codeMemory.id.substring(0, 8)}...)`);

    // 2.3 对话记忆
    const chatMemory = await memory.collect({
      type: MemoryType.CHAT,
      content: {
        user: 'User',
        message: '帮我分析茅台这只股票',
        timestamp: new Date()
      },
      metadata: {
        tags: ['conversation', 'stock-query'],
        source: 'chat-history'
      }
    });
    success(`对话记忆采集成功 (ID: ${chatMemory.id.substring(0, 8)}...)`);

    // 2.4 批量采集
    const batchResult = await memory.collectBatch([
      {
        type: MemoryType.TEXT,
        content: '笔记1：学习了 TypeScript 高级类型',
        metadata: { tags: ['learning', 'typescript'] }
      },
      {
        type: MemoryType.TEXT,
        content: '笔记2：React Server Components 实践',
        metadata: { tags: ['learning', 'react'] }
      }
    ]);
    success(`批量采集成功 (${batchResult.collected} 条记忆)`);

    // ============================================================================
    // Test 3: 持久化验证
    // ============================================================================
    log('💿', '\n【测试 3】持久化存储验证');
    console.log('─────────────────────────────────────────────────────');

    const fs = await import('fs/promises');
    const memoryFiles = await fs.readdir(`${TEST_PATH}/memories/`);
    if (memoryFiles.length >= 5) {
      success(`文件系统存储正常 (${memoryFiles.length} 个 JSON 文件)`);
    } else {
      fail(`文件数量不符合预期 (期望 >= 5, 实际 ${memoryFiles.length})`);
    }

    // 验证文件内容
    const sampleFile = memoryFiles[0];
    const fileContent = await fs.readFile(`${TEST_PATH}/memories/${sampleFile}`, 'utf-8');
    const parsedMemory = JSON.parse(fileContent);
    if (parsedMemory.id && parsedMemory.type && parsedMemory.content) {
      success('JSON 文件格式正确，包含必要字段');
    } else {
      fail('JSON 文件格式不完整');
    }

    // ============================================================================
    // Test 4: 数据检索
    // ============================================================================
    log('🔍', '\n【测试 4】数据检索功能');
    console.log('─────────────────────────────────────────────────────');

    // 4.1 按 ID 检索
    const retrieved = await memory.get(textMemory.id);
    if (retrieved && retrieved.content === textMemory.content) {
      success(`按 ID 检索成功 (${textMemory.id.substring(0, 8)}...)`);
    } else {
      fail('按 ID 检索失败');
    }

    // 4.2 批量检索
    const multipleMemories = await memory.getMany([textMemory.id, codeMemory.id]);
    if (multipleMemories.length === 2) {
      success(`批量检索成功 (获取 ${multipleMemories.length} 条记忆)`);
    } else {
      fail(`批量检索失败 (期望 2, 实际 ${multipleMemories.length})`);
    }

    // ============================================================================
    // Test 5: 搜索功能
    // ============================================================================
    log('🔎', '\n【测试 5】搜索功能');
    console.log('─────────────────────────────────────────────────────');

    // 5.1 关键词搜索
    const searchResults1 = await memory.search({ query: 'PE' });
    if (searchResults1.length >= 1) {
      success(`关键词搜索成功 (找到 ${searchResults1.length} 条包含 "PE" 的记忆)`);
    } else {
      fail('关键词搜索失败，未找到预期结果');
    }

    // 5.2 类型过滤
    const searchResults2 = await memory.search({
      query: 'stock',
      type: MemoryType.CODE
    });
    if (searchResults2.length >= 1) {
      success(`类型过滤搜索成功 (找到 ${searchResults2.length} 条 CODE 类型记忆)`);
    } else {
      fail('类型过滤搜索失败');
    }

    // 5.3 标签搜索
    const searchResults3 = await memory.search({
      tags: ['investment']
    });
    if (searchResults3.length >= 1) {
      success(`标签搜索成功 (找到 ${searchResults3.length} 条带 "investment" 标签的记忆)`);
    } else {
      fail('标签搜索失败');
    }

    // 5.4 复合搜索
    const searchResults4 = await memory.search({
      query: 'TypeScript',
      tags: ['learning']
    });
    if (searchResults4.length >= 1) {
      success(`复合搜索成功 (关键词 + 标签)`);
    } else {
      fail('复合搜索失败');
    }

    // 5.5 分页测试
    const searchResults5 = await memory.search({
      query: '',
      limit: 2,
      offset: 0
    });
    if (searchResults5.length <= 2) {
      success(`分页功能正常 (limit: 2, 返回: ${searchResults5.length})`);
    } else {
      fail('分页功能异常');
    }

    // ============================================================================
    // Test 6: 更新和删除
    // ============================================================================
    log('✏️', '\n【测试 6】更新和删除操作');
    console.log('─────────────────────────────────────────────────────');

    // 6.1 更新记忆
    const updatedMemory = await memory.update(textMemory.id, {
      content: '更新后的选股规则：PE < 12, ROE > 18%'
    });
    if (updatedMemory.content.includes('更新后')) {
      success('记忆更新成功');
    } else {
      fail('记忆更新失败');
    }

    // 6.2 验证更新持久化
    const verifyUpdate = await memory.get(textMemory.id);
    if (verifyUpdate && verifyUpdate.content.includes('更新后')) {
      success('更新已持久化到存储');
    } else {
      fail('更新未正确持久化');
    }

    // 6.3 删除记忆
    await memory.delete(chatMemory.id);
    const deletedCheck = await memory.get(chatMemory.id);
    if (!deletedCheck) {
      success('记忆删除成功');
    } else {
      fail('记忆删除失败，数据仍存在');
    }

    // ============================================================================
    // Test 7: 统计功能
    // ============================================================================
    log('📊', '\n【测试 7】统计功能');
    console.log('─────────────────────────────────────────────────────');

    const stats = await memory.stats();
    console.log(`   总记忆数: ${stats.totalMemories}`);
    console.log(`   按类型分布: ${JSON.stringify(stats.byType)}`);
    console.log(`   按来源分布: ${JSON.stringify(stats.bySource)}`);

    if (stats.totalMemories >= 4) {
      success(`统计功能正常 (总计 ${stats.totalMemories} 条记忆)`);
    } else {
      fail(`统计数量异常 (期望 >= 4, 实际 ${stats.totalMemories})`);
    }

    if (stats.byType[MemoryType.TEXT] >= 2) {
      success(`类型统计正确 (TEXT: ${stats.byType[MemoryType.TEXT]})`);
    } else {
      fail('类型统计不准确');
    }

    // ============================================================================
    // Test 8: 跨会话持久化
    // ============================================================================
    log('🔄', '\n【测试 8】跨会话持久化');
    console.log('─────────────────────────────────────────────────────');

    await memory.close();
    success('会话 1 关闭');

    // 创建新会话
    const memory2 = new MemoryOS({ storePath: TEST_PATH });
    await memory2.init();
    success('会话 2 启动');

    const stats2 = await memory2.stats();
    if (stats2.totalMemories === stats.totalMemories) {
      success(`数据持久化验证通过 (${stats2.totalMemories} 条记忆保持不变)`);
    } else {
      fail(`数据持久化失败 (会话1: ${stats.totalMemories}, 会话2: ${stats2.totalMemories})`);
    }

    // 验证之前的记忆仍可检索
    const persistedMemory = await memory2.get(textMemory.id);
    if (persistedMemory && persistedMemory.content.includes('更新后')) {
      success('跨会话检索成功，数据完整');
    } else {
      fail('跨会话检索失败或数据丢失');
    }

    await memory2.close();

    // ============================================================================
    // 测试总结
    // ============================================================================
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  测试总结');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ 通过: ${testsPassed}`);
    console.log(`❌ 失败: ${testsFailed}`);
    console.log(`📊 成功率: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════════════════\n');

    if (testsFailed === 0) {
      console.log('🎉 所有测试通过！Memory-OS v0.1.0 核心功能正常！');
    } else {
      console.log(`⚠️  有 ${testsFailed} 个测试失败，请检查日志。`);
    }

    // 清理测试数据
    console.log('\n清理测试数据...');
    const { exec } = await import('child_process');
    exec(`rm -rf ${TEST_PATH}`, (error) => {
      if (!error) {
        console.log('✓ 测试数据已清理\n');
      }
    });

  } catch (error) {
    console.error('\n❌ 测试执行失败:', error);
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ 模块加载失败:', error);
  process.exit(1);
});
