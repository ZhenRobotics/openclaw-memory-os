#!/bin/bash

# ============================================================================
# Test Script: Conversation Memory (对话记忆测试)
# ============================================================================

set -e

echo "🧪 开始对话记忆功能测试"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
  local test_name="$1"
  local command="$2"

  echo -e "${YELLOW}测试: ${test_name}${NC}"

  if eval "$command"; then
    echo -e "${GREEN}✓ 通过${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ 失败${NC}"
    ((TESTS_FAILED++))
  fi
  echo ""
}

# ============================================================================
# 1. Clean up test environment
# ============================================================================

echo "1️⃣  清理测试环境..."
rm -rf /tmp/.memory-os-test 2>/dev/null || true
export HOME_BACKUP=$HOME
export HOME=/tmp
mkdir -p /tmp/.memory-os
echo "   ✅ 清理完成"
echo ""

# ============================================================================
# 2. Build the project
# ============================================================================

echo "2️⃣  构建项目..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "   ✅ 构建成功"
else
  echo "   ❌ 构建失败"
  exit 1
fi
echo ""

# ============================================================================
# 3. Test Chinese name extraction
# ============================================================================

echo "3️⃣  测试中文姓名提取..."

run_test "中文姓名 - 基本格式" \
  "node dist/cli/index.js remember '记住我的名字：刘小容' 2>&1 | grep -q '刘小容'"

run_test "中文姓名 - 复杂表达" \
  "node dist/cli/index.js remember '帮我记住，我叫刘小容' 2>&1 | grep -q '刘小容'"

# ============================================================================
# 4. Test English name extraction
# ============================================================================

echo "4️⃣  测试英文姓名提取..."

run_test "英文姓名 - 标准格式" \
  "node dist/cli/index.js remember 'Remember my name is Liu Xiaorong' 2>&1 | grep -q 'Liu Xiaorong'"

run_test "英文姓名 - I am 格式" \
  "node dist/cli/index.js remember 'Please remember I am John Smith' 2>&1 | grep -q 'John Smith'"

# ============================================================================
# 5. Test date extraction
# ============================================================================

echo "5️⃣  测试日期提取..."

run_test "日期 - 完整格式" \
  "node dist/cli/index.js remember '记住项目截止日期：2026-04-01' 2>&1 | grep -q '2026-04-01'"

run_test "日期 - 中文格式" \
  "node dist/cli/index.js remember '记住会议时间：2026年4月1日' 2>&1 | grep -q '2026年4月1日'"

# ============================================================================
# 6. Test event extraction
# ============================================================================

echo "6️⃣  测试事件提取..."

run_test "事件 - 会议" \
  "node dist/cli/index.js remember '记住明天有个重要会议：讨论Q2规划' 2>&1 | grep -q '会议'"

run_test "事件 - 任务" \
  "node dist/cli/index.js remember '记住任务：完成项目文档' 2>&1 | grep -q '任务'"

# ============================================================================
# 7. Test complex extraction
# ============================================================================

echo "7️⃣  测试复杂信息提取..."

run_test "复杂信息 - 多个实体" \
  "node dist/cli/index.js remember '记住：项目经理是张三，截止日期2026-04-01，会议地点在会议室A' 2>&1 | grep -q '张三'"

# ============================================================================
# 8. Test trigger detection
# ============================================================================

echo "8️⃣  测试触发词检测..."

run_test "触发词 - 记住" \
  "node dist/cli/index.js remember '记住这个重要信息' 2>&1 | grep -q '记忆已保存'"

run_test "触发词 - 保存" \
  "node dist/cli/index.js remember '帮我保存一下：测试数据' 2>&1 | grep -q '记忆已保存'"

run_test "无触发词 - 应该提示" \
  "node dist/cli/index.js remember '这只是一句普通的话' 2>&1 | grep -q '未检测到记忆触发词'"

# ============================================================================
# 9. Test memory storage
# ============================================================================

echo "9️⃣  测试记忆存储..."

# Store some memories
node dist/cli/index.js remember '记住我的名字：刘小容' > /dev/null 2>&1
node dist/cli/index.js remember 'Remember the project deadline is 2026-04-01' > /dev/null 2>&1

# Check if memories were stored
MEMORY_COUNT=$(ls /tmp/.memory-os/memories/*.json 2>/dev/null | wc -l)

run_test "记忆文件已创建" \
  "[ $MEMORY_COUNT -gt 0 ]"

run_test "记忆内容可读" \
  "cat /tmp/.memory-os/memories/*.json | grep -q '刘小容'"

# ============================================================================
# 10. Test search integration
# ============================================================================

echo "🔟  测试搜索集成..."

run_test "搜索存储的记忆" \
  "node dist/cli/index.js search '刘小容' 2>&1 | grep -q '刘小容' || node dist/cli/index.js search 'Xiaorong' 2>&1 | grep -q 'Xiaorong'"

# ============================================================================
# Cleanup
# ============================================================================

echo "1️⃣1️⃣  清理测试环境..."
export HOME=$HOME_BACKUP
rm -rf /tmp/.memory-os-test 2>/dev/null || true
echo "   ✅ 清理完成"
echo ""

# ============================================================================
# Summary
# ============================================================================

echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📊 测试总结"
echo "─────────────────────────────────────────────────────────"
echo -e "通过: ${GREEN}$TESTS_PASSED${NC}"
echo -e "失败: ${RED}$TESTS_FAILED${NC}"
echo -e "总计: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 所有测试通过！对话记忆功能正常工作！${NC}"
  echo ""
  echo "✨ 功能验证完成："
  echo "  ✅ 中文姓名提取"
  echo "  ✅ 英文姓名提取"
  echo "  ✅ 日期识别"
  echo "  ✅ 事件提取"
  echo "  ✅ 复杂信息处理"
  echo "  ✅ 触发词检测"
  echo "  ✅ 记忆存储"
  echo "  ✅ 搜索集成"
  echo ""
  echo "可以发布 v0.1.2 版本！"
  exit 0
else
  echo -e "${RED}❌ 部分测试失败，请检查问题${NC}"
  exit 1
fi
