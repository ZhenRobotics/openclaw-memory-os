# 视频生成 Agent

自动化视频生成的智能 Agent，通过自然语言交互即可生成专业短视频。

## 概述

**墨影** 是一个专业的视频生成助手 Agent，它可以：
- 📝 理解自然语言请求
- 🎬 自动生成完整视频（从文本到视频）
- 🔍 分析和优化脚本
- 🎨 提供视频制作建议

## 快速开始

### 安装依赖

```bash
cd /home/justin/openclaw-video
pnpm install
```

### 使用 Agent

#### 方式 1: 命令行工具

```bash
# 生成视频
./agents/video-cli.sh generate "三家巨头同一天说了一件事。微软说Copilot已经能写掉90%的代码。"

# 优化脚本
./agents/video-cli.sh optimize "这是我的脚本内容"

# 获取帮助
./agents/video-cli.sh help
```

#### 方式 2: 直接调用

```bash
# 使用自然语言直接调用
node -r ts-node/register agents/video-agent.ts "帮我生成一个关于 AI 工具的视频"

# 测试完整流程
node -r ts-node/register agents/tools.ts test
```

#### 方式 3: OpenClaw 集成

```bash
# 通过 OpenClaw CLI
openclaw message send \
  --agent video-generator \
  "帮我生成一个关于 AI 工具的短视频"
```

## Agent 能力

### 1. 视频生成

Agent 可以从文本脚本自动生成完整视频。

**输入示例：**
```
"帮我生成一个关于 AI 工具的视频"
"做个视频：三家巨头同一天说了一件事..."
"脚本：AI 正在改变世界"
```

**处理流程：**
1. 🔍 分析脚本内容和长度
2. 🎤 使用 TTS 生成语音
3. ⏱️  使用 Whisper 提取时间戳
4. 🎬 转换为 Remotion 场景数据
5. 🎨 渲染最终视频

**输出：**
```
✅ 视频生成完成！

📹 视频路径：/home/justin/openclaw-video/out/generated.mp4

执行步骤：
  🔍 Step 1/5: Analyzing script...
  📊 原脚本分析：6 句话，预计 15.0 秒
  ✅ 脚本长度适中
  🚀 快节奏风格：每句话尽量简短有力，使用数字和对比
  🎯 检测到关键词：AI、GPT、Copilot，将自动高亮显示
  🎤 Step 2/5: Generating speech...
  ✅ Audio generated: /home/justin/openclaw-video/audio/generated.mp3
  ⏱️  Step 3/5: Extracting timestamps...
  ✅ Timestamps extracted: /home/justin/openclaw-video/audio/generated-timestamps.json
  🎬 Step 4/5: Creating scenes...
  ✅ Scenes created: /home/justin/openclaw-video/src/scenes-data.ts
  🎨 Step 5/5: Rendering video...
  ✅ Video rendered: /home/justin/openclaw-video/out/generated.mp4
```

### 2. 脚本优化

Agent 可以分析脚本质量并提供优化建议。

**输入示例：**
```
"帮我分析一下这个脚本"
"检查脚本：[脚本内容]"
"这个脚本适合做视频吗？"
```

**输出示例：**
```
📝 脚本分析完成

📊 原脚本分析：6 句话，预计 15.0 秒
✅ 脚本长度适中
🚀 快节奏风格：每句话尽量简短有力，使用数字和对比
💡 建议：加入具体数字（如"90%"、"10倍"）增强说服力
🎯 检测到关键词：AI、GPT，将自动高亮显示

优化后的脚本：
[优化后的内容]
```

### 3. 帮助和指导

Agent 可以提供使用指导和建议。

**输入示例：**
```
"帮助"
"help"
"怎么使用？"
```

## 自然语言理解

Agent 支持自然语言输入，可以理解多种表达方式：

### 视频生成请求

- ✅ "帮我生成一个关于 AI 工具的视频"
- ✅ "做个视频：三家巨头同一天说了一件事..."
- ✅ "脚本：AI 正在改变世界"
- ✅ "三家巨头同一天说了一件事..." (直接输入脚本)

### 脚本优化请求

- ✅ "帮我分析一下这个脚本"
- ✅ "检查脚本：[内容]"
- ✅ "优化这个脚本"
- ✅ "这个脚本适合做视频吗？"

### 配置选项

可以在请求中指定配置：

- ✅ "用 nova 声音生成视频"
- ✅ "语速 1.2"
- ✅ "声音：alloy"

## 工具函数

Agent 内部使用以下工具函数：

### 1. optimize_script

分析和优化视频脚本。

```typescript
optimize_script({
  original_script: "你的脚本",
  target_duration: 15,  // 目标时长（秒）
  style: "快节奏"       // 视频风格
})
```

**输出：**
- 优化后的脚本
- 分析建议列表
- 预计时长

### 2. generate_tts

生成 TTS 语音。

```typescript
generate_tts({
  text: "要转换的文本",
  voice: "nova",       // 声音类型
  speed: 1.15,         // 语速
  output_file: "audio.mp3"
})
```

### 3. extract_timestamps

提取音频时间戳。

```typescript
extract_timestamps({
  audio_file: "audio/audio.mp3"
})
```

### 4. generate_scenes

生成 Remotion 场景数据。

```typescript
generate_scenes({
  timestamps_file: "audio/timestamps.json"
})
```

### 5. render_video

渲染最终视频。

```typescript
render_video({
  output_file: "video.mp4",
  audio_file: "audio/audio.mp3"
})
```

### 6. complete_pipeline

完整流水线（自动调用所有步骤）。

```typescript
complete_pipeline(
  "你的脚本",
  {
    voice: "nova",
    speed: 1.15,
    output_name: "my-video"
  }
)
```

