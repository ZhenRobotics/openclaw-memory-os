---
name: openclaw-memory-os
description: OpenClaw Memory-OS - Digital immortality service and cognitive continuity infrastructure for personal memory management | 数字永生服务与认知延续基础设施
tags: [memory, knowledge-management, digital-immortality, cognitive-continuity, ai-memory, knowledge-graph, semantic-search, agent-memory, long-term-memory, openclaw]
version: 0.1.0
license: MIT-0
repository: https://github.com/ZhenRobotics/openclaw-memory-os
homepage: https://github.com/ZhenRobotics/openclaw-memory-os
documentation: https://github.com/ZhenRobotics/openclaw-memory-os/blob/main/README.md

# v0.1.0 MVP - Local-Only, No External APIs Required
requires:
  packages:
    - name: openclaw-memory-os
      source: npm
      version: ">=0.1.0"
      verified_repo: https://github.com/ZhenRobotics/openclaw-memory-os
      verified_commit: cd99524
  tools:
    - node>=18
    - npm
  # IMPORTANT: v0.1.0 does NOT require any API keys
  # All AI features (embeddings, LLM) are PLANNED but NOT IMPLEMENTED
  # This version is 100% local-only
  api_keys: []  # No API keys needed for v0.1.0

# Security & Privacy Declaration
security:
  data_storage: local_only
  network_calls: none
  external_apis: none
  auto_collection: manual_only  # Must be explicitly triggered
  encryption: optional
---

# OpenClaw Memory-OS

