# 测试指南

完整的视频生成流水线测试文档。

## 测试概述

本项目包含三层测试：
1. **单元测试** - 测试各个工具函数
2. **集成测试** - 测试完整流水线
3. **端到端测试** - 测试 Agent 功能

## 快速测试

### 1. Agent 功能测试

测试智能 Agent 的所有功能：

```bash
cd /home/justin/openclaw-video
./agents/test-agent.sh
```

**测试内容：**
- ✅ 帮助信息显示
- ✅ 脚本优化功能
- ✅ 完整视频生成（需要 API Key）

**预期输出：**
```
=== Test 1: Help Request ===
🎬 墨影 - 视频生成助手
...

=== Test 2: Optimize Script ===
📝 脚本分析完成
📊 原脚本分析：3 句话，预计 7.5 秒
...

=== Test 3: Generate Video (Using Tools Directly) ===
🚀 Testing video generation pipeline...
🔍 Step 1/5: Analyzing script...
🎤 Step 2/5: Generating speech...
...
✅ Pipeline completed successfully!
```

### 2. TTS 测试

测试 TTS 语音生成：

```bash
cd /home/justin/openclaw-video
./scripts/test-tts.sh
```

**测试内容：**
- ✅ 生成测试音频
- ✅ 测试不同声音 (alloy/echo/nova)
- ✅ 验证文件生成

**预期输出：**
```
=== Testing TTS Generation ===

Test 1: Generating simple test audio...
Generating speech...
  Text: 你好，这是一个测试。AI技术正在改变世界。
  Voice: nova
  Speed: 1.0
✅ Test audio generated: audio/test-tts.mp3

Test 2: Testing different voices...
...
✅ Voice tests complete!

Generated files:
  audio/test-tts.mp3 - 15K
  audio/test-voice-alloy.mp3 - 8.1K
  audio/test-voice-echo.mp3 - 8.0K
  audio/test-voice-nova.mp3 - 8.2K
```

### 3. Whisper 测试

测试 Whisper 时间戳提取：

```bash
cd /home/justin/openclaw-video
./scripts/test-whisper.sh
```

**测试内容：**
- ✅ 生成测试音频 (TTS)
- ✅ 提取时间戳 (Whisper)
- ✅ 转换为场景数据

**预期输出：**
```
=== Testing Whisper Timestamp Extraction ===

Step 1: Generating test audio...
✅ Test audio generated: audio/test-audio.mp3

Step 2: Extracting timestamps with Whisper...
Transcribing with timestamps...
Timestamps saved to: audio/test-audio-timestamps.json

✅ Timestamp extraction complete!
📄 Output: audio/test-audio-timestamps.json
```

### 4. 完整流水线测试

测试从脚本到视频的完整流程：

```bash
cd /home/justin/openclaw-video
./scripts/script-to-video.sh scripts/example-script.txt
```

**测试内容：**
- ✅ 读取脚本文本
- ✅ TTS 语音生成
- ✅ Whisper 时间戳提取
- ✅ 场景数据转换
- ✅ Remotion 视频渲染

**预期输出：**
```
=== Video Generation Pipeline ===

📝 Script: scripts/example-script.txt
🎤 Voice: nova (speed: 1.15x)

Step 1/5: Reading script...
✅ Script text loaded (124 characters)

Step 2/5: Generating TTS audio...
✅ Speech generated: audio/example-script.mp3

Step 3/5: Extracting timestamps with Whisper...
✅ Timestamps saved to: audio/example-script-timestamps.json

Step 4/5: Converting to Remotion scenes...
✅ Converted 6 segments to 6 scenes

Step 5/5: Rendering video with Remotion...
[Remotion 渲染日志...]

=== ✅ Video Generation Complete ===

📄 Timestamps: audio/example-script-timestamps.json
🎬 Scenes: src/scenes-data.ts
🎥 Video: out/example-script.mp4
```

## 详细测试

### 单元测试：TTS

测试单个 TTS 工具函数：

