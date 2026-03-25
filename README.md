# Memory-OS

数字永生服务 | 认知延续基础设施

**Current Version:** 0.2.0-phase1 (Conversation Recording Foundation)

## 概述

Memory-OS 是一个开源的个人记忆管理系统，旨在实现数字永生和认知延续。它能够采集、存储、检索和智能化处理你的所有数字记忆，构建个人知识图谱，并提供与数字化"自我"对话的能力。

## 核心特性

### Phase 1 (v0.2.0) - Conversation Recording Foundation

**新增功能 - 对话录制基础设施**:

- **Conversation Storage** - 高性能存储系统
  - LRU缓存（100个会话，1000条消息）
  - 双索引系统（按月索引会话，按天索引消息）
  - 异步写入，< 10ms性能目标
  - 日期分区存储，支持扩展
  - 完整搜索能力（会话、消息、日期范围）
  - 缓存命中率 > 80%，实测 85-90%

- **Session Management** - 智能会话生命周期管理
  - 自动会话创建和跟踪
  - 30分钟不活动超时（可配置）
  - 基于活动的超时刷新
  - 会话归档和元数据管理
  - 参与者管理（用户、助手、系统）
  - 可选的AI生成会话摘要

- **Privacy Filtering** - 内容保护引擎
  - 8个默认隐私规则（API密钥、邮箱、信用卡等）
  - 动态规则管理（添加/删除/列出）
  - 编辑和阻止能力
  - 全面的过滤统计信息
  - < 5ms每条消息的过滤性能

- **Type System** - 完整的TypeScript类型定义
  - ConversationMessage和ConversationSession接口
  - RecordingMode枚举（DISABLED/TRIGGER_ONLY/SMART/FULL）
  - 隐私规则系统
  - 性能指标的索引结构

- **Performance Tested** - 经过全面性能测试
  - 写入性能: < 10ms目标，实测 ~3ms ✅
  - 读取性能（缓存）: < 5ms目标，实测 ~1ms ✅
  - 缓存命中率: > 80%目标，实测 85-90% ✅
  - 22个性能测试场景，全部通过
  - 7个集成测试场景，验证完整流程

### Core Features (v0.1.x)

- **多源采集** - 从聊天、文档、代码、媒体等多种来源自动采集记忆
- **智能存储** - 向量化+图谱+时间轴三层存储架构
- **语义检索** - 基于AI的语义理解和智能检索
- **知识图谱** - 自动构建个人认知关系网络
- **时间旅行** - 完整的时间轴追溯能力
- **认知对话** - 与数字化的"自我"进行AI对话
- **隐私优先** - 本地存储，完全掌控自己的数据
- **可扩展** - 模块化设计，易于定制和扩展

## 快速开始

### 安装

```bash
# 通过 npm 安装
npm install -g openclaw-memory-os

# 或从源码安装
git clone https://github.com/ZhenRobotics/openclaw-memory-os.git
cd openclaw-memory-os
npm install
npm run build
npm link
```

### 初始化

```bash
# 初始化 Memory-OS
openclaw-memory-os init

# 配置基本信息
openclaw-memory-os config set owner.name "Your Name"
openclaw-memory-os config set owner.email "your@email.com"
```

### 基础使用（v0.1.x功能）

```bash
# 采集记忆
openclaw-memory-os collect --source ~/Documents
openclaw-memory-os collect --source ~/Downloads

# 对话式记忆
openclaw-memory-os remember "记住我的名字：张三"

# 搜索记忆
openclaw-memory-os search "关于AI的讨论"
openclaw-memory-os search --semantic "人工智能" --limit 10

# 时间线查询
openclaw-memory-os timeline --date 2024-03-01
openclaw-memory-os timeline --range "last 7 days"

# 查看状态
openclaw-memory-os status
```

### Conversation Recording (v0.2.0 Phase 1)

**通过API使用对话录制**:

```typescript
import {
  ConversationStorage,
  SessionManager,
  PrivacyFilter,
  RecordingMode
} from 'openclaw-memory-os';
import { randomUUID } from 'crypto';

// 1. 初始化存储
const storage = new ConversationStorage({
  path: '~/.memory-os',
  backend: 'local'
});
await storage.init();

// 2. 创建会话管理器
const sessionManager = new SessionManager(storage, {
  mode: RecordingMode.FULL,
  autoStart: true,
  sessionTimeout: 30, // 30分钟
  privacyRules: [],
  retention: {
    autoArchive: true,
    archiveAfterDays: 90
  }
});

// 3. 启动会话
const session = await sessionManager.startSession({
  source: 'openclaw',
  context: 'Daily work session'
});

// 4. 添加消息
await storage.saveMessage({
  id: randomUUID(),
  sessionId: session.id,
  timestamp: new Date(),
  role: 'user',
  content: '你好，世界！',
  metadata: { source: 'openclaw' }
});

await storage.saveMessage({
  id: randomUUID(),
  sessionId: session.id,
  timestamp: new Date(),
  role: 'assistant',
  content: '你好！很高兴见到你。',
  metadata: { source: 'openclaw', model: 'claude-sonnet-4' }
});

// 5. 检索对话历史
const messages = await storage.getSessionMessages(session.id);
console.log(`记录了 ${messages.length} 条消息`);

// 6. 搜索会话
const recentSessions = await storage.searchConversations({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  limit: 10
});

// 7. 结束会话
await sessionManager.endSession(session.id);

// 8. 获取统计信息
const stats = await storage.getStats();
console.log(`总会话数: ${stats.totalSessions}`);
console.log(`总消息数: ${stats.totalMessages}`);
console.log(`缓存命中率: ${(stats.cacheHitRate! * 100).toFixed(1)}%`);
```

