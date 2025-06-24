Please review this pull request and provide comprehensive feedback.

🚨 **IMPORTANT**: If this is a cherry-pick PR (title contains "Cherry-picked changes from upstream"), you MUST also perform the file-by-file upstream comparison section below after the general review.

Keep following things in mind:

- author name in package.json file should be step-security
- If there is a field named git repository in package.json file then it should contain the phrase step-security. If the field repository is not present then ignore.
- There should be a action.yml file and in that as well author name should be step-security. If the field author-name is not present then ignore.
- MIT or Apache 2.0 license should be present with copyright of step-security as well as original author.
- None of the dependencies should be unused.
- Security.md file should be present.
- renovate.json file should not be present.
- FUNDING.yml or funding.yml file should not be present.
- PULL_REQUEST.md file should not be present.
- ISSUE_TEMEPLATE folder should not be present.
- CHANGELOG.md file should not be present.
- Code should contain subscription check and make sure it makes call to this url "https://agent.api.stepsecurity.io/v1/github/$GITHUB_REPOSITORY/actions/subscription" for checking the subscription.
- dist folder should be present.
- .github folder should contain workflows folder and this folder should contain following files
   - auto_cherry_pick.yml
   - guarddog.yml
   - actions_release.yml
   - audit_package.yml
   - claude_review.yml
- If package.json does not contain the field "build" in the scripts object or the package manager is not npm then check the files .github/workflows/audt_fix.yml and .github/workflows/actions_release.yml, they should contain script as an input.
- .vscode folder should not be present
- If Readme.md file contains any part which tells how the action should be used, then make sure that in the example complete semver tag is not used and only major version is used.
- Scan the whole code thoroughly for any existing security vulnerabilities that might be exploited by malicious actors.

## Upstream Repository
- **Repository**: stefanzweifel/git-auto-commit-action

## 🚨 MANDATORY: Cherry-pick Verification for Cherry-pick PRs

**CRITICAL REQUIREMENT: If PR title contains "Cherry-picked changes from upstream" then you MUST perform this file-by-file comparison section. This is the primary purpose of this review.**

For cherry-pick PRs, you MUST compare each file changed in upstream with our PR and report exact differences:

1. **Extract Target Release Version** from PR description
2. **Get ALL upstream files** and their changes  
3. **Get ALL our PR files** and their changes
4. **For each file, report**:
   - ✅ **Same**: Changes match exactly
   - ➕ **Extra**: We have more changes than upstream
   - ➖ **Missing**: We have fewer changes than upstream
   - ❌ **Not in our PR**: File exists in upstream but not in our PR

### Commands (Only for Cherry-pick PRs)
```bash
# First check if this is a cherry-pick PR
gh pr view <PR_NUMBER> --json title | jq -r '.title' | grep "chore: Cherry-picked changes from upstream"

# If it matches, then proceed with cherry-pick analysis:

# Get target version from PR description
TARGET_VERSION=$(gh pr view <PR_NUMBER> --json body | jq -r '.body' | grep "Target Release Version:" | sed 's/.*Target Release Version: *//')

# Get all releases sorted by version and find the previous one before target
PREV_VERSION=$(gh api repos/stefanzweifel/git-auto-commit-action/releases --paginate | jq -r '.[].tag_name' | sort -V | grep -B1 "v${TARGET_VERSION}" | head -1)

# Get upstream file list and changes between previous and target version
gh api repos/stefanzweifel/git-auto-commit-action/compare/${PREV_VERSION}...v${TARGET_VERSION} | jq '.files[] | {filename: .filename, additions: .additions, deletions: .deletions}'

# Get our PR file list and changes  
gh pr view <PR_NUMBER> --json files | jq '.files[] | {filename: .filename, additions: .additions, deletions: .deletions}'
```

### Comment Template
```markdown
## File-by-File Comparison: v{TARGET}

### All Files Analysis

**[filename]**
- Upstream: +X lines, -Y lines
- Our PR: +A lines, -B lines  
- Status: ✅ Same / ➕ Extra / ➖ Missing / ❌ Not in our PR / ⚠️ Extra file

### Summary
- **Total upstream files**: X
- **Same**: X files ✅
- **Extra changes**: X files ➕  
- **Missing changes**: X files ➖
- **Missing files**: X files ❌
- **Extra files**: X files ⚠️
```