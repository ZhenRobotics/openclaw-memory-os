# Memory-OS

数字永生服务 | 认知延续基础设施

## 概述

Memory-OS 是一个开源的个人记忆管理系统，旨在实现数字永生和认知延续。它能够采集、存储、检索和智能化处理你的所有数字记忆，构建个人知识图谱，并提供与数字化"自我"对话的能力。

## 核心特性

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
npm install -g memory-os

# 或从源码安装
git clone https://github.com/your-org/memory-os.git
cd memory-os
npm install
npm run build
npm link
```

### 初始化

```bash
# 初始化 Memory-OS
memory-os init

# 配置基本信息
memory-os config set owner.name "Your Name"
memory-os config set owner.email "your@email.com"
```

### 基础使用

```bash
# 采集记忆
memory-os collect --source ~/Documents
memory-os collect --source ~/Downloads
memory-os collect --chat ~/chat-history.json

# 搜索记忆
memory-os search "关于AI的讨论"
memory-os search --semantic "人工智能" --limit 10

# 时间线查询
memory-os timeline --date 2024-03-01
memory-os timeline --range "last 7 days"

# 与记忆对话
memory-os chat "我之前关于机器学习的想法是什么？"

# 可视化知识图谱
memory-os graph explore
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

## 使用场景

### 个人知识管理

```bash
# 导入所有笔记
memory-os collect --source ~/Documents/Notes

# 搜索特定主题
memory-os search --semantic "机器学习算法"

# 查看知识图谱
memory-os graph explore --topic "AI"
```

### 记忆回溯

```bash
# 查看某天的活动
memory-os timeline --date 2024-01-15

# 查看与某人的对话历史
memory-os search --type chat --filter "person:Alice"

# 时间段回顾
memory-os timeline --range "2024-01 to 2024-03"
```

### 与过去对话

```bash
# 启动对话模式
memory-os chat

> 我去年关于创业的想法是什么？
> 帮我总结一下过去三个月学到的技术
> 我和张三讨论过哪些项目？
```

### AI Agent 集成

```typescript
import { MemoryOS } from 'memory-os';

const memory = new MemoryOS({
  storePath: '~/.memory-os',
  embedding: 'openai',
});

// 记录对话
await memory.collect({
  type: 'chat',
  content: 'User asked about AI tools...',
  metadata: {
    source: 'agent-conversation',
    context: 'technical-discussion',
  },
});

// 检索相关记忆
const relevant = await memory.search({
  query: 'previous discussions about AI tools',
  limit: 5,
});

// 使用记忆增强 Agent 响应
const context = relevant.map(m => m.content).join('\n');
const response = await llm.generate({
  prompt: `Based on previous context:\n${context}\n\nRespond to: ${userQuery}`,
});
```

## CLI 命令

### 初始化和配置

```bash
memory-os init                          # 初始化
memory-os config list                   # 查看配置
memory-os config set <key> <value>     # 设置配置
memory-os status                        # 查看状态
```

### 采集记忆

```bash
memory-os collect --source <path>       # 从路径采集
memory-os collect --chat <file>         # 采集聊天记录
memory-os collect --code <repo>         # 采集代码仓库
memory-os collect --auto                # 自动采集
```

### 检索查询

```bash
memory-os search <query>                # 关键词搜索
memory-os search --semantic <query>     # 语义搜索
memory-os search --type <type>          # 按类型搜索
memory-os search --filter <filter>      # 过滤搜索
```

### 时间线

```bash
memory-os timeline                      # 查看时间线
memory-os timeline --date <date>        # 指定日期
memory-os timeline --range <range>      # 时间范围
```

### 图谱

```bash
memory-os graph explore                 # 探索图谱
memory-os graph export                  # 导出图谱
memory-os graph stats                   # 图谱统计
```

### 对话

```bash
memory-os chat                          # 启动对话
memory-os chat <question>               # 单次问答
```

### 维护

```bash
memory-os rebuild                       # 重建索引
memory-os optimize                      # 优化存储
memory-os export <path>                 # 导出数据
memory-os import <path>                 # 导入数据
```

## API 使用

### 基础使用

```typescript
import { MemoryOS, MemoryType } from 'memory-os';

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

// 图谱查询
const related = await memory.graph.findRelated({
  memoryId: 'memory-123',
  depth: 2,
});
```

### Agent 集成

```typescript
import { MemoryAgent } from 'memory-os/agents';

const agent = new MemoryAgent({
  memory: memory,
  llm: {
    provider: 'openai',
    model: 'gpt-4',
  },
});

// 智能对话
const response = await agent.chat('What did I learn about React last month?');

// 自动记录
await agent.observe({
  event: 'code-commit',
  data: { repo: 'my-project', message: 'Add new feature' },
});

// 洞察生成
const insights = await agent.generateInsights({
  topic: 'productivity',
  timeRange: 'last-month',
});
```

## 配置

Memory-OS 使用 `~/.memory-os/config.json` 存储配置：

```json
{
  "storage": {
    "path": "~/.memory-os/data",
    "backend": "local"
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
  },
  "collectors": {
    "auto": true,
    "sources": [
      "~/Documents",
      "~/Downloads"
    ],
    "exclude": [
      "node_modules",
      ".git"
    ]
  },
  "privacy": {
    "encryption": false,
    "shareStats": false
  }
}
```

## 开发

### 开发环境设置

```bash
git clone https://github.com/your-org/memory-os.git
cd memory-os
npm install
npm run dev
```

### 项目结构

```
memory-os/
├── src/
│   ├── core/           # 核心引擎
│   ├── collectors/     # 采集器
│   ├── processors/     # 处理器
│   ├── storage/        # 存储层
│   ├── query/          # 查询引擎
│   ├── agents/         # Agent系统
│   └── cli/            # CLI工具
├── docs/               # 文档
├── tests/              # 测试
└── examples/           # 示例
```

### 添加自定义采集器

```typescript
import { Collector, Memory } from 'memory-os';

export class CustomCollector extends Collector {
  async collect(source: string): Promise<Memory[]> {
    // 实现采集逻辑
    const memories: Memory[] = [];

    // ... 采集数据

    return memories;
  }
}

// 注册采集器
memory.registerCollector('custom', new CustomCollector());
```

### 运行测试

```bash
npm test
npm run test:watch
npm run test:coverage
```

## 路线图

### v0.1.0 - MVP (当前)

- [x] 架构设计
- [ ] 基础存储（本地文件）
- [ ] 文本采集器
- [ ] 关键词搜索
- [ ] CLI基础命令

### v0.2.0 - 智能化

- [ ] 向量化存储
- [ ] 语义检索
- [ ] LLM集成
- [ ] Memory Agent

### v0.3.0 - 图谱化

- [ ] 知识图谱
- [ ] 关系发现
- [ ] 图遍历查询
- [ ] Web可视化

### v1.0.0 - 完整版

- [ ] 多模态支持
- [ ] 云端同步
- [ ] 移动端
- [ ] 完整API

## 文档

- [架构设计](./ARCHITECTURE.md)
- [核心API](./docs/CORE_API.md)
- [采集器开发](./docs/COLLECTORS.md)
- [存储系统](./docs/STORAGE.md)
- [Agent开发](./docs/AGENT_DEV.md)
- [常见问题](./docs/FAQ.md)

## 社区

- GitHub: https://github.com/your-org/memory-os
- Discord: https://discord.gg/memory-os
- Twitter: @memory_os

## 贡献

欢迎贡献代码、文档、想法！请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

MIT License

---

**Memory-OS - 让记忆永存，让认知延续**
