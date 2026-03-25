# OpenClaw Memory-OS v0.1.2 Release Notes

**发布日期**: 2026-03-25
**版本类型**: Feature Release (Minor)

---

## 🎉 主要新功能：对话记忆自动提取

### 核心特性

#### 1. 智能记忆提取器 (MemoryExtractor)

**功能**：
- 从自然语言对话中自动提取关键信息
- 支持中文和英文双语
- 智能实体识别（姓名、日期、事件）
- 置信度评分系统

**提取能力**：
```
输入: "记住我的名字：刘小容"
输出: ✅ 已记住
      姓名: 刘小容
      置信度: 80%
```

**支持的实体类型**：
- **姓名**: 中文姓名（2-4字）、英文姓名
- **日期**: 2026-04-01, 2026年4月1日, 04-01
- **事件**: 会议、任务、项目、活动
- **事实**: 任意重要信息

#### 2. 新CLI命令: `remember`

**用法**：
```bash
# 中文示例
openclaw-memory-os remember "记住我的名字：刘小容"
openclaw-memory-os remember "帮我保存项目截止日期：2026-04-01"

# 英文示例
openclaw-memory-os remember "Remember my name is Liu Xiaorong"
openclaw-memory-os remember "Keep in mind that the deadline is April 1st"
```

**特点**：
- 自动语言检测
- 友好的确认反馈
- 本地存储（~/.memory-os）
- 即时可搜索

#### 3. AUTO-TRIGGER 支持

**触发关键词**：

中文：
- 记住
- 保存
- 记录
- 存储

英文：
- remember
- save
- store
- keep
- note
- record

**工作流程**：
1. 在对话中说"记住..."
2. 系统自动提取关键信息
3. 存储到本地数据库
4. 返回确认和摘要

---

## 🆚 版本对比

### v0.1.1 → v0.1.2

| 特性 | v0.1.1 | v0.1.2 |
|------|--------|--------|
| **文件批量导入** | ✅ | ✅ |
| **对话记忆提取** | ❌ | ✅ NEW |
| **自动触发支持** | ❌ | ✅ NEW |
| **实体识别** | ❌ | ✅ NEW |
| **双语支持** | 部分 | ✅ 完整 |
| **CLI版本显示** | 0.1.0 | ✅ 0.1.2 |

---

## 📊 技术实现

### 新增文件

1. **src/conversation/memory-extractor.ts** (260+ lines)
   - 核心提取逻辑
   - 正则模式匹配
   - 置信度计算
   - 多语言支持

2. **test-conversation-memory.sh** (250+ lines)
   - 完整测试套件
   - 11个测试场景
   - 自动化验证

### 修改文件

1. **src/cli/index.ts**
   - 添加 `remember` 命令
   - 更新版本号到 0.1.2

2. **clawhub-upload/skill.md**
   - 新增对话记忆使用指南
   - 更新AUTO-TRIGGER说明
   - 添加触发关键词列表

3. **clawhub-upload/readme.md**
   - 更新版本信息
   - 添加对话记忆示例

---

## 🧪 测试覆盖

### 测试场景 (11项)

1. ✅ 中文姓名提取 - 基本格式
2. ✅ 中文姓名提取 - 复杂表达
3. ✅ 英文姓名提取 - 标准格式
4. ✅ 英文姓名提取 - I am 格式
5. ✅ 日期提取 - 完整格式
6. ✅ 日期提取 - 中文格式
7. ✅ 事件提取 - 会议
8. ✅ 事件提取 - 任务
9. ✅ 复杂信息 - 多实体
10. ✅ 触发词检测
11. ✅ 记忆存储与搜索集成

### 运行测试

```bash
chmod +x test-conversation-memory.sh
./test-conversation-memory.sh
```

---

## 📚 使用示例

### 场景1：记住个人信息

```bash
$ openclaw-memory-os remember "记住我的名字是刘小容"

💭 分析对话内容...
✅ 记忆已保存！

已记住
姓名: 刘小容

置信度: 80%
语言: 中文
类型: text
```

