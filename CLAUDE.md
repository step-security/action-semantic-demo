# Claude Configuration

## Upstream Repository
- **Repository**: stefanzweifel/git-auto-commit-action

## Simple File-by-File Comparison

For each file changed in upstream, compare with our PR and report:

1. **Extract Target Release Version** from PR description
2. **Get ALL upstream files** and their changes  
3. **Get ALL our PR files** and their changes
4. **For each file, report**:
   - ✅ **Same**: Changes match exactly
   - ➕ **Extra**: We have more changes than upstream
   - ➖ **Missing**: We have fewer changes than upstream
   - ❌ **Not in our PR**: File exists in upstream but not in our PR

### Commands
```bash
# Get target version
gh pr view <PR_NUMBER> --json body | jq -r '.body' | grep "Target Release Version:" | sed 's/.*Target Release Version: *//'

# Get upstream file list and changes
gh api repos/stefanzweifel/git-auto-commit-action/compare/v{PREV}...v{TARGET} | jq '.files[] | {filename: .filename, additions: .additions, deletions: .deletions}'

# Get our PR file list and changes  
gh pr view <PR_NUMBER> --json files | jq '.files[] | {filename: .filename, additions: .additions, deletions: .deletions}'
```

### Comment Template
```markdown
## File-by-File Comparison: v{TARGET}

### All Files Analysis

**file1.ext**
- Upstream: +5 lines, -2 lines
- Our PR: +5 lines, -2 lines
- Status: ✅ **Same**

**file2.ext** 
- Upstream: +10 lines, -3 lines
- Our PR: +12 lines, -3 lines  
- Status: ➕ **Extra** (+2 lines more than upstream)

**file3.ext**
- Upstream: +8 lines, -4 lines
- Our PR: +6 lines, -4 lines
- Status: ➖ **Missing** (-2 lines less than upstream)

**file4.ext**
- Upstream: +15 lines, -1 line
- Our PR: Not present
- Status: ❌ **Not in our PR**

**file5.ext**
- Upstream: Not present  
- Our PR: +3 lines, -1 line
- Status: ⚠️ **Extra file** (not in upstream)

### Summary
- **Total upstream files**: X
- **Same**: X files ✅
- **Extra changes**: X files ➕  
- **Missing changes**: X files ➖
- **Missing files**: X files ❌
- **Extra files**: X files ⚠️
```