**隐私过滤示例**:

```typescript
import { PrivacyFilter } from 'openclaw-memory-os';

const filter = new PrivacyFilter();

const message = {
  id: randomUUID(),
  sessionId: session.id,
  timestamp: new Date(),
  role: 'user' as const,
  content: '我的邮箱是 john@example.com，密码是 secret123',
  metadata: { source: 'openclaw' }
};

const filtered = await filter.filterMessage(message);
console.log(filtered.content);
// 输出: "我的邮箱是 [REDACTED]，[REDACTED]"

console.log(filtered.metadata.filtered); // true
```

## 核心概念

### 记忆单元 (Memory Unit)

Memory-OS 中的最小记忆单位，包含：

```typescript
interface Memory {
  id: string;              // 唯一标识
  type: MemoryType;        // 类型：text, code, chat, file, media
  content: any;            // 内容
  metadata: {
    source: string;        // 来源
    timestamp: Date;       // 时间戳
    tags: string[];        // 标签
    context: string;       // 上下文
  };
  embedding?: number[];    // 向量表示
  relations?: Relation[];  // 关联关系
}
```

### 对话会话 (Conversation Session) - v0.2.0

持续的对话会话，包含多条消息：

```typescript
interface ConversationSession {
  id: string;                             // 会话ID
  startTime: Date;                        // 开始时间
  endTime?: Date;                         // 结束时间
  messageCount: number;                   // 消息数量
  participants: ConversationParticipant[]; // 参与者
  metadata: ConversationMetadata;         // 元数据
  status: SessionStatus;                  // 状态
  tags: string[];                         // 标签
  summary?: string;                       // AI生成摘要
}
```

### 对话消息 (Conversation Message) - v0.2.0

会话中的单条消息：

```typescript
interface ConversationMessage {
  id: string;                    // 消息ID
  sessionId: string;             // 所属会话ID
  timestamp: Date;               // 时间戳
  role: 'user' | 'assistant' | 'system'; // 角色
  content: string;               // 内容
  metadata: MessageMetadata;     // 元数据
  tokens?: number;               // Token数量
  responseTime?: number;         // 响应时间
}
```

### 采集器 (Collector)

从不同数据源采集记忆：

- `FileCollector` - 文档、笔记
- `ChatCollector` - 聊天记录
- `CodeCollector` - 代码仓库
- `MediaCollector` - 图片、音视频
- `ActivityCollector` - 系统活动

### 处理器 (Processor)

对记忆进行智能处理：

- `Embedder` - 向量化
- `Extractor` - 信息提取
- `Linker` - 关系发现
- `Analyzer` - 情感分析、主题分析

### 存储层 (Storage)

多层存储架构：

- **向量存储** - 用于语义相似度搜索
- **图谱存储** - 用于关系查询
- **时序存储** - 用于时间轴查询
- **元数据存储** - 用于属性过滤
- **对话存储** (v0.2.0) - 用于会话和消息管理

## 架构

```
┌─────────────────────────────────────────────┐
│            Memory-OS Core                    │
├─────────────────────────────────────────────┤
│                                              │
│  Collectors → Processors → Storage           │
│                                              │
│  ↓           ↓            ↓                  │
│  多源采集    智能处理      多层存储           │
│                                              │
│  ↓                                           │
│                                              │
│  Query & Retrieval Engine                    │
│                                              │
│  ↓                                           │
│                                              │
│  Cognitive Interface                         │
│  (Memory Agent, Chat, Timeline, Graph)       │
│                                              │
└─────────────────────────────────────────────┘
```

详见 [ARCHITECTURE.md](./ARCHITECTURE.md)

## CLI 命令

### 初始化和配置

```bash
openclaw-memory-os init                          # 初始化
openclaw-memory-os config list                   # 查看配置
openclaw-memory-os config set <key> <value>     # 设置配置
openclaw-memory-os status                        # 查看状态
```

### 采集记忆

```bash
openclaw-memory-os collect --source <path>       # 从路径采集
openclaw-memory-os remember "记住重要信息"        # 对话式记忆
```

### 检索查询

```bash
openclaw-memory-os search <query>                # 关键词搜索
openclaw-memory-os search --semantic <query>     # 语义搜索
openclaw-memory-os search --type <type>          # 按类型搜索
openclaw-memory-os search --filter <filter>      # 过滤搜索
```

### 时间线

```bash
openclaw-memory-os timeline                      # 查看时间线
openclaw-memory-os timeline --date <date>        # 指定日期
openclaw-memory-os timeline --range <range>      # 时间范围
```

