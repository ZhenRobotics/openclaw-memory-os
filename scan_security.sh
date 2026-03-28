#!/bin/bash
# ClawHub Security Pre-Flight Check (openclaw-memory-os custom)
# Adapted for clawhub-upload/ directory structure

REPO_ROOT="."
ERRORS=0
WARNINGS=0

echo "=== ClawHub Security Pre-Flight Check (openclaw-memory-os) ==="
echo ""

# Check 1: clawhub-upload/skill.md
echo "1. Checking clawhub-upload/skill.md..."
if [ -f "$REPO_ROOT/clawhub-upload/skill.md" ]; then
  count=$(grep -ci "feishu\|twitter.*bird\|auth_token.*ct0\|cron.*job\|\.env\.feishu" \
    "$REPO_ROOT/clawhub-upload/skill.md" 2>/dev/null || true)
  if [ "$count" -gt 0 ]; then
    echo "   ❌ FAIL: Found $count dangerous references"
    grep -ni "feishu\|twitter.*bird\|auth_token.*ct0\|cron.*job" \
      "$REPO_ROOT/clawhub-upload/skill.md" | head -5
    ERRORS=$((ERRORS + 1))
  else
    echo "   ✅ PASS (0 dangerous references)"
  fi
else
  echo "   ❌ FAIL: File not found"
  ERRORS=$((ERRORS + 1))
fi

# Check 2: README.md
echo "2. Checking README.md..."
if [ -f "$REPO_ROOT/README.md" ]; then
  count=$(grep -ci "feishu\|twitter.*bird\|auth_token\|\.env\.feishu\|cron.*\*" \
    "$REPO_ROOT/README.md" 2>/dev/null || true)
  if [ "$count" -gt 0 ]; then
    echo "   ❌ FAIL: Found $count dangerous references"
    grep -ni "feishu\|twitter.*bird\|auth_token" \
      "$REPO_ROOT/README.md" | head -5
    ERRORS=$((ERRORS + 1))
  else
    echo "   ✅ PASS (0 dangerous references)"
  fi
else
  echo "   ❌ FAIL: README.md not found"
  ERRORS=$((ERRORS + 1))
fi

# Check 3: docs/ directory
echo "3. Checking docs/ directory..."
if [ -d "$REPO_ROOT/docs" ]; then
  count=$(find "$REPO_ROOT/docs" -name "*.md" -type f -exec grep -ci \
    "feishu_app_id\|auth_token.*ct0\|bird.*cli\|\.env\.feishu" {} \; 2>/dev/null | \
    awk '{s+=$1} END {print s+0}')
  if [ "$count" -gt 0 ]; then
    echo "   ❌ FAIL: Found $count dangerous references in docs/"
    find "$REPO_ROOT/docs" -name "*.md" -exec grep -l \
      "feishu\|auth_token\|bird.*cli" {} \; 2>/dev/null | head -5
    ERRORS=$((ERRORS + 1))
  else
    echo "   ✅ PASS (0 dangerous references)"
  fi
else
  echo "   ℹ️  INFO: docs/ not found (OK for this project)"
fi

# Check 4: Internal docs in root
echo "4. Checking for internal docs in repository..."
internal_docs=$(git ls-files 2>/dev/null | grep -E \
  "^(FEISHU_|CLAWHUB_|RELEASE_NOTES|OPTIMIZATION_|ADVANCED_FEATURES|.*_SOLUTION_|INSTALL\.md|SECURITY_FULL)" | wc -l)
if [ "$internal_docs" -gt 0 ]; then
  echo "   ❌ FAIL: Found $internal_docs internal docs committed to repo"
  git ls-files | grep -E \
    "^(FEISHU_|CLAWHUB_|RELEASE_|OPTIMIZATION_|ADVANCED_|.*_SOLUTION_|INSTALL\.md)" | head -10
  echo "   → These should be in .gitignore"
  ERRORS=$((ERRORS + 1))
else
  echo "   ✅ PASS (no internal docs in repo)"
fi

# Check 5: SECURITY.md
echo "5. Checking SECURITY.md..."
if [ -f "$REPO_ROOT/SECURITY.md" ]; then
  count=$(grep -ci "feishu_app_id\|twitter.*setup\|bird.*install\|auth_token.*ct0" \
    "$REPO_ROOT/SECURITY.md" 2>/dev/null || true)
  if [ "$count" -gt 0 ]; then
    echo "   ❌ FAIL: Found $count dangerous references in SECURITY.md"
    ERRORS=$((ERRORS + 1))
  else
    echo "   ✅ PASS (core version only)"
  fi
else
  echo "   ⚠️  WARN: SECURITY.md not found"
  WARNINGS=$((WARNINGS + 1))
fi

# Check 6: Version consistency
echo "6. Checking version consistency..."
if [ -f "$REPO_ROOT/clawhub-upload/skill.md" ] && [ -f "$REPO_ROOT/package.json" ]; then
  skill_version=$(grep "^version:" "$REPO_ROOT/clawhub-upload/skill.md" | awk '{print $2}')
  pkg_version=$(grep '"version"' "$REPO_ROOT/package.json" | head -1 | awk -F'"' '{print $4}')

  if [ -z "$skill_version" ] || [ -z "$pkg_version" ]; then
    echo "   ⚠️  WARN: Could not extract versions"
    WARNINGS=$((WARNINGS + 1))
  elif [ "$skill_version" != "$pkg_version" ]; then
    echo "   ❌ FAIL: Version mismatch"
    echo "      skill.md: $skill_version"
    echo "      package.json: $pkg_version"
    ERRORS=$((ERRORS + 1))
  else
    echo "   ✅ PASS (v$skill_version)"
  fi
