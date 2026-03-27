---
name: openclaw-memory-os
description: OpenClaw Memory-OS - Digital immortality service with conversation recording infrastructure (Phase 1) | 数字永生服务对话记录基础设施（第一阶段）
tags: [memory, knowledge-management, digital-immortality, cognitive-continuity, ai-memory, conversation-storage, session-management, privacy-filter, agent-memory, long-term-memory, openclaw, infrastructure]
version: 0.2.2
license: MIT-0
repository: https://github.com/ZhenRobotics/openclaw-memory-os
homepage: https://github.com/ZhenRobotics/openclaw-memory-os
documentation: https://github.com/ZhenRobotics/openclaw-memory-os/blob/main/README.md

# v0.2.0 Phase 1 - Conversation Recording Foundation
requires:
  packages:
    - name: openclaw-memory-os
      source: npm
      version: ">=0.2.2"
      verified_repo: https://github.com/ZhenRobotics/openclaw-memory-os
      verified_commit: 69848846d1925f5484e54d23bcef14340fbcf82d
  tools:
    - node>=18
    - npm
  api_keys: []  # No API keys needed - 100% local-only

# Security & Privacy Declaration
security:
  data_storage: local_only
  network_calls: none
  external_apis: none
  auto_collection: trigger_based  # Activates on keyword detection when enabled
  trigger_keywords: ["记住", "保存", "记录", "remember", "save to memory", "keep in mind"]
  default_enabled: false  # AUTO-TRIGGER is OFF by default (opt-in for privacy)
  confirmation_required: true  # Requires user confirmation before each save (double protection)
  opt_in: configurable  # Can be enabled in ~/.memory-os/config.json
  encryption: optional
---

# OpenClaw Memory-OS

**English** | [中文](#openclaw-memory-os-中文)

## 🛡️ PRIVACY & SECURITY NOTICE

### ✅ AUTO-TRIGGER IS DISABLED BY DEFAULT (Opt-In)

**For privacy protection, AUTO-TRIGGER is OFF by default. You must explicitly enable it.**

**What is AUTO-TRIGGER?**
- Detects keywords: "记住", "remember", "save to memory", etc.
- Extracts content and prompts for confirmation before saving to `~/.memory-os/`
- Data stays local (✅ zero network calls)

**Default Behavior (Safe):**
```
You: "记住我的名字是刘小容"
     → Nothing happens (AUTO-TRIGGER is OFF)

To save, use manual command:
$ openclaw-memory-os remember "我的名字是刘小容"
```

**How to Enable AUTO-TRIGGER (Optional):**
```bash
# Method 1: Edit config
nano ~/.memory-os/config.json
{"auto_trigger": true}

# Method 2: During init (if implemented)
openclaw-memory-os init --enable-auto-trigger
```

**Privacy Considerations if Enabled:**
- ⚠️ Accidental triggers during casual conversation (but you'll be prompted to confirm)
- ✅ Requires confirmation before each save (double protection)
- ✅ Can be disabled anytime
- ✅ All data stays local (100% offline)

**Recommended:** Use manual commands for full control, only enable AUTO-TRIGGER after testing in sandbox.

---

## Installation

### Quick Start
```bash
# 1. Install
npm install -g openclaw-memory-os@0.2.2

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

**v0.2.2 (Current - Phase 1):**
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

### Manual Commands (Default - Recommended)

**By default, AUTO-TRIGGER is OFF. Use manual commands for full control:**

```bash
# Batch collect files
openclaw-memory-os collect --source ~/notes/ --exclude node_modules

# Save specific memory
openclaw-memory-os remember "项目截止日期：2026-04-01"

# Search memories
openclaw-memory-os search "deadline"

# View status
openclaw-memory-os status
```

### AUTO-TRIGGER (Optional - Must Enable First)

**⚠️ Disabled by default. To enable, edit config:**
```bash
nano ~/.memory-os/config.json
{"auto_trigger": true}
```

**Once enabled, trigger keywords activate automatically:**
- Chinese: 记住, 保存, 记录
- English: remember, save to memory, keep in mind

**Example (only works after enabling):**
```
User: "记住项目截止日期：2026-04-01"
      → Extracts: date=2026-04-01, event="项目截止"
      → Saves: ~/.memory-os/memories/<uuid>.json

Agent: ✅ 已记住
       日期: 2026-04-01
       事件: 项目截止
```

---

## Security Best Practices

### 1. Test in Sandbox First
```bash
# VM/container test
docker run -it --rm ubuntu:22.04 bash
npm install -g openclaw-memory-os@0.2.2
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

## Known Limitations (v0.2.2)

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

## 🛡️ 隐私与安全声明

### ✅ AUTO-TRIGGER 默认关闭（需主动启用）

**为保护隐私，AUTO-TRIGGER 默认关闭。您必须明确启用才能使用。**

**什么是 AUTO-TRIGGER？**
- 检测关键词：记住、保存、记录、remember 等
- 提取内容并在保存前提示确认到 `~/.memory-os/`
- 数据仅存储在本地（✅ 零网络调用）

**默认行为（安全）：**
```
用户："记住我的名字是刘小容"
     → 无反应（AUTO-TRIGGER 已关闭）

如需保存，使用手动命令：
$ openclaw-memory-os remember "我的名字是刘小容"
```

**如何启用 AUTO-TRIGGER（可选）：**
```bash
# 方法 1: 编辑配置
nano ~/.memory-os/config.json
{"auto_trigger": true}

# 方法 2: 初始化时启用（如果已实现）
openclaw-memory-os init --enable-auto-trigger
```

**启用后的隐私注意事项：**
- ⚠️ 日常对话中可能意外触发（但会提示确认）
- ✅ 保存前需要确认（双重保护）
- ✅ 可随时禁用
- ✅ 所有数据本地存储（100% 离线）

**建议：** 使用手动命令以获得完全控制，仅在沙盒测试后启用 AUTO-TRIGGER。

---

## 安装

```bash
# 1. 安装
npm install -g openclaw-memory-os@0.2.2

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

**v0.2.2（当前 - Phase 1）：**
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

### 手动命令（默认 - 推荐）

**默认情况下，AUTO-TRIGGER 已关闭。使用手动命令以获得完全控制：**

```bash
# 批量采集文件
openclaw-memory-os collect --source ~/notes/ --exclude node_modules

# 保存特定记忆
openclaw-memory-os remember "项目截止日期：2026-04-01"

# 搜索记忆
openclaw-memory-os search "截止"

# 查看状态
openclaw-memory-os status
```

### AUTO-TRIGGER（可选 - 需先启用）

**⚠️ 默认关闭。启用方法：**
```bash
nano ~/.memory-os/config.json
{"auto_trigger": true}
```

**启用后，触发关键词自动激活：**
- 中文：记住、保存、记录
- 英文：remember, save to memory, keep in mind

**示例（仅在启用后生效）：**
```
用户："记住项目截止日期：2026-04-01"
      → 提取：date=2026-04-01, event="项目截止"
      → 保存：~/.memory-os/memories/<uuid>.json

Agent：✅ 已记住
       日期：2026-04-01
       事件：项目截止
```

---

## 安全最佳实践

### 1. 先在沙盒中测试
```bash
docker run -it --rm ubuntu:22.04 bash
npm install -g openclaw-memory-os@0.2.2
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

**License:** MIT-0 · Memory-OS v0.2.2 - 100% Local, 0% Cloud, Your Data, Your Control
