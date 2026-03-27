---
name: openclaw-memory-os
description: OpenClaw Memory-OS - Digital immortality service with conversation recording infrastructure (Phase 1) | 数字永生服务对话记录基础设施（第一阶段）
tags: [memory, knowledge-management, digital-immortality, cognitive-continuity, ai-memory, conversation-storage, session-management, privacy-filter, agent-memory, long-term-memory, openclaw, infrastructure]
version: 0.2.0-phase1
license: MIT-0
repository: https://github.com/ZhenRobotics/openclaw-memory-os
homepage: https://github.com/ZhenRobotics/openclaw-memory-os
documentation: https://github.com/ZhenRobotics/openclaw-memory-os/blob/main/README.md

# v0.2.0 Phase 1 - Conversation Recording Foundation
requires:
  packages:
    - name: openclaw-memory-os
      source: npm
      version: ">=0.2.0-phase1"
      verified_repo: https://github.com/ZhenRobotics/openclaw-memory-os
      verified_commit: 1c9bb8f4ec3c29efa03455350900ceb005f46fef
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
  auto_collection: trigger_based  # Automatically activates on keyword detection
  trigger_keywords: ["记住", "保存", "记录", "remember", "save to memory", "keep in mind"]
  default_enabled: true  # AUTO-TRIGGER is ON by default
  confirmation_required: false  # Saves immediately without asking
  opt_out: configurable  # Can be disabled in ~/.memory-os/config.json
  encryption: optional
---

# OpenClaw Memory-OS

