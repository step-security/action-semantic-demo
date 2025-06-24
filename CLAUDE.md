# Claude Configuration
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