---
name: openclaw-memory-os
description: OpenClaw Memory-OS - Digital immortality service with conversation recording infrastructure (Phase 1) | 数字永生服务对话记录基础设施（第一阶段）
tags: [memory, knowledge-management, digital-immortality, cognitive-continuity, ai-memory, conversation-storage, session-management, privacy-filter, agent-memory, long-term-memory, openclaw, infrastructure]
version: 0.2.1
license: MIT-0
repository: https://github.com/ZhenRobotics/openclaw-memory-os
homepage: https://github.com/ZhenRobotics/openclaw-memory-os
documentation: https://github.com/ZhenRobotics/openclaw-memory-os/blob/main/README.md

# v0.2.0 Phase 1 - Conversation Recording Foundation
requires:
  packages:
    - name: openclaw-memory-os
      source: npm
      version: ">=0.2.1"
      verified_repo: https://github.com/ZhenRobotics/openclaw-memory-os
      verified_commit: ca08c3cc3d89ff6571baf6dba102949bb25b364b
  tools:
    - node>=18
    - npm
  api_keys: []  # No API keys needed - 100% local-only

# Security & Privacy Declaration
security:
  data_storage: local_only
  network_calls: none
  external_apis: none
  auto_collection: trigger_based  # Automatically activates on keyword detection
  trigger_keywords: ["记住", "保存", "记录", "remember", "save to memory", "keep in mind"]
  default_enabled: true  # AUTO-TRIGGER is ON by default
  confirmation_required: false  # Saves immediately without asking
  opt_out: configurable  # Can be disabled in ~/.memory-os/config.json
  encryption: optional
---

# OpenClaw Memory-OS

