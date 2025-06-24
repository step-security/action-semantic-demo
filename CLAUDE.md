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

**CRITICAL: For cherry-pick PRs, you MUST fetch upstream data and compare file-by-file**

### Steps to Complete Cherry-Pick Verification:

1. **Extract Target Version** from PR description (look for "Target Release Version: X.X.X")

2. **Get Upstream Releases** using WebFetch:
   - Fetch: `https://github.com/stefanzweifel/git-auto-commit-action/releases`
   - Find the target version and the previous version

3. **Get Upstream Changes** using WebFetch:
   - Fetch: `https://github.com/stefanzweifel/git-auto-commit-action/compare/v{PREV}...v{TARGET}`
   - Extract all changed files and their line counts

4. **Compare with Our PR**:
   - Get our PR file changes (already available)
   - For each upstream file, report:
     - ✅ **Same**: Changes match exactly
     - ➕ **Extra**: We have more changes than upstream  
     - ➖ **Missing**: We have fewer changes than upstream
     - ❌ **Not in our PR**: File exists in upstream but not in our PR

5. **Provide Summary**: Total files, matches, missing, extra

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