## API 使用

### 基础使用

```typescript
import { MemoryOS, MemoryType } from 'openclaw-memory-os';

// 初始化
const memory = new MemoryOS({
  storePath: '~/.memory-os',
  embedding: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  },
});

await memory.init();

// 采集记忆
await memory.collect({
  type: MemoryType.TEXT,
  content: 'This is a note about AI development',
  metadata: {
    source: 'manual-input',
    tags: ['ai', 'development'],
  },
});

// 搜索记忆
const results = await memory.search({
  query: 'AI development',
  type: MemoryType.TEXT,
  limit: 10,
});

// 时间线查询
const timeline = await memory.timeline({
  date: new Date('2024-03-01'),
  range: 'day',
});
```

### Conversation Recording API (v0.2.0)

参见上方"快速开始"部分的完整示例。

详细文档：
- [API Reference](./docs/API_REFERENCE_v0.2.0.md)
- [Usage Guide](./docs/CONVERSATION_RECORDING_GUIDE.md)

## 路线图

### v0.2.0 Phase 1 ✅ - Conversation Recording Foundation (COMPLETED)
- ✅ Storage system with LRU caching
- ✅ Session lifecycle management
- ✅ Privacy filtering engine
- ✅ Performance and integration testing
- ✅ Complete API documentation

### v0.2.0 Phase 2 🚧 - Stream Processing (IN PROGRESS)
- Real-time OpenClaw conversation capture
- OpenClaw stdio interception
- CLI integration (`openclaw-memory-os record`)
- Recording mode controls (SMART/FULL)

### v0.2.0 Phase 3 ⏳ - Auto-trigger (PLANNED)
- Intelligent recording triggers
- Smart vs. Full recording modes
- AI-generated session summaries
- Performance optimization

### v0.2.0 Phase 4 ⏳ - Polish (PLANNED)
- Web UI for conversation browsing
- Export/import capabilities
- Analytics and insights
- Comprehensive documentation

### v0.3.0 ⏳ - Knowledge Graph
- 知识图谱构建
- 关系发现
- 图遍历查询
- Web可视化

### v1.0.0 ⏳ - Production Ready
- 多模态支持
- 云端同步
- 移动端
- 完整API

## 文档

### v0.2.0 Documentation
- [API Reference](./docs/API_REFERENCE_v0.2.0.md) - Complete API documentation
- [Usage Guide](./docs/CONVERSATION_RECORDING_GUIDE.md) - Usage scenarios and best practices
- [Architecture Design](./FULL_CONVERSATION_RECORDING_ARCHITECTURE.md) - System architecture
- [Performance Report](./PERFORMANCE_BENCHMARK_REPORT.md) - Performance benchmarks
- [Integration Tests](./INTEGRATION_TEST_REPORT.md) - Test results and evidence

### General Documentation
- [架构设计](./ARCHITECTURE.md)
- [核心API](./docs/CORE_API.md)
- [采集器开发](./docs/COLLECTORS.md)
- [存储系统](./docs/STORAGE.md)
- [常见问题](./docs/FAQ.md)

## 配置

Memory-OS 使用 `~/.memory-os/config.json` 存储配置：

```json
{
  "storage": {
    "path": "~/.memory-os/data",
    "backend": "local"
  },
  "conversation": {
    "recording": {
      "mode": "disabled",
      "autoStart": false,
      "sessionTimeout": 30
    },
    "privacy": {
      "enabled": true,
      "defaultRules": true
    },
    "retention": {
      "autoArchive": true,
      "archiveAfterDays": 90
    }
  },
  "embedding": {
    "provider": "openai",
    "apiKey": "${OPENAI_API_KEY}",
    "model": "text-embedding-3-small"
  },
  "llm": {
    "provider": "openai",
    "apiKey": "${OPENAI_API_KEY}",
    "model": "gpt-4o"
  }
}
```

## 性能指标

### v0.2.0 Phase 1 Performance

| 操作 | 目标 | 实测 | 状态 |
|------|------|------|------|
| 单条消息写入 | < 10ms | ~3ms | ✅ |
| 批量消息写入（100条） | < 15ms/条 | ~8ms/条 | ✅ |
| 缓存命中读取 | < 5ms | ~1ms | ✅ |
| 缓存未命中读取 | < 20ms | ~12ms | ✅ |
| 会话历史检索（100条） | < 500ms | ~180ms | ✅ |
| 缓存命中率 | > 80% | 85-90% | ✅ |
| 隐私过滤 | < 5ms | ~2ms | ✅ |

**内存使用**: ~8-12MB（1000条消息）
**存储效率**: ~1KB/消息（JSON格式）

## 社区

- GitHub: https://github.com/ZhenRobotics/openclaw-memory-os
- npm: https://www.npmjs.com/package/openclaw-memory-os
- ClawHub: https://clawhub.ai/ZhenStaff/memory-os
- Issues: https://github.com/ZhenRobotics/openclaw-memory-os/issues

## 贡献

欢迎贡献代码、文档、想法！请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

MIT License

---

**Memory-OS - 让记忆永存，让认知延续**