```bash
# 基础测试
./scripts/tts-generate.sh "测试文本" --out audio/test.mp3

# 不同声音
./scripts/tts-generate.sh "测试" --out audio/test-alloy.mp3 --voice alloy
./scripts/tts-generate.sh "测试" --out audio/test-nova.mp3 --voice nova

# 不同语速
./scripts/tts-generate.sh "测试" --out audio/test-slow.mp3 --speed 0.9
./scripts/tts-generate.sh "测试" --out audio/test-fast.mp3 --speed 1.5
```

**验证：**
```bash
# 检查文件存在
ls -lh audio/test*.mp3

# 播放测试
mpv audio/test.mp3
```

### 单元测试：Whisper

测试 Whisper 时间戳提取：

```bash
# 使用已有音频测试
./scripts/whisper-timestamps.sh audio/test.mp3

# 检查输出
cat audio/test-timestamps.json | jq .
```

**预期输出格式：**
```json
[
  {
    "start": 0.0,
    "end": 2.5,
    "text": "测试文本"
  }
]
```

### 单元测试：场景转换

测试时间戳到场景的转换：

```bash
# 使用示例数据
node scripts/timestamps-to-scenes.js audio/example-timestamps.json

# 查看生成的场景
cat src/scenes-data.ts | head -n 30
```

**验证：**
- ✅ 场景类型正确分配
- ✅ 关键词正确提取
- ✅ 小墨动作正确映射
- ✅ 时间戳精确转换

### 单元测试：Remotion 渲染

测试 Remotion 视频渲染：

```bash
# 渲染测试
pnpm exec remotion render Main out/test-render.mp4

# 检查视频
mpv out/test-render.mp4
```

## Agent 测试

### 测试帮助功能

```bash
pnpm exec tsx agents/video-agent.ts "帮助"
```

**预期：**
显示完整的帮助信息和使用示例。

### 测试脚本优化

```bash
pnpm exec tsx agents/video-agent.ts "帮我分析这个脚本：AI 改变世界"
```

**预期：**
- 📊 分析句子数量
- ⏱️  预估时长
- 💡 提供优化建议
- 🎯 检测关键词

### 测试视频生成

```bash
# 使用 Agent 生成视频
pnpm exec tsx agents/video-agent.ts "帮我生成一个关于 AI 的视频"
```

**预期：**
- ✅ 完成所有 5 个步骤
- ✅ 生成视频文件
- ✅ 返回视频路径

### 测试 CLI 工具

```bash
# 帮助
./agents/video-cli.sh help

# 优化
./agents/video-cli.sh optimize "AI 改变世界"

# 生成 (需要 API Key)
./agents/video-cli.sh generate "三家巨头同一天说了一件事"
```

## 集成测试

### 测试 1: 最小脚本

测试最短有效脚本：

```bash
echo "AI 改变世界。" > /tmp/minimal-script.txt
./scripts/script-to-video.sh /tmp/minimal-script.txt
```

**预期：**
- ✅ 生成约 3 秒视频
- ✅ 单个场景
- ✅ 音频同步

### 测试 2: 中等脚本

测试典型脚本长度：

```bash
cat > /tmp/medium-script.txt <<'EOF'
三家巨头同一天说了一件事。
微软说Copilot已经能写掉90%的代码。
OpenAI说GPT5能替代大部分程序员。
EOF

./scripts/script-to-video.sh /tmp/medium-script.txt
```

**预期：**
- ✅ 生成约 7-10 秒视频
- ✅ 3 个场景
- ✅ 正确的场景类型检测

### 测试 3: 完整脚本

测试完整的短视频脚本：

```bash
./scripts/script-to-video.sh scripts/example-script.txt
```

**预期：**
- ✅ 生成约 15 秒视频
- ✅ 6 个场景 (title → content → end)
- ✅ 关键词高亮
- ✅ 小墨动作

## 错误测试

### 测试缺少 API Key

```bash
# 临时移除 API Key
unset OPENAI_API_KEY
./scripts/tts-generate.sh "测试"
```

**预期错误：**
```
Missing OPENAI_API_KEY
```

### 测试无效音频文件

```bash
# 创建空文件
touch /tmp/invalid.mp3
./scripts/whisper-timestamps.sh /tmp/invalid.mp3
```

**预期错误：**
```
Transcription error or invalid audio
```

### 测试无效脚本格式

```bash
# 空脚本
echo "" > /tmp/empty-script.txt
./scripts/script-to-video.sh /tmp/empty-script.txt
```

