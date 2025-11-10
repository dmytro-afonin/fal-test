# Branch Protection Guide

This document outlines the branch protection rules for the `main` branch and how to configure them.

## Current Protection Settings

The `main` branch should be protected with the following rules:

### Required Settings

1. **Require a pull request before merging**
   - **This prevents direct pushes** - you must create a PR from a feature branch
   - Minimum number of approvals: 0 (solo developer - no approvals needed)
   - Dismiss stale pull request approvals when new commits are pushed (optional)

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging
   - All status checks (CI/CD) must pass before the PR can be merged
   - (Add specific status checks once CI/CD workflows are configured)

3. **Do not allow bypassing the above settings**
   - Even repository administrators must follow these rules
   - This ensures you always go through PRs, even as the owner

4. **Allow force pushes**: Disabled
   - Prevents rewriting history on the main branch

5. **Allow deletions**: Disabled
   - **Prevents accidental deletion** of the main branch

## How to Configure via GitHub Web Interface

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule** (or edit existing rule for `main`)
4. In the "Branch name pattern" field, enter: `main`
5. Configure each setting as described above:
   - Check "Require a pull request before merging"
     - Set "Required number of approvals before merging" to **0** (solo developer)
     - Optionally check "Dismiss stale pull request approvals when new commits are pushed"
     - Do NOT check "Require review from Code Owners" (not needed for solo work)
   - Check "Require status checks to pass before merging"
     - Check "Require branches to be up to date before merging"
     - Select any required status checks (if CI/CD is set up)
   - Check "Do not allow bypassing the above settings"
   - Ensure "Allow force pushes" is unchecked
   - Ensure "Allow deletions" is unchecked
6. Click **Create** (or **Save changes**)

## How to Configure via GitHub CLI

See `scripts/protect-main-branch.sh` for an automated script using GitHub CLI.

Alternatively, use the `gh` CLI directly:

```bash
# Make sure you're authenticated: gh auth login

# Set branch protection rules (0 approvals for solo developer)
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":[]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":0,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

Replace `:owner` and `:repo` with your repository owner and name.

## Best Practices

- **Require PRs even when working alone** - prevents accidental direct pushes
- **Set approvals to 0** for solo development (you can still review your own PRs)
- **Set up CI/CD workflows** before requiring status checks
- **Keep enforce admins enabled** - ensures you always go through PRs
- **Review protection rules periodically** to ensure they still fit your workflow

## Updating Protection Rules

To update branch protection rules:

1. Follow the same steps as initial configuration
2. Edit the existing rule for `main` branch
3. Modify settings as needed
4. Save changes

## Troubleshooting

### "Cannot push to protected branch"
- This is expected! The branch is protected to prevent direct pushes
- Create a feature branch: `git checkout -b feature/my-feature`
- Push your changes: `git push origin feature/my-feature`
- Open a pull request to merge into `main`
- Once status checks pass, you can merge the PR

### "Status checks must pass"
- Ensure your CI/CD workflows are running
- Fix any failing tests or checks
- Wait for all checks to pass before merging
- You can merge immediately after checks pass (no approvals needed)

## Related Files

- `scripts/protect-main-branch.sh` - Automated setup script
- `.github/CODEOWNERS` - Code owners file (optional, create if needed)