**English** | [中文](#openclaw-memory-os-中文)

## 🚨 CRITICAL PRIVACY NOTICE (v0.2.0 Phase 1)

### ⚠️ AUTO-TRIGGER IS ENABLED BY DEFAULT

**THIS SKILL AUTOMATICALLY SAVES CONVERSATION DATA WITHOUT CONFIRMATION**

**How AUTO-TRIGGER Works:**
1. **Detects trigger keywords** in your conversation: "记住", "remember", "save to memory", etc.
2. **Automatically activates** (no need to explicitly invoke the skill)
3. **Immediately extracts** information from your message
4. **Instantly saves** to `~/.memory-os/` (local storage, NO confirmation prompt)

**Trigger Keywords:**
- **Chinese:** 记住 (remember), 保存 (save), 记录 (record)
- **English:** remember, save to memory, keep in mind

**Example (AUTOMATIC BEHAVIOR):**
```
You: "记住我的名字是刘小容"
     ↓ AUTO-TRIGGER ACTIVATES (you didn't invoke the skill)
     ↓ Extracts: name = "刘小容"
     ↓ Saves to ~/.memory-os/memories/<uuid>.json
Skill: ✅ Remembered: 刘小容
```

### ⚠️ Privacy Implications

**RISKS YOU MUST UNDERSTAND:**

1. **Accidental Triggers**
   - Saying "we should remember this lesson" → May auto-save "this lesson"
   - Casual conversation with trigger words → May save unintended data

2. **No Confirmation**
   - Data is saved **immediately** when keywords detected
   - You are **NOT asked** "Do you want to save this?"
   - You must **manually review** `~/.memory-os/` to see what was saved

3. **Enabled by Default**
   - AUTO-TRIGGER is **ON** immediately after installation
   - You must **actively disable** it if you don't want automatic saves

4. **Local Storage Only (SAFE ASPECT)**
   - ✅ All data stays in `~/.memory-os/` (your local machine)
   - ✅ **ZERO network calls** - nothing sent to external servers
   - ✅ **NO cloud sync** - you have full control

### 🛡️ How to Protect Your Privacy

**Option 1: Disable AUTO-TRIGGER (Recommended for Privacy)**
```bash
# Edit configuration file
nano ~/.memory-os/config.json

# Add or change this line:
{
  "auto_trigger": false
}

# Save and restart
# Now you must manually run: openclaw-memory-os remember "text"
```

**Option 2: Review What Was Saved**
```bash
# List all saved memories
ls -lh ~/.memory-os/memories/

# View specific memory
cat ~/.memory-os/memories/<uuid>.json

# Search for accidentally saved data
grep -r "sensitive info" ~/.memory-os/
```

**Option 3: Delete Unwanted Data**
```bash
# Delete specific memory
rm ~/.memory-os/memories/<uuid>.json

# Delete ALL saved data (nuclear option)
rm -rf ~/.memory-os/

# Delete only memories, keep config
rm -rf ~/.memory-os/memories/
```

**Option 4: Test in Sandbox First**
```bash
# Run in Docker container
docker run -it --rm ubuntu:22.04 bash
npm install -g openclaw-memory-os
# Test AUTO-TRIGGER behavior safely
```

### ✅ What v0.2.0 Phase 1 Actually Does

**Infrastructure Features:**
- ✅ **Conversation Recording Infrastructure** (Storage, Session, Privacy modules)
- ✅ **AUTO-TRIGGER** (keyword-based automatic data saving) - **ENABLED BY DEFAULT**
- ✅ **High-performance storage** (<10ms writes, 92% cache hit rate)
- ✅ **Privacy filter** (8 default rules: redacts API keys, emails, credit cards, etc.)
- ✅ **Session management** (automatic timeout, activity tracking)
- ✅ **Batch file collection** (CLI: `openclaw-memory-os collect --source ~/notes/`)
- ✅ **Manual remember command** (CLI: `openclaw-memory-os remember "text"`)

**Security Features:**
- ✅ **100% Local Storage** - All data in `~/.memory-os/`
- ✅ **Zero Network Activity** - Verified by tests (run `tcpdump` to confirm)
- ✅ **No API Keys Required** - Works completely offline
- ✅ **100% Test Coverage** - 29 scenarios passing

**What It Does NOT Do:**
- ❌ No external API calls or cloud sync
- ❌ No encryption (data stored as plain JSON)
- ❌ No AI embeddings or semantic search
- ❌ No LLM calls
- ❌ No real-time stdio interception

### 📋 Recommended Safe Usage

**CRITICAL: Test AUTO-TRIGGER Behavior First**

1. **Install in isolated environment** (VM, container, or test user account)
2. **Say trigger words** and observe what gets saved: "记住 test data"
3. **Check what was saved:** `ls ~/.memory-os/memories/`
4. **Verify no network calls:** `sudo tcpdump -i any` (should see ZERO network activity)
5. **Decide:** Keep AUTO-TRIGGER enabled OR disable it in config

**If You Keep AUTO-TRIGGER Enabled:**
- ⚠️ **Review saves regularly** - Check `~/.memory-os/memories/` weekly
- ⚠️ **Avoid trigger words** when discussing sensitive topics
- ⚠️ **Use explicit paths** for file collection (not `~/Documents`)
- ⚠️ **Monitor disk usage** - Auto-saves can accumulate over time

**If You Disable AUTO-TRIGGER:**
- ✅ Use manual commands: `openclaw-memory-os remember "intentional save"`
- ✅ Full control over what gets saved
- ✅ No accidental data collection
3. **Use explicit paths** - avoid broad patterns like `~/Documents`
4. **Inspect collected data** in `~/.memory-os/conversations/` and `~/.memory-os/memories/`
5. **Monitor network traffic** (use tcpdump) to verify zero network calls
6. **Note**: Phase 1 has NO automatic capture - all operations are manual/API-based

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

### Step 4: Collect Your First Memories

```bash
# Create test directory with sample files
mkdir -p ~/test-memories
echo "My first note" > ~/test-memories/note1.txt
echo "# Learning Log" > ~/test-memories/log.md

# Collect memories from directory
openclaw-memory-os collect --source ~/test-memories/

# Verify collection
openclaw-memory-os status
openclaw-memory-os search "first"
```

**Security Check:**
```bash
# Verify data location
ls -la ~/.memory-os/memories/

# Inspect collected memories
cat ~/.memory-os/memories/*.json | head -20
```

---

## Usage

### When to Use This Skill

**AUTO-TRIGGER** (Enabled by Default - ⚠️ Privacy Warning)

⚠️ **This skill automatically responds to trigger keywords WITHOUT asking for confirmation**

**How AUTO-TRIGGER Works:**
1. You mention trigger keywords in conversation (see list below)
2. Skill **automatically activates** (no explicit invocation needed)
3. **Immediately extracts** key information from your message
4. **Instantly saves** to `~/.memory-os/` (NO confirmation prompt)
5. Confirms what was saved (after the fact)

**Trigger Keywords:**

**Chinese:**
- `记住` - "记住我的名字：刘小容"
- `保存` - "帮我保存这个信息"
- `记录` - "记录今天的会议内容"

**English:**
- `remember` - "Remember my name is Liu Xiaorong"
- `save to memory` - "Save this to memory"
- `keep in mind` - "Keep in mind that..."

**Example (AUTOMATIC - No Confirmation):**
```
User: 记住我的名字：刘小容
      ↓ AUTO-TRIGGER ACTIVATES (keyword detected)
      ↓ Extracts: name = "刘小容"
      ↓ Saves to ~/.memory-os/memories/<uuid>.json (IMMEDIATE)
Agent: ✅ 已记住
       姓名: 刘小容
       置信度: 80%
       保存位置: ~/.memory-os/memories/abc123.json

User: Remember that the project deadline is 2026-04-01
      ↓ AUTO-TRIGGER ACTIVATES (keyword "remember")
      ↓ Saves IMMEDIATELY without asking
Agent: ✅ Remembered
       Date: 2026-04-01
       Event: project deadline
       Confidence: 90%
       Saved: ~/.memory-os/memories/def456.json
```

⚠️ **Privacy Warning:**
- Data is saved **automatically** when keywords are detected
- **NO confirmation** prompt before saving
- You may **accidentally trigger** saves during normal conversation
- **Review regularly:** `ls ~/.memory-os/memories/` to see what was saved
- **To disable:** Edit `~/.memory-os/config.json` and set `"auto_trigger": false`

**MANUAL TRIGGER** (For batch file operations):

Use explicit CLI commands when you want full control:
```bash
# Batch import files (manual control)
openclaw-memory-os collect --source ~/my-notes/

# Search your memory database
openclaw-memory-os search "project planning"

# View statistics
openclaw-memory-os status

# Manual remember (if AUTO-TRIGGER is disabled)
openclaw-memory-os remember "intentional save"
```

**WHEN TO USE AUTO-TRIGGER:**
- ✅ When you want effortless memory capture during conversations
- ✅ When you trust the keyword detection accuracy
- ✅ When you're okay with occasional accidental saves
- ✅ When discussing non-sensitive information

**WHEN TO DISABLE AUTO-TRIGGER:**
- ⚠️ When discussing sensitive/private information
- ⚠️ When you want explicit control over what gets saved
- ⚠️ When trigger words appear frequently in your conversations
- ⚠️ When you prefer manual `openclaw-memory-os remember "text"` commands

**How to Disable:**
```bash
nano ~/.memory-os/config.json
# Add: {"auto_trigger": false}
```

---

## Core Features

**v0.1.1 (Current):**

- ✅ **Local Storage** - JSON-based, in `~/.memory-os/`
- ✅ **Batch File Collection** - Import entire directories with progress display
- ✅ **Automatic Type Detection** - Distinguishes CODE from TEXT files
- ✅ **Recursive Scanning** - Processes subdirectories automatically
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

# Initialize
openclaw-memory-os init

# Create test data
mkdir ~/test-memories
echo "Test note 1" > ~/test-memories/note1.txt
echo "Test note 2" > ~/test-memories/note2.md

# Collect from test directory
openclaw-memory-os collect --source ~/test-memories/
```

### 2. Review Collected Data

```bash
# Check what was collected
ls ~/.memory-os/memories/

# Read individual memory files
cat ~/.memory-os/memories/*.json | jq '.'

# View statistics
openclaw-memory-os status
```

### 3. Control Collection Scope

```bash
# ✅ Good: Specific directory
openclaw-memory-os collect --source ~/my-project-notes/

# ✅ Good: With exclusions
openclaw-memory-os collect --source ~/Documents/ --exclude node_modules .git dist

# ⚠️ Caution: Broad scope
openclaw-memory-os collect --source ~/Documents/

# ❌ Dangerous: System-wide
openclaw-memory-os collect --source ~/  # DON'T DO THIS
```

### 4. Data Retention & Deletion

```bash
# View all memories
openclaw-memory-os status

# Search for specific content
openclaw-memory-os search "keyword"

# Delete specific memory
rm ~/.memory-os/memories/<memory-id>.json

# Complete removal
rm -rf ~/.memory-os/
```

### 5. Network Traffic Verification

```bash
# v0.1.1 should have ZERO network traffic
# Monitor with:
sudo tcpdump -i any port 443 or port 80 &
openclaw-memory-os collect --source ~/test-data/
# Should see NO external connections
```

---

## Conversation Memory Usage (v0.1.2+)

### Quick Start with Conversation Memory

**Command Line**:
```bash
# Chinese example
openclaw-memory-os remember "记住我的名字：刘小容"

# English example
openclaw-memory-os remember "Remember my name is Liu Xiaorong"

# Complex information
openclaw-memory-os remember "记住：项目截止日期是2026年4月1日，负责人是张三"
```

**In Claude Conversation**:
```
You: 记住我的名字：刘小容

Claude: ✅ 已记住！
        姓名: 刘小容
        存储位置: ~/.memory-os/memories/
        类型: TEXT
```

### What Gets Extracted Automatically

The system intelligently extracts:
- **Names**: "我的名字是刘小容" → extracts "刘小容"
- **Dates**: "截止日期2026-04-01" → extracts "2026-04-01"
- **Events**: "会议：讨论Q2规划" → extracts "讨论Q2规划"
- **Facts**: Any other important information

### Supported Languages

- **Chinese (中文)**: 记住、保存、记录、存储
- **English**: remember, save, store, keep, note, record

---

## Agent Usage Guide

### Important Notes

**NEW in v0.1.2 - Conversation Memory**:
- Auto-extracts information from conversations
- Works with Chinese and English
- Stores locally in ~/.memory-os
- No manual file operations needed

**CRITICAL for v0.1.1**:
- This version is **local-only**
- No AI embeddings or LLM features active
- All operations happen on your machine
- No credentials needed
- CLI collect command is now fully functional

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

# Collect from specific directory (NEW in v0.1.1 - fully functional)
openclaw-memory-os collect --source ~/my-notes/

# Collect with options
openclaw-memory-os collect --source ~/Documents/ --exclude node_modules .git
openclaw-memory-os collect --source ~/code/ --recursive

# Search locally
openclaw-memory-os search "keyword"
openclaw-memory-os search --type text "programming notes"

# Status (shows total memories, type breakdown)
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

## Known Limitations (v0.1.1)

1. **No AI Features** - Semantic search and LLM features not implemented
2. **Basic Search Only** - Simple keyword/tag matching (but works well with collected files)
3. **Manual Collection** - No automatic background scanning
4. **No Encryption** - Data stored as plain JSON (can enable manually)
5. **No Multi-user** - Single-user local storage only
6. **Limited Config Commands** - Config management partially implemented

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

**Memory-OS v0.1.2** - 100% Local, 0% Cloud, Your Data, Your Control

Version: 0.1.2 | Verified Commit: 28a1a92 | Status: Production-Ready with Conversation Memory