### 场景2：记录项目信息

```bash
$ openclaw-memory-os remember "记住：项目截止日期是2026年4月1日，负责人是张三"

💭 分析对话内容...
✅ 记忆已保存！

已记住
姓名: 张三
日期: 2026年4月1日

置信度: 90%
语言: 中文
类型: text
```

### 场景3：英文记忆

```bash
$ openclaw-memory-os remember "Remember that the project deadline is 2026-04-01"

💭 分析对话内容...
✅ 记忆已保存！

Remembered
Date: 2026-04-01
Event: project deadline

置信度: 90%
语言: English
类型: text
```

---

## 🔄 升级指南

### 从 v0.1.1 升级

**无破坏性更改**，所有v0.1.1功能保持完全兼容。

**升级步骤**：

```bash
# 1. 安装新版本
npm install -g openclaw-memory-os@0.1.2

# 2. 验证版本
openclaw-memory-os --version
# 应显示: 0.1.2

# 3. 测试新功能
openclaw-memory-os remember "记住测试信息"

# 4. 原有功能继续可用
openclaw-memory-os collect --source ~/notes/
openclaw-memory-os search "关键词"
openclaw-memory-os status
```

**数据兼容性**：
- ✅ 完全兼容v0.1.1数据格式
- ✅ 无需迁移现有数据
- ✅ 新旧功能并存

---

## 🎯 解决的问题

### 问题：README定位过于狭隘

**v0.1.1**：
- 标题：数字永生服务
- 实际：文件管理CLI工具
- 差距：愿景与现实不符

**v0.1.2**：
- ✅ 添加对话记忆功能
- ✅ 支持自然语言交互
- ✅ 自动信息提取
- 🎯 向"数字永生"愿景迈进

### 问题：为什么没被优先调用

**v0.1.1**：
- ❌ 仅手动触发
- ❌ 无AUTO-TRIGGER
- ❌ 不适合对话场景

**v0.1.2**：
- ✅ AUTO-TRIGGER支持
- ✅ 对话场景优化
- ✅ 自然语言理解
- 🎯 可在对话中自动调用

---

## 🛡️ 安全性

### 持续保持的安全特性

- ✅ **100% 本地运行** - 无网络调用
- ✅ **零外部API** - 完全离线
- ✅ **无需凭证** - 不要求API密钥
- ✅ **数据私有** - 存储在 ~/.memory-os
- ✅ **人类可读** - JSON格式
- ✅ **完全控制** - 用户拥有所有数据

### 新功能安全验证

- ✅ 纯本地处理 - 无数据传输
- ✅ 正则提取 - 无AI模型调用
- ✅ 透明逻辑 - 可审计代码
- ✅ 可选功能 - 用户完全控制

---

## 🚀 下一步计划

### v0.2.0 (AI集成) - 计划中

**将引入**：
- 语义搜索（需要OpenAI/Anthropic API密钥）
- 向量化存储
- 智能知识图谱
- LLM驱动的对话记忆助手

**安全措施**：
- 明确的API密钥配置
- 用户同意每次API调用
- 本地优先模式
- 可选的加密存储

---

## 📝 总结

### v0.1.2 亮点

1. **对话记忆** - 从自然语言提取信息
2. **AUTO-TRIGGER** - 自动响应触发词
3. **双语支持** - 中英文完整支持
4. **实体识别** - 姓名、日期、事件自动提取
5. **零破坏** - 完全向后兼容

### 升级建议

**推荐立即升级**：
- ✅ 无破坏性更改
- ✅ 增强功能体验
- ✅ 向数字永生愿景迈进
- ✅ 适合对话场景使用

---

**OpenClaw Memory-OS v0.1.2** - 让记忆像对话一样自然！

**发布者**: Claude Sonnet 4.5
**发布日期**: 2026-03-25
**状态**: ✅ Production Ready
