# Claude Configuration

## Upstream Repository
- **Repository**: stefanzweifel/git-auto-commit-action
- **Target Release Version**: 6.0.1

## Cherry-pick Verification (Changes Only)

When analyzing cherry-pick PRs, Claude should verify that ALL upstream changes are properly cherry-picked:

1. **Extract Target Release Version**: Parse the PR description for "Target Release Version:" 
2. **Get Upstream Changes**: Fetch ALL changes between previous version and target version in upstream (stefanzweifel/git-auto-commit-action)
3. **Get PR Changes**: Get ALL changes in our current PR
4. **Verify Cherry-pick Completeness**: 
   - For files that exist in both: Check if all changes match
   - Ignore missing files (handled manually)
   - Ignore conflicting files (handled manually)
   - Focus only on: "Are all upstream changes properly applied?"
5. **Final Status**: 
   - ✅ "All upstream changes successfully cherry-picked"
   - ❌ "Some upstream changes not properly applied"

### File-by-File Comparison Commands
```bash
# Extract target version from PR description
gh pr view <PR_NUMBER> --json body | jq -r '.body' | grep "Target Release Version:" | sed 's/.*Target Release Version: *//'

# Get ALL upstream files with change counts
gh api repos/stefanzweifel/git-auto-commit-action/compare/v{PREV}...v{TARGET} | jq '.files[] | {filename: .filename, additions: .additions, deletions: .deletions, changes: .changes}'

# Get ALL our PR files with change counts  
gh pr view <PR_NUMBER> --json files | jq '.files[] | {filename: .filename, additions: .additions, deletions: .deletions, changes: .changes}'

# For each file, compare change counts:
# 1. Upstream: filename (+X, -Y, total Z changes)
# 2. Our PR: filename (+A, -B, total C changes)
# 3. Flag if: X≠A or Y≠B (incomplete cherry-pick)
# 4. Flag if: upstream file missing entirely in our PR

# Get total change summary
# Upstream total: gh api repos/stefanzweifel/git-auto-commit-action/compare/v{PREV}...v{TARGET} | jq '{total_files: (.files | length), total_additions: (.files | map(.additions) | add), total_deletions: (.files | map(.deletions) | add)}'
```

### Comment Template
```markdown
## Cherry-pick Verification: v{TARGET}

### Upstream Changes (stefanzweifel/git-auto-commit-action v{PREV} → v{TARGET})
**Total upstream changes**: X files, +Y lines, -Z lines

### Files Analyzed (Present in Both)
✅ **Correctly Cherry-picked:**
- **file1.ext**: 
  - Upstream: +5 lines, -2 lines
  - Our PR: +5 lines, -2 lines ✅ Perfect match
- **file2.ext**: 
  - Upstream: +10 lines, -3 lines  
  - Our PR: +10 lines, -3 lines ✅ Perfect match

❌ **Incorrect Cherry-picks:**
- **file5.ext**:
  - Upstream: +12 lines, -4 lines
  - Our PR: +8 lines, -2 lines ❌ Changes don't match

### Summary
- **Files analyzed**: X (files present in both upstream and our PR)
- **Perfect matches**: X files ✅
- **Incorrect changes**: X files ❌
- **Files skipped**: Missing/conflicting files (handled manually)

### Result
✅ **Status**: All upstream changes correctly cherry-picked
*or*
❌ **Status**: Some changes need correction - see incorrect cherry-picks above

*Note: Only analyzing files present in both upstream and our PR. Missing/conflicting files are handled manually.*
```

## Upstream Tracking
- Monitor releases from stefanzweifel/git-auto-commit-action
- Compare changes between versions
- Ensure compatibility with security-focused modifications
- Automatically analyze cherry-pick PRs when target version is specified