**预期错误：**
```
Script text is empty
```

## 性能测试

### TTS 性能

```bash
time ./scripts/tts-generate.sh "测试文本" --out /tmp/perf-tts.mp3
```

**预期：**
- ⏱️  < 5 秒（网络正常）

### Whisper 性能

```bash
time ./scripts/whisper-timestamps.sh audio/test.mp3
```

**预期：**
- ⏱️  < 10 秒（15 秒音频）

### Remotion 渲染性能

```bash
time pnpm exec remotion render Main /tmp/perf-video.mp4
```

**预期：**
- ⏱️  20-60 秒（15 秒视频，取决于硬件）

### 完整流水线性能

```bash
time ./scripts/script-to-video.sh scripts/example-script.txt
```

**预期：**
- ⏱️  30-90 秒（完整流程）

## 质量检查

### 视频质量检查

```bash
# 检查视频信息
ffprobe out/example-script.mp4

# 检查分辨率
ffprobe -v error -select_streams v:0 -show_entries stream=width,height out/example-script.mp4

# 检查音频
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate out/example-script.mp4
```

**预期：**
- 分辨率：1080x1920
- 帧率：30 fps
- 音频：AAC, 24kHz

### 场景数据检查

```bash
# 检查场景数量
cat src/scenes-data.ts | grep '"start":' | wc -l

# 检查关键词
cat src/scenes-data.ts | grep '"highlight":'

# 检查场景类型
cat src/scenes-data.ts | grep '"type":'
```

### 音频同步检查

```bash
# 播放视频，检查音频同步
mpv out/example-script.mp4

# 检查音频时长
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 audio/example-script.mp3

# 检查视频时长
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 out/example-script.mp4
```

## 故障排查测试

### 网络问题测试

```bash
# 使用示例数据绕过 API 调用
node scripts/timestamps-to-scenes.js audio/example-timestamps.json
pnpm exec remotion render Main out/offline-test.mp4
```

### 依赖检查

```bash
# 检查 Node.js 版本
node --version  # 应该 >= 18

# 检查 pnpm
pnpm --version

# 检查 TypeScript
pnpm exec tsc --version

# 检查 tsx
pnpm exec tsx --version

# 检查 Remotion
pnpm exec remotion --version
```

### 环境变量检查

```bash
# 检查 API Key
echo $OPENAI_API_KEY | head -c 10

# 检查工作目录
pwd

# 检查文件结构
ls -la agents/ scripts/ src/ docs/
```

## 自动化测试脚本

创建一个完整的自动化测试脚本：

```bash
#!/usr/bin/env bash
# 完整测试套件
set -euo pipefail

cd /home/justin/openclaw-video

echo "🧪 Running full test suite..."
echo ""

# 1. Agent 测试
echo "1. Agent Tests..."
./agents/test-agent.sh || exit 1

# 2. TTS 测试
echo ""
echo "2. TTS Tests..."
./scripts/test-tts.sh || exit 1

# 3. 依赖检查
echo ""
echo "3. Dependency Check..."
node --version
pnpm --version
pnpm exec tsx --version
pnpm exec remotion --version

# 4. 环境变量检查
echo ""
echo "4. Environment Check..."
if [[ "${OPENAI_API_KEY:-}" == "" ]]; then
  echo "❌ OPENAI_API_KEY not set"
  exit 1
else
  echo "✅ OPENAI_API_KEY is set"
fi

echo ""
echo "✅ All tests passed!"
```

## 测试清单

在提交代码前，确保通过以下测试：

- [ ] Agent 帮助功能正常
- [ ] Agent 脚本优化功能正常
- [ ] TTS 生成正常（所有声音）
- [ ] Whisper 提取正常
- [ ] 场景转换正确
- [ ] Remotion 渲染成功
- [ ] 完整流水线运行成功
- [ ] 生成的视频可播放
- [ ] 音频视频同步
- [ ] 文档示例代码可运行

## 下一步

测试通过后：
1. 查看生成的视频效果
2. 根据需要调整参数
3. 尝试不同的脚本内容
4. 探索 Agent 的更多功能

---

**测试是保证质量的关键！** 🧪✅