## 配置选项

### TTS 声音

可用声音：
- `alloy` - 中性声音
- `echo` - 男声
- `fable` - 英式男声
- `onyx` - 低沉男声
- `nova` - 女声，活力 ⭐ **推荐**
- `shimmer` - 柔和女声

### 语速

- 范围：0.25 - 4.0
- 推荐：1.15 (稍快，适合短视频)
- 慢速：0.9 - 1.0 (教程视频)
- 快速：1.3 - 1.5 (快节奏短视频)

### 视频风格

- `快节奏` - 短句、数字、对比 (默认)
- `教程` - 结构化、步骤化
- `讲解` - 平稳、详细
- `营销` - 强调、吸引

## 测试

### 运行完整测试

```bash
cd /home/justin/openclaw-video
./agents/test-agent.sh
```

测试包括：
1. ✅ 帮助信息显示
2. ✅ 脚本优化功能
3. ✅ 完整视频生成

### 单独测试工具

```bash
# 测试工具函数
node -r ts-node/register agents/tools.ts test

# 测试 Agent
node -r ts-node/register agents/video-agent.ts "帮助"
```

## 集成到 OpenClaw

详见 [OpenClaw 集成指南](./openclaw-integration.md)。

### 快速集成

```bash
# 1. 复制 Agent 配置
cp agents/video-generator.json ~/.openclaw/agents/

# 2. 使用 Agent
openclaw message send \
  --agent video-generator \
  "帮我生成一个关于 AI 工具的视频"
```

## 架构设计

```
用户输入（自然语言）
    ↓
parseInput() - 解析意图
    ↓
handleRequest() - 路由请求
    ↓
┌─────────────────────────────────┐
│  generate_video                 │
│  - optimize_script()            │
│  - generate_tts()               │
│  - extract_timestamps()         │
│  - generate_scenes()            │
│  - render_video()               │
└─────────────────────────────────┘
    ↓
返回结果（视频路径 + 步骤日志）
```

## 成本

每个 15 秒视频的成本：
- TTS: ~$0.001
- Whisper: ~$0.0015
- Remotion: 免费（本地渲染）
- **总计：~$0.003 (不到 1 美分)**

## 高级用法

### 自定义脚本

创建自己的脚本文件：

```bash
cat > scripts/my-script.txt <<'EOF'
你的脚本内容
EOF

# 使用脚本文件生成视频
./scripts/script-to-video.sh scripts/my-script.txt
```

### 批量生成

```bash
# 批量生成多个视频
for script in scripts/*.txt; do
  ./agents/video-cli.sh generate "$(cat $script)"
done
```

### 自定义场景

生成后手动编辑场景数据：

```bash
# 1. 生成基础场景
node -r ts-node/register agents/video-agent.ts "生成视频：..."

# 2. 手动编辑场景
nano src/scenes-data.ts

# 3. 重新渲染
pnpm exec remotion render Main out/custom.mp4
```

## 故障排查

### 问题：找不到 ts-node

```bash
# 安装依赖
pnpm install
```

### 问题：OpenAI API 错误

```bash
# 设置 API Key
export OPENAI_API_KEY="sk-..."
```

### 问题：Remotion 渲染失败

```bash
# 测试 Remotion
pnpm dev

# 检查依赖
pnpm install
```

### 问题：生成的视频没有声音

检查音频路径是否正确：

```bash
# 查看场景数据
cat src/scenes-data.ts | grep audioPath
```

## 扩展功能

### 添加新工具

在 `agents/tools.ts` 中添加：

```typescript
export async function my_tool(params: MyParams): Promise<MyResult> {
  // 实现逻辑
}
```

### 自定义场景检测

修改 `scripts/timestamps-to-scenes.js`：

```javascript
function determineSceneType(index, total, text) {
  // 添加自定义规则
  if (text.includes('重要')) return 'emphasis';
  // ...
}
```

### 自定义系统提示词

编辑 `agents/video-generator.json`：

```json
{
  "systemPrompt": "你是墨影，一个专业的视频生成助手..."
}
```

## 相关文档

- [PIPELINE.md](./PIPELINE.md) - 完整流水线文档
- [TTS.md](./TTS.md) - TTS 语音生成
- [WHISPER.md](./WHISPER.md) - Whisper 时间戳提取
- [openclaw-integration.md](../agents/openclaw-integration.md) - OpenClaw 集成指南

## 示例对话

### 示例 1: 简单生成

```
用户: 帮我生成一个关于 AI 工具的视频

Agent: 好的！我来帮你创建一个关于 AI 工具的短视频。

[执行流程...]

✅ 视频生成完成！
📹 视频路径：out/generated.mp4
```

### 示例 2: 带配置

```
用户: 用 alloy 声音，语速 1.2，生成视频：AI 改变世界

Agent: 收到！使用以下配置：
- 声音：alloy
- 语速：1.2

[执行流程...]

✅ 完成！
```

### 示例 3: 脚本优化

```
用户: 帮我分析这个脚本：三个AI工具提升效率

Agent: 📝 脚本分析：
📊 原脚本分析：1 句话，预计 2.5 秒
⚠️  脚本稍短，可以增加更多内容或细节
💡 建议：加入具体数字增强说服力

优化建议：可以扩展为：
"三个AI工具提升效率十倍。第一个..."
```

## 未来计划

- [ ] 支持多种视觉风格模板
- [ ] 自动添加背景音乐
- [ ] 自动字幕生成
- [ ] 多语言支持
- [ ] 视频片段剪辑和组合
- [ ] 智能选题和脚本生成

---

**用 AI Agent 生成视频，就这么简单！** 🎬✨