**English** | [中文](#openclaw-memory-os-中文)

## 🚨 CRITICAL PRIVACY NOTICE

### ⚠️ AUTO-TRIGGER IS ENABLED BY DEFAULT

**This skill automatically saves conversation data without confirmation when trigger keywords are detected.**

**How it works:**
1. Detects keywords: "记住", "remember", "save to memory", etc.
2. Immediately extracts and saves to `~/.memory-os/` (NO confirmation)
3. Data stays local (✅ zero network calls)

**Example:**
```
You: "记住我的名字是刘小容"
     → AUTO-SAVES immediately
Skill: ✅ Remembered: 刘小容
```

**Privacy Risks:**
- ❌ Accidental triggers during casual conversation
- ❌ No confirmation before saving
- ❌ Enabled by default (must actively disable)
- ✅ All data stays local (100% offline)

**How to Disable AUTO-TRIGGER:**
```bash
# Edit config
nano ~/.memory-os/config.json
{"auto_trigger": false}

# Or test in sandbox first
docker run -it --rm ubuntu:22.04
npm install -g openclaw-memory-os@0.2.1
```

**Recommended:** Test in VM/container first, disable auto-trigger for sensitive conversations, regularly review `~/.memory-os/memories/`.

---

## Installation

### Quick Start
```bash
# 1. Install
npm install -g openclaw-memory-os@0.2.1

# 2. Initialize
openclaw-memory-os init

# 3. Test (optional)
mkdir ~/test-memories
echo "Test note" > ~/test-memories/note.txt
openclaw-memory-os collect --source ~/test-memories/
openclaw-memory-os search "test"
```

### From Source
```bash
git clone https://github.com/ZhenRobotics/openclaw-memory-os.git
cd openclaw-memory-os
npm install && npm run build && npm link
```

---

## Core Features

**v0.2.1 (Current - Phase 1):**
- ✅ **Conversation Recording** - AUTO-TRIGGER keyword-based memory capture
- ✅ **High-Performance Storage** - <10ms writes, 92% cache hit rate
- ✅ **Privacy Filter** - Redacts API keys, emails, credit cards automatically
- ✅ **Session Management** - 30min timeout, activity tracking
- ✅ **Batch File Collection** - `collect --source ~/notes/`
- ✅ **100% Local** - Zero network calls, no API keys required
- ✅ **100% Test Coverage** - 29 scenarios passing

**NOT Included (Planned for v0.3.0+):**
- ⏳ AI embeddings / semantic search (requires API key)
- ⏳ Knowledge graph
- ⏳ LLM-powered insights
- ⏳ Encryption at rest

---

## Usage

### AUTO-TRIGGER (Default Behavior)

**Trigger keywords activate automatically:**
- Chinese: 记住, 保存, 记录
- English: remember, save to memory, keep in mind

**Example:**
```
User: "记住项目截止日期：2026-04-01"
      → Extracts: date=2026-04-01, event="项目截止"
      → Saves: ~/.memory-os/memories/<uuid>.json

Agent: ✅ 已记住
       日期: 2026-04-01
       事件: 项目截止
```

**To disable:** `nano ~/.memory-os/config.json` → `{"auto_trigger": false}`

### Manual Commands

```bash
# Batch collect
openclaw-memory-os collect --source ~/notes/ --exclude node_modules

# Manual remember (if auto-trigger disabled)
openclaw-memory-os remember "Project deadline: 2026-04-01"

# Search
openclaw-memory-os search "deadline"

# Status
openclaw-memory-os status
```

---

## Security Best Practices

### 1. Test in Sandbox First
```bash
# VM/container test
docker run -it --rm ubuntu:22.04 bash
npm install -g openclaw-memory-os@0.2.1
openclaw-memory-os init
# Say trigger words and check ~/.memory-os/
```

### 2. Control Collection Scope
```bash
# ✅ Good: Specific directory
openclaw-memory-os collect --source ~/project-notes/

# ✅ Good: With exclusions
openclaw-memory-os collect --source ~/Documents/ --exclude sensitive

# ❌ Avoid: Broad scope
openclaw-memory-os collect --source ~/  # Too broad
```

### 3. Regular Data Review
```bash
# List all memories
ls ~/.memory-os/memories/

# Search for sensitive data
grep -r "password\|secret" ~/.memory-os/

# Delete unwanted data
rm ~/.memory-os/memories/<uuid>.json
```

### 4. Network Verification
```bash
# Verify zero network activity
sudo tcpdump -i any port 443 or port 80 &
openclaw-memory-os collect --source ~/test/
# Should see NO external connections
```

---

## Agent API Usage

**Node.js Integration:**
```typescript
import { MemoryOS, MemoryType } from 'openclaw-memory-os';

const memory = new MemoryOS({ storePath: '~/.memory-os' });
await memory.init();

// Save memory
await memory.collect({
  type: MemoryType.TEXT,
  content: 'User prefers TypeScript',
  metadata: { tags: ['preference'], source: 'manual' }
});

// Search (local keyword matching)
const results = await memory.search({ query: 'TypeScript', limit: 5 });

// Timeline
const timeline = await memory.timeline({
  date: new Date('2024-03-01'),
  range: 'day'
});
```

**See full API docs:** [GitHub README](https://github.com/ZhenRobotics/openclaw-memory-os/blob/main/README.md)

---

## Known Limitations (v0.2.1)

- ❌ No AI features (semantic search, embeddings) - planned for v0.3.0+
- ❌ No encryption at rest (data stored as plain JSON)
- ❌ No cloud sync or multi-device support
- ❌ Basic keyword search only (no semantic understanding)
- ❌ Single-user local storage only

---

## Links

- **GitHub:** https://github.com/ZhenRobotics/openclaw-memory-os
- **npm:** https://www.npmjs.com/package/openclaw-memory-os
- **Issues:** https://github.com/ZhenRobotics/openclaw-memory-os/issues
- **Security:** https://github.com/ZhenRobotics/openclaw-memory-os/blob/main/SECURITY.md

---

# OpenClaw Memory-OS (中文)

**[English](#openclaw-memory-os)** | 中文

## 🚨 关键隐私声明

### ⚠️ AUTO-TRIGGER 默认启用

**本 skill 在检测到触发词时自动保存对话数据，无需确认。**

**工作原理：**
1. 检测关键词：记住、保存、记录、remember 等
2. 立即提取并保存到 `~/.memory-os/`（无确认）
3. 数据仅存储在本地（✅ 零网络调用）

**示例：**
```
用户："记住我的名字是刘小容"
     → 自动保存
Skill：✅ 已记住：刘小容
```

**隐私风险：**
- ❌ 日常对话中可能意外触发
- ❌ 保存前无确认
- ❌ 默认启用（需主动禁用）
- ✅ 所有数据本地存储（100% 离线）

**如何禁用 AUTO-TRIGGER：**
```bash
nano ~/.memory-os/config.json
{"auto_trigger": false}
```

**建议：** 先在虚拟机/容器中测试，敏感对话时禁用自动触发，定期检查 `~/.memory-os/memories/`。

---

## 安装

```bash
# 1. 安装
npm install -g openclaw-memory-os@0.2.1

# 2. 初始化
openclaw-memory-os init

# 3. 测试
mkdir ~/test-memories
echo "测试笔记" > ~/test-memories/note.txt
openclaw-memory-os collect --source ~/test-memories/
openclaw-memory-os search "测试"
```

---

## 核心功能

**v0.2.1（当前 - Phase 1）：**
- ✅ 对话记录 - 基于关键词的 AUTO-TRIGGER 记忆捕获
- ✅ 高性能存储 - <10ms 写入，92% 缓存命中率
- ✅ 隐私过滤 - 自动脱敏 API 密钥、邮箱、银行卡
- ✅ 会话管理 - 30 分钟超时，活动追踪
- ✅ 批量文件采集 - `collect --source ~/notes/`
- ✅ 100% 本地 - 零网络调用，无需 API 密钥
- ✅ 100% 测试覆盖 - 29 个场景通过

**未包含（计划 v0.3.0+）：**
- ⏳ AI 向量化/语义搜索（需 API 密钥）
- ⏳ 知识图谱
- ⏳ LLM 驱动的洞察
- ⏳ 静态加密

---

## 使用方式

### AUTO-TRIGGER（默认行为）

**触发关键词自动激活：**
- 中文：记住、保存、记录
- 英文：remember, save to memory, keep in mind

**示例：**
```
用户："记住项目截止日期：2026-04-01"
      → 提取：date=2026-04-01, event="项目截止"
      → 保存：~/.memory-os/memories/<uuid>.json

Agent：✅ 已记住
       日期：2026-04-01
       事件：项目截止
```

**禁用方法：** `nano ~/.memory-os/config.json` → `{"auto_trigger": false}`

### 手动命令

```bash
# 批量采集
openclaw-memory-os collect --source ~/notes/ --exclude node_modules

# 手动记忆（如果禁用了 auto-trigger）
openclaw-memory-os remember "项目截止日期：2026-04-01"

# 搜索
openclaw-memory-os search "截止"

# 状态
openclaw-memory-os status
```

---

## 安全最佳实践

### 1. 先在沙盒中测试
```bash
docker run -it --rm ubuntu:22.04 bash
npm install -g openclaw-memory-os@0.2.1
openclaw-memory-os init
# 说触发词并检查 ~/.memory-os/
```

### 2. 控制采集范围
```bash
# ✅ 推荐：特定目录
openclaw-memory-os collect --source ~/project-notes/

# ❌ 避免：过于广泛
openclaw-memory-os collect --source ~/  # 范围太大
```

### 3. 定期数据审查
```bash
# 列出所有记忆
ls ~/.memory-os/memories/

# 搜索敏感数据
grep -r "密码\|secret" ~/.memory-os/

# 删除不需要的数据
rm ~/.memory-os/memories/<uuid>.json
```

### 4. 网络流量验证
```bash
# 验证零网络活动
sudo tcpdump -i any port 443 or port 80 &
openclaw-memory-os collect --source ~/test/
# 应该看不到任何外部连接
```

---

## 已知限制（v0.2.1）

- ❌ 无 AI 功能（语义搜索、向量化）- 计划 v0.3.0+
- ❌ 无静态加密（数据以明文 JSON 存储）
- ❌ 无云同步或多设备支持
- ❌ 仅基础关键词搜索（无语义理解）
- ❌ 仅单用户本地存储

---

## 链接

- **GitHub:** https://github.com/ZhenRobotics/openclaw-memory-os
- **npm:** https://www.npmjs.com/package/openclaw-memory-os
- **问题反馈:** https://github.com/ZhenRobotics/openclaw-memory-os/issues

---

**License:** MIT-0 · Memory-OS v0.2.1 - 100% Local, 0% Cloud, Your Data, Your Control
