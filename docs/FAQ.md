# 常见问题 (FAQ)

视频生成系统的常见问题和解决方案。

## 🔑 API 和权限问题

### Q1: TTS 提示 "model_not_found" 或 "Project does not have access to model tts-1"

**问题：**
```json
{
  "error": {
    "message": "Project `proj_xxx` does not have access to model `tts-1`",
    "type": "invalid_request_error",
    "code": "model_not_found"
  }
}
```

**原因：**
- OpenAI API Key 所属项目没有开通 TTS 权限
- 免费试用账号可能没有 TTS 访问权限
- 项目配额已用完

**解决方案：**

1. **检查 OpenAI 账号权限**
   - 登录 https://platform.openai.com
   - 进入 Settings → Limits
   - 确认 TTS 模型是否可用

2. **使用付费账号**
   - TTS 需要付费账号（充值至少 $5）
   - 免费试用账号通常只能访问 GPT 模型

3. **创建新的 API Key**
   ```bash
   # 在 OpenAI 平台创建新 API Key
   # 确保项目有 TTS 访问权限
   export OPENAI_API_KEY="sk-..."
   ```

4. **临时方案：使用示例数据**
   ```bash
   # 跳过 TTS/Whisper，直接用示例数据测试
   node scripts/timestamps-to-scenes.js audio/example-timestamps.json
   pnpm exec remotion render Main out/demo.mp4
   ```

### Q2: Whisper 提示 "Cannot iterate over null"

**问题：**
```bash
jq: error (at <stdin>:8): Cannot iterate over null (null)
```

**原因：**
- Whisper API 返回了错误而不是正常的时间戳数据
- 音频文件无效或太小
- API 限流或网络问题

**解决方案：**

1. **检查音频文件**
   ```bash
   file audio/your-audio.mp3
   ls -lh audio/your-audio.mp3  # 应该 > 1KB
   ```

2. **检查 API 响应**
   ```bash
   # 手动测试 Whisper API
   curl -sS https://api.openai.com/v1/audio/transcriptions \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -F "file=@audio/your-audio.mp3" \
     -F "model=whisper-1" \
     -F "response_format=verbose_json" \
     -F "timestamp_granularities[]=segment"
   ```

3. **使用有效的测试音频**
   ```bash
   # 先测试 TTS
   ./scripts/tts-generate.sh "测试文本" --out audio/test.mp3

   # 再测试 Whisper
   ./scripts/whisper-timestamps.sh audio/test.mp3
   ```

### Q3: API 调用超时或网络错误

**问题：**
```bash
curl: (35) OpenSSL SSL_connect error
curl: (28) Timeout was reached
```

**解决方案：**

1. **检查网络连接**
   ```bash
   ping api.openai.com
   curl -I https://api.openai.com
   ```

2. **使用代理**
   ```bash
   export https_proxy="http://your-proxy:port"
   ./scripts/tts-generate.sh "测试"
   ```

3. **增加超时时间**
   编辑脚本，增加 curl 超时参数：
   ```bash
   curl --max-time 120 ...  # 增加到 120 秒
   ```

4. **使用本地缓存的数据**
   ```bash
   # 使用已有的示例数据
   cp audio/example-timestamps.json audio/my-timestamps.json
   # 编辑并使用
   ```

## 🛠️ 安装和依赖问题

### Q4: 找不到 pnpm 命令

**解决方案：**
```bash
npm install -g pnpm
pnpm --version
```

### Q5: 找不到 tsx 或 ts-node

**解决方案：**
```bash
cd /home/justin/openclaw-video
pnpm install
pnpm exec tsx --version
```

### Q6: Node.js 版本过低

**问题：**
```bash
Error: This project requires Node.js >= 18
```

**解决方案：**
```bash
# 使用 nvm 安装新版本
nvm install 22
nvm use 22
node --version
```

### Q7: Remotion 渲染失败

