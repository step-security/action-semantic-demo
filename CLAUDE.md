# Claude Configuration

## Upstream Repository
- **Repository**: stefanzweifel/git-auto-commit-action
- **Target Release Version**: Extract from PR description

## Cherry-pick Verification (Filtered)

When analyzing cherry-pick PRs, Claude should verify that ALL upstream changes are properly cherry-picked:

1. **Extract Target Release Version**: Parse the PR description for "Target Release Version:" 
2. **Get Upstream Changes**: Fetch ALL changes between previous version and target version in upstream (stefanzweifel/git-auto-commit-action)
3. **Get PR Changes**: Get ALL changes in our current PR
4. **Filter Out Expected Items (Ignore These)**:
   - **Skipped commits**: Normal - handled manually
   - **.md files**: UPGRADING.md, CHANGELOG.md, README.md - handled manually
   - **Workflow files**: .github/workflows/* - can't be auto-applied, handled manually
   - **Conflicting files**: Any files with conflicts - handled manually
5. **Verify Cherry-pick Completeness**: 
   - For remaining files that exist in both: Check if all changes match
   - Focus only on: "Are all upstream changes properly applied?"
6. **Final Status**: 
   - ✅ "All upstream changes successfully cherry-picked"
   - ❌ "Some upstream changes not properly applied"

### File-by-File Comparison Commands
```bash
# Extract target version from PR description
gh pr view <PR_NUMBER> --json body | jq -r '.body' | grep "Target Release Version:" | sed 's/.*Target Release Version: *//'

# Get ALL upstream files with change counts (excluding .md and .github/workflows)
gh api repos/stefanzweifel/git-auto-commit-action/compare/v{PREV}...v{TARGET} | jq '.files[] | select(.filename | test("\\.(md)$|^\\.github/workflows/") | not) | {filename: .filename, additions: .additions, deletions: .deletions, changes: .changes}'

# Get ALL our PR files with change counts (excluding .md and .github/workflows)
gh pr view <PR_NUMBER> --json files | jq '.files[] | select(.filename | test("\\.(md)$|^\\.github/workflows/") | not) | {filename: .filename, additions: .additions, deletions: .deletions, changes: .changes}'

# For each file, compare change counts:
# 1. Upstream: filename (+X, -Y, total Z changes)
# 2. Our PR: filename (+A, -B, total C changes)
# 3. Flag if: X≠A or Y≠B (incomplete cherry-pick)
# 4. Skip: .md files, workflow files, conflicting files

# Get total change summary (filtered)
# Upstream total: gh api repos/stefanzweifel/git-auto-commit-action/compare/v{PREV}...v{TARGET} | jq '{total_files: (.files | map(select(.filename | test("\\.(md)$|^\\.github/workflows/") | not)) | length), total_additions: (.files | map(select(.filename | test("\\.(md)$|^\\.github/workflows/") | not)) | map(.additions) | add), total_deletions: (.files | map(select(.filename | test("\\.(md)$|^\\.github/workflows/") | not)) | map(.deletions) | add)}'
```

### Comment Template
```markdown
## Cherry-pick Verification: v{TARGET}

### Upstream Changes (stefanzweifel/git-auto-commit-action v{PREV} → v{TARGET})
**Total upstream changes** (filtered): X files, +Y lines, -Z lines
*Excluding: .md files, workflow files, and conflicting files (handled manually)*

### Files Analyzed (Present in Both, Non-filtered)
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

### Skipped (Expected)
ℹ️ **Not analyzed (handled manually):**
- Skipped commits: X commits
- .md files: UPGRADING.md, CHANGELOG.md, README.md
- Workflow files: .github/workflows/*
- Conflicting files: [list if any]

### Summary
- **Files analyzed**: X (non-.md, non-workflow, non-conflicting files)
- **Perfect matches**: X files ✅
- **Incorrect changes**: X files ❌
- **Files skipped**: Expected items handled manually

### Result
✅ **Status**: All analyzable upstream changes correctly cherry-picked
*or*
❌ **Status**: Some changes need correction - see incorrect cherry-picks above

*Note: Only analyzing non-.md, non-workflow, non-conflicting files. Expected items are handled manually.*
```

## Upstream Tracking
- Monitor releases from stefanzweifel/git-auto-commit-action
- Compare changes between versions
- Ensure compatibility with security-focused modifications
- Filter out expected manual-handling items