else
  echo "   ⚠️  WARN: Version files not found"
  WARNINGS=$((WARNINGS + 1))
fi

# Check 7: .gitignore configuration
echo "7. Checking .gitignore..."
if [ -f "$REPO_ROOT/.gitignore" ]; then
  patterns=("FEISHU_" "CLAWHUB_" "ADVANCED_FEATURES" "RELEASE_" "*_SOLUTION_")
  missing=0
  for pattern in "${patterns[@]}"; do
    if ! grep -q "$pattern" "$REPO_ROOT/.gitignore" 2>/dev/null; then
      missing=$((missing + 1))
    fi
  done

  if [ "$missing" -gt 0 ]; then
    echo "   ⚠️  WARN: .gitignore missing $missing recommended patterns"
    WARNINGS=$((WARNINGS + 1))
  else
    echo "   ✅ PASS (internal docs patterns configured)"
  fi
else
  echo "   ⚠️  WARN: .gitignore not found"
  WARNINGS=$((WARNINGS + 1))
fi

# Check 8: All tracked markdown files
echo "8. Comprehensive markdown scan..."
dangerous_files=0
if command -v git &> /dev/null; then
  while IFS= read -r file; do
    if [ -f "$file" ]; then
      count=$(grep -ci "FEISHU_APP_ID\|FEISHU_APP_SECRET\|AUTH_TOKEN.*CT0\|\.env\.feishu" \
        "$file" 2>/dev/null || true)
      if [ "$count" -gt 0 ]; then
        echo "   ⚠️  $file: $count matches"
        dangerous_files=$((dangerous_files + 1))
      fi
    fi
  done < <(git ls-files "*.md" 2>/dev/null)

  if [ "$dangerous_files" -gt 0 ]; then
    echo "   ❌ FAIL: Found dangerous content in $dangerous_files markdown files"
    ERRORS=$((ERRORS + 1))
  else
    echo "   ✅ PASS (all markdown files clean)"
  fi
else
  echo "   ⚠️  SKIP: git not available"
  WARNINGS=$((WARNINGS + 1))
fi

# Check 9: confirmation_required accuracy
echo "9. Checking confirmation_required matches implementation..."
if [ -f "$REPO_ROOT/clawhub-upload/skill.md" ] && [ -f "$REPO_ROOT/src/cli/index.ts" ]; then
  declared=$(grep "confirmation_required:" "$REPO_ROOT/clawhub-upload/skill.md" | grep -o "true\|false")
  has_prompt=$(grep -c "confirm\|prompt.*[Yy]/[Nn]" "$REPO_ROOT/src/cli/index.ts" 2>/dev/null || true)

  if [ "$declared" = "true" ] && [ "$has_prompt" -eq 0 ]; then
    echo "   ❌ FAIL: Claims confirmation_required: true but no prompt in CLI"
    ERRORS=$((ERRORS + 1))
  elif [ "$declared" = "false" ] && [ "$has_prompt" -gt 0 ]; then
    echo "   ⚠️  WARN: Claims confirmation_required: false but prompt found in CLI"
    WARNINGS=$((WARNINGS + 1))
  else
    echo "   ✅ PASS (declaration matches implementation: $declared)"
  fi
else
  echo "   ⚠️  WARN: Could not verify confirmation implementation"
  WARNINGS=$((WARNINGS + 1))
fi

# Check 10: Privacy filter integration
echo "10. Checking privacy filter integration..."
if [ -f "$REPO_ROOT/clawhub-upload/skill.md" ] && [ -f "$REPO_ROOT/src/conversation/privacy-filter.ts" ]; then
  claims_integrated=$(grep -c "Redacts.*automatically\|自动脱敏" "$REPO_ROOT/clawhub-upload/skill.md" 2>/dev/null || true)
  actually_used=$(grep -c "PrivacyFilter\|privacy-filter" "$REPO_ROOT/src/cli/index.ts" 2>/dev/null || true)

  if [ "$claims_integrated" -gt 0 ] && [ "$actually_used" -eq 0 ]; then
    echo "   ❌ FAIL: Claims automatic redaction but PrivacyFilter not used in CLI"
    ERRORS=$((ERRORS + 1))
  else
    echo "   ✅ PASS (privacy filter status accurately documented)"
  fi
else
  echo "   ⚠️  WARN: Could not verify privacy filter integration"
  WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "=== Summary ==="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ "$ERRORS" -eq 0 ]; then
  if [ "$WARNINGS" -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED - Ready for ClawHub submission"
    exit 0
  else
    echo "⚠️  PASSED WITH WARNINGS - Review warnings before submission"
    exit 0
  fi
else
  echo "❌ $ERRORS CHECK(S) FAILED - Fix issues before submission"
  echo ""
  echo "Common fixes:"
  echo "  1. Remove dangerous references from skill.md/README.md"
  echo "  2. Clean docs/ directory"
  echo "  3. Remove internal docs from git tracking: git rm <file>"
  echo "  4. Update .gitignore to prevent future issues"
  echo "  5. Ensure versions are consistent"
  echo "  6. Match confirmation_required declaration to actual implementation"
  echo "  7. Accurately document privacy filter integration status"
  echo ""
  exit 1
fi
