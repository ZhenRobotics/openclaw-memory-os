# Whisper 时间戳提取

本文档介绍如何使用 OpenAI Whisper API 从音频中提取精确的文字和时间戳。

## 概述

Whisper 是 OpenAI 的语音识别模型，支持多语言转录并提供精确的时间戳信息。我们使用 `verbose_json` 格式来获取段落级别的时间戳，用于视频场景编排。

## 可用脚本

### 1. `scripts/whisper-timestamps.sh` - 时间戳提取

从音频文件提取分段文字和时间戳。

**用法：**
```bash
./scripts/whisper-timestamps.sh <音频文件> [选项]
```

**选项：**
- `--out <文件>` - 输出 JSON 文件路径 (默认: `<音频文件名>-timestamps.json`)

**示例：**
```bash
# 基本用法 (自动输出到 audio/my-audio-timestamps.json)
./scripts/whisper-timestamps.sh audio/my-audio.mp3

# 自定义输出路径
./scripts/whisper-timestamps.sh audio/my-audio.mp3 \
  --out data/timestamps.json
```

**输出格式：**
```json
[
  {
    "start": 0.0,
    "end": 3.46,
    "text": "三家巨头同一天说了一件事"
  },
  {
    "start": 3.46,
    "end": 5.90,
    "text": "微软说Copilot已经能写掉90%的代码"
  }
]
```

### 2. `scripts/timestamps-to-scenes.js` - 场景转换

将 Whisper 时间戳转换为 Remotion 场景数据。

**用法：**
```bash
node scripts/timestamps-to-scenes.js <timestamps.json> [选项]
```

**选项：**
- `--out <文件>` - 输出 TypeScript 文件路径 (默认: `src/scenes-data.ts`)

**示例：**
```bash
# 基本用法
node scripts/timestamps-to-scenes.js audio/my-audio-timestamps.json

# 自定义输出
node scripts/timestamps-to-scenes.js audio/timestamps.json \
  --out src/custom-scenes.ts
```

**输出：**
生成类型安全的 TypeScript 代码：

```typescript
import { SceneData } from './types';

// Auto-generated from Whisper timestamps
// Generated at: 2026-03-02T16:35:23.820Z
export const scenes: SceneData[] = [
  {
    "start": 0,
    "end": 3.46,
    "type": "title",
    "title": "三家巨头同一天说了一件事",
    "xiaomo": "peek"
  },
  {
    "start": 3.46,
    "end": 5.9,
    "type": "emphasis",
    "title": "微软说Copilot已经能写掉90%的代码",
    "highlight": "Copilot",
    "xiaomo": "think"
  }
];

export const videoConfig = {
  fps: 30,
  width: 1080,
  height: 1920,
  durationInFrames: 450,  // 15.00 seconds * 30 fps
  audioPath: undefined,
};
```

### 3. `scripts/test-whisper.sh` - 完整测试

端到端测试 TTS + Whisper + 场景转换流程。

**用法：**
```bash
./scripts/test-whisper.sh
```

**流程：**
1. 使用 OpenAI TTS 生成测试音频
2. 使用 Whisper 提取时间戳
3. 转换为 Remotion 场景数据

## 技术细节

### API 调用

使用 OpenAI `/v1/audio/transcriptions` 端点：

```bash
curl https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F "file=@audio.mp3" \
  -F "model=whisper-1" \
  -F "response_format=verbose_json" \
  -F "timestamp_granularities[]=segment"
```

**参数说明：**
- `model`: `whisper-1` (OpenAI 的生产模型)
- `response_format`: `verbose_json` (包含完整时间戳信息)
- `timestamp_granularities`: `segment` (段落级别时间戳)

### 响应格式

Whisper API 返回的 `verbose_json` 格式：

