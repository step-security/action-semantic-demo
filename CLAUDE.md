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

## 🚨 MANDATORY: Cherry-Pick Verification 

**CRITICAL: For cherry-pick PRs, you MUST perform file-by-file upstream comparison**

### Method 1: WebFetch (Preferred)
If you have web access, use WebFetch to get upstream data:

1. **Extract Target Version** from PR description (look for "Target Release Version: X.X.X")
2. **WebFetch**: `https://github.com/stefanzweifel/git-auto-commit-action/releases` → find target + previous versions
3. **WebFetch**: `https://github.com/stefanzweifel/git-auto-commit-action/compare/v{PREV}...v{TARGET}` → get file changes
4. **Compare** with our PR files and report differences

### Method 2: Manual Data (Fallback)
If WebFetch is unavailable, use this known data for v6.0.0→v6.0.1:

**Upstream Changes (stefanzweifel/git-auto-commit-action v6.0.0→v6.0.1):**
1. **CHANGELOG.md**: +15 lines, -1 line (release notes)
2. **entrypoint.sh**: +1 line, -1 line (commented out detached state check)  
3. **tests/git-auto-commit.bats**: +1 line, -0 lines (added skip to test)

**Our PR Files:** entrypoint.sh, tests/git-auto-commit.bats, dist/entrypoint.sh

**REQUIRED ANALYSIS:** For each file, report ✅ Same / ➕ Extra / ➖ Missing / ❌ Not in PR

### Example URLs to Fetch:
- **Releases**: `https://github.com/stefanzweifel/git-auto-commit-action/releases`
- **Compare**: `https://github.com/stefanzweifel/git-auto-commit-action/compare/v6.0.0...v6.0.1`

### Expected Output Format:
```markdown
## Cherry-Pick Verification: v{TARGET}

### Upstream Analysis
**Target Version**: v{TARGET}  
**Previous Version**: v{PREV}
**Upstream Files Changed**: X files

### File-by-File Comparison

**[filename]**
- Upstream: +X lines, -Y lines
- Our PR: +A lines, -B lines  
- Status: ✅ Same / ➕ Extra / ➖ Missing / ❌ Not in our PR

### Summary
- **Total upstream files**: X
- **Same**: X files ✅
- **Missing files**: X files ❌
- **Extra files**: X files ⚠️

### Result: ✅ Complete / ❌ Incomplete cherry-pick
```