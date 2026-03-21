#!/bin/bash

# CLI Collect 功能完整测试脚本
#
# 测试覆盖：
# 1. 文件采集
# 2. 搜索功能
# 3. 状态查看
# 4. 递归扫描
# 5. 类型检测（TEXT vs CODE）

set -e

echo "🧪 开始 CLI Collect 功能测试"
echo "═════════════════════════════════════════════════════"
echo ""

# 清理测试环境
echo "1️⃣  清理测试环境..."
rm -rf /tmp/test-cli-collect ~/.memory-os-test
echo "   ✅ 清理完成"
echo ""

# 创建测试数据
echo "2️⃣  创建测试数据..."
mkdir -p /tmp/test-cli-collect/subdir

cat > /tmp/test-cli-collect/note1.txt << 'EOF'
这是投资笔记。

选股规则：
1. PE < 15
2. ROE > 15%
3. 偏好科技股
EOF

cat > /tmp/test-cli-collect/note2.md << 'EOF'
# TypeScript 学习笔记

## 高级类型
- Union Types
- Generics
EOF

cat > /tmp/test-cli-collect/code.js << 'EOF'
function analyzeStock(pe, roe) {
  return pe < 15 && roe > 15;
}
EOF

cat > /tmp/test-cli-collect/subdir/nested.txt << 'EOF'
嵌套目录中的文件，测试递归扫描。
EOF

echo "   ✅ 创建了 4 个测试文件"
echo ""

# 测试 collect 命令
echo "3️⃣  测试 collect 命令..."
export HOME_BACKUP=$HOME
export HOME=/tmp
node dist/cli/index.js collect --source /tmp/test-cli-collect > /tmp/collect-output.txt 2>&1
export HOME=$HOME_BACKUP

if grep -q "✅ 采集完成" /tmp/collect-output.txt && \
   grep -q "成功导入: 4" /tmp/collect-output.txt; then
  echo "   ✅ Collect 命令成功"
  echo "   📊 导入了 4 个文件"
else
  echo "   ❌ Collect 命令失败"
  cat /tmp/collect-output.txt
  exit 1
fi
echo ""

# 测试搜索功能
echo "4️⃣  测试搜索功能..."
export HOME=/tmp
node dist/cli/index.js search "选股" > /tmp/search-output1.txt 2>&1
export HOME=$HOME_BACKUP

if grep -q "Found 1 results" /tmp/search-output1.txt; then
  echo "   ✅ 搜索 '选股' - 找到 1 条结果"
else
  echo "   ❌ 搜索 '选股' 失败"
  cat /tmp/search-output1.txt
  exit 1
fi

export HOME=/tmp
node dist/cli/index.js search "TypeScript" > /tmp/search-output2.txt 2>&1
export HOME=$HOME_BACKUP

if grep -q "Found 1 results" /tmp/search-output2.txt; then
  echo "   ✅ 搜索 'TypeScript' - 找到 1 条结果"
else
  echo "   ❌ 搜索 'TypeScript' 失败"
  exit 1
fi
echo ""

# 测试 status 命令
echo "5️⃣  测试 status 命令..."
export HOME=/tmp
node dist/cli/index.js status > /tmp/status-output.txt 2>&1
export HOME=$HOME_BACKUP

if grep -q "Total memories: 4" /tmp/status-output.txt && \
   grep -q "code: 1" /tmp/status-output.txt && \
   grep -q "text: 3" /tmp/status-output.txt; then
  echo "   ✅ Status 命令正常"
  echo "   📊 总记忆: 4 (CODE: 1, TEXT: 3)"
else
  echo "   ❌ Status 命令失败"
  cat /tmp/status-output.txt
  exit 1
fi
echo ""

# 验证数据格式
echo "6️⃣  验证数据格式..."
SAMPLE_FILE=$(ls /tmp/.memory-os/memories/*.json 2>/dev/null | head -1)
if [ -n "$SAMPLE_FILE" ] && [ -f "$SAMPLE_FILE" ]; then
  if grep -q '"type": "text"' $SAMPLE_FILE && \
     grep -q '"content": "' $SAMPLE_FILE && \
     grep -q '"filename"' $SAMPLE_FILE; then
    echo "   ✅ 数据格式正确"
    echo "   - type: text/code"
    echo "   - content: 直接字符串"
    echo "   - metadata: 包含 filename"
  else
    echo "   ❌ 数据格式不正确"
    cat $SAMPLE_FILE
    exit 1
  fi
else
  echo "   ❌ 未找到记忆文件"
  exit 1
fi
echo ""

# 测试递归扫描
echo "7️⃣  验证递归扫描..."
export HOME=/tmp
NESTED_COUNT=$(node dist/cli/index.js search "嵌套目录" 2>&1 | grep -c "Found 1 results" || true)
export HOME=$HOME_BACKUP

if [ "$NESTED_COUNT" = "1" ]; then
  echo "   ✅ 递归扫描正常，找到子目录文件"
else
  echo "   ❌ 递归扫描失败"
  exit 1
fi
echo ""

# 清理测试数据
echo "8️⃣  清理测试数据..."
rm -rf /tmp/test-cli-collect /tmp/.memory-os /tmp/*-output.txt
echo "   ✅ 清理完成"
echo ""

echo "═════════════════════════════════════════════════════"
echo "🎉 所有测试通过！CLI Collect 功能正常工作！"
echo ""
echo "测试结果:"
echo "  ✅ 文件采集 (4/4 文件)"
echo "  ✅ 搜索功能 (中文/英文关键词)"
echo "  ✅ 状态查看 (类型统计)"
echo "  ✅ 数据格式 (TEXT/CODE 类型正确)"
echo "  ✅ 递归扫描 (子目录文件)"
echo ""
echo "功能已完成，可以发布到 ClawHub！"
