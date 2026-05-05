[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)

# tfclean

tfclean is a tool for cleaning up Terraform configuration files by automatically removing applied moved, import, and removed blocks. This helps maintain clean and readable Terraform configurations by eliminating blocks that have already served their purpose.

### Using GitHub Actions

You can use the official GitHub Action to install tfclean in your workflows:

```yaml
- uses: step-security/tfclean@v0
  with:
    version: 'latest' # Optional, defaults to latest
```


## Usage

### Remove All Blocks

Remove all moved/import/removed blocks regardless of their state:

```bash
tfclean /path/to/tffiles
```

### Remove Only Applied Blocks

Remove only the blocks that have been successfully applied (requires access to tfstate).

When using an S3 backend, you can omit `--tfstate`. tfclean auto-detects the state location by reading `terraform { backend "s3" { ... } }` from `.tf` files in the given directory.

```bash
# With S3 backend: auto-detect state from .tf files (--tfstate optional)
AWS_PROFILE=your_profile tfclean /path/to/tffiles

# Or specify state location explicitly
AWS_PROFILE=your_profile tfclean --tfstate s3://path/to/tfstate /path/to/tffiles
```

## Features

- **Smart Block Removal**
  - [x] Removes moved blocks that have been applied
  - [x] Removes import blocks that have been applied
  - [x] Removes removed blocks that have been applied
  - [x] Option to forcefully remove all moved/import/removed blocks

- **Platform Support**
  - Supports both x86_64 and ARM64 architectures
  - Available for Linux and macOS

## GitHub Actions Integration

You can automate the cleanup of your Terraform configurations using GitHub Actions. Here's a complete example that creates pull requests for cleanup:

```yaml
name: tfclean

on:
  push:
    branches:
      - main

permissions:
  pull-requests: write # Required for creating pull requests

jobs:
  tfclean:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v6
      
      # Setup GitHub App token for PR creation
      - uses: actions/create-github-app-token@v2
        id: app-token
        with:
          app-id: ${{ secrets.GITHUB_APP_ID }}
          private-key: ${{ secrets.GITHUB_APP_PRIVATE_KEY }}
      
      # Configure AWS credentials if using remote state
      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: "aws_role_arn_for_oidc"
          aws-region: "ap-northeast-1"
      
      # Install tfclean
      - uses: step-security/tfclean@v0
        
      # Run tfclean
      - run: tfclean --tfstate s3://path/to/tfstate /path/to/tffiles
      
      # Create PR if changes detected
      - name: Check changes
        id: diff-check
        run: git diff --exit-code || echo "changes_detected=true" >> $GITHUB_OUTPUT
      
      - name: Create Pull Request
        if: steps.diff-check.outputs.changes_detected == 'true'
        run: |
          branch_name=tfclean_$(date +"%Y%m%d%H%M")
          git switch -c ${branch_name}
          git config --global user.email "bot@example.com"
          git config --global user.name "Terraform Cleanup Bot"
          git add .
          git commit -m "chore: auto-remove applied terraform blocks"
          git push origin ${branch_name}
          gh pr create --base main --head ${branch_name} --title "Auto-remove applied Terraform blocks" --body "This PR removes Terraform blocks that have been successfully applied."
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}
```

This workflow will:
1. Run on pushes to the main branch
2. Install and run tfclean
3. Create a pull request if any blocks were removed
4. Use GitHub App authentication for better security

For the GitHub Actions integration, it's recommended to use a GitHub App for authentication instead of personal access tokens. This provides better security and more granular permissions control.
