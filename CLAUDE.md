# Claude Configuration

## Upstream Repository
- **Repository**: stefanzweifel/git-auto-commit-action
- **Target Release Version**: 6.0.1

## Cherry-pick Analysis Workflow

When analyzing cherry-pick PRs, Claude should automatically:

1. **Extract Target Release Version**: Parse the PR description/comments for "Target Release Version:" and get that version
2. **Get Previous Version**: Identify the previous version before the target release version
3. **Fetch Upstream Changes**: Get the diff between previous version and target version in upstream (stefanzweifel/git-auto-commit-action)
4. **Get PR Changes**: Analyze the changes in our current PR
5. **Compare Changes**: Compare upstream changes with our PR changes
6. **Post Analysis Comment**: Create detailed comments about:
   - What changes are expected from upstream
   - What changes are actually in our PR
   - What's missing or extra
   - Recommendations

### Analysis Commands
```bash
# Extract target version from PR description
gh pr view <PR_NUMBER> --json body | jq -r '.body' | grep "Target Release Version:" | sed 's/.*Target Release Version: *//'

# Get upstream releases to find previous version
gh api repos/stefanzweifel/git-auto-commit-action/releases --paginate | jq -r '.[].tag_name' | sort -V

# Compare upstream versions (e.g., v6.0.0 to v6.0.1)
gh api repos/stefanzweifel/git-auto-commit-action/compare/v{PREV}...v{TARGET}

# Get changes in our PR
gh pr diff <PR_NUMBER>

# Get specific file changes in our PR
gh pr view <PR_NUMBER> --json files | jq -r '.files[].filename'
```

### Comment Template
```markdown
## Cherry-pick Analysis: Target Release Version v{TARGET}

### Expected Changes from Upstream (stefanzweifel/git-auto-commit-action v{PREV} → v{TARGET})
**Upstream Release Notes:**
- [List changes from upstream release]

**Files Modified in Upstream:**
1. **file.ext**: [Specific changes]
2. **file2.ext**: [Specific changes]

### Changes in This PR
**Files Modified in Our PR:**
1. **file.ext**: [What was changed]
2. **file2.ext**: [What was changed]

### Comparison Analysis
✅ **Correctly Cherry-picked:**
- [Changes that match upstream]

❌ **Missing from PR:**
- [Expected changes that are not in our PR]

⚠️ **Extra Changes in PR:**
- [Changes in our PR that are not in upstream]

🔍 **Differences Found:**
- [Any discrepancies between upstream and our changes]

### Recommendations
- [Action items based on analysis]
```

## Upstream Tracking
- Monitor releases from stefanzweifel/git-auto-commit-action
- Compare changes between versions
- Ensure compatibility with security-focused modifications
- Automatically analyze cherry-pick PRs when target version is specified