**English** | [中文](#openclaw-memory-os-中文)

## ⚠️ Security & Privacy Notice (v0.1.0 MVP)

**Current Version Status:**
- ✅ **100% Local Storage** - All data stored in `~/.memory-os/data/`
- ✅ **No External API Calls** - Zero network activity
- ✅ **No API Keys Required** - Works completely offline
- ✅ **Manual Collection Only** - No automatic background scanning
- ⚠️ **Future Features Planned** - Semantic search and LLM features NOT yet implemented

**What v0.1.0 Does:**
- ✅ Local file-based memory storage (JSON)
- ✅ Basic keyword search (local)
- ✅ File collection (manual trigger only)
- ✅ Timeline and stats (local computation)

**What v0.1.0 Does NOT Do:**
- ❌ No AI embeddings
- ❌ No LLM calls
- ❌ No external API usage
- ❌ No automatic background collection
- ❌ No semantic search (planned for v0.2.0+)

**Data Control:**
- Your data: `~/.memory-os/data/`
- You control: What to collect, when to collect
- You own: All data files (JSON format, human-readable)
- You delete: `rm -rf ~/.memory-os/` removes everything

**Recommended Safe Usage:**
1. **Test in sandboxed environment first**
2. **Review what files will be collected** before running collect commands
3. **Use explicit paths** - avoid broad patterns like `~/Documents`
4. **Inspect collected data** in `~/.memory-os/data/memories/`
5. **Disable AUTO-TRIGGER** in production until you're comfortable

---

Digital immortality service and cognitive continuity infrastructure.

AI-powered personal memory management system for capturing, storing, and intelligently retrieving your digital memories.

## Installation

### Step 1: Install via ClawHub (Recommended)

```bash
# Install the skill
clawhub install openclaw-memory-os
```

### Step 2: Install the npm package

```bash
# Global installation
npm install -g openclaw-memory-os

# Or from source
git clone https://github.com/ZhenRobotics/openclaw-memory-os.git
cd openclaw-memory-os
npm install
npm run build
npm link
```

### Step 3: Initialize Memory-OS

```bash
# Initialize (creates ~/.memory-os/)
openclaw-memory-os init

# Configure (optional)
openclaw-memory-os config set owner.name "Your Name"
openclaw-memory-os config set owner.email "your@email.com"
```

### Step 4: Verify Installation

```bash
openclaw-memory-os status
```

**Security Check:**
```bash
# Verify data location
ls -la ~/.memory-os/data/

# Inspect configuration
cat ~/.memory-os/config.json
```

---

## Usage

### When to Use This Skill

**MANUAL TRIGGER** (Recommended for v0.1.0):

Use when you explicitly want to:
- Save specific information: "Save this to memory: ..."
- Retrieve specific information: "Search my memories for ..."
- Collect from specific files: "Collect memories from ~/my-notes/"

**AUTO-TRIGGER** (⚠️ Use with Caution):

Keywords: `memory`, `remember`, `recall`, `记忆`, `回忆`, `记住`, `保存`

**⚠️ Security Recommendation:**
- Disable AUTO-TRIGGER in production
- Manually approve each collection action
- Review collected data regularly

**DO NOT USE** when:
- Simple reminders or todos (use task management)
- Real-time collaboration (use chat tools)
- Handling sensitive data without review

---

## Core Features

**v0.1.0 MVP (Current):**

- ✅ **Local Storage** - JSON-based, in `~/.memory-os/data/`
- ✅ **Manual Collection** - From specific files/directories
- ✅ **Basic Search** - Keyword and tag-based (local)
- ✅ **Timeline** - Temporal tracking of memories
- ✅ **Privacy-First** - No cloud, no external APIs
- ✅ **Extensible** - Modular architecture for future features

**Planned for Future Versions:**
- ⏳ **Semantic Search** - AI-powered (requires API key)
- ⏳ **Knowledge Graph** - Automatic relations (requires API key)
- ⏳ **Cognitive Chat** - LLM integration (requires API key)

---

## Security Best Practices

### 1. Test in Isolated Environment

```bash
# Create test user or use VM
# Install in test environment first
npm install -g openclaw-memory-os

# Initialize with test data
mkdir ~/test-memories
openclaw-memory-os collect --source ~/test-memories
```

### 2. Review Collected Data

```bash
# Check what was collected
ls ~/.memory-os/data/memories/

# Read individual memory files
cat ~/.memory-os/data/memories/*.json | jq '.'
```

### 3. Control Collection Scope

```bash
# ✅ Good: Specific directory
openclaw-memory-os collect --source ~/my-project-notes/

# ⚠️ Caution: Broad scope
openclaw-memory-os collect --source ~/Documents

# ❌ Dangerous: System-wide
openclaw-memory-os collect --source ~/  # DON'T DO THIS
```

### 4. Data Retention & Deletion

```bash
# View all memories
openclaw-memory-os search --all

# Delete specific memory
rm ~/.memory-os/data/memories/<memory-id>.json

# Complete removal
rm -rf ~/.memory-os/
```

### 5. Network Traffic Verification

```bash
# v0.1.0 should have ZERO network traffic
# Monitor with:
tcpdump -i any port 443 or port 80 &
openclaw-memory-os collect --source ~/test-data/
# Should see NO external connections
```

---

## Agent Usage Guide

### Important Notes

**CRITICAL for v0.1.0**:
- This version is **local-only**
- No AI embeddings or LLM features active
- All operations happen on your machine
- No credentials needed

**Package Name**: When importing, use `openclaw-memory-os`:
```typescript
import { MemoryOS, MemoryType } from 'openclaw-memory-os';
```

**CLI Name**: When using CLI, use `openclaw-memory-os`:
```bash
openclaw-memory-os init
openclaw-memory-os collect --source ~/specific-folder
```

### Pattern 1: Save Memory (Local Only)

```typescript
import { MemoryOS, MemoryType } from 'openclaw-memory-os';

const memory = new MemoryOS({
  storePath: '~/.memory-os'  // Local storage
});
await memory.init();

// Save text memory (local JSON file)
await memory.collect({
  type: MemoryType.TEXT,
  content: 'User prefers TypeScript',
  metadata: {
    tags: ['preference'],
    source: 'manual',
  },
});
```

### Pattern 2: Search Memory (Local Only)

```typescript
// Basic keyword search (no AI)
const results = await memory.search({
  query: 'TypeScript',  // Simple text matching
  limit: 5,
});

// Tag-based search
const tagResults = await memory.search({
  tags: ['preference'],
});
```

### Pattern 3: Timeline Query (Local Only)

```typescript
// Query local timeline
const timeline = await memory.timeline({
  date: new Date('2024-03-01'),
  range: 'day',
});
```

---

## CLI Commands

### Basic Operations (All Local)

```bash
# Initialize (creates local directory)
openclaw-memory-os init

# Collect from specific directory
openclaw-memory-os collect --source ~/my-notes/

# Search locally
openclaw-memory-os search "keyword"
openclaw-memory-os search --tags "tag1,tag2"

# Timeline (local)
openclaw-memory-os timeline --date 2024-03-01

# Status (local)
openclaw-memory-os status
```

### Security Commands

```bash
# Inspect data location
openclaw-memory-os status

# View statistics (local computation)
openclaw-memory-os stats

# Export data (local file copy)
openclaw-memory-os export ~/backup/

# Complete removal
rm -rf ~/.memory-os/
```

---

## Configuration

**v0.1.0 Configuration** (No API keys needed):

```json
{
  "storage": {
    "path": "~/.memory-os/data",
    "backend": "local"
  },
  "collectors": {
    "auto": false,  // Manual only
    "sources": [],  // Must be explicitly set
    "exclude": ["node_modules", ".git", ".env"]
  },
  "privacy": {
    "encryption": false,
    "shareStats": false
  }
}
```

**Future Configuration** (v0.2.0+, when AI features are implemented):

```json
{
  "embedding": {
    "provider": "openai",  // Will require API key
    "apiKey": "${OPENAI_API_KEY}"
  },
  "llm": {
    "provider": "anthropic",  // Will require API key
    "apiKey": "${ANTHROPIC_API_KEY}"
  }
}
```

---

## Known Limitations (v0.1.0)

1. **No AI Features** - Semantic search and LLM features not implemented
2. **Basic Search Only** - Simple keyword/tag matching
3. **Manual Collection** - No automatic background scanning
4. **No Encryption** - Data stored as plain JSON (can enable manually)
5. **No Multi-user** - Single-user local storage only

---

## Roadmap & Future Security Considerations

### v0.2.0 (Planned) - AI Features

**Will introduce:**
- Semantic search (requires OpenAI/Anthropic API key)
- Embeddings generation (data sent to external API)
- LLM-powered insights

**Security measures planned:**
- Explicit API key configuration
- User consent for each API call
- Local-only mode option
- Encryption support

### v0.3.0 (Planned) - Advanced Features

**Will introduce:**
- Cloud sync (optional)
- Encrypted storage
- Multi-device support

---

## Links

- **ClawHub**: https://clawhub.ai/skills/openclaw-memory-os
- **npm**: https://www.npmjs.com/package/openclaw-memory-os
- **GitHub**: https://github.com/ZhenRobotics/openclaw-memory-os
- **Issues**: https://github.com/ZhenRobotics/openclaw-memory-os/issues
- **Security**: https://github.com/ZhenRobotics/openclaw-memory-os/blob/main/SECURITY.md

---

## License

MIT-0 License

---

# OpenClaw Memory-OS (中文)

**[English](#openclaw-memory-os)** | 中文

## ⚠️ 安全与隐私声明（v0.1.0 MVP 版本）

**当前版本状态：**
- ✅ **100% 本地存储** - 所有数据存储在 `~/.memory-os/data/`
- ✅ **无外部 API 调用** - 零网络活动
- ✅ **无需 API 密钥** - 完全离线工作
- ✅ **仅手动收集** - 无自动后台扫描
- ⚠️ **未来功能计划中** - 语义搜索和 LLM 功能尚未实现

**v0.1.0 能做什么：**
- ✅ 本地文件记忆存储（JSON 格式）
- ✅ 基本关键词搜索（本地）
- ✅ 文件采集（仅手动触发）
- ✅ 时间线和统计（本地计算）

**v0.1.0 不能做什么：**
- ❌ 无 AI 向量化
- ❌ 无 LLM 调用
- ❌ 无外部 API 使用
- ❌ 无自动后台收集
- ❌ 无语义搜索（计划 v0.2.0+）

**数据控制：**
- 您的数据：`~/.memory-os/data/`
- 您控制：收集什么、何时收集
- 您拥有：所有数据文件（JSON 格式，人类可读）
- 您删除：`rm -rf ~/.memory-os/` 删除所有内容

**推荐安全使用：**
1. **先在沙盒环境测试**
2. **运行收集命令前检查将收集哪些文件**
3. **使用明确路径** - 避免 `~/Documents` 等广泛模式
4. **检查收集的数据** 在 `~/.memory-os/data/memories/`
5. **禁用自动触发** 在生产环境，直到您熟悉系统

---

数字永生服务 | 认知延续基础设施

AI 驱动的个人记忆管理系统，用于捕获、存储和智能检索您的数字记忆。

## 安装

[安装步骤与英文版相同]

## 使用场景

**手动触发（v0.1.0 推荐）：**

显式使用时：
- 保存特定信息："保存到记忆：..."
- 检索特定信息："搜索我的记忆..."
- 从特定文件收集："从 ~/my-notes/ 收集记忆"

**自动触发（⚠️ 谨慎使用）：**

关键词：`memory`、`remember`、`recall`、`记忆`、`回忆`、`记住`、`保存`

**⚠️ 安全建议：**
- 在生产环境禁用自动触发
- 手动批准每个收集操作
- 定期检查收集的数据

---

## 核心功能

**v0.1.0 MVP（当前）：**

- ✅ **本地存储** - JSON 格式，在 `~/.memory-os/data/`
- ✅ **手动收集** - 从特定文件/目录
- ✅ **基本搜索** - 关键词和标签（本地）
- ✅ **时间线** - 记忆的时间追踪
- ✅ **隐私优先** - 无云端，无外部 API
- ✅ **可扩展** - 模块化架构用于未来功能

**未来版本计划：**
- ⏳ **语义搜索** - AI 驱动（需要 API 密钥）
- ⏳ **知识图谱** - 自动关系（需要 API 密钥）
- ⏳ **认知对话** - LLM 集成（需要 API 密钥）

---

## 安全最佳实践

[安全最佳实践与英文版相同]

---

## 链接

- **ClawHub**: https://clawhub.ai/skills/openclaw-memory-os
- **npm**: https://www.npmjs.com/package/openclaw-memory-os
- **GitHub**: https://github.com/ZhenRobotics/openclaw-memory-os
- **问题反馈**: https://github.com/ZhenRobotics/openclaw-memory-os/issues
- **安全**: https://github.com/ZhenRobotics/openclaw-memory-os/blob/main/SECURITY.md

---

## 许可证

MIT-0 License

---

**Memory-OS v0.1.0** - 100% Local, 0% Cloud, Your Data, Your Control

Version: 0.1.0 | Verified Commit: 023de51 | Status: Production-Ready for Local Use
