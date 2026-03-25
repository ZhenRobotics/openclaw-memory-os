# TTS 语音生成集成

本文档介绍如何使用 OpenAI TTS API 生成高质量的中文语音。

## 概述

我们使用 OpenAI 的 `tts-1` 模型生成语音，支持多种声音和语速调节。

## 可用脚本

### 1. `scripts/tts-generate.sh` - 基础 TTS 生成

从文本生成语音文件。

**用法：**
```bash
./scripts/tts-generate.sh <文本> [选项]
```

**选项：**
- `--out <文件>` - 输出文件路径 (默认: `audio/output.mp3`)
- `--voice <声音>` - 选择声音 (默认: `nova`)
- `--speed <倍速>` - 语速 0.25-4.0 (默认: `1.0`)

**可用声音：**
- `alloy` - 中性声音
- `echo` - 男声
- `fable` - 英式男声
- `onyx` - 低沉男声
- `nova` - 女声，活力 ⭐ **推荐用于中文**
- `shimmer` - 柔和女声

**示例：**
```bash
# 基本用法
./scripts/tts-generate.sh "你好，世界"

# 自定义输出和声音
./scripts/tts-generate.sh "这是测试文本" \
  --out audio/test.mp3 \
  --voice nova \
  --speed 1.15

# 快速语速
./scripts/tts-generate.sh "AI正在改变世界" \
  --voice alloy \
  --speed 1.3
```

### 2. `scripts/test-tts.sh` - TTS 功能测试

测试 TTS 生成功能和不同声音效果。

**用法：**
```bash
./scripts/test-tts.sh
```

**输出：**
- `audio/test-tts.mp3` - 基础测试音频
- `audio/test-voice-*.mp3` - 不同声音的测试文件

### 3. `scripts/script-to-video.sh` - 完整视频生成流水线

从脚本文本文件生成完整视频，集成 TTS + Whisper + Remotion。

**用法：**
```bash
./scripts/script-to-video.sh <脚本文件.txt> [选项]
```

**选项：**
- `--voice <声音>` - TTS 声音 (默认: `nova`)
- `--speed <倍速>` - TTS 语速 (默认: `1.15`)

**示例：**
```bash
# 使用默认设置
./scripts/script-to-video.sh scripts/example-script.txt

# 自定义声音和语速
./scripts/script-to-video.sh scripts/my-script.txt \
  --voice alloy \
  --speed 1.2
```

**流程：**
1. 读取脚本文本
2. 使用 OpenAI TTS 生成语音
3. 使用 Whisper 提取时间戳
4. 转换为 Remotion 场景数据
5. 使用 Remotion 渲染视频

**输出：**
- `audio/<name>.mp3` - TTS 语音文件
- `audio/<name>-timestamps.json` - Whisper 时间戳
- `src/scenes-data.ts` - 更新的场景数据
- `out/<name>.mp4` - 最终视频

## 配置

### 环境变量

需要设置 `OPENAI_API_KEY`：

```bash
export OPENAI_API_KEY="sk-..."
```

### 推荐配置

**中文视频推荐设置：**
- 声音: `nova` (女声，清晰活力)
- 语速: `1.15` (稍快，适合短视频)

**不同场景推荐：**
- **教程/讲解视频**: voice=`alloy`, speed=`1.0` (中性，稳定)
- **快节奏短视频**: voice=`nova`, speed=`1.3` (活力，快速)
- **正式/商务**: voice=`onyx`, speed=`0.95` (沉稳，清晰)

## 技术细节

### API 调用

使用 OpenAI `/v1/audio/speech` 端点：

```bash
curl https://api.openai.com/v1/audio/speech \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "你好，世界",
    "voice": "nova",
    "speed": 1.15
  }' \
  --output audio.mp3
```

### 音频格式

- 输出格式: MP3
- 采样率: 24kHz (tts-1 模型)
- 声道: 单声道
- 比特率: 约 32kbps

### 成本

OpenAI TTS 定价 (截至 2026 年):
- `tts-1`: $0.015 / 1K 字符
- `tts-1-hd`: $0.030 / 1K 字符

**示例成本：**
- 100 字文本 ≈ $0.0015
- 1000 字文本 ≈ $0.015

## 故障排查

### 问题：`Missing OPENAI_API_KEY`

**解决：**
```bash
export OPENAI_API_KEY="sk-..."
```

### 问题：`curl: (35) OpenSSL SSL_connect error`

**原因：** 网络连接问题或 SSL 证书问题

**解决：**
1. 检查网络连接
2. 尝试使用代理
3. 更新 curl: `sudo apt update && sudo apt install curl`

### 问题：生成的音频没有声音

**检查：**
1. 文件大小是否正常 (应该 > 1KB)
2. 使用 `mpv` 或其他播放器测试
3. 检查 API 响应是否有错误

## 下一步

- 尝试运行 `./scripts/test-tts.sh` 测试 TTS 功能
- 创建自己的脚本文件并使用 `./scripts/script-to-video.sh` 生成视频
- 查看 [WHISPER.md](./WHISPER.md) 了解时间戳提取
- 查看 [PIPELINE.md](./PIPELINE.md) 了解完整流水线