**问题：**
```bash
Error: Cannot find module 'remotion'
```

**解决方案：**
```bash
# 重新安装依赖
cd /home/justin/openclaw-video
rm -rf node_modules
pnpm install

# 验证安装
pnpm exec remotion --version
```

## 🎬 视频生成问题

### Q8: 生成的视频没有声音

**可能原因：**
- audioPath 配置错误
- 音频文件路径不存在
- Remotion 没有正确加载音频

**解决方案：**

1. **检查 audioPath**
   ```bash
   cat src/scenes-data.ts | grep audioPath
   ```

2. **使用绝对路径**
   ```bash
   # 在渲染时传入绝对路径
   pnpm exec remotion render Main out/video.mp4 \
     --props '{"audioPath": "/home/justin/openclaw-video/audio/test.mp3"}'
   ```

3. **验证音频文件**
   ```bash
   mpv audio/test.mp3  # 确保音频可以播放
   ```

### Q9: 视频和音频不同步

**解决方案：**

1. **检查时间戳精度**
   ```bash
   cat audio/your-timestamps.json | jq '.[] | {start, end}'
   ```

2. **手动调整场景时间**
   编辑 `src/scenes-data.ts`：
   ```typescript
   {
     start: 0.0,    // 确保精确到小数点后 2 位
     end: 3.46,
     // ...
   }
   ```

3. **重新生成时间戳**
   ```bash
   ./scripts/whisper-timestamps.sh audio/your-audio.mp3
   ```

### Q10: 场景类型检测不准确

**解决方案：**

自定义场景检测规则，编辑 `scripts/timestamps-to-scenes.js`：

```javascript
function determineSceneType(index, total, text) {
  // 添加你的自定义规则
  if (text.includes('重要')) return 'emphasis';
  if (text.includes('问题')) return 'pain';
  if (text.includes('总结')) return 'content';

  // 保留默认规则
  if (index === 0) return 'title';
  if (index === total - 1) return 'end';
  return 'content';
}
```

### Q11: 关键词高亮不显示

**解决方案：**

添加自定义关键词，编辑 `scripts/timestamps-to-scenes.js`：

```javascript
function extractHighlight(text) {
  const keywords = [
    'AI', 'GPT', 'Copilot', 'Gemini',  // 默认
    'Python', 'React', 'TypeScript',   // 添加你的关键词
    '重要', '关键', '核心'               // 中文关键词
  ];

  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      return keyword;
    }
  }
  return null;
}
```

## 🎨 Agent 使用问题

### Q12: Agent 无法理解我的请求

**示例：**
```bash
./agents/video-cli.sh generate "请帮我做一个视频"
# Agent 可能无法正确提取脚本内容
```

**解决方案：**

使用更直接的表达：
```bash
# ✅ 好的表达
./agents/video-cli.sh generate "AI 改变世界"
./agents/video-cli.sh generate "脚本：AI 改变世界"

# ❌ 避免过于复杂的表达
./agents/video-cli.sh generate "请帮我制作一个关于 AI 的视频"
```

或直接使用脚本文件：
```bash
echo "AI 改变世界" > scripts/my-script.txt
./scripts/script-to-video.sh scripts/my-script.txt
```

### Q13: Agent 生成的视频不符合预期

**解决方案：**

1. **先优化脚本**
   ```bash
   ./agents/video-cli.sh optimize "你的脚本"
   # 根据建议调整
   ```

2. **查看分析结果**
   注意 Agent 的建议：
   - 句子数量
   - 预估时长
   - 风格建议
   - 关键词检测

3. **手动调整场景**
   ```bash
   # 生成后编辑场景数据
   nano src/scenes-data.ts
   # 重新渲染
   pnpm exec remotion render Main out/custom.mp4
   ```

## 💰 成本和性能问题

### Q14: API 调用成本太高

**优化建议：**