```json
{
  "task": "transcribe",
  "language": "zh",
  "duration": 15.0,
  "text": "完整转录文本...",
  "segments": [
    {
      "id": 0,
      "seek": 0,
      "start": 0.0,
      "end": 3.46,
      "text": "三家巨头同一天说了一件事",
      "tokens": [123, 456, ...],
      "temperature": 0.0,
      "avg_logprob": -0.2,
      "compression_ratio": 1.5,
      "no_speech_prob": 0.001
    }
  ]
}
```

我们使用 `jq` 提取关键字段：

```bash
jq '[.segments[] | {start: .start, end: .end, text: .text}]'
```

### 场景类型检测

`timestamps-to-scenes.js` 使用以下规则自动检测场景类型：

```javascript
function determineSceneType(index, total, text) {
  // 第一个片段 → 标题场景
  if (index === 0) return 'title';

  // 最后一个片段 → 结尾场景
  if (index === total - 1) return 'end';

  // 包含百分比 → 强调场景
  if (text.includes('90%') || text.includes('%')) return 'emphasis';

  // 包含特定关键词 → 痛点场景
  if (text.includes('说') || text.includes('问题')) return 'pain';

  // 包含转折词 → 内容场景
  if (text.includes('真相') || text.includes('但')) return 'content';

  // 默认 → 内容场景
  return 'content';
}
```

### 关键词提取

自动检测并高亮显示关键词：

```javascript
function extractHighlight(text) {
  const keywords = [
    'Copilot',
    'GPT',
    'GPT-5',
    'GPT5',
    'Gemini',
    'AI',
    '90%',
    '10倍'
  ];

  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      return keyword;
    }
  }

  return null;
}
```

### 小墨动作映射

根据场景类型自动分配小墨角色动作：

```javascript
function determineXiaomo(sceneType) {
  const actions = {
    'title': 'peek',      // 探头
    'emphasis': 'think',  // 思考
    'pain': null,         // 无动作
    'circle': 'circle',   // 画圈
    'content': 'point',   // 指点
    'end': 'wave',        // 挥手
  };
  return actions[sceneType] || null;
}
```

## 配置

### 环境变量

需要设置 `OPENAI_API_KEY`：

```bash
export OPENAI_API_KEY="sk-..."
```

### 自定义检测规则

编辑 `scripts/timestamps-to-scenes.js` 来自定义场景检测：

```javascript
function determineSceneType(index, total, text) {
  // 添加你的自定义规则
  if (text.includes('重要')) return 'emphasis';
  if (text.includes('注意')) return 'pain';
  if (text.includes('总结')) return 'content';

  // 保留默认规则
  if (index === 0) return 'title';
  if (index === total - 1) return 'end';

  return 'content';
}
```

### 自定义关键词

```javascript
function extractHighlight(text) {
  // 添加你的关键词
  const keywords = [
    'AI',
    'Python',
    'React',
    'TypeScript',
    '重要',
    '关键',
    // ...
  ];

  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      return keyword;
    }
  }

  return null;
}
```

## 精度和质量

### 时间戳精度

- **segment 级别**: 精确到 0.01 秒
- **适合场景**: 视频场景切换、字幕同步
- **准确度**: 95%+ (取决于音频质量)

### 音频质量要求

**推荐配置：**
- 采样率: 16kHz 或更高
- 格式: MP3, WAV, M4A
- 质量: 清晰人声，低噪音
- 语速: 正常速度 (1.0-1.3x)

**影响因素：**
- ✅ 清晰的 TTS 语音 → 高准确度
- ✅ 正常语速 → 准确分段
- ❌ 背景音乐过响 → 可能影响识别
- ❌ 语速过快 → 可能分段不准

### 分段质量优化

```bash
# 使用清晰的 TTS 语音
./scripts/tts-generate.sh "$text" \
  --voice nova \        # 清晰女声
  --speed 1.1           # 稍慢，便于分段

# 提取时间戳
./scripts/whisper-timestamps.sh audio/output.mp3
```

## 成本

OpenAI Whisper 定价 (截至 2026 年):
- **价格**: $0.006 / 分钟
- **精度**: segment-level timestamps

