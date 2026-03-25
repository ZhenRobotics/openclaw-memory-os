# 视频生成流水线

完整的自动化视频生成流水线文档。

## 概述

本项目实现了一个完全自动化的视频生成流水线，只需要提供文本脚本，即可生成配音、时间戳、场景编排并最终渲染视频。

## 架构图

```
┌─────────────┐
│ 文本脚本    │
│ script.txt  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  TTS 配音   │  OpenAI TTS API
│  audio.mp3  │  voice: nova, speed: 1.15
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Whisper     │  OpenAI Whisper API
│ 时间戳提取  │  verbose_json format
│ timestamps  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 场景转换    │  timestamps-to-scenes.js
│ scenes-data │  自动检测场景类型
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Remotion    │  React + TypeScript
│ 视频渲染    │  赛博线框风格
│ video.mp4   │
└─────────────┘
```

## 核心组件

### 1. TTS 语音生成

**脚本：** `scripts/tts-generate.sh`

**功能：**
- 将文本转换为自然的中文语音
- 支持 6 种不同声音
- 可调节语速 (0.25-4.0x)

**推荐配置：**
```bash
voice: nova        # 清晰活力的女声
speed: 1.15       # 稍快，适合短视频
```

### 2. Whisper 时间戳提取

**脚本：** `scripts/whisper-timestamps.sh`

**功能：**
- 从音频中提取精确的文字和时间戳
- 自动分段识别
- 输出 JSON 格式

**输出格式：**
```json
[
  {
    "start": 0.0,
    "end": 3.46,
    "text": "三家巨头同一天说了一件事"
  },
  ...
]
```

### 3. 场景数据转换

**脚本：** `scripts/timestamps-to-scenes.js`

**功能：**
- 将 Whisper 时间戳转换为 Remotion 场景数据
- 智能检测场景类型 (title/emphasis/pain/content/end)
- 自动提取关键词高亮
- 生成 TypeScript 类型安全的代码

**场景类型检测规则：**
```javascript
第一个片段 → title (标题)
最后一个片段 → end (结尾)
包含百分比 → emphasis (强调)
包含"说"/"问题" → pain (痛点)
包含"真相"/"但" → content (内容)
其他 → content (默认)
```

**关键词高亮：**
- Copilot, GPT, Gemini, AI
- 百分比 (90%, 10倍)

### 4. Remotion 视频渲染

**主组件：** `src/CyberWireframe.tsx`

**功能：**
- React 组件驱动的视频生成
- 赛博线框视觉风格
- 6 种不同动画效果
- 支持音频同步

**场景动画类型：**

1. **title** (标题) - 故障效果 + 弹簧缩放
2. **emphasis** (强调) - 放大弹出效果
3. **pain** (痛点) - 震动 + 红色警告
4. **circle** (重点标记) - 旋转圆环高亮
5. **content** (内容) - 平滑淡入
6. **end** (结尾) - 上滑淡出

## 使用方法

### 方式 1: 一键生成 (推荐)

使用 `script-to-video.sh` 完成整个流程：

```bash
# 1. 创建文本脚本
cat > scripts/my-video.txt <<'EOF'
三家巨头同一天说了一件事。
微软说Copilot已经能写掉百分之九十的代码。
OpenAI说GPT5能替代大部分程序员。
Google说Gemini2.0改变游戏规则。
但真相是什么？
AI不会取代开发者，而是让优秀开发者效率提升十倍。
关注我学习AI工具。
EOF

# 2. 运行流水线
./scripts/script-to-video.sh scripts/my-video.txt

# 3. 查看结果
mpv out/my-video.mp4
```

### 方式 2: 分步执行

手动执行每个步骤：

```bash
# 步骤 1: 生成 TTS 语音
./scripts/tts-generate.sh "你的文本内容" \
  --out audio/my-audio.mp3 \
  --voice nova \
  --speed 1.15

# 步骤 2: 提取时间戳
./scripts/whisper-timestamps.sh audio/my-audio.mp3

# 步骤 3: 转换场景数据
node scripts/timestamps-to-scenes.js audio/my-audio-timestamps.json

# 步骤 4: 渲染视频
pnpm exec remotion render Main out/my-video.mp4 \
  --props '{"audioPath": "audio/my-audio.mp3"}'
```

### 方式 3: 手动编辑场景

如果需要更精细的控制，可以手动编辑 `src/scenes-data.ts`：

```typescript
export const scenes: SceneData[] = [
  {
    start: 0,
    end: 3.46,
    type: "title",
    title: "你的标题",
    xiaomo: "peek"  // 可选：小墨动作
  },
  {
    start: 3.46,
    end: 5.9,
    type: "emphasis",
    title: "重点强调的内容",
    highlight: "关键词",  // 高亮显示
    xiaomo: "think"
  },
  // ... 更多场景
];
```

