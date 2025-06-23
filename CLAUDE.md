# Claude Configuration

## Upstream Repository
- **Repository**: stefanzweifel/git-auto-commit-action
- **Target Release Version**: 6.0.1

## Cherry-pick Analysis Workflow

When analyzing cherry-pick PRs, Claude should automatically:

1. **Extract Target Release Version**: Parse the PR description/comments for "Target Release Version:" and get that version
2. **Get Previous Version**: Identify the previous version before the target release version
3. **Fetch Upstream Changes**: Get the diff between previous version and target version in upstream (stefanzweifel/git-auto-commit-action)
4. **Review Only New Changes**: Analyze ONLY the new changes in the current PR (not all files)
5. **Compare with Upstream**: Identify what's missing from upstream that should be cherry-picked
6. **Check Existing Comments**: Skip files already mentioned as conflicts/missing in PR comments
7. **Provide Focused Feedback**: 
   - Missing files/changes from upstream
   - Problematic or incorrect changes
   - Files that need attention
   - Skip already-discussed conflicts

### Analysis Commands
```bash
# Extract target version from PR description
gh pr view <PR_NUMBER> --json body | jq -r '.body' | grep "Target Release Version:" | sed 's/.*Target Release Version: *//'

# Get upstream releases to find previous version
gh api repos/stefanzweifel/git-auto-commit-action/releases --paginate | jq -r '.[].tag_name' | sort -V

# Compare upstream versions (e.g., v6.0.0 to v6.0.1)
gh api repos/stefanzweifel/git-auto-commit-action/compare/v{PREV}...v{TARGET}

# Get only NEW changes in our PR (files changed)
gh pr diff <PR_NUMBER> --name-only

# Get PR comments to check for already mentioned conflicts
gh pr view <PR_NUMBER> --json comments | jq -r '.comments[].body'

# Compare specific file between our PR and upstream
git show HEAD:<filename> vs upstream version
```

### Comment Template
```markdown
## Cherry-pick Review: Target Release Version v{TARGET}

### New Changes in This PR
**Files Modified:**
- [List only files changed in this PR]

### Missing from Upstream v{PREV} → v{TARGET}
❌ **Files/Changes Not Cherry-picked:**
- [Files that exist in upstream diff but missing from our PR]
- [Specific changes within files that are missing]

### Issues Found
🔍 **Problematic Changes:**
- [Changes that seem incorrect or problematic]
- [Files modified incorrectly]

### Files Already Discussed
ℹ️ **Skipping (already mentioned in comments):**
- [Files already marked as conflicts/missing in PR comments]

### Recommendations
✅ **Action Required:**
- [Specific files/changes that need to be added]
- [Changes that need to be corrected]

*Note: Only reviewing new changes in this PR, not re-analyzing previously discussed conflicts.*
```

## Upstream Tracking
- Monitor releases from stefanzweifel/git-auto-commit-action
- Compare changes between versions
- Ensure compatibility with security-focused modifications
- Automatically analyze cherry-pick PRs when target version is specified