**示例成本：**
- 15 秒音频: $0.0015
- 1 分钟音频: $0.006
- 5 分钟音频: $0.03
- 30 分钟音频: $0.18

## 故障排查

### 问题：`Missing OPENAI_API_KEY`

**解决：**
```bash
export OPENAI_API_KEY="sk-..."
```

### 问题：`curl: (35) OpenSSL SSL_connect error`

**原因：** 网络连接问题

**解决：**
1. 检查网络连接
2. 尝试使用代理
3. 使用示例数据测试：
   ```bash
   node scripts/timestamps-to-scenes.js audio/example-timestamps.json
   ```

### 问题：时间戳不准确

**可能原因：**
- 音频质量差
- 背景噪音过大
- 语速过快或过慢

**解决：**
1. 使用高质量 TTS 生成音频
2. 调整 TTS 语速到 1.0-1.2
3. 确保音频清晰无噪音

### 问题：分段过多或过少

**解决：**
- Whisper 自动分段，基于语音停顿
- 如需手动控制，可以编辑 `timestamps.json`
- 或者在脚本中添加明确的停顿标点

### 问题：场景类型检测错误

**解决：**
编辑 `scripts/timestamps-to-scenes.js` 调整检测规则：

```javascript
// 更严格的规则
if (text.includes('百分之九十')) return 'emphasis';

// 更宽松的规则
if (text.match(/问题|痛点|困难/)) return 'pain';
```

## 高级用法

### 批量处理

```bash
# 批量处理多个音频文件
for audio in audio/*.mp3; do
  echo "Processing: $audio"
  ./scripts/whisper-timestamps.sh "$audio"
done
```

### 自定义输出格式

编辑 `scripts/whisper-timestamps.sh` 修改 `jq` 过滤器：

```bash
# 包含更多信息
jq '[.segments[] | {
  start: .start,
  end: .end,
  text: .text,
  confidence: (1 - .no_speech_prob)
}]'

# 过滤短片段
jq '[.segments[] | select(.end - .start > 1.0) | {
  start: .start,
  end: .end,
  text: .text
}]'
```

### 多语言支持

Whisper 自动检测语言，也可以手动指定：

```bash
curl https://api.openai.com/v1/audio/transcriptions \
  -F "file=@audio.mp3" \
  -F "model=whisper-1" \
  -F "language=zh" \  # 指定中文
  -F "response_format=verbose_json"
```

支持的语言：
- `zh` - 中文
- `en` - 英语
- `ja` - 日语
- `ko` - 韩语
- 等 90+ 种语言

## 示例

### 示例 1: 基础使用

```bash
# 1. 生成测试音频
./scripts/tts-generate.sh "这是第一句。这是第二句。这是第三句。" \
  --out audio/test.mp3

# 2. 提取时间戳
./scripts/whisper-timestamps.sh audio/test.mp3

# 3. 查看结果
cat audio/test-timestamps.json | jq .
```

### 示例 2: 完整流程

```bash
# 使用测试脚本验证完整流程
./scripts/test-whisper.sh

# 查看生成的文件
ls -lh audio/test-audio*
cat audio/test-audio-timestamps.json | jq .
```

### 示例 3: 自定义场景

```bash
# 1. 提取时间戳
./scripts/whisper-timestamps.sh audio/my-audio.mp3

# 2. 手动编辑时间戳 (可选)
nano audio/my-audio-timestamps.json

# 3. 生成场景数据
node scripts/timestamps-to-scenes.js audio/my-audio-timestamps.json

# 4. 手动调整场景 (可选)
nano src/scenes-data.ts
```

## 相关文档

- [TTS.md](./TTS.md) - TTS 语音生成
- [PIPELINE.md](./PIPELINE.md) - 完整视频生成流水线
- [REMOTION.md](./REMOTION.md) - Remotion 视频渲染

## 下一步

- 尝试运行 `./scripts/test-whisper.sh` 测试完整流程
- 查看生成的 `src/scenes-data.ts` 了解场景结构
- 使用 `script-to-video.sh` 生成完整视频
