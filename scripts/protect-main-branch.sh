#!/bin/bash

# Script to protect the main branch in GitHub repository
# Requires GitHub CLI (gh) to be installed and authenticated
# Usage: ./scripts/protect-main-branch.sh [owner] [repo] [required-approvals]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get repository owner and name
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${YELLOW}Usage: $0 <owner> <repo> [required-approvals]${NC}"
    echo "Example: $0 octocat hello-world 0"
    echo "Note: Default is 0 approvals (for solo developers)"
    exit 1
fi

OWNER="$1"
REPO="$2"
REQUIRED_APPROVALS="${3:-0}"  # Default to 0 approvals for solo developer

echo -e "${GREEN}Setting up branch protection for ${OWNER}/${REPO}...${NC}"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Warning: Not authenticated with GitHub CLI.${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Check if repository exists and user has access
if ! gh repo view "${OWNER}/${REPO}" &> /dev/null; then
    echo -e "${RED}Error: Cannot access repository ${OWNER}/${REPO}${NC}"
    echo "Make sure you have access and the repository exists."
    exit 1
fi

echo -e "${GREEN}Configuring branch protection rules for 'main' branch...${NC}"

# Configure branch protection
# Note: This uses the GitHub API directly as gh CLI doesn't have a direct command for all settings
gh api "repos/${OWNER}/${REPO}/branches/main/protection" \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":[]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews="{\"required_approving_review_count\":${REQUIRED_APPROVALS},\"dismiss_stale_reviews\":true,\"require_code_owner_reviews\":false}" \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --jq '.' > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Branch protection rules configured successfully!${NC}"
    echo ""
    echo "Protection settings:"
    echo "  - Require pull request: Yes (prevents direct pushes)"
    echo "  - Required approvals: ${REQUIRED_APPROVALS}"
    echo "  - Dismiss stale reviews: Yes"
    echo "  - Require status checks: Yes (strict mode - all checks must pass)"
    echo "  - Require up-to-date branch: Yes"
    echo "  - Enforce admins: Yes (you must use PRs even as owner)"
    echo "  - Allow force pushes: No"
    echo "  - Allow deletions: No (prevents accidental deletion)"
    echo ""
    if [ "${REQUIRED_APPROVALS}" -eq 0 ]; then
        echo -e "${GREEN}✓ Configured for solo development - no approvals needed, but PRs are required${NC}"
    fi
else
    echo -e "${RED}Error: Failed to configure branch protection rules.${NC}"
    echo "Make sure you have admin access to the repository."
    exit 1
fi