然后直接渲染：

```bash
pnpm exec remotion render Main out/custom-video.mp4
```

## 输出格式

### 视频规格

- **分辨率**: 1080 x 1920 (竖屏)
- **帧率**: 30 fps
- **格式**: MP4 (H.264)
- **音频**: AAC, 24kHz

### 文件结构

```
openclaw-video/
├── audio/
│   ├── my-video.mp3                    # TTS 生成的音频
│   └── my-video-timestamps.json        # Whisper 时间戳
├── src/
│   └── scenes-data.ts                  # 场景数据 (自动生成)
└── out/
    └── my-video.mp4                    # 最终视频
```

## 高级配置

### 自定义视频参数

编辑 `src/scenes-data.ts` 中的 `videoConfig`:

```typescript
export const videoConfig = {
  fps: 30,              // 帧率
  width: 1080,          // 宽度
  height: 1920,         // 高度
  durationInFrames: 450,  // 总帧数 (自动计算)
  audioPath: "audio/my-audio.mp3"  // 音频路径
};
```

### 自定义视觉风格

编辑 `src/SceneRenderer.tsx` 修改动画效果和样式：

```typescript
// 修改背景色
backgroundColor: '#0A0A0F'  // 深色赛博风格

// 修改主色调
color: '#00F5FF'  // 青色霓虹

// 修改动画参数
spring({
  frame,
  fps,
  from: 0.8,
  to: 1,
  config: { damping: 10, stiffness: 100 }
})
```

### 自定义场景类型检测

编辑 `scripts/timestamps-to-scenes.js` 中的检测规则：

```javascript
function determineSceneType(index, total, text) {
  if (index === 0) return 'title';
  if (index === total - 1) return 'end';

  // 添加你的自定义规则
  if (text.includes('重要')) return 'emphasis';
  if (text.includes('问题')) return 'pain';

  return 'content';
}
```

## 性能优化

### 渲染加速

```bash
# 使用并行渲染
pnpm exec remotion render Main out/video.mp4 \
  --concurrency 4

# 降低质量以加快预览
pnpm exec remotion render Main out/preview.mp4 \
  --quality 50
```

### 成本优化

| 组件 | 成本 | 优化建议 |
|------|------|----------|
| TTS | $0.015/1K字符 | 使用 tts-1 而非 tts-1-hd |
| Whisper | $0.006/分钟 | 批量处理多个音频 |
| Remotion | 本地免费 | 使用本地渲染 |

## 故障排查

### TTS 问题

```bash
# 测试 TTS
./scripts/test-tts.sh
```

常见问题：
- `Missing OPENAI_API_KEY` → 设置环境变量
- `curl: (35)` → 网络连接问题

### Whisper 问题

```bash
# 使用示例数据测试
node scripts/timestamps-to-scenes.js audio/example-timestamps.json
```

常见问题：
- 时间戳不准确 → 音频质量问题
- 识别错误 → 使用更清晰的 TTS 语音

### Remotion 问题

```bash
# 开发模式预览
pnpm dev
```

常见问题：
- 场景不显示 → 检查时间戳范围
- 音频不同步 → 验证 audioPath 路径

## 示例项目

### 示例 1: 技术讲解视频

```bash
cat > scripts/tech-tutorial.txt <<'EOF'
今天教大家如何使用AI工具。
第一步，安装必要的软件。
第二步，配置API密钥。
第三步，开始使用。
是不是很简单？
关注我学习更多技巧。
EOF

./scripts/script-to-video.sh scripts/tech-tutorial.txt \
  --voice alloy \
  --speed 1.0
```

### 示例 2: 快节奏短视频

```bash
cat > scripts/quick-tips.txt <<'EOF'
三个AI工具改变你的工作效率。
第一个，GPT帮你写代码。
第二个，Whisper帮你转写音频。
第三个，Remotion帮你生成视频。
试试看，效率提升十倍！
EOF

./scripts/script-to-video.sh scripts/quick-tips.txt \
  --voice nova \
  --speed 1.3
```

## 扩展功能

### 未来计划

- [ ] 支持多语言 TTS
- [ ] 添加更多视觉风格模板
- [ ] 集成背景音乐
- [ ] 自动字幕生成
- [ ] Agent 自动化选题和脚本生成

## 相关文档

- [TTS.md](./TTS.md) - TTS 语音生成详细文档
- [WHISPER.md](./WHISPER.md) - Whisper 时间戳提取
- [REMOTION.md](./REMOTION.md) - Remotion 视频渲染
- [AGENT.md](./AGENT.md) - Agent 自动化工作流

## 支持

遇到问题？
1. 查看各组件的详细文档
2. 运行测试脚本验证各个环节
3. 检查日志输出定位问题