1. **本地缓存**
   ```bash
   # 复用已生成的音频
   cp audio/old-audio.mp3 audio/new-audio.mp3
   ```

2. **批量处理**
   ```bash
   # 一次性处理多个脚本，减少单次开销
   for script in scripts/*.txt; do
     ./scripts/script-to-video.sh "$script"
   done
   ```

3. **使用较短的测试文本**
   ```bash
   # 开发时用短文本测试
   ./scripts/tts-generate.sh "测试" --out audio/test.mp3
   ```

4. **使用示例数据开发**
   ```bash
   # 先用示例数据调试样式
   node scripts/timestamps-to-scenes.js audio/example-timestamps.json
   pnpm exec remotion render Main out/test.mp3
   ```

### Q15: Remotion 渲染太慢

**优化方案：**

1. **增加并发**
   ```bash
   pnpm exec remotion render Main out/video.mp4 --concurrency 4
   ```

2. **降低质量预览**
   ```bash
   pnpm exec remotion render Main out/preview.mp4 --quality 50
   ```

3. **使用开发模式**
   ```bash
   pnpm dev  # 实时预览，快速迭代
   ```

4. **减少视频帧数**
   编辑 `src/scenes-data.ts`：
   ```typescript
   export const videoConfig = {
     fps: 24,  // 从 30 降到 24
     // ...
   };
   ```

## 🔧 其他常见问题

### Q16: 脚本中的标点符号被忽略

**解决方案：**

确保使用中文标点：
```bash
# ✅ 使用中文标点
echo "第一句。第二句。第三句。" > scripts/test.txt

# ❌ 避免混用英文标点
echo "第一句.第二句.第三句." > scripts/test.txt
```

### Q17: 视频分辨率或帧率不对

**解决方案：**

编辑 `src/scenes-data.ts`：
```typescript
export const videoConfig = {
  fps: 30,           // 修改帧率
  width: 1080,       // 修改宽度
  height: 1920,      // 修改高度
  // ...
};
```

### Q18: 找不到生成的文件

**检查输出位置：**
```bash
# 音频文件
ls -lh audio/

# 时间戳文件
ls -lh audio/*-timestamps.json

# 场景数据
cat src/scenes-data.ts

# 视频文件
ls -lh out/
```

### Q19: Git 冲突（scenes-data.ts）

**问题：**
`src/scenes-data.ts` 频繁被修改导致 Git 冲突

**解决方案：**

1. **使用不同的输出文件**
   ```bash
   node scripts/timestamps-to-scenes.js \
     audio/timestamps.json \
     --out src/my-scenes.ts
   ```

2. **添加到 .gitignore**
   ```bash
   echo "src/scenes-data.ts" >> .gitignore
   ```

3. **使用分支开发**
   ```bash
   git checkout -b my-video
   # 生成视频
   git checkout main
   ```

### Q20: 如何调试 Agent

**调试技巧：**

1. **查看 Agent 解析结果**
   ```bash
   pnpm exec tsx agents/video-agent.ts "你的请求" | head -n 20
   ```

2. **单独测试工具函数**
   ```bash
   node -e "
   const { optimize_script } = require('./agents/tools.ts');
   optimize_script({
     original_script: '测试脚本'
   }).then(console.log);
   "
   ```

3. **查看完整日志**
   ```bash
   # 查看所有输出
   ./agents/video-cli.sh generate "你的脚本" 2>&1 | tee debug.log
   ```

## 📚 获取更多帮助

- **查看文档**：`docs/`目录中的所有 Markdown 文件
- **运行测试**：`./agents/test-agent.sh`
- **查看示例**：`scripts/example-script.txt`
- **使用帮助**：`./agents/video-cli.sh help`

## 🆘 仍然遇到问题？

1. 查看完整的测试日志
2. 确认所有依赖已安装
3. 验证 API Key 权限
4. 使用示例数据测试系统各部分

---

**大部分问题都有简单的解决方案！** 🔧✅
