# Memory-OS 快速开始

5 分钟快速上手 Memory-OS，开始你的数字永生之旅。

## 安装

### 方式 1: 全局安装（推荐）

```bash
npm install -g memory-os
memory-os init
```

### 方式 2: 从源码

```bash
git clone https://github.com/your-org/memory-os.git
cd memory-os
npm install
npm run build
npm link

# 初始化
memory-os init
```

## 基础配置

```bash
# 配置基本信息
memory-os config set owner.name "Your Name"
memory-os config set owner.email "your@email.com"

# 查看配置
memory-os config list
```

## 第一步：采集记忆

### 从文件采集

```bash
# 采集文档目录
memory-os collect --source ~/Documents

# 采集特定文件
memory-os collect --source ~/notes.txt
```

### 手动添加记忆

```bash
# 使用 Node.js API
node -e "
const { MemoryOS, MemoryType } = require('memory-os');

(async () => {
  const memory = new MemoryOS({});
  await memory.init();

  await memory.collect({
    type: MemoryType.TEXT,
    content: 'This is my first memory in Memory-OS!',
    metadata: {
      tags: ['test', 'first'],
      context: 'Getting started with Memory-OS',
    },
  });

  console.log('Memory collected!');
  await memory.close();
})();
"
```

## 第二步：搜索记忆

### 关键词搜索

```bash
# 搜索包含特定关键词的记忆
memory-os search "machine learning"

# 限制结果数量
memory-os search "AI" --limit 5

# 按类型搜索
memory-os search "code" --type code
```

### 语义搜索（需要配置 Embedding）

```bash
# 配置 OpenAI API（可选）
memory-os config set embedding.provider openai
memory-os config set embedding.apiKey "sk-..."

# 语义搜索
memory-os search --semantic "人工智能的应用"
```

## 第三步：时间线查询

```bash
# 查看今天的记忆
memory-os timeline

# 查看特定日期
memory-os timeline --date 2024-03-01

# 查看时间范围
memory-os timeline --range "last 7 days"
```

## 第四步：查看状态

```bash
# 查看 Memory-OS 状态
memory-os status
```

输出示例：

```
Memory-OS Status:

Total memories: 42
Disk usage: 1.23 MB
Last update: 2024-03-08 10:30:00

By type:
  text: 25
  file: 10
  code: 5
  chat: 2
```

## 使用 API

### 基础示例

```typescript
import { MemoryOS, MemoryType } from 'memory-os';

// 初始化
const memory = new MemoryOS({
  storage: {
    path: '~/.memory-os',
    backend: 'local',
  },
});

await memory.init();

// 采集记忆
await memory.collect({
  type: MemoryType.TEXT,
  content: 'Today I learned about Memory-OS',
  metadata: {
    tags: ['learning', 'memory-os'],
  },
});

// 搜索记忆
const results = await memory.search({
  query: 'Memory-OS',
  limit: 10,
});

console.log(`Found ${results.length} memories`);

// 关闭
await memory.close();
```

### Agent 集成示例

```typescript
import { MemoryOS, MemoryType } from 'memory-os';

const memory = new MemoryOS({});
await memory.init();

// 在 Agent 对话中记录
async function handleUserMessage(userMessage: string) {
  // 记录用户消息
  await memory.collect({
    type: MemoryType.CHAT,
    content: {
      role: 'user',
      message: userMessage,
    },
    metadata: {
      source: 'agent-chat',
      tags: ['conversation'],
    },
  });

  // 检索相关记忆
  const relevant = await memory.search({
    query: userMessage,
    semantic: true,
    limit: 5,
  });

  // 使用记忆增强响应
  const context = relevant
    .map(r => r.memory.content)
    .join('\n');

  return `Based on previous context:\n${context}\n\nResponse...`;
}
```

## 常见场景

### 场景 1: 个人笔记管理

```bash
# 导入所有笔记
memory-os collect --source ~/Documents/Notes

# 搜索特定主题
memory-os search "project ideas"

# 查看最近的笔记
memory-os timeline --range "last week"
```

### 场景 2: 代码库记忆

```bash
# 采集代码仓库（TODO）
memory-os collect --code ~/projects/my-app

# 搜索代码片段
memory-os search "authentication" --type code
```

### 场景 3: 聊天记录备份

```bash
# 导入聊天记录
memory-os collect --chat ~/chat-export.json

# 搜索对话
memory-os search "discuss about AI" --type chat

# 按时间查看
memory-os timeline --date 2024-02-14 --type chat
```

## 下一步

- 阅读 [完整文档](./README.md)
- 查看 [架构设计](./ARCHITECTURE.md)
- 探索 [API 文档](./docs/API.md)
- 了解 [采集器开发](./docs/COLLECTORS.md)

## 故障排查

### 问题：找不到 memory-os 命令

```bash
# 确保已全局安装
npm install -g memory-os

# 或使用 npx
npx memory-os init
```

### 问题：权限错误

```bash
# 检查目录权限
ls -la ~/.memory-os

# 重新初始化
rm -rf ~/.memory-os
memory-os init
```

### 问题：依赖缺失

```bash
# 重新安装依赖
cd memory-os
rm -rf node_modules
npm install
```

## 获取帮助

```bash
# 查看帮助
memory-os --help

# 查看特定命令帮助
memory-os search --help
memory-os collect --help
```

---

**开始构建你的数字永生档案吧！** 🚀
